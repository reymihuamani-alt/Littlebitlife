'use strict';
/* =========================================================
   BARRAS DE PROGRESO: riqueza y avance hacia el siguiente
   nivel en cada carrera y sistema.
   ========================================================= */
const NIVELES_RIQUEZA = [
  ['🪙', 'Pobre', 0], ['🏠', 'Clase media baja', 10000], ['🏡', 'Clase media', 60000], ['🚗', 'Acomodado', 300000],
  ['💵', 'Millonario', 1e6, true], ['💼', 'Muy rico', 1e7, true], ['💎', 'Multimillonario', 1e8, true], ['👑', 'Magnate', 1e9, true],
];
const Barras = {
  /* Los primeros tramos dependen del costo de vida del país; los millones son absolutos */
  umbral(n) { const x = NIVELES_RIQUEZA[n]; return x[3] ? x[2] : x[2] * eco(); },
  riqueza() {
    const pt = patrimonio();
    if (pt < 0) return { ic: '😟', nombre: 'Endeudado', pct: 0, sig: 'Pobre', faltan: -pt };
    let n = 0;
    while (n < NIVELES_RIQUEZA.length - 1 && pt >= this.umbral(n + 1)) n++;
    const [ic, nombre] = NIVELES_RIQUEZA[n];
    if (n === NIVELES_RIQUEZA.length - 1) return { ic, nombre, pct: 100, sig: null };
    const a = Math.max(1, this.umbral(n)), b = this.umbral(n + 1);
    const pct = clamp(Math.round(n === 0 ? pt / b * 100 : Math.log(Math.max(pt, a) / a) / Math.log(b / a) * 100));
    return { ic, nombre, pct, sig: NIVELES_RIQUEZA[n + 1][1], faltan: b - pt };
  },
  itemRiqueza() {
    const r = this.riqueza();
    return { barra: [`${r.ic} Riqueza: ${r.nombre}${r.sig ? ` → ${r.sig} (faltan ${fmt$(r.faltan)})` : ' (la cima)'}`, r.pct, 'linear-gradient(90deg,#16a34a,#eab308)'] };
  },
  /* Barra genérica "hacia el siguiente nivel" */
  prog(nombre, actual, meta, color = 'var(--pri)', base = 0) {
    if (meta === undefined || meta === null) return null;
    const pct = meta > base ? (actual - base) / (meta - base) * 100 : 100;
    return { barra: [`${nombre} (${fmtNum(Math.max(0, Math.round(actual)))} / ${fmtNum(Math.round(meta))})`, clamp(pct), color] };
  },
  siguienteHito(x, hitos) { return hitos.find(h => h > x); },
};
