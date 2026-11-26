// =====================================================================
//  RAGEVERSE – Objekt-Grafiken
//  Jede Funktion zeichnet ein Objekt im Einheits-Kasten:
//  x von -1 bis 1, y von -1 (oben) bis 1 (Boden). Outline wird vom
//  Aufrufer gesetzt (lineWidth/strokeStyle), Farbe kommt aus o.color.
// =====================================================================
import { shadeHex as sh } from './game.js?v=0.8.3';

const TAU = Math.PI * 2;

// ---------- Helfer ----------
function fs(c, fill) { c.fillStyle = fill; c.fill(); c.stroke(); }
function fo(c, fill) { c.fillStyle = fill; c.fill(); }
function circ(c, x, y, r, fill, noStroke) { c.beginPath(); c.arc(x, y, r, 0, TAU); noStroke ? fo(c, fill) : fs(c, fill); }
function ell(c, x, y, rx, ry, fill, rot = 0, noStroke) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); noStroke ? fo(c, fill) : fs(c, fill); }
function rr(c, x, y, w, h, r, fill, noStroke) { c.beginPath(); c.roundRect(x, y, w, h, r); noStroke ? fo(c, fill) : fs(c, fill); }
function poly(c, pts, fill, noStroke) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); noStroke ? fo(c, fill) : fs(c, fill);
}
function line(c, x1, y1, x2, y2, w, color) {
  const lw = c.lineWidth; c.lineWidth = w; c.strokeStyle = color;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.lineWidth = lw; c.strokeStyle = OUT;
}
export const OUT = '#2a1b1b';
const bob = o => Math.sin(o.anim * 2) * 0.05;
function eyes(c, x, y, r, look = 0.3, scared = false) {
  circ(c, x, y, r, '#ffffff');
  circ(c, x + r * look, y + (scared ? -r * 0.2 : 0), r * 0.55, '#1a0f0f', true);
  circ(c, x + r * look - r * 0.15, y - r * 0.25, r * 0.18, '#ffffff', true);
}
function sweat(c, o) { if (o.scared > 0) { c.fillStyle = '#7fd3ff'; c.beginPath(); c.ellipse(-0.6, -0.8, 0.08, 0.13, 0, 0, TAU); c.fill(); } }

// ---------- Fahrzeuge ----------
function vehicle(c, o, opt = {}) {
  const col = o.color, len = opt.len || 1, h = opt.h || 0.55;
  const y0 = 0.25;
  circ(c, -0.62 * len, 0.72, 0.24, '#26262b'); circ(c, 0.62 * len, 0.72, 0.24, '#26262b');
  circ(c, -0.62 * len, 0.72, 0.1, '#9aa0aa', true); circ(c, 0.62 * len, 0.72, 0.1, '#9aa0aa', true);
  rr(c, -1 * len, y0 - h * 0.4, 2 * len, h + 0.1, 0.22, col);
  rr(c, -0.95 * len, y0 + h * 0.35, 1.9 * len, 0.12, 0.06, sh(col, -0.25), true);
  if (!opt.flat) {
    rr(c, -0.55 * len, y0 - h * 0.4 - 0.42, 1.05 * len, 0.5, 0.2, col);
    rr(c, -0.45 * len, y0 - h * 0.4 - 0.33, 0.42 * len, 0.3, 0.08, '#bfe9ff');
    rr(c, 0.03 * len, y0 - h * 0.4 - 0.33, 0.42 * len, 0.3, 0.08, '#bfe9ff');
  } else {
    for (let i = 0; i < opt.windows; i++) rr(c, -0.85 * len + i * (1.7 * len / opt.windows), y0 - h * 0.25, 1.7 * len / opt.windows - 0.08, 0.28, 0.06, '#bfe9ff');
  }
  circ(c, 0.98 * len, y0 + 0.02, 0.08, '#fff6b0', true);
}

// ---------- Gebäude ----------
function facade(c, o, opt = {}) {
  const w = opt.w || 0.75, top = opt.top ?? -1, col = o.color;
  rr(c, -w, top, w * 2, 1.95 - (top + 1), 0.06, col);
  rr(c, -w, top, 0.14, 1.95 - (top + 1), 0.04, sh(col, 0.18), true);
  const cols = opt.cols || 3, rows = opt.rows || 4;
  const gw = (w * 2 - 0.3) / cols, gh = (1.7 - (top + 1)) / (rows + 0.6);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const lit = ((i * 7 + j * 13 + Math.floor(o.seed * 100)) % 4) !== 0;
    rr(c, -w + 0.18 + i * gw, top + 0.15 + j * gh, gw * 0.62, gh * 0.62, 0.04, lit ? '#ffe9a0' : '#5a6a85');
  }
  if (opt.door !== false) rr(c, -0.17, 0.62, 0.34, 0.33, 0.04, sh(col, -0.45));
  if (opt.roof) poly(c, [-w - 0.08, top + 0.02, w + 0.08, top + 0.02, w - 0.05, top - 0.12, -w + 0.05, top - 0.12], sh(col, -0.3));
}
function house(c, o, opt = {}) {
  const col = o.color, roof = opt.roof || '#c4493a';
  rr(c, -0.78, -0.12, 1.56, 1.07, 0.05, col);
  poly(c, [-0.98, -0.05, 0, -0.98, 0.98, -0.05], roof);
  poly(c, [-0.98, -0.05, 0, -0.98, 0.12, -0.86, -0.78, -0.02], sh(roof, 0.18), true);
  rr(c, -0.17, 0.42, 0.34, 0.53, 0.05, sh(col, -0.45));
  rr(c, -0.62, 0.12, 0.3, 0.28, 0.04, '#9fe0ff'); rr(c, 0.32, 0.12, 0.3, 0.28, 0.04, '#9fe0ff');
  if (opt.chimney) rr(c, 0.45, -0.75, 0.18, 0.35, 0.03, '#8a4a3a');
}

// ---------- Tiere / Figuren ----------
function quad(c, o, opt) {
  const col = o.color, b = bob(o), leg = Math.sin(o.anim * 3) * 0.12;
  for (const [x, s] of [[-0.5, 1], [-0.25, -1], [0.3, 1], [0.55, -1]]) rr(c, x - 0.08, 0.35, 0.16, 0.6 + leg * s, 0.06, opt.leg || sh(col, -0.2));
  ell(c, 0, 0.2 + b, 0.85, 0.45, col);
  if (opt.spots) { ell(c, -0.3, 0.1 + b, 0.18, 0.13, opt.spots, 0, true); ell(c, 0.25, 0.28 + b, 0.15, 0.1, opt.spots, 0, true); }
  ell(c, 0.8, -0.15 + b, 0.38, 0.33, col);
  if (opt.ears) { poly(c, [0.6, -0.4 + b, 0.68, -0.72 + b, 0.8, -0.42 + b], col); poly(c, [0.88, -0.42 + b, 0.98, -0.72 + b, 1.05, -0.38 + b], col); }
  if (opt.horns) { poly(c, [0.62, -0.38 + b, 0.5, -0.7 + b, 0.72, -0.42 + b], '#f2e6c8'); poly(c, [0.95, -0.38 + b, 1.05, -0.7 + b, 1.02, -0.36 + b], '#f2e6c8'); }
  if (opt.snout) ell(c, 1.05, -0.05 + b, 0.16, 0.13, opt.snout);
  eyes(c, 0.85, -0.22 + b, 0.1, 0.4, o.scared > 0);
  if (opt.tail) { c.beginPath(); c.moveTo(-0.82, 0.1 + b); c.quadraticCurveTo(-1.1, -0.3, -0.95, -0.55 + Math.sin(o.anim * 4) * 0.1); const lw = c.lineWidth; c.lineWidth = 0.12; c.strokeStyle = col; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT; }
  if (opt.mane) ell(c, 0.55, -0.25 + b, 0.18, 0.35, opt.mane, -0.4);
  sweat(c, o);
}
function bird(c, o, opt = {}) {
  const col = o.color, b = bob(o) * 1.5, leg = Math.sin(o.anim * 3) * 0.1;
  line(c, -0.12, 0.45, -0.12 - leg, 0.95, 0.08, '#e8a13a'); line(c, 0.15, 0.45, 0.15 + leg, 0.95, 0.08, '#e8a13a');
  ell(c, 0, 0.15 + b, 0.62, 0.48, col);
  ell(c, -0.15, 0.15 + b, 0.35, 0.22, sh(col, -0.08), -0.3);
  circ(c, 0.45, -0.35 + b, 0.3, col);
  if (opt.comb !== false) { circ(c, 0.38, -0.68 + b, 0.1, '#e8432e'); circ(c, 0.52, -0.66 + b, 0.09, '#e8432e'); }
  poly(c, [0.72, -0.38 + b, 0.98, -0.3 + b, 0.72, -0.24 + b], '#ffb13d');
  eyes(c, 0.52, -0.4 + b, 0.09, 0.4, o.scared > 0);
  sweat(c, o);
}
function person(c, o, opt = {}) {
  const col = o.color, b = bob(o), leg = Math.sin(o.anim * 3) * 0.18;
  rr(c, -0.25 - leg * 0.3, 0.35, 0.2, 0.62, 0.08, '#3a4a6a'); rr(c, 0.05 + leg * 0.3, 0.35, 0.2, 0.62, 0.08, '#3a4a6a');
  rr(c, -0.38, -0.25 + b, 0.76, 0.72, 0.2, col);
  line(c, -0.38, -0.1 + b, -0.6, o.scared > 0 ? -0.6 : 0.25, 0.12, col); line(c, 0.38, -0.1 + b, 0.6, o.scared > 0 ? -0.6 : 0.25, 0.12, col);
  circ(c, 0, -0.55 + b, 0.3, '#f2c9a0');
  if (opt.hat === 'cowboy') { ell(c, 0, -0.75 + b, 0.48, 0.1, '#8a5a2b'); rr(c, -0.25, -1.02 + b, 0.5, 0.3, 0.1, '#8a5a2b'); }
  else if (opt.hat === 'cap') { rr(c, -0.3, -0.88 + b, 0.6, 0.2, 0.1, opt.hatColor || '#2a3a7a'); }
  else ell(c, 0, -0.78 + b, 0.3, 0.12, '#5a3a22');
  eyes(c, 0.08, -0.58 + b, 0.07, 0.4, o.scared > 0);
  c.beginPath(); c.arc(0.05, -0.42 + b, 0.08, o.scared > 0 ? Math.PI : 0, o.scared > 0 ? TAU : Math.PI); c.stroke();
  if (opt.star) poly(c, [-0.15, -0.05 + b, -0.05, -0.15 + b, 0.05, -0.05 + b, -0.05, 0.05 + b], '#ffd23f');
  sweat(c, o);
}

// ---------- Weltall ----------
function planet(c, o, opt = {}) {
  const g = c.createRadialGradient(-0.35, -0.35, 0.1, 0, 0, 1);
  g.addColorStop(0, sh(o.color, 0.4)); g.addColorStop(0.65, o.color); g.addColorStop(1, sh(o.color, -0.45));
  c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fillStyle = g; c.fill(); c.stroke();
  if (opt.bands) { c.save(); c.beginPath(); c.arc(0, 0, 0.97, 0, TAU); c.clip(); for (let i = -2; i <= 2; i++) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(-1, i * 0.35, 2, 0.14); } c.restore(); }
  else { circ(c, 0.35, 0.25, 0.2, 'rgba(0,0,0,0.13)', true); circ(c, -0.3, 0.45, 0.13, 'rgba(0,0,0,0.13)', true); circ(c, 0.1, -0.45, 0.1, 'rgba(0,0,0,0.1)', true); }
}
function star(c, o) {
  const t = o.anim || 0;
  const g = c.createRadialGradient(0, 0, 0.2, 0, 0, 1.35);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, o.color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.35 + Math.sin(t) * 0.04, 0, TAU); c.fill();
  circ(c, 0, 0, 0.75, sh(o.color, 0.3));
}

