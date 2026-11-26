// =====================================================================
//  RAGEVERSE – die spielbaren Monster
//  drawMonster zeichnet das Monster stehend, Füße bei (X, Y),
//  R = Größe in Pixeln (Radius der Trefferzone).
//  Jedes Monster hat eine eigene Gestalt (Design). Gemeinsam sind nur
//  Augen, Maul und der Schlag-Arm, damit alle zum selben Stil passen.
//  Mit jeder Welt (stage) wachsen Hörner/Stacheln, später kommen Glut,
//  Sternenstaub und Aura dazu. Premium-Skins (Silber, Gold, Platin, Gott)
//  färben das Monster metallisch und legen Glanz, Funkeln und Aura darüber.
// =====================================================================
import * as C from './config.js?v=0.8.0';
import { shadeHex as sh } from './game.js?v=0.8.0';

const TAU = Math.PI * 2;
const OUT = '#1f1212';

export function monsterColors(char, stage) {
  if (!char.colors) return C.EVOLUTION[Math.min(stage, C.EVOLUTION.length - 1)];
  return char.colors;
}

function P(c, fill, stroke = true) { c.fillStyle = fill; c.fill(); if (stroke) c.stroke(); }
function lw(c, R, f = 0.075) { c.lineWidth = Math.max(1.5, R * f); c.strokeStyle = OUT; }
function tri(c, x1, y1, x2, y2, x3, y3) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); }
function star4(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r * 2); c.quadraticCurveTo(x, y, x + r * 2, y); c.quadraticCurveTo(x, y, x, y + r * 2); c.quadraticCurveTo(x, y, x - r * 2, y); c.quadraticCurveTo(x, y, x, y - r * 2); c.fill(); }

// ---------------------------------------------------------------------
// Gemeinsame Teile
// ---------------------------------------------------------------------
function eyes(c, R, s, list, opt = {}) {
  const lx = Math.max(-0.3, Math.min(1, s.lookX * s.face)), ly = s.lookY || 0;
  const white = s.berserk ? '#ffe14a' : (opt.white || '#ffffff');
  for (const [ex, ey, er] of list) {
    if (opt.glow) { c.save(); c.shadowColor = opt.glow; c.shadowBlur = er * 1.6; }
    c.beginPath(); c.arc(ex, ey, er, 0, TAU); P(c, white);
    if (opt.glow) c.restore();
    c.fillStyle = s.berserk ? '#ff2a00' : (opt.pupil || '#1a0505');
    c.beginPath();
    if (opt.slit) c.ellipse(ex + er * 0.3 * lx, ey + er * 0.25 * ly, er * 0.2, er * 0.62, 0, 0, TAU);
    else c.arc(ex + er * 0.35 * lx, ey + er * 0.3 * ly, er * 0.5, 0, TAU);
    c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + er * 0.2, ey - er * 0.3, er * 0.18, 0, TAU); c.fill();
  }
}
function brows(c, R, col, segs) {
  c.lineWidth = Math.max(2, R * 0.11); c.strokeStyle = col;
  for (const [x1, y1, x2, y2] of segs) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  lw(c, R);
}
function mouth(c, R, s, x, y, w, opt = {}) {
  const open = Math.min(1, (s.punchT > 0 ? 1 : 0) + (s.berserk ? 0.6 : 0) + (s.slamT > 0 ? 1 : 0));
  const mh = R * (0.1 + open * 0.15) * (opt.h || 1);
  c.beginPath(); c.ellipse(x, y, w, mh, 0, 0, TAU); P(c, opt.inside || '#3a0a0a');
  c.fillStyle = opt.teeth || '#ffffff';
  const n = Math.max(3, Math.round(w / (R * 0.075)));
  for (let i = 0; i < n; i++) { const tx = x - w * 0.8 + i * (w * 1.6 / n); tri(c, tx, y - mh * 0.9, tx + w * 0.8 / n, y - mh * 0.15, tx + w * 1.6 / n, y - mh * 0.9); c.fill(); }
  if (open > 0.5) for (let i = 0; i < n - 1; i++) { const tx = x - w * 0.6 + i * (w * 1.4 / n); tri(c, tx, y + mh * 0.9, tx + w * 0.7 / n, y + mh * 0.2, tx + w * 1.4 / n, y + mh * 0.9); c.fill(); }
  if (opt.goldTooth) { c.fillStyle = '#ffd23f'; tri(c, x + w * 0.1, y - mh * 0.9, x + w * 0.25, y - mh * 0.05, x + w * 0.42, y - mh * 0.9); c.fill(); c.stroke(); }
  if (opt.fire && open > 0.5) {
    const g = c.createLinearGradient(x + w, y, x + w + R * 0.9, y);
    g.addColorStop(0, 'rgba(255,240,150,0.95)'); g.addColorStop(0.5, 'rgba(255,140,30,0.8)'); g.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + w * 0.8, y); c.quadraticCurveTo(x + w + R * 0.5, y - R * 0.35, x + w + R * 0.95, y - R * 0.1); c.quadraticCurveTo(x + w + R * 0.5, y + R * 0.3, x + w * 0.8, y); c.fill();
  }
  return open;
}
// Schlag-Arm: zeigt in Richtung des Ziels
function punchArm(c, R, s, ax, ay, col, opt = {}) {
  const pt = s.punchT > 0 ? Math.min(1, s.punchT / 0.16) : 0;
  const reach = R * (opt.reach || 0.35) + R * pt * 0.55;
  const px = Math.max(0.2, s.punchX * s.face), py = s.punchY || 0;
  const hx = ax + px * reach, hy = ay + py * reach * 0.6 + (s.slamT > 0 ? R * 0.35 : 0);
  const thick = opt.thick || 0.26;
  c.lineWidth = Math.max(3, R * thick); c.strokeStyle = OUT;
  c.beginPath(); c.moveTo(ax - R * 0.1, ay); c.lineTo(hx, hy); c.stroke();
  c.lineWidth = Math.max(2, R * (thick - 0.08)); c.strokeStyle = col;
  c.beginPath(); c.moveTo(ax - R * 0.1, ay); c.lineTo(hx, hy); c.stroke();
  lw(c, R);
  const fr = R * ((opt.fist || 0.16) + pt * 0.05);
  if (opt.square) { c.beginPath(); c.roundRect(hx - fr, hy - fr, fr * 2, fr * 2, fr * 0.35); P(c, opt.fistCol || col); }
  else { c.beginPath(); c.arc(hx, hy, fr, 0, TAU); P(c, opt.fistCol || col); }
  if (opt.claws !== false) {
    c.fillStyle = opt.claws || '#fff6dc';
    for (let i = -1; i <= 1; i++) { tri(c, hx + fr * 0.75, hy + i * fr * 0.45, hx + fr * 1.5, hy + i * fr * 0.45 - fr * 0.12, hx + fr * 0.8, hy + i * fr * 0.45 + fr * 0.25); c.fill(); }
  }
}
function leg(c, R, x, lift, col, w = 0.36, h = 0.5, toes = null) {
  c.beginPath(); c.roundRect(x, -R * h - lift, R * w, R * h + R * 0.02, R * 0.14); P(c, col);
  if (toes) { c.fillStyle = toes; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + R * (0.08 + i * w * 0.3), -lift - R * 0.02, R * 0.05, 0, TAU); c.fill(); } }
}
function tail(c, R, s, col, len = 1.4, spikes = null, tipFn = null) {
  const sw = Math.sin((s.time || 0) * 5 + s.walk) * R * 0.15;
  c.beginPath(); c.moveTo(-R * 0.55, -R * 0.75);
  c.quadraticCurveTo(-R * 1.25, -R * 0.55 + sw, -R * len, -R * 0.95 + sw);
  c.quadraticCurveTo(-R * 1.1, -R * 0.25 + sw * 0.5, -R * 0.45, -R * 0.3); c.closePath(); P(c, col);
  if (spikes) for (let i = 0; i < 3; i++) { const x = -R * (0.8 + i * 0.22), y = -R * (0.72 + i * 0.06) + sw * (0.4 + i * 0.2); tri(c, x - R * 0.08, y, x, y - R * 0.2, x + R * 0.08, y); P(c, spikes); }
  if (tipFn) tipFn(-R * len, -R * 0.95 + sw);
}
function bellyStripes(c, R, col, x, y, w, n = 3, gap = 0.22) {
  c.strokeStyle = sh(col, -0.2); c.lineWidth = Math.max(1, R * 0.03);
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(x - w, y - R * i * gap); c.lineTo(x + w, y - R * i * gap); c.stroke(); }
  lw(c, R);
}
function shine(c, R, x, y, w = 0.3, h = 0.18) { c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(x, y, R * w, R * h, -0.5, 0, TAU); c.fill(); }
function stars(c, R, t, cx, cy, sx, sy, n = 9) {
  for (let i = 0; i < n; i++) {
    const x = cx + Math.sin(i * 12.9 + 1) * sx, y = cy + Math.cos(i * 7.3) * sy, tw = 0.5 + 0.5 * Math.sin(t * 4 + i);
    c.fillStyle = `rgba(255,255,255,${0.4 + tw * 0.6})`; c.beginPath(); c.arc(x, y, R * (0.025 + tw * 0.025), 0, TAU); c.fill();
  }
}
function lavaCracks(c, R, t, lines, w = 0.06) {
  c.strokeStyle = `rgba(255,${150 + Math.sin(t * 6) * 50},40,0.95)`; c.lineWidth = Math.max(1.5, R * w);
  for (const l of lines) { c.beginPath(); c.moveTo(R * l[0], R * l[1]); for (let i = 2; i < l.length; i += 2) c.lineTo(R * l[i], R * l[i + 1]); c.stroke(); }
  lw(c, R);
}

