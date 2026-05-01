// NOISLESS — entry point. Wires together rendering, input, UI, game state.

import * as THREE from 'three';
import { audio } from './audio.js';
import { SoundSystem } from './sound.js';
import { buildMap } from './map.js';
import { Prey } from './prey.js';
import { Hunter } from './hunter.js';
import { makeHunterAbilities, makePreyAbilities, updateTempObjects } from './abilities.js';
import { rayBlocked } from './physics.js';

// -------------------- Renderer / Camera --------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 200);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// -------------------- Game State --------------------
const game = {
  scene: null,
  map: null,
  prey: null,
  hunter: null,
  sound: null,
  abilities: [],
  role: 'prey',
  mapName: 'dead_signal',
  active: false,
  startTime: 0,
  matchLength: 120, // 2 minutes
  detections: 0,
  abilitiesUsed: 0,
  tempObjects: [],
  traps: [],
  decoys: [],
  settings: {
    sens: 1.0,
    botSkill: 1.0,
    showRings: true,
  },
};

// -------------------- Input --------------------
const input = {
  keys: new Set(),
  mouseLocked: false,
};
window.addEventListener('keydown', (e) => {
  input.keys.add(e.code);
  if (e.code === 'Escape' && game.active) {
    document.exitPointerLock?.();
  }
  if (game.active && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
    const idx = parseInt(e.code.slice(-1)) - 1;
    tryAbility(idx);
  }
});
window.addEventListener('keyup', (e) => input.keys.delete(e.code));

canvas.addEventListener('click', () => {
  if (game.active && !input.mouseLocked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  input.mouseLocked = document.pointerLockElement === canvas;
  document.getElementById('lockPrompt').classList.toggle('hidden', input.mouseLocked || !game.active);
});
document.addEventListener('mousemove', (e) => {
  if (!input.mouseLocked || !game.active) return;
  const sens = game.settings.sens * 0.0022;
  if (game.role === 'prey') {
    game.prey.yaw -= e.movementX * sens;
    game.prey.pitch -= e.movementY * sens;
    game.prey.pitch = Math.max(-0.55, Math.min(0.55, game.prey.pitch));
  } else {
    game.hunter.yaw -= e.movementX * sens;
    game.hunter.pitch -= e.movementY * sens;
    game.hunter.pitch = Math.max(-1.2, Math.min(1.2, game.hunter.pitch));
  }
});

// -------------------- Menus / UI --------------------
const els = {
  menu: document.getElementById('menu'),
  modeSelect: document.getElementById('modeSelect'),
  settings: document.getElementById('settings'),
  loading: document.getElementById('loading'),
  end: document.getElementById('end'),
  hud: document.getElementById('hud'),
  lockPrompt: document.getElementById('lockPrompt'),
  alert: document.getElementById('alert'),
  abilities: document.getElementById('abilities'),
  silenceFill: document.getElementById('silenceFill'),
  matchTimer: document.getElementById('matchTimer'),
  roleTag: document.getElementById('roleTag'),
  objective: document.getElementById('objective'),
  directionalCues: document.getElementById('directionalCues'),
  loadingMap: document.getElementById('loadingMap'),
  loadingFill: document.getElementById('loadingFill'),
  loadingTip: document.getElementById('loadingTip'),
  endResult: document.getElementById('endResult'),
  endSub: document.getElementById('endSub'),
  statSound: document.getElementById('statSound'),
  statDetect: document.getElementById('statDetect'),
  statAbil: document.getElementById('statAbil'),
  statTime: document.getElementById('statTime'),
};

function showScreen(name) {
  for (const k of ['menu', 'modeSelect', 'settings', 'loading', 'end']) {
    els[k].classList.toggle('hidden', k !== name);
  }
  els.hud.classList.toggle('hidden', name !== null && name !== 'hud');
  if (name === null) els.hud.classList.remove('hidden');
}

document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    audio.init(); audio.resume();
    audio.ui(880, 0.04);
    const act = btn.dataset.action;
    if (act === 'play') showScreen('modeSelect');
    else if (act === 'modes') showScreen('modeSelect');
    else if (act === 'settings') showScreen('settings');
    else if (act === 'back') showScreen('menu');
    else if (act === 'start') startMatch();
    else if (act === 'menu') { endCleanup(); showScreen('menu'); }
    else if (act === 'rematch') { endCleanup(); startMatch(); }
  });
});

