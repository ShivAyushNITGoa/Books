// Shared browser/Node project validation. No dependencies, eval or network services.
export const EMOTIONS=['neutral','worried','curious','happy'];
export const ACTIONS=['idle','gesture','phone','book','nod'];
export const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function validateProject(p){
 const fail=m=>{throw new Error(`Invalid project: ${m}`)};
 if(!p||p.version!==1)fail('version must be 1');
 if(typeof p.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id))fail('id must be a lowercase slug');
 if(!finite(p.duration)||p.duration<=0||p.duration>3600)fail('duration must be > 0 and <= 3600 seconds');
 for(const [k,def] of [['width',1080],['height',1920]]){p[k]??=def;if(!Number.isInteger(p[k])||p[k]<160||p[k]>3840||p[k]%2)fail(`${k} must be an even integer, 160–3840`)}
 p.fps??=30;if(!Number.isInteger(p.fps)||p.fps<1||p.fps>60)fail('fps must be 1–60');
 p.board??={title:p.title||p.id,subtitle:'',detail:''};if(typeof p.board!=='object'||Array.isArray(p.board))fail('board must be an object');
 for(const k of ['title','subtitle','detail'])if(p.board[k]!=null&&(typeof p.board[k]!=='string'||p.board[k].length>160))fail(`board.${k} must be text up to 160 characters`);
 p.props??={};if(typeof p.props!=='object'||Array.isArray(p.props))fail('props must be an object');for(const k of ['cookieJars','phone'])if(p.props[k]!=null&&typeof p.props[k]!=='boolean')fail(`props.${k} must be boolean`);
 p.captions??=[];p.media??={};if(!Array.isArray(p.captions)||typeof p.media!=='object'||Array.isArray(p.media))fail('captions must be an array and media an object');
 for(const [k,v] of Object.entries(p.media))if(!['audio','renderAudio','envelope'].includes(k)||typeof v!=='string'||!v||/^[a-z]+:/i.test(v)||v.startsWith('//'))fail('media must contain local audio/renderAudio/envelope paths only');
 function interval(q,name){if(!finite(q.start)||!finite(q.end)||q.start<0||q.end<=q.start||q.end>p.duration+.001)fail(`${name} has an invalid time interval`)}
 let last=0;for(const q of p.captions){interval(q,'caption');if(q.start<last-.001)fail('captions must be ordered and non-overlapping');last=q.end;if(typeof q.text!=='string'||!q.text.trim()||q.text.length>280)fail('caption text must contain 1–280 characters; split long paragraphs')}
 if(!Array.isArray(p.actors)||p.actors.length<1||p.actors.length>2)fail('one or two actors are supported');
 const ids=new Set();for(const a of p.actors){if(!['primary','secondary'].includes(a.id)||ids.has(a.id))fail('actor ids must be unique primary/secondary');ids.add(a.id);if(!['hoodie','waistcoat'].includes(a.style))fail('actor style must be hoodie/waistcoat');
 if(!Array.isArray(a.path)||!a.path.length)fail('each actor needs a path');let t=-1;for(const k of a.path){if(!finite(k.t)||k.t<0||k.t<=t||k.t>p.duration||!finite(k.x)||!finite(k.z))fail('actor path keys must have ordered times and finite x/z');t=k.t}
 a.cues??=[];let end=0;for(const q of a.cues){interval(q,'actor cue');if(q.start<end-.001)fail('actor cues for one actor may not overlap');end=q.end;if(q.emotion&&!EMOTIONS.includes(q.emotion))fail(`unsupported emotion: ${q.emotion}`);if(q.action&&!ACTIONS.includes(q.action))fail(`unsupported action: ${q.action}`);if(q.look!=null&&(!finite(q.look)||Math.abs(q.look)>1))fail('look must be -1 to 1')}
 a.speech??=[];for(const q of a.speech)interval(q,'speech');
 }
 if(p.props.phone===false&&p.actors.some(a=>a.cues.some(q=>q.action==='phone')))fail('phone cues require props.phone=true');
 for(const action of ['phone','book']){const cues=p.actors.flatMap(a=>a.cues.filter(q=>q.action===action)).sort((a,b)=>a.start-b.start);for(let i=1;i<cues.length;i++)if(cues[i].start<cues[i-1].end-.001)fail(`only one actor can use the ${action} prop at a time`)}
 p.camera??=[];let ct=-1;for(const k of p.camera){if(!finite(k.t)||k.t<0||k.t<=ct||k.t>p.duration)fail('camera times must be ordered');ct=k.t;for(const v of [k.position,k.target])if(!Array.isArray(v)||v.length!==3||!v.every(finite))fail('camera position/target must be numeric XYZ vectors')}
 p.foley??=[];for(const q of p.foley){if(!finite(q.time)||q.time<0||q.time>=p.duration||!['step','wood','paper','buzz'].includes(q.kind)||q.gain!=null&&(!finite(q.gain)||q.gain<0||q.gain>.15))fail('invalid Foley event')}
 return p;
}
export function parseSrt(s){
 const sec=s=>{const m=s.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);if(!m||+m[2]>59||+m[3]>59)throw new Error('Invalid SRT timestamp');return +m[1]*3600+ +m[2]*60+ +m[3]+ +m[4]/1000};
 return s.replace(/^\uFEFF/,'').trim().split(/\r?\n\s*\r?\n/).filter(Boolean).map(block=>{const a=block.split(/\r?\n/);if(/^\d+$/.test(a[0]))a.shift();if(!a[0]?.includes(' --> '))throw new Error('Invalid SRT cue');const [start,end]=a.shift().split(' --> ');return {start:sec(start),end:sec(end),text:a.join('\n')}});
}
export function formatSrt(captions){const stamp=n=>{const ms=Math.round(n*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};return captions.map((q,i)=>`${i+1}\n${stamp(q.start)} --> ${stamp(q.end)}\n${q.text}\n`).join('\n')}
export const clamp=n=>Math.max(0,Math.min(1,n));
export const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
export function pathAt(keys,t,fields){if(t<=keys[0].t)return fields.map(k=>keys[0][k]);if(t>=keys.at(-1).t)return fields.map(k=>keys.at(-1)[k]);let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;const a=keys[i],b=keys[i+1],u=smooth((t-a.t)/(b.t-a.t));return fields.map(k=>a[k]+(b[k]-a[k])*u)}
// Whitespace-wrapped captions with a grapheme fallback for long unspaced words.
export function wrapText(text,measure,maxWidth){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(measure(word)>maxWidth){if(line){lines.push(line);line=''}const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(word)].map(s=>s.segment):[...word];for(const ch of chars){if(line&&measure(line+ch)>maxWidth){lines.push(line);line=''}line+=ch}}else if(line&&measure(`${line} ${word}`)>maxWidth){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line)}return lines}
