// =====================================================================
//  RAGEVERSE – Einstieg: Game-Loop, Steuerung, Menüs, Shop, Updates
// =====================================================================
import * as C from './config.js?v=0.8.3';
import { monsterData, talentRank, talentFree, canRaiseTalent, raiseTalent, Game, computeStats, upgradeLevel, upgradeCost, fmt, money, tierOf, charDef, mapDef, dmLevel, dmCost, prestigeGain, doPrestige } from './game.js?v=0.8.3';
import { render, drawMonsterPreview } from './render.js?v=0.8.3';
import { initAudio, setMuted, setMusic, setIntensity, setVolumes, sfx } from './audio.js?v=0.8.3';
import { loadSave, writeSave, listSlots, loadSlotInto, createSlot, deleteSlot, getSlot, loadMeta } from './save.js?v=0.8.3';
import { PATCH_NOTES, VERSION } from './patchnotes.js?v=0.8.3';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const canvas = $('game');
const ctx = canvas.getContext('2d');
const save = loadSave();
const params = new URLSearchParams(location.search);
// Test-Modus: URL-Parameter laden direkt einen Spielstand (Standard: Platz 1)
const TEST_KEYS = ['scrap', 'chaos', 'upgrades', 'unlock', 'char', 'map', 'world', 'slot'];
const testMode = TEST_KEYS.some(k => params.has(k));
if (testMode) {
  const i = Math.max(0, Math.min(2, (Number(params.get('slot')) || 1) - 1));
  if (!listSlots()[i]) createSlot(i, 'Test');
  loadSlotInto(save, i);
}

// Test-Parameter: ?scrap=100000 ?chaos=5000 ?world=3 ?upgrades=10 ?char=golem ?map=west ?unlock=1
if (params.has('scrap')) save.scrap = Number(params.get('scrap')) || 0;
if (params.has('chaos')) save.chaos = Number(params.get('chaos')) || 0;
if (params.has('upgrades')) { const l = Number(params.get('upgrades')) || 0; C.UPGRADES.forEach(u => save.upgrades[u.id] = Math.min(u.max, l)); }
if (params.has('unlock')) { save.unlockedChars = C.CHARACTERS.map(c => c.id); save.mapBest = { suburb: 7 }; save.bestWorld = 7; save.totalKills = 99999; }
if (params.has('char')) save.selectedChar = params.get('char');
if (params.has('map')) save.selectedMap = params.get('map');

let inRun = false;
const game = new Game(save, {
  sfx: (n, v) => { if (inRun) sfx(n, v); },
  onWorld: (w, choices) => { if (inRun) showMutation(w, choices); else game.chooseMutation(null); },
  onEnd: s => { if (inRun) showResults(s); else game.start(); },
  onEvent: e => { if (inRun) showEvent(e); },
  onCallout: (text, i) => { if (inRun) callout(text, i); },
  onBerserk: on => { if (inRun) { setIntensity(on ? 2 : 1); if (on) callout('BERSERKER!', 5); } },
  onBerserkReady: () => { if (inRun) hint('😡 Berserker bereit! Drück <b>R</b> (oder tippe 😡)', 3); },
  onQuest: (q, done) => { if (inRun) questUpdate(q, done); },
  onBoss: (what) => {
    if (!inRun) return;
    if (what === 'spawn') { $('boss-bar').hidden = false; document.body.classList.add('bossfight'); $('hud-quest').hidden = true; $('hud-event').hidden = true; callout('ZORNOS ERWACHT!', 5); setIntensity(2); }
    if (what === 'dead') { $('boss-bar').hidden = true; document.body.classList.remove('bossfight'); callout('ZORNOS BESIEGT!', 5); setIntensity(1); }
  },
});
window.__rv = { game, save, C, computeStats, writeSave, get pointer() { return pointer; }, get input() { return input; } };

// ------------------------------------------------------------------
// Canvas-Größe
// ------------------------------------------------------------------
let W = 0, H = 0, DPR = 1;
// Adaptive Auflösung: ruckelt es, wird intern gröber gerendert (bis 0,6× CSS-Pixel), läuft es flüssig, wieder feiner
const RES_STEPS = [1, 0.85, 0.72, 0.6, 0.5, 0.4];
let resStep = 0, slowT = 0, fastT = 0, emaDt = 16.7;
function adaptRes(ms) {
  if (ms > 100) return; // Tab-Wechsel o. Ä. ignorieren
  emaDt += (ms - emaDt) * 0.05;
  const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
  if (emaDt > 22) { slowT += ms; fastT = 0; } else if (emaDt < 17.5) { fastT += ms; slowT = 0; } else { slowT = 0; fastT = 0; }
  const minScale = 0.6 / baseDpr; // nie unter 0,6 CSS-Pixel
  if (slowT > 1500 && resStep < RES_STEPS.length - 1 && RES_STEPS[resStep + 1] >= minScale - 1e-6) { resStep++; slowT = 0; emaDt = 16.7; resize(); }
  else if (fastT > 5000 && resStep > 0) { resStep--; fastT = 0; resize(); }
}
window.__res = () => ({ step: resStep, dpr: DPR, ema: emaDt });
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2) * RES_STEPS[resStep];
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  game.vw = W; game.vh = H;
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------
// Steuerung
// ------------------------------------------------------------------
const input = { dx: 0, dy: 0, dash: false, slam: false, berserk: false, skill: false };
const keys = new Set();
const pointer = { active: false, x: 0, y: 0, touch: false };
let lastTap = 0;

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === 'escape') { e.preventDefault(); onEscape(); return; }
  if (!inRun) return;
  if (k.startsWith('arrow') || k === ' ') e.preventDefault(); // Seite nicht scrollen
  if (e.repeat) return;
  if (game.state !== 'play') { if (k === 'p' && current === 'screen-pause') resume(); return; }
  if (k === ' ') input.dash = true;
  if (k === 'e' || k === 'shift') input.slam = true;
  if (k === 'r' || k === 'q') input.berserk = true;
  if (k === 'f') input.skill = true;
  if (k === 'p') pause();
});
// Escape: im Run → Pause + Einstellungen; in Fenstern → zurück
function onEscape() {
  if (!$('confirm-modal').hidden) { closeConfirm(); return; }
  if (!$('egg-modal').hidden) { $('egg-modal').hidden = true; return; }
  if (!$('notes-modal').hidden) { $('notes-modal').hidden = true; return; }
  if (current === 'screen-settings') { closeSettings(); return; }
  if (current === 'screen-mutation') return;
  if (inRun && game.state === 'play') { pause(); openSettings('screen-pause'); return; }
  if (inRun && current === 'screen-pause') { resume(); return; }
  if (current === 'screen-help') { back(); return; }
  if (current === 'screen-talents') { openChars(); return; }
  if (current === 'screen-menu') { openSettings('screen-menu'); return; }
  if (current === 'screen-slots') { if (getSlot() >= 0) openMenu(); return; }
  if (!inRun) openMenu();
}
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); pointer.active = false; if (game.state === 'play' && inRun) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play' && inRun) pause(); else if (!document.hidden) checkForUpdate(); });

const mouseAllowed = () => save.settings.control !== 'keys';
canvas.addEventListener('pointerdown', e => {
  initAudio();
  pointer.x = e.clientX; pointer.y = e.clientY;
  pointer.touch = e.pointerType !== 'mouse';
  if (pointer.touch) {
    // Touch/Stift: Finger halten = laufen (immer aktiv)
    pointer.active = true;
    document.body.classList.add('touch');
    const now = performance.now();
    if (now - lastTap < 300) input.dash = true;
    lastTap = now;
  } else if (e.button === 0 && mouseAllowed()) {
    pointer.active = true; // Maus: nur solange die linke Taste gedrückt ist
  } else if (e.button === 2 && mouseAllowed()) { input.dash = true; }
});
canvas.addEventListener('pointermove', e => {
  pointer.x = e.clientX; pointer.y = e.clientY;
  // Sicherheitsnetz: Ist keine Maustaste mehr gedrückt, sofort stoppen
  if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) pointer.active = false;
});
window.addEventListener('pointerup', () => { pointer.active = false; });
window.addEventListener('mouseup', () => { pointer.active = false; });
document.addEventListener('mouseleave', () => { if (!pointer.touch) pointer.active = false; });
canvas.addEventListener('pointercancel', () => { pointer.active = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
const abBtn = (id, key) => $(id).addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); input[key] = true; });
abBtn('ab-dash', 'dash'); abBtn('ab-slam', 'slam'); abBtn('ab-berserk', 'berserk'); abBtn('ab-skill', 'skill');

function readInput() {
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (dx || dy) { const l = Math.hypot(dx, dy); input.dx = dx / l; input.dy = dy / l; return; }
  if (pointer.active && game.p && (pointer.touch || mouseAllowed())) {
    const px = (game.p.x - game.cam.x) * game.cam.zoom + W / 2;
    const py = (game.p.y - game.p.r - game.cam.y) * game.cam.zoom + H / 2;
    const R = game.p.r * game.cam.zoom;
    const vx = pointer.x - px, vy = pointer.y - py, d = Math.hypot(vx, vy);
    if (d < R * 0.5) { input.dx = 0; input.dy = 0; return; }
    const m = Math.min(1, (d - R * 0.5) / (R * 2.5));
    input.dx = vx / d * m; input.dy = vy / d * m;
    return;
  }
  input.dx = 0; input.dy = 0;
}

