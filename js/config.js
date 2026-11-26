// =====================================================================
//  RAGEVERSE – BALANCING & INHALTE
//  Alle Zahlen, die das Spielgefühl bestimmen, stehen hier.
//  Werte ändern → Seite neu laden → sofort testen.
// =====================================================================

export const GAME_NAME = 'RAGEVERSE';

// ---------------------------------------------------------------------
// Grundwerte des Monsters (vor Upgrades)
// ---------------------------------------------------------------------
export const PLAYER = {
  startRadius: 10,        // Größe beim Start eines Runs (Welt-Einheiten)
  speed: 5.2,             // Tempo in "eigenen Radien pro Sekunde"
  accel: 18,              // wie schnell man auf Zielspeed kommt (hoch = direkte Steuerung)
  damage: 1.0,            // Schadensfaktor pro Schlag
  breakRatio: 1.05,       // Objekte bis zu (Radius × breakRatio) sind zerstörbar
  crumbRatio: 0.35,       // Objekte unter (Radius × crumbRatio) zerbröseln sofort bei Berührung
  absorb: 0.17,           // Anteil der Objekt-Masse, die man beim Zerstören aufnimmt
  maxGrowPerKill: 0.05,
  bigKillGrowth: 2.5,     // große Brocken (ab 60 % deiner Größe) geben bis zu 2× Wachstum – Fortschritt durch große Ziele   // höchstens so viel Masse-Zuwachs pro Zerstörung (verhindert „alles wird babyklein“)
  rageMax: 100,
  rageDrain: 8,           // Wut-Verlust pro Sekunde
  rageDrainGrowth: 0.03,  // Drain steigt pro Sekunde Laufzeit um diesen Anteil (Druck steigt)
  ragePerKill: 7,         // Basis-Wut pro Zerstörung (skaliert mit Objektgröße)
  dashCooldown: 2.0,      // Sekunden
  dashPower: 3.2,         // Speed-Multiplikator beim Stampfer-Ansturm
  dashTime: 0.24,
  magnet: 0,              // Schrott-Anziehung (in Radien)
};

// Kombo: Zerstörungen innerhalb von window Sekunden erhöhen den Multiplikator
export const COMBO = {
  window: 1.5,
  perStep: 0.1,   // +10 % Schrott pro Kombo-Stufe
  max: 4.0,       // maximaler Multiplikator
  callouts: [     // Ausrufe bei Kombo-Stufen
    [10, 'SMASH!'], [20, 'KRAWALL!'], [35, 'AMOK!'], [50, 'UNAUFHALTSAM!'], [75, 'WELTUNTERGANG!'], [110, 'GOTTMODUS!'],
  ],
};

// Berserker-Modus: füllt sich durch Zerstörung, dann kurz riesig & unaufhaltsam
export const BERSERK = {
  perKill: 0.02,       // Füllung pro Zerstörung (× Größenfaktor); bei voller Leiste mit R zünden
  duration: 6,         // Sekunden
  cooldownCharge: 0.15, // Ladung während der Abklingzeit (Viertel-Rate, hält die Balance)
  sizeBoost: 1.3,      // optisch + Trefferzone größer
  breakBoost: 1.6,     // zerstört bis 160 % der eigenen Größe
  damageMult: 3,
  speedMult: 1.2,
  cooldown: 8,         // Sekunden nach dem Berserker, in denen sich die Leiste nicht füllt
};

export const GOLDEN_CHANCE = 0.025;  // Chance auf goldenes Objekt
export const GOLDEN_MULT = 6;         // Schrott-Multiplikator goldener Objekte
export const CRATE_CHANCE = 0.03;     // Chance, dass statt eines Objekts eine Schrottkiste spawnt
export const CRATE_MULT = 10;         // Schrott-Inhalt einer Kiste (× Objektwert)
export const SCRAP_SCALE = 0.12;

// Währungs-Stufen: Ab 1 Milliarde wird Schrott „eingeschmolzen“ und eine Stufe höher angezeigt
export const CURRENCY_TIERS = [
  { icon: '⚙', name: 'Schrott', value: 1 },
  { icon: '🥈', name: 'Platin', value: 1e9 },
  { icon: '💎', name: 'Diamant', value: 1e18 },
  { icon: '🔮', name: 'Plasma', value: 1e27 },
  { icon: '✴', name: 'Sternenstaub', value: 1e36 },
  { icon: '♾', name: 'Antimaterie', value: 1e45 },
  { icon: '👑', name: 'Rageium', value: 1e54 },
];      // globaler Schrott-Faktor

// Jede Welt ist härter als die davor (Faktor pro Welt-Stufe):
export const WORLD_SCALING = {
  // frühe Welten (bis Galaxie) steigen stärker an, danach gleichmäßig bis Welt 50+
  early: 8,
  hp: 1.68,        hpEarly: 2.6,       // Objekte halten mehr aus  → Wucht-Upgrades werden wichtig
  absorb: 0.85,    absorbEarly: 0.7,   // man wächst langsamer     → Hunger-Upgrades werden wichtig
  rageDrain: 1.08, rageDrainEarly: 1.12, // Wut sinkt schneller    → Wut-Upgrades werden wichtig
  lateRunAfter: 150, // ab so vielen Sekunden steigt der Wut-Verlust immer schneller (Runs bleiben kurz)
};

// ☠ Chaos: zweite Währung, nur durch Zerstörung – schaltet Monster frei
export const CHAOS = {
  perKill: 1,          // pro Zerstörung
  bigBonus: 2,         // + pro Objekt, das größer ist als du (× Größenverhältnis)
  questBonus: 25,      // pro erfülltem Auftrag
};

// Evolution des Monsters – eine Stufe pro Welt
export const EVOLUTION = [
  { name: 'Wutzwerg',        body: '#e8432e', belly: '#ffc29a', horn: '#fff1d6', dark: '#7a1410' },
  { name: 'Krawallo',        body: '#e0342f', belly: '#ffc07a', horn: '#fff1d6', dark: '#6e1210' },
  { name: 'Zerstörer',       body: '#c6262e', belly: '#ff9d6a', horn: '#3a2222', dark: '#5a0e12' },
  { name: 'Steinkoloss',     body: '#9a4a34', belly: '#e0b08a', horn: '#3a2a22', dark: '#4a2218' },
  { name: 'Lavatitan',       body: '#4a1c1a', belly: '#ff7a2a', horn: '#1c0f0d', dark: '#1c0806' },
  { name: 'Weltenfresser',   body: '#6a2bd9', belly: '#ff9ae0', horn: '#ffe9ff', dark: '#2a0f5a' },
  { name: 'Sonnenschlinger', body: '#ff6a1f', belly: '#ffe46a', horn: '#fff8d0', dark: '#8a2a00' },
  { name: 'Galaxienfresser', body: '#22155a', belly: '#8a6bff', horn: '#ffffff', dark: '#0a0520' },
  { name: 'Haufenbrecher',   body: '#0f3a5a', belly: '#6bf0ff', horn: '#e0ffff', dark: '#041420' },
  { name: 'Weltenende',      body: '#3a0a2a', belly: '#ff4ab0', horn: '#ffe0f4', dark: '#14020c' },
  { name: 'Multiversum-Gott', body: '#f2f2ff', belly: '#ffd23f', horn: '#ff3b2f', dark: '#3a2a6a' },
];

// ---------------------------------------------------------------------
// Welten
// Objekt-Felder:
//   size       Radius in Welt-Einheiten
//   shape      Zeichen-Funktion in render.js
//   color      Hauptfarbe
//   value      Schrottwert (× Welt-Multiplikator)
//   explosive  explodiert und reißt alles mit
//   move       'flee' (flieht), 'drive' (fährt geradeaus), 'wander' (läuft herum)
//   speed      Tempo in eigenen Größen pro Sekunde
//   hazard     Wut-Schaden (% der Max-Wut), wenn man es berührt, aber (noch) nicht zerstören kann
// ---------------------------------------------------------------------
export const WORLDS = [
  {
    id: 'garden', name: 'Garten', minRadius: 0, scrapMult: 1, ground: 'lawn',
    bg: '#63b34c', bg2: '#5aa644', accent: '#4e9a3d',
    objects: [
      { name: 'Grashalm', size: 3, shape: 'blade', color: '#86d65d', value: 1 },
      { name: 'Gänseblümchen', size: 3.5, shape: 'flower', color: '#ffffff', value: 1 },
      { name: 'Blume', size: 4.5, shape: 'flower', color: '#ff6fa8', value: 2 },
      { name: 'Tulpe', size: 4.5, shape: 'tulip', color: '#ffcf33', value: 2 },
      { name: 'Pilz', size: 5, shape: 'mushroom', color: '#e84a3c', value: 2 },
      { name: 'Schnecke', size: 4.5, shape: 'snail', color: '#d9a35a', value: 2, move: 'wander', speed: 0.3 },
      { name: 'Huhn', size: 7, shape: 'chicken', color: '#ffffff', value: 4, move: 'flee', speed: 3.2 },
      { name: 'Gartenzwerg', size: 7.5, shape: 'gnome', color: '#3b6fd6', value: 4 },
      { name: 'Gießkanne', size: 8.5, shape: 'can', color: '#4fb3a9', value: 4 },
      { name: 'Blumentopf', size: 9, shape: 'pot', color: '#d9743f', value: 5 },
      { name: 'Gasflasche', size: 8.5, shape: 'tank', color: '#e03a3a', value: 6, explosive: true },
      { name: 'Katze', size: 10, shape: 'cat', color: '#f29b38', value: 7, move: 'flee', speed: 3.6 },
      { name: 'Dornenbusch', size: 12, shape: 'bush', color: '#3c8a3a', value: 8, hazard: 12 },
      { name: 'Gartenstuhl', size: 12, shape: 'chair', color: '#f2f2f2', value: 7 },
      { name: 'Rasenmäher', size: 14, shape: 'mower', color: '#e8462e', value: 10, move: 'drive', speed: 1.4, hazard: 16 },
      { name: 'Grill', size: 14, shape: 'grill', color: '#3a3a3a', value: 9, explosive: true },
      { name: 'Hundehütte', size: 20, shape: 'house', color: '#c47f3e', value: 14 },
      { name: 'Gartenhaus', size: 30, shape: 'house', color: '#8a5a2b', value: 22 },
    ],
  },
  {
    id: 'street', name: 'Straße', minRadius: 40, scrapMult: 3, ground: 'street',
    bg: '#c9ccd3', bg2: '#4d5059', accent: '#f5d14a',
    objects: [
      { name: 'Pylon', size: 9, shape: 'cone', color: '#ff8a1f', value: 1 },
      { name: 'Hydrant', size: 11, shape: 'hydrant', color: '#e23b3b', value: 2 },
      { name: 'Passant', size: 12, shape: 'person', color: '#4a7fd9', value: 3, move: 'flee', speed: 2.8 },
      { name: 'Mülltonne', size: 14, shape: 'bin', color: '#2f8a4a', value: 3 },
      { name: 'Briefkasten', size: 14, shape: 'mailbox', color: '#f5c518', value: 3 },
      { name: 'Ampel', size: 20, shape: 'trafficlight', color: '#2b2b2b', value: 4 },
      { name: 'Roller', size: 20, shape: 'scooter', color: '#56c2ff', value: 5, move: 'drive', speed: 2.2 },
      { name: 'Auto', size: 32, shape: 'car', color: '#e84a5f', value: 8, move: 'drive', speed: 1.8 },
      { name: 'Taxi', size: 32, shape: 'car', color: '#ffd23f', value: 9, move: 'drive', speed: 2.0 },
      { name: 'Polizeiauto', size: 40, shape: 'police', color: '#f4f6ff', value: 14, move: 'drive', speed: 2.2, hazard: 15 },
      { name: 'Tankwagen', size: 50, shape: 'tanker', color: '#e03a3a', value: 14, explosive: true },
      { name: 'Bushaltestelle', size: 52, shape: 'shelter', color: '#8fb3d9', value: 12 },
      { name: 'Kiosk', size: 70, shape: 'house', color: '#e8a94a', value: 18 },
      { name: 'Bus', size: 95, shape: 'bus', color: '#f2a03d', value: 26, move: 'drive', speed: 1.0 },
    ],
  },
  {
    id: 'city', name: 'Stadt', minRadius: 160, scrapMult: 9, ground: 'city',
    bg: '#a7acba', bg2: '#3c3f4c', accent: '#7fd3ff',
    objects: [
      { name: 'Laterne', size: 36, shape: 'streetlamp', color: '#ffe48a', value: 1 },
      { name: 'Auto', size: 44, shape: 'car', color: '#4bd1a0', value: 2, move: 'drive', speed: 1.8 },
      { name: 'Passanten', size: 50, shape: 'person', color: '#d94a8a', value: 2, move: 'flee', speed: 2.5 },
      { name: 'Wohnhaus', size: 80, shape: 'building', color: '#e0b48a', value: 5 },
      { name: 'Laden', size: 95, shape: 'shop', color: '#e07a5f', value: 6 },
      { name: 'Tankstelle', size: 115, shape: 'gasstation', color: '#e03a3a', value: 10, explosive: true },
      { name: 'Panzer', size: 120, shape: 'tankmil', color: '#6a8a40', value: 14, move: 'drive', speed: 0.8, hazard: 20 },
      { name: 'Kirche', size: 150, shape: 'church', color: '#e0d6c4', value: 10 },
      { name: 'Bürohaus', size: 190, shape: 'building', color: '#7fa7c9', value: 13 },
      { name: 'Hochhaus', size: 280, shape: 'tower', color: '#5d7fa3', value: 20 },
      { name: 'Kran', size: 320, shape: 'crane', color: '#ffb21f', value: 18 },
      { name: 'Stadion', size: 460, shape: 'stadium', color: '#9bd36b', value: 34 },
    ],
  },
  {
    id: 'mountains', name: 'Gebirge', minRadius: 640, scrapMult: 27, ground: 'alpine',
    bg: '#86a872', bg2: '#77995f', accent: '#eef3f6',
    objects: [
      { name: 'Tanne', size: 140, shape: 'pine', color: '#2f7d4a', value: 1 },
      { name: 'Bergziege', size: 150, shape: 'goat', color: '#f2efe6', value: 2, move: 'flee', speed: 3 },
      { name: 'Felsen', size: 200, shape: 'rock', color: '#a3a3a3', value: 2 },
      { name: 'Berghütte', size: 230, shape: 'house', color: '#8a5a2b', value: 3 },
      { name: 'Hubschrauber', size: 300, shape: 'heli', color: '#d94141', value: 7, move: 'wander', speed: 1.6, hazard: 15 },
      { name: 'Wald', size: 400, shape: 'forest', color: '#2a7a44', value: 5 },
      { name: 'Gasspeicher', size: 460, shape: 'gastank', color: '#e03a3a', value: 9, explosive: true },
      { name: 'Staudamm', size: 800, shape: 'dam', color: '#a5afb6', value: 12 },
      { name: 'Berg', size: 1150, shape: 'mountain', color: '#8a96a3', value: 18 },
      { name: 'Vulkan', size: 1350, shape: 'volcano', color: '#5a3b33', value: 24, explosive: true },
    ],
  },
  {
    id: 'continent', name: 'Kontinent', minRadius: 2560, scrapMult: 81, ground: 'ocean',
    bg: '#2f86c9', bg2: '#2a78b6', accent: '#9fdcff',
    objects: [
      { name: 'Schiff', size: 500, shape: 'ship', color: '#ececec', value: 1, move: 'drive', speed: 1 },
      { name: 'Dorf', size: 600, shape: 'village', color: '#e0b48a', value: 1 },
      { name: 'Insel', size: 850, shape: 'island', color: '#f0d58a', value: 2 },
      { name: 'Ölbohrinsel', size: 1000, shape: 'rig', color: '#e03a3a', value: 4, explosive: true },
      { name: 'Tornado', size: 1300, shape: 'tornado', color: '#cfd8e2', value: 8, move: 'wander', speed: 1.4, hazard: 20 },
      { name: 'Großstadt', size: 1600, shape: 'metropolis', color: '#9aa5c9', value: 5 },
      { name: 'Wüste', size: 2400, shape: 'island', color: '#f0c36a', value: 7 },
      { name: 'Gebirgskette', size: 3200, shape: 'mountain', color: '#7d8a76', value: 10 },
      { name: 'Regenwald', size: 4200, shape: 'forest', color: '#1f7a3c', value: 13 },
      { name: 'Supervulkan', size: 5400, shape: 'volcano', color: '#5a2f2a', value: 18, explosive: true },
      { name: 'Kontinent', size: 8000, shape: 'island', color: '#7cc05f', value: 26 },
    ],
  },
  {
    id: 'planet', name: 'Erdorbit', minRadius: 10240, scrapMult: 243, ground: 'space',
    bg: '#161c40', bg2: '#232a5c', accent: '#7fd3ff',
    objects: [
      { name: 'Satellit', size: 2200, shape: 'satellite', color: '#c9d4e6', value: 1, move: 'drive', speed: 1.2 },
      { name: 'Raumstation', size: 3500, shape: 'station', color: '#d9dde6', value: 2 },
      { name: 'Asteroid', size: 4500, shape: 'rock', color: '#8a7a6a', value: 2, move: 'drive', speed: 0.8 },
      { name: 'UFO', size: 5000, shape: 'ufo', color: '#7fe07f', value: 7, move: 'wander', speed: 1.6, hazard: 15 },
      { name: 'Treibstofflager', size: 5000, shape: 'gastank', color: '#e03a3a', value: 4, explosive: true },
      { name: 'Mond', size: 9000, shape: 'planet', color: '#c9c9c9', value: 6 },
      { name: 'Eisplanet', size: 16000, shape: 'planet', color: '#9fe3ff', value: 10 },
      { name: 'Erde 2', size: 21000, shape: 'earth', color: '#3d8bd9', value: 14 },
      { name: 'Lavaplanet', size: 27000, shape: 'planet', color: '#e0642a', value: 18, explosive: true },
    ],
  },
  {
    id: 'solar', name: 'Sonnensystem', minRadius: 40960, scrapMult: 729, ground: 'space',
    bg: '#100d2a', bg2: '#22194a', accent: '#ffd23f',
    objects: [
      { name: 'Komet', size: 9000, shape: 'comet', color: '#bfe8ff', value: 1, move: 'drive', speed: 2 },
      { name: 'Mond', size: 14000, shape: 'planet', color: '#c9c9c9', value: 2 },
      { name: 'Kampfstern', size: 22000, shape: 'ufo', color: '#ff5a5a', value: 8, move: 'wander', speed: 1.4, hazard: 20 },
      { name: 'Felsplanet', size: 27000, shape: 'planet', color: '#c97a4a', value: 4 },
      { name: 'Ringplanet', size: 54000, shape: 'ringplanet', color: '#e6c98a', value: 8 },
      { name: 'Gasriese', size: 80000, shape: 'planet', color: '#d99a6a', value: 12 },
      { name: 'Roter Zwerg', size: 100000, shape: 'star', color: '#ff6a3d', value: 16, explosive: true },
      { name: 'Sonne', size: 135000, shape: 'star', color: '#ffd23f', value: 24, explosive: true },
    ],
  },
  {
    id: 'galaxy', name: 'Milchstraße', minRadius: 163840, scrapMult: 2187, ground: 'space',
    bg: '#0b0722', bg2: '#26114f', accent: '#b06bff',
    objects: [
      { name: 'Sonnensystem', size: 36000, shape: 'ringplanet', color: '#ffd23f', value: 1 },
      { name: 'Roter Riese', size: 80000, shape: 'star', color: '#ff5a3d', value: 3, explosive: true },
      { name: 'Nebel', size: 140000, shape: 'nebula', color: '#b06bff', value: 5 },
      { name: 'Sternhaufen', size: 230000, shape: 'cluster', color: '#9fd0ff', value: 8 },
      { name: 'Neutronenstern', size: 270000, shape: 'star', color: '#e6f4ff', value: 12, explosive: true },
      { name: 'Schwarzes Loch', size: 460000, shape: 'blackhole', color: '#000000', value: 22 },
      { name: 'Zwerggalaxie', size: 720000, shape: 'galaxy', color: '#6bd0ff', value: 34 },
    ],
  },
  {
    id: 'supercluster', name: 'Galaxienhaufen', minRadius: 655360, scrapMult: 6561, ground: 'space',
    bg: '#061226', bg2: '#0e3a5a', accent: '#6bf0ff',
    objects: [
      { name: 'Zwerggalaxie', size: 150000, shape: 'galaxy', color: '#6bd0ff', value: 1 },
      { name: 'Sternhaufen', size: 230000, shape: 'cluster', color: '#9fd0ff', value: 2 },
      { name: 'Spiralgalaxie', size: 380000, shape: 'galaxy', color: '#ffb0f0', value: 4 },
      { name: 'Quasar', size: 500000, shape: 'star', color: '#7fffff', value: 7, explosive: true },
      { name: 'Galaktischer Kreuzer', size: 600000, shape: 'ufo', color: '#ff5a5a', value: 10, move: 'wander', speed: 1.4, hazard: 20 },
      { name: 'Dunkle Wolke', size: 900000, shape: 'nebula', color: '#3a2a8a', value: 9 },
      { name: 'Riesengalaxie', size: 1600000, shape: 'galaxy', color: '#ffd23f', value: 16 },
      { name: 'Supermassives Loch', size: 2400000, shape: 'blackhole', color: '#000000', value: 24 },
    ],
  },
  {
    id: 'universe', name: 'Kosmisches Netz', minRadius: 2621440, scrapMult: 19683, ground: 'space',
    bg: '#14051a', bg2: '#4a0a3a', accent: '#ff4ab0',
    objects: [
      { name: 'Galaxienhaufen', size: 600000, shape: 'cluster', color: '#ffb0f0', value: 1 },
      { name: 'Kosmischer Nebel', size: 1100000, shape: 'nebula', color: '#ff4ab0', value: 2 },
      { name: 'Hypernova', size: 1600000, shape: 'star', color: '#ffffff', value: 5, explosive: true },
      { name: 'Void-Jäger', size: 2400000, shape: 'ufo', color: '#b06bff', value: 9, move: 'wander', speed: 1.5, hazard: 22 },
      { name: 'Superhaufen', size: 3600000, shape: 'galaxy', color: '#7fd3ff', value: 8 },
      { name: 'Wurmloch', size: 5000000, shape: 'blackhole', color: '#000000', value: 14 },
      { name: 'Kosmische Wand', size: 8000000, shape: 'nebula', color: '#ffd23f', value: 22 },
    ],
  },
  {
    id: 'multiverse', name: 'Multiversum', minRadius: 10485760, scrapMult: 59049, ground: 'space',
    bg: '#0d0620', bg2: '#3a1470', accent: '#ff4ab0',
    objects: [
      { name: 'Paralleluniversum', size: 2400000, shape: 'planet', color: '#b06bff', value: 1 },
      { name: 'Weltenblase', size: 4000000, shape: 'ringplanet', color: '#7fd3ff', value: 2 },
      { name: 'Urknall-Echo', size: 6000000, shape: 'star', color: '#ffd23f', value: 5, explosive: true },
      { name: 'Wächter des Multiversums', size: 9000000, shape: 'ufo', color: '#ffd23f', value: 12, move: 'wander', speed: 1.5, hazard: 25 },
      { name: 'Spiegeluniversum', size: 14000000, shape: 'galaxy', color: '#ff4ab0', value: 12 },
      { name: 'Zeitschleife', size: 22000000, shape: 'blackhole', color: '#000000', value: 20 },
      { name: 'Ur-Universum', size: 34000000, shape: 'galaxy', color: '#ffffff', value: 34 },
    ],
  },
];

