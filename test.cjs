const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes=new Map();function el(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},focus(){},addEventListener(){},getContext(){return {}},showModal(){},close(){}});return nodes.get(s)}
const env={document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){},localStorage:{getItem:()=>0,setItem(){}},console,Math};vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/dist/game.js','utf8'),env);
vm.runInContext(`
reset();choose(stations[0],0);choose(stations[1],0);choose(stations[3],1);choose(stations[6],0);
if(!ready())throw Error('Balanced route should complete brief');interact(stations[8]);if(state.mode!=='end'||!$('#overlay').innerHTML.includes('BRIEF COMPLETED'))throw Error('Win ending failed');
reset();choose(stations[1],0);choose(stations[2],0);choose(stations[4],0);choose(stations[5],0);if(state.mode!=='end'||!$('#overlay').innerHTML.includes('DETAINED'))throw Error('Risk ending failed');
reset();state.time=.01;tick(.02);if(state.mode!=='end')throw Error('Timeout failed');
reset();state.mode='pause';const t=state.time;tick(5);if(state.time!==t)throw Error('Pause advances time');
reset();state.time=179.9;updateUI();if($('#clock').textContent!=='03:00')throw Error('Clock rollover');
reset();keys.d=true;tick(1);if(state.x<=95)throw Error('Movement failed');keys={};
reset();target={x:190,y:185,station:stations[0]};for(let i=0;i<400&&state.mode==='play';i++)tick(.02);if(state.mode!=='choice')throw Error('Tap navigation failed');
reset();state.distance=1801;tick(.01);tick(.01);if(state.badges.filter(b=>b==='Cardio Club').length!==1)throw Error('Milestone repeat');
reset();state.risk=70;choose(stations[7],0);if(state.time!==168||state.risk!==40)throw Error('Chai tradeoff failed');
console.log('PASS: balanced victory, detention, timeout, pause, clock rollover, movement, tap navigation, unique milestone, chai tradeoff');
`,env);
