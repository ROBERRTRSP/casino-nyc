(()=>{'use strict';
const KEY='campana_link_demo_v2',SETTINGS='casino_nyc_settings';
let backup={credit:27835,bet:250,spins:0};
function read(key,defaultValue){try{const value=JSON.parse(localStorage.getItem(key));return value??defaultValue}catch{return defaultValue}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function wallet(){const w=read(KEY,backup);return w&&Number.isSafeInteger(w.credit)&&w.credit>=0&&w.credit<=100000000&&[250,500,750,1000].includes(w.bet)&&Number.isSafeInteger(w.spins??0)?w:{...backup}}
function updateWallet(credits,spinCount=0){const before=wallet();if(!Number.isSafeInteger(credits)||before.credit+credits<0||before.credit+credits>100000000)return false;
 const after={...before,credit:before.credit+credits,spins:Math.max(0,before.spins+spinCount)};backup=after;write(KEY,after);return after}
const money=(c)=>(Math.max(0,c)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function randint(max){if(max<1)return 0;if(window.crypto?.getRandomValues){const n=new Uint32Array(1),size=2**32,limit=size-size%max;do{window.crypto.getRandomValues(n)}while(n[0]>=limit);return n[0]%max}return Math.floor(Math.random()*max)}
function weighted(list){const sum=list.reduce((a,s)=>a+s.weight,0);let v=randint(sum);for(const s of list){v-=s.weight;if(v<0)return s.id}return list.at(-1).id}
let audio;
function playSound(type){if(!read(SETTINGS,{}).sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;audio ||=new AC();const ctx=audio;if(ctx.state==='suspended')ctx.resume();
  if(type==='coins'){
    for(let i=0;i<10;i++){
      const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.055;
      o.type='triangle';o.frequency.setValueAtTime(880+i*40+(i%2?60:0),t);o.frequency.exponentialRampToValueAtTime(420,t+.12);
      g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);
      o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.15);
    }
    return;
  }
  const seq=type==='win'?[523,659,784,1047,1319]:type==='tap'?[340]:type==='stop'?[210,280]:type==='lose'?[180,140,110]:[220,260];
  seq.forEach((f,i)=>{
    const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.085;
    o.type=type==='lose'?'sawtooth':'sine';
    o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(type==='lose'?0.03:0.05,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+(type==='lose'?0.22:0.14));
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t+(type==='lose'?0.24:0.15));
  });
}catch{}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
window.CasinoCore={read,write,wallet,updateWallet,money,randint,weighted,playSound,wait,KEY};
})();