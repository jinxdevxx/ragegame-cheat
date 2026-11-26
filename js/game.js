// =====================================================================
//  RAGEVERSE – Spiel-Logik (Simulation, keine Grafik)
// =====================================================================
import * as C from './config.js?v=0.8.7';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Schwierigkeit pro Welt: frühe Welten mit eigenem (stärkerem) Faktor
export function scaleOf(key, level) {
  const W = C.WORLD_SCALING, e = Math.min(level, W.early), l = Math.max(0, level - W.early);
  return Math.pow(W[key + 'Early'], e) * Math.pow(W[key], l);
}

export function upgradeLevel(save, id) { return (save.upgrades && save.upgrades[id]) || 0; }
export function upgradeDef(id) { return C.UPGRADES.find(u => u.id === id); }
export function upgradeCost(u, level) { return Math.ceil(u.base * Math.pow(u.growth, level)); }

export function worldIndexFor(r, worlds = C.WORLDS) {
  let w = 0;
  for (let i = 0; i < worlds.length; i++) if (r >= worlds[i].minRadius) w = i;
  return w;
}

// Alle Spielerwerte aus Basiswerten + Upgrades + Mutationen
export function dmLevel(save, id) { return (save.dmPerks && save.dmPerks[id]) || 0; }
export function dmDef(id) { return C.DM_PERKS.find(d => d.id === id); }
export function dmCost(d, level) { return Math.ceil(d.base * Math.pow(d.growth, level)); }

// ---------------------------------------------------------------------
// URKNALL (Prestige)
// ---------------------------------------------------------------------
export function prestigeGain(save) {
  const P = C.PRESTIGE, w = save.cycleBest || 0;
  if (w < P.minWorld) return 0;
  const lg = Math.max(0, Math.log10(Math.max(1, save.cycleScrap || 0)) - P.logBase);
  return 5 + Math.floor(lg * lg * 3 * (1 + (w - P.minWorld) * P.worldBonus)); // +5 Grundbonus, damit sich schon der erste Urknall lohnt
}
export function doPrestige(save) {
  const gain = prestigeGain(save);
  if (gain <= 0) return 0;
  const keep = dmLevel(save, 'dm_keep') * dmDef('dm_keep').per;
  save.darkMatter = (save.darkMatter || 0) + gain;
  save.totalDarkMatter = (save.totalDarkMatter || 0) + gain;
  save.prestiges = (save.prestiges || 0) + 1;
  for (const id of Object.keys(save.upgrades)) save.upgrades[id] = Math.floor(save.upgrades[id] * keep);
  save.scrap = 0; save.cycleScrap = 0; save.cycleBest = 0;
  return gain;
}

// ---------------- Monster-Level & Talente
export function monsterData(save, id) {
  save.monsters = save.monsters || {};
  return save.monsters[id] || (save.monsters[id] = { xp: 0, lvl: 1, pts: {} });
}
export function talentRank(save, charId, tid) { const m = save.monsters && save.monsters[charId]; return m && m.pts ? (m.pts[tid] || 0) : 0; }
export function talentFree(save, charId) { const m = monsterData(save, charId); return (m.lvl - 1) - Object.values(m.pts).reduce((a, b) => a + b, 0); }
export function canRaiseTalent(save, charId, tid) {
  const T = C.TALENTS.find(t => t.id === tid), m = monsterData(save, charId);
  if (!T || (T.sig && !C.SIGNATURES[charId])) return false;
  return m.lvl >= T.lvl && (m.pts[tid] || 0) < T.max && talentFree(save, charId) > 0;
}
export function raiseTalent(save, charId, tid) {
  if (!canRaiseTalent(save, charId, tid)) return false;
  const m = monsterData(save, charId); m.pts[tid] = (m.pts[tid] || 0) + 1; return true;
}
// EP vergeben, gibt die Anzahl gewonnener Level zurück
export function addMonsterXp(save, charId, xp) {
  const m = monsterData(save, charId), L = C.MONSTER_LEVEL; let ups = 0;
  if (m.lvl >= L.max) return 0;
  m.xp += xp;
  while (m.lvl < L.max && m.xp >= L.xpFor(m.lvl)) { m.xp -= L.xpFor(m.lvl); m.lvl++; ups++; }
  if (m.lvl >= L.max) m.xp = 0;
  return ups;
}
export function runXp(kills, world, quests) {
  const X = C.MONSTER_LEVEL.xpRun;
  return Math.round(X.base + Math.min(kills, X.killCap) * X.perKill + (world + 1) * X.perWorld + quests * X.perQuest);
}

export function charDef(id) { return C.CHARACTERS.find(c => c.id === id) || C.CHARACTERS[0]; }
export function mapDef(id) { return C.MAPS.find(m => m.id === id) || C.MAPS[0]; }

export function computeStats(save, muts = [], charId = save.selectedChar) {
  const P = C.PLAYER, A = C.ABILITIES;
  const L = id => upgradeLevel(save, id);
  const per = id => upgradeDef(id).per;
  // Wirkung eines Upgrades: multiplikativ (1+per)^L oder linear 1+per·L
  const U = id => { const u = upgradeDef(id); return u.mult ? Math.pow(1 + u.per, L(id)) : 1 + u.per * L(id); };
  const has = id => muts.includes(id);
  const cnt = id => muts.reduce((n, m) => n + (m === id ? 1 : 0), 0); // stapelbare Verstärkungen
  const k = charDef(charId).perks || {};
  const pk = (name, def = 1) => (k[name] ?? def);
  // Böser Masterplan: liefert den Zusatz (Faktor − 1)
  const dm = id => { const d = dmDef(id), l = dmLevel(save, id); return d.mult ? Math.pow(1 + d.per, l) - 1 : l * d.per; };
  // Monster-Talente (Level 1–99)
  const tr = id => talentRank(save, charId, id), sig = C.SIGNATURES[charId];
  const sg = st => (sig && sig.stat === st ? tr('sig') * sig.per : 0);
  return {
    startRadius: P.startRadius * U('size') * pk('size') * (1 + dm('dm_start')),
    rageMax: P.rageMax * U('rage') * pk('rage') * (1 + dm('dm_rage')) * Math.pow(1.05, cnt('b_rage')) * (1 + sg('rage')),
    rageDrain: P.rageDrain * Math.pow(1 - per('calm'), L('calm')) * (has('zen') ? 0.7 : 1),
    damage: P.damage * U('dmg') * (has('spikes') ? 1.6 : 1) * pk('damage') * (1 + dm('dm_power')) * Math.pow(1.04, cnt('b_dmg')) * (1 + tr('power') * C.TALENTS[0].per + sg('damage')),
    breakRatio: P.breakRatio + per('hard') * L('hard') + (has('hardhead') ? 0.2 : 0),
    speed: P.speed * (1 + per('speed') * L('speed')) * (has('turbo') ? 1.3 : 1) * pk('speed') * (1 + sg('speed')),
    absorb: P.absorb * U('absorb') * (has('glutton') ? 1.4 : 1) * pk('absorb') * (1 + dm('dm_growth')) * Math.pow(1.03, cnt('b_grow')) * (1 + tr('hunger') * C.TALENTS[1].per),
    scrapMult: U('scrap') * (has('greed') ? 1.6 : 1) * C.SCRAP_SCALE * pk('scrap') * (1 + dm('dm_scrap')) * Math.pow(1.06, cnt('b_scrap')) * (1 + sg('scrap')),
    chaosMult: U('chaosup') * (1 + dm('dm_chaos')),
    crateMult: 1 + per('crates') * L('crates'),
    questMult: 1 + per('quest') * L('quest'),
    comboMax: C.COMBO.max + per('combo') * L('combo') * 2.5,
    startMuts: dmLevel(save, 'dm_mut'),
    magnet: P.magnet + per('magnet') * L('magnet') + pk('magnet', 0) + (has('hole') ? 3 : 0) + sg('magnet'),
    hole: has('hole'),
    dashCooldown: P.dashCooldown * Math.pow(1 - per('dash'), L('dash')) * (has('dashmore') ? 0.5 : 1) * pk('dash') * (1 - sg('dash')),
    skillCdMult: 1 - tr('mastery') * 0.01,
    dashDamage: has('dashmore') ? 2 : 1,
    slamCooldown: A.slam.cooldown * Math.pow(1 - per('slam'), L('slam')),
    slamRadius: A.slam.radius * (1 + per('slam') * L('slam')),
    slamDamage: A.slam.damage * pk('slam'),
    boomMult: pk('boom') * (1 + sg('boom')),
    comboWindow: C.COMBO.window * (has('frenzy') ? 2 : 1) * (1 + per('combo') * L('combo')),
    goldenChance: C.GOLDEN_CHANCE * (has('golden') ? 4 : 1) * pk('golden') * (1 + per('luck') * L('luck')) * (1 + sg('golden')),
    berserkGain: (1 + per('berserk') * L('berserk')) * (has('rager') ? 2 : 1) * pk('berserk') * (1 + sg('berserk')),
    berserkTime: C.BERSERK.duration + pk('berserkTime', 0) + sg('berserkTime'),
    hazardMult: (has('armor') ? 0.5 : 1) * pk('hazard') * (1 - sg('hazard')),
  };
}

export class Game {
  constructor(save, hooks = {}) {
    this.save = save;
    this.hooks = hooks;
    this.state = 'idle';
    this.vw = 800; this.vh = 600;
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.clear();
  }

  clear() {
    this.objects = []; this.coins = []; this.particles = []; this.chunks = []; this.puffs = [];
    this.decals = []; this.texts = []; this.rings = []; this.meteors = []; this.explosionQueue = [];
  }

  hook(name, ...a) { const f = this.hooks[name]; if (f) f(...a); }
  sfx(name, v = 1) { this.hook('sfx', name, v); }

  start(opts = {}) {
    this.map = mapDef(opts.map || this.save.selectedMap);
    this.worlds = this.map.worlds;
    this.char = charDef(opts.char || this.save.selectedChar);
    this.muts = [];
    this.stats = computeStats(this.save, this.muts, this.char.id);
    const r = opts.radius || this.stats.startRadius;
    this.p = {
      x: 0, y: 0, vx: 0, vy: 0, r, mass: r * r, rage: this.stats.rageMax,
      dashT: 0, dashCd: 0, dashX: 1, dashY: 0, lookX: 1, lookY: 0, face: 1, walk: 0,
      punchT: 0, punchX: 1, punchY: 0, hurtT: 0, hurtCd: 0,
      berserk: 0, berserkT: 0, squash: 0, slamCd: 0, slamT: 0,
      skillCd: 0, roarT: 0, rushT: 0, lavaT: 0, phoenixT: 0, revived: false,
    };
    this.world = worldIndexFor(r, this.worlds);
    this.startWorld = this.world;
    this.clear();
    this.bossKilled = false;
    this.rs = { golden: 0, crates: 0, explosions: 0, berserks: 0, skills: 0, slams: 0, hurts: 0 }; // Run-Statistik
    this.time = 0; this.combo = 0; this.comboT = 0; this.bestCombo = 0; this.calloutIdx = 0;
    this.runScrap = 0; this.runChaos = 0; this.kills = 0; this.maxRadius = r;
    this.event = null; this.eventT = 0; this.nextEventAt = C.EVENTS.firstAfter;
    this.shockT = 0; this.meteorT = 0; this.spawnT = 0; this.shake = 0; this.dyingT = 0;
    this.hitStop = 0; this.hitStopCd = 0; this.flash = 0; this.coinChain = 0; this.coinChainT = 0;
    this.quest = null; this.questT = C.QUESTS.firstAfter; this.questsDone = 0;
    this.pendingWorlds = 0;
    this.boss = null; this.bossDone = false; this.bossShots = [];
    this.leaves = 0; this.leafT = 0; this.mother = null; this.won420 = false; this.winT = 0; // Karte 420
    this.lava = []; this.rockets = []; this.spikes = []; this.blasts = []; this.singularity = null; this.freezeT = 0; this.grabFx = [];
    this.cam.x = 0; this.cam.y = 0; this.cam.zoom = this.targetZoom();
    // Genlabor: mit zufälligen Mutationen starten
    for (let i = 0; i < this.stats.startMuts; i++) { const ch = this.mutationChoices(); if (ch.length) this.muts.push(ch[0].id); }
    if (this.muts.length) this.stats = computeStats(this.save, this.muts, this.char.id);
    this.spawnTick(true);
    this.state = 'play';
  }