// ---------------------------------------------------------------------
// DIMENSIONEN: Welt 12–50, nach dem Multiversum geht es weiter.
// Jede Dimension: Name, Farben (bg, bg2, accent, 3 Geländefarben), Boden,
// Evolutionsname und 8 Objekte (Name, Form, Farbe). Größen & Werte werden
// automatisch passend zur Welt berechnet.
//   * = explodiert, ! = Hindernis (wandert), ~ = flieht
// ---------------------------------------------------------------------
const DIMENSIONS = [
  ['Kristallreich', ['#0d1a3a', '#1a3a6a', '#7fffff', '#2a5a9a', '#5ad0ff', '#d0ffff'], 'dimension', 'Kristallfresser',
    [['Kristallsplitter', 'crystal', '#7fffff'], ['Glitzerkomet', 'comet', '#d0ffff'], ['~Kristallwurm', 'crystal', '#b06bff'], ['Kristallmond', 'planet', '#a0e0ff'], ['*Prismabombe', 'star', '#ffffff'], ['!Kristallwächter', 'eye', '#7fffff'], ['Kristallsonne', 'crystal', '#5ad0ff'], ['Diamantplanet', 'ringplanet', '#e0ffff']]],
  ['Lavadimension', ['#2a0a06', '#5a1408', '#ff8a2a', '#7a2a10', '#ff5a1f', '#ffd23f'], 'dimension', 'Magmakönig',
    [['Glutbrocken', 'rock', '#ff6a1f'], ['Feuerkomet', 'comet', '#ffb13d'], ['~Lavageist', 'nebula', '#ff5a1f'], ['Magmaplanet', 'planet', '#e0642a'], ['*Lavasonne', 'star', '#ff8a2a'], ['!Flammenauge', 'eye', '#ff3b2f'], ['Feuerportal', 'portal', '#ff8a2a'], ['Höllenstern', 'star', '#ff3b2f']]],
  ['Eiswüste der Ewigkeit', ['#0a1a2a', '#2a4a6a', '#e0f4ff', '#6a9aba', '#bfe4ff', '#ffffff'], 'dimension', 'Frostgigant',
    [['Eisbrocken', 'rock', '#cfeaf7'], ['Frostkomet', 'comet', '#e0f4ff'], ['~Schneegeist', 'nebula', '#ffffff'], ['Eismond', 'planet', '#9fe3ff'], ['*Kältebombe', 'star', '#bfe4ff'], ['!Frostwächter', 'eye', '#9fe3ff'], ['Gletscherwelt', 'ringplanet', '#cfeaf7'], ['Eiskristall', 'crystal', '#ffffff']]],
  ['Pilz-Kosmos', ['#1a0a2a', '#3a1a4a', '#ff6fa8', '#5a2a6a', '#a04aa0', '#ffd23f'], 'dimension', 'Sporenschlund',
    [['Sporenwolke', 'nebula', '#c38bff'], ['Leuchtpilz', 'mushroom', '#ff6fa8'], ['~Pilzling', 'gummy', '#ffb3d9'], ['Pilzplanet', 'planet', '#a04aa0'], ['*Sporenbombe', 'star', '#a0f04a'], ['!Riesenpilz-Auge', 'eye', '#ff6fa8'], ['Myzelnetz', 'cluster', '#ffd23f'], ['Pilzgalaxie', 'galaxy', '#ff6fa8']]],
  ['Neon-Matrix', ['#05050f', '#0a1a2a', '#00ffcc', '#0a3a3a', '#00aaff', '#ff00aa'], 'dimension', 'Netzfresser',
    [['Datenwürfel', 'crate', '#00ffcc'], ['Pixelkomet', 'comet', '#00aaff'], ['~Virus', 'ufo', '#ff00aa'], ['Serverplanet', 'station', '#00ffcc'], ['*Logikbombe', 'star', '#ff00aa'], ['!Firewall-Auge', 'eye', '#00aaff'], ['Neon-Portal', 'portal', '#00ffcc'], ['Datenstern', 'star', '#00aaff']]],
  ['Schattenreich', ['#05030a', '#140a1a', '#8a4aff', '#1a0f2a', '#2a1a4a', '#5a3a8a'], 'dimension', 'Schattenfürst',
    [['Schattenfetzen', 'nebula', '#3a2a5a'], ['Dunkler Komet', 'comet', '#5a3a8a'], ['~Schemen', 'ufo', '#8a4aff'], ['Nachtplanet', 'planet', '#2a1a4a'], ['*Leerenbombe', 'blackhole', '#000000'], ['!Schattenauge', 'eye', '#8a4aff'], ['Schattentor', 'portal', '#5a3a8a'], ['Schwarze Sonne', 'blackhole', '#000000']]],
  ['Uhrwerk-Dimension', ['#2a1a0a', '#4a3010', '#ffd23f', '#6a4a1a', '#b8860b', '#e0c070'], 'dimension', 'Zahnradtitan',
    [['Zahnrad', 'station', '#b8860b'], ['Messingkomet', 'comet', '#e0c070'], ['~Uhrwerkkäfer', 'ufo', '#ffd23f'], ['Uhrenplanet', 'ringplanet', '#e0c070'], ['*Dampfkessel', 'gastank', '#b8860b'], ['!Pendelauge', 'eye', '#ffd23f'], ['Zeitportal', 'portal', '#e0c070'], ['Großes Uhrwerk', 'galaxy', '#ffd23f']]],
  ['Zuckerkosmos', ['#2a0a1a', '#5a1a3a', '#ff9ad0', '#8a3a6a', '#ff8ad0', '#ffffff'], 'dimension', 'Zuckerschock',
    [['Sternbonbon', 'candy', '#7fd3ff'], ['Lolli-Komet', 'comet', '#ff9ad0'], ['~Gummigalaxie', 'gummy', '#ff4a5a'], ['Donutplanet', 'donut', '#ff8ad0'], ['*Brausestern', 'star', '#a0f04a'], ['!Zuckerauge', 'eye', '#ff9ad0'], ['Tortenwelt', 'cake', '#ffd6ea'], ['Zuckergalaxie', 'galaxy', '#ff9ad0']]],
  ['Drachenhort', ['#1a0a0a', '#3a1414', '#ffd23f', '#5a2a1a', '#8a4a2a', '#ffb13d'], 'dimension', 'Drachenkaiser',
    [['Goldschatz', 'crate', '#ffd23f'], ['Drachenei', 'planet', '#c96f3a'], ['~Jungdrache', 'ufo', '#e8432e'], ['Hortplanet', 'ringplanet', '#ffd23f'], ['*Feueratem', 'star', '#ff6a1f'], ['!Drachenauge', 'eye', '#ffd23f'], ['Drachenportal', 'portal', '#ff6a1f'], ['Goldberg', 'mountain', '#ffd23f']]],
  ['Sternenschmiede', ['#0a0a1a', '#1a1a3a', '#ffb13d', '#3a2a1a', '#ff8a2a', '#ffd23f'], 'space', 'Sternenschmied',
    [['Sternenamboss', 'station', '#8a8d96'], ['Funkenkomet', 'comet', '#ffd23f'], ['~Schmiedegeist', 'nebula', '#ffb13d'], ['Rohstern', 'star', '#ff8a2a'], ['*Supernova', 'star', '#ffffff'], ['!Hammerwächter', 'eye', '#ffb13d'], ['Sternenesse', 'portal', '#ff6a1f'], ['Neugeborene Galaxie', 'galaxy', '#ffd23f']]],
  ['Gedankenmeer', ['#0a1a2a', '#1a2a4a', '#c38bff', '#2a3a6a', '#6a6adf', '#e0d0ff'], 'dimension', 'Gedankenfresser',
    [['Gedankenblase', 'planet', '#c38bff'], ['Ideenkomet', 'comet', '#e0d0ff'], ['~Erinnerung', 'nebula', '#6a6adf'], ['Traumplanet', 'ringplanet', '#c38bff'], ['*Geistesblitz', 'star', '#ffffff'], ['!Allsehendes Auge', 'eye', '#c38bff'], ['Bewusstseinsportal', 'portal', '#e0d0ff'], ['Gedankengalaxie', 'galaxy', '#c38bff']]],
  ['Kristallkern', ['#050f1a', '#0a2a3a', '#7fffe0', '#1a4a5a', '#3ad9b0', '#e0fff8'], 'dimension', 'Kernbrecher',
    [['Kernsplitter', 'crystal', '#3ad9b0'], ['Kristallregen', 'comet', '#7fffe0'], ['~Kristallgeist', 'nebula', '#7fffe0'], ['Kernplanet', 'planet', '#3ad9b0'], ['*Kristallnova', 'star', '#e0fff8'], ['!Kernwächter', 'eye', '#3ad9b0'], ['Kristallportal', 'portal', '#7fffe0'], ['Kristallherz', 'crystal', '#e0fff8']]],
  ['Glitch-Zone', ['#0a0a0a', '#1a0a1a', '#ff00ff', '#2a0a2a', '#00ffff', '#ffff00'], 'dimension', 'Fehlerkönig',
    [['Glitch-Block', 'crate', '#ff00ff'], ['Bug-Komet', 'comet', '#00ffff'], ['~Fehlerpixel', 'ufo', '#ffff00'], ['Absturzplanet', 'planet', '#ff00ff'], ['*Systemabsturz', 'star', '#00ffff'], ['!Debug-Auge', 'eye', '#ff00ff'], ['Fehlerportal', 'portal', '#ffff00'], ['Bluescreen-Galaxie', 'galaxy', '#3a5aff']]],
  ['Dunkle Sonne', ['#0a0505', '#2a0a0a', '#ff3b2f', '#3a0a0a', '#8a1a1a', '#ff6a3d'], 'space', 'Sonnenverschlinger',
    [['Schattenflamme', 'nebula', '#8a1a1a'], ['Glutkomet', 'comet', '#ff6a3d'], ['~Sonnengeist', 'ufo', '#ff3b2f'], ['Rotglutplanet', 'planet', '#8a1a1a'], ['*Sonnenausbruch', 'star', '#ff3b2f'], ['!Korona-Auge', 'eye', '#ff6a3d'], ['Sonnentor', 'portal', '#ff3b2f'], ['Dunkle Sonne', 'blackhole', '#000000']]],
  ['Götterberg', ['#1a1a2a', '#3a3a5a', '#ffd23f', '#6a6a8a', '#b8b8d8', '#ffffff'], 'dimension', 'Götterstürmer',
    [['Tempelsäule', 'tower', '#e0d6c4'], ['Goldkomet', 'comet', '#ffd23f'], ['~Halbgott', 'ufo', '#ffd23f'], ['Olymp', 'mountain', '#b8b8d8'], ['*Blitzschlag', 'star', '#ffffff'], ['!Götterauge', 'eye', '#ffd23f'], ['Himmelstor', 'portal', '#ffffff'], ['Götterthron', 'ringplanet', '#ffd23f']]],
  ['Ätherfeld', ['#0a1a1a', '#1a3a3a', '#a0ffe0', '#2a5a5a', '#5ab0a0', '#e0fff0'], 'dimension', 'Äthertänzer',
    [['Ätherblase', 'planet', '#a0ffe0'], ['Ätherkomet', 'comet', '#e0fff0'], ['~Irrlicht', 'nebula', '#a0ffe0'], ['Schwebewelt', 'island', '#5ab0a0'], ['*Ätherfunke', 'star', '#ffffff'], ['!Ätherauge', 'eye', '#a0ffe0'], ['Ätherportal', 'portal', '#5ab0a0'], ['Äthergalaxie', 'galaxy', '#a0ffe0']]],
  ['Weltenbaum', ['#0a1a0a', '#1a3a1a', '#7fe07f', '#2a5a2a', '#4f9e4a', '#c9f0a0'], 'dimension', 'Wurzelreißer',
    [['Weltenblatt', 'flower', '#7fe07f'], ['Samenkomet', 'comet', '#c9f0a0'], ['~Waldgeist', 'nebula', '#4f9e4a'], ['Fruchtplanet', 'planet', '#ff6a3d'], ['*Saftbombe', 'star', '#c9f0a0'], ['!Baumauge', 'eye', '#7fe07f'], ['Astportal', 'portal', '#4f9e4a'], ['Weltenbaum', 'forest', '#2a7a44']]],
  ['Plasmaozean', ['#05051a', '#0a1a4a', '#5ad0ff', '#1a3a8a', '#3a6aff', '#c0f0ff'], 'dimension', 'Plasmahai',
    [['Plasmatropfen', 'planet', '#5ad0ff'], ['Plasmawelle', 'comet', '#c0f0ff'], ['~Plasmaqualle', 'nebula', '#3a6aff'], ['Plasmainsel', 'island', '#5ad0ff'], ['*Plasmaentladung', 'star', '#c0f0ff'], ['!Tiefseeauge', 'eye', '#5ad0ff'], ['Strudelportal', 'portal', '#3a6aff'], ['Plasmagalaxie', 'galaxy', '#5ad0ff']]],
  ['Zeitwirbel', ['#1a1505', '#3a2a0a', '#ffe07f', '#5a4a1a', '#b8a050', '#fff0c0'], 'dimension', 'Zeitfresser',
    [['Zeitsplitter', 'crystal', '#ffe07f'], ['Sanduhr-Komet', 'comet', '#fff0c0'], ['~Gestern', 'nebula', '#b8a050'], ['Morgenplanet', 'planet', '#ffe07f'], ['*Zeitbombe', 'dynamite', '#ff3b2f'], ['!Chronos-Auge', 'eye', '#ffe07f'], ['Zeittor', 'portal', '#fff0c0'], ['Ewigkeitsspirale', 'galaxy', '#ffe07f']]],
  ['Traumebene', ['#1a0a2a', '#3a1a5a', '#ffb3f0', '#5a3a8a', '#a06adf', '#ffe0ff'], 'dimension', 'Albtraum',
    [['Traumwolke', 'cotton', '#ffb3f0'], ['Sternschnuppe', 'comet', '#ffe0ff'], ['~Schäfchen', 'goat', '#ffffff'], ['Traumplanet', 'ringplanet', '#ffb3f0'], ['*Albtraumbombe', 'star', '#a06adf'], ['!Traumfänger-Auge', 'eye', '#ffb3f0'], ['Schlafportal', 'portal', '#a06adf'], ['Traumgalaxie', 'galaxy', '#ffb3f0']]],
  ['Chaoskern', ['#1a0505', '#3a0a14', '#ff3b2f', '#5a1a2a', '#c38bff', '#ffd23f'], 'dimension', 'Chaosherz',
    [['Chaossplitter', 'crystal', '#ff3b2f'], ['Wirbelkomet', 'comet', '#c38bff'], ['~Chaosgeist', 'ufo', '#ffd23f'], ['Chaosplanet', 'planet', '#c38bff'], ['*Chaosbombe', 'star', '#ff3b2f'], ['!Chaosauge', 'eye', '#ff3b2f'], ['Chaostor', 'portal', '#c38bff'], ['Chaosgalaxie', 'galaxy', '#ff3b2f']]],
  ['Spiegelwelt', ['#0f0f1a', '#2a2a3a', '#e0e8ff', '#4a4a6a', '#9aa0c0', '#ffffff'], 'dimension', 'Spiegelbrecher',
    [['Spiegelscherbe', 'crystal', '#e0e8ff'], ['Lichtkomet', 'comet', '#ffffff'], ['~Spiegelbild', 'ufo', '#9aa0c0'], ['Spiegelplanet', 'planet', '#e0e8ff'], ['*Lichtblitz', 'star', '#ffffff'], ['!Spiegelauge', 'eye', '#e0e8ff'], ['Spiegeltor', 'portal', '#9aa0c0'], ['Spiegelgalaxie', 'galaxy', '#e0e8ff']]],
  ['Schwarzer Garten', ['#050a05', '#0a1a0a', '#a0ff7f', '#1a2a1a', '#2a4a2a', '#5a8a3a'], 'dimension', 'Unkrautgott',
    [['Dornenranke', 'bush', '#2a4a2a'], ['Sporenkomet', 'comet', '#a0ff7f'], ['~Giftfalter', 'ufo', '#a0ff7f'], ['Fleischblume', 'flower', '#8a1a3a'], ['*Giftbombe', 'star', '#a0ff7f'], ['!Dornenauge', 'eye', '#5a8a3a'], ['Wurzeltor', 'portal', '#2a4a2a'], ['Schwarze Rose', 'flower', '#1a0a14']]],
  ['Prismenwüste', ['#1a1a0a', '#3a3a1a', '#ff9a3d', '#6a5a2a', '#e0c070', '#ffffff'], 'dimension', 'Prismenfresser',
    [['Prisma', 'crystal', '#ff9a3d'], ['Regenbogenkomet', 'comet', '#7fd3ff'], ['~Lichtwurm', 'snake', '#ffd23f'], ['Sanddüne', 'island', '#e0c070'], ['*Lichtbombe', 'star', '#ffffff'], ['!Prismenauge', 'eye', '#ff9a3d'], ['Lichttor', 'portal', '#7fd3ff'], ['Prismenstern', 'star', '#ff9a3d']]],
  ['Titanenschmiede', ['#1a0f0a', '#3a1f14', '#ff6a1f', '#5a3a2a', '#8a8d96', '#ffb13d'], 'dimension', 'Titanenbrecher',
    [['Titanbolzen', 'rock', '#8a8d96'], ['Schlackekomet', 'comet', '#ffb13d'], ['~Golemschmied', 'ufo', '#ff6a1f'], ['Ambossplanet', 'planet', '#5a5d66'], ['*Schmelzofen', 'gastank', '#ff6a1f'], ['!Titanenauge', 'eye', '#ff6a1f'], ['Schmiedetor', 'portal', '#ffb13d'], ['Titanenrüstung', 'station', '#8a8d96']]],
  ['Leere zwischen den Welten', ['#000000', '#05050a', '#ffffff', '#0a0a14', '#14141f', '#2a2a3a'], 'space', 'Leerenwandler',
    [['Nichts-Splitter', 'crystal', '#2a2a3a'], ['Geisterkomet', 'comet', '#ffffff'], ['~Leerengeist', 'nebula', '#14141f'], ['Verlorene Welt', 'planet', '#3a3a4a'], ['*Leerenriss', 'blackhole', '#000000'], ['!Auge der Leere', 'eye', '#ffffff'], ['Weltenriss', 'portal', '#2a2a3a'], ['Vergessene Galaxie', 'galaxy', '#3a3a4a']]],
  ['Feuerhimmel', ['#2a0a00', '#5a1a00', '#ffd23f', '#8a3a0a', '#ff8a2a', '#ffe07f'], 'dimension', 'Himmelsbrand',
    [['Feuerwolke', 'cotton', '#ff8a2a'], ['Phönixfeder', 'comet', '#ffd23f'], ['~Feuervogel', 'bird', '#ff6a1f'], ['Brennender Mond', 'planet', '#ff8a2a'], ['*Himmelsfeuer', 'star', '#ffe07f'], ['!Glutauge', 'eye', '#ffd23f'], ['Flammentor', 'portal', '#ff6a1f'], ['Feuergalaxie', 'galaxy', '#ff8a2a']]],
  ['Engelsruine', ['#1a1a1f', '#3a3a44', '#fff8d0', '#6a6a7a', '#c0c0d0', '#ffffff'], 'dimension', 'Gefallener',
    [['Säulenrest', 'tower', '#e0e0e8'], ['Federkomet', 'comet', '#ffffff'], ['~Engelsfunke', 'nebula', '#fff8d0'], ['Ruinenplanet', 'planet', '#c0c0d0'], ['*Heiligenschein', 'ringplanet', '#ffd23f'], ['!Wächterauge', 'eye', '#fff8d0'], ['Himmelspforte', 'portal', '#ffffff'], ['Engelsgalaxie', 'galaxy', '#fff8d0']]],
  ['Höllentor', ['#1a0000', '#3a0505', '#ff3b2f', '#5a0a0a', '#8a1a0a', '#ff8a2a'], 'dimension', 'Höllenfürst',
    [['Höllenstein', 'rock', '#5a1a1a'], ['Schwefelkomet', 'comet', '#ffd23f'], ['~Teufelchen', 'gummy', '#e8262b'], ['Höllenplanet', 'planet', '#8a1a0a'], ['*Schwefelbombe', 'star', '#ffd23f'], ['!Höllenauge', 'eye', '#ff3b2f'], ['Höllentor', 'portal', '#ff3b2f'], ['Inferno', 'star', '#ff3b2f']]],
  ['Ursuppe', ['#0a1a0f', '#1a3a20', '#a0f04a', '#2a5a2a', '#6ab04a', '#e0ff9a'], 'dimension', 'Urzeitfresser',
    [['Urzelle', 'planet', '#a0f04a'], ['Blubberkomet', 'comet', '#e0ff9a'], ['~Ur-Amöbe', 'nebula', '#6ab04a'], ['Ursuppen-Insel', 'island', '#6ab04a'], ['*Faulgasblase', 'star', '#a0f04a'], ['!Urauge', 'eye', '#a0f04a'], ['Lebensquelle', 'portal', '#e0ff9a'], ['Urgalaxie', 'galaxy', '#a0f04a']]],
  ['Quantenschaum', ['#050a14', '#0a1a2a', '#7fd3ff', '#1a2a4a', '#4a6aaa', '#ffffff'], 'space', 'Quantenfresser',
    [['Quantenblase', 'planet', '#7fd3ff'], ['Teilchenstrahl', 'comet', '#ffffff'], ['~Schrödingers Katze', 'cat', '#7fd3ff'], ['Quantenwelt', 'ringplanet', '#4a6aaa'], ['*Quantenkollaps', 'star', '#ffffff'], ['!Beobachter-Auge', 'eye', '#7fd3ff'], ['Wurmloch', 'portal', '#4a6aaa'], ['Quantengalaxie', 'galaxy', '#7fd3ff']]],
  ['Sternengrab', ['#050505', '#141418', '#9aa0c0', '#1f1f28', '#3a3a4a', '#6a6a7a'], 'space', 'Totengräber',
    [['Sternenasche', 'nebula', '#3a3a4a'], ['Grabkomet', 'comet', '#9aa0c0'], ['~Sternengeist', 'ufo', '#9aa0c0'], ['Tote Welt', 'planet', '#3a3a4a'], ['*Letzte Nova', 'star', '#9aa0c0'], ['!Totenauge', 'eye', '#9aa0c0'], ['Grabpforte', 'portal', '#6a6a7a'], ['Sternenfriedhof', 'cluster', '#9aa0c0']]],
  ['Omega-Nebel', ['#0a051a', '#2a0a4a', '#ff4ab0', '#4a1a6a', '#8a3aaa', '#ffb0f0'], 'space', 'Omega',
    [['Omega-Splitter', 'crystal', '#ff4ab0'], ['Omega-Komet', 'comet', '#ffb0f0'], ['~Nebelwesen', 'nebula', '#8a3aaa'], ['Omega-Planet', 'ringplanet', '#ff4ab0'], ['*Omega-Nova', 'star', '#ffb0f0'], ['!Omega-Auge', 'eye', '#ff4ab0'], ['Omega-Tor', 'portal', '#8a3aaa'], ['Omega-Galaxie', 'galaxy', '#ff4ab0']]],
  ['Unendlichkeitsmeer', ['#00050f', '#001a3a', '#5ad0ff', '#002a5a', '#1a5aaa', '#c0f0ff'], 'dimension', 'Ozeanverschlinger',
    [['Sternenperle', 'planet', '#c0f0ff'], ['Wellenkomet', 'comet', '#5ad0ff'], ['~Kosmos-Wal', 'ufo', '#1a5aaa'], ['Inselwelt', 'island', '#5ad0ff'], ['*Strudelbombe', 'blackhole', '#000000'], ['!Leviathan-Auge', 'eye', '#5ad0ff'], ['Meeresportal', 'portal', '#1a5aaa'], ['Meeresgalaxie', 'galaxy', '#5ad0ff']]],
  ['Der Rand', ['#000000', '#0a0a0a', '#ffd23f', '#141414', '#2a2a2a', '#ffd23f'], 'space', 'Grenzbrecher',
    [['Randsplitter', 'crystal', '#ffd23f'], ['Randkomet', 'comet', '#ffd23f'], ['~Grenzgänger', 'ufo', '#ffd23f'], ['Letzte Insel', 'island', '#2a2a2a'], ['*Randexplosion', 'star', '#ffd23f'], ['!Grenzwächter', 'eye', '#ffd23f'], ['Grenztor', 'portal', '#ffd23f'], ['Rand des Seins', 'blackhole', '#000000']]],
  ['Jenseits', ['#f0f0ff', '#d0d0f0', '#8a6bff', '#b8b8e0', '#a0a0d0', '#ffffff'], 'dimension', 'Jenseitswandler',
    [['Lichtsplitter', 'crystal', '#8a6bff'], ['Seelenkomet', 'comet', '#ffffff'], ['~Seele', 'nebula', '#8a6bff'], ['Jenseitsplanet', 'planet', '#d0d0f0'], ['*Erlösung', 'star', '#ffffff'], ['!Auge des Jenseits', 'eye', '#8a6bff'], ['Lichtpforte', 'portal', '#ffffff'], ['Jenseitsgalaxie', 'galaxy', '#8a6bff']]],
  ['Schöpfungsquelle', ['#fff8e0', '#f0e0b0', '#ff8a2a', '#e0c080', '#d0a060', '#ffffff'], 'dimension', 'Schöpfungsdieb',
    [['Urfunke', 'star', '#ffd23f'], ['Schöpfungskomet', 'comet', '#ff8a2a'], ['~Ur-Idee', 'nebula', '#ff8a2a'], ['Erste Welt', 'earth', '#3d8bd9'], ['*Big Bang', 'star', '#ffffff'], ['!Auge des Schöpfers', 'eye', '#ff8a2a'], ['Schöpfungstor', 'portal', '#ffd23f'], ['Ur-Galaxie', 'galaxy', '#ff8a2a']]],
  ['Das Letzte Licht', ['#0a0a0a', '#1a1a14', '#fff8d0', '#2a2a20', '#4a4a3a', '#fff8d0'], 'space', 'Lichtlöscher',
    [['Lichtrest', 'star', '#fff8d0'], ['Letzter Komet', 'comet', '#fff8d0'], ['~Glühwürmchen', 'nebula', '#fff8d0'], ['Erloschene Welt', 'planet', '#4a4a3a'], ['*Letzter Funke', 'star', '#ffffff'], ['!Letztes Auge', 'eye', '#fff8d0'], ['Ausgang', 'portal', '#fff8d0'], ['Die letzte Sonne', 'star', '#ffd23f']]],
  ['Höllenschlund', ['#140000', '#3a0300', '#ff4a1f', '#5a0a00', '#c42a0a', '#ffb13d'], 'hell', 'RAGE-GOTT',
    [['Höllenglut', 'rock', '#ff4a1f'], ['Seelenkomet', 'comet', '#ffb13d'], ['~Verdammte Seele', 'nebula', '#ff6a3d'], ['Lavamond', 'planet', '#c42a0a'], ['*Schwefelsonne', 'star', '#ffd23f'], ['!Höllenwächter', 'eye', '#ff3b2f'], ['Höllentor', 'portal', '#ff4a1f'], ['Lavavulkan', 'volcano', '#3a0a05']]],
];