// role/map cards
let selectedRole = null, selectedMap = 'dead_signal';
document.querySelectorAll('#modeSelect .card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#modeSelect .card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedRole = card.dataset.role;
    audio.ui(660, 0.05);
    updateStartBtn();
  });
});
document.querySelectorAll('#modeSelect .map-card').forEach((mc) => {
  mc.addEventListener('click', () => {
    document.querySelectorAll('#modeSelect .map-card').forEach(c => c.classList.remove('selected'));
    mc.classList.add('selected');
    selectedMap = mc.dataset.map;
    audio.ui(540, 0.05);
    updateStartBtn();
  });
});
function updateStartBtn() {
  const btn = document.querySelector('#modeSelect [data-action="start"]');
  btn.disabled = !selectedRole;
}

// settings
document.getElementById('setVolume').addEventListener('input', (e) => {
  audio.init(); audio.setVolume(parseFloat(e.target.value) / 100);
});
document.getElementById('setSens').addEventListener('input', (e) => {
  game.settings.sens = parseFloat(e.target.value) / 10;
});
document.getElementById('setBot').addEventListener('change', (e) => {
  game.settings.botSkill = parseFloat(e.target.value);
});
document.getElementById('setRings').addEventListener('change', (e) => {
  game.settings.showRings = e.target.value === '1';
});

// any key skip on main menu
window.addEventListener('keydown', (e) => {
  if (!els.menu.classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')) {
    audio.init(); audio.resume();
    showScreen('modeSelect');
  }
}, { once: false });

// -------------------- Match Setup --------------------
const TIPS = [
  'Standing still produces almost no sound. Use stillness to bait the hunter.',
  'Sprinting is the loudest action. Save it for committed escapes.',
  'Decoys produce real footsteps in the sound system — use them to redirect attention.',
  'On Black Array, mechanical ambient noise masks footsteps — but only at distance.',
  'Snow muffles distant audio and reveals footprints. Watch where you step.',
  'Echo Pulse reveals the prey\'s last 8 seconds of movement.',
  'Silence Trap punishes any movement inside its radius. Place it near choke points.',
  'Ghost Step gives 4 seconds of total silence — use it to cross open ground.',
];

async function startMatch() {
  if (!selectedRole) return;
  game.role = selectedRole;
  game.mapName = selectedMap;

  // loading screen
  showScreen('loading');
  els.loadingMap.textContent = (
    selectedMap === 'dead_signal' ? 'DEAD SIGNAL' :
    selectedMap === 'white_hollow' ? 'WHITE HOLLOW' : 'BLACK ARRAY'
  );
  els.loadingTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];

  await animateLoading(900);

  // build scene
  buildScene(game.mapName);

  // start ambient + UI
  audio.init();
  audio.startAmbient(game.mapName);

  setupHUDForRole();

  game.active = true;
  game.startTime = performance.now() / 1000;
  game.detections = 0;
  game.abilitiesUsed = 0;
  showScreen(null);
  document.getElementById('lockPrompt').classList.remove('hidden');
}

function animateLoading(ms) {
  return new Promise((res) => {
    els.loadingFill.style.width = '0%';
    requestAnimationFrame(() => {
      els.loadingFill.style.transition = `width ${ms/1000}s ease`;
      els.loadingFill.style.width = '100%';
    });
    setTimeout(() => { els.loadingFill.style.transition = ''; res(); }, ms + 50);
  });
}

