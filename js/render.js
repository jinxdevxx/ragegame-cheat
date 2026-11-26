// =====================================================================
//  RAGEVERSE – Zeichnen (Canvas 2D)
//  Reihenfolge: Boden → Trümmer-Flecken → Schatten/Objekte/Monster
//  (nach Tiefe sortiert) → Trümmer → Münzen → Effekte → Overlays
// =====================================================================
import { SPRITES, OUT } from './sprites.js?v=0.8.7';
import { drawMonster } from './monster.js?v=0.8.7';
import { shadeHex as sh, shadeHex } from './game.js?v=0.8.7';

const TAU = Math.PI * 2;
const STARS = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.8 + 0.4, p: Math.random() * 0.6 + 0.1, tw: Math.random() * 6 }));
const hash = (x, y, k = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return h - Math.floor(h); };

// ---------------------------------------------------------------------
// Boden: feste Landschaften je Welt. Die Landschaft liegt fest in der
// Welt (Maßstab S = Start-Größe der Welt) – wächst du, schrumpft sie unter dir.
// ---------------------------------------------------------------------
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, seed) => vnoise(x, y, seed) * 0.62 + vnoise(x * 2.7, y * 2.7, seed + 7) * 0.28 + vnoise(x * 6.1, y * 6.1, seed + 13) * 0.1;

function drawGround(c, g, W, H, sx, sy, z, world, time) {
  const cam = g.cam;
  let S = Math.max(10, world.minRadius);
  // Ein-Welt-Karten (420): Bodenmaßstab wächst in 4er-Schritten mit, sonst wird das Muster riesig oder winzig
  if (g.map && g.map.goal && g.p) S = Math.max(10, Math.pow(4, Math.floor(Math.log(Math.max(10, g.p.r * 0.7)) / Math.log(4))));
  const v = { x0: cam.x - W / 2 / z - S, x1: cam.x + W / 2 / z + S, y0: cam.y - H / 2 / z - S, y1: cam.y + H / 2 / z + S };
  const ctx = { c, g, W, H, sx, sy, z, world, time, S, v, px: w => w * z };
  c.fillStyle = world.bg; c.fillRect(0, 0, W, H);
  const fn = GROUNDS[world.ground] || GROUNDS.lawn;
  fn(ctx);
}

// Zellen eines Rasters (Weltmaßstab) im Sichtbereich durchlaufen
function cells(v, C, cb) {
  const x0 = Math.floor(v.x0 / C), x1 = Math.ceil(v.x1 / C), y0 = Math.floor(v.y0 / C), y1 = Math.ceil(v.y1 / C);
  if ((x1 - x0) * (y1 - y0) > 6000) return;
  for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) cb(ix, iy);
}
// Gelände aus Rauschen: farbige Flecken je Höhenstufe (adaptives Raster, feste Formen)
function terrain(k, scale, seed, layers) {
  // Glatte Höhenlinien per Marching Squares: Rauschwerte an Gitterpunkten,
  // jede Höhenstufe wird als geschlossene, interpolierte Fläche gefüllt.
  const { c, z, sx, sy, v } = k;
  let C = 16 / z;
  while (((v.x1 - v.x0) / C) * ((v.y1 - v.y0) / C) > 9000) C *= 1.5;
  const x0 = Math.floor(v.x0 / C), y0 = Math.floor(v.y0 / C);
  const nx = Math.ceil(v.x1 / C) - x0 + 1, ny = Math.ceil(v.y1 / C) - y0 + 1;
  const PF = typeof window !== 'undefined' && window.__prof, t0 = PF ? performance.now() : 0;
  const val = new Float32Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) val[j * (nx + 1) + i] = fbm((x0 + i) * C / scale, (y0 + j) * C / scale, seed);
  const P = (i, j) => [sx((x0 + i) * C), sy((y0 + j) * C)];
  if (PF) { PF.t_noise = (PF.t_noise || 0) + performance.now() - t0; PF.t_cells = (PF.t_cells || 0) + nx * ny; PF.t_calls = (PF.t_calls || 0) + 1; }
  for (const L of layers) {
    const g = L.t2 !== undefined ? n => L.t2 - n : n => n - L.t;
    // Volle Zellen werden pro Zeile zu Streifen zusammengefasst (wenige Rechtecke statt tausender Pfade),
    // nur die Randzellen bekommen die interpolierte Kontur.
    const runs = [], edges = [];
    for (let j = 0; j < ny; j++) {
      let runStart = -1;
      for (let i = 0; i <= nx; i++) {
        let full = false, vs = null;
        if (i < nx) {
          vs = [g(val[j * (nx + 1) + i]), g(val[j * (nx + 1) + i + 1]), g(val[(j + 1) * (nx + 1) + i + 1]), g(val[(j + 1) * (nx + 1) + i])];
          full = vs[0] >= 0 && vs[1] >= 0 && vs[2] >= 0 && vs[3] >= 0;
        }
        if (full) { if (runStart < 0) runStart = i; continue; }
        if (runStart >= 0) { runs.push([runStart, i, j]); runStart = -1; }
        if (!vs || (vs[0] < 0 && vs[1] < 0 && vs[2] < 0 && vs[3] < 0)) continue;
        const corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = [];
        for (let e = 0; e < 4; e++) {
          const a2 = vs[e], b2 = vs[(e + 1) % 4], pa = P(...corners[e]), pb = P(...corners[(e + 1) % 4]);
          if (a2 >= 0) pts.push(pa);
          if ((a2 >= 0) !== (b2 >= 0)) { const t = a2 / (a2 - b2); pts.push([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]); }
        }
        edges.push(pts);
      }
    }
    const draw = (dx, dy, col) => {
      c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1;
      c.beginPath();
      for (const [i0, i1, j] of runs) { const [ax, ay] = P(i0, j), [bx, by] = P(i1, j + 1); c.rect(ax + dx - 0.5, ay + dy - 0.5, bx - ax + 1, by - ay + 1); }
      c.fill();
      c.beginPath();
      for (const pts of edges) { c.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let q = 1; q < pts.length; q++) c.lineTo(pts[q][0] + dx, pts[q][1] + dy); c.closePath(); }
      c.fill(); c.stroke(); // schließt Haarlinien zwischen den Randzellen
    };
    if (L.rim) draw(0, Math.max(2, C * z * 0.35), L.rim);
    draw(0, 0, L.color);
  }
  if (PF) PF.t_total = (PF.t_total || 0) + performance.now() - t0;
}

// Teure Landschaften einmal vorzeichnen und wiederverwenden (bis man sich weit bewegt oder stark wächst)
const groundCache = {};
let lastGroundBuild = 0;
function cached(k, key, painter, fullRes = false) {
  const { c, z, g, W, H, sx, sy } = k;
  const cam = g.cam;
  key = key + ':' + (g.map ? g.map.id : '') + ':' + g.world;
  let t = groundCache[key];
  const vx0 = cam.x - W / 2 / z, vx1 = cam.x + W / 2 / z, vy0 = cam.y - H / 2 / z, vy1 = cam.y + H / 2 / z;
  // Rauszoomen (Wachsen): altes Bild wird nur verkleinert – erst neu rechnen, wenn es zu klein wird oder der Rand erreicht ist.
  // Reinzoomen: ab 25 % neu rechnen, sonst wird es unscharf.
  const now = performance.now();
  // grob gerechnetes Bild nach 1,5 s Ruhe einmal scharf nachrechnen
  const sharpen = t && t.low && now - t.at > 1500 && now - lastGroundBuild > 1500;
  const stale = !t || sharpen || z / t.z > 1.25 || z / t.z < 0.45 || vx0 < t.x0 || vx1 > t.x1 || vy0 < t.y0 || vy1 > t.y1;
  if (stale && (!t || sharpen || now - (t.at || 0) > 300 || vx0 < t.x0 - (t.x1 - t.x0) || vy0 < t.y0 - (t.y1 - t.y0))) {
    for (const k2 of Object.keys(groundCache)) if (k2 !== key) delete groundCache[k2];
    const fast = !sharpen && now - lastGroundBuild < 2500; // schnelles Wachstum / Weltwechsel: gröber rechnen, dafür flüssig
    const growing = g.p && g.p.r > (t ? t.r || 0 : 0) * 1.01;
    // beim Wachsen großzügig im Voraus rechnen (deckt ~1,6× weiteres Rauszoomen ab)
    const span = growing ? 0.8 : 0.45, mx = W / z * span, my = H / z * span;
    const RES = fullRes ? (fast ? 0.7 : 1) : fast ? 0.45 : 0.7; // fullRes: billiger Maler → 1:1, dann muss pro Bild nichts skaliert werden
    t = t || { cv: document.createElement('canvas') };
    t.at = now; t.low = fast; lastGroundBuild = now; t.z = z; t.r = g.p ? g.p.r : 0; t.x0 = vx0 - mx; t.x1 = vx1 + mx; t.y0 = vy0 - my; t.y1 = vy1 + my;
    const zz = z * RES * (fullRes ? Math.min(2, c.getTransform().a || 1) : 1); // fullRes: in Geräte-Pixeln (Retina scharf)
    t.cv.width = Math.ceil((t.x1 - t.x0) * zz); t.cv.height = Math.ceil((t.y1 - t.y0) * zz);
    const oc = t.cv.getContext('2d');
    oc.clearRect(0, 0, t.cv.width, t.cv.height); // transparent: liegt über dem Boden
    painter({ ...k, c: oc, z: zz, W: t.cv.width, H: t.cv.height, sx: x => (x - t.x0) * zz, sy: y => (y - t.y0) * zz,
      v: { x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1 } });
    groundCache[key] = t;
  }
  c.imageSmoothingEnabled = true;
  const tf = c.getTransform(), dw = (t.x1 - t.x0) * z * tf.a;
  if (Math.abs(dw - t.cv.width) < 1) { // 1:1 → pixelgenau kopieren (keine Filterung, sehr billig)
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(t.cv, Math.round(sx(t.x0) * tf.a + tf.e), Math.round(sy(t.y0) * tf.d + tf.f)); c.restore();
  } else c.drawImage(t.cv, sx(t.x0), sy(t.y0), (t.x1 - t.x0) * z, (t.y1 - t.y0) * z);
}
const circle = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
// Baum von oben (Krone mit Schatten)
function treeTop(c, x, y, r, col, dark) {
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x + r * 0.25, y + r * 0.3, r, r * 0.85, 0, 0, TAU); c.fill();
  circle(c, x, y, r, dark); circle(c, x - r * 0.12, y - r * 0.12, r * 0.82, col);
  circle(c, x - r * 0.35, y - r * 0.35, r * 0.28, 'rgba(255,255,255,0.18)');
}
function pineTop(c, x, y, r, col) { // Deko-Tanne: flach, ohne Schatten (Objekte haben Schatten + Umriss)
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 0.55 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.fill(); circle(c, x, y, r * 0.3, 'rgba(255,255,255,0.12)');
}

// Straßenraster (Vorstadt, Stadt, Westernstadt, Bonbonstadt)
function streetGrid(k, o) {
  const { c, sx, sy, z, v, S } = k;
  const B = S * o.block, Rw = S * o.road, sw = S * o.walk;
  const bx0 = Math.floor(v.x0 / B), bx1 = Math.ceil(v.x1 / B), by0 = Math.floor(v.y0 / B), by1 = Math.ceil(v.y1 / B);
  c.fillStyle = o.asphalt; c.fillRect(0, 0, k.W, k.H);
  for (let ix = bx0; ix <= bx1; ix++) for (let iy = by0; iy <= by1; iy++) {
    const x = ix * B + Rw / 2, y = iy * B + Rw / 2, w = B - Rw;
    // Bordstein + Gehweg
    c.fillStyle = o.curb; c.fillRect(sx(x) - 1, sy(y) - 1, w * z + 2, w * z + 2);
    c.fillStyle = o.walkCol; c.fillRect(sx(x + S * 0.08), sy(y + S * 0.08), (w - S * 0.16) * z, (w - S * 0.16) * z);
    if (sw * z > 6) { // Gehwegplatten
      c.strokeStyle = 'rgba(0,0,0,0.07)'; c.lineWidth = 1; c.beginPath();
      for (let t = x; t < x + w; t += sw) { c.moveTo(sx(t), sy(y)); c.lineTo(sx(t), sy(y + sw)); c.moveTo(sx(t), sy(y + w - sw)); c.lineTo(sx(t), sy(y + w)); }
      c.stroke();
    }
    o.lot(k, x + sw, y + sw, w - sw * 2, hash(ix, iy, 3), ix, iy);
  }
  // Markierungen
  const lw = Math.max(1.5, S * 0.12 * z);
  c.lineWidth = lw;
  if (o.center) {
    c.strokeStyle = o.center; c.setLineDash([S * 0.7 * z, S * 0.6 * z]); c.beginPath();
    for (let ix = bx0; ix <= bx1; ix++) { const x = ix * B; for (let iy = by0; iy <= by1; iy++) { c.moveTo(sx(x), sy(iy * B + Rw / 2)); c.lineTo(sx(x), sy((iy + 1) * B - Rw / 2)); } }
    for (let iy = by0; iy <= by1; iy++) { const y = iy * B; for (let ix = bx0; ix <= bx1; ix++) { c.moveTo(sx(ix * B + Rw / 2), sy(y)); c.lineTo(sx((ix + 1) * B - Rw / 2), sy(y)); } }
    c.stroke(); c.setLineDash([]);
  }
  if (o.lanes) {
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.setLineDash([S * 0.5 * z, S * 0.7 * z]); c.beginPath();
    for (const off of [-Rw / 4, Rw / 4]) {
      for (let ix = bx0; ix <= bx1; ix++) for (let iy = by0; iy <= by1; iy++) { c.moveTo(sx(ix * B + off), sy(iy * B + Rw / 2)); c.lineTo(sx(ix * B + off), sy((iy + 1) * B - Rw / 2)); }
      for (let iy = by0; iy <= by1; iy++) for (let ix = bx0; ix <= bx1; ix++) { c.moveTo(sx(ix * B + Rw / 2), sy(iy * B + off)); c.lineTo(sx((ix + 1) * B - Rw / 2), sy(iy * B + off)); }
    }
    c.stroke(); c.setLineDash([]);
  }
  // Zebrastreifen an Kreuzungen
  if (o.zebra && Rw * z > 30) {
    c.fillStyle = o.zebra;
    const st = Rw / 9;
    for (let ix = bx0; ix <= bx1; ix++) for (let iy = by0; iy <= by1; iy++) {
      const cx = ix * B, cy = iy * B;
      for (let i = 0; i < 4; i++) {
        const t = -Rw / 2 + st * (1 + i * 2);
        c.fillRect(sx(cx + t), sy(cy - Rw / 2 - S * 0.9), st * z, S * 0.7 * z);
        c.fillRect(sx(cx + t), sy(cy + Rw / 2 + S * 0.2), st * z, S * 0.7 * z);
        c.fillRect(sx(cx - Rw / 2 - S * 0.9), sy(cy + t), S * 0.7 * z, st * z);
        c.fillRect(sx(cx + Rw / 2 + S * 0.2), sy(cy + t), S * 0.7 * z, st * z);
      }
    }
  }
}


// =====================================================================
// Dimensions-Böden: je Thema eigene, flache Landschaft (Deko ohne Umriss/Schatten,
// damit zerstörbare Objekte klar herausstechen). Wird im Bodencache gezeichnet.
// =====================================================================
function scatter(kk, C, prob, key, fn) { // verstreute Deko im Weltraster C
  const u = kk.z;
  cells(kk.v, C, (ix, iy) => {
    if (hash(ix, iy, key) > prob) return;
    const x = (ix + hash(ix, iy, key + 1)) * C, y = (iy + hash(iy, ix, key + 2)) * C;
    fn(kk.sx(x), kk.sy(y), C * u, hash(ix, iy, key + 3), x, y);
  });
}
const A = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function gearShape(c, X, Y, r, teeth, rot) { c.beginPath(); for (let i = 0; i < teeth * 2; i++) { const a = rot + i / (teeth * 2) * TAU, rr = i % 2 ? r * 0.8 : r; c.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } c.closePath(); }
function wavyLine(c, X, Y, w, amp, n) { c.beginPath(); for (let i = 0; i <= n; i++) { const x = X - w / 2 + i / n * w; c.lineTo(x, Y + Math.sin(i / n * TAU * 2) * amp); } c.stroke(); }