// ---------------------------------------------------------------------
// Die einzelnen Monster
// ---------------------------------------------------------------------
const D = {};

// Grumpf – der Klassiker (bleibt, wie er ist)
D.monster = (c, R, s, col, body, L) => {
  const stage = s.stage, t = s.time;
  tail(c, R, s, sh(body, -0.08), 1.4, stage >= 2 ? col.horn : null);
  leg(c, R, -R * 0.5, L.l2, sh(body, -0.2));
  c.beginPath(); c.ellipse(-R * 0.2, -R * 0.95, R * 0.16, R * 0.26, 0.4, 0, TAU); P(c, sh(body, -0.2));
  c.beginPath(); c.ellipse(0, -R * 1.08, R * 0.82, R * 0.9, 0, 0, TAU); P(c, body);
  c.save(); c.clip();
  shine(c, R, -R * 0.3, -R * 1.55);
  c.fillStyle = col.belly; c.beginPath(); c.ellipse(R * 0.22, -R * 0.82, R * 0.48, R * 0.55, 0, 0, TAU); c.fill();
  bellyStripes(c, R, col.belly, R * 0.24, -R * 0.6, R * 0.36);
  if (stage >= 3) { c.fillStyle = 'rgba(0,0,0,0.22)'; for (const [x, y, r] of [[-0.45, -1.3, 0.22], [-0.55, -0.75, 0.18], [0.1, -1.7, 0.16]]) { c.beginPath(); c.ellipse(R * x, R * y, R * r, R * r * 0.7, 0.4, 0, TAU); c.fill(); } }
  if (stage >= 4) lavaCracks(c, R, t, [[-0.7, -1.2, -0.45, -1.0, -0.55, -0.7, -0.3, -0.5], [-0.2, -1.85, -0.05, -1.6, -0.25, -1.45]]);
  if (stage >= 5) stars(c, R, t, 0, -R * 1.1, R * 0.7, R * 0.8);
  c.restore();
  c.beginPath(); c.ellipse(0, -R * 1.08, R * 0.82, R * 0.9, 0, 0, TAU); c.stroke();
  const spikes = stage >= 1 ? Math.min(2 + stage, 6) : 0;
  for (let i = 0; i < spikes; i++) {
    const a = Math.PI * (1.05 + i * (0.55 / Math.max(1, spikes - 1))), bx = Math.cos(a) * R * 0.8, by = -R * 1.08 + Math.sin(a) * R * 0.88, len = R * (0.26 + stage * 0.02);
    tri(c, bx + Math.cos(a + 1.3) * R * 0.1, by + Math.sin(a + 1.3) * R * 0.1, bx + Math.cos(a) * len, by + Math.sin(a) * len, bx + Math.cos(a - 1.3) * R * 0.1, by + Math.sin(a - 1.3) * R * 0.1); P(c, col.horn);
  }
  const headY = -R * 1.38, hs = R * (0.34 + Math.min(stage, 7) * 0.05);
  for (const [x, d] of [[-R * 0.25, -1], [R * 0.42, 1]]) {
    c.beginPath(); c.moveTo(x - R * 0.12, headY - R * 0.42);
    c.quadraticCurveTo(x + d * hs * 0.2, headY - R * 0.5 - hs, x + d * hs * 0.55, headY - R * 0.55 - hs * 1.05);
    c.quadraticCurveTo(x + d * hs * 0.1, headY - R * 0.55, x + R * 0.12, headY - R * 0.38); c.closePath(); P(c, col.horn);
  }
  eyes(c, R, s, [[R * 0.05, headY, R * 0.2], [R * 0.52, headY + R * 0.02, R * 0.18]]);
  brows(c, R, col.dark || OUT, [[-R * 0.18, headY - R * 0.3, R * 0.22, headY - R * 0.14], [R * 0.72, headY - R * 0.26, R * 0.36, headY - R * 0.12]]);
  mouth(c, R, s, R * 0.3, headY + R * 0.5, R * 0.36);
  leg(c, R, R * 0.1, L.l1, body, 0.38, 0.52, col.horn);
  punchArm(c, R, s, R * 0.62, -R * 1.0, body);
};

// Stachelkönig – runder Igel mit Stachelmähne, Krone und spitzer Schnauze
D.spiky = (c, R, s, col, body, L) => {
  const stage = s.stage, t = s.time, quill = sh(body, -0.3);
  leg(c, R, -R * 0.45, L.l2, sh(body, -0.25), 0.34, 0.42);
  const n = 11 + Math.min(stage, 6);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.82 + i * (0.8 / (n - 1))) + layer * 0.05, wob = Math.sin(t * 6 + i) * 0.04;
      const len = R * (0.62 + (layer ? 0.1 : 0.3) + Math.min(stage, 8) * 0.03) * (0.8 + 0.2 * Math.sin(i * 2.1));
      const bx = Math.cos(a) * R * 0.7, by = -R * 1.05 + Math.sin(a) * R * 0.78;
      tri(c, bx + Math.cos(a + 1.4) * R * 0.13, by + Math.sin(a + 1.4) * R * 0.13, bx + Math.cos(a + wob) * len, by + Math.sin(a + wob) * len, bx + Math.cos(a - 1.4) * R * 0.13, by + Math.sin(a - 1.4) * R * 0.13);
      P(c, layer ? col.horn : quill);
    }
  }
  c.beginPath(); c.ellipse(-R * 0.15, -R * 0.95, R * 0.15, R * 0.24, 0.4, 0, TAU); P(c, sh(body, -0.2));
  c.beginPath(); c.ellipse(R * 0.05, -R * 1.0, R * 0.8, R * 0.82, 0, 0, TAU); P(c, body);
  c.save(); c.clip();
  shine(c, R, -R * 0.2, -R * 1.5);
  c.fillStyle = col.belly; c.beginPath(); c.ellipse(R * 0.35, -R * 0.85, R * 0.5, R * 0.6, 0, 0, TAU); c.fill();
  if (stage >= 4) lavaCracks(c, R, t, [[-0.5, -1.3, -0.3, -1.05, -0.45, -0.7]]);
  c.restore();
  c.beginPath(); c.ellipse(R * 0.05, -R * 1.0, R * 0.8, R * 0.82, 0, 0, TAU); c.stroke();
  const headY = -R * 1.25;
  for (let i = 0; i < 3; i++) { const x = R * (0.05 + i * 0.22); tri(c, x - R * 0.09, headY - R * 0.62, x, headY - R * (0.98 + (i === 1 ? 0.15 : 0) + Math.min(stage, 8) * 0.02), x + R * 0.09, headY - R * 0.62); P(c, col.horn); }
  c.beginPath(); c.moveTo(R * 0.55, headY - R * 0.12); c.quadraticCurveTo(R * 1.05, headY + R * 0.05, R * 0.98, headY + R * 0.22); c.quadraticCurveTo(R * 0.7, headY + R * 0.35, R * 0.45, headY + R * 0.3); c.closePath(); P(c, col.belly);
  c.beginPath(); c.arc(R * 1.0, headY + R * 0.14, R * 0.08, 0, TAU); P(c, OUT);
  eyes(c, R, s, [[R * 0.2, headY - R * 0.12, R * 0.17], [R * 0.58, headY - R * 0.1, R * 0.15]]);
  brows(c, R, col.dark, [[R * 0.02, headY - R * 0.36, R * 0.34, headY - R * 0.22], [R * 0.76, headY - R * 0.33, R * 0.48, headY - R * 0.2]]);
  mouth(c, R, s, R * 0.62, headY + R * 0.4, R * 0.24, { h: 0.8 });
  leg(c, R, R * 0.12, L.l1, body, 0.34, 0.46, col.horn);
  punchArm(c, R, s, R * 0.55, -R * 0.9, body, { claws: col.horn });
};

