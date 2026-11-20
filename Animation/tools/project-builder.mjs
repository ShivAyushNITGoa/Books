import {validateProject} from '../engine/project.js';
export function buildProject({id,text,duration=30,captions,width=1080,height=1920}){
 const turns=[];let speaker='primary';for(const paragraph of text.trim().split(/\n+/)){const tag=paragraph.match(/^\s*\[(primary|secondary)\]\s*/);if(tag)speaker=tag[1];const clean=paragraph.replace(/^\s*\[(primary|secondary)\]\s*/,'').trim();for(const sentence of clean.split(/(?<=[.!?।])\s+/).filter(Boolean))turns.push({speaker,text:sentence,words:sentence.split(/\s+/).length})}
 if(!turns.length)throw new Error('Script is empty');
 const total=turns.reduce((n,t)=>n+t.words,0);let cursor=0;const generated=[];
 for(const turn of turns){turn.start=cursor;turn.end=cursor+duration*turn.words/total;cursor=turn.end;const words=turn.text.split(/\s+/);for(let i=0;i<words.length;i+=4)generated.push({start:turn.start+(turn.end-turn.start)*i/words.length,end:turn.start+(turn.end-turn.start)*Math.min(words.length,i+4)/words.length,text:words.slice(i,i+4).join(' ')})}
 const actors=['primary','secondary'].map((id,index)=>({id,style:index?'waistcoat':'hoodie',path:[{t:0,x:index?1.35:-1.35,z:index?-1.75:.1},{t:duration,x:index?1.35:-1.2,z:index?-1.75:.25}],cues:turns.filter(t=>t.speaker===id).map((t,i)=>({start:t.start,end:t.end,emotion:i===0?'curious':'neutral',action:i%2?'idle':'gesture',look:index?-.5:.3})),speech:turns.filter(t=>t.speaker===id).map(t=>({start:t.start,end:t.end}))}));
 const keyMap=new Map();const key=(t,position,target)=>keyMap.set(t,{t,position,target});key(0,[.2,2.6,9.5],[0,1.25,-.6]);
 for(const t of turns){if(t.end-t.start<1)continue;const secondary=t.speaker==='secondary';key(t.start+(t.end-t.start)*.45,secondary?[1.9,2.1,5.1]:[-2.4,2.05,4.7],secondary?[1.2,1.35,-1.6]:[-1.3,1.25,.1])}
 key(duration,[.3,2.5,9.1],[0,1.25,-.5]);
 return validateProject({$schema:'../../engine/project.schema.json',version:1,id,title:text.replace(/\[(primary|secondary)\]/g,'').trim().split(/[\n.!?।]/)[0].slice(0,70),duration,width,height,fps:30,timing:captions?'imported-srt':'approximate-word-weighted',script:text,media:{},board:{title:'A NEW PERSPECTIVE',subtitle:'',detail:''},props:{cookieJars:false,phone:false},captions:captions||generated,actors,camera:[...keyMap.values()].sort((a,b)=>a.t-b.t),foley:[]});
}
