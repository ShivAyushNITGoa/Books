#!/usr/bin/env node
import {serve} from '../../../tools/server.mjs';
const port=Number(process.env.PORT||3422);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
const web=await serve({port,entry:'/projects/molasses-flood-rebuilt/index.html'});
console.log(`Rebuilt film: http://0.0.0.0:${web.port}/projects/molasses-flood-rebuilt/index.html`);
console.log('Play uses the complete existing selected narration; seek and CC are available.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{
  await web.close();
  process.exit(0);
});