  // Je länger ein Run dauert (ab ~2,5 min), desto weniger Wut gibt es zurück
  lateFactor() { return this.map.goal && this.map.goal.noLate ? 1 : 1 + Math.pow(Math.max(0, this.time - C.WORLD_SCALING.lateRunAfter) / 60, 1.5); }

  // Nach der letzten Welt geht es endlos weiter: alle ×4 Größe zählt wie eine neue Welt
  endless() {
    if (this.map.goal) return 0; // Karte 420: feste Schwierigkeit, egal wie groß man wird
    const last = this.worlds.length - 1;
    if (this.world < last) return 0;
    return Math.max(0, Math.log(this.p.r / this.worlds[last].minRadius) / Math.log(4));
  }
  level(world) { return (this.map.levelBase || 0) + world + (world === this.worlds.length - 1 ? this.endless() : 0); }
  hpScale(world) { return scaleOf('hp', this.level(world)) * this.map.hpMult; }

  // effektiver Radius (Berserker macht größer)
  hr() { return this.p.r * (this.p.berserkT > 0 ? C.BERSERK.sizeBoost : 1); }
  breakLimit() {
    const glass = this.event && this.event.id === 'glass';
    return this.p.r * this.stats.breakRatio * (glass ? 1.4 : 1) * (this.p.berserkT > 0 ? C.BERSERK.breakBoost : 1);
  }
  targetZoom() { return (Math.min(this.vw, this.vh) * 0.06) / this.p.r; }
  viewRadius() { return Math.hypot(this.vw, this.vh) / 2 / this.cam.zoom; }