// Flitzer – flacher Sprint-Gecko mit Schnauze, Stirnband und langem Schwanz
D.lizard = (c, R, s, col, body, L) => {
  const t = s.time, stage = s.stage, run = Math.sin(s.walk * Math.PI);
  c.save(); c.rotate(-0.06 - Math.abs(run) * 0.04); // nach vorne gelehnt
  const sw = Math.sin(t * 7 + s.walk) * R * 0.2;
  c.beginPath(); c.moveTo(-R * 0.6, -R * 0.85); c.bezierCurveTo(-R * 1.3, -R * 0.7 + sw, -R * 1.7, -R * 0.4 - sw, -R * 2.05, -R * 0.75 + sw);
  c.bezierCurveTo(-R * 1.6, -R * 0.2 - sw, -R * 1.2, -R * 0.35 + sw, -R * 0.55, -R * 0.45); c.closePath(); P(c, sh(body, -0.1));
  c.beginPath(); c.ellipse(-R * 0.35, -R * 0.45 - L.l2 * 0.6, R * 0.32, R * 0.2, -0.5, 0, TAU); P(c, sh(body, -0.2));
  c.beginPath(); c.roundRect(-R * 0.5, -R * 0.32 - L.l2, R * 0.38, R * 0.32, R * 0.12); P(c, sh(body, -0.2));
  c.beginPath(); c.ellipse(0, -R * 0.82, R * 0.95, R * 0.55, -0.12, 0, TAU); P(c, body);
  c.save(); c.clip();
  c.fillStyle = col.belly; c.beginPath(); c.ellipse(R * 0.15, -R * 0.5, R * 0.75, R * 0.3, -0.1, 0, TAU); c.fill();
  c.fillStyle = sh(body, -0.22); for (const [x, y, r] of [[-0.5, -1.05, 0.1], [-0.15, -1.2, 0.12], [0.25, -1.2, 0.09], [-0.7, -0.8, 0.08]]) { c.beginPath(); c.arc(R * x, R * y, R * r, 0, TAU); c.fill(); }
  shine(c, R, -R * 0.2, -R * 1.15, 0.35, 0.12);
  if (stage >= 5) stars(c, R, t, 0, -R * 0.85, R * 0.8, R * 0.4, 6);
  c.restore();
  c.beginPath(); c.ellipse(0, -R * 0.82, R * 0.95, R * 0.55, -0.12, 0, TAU); c.stroke();
  const fins = 3 + Math.min(stage, 4);
  for (let i = 0; i < fins; i++) { const x = -R * 0.7 + i * R * (1.2 / fins), y = -R * (1.22 + Math.sin(i / fins * Math.PI) * 0.12); tri(c, x, y + R * 0.08, x + R * 0.1, y - R * (0.2 + Math.sin(t * 9 + i) * 0.03), x + R * 0.2, y + R * 0.1); P(c, col.horn); }
  const hx = R * 0.75, hy = -R * 1.12;
  c.beginPath(); c.ellipse(hx, hy, R * 0.5, R * 0.38, -0.1, 0, TAU); P(c, body);
  c.beginPath(); c.ellipse(hx + R * 0.42, hy + R * 0.12, R * 0.38, R * 0.22, 0.05, 0, TAU); P(c, body);
  c.fillStyle = OUT; c.beginPath(); c.arc(hx + R * 0.68, hy + R * 0.04, R * 0.035, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(hx - R * 0.45, hy - R * 0.12); c.lineTo(hx + R * 0.35, hy - R * 0.3); c.lineTo(hx + R * 0.38, hy - R * 0.17); c.lineTo(hx - R * 0.42, hy + R * 0.02); c.closePath(); P(c, '#ff3b2f');
  const fl = Math.sin(t * 16) * R * 0.08;
  c.beginPath(); c.moveTo(hx - R * 0.42, hy - R * 0.08); c.lineTo(hx - R * 0.95, hy - R * 0.25 + fl); c.lineTo(hx - R * 0.85, hy - R * 0.05 - fl); c.closePath(); P(c, '#ff3b2f');
  eyes(c, R, s, [[hx + R * 0.02, hy - R * 0.08, R * 0.17], [hx + R * 0.33, hy - R * 0.1, R * 0.14]], { slit: true });
  brows(c, R, col.dark, [[hx - R * 0.15, hy - R * 0.36, hx + R * 0.15, hy - R * 0.24]]);
  mouth(c, R, s, hx + R * 0.45, hy + R * 0.25, R * 0.3, { h: 0.7 });
  c.beginPath(); c.roundRect(R * 0.2, -R * 0.38 - L.l1, R * 0.32, R * 0.38, R * 0.12); P(c, body);
  c.fillStyle = col.horn; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(R * (0.27 + i * 0.09), -L.l1 - R * 0.02, R * 0.045, 0, TAU); c.fill(); }
  punchArm(c, R, s, R * 0.45, -R * 0.75, body, { thick: 0.2, fist: 0.13, reach: 0.4 });
  c.restore();
};

// Magma-Golem – kantiger Felsblock mit glühendem Magma-Kern
D.golem = (c, R, s, col, body, L) => {
  const t = s.time, stage = s.stage;
  c.beginPath(); c.moveTo(-R * 0.55, -R * 0.55 - L.l2); c.lineTo(-R * 0.15, -R * 0.6 - L.l2); c.lineTo(-R * 0.1, -L.l2); c.lineTo(-R * 0.6, -L.l2); c.closePath(); P(c, sh(body, -0.2));
  c.beginPath(); c.moveTo(-R * 0.85, -R * 1.45); c.lineTo(-R * 0.45, -R * 1.55); c.lineTo(-R * 0.4, -R * 0.85); c.lineTo(-R * 0.9, -R * 0.8); c.closePath(); P(c, sh(body, -0.2));
  const poly = [[-0.75, -1.9], [-0.1, -2.1], [0.55, -1.95], [0.85, -1.4], [0.8, -0.6], [0.4, -0.35], [-0.45, -0.4], [-0.85, -0.8], [-0.9, -1.45]];
  const path = () => { c.beginPath(); poly.forEach(([x, y], i) => i ? c.lineTo(R * x, R * y) : c.moveTo(R * x, R * y)); c.closePath(); };
  path(); P(c, body);
  c.save(); path(); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.12)'; tri(c, -R * 0.75, -R * 1.9, -R * 0.1, -R * 2.1, -R * 0.3, -R * 1.4); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; tri(c, R * 0.8, -R * 0.6, R * 0.4, -R * 0.35, R * 0.3, -R * 1.0); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)'; tri(c, -R * 0.9, -R * 1.45, -R * 0.85, -R * 0.8, -R * 0.3, -R * 1.1); c.fill();
  const g = c.createRadialGradient(R * 0.15, -R * 0.95, R * 0.05, R * 0.15, -R * 0.95, R * 0.45);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.4, col.belly); g.addColorStop(1, 'rgba(255,80,20,0)');
  c.fillStyle = g; c.beginPath(); c.arc(R * 0.15, -R * 0.95, R * 0.5, 0, TAU); c.fill();
  lavaCracks(c, R, t, [[-0.7, -1.7, -0.45, -1.4, -0.55, -1.1, -0.3, -0.85], [0.45, -1.9, 0.3, -1.55, 0.55, -1.3], [-0.2, -0.45, -0.05, -0.65, 0.1, -0.5], [0.7, -1.0, 0.5, -0.8]], 0.07);
  c.restore();
  path(); c.stroke();
  for (const [x, y, r] of [[-0.6, -2.0, 0.18], [0.45, -2.05, 0.16]]) { c.beginPath(); c.moveTo(R * (x - r), R * y); c.lineTo(R * x, R * (y - r * 1.2)); c.lineTo(R * (x + r), R * (y - r * 0.2)); c.lineTo(R * (x + r * 0.4), R * (y + r * 0.6)); c.closePath(); P(c, sh(body, 0.08)); }
  if (stage >= 2) for (let i = 0; i < Math.min(stage, 6); i++) { const x = -R * 0.5 + i * R * 0.2; tri(c, x, -R * 2.0, x + R * 0.06, -R * (2.25 + (i % 2) * 0.1), x + R * 0.13, -R * 2.02); P(c, col.horn); }
  const headY = -R * 1.6;
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(R * 0.25, headY, R * 0.45, R * 0.2, 0, 0, TAU); c.fill();
  eyes(c, R, s, [[R * 0.05, headY, R * 0.14], [R * 0.45, headY, R * 0.13]], { white: '#ffd23f', pupil: '#7a1a00', glow: '#ff8a2a' });
  brows(c, R, '#120808', [[-R * 0.15, headY - R * 0.25, R * 0.22, headY - R * 0.1], [R * 0.65, headY - R * 0.22, R * 0.3, headY - R * 0.1]]);
  mouth(c, R, s, R * 0.25, headY + R * 0.38, R * 0.3, { inside: '#5a1a00', teeth: '#3a2a22', h: 0.8 });
  c.beginPath(); c.moveTo(R * 0.1, -R * 0.6 - L.l1); c.lineTo(R * 0.55, -R * 0.55 - L.l1); c.lineTo(R * 0.6, -L.l1); c.lineTo(R * 0.05, -L.l1); c.closePath(); P(c, body);
  punchArm(c, R, s, R * 0.7, -R * 1.2, sh(body, -0.05), { thick: 0.3, fist: 0.24, square: true, claws: false, fistCol: sh(body, 0.06) });
};