function buildScene(mapName) {
  // dispose previous scene
  if (game.scene) endCleanup();

  const scene = new THREE.Scene();
  game.scene = scene;
  game.tempObjects = [];
  game.traps = [];
  game.decoys = [];

  game.sound = new SoundSystem(scene);
  const map = buildMap(mapName, scene);
  game.map = map;

  scene.background = new THREE.Color(map.skyColor);
  scene.fog = new THREE.Fog(map.fogColor, map.fogNear, map.fogFar);

  // Build prey + hunter
  const isPlayerPrey = game.role === 'prey';
  game.prey = new Prey(scene, map, game.sound);
  game.hunter = new Hunter(scene, map, game.sound, { ai: isPlayerPrey, skill: game.settings.botSkill });

  // hide own mesh in first person if playing prey: no — third person view shows it
  // hide hunter mesh if player is hunter (first person)
  if (!isPlayerPrey && game.hunter.mesh.parent) {
    scene.remove(game.hunter.mesh);
  }

  // abilities
  game.abilities = isPlayerPrey ? makePreyAbilities(game) : makeHunterAbilities(game);
}

function setupHUDForRole() {
  const isPrey = game.role === 'prey';
  els.roleTag.textContent = isPrey ? 'PREY' : 'HUNTER';
  els.roleTag.classList.toggle('hunter', !isPrey);
  els.objective.textContent = isPrey ? 'REACH EXTRACTION' : 'ELIMINATE PREY';

  // build ability slots
  els.abilities.innerHTML = '';
  game.abilities.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'ability ready';
    div.innerHTML = `
      <div class="key">${a.key}</div>
      <div class="name">${a.name.split(' ')[0]}</div>
      <div class="cd-fill" style="height:0%"></div>
    `;
    a.dom = div;
    els.abilities.appendChild(div);
  });
}

function endCleanup() {
  game.active = false;
  audio.stopAmbient();
  if (game.prey) game.prey.cleanup();
  if (game.hunter) game.hunter.cleanup();
  if (game.scene) {
    // dispose
    game.scene.traverse((c) => {
      if (c.geometry) c.geometry.dispose?.();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose?.());
        else c.material.dispose?.();
      }
    });
  }
  game.scene = null;
}

function tryAbility(idx) {
  if (!game.active || !game.abilities[idx]) return;
  const a = game.abilities[idx];
  const now = performance.now() / 1000;
  if (now < a.ready) return;
  a.execute(now);
  a.ready = now + a.cooldown;
  game.abilitiesUsed++;
  audio.ui(990, 0.05);
}

// -------------------- Per-frame --------------------
const clock = new THREE.Clock();