// =====================================================================
// Karte 420: Plantage im Abendlicht. Die Landschaft wird EINMAL als nahtlose
// Kachel (1024 px) gemalt und dann nur als Muster über den Boden gelegt –
// zwei Größenstufen blenden beim Wachsen weich ineinander. Pro Frame: 2 Musterflächen,
// ein paar Rauchwolken-Bilder und Glühwürmchen. Keine Neuaufbau-Spitzen.
// =====================================================================
let tile420 = null, smoke420 = null;
// Kachel vorab im Menü bauen (sonst ~100 ms Ruckler beim ersten Bild auf Karte 420)
export function prewarm420() { if (!tile420) { tile420 = make420Tile(); smoke420 = makeSmoke(); } }
function make420Tile() {
  const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  let sd = 4207; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const wrap = (fn) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { c.save(); c.translate(dx, dy); fn(); c.restore(); } };
  // sattes Gras mit Struktur
  c.fillStyle = '#3d8a2c'; c.fillRect(0, 0, N, N);
  for (let i = 0; i < 1400; i++) { const x = rnd() * N, y = rnd() * N, r = 4 + rnd() * 16, col = rnd() < 0.5 ? 'rgba(90,170,60,0.35)' : 'rgba(30,80,20,0.3)'; wrap(() => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * 0.6, rnd() * 3, 0, TAU); c.fill(); }); }
  // Erdwege (horizontal) mit Kieseln und Blättern
  const rows = [0, 256, 512, 768];
  for (const y0 of rows) {
    const gy = y0 + 18, h = 86;
    c.fillStyle = '#7a4a2c'; c.fillRect(0, gy, N, h); c.fillStyle = '#946038'; c.fillRect(0, gy + 6, N, h - 12);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, gy, N, 6); c.fillStyle = 'rgba(255,230,190,0.12)'; c.fillRect(0, gy + h - 8, N, 4);
    for (let i = 0; i < 70; i++) { const x = rnd() * N, y = gy + 10 + rnd() * (h - 20); c.fillStyle = rnd() < 0.5 ? '#b08a64' : '#5e3a22'; c.beginPath(); c.ellipse(x, y, 2 + rnd() * 4, 1.5 + rnd() * 2.5, rnd() * 3, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { const x = rnd() * N, y = gy + 14 + rnd() * (h - 28); wrap(() => hempLeaf(c, x, y, 14 + rnd() * 8, rnd() * TAU, 'rgba(70,140,40,0.85)', 'rgba(170,220,120,0.5)')); }
    for (let x = 0; x < N; x += 9) { const hh = 6 + rnd() * 9; c.strokeStyle = 'rgba(40,110,30,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, gy + 1); c.lineTo(x + 2, gy - hh); c.stroke(); c.beginPath(); c.moveTo(x + 4, gy + h - 1); c.lineTo(x + 2, gy + h + hh * 0.6); c.stroke(); }
  }
  // Pflanzenreihen: zwei Reihen zwischen den Wegen, versetzt
  for (const y0 of rows) for (let x = (y0 / 256) % 2 ? 85 : 0; x < N + 85; x += 170) {
    const X = x + (rnd() - 0.5) * 14, Y = y0 + 186 + (rnd() - 0.5) * 8, u = 128 + rnd() * 18, sdd = rnd();
    wrap(() => hempPlant(c, X, Y + u * 0.15, u * 1.15, sdd));
  }
  c.fillStyle = 'rgba(255,190,90,0.07)'; c.fillRect(0, 0, N, N); // warmes Abendlicht direkt eingebacken (kein Vollbild-Verlauf pro Bild)
  return cv;
}
function makeSmoke() {
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  for (const [x, y, r] of [[128, 140, 90], [80, 120, 60], [175, 115, 66], [120, 90, 58]]) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(240,255,235,0.5)'); g.addColorStop(1, 'rgba(240,255,235,0)'); c.fillStyle = g; c.fillRect(0, 0, N, N); }
  return cv;
}
function draw420(k) {
  const { c, W, H, g, time } = k;
  if (!tile420) { tile420 = make420Tile(); smoke420 = makeSmoke(); }
  const r = Math.max(10, g.p ? g.p.r : 10), lg = Math.log(r) / Math.log(4), step = Math.floor(lg), frac = lg - step;
  c.fillStyle = '#3d8a2c'; c.fillRect(0, 0, W, H);
  // Performance: das skalierte Kachelmuster wird NICHT mehr in jedem Bild über den ganzen Bildschirm gefiltert
  // (auf Retina ~60 ms/Bild), sondern wie bei allen anderen Karten nur beim Neuaufbau in den Boden-Zwischenspeicher gemalt.
  const bl = Math.max(0, (frac - 0.8) / 0.2), mix = bl * bl * (3 - 2 * bl);
  cached(k, 'w420:' + step + ':' + (mix > 0.5 ? 1 : 0), kk => {
    const oc = kk.c, ox = kk.sx(0), oy = kk.sy(0);
    oc.fillStyle = '#3d8a2c'; oc.fillRect(0, 0, kk.W, kk.H);
    for (const [st, a] of [[step, 1 - mix], [step + 1, mix]]) {
      if (a < 0.02) continue;
      const S = Math.pow(4, st) * 0.8, tw = S * 40 * kk.z, pat = oc.createPattern(tile420, 'repeat');
      pat.setTransform(new DOMMatrix([tw / 1024, 0, 0, tw / 1024, ox % tw, oy % tw]));
      oc.globalAlpha = a; oc.fillStyle = pat; oc.fillRect(0, 0, kk.W, kk.H);
    }
    oc.globalAlpha = 1;
  });
  // Rauchwolken (fertige Bilder) ziehen langsam vorbei – 3 statt 6, kleiner
  for (let i = 0; i < 3; i++) { const t = time * 0.025 + i * 0.37, x = ((t + i * 0.27) % 1.3 - 0.15) * W, y = (0.2 + ((i * 0.31) % 0.7)) * H + Math.sin(time * 0.3 + i) * 20, sz = Math.min(W, H) * (0.4 + (i % 2) * 0.15);
    c.globalAlpha = 0.16; c.drawImage(smoke420, x - sz / 2, y - sz / 2, sz, sz); }
  c.globalAlpha = 1;
  // Glühwürmchen (klein, billig)
  for (let i = 0; i < 18; i++) { const ph = time * 0.4 + i * 1.7, x = ((Math.sin(i * 12.9) * 0.5 + 0.5) * W + Math.sin(ph) * 40) % W, y = ((Math.cos(i * 7.3) * 0.5 + 0.5) * H + Math.cos(ph * 0.8) * 30) % H, a = 0.4 + 0.6 * Math.max(0, Math.sin(time * 2 + i));
    c.fillStyle = `rgba(255,240,140,${a * 0.25})`; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.fillStyle = `rgba(255,250,200,${a})`; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); }
}

// Hanfblatt für die Boden-Deko (ohne Umriss): 7 schmale, spitze, gezackte Fiederblätter mit heller Mittelrippe
function hempLeaflet(c, X, Y, L, W, ang) {
  const ca = Math.cos(ang), sa = Math.sin(ang), n = 9, pts = [];
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i <= n; i++) {
    const k = side < 0 ? i : n - i, t = k / n, w = W * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.9) * (k % 2 ? 1.18 : 0.82); // Zacken
    pts.push([t * L, side * w]);
  }
  c.beginPath(); c.moveTo(X, Y);
  for (const [u, v] of pts) c.lineTo(X + ca * u - sa * v, Y + sa * u + ca * v);
  c.closePath(); c.fill();
}
function hempLeaf(c, X, Y, size, rot, col, vein) {
  c.fillStyle = col;
  const F = [[0, 1, 0.11], [0.45, 0.86, 0.1], [-0.45, 0.86, 0.1], [0.92, 0.64, 0.085], [-0.92, 0.64, 0.085], [1.4, 0.38, 0.065], [-1.4, 0.38, 0.065]];
  for (const [a, l, w] of F) hempLeaflet(c, X, Y, size * l, size * w, rot + a);
  if (vein) { c.strokeStyle = vein; c.lineWidth = Math.max(0.6, size * 0.025); c.beginPath(); for (const [a, l] of F) { c.moveTo(X, Y); c.lineTo(X + Math.cos(rot + a) * size * l * 0.92, Y + Math.sin(rot + a) * size * l * 0.92); } c.stroke(); }
}
// ganze Pflanze in der typischen Hanf-Silhouette: große 7-Finger-Fächerblätter, nach oben und zur Seite gefächert
function hempPlant(c, X, Y, u, seed) {
  const up = -Math.PI / 2, tilt = (seed - 0.5) * 0.25;
  c.fillStyle = 'rgba(15,40,10,0.18)'; c.beginPath(); c.ellipse(X + u * 0.05, Y + u * 0.08, u * 0.55, u * 0.3, 0, 0, TAU); c.fill();
  // Stiel
  c.strokeStyle = '#2c5a1e'; c.lineWidth = Math.max(1, u * 0.035); c.beginPath(); c.moveTo(X, Y + u * 0.15); c.lineTo(X, Y - u * 0.3); c.stroke();
  const leaf = (lx, ly, size, ang, col) => { // dunkler Rand → klare Silhouette, dann Blatt, dann helle Rippen
    c.save(); c.translate(lx, ly);
    hempLeaf(c, 0, 0, size * 1.06, ang, '#1d4a16', null);
    hempLeaf(c, 0, 0, size, ang, col, 'rgba(190,240,150,0.55)');
    c.restore();
  };
  leaf(X, Y + u * 0.05, u * 0.42, up + 1.55 + tilt, '#3a8a2c');   // unten rechts
  leaf(X, Y + u * 0.05, u * 0.42, up - 1.55 + tilt, '#3a8a2c');   // unten links
  leaf(X, Y - u * 0.05, u * 0.48, up + 0.85 + tilt, '#46a034');   // rechts
  leaf(X, Y - u * 0.05, u * 0.48, up - 0.85 + tilt, '#46a034');   // links
  leaf(X, Y - u * 0.1, u * 0.56, up + tilt, '#55b23f');           // großes Hauptblatt oben
  // Blüte (Cola) mit orangen Härchen
  c.fillStyle = '#8fd06a'; c.beginPath(); c.ellipse(X, Y - u * 0.12, u * 0.07, u * 0.1, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,160,70,0.9)'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(X + Math.sin(k * 2.1 + seed * 9) * u * 0.05, Y - u * (0.06 + (k % 3) * 0.05), u * 0.015, 0, TAU); c.fill(); }
}

