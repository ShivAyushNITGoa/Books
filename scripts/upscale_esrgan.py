#!/usr/bin/env python3
"""
Stage 5: 2x pre-shrink + RealESRGAN_x4plus_anime_6B 4x upscale (net 2x).
Every images/#*.jpg -> images_up4x/#*.jpg at 2752x1536, JPEG q93.
Model: models/RealESRGAN_x4plus_anime_6B.pth (sha256 f872d837... verified).
Resumable: existing outputs are skipped. Logs progress every 25 images.
"""
import sys, time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "images"
DST = ROOT / "images_up4x"
WEIGHTS = ROOT / "models" / "RealESRGAN_x4plus_anime_6B.pth"
HALF = (1376, 768)          # INTER_AREA pre-shrink (half of 2752x1536)
TILE = 256                  # 4GB-safe tile
EXPECT = (2752, 1536)


# ---- RRDBNet (Real-ESRGAN), anime_6B variant: 23->6 RRDB blocks ----
class ResidualDenseBlock(nn.Module):
    def __init__(self, num_feat=64, num_grow_ch=32):
        super().__init__()
        self.conv1 = nn.Conv2d(num_feat, num_grow_ch, 3, 1, 1)
        self.conv2 = nn.Conv2d(num_feat + num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv3 = nn.Conv2d(num_feat + 2 * num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv4 = nn.Conv2d(num_feat + 3 * num_grow_ch, num_grow_ch, 3, 1, 1)
        self.conv5 = nn.Conv2d(num_feat + 4 * num_grow_ch, num_feat, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, num_feat=64, num_grow_ch=32):
        super().__init__()
        self.rdb1 = ResidualDenseBlock(num_feat, num_grow_ch)
        self.rdb2 = ResidualDenseBlock(num_feat, num_grow_ch)
        self.rdb3 = ResidualDenseBlock(num_feat, num_grow_ch)

    def forward(self, x):
        out = self.rdb1(x)
        out = self.rdb2(out)
        out = self.rdb3(out)
        return out * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, scale=4, num_feat=64,
                 num_block=6, num_grow_ch=32):
        super().__init__()
        self.conv_first = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(num_feat, num_grow_ch)
                                    for _ in range(num_block)])
        self.conv_body = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_hr = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_last = nn.Conv2d(num_feat, num_out_ch, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        feat = self.conv_first(x)
        body_feat = self.conv_body(self.body(feat))
        feat = feat + body_feat
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        out = self.conv_last(self.lrelu(self.conv_hr(feat)))
        return out


@torch.no_grad()
def upscale_tiled(model, tensor):
    dtype = next(model.parameters()).dtype
    tensor = tensor.to(dtype)
    _, c, h, w = tensor.shape
    pad_h = (TILE - h % TILE) % TILE
    pad_w = (TILE - w % TILE) % TILE
    if pad_h or pad_w:
        tensor = F.pad(tensor, (0, pad_w, 0, pad_h), mode="reflect")
    _, _, H, W = tensor.shape
    out = torch.zeros(1, c, H * 4, W * 4, dtype=torch.float32)
    for y in range(0, H, TILE):
        for x in range(0, W, TILE):
            tile = tensor[:, :, y:y + TILE, x:x + TILE]
            out[:, :, y * 4:(y + tile.shape[2]) * 4, x * 4:(x + tile.shape[3]) * 4] = model(tile).float()
    return out[:, :, :h * 4, :w * 4]


def main():
    torch.set_num_threads(2)
    DST.mkdir(exist_ok=True)
    model = RRDBNet(num_block=6, num_feat=64, num_grow_ch=32, scale=4)
    sd = torch.load(WEIGHTS, map_location="cpu", weights_only=True)
    sd = sd.get("params_ema", sd.get("params", sd))
    model.load_state_dict(sd, strict=True)
    model.eval()
    print(f"weights loaded ({WEIGHTS.name}, {sum(p.numel() for p in model.parameters())/1e6:.1f}M params)", flush=True)

    files = sorted(SRC.glob("*.jpg"), key=lambda p: p.name)
    todo = [p for p in files if not (DST / p.name).exists()]
    print(f"{len(files)} images, {len(todo)} to upscale", flush=True)
    t0 = time.time()
    for i, p in enumerate(todo, 1):
        im = Image.open(p).convert("RGB")
        small = im.resize(HALF, Image.BICUBIC)   # mild pre-shrink then true 4x
        arr = np.asarray(small, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
        sr = upscale_tiled(model, tensor)          # 4x native -> 5504x3072
        out = sr.squeeze(0).clamp(0, 1).permute(1, 2, 0).numpy()
        out_img = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8))
        out_img = out_img.resize(EXPECT, Image.LANCZOS)   # save at 2752x1536 (net 2x of half-size)
        assert out_img.size == EXPECT, (p.name, out_img.size)
        out_img.save(DST / p.name, "JPEG", quality=93)
        if i % 25 == 0 or i == len(todo):
            el = time.time() - t0
            print(f"[{i}/{len(todo)}] {p.name}  {el/i:.1f}s/img  ETA {(len(todo)-i)*el/i/60:.0f}min", flush=True)
    print(f"DONE {len(list(DST.glob('*.jpg')))} upscaled", flush=True)


if __name__ == "__main__":
    sys.exit(main())