// =====================================================================
export const SPRITES = {
  // ---------------- Vorstadt: Garten ----------------
  blade(c, o) { for (let i = -1; i <= 1; i++) poly(c, [i * 0.32 - 0.12, 0.95, i * 0.45 + 0.05 + Math.sin(o.seed * 9 + i) * 0.15, -0.95 + Math.abs(i) * 0.3, i * 0.32 + 0.14, 0.95], i ? sh(o.color, -0.12) : o.color); },
  flower(c, o) {
    line(c, 0, 0.1, 0, 0.95, 0.12, '#3c8a3a'); ell(c, 0.25, 0.6, 0.22, 0.1, '#4ea84a', -0.5);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; circ(c, Math.cos(a) * 0.38, -0.25 + Math.sin(a) * 0.38, 0.3, o.color); }
    circ(c, 0, -0.25, 0.25, '#ffd23f');
  },
  tulip(c, o) {
    line(c, 0, 0, 0, 0.95, 0.12, '#3c8a3a'); ell(c, -0.25, 0.55, 0.25, 0.1, '#4ea84a', 0.6);
    poly(c, [-0.45, -0.75, -0.2, -0.45, 0, -0.85, 0.2, -0.45, 0.45, -0.75, 0.42, -0.1, -0.42, -0.1], o.color);
  },
  mushroom(c, o) {
    rr(c, -0.25, -0.05, 0.5, 1, 0.18, '#f6ead2');
    c.beginPath(); c.ellipse(0, -0.05, 0.95, 0.8, 0, Math.PI, 0); c.closePath(); fs(c, o.color);
    circ(c, -0.45, -0.38, 0.14, '#fff', true); circ(c, 0.25, -0.6, 0.12, '#fff', true); circ(c, 0.55, -0.25, 0.1, '#fff', true);
  },
  snail(c, o) {
    const b = Math.sin(o.anim * 2) * 0.05;
    rr(c, -0.95, 0.55, 1.9, 0.38, 0.19, '#c9d68a');
    line(c, 0.75, 0.55, 0.85, 0.15, 0.06, '#c9d68a'); circ(c, 0.86, 0.12, 0.06, '#1a0f0f');
    circ(c, -0.1, 0.05 + b, 0.62, o.color);
    c.beginPath(); c.arc(-0.1, 0.05 + b, 0.38, 0, 4.5); c.stroke(); c.beginPath(); c.arc(-0.1, 0.05 + b, 0.17, 0, 4.5); c.stroke();
  },
  chicken: (c, o) => bird(c, o),
  bird: (c, o) => bird(c, o, { comb: false }),
  gnome(c, o) {
    rr(c, -0.42, 0.75, 0.84, 0.22, 0.08, '#5a3a22');
    rr(c, -0.5, 0.05, 1, 0.78, 0.3, o.color);
    circ(c, 0, -0.18, 0.32, '#f6c9a0');
    poly(c, [-0.36, -0.12, 0, 0.55, 0.36, -0.12], '#ffffff');
    poly(c, [-0.42, -0.3, 0.12, -1.05, 0.42, -0.3], '#e23b3b');
    circ(c, 0, -0.08, 0.08, '#ff8a7a', true);
    circ(c, -0.12, -0.22, 0.05, '#1a0f0f', true); circ(c, 0.12, -0.22, 0.05, '#1a0f0f', true);
  },
  can(c, o) {
    rr(c, -0.6, -0.35, 1.05, 1.3, 0.15, o.color);
    poly(c, [0.4, -0.05, 0.95, -0.55, 1, -0.45, 0.45, 0.2], o.color);
    c.beginPath(); c.arc(-0.07, -0.35, 0.45, Math.PI, 0); c.stroke();
    rr(c, -0.5, -0.25, 0.15, 1.05, 0.06, sh(o.color, 0.3), true);
  },
  pot(c, o) {
    circ(c, -0.3, -0.55, 0.32, '#4fae4a'); circ(c, 0.25, -0.68, 0.35, '#5cbd52'); circ(c, 0, -0.95, 0.25, '#4fae4a');
    poly(c, [-0.75, -0.25, 0.75, -0.25, 0.55, 0.95, -0.55, 0.95], o.color);
    rr(c, -0.85, -0.42, 1.7, 0.3, 0.08, sh(o.color, -0.15));
  },
  tank(c, o) {
    rr(c, -0.62, -0.88, 1.24, 1.85, 0.4, o.color);
    rr(c, -0.2, -1.05, 0.4, 0.22, 0.06, '#666');
    rr(c, -0.45, -0.7, 0.18, 1.35, 0.09, sh(o.color, 0.35), true);
    poly(c, [0.05, -0.38, 0.45, 0.32, -0.35, 0.32], '#ffd23f');
    c.fillStyle = '#111'; c.fillRect(0.01, -0.2, 0.08, 0.3); c.fillRect(0.01, 0.17, 0.08, 0.08);
  },
  cat: (c, o) => quad(c, o, { ears: true, tail: true, spots: sh(o.color, -0.2) }),
  bush(c, o) {
    circ(c, -0.45, 0.25, 0.55, sh(o.color, -0.1)); circ(c, 0.45, 0.25, 0.55, sh(o.color, -0.1)); circ(c, 0, -0.2, 0.65, o.color);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + o.seed; const x = Math.cos(a) * 0.75, y = Math.sin(a) * 0.6; poly(c, [x, y, x + Math.cos(a) * 0.28, y + Math.sin(a) * 0.28, x + Math.cos(a + 0.3) * 0.1, y + Math.sin(a + 0.3) * 0.1], '#f2e6c8'); }
    circ(c, -0.2, -0.3, 0.1, '#e23b6a', true); circ(c, 0.3, 0.1, 0.1, '#e23b6a', true);
  },
  chair(c, o) {
    rr(c, -0.65, 0.05, 0.12, 0.9, 0.04, sh(o.color, -0.2)); rr(c, 0.53, 0.05, 0.12, 0.9, 0.04, sh(o.color, -0.2));
    rr(c, -0.75, -0.05, 1.5, 0.2, 0.06, o.color);
    rr(c, 0.5, -0.95, 0.2, 1, 0.06, o.color);
    for (let i = 0; i < 3; i++) rr(c, -0.65 + i * 0.4, -0.05, 0.3, 0.2, 0.04, sh(o.color, -0.08), true);
  },
  mower(c, o) {
    line(c, -0.4, 0.1, -1, -0.8, 0.12, '#555');
    rr(c, -0.8, -0.05, 1.6, 0.75, 0.2, o.color);
    rr(c, -0.55, -0.3, 0.9, 0.35, 0.12, '#333');
    circ(c, -0.55, 0.75, 0.22, '#222'); circ(c, 0.55, 0.75, 0.22, '#222');
    for (let i = 0; i < 4; i++) { const a = o.anim * 5 + i; c.fillStyle = '#7fd65d'; c.fillRect(0.7 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3, 0.08, 0.08); }
  },
  grill(c, o) {
    line(c, -0.45, 0.2, -0.65, 0.95, 0.1, '#444'); line(c, 0.45, 0.2, 0.65, 0.95, 0.1, '#444');
    c.beginPath(); c.arc(0, -0.15, 0.85, 0, Math.PI); c.closePath(); fs(c, o.color);
    rr(c, -0.9, -0.22, 1.8, 0.12, 0.04, '#777');
    for (let i = 0; i < 3; i++) ell(c, -0.45 + i * 0.45, -0.32, 0.18, 0.09, '#b5552a');
    const t = o.anim || 0; poly(c, [-0.2, -0.35, 0, -0.75 - Math.sin(t * 6) * 0.1, 0.2, -0.35], '#ff8a1f', true);
  },
  house: (c, o) => house(c, o, { chimney: o.size > 25 }),
  crate(c, o) {
    rr(c, -0.85, -0.7, 1.7, 1.65, 0.08, o.color);
    rr(c, -0.85, -0.7, 1.7, 0.28, 0.06, sh(o.color, -0.2));
    line(c, -0.75, -0.3, 0.75, 0.85, 0.12, sh(o.color, -0.3)); line(c, 0.75, -0.3, -0.75, 0.85, 0.12, sh(o.color, -0.3));
    circ(c, 0, 0.27, 0.32, '#ffd23f'); c.fillStyle = '#8a5a00'; c.font = 'bold 0.45px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 0.3);
  },

  // ---------------- Vorstadt: Straße / Stadt ----------------
  cone(c, o) {
    rr(c, -0.75, 0.75, 1.5, 0.22, 0.06, sh(o.color, -0.25));
    poly(c, [-0.12, -0.95, 0.12, -0.95, 0.58, 0.78, -0.58, 0.78], o.color);
    poly(c, [-0.33, -0.05, 0.33, -0.05, 0.4, 0.2, -0.4, 0.2], '#ffffff', true);
  },
  hydrant(c, o) {
    rr(c, -0.5, 0.75, 1, 0.22, 0.06, sh(o.color, -0.3));
    rr(c, -0.4, -0.45, 0.8, 1.25, 0.15, o.color);
    c.beginPath(); c.arc(0, -0.45, 0.4, Math.PI, 0); fs(c, o.color);
    rr(c, -0.7, -0.15, 1.4, 0.3, 0.1, sh(o.color, -0.15));
    rr(c, -0.1, -1, 0.2, 0.2, 0.05, sh(o.color, -0.2));
  },
  person: (c, o) => person(c, o),
  cowboy: (c, o) => person(c, o, { hat: 'cowboy', star: o.hazard > 0 }),
  bin(c, o) {
    rr(c, -0.62, -0.55, 1.24, 1.5, 0.1, o.color);
    for (let i = -1; i <= 1; i++) line(c, i * 0.3, -0.35, i * 0.3, 0.8, 0.06, sh(o.color, -0.25));
    rr(c, -0.72, -0.78, 1.44, 0.28, 0.1, sh(o.color, -0.12));
    rr(c, -0.18, -0.92, 0.36, 0.16, 0.05, '#333');
  },
  mailbox(c, o) {
    rr(c, -0.08, 0.1, 0.16, 0.85, 0.04, '#555');
    rr(c, -0.7, -0.75, 1.4, 0.95, 0.3, o.color);
    rr(c, -0.45, -0.45, 0.9, 0.12, 0.05, '#333');
    poly(c, [0.3, -0.75, 0.3, -1.05, 0.65, -0.95, 0.3, -0.85], '#e23b3b');
  },
  trafficlight(c, o) {
    rr(c, -0.08, 0, 0.16, 0.95, 0.04, '#444');
    rr(c, -0.35, -1, 0.7, 1.1, 0.15, o.color);
    const t = Math.floor((o.anim + o.seed * 9) * 0.3) % 3;
    circ(c, 0, -0.78, 0.14, t === 0 ? '#ff4a3d' : '#5a2a2a'); circ(c, 0, -0.45, 0.14, t === 1 ? '#ffd23f' : '#5a4a2a'); circ(c, 0, -0.12, 0.14, t === 2 ? '#4ae07a' : '#2a4a2a');
  },
  scooter(c, o) {
    circ(c, -0.6, 0.72, 0.24, '#26262b'); circ(c, 0.6, 0.72, 0.24, '#26262b');
    rr(c, -0.75, 0.2, 1.4, 0.4, 0.2, o.color);
    line(c, 0.6, 0.3, 0.75, -0.6, 0.1, '#444'); line(c, 0.6, -0.6, 0.95, -0.6, 0.1, '#444');
    c.save(); c.translate(0.1, -0.05); c.scale(0.55, 0.55);
    person(c, { ...o, color: '#e84a5f', scared: 0, anim: 0 }, { hat: 'cap', hatColor: '#ffd23f' });
    c.restore();
  },
  car: (c, o) => vehicle(c, o),
  police(c, o) {
    vehicle(c, o);
    rr(c, -0.95, 0.2, 1.9, 0.14, 0.05, '#2a5ad9', true);
    const t = Math.floor((o.anim || 0) * 4) % 2;
    rr(c, -0.25, -0.75, 0.22, 0.14, 0.05, t ? '#ff3d3d' : '#7a1d1d'); rr(c, 0.03, -0.75, 0.22, 0.14, 0.05, t ? '#3d7aff' : '#1d2a7a');
  },
  bus: (c, o) => vehicle(c, o, { len: 1, h: 1.05, flat: true, windows: 4 }),
  shelter(c, o) {
    rr(c, -0.95, -0.85, 1.9, 0.18, 0.05, sh(o.color, -0.3));
    rr(c, -0.88, -0.7, 0.1, 1.65, 0.03, '#777'); rr(c, 0.78, -0.7, 0.1, 1.65, 0.03, '#777');
    rr(c, -0.78, -0.65, 1.56, 1.1, 0.04, 'rgba(180,220,255,0.55)');
    rr(c, -0.6, 0.45, 1.2, 0.14, 0.04, '#8a5a2b');
    rr(c, 0.15, -0.5, 0.5, 0.7, 0.04, '#ffd23f');
  },
  streetlamp(c, o) {
    rr(c, -0.08, -0.7, 0.16, 1.65, 0.04, '#3a3d4a');
    rr(c, -0.45, 0.85, 0.9, 0.14, 0.05, '#3a3d4a');
    c.beginPath(); c.arc(0, -0.75, 0.32, Math.PI, 0); fs(c, '#3a3d4a');
    ell(c, 0, -0.72, 0.25, 0.08, o.color);
    const g = c.createRadialGradient(0, -0.6, 0, 0, -0.6, 0.9); g.addColorStop(0, 'rgba(255,230,140,0.35)'); g.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, -0.5, 0.9, 0, TAU); c.fill();
  },
  building: (c, o) => facade(c, o, { cols: 3, rows: 4, roof: true }),
  shop(c, o) {
    facade(c, o, { cols: 2, rows: 2, top: -0.6, door: true });
    for (let i = 0; i < 5; i++) poly(c, [-0.8 + i * 0.32, -0.05, -0.48 + i * 0.32, -0.05, -0.5 + i * 0.32, 0.18, -0.78 + i * 0.32, 0.18], i % 2 ? '#ffffff' : '#e23b3b');
  },
  tower: (c, o) => facade(c, o, { w: 0.6, cols: 3, rows: 8, roof: true }),
  saloon(c, o) {
    facade(c, o, { cols: 2, rows: 2, top: -0.75, door: false });
    rr(c, -0.95, -0.05, 1.9, 0.12, 0.03, '#6a3a1a');
    rr(c, -0.3, 0.45, 0.25, 0.4, 0.03, '#a0662d'); rr(c, 0.05, 0.45, 0.25, 0.4, 0.03, '#a0662d');
    rr(c, -0.55, -0.98, 1.1, 0.26, 0.04, '#f2e6c8');
    c.fillStyle = '#6a3a1a'; c.font = 'bold 0.2px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.name.toUpperCase().slice(0, 8), 0, -0.85);
  },
  church(c, o) {
    house(c, o, { roof: '#7a4a3a' });
    rr(c, 0.35, -1.25, 0.4, 1.1, 0.03, o.color);
    poly(c, [0.3, -1.22, 0.55, -1.7, 0.8, -1.22], '#7a4a3a');
    line(c, 0.55, -1.7, 0.55, -1.95, 0.06, '#ffd23f'); line(c, 0.45, -1.85, 0.65, -1.85, 0.06, '#ffd23f');
  },
  tankmil(c, o) {
    rr(c, -1, 0.35, 2, 0.6, 0.3, '#3a3a3a');
    for (let i = 0; i < 5; i++) circ(c, -0.75 + i * 0.38, 0.65, 0.14, '#666');
    rr(c, -0.85, -0.05, 1.7, 0.48, 0.15, o.color);
    rr(c, -0.4, -0.45, 0.8, 0.45, 0.2, sh(o.color, -0.1));
    rr(c, 0.3, -0.33, 0.95, 0.16, 0.05, sh(o.color, -0.25));
    poly(c, [-0.15, -0.3, -0.05, -0.4, 0.05, -0.3, -0.05, -0.2], '#ffd23f', true);
  },
  crane(c, o) {
    for (let i = 0; i < 6; i++) line(c, -0.35, 0.95 - i * 0.32, -0.15, 0.95 - (i + 1) * 0.32, 0.05, o.color);
    rr(c, -0.42, -1, 0.1, 1.95, 0.02, o.color); rr(c, -0.18, -1, 0.1, 1.95, 0.02, o.color);
    rr(c, -0.9, -1.05, 1.9, 0.12, 0.02, o.color);
    rr(c, -0.42, -0.95, 0.34, 0.25, 0.04, '#bfe9ff');
    line(c, 0.75, -0.95, 0.75, -0.3 + Math.sin((o.anim || 0) + o.seed * 5) * 0.1, 0.03, '#333');
    rr(c, 0.62, -0.3, 0.26, 0.2, 0.03, '#888');
    rr(c, -0.9, -0.95, 0.3, 0.25, 0.03, '#666');
  },
  stadium(c, o) {
    ell(c, 0, 0.2, 1, 0.75, sh(o.color, -0.5));
    ell(c, 0, 0.12, 0.92, 0.66, '#d9d9e0');
    ell(c, 0, 0.18, 0.62, 0.4, o.color);
    line(c, 0, -0.22, 0, 0.58, 0.04, '#ffffff'); c.beginPath(); c.arc(0, 0.18, 0.13, 0, TAU); c.stroke();
    for (const x of [-0.9, 0.9]) { rr(c, x - 0.04, -0.9, 0.08, 0.7, 0.02, '#555'); rr(c, x - 0.15, -1, 0.3, 0.15, 0.04, '#fff6b0'); }
  },

  // ---------------- Vorstadt: Gebirge / Kontinent ----------------
  pine(c, o) {
    rr(c, -0.12, 0.55, 0.24, 0.42, 0.04, '#6b4423');
    poly(c, [-0.85, 0.65, 0, -0.1, 0.85, 0.65], sh(o.color, -0.12));
    poly(c, [-0.7, 0.2, 0, -0.55, 0.7, 0.2], o.color);
    poly(c, [-0.5, -0.25, 0, -1, 0.5, -0.25], sh(o.color, 0.1));
  },
  forest(c, o) {
    for (const [x, y, s] of [[-0.5, -0.2, 0.55], [0.45, -0.25, 0.55], [0, 0.15, 0.6], [-0.55, 0.4, 0.5], [0.5, 0.42, 0.5]]) {
      c.save(); c.translate(x, y); c.scale(s, s); SPRITES.pine(c, { ...o, color: sh(o.color, (x + y) * 0.1) }); c.restore();
    }
  },
  goat: (c, o) => quad(c, o, { horns: true, leg: '#8a7a6a' }),
  cow: (c, o) => quad(c, o, { horns: true, spots: '#2a2a2a', snout: '#f2b5a8', tail: true }),
  horse: (c, o) => quad(c, o, { ears: true, tail: true, mane: sh(o.color, -0.4) }),
  gopher(c, o) {
    const b = bob(o) * 2;
    ell(c, 0, 0.85, 0.7, 0.15, '#8a5a2b');
    ell(c, 0, 0.25 + b, 0.45, 0.65, o.color);
    ell(c, 0, 0.4 + b, 0.28, 0.4, sh(o.color, 0.3), 0, true);
    circ(c, -0.3, -0.35 + b, 0.12, o.color); circ(c, 0.3, -0.35 + b, 0.12, o.color);
    eyes(c, -0.13, -0.2 + b, 0.08, 0.2, o.scared > 0); eyes(c, 0.13, -0.2 + b, 0.08, 0.2, o.scared > 0);
    rr(c, -0.07, 0.02 + b, 0.14, 0.12, 0.02, '#ffffff');
    sweat(c, o);
  },
  rock(c, o) {
    c.beginPath();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 0.85 + 0.15 * Math.sin(i * 3.1 + o.seed * 10); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.85 + 0.1); }
    c.closePath(); fs(c, o.color);
    poly(c, [-0.5, -0.4, -0.1, -0.62, 0.2, -0.45, -0.25, -0.2], sh(o.color, 0.25), true);
    line(c, 0.1, 0.1, 0.35, 0.35, 0.05, sh(o.color, -0.35));
  },
  heli(c, o) {
    const t = (o.anim || 0) * 8;
    rr(c, -0.45, 0.7, 1.1, 0.08, 0.03, '#333');
    line(c, -0.2, 0.45, -0.25, 0.7, 0.06, '#333'); line(c, 0.35, 0.45, 0.4, 0.7, 0.06, '#333');
    rr(c, -1, -0.05, 0.9, 0.18, 0.08, o.color);
    poly(c, [-1, -0.3, -0.85, -0.3, -0.85, 0.1, -1, 0.1], o.color);
    ell(c, 0.15, 0.1, 0.62, 0.42, o.color);
    ell(c, 0.42, 0.02, 0.3, 0.25, '#bfe9ff');
    line(c, 0.1, -0.32, 0.1, -0.5, 0.06, '#333');
    ell(c, 0.1, -0.52, Math.abs(Math.cos(t)) * 1 + 0.1, 0.06, 'rgba(60,60,60,0.7)', 0, true);
  },
  dam(c, o) {
    // Staudamm von schräg oben: Stausee hinten, gebogene Mauer, Wasserfälle vorne
    ell(c, 0, -0.45, 1, 0.45, '#3f8fd0');
    ell(c, -0.25, -0.55, 0.4, 0.1, 'rgba(255,255,255,0.35)', 0, true);
    c.beginPath(); c.moveTo(-1, -0.2); c.quadraticCurveTo(0, 0.15, 1, -0.2); c.lineTo(0.9, 0.9); c.quadraticCurveTo(0, 1.1, -0.9, 0.9); c.closePath(); fs(c, o.color);
    for (let i = -2; i <= 2; i++) line(c, i * 0.35, 0.02 + Math.abs(i) * -0.05, i * 0.33, 0.92, 0.04, sh(o.color, -0.18));
    for (const x of [-0.45, 0, 0.45]) { rr(c, x - 0.08, 0.05, 0.16, 0.85, 0.05, 'rgba(170,220,255,0.95)', true); }
    ell(c, 0, 0.95, 0.7, 0.12, 'rgba(255,255,255,0.7)', 0, true);
  },
  tanker(c, o) {
    // Tanklaster
    for (const x of [-0.7, -0.3, 0.65]) { circ(c, x, 0.75, 0.2, '#26262b'); circ(c, x, 0.75, 0.08, '#9aa0aa', true); }
    rr(c, 0.4, -0.25, 0.6, 0.85, 0.12, '#f2f2f2');
    rr(c, 0.55, -0.15, 0.35, 0.3, 0.06, '#bfe9ff');
    rr(c, -1, -0.35, 1.38, 0.95, 0.45, o.color);
    rr(c, -0.85, -0.25, 1.1, 0.12, 0.05, sh(o.color, 0.3), true);
    poly(c, [-0.32, -0.05, -0.12, 0.32, -0.52, 0.32], '#ffd23f');
    c.fillStyle = '#111'; c.fillRect(-0.34, 0.03, 0.04, 0.17); c.fillRect(-0.34, 0.23, 0.04, 0.04);
  },
  gasstation(c, o) {
    // Tankstelle: Dach auf Säulen, Zapfsäulen, Schild
    rr(c, -0.95, 0.75, 1.9, 0.22, 0.04, '#8a8d96');
    rr(c, -0.75, -0.35, 0.12, 1.1, 0.03, '#e8e8e8'); rr(c, 0.63, -0.35, 0.12, 1.1, 0.03, '#e8e8e8');
    rr(c, -1, -0.65, 2, 0.35, 0.06, o.color);
    rr(c, -1, -0.38, 2, 0.08, 0.02, '#ffffff', true);
    for (const x of [-0.35, 0.2]) { rr(c, x, 0.25, 0.22, 0.52, 0.05, '#f2f2f2'); rr(c, x + 0.04, 0.32, 0.14, 0.12, 0.02, '#333'); }
    rr(c, 0.75, -1.05, 0.22, 0.45, 0.04, '#ffd23f');
    c.fillStyle = '#2a1b1b'; c.font = 'bold 0.16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⛽', 0.86, -0.83);
    poly(c, [-0.15, -0.6, 0.05, -0.38, -0.35, -0.38], '#ffd23f');
  },
  gastank(c, o) {
    // Kugeltank auf Stelzen
    for (const x of [-0.6, -0.2, 0.2, 0.6]) line(c, x, 0.2, x * 1.15, 0.95, 0.08, '#6a6d76');
    line(c, -0.65, 0.6, 0.65, 0.6, 0.05, '#6a6d76');
    const g = c.createRadialGradient(-0.3, -0.45, 0.05, 0, -0.15, 0.85);
    g.addColorStop(0, sh(o.color, 0.45)); g.addColorStop(0.7, o.color); g.addColorStop(1, sh(o.color, -0.35));
    c.beginPath(); c.arc(0, -0.15, 0.8, 0, TAU); c.fillStyle = g; c.fill(); c.stroke();
    rr(c, -0.8, -0.2, 1.6, 0.1, 0.03, sh(o.color, -0.25), true);
    poly(c, [0, -0.62, 0.3, -0.12, -0.3, -0.12], '#ffd23f');
    c.fillStyle = '#111'; c.fillRect(-0.025, -0.5, 0.05, 0.22); c.fillRect(-0.025, -0.24, 0.05, 0.05);
  },
  rig(c, o) {
    // Ölbohrinsel im Meer
    ell(c, 0, 0.85, 1, 0.18, 'rgba(255,255,255,0.4)', 0, true);
    for (const x of [-0.6, 0.6]) { rr(c, x - 0.08, -0.05, 0.16, 1, 0.04, '#5a5d66'); }
    rr(c, -0.9, -0.2, 1.8, 0.3, 0.05, '#8a8d96');
    rr(c, -0.8, -0.5, 0.7, 0.32, 0.04, '#f2f2f2');
    rr(c, 0.05, -0.55, 0.3, 0.38, 0.04, o.color);
    for (let i = 0; i < 5; i++) line(c, 0.55 + (i % 2) * 0.1, -0.2 - i * 0.16, 0.65 - (i % 2) * 0.1, -0.36 - i * 0.16, 0.04, '#e8e8e8');
    line(c, 0.6, -0.2, 0.6, -1.0, 0.05, '#e8e8e8');
    circ(c, 0.85, -0.9, 0.12 + Math.sin((o.anim || 0) * 8) * 0.03, '#ff8a1f');
  },
  mountain(c, o) {
    poly(c, [-1, 0.95, -0.15, -0.95, 1, 0.95], sh(o.color, -0.2));
    poly(c, [-1, 0.95, -0.15, -0.95, 0.15, 0.95], o.color, true);
    poly(c, [-0.48, -0.25, -0.15, -0.95, 0.15, -0.3, -0.02, -0.4, -0.15, -0.25, -0.3, -0.38], '#ffffff');
  },
  mesa(c, o) {
    poly(c, [-1, 0.95, -0.7, -0.5, 0.7, -0.5, 1, 0.95], o.color);
    for (let i = 0; i < 3; i++) rr(c, -0.85 + i * 0.05, -0.2 + i * 0.35, 1.7 - i * 0.1, 0.06, 0.02, sh(o.color, -0.2), true);
    rr(c, -0.72, -0.56, 1.44, 0.12, 0.04, sh(o.color, 0.2));
  },
  volcano(c, o) {
    poly(c, [-1, 0.95, -0.28, -0.6, 0.28, -0.6, 1, 0.95], o.color);
    poly(c, [-0.28, -0.6, 0.28, -0.6, 0.18, -0.4, 0, -0.5, -0.18, -0.35], '#ff6a1f');
    line(c, -0.1, -0.45, -0.35, 0.2, 0.1, '#ff8a2a'); line(c, 0.15, -0.45, 0.3, 0.05, 0.08, '#ff8a2a');
    const t = o.anim || 0;
    for (let i = 0; i < 3; i++) circ(c, Math.sin(t * 2 + i * 2) * 0.2, -0.8 - ((t * 0.6 + i * 0.33) % 1) * 0.5, 0.15 + i * 0.03, 'rgba(90,80,80,0.6)', true);
  },
  ship(c, o) {
    poly(c, [-1, 0.2, 1, 0.2, 0.7, 0.75, -0.8, 0.75], o.color);
    rr(c, -0.95, 0.45, 1.85, 0.12, 0.03, '#e23b3b', true);
    rr(c, -0.5, -0.3, 0.9, 0.5, 0.06, '#f6f6f6');
    for (let i = 0; i < 4; i++) circ(c, -0.35 + i * 0.22, -0.05, 0.06, '#5a8ad9');
    rr(c, 0.05, -0.75, 0.22, 0.45, 0.04, '#e23b3b');
  },
  village(c, o) {
    for (const [x, y, s, col] of [[-0.5, -0.25, 0.5, '#e0b48a'], [0.45, -0.3, 0.45, '#d9c8a8'], [0, 0.3, 0.55, '#c9a27e'], [-0.55, 0.45, 0.4, '#e8d0b0']]) {
      c.save(); c.translate(x, y); c.scale(s, s); house(c, { ...o, color: col }); c.restore();
    }
  },
  island(c, o) {
    ell(c, 0, 0.35, 1, 0.55, 'rgba(255,255,255,0.35)', 0, true);
    c.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 0.82 + 0.12 * Math.sin(i * 2.3 + o.seed * 7); c.lineTo(Math.cos(a) * r, 0.3 + Math.sin(a) * r * 0.5); }
    c.closePath(); fs(c, o.color);
    if (o.name !== 'Wüste') {
      line(c, 0.1, 0.25, 0.2, -0.55, 0.1, '#8a5a2b');
      for (let i = 0; i < 4; i++) ell(c, 0.2 + Math.cos(i * 1.6) * 0.25, -0.58 + Math.sin(i * 1.6) * 0.08, 0.28, 0.08, '#3c9a3a', i * 1.6);
    } else { poly(c, [-0.4, 0.4, -0.2, 0, 0, 0.4], '#e0a84a'); poly(c, [0.1, 0.45, 0.35, -0.05, 0.6, 0.45], '#d99a3a'); }
  },
  tornado(c, o) {
    const t = o.anim || 0;
    for (let i = 0; i < 7; i++) {
      const y = 0.85 - i * 0.28, w = 0.18 + i * 0.13, x = Math.sin(t * 3 + i * 0.7) * 0.12 * (7 - i) / 7;
      ell(c, x, y, w, 0.12, i % 2 ? o.color : sh(o.color, -0.12));
    }
  },
  metropolis(c, o) {
    const bs = [[-0.75, 0.35, 0.5], [-0.3, 0.5, 1.4], [0.15, 0.4, 0.9], [0.6, 0.35, 1.2]];
    for (const [x, w, h] of bs) {
      rr(c, x - w / 2 + 0.2, 0.95 - h, w * 0.9, h, 0.03, sh(o.color, x * 0.15));
      for (let j = 0; j < h * 6; j++) c.fillStyle = '#ffe9a0', c.fillRect(x - w / 2 + 0.3, 1.0 - h + j * 0.16, 0.08, 0.07), c.fillRect(x - w / 2 + 0.5, 1.0 - h + j * 0.16, 0.08, 0.07);
    }
  },

  // ---------------- Weltall ----------------
  satellite(c, o) {
    rr(c, -1, -0.25, 0.65, 0.5, 0.03, '#2a5ad9'); rr(c, 0.35, -0.25, 0.65, 0.5, 0.03, '#2a5ad9');
    for (const x of [-0.8, -0.6, 0.55, 0.75]) line(c, x, -0.25, x, 0.25, 0.02, '#8fb3ff');
    rr(c, -0.35, -0.4, 0.7, 0.8, 0.1, o.color);
    line(c, 0, -0.4, 0, -0.75, 0.05, '#888'); circ(c, 0, -0.8, 0.08, '#ff4a3d');
  },
  station(c, o) {
    c.beginPath(); c.arc(0, 0, 0.85, 0, TAU); const lw = c.lineWidth; c.lineWidth = 0.18; c.strokeStyle = o.color; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
    c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 0.76, 0, TAU); c.stroke();
    line(c, -0.8, 0, 0.8, 0, 0.08, '#aab'); line(c, 0, -0.8, 0, 0.8, 0.08, '#aab');
    circ(c, 0, 0, 0.25, o.color);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (o.anim || 0) * 0.3; circ(c, Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.05, '#ffe9a0', true); }
  },
  ufo(c, o) {
    const b = Math.sin((o.anim || 0) * 2) * 0.06, t = o.anim || 0;
    const g = c.createLinearGradient(0, 0.2, 0, 1); g.addColorStop(0, 'rgba(160,255,160,0.35)'); g.addColorStop(1, 'rgba(160,255,160,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.35, 0.2); c.lineTo(0.35, 0.2); c.lineTo(0.7, 1); c.lineTo(-0.7, 1); c.fill();
    ell(c, 0, -0.15 + b, 0.55, 0.45, 'rgba(180,240,255,0.85)');
    circ(c, 0, -0.12 + b, 0.2, o.color); circ(c, -0.07, -0.16 + b, 0.06, '#000', true); circ(c, 0.07, -0.16 + b, 0.06, '#000', true);
    ell(c, 0, 0.12 + b, 1, 0.3, '#9aa3b5');
    for (let i = 0; i < 5; i++) circ(c, -0.7 + i * 0.35, 0.14 + b, 0.07, Math.floor(t * 4 + i) % 2 ? '#ffd23f' : '#ff4a3d', true);
  },
  planet: (c, o) => planet(c, o, { bands: o.name === 'Gasriese' }),
  earth(c, o) {
    planet(c, o);
    c.save(); c.beginPath(); c.arc(0, 0, 0.97, 0, TAU); c.clip();
    c.fillStyle = '#5cbd52';
    for (const [x, y, r] of [[-0.35, -0.3, 0.35], [0.35, 0.2, 0.4], [-0.2, 0.55, 0.25], [0.5, -0.5, 0.2]]) { c.beginPath(); c.ellipse(x, y, r, r * 0.7, x, 0, TAU); c.fill(); }
    c.restore();
    ell(c, 0, -0.88, 0.3, 0.1, '#ffffff', 0, true);
  },
  comet(c, o) {
    const g = c.createLinearGradient(0, 0, -2, 0); g.addColorStop(0, o.color); g.addColorStop(1, 'rgba(191,232,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -0.45); c.lineTo(-2, -0.15); c.lineTo(-2, 0.15); c.lineTo(0, 0.45); c.fill();
    circ(c, 0, 0, 0.5, '#e6f6ff');
  },
  ringplanet(c, o) {
    c.save(); c.rotate(-0.3);
    c.beginPath(); c.ellipse(0, 0, 1.3, 0.35, 0, Math.PI, TAU); const lw = c.lineWidth; c.lineWidth = 0.14; c.strokeStyle = sh(o.color, -0.25); c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
    c.restore();
    planet(c, { ...o }, { bands: true });
    c.save(); c.rotate(-0.3);
    c.beginPath(); c.ellipse(0, 0, 1.3, 0.35, 0, 0, Math.PI); c.lineWidth = 0.14; c.strokeStyle = sh(o.color, -0.1); c.stroke();
    c.restore(); c.lineWidth = lw; c.strokeStyle = OUT;
  },
  star: (c, o) => star(c, o),
  nebula(c, o) {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + o.seed * 6, d = 0.45;
      const g = c.createRadialGradient(Math.cos(a) * d, Math.sin(a) * d, 0, Math.cos(a) * d, Math.sin(a) * d, 0.75);
      g.addColorStop(0, o.color + 'bb'); g.addColorStop(1, o.color + '00');
      c.fillStyle = g; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.75, 0, TAU); c.fill();
    }
    for (let i = 0; i < 5; i++) circ(c, Math.cos(i * 2.4) * 0.5, Math.sin(i * 2.4) * 0.5, 0.05, '#ffffff', true);
  },
  cluster(c, o) {
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4 + o.seed * 5, d = Math.sqrt(i / 16) * 0.85;
      circ(c, Math.cos(a) * d, Math.sin(a) * d, 0.09 + (i % 3) * 0.03, i % 3 ? o.color : '#ffffff', true);
    }
  },
  blackhole(c, o) {
    const t = o.anim || 0;
    c.save(); c.rotate(t * 0.5);
    const g = c.createRadialGradient(0, 0, 0.35, 0, 0, 1.25);
    g.addColorStop(0, '#000'); g.addColorStop(0.4, '#000'); g.addColorStop(0.5, '#ffb13d'); g.addColorStop(0.7, '#b06bff88'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 1.25, 0.7, 0, 0, TAU); c.fill();
    c.restore();
    circ(c, 0, 0, 0.42, '#000000');
  },
  galaxy(c, o) {
    const t = (o.anim || 0) * 0.2;
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 18; i++) {
      const a = arm * TAU / 3 + i * 0.28 + t, d = i / 18;
      circ(c, Math.cos(a) * d, Math.sin(a) * d * 0.7, 0.07 * (1 - d * 0.5), i % 4 ? o.color : '#ffffff', true);
    }
    circ(c, 0, 0, 0.18, '#fff6d0', true);
  },

  // ---------------- Dimensionen ----------------
  crystal(c, o) {
    const t = o.anim || 0;
    const g = c.createRadialGradient(0, 0, 0.1, 0, 0, 1.3); g.addColorStop(0, o.color + '66'); g.addColorStop(1, o.color + '00');
    c.fillStyle = g; c.beginPath(); c.arc(0, -0.1, 1.3, 0, TAU); c.fill();
    for (const [x, h, w, r] of [[-0.5, 0.9, 0.32, -0.35], [0.45, 1.05, 0.34, 0.3], [0, 1.6, 0.42, 0]]) {
      c.save(); c.translate(x, 0.85); c.rotate(r);
      poly(c, [-w, 0, -w, -h * 0.75, 0, -h, w, -h * 0.75, w, 0], o.color);
      poly(c, [-w, -h * 0.75, 0, -h, 0, 0, -w, 0], sh(o.color, 0.35), true);
      line(c, 0, -h, 0, 0, 0.03, sh(o.color, -0.3));
      c.restore();
    }
    circ(c, 0.1, -0.55 + Math.sin(t * 3) * 0.05, 0.06, '#ffffff', true);
  },
  portal(c, o) {
    const t = o.anim || 0;
    ell(c, 0, 0, 0.95, 0.95, sh(o.color, -0.5));
    c.save(); c.beginPath(); c.arc(0, 0, 0.82, 0, TAU); c.clip();
    const g = c.createRadialGradient(0, 0, 0.05, 0, 0, 0.85); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, o.color); g.addColorStop(1, '#05030a');
    c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.06;
    for (let i = 0; i < 4; i++) { c.beginPath(); for (let k = 0; k < 30; k++) { const a = k * 0.25 + t * 2 + i * Math.PI / 2, r = k / 30 * 0.8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
    c.restore(); c.lineWidth = Math.max(c.lineWidth, 0.04); c.strokeStyle = OUT;
    c.beginPath(); c.arc(0, 0, 0.9, 0, TAU); c.lineWidth = 0.12; c.strokeStyle = o.color; c.stroke(); c.lineWidth = 0.05; c.strokeStyle = OUT;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t; circ(c, Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.07, '#ffffff', true); }
  },
  eye(c, o) {
    const t = o.anim || 0, blink = (Math.sin(t * 0.7 + o.seed * 9) > 0.97) ? 0.15 : 1;
    // Tentakel
    for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + i * 0.14), w = Math.sin(t * 3 + i) * 0.15; c.beginPath(); c.moveTo(Math.cos(a) * 0.6, Math.sin(a) * 0.6); c.quadraticCurveTo(Math.cos(a) * 1 + w, Math.sin(a) * 1, Math.cos(a) * 1.15 - w, Math.sin(a) * 1.15); const lw = c.lineWidth; c.lineWidth = 0.14; c.strokeStyle = sh(o.color, -0.4); c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT; }
    ell(c, 0, 0, 0.82, 0.82 * blink, '#fff6ee');
    if (blink > 0.5) {
      c.strokeStyle = 'rgba(200,40,40,0.5)'; c.lineWidth = 0.03;
      for (let i = 0; i < 7; i++) { const a = i * 0.9; c.beginPath(); c.moveTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78); c.lineTo(Math.cos(a + 0.2) * 0.45, Math.sin(a + 0.2) * 0.45); c.stroke(); }
      c.strokeStyle = OUT; c.lineWidth = 0.05;
      const lx = Math.sin(t * 0.9) * 0.18, ly = Math.cos(t * 1.3) * 0.12;
      circ(c, lx, ly, 0.38, o.color);
      circ(c, lx, ly, 0.18, '#05030a', true);
      circ(c, lx - 0.1, ly - 0.12, 0.07, '#ffffff', true);
    }
  },

  // ---------------- Wilder Westen ----------------
  cactus(c, o) {
    rr(c, -0.22, -0.95, 0.44, 1.9, 0.22, o.color);
    rr(c, -0.7, -0.35, 0.3, 0.7, 0.15, o.color); rr(c, -0.7, 0.15, 0.55, 0.22, 0.1, o.color);
    rr(c, 0.4, -0.6, 0.3, 0.6, 0.15, o.color); rr(c, 0.15, -0.15, 0.55, 0.22, 0.1, o.color);
    for (let i = 0; i < 6; i++) line(c, -0.05, -0.7 + i * 0.28, 0.05, -0.75 + i * 0.28, 0.03, '#f2e6c8');
    if (o.size > 15) circ(c, 0, -0.98, 0.12, '#ff6fa8');
  },
  tumble(c, o) {
    c.save(); c.translate(0, 0.25); c.rotate((o.anim || 0) * 2);
    for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(0, 0, 0.7, 0.3 + i * 0.05, i * 0.45, 0, TAU); const lw = c.lineWidth; c.lineWidth = 0.06; c.strokeStyle = o.color; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT; }
    c.restore();
  },
  snake(c, o) {
    const t = o.anim || 0;
    c.beginPath(); c.moveTo(-0.9, 0.6);
    for (let i = 1; i <= 8; i++) c.lineTo(-0.9 + i * 0.2, 0.6 + Math.sin(t * 3 + i) * 0.15);
    const lw = c.lineWidth; c.lineWidth = 0.3; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.2; c.strokeStyle = o.color; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
    ell(c, 0.75, 0.35, 0.28, 0.2, o.color);
    eyes(c, 0.82, 0.28, 0.07, 0.4); line(c, 1.02, 0.4, 1.15, 0.45, 0.03, '#e23b3b');
  },
  barrel(c, o) {
    rr(c, -0.65, -0.85, 1.3, 1.8, 0.3, o.color);
    for (const y of [-0.55, 0.55]) rr(c, -0.68, y - 0.06, 1.36, 0.12, 0.04, '#555');
    for (let i = -1; i <= 1; i++) line(c, i * 0.32, -0.75, i * 0.32, 0.85, 0.03, sh(o.color, -0.25));
  },
  dynamite(c, o) {
    rr(c, -0.85, -0.2, 1.7, 1.15, 0.06, '#a0662d');
    for (let i = 0; i < 4; i++) rr(c, -0.75 + i * 0.4, -0.75, 0.3, 0.7, 0.1, o.color);
    line(c, 0, -0.75, 0.2, -1.05, 0.04, '#555');
    circ(c, 0.22, -1.08, 0.08 + Math.sin((o.anim || 0) * 20) * 0.03, '#ffd23f', true);
    c.fillStyle = '#2a1b1b'; c.font = 'bold 0.28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TNT', 0, 0.38);
  },
  wagon(c, o) {
    circ(c, -0.55, 0.65, 0.3, '#8a5a2b'); circ(c, 0.55, 0.65, 0.3, '#8a5a2b');
    rr(c, -0.95, 0.05, 1.9, 0.45, 0.06, '#8a5a2b');
    c.beginPath(); c.moveTo(-0.85, 0.1); c.bezierCurveTo(-0.85, -0.95, 0.85, -0.95, 0.85, 0.1); c.closePath(); fs(c, o.color);
    for (let i = -1; i <= 1; i++) line(c, i * 0.45, 0.05, i * 0.45, -0.62 + Math.abs(i) * 0.1, 0.03, sh(o.color, -0.2));
  },
  windmill(c, o) {
    rr(c, -0.06, -0.55, 0.12, 1.5, 0.03, '#8a8a8a');
    for (let i = 0; i < 3; i++) { line(c, -0.35 + i * 0.35, 0.95, 0, -0.5, 0.04, '#8a8a8a'); }
    c.save(); c.translate(0, -0.6); c.rotate((o.anim || 0) * 2 + o.seed * 5);
    for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); poly(c, [0, 0, 0.12, -0.55, -0.05, -0.55], o.color); }
    c.restore(); circ(c, 0, -0.6, 0.08, '#555');
  },
  barn(c, o) { house(c, o, { roof: '#8a2a1e' }); line(c, -0.17, 0.42, 0.17, 0.95, 0.05, '#ffffff'); line(c, 0.17, 0.42, -0.17, 0.95, 0.05, '#ffffff'); },
  watertower(c, o) {
    for (const x of [-0.5, 0.5]) line(c, x * 0.8, -0.1, x, 0.95, 0.08, '#6a4a2a');
    line(c, -0.45, 0.4, 0.45, 0.4, 0.05, '#6a4a2a');
    rr(c, -0.65, -0.85, 1.3, 0.85, 0.08, o.color);
    poly(c, [-0.75, -0.82, 0, -1.15, 0.75, -0.82], sh(o.color, -0.3));
    for (let i = -1; i <= 1; i++) line(c, i * 0.35, -0.8, i * 0.35, -0.05, 0.03, sh(o.color, -0.25));
  },
  saloon2: (c, o) => SPRITES.saloon(c, o),
  train(c, o) {
    circ(c, -0.6, 0.7, 0.25, '#333'); circ(c, 0, 0.7, 0.25, '#333'); circ(c, 0.6, 0.7, 0.25, '#333');
    rr(c, -0.95, -0.1, 1.2, 0.7, 0.1, o.color);
    rr(c, 0.25, -0.65, 0.7, 1.25, 0.08, sh(o.color, -0.15));
    rr(c, 0.38, -0.5, 0.42, 0.35, 0.05, '#ffe9a0');
    rr(c, -0.75, -0.55, 0.25, 0.45, 0.04, '#333');
    poly(c, [-1.05, 0.6, -0.95, 0.1, -0.95, 0.6], '#e23b3b');
    const t = o.anim || 0;
    for (let i = 0; i < 3; i++) circ(c, -0.62 - i * 0.15, -0.75 - ((t + i * 0.33) % 1) * 0.5, 0.12 + i * 0.04, 'rgba(230,230,230,0.8)', true);
  },
  mine(c, o) {
    c.beginPath(); c.moveTo(-1, 0.95); c.quadraticCurveTo(0, -1.3, 1, 0.95); c.closePath(); fs(c, o.color);
    c.beginPath(); c.moveTo(-0.45, 0.95); c.lineTo(-0.45, 0.15); c.quadraticCurveTo(0, -0.25, 0.45, 0.15); c.lineTo(0.45, 0.95); c.closePath(); fs(c, '#1a1210');
    rr(c, -0.55, 0.05, 1.1, 0.14, 0.03, '#8a5a2b');
    line(c, -0.45, 0.15, -0.45, 0.95, 0.1, '#8a5a2b'); line(c, 0.45, 0.15, 0.45, 0.95, 0.1, '#8a5a2b');
    circ(c, -0.15, 0.7, 0.12, '#ffd23f'); circ(c, 0.12, 0.78, 0.1, '#ffd23f');
  },
  totem(c, o) {
    const cols = [o.color, '#3a8ad9', '#e23b3b'];
    for (let i = 0; i < 3; i++) {
      rr(c, -0.42, -0.95 + i * 0.63, 0.84, 0.62, 0.08, cols[i]);
      eyes(c, -0.18, -0.75 + i * 0.63, 0.1, 0); eyes(c, 0.18, -0.75 + i * 0.63, 0.1, 0);
      rr(c, -0.2, -0.55 + i * 0.63, 0.4, 0.1, 0.03, '#2a1b1b');
    }
    poly(c, [-0.42, -0.85, -0.95, -1.05, -0.42, -0.6], '#ffd23f'); poly(c, [0.42, -0.85, 0.95, -1.05, 0.42, -0.6], '#ffd23f');
  },

  // ---------------- Zuckerland ----------------
  sprinkle(c, o) { c.save(); c.rotate(o.seed * 6); rr(c, -0.9, -0.3, 1.8, 0.6, 0.3, o.color); c.restore(); },
  gummy(c, o) {
    const b = bob(o) * 1.5, leg = Math.sin(o.anim * 3) * 0.1;
    c.globalAlpha = 0.92;
    ell(c, -0.3, 0.75 + leg, 0.22, 0.25, o.color); ell(c, 0.3, 0.75 - leg, 0.22, 0.25, o.color);
    ell(c, 0, 0.2 + b, 0.55, 0.6, o.color);
    ell(c, -0.55, 0.05 + b, 0.18, 0.25, o.color); ell(c, 0.55, 0.05 + b, 0.18, 0.25, o.color);
    circ(c, 0, -0.55 + b, 0.42, o.color);
    circ(c, -0.33, -0.88 + b, 0.15, o.color); circ(c, 0.33, -0.88 + b, 0.15, o.color);
    c.globalAlpha = 1;
    ell(c, -0.15, -0.65 + b, 0.08, 0.16, 'rgba(255,255,255,0.6)', 0.3, true);
    eyes(c, -0.13, -0.58 + b, 0.08, 0.2, o.scared > 0); eyes(c, 0.13, -0.58 + b, 0.08, 0.2, o.scared > 0);
    sweat(c, o);
  },
  candy(c, o) {
    poly(c, [-0.5, 0, -1, -0.4, -1, 0.4], sh(o.color, 0.2)); poly(c, [0.5, 0, 1, -0.4, 1, 0.4], sh(o.color, 0.2));
    circ(c, 0, 0, 0.55, o.color);
    c.save(); c.beginPath(); c.arc(0, 0, 0.53, 0, TAU); c.clip();
    for (let i = -2; i <= 2; i++) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(i * 0.3 - 0.1, -0.6); c.lineTo(i * 0.3 + 0.1, -0.6); c.lineTo(i * 0.3 + 0.4, 0.6); c.lineTo(i * 0.3 + 0.2, 0.6); c.fill(); }
    c.restore();
  },
  lolly(c, o) {
    rr(c, -0.06, -0.1, 0.12, 1.05, 0.04, '#f6f0e0');
    circ(c, 0, -0.45, 0.58, o.color);
    c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.4 + (o.anim || 0) * 0.5, r = i / 40 * 0.52; c.lineTo(Math.cos(a) * r, -0.45 + Math.sin(a) * r); }
    const lw = c.lineWidth; c.lineWidth = 0.1; c.strokeStyle = '#ffffff'; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
  },
  cupcake(c, o) {
    poly(c, [-0.65, 0.05, 0.65, 0.05, 0.45, 0.95, -0.45, 0.95], '#e8a95a');
    for (let i = -2; i <= 2; i++) line(c, i * 0.2, 0.1, i * 0.15, 0.9, 0.03, '#c98a3d');
    circ(c, -0.4, -0.05, 0.35, o.color); circ(c, 0.4, -0.05, 0.35, o.color); circ(c, 0, -0.3, 0.45, o.color); circ(c, 0, -0.7, 0.28, o.color);
    circ(c, 0, -1, 0.15, '#e23b3b');
    for (let i = 0; i < 6; i++) { c.fillStyle = ['#ffd23f', '#7fd3ff', '#7fe07f'][i % 3]; c.fillRect(-0.4 + i * 0.15, -0.35 + Math.sin(i * 2) * 0.2, 0.08, 0.04); }
  },
  donut(c, o) {
    ell(c, 0, 0.1, 0.95, 0.75, '#e8a95a');
    c.beginPath(); c.ellipse(0, 0.02, 0.9, 0.66, 0, Math.PI * 1.05, Math.PI * 1.95 + 0.3); c.lineTo(0.88, 0.18); c.quadraticCurveTo(0, 0.7, -0.9, 0.15); c.closePath(); fs(c, o.color);
    ell(c, 0, 0.08, 0.3, 0.22, '#3a1d1d');
    for (let i = 0; i < 9; i++) { c.fillStyle = ['#ffd23f', '#7fd3ff', '#ffffff'][i % 3]; c.save(); c.translate(Math.cos(i * 0.7) * 0.6, Math.sin(i * 0.7) * 0.35 - 0.05); c.rotate(i); c.fillRect(-0.06, -0.02, 0.12, 0.05); c.restore(); }
  },
  cotton(c, o) {
    rr(c, -0.05, 0.1, 0.1, 0.85, 0.03, '#f6f0e0');
    for (const [x, y, r] of [[-0.35, -0.2, 0.45], [0.35, -0.25, 0.45], [0, -0.55, 0.5], [0, 0, 0.4]]) circ(c, x, y, r, o.color);
    circ(c, -0.2, -0.6, 0.15, 'rgba(255,255,255,0.6)', true);
  },
  icecream(c, o) {
    poly(c, [-0.45, -0.2, 0.45, -0.2, 0, 0.95], '#e8b06a');
    line(c, -0.3, -0.05, 0.1, 0.6, 0.03, '#c98a3d'); line(c, 0.3, -0.05, -0.1, 0.6, 0.03, '#c98a3d');
    circ(c, 0, -0.45, 0.45, o.color); circ(c, 0.15, -0.85, 0.35, '#ffd9f0'); circ(c, 0.2, -1.15, 0.1, '#e23b3b');
  },
  gingerhouse(c, o) {
    house(c, o, { roof: '#ffffff' });
    for (let i = 0; i < 5; i++) circ(c, -0.7 + i * 0.35, -0.08, 0.08, ['#e23b3b', '#4ae07a', '#ffd23f'][i % 3]);
    rr(c, -0.17, 0.42, 0.34, 0.53, 0.05, '#e23b6a');
  },
  bottle(c, o) {
    rr(c, -0.2, -1, 0.4, 0.5, 0.06, o.color);
    rr(c, -0.24, -1.08, 0.48, 0.12, 0.04, '#e23b3b');
    rr(c, -0.5, -0.55, 1, 1.5, 0.35, o.color);
    rr(c, -0.5, -0.1, 1, 0.45, 0.04, '#e23b3b');
    c.fillStyle = '#fff'; c.font = 'bold 0.2px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COLA', 0, 0.13);
    for (let i = 0; i < 4; i++) circ(c, -0.2 + i * 0.13, 0.6 - ((o.anim || 0) * 0.5 + i * 0.25) % 1 * 0.4, 0.04, 'rgba(255,255,255,0.7)', true);
  },
  cake(c, o) {
    rr(c, -0.95, 0.15, 1.9, 0.8, 0.1, o.color);
    rr(c, -0.7, -0.5, 1.4, 0.7, 0.1, sh(o.color, 0.15));
    for (let i = 0; i < 8; i++) circ(c, -0.85 + i * 0.24, 0.17, 0.1, '#ffffff', true);
    for (let i = 0; i < 3; i++) { rr(c, -0.4 + i * 0.35, -0.85, 0.1, 0.35, 0.03, '#7fd3ff'); circ(c, -0.35 + i * 0.35, -0.92, 0.06 + Math.sin((o.anim || 0) * 10 + i) * 0.02, '#ffd23f', true); }
  },
  fountain(c, o) {
    ell(c, 0, 0.7, 0.95, 0.28, '#e8c8a0');
    ell(c, 0, 0.62, 0.8, 0.2, o.color);
    rr(c, -0.1, -0.45, 0.2, 1.05, 0.05, '#e8c8a0');
    ell(c, 0, -0.45, 0.5, 0.14, '#e8c8a0'); ell(c, 0, -0.5, 0.42, 0.1, o.color);
    const t = o.anim || 0;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t; circ(c, Math.cos(a) * 0.45, -0.2 + Math.abs(Math.sin(t * 3 + i)) * 0.3, 0.06, o.color, true); }
  },
  candycane(c, o) {
    c.beginPath(); c.moveTo(0.1, 0.95); c.lineTo(0.1, -0.4); c.arc(-0.2, -0.4, 0.3, 0, Math.PI, true);
    const lw = c.lineWidth; c.lineWidth = 0.32; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.24; c.strokeStyle = '#ffffff'; c.stroke();
    c.setLineDash([0.14, 0.14]); c.strokeStyle = o.color; c.stroke(); c.setLineDash([]); c.lineWidth = lw; c.strokeStyle = OUT;
  },

  // ================= Dimensionen: thematische Objekte =================
  // --- Götter / Himmel / Ruinen
  pillar(c, o) { // (zerbrochene) Säule
    rr(c, -0.5, 0.75, 1, 0.22, 0.04, sh(o.color, -0.1)); rr(c, -0.38, -0.7, 0.76, 1.48, 0.04, o.color);
    for (let i = -1; i <= 1; i++) line(c, i * 0.2, -0.62, i * 0.2, 0.7, 0.04, sh(o.color, -0.25));
    poly(c, [-0.5, -0.7, 0.5, -0.7, 0.42, -0.86, 0.15, -0.8, -0.05, -0.98, -0.25, -0.82, -0.45, -0.88], sh(o.color, 0.1));
  },
  temple(c, o) { // griechischer Tempel
    rr(c, -0.98, 0.72, 1.96, 0.25, 0.03, sh(o.color, -0.15)); rr(c, -0.88, 0.55, 1.76, 0.2, 0.03, sh(o.color, -0.05));
    for (let i = 0; i < 5; i++) rr(c, -0.78 + i * 0.36, -0.35, 0.2, 0.92, 0.03, o.color);
    rr(c, -0.92, -0.48, 1.84, 0.16, 0.03, sh(o.color, 0.05));
    poly(c, [-0.98, -0.48, 0, -0.98, 0.98, -0.48], sh(o.color, 0.12));
    circ(c, 0, -0.66, 0.1, '#ffd23f');
  },
  palace(c, o) { // Palast mit goldenen Kuppeln
    rr(c, -0.95, -0.1, 1.9, 1.05, 0.05, o.color);
    for (const x of [-0.75, 0.75]) { rr(c, x - 0.18, -0.6, 0.36, 1.55, 0.04, sh(o.color, -0.08)); poly(c, [x - 0.22, -0.6, x, -0.95, x + 0.22, -0.6], '#ffd23f'); }
    c.beginPath(); c.arc(0, -0.1, 0.42, Math.PI, 0); c.closePath(); fs(c, '#ffd23f'); line(c, 0, -0.52, 0, -0.75, 0.05, OUT); circ(c, 0, -0.78, 0.06, '#ffd23f');
    rr(c, -0.16, 0.45, 0.32, 0.5, 0.15, sh(o.color, -0.35));
    for (const x of [-0.5, 0.35]) rr(c, x, 0.1, 0.15, 0.22, 0.07, '#7fd3ff');
  },
  god(c, o) { // Gott mit Bart, Toga und Blitz
    const t = o.anim || 0;
    poly(c, [-0.55, 0.95, -0.45, -0.1, 0.45, -0.1, 0.55, 0.95], '#ffffff'); line(c, -0.45, -0.05, 0.4, 0.9, 0.12, o.color);
    circ(c, 0, -0.45, 0.33, '#f2c9a0');
    c.beginPath(); c.moveTo(-0.3, -0.42); c.quadraticCurveTo(0, 0.2, 0.3, -0.42); c.quadraticCurveTo(0, -0.2, -0.3, -0.42); fs(c, '#f0f0f0');
    eyes(c, -0.12, -0.52, 0.07, 0.3); eyes(c, 0.12, -0.52, 0.07, 0.3);
    poly(c, [-0.3, -0.75, -0.2, -0.95, -0.08, -0.78, 0, -1, 0.08, -0.78, 0.2, -0.95, 0.3, -0.75], '#ffd23f');
    const f = Math.sin(t * 6) > 0 ? 1 : 0.6; c.globalAlpha = f;
    poly(c, [0.6, -0.6, 0.85, -0.6, 0.72, -0.25, 0.92, -0.25, 0.55, 0.25, 0.65, -0.12, 0.48, -0.12], '#fff36a'); c.globalAlpha = 1;
  },
  angel(c, o) { // Engel mit Flügeln und Heiligenschein
    const f = Math.sin((o.anim || 0) * 5) * 0.15;
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 0.15, -0.1); c.quadraticCurveTo(d * (0.95 + f), -0.75, d * 0.95, 0.1); c.quadraticCurveTo(d * 0.6, 0.05, d * 0.15, 0.25); fs(c, '#f4f4ff'); }
    poly(c, [-0.35, 0.95, -0.2, -0.05, 0.2, -0.05, 0.35, 0.95], o.color);
    circ(c, 0, -0.32, 0.26, '#f6d6b8'); eyes(c, -0.09, -0.34, 0.06, 0.2); eyes(c, 0.09, -0.34, 0.06, 0.2);
    c.beginPath(); c.ellipse(0, -0.7, 0.26, 0.08, 0, 0, TAU); const lw = c.lineWidth; c.lineWidth = 0.08; c.strokeStyle = '#ffd23f'; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
  },
  bolt(c, o) { poly(c, [0.1, -1, 0.55, -1, 0.2, -0.2, 0.6, -0.2, -0.3, 1, -0.05, 0.1, -0.45, 0.1], o.color); },
  cloud(c, o) { for (const [x, y, r] of [[-0.5, 0.2, 0.45], [0.05, -0.1, 0.6], [0.55, 0.2, 0.42], [0, 0.35, 0.5]]) circ(c, x, y, r, o.color); circ(c, -0.15, -0.25, 0.18, 'rgba(255,255,255,0.6)', true); },
  harp(c, o) {
    c.beginPath(); c.moveTo(-0.6, 0.9); c.lineTo(-0.6, -0.8); c.quadraticCurveTo(0.2, -1.05, 0.65, -0.3); c.lineTo(-0.6, 0.9); const lw = c.lineWidth; c.lineWidth = 0.18; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.1; c.strokeStyle = o.color; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT;
    for (let i = 0; i < 5; i++) line(c, -0.45 + i * 0.2, -0.75 + i * 0.12, -0.45 + i * 0.2, 0.75 - i * 0.24, 0.025, '#fff6c0');
  },
  // --- Uhrwerk / Schmiede
  gear(c, o) {
    const t = (o.anim || 0) * 0.6, n = 10; c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = t + i / (n * 2) * TAU, r = i % 2 ? 0.78 : 0.98; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); fs(c, o.color); circ(c, 0, 0, 0.5, sh(o.color, -0.15)); circ(c, 0, 0, 0.18, '#2a1b1b');
    for (let i = 0; i < 4; i++) { const a = t + i * Math.PI / 2; circ(c, Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0.07, sh(o.color, 0.2), true); }
  },
  clock(c, o) { // Uhrturm
    rr(c, -0.5, -0.4, 1, 1.35, 0.05, sh(o.color, -0.2)); poly(c, [-0.6, -0.4, 0, -1, 0.6, -0.4], sh(o.color, -0.35));
    circ(c, 0, -0.05, 0.38, '#fff6dc'); const t = o.anim || 0;
    line(c, 0, -0.05, Math.cos(t) * 0.26, -0.05 + Math.sin(t) * 0.26, 0.05, OUT); line(c, 0, -0.05, Math.cos(t / 12) * 0.18, -0.05 + Math.sin(t / 12) * 0.18, 0.07, OUT);
    rr(c, -0.15, 0.55, 0.3, 0.4, 0.12, '#3a2010');
  },
  automaton(c, o) { // Uhrwerk-Roboter
    const b = Math.sin((o.anim || 0) * 4) * 0.04;
    rr(c, -0.45, 0.55, 0.3, 0.4, 0.05, sh(o.color, -0.25)); rr(c, 0.15, 0.55, 0.3, 0.4, 0.05, sh(o.color, -0.25));
    rr(c, -0.6, -0.25 + b, 1.2, 0.85, 0.15, o.color); circ(c, 0, 0.15 + b, 0.2, '#ffd23f'); circ(c, 0, 0.15 + b, 0.08, OUT, true);
    rr(c, -0.4, -0.85 + b, 0.8, 0.58, 0.12, sh(o.color, 0.1)); circ(c, -0.16, -0.58 + b, 0.1, '#7fffe0'); circ(c, 0.16, -0.58 + b, 0.1, '#7fffe0');
    line(c, 0, -0.85 + b, 0, -1.02 + b, 0.05, OUT); circ(c, 0, -1.02 + b, 0.06, '#ff4a3d');
  },
  anvil(c, o) {
    poly(c, [-0.95, -0.3, 0.75, -0.3, 0.95, -0.55, 0.95, -0.1, 0.35, 0.05, 0.25, 0.5, 0.6, 0.6, 0.6, 0.95, -0.6, 0.95, -0.6, 0.6, -0.25, 0.5, -0.35, 0.05, -0.75, 0], o.color);
    circ(c, -0.2, -0.6, 0.12, '#ffb13d', true); circ(c, 0.2, -0.75, 0.08, '#ffd23f', true);
  },
  hourglass(c, o) {
    rr(c, -0.65, -0.98, 1.3, 0.16, 0.04, '#8a5a2a'); rr(c, -0.65, 0.82, 1.3, 0.16, 0.04, '#8a5a2a');
    poly(c, [-0.5, -0.82, 0.5, -0.82, 0.08, 0, 0.5, 0.82, -0.5, 0.82, -0.08, 0], 'rgba(220,240,255,0.8)');
    const k = ((o.anim || 0) * 0.2) % 1; poly(c, [-0.4 * (1 - k), -0.7 + k * 0.6, 0.4 * (1 - k), -0.7 + k * 0.6, 0.06, -0.05, -0.06, -0.05], o.color, true);
    poly(c, [-0.45 * k, 0.8 - k * 0.5, 0.45 * k, 0.8 - k * 0.5, 0.45, 0.8, -0.45, 0.8], o.color, true);
  },
  // --- Drachenhort
  dragon(c, o) {
    const t = o.anim || 0, f = Math.sin(t * 6) * 0.2;
    c.beginPath(); c.moveTo(-0.1, -0.2); c.lineTo(-0.9, -0.9 + f); c.lineTo(-0.7, -0.25); c.lineTo(-1, 0); c.lineTo(-0.3, 0.1); fs(c, sh(o.color, -0.2));
    c.beginPath(); c.moveTo(-0.5, 0.4); c.quadraticCurveTo(-1, 0.6, -0.95, 0.9); c.quadraticCurveTo(-0.7, 0.6, -0.35, 0.65); fs(c, o.color);
    ell(c, -0.1, 0.35, 0.55, 0.45, o.color); ell(c, 0, 0.45, 0.32, 0.3, '#ffe9a0');
    ell(c, 0.5, -0.25, 0.38, 0.3, o.color); poly(c, [0.35, -0.5, 0.25, -0.85, 0.48, -0.55], '#fff6dc'); poly(c, [0.6, -0.52, 0.7, -0.85, 0.75, -0.5], '#fff6dc');
    eyes(c, 0.55, -0.32, 0.09, 0.5); circ(c, 0.84, -0.18, 0.03, OUT, true);
    if (Math.sin(t * 2 + o.seed * 9) > 0.5) poly(c, [0.85, -0.15, 1.15, -0.3, 1.1, 0, 1.2, 0.15], '#ffb13d');
  },
  goldpile(c, o) {
    poly(c, [-0.98, 0.95, -0.6, 0.2, -0.2, -0.3, 0.25, -0.45, 0.65, 0.1, 0.98, 0.95], '#e0a020');
    for (let i = 0; i < 14; i++) { const x = Math.sin(i * 7.3 + o.seed * 5) * 0.75, y = 0.85 - Math.abs(Math.cos(i * 3.1)) * (0.9 - Math.abs(x) * 0.6); ell(c, x, y, 0.15, 0.07, i % 3 ? '#ffd23f' : '#fff09a'); }
    poly(c, [-0.15, -0.55, 0.05, -0.8, 0.25, -0.55, 0.05, -0.4], '#ff4a7a'); circ(c, 0.55, -0.05, 0.1, '#5ad0ff');
  },
  egg(c, o) { ell(c, 0, 0.05, 0.62, 0.88, o.color); for (let i = 0; i < 5; i++) ell(c, -0.3 + (i % 3) * 0.3, -0.45 + i * 0.25, 0.1, 0.07, sh(o.color, -0.25), 0, true); circ(c, -0.22, -0.4, 0.14, 'rgba(255,255,255,0.4)', true); },
  chest(c, o) {
    rr(c, -0.9, -0.1, 1.8, 1.05, 0.08, '#8a4a1a'); c.beginPath(); c.moveTo(-0.9, -0.1); c.quadraticCurveTo(0, -0.95, 0.9, -0.1); c.closePath(); fs(c, '#a05a24');
    rr(c, -0.95, -0.15, 1.9, 0.16, 0.04, o.color); rr(c, -0.12, -0.2, 0.24, 0.4, 0.04, o.color); circ(c, 0, 0.05, 0.05, OUT, true);
    for (let i = 0; i < 3; i++) circ(c, -0.4 + i * 0.4, -0.35, 0.1, '#ffd23f');
  },
  // --- Wald / Garten
  bigtree(c, o) {
    poly(c, [-0.2, 0.95, -0.15, 0.1, 0.15, 0.1, 0.2, 0.95], '#6a3f1f'); line(c, -0.15, 0.95, -0.45, 0.98, 0.08, '#6a3f1f'); line(c, 0.15, 0.95, 0.45, 0.98, 0.08, '#6a3f1f');
    for (const [x, y, r] of [[-0.5, -0.1, 0.42], [0.5, -0.1, 0.42], [0, -0.5, 0.55], [0, 0, 0.45]]) circ(c, x, y, r, o.color);
    for (let i = 0; i < 4; i++) circ(c, -0.35 + i * 0.25, -0.35 + (i % 2) * 0.3, 0.07, '#ff6a8a', true);
  },
  root(c, o) { c.beginPath(); c.moveTo(-0.95, 0.9); c.bezierCurveTo(-0.6, -0.2, -0.1, 0.7, 0.2, -0.3); c.bezierCurveTo(0.35, -0.8, 0.7, -0.6, 0.95, -0.9); const lw = c.lineWidth; c.lineWidth = 0.4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.28; c.strokeStyle = o.color; c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT; circ(c, 0.95, -0.9, 0.16, '#7fe07f'); },
  // --- Wasser / Ursuppe
  fish(c, o) {
    const w = Math.sin((o.anim || 0) * 8) * 0.12;
    poly(c, [-0.55, 0, -0.98, -0.45 + w, -0.98, 0.45 + w], sh(o.color, -0.15));
    ell(c, 0.1, 0, 0.7, 0.45, o.color); poly(c, [-0.1, -0.4, 0.15, -0.75, 0.35, -0.38], sh(o.color, -0.15));
    eyes(c, 0.5, -0.1, 0.12, 0.4); line(c, 0.65, 0.18, 0.75, 0.15, 0.04, OUT);
  },
  whale(c, o) {
    const t = o.anim || 0;
    c.beginPath(); c.moveTo(-0.7, 0.1); c.quadraticCurveTo(-1, -0.2 + Math.sin(t * 2) * 0.1, -1, -0.5); c.lineTo(-0.75, -0.25); c.lineTo(-0.85, 0.2); fs(c, o.color);
    ell(c, 0.1, 0.15, 0.9, 0.55, o.color); ell(c, 0.2, 0.42, 0.65, 0.22, '#e0f4ff');
    eyes(c, 0.6, 0, 0.09, 0.4);
    for (let i = 0; i < 3; i++) circ(c, 0.3 + i * 0.05, -0.55 - i * 0.15 - (t * 0.5 % 0.3), 0.06 + i * 0.02, 'rgba(200,240,255,0.8)', true);
  },
  jelly(c, o) {
    const t = o.anim || 0;
    for (let i = 0; i < 5; i++) { const x = -0.45 + i * 0.22; c.beginPath(); c.moveTo(x, 0.1); c.quadraticCurveTo(x + Math.sin(t * 3 + i) * 0.2, 0.5, x, 0.95); const lw = c.lineWidth; c.lineWidth = 0.07; c.strokeStyle = sh(o.color, -0.2); c.stroke(); c.lineWidth = lw; c.strokeStyle = OUT; }
    c.beginPath(); c.arc(0, 0.1, 0.65, Math.PI, 0); c.quadraticCurveTo(0, 0.3, -0.65, 0.1); fs(c, o.color);
    circ(c, -0.2, -0.25, 0.12, 'rgba(255,255,255,0.6)', true); eyes(c, -0.15, -0.05, 0.07, 0.2); eyes(c, 0.15, -0.05, 0.07, 0.2);
  },
  coral(c, o) {
    const br = (x, y, a, l, d) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; line(c, x, y, x2, y2, 0.16 - d * 0.04, o.color); if (d < 2) { br(x2, y2, a - 0.5, l * 0.7, d + 1); br(x2, y2, a + 0.5, l * 0.7, d + 1); } else circ(c, x2, y2, 0.07, sh(o.color, 0.3), true); };
    br(0, 0.95, -Math.PI / 2, 0.6, 0); rr(c, -0.4, 0.82, 0.8, 0.15, 0.05, '#e0c080');
  },
  cell(c, o) { // Urzelle / Amöbe
    const t = o.anim || 0; c.beginPath();
    for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, r = 0.85 + Math.sin(a * 3 + t * 2 + o.seed * 5) * 0.1; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.globalAlpha = 0.85; fs(c, o.color); c.globalAlpha = 1;
    circ(c, 0.15, -0.1, 0.32, sh(o.color, -0.3)); circ(c, 0.08, -0.18, 0.1, 'rgba(255,255,255,0.5)', true);
    for (let i = 0; i < 4; i++) circ(c, -0.5 + i * 0.2, 0.35 - (i % 2) * 0.3, 0.07, sh(o.color, 0.3), true);
  },
  // --- Neon / Glitch
  server(c, o) {
    rr(c, -0.55, -0.98, 1.1, 1.93, 0.06, '#1a1f2a');
    for (let i = 0; i < 5; i++) { rr(c, -0.45, -0.85 + i * 0.36, 0.9, 0.26, 0.03, '#2a3040'); for (let k = 0; k < 3; k++) circ(c, 0.12 + k * 0.1, -0.72 + i * 0.36, 0.035, Math.floor((o.anim || 0) * 6 + i + k) % 3 ? o.color : '#ff4a7a', true); }
  },
  chip(c, o) {
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) { line(c, -0.45 + i * 0.3, d * 0.6, -0.45 + i * 0.3, d * 0.95, 0.08, '#c0c8d0'); line(c, d * 0.6, -0.45 + i * 0.3, d * 0.95, -0.45 + i * 0.3, 0.08, '#c0c8d0'); }
    rr(c, -0.65, -0.65, 1.3, 1.3, 0.1, '#1a1f2a'); rr(c, -0.35, -0.35, 0.7, 0.7, 0.06, o.color);
  },
  virus(c, o) {
    const t = o.anim || 0;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 0.5; line(c, Math.cos(a) * 0.5, Math.sin(a) * 0.5, Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.08, sh(o.color, -0.2)); circ(c, Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0.08, sh(o.color, 0.2)); }
    circ(c, 0, 0, 0.58, o.color); eyes(c, -0.18, -0.05, 0.12, 0.3); eyes(c, 0.18, -0.05, 0.12, 0.3);
  },
  glitch(c, o) {
    const t = Math.floor((o.anim || 0) * 8);
    for (let i = 0; i < 6; i++) { const off = ((t + i * 3) % 5 - 2) * 0.06; rr(c, -0.9 + off, -0.9 + i * 0.3, 1.8, 0.3, 0, ['#ff00ff', '#00ffff', '#ffff00', o.color][(i + t) % 4]); }
    c.fillStyle = '#000'; c.font = 'bold 0.4px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ERR', 0, 0);
  },
  // --- Schatten / Grab
  ghost(c, o) {
    const t = o.anim || 0, b = Math.sin(t * 3) * 0.06; c.beginPath(); c.moveTo(-0.6, 0.9 + b); c.lineTo(-0.6, -0.2 + b); c.arc(0, -0.2 + b, 0.6, Math.PI, 0); c.lineTo(0.6, 0.9 + b);
    for (let i = 0; i < 4; i++) c.lineTo(0.6 - (i + 0.5) * 0.3, (i % 2 ? 0.9 : 0.7) + b); c.closePath(); c.globalAlpha = 0.85; fs(c, o.color); c.globalAlpha = 1;
    ell(c, -0.2, -0.25 + b, 0.11, 0.16, '#120a20'); ell(c, 0.2, -0.25 + b, 0.11, 0.16, '#120a20'); ell(c, 0, 0.15 + b, 0.12, 0.1, '#120a20');
  },
  tomb(c, o) { c.beginPath(); c.moveTo(-0.6, 0.95); c.lineTo(-0.6, -0.4); c.arc(0, -0.4, 0.6, Math.PI, 0); c.lineTo(0.6, 0.95); c.closePath(); fs(c, o.color); line(c, 0, -0.65, 0, -0.05, 0.08, sh(o.color, -0.35)); line(c, -0.2, -0.45, 0.2, -0.45, 0.08, sh(o.color, -0.35)); rr(c, -0.8, 0.82, 1.6, 0.15, 0.04, '#3a2a2a'); },
  // --- Eis
  iceberg(c, o) { poly(c, [-0.95, 0.95, -0.7, -0.1, -0.35, -0.3, -0.1, -0.95, 0.25, -0.4, 0.55, -0.55, 0.95, 0.95], o.color); poly(c, [-0.1, -0.95, 0.05, -0.1, -0.35, -0.3], 'rgba(255,255,255,0.6)', true); line(c, -0.95, 0.6, 0.95, 0.6, 0.05, '#7fd3ff'); },
  snowman(c, o) { circ(c, 0, 0.5, 0.48, '#ffffff'); circ(c, 0, -0.15, 0.36, '#ffffff'); circ(c, 0, -0.65, 0.27, '#ffffff'); eyes(c, -0.09, -0.7, 0.05, 0.2); eyes(c, 0.09, -0.7, 0.05, 0.2); poly(c, [0, -0.62, 0.3, -0.58, 0, -0.55], '#ff8a2a'); rr(c, -0.3, -1, 0.6, 0.12, 0.03, o.color); rr(c, -0.2, -1.2, 0.4, 0.25, 0.04, o.color); },
  // --- Lava
  lavablob(c, o) {
    const t = o.anim || 0; c.beginPath();
    for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI, r = 0.85 + Math.sin(a * 4 + t * 3) * 0.08; c.lineTo(Math.cos(a) * r, 0.3 + Math.sin(a) * r * 1.1); }
    c.lineTo(0.95, 0.95); c.lineTo(-0.95, 0.95); c.closePath(); fs(c, o.color);
    circ(c, -0.3, -0.3, 0.15, '#fff36a', true); eyes(c, -0.2, -0.1, 0.12, 0.3); eyes(c, 0.2, -0.1, 0.12, 0.3);
    rr(c, -0.25, 0.25, 0.5, 0.14, 0.07, '#5a1000');
  },
  spire(c, o) { poly(c, [-0.55, 0.95, -0.3, -0.2, -0.1, -0.98, 0.15, -0.35, 0.35, -0.6, 0.55, 0.95], o.color); line(c, -0.2, 0.5, 0.05, -0.3, 0.06, '#ff6a1f'); line(c, 0.1, 0.8, 0.3, 0.1, 0.05, '#ffb13d'); },
  // --- Wüste / Spiegel / Traum
  pyramid(c, o) { poly(c, [-0.98, 0.95, 0, -0.95, 0.98, 0.95], o.color); poly(c, [0, -0.95, 0.98, 0.95, 0.2, 0.95], sh(o.color, -0.2)); for (let i = 1; i < 5; i++) line(c, -0.98 + i * 0.2, 0.95 - i * 0.38, 0.98 - i * 0.2 - 0.03, 0.95 - i * 0.38, 0.03, sh(o.color, -0.3)); poly(c, [-0.08, -0.95, 0, -1.1, 0.08, -0.95], '#ffd23f'); },
  obelisk(c, o) { poly(c, [-0.3, 0.95, -0.22, -0.7, 0, -1, 0.22, -0.7, 0.3, 0.95], o.color); rr(c, -0.5, 0.8, 1, 0.17, 0.03, sh(o.color, -0.2)); for (let i = 0; i < 3; i++) circ(c, 0, -0.3 + i * 0.35, 0.06, '#ffd23f', true); },
  mirror(c, o) { ell(c, 0, -0.05, 0.62, 0.9, '#d8b860'); ell(c, 0, -0.05, 0.5, 0.78, o.color); poly(c, [-0.3, -0.5, -0.1, -0.7, 0.2, 0.2, 0, 0.4], 'rgba(255,255,255,0.55)', true); rr(c, -0.3, 0.8, 0.6, 0.17, 0.04, '#d8b860'); },
  moon(c, o) { c.beginPath(); c.arc(0, 0, 0.9, 0.6, TAU - 0.6); c.arc(0.45, 0, 0.62, TAU - 1.05, 1.05, true); c.closePath(); fs(c, o.color); eyes(c, -0.45, -0.15, 0.1, -0.3); line(c, -0.55, 0.3, -0.35, 0.32, 0.05, OUT); },
  sheep(c, o) { for (const [x, y] of [[-0.4, 0.05], [0, -0.15], [0.4, 0.05], [-0.2, 0.3], [0.2, 0.3]]) circ(c, x, y, 0.35, o.color); rr(c, -0.4, 0.5, 0.14, 0.45, 0.05, '#3a2a2a'); rr(c, 0.26, 0.5, 0.14, 0.45, 0.05, '#3a2a2a'); ell(c, 0.65, -0.15, 0.25, 0.2, '#3a2a2a'); eyes(c, 0.72, -0.2, 0.06, 0.3); },

  // ================= Easter-Egg-Karte „420“ =================
  leaf(c, o) { // Hanfblatt (7 Finger)
    line(c, 0, 0.2, 0, 0.98, 0.08, sh(o.color, -0.3));
    for (const [a, l, w] of [[-90, 1, 0.2], [-60, 0.9, 0.18], [-120, 0.9, 0.18], [-30, 0.7, 0.15], [-150, 0.7, 0.15], [5, 0.45, 0.11], [175, 0.45, 0.11]]) {
      const r = a * Math.PI / 180, tx = Math.cos(r) * l, ty = 0.25 + Math.sin(r) * l, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
      c.beginPath(); c.moveTo(0, 0.25); c.quadraticCurveTo(tx * 0.5 + nx, 0.25 + (ty - 0.25) * 0.5 + ny, tx, ty); c.quadraticCurveTo(tx * 0.5 - nx, 0.25 + (ty - 0.25) * 0.5 - ny, 0, 0.25); fs(c, o.color);
    }
  },
  weed(c, o) { // Hanfpflanze im Topf
    rr(c, -0.42, 0.45, 0.84, 0.5, 0.08, '#c96f3a'); rr(c, -0.5, 0.4, 1, 0.14, 0.05, '#e08a4a');
    line(c, 0, 0.45, 0, -0.6, 0.07, '#3c7a2a');
    const sway = Math.sin((o.anim || 0) * 1.5 + o.seed * 9) * 0.06;
    for (const [y, s2, d] of [[0.2, 0.62, -1], [0.1, 0.62, 1], [-0.25, 0.55, -1], [-0.35, 0.55, 1], [-0.55, 0.5, 0]]) {
      c.save(); c.translate(d * 0.22 + sway, y); c.rotate(d * 0.5 + sway); c.scale(s2, s2); SPRITES.leaf(c, o); c.restore();
    }
  },
  lighter(c, o) {
    rr(c, -0.35, -0.3, 0.7, 1.25, 0.12, o.color); rr(c, -0.3, -0.55, 0.6, 0.28, 0.05, '#c0c8d0'); circ(c, 0.12, -0.42, 0.1, '#9aa0aa');
    const f = 0.9 + Math.sin((o.anim || 0) * 14) * 0.1; c.fillStyle = '#ffb13d'; c.beginPath(); c.ellipse(-0.1, -0.85 * f, 0.12, 0.25 * f, 0, 0, TAU); c.fill(); c.fillStyle = '#fff36a'; c.beginPath(); c.ellipse(-0.1, -0.8, 0.06, 0.14, 0, 0, TAU); c.fill();
  },
  lavalamp(c, o) {
    poly(c, [-0.35, 0.95, -0.2, 0.55, 0.2, 0.55, 0.35, 0.95], '#3a3a4a'); poly(c, [-0.2, -0.75, 0.2, -0.75, 0.32, 0.55, -0.32, 0.55], 'rgba(255,240,200,0.6)');
    poly(c, [-0.16, -0.75, 0.16, -0.75, 0.1, -0.98, -0.1, -0.98], '#3a3a4a');
    const t = o.anim || 0; for (let i = 0; i < 3; i++) circ(c, Math.sin(t + i * 2) * 0.08, 0.35 - ((t * 0.25 + i * 0.33) % 1) * 1, 0.1 + (i % 2) * 0.05, o.color, true);
  },
  chips(c, o) { // Snack-Tüte
    poly(c, [-0.6, -0.8, 0.6, -0.8, 0.7, 0.95, -0.7, 0.95], o.color); poly(c, [-0.62, -0.8, 0.62, -0.8, 0.55, -0.95, -0.55, -0.95], sh(o.color, -0.2));
    circ(c, 0, 0.05, 0.38, '#ffd23f'); for (let i = 0; i < 3; i++) ell(c, -0.15 + i * 0.15, 0.05 + (i % 2) * 0.1, 0.14, 0.09, '#e0a020', i);
    c.fillStyle = '#fff'; c.font = 'bold 0.22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SNACK', 0, -0.5);
  },
  pizza(c, o) { poly(c, [-0.85, -0.6, 0.85, -0.6, 0, 0.95], '#f0c060'); rr(c, -0.9, -0.75, 1.8, 0.22, 0.1, '#c98a3a'); for (const [x, y] of [[-0.35, -0.3], [0.3, -0.25], [0, 0.2], [-0.1, -0.4]]) circ(c, x, y, 0.13, '#d0342a'); },
  beanbag(c, o) { c.beginPath(); c.moveTo(-0.95, 0.9); c.quadraticCurveTo(-1, -0.2, -0.3, -0.6); c.quadraticCurveTo(0.4, -0.9, 0.85, -0.2); c.quadraticCurveTo(1.05, 0.5, 0.9, 0.9); c.closePath(); fs(c, o.color); ell(c, 0.05, 0.1, 0.5, 0.3, sh(o.color, -0.15), 0, true); circ(c, -0.4, -0.35, 0.12, 'rgba(255,255,255,0.25)', true); },
  discoball(c, o) { line(c, 0, -1, 0, -0.75, 0.04, '#aab'); circ(c, 0, 0, 0.75, '#c8d0e0'); const t = o.anim || 0;
    for (let i = -3; i <= 3; i++) for (let k = -3; k <= 3; k++) { if (i * i + k * k > 9) continue; c.fillStyle = (i + k + Math.floor(t * 6)) % 3 ? 'rgba(255,255,255,0.25)' : ['#ff4ab0', '#7fd3ff', '#ffd23f'][(i * 7 + k) & 1 ? 0 : 1]; c.fillRect(i * 0.2 - 0.09, k * 0.2 - 0.09, 0.18, 0.18); } },
  greenhouse(c, o) { poly(c, [-0.95, 0.95, -0.95, -0.2, 0, -0.85, 0.95, -0.2, 0.95, 0.95], 'rgba(200,255,220,0.55)'); for (let i = -2; i <= 2; i++) line(c, i * 0.38, i === 0 ? -0.85 : -0.2 - (2 - Math.abs(i)) * 0.3, i * 0.38, 0.95, 0.04, '#e0f0e8'); line(c, -0.95, 0.3, 0.95, 0.3, 0.04, '#e0f0e8'); for (let i = 0; i < 4; i++) circ(c, -0.6 + i * 0.4, 0.6, 0.18, o.color); },
  smokering(c, o) { const t = o.anim || 0, s2 = 1 + Math.sin(t * 2) * 0.06; c.beginPath(); c.ellipse(0, 0, 0.85 * s2, 0.55 * s2, 0, 0, TAU); c.ellipse(0, 0, 0.45 * s2, 0.25 * s2, 0, 0, TAU, true); c.globalAlpha = 0.8; fs(c, o.color); c.globalAlpha = 1; },

  sugar(c, o) { // Zuckerwürfel-Stapel
    for (const [x, y] of [[-0.45, 0.45], [0.45, 0.45], [0, -0.35]]) { poly(c, [x - 0.4, y - 0.2, x, y - 0.45, x + 0.4, y - 0.2, x, y + 0.05], '#ffffff'); poly(c, [x - 0.4, y - 0.2, x, y + 0.05, x, y + 0.5, x - 0.4, y + 0.25], '#e6e9f0'); poly(c, [x + 0.4, y - 0.2, x, y + 0.05, x, y + 0.5, x + 0.4, y + 0.25], '#cfd4de'); }
    for (let i = 0; i < 6; i++) circ(c, -0.7 + i * 0.28, 0.9, 0.04, '#ffffff', true);
  },
  phone(c, o) { // Handy
    rr(c, -0.5, -0.95, 1, 1.9, 0.16, '#1a1c22'); rr(c, -0.42, -0.8, 0.84, 1.55, 0.06, o.color);
    const t = o.anim || 0; for (let i = 0; i < 3; i++) rr(c, -0.32, -0.62 + i * 0.32, 0.64 - (i % 2) * 0.2, 0.18, 0.08, i === Math.floor(t * 1.5) % 3 ? '#ffffff' : 'rgba(255,255,255,0.55)', true);
    circ(c, 0, 0.86, 0.05, '#555', true); circ(c, 0.3, -0.9, 0.11, '#ff3b2f'); c.fillStyle = '#fff'; c.font = 'bold 0.14px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('3', 0.3, -0.9);
  },
  growtent(c, o) { // Grow-Zelt mit lila Licht
    poly(c, [-0.9, 0.95, -0.9, -0.55, -0.6, -0.9, 0.6, -0.9, 0.9, -0.55, 0.9, 0.95], '#2a2a30');
    rr(c, -0.7, -0.5, 1.4, 1.35, 0.06, 'rgba(200,120,255,0.55)'); line(c, -0.6, -0.55, 0.6, -0.55, 0.06, '#e0b0ff');
    for (let i = 0; i < 3; i++) { c.save(); c.translate(-0.42 + i * 0.42, 0.45); c.scale(0.32, 0.32); SPRITES.leaf(c, { ...o, color: '#4fa84a' }); c.restore(); }
    line(c, 0, -0.9, 0, 0.95, 0.03, '#9a9aa6');
  },
};