const DIM_GROUND = {
  // Kristall: blaue Kristallfelder mit Facetten und Kristallbüscheln
  crystal: { space: true, paint(kk, p, S, sd) {
    terrain(kk, S * 9, sd, [{ t: 0.4, color: p[3], rim: sh(p[3], -0.4) }, { t: 0.6, color: p[4], rim: sh(p[4], -0.35) }]);
    const c = kk.c;
    scatter(kk, S * 1.2, 0.55, 11, (X, Y, u, h, x, y) => { if (fbm(x / (S * 9), y / (S * 9), sd) < 0.42) return;
      c.fillStyle = A(p[5], 0.25); c.beginPath(); c.moveTo(X, Y - u * 0.35); c.lineTo(X + u * 0.3, Y); c.lineTo(X, Y + u * 0.35); c.lineTo(X - u * 0.3, Y); c.closePath(); c.fill(); });
    scatter(kk, S * 2.5, 0.35, 21, (X, Y, u, h, x, y) => { if (fbm(x / (S * 9), y / (S * 9), sd) < 0.5) return;
      for (let i = -1; i <= 1; i++) { const hh = u * (0.35 + (i === 0 ? 0.2 : 0)), w = u * 0.09; c.fillStyle = A(i ? p[2] : p[5], 0.55); c.beginPath(); c.moveTo(X + i * w * 2 - w, Y); c.lineTo(X + i * w * 2 + i * u * 0.05, Y - hh); c.lineTo(X + i * w * 2 + w, Y); c.closePath(); c.fill(); } });
  } },
  // Spiegel: silberne Fliesen mit Lichtreflexen
  mirror: { bg: p => p[1], paint(kk, p, S, sd) {
    const c = kk.c, C = S * 1.6;
    cells(kk.v, C, (ix, iy) => { const X = kk.sx(ix * C), Y = kk.sy(iy * C), w = C * kk.z; c.fillStyle = (ix + iy) % 2 ? A(p[3], 0.9) : A(p[4], 0.55); c.fillRect(X, Y, w + 0.5, w + 0.5);
      if (hash(ix, iy, 5) < 0.3) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(X + w * 0.2, Y + w * 0.8); c.lineTo(X + w * 0.5, Y + w * 0.1); c.lineTo(X + w * 0.65, Y + w * 0.1); c.lineTo(X + w * 0.35, Y + w * 0.8); c.fill(); } });
  } },
  // Lava: Basaltplatten, glühende Lavaflüsse, Glutrisse
  lava: { bg: p => '#140604', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.3, color: '#2a120c', rim: '#0e0403' }, { t: 0.55, color: '#1c0b08', rim: '#000000' }, { t: 0.0, t2: 0.26, color: p[4], rim: sh(p[4], -0.5) }, { t: 0.0, t2: 0.17, color: p[5] }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.04); c.lineCap = 'round';
    scatter(kk, S * 1.5, 0.4, 31, (X, Y, u, h) => { c.strokeStyle = A(p[4], 0.7); c.beginPath(); c.moveTo(X, Y); c.lineTo(X + u * 0.3, Y + u * 0.15); c.lineTo(X + u * 0.45, Y - u * 0.1); c.stroke(); });
  } },
  // Eis: Schneefelder, Eisschollen mit Rissen, Schneeverwehungen
  ice: { bg: p => '#8fb8d8', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.35, color: '#dff0fb', rim: '#a8cde6' }, { t: 0.62, color: '#ffffff', rim: '#c9e2f2' }, { t: 0.0, t2: 0.25, color: '#7fb8e0', rim: '#4a86b8' }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.03);
    scatter(kk, S * 1.3, 0.5, 41, (X, Y, u, h, x, y) => { const f = fbm(x / (S * 8), y / (S * 8), sd); if (f > 0.25) { c.strokeStyle = 'rgba(160,200,230,0.6)'; wavyLine(c, X, Y, u * 0.7, u * 0.06, 8); } else { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(X - u * 0.3, Y); c.lineTo(X, Y - u * 0.1); c.lineTo(X + u * 0.15, Y + u * 0.2); c.lineTo(X + u * 0.35, Y + u * 0.05); c.stroke(); } });
  } },
  // Pilze: Moosboden, Myzelfäden, riesige Pilzhüte (von oben)
  fungal: { bg: p => p[0], paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.35, color: sh(p[3], -0.1), rim: sh(p[3], -0.5) }, { t: 0.6, color: p[3], rim: sh(p[3], -0.35) }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.03);
    scatter(kk, S * 1.4, 0.6, 51, (X, Y, u, h) => { c.strokeStyle = A(p[2], 0.25); c.beginPath(); c.moveTo(X, Y); c.bezierCurveTo(X + u * 0.4, Y - u * 0.3, X + u * 0.2, Y + u * 0.5, X + u * 0.8, Y + u * 0.2); c.stroke(); });
    scatter(kk, S * 3, 0.4, 52, (X, Y, u, h) => { const r = u * (0.25 + h * 0.25); c.fillStyle = A(h > 0.5 ? p[2] : p[4], 0.45); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      c.fillStyle = A(p[5], 0.4); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(X + Math.cos(i * 1.3 + h * 9) * r * 0.55, Y + Math.sin(i * 1.3 + h * 9) * r * 0.55, r * 0.14, 0, TAU); c.fill(); } });
  } },
  // Schwarzer Garten: dunkler Boden, Dornenranken, giftige Pfützen
  garden: { bg: p => '#081008', paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.38, color: '#122012', rim: '#050a05' }, { t: 0.0, t2: 0.25, color: A(p[2], 0.35) }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.035);
    scatter(kk, S * 1.6, 0.55, 61, (X, Y, u, h) => { c.strokeStyle = 'rgba(40,70,40,0.85)'; c.beginPath(); c.moveTo(X - u * 0.4, Y); c.bezierCurveTo(X - u * 0.1, Y - u * 0.4, X + u * 0.1, Y + u * 0.4, X + u * 0.45, Y - u * 0.05); c.stroke();
      c.fillStyle = 'rgba(40,70,40,0.85)'; for (let i = 0; i < 3; i++) { const tx = X - u * 0.25 + i * u * 0.25; c.beginPath(); c.moveTo(tx, Y - u * 0.05); c.lineTo(tx + u * 0.05, Y - u * 0.15); c.lineTo(tx + u * 0.1, Y - u * 0.04); c.fill(); } });
  } },
  // Neon-Matrix: dunkles Raster mit leuchtenden Leiterbahnen
  circuit: { bg: p => '#04060c', paint(kk, p, S, sd) {
    const c = kk.c, C = S * 1.2;
    c.strokeStyle = A(p[2], 0.12); c.lineWidth = 1;
    cells(kk.v, C, (ix, iy) => { const X = kk.sx(ix * C), Y = kk.sy(iy * C); c.beginPath(); c.moveTo(X, Y); c.lineTo(X + C * kk.z, Y); c.moveTo(X, Y); c.lineTo(X, Y + C * kk.z); c.stroke(); });
    c.lineWidth = Math.max(1.5, S * kk.z * 0.04);
    scatter(kk, C, 0.35, 71, (X, Y, u, h) => { const col = h > 0.5 ? p[2] : p[4], d = h > 0.25 ? 1 : -1; c.strokeStyle = A(col, 0.55); c.beginPath(); c.moveTo(X, Y); c.lineTo(X + u * 0.6 * d, Y); c.lineTo(X + u * 0.6 * d, Y + u * 0.5); c.stroke();
      c.fillStyle = A(col, 0.8); c.beginPath(); c.arc(X, Y, u * 0.06, 0, TAU); c.arc(X + u * 0.6 * d, Y + u * 0.5, u * 0.06, 0, TAU); c.fill(); });
  } },
  // Glitch: zerrissene Pixelblöcke in Neonfarben
  glitch: { bg: p => '#070707', paint(kk, p, S, sd) {
    const c = kk.c;
    scatter(kk, S * 1.1, 0.5, 81, (X, Y, u, h) => { const cols = [p[2], p[4], p[5]]; c.fillStyle = A(cols[Math.floor(h * 3)], 0.22 + h * 0.2); c.fillRect(X, Y, u * (0.3 + h * 1.2), u * (0.08 + (1 - h) * 0.25)); });
    scatter(kk, S * 2.2, 0.4, 82, (X, Y, u, h) => { c.fillStyle = A(p[2], 0.12); c.fillRect(X - u * 0.8, Y, u * 1.6, u * 0.05); c.fillStyle = A(p[4], 0.12); c.fillRect(X - u * 0.7 + u * 0.05, Y + u * 0.06, u * 1.4, u * 0.05); });
  } },
  // Schatten: dunkler Nebel, violette Schlieren und Spiralen
  shadow: { space: true, paint(kk, p, S, sd) {
    terrain(kk, S * 9, sd, [{ t: 0.45, color: A('#000000', 0.55) }, { t: 0.62, color: A(p[3], 0.6) }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.04);
    scatter(kk, S * 2.4, 0.4, 91, (X, Y, u, h) => { c.strokeStyle = A(p[2], 0.25); c.beginPath(); for (let a = 0; a < 9; a += 0.3) { const r = a * u * 0.05; c.lineTo(X + Math.cos(a + h * 6) * r, Y + Math.sin(a + h * 6) * r); } c.stroke(); });
  } },
  // Uhrwerk: Messingplatten mit Nieten und großen flachen Zahnrädern
  clockwork: { bg: p => p[1], paint(kk, p, S, sd) {
    const c = kk.c, C = S * 2;
    cells(kk.v, C, (ix, iy) => { const X = kk.sx(ix * C), Y = kk.sy(iy * C), w = C * kk.z; c.fillStyle = A(p[3], 0.35 + hash(ix, iy, 3) * 0.3); c.fillRect(X + 1, Y + 1, w - 2, w - 2);
      c.fillStyle = A(p[5], 0.35); for (const [a, b] of [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) { c.beginPath(); c.arc(X + w * a, Y + w * b, w * 0.025, 0, TAU); c.fill(); } });
    scatter(kk, S * 3.2, 0.4, 101, (X, Y, u, h) => { const r = u * (0.3 + h * 0.3); c.fillStyle = A(p[4], 0.35); gearShape(c, X, Y, r, 10 + Math.floor(h * 6), h * 3); c.fill(); c.fillStyle = A(p[1], 0.9); c.beginPath(); c.arc(X, Y, r * 0.35, 0, TAU); c.fill(); });
  } },
  // Schmiede (Dimensionsboden): Metallboden, glühende Schlackerinnen
  forge: { space: true, paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.42, color: '#2a2a30', rim: '#101014' }, { t: 0.0, t2: 0.2, color: A(p[4], 0.8), rim: sh(p[4], -0.5) }]);
    const c = kk.c;
    scatter(kk, S * 1.5, 0.45, 111, (X, Y, u, h, x, y) => { if (fbm(x / (S * 8), y / (S * 8), sd) < 0.42) return; c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(X - u * 0.4, Y - u * 0.25, u * 0.8, u * 0.5); c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.arc(X - u * 0.33, Y - u * 0.18, u * 0.03, 0, TAU); c.arc(X + u * 0.33, Y + u * 0.18, u * 0.03, 0, TAU); c.fill(); });
  } },
  // Zucker: rosa Zuckerguss, Streusel, Lolli-Spiralen
  sweets: { bg: p => '#ffd6ea', paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.42, color: '#ffb3d6', rim: '#e88ab6' }, { t: 0.64, color: '#fff2f8', rim: '#f0c8dc' }]);
    const c = kk.c, cols = ['#ff4a5a', '#7fd3ff', '#ffd23f', '#7fe07f', '#b06bff'];
    scatter(kk, S * 0.7, 0.6, 121, (X, Y, u, h) => { c.save(); c.translate(X, Y); c.rotate(h * 6); c.fillStyle = cols[Math.floor(h * 5)]; c.fillRect(-u * 0.12, -u * 0.035, u * 0.24, u * 0.07); c.restore(); });
    c.lineWidth = Math.max(1.5, S * kk.z * 0.06);
    scatter(kk, S * 3, 0.3, 122, (X, Y, u, h) => { c.strokeStyle = A('#ff6fa8', 0.35); c.beginPath(); for (let a = 0; a < 14; a += 0.25) { const r = a * u * 0.03; c.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } c.stroke(); });
  } },
  // Drachenhort: Höhlenfels mit Goldmünzen-Feldern und Juwelen
  hoard: { bg: p => '#1a0c08', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.35, color: '#3a1e14', rim: '#140806' }, { t: 0.62, color: '#4a2a1a', rim: '#1a0c08' }, { t: 0.0, t2: 0.22, color: A('#e0a020', 0.85), rim: '#8a5a10' }]);
    const c = kk.c;
    scatter(kk, S * 0.9, 0.5, 131, (X, Y, u, h, x, y) => { if (fbm(x / (S * 8), y / (S * 8), sd) > 0.26) return; c.fillStyle = h > 0.85 ? '#ff4a7a' : h > 0.75 ? '#5ad0ff' : '#ffd23f'; c.beginPath(); c.ellipse(X, Y, u * 0.12, u * 0.06, 0, 0, TAU); c.fill(); });
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
    scatter(kk, S * 1.2, 0.5, 132, (X, Y, u) => { c.beginPath(); c.arc(X, Y, u * 0.2, Math.PI, 0); c.stroke(); });
  } },
  // Ozean: Wasser mit Wellenkämmen, Inseln, Blasen
  ocean: { bg: p => sh(p[3], -0.2), paint(kk, p, S, sd) {
    terrain(kk, S * 9, sd, [{ t: 0.0, t2: 0.4, color: sh(p[3], -0.4) }, { t: 0.7, color: '#e8d6a0', rim: '#b8a070' }, { t: 0.76, color: '#5aa860', rim: '#3a7a40' }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.035);
    scatter(kk, S * 1.3, 0.55, 141, (X, Y, u, h, x, y) => { if (fbm(x / (S * 9), y / (S * 9), sd) > 0.68) return; c.strokeStyle = A(p[5], 0.35); c.beginPath(); c.arc(X, Y, u * 0.25, Math.PI * 1.1, Math.PI * 1.9); c.arc(X + u * 0.45, Y, u * 0.25, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
    scatter(kk, S * 2, 0.3, 142, (X, Y, u, h) => { c.strokeStyle = A(p[5], 0.4); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X + i * u * 0.12, Y - i * u * 0.2, u * (0.05 + i * 0.03), 0, TAU); c.stroke(); } });
  } },
  // Ursuppe: grüne Brühe mit treibenden Zellen und Blasen
  soup: { bg: p => '#1a3a14', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.45, color: '#2a5a1e', rim: '#122a0c' }, { t: 0.66, color: '#4a8a2e', rim: '#2a5a1e' }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.03);
    scatter(kk, S * 1.5, 0.5, 151, (X, Y, u, h) => { const r = u * (0.12 + h * 0.15); c.fillStyle = A(p[2], 0.25); c.beginPath(); c.ellipse(X, Y, r * 1.3, r, h * 3, 0, TAU); c.fill(); c.fillStyle = A('#1a3a14', 0.6); c.beginPath(); c.arc(X + r * 0.2, Y, r * 0.35, 0, TAU); c.fill(); });
    scatter(kk, S * 1, 0.4, 152, (X, Y, u, h) => { c.strokeStyle = A(p[5], 0.35); c.beginPath(); c.arc(X, Y, u * (0.04 + h * 0.06), 0, TAU); c.stroke(); });
  } },
  // Himmel: Wolkenboden über hellem Himmel
  sky: { bg: p => sh(p[3], -0.1), paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.38, color: A('#ffffff', 0.55), rim: A(p[4], 0.6) }, { t: 0.56, color: A('#ffffff', 0.85), rim: A(p[4], 0.5) }]);
    const c = kk.c;
    scatter(kk, S * 2.2, 0.3, 161, (X, Y, u, h) => { c.fillStyle = 'rgba(255,255,255,0.35)'; for (const [dx, dy, r] of [[-0.3, 0, 0.25], [0, -0.1, 0.32], [0.3, 0, 0.24]]) { c.beginPath(); c.arc(X + dx * u, Y + dy * u, r * u, 0, TAU); c.fill(); } });
  } },
  // Tempel/Ruinen: Wolken + Marmorplätze mit Säulenstümpfen und Mosaik
  temple: { bg: p => sh(p[3], 0.05), paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.36, color: A('#ffffff', 0.6), rim: A(p[4], 0.6) }, { t: 0.6, color: '#efe8da', rim: '#c8bca4' }]);
    const c = kk.c, C = S * 1.4;
    cells(kk.v, C, (ix, iy) => { const x = ix * C, y = iy * C; if (fbm(x / (S * 7), y / (S * 7), sd) < 0.62) return; const X = kk.sx(x), Y = kk.sy(y), w = C * kk.z;
      c.strokeStyle = 'rgba(160,140,110,0.35)'; c.lineWidth = 1; c.strokeRect(X, Y, w, w);
      if (hash(ix, iy, 7) < 0.12) { c.fillStyle = '#d8ccb4'; c.beginPath(); c.arc(X + w / 2, Y + w / 2, w * 0.22, 0, TAU); c.fill(); c.fillStyle = '#c8bca4'; c.beginPath(); c.arc(X + w / 2, Y + w / 2, w * 0.14, 0, TAU); c.fill(); }
      else if (hash(ix, iy, 8) < 0.1) { c.fillStyle = A('#ffd23f', 0.5); c.beginPath(); c.moveTo(X + w / 2, Y + w * 0.2); c.lineTo(X + w * 0.8, Y + w / 2); c.lineTo(X + w / 2, Y + w * 0.8); c.lineTo(X + w * 0.2, Y + w / 2); c.fill(); } });
  } },
  // Traum: lila Nacht, Wolken, Sterne und Mondsicheln
  dream: { bg: p => p[1], paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.42, color: A(p[2], 0.35), rim: A(p[4], 0.5) }, { t: 0.62, color: A('#ffe0ff', 0.55) }]);
    const c = kk.c;
    scatter(kk, S * 1, 0.4, 171, (X, Y, u, h) => { c.fillStyle = `rgba(255,255,255,${0.4 + h * 0.5})`; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? u * 0.03 : u * 0.09; c.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } c.fill(); });
    scatter(kk, S * 4, 0.3, 172, (X, Y, u) => { c.fillStyle = 'rgba(255,240,180,0.45)'; c.beginPath(); c.arc(X, Y, u * 0.3, 0, TAU); c.fill(); c.fillStyle = p[1]; c.beginPath(); c.arc(X + u * 0.12, Y - u * 0.05, u * 0.26, 0, TAU); c.fill(); });
  } },
  // Feuerhimmel: glühende Wolken über Abendrot
  fiery: { bg: p => '#5a1a00', paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.4, color: A(p[4], 0.55), rim: A('#3a0a00', 0.6) }, { t: 0.6, color: A(p[5], 0.6) }]);
    const c = kk.c;
    scatter(kk, S * 1.2, 0.4, 181, (X, Y, u, h) => { c.fillStyle = A('#ffd23f', 0.3 + h * 0.4); c.beginPath(); c.arc(X, Y, u * (0.03 + h * 0.04), 0, TAU); c.fill(); });
  } },
  // Himmel/Jenseits: helles Licht, weiße Wolken, Lichtstrahlen
  heaven: { bg: p => '#d8d8f4', paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.4, color: 'rgba(255,255,255,0.7)', rim: 'rgba(180,180,230,0.6)' }, { t: 0.6, color: '#ffffff', rim: 'rgba(200,200,240,0.7)' }]);
    const c = kk.c;
    scatter(kk, S * 3, 0.35, 191, (X, Y, u, h) => { c.fillStyle = A(p[2], 0.12); c.beginPath(); c.moveTo(X, Y); c.lineTo(X - u * 0.2, Y + u * 1.2); c.lineTo(X + u * 0.2, Y + u * 1.2); c.fill(); });
  } },
  // Schöpfung: goldenes Licht, Urnebel, junge Sterne
  genesis: { bg: p => '#f6e6b8', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.42, color: A(p[4], 0.4), rim: A(p[2], 0.35) }, { t: 0.62, color: A('#ffffff', 0.6) }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.04);
    scatter(kk, S * 2.5, 0.4, 201, (X, Y, u, h) => { c.strokeStyle = A(p[2], 0.3); c.beginPath(); for (let a = 0; a < 10; a += 0.3) { const r = a * u * 0.045; c.lineTo(X + Math.cos(a + h * 6) * r, Y + Math.sin(a + h * 6) * r * 0.6); } c.stroke(); });
    scatter(kk, S * 0.9, 0.3, 202, (X, Y, u, h) => { c.fillStyle = A('#ffffff', 0.7); c.beginPath(); c.arc(X, Y, u * 0.04, 0, TAU); c.fill(); });
  } },
  // Weltenbaum: Moos, riesige Wurzeln, Laub
  forest: { bg: p => '#1e3a16', paint(kk, p, S, sd) {
    terrain(kk, S * 7, sd, [{ t: 0.4, color: '#2a5a20', rim: '#142e10' }, { t: 0.62, color: '#3a7a2a', rim: '#24501a' }]);
    const c = kk.c;
    scatter(kk, S * 4, 0.35, 211, (X, Y, u, h) => { c.strokeStyle = 'rgba(90,55,25,0.85)'; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.lineWidth = u * (0.12 - i * 0.03); c.beginPath(); c.moveTo(X, Y); c.bezierCurveTo(X + Math.cos(h * 6 + i * 2) * u * 0.4, Y + Math.sin(h * 6 + i * 2) * u * 0.4, X + Math.cos(h * 6 + i * 2 + 0.6) * u * 0.6, Y + Math.sin(h * 6 + i * 2 + 0.6) * u * 0.7, X + Math.cos(h * 6 + i * 2) * u * 1.1, Y + Math.sin(h * 6 + i * 2) * u * 1.1); c.stroke(); } });
    scatter(kk, S * 0.9, 0.35, 212, (X, Y, u, h) => { c.fillStyle = A(h > 0.5 ? '#7fe07f' : '#c9f0a0', 0.4); c.beginPath(); c.ellipse(X, Y, u * 0.1, u * 0.05, h * 6, 0, TAU); c.fill(); });
  } },
  // Prismenwüste: Dünen mit Regenbogen-Streifen
  desert: { bg: p => '#e8c880', paint(kk, p, S, sd) {
    terrain(kk, S * 8, sd, [{ t: 0.35, color: '#f0d698', rim: '#c8a860' }, { t: 0.5, color: 'rgba(255,154,61,0.35)' }, { t: 0.62, color: 'rgba(255,90,140,0.3)' }, { t: 0.74, color: 'rgba(120,200,255,0.35)' }]);
    const c = kk.c; c.lineWidth = Math.max(1, S * kk.z * 0.03);
    scatter(kk, S * 1.3, 0.5, 221, (X, Y, u) => { c.strokeStyle = 'rgba(160,120,60,0.35)'; c.beginPath(); c.moveTo(X - u * 0.4, Y); c.quadraticCurveTo(X, Y - u * 0.15, X + u * 0.4, Y); c.stroke(); });
  } },
  // 420: Hanfplantage von oben – Reihen großer Pflanzen auf dunkler Erde, Wege, Lichtungen mit großen Blättern, Rauchschwaden
  hemp: { bg: p => '#3a2a1c', paint(kk, p, S, sd) {
    const c = kk.c, C = S * 2.2, sc = S * 14;
    const zone = (x, y) => fbm(x / sc, y / sc, sd + 3);
    const room = (x, y) => fbm(x / (sc * 0.8), y / (sc * 0.8), sd + 17) > 0.66;
    // Lichtungen (Gras) und Teiche
    terrain(kk, sc, sd + 3, [{ t: 0.63, color: '#4f9a38', rim: '#3a7a28' }, { t: 0.0, t2: 0.15, color: '#3d7fb0', rim: '#2b5f86' }]);
    // Erd-Furchen in den Beeten
    cells(kk.v, C, (ix, iy) => { const x = ix * C, y = iy * C, f = zone(x, y); if (f > 0.63 || f < 0.15) return;
      const X = kk.sx(x), Y = kk.sy(y), w = C * kk.z;
      if (room(x, y)) return;
      if (iy % 3 === 0) { c.fillStyle = '#9a7a52'; c.fillRect(X - 0.5, Y + w * 0.2, w + 1, w * 0.6); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(X - 0.5, Y + w * 0.2, w + 1, w * 0.07); return; } // Weg
      c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(X - 0.5, Y + w * 0.45, w + 1, w * 0.08); });
    // Grow-Räume: dunkler Boden mit Fliesen, lila Grow-Licht, Pflanzen in Töpfen
    cells(kk.v, C, (ix, iy) => { const x = ix * C, y = iy * C; if (!room(x, y)) return; const X = kk.sx(x), Y = kk.sy(y), w = C * kk.z;
      c.fillStyle = (ix + iy) % 2 ? '#24202c' : '#2a2534'; c.fillRect(X - 0.5, Y - 0.5, w + 1, w + 1);
      const g = c.createRadialGradient(X + w / 2, Y + w / 2, 0, X + w / 2, Y + w / 2, w * 0.75); g.addColorStop(0, 'rgba(220,120,255,0.45)'); g.addColorStop(1, 'rgba(160,60,255,0)'); c.fillStyle = g; c.fillRect(X - w * 0.25, Y - w * 0.25, w * 1.5, w * 1.5);
      c.fillStyle = '#6a4a3a'; c.beginPath(); c.arc(X + w / 2, Y + w / 2, w * 0.2, 0, TAU); c.fill(); c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(X + w / 2, Y + w / 2, w * 0.15, 0, TAU); c.fill();
      hempPlant(c, X + w / 2, Y + w / 2, w * 0.62, hash(ix, iy, 19)); });
    // Pflanzenreihen
    cells(kk.v, C, (ix, iy) => { if (iy % 3 === 0) return; const x = ix * C, y = iy * C, f = zone(x, y); if (f > 0.63 || f < 0.17 || room(x, y)) return;
      hempPlant(c, kk.sx(x + C / 2 + (hash(ix, iy, 5) - 0.5) * C * 0.15), kk.sy(y + C / 2), C * kk.z * (0.82 + hash(ix, iy, 6) * 0.25), hash(ix, iy, 7)); });
    // große einzelne Blätter auf den Lichtungen
    scatter(kk, S * 3.5, 0.5, 244, (X, Y, u, h, x, y) => { if (zone(x, y) < 0.66) return; hempLeaf(c, X, Y, u * 0.35, h * TAU, 'rgba(40,110,35,0.55)', 'rgba(150,210,110,0.4)'); });
    // Gras-Tupfen
    scatter(kk, S * 0.8, 0.5, 243, (X, Y, u, h, x, y) => { if (zone(x, y) < 0.63) return; c.strokeStyle = 'rgba(25,70,20,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(X, Y); c.lineTo(X - u * 0.05, Y - u * 0.15); c.moveTo(X, Y); c.lineTo(X + u * 0.06, Y - u * 0.13); c.stroke(); });
    // weiche Rauchschwaden
    scatter(kk, S * 8, 0.45, 241, (X, Y, u, h) => { for (let i = 0; i < 4; i++) { const cx = X + Math.cos(i * 1.7 + h * 5) * u * 0.25, cy = Y + Math.sin(i * 1.3) * u * 0.12, g = c.createRadialGradient(cx, cy, 0, cx, cy, u * 0.32); g.addColorStop(0, 'rgba(230,255,220,0.13)'); g.addColorStop(1, 'rgba(230,255,220,0)'); c.fillStyle = g; c.fillRect(cx - u * 0.35, cy - u * 0.35, u * 0.7, u * 0.7); } });
  } },
  // Chaos: bunte Wirbel und Risse
  chaos: { space: true, paint(kk, p, S, sd) {
    const c = kk.c; c.lineWidth = Math.max(1.5, S * kk.z * 0.06);
    scatter(kk, S * 2.4, 0.5, 231, (X, Y, u, h) => { c.strokeStyle = `hsla(${Math.floor(h * 360)},90%,60%,0.35)`; c.beginPath(); for (let a = 0; a < 12; a += 0.3) { const r = a * u * 0.05; c.lineTo(X + Math.cos(a + h * 6) * r, Y + Math.sin(a + h * 6) * r); } c.stroke(); });
    scatter(kk, S * 1.5, 0.3, 232, (X, Y, u, h) => { c.strokeStyle = 'rgba(255,60,40,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + u * 0.3, Y + u * 0.1); c.lineTo(X + u * 0.2, Y + u * 0.35); c.lineTo(X + u * 0.5, Y + u * 0.45); c.stroke(); });
  } },
};

const GROUNDS = {
  // ---------------- Garten: Grundstücke mit Kieswegen, Hecken, Rasen, Beeten und Teichen.
  // Regel: Alles am Boden ist FLACH (keine Umrisse, keine Schatten) – nur echte Objekte haben Umrisse.
  lawn(k) {
    const { c, sx, sy, z, v, S, W, H } = k;
    const B = S * 14, Pw = S * 1.8, Hw = S * 0.45;
    c.fillStyle = '#d8c9a0'; c.fillRect(0, 0, W, H); // Kies
    // Kies-Körnung
    const G = S * 0.9;
    if (G * z > 6) {
      c.fillStyle = 'rgba(120,100,60,0.18)';
      cells(v, G, (ix, iy) => { const h = hash(ix, iy, 401); if (h < 0.5) return; c.fillRect(sx((ix + h) * G), sy((iy + hash(iy, ix, 402)) * G), Math.max(1, S * z * 0.12), Math.max(1, S * z * 0.12)); });
    }
    const bx0 = Math.floor(v.x0 / B), bx1 = Math.ceil(v.x1 / B), by0 = Math.floor(v.y0 / B), by1 = Math.ceil(v.y1 / B);
    for (let ix = bx0; ix <= bx1; ix++) for (let iy = by0; iy <= by1; iy++) {
      const x = ix * B + Pw / 2, y = iy * B + Pw / 2, w = B - Pw, h = hash(ix, iy, 403);
      // Hecke (flach) rund um die Parzelle
      c.fillStyle = '#4e9a3d'; c.fillRect(sx(x), sy(y), w * z, w * z);
      c.fillStyle = '#5aa846'; c.fillRect(sx(x), sy(y), w * z, Hw * 0.45 * z);
      // Rasen mit Mähstreifen
      const lx = x + Hw, ly = y + Hw, lw = w - Hw * 2;
      c.fillStyle = '#74c25a'; c.fillRect(sx(lx), sy(ly), lw * z, lw * z);
      c.fillStyle = '#6ab850';
      const stripes = 6;
      for (let i = 0; i < stripes; i += 2) c.fillRect(sx(lx + i * lw / stripes), sy(ly), lw / stripes * z, lw * z);
      // Gartenelemente (flach, gedeckte Farben)
      if (h < 0.3) { // Gemüsebeet
        const bx = lx + lw * 0.12, by = ly + lw * 0.12, bw = lw * 0.42, bh = lw * 0.3;
        c.fillStyle = '#8a6a48'; c.fillRect(sx(bx), sy(by), bw * z, bh * z);
        c.fillStyle = '#6fa64e';
        for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) { c.beginPath(); c.arc(sx(bx + bw * (0.1 + q * 0.16)), sy(by + bh * (0.22 + r * 0.28)), Math.max(1, S * z * 0.22), 0, TAU); c.fill(); }
      } else if (h < 0.5) { // Teich mit Steinrand (flach)
        const cx = lx + lw * 0.68, cy = ly + lw * 0.62, rx = lw * 0.2, ry = lw * 0.14;
        c.fillStyle = '#b9b3a3'; c.beginPath(); c.ellipse(sx(cx), sy(cy), (rx + S * 0.35) * z, (ry + S * 0.35) * z, 0, 0, TAU); c.fill();
        c.fillStyle = '#5ab4dc'; c.beginPath(); c.ellipse(sx(cx), sy(cy), rx * z, ry * z, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(sx(cx - rx * 0.3), sy(cy - ry * 0.35), rx * 0.4 * z, ry * 0.18 * z, 0, 0, TAU); c.fill();
        c.fillStyle = '#6fbf5a'; c.beginPath(); c.arc(sx(cx + rx * 0.35), sy(cy + ry * 0.2), Math.max(1, S * z * 0.35), 0, TAU); c.fill();
      } else if (h < 0.68) { // Blumenrabatte entlang der Hecke (flacher Streifen)
        c.fillStyle = '#7a5c40'; c.fillRect(sx(lx), sy(ly + lw - S * 1.1), lw * z, S * 1.1 * z);
        const cols = ['#e86f9a', '#f2c94c', '#f4f0e6', '#b48ad9'];
        for (let q = 0; q < 14; q++) { c.fillStyle = cols[q % 4]; c.beginPath(); c.arc(sx(lx + lw * (0.04 + q * 0.07)), sy(ly + lw - S * 0.55 + Math.sin(q * 2.3) * S * 0.2), Math.max(1, S * z * 0.2), 0, TAU); c.fill(); }
      } else if (h < 0.8) { // Terrasse (Steinplatten)
        const tx = lx + lw * 0.55, ty = ly + lw * 0.1, tw = lw * 0.35;
        c.fillStyle = '#c9c2b4'; c.fillRect(sx(tx), sy(ty), tw * z, tw * z);
        c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 1; c.beginPath();
        for (let q = 1; q < 4; q++) { c.moveTo(sx(tx + tw * q / 4), sy(ty)); c.lineTo(sx(tx + tw * q / 4), sy(ty + tw)); c.moveTo(sx(tx), sy(ty + tw * q / 4)); c.lineTo(sx(tx + tw), sy(ty + tw * q / 4)); }
        c.stroke();
      }
      // Trittsteine quer über den Rasen (flach)
      if (h > 0.4 && h < 0.9) {
        c.fillStyle = '#c4bdae';
        for (let q = 0; q < 6; q++) { c.beginPath(); c.ellipse(sx(lx + lw * (0.1 + q * 0.15)), sy(ly + lw * 0.85 - q * lw * 0.05), S * 0.45 * z, S * 0.3 * z, 0, 0, TAU); c.fill(); }
      }
    }
  },

  // ---------------- Vorstadt-Straßen: Blöcke mit Vorgärten
  street(k) {
    streetGrid(k, {
      block: 12, road: 2.6, walk: 0.9, asphalt: '#50535d', curb: '#9a9ca4', walkCol: '#d4d6dc', center: '#f5d14a', zebra: 'rgba(255,255,255,0.85)',
      lot(k, x, y, w, h, ix, iy) {
        const { c, sx, sy, z, S } = k, u = S * z;
        c.fillStyle = '#86c45e'; c.fillRect(sx(x), sy(y), w * z, w * z);
        c.fillStyle = '#7ab654'; for (let i = 0; i < 4; i++) if (i % 2) c.fillRect(sx(x + i * w / 4), sy(y), w / 4 * z, w * z);
        // Einfahrt
        c.fillStyle = '#bfc1c8'; c.fillRect(sx(x + w * 0.62), sy(y + w * 0.55), w * 0.14 * z, w * 0.45 * z);
        // Hecke rundherum
        c.strokeStyle = '#3f7d34'; c.lineWidth = Math.max(2, u * 0.35); c.strokeRect(sx(x + S * 0.2), sy(y + S * 0.2), (w - S * 0.4) * z, (w - S * 0.4) * z);
        if (h < 0.35) { // Pool
          c.fillStyle = '#e8eef2'; c.beginPath(); c.roundRect(sx(x + w * 0.12), sy(y + w * 0.14), w * 0.34 * z, w * 0.22 * z, u * 0.4); c.fill();
          c.fillStyle = '#4fc3e9'; c.beginPath(); c.roundRect(sx(x + w * 0.14), sy(y + w * 0.16), w * 0.3 * z, w * 0.18 * z, u * 0.3); c.fill();
        } else { // Gartenbeet
          c.fillStyle = '#7a4e30'; c.fillRect(sx(x + w * 0.12), sy(y + w * 0.12), w * 0.3 * z, w * 0.1 * z);
        }
        for (let i = 0; i < 3; i++) treeTop(c, sx(x + w * (0.18 + hash(ix, iy, 20 + i) * 0.6)), sy(y + w * (0.5 + hash(iy, ix, 30 + i) * 0.35)), u * (0.8 + hash(ix, i, iy) * 0.5), '#4fae45', '#2e6e2a');
      },
    });
  },

  // ---------------- Stadt: breite Straßen, Parks, Parkplätze, Plätze
  city(k) {
    streetGrid(k, {
      block: 11, road: 3.2, walk: 0.7, asphalt: '#3e414b', curb: '#8a8d96', walkCol: '#b4b7c0', center: '#f5d14a', lanes: true, zebra: 'rgba(255,255,255,0.8)',
      lot(k, x, y, w, h, ix, iy) {
        const { c, sx, sy, z, S } = k, u = S * z;
        if (h < 0.3) { // Park
          c.fillStyle = '#6fb352'; c.fillRect(sx(x), sy(y), w * z, w * z);
          c.strokeStyle = '#e6d9b8'; c.lineWidth = Math.max(2, u * 0.5); c.beginPath(); c.moveTo(sx(x), sy(y + w / 2)); c.quadraticCurveTo(sx(x + w / 2), sy(y + w * 0.2), sx(x + w), sy(y + w * 0.6)); c.stroke();
          circle(c, sx(x + w / 2), sy(y + w / 2), u * 1.2, '#4fc3e9');
          for (let i = 0; i < 7; i++) treeTop(c, sx(x + w * hash(ix, iy, 40 + i)), sy(y + w * hash(iy, ix, 50 + i)), u * (0.7 + hash(i, ix, iy) * 0.5), '#4fae45', '#2e6e2a');
        } else if (h < 0.55) { // Parkplatz
          c.fillStyle = '#5a5d66'; c.fillRect(sx(x), sy(y), w * z, w * z);
          c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = Math.max(1, u * 0.08); c.beginPath();
          for (let i = 0; i <= 8; i++) { const tx = x + w * 0.08 + i * w * 0.105; c.moveTo(sx(tx), sy(y + w * 0.1)); c.lineTo(sx(tx), sy(y + w * 0.35)); c.moveTo(sx(tx), sy(y + w * 0.65)); c.lineTo(sx(tx), sy(y + w * 0.9)); }
          c.stroke();
          const cols = ['#e84a5f', '#4bd1a0', '#ffd23f', '#56c2ff', '#ffffff'];
          for (let i = 0; i < 8; i++) if (hash(ix, iy, 60 + i) < 0.6) { c.fillStyle = cols[i % 5]; c.beginPath(); c.roundRect(sx(x + w * 0.1 + i * w * 0.105), sy(y + w * 0.13), w * 0.075 * z, w * 0.18 * z, u * 0.15); c.fill(); }
        } else { // Platz mit Baumreihen
          c.fillStyle = '#c7c3b8'; c.fillRect(sx(x), sy(y), w * z, w * z);
          c.strokeStyle = 'rgba(0,0,0,0.06)'; c.lineWidth = 1; c.beginPath();
          for (let t = 0; t <= w; t += S * 0.9) { c.moveTo(sx(x + t), sy(y)); c.lineTo(sx(x + t), sy(y + w)); c.moveTo(sx(x), sy(y + t)); c.lineTo(sx(x + w), sy(y + t)); }
          c.stroke();
          for (let i = 0; i < 5; i++) { treeTop(c, sx(x + w * (0.1 + i * 0.2)), sy(y + w * 0.12), u * 0.6, '#55b04a', '#2e6e2a'); treeTop(c, sx(x + w * (0.1 + i * 0.2)), sy(y + w * 0.88), u * 0.6, '#55b04a', '#2e6e2a'); }
          circle(c, sx(x + w / 2), sy(y + w / 2), u * 1.1, '#9aa3ad'); circle(c, sx(x + w / 2), sy(y + w / 2), u * 0.85, '#6fd0f0');
        }
      },
    });
  },

  // ---------------- Gebirge: Wiesen, Wälder, Felsen, Bergseen, Schnee
  alpine(k) { cached(k, 'alpine', GROUNDS._alpine); },
  _alpine(k) {
    const { c, sx, sy, z, v, S } = k;
    terrain(k, S * 10, 11, [
      { t: 0.0, t2: 0.3, color: '#4f9ad0', rim: '#3a7fb8' },          // Bergsee
      { t: 0.5, color: '#73a556', rim: '#5f8f47' },                    // dunklere Matten
      { t: 0.6, color: '#a39a86', rim: '#7c7464' },                    // Fels
      { t: 0.68, color: '#8f8676', rim: '#6c6456' },
      { t: 0.74, color: '#eef4f8', rim: '#b8c8d6' },                   // Schnee
    ]);
    // Wälder: kleine Tannen in mittleren Lagen
    const C = S * 1.6;
    if (C * z > 10) cells(v, C, (ix, iy) => {
      const x = (ix + hash(ix, iy, 71)) * C, y = (iy + hash(iy, ix, 72)) * C;
      const n = fbm(x / (S * 10), y / (S * 10), 11);
      if (n > 0.38 && n < 0.58 && hash(ix, iy, 73) < 0.75) pineTop(c, sx(x), sy(y), S * z * (0.45 + hash(ix, iy, 74) * 0.35), n > 0.5 ? '#2c6b3c' : '#3a8a4a');
      else if (n > 0.6 && n < 0.72 && hash(ix, iy, 75) < 0.25) { c.strokeStyle = 'rgba(70,60,50,0.3)'; c.lineWidth = Math.max(1, S * z * 0.08); c.beginPath(); c.moveTo(sx(x), sy(y)); c.lineTo(sx(x + S * 0.6), sy(y + S * 0.3)); c.lineTo(sx(x + S * 0.4), sy(y + S * 0.8)); c.stroke(); }
      else if (n < 0.5 && n > 0.34 && hash(ix, iy, 76) < 0.12) circle(c, sx(x), sy(y), S * z * 0.12, ['#ffffff', '#ffd23f', '#c38bff'][ix & 1 + (iy & 1)]);
    });
  },

  // ---------------- Kontinent: Weltkarte von oben mit Wolken
  ocean(k) {
    const { c, sx, sy, z, v, S, time, W, H } = k;
    cached(k, 'ocean', kk => terrain(kk, S * 9, 21, [
      { t: 0.5, color: '#3f9fdc' },                     // Flachwasser
      { t: 0.56, color: '#6cc2ea' },
      { t: 0.6, color: '#f0d58a', rim: '#d9b864' },     // Strand
      { t: 0.625, color: '#7cc05f', rim: '#62a64a' },   // Land
      { t: 0.72, color: '#4f9e4a', rim: '#3d8238' },    // Wald
      { t: 0.8, color: '#a39a86', rim: '#7c7464' },     // Gebirge
      { t: 0.87, color: '#f4f8fa', rim: '#b8c8d6' },    // Gipfel
    ]));
    // Wellen auf tiefem Wasser
    const C = S * 2;
    if (C * z > 14) {
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = Math.max(1, S * z * 0.08); c.beginPath();
      cells(v, C, (ix, iy) => {
        if (hash(ix, iy, 81) > 0.35) return;
        const x = (ix + hash(ix, iy, 82)) * C, y = (iy + hash(iy, ix, 83)) * C;
        if (fbm(x / (S * 9), y / (S * 9), 21) > 0.48) return;
        const X = sx(x) + Math.sin(time * 1.2 + ix) * S * z * 0.15, Y = sy(y), r = S * z * 0.35;
        c.moveTo(X - r * 1.4, Y); c.quadraticCurveTo(X - r * 0.7, Y - r * 0.6, X, Y); c.quadraticCurveTo(X + r * 0.7, Y - r * 0.6, X + r * 1.4, Y);
      });
      c.stroke();
    }
    // Wolken mit Schatten (ziehen langsam)
    const CC = S * 16;
    cells({ x0: v.x0 - CC, x1: v.x1 + CC, y0: v.y0 - CC, y1: v.y1 + CC }, CC, (ix, iy) => {
      if (hash(ix, iy, 91) > 0.45) return;
      const drift = (time * S * 0.15) % CC;
      const x = (ix + hash(ix, iy, 92)) * CC + drift, y = (iy + hash(iy, ix, 93)) * CC;
      const r = S * (2.2 + hash(ix, iy, 94) * 2) * z;
      for (const [dx, dy, s, col] of [[r * 0.5, r * 0.6, 1, 'rgba(0,30,60,0.12)'], [0, 0, 1, 'rgba(255,255,255,0.75)']]) {
        c.fillStyle = col; c.beginPath();
        for (let i = 0; i < 5; i++) { const a = i * 1.3; c.moveTo(sx(x) + dx + Math.cos(a) * r * 0.7 + r * 0.55, sy(y) + dy + Math.sin(a) * r * 0.3); c.arc(sx(x) + dx + Math.cos(a) * r * 0.7, sy(y) + dy + Math.sin(a) * r * 0.3, r * 0.55, 0, TAU); }
        c.fill();
      }
    });
  },

  // ---------------- Dimensionen: jede mit eigenem Thema (DIM_GROUND unten)
  dimension(k) {
    const { c, z, world, time } = k, T = DIM_GROUND[world.theme] || DIM_GROUND.crystal;
    if (world.theme === 'hemp') return draw420(k); // Karte 420: vorgefertigte Kachel (schnell, keine Neuaufbau-Spitzen)
    if (T.space) drawSpace(c, k.g, k.W, k.H, z, world, time);
    else { c.fillStyle = T.bg ? T.bg(world.pal) : world.pal[0]; c.fillRect(0, 0, k.W, k.H); }
    cached(k, 'dim-' + world.theme + ':' + k.S, kk => T.paint(kk, world.pal, k.S, 70 + (world.minRadius % 97)));
  },

  // ---------------- Höllenschlund (Welt 50): Obsidian, Asche, Lavaflüsse, aufsteigende Glut
  hell(k) {
    const { c, S, W, H, time } = k;
    c.fillStyle = '#1e0a06'; c.fillRect(0, 0, W, H);
    cached(k, 'hell', kk => terrain(kk, S * 9, 666, [
      { t: 0.42, color: '#2e120c', rim: '#140604' },               // Asche
      { t: 0.62, color: '#140806', rim: '#000000' },               // Obsidian-Platten
      { t: 0.0, t2: 0.3, color: '#ff5a1f', rim: '#7a1a05' },       // Lava
      { t: 0.0, t2: 0.22, color: '#ffb13d' },                      // heiße Lava-Mitte
    ]));
    // pulsierendes Glühen + aufsteigende Glut (bildschirmfest, nur Deko)
    c.fillStyle = `rgba(255,70,20,${0.05 + Math.sin(time * 2) * 0.03})`; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * W, sp = 20 + (i % 7) * 8;
      const y = H - ((time * sp + i * 97) % (H + 40));
      c.fillStyle = i % 3 ? 'rgba(255,140,40,0.7)' : 'rgba(255,220,80,0.8)';
      c.fillRect(x + Math.sin(time + i) * 10, y, 2 + (i % 3), 2 + (i % 3));
    }
  },

  // ---------------- Weltall
  space(k) { drawSpace(k.c, k.g, k.W, k.H, k.z, k.world, k.time); },

  // ---------------- Prärie: Ranch-Weiden mit Zäunen, Wagenwege, flache Steppe (keine Deko-Steine!)
  sand(k) {
    const { c, sx, sy, z, v, S, W, H } = k;
    if (!k.skipTerrain) cached(k, 'sand', kk => terrain(kk, S * 8, 31, [{ t: 0.6, color: '#d9b770' }, { t: 0.0, t2: 0.3, color: '#ead39a' }]));
    const B = S * 16, Rw = S * 2.2;
    const bx0 = Math.floor(v.x0 / B), bx1 = Math.ceil(v.x1 / B), by0 = Math.floor(v.y0 / B), by1 = Math.ceil(v.y1 / B);
    // Wagenwege (flache, hellere Bänder mit Radspuren)
    c.fillStyle = '#ecd9a6';
    for (let ix = bx0; ix <= bx1; ix++) c.fillRect(sx(ix * B) - Rw * z / 2, 0, Rw * z, H);
    for (let iy = by0; iy <= by1; iy++) c.fillRect(0, sy(iy * B) - Rw * z / 2, W, Rw * z);
    c.strokeStyle = 'rgba(140,100,50,0.25)'; c.lineWidth = Math.max(1, S * z * 0.1); c.beginPath();
    for (let ix = bx0; ix <= bx1; ix++) for (const o of [-0.4, 0.4]) { c.moveTo(sx(ix * B + Rw * o), 0); c.lineTo(sx(ix * B + Rw * o), H); }
    for (let iy = by0; iy <= by1; iy++) for (const o of [-0.4, 0.4]) { c.moveTo(0, sy(iy * B + Rw * o)); c.lineTo(W, sy(iy * B + Rw * o)); }
    c.stroke();
    for (let ix = bx0; ix <= bx1; ix++) for (let iy = by0; iy <= by1; iy++) {
      const h = hash(ix, iy, 501), x = ix * B + Rw, y = iy * B + Rw, w = B - Rw * 2;
      if (h < 0.55) { // eingezäunte Weide mit etwas grünerem Gras
        c.fillStyle = 'rgba(160,170,80,0.35)'; c.fillRect(sx(x + S * 0.3), sy(y + S * 0.3), (w - S * 0.6) * z, (w - S * 0.6) * z);
        c.strokeStyle = '#9a6a3a'; c.lineWidth = Math.max(1.5, S * z * 0.12);
        c.strokeRect(sx(x), sy(y), w * z, w * z);
        if (S * z * 6 > 30) { c.fillStyle = '#7a4e2a'; for (let q = 0; q <= 8; q++) for (const [px, py] of [[x + w * q / 8, y], [x + w * q / 8, y + w], [x, y + w * q / 8], [x + w, y + w * q / 8]]) c.fillRect(sx(px) - 2, sy(py) - 2, 4, 4); }
      } else if (h < 0.7) { // Wasserloch (flach)
        c.fillStyle = '#c9a35a'; c.beginPath(); c.ellipse(sx(x + w * 0.5), sy(y + w * 0.5), w * 0.22 * z, w * 0.14 * z, 0, 0, TAU); c.fill();
        c.fillStyle = '#6fb6d9'; c.beginPath(); c.ellipse(sx(x + w * 0.5), sy(y + w * 0.5), w * 0.17 * z, w * 0.1 * z, 0, 0, TAU); c.fill();
      }
    }
    // trockene Grasbüschel (sehr dezent, flach)
    const C = S * 3;
    if (C * z > 18) {
      c.strokeStyle = 'rgba(150,120,60,0.45)'; c.lineWidth = Math.max(1, S * z * 0.06); c.beginPath();
      cells(v, C, (ix, iy) => {
        const h = hash(ix, iy, 33); if (h > 0.35) return;
        const X = sx((ix + hash(iy, ix, 34)) * C), Y = sy((iy + hash(ix, iy, 35)) * C), u = S * z;
        for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.35; c.moveTo(X, Y); c.lineTo(X + Math.cos(a) * u * 0.35, Y + Math.sin(a) * u * 0.35); }
      });
      c.stroke();
    }
  },

  // ---------------- Westernstadt: Lehmstraßen mit Holz-Gehwegen
  town(k) {
    streetGrid(k, {
      block: 12, road: 3, walk: 0.9, asphalt: '#b8875a', curb: '#6a4220', walkCol: '#9a6638', center: null,
      lot(k, x, y, w, h) {
        const { c, sx, sy, z, S } = k;
        c.fillStyle = '#e0c088'; c.fillRect(sx(x), sy(y), w * z, w * z);
        c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = 1; c.beginPath();
        for (let t = 0; t < w; t += S * 0.9) { c.moveTo(sx(x), sy(y + t)); c.lineTo(sx(x + w), sy(y + t)); }
        c.stroke();
        if (h < 0.4) { c.fillStyle = '#c9a35a'; c.beginPath(); c.ellipse(sx(x + w * 0.5), sy(y + w * 0.5), w * 0.3 * z, w * 0.2 * z, 0, 0, TAU); c.fill(); }
      },
    });
    // Planken-Linien auf den Holzgehwegen + Wagenspuren
    const { c, sx, sy, z, v, S } = k;
    c.strokeStyle = 'rgba(60,30,10,0.35)'; c.lineWidth = Math.max(1, S * z * 0.06); c.beginPath();
    const B = S * 12;
    for (let ix = Math.floor(v.x0 / B); ix <= Math.ceil(v.x1 / B); ix++) for (const off of [-S * 0.6, S * 0.6]) { c.moveTo(sx(ix * B + off), 0); c.lineTo(sx(ix * B + off), k.H); }
    for (let iy = Math.floor(v.y0 / B); iy <= Math.ceil(v.y1 / B); iy++) for (const off of [-S * 0.6, S * 0.6]) { c.moveTo(0, sy(iy * B + off)); c.lineTo(k.W, sy(iy * B + off)); }
    c.stroke();
  },

  // ---------------- Canyon: Gesteinsschichten, Fluss
  canyon(k) {
    cached(k, 'canyon', kk => terrain(kk, k.S * 9, 41, [
      { t: 0.0, t2: 0.28, color: '#8a4a2a' },                 // Schlucht
      { t: 0.0, t2: 0.22, color: '#4fa3c9', rim: '#3a86ab' }, // Fluss
      { t: 0.5, color: '#e0965a', rim: '#b8693a' },
      { t: 0.62, color: '#eaa66a', rim: '#a8552a' },          // Mesa-Plateau mit Kante
      { t: 0.76, color: '#f0b47a', rim: '#b85a2a' },
    ]));
    // Flussufer-Kiesel als flache Punkte (keine Steine, die wie Objekte aussehen)
  },

  // ---------------- Zuckerwiese: Zuckerguss-Fliesen, Schoko-Bach (keine Streusel – die sind Objekte!)
  candy(k) {
    const { c, sx, sy, z, v, S, W, H } = k;
    const T = S * 4;
    if (T * z > 8) {
      c.fillStyle = '#ffb6d6';
      cells(v, T, (ix, iy) => { if ((ix + iy) & 1) c.fillRect(sx(ix * T), sy(iy * T), T * z + 1, T * z + 1); });
      c.fillStyle = 'rgba(255,255,255,0.35)';
      cells(v, T, (ix, iy) => { c.beginPath(); c.arc(sx((ix + 0.5) * T), sy((iy + 0.5) * T), T * z * 0.12, 0, TAU); c.fill(); });
    }
    cached(k, 'candy', kk => terrain(kk, S * 9, 51, [{ t: 0.66, color: '#ffffff', rim: '#ffd0e6' }, { t: 0.0, t2: 0.24, color: '#8a4a2a', rim: '#6a3418' }]));
  },

  // ---------------- Bonbonstadt
  candytown(k) {
    streetGrid(k, {
      block: 12, road: 2.6, walk: 0.9, asphalt: '#ff9ac8', curb: '#ffffff', walkCol: '#fff0f6', center: '#ffffff', zebra: 'rgba(255,255,255,0.9)',
      lot(k, x, y, w, h, ix, iy) { // Minz-Rasen mit Zuckerstangen-Beeteinfassung (flach)
        const { c, sx, sy, z, S } = k, u = S * z;
        c.fillStyle = '#b8f0d0'; c.fillRect(sx(x), sy(y), w * z, w * z);
        c.fillStyle = '#a6e6c2'; for (let i = 0; i < 6; i += 2) c.fillRect(sx(x + i * w / 6), sy(y), w / 6 * z, w * z);
        const bw = S * 0.5;
        for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff6fa8'; c.fillRect(sx(x + i * w / 12), sy(y), w / 12 * z + 1, bw * z); c.fillRect(sx(x + i * w / 12), sy(y + w - bw), w / 12 * z + 1, bw * z); }
        if (h < 0.4) { c.fillStyle = '#ffe6a0'; c.beginPath(); c.ellipse(sx(x + w / 2), sy(y + w / 2), w * 0.2 * z, w * 0.14 * z, 0, 0, TAU); c.fill(); c.fillStyle = '#c98a4a'; c.beginPath(); c.ellipse(sx(x + w / 2), sy(y + w / 2), w * 0.15 * z, w * 0.09 * z, 0, 0, TAU); c.fill(); }
      },
    });
  },

  // ---------------- Schokogebirge
  choco(k) {
    const { c, sx, sy, z, v, S } = k;
    cached(k, 'choco', kk => terrain(kk, S * 9, 61, [{ t: 0.0, t2: 0.3, color: '#d9933a', rim: '#b8732a' }, { t: 0.0, t2: 0.24, color: '#f0b04a' }, { t: 0.55, color: '#6a3a22', rim: '#4a2614' }, { t: 0.68, color: '#4a2614', rim: '#2e160a' }, { t: 0.8, color: '#f6e6d0', rim: '#d0b89a' }]));
    const C = S * 2.5;
    if (C * z > 16) {
      c.strokeStyle = 'rgba(0,0,0,0.13)'; c.lineWidth = Math.max(1.5, S * z * 0.1); c.beginPath();
      cells(v, C, (ix, iy) => { c.rect(sx(ix * C + S * 0.15), sy(iy * C + S * 0.15), (C - S * 0.3) * z, (C - S * 0.3) * z); });
      c.stroke();
    }
  },
};
GROUNDS.rock = GROUNDS.alpine;

let spaceTex = null;
// Eigenes Motiv je Weltraum-Welt (einmal in die Hintergrund-Textur gemalt, nahtlos kachelbar)
function spaceTheme(o, world, w, h) {
  let seed = 7; for (const ch of world.id) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const wrap = (fn) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { o.save(); o.translate(dx, dy); fn(); o.restore(); } };
  const m = Math.min(w, h);
  switch (world.theme || world.id) {
    case 'forge': { // Sternenschmiede: glühende Esse in der Ecke, Funkenbögen
      wrap(() => { const X = w * 0.2, Y = h * 0.8, g = o.createRadialGradient(X, Y, 0, X, Y, m * 0.6); g.addColorStop(0, 'rgba(255,220,120,0.8)'); g.addColorStop(0.2, 'rgba(255,120,30,0.5)'); g.addColorStop(1, 'rgba(255,80,20,0)'); o.fillStyle = g; o.beginPath(); o.arc(X, Y, m * 0.6, 0, TAU); o.fill();
        o.strokeStyle = 'rgba(255,180,60,0.35)'; o.lineWidth = 1.2; for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.1 + rnd() * 0.5), l = m * (0.2 + rnd() * 0.5); o.beginPath(); o.moveTo(X, Y); o.quadraticCurveTo(X + Math.cos(a) * l * 0.6, Y + Math.sin(a) * l, X + Math.cos(a) * l, Y + Math.sin(a) * l * 0.5); o.stroke(); } });
      break;
    }
    case 'darksun': { // Dunkle Sonne: schwarze Sonne mit roter Korona
      wrap(() => { const X = w * 0.7, Y = h * 0.35, R = m * 0.16; const g = o.createRadialGradient(X, Y, R * 0.9, X, Y, R * 3.2); g.addColorStop(0, 'rgba(255,60,40,0.85)'); g.addColorStop(0.3, 'rgba(180,20,10,0.35)'); g.addColorStop(1, 'rgba(80,0,0,0)'); o.fillStyle = g; o.beginPath(); o.arc(X, Y, R * 3.2, 0, TAU); o.fill(); o.fillStyle = '#050000'; o.beginPath(); o.arc(X, Y, R, 0, TAU); o.fill(); });
      break;
    }
    case 'void': { // Leere: fast nichts – nur einzelne verblassende Risse
      for (let i = 0; i < 8; i++) { const X = rnd() * w, Y = rnd() * h, L = m * (0.05 + rnd() * 0.12); wrap(() => { o.strokeStyle = 'rgba(160,160,200,0.18)'; o.lineWidth = 1; o.beginPath(); o.moveTo(X, Y); o.lineTo(X + L, Y + L * 0.3); o.lineTo(X + L * 1.4, Y - L * 0.2); o.stroke(); }); }
      break;
    }
    case 'quantum': { // Quantenschaum: überlagerte, schimmernde Blasen
      for (let i = 0; i < 40; i++) { const X = rnd() * w, Y = rnd() * h, R = m * (0.01 + rnd() * 0.05), al = 0.15 + rnd() * 0.3; wrap(() => { o.strokeStyle = `rgba(127,211,255,${al})`; o.lineWidth = 1; o.beginPath(); o.arc(X, Y, R, 0, TAU); o.stroke(); }); }
      break;
    }
    case 'grave': { // Sternengrab: ausgebrannte Sternhüllen
      for (let i = 0; i < 6; i++) { const X = rnd() * w, Y = rnd() * h, R = m * (0.05 + rnd() * 0.1); wrap(() => { o.strokeStyle = 'rgba(150,150,180,0.18)'; o.lineWidth = 2; o.beginPath(); o.arc(X, Y, R, 0, TAU); o.stroke(); o.fillStyle = 'rgba(80,80,100,0.15)'; o.beginPath(); o.arc(X, Y, R * 0.4, 0, TAU); o.fill(); }); }
      break;
    }
    case 'omega': { // Omega-Nebel: pinke Nebelbänder
      for (let i = 0; i < 6; i++) { const X = rnd() * w, Y = rnd() * h, rot = rnd() * 3; wrap(() => { const g = o.createRadialGradient(X, Y, 0, X, Y, m * 0.35); g.addColorStop(0, 'rgba(255,74,176,0.35)'); g.addColorStop(1, 'rgba(255,74,176,0)'); o.fillStyle = g; o.beginPath(); o.ellipse(X, Y, m * 0.45, m * 0.18, rot, 0, TAU); o.fill(); }); }
      break;
    }
    case 'edge': { // Der Rand: goldene Grenzlinie am Ende des Universums
      wrap(() => { o.strokeStyle = 'rgba(255,210,63,0.35)'; o.lineWidth = 3; o.setLineDash([12, 10]); o.beginPath(); o.moveTo(0, h * 0.62); o.bezierCurveTo(w * 0.3, h * 0.5, w * 0.7, h * 0.75, w, h * 0.62); o.stroke(); o.setLineDash([]); });
      break;
    }
    case 'lastlight': { // Das Letzte Licht: ein einziger warmer Schein
      wrap(() => { const X = w * 0.5, Y = h * 0.5, g = o.createRadialGradient(X, Y, 0, X, Y, m * 0.5); g.addColorStop(0, 'rgba(255,248,208,0.35)'); g.addColorStop(1, 'rgba(255,248,208,0)'); o.fillStyle = g; o.beginPath(); o.arc(X, Y, m * 0.5, 0, TAU); o.fill(); });
      break;
    }
    case 'planet': { // Erdorbit: großer Erdrand mit Atmosphäre und Wolken
      wrap(() => {
        const X = w * 0.18, Y = h * 1.25, R = m * 0.95;
        const at = o.createRadialGradient(X, Y, R * 0.96, X, Y, R * 1.12); at.addColorStop(0, 'rgba(120,200,255,0.55)'); at.addColorStop(1, 'rgba(120,200,255,0)');
        o.fillStyle = at; o.beginPath(); o.arc(X, Y, R * 1.12, 0, TAU); o.fill();
        const gr = o.createRadialGradient(X + R * 0.3, Y - R * 0.6, R * 0.1, X, Y, R); gr.addColorStop(0, '#3a8ad8'); gr.addColorStop(1, '#0d2a5a');
        o.fillStyle = gr; o.beginPath(); o.arc(X, Y, R, 0, TAU); o.fill();
        o.save(); o.beginPath(); o.arc(X, Y, R, 0, TAU); o.clip();
        o.fillStyle = 'rgba(70,150,80,0.75)'; for (let i = 0; i < 6; i++) { o.beginPath(); o.ellipse(X - R * 0.2 + rnd() * R * 0.9, Y - R * (0.75 + rnd() * 0.2), R * (0.06 + rnd() * 0.12), R * (0.03 + rnd() * 0.05), rnd() * 3, 0, TAU); o.fill(); }
        o.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 8; i++) { o.beginPath(); o.ellipse(X - R * 0.3 + rnd() * R, Y - R * (0.8 + rnd() * 0.18), R * (0.08 + rnd() * 0.1), R * 0.015, rnd() * 0.4, 0, TAU); o.fill(); }
        o.restore();
      });
      break;
    }
    case 'solar': { // Sonnensystem: glühende Sonne in der Ecke, Umlaufbahnen
      wrap(() => {
        const X = w * 0.85, Y = h * 0.2;
        const sg = o.createRadialGradient(X, Y, 0, X, Y, m * 0.55); sg.addColorStop(0, 'rgba(255,240,180,0.9)'); sg.addColorStop(0.12, 'rgba(255,190,60,0.75)'); sg.addColorStop(0.4, 'rgba(255,110,30,0.2)'); sg.addColorStop(1, 'rgba(255,80,20,0)');
        o.fillStyle = sg; o.beginPath(); o.arc(X, Y, m * 0.55, 0, TAU); o.fill();
        o.strokeStyle = 'rgba(255,210,120,0.14)'; o.lineWidth = 1;
        for (let i = 1; i < 6; i++) { o.beginPath(); o.ellipse(X, Y, m * 0.18 * i, m * 0.11 * i, -0.3, 0, TAU); o.stroke(); }
        o.fillStyle = 'rgba(200,170,140,0.5)'; for (let i = 0; i < 70; i++) { const a = rnd() * TAU, r = m * (0.6 + rnd() * 0.08); o.fillRect(X + Math.cos(a - 0.3) * r, Y + Math.sin(a) * r * 0.61, 1.2, 1.2); }
      });
      break;
    }
    case 'galaxy': { // Milchstraße: helles, diagonales Sternenband mit Staubwolken
      wrap(() => {
        o.save(); o.translate(w / 2, h / 2); o.rotate(-0.45);
        const bg = o.createLinearGradient(0, -m * 0.3, 0, m * 0.3); bg.addColorStop(0, 'rgba(176,107,255,0)'); bg.addColorStop(0.5, 'rgba(230,200,255,0.35)'); bg.addColorStop(1, 'rgba(176,107,255,0)');
        o.fillStyle = bg; o.fillRect(-w, -m * 0.3, w * 2, m * 0.6);
        o.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 260; i++) { const y = (rnd() + rnd() + rnd() - 1.5) * m * 0.16; o.fillRect((rnd() - 0.5) * w * 2, y, rnd() < 0.1 ? 1.6 : 0.8, rnd() < 0.1 ? 1.6 : 0.8); }
        o.fillStyle = 'rgba(40,10,60,0.45)'; for (let i = 0; i < 10; i++) { o.beginPath(); o.ellipse((rnd() - 0.5) * w * 1.6, (rnd() - 0.5) * m * 0.12, m * (0.08 + rnd() * 0.12), m * 0.02, 0, 0, TAU); o.fill(); }
        o.restore();
      });
      break;
    }
    case 'supercluster': { // Galaxienhaufen: viele kleine Spiralgalaxien
      for (let i = 0; i < 26; i++) {
        const X = rnd() * w, Y = rnd() * h, R = m * (0.015 + rnd() * 0.04), rot = rnd() * TAU, col = rnd() < 0.5 ? '160,240,255' : '255,220,170';
        wrap(() => {
          o.save(); o.translate(X, Y); o.rotate(rot); o.scale(1, 0.45 + rnd() * 0.4);
          const gg = o.createRadialGradient(0, 0, 0, 0, 0, R * 2); gg.addColorStop(0, `rgba(${col},0.9)`); gg.addColorStop(0.25, `rgba(${col},0.35)`); gg.addColorStop(1, `rgba(${col},0)`);
          o.fillStyle = gg; o.beginPath(); o.arc(0, 0, R * 2, 0, TAU); o.fill();
          o.strokeStyle = `rgba(${col},0.35)`; o.lineWidth = Math.max(0.6, R * 0.15);
          for (let k = 0; k < 2; k++) { o.beginPath(); for (let a = 0; a < 5; a += 0.2) { const r = R * 0.2 + a * R * 0.32; const x = Math.cos(a + k * Math.PI) * r, y = Math.sin(a + k * Math.PI) * r; a ? o.lineTo(x, y) : o.moveTo(x, y); } o.stroke(); }
          o.restore();
        });
      }
      break;
    }
    case 'universe': { // Kosmisches Netz: leuchtende Filamente zwischen Knoten
      const nodes = []; for (let i = 0; i < 22; i++) nodes.push([rnd() * w, rnd() * h, 0.5 + rnd()]);
      wrap(() => {
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const [x1, y1] = nodes[i], [x2, y2] = nodes[j], d = Math.hypot(x2 - x1, y2 - y1);
          if (d > m * 0.42) continue;
          o.strokeStyle = `rgba(255,120,200,${0.32 * (1 - d / (m * 0.42))})`; o.lineWidth = 2.2; o.beginPath(); o.moveTo(x1, y1); o.quadraticCurveTo((x1 + x2) / 2 + (y2 - y1) * 0.15, (y1 + y2) / 2 - (x2 - x1) * 0.15, x2, y2); o.stroke();
          o.strokeStyle = `rgba(160,220,255,${0.25 * (1 - d / (m * 0.42))})`; o.lineWidth = 0.8; o.stroke();
        }
        for (const [x, y, k] of nodes) { const ng = o.createRadialGradient(x, y, 0, x, y, m * 0.05 * k); ng.addColorStop(0, 'rgba(255,230,250,0.9)'); ng.addColorStop(0.3, 'rgba(255,80,180,0.4)'); ng.addColorStop(1, 'rgba(255,80,180,0)'); o.fillStyle = ng; o.beginPath(); o.arc(x, y, m * 0.05 * k, 0, TAU); o.fill(); }
      });
      break;
    }
    case 'multiverse': { // Multiversum: schillernde Universums-Blasen
      for (let i = 0; i < 10; i++) {
        const X = rnd() * w, Y = rnd() * h, R = m * (0.06 + rnd() * 0.16), hue = Math.floor(rnd() * 360);
        wrap(() => {
          // Universums-Blase: dunkles Inneres mit eigenem Farbnebel, leuchtender Rand
          const bg2 = o.createRadialGradient(X - R * 0.3, Y - R * 0.3, R * 0.1, X, Y, R); bg2.addColorStop(0, `hsla(${hue},85%,55%,0.22)`); bg2.addColorStop(0.7, `hsla(${hue},80%,30%,0.16)`); bg2.addColorStop(1, `hsla(${(hue + 60) % 360},95%,65%,0.35)`);
          o.fillStyle = bg2; o.beginPath(); o.arc(X, Y, R, 0, TAU); o.fill();
          o.strokeStyle = `hsla(${(hue + 120) % 360},95%,70%,0.4)`; o.lineWidth = 1.5; o.stroke();
          o.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 6; k++) o.fillRect(X + (rnd() - 0.5) * R * 1.2, Y + (rnd() - 0.5) * R * 1.2, 1.2, 1.2);
          o.fillStyle = 'rgba(255,255,255,0.5)'; o.beginPath(); o.ellipse(X - R * 0.4, Y - R * 0.45, R * 0.18, R * 0.08, -0.6, 0, TAU); o.fill();
        });
      }
      break;
    }
  }
}