// ---------------------------------------------------------------------
// Themen der Dimensionen: passender Boden (theme) + passende Objekte.
// objs: 8 Objekte von klein nach groß (~ flieht, * explodiert, ! gefährlich, wandert)
// extras: [Haufen, langsamer Wanderer, schneller Flitzer, großer Schatz]
// ---------------------------------------------------------------------
const DIM_THEMES = {
  'Kristallreich': ['crystal', [['Kristallsplitter', 'crystal', '#7fffff'], ['Kristallschnecke', 'snail', '#a0e0ff'], ['~Kristallwurm', 'snake', '#b06bff'], ['Geode', 'egg', '#8ad0ff'], ['*Prismabombe', 'star', '#ffffff'], ['!Kristallgolem', 'automaton', '#5ad0ff'], ['Kristallpalast', 'palace', '#bfefff'], ['Kristallberg', 'iceberg', '#d0ffff']],
    [['Splitterhaufen', 'cluster'], ['Wandernde Geode', 'egg'], ['Glitzerkomet', 'comet'], ['Diamantader', 'goldpile']]],
  'Lavadimension': ['lava', [['Glutbrocken', 'rock', '#ff6a1f'], ['Obsidiannadel', 'spire', '#3a1a1a'], ['~Lavaschleim', 'lavablob', '#ff5a1f'], ['Magmakessel', 'gastank', '#ff8a2a'], ['*Glutfass', 'barrel', '#ff3b2f'], ['!Feuersalamander', 'dragon', '#ff3b2f'], ['Feuerportal', 'portal', '#ff8a2a'], ['Lavavulkan', 'volcano', '#7a2a10']],
    [['Glutfeld', 'cluster'], ['Magmawalze', 'lavablob'], ['Feuerkomet', 'comet'], ['Obsidianschatz', 'chest']]],
  'Eiswüste der Ewigkeit': ['ice', [['Eisbrocken', 'rock', '#cfeaf7'], ['Schneemann', 'snowman', '#5ad0ff'], ['~Schneegeist', 'ghost', '#ffffff'], ['Eistanne', 'pine', '#bfe4ff'], ['*Kältebombe', 'star', '#bfe4ff'], ['!Frostgolem', 'automaton', '#9fe3ff'], ['Eisscholle', 'iceberg', '#e0f4ff'], ['Gletscher', 'mountain', '#e0f4ff']],
    [['Hagelfeld', 'cluster'], ['Treibeis', 'iceberg'], ['Frostkomet', 'comet'], ['Eisschatz', 'chest']]],
  'Pilz-Kosmos': ['fungal', [['Leuchtpilz', 'mushroom', '#ff6fa8'], ['Sporenwolke', 'nebula', '#c38bff'], ['~Pilzling', 'gummy', '#ffb3d9'], ['Fliegenpilz', 'mushroom', '#e8432e'], ['*Sporenbombe', 'star', '#a0f04a'], ['!Sporenqualle', 'jelly', '#a04aa0'], ['Pilzbaum', 'bigtree', '#a04aa0'], ['Riesenpilz', 'mushroom', '#ff6fa8']],
    [['Sporenfeld', 'cluster'], ['Riesenschnecke', 'snail'], ['Sporenkomet', 'comet'], ['Trüffelschatz', 'chest']]],
  'Neon-Matrix': ['circuit', [['Mikrochip', 'chip', '#00ffcc'], ['Datenwürfel', 'crate', '#00aaff'], ['~Virus', 'virus', '#ff00aa'], ['Serverturm', 'server', '#00ffcc'], ['*Logikbombe', 'star', '#ff00aa'], ['!Firewall-Bot', 'automaton', '#00aaff'], ['Neon-Portal', 'portal', '#00ffcc'], ['Datenzentrum', 'building', '#0a5a5a']],
    [['Datenmüll', 'cluster'], ['Lichtrenner', 'car'], ['Pixelkomet', 'comet'], ['Krypto-Tresor', 'chest']]],
  'Schattenreich': ['shadow', [['Schattenfetzen', 'nebula', '#3a2a5a'], ['Schattenstein', 'tomb', '#2a1a4a'], ['~Schemen', 'ghost', '#8a4aff'], ['Schattenmond', 'moon', '#5a3a8a'], ['*Leerenbombe', 'blackhole', '#000000'], ['!Schattenauge', 'eye', '#8a4aff'], ['Finstere Kapelle', 'church', '#2a1a4a'], ['Schattenturm', 'tower', '#3a2a5a']],
    [['Schattenhaufen', 'cluster'], ['Spukgestalt', 'ghost'], ['Dunkler Komet', 'comet'], ['Schattenschatz', 'chest']]],
  'Uhrwerk-Dimension': ['clockwork', [['Zahnrad', 'gear', '#b8860b'], ['Sanduhr', 'hourglass', '#e0c070'], ['~Uhrwerkkäfer', 'automaton', '#ffd23f'], ['Taschenuhrturm', 'clock', '#e0c070'], ['*Dampfkessel', 'gastank', '#b8860b'], ['!Pendelwächter', 'automaton', '#b8860b'], ['Großzahnrad', 'gear', '#e0c070'], ['Glockenturm', 'clock', '#8a6a2a']],
    [['Schraubenhaufen', 'cluster'], ['Dampflok', 'train'], ['Messingkomet', 'comet'], ['Spieluhr-Truhe', 'chest']]],
  'Zuckerkosmos': ['sweets', [['Sternbonbon', 'candy', '#7fd3ff'], ['Lolli', 'lolly', '#ff9ad0'], ['~Gummibär', 'gummy', '#ff4a5a'], ['Donut', 'donut', '#ff8ad0'], ['*Brausestern', 'star', '#a0f04a'], ['!Monster-Muffin', 'cupcake', '#ff6fa8'], ['Lebkuchenhaus', 'gingerhouse', '#c96f3a'], ['Riesentorte', 'cake', '#ff8ad0']],
    [['Streuselhaufen', 'cluster'], ['Eiswagen', 'icecream'], ['Lolli-Komet', 'comet'], ['Bonbon-Truhe', 'chest']]],
  'Drachenhort': ['hoard', [['Goldmünzen', 'goldpile', '#ffd23f'], ['Drachenei', 'egg', '#c96f3a'], ['~Jungdrache', 'dragon', '#e8432e'], ['Schatztruhe', 'chest', '#ffd23f'], ['*Feueratem', 'star', '#ff6a1f'], ['!Drachenwächter', 'dragon', '#8a4a2a'], ['Hortberg', 'mountain', '#6a3a2a'], ['Drachenburg', 'palace', '#7a4a3a']],
    [['Juwelenhaufen', 'cluster'], ['Goldkarren', 'wagon'], ['Feuerkomet', 'comet'], ['Goldader', 'goldpile']]],
  'Sternenschmiede': ['forge', [['Sternenamboss', 'anvil', '#8a8d96'], ['Schmiederad', 'gear', '#ffb13d'], ['~Schmiedegeselle', 'automaton', '#ff8a2a'], ['Rohstern', 'star', '#ff8a2a'], ['*Supernova', 'star', '#ffffff'], ['!Hammerwächter', 'automaton', '#ffb13d'], ['Sternenesse', 'station', '#8a8d96'], ['Glühende Welt', 'planet', '#ff8a2a']],
    [['Funkenregen', 'cluster'], ['Schlackenbrocken', 'rock'], ['Funkenkomet', 'comet'], ['Sternenschatz', 'chest']]],
  'Gedankenmeer': ['ocean', [['Gedankenfisch', 'fish', '#c38bff'], ['Erinnerungsqualle', 'jelly', '#6a6adf'], ['~Ideenfisch', 'fish', '#e0d0ff'], ['Gedankenkoralle', 'coral', '#c38bff'], ['*Geistesblitz', 'bolt', '#ffffff'], ['!Allsehendes Auge', 'eye', '#c38bff'], ['Traumwal', 'whale', '#6a6adf'], ['Gedankeninsel', 'island', '#5a6aaf']],
    [['Gedankenblasen', 'cluster'], ['Gedankenschiff', 'ship'], ['Ideenkomet', 'comet'], ['Truhe der Erinnerung', 'chest']]],
  'Kristallkern': ['crystal', [['Kernsplitter', 'crystal', '#3ad9b0'], ['Kristallei', 'egg', '#7fffe0'], ['~Kristallschlange', 'snake', '#7fffe0'], ['Kristallobelisk', 'obelisk', '#3ad9b0'], ['*Kristallnova', 'star', '#e0fff8'], ['!Kernwächter', 'automaton', '#3ad9b0'], ['Kernportal', 'portal', '#7fffe0'], ['Kernkristall', 'iceberg', '#e0fff8']],
    [['Kernsplitterfeld', 'cluster'], ['Kristallkugel', 'egg'], ['Kristallregen', 'comet'], ['Kristallader', 'goldpile']]],
  'Glitch-Zone': ['glitch', [['Glitch-Block', 'glitch', '#ff00ff'], ['Kaputter Chip', 'chip', '#00ffff'], ['~Bug', 'virus', '#ffff00'], ['Absturzserver', 'server', '#ff00ff'], ['*Systemabsturz', 'star', '#00ffff'], ['!Debug-Auge', 'eye', '#ff00ff'], ['Fehlerportal', 'portal', '#00ffff'], ['Pixelhochhaus', 'building', '#5a0a5a']],
    [['Pixelmüll', 'cluster'], ['Fehlerauto', 'car'], ['Bug-Komet', 'comet'], ['Speicherleck', 'chest']]],
  'Dunkle Sonne': ['darksun', [['Schattenflamme', 'nebula', '#8a1a1a'], ['Glutkomet', 'comet', '#ff6a3d'], ['~Sonnengeist', 'ghost', '#ff3b2f'], ['Rotglutplanet', 'planet', '#8a1a1a'], ['*Sonnenausbruch', 'star', '#ff3b2f'], ['!Korona-Auge', 'eye', '#ff6a3d'], ['Schwarzer Zwerg', 'planet', '#3a0a0a'], ['Dunkler Stern', 'star', '#ff3b2f']],
    [['Aschewolke', 'cluster'], ['Glutmond', 'planet'], ['Sonnenkomet', 'comet'], ['Sonnenschatz', 'chest']]],
  'Götterberg': ['temple', [['Tempelsäule', 'pillar', '#e8dcc4'], ['Goldene Harfe', 'harp', '#ffd23f'], ['~Götterbote', 'angel', '#ffd23f'], ['Tempel', 'temple', '#e8dcc4'], ['*Blitzschlag', 'bolt', '#fff36a'], ['!Donnergott', 'god', '#5a6aaf'], ['Götterpalast', 'palace', '#f0e8d8'], ['Olymp', 'mountain', '#c8c8e0']],
    [['Marmorbruch', 'cluster'], ['Wolkenwagen', 'cloud'], ['Goldkomet', 'comet'], ['Ambrosia-Schatz', 'goldpile']]],
  'Ätherfeld': ['sky', [['Ätherwölkchen', 'cloud', '#a0ffe0'], ['Irrlicht', 'nebula', '#e0fff0'], ['~Ätherfee', 'angel', '#a0ffe0'], ['Schwebewelt', 'island', '#5ab0a0'], ['*Ätherfunke', 'star', '#ffffff'], ['!Ätherauge', 'eye', '#a0ffe0'], ['Ätherturm', 'obelisk', '#a0ffe0'], ['Ätherschrein', 'temple', '#e0fff0']],
    [['Ätherschimmer', 'cluster'], ['Treibwolke', 'cloud'], ['Ätherkomet', 'comet'], ['Ätherschatz', 'chest']]],
  'Weltenbaum': ['forest', [['Weltenblatt', 'flower', '#7fe07f'], ['Waldpilz', 'mushroom', '#ff6a3d'], ['~Waldvogel', 'bird', '#ffd23f'], ['Weltenfrucht', 'egg', '#ff6a3d'], ['*Saftbombe', 'star', '#c9f0a0'], ['!Waldgeist', 'ghost', '#7fe07f'], ['Weltenwurzel', 'root', '#7a4a2a'], ['Baumriese', 'bigtree', '#4f9e4a']],
    [['Laubhaufen', 'cluster'], ['Riesenschnecke', 'snail'], ['Samenkomet', 'comet'], ['Harzschatz', 'chest']]],
  'Plasmaozean': ['ocean', [['Plasmafisch', 'fish', '#5ad0ff'], ['Plasmaqualle', 'jelly', '#3a6aff'], ['~Leuchtfisch', 'fish', '#c0f0ff'], ['Plasmakoralle', 'coral', '#5ad0ff'], ['*Plasmaentladung', 'bolt', '#c0f0ff'], ['!Tiefseeauge', 'eye', '#5ad0ff'], ['Plasmawal', 'whale', '#3a6aff'], ['Plasmainsel', 'island', '#2a5aaa']],
    [['Plasmablasen', 'cluster'], ['Plasma-U-Boot', 'ship'], ['Plasmawelle', 'comet'], ['Perlenschatz', 'chest']]],
  'Zeitwirbel': ['clockwork', [['Zeitsplitter', 'crystal', '#ffe07f'], ['Sanduhr', 'hourglass', '#b8a050'], ['~Gestern', 'ghost', '#fff0c0'], ['Zeitturm', 'clock', '#b8a050'], ['*Zeitbombe', 'dynamite', '#ff3b2f'], ['!Chronos-Wächter', 'automaton', '#ffe07f'], ['Zeitportal', 'portal', '#ffe07f'], ['Uralte Pyramide', 'pyramid', '#b8a050']],
    [['Zeitstaub', 'cluster'], ['Zeitrad', 'gear'], ['Sanduhr-Komet', 'comet'], ['Schatz von morgen', 'chest']]],
  'Traumebene': ['dream', [['Traumwolke', 'cloud', '#ffb3f0'], ['Schäfchen', 'sheep', '#ffffff'], ['~Springschaf', 'sheep', '#ffe0ff'], ['Mondsichel', 'moon', '#ffe0a0'], ['*Albtraumbombe', 'star', '#a06adf'], ['!Traumfänger-Auge', 'eye', '#ffb3f0'], ['Wolkenschloss', 'palace', '#ffe0ff'], ['Traumplanet', 'ringplanet', '#ffb3f0']],
    [['Sternenstaub', 'cluster'], ['Zuckerwatte', 'cotton'], ['Sternschnuppe', 'comet'], ['Traumschatz', 'chest']]],
  'Chaoskern': ['chaos', [['Chaossplitter', 'crystal', '#ff3b2f'], ['Chaosblock', 'glitch', '#c38bff'], ['~Chaosgeist', 'virus', '#ffd23f'], ['Chaosportal', 'portal', '#c38bff'], ['*Chaosbombe', 'star', '#ff3b2f'], ['!Chaosauge', 'eye', '#ff3b2f'], ['Chaoswirbel', 'galaxy', '#ff3b2f'], ['Chaosplanet', 'planet', '#c38bff']],
    [['Chaosschutt', 'cluster'], ['Taumelnder Mond', 'planet'], ['Wirbelkomet', 'comet'], ['Chaosschatz', 'chest']]],
  'Spiegelwelt': ['mirror', [['Spiegelscherbe', 'crystal', '#e0e8ff'], ['Handspiegel', 'mirror', '#e0e8ff'], ['~Spiegelbild', 'ghost', '#9aa0c0'], ['Zauberspiegel', 'mirror', '#ffffff'], ['*Lichtblitz', 'bolt', '#ffffff'], ['!Spiegelauge', 'eye', '#e0e8ff'], ['Spiegelpalast', 'palace', '#e0e8ff'], ['Spiegelturm', 'obelisk', '#c0c8e0']],
    [['Scherbenhaufen', 'cluster'], ['Spiegelkugel', 'egg'], ['Lichtkomet', 'comet'], ['Silberschatz', 'chest']]],
  'Schwarzer Garten': ['garden', [['Dornenranke', 'bush', '#2a4a2a'], ['Giftpilz', 'mushroom', '#a0ff7f'], ['~Giftfalter', 'bird', '#a0ff7f'], ['Fleischblume', 'flower', '#8a1a3a'], ['*Giftbombe', 'star', '#a0ff7f'], ['!Dornenauge', 'eye', '#5a8a3a'], ['Gartengrab', 'tomb', '#3a4a3a'], ['Galgenbaum', 'bigtree', '#2a3a2a']],
    [['Unkrautfeld', 'cluster'], ['Giftschnecke', 'snail'], ['Sporenkomet', 'comet'], ['Giftschatz', 'chest']]],
  'Prismenwüste': ['desert', [['Prisma', 'crystal', '#ff9a3d'], ['Kristallkaktus', 'cactus', '#7fe0c0'], ['~Lichtwurm', 'snake', '#ffd23f'], ['Prismenpyramide', 'pyramid', '#e0c070'], ['*Lichtbombe', 'star', '#ffffff'], ['!Prismenauge', 'eye', '#ff9a3d'], ['Sonnenobelisk', 'obelisk', '#e0c070'], ['Regenbogenfels', 'mesa', '#ff9a3d']],
    [['Glitzersand', 'cluster'], ['Steppenroller', 'tumble'], ['Regenbogenkomet', 'comet'], ['Wüstenschatz', 'goldpile']]],
  'Titanenschmiede': ['forge', [['Titanbolzen', 'rock', '#8a8d96'], ['Amboss', 'anvil', '#5a5d66'], ['~Golemschmied', 'automaton', '#ff6a1f'], ['Titanrad', 'gear', '#8a8d96'], ['*Schmelzofen', 'gastank', '#ff6a1f'], ['!Titanenwächter', 'automaton', '#ff6a1f'], ['Schlackenturm', 'spire', '#5a3a2a'], ['Erzberg', 'mountain', '#5a3a2a']],
    [['Schlacke', 'cluster'], ['Erzlore', 'wagon'], ['Schlackekomet', 'comet'], ['Titanschatz', 'chest']]],
  'Leere zwischen den Welten': ['void', [['Nichts-Splitter', 'crystal', '#3a3a5a'], ['Geisterkomet', 'comet', '#ffffff'], ['~Leerengeist', 'ghost', '#5a5a7a'], ['Verlorene Welt', 'planet', '#3a3a4a'], ['*Leerenriss', 'blackhole', '#000000'], ['!Auge der Leere', 'eye', '#ffffff'], ['Leerentor', 'portal', '#5a5a7a'], ['Vergessener Tempel', 'temple', '#3a3a4a']],
    [['Nichts', 'cluster'], ['Treibender Mond', 'planet'], ['Echo', 'comet'], ['Vergessener Schatz', 'chest']]],
  'Feuerhimmel': ['fiery', [['Feuerwolke', 'cloud', '#ff8a2a'], ['Phönixfeder', 'comet', '#ffd23f'], ['~Feuervogel', 'bird', '#ff6a1f'], ['Brennender Mond', 'moon', '#ff8a2a'], ['*Himmelsfeuer', 'star', '#ffe07f'], ['!Himmelsdrache', 'dragon', '#ffd23f'], ['Sonnenpalast', 'palace', '#ffe07f'], ['Himmelsvulkan', 'volcano', '#8a3a0a']],
    [['Glutwolken', 'cluster'], ['Brennende Wolke', 'cloud'], ['Feuerschweif', 'comet'], ['Sonnenschatz', 'goldpile']]],
  'Engelsruine': ['temple', [['Säulenrest', 'pillar', '#e0e0e8'], ['Engelsharfe', 'harp', '#fff8d0'], ['~Engelsfunke', 'angel', '#fff8d0'], ['Verfallener Tempel', 'temple', '#c0c0d0'], ['*Heiliges Licht', 'star', '#ffd23f'], ['!Gefallener Engel', 'angel', '#6a6a7a'], ['Engelsgrab', 'tomb', '#c0c0d0'], ['Himmelsruine', 'palace', '#a0a0b0']],
    [['Trümmer', 'cluster'], ['Wolkenrest', 'cloud'], ['Federkomet', 'comet'], ['Engelsschatz', 'chest']]],
  'Höllentor': ['lava', [['Höllenstein', 'rock', '#5a1a1a'], ['Höllenspitze', 'spire', '#3a0505'], ['~Teufelchen', 'gummy', '#e8262b'], ['Lavadämon', 'lavablob', '#ff3b2f'], ['*Schwefelbombe', 'star', '#ffd23f'], ['!Höllenhund', 'dragon', '#8a1a0a'], ['Höllentor', 'portal', '#ff3b2f'], ['Schwefelvulkan', 'volcano', '#5a0a0a']],
    [['Schwefelfeld', 'cluster'], ['Lavawalze', 'lavablob'], ['Schwefelkomet', 'comet'], ['Höllenschatz', 'chest']]],
  'Ursuppe': ['soup', [['Urzelle', 'cell', '#a0f04a'], ['Bakterie', 'cell', '#6ab04a'], ['~Ur-Amöbe', 'jelly', '#6ab04a'], ['Lebensei', 'egg', '#e0ff9a'], ['*Faulgasblase', 'star', '#a0f04a'], ['!Urauge', 'eye', '#a0f04a'], ['Urkoralle', 'coral', '#e0ff9a'], ['Ursuppen-Insel', 'island', '#4a8a3a']],
    [['Blubberblasen', 'cluster'], ['Urfisch', 'fish'], ['Blubberkomet', 'comet'], ['Lebensschatz', 'chest']]],
  'Quantenschaum': ['quantum', [['Quantenblase', 'planet', '#7fd3ff'], ['Teilchenstrahl', 'comet', '#ffffff'], ['~Schrödingers Katze', 'cat', '#7fd3ff'], ['Quantenchip', 'chip', '#4a6aaa'], ['*Quantenkollaps', 'star', '#ffffff'], ['!Beobachter-Auge', 'eye', '#7fd3ff'], ['Wurmloch', 'portal', '#7fd3ff'], ['Quantenwelt', 'ringplanet', '#4a6aaa']],
    [['Quantenschaum', 'cluster'], ['Unschärfe-Mond', 'planet'], ['Teilchenkomet', 'comet'], ['Quantenschatz', 'chest']]],
  'Sternengrab': ['grave', [['Sternenasche', 'nebula', '#3a3a4a'], ['Sternengrab', 'tomb', '#6a6a7a'], ['~Sternengeist', 'ghost', '#9aa0c0'], ['Tote Welt', 'planet', '#3a3a4a'], ['*Letzte Nova', 'star', '#9aa0c0'], ['!Totenauge', 'eye', '#9aa0c0'], ['Sternenkapelle', 'church', '#4a4a5a'], ['Grabmal', 'obelisk', '#6a6a7a']],
    [['Asche', 'cluster'], ['Totenmond', 'planet'], ['Grabkomet', 'comet'], ['Grabbeigabe', 'chest']]],
  'Omega-Nebel': ['omega', [['Omega-Splitter', 'crystal', '#ff4ab0'], ['Omega-Komet', 'comet', '#ffb0f0'], ['~Nebelwesen', 'ghost', '#c38bff'], ['Omega-Planet', 'ringplanet', '#ff4ab0'], ['*Omega-Nova', 'star', '#ffb0f0'], ['!Omega-Auge', 'eye', '#ff4ab0'], ['Omega-Galaxie', 'galaxy', '#ff4ab0'], ['Omega-Tor', 'portal', '#ff4ab0']],
    [['Nebelschwaden', 'cluster'], ['Omega-Mond', 'planet'], ['Pulsar', 'comet'], ['Omega-Schatz', 'chest']]],
  'Unendlichkeitsmeer': ['ocean', [['Sternenfisch', 'fish', '#c0f0ff'], ['Sternqualle', 'jelly', '#5ad0ff'], ['~Silberfisch', 'fish', '#e0f4ff'], ['Sternkoralle', 'coral', '#5ad0ff'], ['*Strudelbombe', 'blackhole', '#000000'], ['!Leviathan-Auge', 'eye', '#5ad0ff'], ['Kosmos-Wal', 'whale', '#1a5aaa'], ['Inselwelt', 'island', '#2a6aaa']],
    [['Sternenperlen', 'cluster'], ['Geisterschiff', 'ship'], ['Wellenkomet', 'comet'], ['Perlenschatz', 'chest']]],
  'Der Rand': ['edge', [['Randsplitter', 'crystal', '#ffd23f'], ['Randkomet', 'comet', '#ffd23f'], ['~Grenzgänger', 'ghost', '#ffd23f'], ['Letzte Insel', 'island', '#3a3a3a'], ['*Randexplosion', 'star', '#ffd23f'], ['!Grenzwächter', 'automaton', '#ffd23f'], ['Grenzstein', 'obelisk', '#5a5a5a'], ['Rand-Tor', 'portal', '#ffd23f']],
    [['Randstaub', 'cluster'], ['Grenzmond', 'planet'], ['Grenzkomet', 'comet'], ['Letzter Schatz', 'goldpile']]],
  'Jenseits': ['heaven', [['Seelenwolke', 'cloud', '#ffffff'], ['Himmelsharfe', 'harp', '#8a6bff'], ['~Seele', 'ghost', '#d0d0f0'], ['Himmelstor', 'portal', '#8a6bff'], ['*Erlösung', 'star', '#ffffff'], ['!Richter-Engel', 'angel', '#8a6bff'], ['Himmelstempel', 'temple', '#f0f0ff'], ['Jenseitspalast', 'palace', '#e0e0ff']],
    [['Lichtfunken', 'cluster'], ['Schwebewolke', 'cloud'], ['Seelenkomet', 'comet'], ['Himmelsschatz', 'goldpile']]],
  'Schöpfungsquelle': ['genesis', [['Urfunke', 'star', '#ffd23f'], ['Weltenei', 'egg', '#ffd23f'], ['~Ur-Idee', 'cell', '#ff8a2a'], ['Erste Welt', 'earth', '#3d8bd9'], ['*Big Bang', 'star', '#ffffff'], ['!Der Schöpfer', 'god', '#ff8a2a'], ['Baum des Lebens', 'bigtree', '#7fe07f'], ['Urgalaxie', 'galaxy', '#ff8a2a']],
    [['Schöpfungsstaub', 'cluster'], ['Junge Welt', 'planet'], ['Schöpfungskomet', 'comet'], ['Schatz der Schöpfung', 'goldpile']]],
  'Das Letzte Licht': ['lastlight', [['Lichtrest', 'star', '#fff8d0'], ['Letzter Komet', 'comet', '#fff8d0'], ['~Glühwürmchen', 'nebula', '#fff8d0'], ['Erloschene Welt', 'planet', '#4a4a3a'], ['*Letzter Funke', 'star', '#ffffff'], ['!Letztes Auge', 'eye', '#fff8d0'], ['Leuchtturm', 'obelisk', '#fff8d0'], ['Lichtgrab', 'tomb', '#6a6a5a']],
    [['Glimmen', 'cluster'], ['Kalter Mond', 'planet'], ['Abschiedskomet', 'comet'], ['Letzter Schatz', 'chest']]],
  'Höllenschlund': ['hell', [['Höllenglut', 'rock', '#ff4a1f'], ['Grabstein', 'tomb', '#5a1a1a'], ['~Verdammte Seele', 'ghost', '#ff6a3d'], ['Lavamonster', 'lavablob', '#c42a0a'], ['*Schwefelsonne', 'star', '#ffd23f'], ['!Höllenwächter', 'dragon', '#c42a0a'], ['Höllenspitze', 'spire', '#2a0505'], ['Höllenvulkan', 'volcano', '#5a0a00']],
    [['Ascheregen', 'cluster'], ['Lavawalze', 'lavablob'], ['Seelenkomet', 'comet'], ['Höllenschatz', 'chest']]],
};
const DIM_SIZES = [0.22, 0.35, 0.55, 0.8, 1.1, 1.6, 2.4, 3.6];
const DIM_VALUES = [1, 2, 3, 5, 7, 10, 15, 24];
DIMENSIONS.forEach(([name, pal, ground, evo, objs], i) => {
  const idx = 11 + i, M = 10 * Math.pow(4, idx), TH = DIM_THEMES[name];
  if (TH) objs = TH[1];
  WORLDS.push({
    id: 'dim' + idx, name, minRadius: M, scrapMult: Math.pow(3, idx), ground,
    bg: pal[0], bg2: pal[1], accent: pal[2], pal, evo, theme: TH ? TH[0] : 'crystal',
    objects: objs.map(([n, shape, color], k) => {
      const o = { name: n.replace(/^[*!~]/, ''), size: M * DIM_SIZES[k], shape, color, value: DIM_VALUES[k] };
      if (n[0] === '*') o.explosive = true;
      if (n[0] === '!') { o.move = 'wander'; o.speed = 1.4; o.hazard = 22; }
      if (n[0] === '~') { o.move = 'flee'; o.speed = 2.6; }
      return o;
    }),
  });
  // 4 zusätzliche Objekte je Dimension (Trümmer, Irrläufer, Splitter, Goldader)
  const W = WORLDS[WORLDS.length - 1];
  const X = TH ? TH[2] : [['Trümmerfeld', 'cluster'], ['Irrläufer-Mond', 'planet'], ['Splitterkomet', 'comet'], ['Goldader', 'crystal']];
  W.objects.push(
    { name: X[0][0], size: M * 0.28, shape: X[0][1], color: pal[4], value: 1 },
    { name: X[1][0], size: M * 0.7, shape: X[1][1], color: pal[4], value: 4, move: 'drive', speed: 1.1 },
    { name: X[2][0], size: M * 0.45, shape: X[2][1], color: pal[5], value: 3, move: 'drive', speed: 2.2 },
    { name: X[3][0], size: M * 1.3, shape: X[3][1], color: '#ffd23f', value: 14 },
  );
  EVOLUTION.push({ name: evo, body: pal[2], belly: pal[5], horn: pal[4] === pal[2] ? '#ffffff' : pal[4], dark: pal[0] });
});