// ------------------------------------------------------------------
// Game-Loop
// ------------------------------------------------------------------
let lastT = performance.now(), menuTime = 0;
function frame(t) {
  let dt = (t - lastT) / 1000; lastT = t;
  if (!document.hidden) adaptRes(dt * 1000);
  if (dt > 0.05) dt = 0.05;
  const time = t / 1000;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (inRun) {
    readInput();
    if (!(window.__skip && window.__skip.update)) game.update(dt, input);
    if (!(window.__skip && window.__skip.render)) render(ctx, game, W, H, time);
    if (!(window.__skip && window.__skip.hud)) updateHud(time);
  } else {
    // Menü-Hintergrund: Demo-Welt, das Monster stapft herum
    menuTime += dt;
    if (!game.p || game.state === 'over' || game.state === 'dying') { game.start(); }
    game.state = 'play';
    const demo = { dx: Math.cos(menuTime * 0.3), dy: Math.sin(menuTime * 0.21), dash: false };
    game.p.rage = game.stats.rageMax; game.quest = null; game.questT = 999;
    game.update(dt, demo);
    if (game.state === 'mutation') game.chooseMutation(null);
    render(ctx, game, W, H, time);
    animatePreviews(time);
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------
// Screens
// ------------------------------------------------------------------
const SCREENS = ['screen-talents', 'screen-achievements', 'screen-menu', 'screen-shop', 'screen-chars', 'screen-maps', 'screen-help', 'screen-results', 'screen-mutation', 'screen-pause', 'screen-settings', 'screen-slots'];
let current = 'screen-menu', helpFrom = 'screen-menu';
function show(id) {
  current = id;
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('hud').hidden = !inRun;
  document.body.classList.toggle('playing', inRun && !id);
  if (!inRun || id) flushPendingToast();
}

function startRun() {
  initAudio(); sfx('click');
  inRun = true;
  const opts = {};
  if (params.has('world')) { const w = C.WORLDS[Number(params.get('world'))]; if (w) opts.radius = Math.max(w.minRadius * 1.15, 10); }
  game.start(opts);
  lastCombo = 0; hudCache = {};
  const sk = game.char.skill; $('ab-skill-ic').textContent = sk.icon; $('ab-skill-name').textContent = sk.name;
  renderMuts();
  $('hud-quest').hidden = true; $('hud-event').hidden = true; $('callout').hidden = true; $('hint').hidden = true;
  $('boss-bar').hidden = true; document.body.classList.remove('bossfight');
  setIntensity(1);
  show(null);
  showBanner(`WELT ${game.world + 1}: ${game.worlds[game.world].name.toUpperCase()}`);
  tutorial();
}
function pause() { if (game.state !== 'play' || !inRun) return; game.state = 'paused'; show('screen-pause'); }
function resume() { if (game.state !== 'paused') return; game.state = 'play'; lastT = performance.now(); keys.clear(); pointer.active = false; show(null); }
function back() { sfx('click'); if (current === 'screen-help' && helpFrom === 'screen-pause') { show('screen-pause'); return; } openMenu(); }

document.querySelectorAll('[data-play]').forEach(b => b.onclick = startRun);
document.querySelectorAll('[data-back]').forEach(b => b.onclick = back);
$('btn-play').onclick = startRun;
$('btn-shop-menu').onclick = () => openShop();
$('btn-res-shop').onclick = () => openShop();
$('btn-res-menu').onclick = () => openMenu();
$('btn-chars').onclick = () => openChars();
$('btn-maps').onclick = () => openMaps();
$('btn-help').onclick = () => openHelp('screen-menu');
$('btn-pause-help').onclick = () => openHelp('screen-pause');
$('btn-pause-settings').onclick = () => openSettings('screen-pause');
$('btn-settings').onclick = () => openSettings('screen-menu');
$('menu-slot').onclick = () => openSlots();
$('btn-achievements').onclick = () => openAchievements();

// ------------------------------------------------------------------
// Erfolge & Statistik
// ------------------------------------------------------------------
function statValue(stat) {
  const st = save.stats || {};
  switch (stat) {
    case 'kills': return save.totalKills || 0;
    case 'maxWorld': return bestWorldAny();
    case 'runs': return save.runs || 0;
    case 'prestiges': return save.prestiges || 0;
    case 'monsters': return save.unlockedChars.length;
    case 'bestTier': return Math.max(save.bestTier || 0, tierOf(save.scrap));
    case 'evos': return Object.keys(save.evos || {}).length;
    case 'maps': return Object.keys(save.mapBest || {}).length;
    case 'bossKills': return save.bossKills || 0;
    case 'won420': return save.won420 || 0;
    case 'skinTier': return Math.max(0, ...Object.values(save.skins || {}).map(l => Math.max(0, ...l.map(id => C.SKINS.findIndex(k => k.id === id) + 1))));
    default: return st[stat] || 0;
  }
}
function achDone() { return C.ACHIEVEMENTS.filter(a => save.achievements[a.id]).length; }
function checkAchievements() {
  const got = [];
  for (const a of C.ACHIEVEMENTS) {
    if (save.achievements[a.id] || statValue(a.stat) < a.goal) continue;
    save.achievements[a.id] = Date.now(); save.chaos += a.reward; save.totalChaos = (save.totalChaos || 0) + a.reward; got.push(a);
  }
  // Geheimes Monster: alle Erfolge geschafft
  const secret = C.CHARACTERS.find(c => c.secret);
  if (secret && !save.unlockedChars.includes(secret.id) && achDone() >= C.ACHIEVEMENTS.length) {
    save.unlockedChars.push(secret.id); got.push({ icon: '🌌', name: 'GEHEIMES MONSTER: ' + secret.name.toUpperCase(), reward: 0, secret: true });
  }
  if (got.length) { writeSave(save); got.forEach((a, i) => setTimeout(() => achToast(a), i * 700)); }
  return got;
}
function achToast(a) {
  const el = document.createElement('div'); el.className = 'ach-toast';
  el.innerHTML = a.secret ? `<div class="ai">${a.icon}</div><div><small>ALLE ERFOLGE GESCHAFFT!</small><b>${esc(a.name)}</b><span>Schau in die Monster-Auswahl</span></div>`
    : `<div class="ai">${a.icon}</div><div><small>ERFOLG FREIGESCHALTET</small><b>${esc(a.name)}</b><span>+${fmt(a.reward)} ☠ Chaos</span></div>`;
  if (a.secret) { el.classList.add('secret'); setTimeout(() => sfx('unlock'), 300); }
  $('ach-toasts').appendChild(el); sfx('quest'); setTimeout(() => el.remove(), 4100);
}
let achTab = 'ach';
function openAchievements() { sfx('click'); checkAchievements(); renderAchievements(); show('screen-achievements'); }
function renderAchievements() {
  const done = C.ACHIEVEMENTS.filter(a => save.achievements[a.id]).length;
  $('ach-count').textContent = `${done}/${C.ACHIEVEMENTS.length}`;
  document.querySelectorAll('#ach-tabs [data-atab]').forEach(b => b.classList.toggle('on', b.dataset.atab === achTab));
  if (achTab === 'stats') {
    const st = save.stats || {};
    const h = Math.floor((st.playTime || 0) / 3600), m = Math.floor((st.playTime || 0) % 3600 / 60);
    const rows = [
      ['💥', 'Objekte zerstört', fmt(save.totalKills || 0)], ['⚙', 'Schrott verdient (gesamt)', money(save.totalScrap || 0, true)],
      ['☠', 'Chaos verdient (gesamt)', fmt(save.totalChaos || 0)], ['🔁', 'Runs gespielt', fmt(save.runs || 0)],
      ['⏱', 'Spielzeit', `${h} h ${m} min`], ['🗺', 'Weiteste Welt', `${C.WORLDS[bestWorldAny()].name} (Welt ${bestWorldAny() + 1})`],
      ['⛓', 'Beste Kombo', fmt(st.bestCombo || 0)], ['⏳', 'Längster Run', `${Math.floor((st.longestRun || 0) / 60)}:${String(Math.floor((st.longestRun || 0) % 60)).padStart(2, '0')}`],
      ['✨', 'Goldene Objekte', fmt(st.golden || 0)], ['📦', 'Schrottkisten', fmt(st.crates || 0)],
      ['🧨', 'Explosionen', fmt(st.explosions || 0)], ['😡', 'Berserker gezündet', fmt(st.berserks || 0)],
      ['💥', 'Stampfer', fmt(st.slams || 0)], ['🎯', 'Monster-Skills', fmt(st.skills || 0)],
      ['📜', 'Aufträge erfüllt', fmt(st.quests || 0)], ['💥', 'Urknalle', fmt(save.prestiges || 0)],
      ['◆', 'Dunkle Materie (gesamt)', fmt(save.totalDarkMatter || 0)], ['😈', 'ZORNOS besiegt', fmt(save.bossKills || 0)],
      ['👹', 'Monster', `${save.unlockedChars.length}/${C.CHARACTERS.length}`], ['🧬', 'Evolutionen', `${Object.keys(save.evos || {}).length}/${C.SKILL_EVOS.length}`],
    ];
    $('ach-grid').innerHTML = `<div class="stat-list">${rows.map(([i, l, v]) => `<div class="stat"><b>${v}</b><small>${i} ${l}</small></div>`).join('')}</div>`;
    return;
  }
  // nach Gruppen: erreichte + nächste Stufe je Gruppe zeigen
  const groups = [...new Set(C.ACHIEVEMENTS.map(a => a.group))];
  $('ach-grid').innerHTML = groups.map(gid => {
    const list = C.ACHIEVEMENTS.filter(a => a.group === gid);
    return list.filter((a, i) => save.achievements[a.id] || i === 0 || save.achievements[list[i - 1].id]).map(a => {
      const v = statValue(a.stat), d = !!save.achievements[a.id], pct = Math.min(100, v / a.goal * 100);
      return `<div class="ach ${d ? 'done' : ''}"><div class="ai">${a.icon}</div><div class="at"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
        ${d ? `<span class="rw">✔ erhalten: +${fmt(a.reward)} ☠</span>` : `<span class="rw">Belohnung: +${fmt(a.reward)} ☠</span><div class="bar tiny"><div style="width:${pct.toFixed(1)}%"></div></div>`}</div></div>`;
    }).join('');
  }).join('');
}
$('ach-tabs').addEventListener('click', e => { const b = e.target.closest('[data-atab]'); if (!b) return; achTab = b.dataset.atab; sfx('click'); renderAchievements(); });

// ------------------------------------------------------------------
// Spielstände
// ------------------------------------------------------------------
const slotPreviews = [];
let slotDelArmed = -1, slotNaming = -1;
function fmtDate(t) {
  if (!t) return '–';
  const d = new Date(t), now = new Date();
  const same = d.toDateString() === now.toDateString();
  return same ? 'heute, ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('de-DE');
}
function openSlots() {
  inRun = false; setIntensity(0);
  const slots = listSlots(), last = loadMeta().lastSlot;
  slotPreviews.length = 0;
  $('slot-grid').innerHTML = slots.map((d, i) => {
    if (!d) {
      if (slotNaming === i) return `<div class="slot empty">
        <div class="slot-num">Platz ${i + 1}</div>
        <input type="text" id="slot-name-input" maxlength="24" placeholder="Name, z. B. ${['Grumpfs Rache', 'Chaos-Lauf', 'Kollege'][i]}" autocomplete="off">
        <div class="slot-actions"><button class="btn" data-cancel>Abbrechen</button><button class="btn primary" data-create="${i}">Erstellen</button></div>
      </div>`;
      return `<button class="slot empty" data-new="${i}"><div class="slot-new">＋</div><div class="slot-name" style="text-align:center">Neuer Spielstand</div><div class="slot-num" style="text-align:center">Platz ${i + 1}</div></button>`;
    }
    const ch = charDef(d.selectedChar), mp = mapDef(d.selectedMap);
    const best = Math.max(d.bestWorld || 0, ...Object.values(d.mapBest || {}), 0);
    return `<div class="slot ${i === last ? 'last' : ''}">
      <canvas width="240" height="160" data-slotprev="${i}"></canvas>
      <div><div class="slot-num">Platz ${i + 1}${i === last ? ' · zuletzt gespielt' : ''}</div><div class="slot-name">${esc(d.name || 'Spielstand ' + (i + 1))}</div></div>
      <div class="slot-stats">
        <span>Monster: <b>${esc(ch.name)}</b></span><span>Karte: <b>${esc(mp.name)}</b></span>
        <span>Weiteste Welt: <b>${best + 1}: ${esc(C.WORLDS[best].name)}</b></span><span>Runs: <b>${d.runs || 0}</b></span>
        <span><b>${money(d.scrap || 0)}</b></span><span>☠ <b>${fmt(d.chaos || 0)}</b></span>
        <span style="grid-column:1/-1">Zuletzt: <b>${fmtDate(d.lastPlayed)}</b></span>
      </div>
      <div class="slot-actions">
        <button class="btn del" data-del="${i}" title="Spielstand löschen">🗑</button>
        <button class="btn primary" data-load="${i}">Spielen</button>
      </div>
    </div>`;
  }).join('');
  $('slot-grid').querySelectorAll('canvas[data-slotprev]').forEach(cv => { const d = slots[Number(cv.dataset.slotprev)]; slotPreviews.push({ cv, char: charDef(d.selectedChar), stage: Math.max(d.bestWorld || 0, ...Object.values(d.mapBest || {}), 0) }); });
  $('slots-back-row').hidden = getSlot() < 0;
  show('screen-slots');
  const inp = $('slot-name-input');
  if (inp) { inp.focus(); inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') $('slot-grid').querySelector('[data-create]').click(); if (e.key === 'Escape') { slotNaming = -1; openSlots(); } }; }
}
$('slot-grid').addEventListener('click', e => {
  initAudio();
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.new !== undefined) { slotNaming = Number(t.dataset.new); slotDelArmed = -1; sfx('click'); openSlots(); return; }
  if (t.dataset.cancel !== undefined) { slotNaming = -1; openSlots(); return; }
  if (t.dataset.create !== undefined) {
    const i = Number(t.dataset.create);
    createSlot(i, $('slot-name-input').value); slotNaming = -1;
    loadSlotInto(save, i); sfx('unlock'); game.start(); openMenu(); return;
  }
  if (t.dataset.load !== undefined) { const i = Number(t.dataset.load); slotDelArmed = -1; loadSlotInto(save, i); sfx('buy'); game.start(); openMenu(); return; }
  if (t.dataset.del !== undefined) {
    const i = Number(t.dataset.del), d = listSlots()[i];
    sfx('click');
    askConfirm('Spielstand löschen?', `„${d && d.name ? d.name : 'Spielstand ' + (i + 1)}“ wird mit allem Fortschritt (Schrott, Chaos, Upgrades, Monster, Erfolge) endgültig gelöscht. Das kann nicht rückgängig gemacht werden.`, () => {
      deleteSlot(i); sfx('deny');
      if (getSlot() === i) location.reload(); else openSlots();
    });
  }
});
$('btn-slots-back').onclick = () => openMenu();

// ------------------------------------------------------------------
// Einstellungen
// ------------------------------------------------------------------
let settingsFrom = 'screen-menu';
const CONTROL_DESC = {
  keys: 'Nur Tastatur (WASD/Pfeiltasten). Die Maus steuert gar nicht.',
  mouse: 'Linke Maustaste gedrückt halten = Monster läuft zur Maus. Rechtsklick = Ansturm.',
  both: 'Tastatur und Maus (Taste halten) gleichzeitig.',
};
function openSettings(from) {
  settingsFrom = from; sfx('click');
  renderSettings();
  show('screen-settings');
}
function closeSettings() {
  sfx('click');
  if (settingsFrom === 'screen-pause' && inRun) show('screen-pause'); else openMenu();
}
function renderSettings() {
  const st = save.settings;
  document.querySelectorAll('#set-control button').forEach(b => b.classList.toggle('on', b.dataset.v === st.control));
  $('set-control-desc').textContent = CONTROL_DESC[st.control];
  document.querySelectorAll('#set-fx button').forEach(b => b.classList.toggle('on', b.dataset.v === st.fx));
  $('set-sfx').value = st.sfx; $('set-music').value = st.music;
  $('set-shake').classList.toggle('on', st.shake);
  $('set-hints').classList.toggle('on', st.hints);
}
function applySettings() {
  const st = save.settings;
  setVolumes(st.sfx / 100, st.music / 100);
  game.fx = { shake: st.shake, low: st.fx === 'low' };
  pointer.active = false;
  writeSave(save);
}
$('set-control').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; save.settings.control = b.dataset.v; applySettings(); renderSettings(); sfx('click'); });
$('set-fx').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; save.settings.fx = b.dataset.v; applySettings(); renderSettings(); sfx('click'); });
$('set-sfx').addEventListener('input', e => { save.settings.sfx = Number(e.target.value); applySettings(); });
$('set-sfx').addEventListener('change', () => sfx('coin', 6));
$('set-music').addEventListener('input', e => { save.settings.music = Number(e.target.value); applySettings(); });
$('set-shake').onclick = () => { save.settings.shake = !save.settings.shake; applySettings(); renderSettings(); sfx('click'); };
$('set-hints').onclick = () => { save.settings.hints = !save.settings.hints; applySettings(); renderSettings(); sfx('click'); };
$('btn-settings-close').onclick = closeSettings;
$('btn-settings-done').onclick = closeSettings;
$('btn-pause').onclick = pause;
$('btn-resume').onclick = resume;
// Easter Egg: geheime Karte 420 freigeschaltet
function showEgg420() {
  if (save.egg420 || current !== 'screen-menu') return;
  save.egg420 = true; writeSave(save);
  $('egg-modal').hidden = false; sfx('unlock'); setTimeout(() => sfx('berserk'), 350);
}
$('egg-go').onclick = () => { $('egg-modal').hidden = true; save.selectedMap = '420'; writeSave(save); openMaps(); };
$('egg-later').onclick = () => { $('egg-modal').hidden = true; };