function drawSpace(c, g, W, H, z, world, time) {
  const cam = g.cam;
  // Nebel-Hintergrund einmal pro Welt vorzeichnen
  const key = world.id + W + 'x' + H;
  if (!spaceTex || spaceTex.key !== key) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(W * 0.5); cv.height = Math.ceil(H * 0.5);
    const o = cv.getContext('2d'); o.fillStyle = world.bg; o.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(i * 3.3 + world.id.length) * 0.5 + 0.5) * cv.width, y = (Math.cos(i * 2.1 + world.id.length) * 0.5 + 0.5) * cv.height;
      const gr = o.createRadialGradient(x, y, 0, x, y, Math.max(cv.width, cv.height) * (0.3 + i * 0.07));
      gr.addColorStop(0, (i % 2 ? world.accent : world.bg2) + '66'); gr.addColorStop(1, world.bg2 + '00');
      o.fillStyle = gr; o.fillRect(0, 0, cv.width, cv.height);
    }
    spaceTheme(o, world, cv.width, cv.height);
    spaceTex = { key, cv };
  }
  const px = ((-cam.x * z * 0.01) % W + W) % W, py = ((-cam.y * z * 0.01) % H + H) % H;
  for (const [ox, oy] of [[0, 0], [-W, 0], [0, -H], [-W, -H]]) c.drawImage(spaceTex.cv, px + ox, py + oy, W, H);
  for (const s of STARS) {
    const x = ((s.x * W - cam.x * z * s.p * 0.02) % W + W) % W;
    const y = ((s.y * H - cam.y * z * s.p * 0.02) % H + H) % H;
    const tw = 0.35 + s.p + Math.sin(time * 2 + s.tw) * 0.2;
    c.globalAlpha = Math.max(0, Math.min(1, tw));
    c.fillStyle = '#ffffff'; c.fillRect(x, y, s.s, s.s);
    if (s.s > 1.9) { c.fillRect(x - s.s * 1.5, y + s.s * 0.4, s.s * 4, 0.6); c.fillRect(x + s.s * 0.4, y - s.s * 1.5, 0.6, s.s * 4); }
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------
export function render(c, g, W, H, time) {
  const cam = g.cam, z = cam.zoom, p = g.p;
  const world = g.worlds[g.world];
  const shk = (g.fx && g.fx.shake === false ? 0 : g.shake) * Math.min(W, H) * 0.014;
  const ox = W / 2 + (Math.random() - 0.5) * shk, oy = H / 2 + (Math.random() - 0.5) * shk;
  const sx = x => (x - cam.x) * z + ox, sy = y => (y - cam.y) * z + oy;
  c.lineJoin = 'round'; c.lineCap = 'round';

  const PF = typeof window !== 'undefined' && window.__prof; let pt = PF ? performance.now() : 0;
  const lap = n => { if (!PF) return; const t2 = performance.now(); PF[n] = (PF[n] || 0) + t2 - pt; if (t2 - pt > 60) (PF.spikes = PF.spikes || []).push(n + '@' + world.name + ':' + (t2 - pt).toFixed(0)); pt = t2; };
  const SK = typeof window !== 'undefined' && window.__skip || {};
  if (SK.boden) { c.fillStyle = world.bg; c.fillRect(0, 0, W, H); } else drawGround(c, g, W, H, sx, sy, z, world, time); lap('boden');

  // Trümmer-Flecken auf dem Boden
  for (const d of g.decals) {
    const X = sx(d.x), Y = sy(d.y), R = d.size * z;
    if (X < -R || X > W + R || Y < -R || Y > H + R) continue;
    c.globalAlpha = Math.min(1, d.life / 3) * 0.55;
    c.fillStyle = 'rgba(40,25,20,0.5)'; c.beginPath(); c.ellipse(X, Y + R * 0.3, R, R * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = d.color;
    for (let i = 0; i < 5; i++) { const a = d.seed * 10 + i * 1.3, r = R * (0.2 + (i % 3) * 0.25); c.fillRect(X + Math.cos(a) * r - R * 0.08, Y + R * 0.3 + Math.sin(a) * r * 0.45 - R * 0.05, R * 0.16, R * 0.1); }
  }
  c.globalAlpha = 1;

  // Meteor-Schatten
  for (const m of g.meteors) {
    const k = 1 - m.t / 0.7;
    c.fillStyle = `rgba(0,0,0,${0.15 + k * 0.3})`;
    c.beginPath(); c.ellipse(sx(m.x), sy(m.y), m.r * z * k, m.r * z * k * 0.5, 0, 0, TAU); c.fill();
    const mx = sx(m.x) + (1 - k) * W * 0.3, my = sy(m.y) - (1 - k) * H * 0.7;
    c.fillStyle = '#ffb13d'; c.beginPath(); c.arc(mx, my, Math.max(4, p.r * z * 0.5), 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,200,80,0.5)'; c.lineWidth = Math.max(3, p.r * z * 0.4); c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + W * 0.08, my - H * 0.18); c.stroke();
  }

  // Bodenwellen (Stampfer)
  for (const r of g.rings) if (r.ground) {
    const k = 1 - r.life / r.max;
    c.strokeStyle = r.color; c.globalAlpha = 1 - k; c.lineWidth = Math.max(3, r.r * z * 0.1 * (1 - k));
    c.beginPath(); c.ellipse(sx(r.x), sy(r.y), r.r * z * (0.2 + 0.8 * k), r.r * z * (0.2 + 0.8 * k) * 0.5, 0, 0, TAU); c.stroke();
    c.globalAlpha = 1;
  }

  // Skill-Effekte am Boden: Lava, Singularität
  for (const L of g.lava || []) {
    const a = Math.min(1, L.life / 1.5);
    c.fillStyle = `rgba(255,90,20,${0.55 * a})`; c.beginPath(); c.ellipse(sx(L.x), sy(L.y), L.r * z, L.r * z * 0.55, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,210,63,${0.5 * a})`; c.beginPath(); c.ellipse(sx(L.x), sy(L.y), L.r * z * 0.55, L.r * z * 0.3, 0, 0, TAU); c.fill();
  }
  if (p.phoenixT > 0) { // Phönixfeuer: flackernder Flammenkranz am Boden
    const X = sx(p.x), Y = sy(p.y), R = p.r * 3.8 * z, fl = 0.85 + Math.sin(time * 18) * 0.15;
    const gr = c.createRadialGradient(X, Y, R * 0.55, X, Y, R * 1.05); gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(0.75, `rgba(255,120,30,${0.45 * fl})`); gr.addColorStop(1, 'rgba(255,210,63,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(X, Y, R * 1.05, R * 0.6, 0, 0, TAU); c.fill();
    c.strokeStyle = `rgba(255,210,63,${0.6 * fl})`; c.lineWidth = Math.max(2, p.r * z * 0.12); c.beginPath(); c.ellipse(X, Y, R, R * 0.57, 0, 0, TAU); c.stroke();
  }
  if (g.singularity) {
    const s2 = g.singularity, X = sx(s2.x), Y = sy(s2.y), R = p.r * z * 1.3;
    const gr = c.createRadialGradient(X, Y, R * 0.3, X, Y, R * 3); gr.addColorStop(0, '#000'); gr.addColorStop(0.3, '#000'); gr.addColorStop(0.45, '#ffb13d'); gr.addColorStop(0.7, 'rgba(176,107,255,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(X, Y, R * 3, R * 1.8, time * 2, 0, TAU); c.fill();
  }

  // Magnet-Reichweite (nur wenn Magnet gelevelt)
  if (g.stats.magnet > 0 && g.state === 'play') {
    const R = g.magnetRange() * z;
    c.strokeStyle = g.stats.hole ? 'rgba(190,130,255,0.32)' : 'rgba(255,220,90,0.18)'; c.lineWidth = 2; c.setLineDash([6, 8]);
    c.beginPath(); c.ellipse(sx(p.x), sy(p.y), R, R * 0.55, 0, 0, TAU); c.stroke(); c.setLineDash([]);
  }

  lap('bodenfx');
  // ---- Objekte + Monster, nach Tiefe sortiert
  const limit = g.breakLimit();
  const drawList = [];
  for (const o of g.objects) {
    const X = sx(o.x), Y = sy(o.y), R = o.size * z;
    if (X < -R * 2.5 || X > W + R * 2.5 || Y < -R * 2.5 || Y > H + R * 2.5) continue;
    drawList.push(o);
  }
  drawList.push(null); // Platzhalter für das Monster
  if (g.boss) drawList.push(BOSS_TOKEN);
  const yOf = o => o === null ? p.y : o === BOSS_TOKEN ? g.boss.y : o.y;
  drawList.sort((a, b) => yOf(a) - yOf(b));
  drawBossFloor(c, g, sx, sy, z, time);
  const hasFilter = 'filter' in c;
  for (const o of drawList) {
    if (o === null) { if (g.state !== 'dying' && g.state !== 'over' && !SK.player) drawPlayer(c, g, sx(p.x), sy(p.y), g.hr() * z, time); continue; }
    if (o === BOSS_TOKEN) { drawBoss(c, g, sx, sy, z, time); continue; }
    if (!SK.objekte) drawObject(c, g, o, sx(o.x), sy(o.y), o.size * z, limit, time, hasFilter);
  }

  lap('objekte');
  // Trümmerstücke
  for (const ch of g.chunks) {
    const X = sx(ch.x), Y = sy(ch.y), s = Math.max(2, ch.size * z);
    if (X < -50 || X > W + 50 || Y < -50 || Y > H + 50) continue;
    c.globalAlpha = Math.min(1, ch.life * 2);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(X, Y, s * 0.6, s * 0.25, 0, 0, TAU); c.fill();
    c.save(); c.translate(X, Y - ch.z * z); c.rotate(ch.rot);
    c.beginPath();
    for (let i = 0; i < ch.sides; i++) { const a = i / ch.sides * TAU; c.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.4); }
    c.closePath(); c.fillStyle = ch.color; c.fill(); c.lineWidth = Math.max(1, s * 0.12); c.strokeStyle = OUT; c.stroke();
    c.restore();
  }
  c.globalAlpha = 1;

  // Münzen
  const cr = Math.max(4, Math.min(9, p.r * z * 0.17));
  for (const k of g.coins) {
    const X = sx(k.x), Y = sy(k.y);
    if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue;
    if (k.life < 2 && Math.floor(k.life * 8) % 2 === 0) continue;
    const hz = k.z * z;
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(X, Y + cr * 0.4, cr * 0.8, cr * 0.3, 0, 0, TAU); c.fill();
    const w = Math.max(0.25, Math.abs(Math.cos(k.spin)));
    c.fillStyle = '#b07a00'; c.beginPath(); c.ellipse(X, Y - hz, cr * w, cr, 0, 0, TAU); c.fill();
    c.fillStyle = k.golden ? '#fff1a0' : '#ffd23f'; c.beginPath(); c.ellipse(X - cr * 0.08 * w, Y - hz - cr * 0.05, cr * 0.82 * w, cr * 0.85, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(X - cr * 0.3 * w, Y - hz - cr * 0.35, cr * 0.18 * w, cr * 0.25, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  }

  // Stacheln, Raketen, Tentakel
  c.strokeStyle = '#f2e6c8'; c.lineWidth = Math.max(2, p.r * z * 0.12);
  for (const sp of g.spikes || []) { c.beginPath(); c.moveTo(sx(sp.x), sy(sp.y) - p.r * z); c.lineTo(sx(sp.x - sp.vx * p.r * 0.8), sy(sp.y - sp.vy * p.r * 0.8) - p.r * z); c.stroke(); }
  for (const rk of g.rockets || []) {
    const k = Math.min(1, rk.t / rk.dur), X = sx(rk.x + (rk.tx - rk.x) * k), Y = sy(rk.y + (rk.ty - rk.y) * k) - Math.sin(k * Math.PI) * 80;
    c.fillStyle = '#d0d4dc'; c.beginPath(); c.arc(X, Y, Math.max(3, p.r * z * 0.15), 0, TAU); c.fill();
    c.fillStyle = '#ff8a1f'; c.beginPath(); c.arc(X - 4, Y + 3, Math.max(2, p.r * z * 0.1), 0, TAU); c.fill();
  }
  c.strokeStyle = '#7fffe0'; c.lineWidth = Math.max(3, p.r * z * 0.2);
  for (const f of g.grabFx || []) { c.globalAlpha = f.life / 0.4; c.beginPath(); c.moveTo(sx(p.x), sy(p.y) - p.r * z); c.quadraticCurveTo(sx((p.x + f.x) / 2), sy((p.y + f.y) / 2) - p.r * z * 3, sx(f.x), sy(f.y)); c.stroke(); }
  c.globalAlpha = 1;

  lap('truemmer_muenzen');
  // Staubwolken
  for (const u of g.puffs) {
    c.globalAlpha = Math.max(0, u.life / u.max) * 0.7;
    c.fillStyle = u.color; c.beginPath(); c.arc(sx(u.x), sy(u.y), Math.max(2, u.r * z), 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  // Druckwellen
  for (const r of g.rings) if (!r.ground) {
    const k = 1 - r.life / r.max;
    c.strokeStyle = r.color; c.globalAlpha = 1 - k; c.lineWidth = Math.max(2, r.r * z * 0.1 * (1 - k));
    c.beginPath(); c.ellipse(sx(r.x), sy(r.y), r.r * z * (0.3 + 0.7 * k), r.r * z * (0.3 + 0.7 * k) * 0.7, 0, 0, TAU); c.stroke();
    c.globalAlpha = 1;
  }

  // Partikel
  for (const q of g.particles) {
    const X = sx(q.x), Y = sy(q.y), s = Math.max(2, q.size * z);
    c.globalAlpha = Math.min(1, q.life / q.max * 1.5);
    c.fillStyle = q.color;
    if (q.kind === 'spark') { c.strokeStyle = q.color; c.lineWidth = Math.max(2, s * 0.5); c.beginPath(); c.moveTo(X, Y); c.lineTo(X - q.vx * z * 0.04, Y - q.vy * z * 0.04); c.stroke(); }
    else if (q.kind === 'flame') { c.beginPath(); c.arc(X, Y, s * (q.life / q.max), 0, TAU); c.fill(); }
    else { c.save(); c.translate(X, Y); c.rotate(q.rot); c.fillRect(-s / 2, -s / 2, s, s); c.restore(); }
  }
  c.globalAlpha = 1;

  lap('puffs_partikel');
  // schwebende Texte (poppen auf)
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const t of g.texts) {
    const age = t.max - t.life, pop = age < 0.12 ? 0.6 + age / 0.12 * 0.6 : 1.2 - Math.min(0.2, (age - 0.12) * 1.5);
    c.globalAlpha = Math.min(1, t.life / t.max * 2.5);
    const size = Math.round((t.big ? 26 : 17) * pop);
    c.font = `${size}px "Lilita One", system-ui, sans-serif`;
    c.lineWidth = 5; c.strokeStyle = 'rgba(30,10,10,0.85)';
    c.strokeText(t.s, sx(t.x), sy(t.y)); c.fillStyle = t.color; c.fillText(t.s, sx(t.x), sy(t.y));
  }
  c.globalAlpha = 1;
  lap('texte');
  drawOverlays(c, g, W, H, time); lap('overlays');
}

// ---------------------------------------------------------------------
// ENDBOSS ZORNOS
// ---------------------------------------------------------------------
const BOSS_TOKEN = { boss: true };
const BOSS_CHAR = { type: 'monster', colors: { body: '#5a0a0a', belly: '#ff6a1f', horn: '#1a0505', dark: '#000000' } };
function drawBossFloor(c, g, sx, sy, z, time) {
  if (!g.boss && !(g.bossShots && g.bossShots.length)) return;
  const b = g.boss, p = g.p;
  // Warnlinie vor dem Sturmangriff
  if (b && b.windup > 0) {
    const len = b.size * 9, a = Math.min(1, (0.8 - b.windup) / 0.8);
    c.strokeStyle = `rgba(255,40,20,${0.25 + 0.5 * Math.abs(Math.sin(time * 18))})`; c.lineWidth = b.size * z * 1.2 * a;
    c.beginPath(); c.moveTo(sx(b.x), sy(b.y)); c.lineTo(sx(b.x + b.chargeX * len), sy(b.y + b.chargeY * len)); c.stroke();
  }
  for (const sh of g.bossShots || []) {
    if (sh.kind === 'ring') {
      c.strokeStyle = 'rgba(255,90,20,0.85)'; c.lineWidth = Math.max(4, p.r * z * 0.9);
      c.beginPath(); c.ellipse(sx(sh.x), sy(sh.y), sh.r * z, sh.r * z * 0.6, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(255,220,80,0.9)'; c.lineWidth = Math.max(2, p.r * z * 0.3); c.stroke();
    } else if (sh.kind === 'meteor') {
      const k = Math.max(0, 1 - sh.t / 1.1);
      c.fillStyle = `rgba(80,0,0,${0.2 + k * 0.4})`; c.beginPath(); c.ellipse(sx(sh.x), sy(sh.y), sh.r * z, sh.r * z * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,60,30,0.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx(sh.x), sy(sh.y), sh.r * z * k, sh.r * z * 0.6 * k, 0, 0, Math.PI * 2); c.stroke();
      const fy = sy(sh.y) - (1 - k) * 600;
      c.fillStyle = '#ffb13d'; c.beginPath(); c.arc(sx(sh.x), fy, Math.max(5, p.r * z * 0.5), 0, Math.PI * 2); c.fill();
    }
  }
}
function drawBoss(c, g, sx, sy, z, time) {
  const b = g.boss, X = sx(b.x), Y = sy(b.y), R = b.size * z;
  c.save();
  if (b.flash > 0) c.globalAlpha = 0.75 + 0.25 * Math.sin(time * 60);
  drawMonster(c, X, Y, R, { char: BOSS_CHAR, stage: 9, face: b.face, walk: b.walk, punchT: b.punchT, punchX: 1, punchY: 0, hurtT: b.flash * 0.3,
    berserk: b.hp < 0.3 || b.charge > 0, squash: b.hitAnim * 0.6, time, lookX: b.face, lookY: 0, slamT: b.windup > 0 ? 0.3 : 0 });
  c.restore();
  // Krone aus Flammen
  for (let i = 0; i < 5; i++) { const a = time * 4 + i * 1.3; c.fillStyle = i % 2 ? '#ffd23f' : '#ff6a1f'; c.beginPath(); c.arc(X + Math.cos(a) * R * 0.5, Y - R * 2.3 - Math.abs(Math.sin(a)) * R * 0.3, R * 0.1, 0, Math.PI * 2); c.fill(); }
  // Feuerbälle
  for (const sh of g.bossShots || []) if (sh.kind === 'fireball') {
    const gx = sx(sh.x), gy = sy(sh.y), r = sh.r * z;
    const gr = c.createRadialGradient(gx, gy, 0, gx, gy, r * 1.6); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.4, '#ff8a1f'); gr.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(gx, gy, r * 1.6, 0, Math.PI * 2); c.fill();
  }
}

const CENTERED = new Set(['planet', 'earth', 'ringplanet', 'star', 'nebula', 'cluster', 'blackhole', 'galaxy', 'station', 'satellite', 'comet', 'ufo']);

function drawObject(c, g, o, X, Y, R, limit, time, hasFilter) {
  if (R < 1.2) { c.fillStyle = o.color; c.fillRect(X - 1, Y - 1, 2, 2); return; }
  const space = g.worlds[o.world] && g.worlds[o.world].ground === 'space';
  const centered = space || CENTERED.has(o.shape);
  const pop = o.pop > 0 ? 1 - o.pop : 1;
  const popS = pop < 1 ? Math.max(0.01, 1 - Math.pow(1 - pop, 3) + Math.sin(pop * Math.PI) * 0.25) : 1;
  // Schatten
  if (!centered) { c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(X + R * 0.08, Y + R * 0.45, R * 0.95 * popS, R * 0.3 * popS, 0, 0, TAU); c.fill(); }
  // Markierung: zu groß / Hindernis
  const tooBig = o.size > limit;
  if (tooBig && R > 6 && !o.crate) {
    c.strokeStyle = o.hazard ? 'rgba(255,60,60,0.75)' : 'rgba(0,0,0,0.3)'; c.lineWidth = Math.max(1.5, R * 0.05);
    c.setLineDash([R * 0.18, R * 0.12]);
    c.beginPath(); c.ellipse(X, Y + (centered ? 0 : R * 0.45), R * 1.05, R * (centered ? 1.05 : 0.38), 0, 0, TAU); c.stroke();
    c.setLineDash([]);
  }
  c.save();
  const a = o.hitAnim || 0;
  if (centered) { c.translate(X, Y); c.scale((1 + a * 0.15) * popS, (1 - a * 0.15) * popS); c.scale(R, R); }
  else {
    c.translate(X, Y + R * 0.5);
    c.scale((1 + a * 0.2) * popS, (1 - a * 0.22) * popS);
    c.translate(0, -R * 0.5);
    c.scale(R * (o.move ? o.face : 1), R);
    c.translate(0, -0.5);
    if (o.move === 'flee' || o.move === 'wander') c.rotate(Math.sin(o.anim * 3) * 0.05);
  }
  c.lineWidth = Math.min(Math.max(0.075 * R, 1.3), 4) / R;
  c.strokeStyle = OUT;
  // Goldene Objekte: Farbe vorübergehend auf Gold umstellen (Filter sind zu langsam)
  const fn = SPRITES[o.shape] || SPRITES.rock;
  if (o.golden) { const col = o.color; o.color = '#ffd23f'; fn(c, o, time); o.color = col; }
  else fn(c, o, time);
  // Treffer-Blitz: weißer Schimmer über der Form
  if (o.flash > 0.05) { c.globalAlpha = o.flash * 0.6; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 0, 0.95, 0.95, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  c.restore();
  // Karte 420: goldene Blätter leuchten, damit man sie zwischen den Pflanzen findet
  if (o.leaf) { const pu = 0.6 + 0.4 * Math.sin(time * 5 + o.seed * 9), gr = c.createRadialGradient(X, Y - R * 0.3, R * 0.2, X, Y - R * 0.3, R * 2.2); gr.addColorStop(0, `rgba(255,230,90,${0.55 * pu})`); gr.addColorStop(1, 'rgba(255,230,90,0)'); c.fillStyle = gr; c.beginPath(); c.arc(X, Y - R * 0.3, R * 2.2, 0, TAU); c.fill(); }
  // Funkeln goldener Objekte / Kisten
  if (o.golden || o.crate) {
    const t = time * 3 + o.seed * 10;
    c.fillStyle = '#fff8c0';
    for (let i = 0; i < 3; i++) { const an = t + i * 2.1, s = Math.max(2, R * 0.1) * (0.6 + 0.4 * Math.sin(t * 2 + i)); star4(c, X + Math.cos(an) * R * 1.05, Y - R * 0.5 + Math.sin(an * 1.3) * R * 0.9, s); }
  }
  // Auftrags-Ziel markieren (kleiner gelber Pfeil)
  if (g.quest && g.quest.type === 'kill' && o.name === g.quest.target && R > 3) {
    const by = Y - (centered ? R * 1.2 : R * 1.75) - 14 + Math.sin(time * 6 + o.seed * 5) * 3, s = Math.max(6, Math.min(11, R * 0.3));
    c.fillStyle = '#ffd23f'; c.strokeStyle = '#3a1d00'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X, by + s); c.lineTo(X - s, by - s * 0.4); c.lineTo(X + s, by - s * 0.4); c.closePath(); c.fill(); c.stroke();
  }
  // Warnsymbol über Hindernissen
  if (o.hazard && tooBig && R > 6) {
    const bob = Math.sin(time * 6 + o.seed * 5) * 3;
    const hy = Y - (centered ? R * 1.25 : R * 1.8) + bob, hs = Math.max(8, Math.min(16, R * 0.35));
    c.fillStyle = '#ff3b2f'; c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X, hy - hs); c.lineTo(X + hs, hy + hs * 0.8); c.lineTo(X - hs, hy + hs * 0.8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.font = `${Math.round(hs * 1.1)}px "Lilita One", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', X, hy + hs * 0.15);
  }
  // HP-Balken
  if (o.hp < o.maxHp && R > 5) {
    const w = Math.max(24, R * 1.4), f = Math.max(0, o.hp / o.maxHp);
    const by = Y - (centered ? R * 1.2 : R * 1.75) - 8;
    c.fillStyle = 'rgba(20,10,10,0.75)'; c.beginPath(); c.roundRect(X - w / 2 - 2, by - 2, w + 4, 9, 4); c.fill();
    c.fillStyle = f > 0.5 ? '#ffd23f' : '#ff5a3d'; c.beginPath(); c.roundRect(X - w / 2, by, w * f, 5, 3); c.fill();
  }
}

function star4(c, x, y, s) {
  c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
}

function drawPlayer(c, g, X, Y, R, time) {
  const p = g.p;
  // Ansturm: Speedlines
  if (p.dashT > 0) {
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(2, R * 0.08);
    for (let i = 0; i < 5; i++) { const off = (i - 2) * R * 0.4; c.beginPath(); c.moveTo(X - p.dashX * R * 1.2 - p.dashY * off, Y - R - p.dashY * R * 1.2 + p.dashX * off); c.lineTo(X - p.dashX * R * 3 - p.dashY * off, Y - R - p.dashY * R * 3 + p.dashX * off); c.stroke(); }
  }
  drawMonster(c, X, Y, R, {
    char: g.char, stage: g.world, face: p.face, walk: p.walk, punchT: p.punchT, punchX: p.punchX, punchY: p.punchY,
    hurtT: p.hurtT, berserk: p.berserkT > 0, squash: p.squash, time, lookX: p.lookX, lookY: p.lookY, slamT: p.slamT,
    skin: g.save && g.save.skinSel ? g.save.skinSel[g.char.id] : null,
  });
  // Ansturm bereit: kleiner Ring am Boden
  if (p.dashCd <= 0 && g.state === 'play') {
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(X, Y, R * 1.2, R * 0.42, 0, 0, TAU); c.stroke();
  }
}

function drawOverlays(c, g, W, H, time) {
  const p = g.p;
  // Berserker: rote Flammen am Rand
  if (p.berserkT > 0) {
    const a = 0.35 + Math.sin(time * 12) * 0.1;
    const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(255,40,0,0)'); v.addColorStop(1, `rgba(255,40,0,${a})`);
    c.fillStyle = v; c.fillRect(0, 0, W, H);
  }
  // wenig Wut / Treffer: rote Vignette
  const rf = p.rage / g.stats.rageMax;
  const danger = Math.max(rf < 0.3 && g.state === 'play' ? (0.3 - rf) / 0.3 * (0.35 + 0.15 * Math.sin(time * 10)) : 0, p.hurtT * 0.9);
  if (danger > 0.01) {
    const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(120,0,0,0)'); v.addColorStop(1, `rgba(170,0,0,${danger})`);
    c.fillStyle = v; c.fillRect(0, 0, W, H);
  }
  // ZORNOS außerhalb des Bildes: roter Pfeil am Rand zeigt, wo er ist
  if (g.boss) {
    const z = g.cam.zoom, bx = (g.boss.x - g.cam.x) * z + W / 2, by = (g.boss.y - g.cam.y) * z + H / 2, m = 46, rr = g.boss.size * z;
    if (bx < -rr || bx > W + rr || by < -rr || by > H + rr) {
      const a = Math.atan2(by - H / 2, bx - W / 2), k = Math.min((W / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (H / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
      const ax = W / 2 + Math.cos(a) * k, ay = H / 2 + Math.sin(a) * k, pul = 1 + Math.sin(time * 8) * 0.12;
      c.save(); c.translate(ax, ay); c.rotate(a); c.scale(pul, pul);
      c.fillStyle = '#ff3b2f'; c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(20, 0); c.lineTo(-12, -15); c.lineTo(-5, 0); c.lineTo(-12, 15); c.closePath(); c.fill(); c.stroke();
      c.restore();
      c.font = '22px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('😈', ax - Math.cos(a) * 34, ay - Math.sin(a) * 34);
    }
  }
  if (g.freezeT > 0) { c.fillStyle = `rgba(150,220,255,${Math.min(0.28, g.freezeT * 0.1)})`; c.fillRect(0, 0, W, H); }
  if (p.roarT > 0) { c.strokeStyle = `rgba(255,210,63,${0.3 + Math.sin(time * 10) * 0.1})`; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); }
  if (g.flash > 0) { c.fillStyle = `rgba(255,250,235,${g.flash * 0.55})`; c.fillRect(0, 0, W, H); }
}

// Vorschau eines Monsters (Menü, Monster-Auswahl)
export function drawMonsterPreview(canvas, char, stage, time, locked, skin = null) {
  const c = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  c.clearRect(0, 0, W, H);
  const R = Math.min(W, H) * 0.29;
  drawMonster(c, W / 2, H * 0.86, R, {
    char, stage, face: 1, walk: time * 1.5, punchT: (time % 2.2) < 0.18 ? 0.15 : 0, punchX: 1, punchY: 0, hurtT: 0, berserk: false,
    squash: 0, time, lookX: 1, lookY: 0, slamT: 0, skin,
  });
  if (locked) { // geheimnisvolle Silhouette
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(18,8,10,0.92)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = `${Math.round(H * 0.22)}px "Lilita One", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', W / 2, H * 0.55);
  }
}