// Flügel (Leder oder Federn)
function wing(c, R, col, x, y, flap, kind) {
  c.save(); c.translate(x, y); c.rotate(-0.5 + flap);
  c.beginPath();
  if (kind === 'feather') {
    c.moveTo(0, 0); for (let i = 0; i < 5; i++) { const a = -2.4 + i * 0.35, l = R * (1.25 - i * 0.12); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.lineTo(Math.cos(a + 0.17) * l * 0.75, Math.sin(a + 0.17) * l * 0.75); }
    c.closePath(); P(c, col);
  } else {
    c.moveTo(0, 0); c.lineTo(-R * 0.5, -R * 1.0); c.lineTo(-R * 1.25, -R * 0.85); c.quadraticCurveTo(-R * 1.05, -R * 0.5, -R * 1.35, -R * 0.25);
    c.quadraticCurveTo(-R * 1.0, -R * 0.12, -R * 1.15, R * 0.15); c.quadraticCurveTo(-R * 0.75, R * 0.05, -R * 0.65, R * 0.35); c.closePath(); P(c, col);
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(1, R * 0.03);
    for (const [ex, ey] of [[-1.25, -0.85], [-1.35, -0.25], [-1.15, 0.15]]) { c.beginPath(); c.moveTo(-R * 0.5, -R * 1.0); c.lineTo(R * ex * 0.92, R * ey * 0.92); c.stroke(); }
    lw(c, R);
  }
  c.restore();
}
function dragonBase(c, R, s, col, body, L, o) {
  const t = s.time;
  tail(c, R, s, sh(body, -0.08), 1.5, o.tailSpikes ? col.horn : null, o.tailTip);
  wing(c, R, o.wingCol || sh(body, -0.2), -R * 0.25, -R * 1.35, Math.sin(t * 6) * 0.25, o.wing);
  leg(c, R, -R * 0.5, L.l2, sh(body, -0.2));
  const bodyPath = () => { c.beginPath(); c.moveTo(-R * 0.7, -R * 0.55); c.bezierCurveTo(-R * 0.95, -R * 1.3, -R * 0.45, -R * 1.85, R * 0.1, -R * 1.85); c.bezierCurveTo(R * 0.75, -R * 1.85, R * 0.9, -R * 1.1, R * 0.7, -R * 0.55); c.quadraticCurveTo(0, -R * 0.15, -R * 0.7, -R * 0.55); c.closePath(); };
  bodyPath(); P(c, body);
  c.save(); bodyPath(); c.clip();
  shine(c, R, -R * 0.25, -R * 1.55);
  c.fillStyle = col.belly; c.beginPath(); c.ellipse(R * 0.25, -R * 0.82, R * 0.45, R * 0.6, 0, 0, TAU); c.fill();
  bellyStripes(c, R, col.belly, R * 0.27, -R * 0.55, R * 0.34, 4, 0.18);
  c.fillStyle = 'rgba(0,0,0,0.13)';
  for (let i = 0; i < 6; i++) { const x = -R * (0.55 - (i % 3) * 0.18), y = -R * (1.0 + Math.floor(i / 3) * 0.35); c.beginPath(); c.arc(x, y, R * 0.09, 0, Math.PI); c.fill(); }
  if (o.inner) o.inner();
  c.restore();
  bodyPath(); c.stroke();
}

// Goldzahn – gieriger Drache mit Lederflügeln, Goldzahn und Feueratem
D.dragon = (c, R, s, col, body, L) => {
  const t = s.time, stage = s.stage;
  dragonBase(c, R, s, col, body, L, { wing: 'bat', tailSpikes: true, wingCol: sh(body, -0.18) });
  const headY = -R * 1.5;
  const hs = R * (0.35 + Math.min(stage, 7) * 0.04);
  for (const x of [-R * 0.15, R * 0.25]) { c.beginPath(); c.moveTo(x, headY - R * 0.3); c.quadraticCurveTo(x - hs * 0.6, headY - R * 0.45 - hs * 0.6, x - hs * 1.1, headY - R * 0.3 - hs * 0.8); c.quadraticCurveTo(x - hs * 0.3, headY - R * 0.35, x + R * 0.12, headY - R * 0.25); c.closePath(); P(c, col.horn); }
  c.beginPath(); c.ellipse(R * 0.62, headY + R * 0.18, R * 0.42, R * 0.26, 0.05, 0, TAU); P(c, body);
  c.fillStyle = OUT; c.beginPath(); c.arc(R * 0.92, headY + R * 0.07, R * 0.04, 0, TAU); c.fill(); c.beginPath(); c.arc(R * 0.8, headY + R * 0.06, R * 0.035, 0, TAU); c.fill();
  eyes(c, R, s, [[R * 0.08, headY - R * 0.08, R * 0.18], [R * 0.45, headY - R * 0.12, R * 0.15]], { slit: true, white: '#fff7c0' });
  brows(c, R, col.dark, [[-R * 0.1, headY - R * 0.36, R * 0.24, headY - R * 0.22], [R * 0.62, headY - R * 0.38, R * 0.38, headY - R * 0.25]]);
  mouth(c, R, s, R * 0.62, headY + R * 0.33, R * 0.3, { goldTooth: true, fire: true, h: 0.8 });
  const tw = 0.5 + 0.5 * Math.sin(t * 5);
  c.fillStyle = `rgba(255,255,220,${0.5 + tw * 0.5})`; star4(c, R * 0.72, headY + R * 0.2, R * (0.03 + tw * 0.03));
  leg(c, R, R * 0.1, L.l1, body, 0.38, 0.52, col.horn);
  punchArm(c, R, s, R * 0.62, -R * 1.0, body);
};

// Phönix – Feuervogel mit Flammenkamm, Schnabel, Federflügel und Flammenschweif
D.phoenix = (c, R, s, col, body, L) => {
  const t = s.time;
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(t * 8 + i) * R * 0.12;
    c.beginPath(); c.moveTo(-R * 0.5, -R * (0.6 + i * 0.12)); c.quadraticCurveTo(-R * (1.1 + i * 0.1), -R * (0.5 + i * 0.2) + sw, -R * (1.6 + i * 0.12), -R * (0.75 + i * 0.25) + sw);
    c.quadraticCurveTo(-R * 1.0, -R * (0.4 + i * 0.12), -R * 0.45, -R * (0.4 + i * 0.1)); c.closePath(); P(c, i % 2 ? col.belly : body);
  }
  wing(c, R, sh(body, -0.12), -R * 0.2, -R * 1.25, Math.sin(t * 7) * 0.35, 'feather');
  leg(c, R, -R * 0.4, L.l2, '#ffb13d', 0.16, 0.45);
  c.beginPath(); c.ellipse(0, -R * 1.05, R * 0.75, R * 0.82, 0.1, 0, TAU); P(c, body);
  c.save(); c.clip();
  shine(c, R, -R * 0.25, -R * 1.5);
  c.fillStyle = col.belly; c.beginPath(); c.ellipse(R * 0.25, -R * 0.8, R * 0.42, R * 0.55, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,240,150,0.5)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(R * (0.1 + (i % 2) * 0.2), -R * (0.6 + i * 0.12), R * 0.08, 0, Math.PI); c.fill(); }
  c.restore();
  c.beginPath(); c.ellipse(0, -R * 1.05, R * 0.75, R * 0.82, 0.1, 0, TAU); c.stroke();
  const headY = -R * 1.38;
  for (let i = 0; i < 5; i++) {
    const x = -R * 0.3 + i * R * 0.16, h = R * (0.45 + Math.sin(t * 10 + i * 1.7) * 0.08 + (i === 2 ? 0.15 : 0));
    c.beginPath(); c.moveTo(x - R * 0.1, headY - R * 0.5); c.quadraticCurveTo(x - R * 0.12, headY - R * 0.5 - h * 0.7, x + R * 0.02, headY - R * 0.5 - h); c.quadraticCurveTo(x + R * 0.04, headY - R * 0.5 - h * 0.5, x + R * 0.1, headY - R * 0.5); c.closePath();
    P(c, i % 2 ? '#ffd23f' : '#ff6a1f');
  }
  c.beginPath(); c.moveTo(R * 0.55, headY); c.quadraticCurveTo(R * 1.15, headY + R * 0.1, R * 1.05, headY + R * 0.35); c.quadraticCurveTo(R * 0.75, headY + R * 0.3, R * 0.5, headY + R * 0.3); c.closePath(); P(c, '#ffd23f');
  const op = s.punchT > 0 || s.berserk ? 1 : 0;
  c.beginPath(); c.moveTo(R * 0.52, headY + R * 0.3); c.quadraticCurveTo(R * 0.8, headY + R * (0.34 + op * 0.15), R * 0.95, headY + R * (0.38 + op * 0.12)); c.lineTo(R * 0.5, headY + R * (0.4 + op * 0.12)); c.closePath(); P(c, '#e09a1a');
  eyes(c, R, s, [[R * 0.12, headY - R * 0.08, R * 0.17], [R * 0.45, headY - R * 0.06, R * 0.14]]);
  brows(c, R, col.dark, [[-R * 0.08, headY - R * 0.34, R * 0.26, headY - R * 0.2], [R * 0.64, headY - R * 0.3, R * 0.38, headY - R * 0.18]]);
  leg(c, R, R * 0.12, L.l1, '#ffb13d', 0.16, 0.48);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(R * (0.12 + i * 0.1), -L.l1 - R * 0.02, R * 0.07, R * 0.04, 0, 0, TAU); P(c, '#ffb13d'); }
  for (let i = 0; i < 5; i++) { const ph = (t * 0.8 + i * 0.2) % 1; c.fillStyle = `rgba(255,${180 + i * 15},60,${1 - ph})`; c.beginPath(); c.arc(-R * 0.6 + Math.sin(i * 3.1 + t) * R * 0.5, -R * (1.4 + ph * 1.2), R * 0.05 * (1 - ph), 0, TAU); c.fill(); }
  punchArm(c, R, s, R * 0.55, -R * 1.0, body, { thick: 0.22, claws: '#ffd23f' });
};