function getInputVec(forward = false) {
  let fwd = 0, strafe = 0;
  if (input.keys.has('KeyW')) fwd += 1;
  if (input.keys.has('KeyS')) fwd -= 1;
  if (input.keys.has('KeyA')) strafe -= 1;
  if (input.keys.has('KeyD')) strafe += 1;
  return { fwd, strafe, sprint: input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') };
}

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  if (!game.active || !game.scene) {
    renderer.clear();
    return;
  }
  const now = performance.now() / 1000;
  const elapsed = now - game.startTime;
  const remaining = Math.max(0, game.matchLength - elapsed);

  // update input states for prey-specific
  if (game.role === 'prey') {
    game.prey.crouch = input.keys.has('ControlLeft') || input.keys.has('KeyC');
    game.prey.sprint = (input.keys.has('ShiftLeft') || input.keys.has('ShiftRight')) && !game.prey.crouch;
    game.prey.update(dt, getInputVec(), game.map.walls, game.traps);
    game.hunter.updateAI(dt, game.prey, game.map.walls, game.decoys);
  } else {
    // player is hunter
    game.hunter.updatePlayer(dt, getInputVec(), game.map.walls);
    // AI prey: simple — move towards extraction with avoidance
    aiPrey(dt);
  }

  // update sound system
  game.sound.update(dt);

  // listener for audio
  audio.setListener(
    game.role === 'prey' ? game.prey.pos : game.hunter.pos,
    game.role === 'prey' ? game.prey.yaw : game.hunter.yaw
  );

  // decoys emit fake footsteps
  for (const d of game.decoys) {
    if (now > d.userData.nextStep && now - d.userData.spawn < d.userData.life - 0.3) {
      d.userData.nextStep = now + 0.4;
      const surf = game.map.surfaces(d.position);
      game.sound.emit({
        position: d.position.clone(),
        loudness: 0.5,
        surface: surf, owner: 'decoy', kind: 'step', visual: true,
      });
      audio.footstep(d.position, surf, 0.5);
    }
  }
  // expire decoys
  for (let i = game.decoys.length - 1; i >= 0; i--) {
    const d = game.decoys[i];
    if (now - d.userData.spawn > d.userData.life) {
      game.scene.remove(d); d.material.dispose(); game.decoys.splice(i, 1);
    }
  }
  // expire traps
  for (let i = game.traps.length - 1; i >= 0; i--) {
    const t = game.traps[i];
    if (now - t.userData.spawn > t.userData.life) {
      game.scene.remove(t); game.traps.splice(i, 1);
    }
  }

  updateTempObjects(game.scene, game.tempObjects, now);

  // animate flickering lights & emissive
  for (const l of game.map.lights) {
    if (l.userData.flicker) {
      const base = l.userData.base;
      l.intensity = base * (0.7 + Math.random() * 0.6 * (Math.random() > 0.94 ? 0.2 : 1));
    }
  }

  // expire snow footprints
  if (game.prey.printGroup) {
    for (let i = game.prey.printGroup.children.length - 1; i >= 0; i--) {
      const p = game.prey.printGroup.children[i];
      const t = now - p.userData.spawn;
      if (t > p.userData.life) {
        game.prey.printGroup.remove(p); p.material.dispose();
      } else {
        p.material.opacity = (1 - t / p.userData.life) * 0.55;
      }
    }
  }

  // camera
  positionCamera();

  // render
  renderer.render(game.scene, camera);

  // HUD
  updateHUD(remaining, now);

  // win/loss
  if (game.role === 'prey') {
    const distToExtract = game.prey.pos.distanceTo(game.map.extractionPos);
    if (distToExtract < 2.2) {
      game.prey.escaped = true;
      endMatch(true, 'extraction reached');
    }
    if (game.prey.dead) {
      endMatch(false, 'caught by hunter');
    }
  } else {
    if (game.prey.dead) endMatch(true, 'prey eliminated');
    if (game.prey.escaped) endMatch(false, 'prey escaped');
  }
  if (remaining <= 0) {
    // timeout: prey wins if alive in prey mode; hunter loses
    endMatch(game.role === 'prey', game.role === 'prey' ? 'time expired — prey survived' : 'time expired — prey escaped');
  }
}

function positionCamera() {
  if (game.role === 'prey') {
    // third person — orbit behind prey
    const p = game.prey;
    const distance = 3.6;
    const height = 1.9;
    const cx = p.pos.x + Math.sin(p.yaw) * distance;
    const cz = p.pos.z + Math.cos(p.yaw) * distance;
    const cy = p.pos.y + height + p.pitch * 1.2;
    camera.position.set(cx, cy, cz);
    camera.lookAt(p.pos.x - Math.sin(p.yaw) * 0.5, p.pos.y + 1.2 + p.pitch * 1.2, p.pos.z - Math.cos(p.yaw) * 0.5);
  } else {
    // first person hunter
    const h = game.hunter;
    camera.position.set(h.pos.x, h.pos.y + 1.65, h.pos.z);
    const lookX = h.pos.x - Math.sin(h.yaw) * Math.cos(h.pitch);
    const lookY = h.pos.y + 1.65 + Math.sin(h.pitch);
    const lookZ = h.pos.z - Math.cos(h.yaw) * Math.cos(h.pitch);
    camera.lookAt(lookX, lookY, lookZ);
  }
}

function updateHUD(remaining, now) {
  // timer
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  els.matchTimer.textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;

  // silence meter for prey: based on recent emission
  if (game.role === 'prey') {
    const recent = game.sound.events.filter(e => e.owner === 'prey' && (now - e.time) < 1.5);
    const totalLoud = recent.reduce((a,b) => a + b.loudness, 0);
    const silence = Math.max(0, 1 - totalLoud * 0.6);
    els.silenceFill.style.width = `${silence * 100}%`;
  } else {
    // for hunter, meter shows "track confidence"
    const conf = game.hunter.detected ? 1 : (game.sound.events.length > 0 ? 0.5 : 0.1);
    els.silenceFill.style.width = `${conf * 100}%`;
  }

  // ability cooldown bars
  for (const a of game.abilities) {
    if (!a.dom) continue;
    const remain = Math.max(0, a.ready - now);
    const pct = remain / a.cooldown;
    const fill = a.dom.querySelector('.cd-fill');
    fill.style.height = `${pct * 100}%`;
    a.dom.classList.toggle('ready', remain <= 0);
  }

  // directional sound cues for hunter (audio drives gameplay)
  if (game.role === 'hunter') {
    renderDirectionalCues(now);
  } else {
    renderPreyDangerCues(now);
  }
}

