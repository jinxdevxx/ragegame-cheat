// =====================================================================
//  RAGEVERSE – Sound & Musik (alles per WebAudio erzeugt, keine Dateien)
// =====================================================================
let ac = null, master = null, sfxBus = null, musicBus = null;
let muted = false, musicOn = true, intensity = 0, sfxVol = 0.8, musicVol = 0.6;
const last = {};

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.4; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxVol * 1.25; sfxBus.connect(comp);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? musicVol * 0.55 : 0; musicBus.connect(comp);
    startMusic();
  } catch { ac = null; }
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.4; }
export function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.value = on ? musicVol * 0.55 : 0; }
export function setVolumes(sfx, music) {
  sfxVol = sfx; musicVol = music;
  if (sfxBus) sfxBus.gain.value = sfxVol * 1.25;
  if (musicBus) musicBus.gain.value = musicOn ? musicVol * 0.55 : 0;
}
export function setIntensity(v) { intensity = v; } // 0 = Menü, 1 = Run, 2 = Berserker

function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, bus = sfxBus, when = 0) {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, vol = 0.3, freq = 1200, bus = sfxBus, when = 0, type = 'lowpass') {
  if (!noiseBuf) { const len = ac.sampleRate; noiseBuf = ac.createBuffer(1, len, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime + when;
  f.type = type; f.frequency.value = freq; s.buffer = noiseBuf;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

export function sfx(name, v = 1) {
  if (!ac || muted) return;
  const now = performance.now();
  const gap = { coin: 28, hit: 45, crumb: 60, break: 40, thud: 200, boom: 80, hurt: 300 }[name] || 0;
  if (last[name] && now - last[name] < gap) return;
  last[name] = now;
  switch (name) {
    case 'coin': { // Tonhöhe steigt mit jeder Münze in Folge
      const step = Math.min(v, 24);
      const f = 880 * Math.pow(2, (step % 12) / 12) * (step >= 12 ? 2 : 1);
      tone(f, 0.08, 'triangle', 0.12); tone(f * 1.5, 0.06, 'sine', 0.05, 0, sfxBus, 0.02); break;
    }
    case 'hit': tone(170 - v * 60, 0.07, 'square', 0.12, 0.6); noise(0.06, 0.2, 2600); break;
    case 'crumb': noise(0.04, 0.1, 4000); break;
    case 'break': noise(0.22, 0.3 + 0.15 * v, 1000 - v * 400); tone(150 - v * 50, 0.2, 'sawtooth', 0.14, 0.35); tone(60, 0.15, 'sine', 0.25 * v, 0.5); break;
    case 'crate': noise(0.25, 0.35, 1400); [0, 4, 7, 12].forEach((s, i) => tone(660 * Math.pow(2, s / 12), 0.1, 'square', 0.1, 0, sfxBus, i * 0.04)); break;
    case 'thud': tone(70, 0.12, 'sine', 0.3, 0.6); break;
    case 'boom': noise(0.6, 0.5 * v, 450); tone(55, 0.5, 'sine', 0.45, 0.3); break;
    case 'dash': noise(0.2, 0.25, 1800, sfxBus, 0, 'bandpass'); tone(200, 0.16, 'sawtooth', 0.1, 2.5); break;
    case 'slam': tone(45, 0.6, 'sine', 0.6, 0.5); noise(0.5, 0.5, 300); tone(90, 0.25, 'square', 0.15, 0.4); break;
    case 'shock': tone(120, 0.3, 'sine', 0.25, 0.4); break;
    case 'hurt': tone(300, 0.25, 'sawtooth', 0.2, 0.4); noise(0.15, 0.2, 800); break;
    case 'levelup': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(330 * Math.pow(2, s / 12), 0.2, 'square', 0.13, 0, sfxBus, i * 0.06)); break;
    case 'event': [0, 7, 12].forEach((s, i) => tone(440 * Math.pow(2, s / 12), 0.12, 'triangle', 0.18, 0, sfxBus, i * 0.06)); break;
    case 'quest': [0, 4, 7, 12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.15, 'triangle', 0.2, 0, sfxBus, i * 0.07)); noise(0.3, 0.1, 6000, sfxBus, 0.25, 'highpass'); break;
    case 'callout': { const b = 392 * Math.pow(2, Math.min(v, 6) * 2 / 12); [0, 7, 12].forEach((s, i) => tone(b * Math.pow(2, s / 12), 0.14, 'sawtooth', 0.12, 0, sfxBus, i * 0.05)); break; }
    case 'ready': tone(660, 0.1, 'square', 0.15); tone(990, 0.2, 'square', 0.15, 0, sfxBus, 0.1); break;
    case 'berserk': tone(80, 0.9, 'sawtooth', 0.3, 3); noise(0.8, 0.4, 600); [0, 3, 7, 12].forEach((s, i) => tone(220 * Math.pow(2, s / 12), 0.3, 'sawtooth', 0.12, 0, sfxBus, i * 0.08)); break;
    case 'die': tone(300, 1, 'sawtooth', 0.22, 0.12); noise(0.8, 0.2, 500); break;
    case 'buy': tone(660, 0.08, 'square', 0.15); tone(990, 0.12, 'square', 0.15, 0, sfxBus, 0.07); break;
    case 'unlock': [0, 4, 7, 11, 12, 16, 19, 24].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.22, 'triangle', 0.16, 0, sfxBus, i * 0.07)); break;
    case 'click': tone(500, 0.04, 'triangle', 0.1); break;
    case 'deny': tone(160, 0.15, 'square', 0.12, 0.7); break;
  }
}