// Sicherheitsabfrage (z. B. Spielstand löschen). „Löschen“ wird erst nach kurzer Pause klickbar.
let confirmCb = null;
function askConfirm(title, text, cb) {
  confirmCb = cb; $('confirm-title').textContent = title; $('confirm-text').textContent = text;
  const y = $('confirm-yes'); y.disabled = true; setTimeout(() => { y.disabled = false; }, 700);
  $('confirm-modal').hidden = false;
}
function closeConfirm() { $('confirm-modal').hidden = true; confirmCb = null; }
$('confirm-no').onclick = closeConfirm;
$('confirm-yes').onclick = () => { const cb = confirmCb; closeConfirm(); if (cb) cb(); };

// Run beenden: Schrott und Chaos werden behalten (wie bei einem normalen Run-Ende)
function endRun() { if (!inRun || !game.p || (game.state !== 'play' && game.state !== 'paused')) return; game.state = 'play'; game.p.rage = 0; game.die(); show(null); }
$('btn-quit').onclick = endRun;
let endArmed = 0;
$('btn-endrun').onclick = () => {
  const b = $('btn-endrun');
  if (!endArmed) { endArmed = setTimeout(() => { endArmed = 0; b.classList.remove('armed'); b.innerHTML = '🏁 <span>Run beenden</span>'; }, 3000); b.classList.add('armed'); b.innerHTML = '🏁 <span>Sicher? Nochmal klicken</span>'; sfx('click'); return; }
  clearTimeout(endArmed); endArmed = 0; b.classList.remove('armed'); b.innerHTML = '🏁 <span>Run beenden</span>'; endRun();
};

function bestWorldAny() { return Math.max(save.bestWorld || 0, ...Object.values(save.mapBest || {}), 0); }
function reqMet(req) {
  if (!req) return true;
  if (req.kills && (save.totalKills || 0) < req.kills) return false;
  if (req.boss && !(save.bossKills > 0)) return false;
  if (req.allAch && achDone() < C.ACHIEVEMENTS.length) return false;
  if (req.world !== undefined && bestWorldAny() < req.world) return false;
  return true;
}
function reqProgress(req) {
  if (!req) return '';
  if (req.kills) return `${fmt(Math.min(save.totalKills || 0, req.kills))} / ${fmt(req.kills)}`;
  if (req.world !== undefined) return reqMet(req) ? 'erreicht' : `bisher: Welt ${bestWorldAny() + 1} (${C.WORLDS[bestWorldAny()].name})`;
  if (req.boss) return reqMet(req) ? 'besiegt' : 'noch nicht besiegt';
  if (req.allAch) return `${achDone()} / ${C.ACHIEVEMENTS.length}`;
  return '';
}

function openMenu() {
  if (getSlot() < 0) { openSlots(); return; }
  if (save.bossKills > 0 && !save.egg420) setTimeout(showEgg420, 500); // Easter Egg nach dem ZORNOS-Sieg
  inRun = false; setIntensity(0);
  $('menu-slot-name').textContent = save.name || 'Spielstand';
  const ch = charDef(save.selectedChar), mp = mapDef(save.selectedMap);
  $('menu-char').innerHTML = `👹 <b>${esc(ch.name)}</b> <small>${esc(ch.title)}</small>`;
  $('menu-map').innerHTML = `${mp.icon} <b>${esc(mp.name)}</b>${mp.scrapMult > 1 ? ` <small>×${mp.scrapMult} Schrott</small>` : ''}`;
  $('menu-scrap').textContent = money(save.scrap);
  $('menu-scrap-name').textContent = C.CURRENCY_TIERS[tierOf(save.scrap)].name;
  $('menu-chaos').textContent = fmt(save.chaos);
  $('menu-dm').textContent = fmt(save.darkMatter || 0);
  $('menu-ach').textContent = `${C.ACHIEVEMENTS.filter(a => save.achievements[a.id]).length}/${C.ACHIEVEMENTS.length}`;
  $('menu-dm-pill').hidden = !(save.darkMatter || save.prestiges);
  const w = C.WORLDS[bestWorldAny()] || C.WORLDS[0];
  $('menu-stats').innerHTML = save.runs ? `
    <div class="stat"><b>${w.name}</b><small>Weiteste Welt</small></div>
    <div class="stat"><b>${fmt(save.totalKills || 0)}</b><small>Zerstört</small></div>
    <div class="stat"><b>${save.runs}</b><small>Runs</small></div>` : '';
  show('screen-menu');
}