// ---------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// ENDBOSS in der letzten Welt (Welt 50)
// ---------------------------------------------------------------------
export const BOSS = {
  world: 49,               // Index der Welt (49 = Welt 50, Höllenschlund)
  name: 'ZORNOS',
  title: 'der Höllenfürst',
  sizeMult: 2.4,           // immer so viel größer als du
  hp: 190,                 // Lebenspunkte in "Boss-Treffern" (ein Ansturm-Treffer ≈ 1,7–4,8)
  powerExp: 0.15,          // Stärke (Schaden ÷ Boss-Härte) wird gestaucht …
  powerMin: 0.6,           // … und gedeckelt: knapp angekommen 0,6, ausgemaxt höchstens 1,4
  powerMax: 1.4,
  hugMult: 0.35,           // normale Kontakt-Schläge (ohne Ansturm) zählen nur so viel
  berserkPerHit: 0.005,
  dashMult: 2.2,           // Ansturm-Treffer (× vierte Wurzel aus Ansturm-Bonus)
  berserkMult: 1.5,        // Berserker-Schaden gegen den Boss (statt voller Bonus)    // Berserker-Ladung pro Boss-Treffer
  speed: 0.45,             // Verfolgungs-Tempo relativ zu deinem Tempo
  attackEvery: [2.6, 3.8], // Sekunden zwischen Angriffen (unter 30 % Leben 40 % schneller)
  ringDamage: 20,          // % Wut bei Treffer durch Feuerring
  meteorDamage: 16,        // % Wut bei Meteortreffer
  chargeDamage: 26,        // % Wut beim Sturmangriff
  fireballDamage: 12,      // % Wut pro Feuerball (nur in der Wutphase unter 30 % Leben)
  touchDamage: 7,          // % Wut, wenn man am Boss klebt (außer im Ansturm) – Hit & Run statt Kuscheln
  rewardScrap: 3000,       // × Welt-Schrott-Multiplikator
  rewardChaos: 250000,
  rewardDM: 250,           // ◆ Dunkle Materie
  unlock: 'infernus',
  // Abkürzung „Direkt zu ZORNOS“ (frei, sobald Welt 50 einmal erreicht wurde): Start in Welt 50 mit 49 zufälligen Mutationen
  rush: { dmMult: 0.4 }, // ◆-Belohnung bei Sieg über die Abkürzung (Schrott-Belohnung voll); zählt nicht für den Urknall-Bonus
};

