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
function animateColumn(node,start,target,index){return new Promise(resolve=>{
 const first=node.querySelector('.symbol'),height=first?.getBoundingClientRect().height||70,gap=parseFloat(getComputedStyle(node).rowGap)||3;
 const fillers=17+index*5,all=[...start,...Array.from({length:fillers},()=>C.weighted(SYM)),...target];
 const strip=document.createElement('div');strip.className='reel-tape';strip.innerHTML=all.map(id=>cellHtml(id)).join('');
 const row=height+gap;node.classList.add('reel-motion');node.style.height=(row*3-gap)+'px';node.style.setProperty('--slot-row-h',height+'px');node.style.setProperty('--slot-row-gap',gap+'px');node.replaceChildren(strip);
 const duration=850+index*310;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  strip.style.transition='transform '+duration+'ms cubic-bezier(.13,.66,.16,1)';strip.style.transform='translate3d(0,-'+(3+fillers)*row+'px,0)';
 }));
 setTimeout(()=>{node.classList.remove('reel-motion');node.style.height='';node.innerHTML=target.map(id=>cellHtml(id)).join('');C.playSound('stop');resolve()},duration+70);
 })}
async function oneSpin(){if(running)return false;
 if(!freeSpins&&C.wallet().credit<bet){setStatus('Créditos demo insuficientes. Añade créditos desde el lobby.','error');autoStop=true;return false}
 const free=freeSpins>0;if(free){freeSpins--;save()}else if(!C.updateWallet(-bet,1)){setStatus('No se pudo registrar la apuesta de prueba.','error');return false}
 running=true;creditsPrize=0;spins++;setStatus(free?'✨ Girando bono gratis…':'Los rodillos están girando…');C.playSound('spin');draw();updateUI();
 const next=Array.from({length:N},()=>Array.from({length:3},()=>C.weighted(SYM)));
 await Promise.all([...document.querySelectorAll('.reel')].map((r,i)=>animateColumn(r,board[i],next[i],i)));
 board=next;const {reward,winners,scatterCount}=evaluate();creditsPrize=reward;
 if(reward){if(C.updateWallet(reward)){C.playSound('win');setStatus('¡Ganaste '+C.money(reward)+' créditos ficticios!', 'win')}else setStatus('No se pudo guardar el premio demo.','error')}
 else if(scatterCount>=3)setStatus('✨ ¡BONO! Has obtenido 5 giros gratis.', 'win');
 else if(freeSpins>0)setStatus('Giro gratis terminado · Puedes continuar.');
 else setStatus('Giro terminado. Prueba otra combinación.');
 if(scatterCount>=3)setStatus('✨ ¡BONO DE 5 GIROS GRATIS!'+(reward?' Premio adicional '+C.money(reward):''),'win');
 draw(winners);record((reward?'+'+C.money(reward):'0.00')+(free?' 🎁':''));running=false;save();updateUI();return true;
}
async function startAuto(){if(autoCount>0){autoStop=true;setStatus('El autojuego se detendrá después del giro actual.');return}if(running)return;
 autoStop=false;autoCount=Math.min(50,Math.max(1,Number($('autoSelect').value)||5));updateUI();
 while(autoCount>0&&!autoStop){const ok=await oneSpin();if(!ok)break;autoCount--;updateUI();if(!autoStop&&autoCount>0)await sleep(380)}
 autoCount=0;autoStop=false;updateUI();if(!$('message').classList.contains('win'))setStatus('Giro automático finalizado.');}
$('spin').addEventListener('click',()=>{if(!running&&!autoCount)void oneSpin()});$('autoButton').addEventListener('click',()=>void startAuto());
document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>{if(running||autoCount||freeSpins)return;bet=Number(b.dataset.bet);C.playSound('tap');save();updateUI()}));
// Tabla de pagos realmente usada por los símbolos y por la función evaluate.
const paylist=$('paylist');if(paylist){paylist.innerHTML=SYM.filter(s=>!s.scatter).map(s=>'<div><span class="symbol pay-symbol"><span class="glyph graphic graphic-'+s.id+'" aria-hidden="true"></span></span><b>'+s.id.toUpperCase()+'</b><div>'+(isDiamond?'3: '+(s.pay[0]??'–')+'x · 4: '+(s.pay[1]??'–')+'x · 5: '+(s.pay[2]??'–')+'x':'3: '+s.pay[0]+'x')+'</div></div>').join('');}
window.addEventListener('pageshow',updateUI);window.addEventListener('storage',updateUI);draw();updateUI();if($('slotHistory'))$('slotHistory').textContent=history.length?'Últimos: '+history.join(' · '):'Últimos giros: sin historial';
window.__casinoSlotTest={evaluate,getState:()=>({freeSpins,spins,bet,board,autoCount}),setBoard:next=>{board=next;draw()}};
})();