// ------------------------------------------------------------------
// Schurkenhöhle (Upgrades + Urknall)
// ------------------------------------------------------------------
let shopTab = 'body', bangArmed = false;
function openShop() { inRun = false; setIntensity(0); sfx('click'); bangArmed = false; renderShop(); show('screen-shop'); }
function renderShop() {
  $('shop-scrap').textContent = money(save.scrap, true);
  $('shop-dm').textContent = fmt(save.darkMatter || 0);
  $('shop-dm-pill').hidden = !(save.darkMatter || save.prestiges || prestigeGain(save) > 0);
  const bangReady = prestigeGain(save) > 0;
  const affordable = cat => C.UPGRADES.filter(u => u.cat === cat && upgradeLevel(save, u.id) < u.max && save.scrap >= upgradeCost(u, upgradeLevel(save, u.id))).length;
  $('shop-tabs').innerHTML = C.UPGRADE_CATS.map(c => { const n = affordable(c.id); return `<button class="tab ${shopTab === c.id ? 'on' : ''}" data-tab="${c.id}">${c.icon} ${c.name}${n ? `<span class="cnt">${n}</span>` : ''}</button>`; }).join('')
    + `<button class="tab evo ${shopTab === 'evo' ? 'on' : ''}" data-tab="evo">🧬 Evolution${evoReady() ? `<span class="cnt">${evoReady()}</span>` : ''}</button>`
    + `<button class="tab bang ${shopTab === 'bang' ? 'on' : ''}" data-tab="bang">💥 Urknall${bangReady ? '<span class="cnt">!</span>' : ''}</button>`;
  if (shopTab === 'bang') { renderBang(); return; }
  if (shopTab === 'evo') { renderEvo(); return; }
  const cat = C.UPGRADE_CATS.find(c => c.id === shopTab);
  const base = computeStats({ upgrades: {} }, [], 'grumpf');
  const st = computeStats(save, [], 'grumpf'); // inkl. Masterplan-Boni (◆)
  const dmOnly = computeStats({ upgrades: {}, dmPerks: save.dmPerks || {} }, [], 'grumpf');
  const dmNote = (key, label) => { const f = dmOnly[key] / base[key]; return f > 1.001 ? ` <span class="dmtag">◆ ×${f.toFixed(2)} ${label}</span>` : ''; };
  const parts = [];
  const f = (k, label) => { const x = dmOnly[k] / base[k]; if (x > 1.001) parts.push(`×${x.toFixed(2)} ${label}`); };
  f('scrapMult', 'Schrott'); f('damage', 'Schaden'); f('absorb', 'Wachstum'); f('rageMax', 'Wut'); f('startRadius', 'Startgröße'); f('chaosMult', 'Chaos');
  $('shop-tab-desc').innerHTML = esc(cat.desc + ' Gilt für alle Monster und Karten.') + (parts.length ? `<br><span class="dmtag">🧠 Masterplan aktiv (für immer): ${parts.join(' · ')}</span>` : '');
  const effect = {
    size: () => `Start ${(st.startRadius / base.startRadius).toFixed(2)}×${dmNote('startRadius', 'Masterplan')}`,
    rage: () => `${Math.round(st.rageMax)} Wut${dmNote('rageMax', 'Masterplan')}`,
    calm: () => `−${Math.round((1 - st.rageDrain / base.rageDrain) * 100)} % Verlust`,
    dmg: () => `${st.damage.toFixed(2)}× Schaden${dmNote('damage', 'Masterplan')}`,
    hard: () => `bis ${Math.round(st.breakRatio * 100)} % deiner Größe`,
    speed: () => `${(st.speed / base.speed).toFixed(2)}× Tempo`,
    absorb: () => `${(st.absorb / base.absorb).toFixed(2)}× Wachstum${dmNote('absorb', 'Masterplan')}`,
    scrap: () => `${(st.scrapMult / base.scrapMult).toFixed(2)}× Schrott${dmNote('scrapMult', 'Masterplan')}`,
    magnet: () => `Reichweite ${(2.5 + st.magnet * 2).toFixed(1)}× Körper`,
    dash: () => `${st.dashCooldown.toFixed(1)} s Abklingzeit`,
    slam: () => `${st.slamCooldown.toFixed(1)} s · Radius ${st.slamRadius.toFixed(1)}×`,
    berserk: () => `${st.berserkGain.toFixed(2)}× Aufladung`,
    combo: () => `Fenster ${st.comboWindow.toFixed(1)} s · bis ×${st.comboMax.toFixed(1)}`,
    chaosup: () => `${st.chaosMult.toFixed(2)}× Chaos${dmNote('chaosMult', 'Masterplan')}`,
    luck: () => `${(st.goldenChance * 100).toFixed(1)} % Gold-Chance`,
    crates: () => `${(C.CRATE_CHANCE * st.crateMult * 100).toFixed(1)} % Kisten-Chance`,
    quest: () => `${st.questMult.toFixed(2)}× Auftragsbeute`,
  };
  $('shop-grid').innerHTML = C.UPGRADES.filter(u => u.cat === shopTab).map(u => {
    const l = upgradeLevel(save, u.id), maxed = l >= u.max, cost = upgradeCost(u, l), can = !maxed && save.scrap >= cost;
    const mx = maxBuy(l, u.max, save.scrap, k => upgradeCost(u, k));
    return `<div class="upg ${can ? 'can' : ''}" data-id="${u.id}">
      <div class="upg-top"><div class="upg-icon">${u.icon}</div><div class="upg-txt"><div class="upg-name">${u.name} <span class="lv">Lv ${l}/${u.max}</span></div><div class="upg-lvl">${effect[u.id] ? effect[u.id]() : ''}</div></div></div>
      <div class="upg-desc">${u.desc}</div>
      <div class="bar tiny"><div style="width:${Math.round(l / u.max * 100)}%"></div></div>
      <div class="buy-row"><button class="btn ${can ? 'primary' : ''}" data-buy="${u.id}" ${can ? '' : 'disabled'}>${maxed ? 'MAX' : money(cost)}</button>${mx.n >= 2 ? `<button class="btn max-btn" data-buymax="${u.id}" title="Alles investieren: ${mx.n} Stufen für ${money(mx.cost, true)}">⏫ +${mx.n}</button>` : ''}</div>
    </div>`;
  }).join('');
}
// Wie viele Stufen kann man sich auf einmal leisten? (für den ⏫-Knopf: alles in ein Upgrade)
function maxBuy(l, max, budget, costAt) {
  let n = 0, cost = 0;
  while (l + n < max) { const c = costAt(l + n); if (cost + c > budget) break; cost += c; n++; }
  return { n, cost };
}
// Vorschau: was bringt der Urknall konkret beim Schrott?
function bangPreview(gain) {
  const d = C.DM_PERKS.find(x => x.id === 'dm_scrap');
  let dm = (save.darkMatter || 0) + gain, l = dmLevel(save, 'dm_scrap'), n = 0;
  while (l < d.max && dm >= dmCost(d, l)) { dm -= dmCost(d, l); l++; n++; }
  const now = computeStats(save, [], 'grumpf').scrapMult;
  const after = computeStats({ upgrades: {}, dmPerks: { ...(save.dmPerks || {}), dm_scrap: l } }, [], 'grumpf').scrapMult;
  const keep = dmLevel(save, 'dm_keep') * C.DM_PERKS.find(x => x.id === 'dm_keep').per;
  return `💡 Steckst du alles in <b>Schwarzgeld</b>, startest du danach mit <b>×${(after / C.SCRAP_SCALE).toFixed(2)} Schrott</b> (jetzt mit deinen Upgrades: ×${(now / C.SCRAP_SCALE).toFixed(2)}). `
    + `Deine Upgrades werden ${keep > 0 ? `auf ${Math.round(keep * 100)} % ` : ''}zurückgesetzt – je später du sprengst, desto mehr ◆ gibt es.`;
}

// Skill-Evolutionen (☠ Chaos)
const evoState = e => {
  if (save.evos[e.id]) return 'owned';
  if (e.needs && !save.evos[e.needs]) return 'needs';
  if (upgradeLevel(save, e.upg) < e.lvl) return 'locked';
  return save.chaos >= e.cost ? 'buy' : 'poor';
};
const evoReady = () => C.SKILL_EVOS.filter(e => evoState(e) === 'buy').length;
function renderEvo() {
  $('shop-tab-desc').innerHTML = 'Entwickle deine Fähigkeiten mit <b style="color:var(--chaos)">☠ Chaos</b> weiter. Voraussetzung ist eine Upgrade-Stufe – gekaufte Evolutionen bleiben <b>für immer</b> (auch nach dem Urknall).';
  const abName = { dash: '⚡ Ansturm', slam: '💥 Stampfer', berserk: '😡 Berserker' };
  $('shop-grid').innerHTML = C.SKILL_EVOS.map(e => {
    const st = evoState(e), u = C.UPGRADES.find(x => x.id === e.upg);
    const btn = st === 'owned' ? '<button class="btn" disabled>✔ Entwickelt</button>'
      : st === 'needs' ? `<button class="btn" disabled>🔒 Erst ${esc(C.SKILL_EVOS.find(x => x.id === e.needs).name)}</button>`
      : st === 'locked' ? `<button class="btn" disabled>🔒 ${esc(u.name)} Stufe ${e.lvl} (jetzt ${upgradeLevel(save, e.upg)})</button>`
      : `<button class="btn ${st === 'buy' ? 'primary' : ''}" data-evo="${e.id}" ${st === 'buy' ? '' : 'disabled'}>☠ ${fmt(e.cost)} entwickeln</button>`;
    return `<div class="upg ${st === 'buy' ? 'can' : ''} ${st === 'owned' ? 'owned' : ''}">
      <div class="upg-top"><div class="upg-icon">${e.icon}</div><div class="upg-txt"><div class="upg-name">${esc(e.name)}</div><div class="upg-lvl">${abName[e.ability]} · Evolution ${e.needs ? 'II' : 'I'}</div></div></div>
      <div class="upg-desc">${esc(e.desc)}</div>${btn}</div>`;
  }).join('');
}