export const SPAWN = {
  density: 85,          // Anzahl relevanter Objekte im Umkreis
  areaViews: 1.5,       // Spawn-Radius in "Bildschirm-Halbdiagonalen"
  despawnViews: 2.6,
  minRel: 0.22,         // kleinste Objekte relativ zum Spieler
  maxRel: 3.2,          // größte Objekte relativ zum Spieler
  nextWorldPeek: 0.25,  // Chance-Gewicht für Objekte aus der nächsten Welt
  sweetSpot: 0.65,      // häufigste Objektgröße relativ zum Spieler
};

// ---------------------------------------------------------------------
// Mini-Aufträge während eines Runs
// ---------------------------------------------------------------------
export const QUESTS = {
  firstAfter: 4,        // Sekunden bis zum ersten Auftrag
  pause: 3,             // Pause zwischen Aufträgen
  rageReward: 0.4,      // Wut-Auffüllung (Anteil)
  berserkReward: 0.35,  // Berserker-Füllung
  scrapReward: 25,      // × Welt-Multiplikator
};

// ---------------------------------------------------------------------
// Permanente Upgrades (Werkstatt zwischen den Runs)
// cost = base × growth^level
// ---------------------------------------------------------------------
export const UPGRADE_CATS = [
  { id: 'body',   name: 'Körper', icon: '🦖', desc: 'Größer, zäher, hungriger.' },
  { id: 'combat', name: 'Kampf',  icon: '👊', desc: 'Mehr Schaden und stärkere Fähigkeiten.' },
  { id: 'loot',   name: 'Beute',  icon: '💰', desc: 'Mehr Schrott, Chaos und Glück.' },
];
// mult: true = Wirkung pro Stufe multiplikativ (z. B. 1,12^Stufe) – skaliert endlos mit
export const UPGRADES = [
  { id: 'size',    cat: 'body',   name: 'Startgröße',     icon: '🦖', desc: 'Du startest größer (überspringt frühe Welten schneller).', base: 150,  growth: 1.8,  max: 80,  per: 0.08, mult: true },
  { id: 'rage',    cat: 'body',   name: 'Wut-Tank',       icon: '🔥', desc: 'Mehr maximale Wut = längere Runs.',                       base: 100,  growth: 1.6,  max: 40,  per: 0.05, mult: true },
  { id: 'calm',    cat: 'body',   name: 'Dauerwut',       icon: '⏳', desc: 'Wut sinkt langsamer.',                                     base: 225,  growth: 1.9,  max: 25,  per: 0.05 },
  { id: 'absorb',  cat: 'body',   name: 'Hunger',         icon: '🍖', desc: 'Wachse schneller durch Zerstörung.',                       base: 200,  growth: 1.6, max: 200, per: 0.055, mult: true },
  { id: 'speed',   cat: 'body',   name: 'Tempo',          icon: '💨', desc: 'Schneller stampfen.',                                      base: 112,  growth: 1.9,  max: 30,  per: 0.06 },
  { id: 'dmg',     cat: 'combat', name: 'Wucht',          icon: '👊', desc: 'Mehr Schaden pro Schlag.',                                 base: 125,  growth: 1.52,  max: 300, per: 0.11, mult: true },
  { id: 'hard',    cat: 'combat', name: 'Härte',          icon: '🪨', desc: 'Zerstöre Objekte, die größer sind als du.',               base: 375, growth: 2.2,  max: 15,  per: 0.06 },
  { id: 'dash',    cat: 'combat', name: 'Ansturm',        icon: '⚡', desc: 'Ansturm (Leertaste) lädt schneller auf.',                  base: 225,  growth: 2.0,  max: 20,  per: 0.06 },
  { id: 'slam',    cat: 'combat', name: 'Erdbeben',       icon: '💥', desc: 'Stampfer (E): größerer Radius, kürzere Abklingzeit.',      base: 300, growth: 2.0,  max: 20,  per: 0.06 },
  { id: 'berserk', cat: 'combat', name: 'Berserker',      icon: '😡', desc: 'Berserker (R) lädt sich schneller auf.',                   base: 337, growth: 2.0,  max: 20,  per: 0.1 },
  { id: 'combo',   cat: 'combat', name: 'Kettenreaktion', icon: '⛓', desc: 'Längeres Kombo-Fenster und höherer Kombo-Bonus.',          base: 275, growth: 2.0,  max: 15,  per: 0.08 },
  { id: 'scrap',   cat: 'loot',   name: 'Schrottgier',    icon: '⚙', desc: 'Mehr Schrott pro Objekt.',                                 base: 175,  growth: 1.75, max: 300, per: 0.1, mult: true },
  { id: 'magnet',  cat: 'loot',   name: 'Magnet',         icon: '🧲', desc: 'Zieht Schrott und kleine Krümel aus der Ferne an.',       base: 262, growth: 2.0,  max: 20,  per: 0.6 },
  { id: 'chaosup', cat: 'loot',   name: 'Chaos-Rausch',   icon: '☠', desc: 'Mehr ☠ Chaos pro Zerstörung.',                            base: 250, growth: 1.7,  max: 150, per: 0.06, mult: true },
  { id: 'luck',    cat: 'loot',   name: 'Gold-Riecher',   icon: '✨', desc: 'Goldene Objekte (×6 Schrott) tauchen öfter auf.',         base: 350, growth: 2.1,  max: 15,  per: 0.15 },
  { id: 'crates',  cat: 'loot',   name: 'Kistenfinder',   icon: '📦', desc: 'Schrottkisten tauchen öfter auf.',                        base: 350, growth: 2.1,  max: 15,  per: 0.15 },
  { id: 'quest',   cat: 'loot',   name: 'Auftragskiller', icon: '📜', desc: 'Aufträge bringen mehr Schrott und Chaos.',                base: 250, growth: 2.0,  max: 10,  per: 0.25 },
];

