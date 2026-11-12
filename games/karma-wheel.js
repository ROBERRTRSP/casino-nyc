/* Casino NYC: rueda independiente basada en el orden europeo y la trayectoria del proyecto KARMA.
 * Sin APIs, autenticación, cuentas o servidor de KARMA. Solo presentación recreativa. */
(()=>{'use strict';
const POCKETS=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const TAU=Math.PI*2,SPIN_MS=10000,DROP=0.56;
const color=n=>n===0?'green':REDS.has(n)?'red':'black';
const indexOf=n=>POCKETS.indexOf(n);
const clamp=v=>Math.max(0,Math.min(1,v));
const centerOf=n=>(indexOf(n)+.5)*TAU/37;
function decay(t,k){return (1-Math.exp(-k*t))/(1-Math.exp(-k));}
function decayRate(t,k){return k*Math.exp(-k*t)/(1-Math.exp(-k));}
function hermite(u,p0,p1,m0,m1){return (2*u**3-3*u*u+1)*p0+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*p1+(u**3-u*u)*m1;}
function wheelProgress(t,d){const total=5.5*TAU,endVel=.16*d/1000,curved=total-endVel;return {angle:curved*decay(t,2.25)+endVel*t,vel:curved*decayRate(t,2.25)+endVel};}
function sampleSpin(pocket,elapsed,d=SPIN_MS,drop=DROP){const t=clamp(elapsed/d),wheel=wheelProgress(t,d),center=centerOf(pocket);if(t<=drop){const u=t/drop,wobble=u>.72?((u-.72)/.28)**2*.035:0;return {wheelAngle:wheel.angle,ballAngle:-10.5*TAU*decay(u,1.55),radial:1-wobble,hop:0,energy:1-u*.48};}
 const span=1-drop,u=(t-drop)/span,cruiseEnd=-10.5*TAU*decay(1,1.55),wheelEnd=wheelProgress(1,d);let aim=wheelEnd.angle+center;while(aim>cruiseEnd-1.25*TAU)aim-=TAU;
 const m0=(-10.5*TAU*decayRate(1,1.55)/drop)*span,m1=wheelEnd.vel*span,impact=Math.sin(Math.PI*u)*(1-u)**1.6;
 const jostle=Math.sin(u*Math.PI*6.5)*impact*.11,hopWave=Math.abs(Math.sin(u*Math.PI*3.5))*(1-u)**1.75*Math.sin(Math.PI*Math.min(1,u*1.4));
 return {wheelAngle:wheel.angle,ballAngle:hermite(u,cruiseEnd,aim,m0,m1)+jostle,radial:clamp((1-u)**1.85*.965+hopWave*.09*(u<.75?1:.35)),hop:hopWave*.14,energy:(1-u)**1.4*.52+hopWave*.2};
}
function spinPose(pocket,elapsed,d=SPIN_MS){if(elapsed<d)return sampleSpin(pocket,Math.max(0,elapsed),d);const angle=wheelProgress(1,d).angle+(elapsed-d)/1000*.16;return {wheelAngle:angle,ballAngle:angle+centerOf(pocket),radial:0,hop:0,energy:.03};}
const HIGHLIGHT=['#f4d88d','#b7822c','#40220f'];
class KarmaWheel{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.spin=null;this.rest=0;this.lastEnd=0;this.lastBase=0;this.onEnd=null;this.alive=true;this.resize=this.resize.bind(this);this.resize();this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas.parentElement);this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);}
 resize(){const box=this.canvas.parentElement.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.min(620,Math.max(160,box.width)),h=Math.max(160,Math.min(460,box.height||w*.78));this.dpr=dpr;this.w=w;this.h=h;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);}
 start(pocket,onEnd){if(!Number.isInteger(pocket)||pocket<0||pocket>36||this.spin)return false;this.spin={pocket,start:performance.now(),base:this.lastBase,done:false,duration:SPIN_MS};this.onEnd=onEnd;return true;}
 drawRing(r0,r1,a0,a1,fill){const c=this.ctx;c.beginPath();c.arc(0,0,r1,a0,a1);c.arc(0,0,r0,a1,a0,true);c.closePath();c.fillStyle=fill;c.fill();}
 disc(r,fill,stroke,line=1){const c=this.ctx;c.beginPath();c.arc(0,0,r,0,TAU);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=line;c.strokeStyle=stroke;c.stroke();}}
 frame(now){if(!this.alive)return;const c=this.ctx,w=this.w,h=this.h;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);const R=Math.min(w*.46,h*.57),cx=w/2,cy=h*.53;
 let p,pocket=null,spin=this.spin;
 if(spin){const elapsed=now-spin.start;p=spinPose(spin.pocket,elapsed,spin.duration);p.wheelAngle+=spin.base;p.ballAngle+=spin.base;pocket=elapsed>=spin.duration?spin.pocket:null;if(pocket!==null&&!spin.done){spin.done=true;this.rest=pocket;this.lastBase=p.wheelAngle;this.lastEnd=now;const cb=this.onEnd;this.onEnd=null;this.spin=null;queueMicrotask(()=>cb?.(pocket));}}
 else {const angle=this.lastBase+(now-this.lastEnd)*.00016;p={wheelAngle:angle,ballAngle:angle+centerOf(this.rest),radial:0,hop:0,energy:.02};}
 // Wooden rim and glossy bowl: perspective projection, matching the colors/order from KARMA.
 c.save();c.translate(cx,cy+R*.12);c.scale(1,.83);
 c.shadowColor='#000';c.shadowBlur=34;c.shadowOffsetY=18;this.disc(R*.99,'#21110c','#d9b465',R*.035);c.shadowBlur=0;c.shadowOffsetY=0;
 let wood=c.createRadialGradient(-R*.3,-R*.28,R*.05,0,0,R);wood.addColorStop(0,'#bd7139');wood.addColorStop(.35,'#784124');wood.addColorStop(.7,'#2e1913');wood.addColorStop(.89,'#1c110d');wood.addColorStop(1,'#9a522c');this.disc(R*.95,wood,'#f6d38b',R*.026);
 this.disc(R*.88,'#21100f','#edc777',R*.024);this.disc(R*.83,'#13110d','#5e3621',R*.015);
 c.save();c.rotate(p.wheelAngle);
 for(let i=0;i<37;i++){const n=POCKETS[i],a=-Math.PI/2+i*TAU/37,b=a+TAU/37;
  const col=color(n)==='red'?'#a92927':color(n)==='black'?'#151818':'#14713d';
  this.drawRing(R*.60,R*.81,a+.006,b-.006,col);
  this.drawRing(R*.51,R*.59,a+.006,b-.006,color(n)==='red'?'#681f1b':color(n)==='black'?'#0a0b0a':'#0b4e2a');
  c.save();c.rotate((i+.5)*TAU/37);c.translate(0,-R*.707);c.fillStyle='#fff5d7';c.font=`800 ${Math.max(9,R*.072)}px Georgia, serif`;c.textBaseline='middle';c.textAlign='center';c.shadowColor='#000';c.shadowBlur=3;c.fillText(String(n),0,0);c.shadowBlur=0;c.restore();
 }
 this.disc(R*.58,'#5b331a','#d5a45c',R*.021);
 const cone=c.createRadialGradient(-R*.15,-R*.15,R*.02,0,0,R*.55);cone.addColorStop(0,'#fedba0');cone.addColorStop(.28,'#b47c45');cone.addColorStop(.6,'#542d1b');cone.addColorStop(.85,'#331c14');cone.addColorStop(1,'#d2a45f');this.disc(R*.54,cone,'#ffe0a1',R*.018);
 for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.fillStyle='#d8b06a';c.fillRect(-R*.02,-R*.32,R*.04,R*.31);c.restore();}
 this.disc(R*.14,'#5f391d','#ecc676',R*.025);this.disc(R*.074,'#f5d897','#5a381e',R*.02);
 c.restore();
 c.save();c.rotate(-.20);c.strokeStyle='#fff1b65c';c.lineWidth=R*.014;c.beginPath();c.arc(0,0,R*.902,-2.1,-.7);c.stroke();c.restore();
 // KARMA spin math: ball travels anti-clockwise, falls and lands in the chosen pocket.
 const r=R*(.876-(.876-.70)*(1-p.radial));const a=p.ballAngle;const bx=Math.sin(a)*r,by=-Math.cos(a)*r;
 const br=Math.max(5,R*.037);c.fillStyle='#000a';c.beginPath();c.ellipse(bx+3,by+5,br*1.25,br*.8,0,0,TAU);c.fill();
 const ball=c.createRadialGradient(bx-br*.4,by-br*.45,1,bx,by,br);ball.addColorStop(0,'#fff');ball.addColorStop(.42,'#f2f4fa');ball.addColorStop(.72,'#a7b1c4');ball.addColorStop(1,'#4a5265');c.shadowColor='#faffff';c.shadowBlur=10;c.beginPath();c.arc(bx,by-p.hop*R,br,0,TAU);c.fillStyle=ball;c.fill();c.shadowBlur=0;c.restore();
 // fixed upper indicator outside wheel
 c.font=`900 ${Math.max(16,R*.13)}px Arial`;c.textAlign='center';c.fillStyle='#fbe59d';c.shadowColor='#e4a83e';c.shadowBlur=12;c.fillText('▼',cx,cy-R*.72);c.shadowBlur=0;
 this.raf=requestAnimationFrame(this.frame);
 }
 destroy(){this.alive=false;cancelAnimationFrame(this.raf);this.observer.disconnect();}
}
const api={KarmaWheel,POCKETS,REDS,color,spinPose,sampleSpin,SPIN_MS,mode:'canvas2d'};
window.__KarmaWheel2D=api;
window.CasinoKarmaWheel=api;
})();
