(()=>{'use strict';
const C=window.CasinoCore,$=id=>document.getElementById(id),isDiamond=document.body.dataset.game==='diamond';
const SYM=isDiamond?[
{id:'diamond',glyph:'💎',weight:15,pay:[5,15,55]}, {id:'star',glyph:'⭐',weight:5,pay:[8,25,100],wild:true},
{id:'crown',glyph:'👑',weight:12,pay:[5,12,45]},{id:'ruby',glyph:'❤️',weight:17,pay:[4,10,30]},
{id:'orb',glyph:'🔮',weight:14,pay:[3,8,24]},{id:'moon',glyph:'🌙',weight:18,pay:[3,6,19]},
{id:'seven',glyph:'7',weight:15,pay:[5,13,40]},{id:'scatter',glyph:'✨',weight:4,scatter:true}]:[
{id:'seven',glyph:'7',weight:8,pay:[120]},{id:'cherry',glyph:'🍒',weight:21,pay:[8]},
{id:'bell',glyph:'🔔',weight:15,pay:[18]},{id:'lemon',glyph:'🍋',weight:20,pay:[6]},
{id:'diamond',glyph:'💎',weight:12,pay:[30]},{id:'bar',glyph:'BAR',weight:14,pay:[20]},
{id:'star',glyph:'⭐',weight:6,pay:[40]},{id:'orange',glyph:'🍊',weight:19,pay:[7]}];
const N=isDiamond?5:3;
const LINES=isDiamond?[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]]:[[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];
const KEY='casino_nyc_'+(isDiamond?'diamond':'fortuna')+'_state';
function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&typeof x==='object'?x:{}}catch{return {}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({bet,freeSpins,spins,history}))}catch{}}
const stored=read();let bet=[250,500,750,1000].includes(stored.bet)?stored.bet:250;
let creditsPrize=0,spins=Number.isSafeInteger(stored.spins)&&stored.spins>=0?stored.spins:0,running=false,autoCount=0,autoStop=false,freeSpins=isDiamond&&Number.isInteger(stored.freeSpins)?Math.max(0,Math.min(100,stored.freeSpins)):0,board=Array.from({length:N},()=>Array.from({length:3},()=>C.weighted(SYM)));
let history=Array.isArray(stored.history)?stored.history.slice(0,5):[];
const sleep=C.wait;
const symbol=s=>SYM.find(x=>x.id===s)||SYM[0];
function symHtml(id){const s=symbol(id);return '<span class="glyph graphic graphic-'+s.id+'" aria-hidden="true"></span><span class="glimmer"></span>'}
function cellHtml(id,highlight=false){return '<div class="symbol'+(highlight?' highlight':'')+'" aria-label="'+symbol(id).id+'">'+symHtml(id)+'</div>'}
function draw(winners=[]){const high=new Set(winners.flat());$('reels').innerHTML=board.map((col,i)=>'<div class="reel" data-col="'+i+'">'+col.map((x,j)=>cellHtml(x,high.has(i*3+j))).join('')+'</div>').join('')}
function setStatus(s,kind=''){$('message').textContent=s;$('message').className='status '+kind}
const WIN_LINES=[
  '¡BRILLANTE! · LOS DIAMANTES PAGAN',
  '¡COMBINACIÓN GANADORA!',
  '¡LAS ESTRELLAS TE SONRÍEN!',
];
const LOSE_LINES=[
  'SIN PREMIO ESTA VEZ',
  'LA MÁQUINA SE QUEDA CON TODO',
  'PRUEBA OTRA COMBINACIÓN',
];
const BONUS_LINES=[
  '¡BONO DE ESTRELLAS!',
  '¡GIROS GRATIS DESBLOQUEADOS!',
  '¡SCATTER EN LLAMAS!',
];
let fxTimer=0;
function clearOutcomeFx(){
  const fx=document.getElementById('slotFx');
  if(fx)fx.remove();
  document.querySelector('.stage')?.classList.remove('is-slot-win','is-slot-lose','is-slot-bonus');
  if(fxTimer){clearTimeout(fxTimer);fxTimer=0}
}
function showOutcomeFx(kind,amountText,detail){
  clearOutcomeFx();
  const stage=document.querySelector('.stage');
  if(stage)stage.classList.add(kind==='win'?'is-slot-win':kind==='bonus'?'is-slot-bonus':'is-slot-lose');
  const lines=kind==='win'?WIN_LINES:kind==='bonus'?BONUS_LINES:LOSE_LINES;
  const kicker=lines[Math.floor(Math.random()*lines.length)];
  const title=kind==='win'?'¡GANASTE!':kind==='bonus'?'¡BONO!':'SIN PREMIO';
  const icon=kind==='win'?'💎':kind==='bonus'?'✨':'🌑';
  const coins=kind==='lose'?'':`<span class="slot-fx-coins" aria-hidden="true">${Array.from({length:18},()=>'<i></i>').join('')}</span>`;
  const fx=document.createElement('div');
  fx.id='slotFx';
  fx.className='slot-fx is-'+kind;
  fx.setAttribute('role','status');
  fx.innerHTML=`
    <div class="slot-fx-flash"></div>
    <div class="slot-fx-rays"></div>
    <div class="slot-fx-shock"></div>
    ${coins}
    <div class="slot-fx-stamp">
      <span class="slot-fx-icon">${icon}</span>
      <span class="slot-fx-kicker">${kicker}</span>
      <strong>${title}</strong>
      <em>${detail||amountText||''}</em>
    </div>`;
  document.body.appendChild(fx);
  fxTimer=window.setTimeout(clearOutcomeFx,2800);
}
function record(outcome){history.unshift(outcome);history=history.slice(0,5);const el=$('slotHistory');if(el)el.textContent=history.map(e=>e).join('  ·  ');save()}
function updateUI(){const w=C.wallet();$('balance').textContent=C.money(w.credit);$('prize').textContent=C.money(creditsPrize);$('count').textContent=String(spins);$('bet').textContent=C.money(bet);
$('spin').disabled=running||autoCount>0||(freeSpins===0&&w.credit<bet);$('spin').textContent=running?'GIRANDO…':freeSpins>0?'🎁 GIRO GRATIS':'▶ GIRAR';
$('autoButton').textContent=autoCount>0?'■ DETENER AUTO':'⏵ AUTO JUGAR';$('autoButton').disabled=running&&autoCount===0;
$('autoSelect').disabled=running||autoCount>0;document.querySelectorAll('[data-bet]').forEach(b=>{b.disabled=running||autoCount>0||freeSpins>0;b.setAttribute('aria-pressed',String(+b.dataset.bet===bet))});
$('bonus').textContent=freeSpins>0?'✨ '+freeSpins+' giro'+(freeSpins===1?'':'s')+' gratis restante'+(freeSpins===1?'':'s'):'';
$('autoRemaining').textContent=autoCount>0?'Restan '+autoCount+' giros':'Modo manual';}
function evaluate(){let reward=0;const winners=[];
for(const path of LINES){let bestValue=0,bestN=0;
 for(const s of SYM.filter(s=>!s.scatter)){
  let n=0;for(let col=0;col<N;col++){const id=board[col][path[col]];if(id===s.id||(isDiamond&&id==='star'&&s.id!=='scatter'))n++;else break}
  if(n>=3&&s.pay[n-3]!=null){const value=Math.round((bet/LINES.length)*s.pay[n-3]);if(value>bestValue){bestValue=value;bestN=n}}
 }if(bestN){reward+=bestValue;winners.push(path.slice(0,bestN).map((y,x)=>x*3+y))}}
let scatterCount=0;if(isDiamond){const scatter=[];board.forEach((col,x)=>col.forEach((s,y)=>{if(s==='scatter')scatter.push(x*3+y)}));scatterCount=scatter.length;if(scatter.length>=3){freeSpins=Math.min(100,freeSpins+5);winners.push(scatter)}}
return {reward,winners,scatterCount}}
function measureReel(node){
 const first=node.querySelector('.symbol');
 const height=Math.max(48,Math.round((first?.getBoundingClientRect().height||70)*100)/100);
 const gapParsed=Number.parseFloat(getComputedStyle(node).rowGap);
 const gap=Number.isFinite(gapParsed)?gapParsed:3;
 return {height,gap,row:height+gap,viewport:height*3+gap*2};
}
/** Giro real: la cinta se desplaza de forma visible (aceleración → lineal → frenada). */
function animateColumn(node,start,target,index){return new Promise(resolve=>{
 const {height,gap,row,viewport}=measureReel(node);
 // En Safari iOS evitamos Web Animations sobre cintas largas con imágenes:
 // sus capas pueden no repintarse aunque el giro se complete.
 const mobile=window.matchMedia('(max-width: 900px)').matches ||
   /iPhone|iPad|iPod/.test(navigator.userAgent) ||
   (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const fillers=mobile?14+index*3:28+index*8;
 const all=[...start,...Array.from({length:fillers},()=>C.weighted(SYM)),...target];
 const strip=document.createElement('div');
 strip.className='reel-tape';
 strip.innerHTML=all.map(id=>cellHtml(id)).join('');
 const distance=(3+fillers)*row;
 node.classList.add('reel-motion');
 node.style.height=viewport+'px';
 node.style.maxHeight=viewport+'px';
 node.style.minHeight=viewport+'px';
 node.style.overflow='hidden';
 node.style.setProperty('--slot-row-h',height+'px');
 node.style.setProperty('--slot-row-gap',gap+'px');
 node.replaceChildren(strip);
 const duration=mobile?1550+index*280:1600+index*320;
 let settled=false,frame=0,backup=0;
 function finish(){
  if(settled)return;
  settled=true;
  cancelAnimationFrame(frame);
  clearTimeout(backup);
  node.classList.remove('reel-motion');
  node.style.height='';
  node.style.maxHeight='';
  node.style.minHeight='';
  node.style.overflow='';
  node.style.removeProperty('--slot-row-h');
  node.style.removeProperty('--slot-row-gap');
  node.innerHTML=target.map(id=>cellHtml(id)).join('');
  node.classList.add('reel-landed');
  window.setTimeout(()=>node.classList.remove('reel-landed'),200);
  C.playSound('stop');
  resolve();
 }
 // Movimiento manual en móvil: cada frame cambia de verdad el desplazamiento
 // vertical, sin depender del compositor WAAPI de Safari.
 if(mobile){
  let started=null;
  const total=0.735; // área de velocidad: aceleración + crucero + frenada
  const animateFrame=(now)=>{
   if(settled)return;
   if(started===null)started=now;
   const t=Math.min(1,Math.max(0,(now-started)/duration));
   let progress;
   if(t<0.16)progress=(t*t/(2*0.16))/total;
   else if(t<0.68)progress=(0.08+(t-0.16))/total;
   else if(t<0.95){
    const u=t-0.68;
    progress=(0.60+u-u*u/(2*0.27))/total;
   }else progress=1;
   let y=distance*Math.min(1,progress);
   if(t>=0.95){
    const u=(t-0.95)/0.05;
    y+=Math.sin(u*Math.PI*2)*(1-u)*row*0.10;
   }
   strip.style.transform='translate3d(0,'+(-y.toFixed(2))+'px,0)';
   if(t<1)frame=requestAnimationFrame(animateFrame);
   else finish();
  };
  strip.style.transform='translate3d(0,0,0)';
  frame=requestAnimationFrame(animateFrame);
  backup=window.setTimeout(finish,duration+500);
  return;
 }
 // En PC conservamos la animación que ya funciona.
 const frames=[
  {transform:'translate3d(0,0,0)',offset:0},
  {transform:'translate3d(0,'+(-row*2)+'px,0)',offset:0.08},
  {transform:'translate3d(0,'+(-(distance-row*4))+'px,0)',offset:0.72},
  {transform:'translate3d(0,'+(-(distance+row*0.18))+'px,0)',offset:0.9},
  {transform:'translate3d(0,'+(-distance)+'px,0)',offset:1}
 ];
 try{
  if(typeof strip.animate==='function'){
   const anim=strip.animate(frames,{duration,easing:'linear',fill:'forwards'});
   anim.onfinish=()=>{try{anim.cancel()}catch{};finish()};
   anim.oncancel=finish;
   backup=window.setTimeout(finish,duration+150);
   return;
  }
 }catch{}
 strip.style.transform='translate3d(0,0,0)';
 void strip.offsetHeight;
 strip.style.transition='transform '+duration+'ms cubic-bezier(0.15, 0.05, 0.1, 1)';
 frame=requestAnimationFrame(()=>{strip.style.transform='translate3d(0,-'+distance+'px,0)'});
 backup=window.setTimeout(finish,duration+150);
})}
async function oneSpin(){if(running)return false;
 clearOutcomeFx();
 if(!freeSpins&&C.wallet().credit<bet){setStatus('Créditos demo insuficientes. Añade créditos desde el lobby.','error');autoStop=true;return false}
 const free=freeSpins>0;if(free){freeSpins--;save()}else if(!C.updateWallet(-bet,1)){setStatus('No se pudo registrar la apuesta de prueba.','error');return false}
 const inAuto=autoCount>0;
 running=true;creditsPrize=0;spins++;setStatus(free?'✨ Girando bono gratis…':'Los rodillos están girando…');C.playSound('spin');draw();updateUI();
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const next=Array.from({length:N},()=>Array.from({length:3},()=>C.weighted(SYM)));
 await Promise.all([...document.querySelectorAll('.reel')].map((r,i)=>animateColumn(r,board[i],next[i],i)));
 board=next;const {reward,winners,scatterCount}=evaluate();creditsPrize=reward;
 if(reward){
  if(C.updateWallet(reward)){
   C.playSound('win');
   setStatus('¡Ganaste '+C.money(reward)+' créditos ficticios!', 'win');
   showOutcomeFx(scatterCount>=3?'bonus':'win', C.money(reward), scatterCount>=3?'+'+C.money(reward)+' · 5 giros gratis':'+'+C.money(reward)+' créditos');
  }else setStatus('No se pudo guardar el premio demo.','error');
 }
 else if(scatterCount>=3){
  setStatus('✨ ¡BONO DE 5 GIROS GRATIS!','win');
  showOutcomeFx('bonus','','5 giros gratis desbloqueados');
  C.playSound('win');
 }
 else if(freeSpins>0){
  setStatus('Giro gratis terminado · Puedes continuar.');
  if(!inAuto) showOutcomeFx('lose','','Sin premio en este giro gratis');
 }
 else {
  setStatus('Giro terminado. Prueba otra combinación.');
  if(!inAuto) showOutcomeFx('lose','','Sin premio · Sigue girando');
 }
 draw(winners);record((reward?'+'+C.money(reward):'0.00')+(free?' 🎁':''));running=false;save();updateUI();return true;
}
async function startAuto(){if(autoCount>0){autoStop=true;setStatus('El autojuego se detendrá después del giro actual.');return}if(running)return;
 autoStop=false;autoCount=Math.min(50,Math.max(1,Number($('autoSelect').value)||5));updateUI();
 while(autoCount>0&&!autoStop){const ok=await oneSpin();if(!ok)break;autoCount--;updateUI();if(!autoStop&&autoCount>0)await sleep(420)}
 autoCount=0;autoStop=false;updateUI();if(!$('message').classList.contains('win'))setStatus('Giro automático finalizado.');}
$('spin').addEventListener('click',()=>{if(!running&&!autoCount)void oneSpin()});$('autoButton').addEventListener('click',()=>void startAuto());
document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>{if(running||autoCount||freeSpins)return;bet=Number(b.dataset.bet);C.playSound('tap');save();updateUI()}));
// Tabla de pagos realmente usada por los símbolos y por la función evaluate.
const paylist=$('paylist');if(paylist){paylist.innerHTML=SYM.filter(s=>!s.scatter).map(s=>'<div><span class="symbol pay-symbol"><span class="glyph graphic graphic-'+s.id+'" aria-hidden="true"></span></span><b>'+s.id.toUpperCase()+'</b><div>'+(isDiamond?'3: '+(s.pay[0]??'–')+'x · 4: '+(s.pay[1]??'–')+'x · 5: '+(s.pay[2]??'–')+'x':'3: '+s.pay[0]+'x')+'</div></div>').join('');}
window.addEventListener('pageshow',updateUI);window.addEventListener('storage',updateUI);draw();updateUI();if($('slotHistory'))$('slotHistory').textContent=history.length?'Últimos: '+history.join(' · '):'Últimos giros: sin historial';
window.__casinoSlotTest={evaluate,getState:()=>({freeSpins,spins,bet,board,autoCount}),setBoard:next=>{board=next;draw()},showOutcomeFx,clearOutcomeFx};
window.showOutcomeFx=showOutcomeFx;
})();