function renderBang() {
  const gain = prestigeGain(save), P = C.PRESTIGE;
  const cycleW = C.WORLDS[Math.min(save.cycleBest || 0, C.WORLDS.length - 1)].name;
  $('shop-tab-desc').textContent = '';
  const perks = C.DM_PERKS.map(d => {
    const l = dmLevel(save, d.id), maxed = l >= d.max, cost = dmCost(d, l), can = !maxed && (save.darkMatter || 0) >= cost;
    const mx = maxBuy(l, d.max, save.darkMatter || 0, k => dmCost(d, k));
    const eff = d.id === 'dm_mut' ? `${l} Start-Mutation${l === 1 ? '' : 'en'}` : d.id === 'dm_keep' ? `behält ${Math.round(l * d.per * 100)} % der Stufen` : `+${Math.round(l * d.per * 100)} %`;
    return `<div class="upg dmp ${can ? 'can' : ''}">
      <div class="upg-top"><div class="upg-icon">${d.icon}</div><div class="upg-txt"><div class="upg-name">${d.name} <span class="lv">Lv ${l}/${d.max}</span></div><div class="upg-lvl">${eff}</div></div></div>
      <div class="upg-desc">${d.desc}</div>
      <div class="buy-row"><button class="btn ${can ? 'primary' : ''}" data-dm="${d.id}" ${can ? '' : 'disabled'}>${maxed ? 'MAX' : '◆ ' + fmt(cost)}</button>${mx.n >= 2 ? `<button class="btn max-btn" data-dmmax="${d.id}" title="Alles investieren: ${mx.n} Stufen für ◆ ${fmt(mx.cost)}">⏫ +${mx.n}</button>` : ''}</div>
    </div>`;
  }).join('');
  $('shop-grid').innerHTML = `<div class="bang-panel">
      <h3>💥 Der Urknall</h3>
      <div>Sprenge deinen Fortschritt in die Luft: <b>Schrott und Upgrades</b> sind danach weg. Dafür bekommst du <b>◆ Dunkle Materie</b> für den <b>Bösen Masterplan</b> – Boni, die für immer bleiben. <b>Chaos, Monster, Karten und Rekorde bleiben erhalten.</b></div>
      <div class="bang-stats">
        <div class="stat"><b>${esc(cycleW)}</b><small>Weiteste Welt (dieser Durchgang)</small></div>
        <div class="stat"><b>${money(save.cycleScrap || 0)}</b><small>Schrott seit letztem Urknall</small></div>
        <div class="stat"><b>${save.prestiges || 0}</b><small>Urknalle bisher</small></div>
      </div>
      ${gain > 0
        ? `<div>Urknall jetzt bringt dir: <span class="bang-gain">+${fmt(gain)} ◆</span></div>
           <div class="char-req ok">${bangPreview(gain)}</div>
           <button class="btn bang-btn ${bangArmed ? 'armed' : ''}" id="btn-bang">${bangArmed ? '⚠ Sicher? Nochmal klicken!' : '💥 URKNALL AUSLÖSEN'}</button>`
        : `<div class="char-req">🔒 Erreiche in diesem Durchgang den <b>${esc(C.WORLDS[P.minWorld].name)}</b>, um den Urknall freizuschalten. Je weiter du kommst und je mehr Schrott du sammelst, desto mehr ◆ gibt es.</div>`}
    </div>
    <h3 style="grid-column:1/-1;margin:6px 0 0;color:#7fffe0">🧠 Der Böse Masterplan <small class="muted">(◆ ${fmt(save.darkMatter || 0)})</small></h3>
    ${perks}`;
}
$('shop-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; shopTab = b.dataset.tab; bangArmed = false; sfx('click'); renderShop(); });
$('shop-grid').addEventListener('click', e => {
  const bang = e.target.closest('#btn-bang');
  if (bang) {
    if (!bangArmed) { bangArmed = true; sfx('ready'); renderShop(); setTimeout(() => { bangArmed = false; if (current === 'screen-shop' && shopTab === 'bang') renderShop(); }, 4000); return; }
    const gain = doPrestige(save); writeSave(save); bangArmed = false; checkAchievements();
    const fl = document.createElement('div'); fl.className = 'bang-flash'; document.body.appendChild(fl); setTimeout(() => fl.remove(), 1500);
    sfx('berserk'); setTimeout(() => sfx('unlock'), 400);
    game.start(); renderShop();
    hintMenu(`💥 URKNALL! +${fmt(gain)} ◆ Dunkle Materie`);
    return;
  }
  const evb = e.target.closest('[data-evo]');
  if (evb) {
    const ev = C.SKILL_EVOS.find(x => x.id === evb.dataset.evo);
    if (evoState(ev) !== 'buy') { sfx('deny'); return; }
    save.chaos -= ev.cost; save.evos[ev.id] = true; writeSave(save); sfx('unlock'); checkAchievements(); renderShop(); return;
  }
  const dmm = e.target.closest('[data-dmmax]');
  if (dmm) {
    const d = C.DM_PERKS.find(x => x.id === dmm.dataset.dmmax), mx = maxBuy(dmLevel(save, d.id), d.max, save.darkMatter || 0, k => dmCost(d, k));
    if (mx.n < 1) { sfx('deny'); return; }
    save.darkMatter -= mx.cost; save.dmPerks[d.id] = dmLevel(save, d.id) + mx.n; writeSave(save); sfx('unlock'); renderShop(); return;
  }
  const bm = e.target.closest('[data-buymax]');
  if (bm) {
    const u = C.UPGRADES.find(x => x.id === bm.dataset.buymax), l = upgradeLevel(save, u.id), mx = maxBuy(l, u.max, save.scrap, k => upgradeCost(u, k));
    if (mx.n < 1) { sfx('deny'); return; }
    save.scrap -= mx.cost; save.upgrades[u.id] = l + mx.n; writeSave(save); sfx('unlock'); renderShop();
    const card = $('shop-grid').querySelector(`[data-id="${u.id}"]`);
    if (card) { card.classList.add('bought'); setTimeout(() => card.classList.remove('bought'), 400); }
    return;
  }
  const dmb = e.target.closest('[data-dm]');
  if (dmb) {
    const d = C.DM_PERKS.find(x => x.id === dmb.dataset.dm), l = dmLevel(save, d.id), cost = dmCost(d, l);
    if (l >= d.max || (save.darkMatter || 0) < cost) { sfx('deny'); return; }
    save.darkMatter -= cost; save.dmPerks[d.id] = l + 1; writeSave(save); sfx('unlock'); renderShop(); return;
  }
  const b = e.target.closest('[data-buy]'); if (!b) return;
  const u = C.UPGRADES.find(x => x.id === b.dataset.buy);
  const l = upgradeLevel(save, u.id), cost = upgradeCost(u, l);
  if (l >= u.max || save.scrap < cost) { sfx('deny'); return; }
  save.scrap -= cost; save.upgrades[u.id] = l + 1; writeSave(save);
  sfx('buy'); renderShop();
  const card = $('shop-grid').querySelector(`[data-id="${u.id}"]`);
  if (card) { card.classList.add('bought'); setTimeout(() => card.classList.remove('bought'), 400); }
});
function hintMenu(text) { const el = $('callout'); $('hud').hidden = false; el.hidden = true; void el.offsetWidth; el.textContent = text; el.dataset.tier = 3; el.hidden = false; setTimeout(() => { el.hidden = true; $('hud').hidden = !inRun; }, 1400); }

// ------------------------------------------------------------------
// Monster
// ------------------------------------------------------------------
const previews = [];
function openChars() {
  inRun = false; sfx('click');
  $('chars-chaos').textContent = fmt(save.chaos);
  if ($('chars-scrap')) $('chars-scrap').textContent = money(save.scrap);
  previews.length = 0;
  $('char-grid').innerHTML = C.CHARACTERS.map(ch => {
    const owned = save.unlockedChars.includes(ch.id), sel = save.selectedChar === ch.id;
    const met = reqMet(ch.req), afford = save.chaos >= ch.cost;
    let btn;
    if (sel) btn = `<button class="btn" disabled>✔ Ausgewählt</button>`;
    else if (owned) btn = `<button class="btn primary" data-sel="${ch.id}">Wählen</button>`;
    else if (!met) btn = `<button class="btn" disabled>🔒 ${esc(ch.req.label)}</button>`;
    else btn = `<button class="btn ${afford ? 'primary' : ''}" data-buychar="${ch.id}" ${afford ? '' : 'disabled'}>☠ ${fmt(ch.cost)} freischalten</button>`;
    if (ch.secret && !owned) return `<div class="char locked secret">
      <canvas width="240" height="200" data-prev="${ch.id}"></canvas>
      <div class="char-name">??? <small>Geheimes Monster</small></div>
      <div class="char-desc">Irgendwo wartet ein Monster, das stärker ist als alle anderen. Nur wer wirklich alles geschafft hat, wird es sehen.</div>
      <div class="char-req">🔒 Alle Erfolge <span>${reqProgress(ch.req)}</span></div>
      <button class="btn" disabled>🔒 Geheim</button>
    </div>`;
    return `<div class="char ${sel ? 'sel' : ''} ${owned ? '' : 'locked'}">
      <canvas width="240" height="200" data-prev="${ch.id}"></canvas>
      <div class="char-name">${esc(ch.name)} <small>${esc(ch.title)}</small></div>
      <div class="char-desc">${esc(ch.desc)}</div>
      <div class="char-skill">${ch.skill.icon} <b>${esc(ch.skill.name)}</b> (F · ${ch.skill.cd} s): ${esc(ch.skill.desc)}</div>
      ${owned ? xpBar(ch.id) + `<button class="btn talent-btn ${talentFree(save, ch.id) > 0 ? 'primary' : ''}" data-talents="${ch.id}">🌳 Talente${talentFree(save, ch.id) > 0 ? ` <span class="free">${talentFree(save, ch.id)} frei</span>` : ''}</button>` : ''}
      ${owned ? skinRow(ch) : ''}
      ${!owned && ch.req ? `<div class="char-req ${met ? 'ok' : ''}">${met ? '✔' : '🔒'} ${esc(ch.req.label)} <span>${reqProgress(ch.req)}</span></div>` : ''}
      ${btn}
    </div>`;
  }).join('');
  $('char-grid').querySelectorAll('canvas[data-prev]').forEach(cv => previews.push({ cv, char: charDef(cv.dataset.prev), locked: !save.unlockedChars.includes(cv.dataset.prev) }));
  show('screen-chars');
}
// Skin-Leiste je Monster: Normal + 4 Premium-Stufen (nacheinander kaufbar)
function skinRow(ch) {
  const owned = (save.skins[ch.id] || []).slice(), cur = save.skinSel[ch.id] || '';
  if (save.bossKills > 0) owned.push('hell'); // Sonder-Skin: ZORNOS besiegt → für alle Monster
  if (save.won420 > 0) owned.push('kush');   // Sonder-Skin: Karte 420 geschafft
  const chips = [`<button class="skin-chip ${cur ? '' : 'on'}" data-skin="" data-skinchar="${ch.id}" title="Normal">🎨<small>Normal</small></button>`];
  C.SKINS.forEach((k, i) => {
    if (k.special) { const has = owned.includes(k.id); chips.push(`<button class="skin-chip ${has ? (cur === k.id ? 'on' : '') : 'locked'} sk-${k.id}" data-skin="${k.id}" data-skinchar="${ch.id}" title="${esc(k.desc)}">${has ? k.icon : '🔒'}<small>${has ? esc(k.name) : k.special === 'boss' ? '😈 ZORNOS' : '???'}</small></button>`); return; }
    const has = owned.includes(k.id), prevOk = i === 0 || owned.includes(C.SKINS[i - 1].id), afford = save.scrap >= k.cost;
    const cls = has ? (cur === k.id ? 'on' : '') : (prevOk && afford ? 'buy' : 'locked');
    const label = has ? k.name : prevOk ? money(k.cost) : '🔒';
    chips.push(`<button class="skin-chip ${cls} sk-${k.id}" data-skin="${k.id}" data-skinchar="${ch.id}" title="${esc(k.name)}: ${esc(k.desc)}${has ? '' : prevOk ? ' – kostet ' + money(k.cost, true) : ' – erst ' + C.SKINS[i - 1].name + ' kaufen'}">${k.icon}<small>${esc(label)}</small></button>`);
  });
  return `<div class="skin-row">${chips.join('')}</div>`;
}
// ---------------- Talente (Skill-Tree je Monster)
let talentChar = null;
function openTalents(id) { talentChar = id; sfx('click'); renderTalents(); show('screen-talents'); }
function renderTalents() {
  const id = talentChar, ch = charDef(id), m = monsterData(save, id), free = talentFree(save, id), sig = C.SIGNATURES[id];
  $('tal-title').textContent = `🌳 ${ch.name} · Talente`;
  $('tal-head').innerHTML = `${xpBar(id)}<div class="tal-free">${free > 0 ? `<b>${free}</b> Talentpunkt${free > 1 ? 'e' : ''} frei` : 'Keine freien Punkte – spiel mit diesem Monster, um Level und Punkte zu bekommen (1 Punkt pro Level).'}</div>`;
  $('tal-list').innerHTML = C.TALENTS.map(T => {
    const t = T.sig ? { ...T, ...sig } : T, r = talentRank(save, id, T.id), locked = m.lvl < T.lvl, can = canRaiseTalent(save, id, T.id);
    const desc = r > 0 ? t.desc(r) : t.desc(1).replace(/^([+−])/, '$1') + ' pro Rang';
    return `<div class="tal ${locked ? 'locked' : ''} ${r >= T.max ? 'maxed' : ''}">
      <div class="tal-ic">${t.icon}</div>
      <div class="tal-txt"><b>${esc(t.name)}${T.sig ? ' <small>Signatur</small>' : ''}</b><span>${locked ? `🔒 ab Level ${T.lvl}` : esc(desc)}</span>
        <div class="bar tiny"><div style="transform:scaleX(${(r / T.max).toFixed(3)})"></div></div></div>
      <div class="tal-rank">${r}/${T.max}</div>
      <div class="tal-btns"><button class="btn ${can ? 'primary' : ''}" data-tal="${T.id}" ${can ? '' : 'disabled'}>+</button>${can && free >= 2 && r < T.max - 1 ? `<button class="btn max-btn" data-talmax="${T.id}" title="Alle freien Punkte hier hinein">⏫</button>` : ''}</div>
    </div>`;
  }).join('');
}
$('tal-list').addEventListener('click', e => {
  const bm = e.target.closest('[data-talmax]');
  if (bm) { let n = 0; while (raiseTalent(save, talentChar, bm.dataset.talmax)) n++; if (n) { writeSave(save); sfx('unlock'); renderTalents(); } else sfx('deny'); return; }
  const b = e.target.closest('[data-tal]'); if (!b) return;
  if (raiseTalent(save, talentChar, b.dataset.tal)) { writeSave(save); sfx('buy'); renderTalents(); } else sfx('deny');
});
$('btn-tal-back').onclick = () => openChars();
$('char-grid').addEventListener('click', e => {
  const tb = e.target.closest('[data-talents]');
  if (tb) { openTalents(tb.dataset.talents); return; }
  const sk = e.target.closest('[data-skinchar]');
  if (sk) {
    const cid = sk.dataset.skinchar, id = sk.dataset.skin, owned = save.skins[cid] || (save.skins[cid] = []);
    const spec = C.SKINS.find(k => k.id === id && k.special);
    if (spec) { if (spec.special === 'boss' ? save.bossKills > 0 : save.won420 > 0) { save.skinSel[cid] = id; writeSave(save); sfx('unlock'); openChars(); } else sfx('deny'); return; }
    if (!id || owned.includes(id)) { save.skinSel[cid] = id; writeSave(save); sfx('click'); openChars(); return; }
    const i = C.SKINS.findIndex(k => k.id === id), k = C.SKINS[i];
    if ((i > 0 && !owned.includes(C.SKINS[i - 1].id)) || save.scrap < k.cost) { sfx('deny'); return; }
    save.scrap -= k.cost; owned.push(id); save.skinSel[cid] = id; writeSave(save); checkAchievements();
    sfx('unlock'); openChars(); return;
  }
  const s = e.target.closest('[data-sel]');
  if (s) { save.selectedChar = s.dataset.sel; writeSave(save); sfx('buy'); openChars(); return; }
  const b = e.target.closest('[data-buychar]');
  if (b) {
    const ch = charDef(b.dataset.buychar);
    if (save.chaos < ch.cost || !reqMet(ch.req)) { sfx('deny'); return; }
    save.chaos -= ch.cost; save.unlockedChars.push(ch.id); save.selectedChar = ch.id; writeSave(save); checkAchievements();
    sfx('unlock'); openChars();
  }
});
let stageCycle = 0;
function animatePreviews(time) {
  if (current === 'screen-menu') {
    stageCycle = Math.floor(time / 2.5) % (bestWorldAny() + 1);
    drawMonsterPreview($('menu-monster'), charDef(save.selectedChar), stageCycle, time, false, save.skinSel[save.selectedChar]);
  }
  if (current === 'screen-slots') for (const p of slotPreviews) drawMonsterPreview(p.cv, p.char, p.stage, time, false);
  if (current === 'screen-chars') for (const p of previews) drawMonsterPreview(p.cv, p.char, p.locked ? 0 : Math.floor(time / 2) % 8, time, p.locked, p.locked ? null : save.skinSel[p.char.id]);
}

// ------------------------------------------------------------------
// Karten
// ------------------------------------------------------------------
function openMaps() {
  inRun = false; sfx('click');
  $('map-grid').innerHTML = C.MAPS.map(m => {
    const met = reqMet(m.req), sel = save.selectedMap === m.id;
    const best = (save.mapBest || {})[m.id];
    if (m.secret && !met) return `<div class="map locked secret"><div class="map-top"><span class="map-ic">❓</span><div><div class="map-name">???</div></div></div>
      <div class="char-desc">Eine geheime Karte. Wer weiß, was passiert, wenn man ganz am Ende etwas Großes besiegt …</div>
      <button class="btn" disabled>🔒 Geheim</button></div>`;
    const cols = m.worlds.slice(0, 3).map(w => `<i style="background:${w.bg}"></i>`).join('');
    return `<div class="map ${sel ? 'sel' : ''} ${met ? '' : 'locked'}">
      <div class="map-top"><span class="map-ic">${m.icon}</span><div><div class="map-name">${esc(m.name)}</div><div class="map-sw">${cols}</div></div></div>
      <div class="char-desc">${esc(m.desc)}</div>
      <div class="map-stats"><span>⚙ ×${m.scrapMult}</span><span>☠ ×${m.chaosMult}</span><span>❤ ×${m.hpMult} zäher</span></div>
      <div class="map-worlds">${m.goal ? `🎯 Ziel: ${m.goal.leaves} goldene Blätter in einem Run, dann Mutter Mary Jane${save.won420 ? ` · ✔ ${save.won420}× geschafft` : ''}` : m.worlds.slice(0, 3).map(w => esc(w.name)).join(' → ') + ' → …'}</div>
      ${best !== undefined && !m.goal ? `<div class="char-req ok">Rekord: ${esc(m.worlds[best].name)}</div>` : ''}
      ${sel ? '<button class="btn" disabled>✔ Ausgewählt</button>' : met ? `<button class="btn primary" data-map="${m.id}">Wählen</button>` : `<button class="btn" disabled>🔒 ${esc(m.req.label)}</button>`}
    </div>`;
  }).join('');
  show('screen-maps');
}
$('map-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-map]'); if (!b) return;
  save.selectedMap = b.dataset.map; writeSave(save); sfx('buy'); openMaps();
});