function renderDirectionalCues(now) {
  els.directionalCues.innerHTML = '';
  const heard = game.sound.audibleFor(game.hunter.pos, 32);
  for (const h of heard) {
    if (h.ev.owner === 'hunter') continue;
    const age = now - h.ev.time;
    const intensity = Math.max(0, h.ev.loudness * (1 - age / 1.5));
    if (intensity < 0.05) continue;
    const angle = h.bearing - game.hunter.yaw;
    const cue = document.createElement('div');
    cue.className = 'dir-cue';
    cue.style.transform = `rotate(${(angle * 180 / Math.PI - 90).toFixed(2)}deg)`;
    cue.innerHTML = `<div class="arc" style="opacity:${intensity.toFixed(2)}"></div>`;
    els.directionalCues.appendChild(cue);
  }
}

function renderPreyDangerCues(now) {
  // subtle indicator when hunter is close + can see prey
  els.directionalCues.innerHTML = '';
  const dist = game.prey.pos.distanceTo(game.hunter.pos);
  if (dist < 16) {
    const ang = Math.atan2(game.hunter.pos.x - game.prey.pos.x, -(game.hunter.pos.z - game.prey.pos.z)) - game.prey.yaw;
    const intensity = Math.max(0, 1 - dist / 16);
    const cue = document.createElement('div');
    cue.className = 'dir-cue';
    cue.style.transform = `rotate(${(ang * 180 / Math.PI - 90).toFixed(2)}deg)`;
    cue.innerHTML = `<div class="arc" style="opacity:${(intensity*0.5).toFixed(2)};background:linear-gradient(90deg, transparent 0%, rgba(106,227,255,.0) 0%, rgba(106,227,255,.7) 60%, rgba(255,255,255,.95) 100%)"></div>`;
    els.directionalCues.appendChild(cue);
  }
  // hunter detection alert
  if (game.hunter.detected && game.role === 'prey') {
    if (!els.alert.classList.contains('show')) {
      els.alert.textContent = 'DETECTED';
      els.alert.classList.add('show');
      audio.detected();
      game.detections++;
      setTimeout(() => els.alert.classList.remove('show'), 900);
    }
  }
}

// AI prey for hunter mode — heads to extraction, evades when close to hunter
function aiPrey(dt) {
  const p = game.prey, h = game.hunter;
  const now = performance.now() / 1000;
  const target = game.map.extractionPos;
  const toTarget = target.clone().sub(p.pos);
  const distHunter = p.pos.distanceTo(h.pos);

  let dir;
  if (distHunter < 14 && !rayBlocked(p.pos, h.pos, game.map.walls)) {
    // flee perpendicular
    const away = p.pos.clone().sub(h.pos).normalize();
    dir = away;
    p.sprint = true; p.crouch = false;
  } else {
    dir = toTarget.normalize();
    p.sprint = distHunter > 22;
    p.crouch = distHunter < 20 && !p.sprint;
  }

  p.yaw = Math.atan2(-dir.x, -dir.z);

  const inputVec = { fwd: 1, strafe: 0, sprint: p.sprint };
  p.update(dt, inputVec, game.map.walls, game.traps);
}

function endMatch(victory, sub) {
  if (!game.active) return;
  game.active = false;
  audio.stopAmbient();
  document.exitPointerLock?.();

  els.endResult.textContent = victory ? 'VICTORY' : 'DEFEAT';
  els.endResult.classList.toggle('defeat', !victory);
  els.endSub.textContent = sub;
  els.statSound.textContent = game.sound.totalEmitted;
  els.statDetect.textContent = game.detections;
  els.statAbil.textContent = game.abilitiesUsed;
  const t = Math.floor(performance.now()/1000 - game.startTime);
  els.statTime.textContent = `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
  showScreen('end');
}

frame();