// Infernus – Höllendämon mit Widderhörnern, Feuer-Aura und Teufelsschwanz
D.demon = (c, R, s, col, body, L) => {
  const t = s.time;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.05 + i * 0.13), h = R * (0.5 + Math.sin(t * 9 + i * 2) * 0.12);
    const bx = Math.cos(a) * R * 0.75, by = -R * 1.1 + Math.sin(a) * R * 0.8;
    c.fillStyle = i % 2 ? 'rgba(255,90,20,0.75)' : 'rgba(255,200,60,0.7)';
    c.beginPath(); c.moveTo(bx - R * 0.15, by); c.quadraticCurveTo(bx + Math.cos(a) * h * 0.6, by + Math.sin(a) * h * 0.6 - R * 0.1, bx + Math.cos(a) * h, by + Math.sin(a) * h); c.quadraticCurveTo(bx + Math.cos(a) * h * 0.3, by + Math.sin(a) * h * 0.3, bx + R * 0.15, by); c.fill();
  }
  dragonBase(c, R, s, col, body, L, {
    wing: 'bat', wingCol: col.wing || '#3a0808', tailTip: (x, y) => { tri(c, x - R * 0.2, y, x - R * 0.02, y - R * 0.22, x + R * 0.05, y + R * 0.12); P(c, col.belly); },
    inner: () => { lavaCracks(c, R, t, [[-0.6, -1.5, -0.4, -1.2, -0.55, -0.9], [0.5, -1.6, 0.35, -1.35, 0.5, -1.15]], 0.06); },
  });
  const headY = -R * 1.48;
  for (const [x, d] of [[-R * 0.12, -1], [R * 0.4, 1]]) {
    c.beginPath(); c.moveTo(x - R * 0.1, headY - R * 0.3);
    c.bezierCurveTo(x + d * R * 0.1, headY - R * 1.1, x + d * R * 0.75, headY - R * 0.95, x + d * R * 0.6, headY - R * 0.45);
    c.quadraticCurveTo(x + d * R * 0.5, headY - R * 0.75, x + d * R * 0.2, headY - R * 0.72);
    c.quadraticCurveTo(x + R * 0.05, headY - R * 0.55, x + R * 0.12, headY - R * 0.25); c.closePath(); P(c, col.horn);
  }
  eyes(c, R, s, [[R * 0.05, headY, R * 0.17], [R * 0.45, headY, R * 0.15]], { white: '#ffd23f', pupil: '#b00000', slit: true, glow: '#ff4a00' });
  brows(c, R, '#000', [[-R * 0.18, headY - R * 0.32, R * 0.24, headY - R * 0.12], [R * 0.68, headY - R * 0.3, R * 0.32, headY - R * 0.1]]);
  mouth(c, R, s, R * 0.3, headY + R * 0.45, R * 0.36, { fire: true, inside: '#1a0000' });
  leg(c, R, R * 0.1, L.l1, body, 0.38, 0.52, col.horn);
  punchArm(c, R, s, R * 0.62, -R * 1.0, body, { claws: col.horn });
};

// Void – schwebendes Sternenwesen ohne Beine, mit Ring und einem großen Auge
D.alien = (c, R, s, col, body, L) => {
  const t = s.time, fl = Math.sin(t * 3) * R * 0.1;
  c.translate(0, -R * 0.25 + fl);
  c.strokeStyle = col.horn; c.lineWidth = Math.max(2, R * 0.08); c.globalAlpha = 0.85;
  c.beginPath(); c.ellipse(0, -R * 1.0, R * 1.15, R * 0.28, -0.25, Math.PI, TAU); c.stroke(); c.globalAlpha = 1; lw(c, R);
  const path = () => {
    c.beginPath(); c.moveTo(-R * 0.75, -R * 0.65);
    c.bezierCurveTo(-R * 0.95, -R * 1.5, -R * 0.5, -R * 2.1, 0, -R * 2.1); c.bezierCurveTo(R * 0.5, -R * 2.1, R * 0.95, -R * 1.5, R * 0.75, -R * 0.65);
    for (let i = 0; i < 4; i++) { const x0 = R * (0.75 - i * 0.375), w = Math.sin(t * 4 + i * 1.6) * R * 0.08; c.quadraticCurveTo(x0 - R * 0.19, -R * (0.15 + (i % 2) * 0.1) + w, x0 - R * 0.375, -R * 0.6); }
    c.closePath();
  };
  path(); P(c, body);
  c.save(); path(); c.clip();
  const g = c.createRadialGradient(R * 0.1, -R * 1.2, R * 0.1, 0, -R * 1.1, R * 1.1);
  g.addColorStop(0, sh(col.belly, 0.2)); g.addColorStop(0.55, col.belly); g.addColorStop(1, body);
  c.globalAlpha = 0.55; c.fillStyle = g; c.fillRect(-R, -R * 2.2, R * 2, R * 2); c.globalAlpha = 1;
  stars(c, R, t, 0, -R * 1.2, R * 0.7, R * 0.75, 14);
  shine(c, R, -R * 0.3, -R * 1.7, 0.25, 0.14);
  c.restore();
  path(); c.stroke();
  c.strokeStyle = col.horn; c.lineWidth = Math.max(2, R * 0.08);
  c.beginPath(); c.ellipse(0, -R * 1.0, R * 1.15, R * 0.28, -0.25, 0, Math.PI); c.stroke(); lw(c, R);
  for (let i = 0; i < 3; i++) { const a = t * 2 + i * TAU / 3; c.beginPath(); c.arc(Math.cos(a) * R * 1.15, -R * 1.0 + Math.sin(a) * R * 0.28 - Math.cos(a) * R * 0.07, R * 0.07, 0, TAU); P(c, col.horn); }
  const headY = -R * 1.45;
  eyes(c, R, s, [[R * 0.15, headY, R * 0.34]], { glow: col.horn, pupil: '#120030' });
  c.lineWidth = Math.max(2, R * 0.11); c.strokeStyle = col.dark;
  c.beginPath(); c.moveTo(-R * 0.25, headY - R * 0.42); c.lineTo(R * 0.15, headY - R * 0.25); c.lineTo(R * 0.55, headY - R * 0.42); c.stroke(); lw(c, R);
  mouth(c, R, s, R * 0.18, headY + R * 0.6, R * 0.3, { inside: '#120030', teeth: col.horn, h: 0.8 });
  punchArm(c, R, s, R * 0.55, -R * 1.05, body, { thick: 0.2, claws: col.horn });
};