// ------------------------------------------------------------------
// Hilfe
// ------------------------------------------------------------------
function openHelp(from) {
  helpFrom = from; sfx('click');
  const st = computeStats(save, game.muts && inRun ? game.muts : [], save.selectedChar);
  const A = C.ABILITIES;
  $('help-body').innerHTML = `
    <h3>Steuerung</h3>
    <div class="help-grid">
      <div class="hk"><kbd>WASD</kbd> / <kbd>Pfeiltasten</kbd></div><div>Laufen.</div>
      <div class="hk"><kbd>Maustaste halten</kbd></div><div>Laufen zur Maus – nur wenn in den Einstellungen „Maus“ oder „Beides“ gewählt ist (aktuell: <b>${{ keys: 'Tastatur', mouse: 'Maus', both: 'Beides' }[save.settings.control]}</b>).</div>
      <div class="hk">Finger halten</div><div>Laufen auf dem Handy (immer aktiv). Doppeltipp = Ansturm.</div>
      <div class="hk"><kbd>Esc</kbd></div><div>Einstellungen</div>
      <div class="hk"><kbd>P</kbd></div><div>Pause</div>
    </div>
    <h3>Fähigkeiten</h3>
    <div class="help-abs">
      <div class="habs"><span class="ab-ic">⚡</span><div><b>${A.dash.name}</b> <kbd>Leertaste</kbd> · Doppeltipp<br>${A.dash.desc}<br><small>Abklingzeit: <b>${st.dashCooldown.toFixed(1)} s</b> (Upgrade „Ansturm“ in der Schurkenhöhle)</small></div></div>
      <div class="habs"><span class="ab-ic">💥</span><div><b>${A.slam.name}</b> <kbd>E</kbd> · 💥-Button<br>${A.slam.desc}<br><small>Abklingzeit: <b>${st.slamCooldown.toFixed(1)} s</b> · Radius: <b>${st.slamRadius.toFixed(1)}× Körper</b> (Upgrade „Erdbeben“)</small></div></div>
      <div class="habs"><span class="ab-ic">${charDef(save.selectedChar).skill.icon}</span><div><b>${esc(charDef(save.selectedChar).skill.name)}</b> <kbd>F</kbd> · Knopf ganz links<br>${esc(charDef(save.selectedChar).skill.desc)}<br><small>Einzigartiger Skill deines Monsters (${esc(charDef(save.selectedChar).name)}) · Abklingzeit: <b>${charDef(save.selectedChar).skill.cd} s</b>. Jedes Monster hat einen anderen – schau in der Monster-Auswahl.</small></div></div>
      <div class="habs"><span class="ab-ic">😡</span><div><b>${A.berserk.name}</b> <kbd>R</kbd> · 😡-Button<br>${A.berserk.desc}<br><small>Dauer: <b>${st.berserkTime.toFixed(0)} s</b> (Upgrade „Berserker“ lädt schneller)</small></div></div>
    </div>
    <h3>Wie es funktioniert</h3>
    <ul class="help-list">
      <li><b>🔥 Wut</b> ist deine Zeit. Sie sinkt ständig und mit der Zeit immer schneller. Jede Zerstörung füllt sie wieder auf.</li>
      <li><b>Wachsen:</b> Alles Zerstörte macht dich größer. Bist du groß genug, steigst du in die nächste Welt auf, wählst eine <b>Mutation</b> und dein Monster <b>evolviert</b>.</li>
      <li><b>Gestrichelter Kreis</b> = noch zu groß für dich. <b>Rot mit ⚠</b> = Hindernis, das dir Wut abzieht, wenn du reinläufst.</li>
      <li><b>⚙ Schrott</b> fällt als Münzen heraus – einsammeln! Damit kaufst du Upgrades in der <b>🦹 Schurkenhöhle</b>.</li>
      <li><b>☠ Chaos</b> bekommst du für jede Zerstörung, extra für große Brocken und Aufträge. Damit schaltest du neue <b>Monster</b> frei.</li>
      <li><b>Aufträge</b> oben links bringen Wut, Schrott, Chaos und Berserker-Ladung.</li>
      <li><b>Kombo:</b> Schnell hintereinander zerstören = bis zu ×${C.COMBO.max} Schrott.</li>
      <li><b>Goldene Objekte</b> = ×${C.GOLDEN_MULT} Schrott. <b>Schrottkisten</b> platzen wie Piñatas. <b>⚠-Fässer</b> explodieren in Kettenreaktionen.</li>
      <li><b>Neue Karten</b> schaltest du über deine weiteste Welt frei. Sie sind härter, bringen aber deutlich mehr.</li>
      <li><b>💥 Urknall</b> (in der Schurkenhöhle, ab dem Kontinent): Schrott und Upgrades werden gesprengt, dafür gibt es <b>◆ Dunkle Materie</b> für den <b>Bösen Masterplan</b> – Boni für immer. So kommst du in jedem Durchgang schneller und weiter.</li>
      <li><b>Welten:</b> Nach der Milchstraße warten Galaxienhaufen, Kosmisches Netz und Multiversum – und danach geht es endlos weiter.</li>
    </ul>`;
  show('screen-help');
}

