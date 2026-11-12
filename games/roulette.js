(()=>{'use strict';
const C=window.CasinoCore,$=id=>document.getElementById(id);
function pickWheelApi(){
  const prefer=window.__KarmaWheel3D;
  const fallback=window.__KarmaWheel2D||window.CasinoKarmaWheel;
  if(prefer){
    try{
      const probe=document.createElement('canvas');
      const gl=probe.getContext('webgl')||probe.getContext('experimental-webgl');
      if(gl){window.CasinoKarmaWheel=prefer;return prefer;}
    }catch{}
  }
  window.CasinoKarmaWheel=fallback;
  return fallback;
}
const K=pickWheelApi();
const redSet=K.REDS,color=K.color;
let chip=50,bets=new Map(),stack=[],previous=[],busy=false,history=read('casino_nyc_roulette_history',[]),last=0;
function read(k,def){try{const v=JSON.parse(localStorage.getItem(k));return v??def}catch{return def}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
let wheel;
try{wheel=new K.KarmaWheel($('karmaCanvas'));}
catch(err){
  console.warn('Fallo al montar la rueda preferida, usando Canvas 2D de KARMA.',err);
  const F=window.__KarmaWheel2D; if(!F) throw err;
  window.CasinoKarmaWheel=F; wheel=new F.KarmaWheel($('karmaCanvas'));
}
const labels={red:'ROJO',black:'NEGRO',even:'PAR',odd:'IMPAR',low:'1–18',high:'19–36',dozen1:'1ª DOCENA',dozen2:'2ª DOCENA',dozen3:'3ª DOCENA',col1:'1ª COLUMNA',col2:'2ª COLUMNA',col3:'3ª COLUMNA'};
const spotOptions={split:[],street:[],corner:[],line:[],trio:[],basket:[]};
const key=(kind,nums)=>`${kind}:${nums.slice().sort((a,b)=>a-b).join('-')}`;
function spot(kind,nums,odds,label){const id=key(kind,nums);spotOptions[kind].push({id,nums,odds,label});return id}
for(let col=0;col<11;col++)for(let row=1;row<=3;row++){const n=col*3+row;spot('split',[n,n+3],17,`${n} / ${n+3}`)}
for(let col=0;col<12;col++)for(let row=1;row<=2;row++){const n=col*3+row;spot('split',[n,n+1],17,`${n} / ${n+1}`)}
for(let n=1;n<=3;n++)spot('split',[0,n],17,`0 / ${n}`);
for(let col=0;col<12;col++){const a=col*3+1;spot('street',[a,a+1,a+2],11,`${a} / ${a+1} / ${a+2}`)}
for(let col=0;col<11;col++)for(let row=1;row<=2;row++){const a=col*3+row;spot('corner',[a,a+1,a+3,a+4],8,`${a}/${a+1}/${a+3}/${a+4}`)}
for(let col=0;col<11;col++){const a=col*3+1;spot('line',[a,a+1,a+2,a+3,a+4,a+5],5,`${a}–${a+5}`)}
spot('trio',[0,1,2],11,'0 / 1 / 2');spot('trio',[0,2,3],11,'0 / 2 / 3');spot('basket',[0,1,2,3],8,'0 / 1 / 2 / 3');
const specialMap=new Map(Object.values(spotOptions).flat().map(s=>[s.id,s]));
function label(id){return id.startsWith('n')?`Pleno ${id.slice(1)}`:labels[id]||specialMap.get(id)?.label||id}
function total(){return [...bets.values()].reduce((a,b)=>a+b,0)}
function payoutFor(id,pocket){const n=Number(pocket);if(/^n\d+$/.test(id))return +id.slice(1)===n?36:0;if(n===0&&labels[id])return 0;
 if(specialMap.has(id)){const v=specialMap.get(id);return v.nums.includes(n)?v.odds+1:0}
 if(id==='red')return redSet.has(n)?2:0;if(id==='black')return n>0&&!redSet.has(n)?2:0;
 if(id==='even')return n>0&&n%2===0?2:0;if(id==='odd')return n%2===1?2:0;
 if(id==='low')return n>=1&&n<=18?2:0;if(id==='high')return n>=19?2:0;
 if(id.startsWith('dozen'))return n>0&&Math.ceil(n/12)===+id.slice(5)?3:0;
 if(id.startsWith('col'))return n>0&&((n-1)%3+1)===+id.slice(3)?3:0;return 0}
function status(msg,kind=''){$('message').textContent=msg;$('message').className='status '+kind}
function renderHistory(){$('history').innerHTML=history.slice(0,10).map(n=>`<span class="${color(n)}">${n}</span>`).join('')}
function update(){const w=C.wallet();$('balance').textContent=C.money(w.credit);$('stake').textContent=C.money(total());$('betsCount').textContent=String(bets.size);$('win').textContent=C.money(last);
 $('spin').disabled=busy||!total()||w.credit<total();$('spin').textContent=busy?'LA BOLA ESTÁ GIRANDO…':'🎡 GIRAR RULETA';$('clear').disabled=busy||!total();$('undo').disabled=busy||!stack.length;$('repeat').disabled=busy||!previous.length||total()>0;
 $('specialType').disabled=busy;$('specialChoice').disabled=busy;$('specialAdd').disabled=busy;
 document.querySelectorAll('[data-choice]').forEach(el=>{const value=bets.get(el.dataset.choice)||0;el.classList.toggle('chosen',!!value);el.setAttribute('aria-pressed',String(!!value));el.disabled=busy;el.querySelector('.bet-mark')?.remove();if(value)el.insertAdjacentHTML('beforeend',`<small class="bet-mark">${C.money(value)}</small>`)});
 document.querySelectorAll('[data-chip]').forEach(el=>{el.disabled=busy;el.setAttribute('aria-pressed',String(chip===Number(el.dataset.chip)))});
 $('placedBets').textContent=total()?Array.from(bets).map(([id,value])=>`${label(id)}: ${C.money(value)}`).join(' · '):'Sin apuestas seleccionadas';
}
function addBet(id){if(busy)return;if(C.wallet().credit<total()+chip){status('No quedan créditos demo suficientes para esa ficha.','error');return}const amount=bets.get(id)||0;bets.set(id,amount+chip);stack.push({id,value:chip});C.playSound('tap');update()}
function populate(){const kind=$('specialType').value;const opts=spotOptions[kind]||[];$('specialChoice').innerHTML=opts.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
$('specialType').addEventListener('change',populate);populate();
$('specialAdd').addEventListener('click',()=>addBet($('specialChoice').value));
$('numberGrid').innerHTML='<button class="zero" type="button" data-choice="n0">0</button>'+Array.from({length:36},(_,i)=>{const n=i+1,col=Math.floor(i/3)+1,row=3-i%3;return `<button type="button" style="--mcol:${(n-1)%3+1};--mrow:${Math.floor((n-1)/3)+1};grid-column:${col};grid-row:${row}" class="${color(n)}-bg" data-choice="n${n}">${n}</button>`}).join('');
$('numberGrid').addEventListener('click',e=>{const el=e.target.closest('[data-choice]');if(el)addBet(el.dataset.choice)});
$('outside').addEventListener('click',e=>{const el=e.target.closest('[data-choice]');if(el)addBet(el.dataset.choice)});
$('chips').addEventListener('click',e=>{const el=e.target.closest('[data-chip]');if(el&&!busy){chip=Number(el.dataset.chip);C.playSound('tap');update()}});
$('undo').addEventListener('click',()=>{if(busy||!stack.length)return;const {id,value}=stack.pop(),next=(bets.get(id)||0)-value;if(next>0)bets.set(id,next);else bets.delete(id);update();status('Última ficha retirada.')});
$('clear').addEventListener('click',()=>{if(busy)return;bets.clear();stack=[];update();status('Mesa limpia. Coloca nuevas fichas.')});
$('repeat').addEventListener('click',()=>{if(busy||!previous.length||total())return;const v=previous.reduce((n,item)=>n+item[1],0);if(v>C.wallet().credit){status('No hay créditos suficientes para repetir esa apuesta.','error');return}bets=new Map(previous);stack=previous.map(([id,value])=>({id,value}));update();status('Apuestas anteriores repetidas.')});
$('spin').addEventListener('click',()=>{if(busy||!total())return;const stake=total();if(!C.updateWallet(-stake,1)){status('Saldo demo insuficiente.','error');update();return}
 busy=true;last=0;previous=[...bets.entries()];stack=[];const outcome=C.randint(37);status(window.CasinoKarmaWheel?.mode==='three'?'No más apuestas. Rueda 3D de KARMA en movimiento…':'No más apuestas. La bola está girando…');C.playSound('spin');update();
 if(!wheel.start(outcome,pocket=>{
  let prize=0;for(const [id,value] of bets)prize+=value*payoutFor(id,pocket);
  if(prize){if(C.updateWallet(prize)){C.playSound('win');status(`¡Salió ${pocket}! Cobras ${C.money(prize)} créditos ficticios.`, 'win')}else status('El navegador no pudo guardar el premio demo.','error')}
  else status(`Salió ${pocket} · Sin premio esta ronda.`);
  last=prize;$('resultNum').textContent=String(pocket);$('resultNum').className='number-result '+color(pocket);
  history.unshift(pocket);history=history.slice(0,10);write('casino_nyc_roulette_history',history);renderHistory();bets.clear();busy=false;update();})){
  C.updateWallet(stake,-1);busy=false;status('No se pudo iniciar el giro.','error');update();
 }
});
window.addEventListener('pageshow',update);window.addEventListener('storage',update);
renderHistory();if(history.length){$('resultNum').textContent=String(history[0]);$('resultNum').className='number-result '+color(history[0])}update();
window.__casinoRouletteTest={payoutFor,spotOptions,wheelOrder:K.POCKETS};
})();
