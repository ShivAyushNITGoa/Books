/* A single persistent 2.5D set. All joints, props and camera poses are functions
   of time: scrubbing/export never depends on the previous frame. No slide layers. */
const c = document.querySelector('canvas'), g = c.getContext('2d');
const W=720,H=1280, ink='#263e42', cream='#fff6e7', teal='#39a599', coral='#e27b62';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,t)=>a+(b-a)*t;
const ramp=(t,a,b)=>ease((t-a)/(b-a));
function path(p,fill,stroke=null,lw=3){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function line(p,col=ink,w=8){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke()}
function rect(x,y,w,h,col,r=0){g.fillStyle=col;g.beginPath();g.roundRect(x,y,w,h,r);g.fill()}
function circle(x,y,r,col){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=col;g.fill()}
function ellipse(x,y,rx,ry,col){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=col;g.fill()}
function text(s,x,y,size=20,col=ink,align='center'){g.fillStyle=col;g.font=`600 ${size}px system-ui, sans-serif`;g.textAlign=align;g.fillText(s,x,y)}
function shadow(x,y,r=46){ellipse(x,y,r,r*.22,'#243c4222')}
function box(x,y,w,h){path([[x,y],[x+12,y-8],[x+w+12,y-8],[x+w,y]],'#debb91');rect(x,y,w,h,'#efd3ad',4);path([[x+w,y],[x+w+12,y-8],[x+w+12,y+h-8],[x+w,y+h]],'#bd9c76')}
function room(t){
 const wall=g.createLinearGradient(0,150,720,1000);wall.addColorStop(0,'#f4e6d0');wall.addColorStop(1,'#e3cdb0');rect(-500,-500,1800,1900,wall);
 path([[560,-300],[1100,-300],[1100,1260],[560,850]],'#d4bb9b');
 path([[-500,850],[560,850],[1100,1260],[1100,1800],[-500,1800]],'#a8bab0');
 line([[-500,850],[560,850],[1100,1260]],'#83988f',5);
 for(let y=930;y<1600;y+=120)line([[-500,y],[1100,y+230]],'#95aaa044',2);
 for(let x=-700;x<1200;x+=180)line([[x,850],[x+300,1800]],'#95aaa044',2);
 // Recessed window and sunlight remain physically in the room throughout.
 rect(49,242,226,302,'#c0ac91',6);rect(59,252,206,280,'#8bbfc0',2);
 const sky=g.createLinearGradient(0,250,0,530);sky.addColorStop(0,'#a6d9d5');sky.addColorStop(1,'#f5e7bb');rect(65,258,194,268,sky);
 circle(218,309,28,'#fff4c9');path([[65,490],[128,426],[189,485],[259,435],[259,526],[65,526]],'#84a99e');
 line([[162,252],[162,532]],cream,9);line([[60,393],[263,393]],cream,9);box(42,534,245,15);
 path([[65,550],[240,550],[535,1055],[200,1055]],'#fff7ce26');
 // Shelf, books, clock.
 box(335,348,174,12);[coral,teal,'#f0bb61',ink].forEach((col,i)=>rect(350+i*27,289-i%2*12,20,58+i%2*12,col,3));
 circle(434,228,43,'#b99b76');circle(434,228,36,cream);line([[434,202],[434,228],[454,238]],ink,3);
 // Door on right-hand return wall.
 path([[608,460],[706,509],[706,954],[608,880]],'#b69a7a',ink,3);path([[621,481],[693,517],[693,927],[621,875]],'#5d8580');circle(678,728,5,'#eac486');
 // Plant, with lit leaves.
 shadow(90,873,43);path([[60,799],[122,799],[112,865],[71,865]],'#c48165');
 line([[92,807],[92,698]],'#557a68',6);[[70,740,-.6],[111,715,.6],[71,686,-.6],[116,765,.6]].forEach(([x,y,a])=>{g.save();g.translate(x,y);g.rotate(a);ellipse(0,0,16,35,'#638c70');g.restore()});
 // Desk, existing in every shot. Props never enter as a slide.
 shadow(385,936,154);line([[278,814],[269,928]],'#7c6853',13);line([[490,814],[508,926]],'#7c6853',13);
 path([[246,784],[453,762],[532,806],[308,834]],'#e7bd84',ink,3);path([[308,834],[532,806],[532,822],[308,850]],'#bd9161');path([[246,784],[308,834],[308,850],[246,800]],'#cba16d');
}
function jar(x,y,count,focus){
 shadow(x,y+5,28);rect(x-22,y-80,44,80,'#f3ffff70',9);g.strokeStyle='#5f8d89';g.lineWidth=2;g.stroke();
 for(let i=0;i<count;i++){let xx=x-12+(i%3)*12, yy=y-12-Math.floor(i/3)*14;circle(xx,yy,7,'#c88c4e');circle(xx-2,yy-2,1.5,'#70513b');circle(xx+3,yy+1,1,'#70513b')}
 rect(x-25,y-86,50,9,'#537e79',3);text(String(count),x,y-39,18,ink);
 if(focus){g.globalAlpha=focus;ellipse(x,y+6,29,8,'#e6b54e55');g.globalAlpha=1}
}
// Joint solver keeps arms articulated with fixed-length upper/lower bones.
function arm(sx,sy,hx,hy,bend){const dx=hx-sx,dy=hy-sy,d=Math.hypot(dx,dy),len=55, h=Math.sqrt(Math.max(0,len*len-d*d/4));const ex=(sx+hx)/2-dy/(d||1)*h*bend,ey=(sy+hy)/2+dx/(d||1)*h*bend;line([[sx,sy],[ex,ey],[hx,hy]],ink,10);circle(hx,hy,6,cream)}
function person({x,y,col,t,walk=0,talk=false,gesture=0,phone=false,look=1,reach=0}){
 const phase=t*9,bob=Math.abs(Math.sin(phase))*walk*5+Math.sin(t*2.4)*1.8;
 g.save();g.translate(x,y-bob);shadow(0,bob+3,37);
 const hip=-88,shoulder=-166;
 for(const side of [-1,1]){let swing=Math.sin(phase+side*Math.PI/2)*walk;line([[0,hip],[side*12+swing*15,-48],[side*19+swing*31,-2]],ink,11);line([[side*19+swing*31,-2],[side*19+swing*31+13,-2]],ink,10)}
 line([[0,hip],[Math.sin(t*2)*2,shoulder]],ink,13);
 // Minimal stick figure: circular head, line torso/limbs, no human body mesh.
 circle(0,-205,32,ink);circle(0,-207,27,col);
 const blink=(t%3.8>3.64);[-1,1].forEach(s=>{if(blink)line([[s*9-3+look*3,-210],[s*9+3+look*3,-210]],ink,2);else circle(s*9+look*3,-211,2.6,ink)});
 if(talk)ellipse(look*4,-194,5,2+Math.abs(Math.sin(t*18))*4,ink);else {g.beginPath();g.arc(look*3,-201,9,.25,Math.PI-.25);g.strokeStyle=ink;g.lineWidth=2;g.stroke()}
 const wave=Math.sin(t*7)*gesture*8;
 arm(-5,shoulder,-40+reach*15,-105-reach*72,-1);
 let hx=38+reach*24,hy=-112-gesture*65+wave-reach*35;
 if(phone){hx=28;hy=-146+Math.sin(t*10)*2}
 arm(5,shoulder,hx,hy,1);
 if(phone){g.save();g.translate(hx,hy-13);g.rotate(.12);rect(-10,-20,20,36,ink,4);rect(-7,-16,14,25,'#92d5cb',2);g.restore()}
 // A small neck accent identifies the same two characters in every shot.
 line([[-7,shoulder+6],[8,shoulder+6]],col,7);
 g.restore();
}
const captions=[
 [.35,1.65,'Have you ever noticed…'],[1.77,4.01,'The more available you are,','the less you’re valued?'],
 [4.15,5.35,'You reply in seconds.'],[5.49,6.7,'Cancel your plans.'],[6.8,8.07,'Always say yes.'],
 [8.21,10.8,'In a 1975 study,'],[10.8,12.4,'people tasted the same cookie,'],[12.4,14.43,'from a jar of ten… or just two.'],
 [14.57,17.56,'The nearly empty jar’s cookies','were rated more desirable.'],
 [17.7,19.08,'Scarcity signals value.'],[19.22,21.13,'But not by playing hard to get.'],
 [21.27,22.9,'Build a full life.'],[22.9,25.32,'Your goals. Friends. Boundaries.'],[25.46,29.7,'Be someone worth missing.']
];
// Smooth camera blocking: wide establish → phone → jars → conversation → wide payoff.
const camera=[[0,360,760,1.24],[3.5,370,825,1.62],[6.8,365,825,1.68],[9.5,381,815,1.75],[14,389,812,1.85],[18,400,820,1.62],[21,386,825,1.55],[25,365,830,1.4],[30,360,830,1.4]];
function cameraAt(t){let i=0;while(i<camera.length-2&&t>camera[i+1][0])i++;const a=camera[i],b=camera[i+1],u=ease((t-a[0])/(b[0]-a[0]));return [mix(a[1],b[1],u),mix(a[2],b[2],u),mix(a[3],b[3],u)]}
export function setT(t){
 t=Math.max(0,Math.min(30,t));g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
 g.save();const [cx,cy,z]=cameraAt(t);g.translate(W/2,H/2);g.scale(z,z);g.translate(-cx,-cy);
 room(t);
 const approach=ramp(t,7.9,10.2), depart=ramp(t,21.4,25.1);
 const ax=mix(mix(244,274,approach),207,depart),ay=mix(975,1000,depart);
 const bx=mix(509,552,depart), by=951;
 jar(343,793,10,0);jar(431,791,2,ramp(t,13.8,15));
 // Visible cookie exchange; stick hands point towards the real jars.
 if(t>10&&t<18.8){const k=ramp(t,10.1,11.4);circle(mix(431,483,k),mix(754,774,k)-Math.sin(k*Math.PI)*38,7,'#c88c4e')}
 person({x:bx,y:by,col:coral,t:t+.4,talk:t>8.2&&t<19.1,gesture:(ramp(t,8.1,9)-ramp(t,18.5,19.2))*.75,look:-1,reach:(ramp(t,10,10.7)-ramp(t,13.2,14))*.9,walk:depart>0&&depart<1?.4:0});
 person({x:ax,y:ay,col:teal,t,walk:(approach>0&&approach<1||depart>0&&depart<1)?1:0,phone:t<7.8,talk:t<8.1||t>19.2,gesture:t>19.2?(ramp(t,19.2,20)-ramp(t,24.5,25.5))*.9:0,look:1,reach:(ramp(t,11,12)-ramp(t,17,18))*.7});
 // Phone put down onto the same desk, rather than a floating chat panel.
 if(t>=7.8){rect(282,795,24,11,ink,3);rect(285,797,17,5,'#8ed0c6',2)}
 box(172,958,45,9);
 // Warm lamp glow, restrained shadows and paper-like grade add depth to flat art.
 g.restore();g.setTransform(1,0,0,1,0,0);
 const vign=g.createRadialGradient(360,610,250,360,640,800);vign.addColorStop(0,'#132f3500');vign.addColorStop(1,'#173d3520');rect(0,0,W,H,vign);
 rect(210,62,300,78,'#fff6e7dd',12);text('TALK TO SOCIETY',360,94,17,'#365e5b');text('THE COOKIE-JAR EFFECT',360,121,12,'#5a7770');
 // Only subtitles are screen-space overlays. No moving slides, chapter cards or cuts.
 const cap=captions.find(a=>t>=a[0]&&t<a[1]);if(cap){const lines=cap.slice(2);g.font='600 27px system-ui';const max=Math.max(...lines.map(s=>g.measureText(s).width));rect(360-max/2-21,1080,max+42,lines.length*38+22,'#203b3bf0',14);lines.forEach((s,i)=>text(s,360,1118+i*38,27,cream))}
 text('A full life. Not mind games.',360,1218,16,'#365e5b');
 window.currentTime=t;
}
window.setT=setT;window.renderSafe=true;window.duration=30;
const audio=new Audio('/demo/stickworld-scarcity-30s.mp3');let playing=false,anchor=0,started=0;
const play=document.querySelector('#play'),seek=document.querySelector('#seek');
function stop(){playing=false;audio.pause();play.textContent='▶ Play'}
play.onclick=async()=>{if(playing){stop();return}if(window.currentTime>=29.99)setT(0);audio.currentTime=window.currentTime;try{await audio.play()}catch(e){console.warn('Audio unavailable',e)}anchor=window.currentTime;started=performance.now();playing=true;play.textContent='❚❚ Pause'};
seek.oninput=()=>{stop();setT(Number(seek.value));audio.currentTime=Number(seek.value)};
function tick(now){if(playing){const t=Math.min(30,anchor+(now-started)/1000);setT(t);seek.value=t;document.querySelector('#time').textContent=`0:${String(Math.floor(t)).padStart(2,'0')}`;if(t>=30)stop()}requestAnimationFrame(tick)}
setT(0);requestAnimationFrame(tick);
