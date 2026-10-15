/** Original procedural score: 108 BPM, D Dorian, four-bar phrase.
 * No audio files, copyrighted melodies, or network requests. Start from a gesture.
 */
export class Soundtrack {
  constructor() {
    this.ctx = null; this.mood = 'explore'; this.pendingMood = 'explore';
    this.muted = false; this.paused = false; this.step = 0; this.timer = null;
    this.bpm = 108; this.nextTime = 0; this.lastStepAt = -1; this.nodes = new Set();
  }
  async start() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : .52;
      this.compressor = c.createDynamicsCompressor();
      this.compressor.threshold.value = -18; this.compressor.knee.value = 15;
      this.compressor.ratio.value = 3; this.compressor.attack.value = .012;
      this.compressor.release.value = .22;
      this.master.connect(this.compressor); this.compressor.connect(c.destination);
      this.music = c.createGain(); this.music.gain.value = .65; this.music.connect(this.master);
      this.effects = c.createGain(); this.effects.gain.value = .7; this.effects.connect(this.master);
      this.room = c.createConvolver();
      const length = Math.floor(c.sampleRate * 1.05), impulse = c.createBuffer(2, length, c.sampleRate);
      for (let ch=0;ch<2;ch++) { const d=impulse.getChannelData(ch); for(let i=0;i<length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/length,3)*.3; }
      this.room.buffer = impulse;
      const wet = c.createGain(); wet.gain.value = .16;
      this.room.connect(wet); wet.connect(this.music);
      this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const data = this.noise.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    }
    const startingContext = this.ctx;
    await startingContext.resume();
    if (this.ctx !== startingContext || this.paused) return true;
    if (!this.timer) {
      this.nextTime = this.ctx.currentTime + .06;
      this.timer = setInterval(()=>this.schedule(), 30); this.schedule();
    }
    return true;
  }
  setMood(mood) {
    if (['explore','suspicious','chase','celebration'].includes(mood)) this.pendingMood = mood;
  }
  setMuted(value) {
    this.muted = Boolean(value);
    if(this.ctx) this.master.gain.setTargetAtTime(this.muted?0:.52,this.ctx.currentTime,.035);
  }
  pause(value) {
    this.paused = Boolean(value);
    if(!this.ctx) return;
    if(this.paused) { clearInterval(this.timer); this.timer=null; this.ctx.suspend().catch(()=>{}); }
    else this.start().catch(()=>{});
  }
  update() {} // Scheduler is independent of render frame rate.
  schedule() {
    if (!this.ctx || this.paused || this.ctx.state !== 'running') return;
    if(this.nextTime < this.ctx.currentTime-.1) this.nextTime=this.ctx.currentTime+.025;
    const tick=60/this.bpm/4;
    while(this.nextTime < this.ctx.currentTime+.13) {
      const s=this.step%16;
      if(s===0) this.mood=this.pendingMood;
      // Light sixteenth-note swing; the grid itself does not drift.
      const t=this.nextTime+(s%2 ? tick*.11 : 0);
      this.playStep(s,Math.floor(this.step/16)%4,t,tick);
      this.nextTime+=tick; this.step++;
    }
  }
  track(source) {
    this.nodes.add(source);
    source.onended=()=>{this.nodes.delete(source); source.disconnect();};
    return source;
  }
  tone(midi,t,duration,volume=.1,type='triangle',cutoff=1800,pan=0,bus=this.music,room=true) {
    const c=this.ctx, osc=this.track(c.createOscillator()), gain=c.createGain(), f=c.createBiquadFilter();
    osc.type=type; osc.frequency.value=440*Math.pow(2,(midi-69)/12);
    f.type='lowpass'; f.frequency.setValueAtTime(cutoff,t);
    f.frequency.exponentialRampToValueAtTime(Math.max(170,cutoff*.36),t+duration);
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(volume,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    const p=c.createStereoPanner(); p.pan.value=pan;
    osc.connect(f); f.connect(gain); gain.connect(p); p.connect(bus);
    if(room && bus===this.music) gain.connect(this.room);
    osc.start(t); osc.stop(t+duration+.03);
  }
  hiss(t,duration,volume,freq,pan=0,bus=this.music) {
    const c=this.ctx, n=this.track(c.createBufferSource()), f=c.createBiquadFilter(), g=c.createGain(), p=c.createStereoPanner();
    n.buffer=this.noise; f.type='bandpass'; f.frequency.value=freq; f.Q.value=.7; p.pan.value=pan;
    g.gain.setValueAtTime(volume,t); g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    n.connect(f);f.connect(g);g.connect(p);p.connect(bus);n.start(t,Math.random()*.5,duration);n.stop(t+duration+.01);
  }
  drum(kind,t,v=1,bus=this.music) {
    const c=this.ctx;
    if(kind==='hat') return this.hiss(t,.045,.032*v,7000,.3,bus);
    if(kind==='clap') { for(let i=0;i<3;i++) this.hiss(t+i*.012,.09,.065*v,1800,-.12,bus); return; }
    const o=this.track(c.createOscillator()), g=c.createGain(); o.type='sine';
    const low=kind==='kick', base=low?53:kind==='dum'?112:230;
    o.frequency.setValueAtTime(base*(low?2.8:1.55),t);o.frequency.exponentialRampToValueAtTime(base,t+.045);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime((low?.22:.11)*v,t+.003);
    g.gain.exponentialRampToValueAtTime(.0001,t+(low?.24:.16));
    o.connect(g);g.connect(bus);o.start(t);o.stop(t+.3);
    if(!low) this.hiss(t,.026,.045*v,kind==='dum'?900:2600,kind==='dum'?-.25:.25,bus);
  }
  playStep(s,bar,t,q) {
    const mode=this.mood, chase=mode==='chase', tension=mode==='suspicious', party=mode==='celebration';
    const roots=[38,41,43,36], root=roots[bar];
    // A warm, sparse groove with moving bass and hand-drum answers.
    if(s===0 || s===8 || (chase && (s===6 || s===14))) this.drum('kick',t,s===0?1:.8);
    if(s===4 || s===12) this.drum('clap',t,chase||party?.85:.4);
    if(s%2===0 || chase) this.drum('hat',t,s%4===0?.9:.55);
    if([3,7,10,15].includes(s)) this.drum(s===7||s===15?'dum':'tak',t,s===15?.6:.8);
    if((chase||party) && (s===5||s===13)) this.drum('tak',t,.6);
    if([0,6,8,14].includes(s)) {
      const offset=s===14?7:s===6?12:0;
      this.tone(root+offset,t,q*(s===0?4:2),.145,'triangle',700,0,this.music,false);
    }
    // Syncopated soft chord stabs, with varied voicing over the progression.
    const chords=[[62,65,69,72],[60,65,69,74],[62,67,71,74],[60,64,67,74]];
    if(s===2 || s===10 || (party && s===14)) {
      chords[bar].forEach((n,i)=>this.tone(n,t+i*.009,q*2.5,tension?.022:.035,'triangle',1500,(i-1.5)*.22));
    }
    const melodies=[[74,null,77,76,74,null,69,72],[77,null,81,79,77,null,74,72],[79,null,81,83,81,null,79,74],[76,null,74,72,69,null,72,74]];
    if(s%2===0 && !tension) {
      const n=melodies[bar][s/2];
      if(n!==null && (chase||party||[0,4,10,14].includes(s))) {
        this.tone(n,t,q*(party?1.8:2.4),party?.06:.042,'sine',2800,Math.sin(s)*.28);
        // Quiet octave resonance gives the pluck a woody bell quality.
        this.tone(n+12,t,q*.65,.009,'sine',3600,-.15);
      }
    }
    if(tension && [2,7,10,15].includes(s)) this.tone(74+(s===15?3:0),t,q*.8,.022,'triangle',1000,-.3);
    if(chase && s%2===1) this.tone(root+24+(s%4===1?0:7),t,q*.7,.028,'sawtooth',900,.25);
    if(party && s===0) [74,77,81,86].forEach((n,i)=>this.tone(n,t+i*q,.22,.07,'triangle',2600,(i-1.5)*.2));
  }
  /** pan [-1,1], distance >=0 attenuates; footstep surface: stone, grass, gravel. */
  sfx(name, options={}) {
    if(!this.ctx || this.paused || this.ctx.state!=='running') return;
    const t=this.ctx.currentTime+.004, pan=Math.max(-1,Math.min(1,options.pan||0));
    const vol=1/(1+(options.distance||0)*.12), bus=this.effects;
    const notes=(ns,spacing=.08)=>ns.forEach((n,i)=>this.tone(n,t+i*spacing,.2,.1*vol,'triangle',3000,pan,bus,false));
    if(name==='footstep' || name==='step') {
      if(t-this.lastStepAt<.12) return; this.lastStepAt=t;
      const surface=options.surface||'stone';
      this.hiss(t,surface==='grass'?.09:.045,.07*vol,surface==='grass'?1100:surface==='gravel'?2700:650,pan,bus);
      if(surface==='stone') this.tone(45,t,.055,.055*vol,'sine',400,pan,bus,false);
    } else if(name==='pickup') notes([74,81],.055);
    else if(name==='success') notes([62,65,69,74],.09);
    else if(name==='caught') notes([69,65,62,57],.12);
    else if(name==='whistle') {
      const o=this.track(this.ctx.createOscillator()),g=this.ctx.createGain();
      o.frequency.setValueAtTime(1850,t);o.frequency.linearRampToValueAtTime(2250,t+.09);o.frequency.linearRampToValueAtTime(2000,t+.32);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06*vol,t+.04);g.gain.linearRampToValueAtTime(0,t+.36);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+.38);
    } else if(name==='laugh') [0,.13,.25].forEach((d,i)=>{
      this.tone(65-i*2,t+d,.11,.055*vol,'triangle',850,pan,bus,false);
      this.hiss(t+d,.07,.025*vol,1000,pan,bus);
    });
  }
  async dispose() {
    clearInterval(this.timer); this.timer=null;
    if(this.ctx) { const closingContext=this.ctx; this.ctx=null; for(const n of this.nodes) {try{n.stop();}catch{}} this.nodes.clear(); await closingContext.close(); }
  }
}
