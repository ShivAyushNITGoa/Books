import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {realpath,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
export const ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.mp4':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.srt':'text/plain; charset=utf-8','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png','.md':'text/plain; charset=utf-8'};
export async function localFile(name,base=ROOT){const absolute=path.resolve(base,name),actual=await realpath(absolute);if(actual!==ROOT&&!actual.startsWith(ROOT+path.sep))throw new Error('Path outside Animation');return actual}
export async function serve({port=3333,entry='/engine/index.html',root=ROOT}={}){
 const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  try{
   const url=new URL(req.url,'http://local');
   if(url.pathname==='/'){res.writeHead(302,{Location:entry});res.end();return}
   const decoded=decodeURIComponent(url.pathname);if(decoded.split('/').some(s=>s.startsWith('.')||s==='node_modules'))throw new Error('Private path');
   const file=await localFile('.'+decoded,root);const info=await stat(file);if(!info.isFile())throw new Error('Not a file');
   const headers={'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
   let start=0,end=info.size-1,code=200;
   if(req.headers.range){const m=req.headers.range.match(/^bytes=(\d*)-(\d*)$/);if(!m||!m[1]&&!m[2]){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
    if(!m[1])start=Math.max(0,info.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}
    if(start>end||start>=info.size||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
    code=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
   }
   headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(code,headers);
   if(req.method==='HEAD'||info.size===0){res.end();return}
   const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found')}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve)});
 return {server,port:server.address().port,close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)})};
}
