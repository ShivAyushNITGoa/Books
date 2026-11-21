import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const types={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
export function serve(port=3000){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local');
  let relative=url.pathname==='/'?'editing/three-demo/index.html':decodeURIComponent(url.pathname).slice(1);
  const p=path.resolve(root,relative);
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(p,(err,stat)=>{
   if(err||!stat.isFile()){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});
   fs.createReadStream(p).pipe(res);
  });
 });
 return new Promise(resolve=>server.listen(port,'0.0.0.0',()=>resolve(server)));
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await serve(Number(process.env.PORT||3000));