// ------------------------------------------------------------------
// Ergebnis
// ------------------------------------------------------------------
// Monster-Level-Anzeige (Ergebnis + Monster-Karte)
function xpBar(id) {
  const m = monsterData(save, id), max = m.lvl >= C.MONSTER_LEVEL.max;
  const f = max ? 1 : Math.min(1, m.xp / C.MONSTER_LEVEL.xpFor(m.lvl));
  return `<div class="lvl-row"><b class="lvl">Lvl ${m.lvl}</b><div class="bar tiny xp"><div style="transform:scaleX(${f.toFixed(3)})"></div></div><small>${max ? 'MAX' : fmt(m.xp) + ' / ' + fmt(C.MONSTER_LEVEL.xpFor(m.lvl)) + ' EP'}</small></div>`;
}
function lvlBlock(s) {
  if (!s.charId) return '';
  const ch = charDef(s.charId);
  return `<div class="res-lvl ${s.lvlUps ? 'up' : ''}">${s.lvlUps ? `<div class="lvl-up">⬆ LEVEL UP! ${esc(ch.name)} Lvl ${s.lvlBefore} → <b>${s.lvlAfter}</b> · +${s.lvlUps} Talentpunkt${s.lvlUps > 1 ? 'e' : ''} → Monster › 🌳 Talente</div>` : ''}
    <div class="lvl-head">${esc(ch.name)} <span>+${fmt(s.xp)} EP</span></div>${xpBar(s.charId)}</div>`;
}
function showResults(s) {
  writeSave(save);
  $('res-title').textContent = s.won420 ? '🌿 420 GESCHAFFT!' : s.bossKilled ? '😈 ZORNOS BESIEGT!' : 'Wut verraucht!';
  setIntensity(0);
  const mins = Math.floor(s.time / 60), secs = Math.floor(s.time % 60);
  const mutNames = s.muts.map(id => { const m = C.MUTATIONS.find(x => x.id === id) || C.BOOSTS.find(x => x.id === id); return m ? m.icon + ' ' + m.name : id; });
  const worlds = mapDef(s.map).worlds;
  // Neu freischaltbar?
  const unlockables = C.CHARACTERS.filter(c => !save.unlockedChars.includes(c.id) && reqMet(c.req) && save.chaos >= c.cost);
  const maps = C.MAPS.filter(m => reqMet(m.req) && !(save.seenMaps || []).includes(m.id) && m.req);
  $('results-body').innerHTML = `
    <div class="res-earned">
      <div><b id="res-scrap">0</b><span>${C.CURRENCY_TIERS[tierOf(s.earned)].name}</span></div>
      <div class="chaos"><b id="res-chaos">0</b><span>☠ Chaos</span></div>
    </div>
    <div class="res-grid">
      <div class="stat"><b>${esc(worlds[s.world].name)}</b><small>Welt ${s.world + 1} / ${worlds.length} erreicht ${s.newWorld ? '<span class="badge">NEU!</span>' : ''}</small></div>
      <div class="stat"><b>${fmt(s.kills)}</b><small>Zerstört</small></div>
      <div class="stat"><b>${mins}:${String(secs).padStart(2, '0')}</b><small>Wutdauer</small></div>
      <div class="stat"><b>${s.bestCombo}×</b><small>Beste Kombo</small></div>
    </div>
    ${lvlBlock(s)}
    ${s.quests ? `<div class="res-muts">✅ ${s.quests} Auftr${s.quests === 1 ? 'ag' : 'äge'} erfüllt</div>` : ''}
    ${mutNames.length ? `<div class="res-muts">Mutationen: ${mutNames.join(' · ')}</div>` : ''}
    ${unlockables.length ? `<div class="res-unlock">🎉 Du kannst jetzt <b>${unlockables.map(c => esc(c.name)).join(', ')}</b> freischalten! → Monster</div>` : ''}
    ${prestigeGain(save) > 0 ? `<div class="res-unlock">💥 <b>Urknall möglich:</b> +${fmt(prestigeGain(save))} ◆ Dunkle Materie → Schurkenhöhle › Urknall</div>` : ''}
    ${maps.length ? `<div class="res-unlock">🗺 Neue Karte freigeschaltet: <b>${maps.map(m => esc(m.name)).join(', ')}</b>!</div>` : ''}`;
  // Einschmelzen: neue Währungs-Stufe zum ersten Mal erreicht
  const tNow = tierOf(save.scrap);
  if (tNow > (save.bestTier || 0)) {
    save.bestTier = tNow; writeSave(save);
    const T = C.CURRENCY_TIERS[tNow], P = C.CURRENCY_TIERS[tNow - 1];
    $('results-body').insertAdjacentHTML('beforeend', `<div class="res-unlock melt">🔥 <b>EINGESCHMOLZEN!</b> Dein ${P.name} wird jetzt zu <b>${T.icon} ${T.name}</b> – 1 ${T.name} = 1 Mrd. ${P.name}.</div>`);
    setTimeout(() => { callout(T.icon + ' ' + T.name.toUpperCase() + '!', 5); sfx('unlock'); $('hud').hidden = false; setTimeout(() => $('hud').hidden = !inRun, 1300); }, 400);
  }
  if (maps.length) { save.seenMaps = [...(save.seenMaps || []), ...maps.map(m => m.id)]; writeSave(save); }
  inRun = false;
  show('screen-results');
  setTimeout(checkAchievements, 1000);
  countUp($('res-scrap'), s.earned, 900, true);
  countUp($('res-chaos'), s.chaos, 900);
}
function countUp(el, target, ms, isMoney = false) {
  const t0 = performance.now();
  let lastTick = 0;
  function step(t) {
    const k = Math.min(1, (t - t0) / ms), v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = '+' + (isMoney ? money(v) : fmt(v));
    if (t - lastTick > 60 && k < 1) { sfx('coin', Math.floor(k * 14)); lastTick = t; }
    if (k < 1) requestAnimationFrame(step); else el.classList.add('done');
  }
  requestAnimationFrame(step);
}

// ------------------------------------------------------------------
// Mutation / Welt-Aufstieg / Events / Aufträge
// ------------------------------------------------------------------
function showMutation(w, choices) {
  $('mut-title').textContent = `WELT ${w + 1}: ${game.worlds[w].name.toUpperCase()} ERREICHT!`;
  const evo = game.char.colors ? `${game.char.name} wird stärker!` : `Grumpf evolviert zum ${C.EVOLUTION[Math.min(w, 7)].name}!`;
  $('mut-evo').textContent = '🧬 ' + evo;
  // Sicherheitsnetz: nie ohne Auswahl hängen bleiben
  if (!choices || !choices.length) { game.chooseMutation(null); lastT = performance.now(); showBanner(`WELT ${game.world + 1}: ${game.worlds[game.world].name.toUpperCase()}`); return; }
  $('mut-cards').innerHTML = choices.map(m => `<button class="mut-card" data-mut="${m.id}"><div class="ic">${m.icon}</div><b>${m.name}</b><span>${m.desc}</span></button>`).join('');
  show('screen-mutation');
  // nach 10 s automatisch eine zufällige Karte wählen
  clearInterval(showMutation.timer);
  let left = 10;
  const tick = () => { const el = $('mut-auto'); if (el) el.textContent = `Automatische Wahl in ${left} s`; };
  tick();
  showMutation.timer = setInterval(() => {
    if (current !== 'screen-mutation' || game.state !== 'mutation') { clearInterval(showMutation.timer); return; }
    left--; tick();
    if (left <= 0) { clearInterval(showMutation.timer); const cards = $('mut-cards').querySelectorAll('[data-mut]'); cards[Math.floor(Math.random() * cards.length)].click(); }
  }, 1000);
}
$('mut-cards').addEventListener('click', e => {
  const b = e.target.closest('[data-mut]'); if (!b) return;
  clearInterval(showMutation.timer);
  sfx('buy');
  game.chooseMutation(b.dataset.mut);
  renderMuts();
  lastT = performance.now();
  show(null);
  showBanner(`WELT ${game.world + 1}: ${game.worlds[game.world].name.toUpperCase()}`);
});
function renderMuts() {
  // Mutationen einzeln, stapelbare Verstärkungen zusammengefasst (×N)
  const seen = {};
  for (const id of game.muts) seen[id] = (seen[id] || 0) + 1;
  $('hud-muts').innerHTML = Object.entries(seen).map(([id, n]) => { const m = C.MUTATIONS.find(x => x.id === id) || C.BOOSTS.find(x => x.id === id); if (!m) return ''; return `<span title="${esc(m.name)}: ${esc(m.desc)}">${m.icon}${n > 1 ? '<small>×' + n + '</small>' : ''}</span>`; }).join('');
}
function showBanner(text) {
  const b = $('banner');
  b.hidden = true; void b.offsetWidth; b.textContent = text; b.hidden = false;
  clearTimeout(showBanner.t); showBanner.t = setTimeout(() => b.hidden = true, 1800);
}
function showEvent(e) { const el = $('hud-event'); el.innerHTML = `<b>${e.name}</b>${e.desc}`; el.hidden = false; }
function callout(text, tier) {
  const el = $('callout');
  el.hidden = true; void el.offsetWidth;
  el.textContent = text; el.dataset.tier = Math.min(tier, 5); el.hidden = false;
  clearTimeout(callout.t); callout.t = setTimeout(() => el.hidden = true, 1100);
}
function questUpdate(q, done) {
  const el = $('hud-quest');
  el.hidden = false;
  $('q-label').textContent = q.label;
  el.classList.toggle('done', done);
  const r = q.reward;
  if (r) $('q-reward').innerHTML = `🎁 Belohnung: ${money(r.scrap)} · ☠ ${fmt(r.chaos)}${game.boss ? '' : ` · 🔥 +${r.rage} % Wut`} · 😡 +${r.berserk} % Berserker`;
  if (!done) { el.classList.remove('fresh'); void el.offsetWidth; el.classList.add('fresh'); sfx('event'); hint('📜 Neuer Auftrag: <b>' + esc(q.label) + '</b>', 3); }
  if (done) { setBar('q-bar', 1); callout('AUFTRAG ERFÜLLT!', 3); setTimeout(() => { if (!game.quest) el.hidden = true; }, 1500); }
}
let hintTimer = 0;
function hint(html, secs = 4) {
  if (!save.settings.hints) return;
  const el = $('hint'); el.innerHTML = html; el.hidden = false;
  clearTimeout(hintTimer); hintTimer = setTimeout(() => el.hidden = true, secs * 1000);
}
function tutorial() {
  if ((save.tutorial || 0) >= 3) return;
  save.tutorial = (save.tutorial || 0) + 1; writeSave(save);
  const steps = [
    [0.5, (save.settings.control === 'keys' ? '<b>WASD</b> / Pfeiltasten zum Laufen' : '<b>Maustaste halten</b> oder <b>WASD</b> zum Laufen') + ' – renn in Dinge, die <b>kleiner</b> sind als du! 👊'],
    [3, '<b>Esc</b> = Einstellungen (z. B. Maus- oder Tastatursteuerung)'],
    [5, '<b>Leertaste</b> (oder Doppeltipp) = ⚡ Ansturm nach vorne'],
    [10, '<b>E</b> = 💥 Stampfer: Erdbeben um dich herum'],
    [13, '<b>F</b> = Monster-Skill: ' + game.char.skill.icon + ' ' + game.char.skill.name],
    [15, 'Die 🔥 <b>Wut</b> sinkt ständig – zerstör weiter, sonst ist der Run vorbei!'],
  ];
  for (const [t, txt] of steps) setTimeout(() => { if (inRun) hint(txt, 4.5); }, t * 1000);
}

