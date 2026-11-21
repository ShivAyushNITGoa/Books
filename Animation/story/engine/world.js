import {validateStory,atTime,lerp,smooth,interpolate} from './story.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
let story,voice,envelope,time=0,playing=false,W,H,S,cam,scene,local,u;
const ink='#292c38',palette={canyon:['#8dc5d5','#ce9264','#e8ba7c'],town:['#9ec5d1','#c3b699','#e6c88e'],workshop:['#425969','#a98b70','#ffd989'],forest:['#add3bc','#6b8d65','#dbb977'],space:['#101c3d','#4c5471','#89e4c8'],custom:['#bdd3df','#9dad9d','#ffe0a1']};
function poly(points,fill,stroke=ink,width=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width*S;ctx.lineJoin='round';ctx.stroke()}}
function line(a,b,color=ink,width=3){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width*S;ctx.lineCap='round';ctx.stroke()}
function ellipse(x,y,rx,ry,fill,stroke=null,width=2){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width*S;ctx.stroke()}}
function shade(color,amount){return '#'+color.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+amount)).toString(16).padStart(2,'0')).join('')}
// Oblique 2.5D projection: consistent volume, raised geometry and depth; actors remain cutouts.
function project(p){const x=p[0]-cam.target[0],y=p[1]-cam.target[1],z=p[2]-cam.target[2],k=S*cam.zoom;return [W*.5+(x*.91+z*.49)*k,H*.53+(-y+z*.31-x*.12)*k]}
function box(p,size,color){const [x,y,z]=p,[w,h,d]=size;const v=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]].map(project),top=[[x-w/2,y+h,z-d/2],[x+w/2,y+h,z-d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]].map(project);poly([v[1],v[2],top[2],top[1]],shade(color,-25));poly([v[2],v[3],top[3],top[2]],color);poly(top,shade(color,25));}
function orb(p,r,color){const q=project(p),k=S*cam.zoom;const g=ctx.createRadialGradient(q[0]-r*k*.3,q[1]-r*k*.4,1,q[0],q[1],r*k);g.addColorStop(0,shade(color,35));g.addColorStop(1,shade(color,-25));ellipse(...q,r*k,r*k,g,ink)}
function shadow(p,rx,rz,alpha=.18){const q=project(p);ellipse(...q,rx*S*cam.zoom,rz*S*cam.zoom,`rgba(20,25,35,${alpha})`)}
function label(text,p,size=24,color='#fff4d8',max=250){const q=project(p);ctx.font=`800 ${size*S*cam.zoom}px Story, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,...q,max*S*cam.zoom)}
function tree(p,size,color){const [x,y,z]=p;box(p,[size*.12,size*.7,size*.13],'#76543c');for(let i=0;i<3;i++)orb([x+(i-1)*size*.24,y+size*(.7+(i===1?.2:0)),z],size*.4,color)}
function rail(p,size,color,effect){const [x,y,z]=p,[w,h,d]=size;for(let j=0;j<12;j++)box([x-w/2+j*w/11,y-.12,z],[w/16,.12,d*1.35],'#795843');for(const side of [-1,1]){const zz=z+side*d*.36;if(effect==='buckle'){for(let j=0;j<18;j++){const xx=x-w/2+j*w/18,shift=Math.sin(j/18*Math.PI*3)*smooth(u)*32;box([xx,y,zz+shift],[w/17,.11*h+.08,3],color)}}else {const gap=effect==='heat'?lerp(w*.08,0,smooth(u)):w*.025;box([x-w/4-gap/4,y,zz],[(w-gap)/2,h,3],effect==='heat'?shade(color,Math.round(50*u)):color);box([x+w/4+gap/4,y,zz],[(w-gap)/2,h,3],color)}}}
export const propPainters={
 box:(p,s,c)=>box(p,s,c),
 sphere:(p,s,c)=>orb([p[0],p[1]+s[1]/2,p[2]],s[0]/2,c),
 cylinder:(p,s,c)=>{box(p,s,c);const q=project([p[0],p[1]+s[1],p[2]]);ellipse(...q,s[0]*S*cam.zoom*.5,s[2]*S*cam.zoom*.2,shade(c,25),ink)},
 tree:(p,s,c)=>tree(p,s[1],c),
 rock:(p,s,c)=>{const [x,y,z]=p;poly([[x-s[0]/2,y,z],[x-s[0]*.3,y+s[1],z],[x+s[0]*.25,y+s[1]*.9,z],[x+s[0]/2,y,z]].map(project),c)},
 rail,
 bridge:(p,s,c)=>{box(p,[s[0],s[1]*.12,s[2]],c);for(let i=-1;i<=1;i++){box([p[0]+i*s[0]*.36,p[1]-s[1],p[2]],[s[0]*.035,s[1],s[2]*.2],shade(c,-30));const a=project([p[0]+i*s[0]*.36-s[0]*.15,p[1]-s[1],p[2]]),b=project([p[0]+i*s[0]*.36+s[0]*.15,p[1],p[2]]);line(a,b,shade(c,-40),8)}},
 train:(p,s,c)=>{const [x,y,z]=p;box([x,y+s[1]*.2,z],[s[0],s[1]*.35,s[2]],c);box([x+s[0]*.3,y+s[1]*.5,z],[s[0]*.3,s[1]*.5,s[2]],shade(c,-20));box([x-s[0]*.25,y+s[1]*.55,z],[s[0]*.13,s[1]*.5,s[2]*.35],'#343b43');for(const a of [-.35,0,.35]){const q=project([x+a*s[0],y+s[1]*.2,z+s[2]*.56]),r=s[1]*.18*S*cam.zoom;ellipse(...q,r,r,'#28313b','#e4b675',2);line(q,[q[0]+Math.cos(local*7+a)*r*.8,q[1]+Math.sin(local*7+a)*r*.8],'#bca57b',2)}for(let i=0;i<5;i++){const k=((local*.4+i*.21)%1),q=project([x-s[0]*.25-k*24,y+s[1]*(1+k*.9),z]);ellipse(...q,(7+k*13)*S*cam.zoom,(6+k*10)*S*cam.zoom,`rgba(244,239,218,${.4*(1-k)})`) }},
 crane:(p,s,c)=>{box(p,[s[0]*.12,s[1],s[2]*.2],c);box([p[0],p[1]+s[1],p[2]], [s[0],s[1]*.06,s[2]*.2],c);line(project([p[0]+s[0]*.4,p[1]+s[1],p[2]]),project([p[0]+s[0]*.4,p[1]+s[1]*.3+Math.sin(local)*10,p[2]]),ink,2)},
 sign:(p,s,c,fx,prop)=>{box(p,[3,s[1],3],'#73543a');box([p[0],p[1]+s[1]*.55,p[2]],[s[0],s[1]*.45,s[2]],c);label(prop.label||'', [p[0],p[1]+s[1]*.78,p[2]+s[2]],Math.min(19,s[0]/(prop.label?.length||1)*1.5),'#302e32',s[0]*.9)},
 lamp:(p,s,c)=>{box(p,[3,s[1],3],'#34404a');orb([p[0],p[1]+s[1],p[2]],s[0]/2,c)},
 plant:(p,s,c,fx)=>{box(p,[s[0]*.65,s[1]*.25,s[2]],'#b97857');const h=s[1]*(fx==='grow'?lerp(.2,1,smooth(u)):1);line(project([p[0],p[1]+s[1]*.2,p[2]]),project([p[0],p[1]+h,p[2]]),'#507e55',4);for(const i of [1,2,3]){const q=project([p[0]+(i%2?1:-1)*s[0]*.25,p[1]+h*i/4,p[2]]);ellipse(...q,s[0]*S*cam.zoom*.3,s[0]*S*cam.zoom*.12,c,ink)}},
 console:(p,s,c)=>{box(p,s,c);box([p[0],p[1]+s[1],p[2]],[s[0]*.85,s[1]*.5,s[2]*.2],'#333e55');for(let i=-1;i<=1;i++)orb([p[0]+i*s[0]*.25,p[1]+s[1]*.5,p[2]+s[2]*.6],s[0]*.035,i===0?'#efbc74':'#83e8cf')},
 rocket:(p,s,c)=>{box(p,[s[0]*.55,s[1]*.7,s[2]*.55],c);orb([p[0],p[1]+s[1]*.7,p[2]],s[0]*.3,c);orb([p[0],p[1]+s[1]*.5,p[2]+s[2]*.4],s[0]*.15,'#77d3e5');poly([[p[0]-s[0]*.2,p[1],p[2]],[p[0],p[1]-s[1]*.35*(.8+.2*Math.sin(local*23)),p[2]],[p[0]+s[0]*.2,p[1],p[2]]].map(project),'#ffb653')},
 table:(p,s,c)=>{for(const x of [-1,1])for(const z of [-1,1])box([p[0]+x*s[0]*.4,p[1],p[2]+z*s[2]*.4],[4,s[1],4],shade(c,-25));box([p[0],p[1]+s[1],p[2]], [s[0],5,s[2]],c)}
};
function environment(){
 const colors=palette[scene.world.kind],sky=scene.world.sky||colors[0],ground=scene.world.ground||colors[1],accent=scene.world.accent||colors[2];
 const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,sky);gradient.addColorStop(1,shade(sky,35));ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 const space=scene.world.kind==='space';
 if(space){for(let i=0;i<90;i++){const x=((Math.sin(i*127.1)*43758.5)%1+1)%1,y=((Math.cos(i*79.3)*951.1)%1+1)%1;ellipse(x*W,y*H,W*(i%5===0?.002:.0009),W*.0015,'#e6f4e8')}ellipse(W*.8,H*.21,W*.18,W*.18,'#6d8f9d');ellipse(W*.76,H*.18,W*.17,W*.17,sky)}
 else {ellipse(W*.82,H*.19,W*.105,W*.105,'#ffe7ac');for(let layer=0;layer<3;layer++){const points=[[0,H*.68]];for(let i=0;i<=10;i++)points.push([i*W/10,H*(.32+layer*.085)+(Math.sin(i*2.1+layer*8)*.06)*H-cam.target[0]*S*.025*(layer+1)]);points.push([W,H],[0,H]);poly(points,shade(accent,layer*-16),null)}}
 poly([[0,H*.6],[W,H*.54],[W,H],[0,H]],ground,null);
 if(scene.world.kind==='canyon'){
  // Real open chasm below the trestle rather than a flat background image.
  box([0,-650,-140],[1300,600,240],shade(ground,-50));box([0,-700,220],[1300,650,170],shade(ground,-22));
  for(let i=0;i<10;i++)box([-550+i*120,-650,-120],[80,330+(i%3)*65,100],shade(ground,-25+i%3*8));
 }else if(['workshop','custom'].includes(scene.world.kind)){
  for(let i=-8;i<=8;i++){line(project([i*90,-29,-700]),project([i*90,-29,700]),shade(ground,-10),1);line(project([-900,-29,i*90]),project([900,-29,i*90]),shade(ground,-10),1)}
 }
 if(scene.world.kind==='town'){for(let i=-3;i<=3;i++){box([i*160,-29,-300],[130,150+(i%2)*50,90],shade(accent,i*5));for(let j=0;j<3;j++)box([i*160+(j-1)*32,50,-248],[17,35,2],'#4d6975')}}
 if(scene.world.kind==='workshop'){box([0,-30,-320],[1300,420,20],shade(ground,-25));for(let i=-3;i<=3;i++){box([i*180,100,-302],[110,130,4],'#a4cfce');line(project([i*180,100,-296]),project([i*180,230,-296]),'#756e60',5)}}
 if(scene.world.kind==='forest')for(let i=0;i<13;i++)tree([-650+i*110,-30,-250-i%3*40],160+i%4*25,shade('#477e62',i%3*8));
 if(scene.world.kind==='space'){box([0,-40,-180],[1100,12,500],'#67778b');for(let i=-3;i<=3;i++)box([i*180,-25,-350],[6,260,6],'#d0d4ca');line(project([-650,230,-350]),project([650,230,-350]),'#c7e4df',8)}
}
function actor(a){
 const design=story.cast.find(c=>c.id===a.id),action=a.action||'idle',position=a.to?interpolate(a.position,a.to,smooth(u)):a.position;
 const walk=action==='walk',fall=action==='fall',q=project(position),k=cam.zoom*(a.scale||1),phase=local*8;
 const bob=walk?Math.abs(Math.sin(phase))*3:Math.sin(local*2)*.6;
 shadow(position,21*(a.scale||1),6*(a.scale||1));ctx.save();ctx.translate(q[0],q[1]-bob*S*k);ctx.scale(S*k,S*k);if(fall)ctx.rotate(u*2.6);
 const stride=walk?Math.sin(phase)*16:0,angry=action==='angry',surprise=action==='surprised';
 // Stick limbs, colored tunic, large illustrated face, grounded feet.
 line([-8,-39],[-12+stride,0],ink,5/S);line([8,-39],[12-stride,0],ink,5/S);
 ellipse(-12+stride,0,10,3,'#303440');ellipse(12-stride,0,10,3,'#303440');
 poly([[-17,-78],[17,-78],[14,-37],[-14,-37]],design.color,ink,2/S);
 const pointing=action==='point'||action==='work',happy=action==='celebrate';
 const right=happy?[32,-112]:pointing?[51,-79+Math.sin(local*5)*6]:[25-Math.sin(phase)* (walk?12:2),-43];
 line([-15,-73],happy?[-36,-108]:[-28,-48+Math.sin(phase)*(walk?10:1)],ink,4/S);line([15,-73],right,ink,4/S);ellipse(...right,4,4,'#fff5df',ink,1/S);
 if(action==='work'){line([right[0]-4,right[1]-8],[right[0]+14,right[1]+10],'#8b654a',4/S);poly([[right[0]+5,right[1]-3],[right[0]+17,right[1]+7],[right[0]+25,right[1]+1],[right[0]+13,right[1]-10]],'#a6bcc0',ink,1/S)}
 ellipse(0,-104,29,31,'#fff8e9',ink,2.4/S);
 if(design.hat==='tophat'){poly([[-21,-128],[-19,-166],[16,-166],[20,-128]],'#30313a',ink,1.5/S);line([-30,-127],[30,-127],ink,5/S);line([-18,-137],[18,-137],design.color,4/S)}
 else if(design.hat==='cap'){poly([[-29,-119],[-25,-137],[18,-141],[29,-121]],design.color,ink,2/S);line([-25,-121],[39,-121],ink,3/S);for(let j=-2;j<=2;j++)line([j*8,-137],[j*8+3,-123],'#f7e7c5',2/S)}
 else if(design.hat==='helmet'){ellipse(0,-106,35,38,'#d7e7e5',ink,2/S);ellipse(0,-105,28,30,'#fff8e9',ink,1/S)}
 else {poly([[-26,-116],[-21,-134],[-8,-129],[0,-137],[13,-129],[21,-132],[27,-113],[15,-120]],'#4b423f',null)}
 for(const sign of [-1,1]){ellipse(sign*10,-106,surprise?3.8:2.4,surprise?5:3.3,ink);line([sign*6,-117+(angry?sign*3:0)],[sign*18,-117-(angry?sign*3:0)],ink,2/S)}
 const speaking=action==='talk'||action==='point'||action==='work';const amp=speaking?(envelope?.values[Math.min(envelope.values.length-1,Math.floor(time*envelope.fps))]||0):0;
 if(surprise||amp>.15)ellipse(0,-91,4+amp*3,3+amp*6,ink);else if(happy){ctx.beginPath();ctx.arc(0,-95,10,0,Math.PI);ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke()}else line([-5,-91],[5,-91+(angry?-3:0)],ink,1.6/S);
 if(angry){for(const sign of [-1,1])ellipse(sign*34,-120-Math.sin(local*7)*3,5,3,'#f6ede4')}
 ctx.restore();
}
function captions(){
 const cue=story.captions.find(c=>time>=c.start&&time<c.end);if(!cue)return;
 const size=Math.min(W*.065,H*.045),maxWidth=W*.84;ctx.font=`850 ${size}px Story, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 const lines=[];let row='';for(const word of cue.text.split(/\s+/)){if(ctx.measureText(row+' '+word).width>maxWidth&&row){lines.push(row);row=word}else row+=(row?' ':'')+word}if(row)lines.push(row);
 const y=H*.84-(lines.length-1)*size*.58;ctx.lineJoin='round';ctx.lineWidth=size*.18;ctx.strokeStyle='#1b2334';ctx.fillStyle='#fff8e7';lines.forEach((text,i)=>{ctx.strokeText(text,W/2,y+i*size*1.18);ctx.fillText(text,W/2,y+i*size*1.18)})
}
function draw(t){
 time=Math.max(0,Math.min(story.duration,t));const frame=atTime(story,time);({scene,t:local,u}=frame);const c=scene.camera,to=c.to||c,e=smooth(u);cam={target:interpolate(c.target,to.target,e),zoom:lerp(c.zoom,to.zoom,e)};
 environment();
 const objects=[...scene.props.map(prop=>({position:prop.to?interpolate(prop.position,prop.to,smooth(u)):prop.position,prop})),...scene.actors.map(a=>({position:a.to?interpolate(a.position,a.to,smooth(u)):a.position,a}))];
 objects.sort((a,b)=>(a.position[2]*.31-a.position[0]*.12)-(b.position[2]*.31-b.position[0]*.12));
 for(const o of objects){if(o.a)actor(o.a);else {const p=o.prop,size=(p.size||[40,40,40]).map(n=>n*(p.effect==='pulse'?1+.08*Math.sin(local*4):1));if(!['rail','bridge'].includes(p.shape))shadow(o.position,size[0]*.45,size[2]*.15,.13);propPainters[p.shape](o.position,size,p.color||'#ba9b72',p.effect,p)}}
 // Subtle vignette ties foreground layers together.
 const v=ctx.createRadialGradient(W*.5,H*.45,H*.18,W*.5,H*.45,H*.8);v.addColorStop(0,'#00000000');v.addColorStop(1,'#10182355');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);captions();
 document.querySelector('#seek').value=time;document.querySelector('#clock').textContent=`${time.toFixed(1)} / ${story.duration.toFixed(1)}s`;
}
window.setT=t=>{if(!Number.isFinite(t))throw Error('Invalid frame time');draw(t)};
try{
 const params=new URLSearchParams(location.search),url=new URL(params.get('project')||'/output/story-railway/project.json',location.href);if(url.origin!==location.origin)throw Error('Project must be same-origin');
 const response=await fetch(url);if(!response.ok)throw Error(`Project HTTP ${response.status}`);story=validateStory(await response.json(),{prepared:true});
 W=Number(params.get('width')||story.width);H=Number(params.get('height')||story.height);if(![W,H].every(n=>Number.isInteger(n)&&n>=160&&n<=3840))throw Error('Invalid canvas size');canvas.width=W;canvas.height=H;S=W>H?Math.min(W/1100,H/620):Math.min(W/640,H/900);
 const asset=p=>{const resolved=new URL(p,url);if(resolved.origin!==location.origin)throw Error('Media must be same-origin');return resolved};
 const envResponse=await fetch(asset(story.media.envelope));if(!envResponse.ok)throw Error('Missing voice envelope');envelope=await envResponse.json();if(!Array.isArray(envelope.values)||envelope.fps!==60)throw Error('Invalid voice envelope');
 voice=new Audio(asset(story.media.audio));voice.preload='auto';
 await document.fonts.load('850 24px Story');await document.fonts.ready;
 document.querySelector('#seek').max=story.duration;
 document.querySelector('#seek').oninput=e=>{draw(Number(e.target.value));voice.currentTime=time};
 const playButton=document.querySelector('#play');playButton.onclick=async()=>{if(playing){voice.pause();playing=false;playButton.textContent='Play'}else{if(time>=story.duration)draw(0);voice.currentTime=time;await voice.play();playing=true;playButton.textContent='Pause'}};
 voice.onended=()=>{playing=false;playButton.textContent='Play';draw(story.duration)};
 const tick=()=>{if(playing){draw(Math.min(story.duration,voice.currentTime));}requestAnimationFrame(tick)};requestAnimationFrame(tick);
 draw(0);window.renderSafe=true;
}catch(e){window.renderError=e.stack||e.message;document.querySelector('#error').textContent=window.renderError;console.error(e)}
