'use strict';
/* Utilidades generales */
const R = {
  int: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  float: (a, b) => Math.random() * (b - a) + a,
  chance: p => Math.random() < p,
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  normal: (m = 0, sd = 1) => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
  peso: lista => { const t = lista.reduce((s, x) => s + x[0], 0); let r = Math.random() * t; for (const [w, v] of lista) { if ((r -= w) <= 0) return v; } return lista[lista.length - 1][1]; },
};
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 10);

function miles(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function fmt$(n) {
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (n >= 1e12) s = (n / 1e12).toFixed(2).replace('.', ',') + ' billones';
  else if (n >= 1e9) s = (n / 1e9).toFixed(2).replace('.', ',') + ' mil M';
  else if (n >= 1e6) s = (n / 1e6).toFixed(2).replace('.', ',') + ' M';
  else s = miles(n);
  return (neg ? '-' : '') + '$' + s;
}
function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' mil M';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + ' mil';
  return miles(n);
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/* Concordancia de género: g('o','a') según el jugador o una persona */
function gx(persona, m, f) { return (persona && persona.genero === 'F') ? f : m; }