  // ------------------------------------------------------------------
  update(dt, input) {
    if (this.state === 'dying') {
      this.dyingT -= dt;
      this.updateFx(dt * 0.5);
      if (this.dyingT <= 0) this.finish();
      return;
    }
    if (this.state !== 'play') return;
    // Treffer-Stopp: kurzer Freeze bei großen Treffern
    if (this.hitStopCd > 0) this.hitStopCd -= dt;
    this.flushCoinPool(); this.fxBudget = Math.min(10, (this.fxBudget ?? 10) + dt * 25); // Effekt-Budget: ~25 volle Zerstör-Effekte/s, der Rest wird gebündelt
    if (this.hitStop > 0) { this.hitStop -= dt; this.updateCamera(dt); return; }

    const p = this.p, S = this.stats;
    this.time += dt;
    const berserk = p.berserkT > 0;

    this.updateEvents(dt);
    this.updateQuest(dt);

    // --- Bewegung
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (input.dash && p.dashCd <= 0) {
      let dx = input.dx, dy = input.dy;
      if (Math.hypot(dx, dy) < 0.1) { dx = p.lookX; dy = p.lookY; }
      const l = Math.hypot(dx, dy) || 1;
      p.dashX = dx / l; p.dashY = dy / l; p.dashT = C.PLAYER.dashTime; p.dashCd = S.dashCooldown;
      p.squash = 1;
      this.sfx('dash');
      for (let i = 0; i < 5; i++) this.puff(p.x - p.dashX * p.r, p.y - p.dashY * p.r + p.r * 0.5, p.r * rand(0.3, 0.6), '#f4ead8');
    }
    input.dash = false;
    p.slamCd = Math.max(0, p.slamCd - dt);
    if (p.berserkCd > 0) {
      p.berserkCd = Math.max(0, p.berserkCd - dt);
      if (p.berserkCd <= 0 && p.berserk >= 1) { this.sfx('ready'); this.hook('onBerserkReady'); } // war in der Abklingzeit schon voll
    }
    p.slamT = Math.max(0, p.slamT - dt);
    if (input.slam && p.slamCd <= 0) this.slam();
    input.slam = false;
    if (input.berserk && p.berserk >= 1 && p.berserkT <= 0 && !(p.berserkCd > 0)) this.startBerserk();
    input.berserk = false;
    p.skillCd = Math.max(0, p.skillCd - dt);
    if (input.skill && p.skillCd <= 0 && this.char.skill) this.useSkill();
    input.skill = false;
    this.updateSkills(dt);
    const maxV = S.speed * p.r * (berserk ? C.BERSERK.speedMult : 1) * (p.rushT > 0 ? 1.15 : 1);
    if (p.rushT > 0) { // Schallmauer: Überschall-Ringe
      p.boomT = (p.boomT || 0) - dt;
      if (p.boomT <= 0) { p.boomT = 0.35; this.explosionQueue.push({ x: p.x, y: p.y, r: p.r * 3.2, dmg: this.oneHit() * 4, big: false, maxSize: this.breakLimit() * 1.15, silent: true }); this.rings.push({ x: p.x, y: p.y, r: p.r * 3.2, life: 0.35, max: 0.35, color: '#7fd3ff', ground: true }); this.processExplosions(); }
    }
    if (p.dashT > 0 && this.evo('dash1')) { // Flammen-Ansturm: Feuerspur
      const last = this.lava[this.lava.length - 1];
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > p.r * 0.7) this.lava.push({ x: p.x, y: p.y, r: p.r * 1.1, life: 1.4, tick: 0 });
    }
    if (p.phoenixT > 0) { // Phönixfeuer: Flammenkranz verbrennt alles in der Nähe
      p.fireTick = (p.fireTick || 0) - dt;
      if (p.fireTick <= 0) {
        p.fireTick = 0.2; const R = p.r * 3.8, lim = this.breakLimit() * 1.5, hit = this.oneHit();
        for (const o of this.objects) { if (o.dead || o.size > lim) continue; if (Math.hypot(o.x - p.x, o.y - p.y) > R + o.size * 0.5) continue; o.hp -= hit * 3; o.flash = 1; if (o.hp <= 0) { this.kill(o, 'boom'); if (!this.boss) p.rage = Math.min(S.rageMax, p.rage + S.rageMax * 0.02); } }
        if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < R + this.boss.size) this.bossHurt(0.3 * S.damage / this.bossDamageNeed());
      }
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; this.particle(p.x + Math.cos(a) * p.r * 3.8, p.y + Math.sin(a) * p.r * 3.8 * 0.6, Math.random() < 0.5 ? '#ff6a1f' : '#ffd23f', p.r * 0.35, 0.5, 0, -p.r * 2, 'flame'); }
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      if (p.dashT <= 0 && this.evo('dash2')) { // Meteor-Ansturm
        this.explode(p.x, p.y, p.r * 3.2, this.oneHit() * 5, true);
        if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < p.r * 3.2 + this.boss.size) this.bossHurt(1.5 * S.damage / this.bossDamageNeed());
      }
      p.vx = p.dashX * maxV * C.PLAYER.dashPower;
      p.vy = p.dashY * maxV * C.PLAYER.dashPower;
      if (Math.random() < 0.6) this.puff(p.x, p.y + p.r * 0.6, p.r * rand(0.25, 0.45), '#f4ead8');
    } else {
      const idle = Math.abs(input.dx) + Math.abs(input.dy) < 0.01;
      const k = Math.min(1, C.PLAYER.accel * (idle ? 2.2 : 1) * dt); // ohne Eingabe hart bremsen
      p.vx += (input.dx * maxV - p.vx) * k;
      p.vy += (input.dy * maxV - p.vy) * k;
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxV * 0.1) {
      p.lookX = p.vx / sp; p.lookY = p.vy / sp;
      if (Math.abs(p.vx) > maxV * 0.08) p.face = p.vx > 0 ? 1 : -1;
    }
    p.walk += (sp / p.r) * dt * 2.2;
    p.punchT = Math.max(0, p.punchT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.hurtCd = Math.max(0, p.hurtCd - dt);
    p.squash = Math.max(0, p.squash - dt * 5);

    // --- Berserker
    if (berserk) {
      p.berserkT -= dt;
      if (Math.random() < 0.5) this.particle(p.x + rand(-1, 1) * p.r, p.y - rand(0, 1.5) * p.r, Math.random() < 0.5 ? '#ff6a1f' : '#ffd23f', p.r * rand(0.12, 0.25), 0.5, 0, -p.r * 3, 'flame');
      if (p.berserkT <= 0) { p.berserkT = 0; p.berserk = Math.min(1, p.berserkBank || 0); p.berserkBank = 0; p.berserkCd = C.BERSERK.cooldown; this.hook('onBerserk', false); }
    }

    // --- Wut
    const frenzy = this.event && this.event.id === 'frenzy';
    if (!frenzy && p.berserkT <= 0 && !this.boss) p.rage -= S.rageDrain * this.map.drainMult * scaleOf('rageDrain', this.level(this.world)) * (1 + C.PLAYER.rageDrainGrowth * this.time + (this.map.goal && this.map.goal.noLate ? 0 : Math.pow(Math.max(0, this.time - C.WORLD_SCALING.lateRunAfter) / 60, 2))) * dt;
    p.rage = Math.min(p.rage, S.rageMax);
    if (p.rage <= 0 && this.char.id === 'phoenix' && !p.revived) { // Wiedergeburt
      p.revived = true; p.rage = S.rageMax * 0.5; this.flash = 1; this.shake = 1.2; this.sfx('unlock');
      this.rings.push({ x: p.x, y: p.y, r: p.r * 6, life: 0.7, max: 0.7, color: '#ffb13d' });
      this.explode(p.x, p.y, p.r * 4, this.oneHit() * 3, true);
      this.hook('onCallout', 'WIEDERGEBURT!', 5);
    }
    if (p.rage <= 0) { p.rage = 0; this.die(); return; }

    // --- Kombo
    if (this.comboT > 0 && p.roarT <= 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.calloutIdx = 0; } }
    if (this.coinChainT > 0) { this.coinChainT -= dt; if (this.coinChainT <= 0) this.coinChain = 0; }

    // --- Mutationen mit Dauerwirkung
    if (this.muts.includes('shock')) {
      this.shockT -= dt;
      if (this.shockT <= 0) {
        this.shockT = 4;
        this.explode(p.x, p.y, p.r * 4, Math.pow(p.r, 1.5) * 0.9 * S.damage, false);
        this.sfx('shock');
      }
    }
    this.moveObjects(dt, maxV);
    this.magnetCrumbs(dt);
    this.collide();
    this.processExplosions();
    this.updateCoins(dt, sp);

    // --- Welt-Aufstieg
    while (this.world < this.worlds.length - 1 && p.r >= this.worlds[this.world + 1].minRadius) {
      this.world++;
      this.pendingWorlds++;
    }
    if (this.pendingWorlds > 0) {
      this.pendingWorlds--;
      if (this.world !== C.BOSS.world) p.rage = Math.min(S.rageMax, p.rage + S.rageMax * 0.5 / this.lateFactor()); // Boss-Welt: Wut = Leben, kein Bonus
      this.flash = 1;
      this.sfx('levelup');
      this.state = 'mutation';
      this.hook('onWorld', this.world, this.mutationChoices());
    }

    // --- Endboss
    if (this.world === C.BOSS.world && !this.boss && !this.bossDone && this.worlds.length - 1 === C.BOSS.world) this.spawnBoss();
    if (this.boss) { this.updateBoss(dt); if (this.state !== 'play') return; }

    // --- Karte 420
    if (this.map.goal) { this.updateGoal(dt); if (this.state !== 'play') return; }

    // --- Spawning
    this.spawnT -= dt;
    if (this.spawnT <= 0 && !this.boss) { this.spawnT = 0.2; this.spawnTick(false); } // Boss: reine Arena

    this.updateFx(dt);
  }

  updateEvents(dt) {
    const p = this.p;
    if (this.event) {
      this.eventT -= dt;
      if (this.event.id === 'meteor') {
        this.meteorT -= dt;
        if (this.meteorT <= 0) {
          this.meteorT = 0.3;
          const a = Math.random() * TAU, d = Math.random() * this.viewRadius() * 0.7;
          this.meteors.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, t: 0.7, r: p.r * 2.6 });
        }
      }
      if (this.eventT <= 0) { this.event = null; this.nextEventAt = this.time + rand(...C.EVENTS.every); }
    } else if (this.time >= this.nextEventAt) {
      const e = pick(C.EVENTS.list);
      this.event = e; this.eventT = C.EVENTS.duration;
      this.hook('onEvent', e);
      this.sfx('event');
    }
    for (const m of this.meteors) {
      m.t -= dt;
      if (m.t <= 0) { this.explosionQueue.push({ x: m.x, y: m.y, r: m.r, dmg: Math.pow(p.r, 1.5) * 2.2, big: true, noStop: true }); this.processExplosions(); }
    }
    this.meteors = this.meteors.filter(m => m.t > 0);
  }

  // ------------------------------------------------------------------
  // Mini-Aufträge
  // ------------------------------------------------------------------
  updateQuest(dt) {
    if (this.quest) {
      if (this.quest.type === 'combo' && this.combo >= this.quest.count) this.quest.progress = this.quest.count;
      if (this.quest.progress >= this.quest.count) this.completeQuest();
      return;
    }
    this.questT -= dt;
    if (this.questT <= 0) this.newQuest();
  }

  newQuest() {
    const p = this.p, lim = this.breakLimit();
    const names = {};
    for (const o of this.objects) {
      if (o.crate || o.size > lim || o.size < p.r * 0.3) continue;
      names[o.name] = (names[o.name] || 0) + 1;
    }
    const common = Object.entries(names).filter(([, n]) => n >= 2).map(([k]) => k);
    const r = Math.random();
    let q;
    if (common.length && r < 0.6) {
      const target = pick(common);
      const count = 5 + Math.floor(Math.random() * 6);
      q = { type: 'kill', target, count, label: `Zerstöre ${count}× ${target}` };
    } else if (r < 0.82) {
      const count = [12, 15, 20, 25][Math.min(3, this.questsDone)];
      q = { type: 'combo', count, label: `Schaffe eine ${count}er-Kombo` };
    } else {
      q = { type: 'boom', count: 3, label: 'Lass 3 Explosionen hochgehen' };
    }
    q.progress = 0;
    q.reward = this.questReward(this.questsDone + 1);
    this.quest = q;
    this.hook('onQuest', q, false);
  }

  // Belohnung eines Auftrags (wird beim Erscheinen angezeigt)
  questReward(n) {
    const S = this.stats;
    return {
      rage: Math.round(C.QUESTS.rageReward * 100 / this.lateFactor()),
      berserk: Math.round(C.QUESTS.berserkReward * S.berserkGain * 100),
      scrap: C.QUESTS.scrapReward * this.worlds[this.world].scrapMult * this.map.scrapMult * S.scrapMult * S.questMult * (1 + n * 0.2),
      chaos: C.CHAOS.questBonus * this.map.chaosMult * S.chaosMult * S.questMult,
    };
  }

  completeQuest() {
    const p = this.p, S = this.stats, q = this.quest;
    this.quest = null; this.questT = C.QUESTS.pause; this.questsDone++;
    const rw = this.questReward(this.questsDone);
    if (!this.boss) p.rage = Math.min(S.rageMax, p.rage + S.rageMax * C.QUESTS.rageReward / this.lateFactor());
    this.addBerserk(C.QUESTS.berserkReward, true);
    const value = rw.scrap;
    this.runChaos += rw.chaos;
    this.coinBurst(p.x, p.y, value, 12, true);
    this.flash = Math.max(this.flash, 0.35);
    this.sfx('quest');
    this.hook('onQuest', q, true);
  }

  // ------------------------------------------------------------------
  moveObjects(dt, playerMaxV) {
    if (this.freezeT > 0) return; // Eiszeit: alles steht still
    const p = this.p, lim = this.breakLimit();
    const viewR = this.viewRadius() * 1.3;
    for (const o of this.objects) {
      if (!o.move) continue;
      const dxp = o.x - p.x, dyp = o.y - p.y, dp = Math.hypot(dxp, dyp);
      if (dp > viewR) continue;
      let v = o.speed * o.size;
      if (o.move === 'drive') {
        // fährt stur geradeaus
      } else if (o.move === 'wander') {
        o.wanderT -= dt;
        if (o.wanderT <= 0) { o.wanderT = rand(1, 3); o.heading = Math.random() * TAU; }
        o.vx += (Math.cos(o.heading) * v - o.vx) * Math.min(1, dt * 2);
        o.vy += (Math.sin(o.heading) * v - o.vy) * Math.min(1, dt * 2);
      } else if (o.move === 'flee') {
        const scared = dp < p.r * 7 && o.size <= lim * 1.3;
        if (scared && dp > 1e-6) {
          v = Math.min(v, playerMaxV * 0.72);
          const jitter = Math.sin(this.time * 7 + o.seed * 20) * 0.6;
          const ax = dxp / dp, ay = dyp / dp;
          const tx = ax * Math.cos(jitter) - ay * Math.sin(jitter), ty = ax * Math.sin(jitter) + ay * Math.cos(jitter);
          o.vx += (tx * v - o.vx) * Math.min(1, dt * 6);
          o.vy += (ty * v - o.vy) * Math.min(1, dt * 6);
          o.scared = 0.4;
        } else {
          o.wanderT -= dt;
          if (o.wanderT <= 0) { o.wanderT = rand(1, 3); o.heading = Math.random() * TAU; o.idle = Math.random() < 0.5; }
          const iv = o.idle ? 0 : v * 0.2;
          o.vx += (Math.cos(o.heading) * iv - o.vx) * Math.min(1, dt * 3);
          o.vy += (Math.sin(o.heading) * iv - o.vy) * Math.min(1, dt * 3);
          o.scared = Math.max(0, (o.scared || 0) - dt);
        }
      }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (Math.abs(o.vx) > 1e-3) o.face = o.vx > 0 ? 1 : -1;
      o.anim += dt * Math.hypot(o.vx, o.vy) / Math.max(1, o.size) * 3;
    }
  }

  collide() {
    const p = this.p, S = this.stats;
    const glass = this.event && this.event.id === 'glass';
    const berserk = p.berserkT > 0;
    const R = this.hr();
    const limit = this.breakLimit();
    for (const o of this.objects) {
      if (o.dead) continue;
      const dx = o.x - p.x, dy = o.y - p.y;
      const d = Math.hypot(dx, dy);
      const minD = R + o.size * 0.8;
      if (d >= minD) continue;
      // Krümel zerbröseln nur sofort, wenn ein Schlag sie auch schaffen würde (Schaden zählt bis ins Late-Game)
      if ((o.size < p.r * C.PLAYER.crumbRatio || (o.pulled > 0 && o.size <= limit * 0.65)) && o.hp <= this.oneHit()) { this.kill(o, 'touch'); continue; }
      if (berserk && this.evo('berserk1') && o.size <= limit) { this.kill(o, 'hit'); continue; } // Titanenwut
      const nx = d > 1e-6 ? dx / d : 1, ny = d > 1e-6 ? dy / d : 0;
      const breakable = o.size <= limit || o.mother; // Mutter Mary Jane ist riesig, aber angreifbar
      if (breakable && o.hitCd <= 0) {
        const approach = Math.max(0, p.vx * nx + p.vy * ny);
        let impact = clamp(approach / (S.speed * p.r), 0.45, 1.3);
        if (p.dashT > 0 || p.rushT > 0) impact *= 2.5 * S.dashDamage;
        let dmg = S.damage * Math.pow(p.r, 1.5) * 0.6 * impact;
        if (glass) dmg *= 100;
        if (this.freezeT > 0) dmg *= 10;
        if (berserk) dmg *= C.BERSERK.damageMult;
        o.hp -= dmg; o.hitCd = 0.15; o.hitAnim = 1; o.flash = 1;
        p.punchT = 0.16; p.punchX = nx; p.punchY = ny;
        if (o.hp <= 0) { this.kill(o, 'hit'); continue; }
        this.sfx('hit', clamp(o.size / p.r, 0.2, 1));
        for (let i = 0; i < 4; i++) {
          const a = Math.atan2(-ny, -nx) + rand(-0.8, 0.8), v = rand(2, 5) * p.r;
          this.particle(o.x - nx * o.size * 0.7, o.y - ny * o.size * 0.7 - o.size * 0.4, i % 2 ? '#ffffff' : o.color, o.size * 0.12, 0.35, Math.cos(a) * v, Math.sin(a) * v, 'spark');
        }
      } else if (!breakable) {
        if (o.hazard && p.hurtCd <= 0 && !berserk && this.freezeT <= 0 && !(this.stunT > 0)) {
          const loss = S.rageMax * o.hazard / 100 * S.hazardMult;
          p.rage -= loss; p.hurtT = 0.45; p.hurtCd = 0.9;
          this.shake = Math.min(1.2, this.shake + 0.6);
          this.text(p.x, p.y - p.r * 2.2, 'AUA! −' + Math.round(o.hazard * S.hazardMult) + '% Wut', '#ff5a5a', 1.1, p.r * 0.8, true);
          this.sfx('hurt');
          // kräftiger Rückstoß
          p.vx = -nx * S.speed * p.r * 2.2; p.vy = -ny * S.speed * p.r * 2.2;
        } else if (o.hitCd <= 0) {
          o.hitCd = 0.6; o.hitAnim = 0.6;
          this.sfx('thud');
          this.text(o.x, o.y - o.size * 1.6, 'ZU GROSS', '#ffffff', 0.7, p.r * 0.6);
        }
      }
      // abprallen
      const overlap = minD - d;
      p.x -= nx * overlap; p.y -= ny * overlap;
      const vn = p.vx * nx + p.vy * ny;
      const bounce = breakable ? 1.0 : 1.25; // zerstörbar: nur abbremsen, nicht wegprallen
      if (vn > 0) { p.vx -= vn * nx * bounce; p.vy -= vn * ny * bounce; }
      if (p.dashT > 0 && !breakable) p.dashT = 0;
    }
    if (this.objects.some(o => o.dead)) this.objects = this.objects.filter(o => !o.dead);
  }

  kill(o, cause) {
    if (o.dead) return;
    o.dead = true;
    const p = this.p, S = this.stats;
    this.kills++;
    if (o.golden) this.rs.golden++;
    if (o.leaf) { // Karte 420
      this.leaves++; p.rage = Math.min(S.rageMax, p.rage + S.rageMax * this.map.goal.leafRage);
      this.text(o.x, o.y - o.size, `🍃 ${this.leaves}/${this.map.goal.leaves}`, '#c9f0a0', 0.8, p.r * 0.6);
      if (this.leaves >= this.map.goal.leaves && !this.mother) this.spawnMother();
    }
    if (o.mother && !this.won420) {
      this.won420 = true; this.winT = 2.5; this.quest = null;
      this.runChaos += this.map.goal.rewardChaos * S.chaosMult;
      this.hook('onCallout', '420 GESCHAFFT!', 6); this.sfx('unlock'); this.flash = 1; this.shake = 2;
      for (let i = 0; i < 8; i++) this.explosionQueue.push({ x: o.x + rand(-1, 1) * o.size, y: o.y + rand(-1, 1) * o.size, r: o.size * 1.2, dmg: 0, big: true, noStop: true });
    }
    if (o.crate) this.rs.crates++;
    if (o.explosive) this.rs.explosions++;
    const rel = o.size / p.r;
    // Wachstum
    const bigBonus = 1 + Math.max(0, Math.min(rel, 1) - 0.6) * C.PLAYER.bigKillGrowth; // große Brocken treiben den Fortschritt
    p.mass += Math.min(o.size * o.size * S.absorb * bigBonus * scaleOf('absorb', this.level(this.world)), p.mass * C.PLAYER.maxGrowPerKill * bigBonus);
    p.r = Math.sqrt(p.mass);
    if (p.r > this.maxRadius) this.maxRadius = p.r;
    // Wut
    const late = this.lateFactor(); // lange Runs: weniger Wut pro Treffer
    const worldRage = scaleOf('rageDrain', this.level(this.world)) * this.map.drainMult; // Wut pro Treffer wächst mit der Welt mit
    if (!this.boss) p.rage = Math.min(S.rageMax, p.rage + (C.PLAYER.ragePerKill * worldRage * clamp(Math.pow(rel, 0.7) * 1.6, 0.15, 3) + (o.crate ? S.rageMax * 0.15 : 0)) / late);
    // Berserker
    if (p.berserkT > 0 && this.evo('berserk2') && (p.berserkExt || 0) < 8) { p.berserkT += 0.15; p.berserkExt = (p.berserkExt || 0) + 0.15; }
    if (p.berserkT <= 0) this.addBerserk(C.BERSERK.perKill * clamp(rel * 1.5, 0.25, 2));
    // Kombo
    this.combo++; this.comboT = S.comboWindow;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    const co = C.COMBO.callouts;
    while (this.calloutIdx < co.length && this.combo >= co[this.calloutIdx][0]) {
      this.hook('onCallout', co[this.calloutIdx][1], this.calloutIdx);
      this.sfx('callout', this.calloutIdx);
      this.calloutIdx++;
    }
    const comboMult = Math.min(S.comboMax, 1 + this.combo * C.COMBO.perStep);
    // Auftrag
    if (this.quest && this.quest.type === 'kill' && o.name === this.quest.target) this.quest.progress++;
    // Schrott
    const w = this.worlds[o.world];
    this.runChaos += (C.CHAOS.perKill + (rel > 1 ? C.CHAOS.bigBonus * rel : 0)) * this.map.chaosMult * S.chaosMult;
    const value = (p.roarT > 0 ? 2 : 1) * o.value * w.scrapMult * this.map.scrapMult * comboMult * S.scrapMult * (o.golden ? C.GOLDEN_MULT : 1) * (o.bonusMult || 1) * (o.crate ? C.CRATE_MULT : 1);
    // Viele Kills im selben Frame: Effekte werden gebündelt (gleiche Belohnung, weniger Münzen/Trümmer)
    const rich = (this.fxBudget === undefined || (this.fxBudget -= 1) >= 0) || rel > 0.5 || o.golden || o.crate;
    if (!rich) {
      const cp = this.coinPool || (this.coinPool = { x: 0, y: 0, value: 0, n: 0 });
      cp.x += o.x; cp.y += o.y; cp.value += value; cp.n++;
      if (Math.random() < 0.15) this.puff(o.x, o.y, o.size * 0.6, '#efe6d6');
      if (cause === 'touch' && Math.random() < 0.1) this.sfx('crumb');
      this.explodeFrom(o, rel, S);
      return;
    }
    const n = o.crate ? 14 : clamp(Math.ceil(Math.sqrt(o.value) * (o.golden ? 2 : 1)), 1, 8);
    this.coinBurst(o.x, o.y, value, n, o.golden);
    if ((rel > 0.35 || o.golden || o.crate) && value >= 1) this.text(o.x, o.y - o.size * 1.4, '+' + money(value), o.golden || o.crate ? '#ffd23f' : '#fff3c4', 0.9, p.r * 0.7, rel > 0.8 || o.crate);
    // Trümmer
    const big = rel > 0.7;
    const nChunks = clamp(Math.round(4 + rel * 6), 3, 10);
    for (let i = 0; i < nChunks; i++) {
      const a = Math.random() * TAU, v = rand(1, 4) * o.size;
      this.chunks.push({
        x: o.x, y: o.y, z: o.size * rand(0.3, 1.2), vx: Math.cos(a) * v + p.vx * 0.3, vy: Math.sin(a) * v * 0.7 + p.vy * 0.3,
        vz: o.size * rand(3, 7), g: o.size * 22, size: o.size * rand(0.16, 0.34), color: i % 4 === 0 ? shadeHex(o.color, -0.25) : o.color,
        rot: Math.random() * TAU, vr: rand(-12, 12), life: rand(1, 1.6), max: 1.6, sides: 3 + (i % 3),
      });
    }
    const maxChunks = this.fx && this.fx.low ? 80 : 260;
    if (this.chunks.length > maxChunks) this.chunks.splice(0, this.chunks.length - maxChunks);
    for (let i = 0; i < (big ? 4 : 1); i++) this.puff(o.x + rand(-0.6, 0.6) * o.size, o.y + rand(-0.3, 0.3) * o.size, o.size * rand(0.4, 0.8), '#efe6d6');
    if (rel > 0.25) {
      this.decals.push({ x: o.x, y: o.y, size: o.size * 1.15, color: o.color, life: 14, max: 14, seed: Math.random() });
      if (this.decals.length > 70) this.decals.shift();
    }
    if (big) { this.shake = Math.min(1.1, this.shake + rel * 0.3); if (rel > 0.9) this.freeze(0.04); p.squash = 1; }
    if (cause !== 'touch') { this.sfx(o.crate ? 'crate' : 'break', clamp(rel, 0.2, 1.2)); p.punchT = Math.max(p.punchT, 0.12); }
    else if (Math.random() < 0.3) this.sfx('crumb');
    this.explodeFrom(o, rel, S);
  }

  // Explosive Objekte / Mutation „Explosiv“
  explodeFrom(o, rel, S) {
    if (o.explosive) {
      this.explosionQueue.push({ x: o.x, y: o.y, r: o.size * 3.2 * S.boomMult, dmg: Math.pow(o.size, 1.5) * 2.5 * S.boomMult * this.hpScale(o.world), big: true });
      if (this.quest && this.quest.type === 'boom') this.quest.progress++;
    } else if (this.muts.includes('boom') && rel > 0.2) {
      this.explosionQueue.push({ x: o.x, y: o.y, r: o.size * 2 * S.boomMult, dmg: Math.pow(o.size, 1.5) * 1.5 * this.hpScale(o.world), big: false });
    }
  }

  // ------------------------------------------------------------------
  // ENDBOSS
  // ------------------------------------------------------------------
  spawnBoss() {
    const p = this.p, B = C.BOSS;
    const a = Math.random() * TAU;
    this.boss = { x: p.x + Math.cos(a) * p.r * 9, y: p.y + Math.sin(a) * p.r * 9, size: p.r * B.sizeMult, hp: 1, attackT: 4, hitCd: 0, hitAnim: 0, flash: 0,
      face: 1, walk: 0, vx: 0, vy: 0, charge: 0, chargeX: 0, chargeY: 0, punchT: 0, intro: 2.5 };
    this.boss.need = this.hpScale(this.world) / 1.6; // Boss-Härte beim Erscheinen festhalten
    // Reine Arena: alle Objekte verpuffen, es spawnt nichts mehr, bis ZORNOS fällt
    for (const o of this.objects) if (this.inView(o)) this.puff(o.x, o.y, o.size * 0.8, '#5a2a1a');
    this.objects = [];
    this.bossShots = [];
    this.event = null; this.nextEventAt = Infinity; this.quest = null; this.questT = Infinity; this.meteors = [];
    this.hook('onBoss', 'spawn', this.boss);
    this.sfx('berserk'); this.shake = 1.5; this.flash = 0.6;
  }

  bossHurt(amountHits) {
    const b = this.boss; if (!b) return;
    const hp = C.BOSS.hp * (this.map.hpMult || 1);
    b.hp -= amountHits / hp; b.hitAnim = 1; b.flash = 1;
    this.addBerserk(C.BOSS.berserkPerHit);
    if (b.hp <= 0) this.bossDefeated();
  }

  bossDefeated() {
    const b = this.boss, p = this.p, S = this.stats, B = C.BOSS;
    this.boss = null; this.bossDone = true; this.bossShots = [];
    const W = this.worlds[this.world];
    const scrap = B.rewardScrap * W.scrapMult * this.map.scrapMult * S.scrapMult;
    this.coinBurst(b.x, b.y, scrap, 40, true);
    this.runChaos += B.rewardChaos * this.map.chaosMult * S.chaosMult;
    this.bossKilled = true;
    for (let i = 0; i < 8; i++) this.explosionQueue.push({ x: b.x + rand(-1, 1) * b.size, y: b.y + rand(-1, 1) * b.size, r: b.size * 1.2, dmg: 0, big: true });
    this.processExplosions();
    for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, v = rand(1, 5) * b.size; this.chunks.push({ x: b.x, y: b.y, z: b.size, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: b.size * rand(3, 8), g: b.size * 20, size: b.size * rand(0.1, 0.25), color: i % 2 ? '#2a0505' : '#ff6a1f', rot: 0, vr: rand(-10, 10), life: 2, max: 2, sides: 4 }); }
    p.rage = S.rageMax; this.hitStop = 0.4; this.flash = 1; this.shake = 2;
    this.sfx('unlock');
    this.hook('onBoss', 'dead', b);
  }

  updateBoss(dt) {
    const b = this.boss, p = this.p, S = this.stats, B = C.BOSS;
    b.size = Math.max(b.size, p.r * B.sizeMult);
    b.hitCd = Math.max(0, b.hitCd - dt); b.hitAnim = Math.max(0, b.hitAnim - dt * 5); b.flash = Math.max(0, b.flash - dt * 8); b.punchT = Math.max(0, b.punchT - dt);
    const enraged = b.hp < 0.3;
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (b.intro > 0) { b.intro -= dt; }
    if (b.frozen > 0) { b.vx = 0; b.vy = 0; b.charge = 0; b.windup = 0; }
    // Bewegung: verfolgen oder Sturmangriff
    const maxV = S.speed * p.r;
    if (b.windup > 0) { // Ausholen: Warnlinie, dann Sturm
      b.windup -= dt;
      if (b.windup <= 0) { b.charge = 0.9; this.sfx('dash'); }
    } else if (b.charge > 0) {
      b.charge -= dt; b.x += b.chargeX * maxV * 2.6 * dt; b.y += b.chargeY * maxV * 2.6 * dt;
      if (Math.random() < 0.8) this.puff(b.x, b.y + b.size * 0.4, b.size * 0.3, '#5a2a1a');
    } else if (b.intro <= 0 && !(b.frozen > 0)) {
      const v = maxV * B.speed * (enraged ? 1.4 : 1);
      b.vx += (dx / d * v - b.vx) * Math.min(1, dt * 3); b.vy += (dy / d * v - b.vy) * Math.min(1, dt * 3);
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    b.walk += Math.hypot(b.vx, b.vy) / b.size * dt * 2; if (Math.abs(dx) > 1e-6) b.face = dx > 0 ? 1 : -1;
    if (Math.random() < 0.6) this.particle(b.x + rand(-1, 1) * b.size * 0.7, b.y - rand(0.5, 2) * b.size, Math.random() < 0.5 ? '#ff6a1f' : '#ffd23f', b.size * 0.08, 0.6, 0, -b.size * 2, 'flame');
    // Angriffe
    if (b.intro <= 0 && !(b.frozen > 0)) b.attackT -= dt * (enraged ? 1.4 : 1);
    if (b.attackT <= 0) {
      b.attackT = rand(...B.attackEvery);
      const r = Math.random();
      b.punchT = 0.5;
      if (enraged && Math.random() < 0.5) { // Feuerbälle in einem Fächer auf dich
        const base = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) { const a = base + i * 0.22; this.bossShots.push({ kind: 'fireball', x: b.x, y: b.y - b.size * 0.4, vx: Math.cos(a) * maxV * 1.1, vy: Math.sin(a) * maxV * 1.1, r: p.r * 0.7, life: 4 }); }
        this.sfx('boom', 0.4);
      }
      if (r < 0.32) { this.bossShots.push({ kind: 'ring', x: b.x, y: b.y, r: b.size * 0.8, speed: maxV * 1.3, max: b.size * 7, hit: false }); this.sfx('slam'); }
      else if (r < 0.6) { for (let i = 0; i < (enraged ? 8 : 5); i++) { const a = Math.random() * TAU, dd = Math.random() * p.r * 4; this.bossShots.push({ kind: 'meteor', x: p.x + p.vx * 0.8 + Math.cos(a) * dd, y: p.y + p.vy * 0.8 + Math.sin(a) * dd, r: p.r * 1.6, t: 1.1 + i * 0.12 }); } this.sfx('event'); }
      else if (r < 0.8) { b.windup = 0.8; b.chargeX = dx / d; b.chargeY = dy / d; this.text(b.x, b.y - b.size * 2, 'STURMANGRIFF!', '#ff3b2f', 1, p.r, true); this.sfx('ready'); }
      else { // Diener rufen
        for (let i = 0; i < 3; i++) { const a = Math.random() * TAU; this.spawnMinion(b.x + Math.cos(a) * b.size * 2, b.y + Math.sin(a) * b.size * 2); }
        this.text(b.x, b.y - b.size * 2, 'DIENER!', '#ffb13d', 1, p.r, true);
      }
    }
    // Geschosse
    const hurt = (pct, nx, ny) => {
      if (p.hurtCd > 0) return;
      // Schutz wirkt gegen den Boss nur abgeschwächt (Wurzel), Berserker halbiert statt unverwundbar
      const m = Math.sqrt(S.hazardMult) * (p.berserkT > 0 ? 0.5 : 1);
      p.rage -= S.rageMax * pct / 100 * m; p.hurtT = 0.45; p.hurtCd = 0.8; this.shake = Math.min(1.5, this.shake + 0.7);
      p.vx = nx * maxV * 2.4; p.vy = ny * maxV * 2.4; this.sfx('hurt');
      this.text(p.x, p.y - p.r * 2.2, 'AUA! −' + Math.round(pct * m) + '% Wut', '#ff5a5a', 1, p.r * 0.8, true);
    };
    for (const sh of this.bossShots) {
      if (sh.kind === 'ring') {
        sh.r += sh.speed * dt;
        const pd = Math.hypot(p.x - sh.x, p.y - sh.y);
        if (!sh.hit && Math.abs(pd - sh.r) < p.r * 0.7 && p.dashT <= 0) { sh.hit = true; hurt(B.ringDamage, (p.x - sh.x) / (pd || 1), (p.y - sh.y) / (pd || 1)); }
        sh.dead = sh.r > sh.max;
      } else if (sh.kind === 'fireball') {
        sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt; sh.dead = sh.life <= 0;
        if (Math.random() < 0.6) this.particle(sh.x, sh.y, Math.random() < 0.5 ? '#ff6a1f' : '#ffd23f', sh.r * 0.4, 0.4, 0, 0, 'flame');
        const pd = Math.hypot(p.x - sh.x, p.y - sh.y);
        if (pd < sh.r + p.r * 0.6) { sh.dead = true; hurt(C.BOSS.fireballDamage, (p.x - sh.x) / (pd || 1), (p.y - sh.y) / (pd || 1)); }
      } else if (sh.kind === 'meteor') {
        sh.t -= dt;
        if (sh.t <= 0) {
          sh.dead = true;
          this.rings.push({ x: sh.x, y: sh.y, r: sh.r, life: 0.4, max: 0.4, color: '#ff6a1f', ground: true });
          for (let i = 0; i < 5; i++) this.puff(sh.x + rand(-0.5, 0.5) * sh.r, sh.y + rand(-0.3, 0.3) * sh.r, sh.r * 0.4, '#5a2a1a');
          this.sfx('boom', 0.6); this.shake = Math.min(1.5, this.shake + 0.3);
          const pd = Math.hypot(p.x - sh.x, p.y - sh.y);
          if (pd < sh.r + p.r * 0.5) hurt(B.meteorDamage, (p.x - sh.x) / (pd || 1), (p.y - sh.y) / (pd || 1));
        }
      }
    }
    this.bossShots = this.bossShots.filter(s => !s.dead);
    // Kontakt mit dem Boss
    const R = this.hr(), minD = R + b.size * 0.75;
    if (d < minD) {
      const nx = -dx / d, ny = -dy / d; // vom Spieler zum Boss
      if (b.charge > 0) { hurt(B.chargeDamage, -nx, -ny); b.charge = 0; }
      else if (p.dashT <= 0 && b.intro <= 0) hurt(B.touchDamage, -nx, -ny); // Glut-Haut: dranbleiben kostet Wut
      const dashed = p.dashT > 0;
      if (b.hitCd <= 0) {
        const approach = Math.max(0, p.vx * nx + p.vy * ny);
        let hits = clamp(approach / (S.speed * p.r), 0.45, 1.3) * S.damage / this.bossDamageNeed() * (p.dashT > 0 ? 1 : C.BOSS.hugMult);
        if (p.dashT > 0) hits *= C.BOSS.dashMult * Math.pow(S.dashDamage, 0.25);
        if (p.berserkT > 0) hits *= C.BOSS.berserkMult; // im Bosskampf gedämpft
        b.hitCd = p.dashT > 0 ? 0.45 : 0.18; p.punchT = 0.16; p.punchX = nx; p.punchY = ny;
        this.sfx('hit', 1); this.text(b.x, b.y - b.size * 1.8, '-' + (hits / (C.BOSS.hp * (this.map.hpMult || 1)) * 100).toFixed(1) + '%', '#ffd23f', 0.6, p.r * 0.6);
        for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, v = rand(2, 5) * p.r; this.particle(b.x - nx * b.size * 0.7, b.y - ny * b.size * 0.7 - b.size * 0.5, i % 2 ? '#ffd23f' : '#ff3b2f', p.r * 0.15, 0.4, Math.cos(a) * v, Math.sin(a) * v, 'spark'); }
        this.bossHurt(hits);
        if (!this.boss) return;
      }
      const overlap = minD - d; p.x += nx * -overlap; p.y += ny * -overlap;
      const vn = p.vx * nx + p.vy * ny; if (vn > 0) { p.vx -= vn * nx; p.vy -= vn * ny; }
      if (p.dashT > 0) p.dashT = 0;
      if (dashed) { p.vx = -nx * maxV * 2; p.vy = -ny * maxV * 2; } // Ansturm prallt ab → raus, ausweichen, wieder rein
    }
  }

  // Wie viel "Schaden" ein normaler Treffer in dieser Welt braucht (Boss-HP sind in Treffern gemessen)
  // Boss-Schaden: Treffer zählen in "Boss-Treffern". Die Stärke (Schaden ÷ Boss-Härte) streut zwischen
  // knapp angekommen (~0,02) und komplett ausgebaut (~400) – deshalb gestaucht (^0,25) und gedeckelt,
  // damit der Kampf immer ein Kampf bleibt: Upgrades machen ihn schneller, aber nie zur Sekundensache.
  bossPower() {
    const B = C.BOSS, need = (this.boss && this.boss.need) || this.hpScale(this.world) / 1.6;
    return clamp(Math.pow(this.stats.damage / need, B.powerExp), B.powerMin, B.powerMax);
  }
  bossDamageNeed() { return this.stats.damage / this.bossPower(); }

  spawnMinion(x, y) {
    const p = this.p, size = p.r * 0.9, hp = Math.pow(size, 1.5) * this.hpScale(this.world);
    this.objects.push({ x, y, size, name: 'Höllenwächter', shape: 'eye', color: '#ff3b2f', value: 10, world: this.world, explosive: false, golden: false, crate: false,
      hp, maxHp: hp, hitCd: 0, hitAnim: 0, flash: 0, bonusMult: 1, move: 'wander', speed: 1.6, hazard: 15, vx: 0, vy: 0, heading: Math.random() * TAU, wanderT: 0, anim: 0, face: 1, seed: Math.random(), scared: 0, pop: 1 });
  }

  // Ladung: während der Abklingzeit lädt die Leiste mit halber Rate weiter (zünden geht erst danach).
  // Feste Belohnungen (Aufträge) gehen nie verloren – im Berserker werden sie gutgeschrieben.
  addBerserk(amount, reward = false) {
    const p = this.p;
    const add = amount * this.stats.berserkGain / (reward ? 1 : this.lateFactor());
    if (p.berserkT > 0) { if (reward) p.berserkBank = (p.berserkBank || 0) + add; return; }
    const was = p.berserk;
    p.berserk = Math.min(1, p.berserk + add * (p.berserkCd > 0 && !reward ? C.BERSERK.cooldownCharge : 1));
    if (was < 1 && p.berserk >= 1 && !(p.berserkCd > 0)) { this.sfx('ready'); this.hook('onBerserkReady'); }
  }

  startBerserk() {
    const p = this.p;
    this.rs.berserks++;
    p.berserkExt = 0;
    p.berserkT = this.stats.berserkTime;
    this.hitStop = 0.12; this.flash = 0.8; this.shake = 1.2; p.squash = 1;
    this.rings.push({ x: p.x, y: p.y, r: p.r * 6, life: 0.6, max: 0.6, color: '#ff4a2a' });
    this.sfx('berserk');
    this.hook('onBerserk', true);
  }

  evo(id) { return !!(this.save.evos && this.save.evos[id]); }

  // ------------------------------------------------------------------
  // EINZIGARTIGE MONSTER-SKILLS (Taste F)
  // ------------------------------------------------------------------
  inView(o, f = 1) { const vr = this.viewRadius() * f; return Math.hypot(o.x - this.p.x, o.y - this.p.y) < vr; }

  useSkill() {
    const p = this.p, S = this.stats, sk = this.char.skill, lim = this.breakLimit(), hit = this.oneHit();
    p.skillCd = sk.cd * (S.skillCdMult || 1); p.squash = 1; this.rs.skills++;
    this.sfx('berserk', 0.5);
    this.hook('onCallout', sk.name.toUpperCase() + '!', 2);
    switch (sk.id) {
      case 'roar':
        if (!this.boss) p.rage = Math.min(S.rageMax, p.rage + S.rageMax * 0.35); else p.rage = Math.min(S.rageMax, p.rage + S.rageMax * 0.08);
        p.roarT = 6; this.rings.push({ x: p.x, y: p.y, r: p.r * 5, life: 0.6, max: 0.6, color: '#ffd23f' }); this.shake = 0.8;
        break;
      case 'spikes':
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; this.spikes.push({ x: p.x, y: p.y, vx: Math.cos(a), vy: Math.sin(a), d: 0, max: p.r * 7, hitSet: new Set() }); }
        break;
      case 'rush': p.rushT = 5; break;
      case 'lava': p.lavaT = 6; break;
      case 'gold': for (const o of this.objects) if (this.inView(o, 1.05) && !o.crate) o.golden = true; this.flash = 0.4; break;
      case 'singularity': this.singularity = { x: p.x + p.lookX * p.r * 4, y: p.y + p.lookY * p.r * 4, t: 4, tick: 0 }; break;
      case 'freeze': this.freezeT = 5; if (this.boss) this.boss.frozen = 2.5; this.flash = 0.5; break;
      case 'grab': {
        const targets = this.objects.filter(o => !o.dead && o.size <= lim * 1.3).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 10)
          .filter(o => Math.hypot(o.x - p.x, o.y - p.y) < p.r * 12);
        for (const o of targets) { this.grabFx.push({ x: o.x, y: o.y, life: 0.4 }); this.kill(o, 'hit'); }
        if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < p.r * 9 + this.boss.size) this.bossHurt(4 * S.damage / this.bossDamageNeed());
        this.objects = this.objects.filter(o => !o.dead);
        break;
      }
      case 'rockets': {
        const targets = this.objects.filter(o => !o.dead && o.size <= lim * 1.3 && this.inView(o)).sort((a, b) => b.size - a.size).slice(0, 16);
        if (this.boss && this.inView(this.boss)) for (let i = 0; i < 3; i++) targets.push(this.boss);
        targets.forEach((o, i) => this.rockets.push({ x: p.x, y: p.y - p.r, tx: o.x, ty: o.y, target: o, t: 0, dur: 0.45 + i * 0.05 }));
        break;
      }
      case 'phoenixdash': p.phoenixT = 6; p.fireTick = 0; this.rings.push({ x: p.x, y: p.y, r: p.r * 3, life: 0.6, max: 0.6, color: '#ff6a1f', ground: true }); break;
      case 'urfaust': { // Urzorn: Druckwelle über den ganzen Bildschirm
        const vr = this.viewRadius();
        this.explosionQueue.push({ x: p.x, y: p.y, r: vr, dmg: hit * 4, big: true, maxSize: lim * 1.3, noStop: true });
        this.processExplosions();
        if (this.boss) this.bossHurt(4 * S.damage / this.bossDamageNeed());
        this.addBerserk(0.15, true);
        this.rings.push({ x: p.x, y: p.y, r: vr, life: 0.9, max: 0.9, color: '#b06bff' }, { x: p.x, y: p.y, r: vr * 0.6, life: 0.7, max: 0.7, color: '#ffd23f' });
        this.flash = 0.7; this.shake = 1.4;
        break;
      }
      case 'hellfire':
        for (let i = 0; i < 3; i++) this.blasts.push({ t: i * 0.22, r: p.r * (2.5 + i * 2) });
        break;
    }
  }

  updateSkills(dt) {
    const p = this.p, S = this.stats, lim = this.breakLimit(), hit = this.oneHit();
    p.roarT = Math.max(0, p.roarT - dt); p.rushT = Math.max(0, p.rushT - dt); p.phoenixT = Math.max(0, p.phoenixT - dt);
    this.freezeT = Math.max(0, this.freezeT - dt);
    if (this.boss && this.boss.frozen > 0) this.boss.frozen -= dt;
    // Lava-Spur
    if (p.lavaT > 0) { p.lavaT -= dt; if (!this.lava.length || Math.hypot(this.lava[this.lava.length - 1].x - p.x, this.lava[this.lava.length - 1].y - p.y) > p.r * 0.8) this.lava.push({ x: p.x, y: p.y, r: p.r * 1.5, life: 3, tick: 0 }); }
    for (const L of this.lava) {
      L.life -= dt; L.tick -= dt;
      if (L.tick <= 0) {
        L.tick = 0.3;
        for (const o of this.objects) if (!o.dead && o.size <= lim * 1.2 && Math.hypot(o.x - L.x, o.y - L.y) < L.r + o.size * 0.5) { o.hp -= hit * 1.2; o.flash = 1; if (o.hp <= 0) this.kill(o, 'boom'); }
        if (this.boss && Math.hypot(this.boss.x - L.x, this.boss.y - L.y) < L.r + this.boss.size * 0.6) this.bossHurt(0.6 * S.damage / this.bossDamageNeed());
      }
    }
    this.lava = this.lava.filter(L => L.life > 0);
    // Stacheln
    for (const sp of this.spikes) {
      const step = p.r * 14 * dt; sp.x += sp.vx * step; sp.y += sp.vy * step; sp.d += step;
      for (const o of this.objects) if (!o.dead && !sp.hitSet.has(o) && o.size <= lim && Math.hypot(o.x - sp.x, o.y - sp.y) < o.size * 0.9 + p.r * 0.2) {
        sp.hitSet.add(o); o.hp -= hit * 2.5; o.flash = 1; if (o.hp <= 0) this.kill(o, 'hit');
      }
      if (this.boss && !sp.hitSet.has(this.boss) && Math.hypot(this.boss.x - sp.x, this.boss.y - sp.y) < this.boss.size) { sp.hitSet.add(this.boss); this.bossHurt(0.5 * S.damage / this.bossDamageNeed()); }
    }
    this.spikes = this.spikes.filter(sp => sp.d < sp.max);
    // Singularität
    const sg = this.singularity;
    if (sg) {
      sg.t -= dt; sg.tick -= dt;
      for (const o of this.objects) {
        if (o.dead || o.size > lim) continue;
        const dx = sg.x - o.x, dy = sg.y - o.y, d = Math.hypot(dx, dy);
        if (d < p.r * 8 && d > 1e-6) { const v = p.r * 6 * dt; o.x += dx / d * Math.min(v, d); o.y += dy / d * Math.min(v, d); }
        if (d < p.r * 1.2 && sg.tick <= 0) { o.hp -= hit * 3; if (o.hp <= 0) this.kill(o, 'boom'); }
      }
      if (sg.tick <= 0) sg.tick = 0.15;
      if (Math.random() < 0.8) this.particle(sg.x + rand(-3, 3) * p.r, sg.y + rand(-3, 3) * p.r, '#b06bff', p.r * 0.15, 0.5, 0, 0, 'bit');
      if (sg.t <= 0) this.singularity = null;
    }
    // Raketen
    for (const rk of this.rockets) {
      rk.t += dt;
      if (rk.t >= rk.dur && !rk.done) {
        rk.done = true;
        const tg = rk.target;
        if (tg === this.boss && this.boss) { this.bossHurt(1.2 * S.damage / this.bossDamageNeed()); this.rings.push({ x: tg.x, y: tg.y, r: tg.size * 0.6, life: 0.4, max: 0.4, color: '#ffb13d' }); }
        else { const r = Math.max(tg.size * 1.6, p.r * 0.8); this.explosionQueue.push({ x: rk.tx, y: rk.ty, r, dmg: hit * 4, big: false, maxSize: lim * 1.3 }); }
        this.sfx('boom', 0.5);
      }
    }
    this.rockets = this.rockets.filter(rk => !rk.done);
    // Höllenfeuer-Wellen
    for (const b of this.blasts) {
      b.t -= dt;
      if (b.t <= 0 && !b.done) {
        b.done = true;
        if (b.slam) { this.explosionQueue.push({ x: p.x, y: p.y, r: b.r, dmg: b.dmg, big: false, maxSize: lim, silent: true }); this.rings.push({ x: p.x, y: p.y, r: b.r, life: 0.5, max: 0.5, color: '#fff3c4', ground: true }); this.shake = Math.min(1.4, this.shake + 0.8); this.sfx('slam'); continue; }
        this.explosionQueue.push({ x: p.x, y: p.y, r: b.r, dmg: hit * 3, big: true, maxSize: lim * 1.5 });
        if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < b.r + this.boss.size) this.bossHurt(2 * S.damage / this.bossDamageNeed());
      }
    }
    this.blasts = this.blasts.filter(b => !b.done);
    this.stunT = Math.max(0, (this.stunT || 0) - dt); this.coinPullT = Math.max(0, (this.coinPullT || 0) - dt);
    for (const f of this.grabFx) f.life -= dt;
    this.grabFx = this.grabFx.filter(f => f.life > 0);
    if (this.explosionQueue.length) this.processExplosions();
  }

  // Stampfer: Erdbeben um den Spieler
  slam() {
    const p = this.p, S = this.stats;
    p.slamCd = S.slamCooldown; p.slamT = 0.35; p.squash = 1; this.rs.slams++;
    const R = p.r * S.slamRadius * (p.berserkT > 0 ? C.BERSERK.sizeBoost : 1);
    this.freeze(0.06);
    this.shake = Math.min(1.4, this.shake + 1);
    this.rings.push({ x: p.x, y: p.y, r: R, life: 0.5, max: 0.5, color: '#fff3c4', ground: true });
    this.rings.push({ x: p.x, y: p.y, r: R * 0.6, life: 0.35, max: 0.35, color: '#ffb13d', ground: true });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; this.puff(p.x + Math.cos(a) * R * 0.7, p.y + Math.sin(a) * R * 0.5, p.r * rand(0.5, 0.9), '#efe6d6'); }
    this.sfx('slam');
    const dmg = Math.pow(p.r, 1.5) * S.slamDamage * S.damage * (p.berserkT > 0 ? C.BERSERK.damageMult : 1);
    this.explosionQueue.push({ x: p.x, y: p.y, r: R, dmg, big: false, maxSize: this.breakLimit(), silent: true });
    this.processExplosions();
    if (this.evo('slam1')) this.blasts.push({ t: 0.4, r: R * 1.5, dmg: dmg, slam: true });
    if (this.evo('slam2')) { this.stunT = 4; this.coinPullT = 1.5; }
    if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < R + this.boss.size) this.bossHurt(3 * Math.sqrt(S.slamDamage) * S.damage / this.bossDamageNeed() * (p.berserkT > 0 ? C.BOSS.berserkMult : 1));
  }

  flushCoinPool() {
    const cp = this.coinPool; if (!cp || !cp.n) return;
    this.coinPool = null;
    this.coinBurst(cp.x / cp.n, cp.y / cp.n, cp.value, clamp(Math.ceil(Math.sqrt(cp.n) * 2), 2, 12), false);
  }

  coinBurst(x, y, value, n, golden) {
    const p = this.p;
    if (this.coins.length > 120) n = Math.min(n, this.coins.length > 200 ? 1 : 2); // viele Münzen: weniger, dafür wertvollere
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = rand(1, 3.2) * p.r;
      this.coins.push({ x, y, z: p.r * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: p.r * rand(4, 7), g: p.r * 24,
        value: value / n, age: 0, life: 10, golden, spin: Math.random() * TAU });
    }
    if (this.coins.length > 400) this.coins.splice(0, this.coins.length - 400);
  }

  updateCoins(dt, sp) {
    const p = this.p, S = this.stats;
    const pick = p.r * 1.3, pull = this.coinPullT > 0 ? p.r * 14 : this.magnetRange();
    for (const c of this.coins) {
      c.age += dt; c.life -= dt; c.spin += dt * 10;
      if (c.z > 0 || c.vz > 0) {
        c.vz -= c.g * dt; c.z += c.vz * dt;
        if (c.z <= 0) { c.z = 0; if (Math.abs(c.vz) > c.g * 0.08) c.vz = -c.vz * 0.35; else c.vz = 0; }
      }
      const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
      if (c.age > 0.3 && d < pick) {
        c.life = -1; this.runScrap += c.value;
        this.coinChain++; this.coinChainT = 0.45;
        this.sfx('coin', this.coinChain);
        continue;
      }
      if (c.age > 0.35 && d < pull) {
        const v = (p.r * 7 + sp) * dt * (1 + c.age);
        c.x += dx / d * Math.min(v, d); c.y += dy / d * Math.min(v, d);
      } else { c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.93; c.vy *= 0.93; }
    }
    this.coins = this.coins.filter(c => c.life > 0);
  }

  // Schaden eines normalen Schlags (für Krümel-Regel und Magnet)
  oneHit() {
    const p = this.p, S = this.stats;
    const glass = this.event && this.event.id === 'glass';
    return S.damage * Math.pow(p.r, 1.5) * 0.6 * 1.3 * (glass ? 100 : 1) * (p.berserkT > 0 ? C.BERSERK.damageMult : 1);
  }

  magnetRange() { return this.p.r * (2.5 + this.stats.magnet * 2); }

  // Magnet saugt auch Krümel an
  magnetCrumbs(dt) {
    const S = this.stats;
    if (S.magnet <= 0) return;
    // normal: nur echte Krümel; mit „Super-Magnet“ alles, was man auch fressen kann
    const p = this.p, R = this.magnetRange(), lim = S.hole ? p.r * 0.6 : p.r * C.PLAYER.crumbRatio * 0.98;
    const hit = this.oneHit() * (S.hole ? 1.6 : 1);
    for (const o of this.objects) {
      if (o.size > lim || o.hp > hit) continue;
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
      if (d < R && d > 1e-6) { const v = p.r * (2 + S.magnet * 1.2) * dt; o.x += dx / d * Math.min(v, d); o.y += dy / d * Math.min(v, d); o.pulled = 0.2; }
    }
  }

  explode(x, y, r, dmg, big) {
    this.explosionQueue.push({ x, y, r, dmg, big });
    this.processExplosions();
  }

  processExplosions() {
    let guard = 0;
    while (this.explosionQueue.length && guard++ < 80) {
      const e = this.explosionQueue.shift();
      if (!e.silent) this.rings.push({ x: e.x, y: e.y, r: e.r, life: 0.45, max: 0.45, color: e.big ? '#ffb13d' : '#ffffff' });
      if (e.big) {
        this.shake = Math.min(e.noStop ? 0.5 : 1.3, this.shake + (e.noStop ? 0.25 : 0.6));
        if (!e.noStop) { this.freeze(0.05); this.flash = Math.max(this.flash, 0.25); }
        this.sfx('boom', 1);
        for (let i = 0; i < 16; i++) {
          const a = Math.random() * TAU, v = rand(1, 4) * e.r;
          this.particle(e.x, e.y, i % 3 === 0 ? '#ffffff' : i % 2 ? '#ff6a1f' : '#ffd23f', e.r * rand(0.06, 0.14), rand(0.3, 0.7), Math.cos(a) * v, Math.sin(a) * v, 'spark');
        }
        for (let i = 0; i < 6; i++) this.puff(e.x + rand(-0.4, 0.4) * e.r, e.y + rand(-0.3, 0.3) * e.r, e.r * rand(0.25, 0.45), '#5a4a44');
      }
      for (const o of this.objects) {
        if (o.dead || (o.size > (e.maxSize || e.r * 1.1) && !o.mother)) continue;
        const d = Math.hypot(o.x - e.x, o.y - e.y);
        if (d > e.r + o.size * 0.5) continue;
        o.hp -= e.dmg * (1 - 0.5 * clamp(d / e.r, 0, 1));
        o.hitAnim = 1; o.flash = 1;
        if (o.hp <= 0) this.kill(o, 'boom');
      }
    }
    this.explosionQueue.length = 0;
    if (this.objects.some(o => o.dead)) this.objects = this.objects.filter(o => !o.dead);
  }

  // ------------------------------------------------------------------
  spawnTick(initial) {
    const p = this.p;
    const viewR = Math.hypot(this.vw, this.vh) / 2 / this.targetZoom();
    const area = viewR * C.SPAWN.areaViews, desp = viewR * C.SPAWN.despawnViews;
    this.objects = this.objects.filter(o => {
      if (o.mother) return true; // die Mutterpflanze verschwindet nie
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d > desp) return false;
      if (o.size < p.r * 0.05 && d > viewR * 0.7) return false;
      return true;
    });
    let relevant = 0;
    for (const o of this.objects) {
      if (o.size >= p.r * C.SPAWN.minRel * 0.6 && Math.hypot(o.x - p.x, o.y - p.y) < area) relevant++;
    }
    let need = C.SPAWN.density - relevant;
    if (initial) { for (let i = 0; i < need; i++) this.spawnOne(p.r * 4, area); return; }
    // Lücken direkt um den Spieler füllen (z. B. nach dem Wachsen), sonst am Rand
    let near = 0;
    for (const o of this.objects) if (o.size >= p.r * C.SPAWN.minRel * 0.8 && Math.hypot(o.x - p.x, o.y - p.y) < viewR) near++;
    const nearTarget = C.SPAWN.density * Math.pow(1 / C.SPAWN.areaViews, 2) * 0.9;
    const nearNeed = Math.min(6, Math.ceil(nearTarget - near));
    for (let i = 0; i < nearNeed; i++) this.spawnOne(p.r * 3.5, viewR * 0.95, true);
    need = Math.min(need, 10);
    for (let i = 0; i < need; i++) this.spawnOne(viewR * 1.05, area);
  }

  spawnOne(minD, maxD, popIn = false) {
    const p = this.p;
    const crateChance = this.event && this.event.id === 'crates' ? 0.25 : C.CRATE_CHANCE * this.stats.crateMult;
    let t;
    if (Math.random() < crateChance) {
      const W = this.worlds[this.world];
      const avg = W.objects.reduce((s, o) => s + o.value, 0) / W.objects.length;
      t = { name: 'Schrottkiste', size: p.r * rand(0.45, 0.75), shape: 'crate', color: '#c98a3d', value: avg, world: this.world, crate: true };
    } else t = this.pickType();
    if (!t) return;
    let x = 0, y = 0, ok = false;
    for (let tries = 0; tries < 8 && !ok; tries++) {
      const a = Math.random() * TAU, d = Math.sqrt(rand(minD * minD, maxD * maxD));
      x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d;
      ok = true;
      for (const o of this.objects) {
        if (Math.hypot(o.x - x, o.y - y) < (o.size + t.size) * 0.95) { ok = false; break; }
      }
    }
    if (!ok) return;
    this.makeObject(t, x, y, popIn);
  }
  makeObject(t, x, y, popIn = false, extra = null) {
    const evGold = this.event && this.event.id === 'gold';
    const golden = !t.crate && Math.random() < (evGold ? 0.3 : this.stats.goldenChance);
    const hp = Math.pow(t.size, 1.5) * this.hpScale(t.world) * (t.crate ? 0.5 : 1);
    const o = {
      x, y, size: t.size, name: t.name, shape: t.shape, color: t.color, value: t.value, world: t.world,
      explosive: !!t.explosive, golden, crate: !!t.crate, hp, maxHp: hp, hitCd: 0, hitAnim: 0, flash: 0, bonusMult: t.bonusMult || 1,
      move: t.move || null, speed: t.speed || 0, hazard: t.hazard || 0, vx: 0, vy: 0, heading: Math.random() * TAU, wanderT: 0, anim: Math.random() * 10,
      face: Math.random() < 0.5 ? -1 : 1, seed: Math.random(), scared: 0, pop: popIn ? 1 : 0,
    };
    if (o.move === 'drive') {
      const ground = this.worlds[t.world].ground;
      const a = ground === 'space' || ground === 'ocean' ? Math.random() * TAU : Math.floor(Math.random() * 4) * Math.PI / 2;
      o.vx = Math.cos(a) * o.speed * o.size; o.vy = Math.sin(a) * o.speed * o.size;
      o.face = o.vx >= 0 ? 1 : -1;
    }
    if (extra) Object.assign(o, extra);
    this.objects.push(o);
    return o;
  }

  // ---------------- Karte 420: goldene Blätter sammeln, dann die Mutterpflanze
  updateGoal(dt) {
    const G = this.map.goal, p = this.p;
    if (this.winT > 0) { this.winT -= dt; p.rage = this.stats.rageMax; if (this.winT <= 0) this.finish(); return; }
    if (this.mother) return;
    this.leafT -= dt;
    if (this.leafT <= 0 && this.objects.filter(o => o.leaf && !o.dead).length < G.leafAlive) {
      this.leafT = G.leafEvery;
      const a = Math.random() * TAU, d = p.r * rand(3, 9), hp = this.oneHit() * 0.5;
      this.makeObject({ name: 'Goldenes Hanfblatt', size: p.r * rand(0.3, 0.5), shape: 'leaf', color: '#ffd23f', value: 6, world: 0, move: 'flee', speed: 2.4 },
        p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, true, { leaf: true, golden: true, hp, maxHp: hp });
    }
  }
  spawnMother() {
    const p = this.p, G = this.map.goal, a = Math.random() * TAU, d = p.r * 9, hp = this.oneHit() * G.motherHits;
    this.mother = this.makeObject({ name: 'Mutter Mary Jane', size: p.r * 2.5, shape: 'weed', color: '#3c9a3a', value: 420, world: 0 },
      p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, true, { mother: true, golden: false, hp, maxHp: hp });
    this.quest = { type: 'kill', target: 'Mutter Mary Jane', count: 1, progress: 0, label: 'Hau Mutter Mary Jane um!' }; this.questT = Infinity;
    this.hook('onCallout', 'MUTTER MARY JANE!', 6); this.sfx('berserk'); this.shake = 1.2; this.flash = 0.6;
  }

  pickType() {
    const r = this.p.r, w = this.world;
    const cands = []; let total = 0;
    for (let wi = w - 1; wi <= w + 1; wi++) {
      const W = this.worlds[wi]; if (!W) continue;
      for (const t of W.objects) {
        const rel = t.size / r;
        if (rel < C.SPAWN.minRel || rel > C.SPAWN.maxRel) continue;
        let wt = Math.exp(-Math.pow(Math.log(rel / C.SPAWN.sweetSpot), 2) / (2 * 0.75 * 0.75));
        if (wi === w + 1) wt *= C.SPAWN.nextWorldPeek;
        if (wi === w - 1) wt *= 0.6;
        if (t.hazard) wt *= 0.6;
        cands.push({ t, wi, wt }); total += wt;
      }
    }
    if (!cands.length) {
      // Endlos: nach der letzten Welt wachsen die Objekte einfach mit
      const W = this.worlds[this.worlds.length - 1];
      const t = pick(W.objects);
      const size = r * rand(0.25, 1.6);
      return { ...t, size, world: this.worlds.length - 1, bonusMult: Math.min(64, Math.pow(size / t.size, 0.25)) };
    }
    let k = Math.random() * total;
    for (const c of cands) { k -= c.wt; if (k <= 0) return { ...c.t, size: c.t.size * rand(0.88, 1.15), world: c.wi }; }
    const c = cands[cands.length - 1];
    return { ...c.t, world: c.wi };
  }

  mutationChoices() {
    const pool = C.MUTATIONS.filter(m => !this.muts.includes(m.id));
    const out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    // alle Mutationen vergeben: mit stapelbaren Verstärkungen auffüllen (nie eine leere Auswahl)
    const boosts = C.BOOSTS.slice();
    while (out.length < 3 && boosts.length) out.push(boosts.splice(Math.floor(Math.random() * boosts.length), 1)[0]);
    return out;
  }

  chooseMutation(id) {
    if (id) this.muts.push(id);
    const ratio = this.p.rage / this.stats.rageMax;
    this.stats = computeStats(this.save, this.muts, this.char.id);
    this.p.rage = ratio * this.stats.rageMax;
    this.state = 'play';
  }

  // ------------------------------------------------------------------
  updateCamera(dt) {
    const p = this.p;
    const k = Math.min(1, dt * 8);
    this.cam.x += (p.x - this.cam.x) * k;
    this.cam.y += (p.y - p.r * 0.6 - this.cam.y) * k;
    const tz = this.targetZoom() / (p.berserkT > 0 ? 1.12 : 1);
    this.cam.zoom *= Math.pow(tz / this.cam.zoom, Math.min(1, dt * 2.5));
  }

  updateFx(dt) {
    this.flushCoinPool();
    this.updateCamera(dt);
    for (const q of this.particles) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
      const f = q.kind === 'flame' ? 0.96 : 0.9; q.vx *= f; q.vy *= f;
    }
    this.particles = this.particles.filter(q => q.life > 0);
    for (const c of this.chunks) {
      c.life -= dt;
      c.vz -= c.g * dt; c.z += c.vz * dt;
      if (c.z <= 0) { c.z = 0; if (c.vz < 0) { c.vz = -c.vz * 0.35; c.vx *= 0.6; c.vy *= 0.6; c.vr *= 0.5; } }
      c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    }
    this.chunks = this.chunks.filter(c => c.life > 0);
    for (const u of this.puffs) { u.life -= dt; u.r += u.grow * dt; u.y -= u.r * 0.3 * dt; }
    this.puffs = this.puffs.filter(u => u.life > 0);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter(d => d.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= t.vy * dt; t.vy *= 0.94; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter(r => r.life > 0);
    for (const o of this.objects) {
      if (o.hitCd > 0) o.hitCd -= dt;
      if (o.hitAnim > 0) o.hitAnim = Math.max(0, o.hitAnim - dt * 6);
      if (o.flash > 0) o.flash = Math.max(0, o.flash - dt * 10);
      if (o.pop > 0) o.pop = Math.max(0, o.pop - dt * 3);
      if (o.pulled > 0) o.pulled -= dt;
      if (!o.move) o.anim += dt;
    }
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.flash = Math.max(0, this.flash - dt * 3);
  }

  // Treffer-Stopp (kurzer Freeze für Wucht) – höchstens alle 0,8 s, damit Dauer-Action nicht ruckelt
  freeze(t) {
    if (this.hitStopCd > 0) return;
    this.hitStop = Math.max(this.hitStop, t); this.hitStopCd = 0.8;
  }
  particle(x, y, color, size, life, vx, vy, kind = 'bit') {
    if (this.particles.length > (this.fx && this.fx.low ? 120 : 500)) return;
    if (this.fx && this.fx.low && Math.random() < 0.5) return;
    this.particles.push({ x, y, color, size, life, max: life, vx, vy, rot: Math.random() * TAU, vr: rand(-8, 8), kind });
  }
  puff(x, y, r, color) {
    if (this.puffs.length > (this.fx && this.fx.low ? 25 : 70)) return;
    this.puffs.push({ x, y, r, grow: r * rand(1.5, 2.5), life: rand(0.35, 0.6), max: 0.6, color });
  }
  text(x, y, s, color, life, vy, big = false) {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x, y, s, color, life, max: life, vy, big });
  }

  die() {
    this.state = 'dying';
    this.dyingT = 1.2;
    this.sfx('die');
    const p = this.p;
    p.berserkT = 0;
    for (let i = 0; i < 14; i++) this.puff(p.x + rand(-1, 1) * p.r, p.y + rand(-0.5, 0.5) * p.r, p.r * rand(0.5, 1), '#3a2a2a');
  }

  finish() {
    this.state = 'over';
    const s = this.save;
    const earned = Math.floor(this.runScrap);
    const rec = { newWorld: this.world > (s.bestWorld || 0), newSize: this.maxRadius > (s.bestRadius || 0) };
    const chaos = Math.floor(this.runChaos);
    s.scrap += earned; s.totalScrap += earned; s.runs++;
    s.chaos = (s.chaos || 0) + chaos; s.totalChaos = (s.totalChaos || 0) + chaos;
    s.totalKills = (s.totalKills || 0) + this.kills;
    s.cycleScrap = (s.cycleScrap || 0) + earned;
    // Statistik
    const st = s.stats = s.stats || {};
    const add = (k, v) => { st[k] = (st[k] || 0) + v; };
    for (const [k, v] of Object.entries(this.rs)) add(k, v);
    add('quests', this.questsDone); add('playTime', this.time);
    st.bestCombo = Math.max(st.bestCombo || 0, this.bestCombo);
    st.longestRun = Math.max(st.longestRun || 0, this.time);
    st.bestRadius = Math.max(st.bestRadius || 0, this.maxRadius);
    if (this.won420) {
      s.won420 = (s.won420 || 0) + 1;
      s.darkMatter = (s.darkMatter || 0) + this.map.goal.rewardDM; s.totalDarkMatter = (s.totalDarkMatter || 0) + this.map.goal.rewardDM;
    }
    if (this.bossKilled) {
      s.bossKills = (s.bossKills || 0) + 1;
      s.darkMatter = (s.darkMatter || 0) + C.BOSS.rewardDM; s.totalDarkMatter = (s.totalDarkMatter || 0) + C.BOSS.rewardDM;
      if (!s.unlockedChars.includes(C.BOSS.unlock)) s.unlockedChars.push(C.BOSS.unlock);
    }
    s.cycleBest = Math.max(s.cycleBest || 0, this.world);
    s.mapBest = s.mapBest || {};
    s.mapBest[this.map.id] = Math.max(s.mapBest[this.map.id] || 0, this.world);
    s.bestWorld = Math.max(s.bestWorld || 0, this.world);
    s.bestRadius = Math.max(s.bestRadius || 0, this.maxRadius);
    // Monster-EP
    const md = monsterData(s, this.char.id), lvlBefore = md.lvl;
    const xp = md.lvl >= C.MONSTER_LEVEL.max ? 0 : runXp(this.kills, this.world, this.questsDone);
    const lvlUps = addMonsterXp(s, this.char.id, xp);
    this.hook('onEnd', {
      xp, lvlBefore, lvlAfter: md.lvl, lvlUps, charId: this.char.id,
      earned, chaos, kills: this.kills, map: this.map.id, time: this.time, world: this.world, maxRadius: this.maxRadius,
      bestCombo: this.bestCombo, muts: this.muts.slice(), quests: this.questsDone, bossKilled: !!this.bossKilled, won420: !!this.won420, leaves: this.leaves || 0, ...rec,
    });
  }

  worldProgress() {
    const w = this.world, cur = this.worlds[w], next = this.worlds[w + 1];
    if (!next) return 1;
    const lo = Math.max(cur.minRadius, C.PLAYER.startRadius);
    return clamp(Math.log(this.p.r / lo) / Math.log(next.minRadius / lo), 0, 1);
  }
}

export function shadeHex(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Schrott in der passenden Währungs-Stufe (1 Platin = 1 Mrd. Schrott …)
export function tierOf(n) { let t = 0; for (let i = 0; i < C.CURRENCY_TIERS.length; i++) if (n >= C.CURRENCY_TIERS[i].value) t = i; return t; }
export function money(n, withName = false) {
  const t = tierOf(n), T = C.CURRENCY_TIERS[t], v = n / T.value;
  const num = t === 0 || v >= 1000 ? fmt(v) : v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : String(Math.floor(v));
  return T.icon + ' ' + num + (withName ? ' ' + T.name : '');
}

export function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return String(Math.floor(n));
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  if (n >= 1e36) return n.toExponential(2).replace('+', '');
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + units[i];
}
