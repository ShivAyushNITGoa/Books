import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
export const bundleRoot=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
export async function verifyFile(root,entry){const file=path.resolve(root,entry.path),b=await readFile(file);if(b.length!==entry.bytes||createHash('sha256').update(b).digest('hex')!==entry.sha256)throw new Error(`LOCK MISMATCH: ${entry.path}`)}
export async function verifyLock({strictOriginals=false,base}={}){
 const m=JSON.parse(await readFile(path.join(bundleRoot,'locked/manifest.json'),'utf8'));
 if(base){if(!/^[0-9a-f]{7,40}$/i.test(base))throw new Error('Invalid base commit');let existed=false;try{execFileSync('git',['cat-file','-e',`${base}:Animation/locked/manifest.json`],{cwd:bundleRoot,stdio:'ignore'});existed=true}catch{}
  if(existed)try{execFileSync('git',['diff','--exit-code',base,'--',':(top)Animation/locked'],{cwd:bundleRoot,stdio:'pipe'})}catch{throw new Error('The locked release changed relative to the base commit. Create a new release outside locked/ instead.')}
 }
 for(const e of m.files){if(path.isAbsolute(e.path)||e.path.split(/[\\/]/).includes('..'))throw new Error('Unsafe manifest path');await verifyFile(bundleRoot,e)}
 let originals=0;for(const e of m.originals){if(!e.path.startsWith('../psychology-of-human-attraction/'))throw new Error('Unexpected original path');try{await stat(path.resolve(bundleRoot,e.path))}catch(err){if(err.code==='ENOENT'&&!strictOriginals)continue;throw err}await verifyFile(bundleRoot,e);originals++}
 console.log(`LOCK OK: ${m.release}, ${m.files.length} bundled files; ${originals}/${m.originals.length} original files checked. Approved source ${m.sourceCommit}.`);return m;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const i=process.argv.indexOf('--base');await verifyLock({strictOriginals:process.argv.includes('--strict-originals'),base:i>=0?process.argv[i+1]:undefined})}catch(e){console.error(e.message);process.exitCode=1}
}
