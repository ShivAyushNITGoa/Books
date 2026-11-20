#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import {validateStory} from '../engine/story.js';
import {ROOT,localFile,serve} from '../../tools/server.mjs';
import {prepareStory} from './prepare.mjs';
import {render} from '../../tools/render.mjs';
const command=process.argv[2];
try{
 const {values:o,positionals}=parseArgs({args:process.argv.slice(3),allowPositionals:true,options:Object.fromEntries(['project','out','port','speed','start','end','fps','width','height','still','crf'].map(k=>[k,{type:'string'}]))});
 if(positionals.length)throw Error('Unexpected arguments');
 if(command==='validate'){const file=await localFile(o.project);validateStory(JSON.parse(await readFile(file,'utf8')));console.log('Story is valid')}
 else if(command==='prepare'){if(!o.project)throw Error('--project is required');await prepareStory(o)}
 else if(command==='render'){if(!o.project)throw Error('--project is required');await render({...o,story:true})}
 else if(command==='serve'){const web=await serve({port:Number(o.port||3344),root:ROOT,entry:'/story/engine/index.html?project=/output/story-railway/project.json'});console.log(`Story World Studio: http://0.0.0.0:${web.port}/story/engine/index.html?project=/output/story-railway/project.json`)}
 else {console.log('Story World Studio\n  validate --project story/examples/railway/story.json\n  prepare --project <story.json> [--out output/<new-slug>] [--speed 160]\n  serve [--port 3344]\n  render --project output/<slug>/project.json [--out output/<file>.mp4] [--still 2] [--start 0 --end 5]');if(command&&command!=='help')process.exitCode=1}
}catch(e){console.error(e.message);process.exitCode=1}