// ---------------------------------------------------------------------
// Musik: einfacher Beat, wird im Run und im Berserker-Modus intensiver
// ---------------------------------------------------------------------
const BPM = 128, STEP = 60 / BPM / 4;
const BASS = [0, 0, 12, 0, 0, 0, 10, 0, 0, 0, 12, 0, 7, 0, 5, 0];
const ROOTS = [0, 0, -2, -4];
let nextStep = 0, stepIdx = 0, timer = null;
function startMusic() {
  if (timer) return;
  nextStep = ac.currentTime + 0.1;
  timer = setInterval(() => {
    if (!ac || ac.state !== 'running') return;
    while (nextStep < ac.currentTime + 0.12) { playStep(stepIdx, nextStep - ac.currentTime); nextStep += STEP; stepIdx = (stepIdx + 1) % 64; }
  }, 25);
}
function playStep(i, when) {
  if (!musicOn || muted) return;
  const s = i % 16, bar = Math.floor(i / 16), root = ROOTS[bar];
  const lvl = intensity;
  // Kick
  if (s % 4 === 0 && lvl >= 1) tone(110, 0.18, 'sine', 0.55, 0.3, musicBus, when);
  if (s % 8 === 0 && lvl === 0) tone(110, 0.18, 'sine', 0.35, 0.3, musicBus, when);
  // Snare
  if (lvl >= 1 && (s === 4 || s === 12)) noise(0.12, 0.25, 2500, musicBus, when, 'highpass');
  // Hi-Hat
  if (s % 2 === 1 && lvl >= 1) noise(0.03, lvl >= 2 ? 0.12 : 0.07, 8000, musicBus, when, 'highpass');
  // Bass
  if (BASS[s] || s === 0) tone(55 * Math.pow(2, (BASS[s] + root) / 12), STEP * 1.6, 'sawtooth', lvl ? 0.13 : 0.07, 0, musicBus, when);
  // Lead im Berserker
  if (lvl >= 2 && s % 2 === 0) tone(440 * Math.pow(2, ([0, 3, 7, 10, 12, 10, 7, 3][(s / 2) % 8] + root) / 12), STEP * 0.9, 'square', 0.06, 0, musicBus, when);
}