// ---------------------------------------------------------------------
// Mutationen – bei jedem Welt-Aufstieg 1 aus 3 wählen (nur für diesen Run)
// ---------------------------------------------------------------------
export const MUTATIONS = [
  { id: 'boom',     name: 'Explosiv',       icon: '💣', desc: 'Jede Zerstörung macht eine kleine Explosion.' },
  { id: 'spikes',   name: 'Stacheln',       icon: '🦔', desc: '+60 % Schaden.' },
  { id: 'turbo',    name: 'Turbo',          icon: '💨', desc: '+30 % Tempo.' },
  { id: 'greed',    name: 'Gier',           icon: '💰', desc: '+60 % Schrott.' },
  { id: 'zen',      name: 'Kochende Ruhe',  icon: '🧘', desc: 'Wut sinkt 30 % langsamer.' },
  { id: 'hole',     name: 'Super-Magnet',   icon: '🧲', desc: 'Magnet-Radius +6 Körpergrößen – dein Magnet saugt jetzt auch fressbare Objekte an (nicht nur Krümel).' },
  { id: 'shock',    name: 'Schockwelle',    icon: '🔊', desc: 'Alle 4 s eine Druckwelle um dich herum.' },
  { id: 'glutton',  name: 'Vielfraß',       icon: '😋', desc: '+40 % Wachstum.' },
  { id: 'hardhead', name: 'Dickschädel',    icon: '🪖', desc: 'Zerstöre noch größere Objekte (+20 %).' },
  { id: 'frenzy',   name: 'Raserei',        icon: '⏱', desc: 'Kombo-Fenster doppelt so lang.' },
  { id: 'dashmore', name: 'Dauer-Ansturm',  icon: '⚡', desc: 'Ansturm lädt 2× so schnell und trifft 2× so hart.' },
  { id: 'golden',   name: 'Goldrausch',     icon: '✨', desc: 'Goldene Objekte 4× häufiger.' },
  { id: 'rager',    name: 'Jähzorn',        icon: '🤬', desc: 'Berserker-Modus füllt sich doppelt so schnell.' },
  { id: 'armor',    name: 'Panzerhaut',     icon: '🛡', desc: 'Hindernisse tun nur noch halb so weh.' },
];

// Stapelbare Verstärkungen: kommen beim Welt-Aufstieg, sobald alle Mutationen vergeben sind
export const BOOSTS = [
  { id: 'b_dmg',   name: 'Mehr Wucht',   icon: '💪', desc: '+4 % Schaden (stapelbar).', stack: true },
  { id: 'b_grow',  name: 'Mehr Hunger',  icon: '🍖', desc: '+3 % Wachstum (stapelbar).', stack: true },
  { id: 'b_scrap', name: 'Mehr Beute',   icon: '💰', desc: '+6 % Schrott (stapelbar).', stack: true },
  { id: 'b_rage',  name: 'Mehr Zorn',    icon: '🔥', desc: '+5 % Wut-Tank (stapelbar).', stack: true },
];

// ---------------------------------------------------------------------
// Zufällige Events während eines Runs
// ---------------------------------------------------------------------
export const EVENTS = {
  firstAfter: 22,     // Sekunden bis zum ersten möglichen Event
  every: [25, 40],    // Abstand zwischen Events (min, max)
  duration: 10,
  list: [
    { id: 'glass',  name: 'GLASWELT!',      desc: 'Alles zerbricht mit einem Schlag' },
    { id: 'gold',   name: 'GOLDREGEN!',     desc: 'Viele goldene Objekte' },
    { id: 'frenzy', name: 'WUTANFALL!',     desc: 'Wut sinkt nicht' },
    { id: 'meteor', name: 'METEORSCHAUER!', desc: 'Meteore zerschlagen alles um dich' },
    { id: 'crates', name: 'KISTENREGEN!',   desc: 'Überall Schrottkisten' },
  ],
};

// ---------------------------------------------------------------------
// Fähigkeiten (aktiv auslösbar)
// ---------------------------------------------------------------------
export const ABILITIES = {
  dash:    { key: 'Leertaste', short: '␣', name: 'Ansturm',   icon: '⚡', desc: 'Stürmt nach vorne und trifft 2,5× so hart.' },
  slam:    { key: 'E', short: 'E', name: 'Stampfer',  icon: '💥', desc: 'Erdbeben um dich herum – zerlegt alles in der Nähe, was du zerstören kannst.',
             cooldown: 8, radius: 3.5, damage: 2.2 },
  berserk: { key: 'R', short: 'R', name: 'Berserker', icon: '😡', desc: 'Lädt sich durch Zerstörung auf. Voll? Zünden: riesig, unverwundbar, 3× Schaden, keine Wut-Abnahme.' },
};

// ---------------------------------------------------------------------
// Skill-Evolutionen: ab einer Upgrade-Stufe mit ☠ Chaos freischalten (bleiben für immer)
// ---------------------------------------------------------------------
export const SKILL_EVOS = [
  { id: 'dash1',    ability: 'dash',    name: 'Flammen-Ansturm', icon: '🔥', upg: 'dash',    lvl: 8,  cost: 20000,   desc: 'Der Ansturm hinterlässt eine Feuerspur, die alles Zerstörbare darin verbrennt.' },
  { id: 'dash2',    ability: 'dash',    name: 'Meteor-Ansturm',  icon: '☄', upg: 'dash',    lvl: 16, cost: 400000,  desc: 'Am Ende jedes Ansturms schlägt ein Meteor ein – große Explosion um dich herum.', needs: 'dash1' },
  { id: 'slam1',    ability: 'slam',    name: 'Nachbeben',       icon: '🌊', upg: 'slam',    lvl: 8,  cost: 30000,   desc: 'Nach 0,4 s folgt eine zweite, 50 % größere Erdbebenwelle.' },
  { id: 'slam2',    ability: 'slam',    name: 'Erdspalter',      icon: '⛰', upg: 'slam',    lvl: 16, cost: 600000,  desc: 'Der Stampfer macht Hindernisse 4 s lang harmlos und zieht alle Münzen im großen Umkreis zu dir.', needs: 'slam1' },
  { id: 'berserk1', ability: 'berserk', name: 'Titanenwut',      icon: '🗿', upg: 'berserk', lvl: 8,  cost: 50000,   desc: 'Im Berserker zerbröselt alles Zerstörbare sofort bei Berührung.' },
  { id: 'berserk2', ability: 'berserk', name: 'Endloser Zorn',   icon: '♾', upg: 'berserk', lvl: 16, cost: 1000000, desc: 'Jede Zerstörung im Berserker verlängert ihn um 0,15 s (bis zu +8 s).', needs: 'berserk1' },
];

// ---------------------------------------------------------------------
// Monster (spielbare Charaktere) – freischalten mit ☠ Chaos
//   perks: Multiplikatoren auf die Grundwerte
//   req:   Meilenstein, der zusätzlich erreicht sein muss
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// MONSTER-LEVEL & TALENTE – jedes Monster sammelt beim Spielen EP (bis Level 99).
// Pro Level 1 Talentpunkt. 4 Talente je Monster (je max. 25 Ränge):
// Kraft + Hunger ab Lvl 1, Skill-Meister ab Lvl 15, Signatur-Talent ab Lvl 40.
// Boni bewusst klein, damit die Balance erhalten bleibt.
// ---------------------------------------------------------------------
export const MONSTER_LEVEL = {
  max: 99,
  xpFor: L => Math.round(25 + 6 * Math.pow(L, 1.25)), // EP von Level L auf L+1 (Summe bis 99 ≈ 83.000)
  xpRun: { base: 20, perKill: 0.08, perWorld: 18, perQuest: 6, killCap: 2500 }, // EP pro Run (unabhängig von Zahlengrößen)
};
export const TALENTS = [
  { id: 'power', name: 'Kraft',        icon: '💪', max: 25, per: 0.006, stat: 'damage', lvl: 1,  desc: r => `+${(r * 0.6).toFixed(1)} % Schaden` },
  { id: 'hunger', name: 'Hunger',      icon: '🍖', max: 25, per: 0.003, stat: 'absorb', lvl: 1,  desc: r => `+${(r * 0.3).toFixed(1)} % Wachstum` },
  { id: 'mastery', name: 'Skill-Meister', icon: '🎯', max: 25, per: 0.01, stat: 'skillCd', lvl: 15, desc: r => `−${r} % Abklingzeit des Monster-Skills (F)` },
  { id: 'sig', name: 'Signatur', icon: '⭐', max: 25, lvl: 40, sig: true }, // je Monster eigenes Talent (char.sig)
];
// Signatur-Talente: stat → Wirkung in computeStats (per pro Rang)
export const SIGNATURES = {
  grumpf:   { name: 'Sturkopf',     icon: '🔥', stat: 'rage',        per: 0.012, desc: r => `+${(r * 1.2).toFixed(1)} % Wut-Tank` },
  stachel:  { name: 'Dornenpanzer', icon: '🦔', stat: 'hazard',      per: 0.015, desc: r => `−${(r * 1.5).toFixed(1)} % Schaden durch Hindernisse` },
  flitzer:  { name: 'Windläufer',   icon: '💨', stat: 'speed',       per: 0.01,  desc: r => `+${r} % Tempo` },
  golem:    { name: 'Glutkern',     icon: '🌋', stat: 'boom',        per: 0.02,  desc: r => `+${r * 2} % Explosionen` },
  goldzahn: { name: 'Goldgier',     icon: '💰', stat: 'scrap',       per: 0.02,  desc: r => `+${r * 2} % Schrott` },
  void:     { name: 'Leere',        icon: '🕳', stat: 'berserk',     per: 0.02,  desc: r => `+${r * 2} % Berserker-Ladung` },
  frost:    { name: 'Eisherz',      icon: '❄', stat: 'berserkTime', per: 0.08,  desc: r => `+${(r * 0.08).toFixed(1)} s Berserker-Dauer` },
  kraken:   { name: 'Saugnäpfe',    icon: '🐙', stat: 'magnet',      per: 0.06,  desc: r => `+${(r * 0.06).toFixed(1)} Magnet-Reichweite` },
  mecha:    { name: 'Turbolader',   icon: '🚀', stat: 'dash',        per: 0.01,  desc: r => `−${r} % Ansturm-Abklingzeit` },
  phoenix:  { name: 'Glutfunken',   icon: '✨', stat: 'golden',      per: 0.03,  desc: r => `+${r * 3} % goldene Objekte` },
  infernus: { name: 'Höllenglut',   icon: '😈', stat: 'boom',        per: 0.02,  desc: r => `+${r * 2} % Explosionen` },
  urzorn:   { name: 'Urkraft',      icon: '🌌', stat: 'damage',      per: 0.01,  desc: r => `+${r} % Schaden (zusätzlich)` },
};

