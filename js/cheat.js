// =====================================================================
//  RAGEVERSE – CHEAT-/TESTVERSION (nur im Repo ragegame-cheat)
//  Eigener Speicher (rageverse_cheat_*), echte Spielstände bleiben unberührt.
//  Menü: 🛠-Knopf oben links oder Taste ^ / `
// =====================================================================
(function () {
  const wait = setInterval(() => { if (window.__rv && window.__rv.writeSave) { clearInterval(wait); init(); } }, 100);
  function init() {
    const { C } = window.__rv;
    const css = document.createElement('style');
    css.textContent = `
      #cheat-btn { position: fixed; left: 10px; top: 50%; z-index: 90; background: #7a1aff; color: #fff; border: 2px solid #c8a0ff; border-radius: 12px; padding: 6px 10px; font: 800 14px system-ui, sans-serif; cursor: pointer; box-shadow: 0 0 16px rgba(160,100,255,.6); }
      #cheat-tag { position: fixed; right: 10px; bottom: 10px; z-index: 90; background: #7a1aff; color: #fff; border-radius: 8px; padding: 3px 8px; font: 800 11px system-ui, sans-serif; pointer-events: none; opacity: .85; }
      #cheat-panel { position: fixed; left: 10px; top: 10px; bottom: 10px; z-index: 95; width: min(330px, calc(100vw - 20px)); overflow-y: auto; background: #1a1030f2; border: 2px solid #c8a0ff; border-radius: 16px; padding: 12px; color: #fff; font: 600 13px system-ui, sans-serif; }
      #cheat-panel h3 { margin: 0 0 8px; font-size: 18px; } #cheat-panel h4 { margin: 12px 0 6px; color: #c8a0ff; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
      #cheat-panel button { display: block; width: 100%; margin: 4px 0; padding: 8px; border-radius: 10px; border: 1px solid #5a3a9a; background: #2a1a4a; color: #fff; font: 700 13px system-ui, sans-serif; cursor: pointer; text-align: left; }
      #cheat-panel button:hover { background: #3a2a6a; } #cheat-panel button.on { background: #2a7a3a; border-color: #7fe07f; }
      #cheat-panel .row { display: flex; gap: 6px; align-items: center; } #cheat-panel input { width: 70px; padding: 6px; border-radius: 8px; border: 1px solid #5a3a9a; background: #120a24; color: #fff; font: 700 13px system-ui; }
      #cheat-panel small { opacity: .7; display: block; margin-top: 8px; line-height: 1.4; }`;
    document.head.appendChild(css);
    const tag = document.createElement('div'); tag.id = 'cheat-tag'; tag.textContent = '🛠 CHEAT-VERSION'; document.body.appendChild(tag);
    const btn = document.createElement('button'); btn.id = 'cheat-btn'; btn.textContent = '🛠 Cheats'; document.body.appendChild(btn);
    const panel = document.createElement('div'); panel.id = 'cheat-panel'; panel.hidden = true; document.body.appendChild(panel);
    let god = false;
    const S = () => window.__rv.save, save = () => window.__rv.writeSave(S());
    const toast = t => { tag.textContent = '✔ ' + t; setTimeout(() => { tag.textContent = '🛠 CHEAT-VERSION'; }, 1800); };
    const slotNr = () => { try { const m = JSON.parse(localStorage.getItem('rageverse_cheat_meta') || '{}'); return (m.lastSlot ?? 0) + 1; } catch { return 1; } };
    const reload = (world) => { save(); const q = new URLSearchParams(location.search); q.set('slot', slotNr()); if (world) q.set('world', world - 1); else q.delete('world'); location.search = q.toString(); };
    const A = {
      money: () => { const s = S(); s.scrap = 1e60; s.chaos = 1e15; s.totalChaos = Math.max(s.totalChaos || 0, 1e15); s.darkMatter = 1e9; s.totalDarkMatter = Math.max(s.totalDarkMatter || 0, 1e9); s.prestiges = Math.max(s.prestiges || 0, 1); reload(); },
      upgrades: () => { const s = S(); C.UPGRADES.forEach(u => s.upgrades[u.id] = u.max); reload(); },
      noupgrades: () => { const s = S(); s.upgrades = {}; reload(); },
      dm: () => { const s = S(); C.DM_PERKS.forEach(d => s.dmPerks[d.id] = d.max); reload(); },
      nodm: () => { const s = S(); s.dmPerks = {}; reload(); },
      evos: () => { const s = S(); C.SKILL_EVOS.forEach(e => s.evos[e.id] = true); reload(); },
      monsters: () => { const s = S(); s.unlockedChars = C.CHARACTERS.map(c => c.id); reload(); },
      skins: () => { const s = S(); C.CHARACTERS.forEach(c => { s.skins[c.id] = C.SKINS.filter(k => !k.special).map(k => k.id); }); s.bossKills = Math.max(1, s.bossKills || 0); s.won420 = Math.max(1, s.won420 || 0); reload(); },
      levels: () => { const s = S(); s.monsters = s.monsters || {}; C.CHARACTERS.forEach(c => { const m = s.monsters[c.id] || (s.monsters[c.id] = { xp: 0, lvl: 1, pts: {} }); m.lvl = C.MONSTER_LEVEL.max; m.xp = 0; }); reload(); },
      boss: () => { const s = S(); s.bossKills = Math.max(1, s.bossKills || 0); s.bestWorld = Math.max(s.bestWorld || 0, 49); s.egg420 = false; if (!s.unlockedChars.includes('infernus')) s.unlockedChars.push('infernus'); reload(); },
      maps: () => { const s = S(); s.bestWorld = Math.max(s.bestWorld || 0, 49); s.mapBest = s.mapBest || {}; s.mapBest.suburb = Math.max(s.mapBest.suburb || 0, 49); s.bossKills = Math.max(1, s.bossKills || 0); s.egg420 = true; reload(); },
      ach: () => { const s = S(); C.ACHIEVEMENTS.forEach(a => s.achievements[a.id] = s.achievements[a.id] || Date.now()); if (!s.unlockedChars.includes('urzorn')) s.unlockedChars.push('urzorn'); reload(); },
      everything: () => { A_silent(); reload(); },
      world: () => { reload(Math.max(1, Math.min(50, Number(document.getElementById('cheat-world').value) || 1))); },
      god: () => { god = !god; document.getElementById('cheat-god').classList.toggle('on', god); toast(god ? 'Unsterblich AN' : 'Unsterblich AUS'); },
      berserk: () => { const g = window.__rv.game; if (g.p) { g.p.berserk = 1; g.p.berserkCd = 0; toast('Berserker voll'); } },
      leaves: () => { const g = window.__rv.game; if (g.map && g.map.goal) { g.leaves = g.map.goal.leaves - 1; toast('Noch 1 Blatt bis Mary Jane'); } else toast('Nur auf Karte 420'); },
    };
    function A_silent() {
      const s = S();
      s.scrap = 1e60; s.chaos = 1e15; s.darkMatter = 1e9; s.prestiges = Math.max(s.prestiges || 0, 1);
      C.UPGRADES.forEach(u => s.upgrades[u.id] = u.max); C.DM_PERKS.forEach(d => s.dmPerks[d.id] = d.max); C.SKILL_EVOS.forEach(e => s.evos[e.id] = true);
      s.unlockedChars = C.CHARACTERS.map(c => c.id); C.CHARACTERS.forEach(c => { s.skins[c.id] = C.SKINS.filter(k => !k.special).map(k => k.id); });
      s.monsters = s.monsters || {}; C.CHARACTERS.forEach(c => { const m = s.monsters[c.id] || (s.monsters[c.id] = { xp: 0, lvl: 1, pts: {} }); m.lvl = C.MONSTER_LEVEL.max; });
      s.bossKills = Math.max(1, s.bossKills || 0); s.won420 = Math.max(1, s.won420 || 0); s.bestWorld = 49; s.mapBest = s.mapBest || {}; s.mapBest.suburb = 49; s.egg420 = true;
    }
    panel.innerHTML = `<h3>🛠 Cheat-Menü</h3>
      <button data-a="everything">⭐ ALLES freischalten (Komplett-Paket)</button>
      <h4>Währungen & Fortschritt</h4>
      <button data-a="money">💰 Unbegrenzt Schrott, Chaos & ◆</button>
      <button data-a="upgrades">⏫ Alle Upgrades max</button><button data-a="noupgrades">↩ Upgrades auf 0</button>
      <button data-a="dm">◆ Masterplan max</button><button data-a="nodm">↩ Masterplan auf 0</button>
      <button data-a="evos">🧬 Alle Skill-Evolutionen</button>
      <h4>Monster & Skins</h4>
      <button data-a="monsters">👹 Alle Monster (inkl. geheim)</button>
      <button data-a="skins">✨ Alle Skins (inkl. Bezwinger & Kush)</button>
      <button data-a="levels">🌳 Alle Monster auf Level 99</button>
      <h4>Welten & Karten</h4>
      <div class="row"><input id="cheat-world" type="number" min="1" max="50" value="50"><button data-a="world" style="margin:0">🚀 Run in Welt starten</button></div>
      <button data-a="maps">🗺 Alle Karten freischalten (inkl. 420)</button>
      <button data-a="boss">😈 ZORNOS als besiegt markieren (Easter-Egg-Popup testen)</button>
      <button data-a="ach">🏆 Alle Erfolge</button>
      <h4>Im Run</h4>
      <button data-a="god" id="cheat-god">🛡 Unsterblich (Wut bleibt voll)</button>
      <button data-a="berserk">😡 Berserker sofort voll</button>
      <button data-a="leaves">🍃 Karte 420: 419 Blätter setzen</button>
      <small>Testversion: speichert getrennt vom echten Spiel. Taste ^ / \` öffnet und schließt dieses Menü.</small>`;
    panel.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && A[b.dataset.a]) A[b.dataset.a](); });
    const toggle = () => { panel.hidden = !panel.hidden; };
    btn.onclick = toggle;
    window.addEventListener('keydown', e => { if (e.key === '`' || e.key === '^' || e.code === 'Backquote') { e.preventDefault(); toggle(); } });
    setInterval(() => { const g = window.__rv.game; if (god && g && g.p && g.state === 'play') { g.p.rage = g.stats.rageMax; } }, 50);
  }
})();
