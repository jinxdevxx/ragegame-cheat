// =====================================================================
//  RAGEVERSE – Spielstände (localStorage)
//  3 Speicherplätze. Einstellungen (Steuerung, Lautstärke …) gelten
//  für alle Spielstände gemeinsam und liegen separat.
// =====================================================================
export const SLOTS = 3;
const OLD_KEY = 'rageverse_cheat_save_v1';             // Spielstand aus v0.1–v0.2
const META_KEY = 'rageverse_cheat_meta';
const slotKey = i => `rageverse_cheat_slot_${i}`;
const GLOBAL = ['settings', 'muted', 'music', 'seenVersion']; // gehört zu allen Spielständen

let currentSlot = -1;
export function getSlot() { return currentSlot; }

export function defaultSettings() {
  return { control: 'keys', sfx: 80, music: 60, shake: true, fx: 'high', hints: true };
}

export function defaultSave() {
  return {
    name: '', created: 0, lastPlayed: 0,
    scrap: 0, totalScrap: 0, chaos: 0, totalChaos: 0, totalKills: 0, upgrades: {}, bestWorld: 0, bestRadius: 0, runs: 0,
    evos: {}, stats: {}, achievements: {}, skins: {}, skinSel: {}, bossKills: 0, bestTier: 0,
    darkMatter: 0, totalDarkMatter: 0, dmPerks: {}, prestiges: 0, cycleScrap: 0, cycleBest: 0,
    tutorial: 0, selectedChar: 'grumpf', unlockedChars: ['grumpf'], selectedMap: 'suburb', mapBest: {}, seenMaps: [],
    // globale Werte (werden aus META gespiegelt)
    seenVersion: null, muted: false, music: true, settings: defaultSettings(),
  };
}

function read(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* privat / blockiert */ } }
function remove(key) { try { localStorage.removeItem(key); } catch { } }

export function loadMeta() {
  const m = read(META_KEY) || {};
  return { lastSlot: m.lastSlot ?? null, seenVersion: m.seenVersion ?? null, muted: !!m.muted, music: m.music !== false,
    settings: Object.assign(defaultSettings(), m.settings || {}) };
}
function writeMeta(m) { write(META_KEY, m); }

// Alten Einzel-Spielstand einmalig nach Platz 1 übernehmen
function migrate() {
  const old = read(OLD_KEY);
  if (!old) return;
  if (!read(slotKey(0))) {
    const meta = loadMeta();
    if (old.settings) meta.settings = Object.assign(defaultSettings(), old.settings);
    meta.seenVersion = old.seenVersion ?? meta.seenVersion; meta.muted = !!old.muted; meta.music = old.music !== false;
    meta.lastSlot = 0; writeMeta(meta);
    const data = { ...old }; for (const k of GLOBAL) delete data[k];
    data.name = data.name || 'Spielstand 1'; data.created = data.created || Date.now(); data.lastPlayed = Date.now();
    write(slotKey(0), data);
  }
  remove(OLD_KEY);
}

function normalize(out) {
  if (!Array.isArray(out.unlockedChars)) out.unlockedChars = ['grumpf'];
  if (!out.unlockedChars.includes('grumpf')) out.unlockedChars.push('grumpf');
  out.mapBest = out.mapBest || {};
  out.dmPerks = out.dmPerks || {}; out.evos = out.evos || {}; out.skins = out.skins || {}; out.skinSel = out.skinSel || {}; out.stats = out.stats || {}; out.achievements = out.achievements || {};
  if (!out.cycleBest && !out.prestiges) out.cycleBest = Math.max(out.bestWorld || 0, ...Object.values(out.mapBest), 0);
  if (!out.cycleScrap && !out.prestiges) out.cycleScrap = out.totalScrap || 0;
  if (out.bestWorld && !out.mapBest.suburb) out.mapBest.suburb = out.bestWorld;
  return out;
}

// Übersicht aller Plätze (für den Auswahl-Bildschirm)
export function listSlots() {
  migrate();
  const out = [];
  for (let i = 0; i < SLOTS; i++) { const d = read(slotKey(i)); out.push(d ? normalize(Object.assign(defaultSave(), d)) : null); }
  return out;
}

export function slotExists(i) { return !!read(slotKey(i)); }

// Lädt einen Platz in das übergebene Objekt (gleiche Referenz bleibt erhalten)
export function loadSlotInto(target, i) {
  migrate();
  currentSlot = i;
  const meta = loadMeta();
  const d = read(slotKey(i));
  const data = normalize(Object.assign(defaultSave(), d || {}));
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, data);
  target.settings = meta.settings; target.seenVersion = meta.seenVersion; target.muted = meta.muted; target.music = meta.music;
  meta.lastSlot = i; writeMeta(meta);
  return target;
}

export function createSlot(i, name) {
  const d = defaultSave();
  for (const k of GLOBAL) delete d[k];
  d.name = (name || '').trim().slice(0, 24) || `Spielstand ${i + 1}`;
  d.created = Date.now(); d.lastPlayed = Date.now();
  write(slotKey(i), d);
}

export function deleteSlot(i) {
  remove(slotKey(i));
  const meta = loadMeta();
  if (meta.lastSlot === i) { meta.lastSlot = null; writeMeta(meta); }
}

// Speichert den aktuellen Spielstand + die globalen Werte
export function writeSave(s) {
  const meta = loadMeta();
  meta.settings = s.settings; meta.seenVersion = s.seenVersion; meta.muted = s.muted; meta.music = s.music;
  writeMeta(meta);
  if (currentSlot < 0) return; // noch kein Spielstand gewählt (Menü-Hintergrund)
  const data = { ...s }; for (const k of GLOBAL) delete data[k];
  data.lastPlayed = Date.now();
  write(slotKey(currentSlot), data);
}

// Startwerte, bevor ein Spielstand gewählt ist (für den Menü-Hintergrund)
export function loadSave() {
  migrate();
  const meta = loadMeta();
  const s = defaultSave();
  s.settings = meta.settings; s.seenVersion = meta.seenVersion; s.muted = meta.muted; s.music = meta.music;
  return s;
}

export function resetSave() { if (currentSlot >= 0) deleteSlot(currentSlot); }