// Premium-Skins: rein optisch, je Monster einzeln zu kaufen (mit Schrott, Stufe für Stufe)
export const SKINS = [
  { id: 'silver',   name: 'Silber', icon: '🥈', cost: 5e8,  desc: 'Poliertes Silber mit Glanz und Funkeln' },
  { id: 'gold',     name: 'Gold',   icon: '🥇', cost: 1e14, desc: 'Strahlendes Gold mit goldener Aura' },
  { id: 'platinum', name: 'Platin', icon: '💠', cost: 1e22, desc: 'Eisiges Platin, schillert in allen Farben' },
  { id: 'god',      name: 'Gott',   icon: '👑', cost: 1e33, desc: 'Göttliches Licht: Heiligenschein, Strahlen, Regenbogen-Schimmer' },
  // Sonder-Skin: nicht käuflich – wer ZORNOS besiegt, bekommt ihn für ALLE Monster
  { id: 'kush',     name: 'Kush',      icon: '🌿', special: '420', desc: 'Grüner Kush-Skin mit Rauchschwaden – nur für alle, die die geheime Karte 420 geschafft haben.' },
  { id: 'hell',     name: 'Bezwinger', icon: '🔥', special: 'boss', desc: 'Höllenbezwinger: Obsidian mit Lava-Adern, Flammenkrone und Glut-Aura. Nur für den Sieg über ZORNOS.' },
];

export const CHARACTERS = [
  { id: 'grumpf', name: 'Grumpf', type: 'monster', title: 'Der Klassiker',
    desc: 'Ausgewogen, stur und immer schlecht gelaunt. Evolviert mit jeder Welt.',
    colors: null, skill: { id: 'roar', name: 'Wutschrei', icon: '📢', cd: 22, desc: '+35 % Wut sofort, 6 s doppelter Schrott und die Kombo läuft nicht ab.' },
    perks: {}, cost: 0, req: null },
  { id: 'stachel', name: 'Stachelkönig', type: 'spiky', title: 'Zerfetzer',
    desc: '+35 % Schaden. Seine Stacheln reißen alles auf. Etwas langsamer.',
    colors: { body: '#3f8a4f', belly: '#d6f0a8', horn: '#fff6dc', dark: '#14361c' },
    skill: { id: 'spikes', name: 'Stachelhagel', icon: '🦔', cd: 9, desc: '16 Stacheln schießen rundum und zerlegen alles Zerstörbare in ihrer Bahn.' },
    perks: { damage: 1.35, speed: 0.92 }, cost: 1500, req: { kills: 1500, label: 'Zerstöre insgesamt 1.500 Objekte' } },
  { id: 'flitzer', name: 'Flitzer', type: 'lizard', title: 'Sprinter',
    desc: '+25 % Tempo, Ansturm lädt 35 % schneller. Dafür 10 % kleinerer Wut-Tank.',
    colors: { body: '#2fb8d9', belly: '#fff2a8', horn: '#ffffff', dark: '#0b3a4a' },
    skill: { id: 'rush', name: 'Schallmauer', icon: '💨', cd: 12, desc: '5 s lang +15 % Tempo, jeder Zusammenstoß trifft wie ein Ansturm – und alle 0,35 s knallt ein Überschall-Ring um dich, der alles Zerstörbare in der Nähe zerlegt.' },
    perks: { speed: 1.25, dash: 0.65, rage: 0.9 }, cost: 4000, req: { world: 2, label: 'Erreiche die Stadt' } },
  { id: 'golem', name: 'Magma-Golem', type: 'golem', title: 'Wandelnde Katastrophe',
    desc: 'Explosionen doppelt so groß, Stampfer 40 % stärker, Hindernisse tun halb so weh. Wächst 10 % langsamer.',
    colors: { body: '#5a4a48', belly: '#ff8a2a', horn: '#2a1c1a', dark: '#1a1010' },
    skill: { id: 'lava', name: 'Lava-Spur', icon: '🌋', cd: 15, desc: '6 s lang hinterlässt du Lava, die alles Zerstörbare darin schmilzt.' },
    perks: { boom: 2, slam: 1.4, hazard: 0.5, absorb: 0.9 }, cost: 12000, req: { kills: 8000, label: 'Zerstöre insgesamt 8.000 Objekte' } },
  { id: 'goldzahn', name: 'Goldzahn', type: 'dragon', title: 'Gieriger Drache',
    desc: '+60 % Schrott, goldene Objekte 2,5× so häufig, Münzen fliegen ihm von selbst zu.',
    colors: { body: '#e8a72a', belly: '#fff0b0', horn: '#fffaf0', dark: '#6a3a00' },
    skill: { id: 'gold', name: 'Goldregen', icon: '✨', cd: 28, desc: 'Alles im Sichtfeld wird golden (×6 Schrott).' },
    perks: { scrap: 1.6, golden: 2.5, magnet: 2 }, cost: 35000, req: { world: 4, label: 'Erreiche den Kontinent' } },
  { id: 'void', name: 'Void', type: 'alien', title: 'Wesen aus dem Nichts',
    desc: 'Berserker lädt 70 % schneller und hält 3 s länger. Startet 25 % größer.',
    colors: { body: '#2a1a5a', belly: '#b06bff', horn: '#7fffe0', dark: '#0a0520' },
    skill: { id: 'singularity', name: 'Singularität', icon: '🕳', cd: 18, desc: 'Erschafft 4 s lang ein Schwarzes Loch vor dir, das alles Zerstörbare einsaugt und frisst.' },
    perks: { berserk: 1.7, berserkTime: 3, size: 1.25 }, cost: 90000, req: { world: 5, label: 'Erreiche den Erdorbit' } },
  { id: 'frost', name: 'Frostbeule', type: 'spiky', title: 'Eiskalter Zorn',
    desc: 'Hindernisse tun 40 % weniger weh, +20 % Schaden, +10 % Wut.',
    colors: { body: '#bfe8ff', belly: '#ffffff', horn: '#5ad0ff', dark: '#0a3a5a' },
    skill: { id: 'freeze', name: 'Eiszeit', icon: '❄', cd: 20, desc: '5 s lang friert alles im Sichtfeld ein: nichts bewegt sich, Hindernisse sind harmlos, alles zerbricht mit einem Schlag.' },
    perks: { hazard: 0.6, damage: 1.2, rage: 1.1 }, cost: 250000, req: { world: 11, label: 'Erreiche das Kristallreich (Welt 12)' } },
  { id: 'kraken', name: 'Kraken', type: 'alien', title: 'Griff aus der Tiefe',
    desc: 'Magnet +2, +20 % Wachstum, +15 % Schrott.',
    colors: { body: '#3a2a7a', belly: '#7fffe0', horn: '#ff6fa8', dark: '#120a30' },
    skill: { id: 'grab', name: 'Tentakelgriff', icon: '🐙', cd: 8, desc: 'Packt die 10 nächsten Objekte bis 130 % deiner Zerstörbarkeit (auch zähe) und zerquetscht sie sofort.' },
    perks: { magnet: 2, absorb: 1.2, scrap: 1.15 }, cost: 1000000, req: { kills: 100000, label: 'Zerstöre insgesamt 100.000 Objekte' } },
  { id: 'mecha', name: 'Mecha-Rex', type: 'golem', title: 'Kampfmaschine',
    desc: '+30 % Schaden, Explosionen ×1,4, Ansturm lädt 20 % schneller.',
    colors: { body: '#8a8d96', belly: '#ffd23f', horn: '#2a2d36', dark: '#1a1c22' },
    skill: { id: 'rockets', name: 'Raketensalve', icon: '🚀', cd: 12, desc: '16 Raketen jagen die größten zerstörbaren Ziele im Sichtfeld (bis 130 %) und sprengen sie samt Umgebung.' },
    perks: { damage: 1.3, boom: 1.4, dash: 0.8 }, cost: 5000000, req: { world: 19, label: 'Erreiche die Sternenschmiede (Welt 20)' } },
  { id: 'phoenix', name: 'Phönix', type: 'dragon', title: 'Aus der Asche',
    desc: '+30 % Wut, +15 % Tempo, +15 % Wachstum. Einmal pro Run: Wiedergeburt mit halber Wut statt Run-Ende.',
    colors: { body: '#ff6a1f', belly: '#ffe46a', horn: '#fff8d0', dark: '#6a1a00' },
    skill: { id: 'phoenixdash', name: 'Phönixfeuer', icon: '🔥', cd: 15, desc: '6 s lang brennt ein Flammenkranz um dich, der alles in der Nähe verbrennt – auch Objekte bis 150 % deiner Zerstörbarkeit. Jede Zerstörung darin gibt Wut zurück.' },
    perks: { rage: 1.3, speed: 1.15, absorb: 1.15 }, cost: 25000000, req: { world: 29, label: 'Erreiche den Zeitwirbel (Welt 30)' } },
  { id: 'infernus', name: 'Infernus', type: 'dragon', title: 'Bezwinger der Hölle',
    desc: 'Die Belohnung für den Sieg über ZORNOS. ×2,5 Schaden, ×1,4 Wachstum, +40 % Wut, Explosionen ×1,5, doppelter Schrott, Berserker +4 s. Gebaut für das, was nach Welt 50 kommt.',
    colors: { body: '#2a0505', belly: '#ff6a1f', horn: '#ffd23f', dark: '#000000' },
    skill: { id: 'hellfire', name: 'Höllenfeuer', icon: '😈', cd: 12, desc: '3 Explosionswellen um dich herum – sprengen auch Objekte, die eigentlich zu groß sind.' },
    perks: { damage: 2.5, absorb: 1.4, rage: 1.4, boom: 1.5, scrap: 2, berserkTime: 4 }, cost: 0, req: { boss: true, label: 'Besiege ZORNOS in Welt 50' }, bossOnly: true },
  // Geheimes Monster: erscheint erst, wenn ALLE Erfolge geschafft sind (der letzte ist der Sieg über ZORNOS)
  { id: 'urzorn', name: 'Urzorn', type: 'monster', title: 'Die Wut vor dem Urknall', secret: true,
    desc: 'Das geheime Ur-Monster – nur für alle, die wirklich alles geschafft haben. ×3 Schaden, ×1,5 Wachstum, +50 % Wut, ×2,5 Schrott, Berserker lädt doppelt.',
    colors: { body: '#160b33', belly: '#ffd23f', horn: '#ffffff', dark: '#000000' },
    skill: { id: 'urfaust', name: 'Urknall-Faust', icon: '🌌', cd: 20, desc: 'Eine Druckwelle über den ganzen Bildschirm: zerstört alles Zerstörbare in Sicht, trifft auch den Boss hart und lädt den Berserker auf.' },
    perks: { damage: 3, absorb: 1.5, rage: 1.5, scrap: 2.5, berserk: 2 }, cost: 0, req: { allAch: true, label: 'Schaffe alle Erfolge' } },
];

// ---------------------------------------------------------------------
// Weitere Karten – eigene Welten am Anfang, später geht es ins All
// ---------------------------------------------------------------------
const WEST = [
  {
    id: 'prairie', name: 'Prärie', minRadius: 0, scrapMult: 1, ground: 'sand',
    bg: '#e3c27a', bg2: '#d6b36a', accent: '#b8954a',
    objects: [
      { name: 'Steppengras', size: 3, shape: 'blade', color: '#c9b26a', value: 1 },
      { name: 'Kieselstein', size: 4, shape: 'rock', color: '#b8a58a', value: 1 },
      { name: 'Kaktus-Spross', size: 4.5, shape: 'cactus', color: '#5aa84a', value: 2 },
      { name: 'Schlange', size: 5.5, shape: 'snake', color: '#8ab04a', value: 2, move: 'wander', speed: 0.5 },
      { name: 'Präriehund', size: 6, shape: 'gopher', color: '#c98a4a', value: 3, move: 'flee', speed: 3 },
      { name: 'Steppenläufer', size: 7, shape: 'tumble', color: '#b8904a', value: 3, move: 'drive', speed: 2.5 },
      { name: 'Wasserfass', size: 8.5, shape: 'barrel', color: '#a0662d', value: 4 },
      { name: 'Dynamitkiste', size: 8.5, shape: 'dynamite', color: '#e23b3b', value: 6, explosive: true },
      { name: 'Geier', size: 9, shape: 'bird', color: '#4a3a3a', value: 5, move: 'flee', speed: 3.2 },
      { name: 'Kaktus', size: 12, shape: 'cactus', color: '#4a9a3a', value: 8, hazard: 12 },
      { name: 'Kuh', size: 13, shape: 'cow', color: '#f4f0e6', value: 9, move: 'flee', speed: 2.2 },
      { name: 'Planwagen', size: 18, shape: 'wagon', color: '#f2ead8', value: 12, move: 'drive', speed: 1.2 },
      { name: 'Windrad', size: 24, shape: 'windmill', color: '#d8d8d8', value: 16 },
      { name: 'Scheune', size: 30, shape: 'barn', color: '#c0392b', value: 22 },
    ],
  },
  {
    id: 'town', name: 'Westernstadt', minRadius: 40, scrapMult: 3, ground: 'town',
    bg: '#d9b67a', bg2: '#8a5a2b', accent: '#6a4220',
    objects: [
      { name: 'Fass', size: 10, shape: 'barrel', color: '#a0662d', value: 1 },
      { name: 'Cowboy', size: 12, shape: 'cowboy', color: '#6a8ac9', value: 3, move: 'flee', speed: 2.8 },
      { name: 'Kaktus', size: 14, shape: 'cactus', color: '#4a9a3a', value: 3 },
      { name: 'Pferd', size: 16, shape: 'horse', color: '#8a5a3a', value: 4, move: 'flee', speed: 3 },
      { name: 'Sheriff', size: 18, shape: 'cowboy', color: '#c9a24a', value: 8, move: 'wander', speed: 1.2, hazard: 15 },
      { name: 'Wassertank', size: 28, shape: 'watertower', color: '#b5733a', value: 6 },
      { name: 'Dynamitlager', size: 30, shape: 'dynamite', color: '#e23b3b', value: 9, explosive: true },
      { name: 'Postkutsche', size: 36, shape: 'wagon', color: '#e8d8b0', value: 10, move: 'drive', speed: 1.6 },
      { name: 'Saloon', size: 60, shape: 'saloon', color: '#c98a4a', value: 16 },
      { name: 'Goldmine', size: 75, shape: 'mine', color: '#a0805a', value: 20 },
      { name: 'Bank', size: 85, shape: 'saloon', color: '#c9b28a', value: 24 },
      { name: 'Dampflok', size: 100, shape: 'train', color: '#3a3a4a', value: 26, move: 'drive', speed: 1.0 },
    ],
  },
  {
    id: 'canyon', name: 'Canyon', minRadius: 160, scrapMult: 9, ground: 'canyon',
    bg: '#d9824a', bg2: '#c96f3a', accent: '#a0522a',
    objects: [
      { name: 'Steinbock', size: 50, shape: 'goat', color: '#d9c8a8', value: 2, move: 'flee', speed: 3 },
      { name: 'Riesenkaktus', size: 60, shape: 'cactus', color: '#4a9a3a', value: 3, hazard: 15 },
      { name: 'Felsbrocken', size: 90, shape: 'rock', color: '#c97a4a', value: 4 },
      { name: 'Totempfahl', size: 110, shape: 'totem', color: '#c98a4a', value: 6 },
      { name: 'Wassertank', size: 120, shape: 'watertower', color: '#b5733a', value: 6 },
      { name: 'Güterzug', size: 160, shape: 'train', color: '#5a3a2a', value: 10, move: 'drive', speed: 1.0 },
      { name: 'Dynamitlager', size: 200, shape: 'dynamite', color: '#e23b3b', value: 12, explosive: true },
      { name: 'Goldmine', size: 220, shape: 'mine', color: '#a0805a', value: 14 },
      { name: 'Mesa', size: 350, shape: 'mesa', color: '#d9824a', value: 22 },
      { name: 'Tafelberg', size: 480, shape: 'mesa', color: '#b85a2a', value: 34 },
    ],
  },
];

