/** Story-v1: authored story worlds, deterministic timeline and portable data. */
export const ACTIONS=['idle','talk','walk','point','work','surprised','angry','celebrate','fall'];
export const SHAPES=['box','cylinder','sphere','tree','rock','rail','train','bridge','crane','sign','lamp','plant','console','rocket','table'];
export const WORLDS=['canyon','town','workshop','forest','space','custom'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const assert=(v,m)=>{if(!v)throw Error(`Story: ${m}`)};
const vector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(finite);
const color=v=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v);
const id=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(v);
export function validateStory(s,{prepared=false}={}){
 assert(s?.version==='story-v1','version must be story-v1');assert(id(s.id),'invalid id');
 assert(typeof s.title==='string'&&s.title.length>0,'title required');assert(s.language==='en','English narration required');
 assert([s.width,s.height].every(v=>Number.isInteger(v)&&v>=160&&v<=3840&&v%2===0),'even dimensions 160–3840 required');
 assert(Number.isInteger(s.fps)&&s.fps>=1&&s.fps<=60,'fps 1–60 required');
 assert(Array.isArray(s.cast)&&s.cast.length<=30,'cast must be an array (max 30)');
 const ids=new Set();for(const a of s.cast){assert(id(a.id)&&!ids.has(a.id),'unique cast IDs required');ids.add(a.id);assert(typeof a.name==='string','cast name required');assert(color(a.color),'cast hex color required');assert(!a.hat||['cap','tophat','helmet','none'].includes(a.hat),'unknown hat');}
 assert(Array.isArray(s.scenes)&&s.scenes.length>0&&s.scenes.length<=100,'1–100 scenes required');const scenes=new Set();
 for(const scene of s.scenes){
  assert(id(scene.id)&&!scenes.has(scene.id),'unique scene IDs required');scenes.add(scene.id);
  assert(typeof scene.narration==='string'&&scene.narration.trim().length>0&&scene.narration.length<=6000,'scene narration required (max 6000 characters)');
  assert(scene.world&&WORLDS.includes(scene.world.kind),'unknown world');
  for(const k of ['sky','ground','accent'])if(scene.world[k])assert(color(scene.world[k]),`invalid world ${k}`);
  assert(Array.isArray(scene.actors)&&scene.actors.length<=30,'scene actors required');const actors=new Set();
  for(const a of scene.actors){assert(ids.has(a.id)&&!actors.has(a.id),'actor must refer to unique cast ID');actors.add(a.id);assert(vector(a.position,3),'actor position must be [x,y,z]');assert(!a.to||vector(a.to,3),'actor to must be [x,y,z]');assert(ACTIONS.includes(a.action||'idle'),'unknown action');assert(!a.scale||(finite(a.scale)&&a.scale>0&&a.scale<=10),'invalid actor scale');}
  assert(Array.isArray(scene.props)&&scene.props.length<=300,'scene props required (max 300)');const props=new Set();
  for(const p of scene.props){assert(id(p.id)&&!props.has(p.id),'unique prop IDs per scene required');props.add(p.id);assert(SHAPES.includes(p.shape),'unknown prop shape');assert(vector(p.position,3),'prop position required');assert(!p.size||vector(p.size,3)&&p.size.every(n=>n>0&&n<=4000),'positive prop size required');assert(!p.color||color(p.color),'invalid prop color');assert(!p.to||vector(p.to,3),'invalid prop endpoint');assert(!p.label||typeof p.label==='string'&&p.label.length<=120,'label max 120 characters');assert(!p.effect||['heat','buckle','grow','pulse'].includes(p.effect),'invalid prop effect');}
  const camera=c=>c&&vector(c.target,3)&&finite(c.zoom)&&c.zoom>=.2&&c.zoom<=8;
  assert(camera(scene.camera),'camera target and zoom required');assert(!scene.camera.to||camera(scene.camera.to),'invalid camera end');
  if(scene.seconds!==undefined)assert(finite(scene.seconds)&&scene.seconds>=.5&&scene.seconds<=600,'scene seconds .5–600');
  if(prepared){assert(finite(scene.start)&&finite(scene.end)&&scene.end>scene.start,'prepared scene timing required');}
 }
 if(prepared){assert(finite(s.duration)&&s.duration>0&&s.duration<=3600,'duration invalid');let end=0;for(const scene of s.scenes){assert(Math.abs(scene.start-end)<.001,'scene timeline must be contiguous');end=scene.end}assert(Math.abs(end-s.duration)<.001,'duration must equal final scene end');assert(s.media&&typeof s.media.audio==='string','prepared audio required');assert(Array.isArray(s.captions),'captions required');let endCue=0;for(const q of s.captions){assert(finite(q.start)&&finite(q.end)&&q.start>=endCue-.001&&q.end>q.start&&q.end<=s.duration+.001&&typeof q.text==='string','invalid/nonmonotonic caption');endCue=q.end}}
 return s;
}
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function atTime(s,time){const t=Math.max(0,Math.min(s.duration-1e-6,time));const scene=s.scenes.find(q=>t>=q.start&&t<q.end)||s.scenes.at(-1);return {scene,t:t-scene.start,u:(t-scene.start)/(scene.end-scene.start)}}
export function interpolate(a,b,u){return a.map((n,i)=>lerp(n,b[i],u))}
export function captionCues(text,start,duration,maxWords=6){
 const words=text.trim().split(/\s+/),groups=[];let group=[];
 for(const word of words){group.push(word);if(group.length>=maxWords||/[.!?;:]$/.test(word)){groups.push(group.join(' '));group=[]}}if(group.length)groups.push(group.join(' '));
 const weights=groups.map(g=>g.length+(/[.!?]$/.test(g)?8:0)),total=weights.reduce((a,b)=>a+b,0);let cursor=start;
 return groups.map((text,i)=>{const end=i===groups.length-1?start+duration:cursor+duration*weights[i]/total;const q={start:cursor,end,text};cursor=end;return q});
}
