import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyFile,verifyLock} from '../tools/verify-lock.mjs';
test('locked reference hashes pass',async()=>{await verifyLock()});
test('integrity check detects tampering (temporary fixture only)',async()=>{const dir=await mkdtemp(path.join(tmpdir(),'animation-lock-'));try{const b=Buffer.from('approved'),entry={path:'fixture.txt',bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};await writeFile(path.join(dir,entry.path),b);await verifyFile(dir,entry);await writeFile(path.join(dir,entry.path),'modified');await assert.rejects(()=>verifyFile(dir,entry),/LOCK MISMATCH/)}finally{await rm(dir,{recursive:true,force:true})}});