// ------------------------------------------------------------------
// HUD
// ------------------------------------------------------------------
let lastCombo = 0, hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
// HUD schreibt nur, was sich wirklich geändert hat (jede DOM-Änderung kostet ein Neumalen)
function setBar(id, frac) {
  const v = Math.round(Math.max(0, Math.min(1, frac)) * 400) / 400; // 0,25-%-Schritte
  if (hudCache[id + 'b'] !== v) { hudCache[id + 'b'] = v; $(id).style.transform = `scaleX(${v})`; }
}
function setAb(id, frac, label, ready, extra = '') {
  const el = $(id), pc = Math.round(Math.max(0, Math.min(1, frac)) * 100);
  if (hudCache[id + 'p'] !== pc) { hudCache[id + 'p'] = pc; el.style.setProperty('--p', pc + '%'); }
  if (hudCache[id + 'r'] !== ready) { hudCache[id + 'r'] = ready; el.classList.toggle('ready', ready); }
  if (hudCache[id + 't'] !== label) { hudCache[id + 't'] = label; el.querySelector('.ab-t').textContent = label; }
  if (hudCache[id + 'x'] !== extra) { hudCache[id + 'x'] = extra; el.dataset.extra = extra; }
}
function updateHud() {
  if (!inRun || !game.p) return;
  const p = game.p, S = game.stats, rf = p.rage / S.rageMax;
  setBar('hud-rage-bar', rf);
  const low = rf < 0.25; if (hudCache.low !== low) { hudCache.low = low; $('hud-rage-bar').parentElement.classList.toggle('low', low); }
  const now = performance.now();
  if (now - (hudCache.numT || 0) > 100) { hudCache.numT = now; setText('hud-scrap', money(game.runScrap)); setText('hud-chaos', fmt(game.runChaos)); } // Zahlen max. 10×/s
  const w = game.worlds[game.world], next = game.worlds[game.world + 1];
  if (game.map.goal) { // Karte 420: Fortschritt = goldene Blätter
    const G = game.map.goal;
    setText('hud-world-num', '🥚 EASTER EGG · 420');
    setText('hud-world-name', w.name);
    setText('hud-world-next', game.mother ? '🌿 Hau Mutter Mary Jane um!' : `🍃 ${game.leaves} / ${G.leaves} goldene Blätter`);
  } else {
    setText('hud-world-num', `${game.map.id === 'suburb' ? 'WELT' : game.map.name.toUpperCase() + ' · WELT'} ${game.world + 1} / ${game.worlds.length}`);
    setText('hud-world-name', w.name);
    setText('hud-world-next', next ? `→ Welt ${game.world + 2}: ${next.name}` : '∞ Endlos');
  }
  setBar('hud-world-bar', game.map.goal ? (game.mother ? 1 - Math.max(0, game.mother.hp / game.mother.maxHp) : game.leaves / game.map.goal.leaves) : game.worldProgress());
  const comboEl = $('hud-combo');
  if (game.combo >= 3) {
    if (comboEl.hidden) comboEl.hidden = false;
    const mult = Math.min(C.COMBO.max, 1 + game.combo * C.COMBO.perStep);
    setText('hud-combo', `${game.combo} KOMBO · ×${mult.toFixed(1)}`);
    if (game.combo !== lastCombo && comboEl.animate && now - (hudCache.bumpT || 0) > 120) { hudCache.bumpT = now; comboEl.animate([{ transform: 'translateX(-50%) scale(1.18)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 150 }); } // ohne erzwungenes Layout
  } else if (!comboEl.hidden) comboEl.hidden = true;
  lastCombo = game.combo;
  if (!game.event && !$('hud-event').hidden) $('hud-event').hidden = true;
  if (game.boss) setBar('boss-hp', game.boss.hp);
  if (game.quest) { setBar('q-bar', game.quest.progress / game.quest.count); setText('q-label', `${game.quest.label} (${Math.min(game.quest.progress, game.quest.count)}/${game.quest.count})`); }
  // Fähigkeiten
  setAb('ab-skill', p.skillCd / (game.char.skill.cd * (S.skillCdMult || 1)), p.skillCd > 0 ? p.skillCd.toFixed(1) : '', p.skillCd <= 0);
  setAb('ab-dash', p.dashCd / S.dashCooldown, p.dashCd > 0 ? p.dashCd.toFixed(1) : '', p.dashCd <= 0);
  setAb('ab-slam', p.slamCd / S.slamCooldown, p.slamCd > 0 ? p.slamCd.toFixed(1) : '', p.slamCd <= 0);
  if (p.berserkT > 0) setAb('ab-berserk', Math.max(0, 1 - p.berserkT / S.berserkTime), p.berserkT.toFixed(1), false, 'active');
  else if (p.berserkCd > 0) setAb('ab-berserk', 1 - p.berserk, `${Math.floor(p.berserk * 100)}% ⏳${Math.ceil(p.berserkCd)}`, false, 'cd');
  else setAb('ab-berserk', 1 - p.berserk, p.berserk >= 1 ? 'BEREIT' : Math.floor(p.berserk * 100) + '%', p.berserk >= 1);
}

// ------------------------------------------------------------------
// Ton & Musik
// ------------------------------------------------------------------
function applyAudio() {
  setMuted(save.muted); setMusic(save.music);
  $('btn-mute').textContent = save.muted ? '🔇' : '🔊';
  $('btn-music').style.opacity = save.music ? 1 : 0.4;
}
$('btn-mute').onclick = () => { initAudio(); save.muted = !save.muted; writeSave(save); applyAudio(); };
$('btn-music').onclick = () => { initAudio(); save.music = !save.music; writeSave(save); applyAudio(); };
applyAudio();
applySettings();
document.addEventListener('pointerdown', () => initAudio(), { once: true });

// ------------------------------------------------------------------
// Patch Notes & Update-Hinweis (dezent, nie aufgezwungen)
// ------------------------------------------------------------------
$('ver').textContent = 'v' + VERSION;
function openNotes() {
  if (game.state === 'play' && inRun) pause();
  $('notes-list').innerHTML = PATCH_NOTES.map((n, i) => `
    <article class="note ${i === 0 ? 'latest' : ''}">
      <div class="note-head"><span class="v">v${esc(n.version)}</span><b>${esc(n.title)}</b><time>${esc(n.date)}</time></div>
      ${n.summary ? `<p>${esc(n.summary)}</p>` : ''}
      <ul>${n.changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </article>`).join('');
  $('notes-modal').hidden = false;
  markSeen(); hideToast();
}
$('btn-notes').onclick = openNotes;
$('btn-notes-close').onclick = () => { $('notes-modal').hidden = true; };
$('notes-modal').addEventListener('click', e => { if (e.target.id === 'notes-modal') $('notes-modal').hidden = true; });
function markSeen() { save.seenVersion = VERSION; writeSave(save); $('notes-dot').hidden = true; }

let pendingToast = null;
// Hinweis unten links. autoMs: verschwindet von allein (Maus darüber pausiert), onAuto läuft dann
let toastTimer = null;
function toast(html, buttons, autoMs = 0, onAuto = null) {
  if (inRun && game.state === 'play') { pendingToast = [html, buttons, autoMs, onAuto]; $('notes-dot').hidden = false; return; }
  const el = $('toast');
  el.innerHTML = html + `<div class="t-row">${buttons.map((b, i) => `<button data-i="${i}" class="${b.go ? 'go' : ''}">${b.label}</button>`).join('')}</div>` + (autoMs ? '<i class="t-time"></i>' : '');
  el.hidden = false;
  el.onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; buttons[b.dataset.i].fn(); };
  clearInterval(toastTimer); el.onmouseenter = el.onmouseleave = null;
  if (autoMs) {
    let left = autoMs, paused = false; const bar = el.querySelector('.t-time');
    el.onmouseenter = () => { paused = true; }; el.onmouseleave = () => { paused = false; };
    toastTimer = setInterval(() => {
      if (el.hidden) { clearInterval(toastTimer); return; }
      if (!paused) left -= 100;
      bar.style.transform = `scaleX(${Math.max(0, left / autoMs)})`;
      if (left <= 0) { clearInterval(toastTimer); hideToast(); if (onAuto) onAuto(); }
    }, 100);
  }
}
function hideToast() { clearInterval(toastTimer); $('toast').hidden = true; }
function flushPendingToast() { if (pendingToast) { const t = pendingToast; pendingToast = null; toast(...t); } }

if (save.seenVersion === null) { save.seenVersion = VERSION; writeSave(save); }
else if (save.seenVersion !== VERSION) {
  $('notes-dot').hidden = false;
  toast(`<b>Neu in v${esc(VERSION)}:</b><p>${esc(PATCH_NOTES[0].title)}</p>`, [
    { label: 'Patch Notes', go: true, fn: openNotes },
    { label: 'Später', fn: () => { markSeen(); hideToast(); } },
  ], 6000, () => { save.seenVersion = VERSION; writeSave(save); }); // nach 6 s weg, der Punkt am Patch-Notes-Knopf bleibt bis zum Neustart
}

let updateOffered = false;
async function checkForUpdate() {
  if (updateOffered || location.protocol === 'file:') return;
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const { version } = await r.json();
    if (version && version !== VERSION) {
      updateOffered = true;
      $('notes-dot').hidden = false;
      toast(`<b>Update v${esc(version)} verfügbar</b><p>Lade neu, wann es dir passt. Dein Fortschritt bleibt gespeichert.</p>`, [
        { label: 'Jetzt aktualisieren', go: true, fn: () => { writeSave(save); location.reload(); } },
        { label: 'Später', fn: hideToast },
      ], 6000); // nach 6 s weg, der Punkt am Patch-Notes-Knopf bleibt
    }
  } catch { /* offline */ }
}
setInterval(checkForUpdate, 90 * 1000);
setTimeout(checkForUpdate, 5000);

// ------------------------------------------------------------------
if (testMode) openMenu(); else openSlots();
requestAnimationFrame(frame);
