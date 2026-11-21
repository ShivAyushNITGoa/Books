#!/usr/bin/env node
/** Bind the render to its actual runtime source. Tools/docs are not picture inputs. */
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const output=fileURLToPath(new URL('../../../output/molasses-flood-rebuilt/',import.meta.url));
export async function manifest() {
  const files=['film.js','index.html','script.txt','narration.json','direction/beats.json','delivery/captions.srt'];
  for(const directory of ['engine','cast','world','direction','ui']) {
    for(const name of await readdir(path.join(project,directory))) {
      if(name.endsWith('.js'))files.push(`${directory}/${name}`);
    }
  }
  const hashes={};
  for(const file of files.sort())hashes[file]=createHash('sha256').update(await readFile(path.join(project,file))).digest('hex');
  return hashes;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'render-source.json'),JSON.stringify(await manifest(),null,2)+'\n');
  console.log('Recorded runtime fingerprints');
}