// Frostbeule – zotteliger Yeti mit Eiskristallen und Frostatem
D.yeti = (c, R, s, col, body, L) => {
  const t = s.time, stage = s.stage;
  leg(c, R, -R * 0.5, L.l2, sh(body, -0.12), 0.38, 0.45);
  c.beginPath(); c.ellipse(-R * 0.25, -R * 1.0, R * 0.2, R * 0.32, 0.3, 0, TAU); P(c, sh(body, -0.1));
  const fur = () => {
    c.beginPath(); const n = 20;
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, r = (i % 2 ? 0.86 : 0.97) + Math.sin(t * 3 + i) * 0.015;
      const x = Math.cos(a) * R * 0.85 * r, y = -R * 1.1 + Math.sin(a) * R * 0.95 * r;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  };
  fur(); P(c, body);
  c.save(); fur(); c.clip();
  c.fillStyle = 'rgba(120,180,230,0.25)'; c.beginPath(); c.ellipse(-R * 0.4, -R * 0.8, R * 0.5, R * 0.7, 0, 0, TAU); c.fill();
  c.fillStyle = col.horn; c.beginPath(); c.ellipse(R * 0.3, -R * 1.35, R * 0.45, R * 0.36, 0, 0, TAU); c.fill();
  c.restore();
  fur(); c.stroke();
  const n = 3 + Math.min(stage, 5);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.1 + i * (0.5 / Math.max(1, n - 1))), bx = Math.cos(a) * R * 0.78, by = -R * 1.1 + Math.sin(a) * R * 0.88, len = R * (0.35 + (i % 2) * 0.15 + Math.min(stage, 8) * 0.02);
    c.beginPath(); c.moveTo(bx + Math.cos(a + 1.5) * R * 0.08, by + Math.sin(a + 1.5) * R * 0.08); c.lineTo(bx + Math.cos(a + 0.12) * len * 0.75, by + Math.sin(a + 0.12) * len * 0.75); c.lineTo(bx + Math.cos(a) * len, by + Math.sin(a) * len); c.lineTo(bx + Math.cos(a - 0.12) * len * 0.75, by + Math.sin(a - 0.12) * len * 0.75); c.lineTo(bx + Math.cos(a - 1.5) * R * 0.08, by + Math.sin(a - 1.5) * R * 0.08); c.closePath();
    P(c, i % 2 ? '#e8f8ff' : '#8fdcff');
  }
  c.beginPath(); c.ellipse(R * 0.3, -R * 1.35, R * 0.45, R * 0.36, 0, 0, TAU); c.stroke();
  const headY = -R * 1.4;
  eyes(c, R, s, [[R * 0.12, headY, R * 0.15], [R * 0.48, headY, R * 0.14]], { pupil: '#0a2a4a' });
  brows(c, R, '#ffffff', [[-R * 0.08, headY - R * 0.25, R * 0.25, headY - R * 0.14], [R * 0.68, headY - R * 0.24, R * 0.36, headY - R * 0.13]]);
  const open = mouth(c, R, s, R * 0.32, headY + R * 0.32, R * 0.27, { inside: '#0a2a4a', h: 0.8 });
  if (open > 0.5 || Math.sin(t * 1.3) > 0.85) {
    for (let i = 0; i < 4; i++) { const ph = (t * 1.5 + i * 0.25) % 1; c.fillStyle = `rgba(220,245,255,${0.6 * (1 - ph)})`; c.beginPath(); c.arc(R * (0.65 + ph * 0.8), headY + R * (0.3 - ph * 0.2), R * (0.08 + ph * 0.14), 0, TAU); c.fill(); }
  }
  leg(c, R, R * 0.1, L.l1, body, 0.4, 0.5);
  c.fillStyle = col.horn; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(R * (0.18 + i * 0.12), -L.l1 - R * 0.03, R * 0.06, 0, TAU); c.fill(); }
  punchArm(c, R, s, R * 0.6, -R * 1.05, body, { thick: 0.3, fist: 0.2, claws: '#bfe8ff' });
};

// Kraken – Oktopus mit großem Mantel und wackelnden Tentakeln
D.kraken = (c, R, s, col, body, L) => {
  const t = s.time;
  const tent = (x0, dir, ph, colr, len) => {
    const w = Math.sin(t * 5 + ph + s.walk * 2) * R * 0.18;
    c.beginPath(); c.moveTo(x0 - R * 0.12, -R * 0.7);
    c.quadraticCurveTo(x0 + dir * R * 0.2 + w, -R * 0.3, x0 + dir * R * len + w * 1.5, -R * 0.08);
    c.quadraticCurveTo(x0 + dir * R * (len - 0.1) + w, -R * 0.25, x0 + R * 0.12, -R * 0.65); c.closePath(); P(c, colr);
  };
  tent(-R * 0.5, -1, 0, sh(body, -0.2), 0.75); tent(-R * 0.15, -1, 1.5, sh(body, -0.2), 0.55); tent(R * 0.4, 1, 2.2, sh(body, -0.2), 0.6);
  const mant = () => { c.beginPath(); c.moveTo(-R * 0.7, -R * 0.7); c.bezierCurveTo(-R * 1.0, -R * 1.6, -R * 0.6, -R * 2.3, R * 0.05, -R * 2.25); c.bezierCurveTo(R * 0.75, -R * 2.2, R * 0.95, -R * 1.5, R * 0.72, -R * 0.7); c.quadraticCurveTo(0, -R * 0.45, -R * 0.7, -R * 0.7); c.closePath(); };
  mant(); P(c, body);
  c.save(); mant(); c.clip();
  c.fillStyle = sh(body, 0.12); for (const [x, y, r] of [[-0.45, -1.8, 0.12], [-0.1, -2.0, 0.08], [-0.6, -1.3, 0.09], [0.3, -1.95, 0.07]]) { c.beginPath(); c.arc(R * x, R * y, R * r, 0, TAU); c.fill(); }
  shine(c, R, -R * 0.3, -R * 1.85, 0.25, 0.15);
  c.fillStyle = col.belly; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(R * 0.25, -R * 0.85, R * 0.45, R * 0.35, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  if (s.stage >= 5) stars(c, R, t, 0, -R * 1.5, R * 0.6, R * 0.6, 7);
  c.restore();
  mant(); c.stroke();
  for (const [x0, dir, ph] of [[-R * 0.35, -1, 3], [R * 0.05, 1, 4.1], [R * 0.45, 1, 5.3]]) {
    tent(x0, dir, ph, body, 0.55);
    c.fillStyle = col.horn; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(x0 + dir * R * (0.12 + i * 0.16), -R * (0.42 - i * 0.12), R * 0.04, 0, TAU); c.fill(); }
  }
  const headY = -R * 1.35;
  eyes(c, R, s, [[-R * 0.02, headY, R * 0.21], [R * 0.45, headY, R * 0.2]], { slit: true, white: '#fff4b0', pupil: '#120a30' });
  brows(c, R, col.dark, [[-R * 0.25, headY - R * 0.32, R * 0.16, headY - R * 0.18], [R * 0.7, headY - R * 0.32, R * 0.32, headY - R * 0.18]]);
  mouth(c, R, s, R * 0.22, headY + R * 0.42, R * 0.22, { inside: '#120a30', h: 0.8 });
  punchArm(c, R, s, R * 0.55, -R * 0.95, body, { thick: 0.22, fist: 0.14, claws: false, fistCol: col.horn });
};

