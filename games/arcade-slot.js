(()=>{'use strict';
const C=window.CasinoCore,$=id=>document.getElementById(id),isDiamond=document.body.dataset.game==='diamond';
const SYM=isDiamond?[
{id:'diamond',glyph:'💎',weight:15,pay:[5,15,55]}, {id:'star',glyph:'⭐',weight:5,pay:[8,25,100],wild:true},
{id:'crown',glyph:'👑',weight:12,pay:[5,12,45]},{id:'ruby',glyph:'❤️',weight:17,pay:[4,10,30]},
{id:'orb',glyph:'🔮',weight:14,pay:[3,8,24]},{id:'moon',glyph:'🌙',weight:18,pay:[3,6,19]},
{id:'seven',glyph:'7',weight:15,pay:[5,13,40]},{id:'scatter',glyph:'✨',weight:4,scatter:true}]:[
{id:'seven',glyph:'7',weight:8,pay:[120]}, {id:'cherry',glyph:'🍒',weight:21,pay:[8]},
{id:'bell',glyph:'🔔',weight:15,pay:[18]},{id:'lemon',glyph:'🍋',weight:20,pay:[6]},
{id:'diamond',glyph:'💎',weight:12,pay:[30]},{id:'bar',glyph:'BAR',weight:14,pay:[20]},
{id:'star',glyph:'⭐',weight:6,pay:[40]},{id:'orange',glyph:'🍊',weight:19,pay:[7]}];
const N=isDiamond?5:3;
const LINES=isDiamond?[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]]:[[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];
let bet=250,creditsPrize=0,spins=0,running=false,autoCount=0,autoStop=false,freeSpins=0,board=Array.from({length:N},()=>Array.from({length:3},()=>C.weighted(SYM)));
const sleep=C.wait;
function el(id){return document.createElement(id)}
function symHtml(id){const s=SYM.find(x=>x.id===id);return '<span class="glyph '+(/^(7|BAR)$/.test(s.glyph)?'text-glyph':'')+'">'+s.glyph+'</span><span class="glimmer"></span>'}
function draw(winners=[]){const high=new Set(winners.flat());$('reels').innerHTML=board.map((col,i)=>'<div class="reel" data-col="'+i+'">'+col.map((x,j)=>'<div class="symbol'+(high.has(i*3+j)?' highlight':'')+'" aria-label="'+x+'">'+symHtml(x)+'</div>').join('')+'</div>').join('')}
function setStatus(s,kind=''){$('message').textContent=s;$('message').className='status '+kind}
function updateUI(){const w=C.wallet();$('balance').textContent=C.money(w.credit);$('prize').textContent=C.money(creditsPrize);$('count').textContent=String(spins);$('bet').textContent=C.money(bet);
$('spin').disabled=running||(freeSpins===0&&w.credit<bet);$('spin').textContent=running?'GIRANDO…':freeSpins>0?'🎁 GIRO GRATIS':'▶ GIRAR';
$('autoButton').textContent=autoCount>0?'■ DETENER AUTO':'⏵ AUTO JUGAR';$('autoButton').disabled=running&&autoCount===0;
$('autoSelect').disabled=running||autoCount>0;document.querySelectorAll('[data-bet]').forEach(b=>{b.disabled=running||autoCount>0||freeSpins>0;b.setAttribute('aria-pressed',String(+b.dataset.bet===bet))});
$('bonus').textContent=freeSpins>0?'✨ Tienes '+freeSpins+' giros gratis restantes':'';
$('autoRemaining').textContent=autoCount>0?'Restan '+autoCount+' giros':'Modo manual';}
function evaluate(){let reward=0;const winners=[];for(let i=0;i<LINES.length;i++){
 const path=LINES[i];let best=0,bestN=0;
 for(const s of SYM.filter(x=>!x.scatter)){
 let n=0;for(let col=0;col<N;col++){const id=board[col][path[col]];if(id===s.id||(isDiamond&&id==='star'&&!s.scatter))n++;else break;}
 const payIdx=n-3;if(n>=3&&payIdx>=0&&s.pay[payIdx]!=null){const value=(bet/LINES.length)*s.pay[payIdx];if(value>best){best=value;bestN=n}}
 }
 if(bestN){reward+=Math.round(best);winners.push(path.slice(0,bestN).map((row,col)=>col*3+row))}}
 if(isDiamond){const scatter=[];board.forEach((col,x)=>col.forEach((s,y)=>{if(s==='scatter')scatter.push(x*3+y)}));if(scatter.length>=3){freeSpins+=5;winners.push(scatter);setStatus('✨ ¡Bono de 5 giros gratis!', 'win')}}
 return {reward:Math.round(reward),winners};}
async function oneSpin(){if(running)return false;if(freeSpins===0 && C.wallet().credit<bet){setStatus('No tienes créditos suficientes. Vuelve al lobby para añadir créditos demo.','error');autoCount=0;updateUI();return false}
 const free=freeSpins>0;if(free)freeSpins--;else if(!C.updateWallet(-bet,1)){setStatus('No fue posible registrar la apuesta de prueba.','error');return false}
 running=true;creditsPrize=0;spins++;setStatus(free?'✨ Girando bono gratis…':'Los rodillos están girando…');C.playSound('spin');updateUI();
 const reels=[...document.querySelectorAll('.reel')];reels.forEach(r=>r.classList.add('rolling'));
 let next=Array.from({length:N},()=>Array.from({length:3},()=>C.weighted(SYM)));
 // Simulate movement continuously, and stop the columns in staggered order.
 const finished=Array(N).fill(false);
 const frames=setInterval(()=>{reels.forEach((r,i)=>{if(finished[i])return;r.innerHTML=Array.from({length:3},()=>'<div class="symbol">'+symHtml(C.weighted(SYM))+'</div>').join('')})},75);
 for(let i=0;i<N;i++){
   await sleep(i===0?560:220);
   finished[i]=true;
   board[i]=next[i];
   reels[i].classList.remove('rolling');
   reels[i].innerHTML=next[i].map(s=>'<div class="symbol">'+symHtml(s)+'</div>').join('');
   C.playSound('stop');
 }
 clearInterval(frames);
 const {reward,winners}=evaluate();creditsPrize=reward;
 if(reward){const r=C.updateWallet(reward);if(r){C.playSound('win');setStatus('¡Premio de '+C.money(reward)+' créditos ficticios!', 'win')}else setStatus('No se pudo guardar el premio de prueba.','error')}
 else if(freeSpins>0)$('message').textContent='Bono: prepara tu siguiente giro gratis';
 else if(!$('message').classList.contains('win'))setStatus('Inténtalo otra vez · ¡Buena suerte!');
 draw(winners);running=false;updateUI();return true;
}
async function startAuto(){if(autoCount>0){autoStop=true;setStatus('El autojuego se detendrá al completar este giro.');return}
if(running)return;autoStop=false;autoCount=Number($('autoSelect').value)||5;updateUI();
while(autoCount>0&&!autoStop){const ok=await oneSpin();if(!ok)break;if(freeSpins===0)autoCount--;if(!autoStop&&autoCount>0)await sleep(450)}
autoCount=0;autoStop=false;updateUI();if(!$('message').classList.contains('win'))setStatus('Giro automático finalizado.');}
$('spin').addEventListener('click',()=>{if(!running&&autoCount===0)oneSpin()});
$('autoButton').addEventListener('click',startAuto);
document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>{if(running||autoCount>0||freeSpins>0)return;bet=Number(b.dataset.bet);C.playSound('tap');updateUI()}));
window.addEventListener('pageshow',updateUI);window.addEventListener('storage',updateUI);
draw();updateUI();
})();