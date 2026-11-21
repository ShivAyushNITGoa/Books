import {clamp,smooth} from '../engine/math.js';
import {narrativePhase,LOCATIONS} from '../world/geography.js';

function wrap(ctx,text,width,font) {
  ctx.font=font;
  const lines=[];
  let line='';
  for(const word of text.split(' ')) {
    const next=line?line+' '+word:word;
    if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}
    else line=next;
  }
  if(line)lines.push(line);
  return lines;
}

function drawMap(ctx,W,H,state) {
  const w=W*.18,h=W*.24,x=W-w-W*.035,y=H*.09;
  ctx.save();
  ctx.globalAlpha=.85;
  ctx.fillStyle='#273b36';
  ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();
  ctx.fillStyle='#728d87';ctx.fillRect(x+w*.72,y+8,w*.23,h-16);
  ctx.strokeStyle='#a69b7d';ctx.lineWidth=2;
  const project=(xx,zz)=>[x+w*.5+xx/90*w,y+h*.45+zz/150*h];
  const north=project(0,-44),south=project(0,68);
  ctx.beginPath();ctx.moveTo(...north);ctx.lineTo(...south);ctx.stroke();
  const tank=project(0,-26);
  ctx.strokeStyle='#d0b07b';ctx.beginPath();ctx.ellipse(...tank,w*.14,h*.075,0,0,Math.PI*2);ctx.stroke();
  for(const [xx,,zz]of [LOCATIONS.distillery,LOCATIONS.investigation,LOCATIONS.courthouse,LOCATIONS.memorial]){
    const p=project(xx,zz);ctx.fillStyle='#bcab87';ctx.fillRect(p[0]-3,p[1]-3,6,6);
  }
  const c=project(state.camera[0],state.camera[2]);
  const a=project(state.target[0],state.target[2]);
  ctx.strokeStyle='#f5d28f';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(...c);ctx.lineTo(...a);ctx.stroke();
  ctx.fillStyle='#fff0bc';ctx.beginPath();ctx.arc(...c,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e6dcc2';ctx.font=`600 ${W*.013}px Film`;
  ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('CONNECTED WHARF',x+w/2,y+h+4);
  ctx.restore();
}

function drawCaptions(ctx,W,H,cue) {
  if(!cue)return;
  let size=W*.041;
  let lines=wrap(ctx,cue.text,W*.84,`750 ${size}px Film`);
  while(lines.length>3){size*=.95;lines=wrap(ctx,cue.text,W*.84,`750 ${size}px Film`);}
  const lineHeight=size*1.3;
  const height=lines.length*lineHeight+size*.7;
  const y=H*.90-height/2;
  ctx.fillStyle='rgba(22,32,29,.9)';
  ctx.beginPath();ctx.roundRect(W*.045,y,W*.91,height,8);ctx.fill();
  ctx.fillStyle='#fff2d7';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.font=`750 ${size}px Film`;
  lines.forEach((line,i)=>ctx.fillText(line,W/2,y+size*.3+i*lineHeight));
}

/** Graphics explain time changes while geography remains on screen. */
export function drawOverlay(ctx,W,H,state,narration,cc) {
  const grad=ctx.createLinearGradient(0,0,0,H*.16);
  grad.addColorStop(0,'rgba(22,32,29,.87)');
  grad.addColorStop(.6,'rgba(22,32,29,.55)');
  grad.addColorStop(1,'rgba(22,32,29,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H*.16);
  ctx.fillStyle='#e2c186';ctx.textAlign='left';ctx.textBaseline='top';
  ctx.font=`700 ${W*.019}px Film`;
  ctx.fillText('THE GREAT MOLASSES FLOOD',W*.045,H*.024);
  ctx.font=`650 ${W*.024}px Film`;
  ctx.fillStyle='#f5e7c9';
  const phase=narrativePhase(state.t);
  ctx.fillText(phase,W*.045,H*.05,W*.9);
  // One small geographic guide replaces large repeated title cards.
  drawMap(ctx,W,H,state);
  if(cc)drawCaptions(ctx,W,H,narration.captions.find(c=>state.t>=c.start&&state.t<c.end));
  const vignette=ctx.createRadialGradient(W*.5,H*.45,W*.35,W*.5,H*.45,H*.78);
  vignette.addColorStop(0,'rgba(22,18,14,0)');
  vignette.addColorStop(1,'rgba(22,18,14,.15)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
  if(state.t>=22.5&&state.t<25) {
    ctx.fillStyle='rgba(233,216,176,.18)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';ctx.font=`750 ${W*.045}px Film`;ctx.fillStyle='#fff0d0';
    ctx.fillText('BEFORE THE FAILURE',W/2,H*.35);
  }
  ctx.fillStyle='#e9dfc8';ctx.font=`500 ${W*.014}px Film`;
  ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText('STYLIZED RECONSTRUCTION · ESTIMATES, NOT SIMULATION',W*.045,H*.977);
  ctx.fillStyle='#6d7964';ctx.fillRect(W*.045,H*.988,W*.91,2);
  ctx.fillStyle='#d2b16d';ctx.fillRect(W*.045,H*.988,W*.91*state.t/narration.duration,2);
}