// Mecha-Rex – Roboter-Dino mit Visier, Nieten, Rückendüse und Antenne
D.mecha = (c, R, s, col, body, L) => {
  const t = s.time, metal = body, dark = sh(body, -0.3);
  for (let i = 3; i >= 0; i--) { const sw = Math.sin(t * 5 + i * 0.6) * R * 0.05 * i; c.beginPath(); c.roundRect(-R * (0.75 + i * 0.28), -R * (0.75 - i * 0.04) + sw, R * 0.32, R * 0.26, R * 0.06); P(c, i % 2 ? dark : metal); }
  c.beginPath(); c.roundRect(-R * 0.95, -R * 1.75, R * 0.3, R * 0.55, R * 0.08); P(c, dark);
  const fl = 0.6 + 0.4 * Math.sin(t * 30);
  c.fillStyle = `rgba(90,220,255,${0.7 * fl})`; c.beginPath(); c.moveTo(-R * 0.92, -R * 1.2); c.lineTo(-R * 0.8, -R * (0.85 - fl * 0.15)); c.lineTo(-R * 0.68, -R * 1.2); c.fill();
  c.beginPath(); c.roundRect(-R * 0.45, -R * 0.55 - L.l2, R * 0.3, R * 0.55, R * 0.06); P(c, dark);
  c.beginPath(); c.roundRect(-R * 0.75, -R * 1.85, R * 1.5, R * 1.35, R * 0.28); P(c, metal);
  c.save(); c.beginPath(); c.roundRect(-R * 0.75, -R * 1.85, R * 1.5, R * 1.35, R * 0.28); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(-R * 0.75, -R * 1.85, R * 1.5, R * 0.18);
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(-R * 0.75, -R * 0.75, R * 1.5, R * 0.3);
  c.fillStyle = col.belly; c.beginPath(); c.roundRect(-R * 0.1, -R * 1.15, R * 0.75, R * 0.5, R * 0.08); c.fill();
  c.fillStyle = '#1a1c22'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-R * 0.05 + i * R * 0.2, -R * 0.65); c.lineTo(R * 0.05 + i * R * 0.2, -R * 1.15); c.lineTo(R * 0.13 + i * R * 0.2, -R * 1.15); c.lineTo(R * 0.03 + i * R * 0.2, -R * 0.65); c.fill(); }
  c.restore();
  c.beginPath(); c.roundRect(-R * 0.75, -R * 1.85, R * 1.5, R * 1.35, R * 0.28); c.stroke();
  c.fillStyle = sh(metal, 0.3); for (const [x, y] of [[-0.62, -1.72], [0.62, -1.72], [-0.62, -0.62], [-0.3, -1.72]]) { c.beginPath(); c.arc(R * x, R * y, R * 0.045, 0, TAU); c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(-R * 0.2, -R * 1.85); c.lineTo(-R * 0.3, -R * 2.3); c.stroke();
  c.fillStyle = Math.sin(t * 6) > 0 ? '#ff3b2f' : '#7a1a10'; c.beginPath(); c.arc(-R * 0.3, -R * 2.33, R * 0.07, 0, TAU); c.fill(); c.stroke();
  const headY = -R * 1.45;
  c.beginPath(); c.roundRect(-R * 0.05, headY - R * 0.2, R * 0.75, R * 0.3, R * 0.12); P(c, '#14161c');
  const lx = Math.max(-0.3, Math.min(1, s.lookX * s.face));
  c.save(); c.shadowColor = s.berserk ? '#ff2a00' : '#ff4a3a'; c.shadowBlur = R * 0.3;
  c.fillStyle = s.berserk ? '#ffe14a' : '#ff4a3a'; c.beginPath(); c.roundRect(R * (0.12 + lx * 0.2), headY - R * 0.12, R * 0.3, R * 0.14, R * 0.06); c.fill(); c.restore();
  const open = (s.punchT > 0 || s.slamT > 0 ? 1 : 0) + (s.berserk ? 0.6 : 0);
  c.beginPath(); c.roundRect(R * 0.05, headY + R * 0.2, R * 0.7, R * (0.14 + Math.min(1, open) * 0.12), R * 0.05); P(c, '#3a0a0a');
  c.fillStyle = '#e8ecf0'; for (let i = 0; i < 6; i++) { tri(c, R * (0.08 + i * 0.11), headY + R * 0.2, R * (0.13 + i * 0.11), headY + R * 0.3, R * (0.18 + i * 0.11), headY + R * 0.2); c.fill(); }
  c.beginPath(); c.roundRect(R * 0.15, -R * 0.55 - L.l1, R * 0.32, R * 0.55, R * 0.06); P(c, metal);
  c.beginPath(); c.roundRect(R * 0.08, -R * 0.08 - L.l1, R * 0.46, R * 0.1, R * 0.04); P(c, dark);
  punchArm(c, R, s, R * 0.68, -R * 1.05, dark, { thick: 0.22, fist: 0.18, square: true, claws: false, fistCol: col.belly });
};

