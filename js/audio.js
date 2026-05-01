// Spatial audio engine using WebAudio API.
// Generates synthesized footsteps, ambience, ability cues — no asset files needed.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.listenerPos = { x: 0, y: 0, z: 0 };
    this.listenerYaw = 0;
    this.muffle = 1.0; // 1 = clear, lower = muffled (snow map)
    this.volume = 0.8;
    this.ambientGain = null;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);

    // global compressor for polish
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.1;
    this.master.disconnect();
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }

  setListener(pos, yaw) {
    this.listenerPos.x = pos.x; this.listenerPos.y = pos.y; this.listenerPos.z = pos.z;
    this.listenerYaw = yaw;
  }

  // Position a mono source spatially relative to listener.
  _spatialNode(pos, gainScale = 1) {
    const dx = pos.x - this.listenerPos.x;
    const dz = pos.z - this.listenerPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const fall = 1 / (1 + dist * 0.18); // distance falloff
    const cosY = Math.cos(-this.listenerYaw), sinY = Math.sin(-this.listenerYaw);
    const lx = dx * cosY - dz * sinY;
    const lz = dx * sinY + dz * cosY;
    const angle = Math.atan2(lx, -lz); // +Z-forward space; angle 0 is in front

    const panNode = this.ctx.createStereoPanner();
    // pan based on left/right component
    panNode.pan.value = Math.max(-1, Math.min(1, Math.sin(angle) * 0.95));

    const gain = this.ctx.createGain();
    gain.gain.value = fall * gainScale * this.muffle;

    // distance lowpass (further = duller)
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.max(500, 12000 - dist * 320);
    lp.Q.value = 0.7;

    gain.connect(lp); lp.connect(panNode); panNode.connect(this.master);
    return { input: gain, dist };
  }

  // Footstep — short noise burst with surface character
  footstep(pos, surface = 'concrete', intensity = 1) {
    if (!this.ctx) return;
    const { input } = this._spatialNode(pos, 0.5 * intensity);

    const len = surface === 'snow' ? 0.18 : 0.07;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const env = Math.pow(1 - t, surface === 'snow' ? 1.5 : 3.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const tone = this.ctx.createBiquadFilter();
    tone.type = 'bandpass';
    if (surface === 'metal') { tone.frequency.value = 2200; tone.Q.value = 4; }
    else if (surface === 'snow') { tone.frequency.value = 600; tone.Q.value = 1; }
    else { tone.frequency.value = 900; tone.Q.value = 1.5; }

    src.connect(tone); tone.connect(input);
    src.start();

    // metallic overtone
    if (surface === 'metal') {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle'; osc.frequency.value = 1800 + Math.random() * 300;
      const og = this.ctx.createGain(); og.gain.value = 0.0;
      og.gain.setValueAtTime(0, this.ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.04 * intensity, this.ctx.currentTime + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
      osc.connect(og); og.connect(input);
      osc.start(); osc.stop(this.ctx.currentTime + 0.13);
    }
  }

  // Soft thump — vault/landing
  thump(pos, intensity = 1) {
    if (!this.ctx) return;
    const { input } = this._spatialNode(pos, 0.7 * intensity);
    const osc = this.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 80;
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);
    const g = this.ctx.createGain();
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(g); g.connect(input);
    osc.start(); osc.stop(this.ctx.currentTime + 0.25);
  }

  // Pulse — UI/ability
  pulse(pos, freq = 440, dur = 0.6, kind = 'sine') {
    if (!this.ctx) return;
    const { input } = this._spatialNode(pos, 0.6);
    const osc = this.ctx.createOscillator();
    osc.type = kind; osc.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g); g.connect(input);
    osc.start(); osc.stop(this.ctx.currentTime + dur + 0.05);
  }

  // UI tick (non-spatial)
  ui(freq = 880, dur = 0.06, kind = 'square', vol = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); osc.type = kind; osc.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, this.ctx.currentTime + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(); osc.stop(this.ctx.currentTime + dur + 0.02);
  }

  // Ambient bed — looping low rumble + sparse high pings
  startAmbient(map = 'dead_signal') {
    if (!this.ctx) return;
    this.stopAmbient();
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.0;
    this.ambientGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
    this.ambientGain.connect(this.master);

    // base drone
    const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = this.ctx.createOscillator(); o2.type = 'sine';
    if (map === 'dead_signal') { o1.frequency.value = 55; o2.frequency.value = 110; this.muffle = 1.0; }
    else if (map === 'white_hollow') { o1.frequency.value = 48; o2.frequency.value = 80; this.muffle = 0.55; }
    else { o1.frequency.value = 65; o2.frequency.value = 130; this.muffle = 1.1; }

    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const dg = this.ctx.createGain(); dg.gain.value = 0.06;
    o1.connect(dg); o2.connect(dg); dg.connect(lp); lp.connect(this.ambientGain);
    o1.start(); o2.start();
    this._ambient = { o1, o2 };

    // sparse atmospheric pings for dead_signal & black_array
    if (map !== 'white_hollow') {
      this._ambientLoop = setInterval(() => {
        if (Math.random() < 0.3) {
          const px = this.listenerPos.x + (Math.random()-0.5) * 40;
          const pz = this.listenerPos.z + (Math.random()-0.5) * 40;
          this.pulse({ x: px, y: 0, z: pz }, 600 + Math.random()*1200, 0.4, 'triangle');
        }
      }, 4000);
    }
  }

  stopAmbient() {
    if (this._ambient) {
      try { this._ambient.o1.stop(); this._ambient.o2.stop(); } catch(e) {}
      this._ambient = null;
    }
    if (this.ambientGain) {
      try { this.ambientGain.disconnect(); } catch(e) {}
      this.ambientGain = null;
    }
    if (this._ambientLoop) { clearInterval(this._ambientLoop); this._ambientLoop = null; }
  }

  // Detection siren when prey is detected
  detected() { this.ui(180, 0.25, 'sawtooth', 0.12); setTimeout(() => this.ui(120, 0.4, 'sawtooth', 0.1), 80); }

  // Soft confirmation
  confirm() { this.ui(660, 0.08, 'sine', 0.06); setTimeout(() => this.ui(990, 0.1, 'sine', 0.05), 70); }
}

export const audio = new AudioEngine();