const CANDY = [
  {
    id: 'sugarmeadow', name: 'Zuckerwiese', minRadius: 0, scrapMult: 1, ground: 'candy',
    bg: '#ffc2dc', bg2: '#ffb0d2', accent: '#ff8ac0',
    objects: [
      { name: 'Streusel', size: 3, shape: 'sprinkle', color: '#7fd3ff', value: 1 },
      { name: 'Bonbon', size: 4.5, shape: 'candy', color: '#7fd3ff', value: 2 },
      { name: 'Gummibärchen', size: 5.5, shape: 'gummy', color: '#ff4a5a', value: 3, move: 'flee', speed: 3 },
      { name: 'Grünes Gummibärchen', size: 5.5, shape: 'gummy', color: '#5ae07a', value: 3, move: 'flee', speed: 3 },
      { name: 'Lolli', size: 7, shape: 'lolly', color: '#ff5aa8', value: 4 },
      { name: 'Cupcake', size: 8.5, shape: 'cupcake', color: '#ffb3d9', value: 5 },
      { name: 'Brausebombe', size: 8.5, shape: 'bottle', color: '#5a2a1a', value: 6, explosive: true },
      { name: 'Saure Schlange', size: 9, shape: 'snake', color: '#a0f04a', value: 6, move: 'wander', speed: 0.6, hazard: 12 },
      { name: 'Donut', size: 11, shape: 'donut', color: '#ff8ad0', value: 7 },
      { name: 'Zuckerwatte', size: 13, shape: 'cotton', color: '#ffc2e8', value: 9 },
      { name: 'Eiswaffel', size: 15, shape: 'icecream', color: '#b8f0ff', value: 10 },
      { name: 'Lebkuchenhaus', size: 28, shape: 'gingerhouse', color: '#c98a4a', value: 22 },
    ],
  },
  {
    id: 'candytown', name: 'Bonbonstadt', minRadius: 40, scrapMult: 3, ground: 'candytown',
    bg: '#fff0f6', bg2: '#ff9ac8', accent: '#ffffff',
    objects: [
      { name: 'Gummi-Bande', size: 12, shape: 'gummy', color: '#ffb13d', value: 2, move: 'flee', speed: 2.8 },
      { name: 'Riesenlolli', size: 18, shape: 'lolly', color: '#7fd3ff', value: 3 },
      { name: 'Cupcake', size: 22, shape: 'cupcake', color: '#c9a0ff', value: 4 },
      { name: 'Colaflasche', size: 28, shape: 'bottle', color: '#5a2a1a', value: 7, explosive: true },
      { name: 'Zahnarzt', size: 30, shape: 'person', color: '#e8f4ff', value: 10, move: 'wander', speed: 1.4, hazard: 15 },
      { name: 'Eiswagen', size: 36, shape: 'car', color: '#ffb3d9', value: 9, move: 'drive', speed: 1.6 },
      { name: 'Donut', size: 40, shape: 'donut', color: '#ffd23f', value: 8 },
      { name: 'Torte', size: 55, shape: 'cake', color: '#ff8ad0', value: 14 },
      { name: 'Lebkuchenhaus', size: 70, shape: 'gingerhouse', color: '#c98a4a', value: 18 },
      { name: 'Schokobrunnen', size: 90, shape: 'fountain', color: '#6a3a1a', value: 22 },
      { name: 'Zuckerturm', size: 130, shape: 'tower', color: '#ff9ad0', value: 30 },
    ],
  },
  {
    id: 'choco', name: 'Schokogebirge', minRadius: 160, scrapMult: 9, ground: 'choco',
    bg: '#8a5a3a', bg2: '#7a4e32', accent: '#a06a44',
    objects: [
      { name: 'Zuckerstange', size: 60, shape: 'candycane', color: '#e23b3b', value: 2 },
      { name: 'Gummibär-Riese', size: 80, shape: 'gummy', color: '#ff4a5a', value: 4, move: 'flee', speed: 2.6 },
      { name: 'Waffelfelsen', size: 100, shape: 'rock', color: '#e8b06a', value: 4 },
      { name: 'Hochzeitstorte', size: 140, shape: 'cake', color: '#fff0f6', value: 8 },
      { name: 'Karamell-Lager', size: 150, shape: 'gastank', color: '#c98a3d', value: 9, explosive: true },
      { name: 'Schokobrunnen', size: 200, shape: 'fountain', color: '#6a3a1a', value: 12 },
      { name: 'Lebkuchendorf', size: 260, shape: 'village', color: '#c98a4a', value: 14 },
      { name: 'Schokoberg', size: 400, shape: 'mountain', color: '#6a3a1a', value: 22 },
      { name: 'Karamellvulkan', size: 520, shape: 'volcano', color: '#8a4a1a', value: 30, explosive: true },
    ],
  },
];

// ---------------------------------------------------------------------
// EASTER EGG: Karte „420“ – eine einzige Welt nach dem Sieg über ZORNOS.
// Ziel: in EINEM Run 420 goldene Hanfblätter sammeln, dann die Mutterpflanze umhauen.
// Startet auf Höllen-Niveau (levelBase 49) und ist 5× zäher.
// ---------------------------------------------------------------------
export const GOAL420 = { leaves: 420, leafRage: 0.06, leafAlive: 6, leafEvery: 0.4, noLate: true, motherHits: 90, rewardDM: 1500, rewardChaos: 5000000 };
const WEED_WORLD = {
  id: 'w420', name: 'Hanfplantage 420', minRadius: 10, scrapMult: Math.pow(3, 49), ground: 'dimension', theme: 'hemp',
  bg: '#16300f', bg2: '#244a18', accent: '#7fe07f', pal: ['#16300f', '#244a18', '#7fe07f', '#2f5a1f', '#4f9e4a', '#c9f0a0'], evo: 'Grüner Zorn',
  objects: [
    { name: 'Weed-Blatt', size: 2.5, shape: 'leaf', color: '#4fa84a', value: 1 },
    { name: 'Zucker', size: 3.2, shape: 'sugar', color: '#ffffff', value: 2 },
    { name: 'Clipper', size: 3.8, shape: 'lighter', color: '#ff4a7a', value: 2 },
    { name: 'Clipper', size: 3.8, shape: 'lighter', color: '#3ad0ff', value: 2 },
    { name: 'Handy', size: 4.5, shape: 'phone', color: '#3a8ad8', value: 3 },
    { name: 'Raupe', size: 5, shape: 'snake', color: '#7fe07f', value: 3, move: 'flee', speed: 3 },
    { name: 'Snacktüte', size: 5.5, shape: 'chips', color: '#e0342a', value: 3 },
    { name: 'Pizzastück', size: 6.5, shape: 'pizza', color: '#f0c060', value: 4 },
    { name: 'Lavalampe', size: 8, shape: 'lavalamp', color: '#7fe07f', value: 5 },
    { name: 'Gaskartusche', size: 8, shape: 'tank', color: '#ff6a1f', value: 6, explosive: true },
    { name: 'Hanfpflanze', size: 10, shape: 'weed', color: '#4fa84a', value: 6 },
    { name: 'Sitzsack', size: 12, shape: 'beanbag', color: '#b06bff', value: 8 },
    { name: 'Rauchring', size: 13, shape: 'smokering', color: '#c9f0a0', value: 9, move: 'flee', speed: 1.6 },
    { name: 'Razzia', size: 14, shape: 'police', color: '#2a4a8a', value: 10, move: 'wander', speed: 0.9, hazard: 14 },
    { name: 'Grow-Zelt', size: 16, shape: 'growtent', color: '#b06bff', value: 11 },
    { name: 'Discokugel', size: 16, shape: 'discoball', color: '#c8d0e0', value: 10 },
    { name: 'Hippie-Bus', size: 22, shape: 'bus', color: '#e09a2a', value: 14, move: 'drive', speed: 1.1 },
    { name: 'Grow-Haus', size: 26, shape: 'greenhouse', color: '#4fa84a', value: 18 },
  ],
};

export const MAPS = [
  { id: 'suburb', name: 'Vorstadt', icon: '🏡', worlds: WORLDS,
    desc: 'Vom Gartenzwerg bis zur Galaxie. Hier fängt jede Wut an.',
    scrapMult: 1, hpMult: 1, drainMult: 1, chaosMult: 1, req: null },
  { id: 'west', name: 'Wilder Westen', icon: '🌵', worlds: [...WEST, ...WORLDS.slice(3)],
    desc: 'Prärie, Westernstadt, Canyon. Sheriffs und Kakteen wehren sich. Härter, aber viel lukrativer.',
    scrapMult: 6, hpMult: 2.2, drainMult: 1.1, chaosMult: 2, req: { world: 3, label: 'Erreiche das Gebirge' } },
  { id: 'candy', name: 'Zuckerland', icon: '🍭', worlds: [...CANDY, ...WORLDS.slice(3)],
    desc: 'Gummibärchen, Torten, Schokoberge. Süß aussehend, brutal schwer – und extrem viel Beute.',
    scrapMult: 36, hpMult: 5.5, drainMult: 1.2, chaosMult: 4, req: { world: 5, label: 'Erreiche den Erdorbit' } },
  { id: '420', name: '420', icon: '🌿', worlds: [WEED_WORLD], secret: true, goal: GOAL420, levelBase: 49,
    desc: 'Geheime Easter-Egg-Karte. Nur eine Welt – aber was für eine: Sammle in EINEM Run 420 goldene Hanfblätter, dann hau die Mutterpflanze „Mary Jane“ um. 5× zäher als alles davor.',
    scrapMult: 5, hpMult: 5, drainMult: 2.2, chaosMult: 8, req: { boss: true, label: 'Geheim – besiege ZORNOS' } },
];

// ---------------------------------------------------------------------
// URKNALL (Prestige): alles sprengen, dafür ◆ Dunkle Materie bekommen
// ---------------------------------------------------------------------
export const PRESTIGE = {
  minWorld: 4,          // ab welcher Welt (in diesem Durchgang) der Urknall möglich ist (4 = Kontinent)
  logBase: 5,           // ◆ = floor( (log10(Schrott seit letztem Urknall) − logBase)² × Weltbonus )
  worldBonus: 0.15,     // +15 % ◆ pro Welt über minWorld
  gainMult: 1.5,        // v0.9.0: ◆ ×1,5 (zusammen mit flacheren Masterplan-Kosten: Weg zu ZORNOS ~215 → ~128 Runs im Bot-Test)
  // Was bleibt: Chaos, Monster, Karten, Rekorde. Was weg ist: Schrott und Upgrades.
};

// Der Böse Masterplan – permanente Boni, gekauft mit ◆ Dunkler Materie
export const DM_PERKS = [
  { id: 'dm_scrap',  name: 'Schwarzgeld',   icon: '💸', desc: '+20 % Schrott pro Stufe (multiplikativ, für immer).', base: 1, growth: 1.19, max: 200, per: 0.2, mult: true },
  { id: 'dm_power',  name: 'Wutkern',       icon: '❤️‍🔥', desc: '+10 % Schaden pro Stufe (multiplikativ).',          base: 1, growth: 1.19, max: 200, per: 0.1, mult: true },
  { id: 'dm_growth', name: 'Mutagen',       icon: '🧪', desc: '+5 % Wachstum pro Stufe (multiplikativ).',            base: 2, growth: 1.18, max: 150, per: 0.05, mult: true },
  { id: 'dm_rage',   name: 'Ewiger Zorn',   icon: '🌋', desc: '+5 % Wut-Tank pro Stufe (multiplikativ).',            base: 1, growth: 1.26, max: 30,  per: 0.05, mult: true },
  { id: 'dm_start',  name: 'Frühstart',     icon: '🚀', desc: '+10 % Startgröße pro Stufe (multiplikativ).',         base: 2, growth: 1.225, max: 60,  per: 0.1, mult: true },
  { id: 'dm_chaos',  name: 'Chaostheorie',  icon: '🌀', desc: '+10 % ☠ Chaos pro Stufe (multiplikativ).',            base: 1, growth: 1.18, max: 150, per: 0.1, mult: true },
  { id: 'dm_mut',    name: 'Genlabor',      icon: '🧬', desc: 'Starte jeden Run mit einer zufälligen Mutation (pro Stufe eine mehr).', base: 5, growth: 3, max: 3, per: 1 },
  { id: 'dm_boss',   name: 'Höllenjäger',   icon: '😈', desc: 'Nur gegen ZORNOS: +5 % Schaden und −2 % erlittener Schaden pro Stufe.', base: 3, growth: 1.4, max: 20, per: 0.05, guard: 0.02 },
  { id: 'dm_keep',   name: 'Schurken-Erbe', icon: '👑', desc: 'Nach dem Urknall behältst du 10 % deiner Upgrade-Stufen pro Stufe.', base: 4, growth: 2.2, max: 5, per: 0.1 },
];

// ---------------------------------------------------------------------
// ERFOLGE – jede Stufe bringt ☠ Chaos. stat: Wert aus der Statistik.
// ---------------------------------------------------------------------
const ach = (id, name, icon, stat, steps, rewards, desc) => steps.map((goal, i) => ({ id: `${id}${i + 1}`, group: id, name: `${name} ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i]}`, icon, stat, goal, reward: rewards[i], desc: desc(goal) }));
const de = n => n.toLocaleString('de-DE');
export const ACHIEVEMENTS = [
  ...ach('kills', 'Zerstörer', '💥', 'kills', [100, 1000, 10000, 100000, 500000], [100, 500, 2500, 15000, 100000], g => `Zerstöre insgesamt ${de(g)} Objekte`),
  ...ach('world', 'Weltenwanderer', '🗺', 'maxWorld', [1, 4, 7, 11, 19, 29, 39, 49], [100, 800, 4000, 20000, 100000, 400000, 1500000, 5000000], g => `Erreiche Welt ${g + 1}`),
  ...ach('combo', 'Kombo-König', '⛓', 'bestCombo', [20, 50, 100, 200], [200, 1500, 8000, 40000], g => `Schaffe eine ${g}er-Kombo`),
  ...ach('golden', 'Goldjäger', '✨', 'golden', [10, 100, 1000], [300, 3000, 30000], g => `Zerstöre ${de(g)} goldene Objekte`),
  ...ach('crates', 'Kistenknacker', '📦', 'crates', [10, 100, 1000], [300, 3000, 30000], g => `Knacke ${de(g)} Schrottkisten`),
  ...ach('booms', 'Kettenreaktion', '🧨', 'explosions', [50, 500, 5000], [300, 3000, 30000], g => `Lass ${de(g)} Explosionen hochgehen`),
  ...ach('berserk', 'Berserker', '😡', 'berserks', [10, 100, 1000], [300, 3000, 30000], g => `Zünde ${de(g)}-mal den Berserker`),
  ...ach('skills', 'Spezialist', '🎯', 'skills', [25, 250, 2500], [300, 3000, 30000], g => `Setze ${de(g)}-mal einen Monster-Skill (F) ein`),
  ...ach('quests', 'Auftragskiller', '📜', 'quests', [10, 100, 1000], [300, 3000, 30000], g => `Erfülle ${de(g)} Aufträge`),
  ...ach('runs', 'Dauerwüter', '🔁', 'runs', [10, 100, 250], [200, 2000, 20000], g => `Spiele ${de(g)} Runs`),
  ...ach('bang', 'Urknall', '💥', 'prestiges', [1, 3, 8, 15], [1000, 10000, 100000, 1000000], g => `Löse ${g}-mal den Urknall aus`),
  ...ach('monsters', 'Monstersammler', '👹', 'monsters', [3, 6, 10], [2000, 50000, 2000000], g => `Besitze ${g} Monster`),
  ...ach('rich', 'Neureich', '🥈', 'bestTier', [1, 2, 3, 4], [20000, 500000, 5000000, 50000000], g => `Erreiche ${['', 'Platin', 'Diamant', 'Plasma', 'Sternenstaub'][g]}`),
  ...ach('evo', 'Evolutionär', '🧬', 'evos', [1, 3, 6], [5000, 100000, 2000000], g => `Entwickle ${g} Fähigkeit${g === 1 ? '' : 'en'} weiter`),
  { id: 'maps1', group: 'maps', name: 'Kartograf', icon: '🌍', stat: 'maps', goal: 3, reward: 50000, desc: 'Spiele auf allen 3 Karten' },
  { id: 'long1', group: 'long', name: 'Zähe Wut', icon: '⏱', stat: 'longestRun', goal: 180, reward: 5000, desc: 'Überlebe einen Run 3 Minuten lang' },
  ...ach('skins', 'Glanzstück', '✨', 'skinTier', [1, 2, 3, 4], [20000, 2000000, 50000000, 500000000], g => `Kaufe einen ${['', 'Silber', 'Gold', 'Platin', 'Gott'][g]}-Skin`),
  { id: 'w4201', group: 'w420', name: 'Grüner Daumen', icon: '🌿', stat: 'won420', goal: 1, reward: 20000000, desc: 'Schaffe die geheime Karte 420' },
  { id: 'boss1', group: 'boss', name: 'Höllenbezwinger', icon: '😈', stat: 'bossKills', goal: 1, reward: 10000000, desc: 'Besiege ZORNOS, den Höllenfürsten, in Welt 50' },
];