// Urzorn – das geheime Ur-Monster: kosmischer Grumpf mit Krone, drittem Auge und Runenring
D.urzorn = (c, R, s, col, body, L) => {
  const t = s.time;
  // Runenring hinten
  c.save(); c.strokeStyle = 'rgba(255,210,63,0.55)'; c.lineWidth = Math.max(1.5, R * 0.05);
  c.beginPath(); c.ellipse(0, -R * 1.1, R * 1.45, R * 0.42, Math.sin(t * 0.7) * 0.15, Math.PI, TAU); c.stroke(); c.restore(); lw(c, R);
  // Körper wie Grumpf, aber immer mit Sternenstaub und goldenen Adern
  D.monster(c, R, { ...s, stage: Math.max(s.stage, 5) }, col, body, L);
  // Krone
  const cy = -R * 2.0;
  c.beginPath(); c.moveTo(-R * 0.35, cy + R * 0.12); c.lineTo(-R * 0.4, cy - R * 0.22); c.lineTo(-R * 0.2, cy - R * 0.05); c.lineTo(R * 0.05, cy - R * 0.35); c.lineTo(R * 0.25, cy - R * 0.05); c.lineTo(R * 0.48, cy - R * 0.22); c.lineTo(R * 0.42, cy + R * 0.12); c.closePath(); P(c, '#ffd23f');
  for (const [x, y, k] of [[-R * 0.4, cy - R * 0.22, '#ff3b5c'], [R * 0.05, cy - R * 0.35, '#5ad0ff'], [R * 0.48, cy - R * 0.22, '#7dff8a']]) { c.beginPath(); c.arc(x, y, R * 0.06, 0, TAU); P(c, k); }
  // drittes Auge auf der Stirn
  eyes(c, R, s, [[R * 0.28, -R * 1.78, R * 0.13]], { white: '#ffe9a0', pupil: '#5a0a8a', glow: '#b06bff', slit: true });
  // Runenring vorne mit kreisenden Runen
  c.save(); c.strokeStyle = 'rgba(255,210,63,0.75)'; c.lineWidth = Math.max(1.5, R * 0.05);
  c.beginPath(); c.ellipse(0, -R * 1.1, R * 1.45, R * 0.42, Math.sin(t * 0.7) * 0.15, 0, Math.PI); c.stroke();
  c.fillStyle = '#ffe9a0'; c.font = `bold ${Math.max(6, R * 0.2)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) { const a = t * 1.2 + i * TAU / 5; if (Math.sin(a) < 0) continue; c.fillText('ᚱᚨᚷᛖ'[i % 4], Math.cos(a) * R * 1.45, -R * 1.1 + Math.sin(a) * R * 0.42); }
  c.restore(); lw(c, R);
};

// Monster-ID → Design (einzelne Monster können über char.design abweichen)
const DESIGN_OF = { grumpf: 'monster', stachel: 'spiky', flitzer: 'lizard', golem: 'golem', goldzahn: 'dragon', void: 'alien', frost: 'yeti', kraken: 'kraken', mecha: 'mecha', phoenix: 'phoenix', infernus: 'demon', urzorn: 'urzorn' };

// ---------------------------------------------------------------------
// Premium-Skins
// ---------------------------------------------------------------------
export const SKIN_PALETTES = {
  silver:   { body: '#b9c3cf', belly: '#eef2f7', horn: '#ffffff', dark: '#3e4652', wing: '#8a95a4', glow: 'rgba(220,235,255,', shine: 0.55 },
  gold:     { body: '#f2b822', belly: '#fff0a0', horn: '#fff8dc', dark: '#6a4200', wing: '#d08f10', glow: 'rgba(255,205,60,', shine: 0.7 },
  platinum: { body: '#cfe6f5', belly: '#ffffff', horn: '#9ff0ff', dark: '#2a4a6a', wing: '#9fc4dc', glow: 'rgba(160,240,255,', shine: 0.8 },
  kush:     { body: '#3c9a3a', belly: '#c9f0a0', horn: '#ffd23f', dark: '#14300c', wing: '#2a6a2a', glow: 'rgba(120,230,120,', shine: 0.45, sweep: '210,255,200' },
  hell:     { body: '#1c0a0a', belly: '#ff5a1a', horn: '#ffd23f', dark: '#000000', wing: '#3a0808', glow: 'rgba(255,90,20,', shine: 0.5, sweep: '255,160,60' },
  god:      { body: '#fff8ea', belly: '#ffe28a', horn: '#ffd23f', dark: '#9a6a00', wing: '#fff0c0', glow: 'rgba(255,230,140,', shine: 0.9 },
};
let skinCanvas = null;

export function drawMonster(c, X, Y, R, s) {
  const skin = s.skin && SKIN_PALETTES[s.skin];
  if (skin && R > 2) return drawSkinned(c, X, Y, R, s, skin);
  drawBase(c, X, Y, R, s, null);
}

function drawBase(c, X, Y, R, s, skin, noShadow = false) {
  const char = s.char, stage = s.stage || 0;
  const design = char.design || DESIGN_OF[char.id] || char.type || 'monster';
  const col = skin || monsterColors(char, stage);
  const t = s.time || 0;
  const body = s.berserk ? sh(col.body, 0.12) : col.body;
  if (!noShadow) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(X, Y, R * 1.05, R * 0.38, 0, 0, TAU); c.fill(); }
  c.save();
  c.translate(X, Y);
  if (!skin && (s.berserk || stage >= 6)) {
    const a = s.berserk ? 0.55 + Math.sin(t * 14) * 0.15 : 0.3;
    const g = c.createRadialGradient(0, -R, R * 0.4, 0, -R, R * 2.1);
    g.addColorStop(0, `rgba(255,${s.berserk ? 60 : 160},30,${a})`); g.addColorStop(1, 'rgba(255,80,30,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, -R, R * 2.1, 0, TAU); c.fill();
  }
  const sq = s.squash || 0;
  const bobY = design === 'alien' ? 0 : Math.abs(Math.sin(s.walk * Math.PI)) * R * 0.08;
  c.scale(s.face * (1 + sq * 0.12), 1 - sq * 0.12);
  c.translate(0, -bobY);
  c.lineJoin = 'round'; c.lineCap = 'round';
  lw(c, R);
  const L = { l1: Math.max(0, Math.sin(s.walk * Math.PI)) * R * 0.22, l2: Math.max(0, -Math.sin(s.walk * Math.PI)) * R * 0.22 };
  (D[design] || D.monster)(c, R, { ...s, stage, time: t }, col, body, L);
  if (s.hurtT > 0) {
    c.globalAlpha = Math.min(0.6, s.hurtT * 1.5); c.fillStyle = '#ff2a2a';
    c.beginPath(); c.ellipse(0, -R * 1.08, R * 0.86, R * 0.95, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  }
  c.restore();
}

// Skin: Monster in ein eigenes Bild zeichnen, dann Metall-Verlauf, wandernden Glanz
// und (Platin/Gott) Regenbogen-Schimmer nur auf das Monster legen. Dazu Aura und Funkeln.
function drawSkinned(c, X, Y, R, s, skin) {
  const t = s.time || 0, id = s.skin;
  const pad = R * 2.6, W = Math.ceil(pad * 2), H = Math.ceil(R * 3.2 + pad * 0.5);
  c.save();
  const pulse = 0.75 + 0.25 * Math.sin(t * 3);
  const ar = R * (id === 'god' ? 2.6 : id === 'platinum' ? 2.2 : 1.9);
  const g = c.createRadialGradient(X, Y - R * 1.1, R * 0.3, X, Y - R * 1.1, ar);
  g.addColorStop(0, skin.glow + (0.5 * pulse) + ')'); g.addColorStop(1, skin.glow + '0)');
  c.fillStyle = g; c.beginPath(); c.arc(X, Y - R * 1.1, ar, 0, TAU); c.fill();
  if (id === 'god') {
    c.translate(X, Y - R * 1.1); c.rotate(t * 0.4);
    for (let i = 0; i < 10; i++) { c.rotate(TAU / 10); c.fillStyle = `rgba(255,240,180,${0.09 * pulse})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * 0.14, -R * 2.1); c.lineTo(R * 0.14, -R * 2.1); c.closePath(); c.fill(); }
  }
  c.restore();
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(X, Y, R * 1.05, R * 0.38, 0, 0, TAU); c.fill();
  if (!skinCanvas) skinCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : document.createElement('canvas');
  if (skinCanvas.width < W || skinCanvas.height < H) { skinCanvas.width = Math.max(W, skinCanvas.width); skinCanvas.height = Math.max(H, skinCanvas.height); }
  const o = skinCanvas.getContext('2d');
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W + 2, H + 2);
  const ox = W / 2, oy = H - pad * 0.25;
  drawBase(o, ox, oy, R, s, skin, true);
  o.globalCompositeOperation = 'source-atop';
  const mg = o.createLinearGradient(ox - R, oy - R * 2.4, ox + R, oy);
  mg.addColorStop(0, 'rgba(255,255,255,0.35)'); mg.addColorStop(0.45, 'rgba(255,255,255,0)'); mg.addColorStop(0.7, 'rgba(0,0,0,0.12)'); mg.addColorStop(1, 'rgba(255,255,255,0.18)');
  o.fillStyle = mg; o.fillRect(0, 0, W, H);
  const sweep = ((t * 0.45) % 1.6) - 0.3;
  const sx = ox - R * 1.6 + sweep * R * 3.2;
  o.save(); o.translate(sx, oy - R); o.rotate(0.35);
  const sg = o.createLinearGradient(-R * 0.4, 0, R * 0.4, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(${skin.sweep || '255,255,255'},${skin.shine})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
  o.fillStyle = sg; o.fillRect(-R * 0.4, -R * 2.5, R * 0.8, R * 5); o.restore();
  if (id === 'hell') { // Lava-Adern glühen pulsierend über den ganzen Körper
    o.strokeStyle = `rgba(255,${120 + Math.sin(t * 5) * 60},30,0.85)`; o.lineWidth = Math.max(1.5, R * 0.05);
    for (let i = 0; i < 6; i++) { o.beginPath(); let x = ox + (Math.sin(i * 2.7) * 0.7) * R, y = oy - R * (0.4 + (i % 3) * 0.55); o.moveTo(x, y); for (let k = 0; k < 3; k++) { x += Math.sin(i * 5 + k * 3) * R * 0.22; y -= R * 0.18; o.lineTo(x, y); } o.stroke(); }
  }
  if (id === 'platinum' || id === 'god') {
    const hue = (t * 60) % 360, rg = o.createLinearGradient(ox - R, oy - R * 2.2, ox + R, oy);
    rg.addColorStop(0, `hsla(${hue},90%,70%,0.22)`); rg.addColorStop(0.5, `hsla(${(hue + 120) % 360},90%,70%,0.16)`); rg.addColorStop(1, `hsla(${(hue + 240) % 360},90%,70%,0.22)`);
    o.fillStyle = rg; o.fillRect(0, 0, W, H);
  }
  o.globalCompositeOperation = 'source-over';
  c.drawImage(skinCanvas, 0, 0, W, H, X - ox, Y - oy, W, H);
  const n = id === 'silver' ? 3 : id === 'gold' ? 5 : id === 'hell' || id === 'kush' ? 0 : 7;
  for (let i = 0; i < n; i++) {
    const cyc = t * 0.7 + i / n, ph = cyc % 1, k = Math.floor(cyc), a = Math.sin(ph * Math.PI);
    const px = X + Math.sin(i * 4.7 + k * 2.3) * R * 0.9, py = Y - R * (0.4 + ((i * 0.37 + k * 0.61) % 1) * 1.8);
    c.fillStyle = `rgba(255,255,255,${a})`; star4(c, px, py, R * 0.05 * (0.5 + a));
  }
  if (id === 'kush') { // grüne Rauchschwaden steigen auf
    for (let i = 0; i < 6; i++) { const ph = (t * 0.35 + i / 6) % 1, x = X + Math.sin(i * 2.3 + t * 0.8) * R * (0.6 + ph * 0.5), y = Y - R * (1.2 + ph * 2.2);
      c.fillStyle = `rgba(200,245,190,${0.35 * (1 - ph)})`; c.beginPath(); c.arc(x, y, R * (0.18 + ph * 0.35), 0, TAU); c.fill(); }
  }
  if (id === 'hell') { // Glut steigt auf, Flammenkrone
    for (let i = 0; i < 8; i++) { const ph = (t * 0.9 + i / 8) % 1; c.fillStyle = `rgba(255,${150 + (i % 3) * 40},40,${1 - ph})`; c.beginPath(); c.arc(X + Math.sin(i * 3.3 + t) * R * 0.9, Y - R * (0.3 + ph * 2.4), R * 0.06 * (1 - ph * 0.6), 0, TAU); c.fill(); }
    for (let i = 0; i < 5; i++) { const x = X + s.face * R * 0.15 + (i - 2) * R * 0.16, h = R * (0.35 + Math.sin(t * 9 + i * 1.7) * 0.08 + (i === 2 ? 0.12 : 0)), y = Y - R * 2.2;
      const fg = c.createLinearGradient(x, y, x, y - h); fg.addColorStop(0, 'rgba(255,90,20,0.95)'); fg.addColorStop(1, 'rgba(255,230,120,0.2)');
      c.fillStyle = fg; c.beginPath(); c.moveTo(x - R * 0.08, y); c.quadraticCurveTo(x - R * 0.06, y - h * 0.6, x, y - h); c.quadraticCurveTo(x + R * 0.06, y - h * 0.6, x + R * 0.08, y); c.fill(); }
  }
  if (id === 'god') {
    c.save(); c.strokeStyle = `rgba(255,220,90,${0.8 + 0.2 * Math.sin(t * 4)})`; c.lineWidth = Math.max(2, R * 0.09); c.shadowColor = '#ffd23f'; c.shadowBlur = R * 0.4;
    c.beginPath(); c.ellipse(X + s.face * R * 0.15, Y - R * 2.55 + Math.sin(t * 2) * R * 0.05, R * 0.42, R * 0.12, 0, 0, TAU); c.stroke(); c.restore();
  }
}
