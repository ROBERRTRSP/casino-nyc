(()=>{'use strict';
const C=window.CasinoCore,$=id=>document.getElementById(id);
const wheelOrder=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const redSet=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const typeOf=n=>n===0?'green':redSet.has(n)?'red':'black';
let chip=50,bets=new Map(),busy=false,history=[],rotation=0,winning=0;
function label(key){const labels={red:'ROJO',black:'NEGRO',even:'PAR',odd:'IMPAR',low:'1–18',high:'19–36',dozen1:'1ª DOCENA',dozen2:'2ª DOCENA',dozen3:'3ª DOCENA'};return key.startsWith('n')?key.slice(1):labels[key]}
function total(){return [...bets.values()].reduce((a,v)=>a+v,0)}
function payoutFor(key,n){if(key[0]==='n')return Number(key.slice(1))===n?36:0;
 if(n===0)return 0;
 if(key==='red')return redSet.has(n)?2:0;if(key==='black')return redSet.has(n)?0:2;
 if(key==='even')return n%2===0?2:0;if(key==='odd')return n%2?2:0;
 if(key==='low')return n<=18?2:0;if(key==='high')return n>=19?2:0;
 if(key==='dozen1')return n<=12?3:0;if(key==='dozen2')return n>=13&&n<=24?3:0;if(key==='dozen3')return n>=25?3:0;return 0;}
function update(){const w=C.wallet();$('balance').textContent=C.money(w.credit);$('stake').textContent=C.money(total());$('betsCount').textContent=bets.size;
$('spin').disabled=busy||total()===0||w.credit<total();$('spin').textContent=busy?'GIRANDO…':'🎡 GIRAR RULETA';$('clear').disabled=busy||total()===0;
 document.querySelectorAll('[data-choice]').forEach(b=>{const amount=bets.get(b.dataset.choice)||0;b.classList.toggle('chosen',amount>0);b.setAttribute('aria-pressed',amount>0?'true':'false');const tag=b.querySelector('.bet-mark');if(tag)tag.remove();if(amount>0)b.insertAdjacentHTML('beforeend','<small class="bet-mark">'+C.money(amount)+'</small>');b.disabled=busy});
 document.querySelectorAll('[data-chip]').forEach(b=>{b.setAttribute('aria-pressed',String(chip===Number(b.dataset.chip)));b.disabled=busy});
 $('placedBets').textContent=total()===0?'Sin apuestas seleccionadas':[...bets.entries()].map(([k,v])=>label(k)+' '+C.money(v)).join(' · ');
}
function status(msg,type=''){$('message').textContent=msg;$('message').className='status '+type}
function addBet(key){if(busy)return;if(C.wallet().credit<total()+chip){status('No tienes créditos suficientes para añadir esa ficha.','error');return}bets.set(key,(bets.get(key)||0)+chip);C.playSound('tap');update();}
const grid=$('numberGrid');grid.innerHTML='<button class="zero" type="button" data-choice="n0">0</button>'+Array.from({length:36},(_,i)=>{const n=i+1;return '<button type="button" class="'+(redSet.has(n)?'red-bg':'black-bg')+'" data-choice="n'+n+'">'+n+'</button>'}).join('');
const wheel=$('wheel'),inner=wheel.querySelector('.wheel-inner');const step=360/37;
const colors=wheelOrder.map(n=>typeOf(n)==='red'?'#bc2539':typeOf(n)==='black'?'#1d2425':'#0a8050');
wheel.style.background='conic-gradient('+colors.map((col,i)=>col+' '+(i*step)+'deg '+((i+1)*step)+'deg').join(',')+')';
inner.innerHTML=wheelOrder.map((n,i)=>{const a=(i+.5)*step;return '<div class="wheel-num '+typeOf(n)+'" style="transform:rotate('+a+'deg) translateY(-'+(window.innerWidth<400?117:140)+'px) rotate(-'+a+'deg)" data-idx="'+i+'">'+n+'</div>'}).join('');
function reposition(){const radius=wheel.getBoundingClientRect().width*.39;inner.querySelectorAll('.wheel-num').forEach((node,i)=>{const a=(i+.5)*step;node.style.transform='rotate('+a+'deg) translateY(-'+radius+'px) rotate(-'+a+'deg)'})}
window.addEventListener('resize',reposition);reposition();
$('numberGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-choice]');if(btn)addBet(btn.dataset.choice)});
$('outside').addEventListener('click',e=>{const btn=e.target.closest('[data-choice]');if(btn)addBet(btn.dataset.choice)});
$('chips').addEventListener('click',e=>{const btn=e.target.closest('[data-chip]');if(btn&&!busy){chip=Number(btn.dataset.chip);update()}});
$('clear').addEventListener('click',()=>{if(!busy){bets.clear();update();status('Apuestas borradas. Elige nuevas casillas.')}});
$('spin').addEventListener('click',async()=>{
 if(busy||!total())return;const amount=total();if(!C.updateWallet(-amount,1)){status('Saldo insuficiente para esta apuesta de prueba.','error');update();return}
 busy=true;winning=0;update();status('La ruleta está girando…');C.playSound('spin');const num=C.randint(37);
 // Match the fixed top pointer to the chosen numbered pocket after several turns.
 const idx=wheelOrder.indexOf(num);const target=((360-(idx+.5)*step)%360+360)%360;
 const previous=((rotation%360)+360)%360;let jump=(target-previous+360)%360;
 rotation+=360*(4+C.randint(3))+jump;
 wheel.style.transform='rotate('+rotation+'deg)';
 // Ball appears to circle the opposite direction while the wheel decelerates.
 $('ball').style.transform='rotate(-'+(rotation*1.22)+'deg)';
 await C.wait(5100);
 let prize=0;for(const [key,value] of bets)prize+=value*payoutFor(key,num);
 if(prize){C.updateWallet(prize);C.playSound('win');status('¡Salió '+num+'! Premio de '+C.money(prize)+' créditos ficticios.','win')}
 else{status('Salió '+num+' · Esta vez no hubo premio.')}
 winning=prize;$('win').textContent=C.money(prize);$('resultNum').textContent=num;$('resultNum').className='number-result '+typeOf(num);
 history.unshift(num);history=history.slice(0,10);$('history').innerHTML=history.map(n=>'<span class="'+typeOf(n)+'">'+n+'</span>').join('');
 bets.clear();busy=false;update();
});
window.addEventListener('pageshow',update);window.addEventListener('storage',update);update();
})();