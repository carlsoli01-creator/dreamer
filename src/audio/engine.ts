// Synthesized spatial audio engine — no external assets.

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  ambientGain: GainNode | null = null;
  ambientNodes: OscillatorNode[] = [];
  ambientLoop: number | null = null;
  listenerPos = { x: 0, y: 0, z: 0 };
  listenerYaw = 0;
  muffle = 1;
  volume = 0.75;

  init() {
    if (this.ctx) return;
    const C = (window.AudioContext || (window as any).webkitAudioContext);
    if (!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6;
    this.master.connect(comp); comp.connect(this.ctx.destination);
  }
  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  setVolume(v: number) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setListener(p: {x:number;y:number;z:number}, yaw:number) {
    this.listenerPos = p; this.listenerYaw = yaw;
  }
  private spatial(pos: {x:number;y:number;z:number}, gainScale = 1) {
    if (!this.ctx || !this.master) return null;
    const dx = pos.x - this.listenerPos.x;
    const dz = pos.z - this.listenerPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const fall = 1 / (1 + dist * 0.18);
    const cy = Math.cos(-this.listenerYaw), sy = Math.sin(-this.listenerYaw);
    const lx = dx * cy - dz * sy;
    const lz = dx * sy + dz * cy;
    const angle = Math.atan2(lx, -lz);
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, Math.sin(angle) * 0.95));
    const g = this.ctx.createGain();
    g.gain.value = fall * gainScale * this.muffle;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = Math.max(500, 12000 - dist * 320);
    g.connect(lp); lp.connect(pan); pan.connect(this.master);
    return { input: g };
  }
  footstep(pos:{x:number;y:number;z:number}, surface = 'concrete', intensity = 1) {
    if (!this.ctx) return;
    const sp = this.spatial(pos, 0.45 * intensity); if (!sp) return;
    const len = surface === 'snow' ? 0.18 : 0.07;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const env = Math.pow(1 - t, surface === 'snow' ? 1.5 : 3.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'bandpass';
    if (surface === 'metal') { tone.frequency.value = 2200; tone.Q.value = 4; }
    else if (surface === 'snow') { tone.frequency.value = 600; tone.Q.value = 1; }
    else { tone.frequency.value = 900; tone.Q.value = 1.5; }
    src.connect(tone); tone.connect(sp.input); src.start();
  }
  pulse(pos:{x:number;y:number;z:number}, freq = 440, dur = 0.5, kind: OscillatorType = 'sine') {
    if (!this.ctx) return;
    const sp = this.spatial(pos, 0.6); if (!sp) return;
    const o = this.ctx.createOscillator(); o.type = kind; o.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(sp.input); o.start(); o.stop(this.ctx.currentTime + dur + 0.05);
  }
  ui(freq = 880, dur = 0.06, kind: OscillatorType = 'square', vol = 0.05) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator(); o.type = kind; o.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur + 0.02);
  }
  detected() { this.ui(180, 0.25, 'sawtooth', 0.12); setTimeout(() => this.ui(120, 0.4, 'sawtooth', 0.1), 80); }
  confirm() { this.ui(660, 0.08, 'sine', 0.06); setTimeout(() => this.ui(990, 0.1, 'sine', 0.05), 70); }
  startAmbient(mapId: string) {
    if (!this.ctx || !this.master) return;
    this.stopAmbient();
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
    this.ambientGain.connect(this.master);
    const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = this.ctx.createOscillator(); o2.type = 'sine';
    if (mapId === 'dead_signal')      { o1.frequency.value = 55; o2.frequency.value = 110; this.muffle = 1.0; }
    else if (mapId === 'white_hollow'){ o1.frequency.value = 48; o2.frequency.value = 80;  this.muffle = 0.55; }
    else                              { o1.frequency.value = 65; o2.frequency.value = 130; this.muffle = 1.1; }
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const dg = this.ctx.createGain(); dg.gain.value = 0.06;
    o1.connect(dg); o2.connect(dg); dg.connect(lp); lp.connect(this.ambientGain);
    o1.start(); o2.start();
    this.ambientNodes = [o1, o2];
  }
  stopAmbient() {
    for (const o of this.ambientNodes) { try { o.stop(); } catch {} }
    this.ambientNodes = [];
    if (this.ambientGain) { try { this.ambientGain.disconnect(); } catch {} this.ambientGain = null; }
    if (this.ambientLoop) { clearInterval(this.ambientLoop); this.ambientLoop = null; }
  }
}

export const audio = new AudioEngine();
