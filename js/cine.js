'use strict';
/* =========================================================
   CINE: productora, producción de películas, taquilla y premios
   ========================================================= */
const PRESUPUESTOS = [
  ['micro', 'Micro (independiente)', 200000],
  ['bajo', 'Bajo', 2000000],
  ['medio', 'Medio', 20000000],
  ['alto', 'Alto', 80000000],
  ['super', 'Superproducción', 200000000],
];
const GUIONES = [
  ['propio', '✍️ Escribirlo tú', 0, null],
  ['novato', '📄 Guionista novato', 50000, [35, 60]],
  ['bueno', '📑 Guionista reconocido', 500000, [55, 82]],
  ['estrella', '🏆 Guionista estrella', 3000000, [70, 96]],
];

const Cine = {
  nuevasTendencias() {
    const t = S.cine.tendencias || {};
    for (const g of GENEROS_CINE) t[g] = clamp((t[g] ?? 1) * R.float(0.75, 1.3), 0.5, 1.8);
    S.cine.tendencias = t;
  },
  tendencia(g) { const v = S.cine.tendencias[g] ?? 1; return v > 1.25 ? '🔥 en tendencia' : v < 0.8 ? '❄️ pasado de moda' : '➖ estable'; },

  panel() {
    Panel.abrir('Dirección de cine', () => {
      const p = S.p, d = p.esp.director;
      if (!d) {
        const ok = tieneTitulo('universidad', 'Cine y Audiovisuales') || p.st.fama >= 40 || p.dinero >= 500000;
        return [
          { info: 'Puedes fundar una productora si estudiaste <b>Cine y Audiovisuales</b>, si tienes <b>fama ≥ 40</b> o si tienes al menos <b>$500.000</b> para financiar cine independiente.' },
          { ic: '🎬', t: 'Fundar tu productora', dis: ok ? false : 'No cumples ninguno de los requisitos.', fn: () => this.fundar() },
        ];
      }
      const its = [
        { kv: [['Productora', d.productora], ...(d.legado ? [['Fundada por', `${d.legado.fundador} (${d.legado.peliculas} película${d.legado.peliculas === 1 ? "" : "s"}${d.legado.estatuillas ? ' · ' + '🏆'.repeat(d.legado.estatuillas) : ''})`]] : []), ['Habilidad como director', d.habilidad + '%'], ['Reputación en la industria', d.reputacion + '%'], ['Estatuillas Doradas', '🏆'.repeat(d.estatuillas) || '0']] },
        { barra: ['🎬 Habilidad como director', d.habilidad, 'var(--fama)'] }, { barra: ['🏛️ Reputación en la industria (financiamiento de estudios)', d.reputacion, 'var(--info)'] },
        { ic: '🎥', t: 'Producir una película', s: `${usosRestantes('pelicula', d.reputacion >= 60 ? 2 : 1)} restantes este año`, fn: () => this.producir() },
        { ic: '📚', t: 'Estudiar a los grandes maestros', s: '+habilidad', fn: () => { if (!usar('maestros', 1)) return; d.habilidad = clamp(d.habilidad + R.int(2, 5)); mod({ inteligencia: 1 }); log('Estudiaste filmografías clásicas para mejorar como director.'); } },
        { ic: '📈', t: 'Ver tendencias del público', fn: () => aviso('Tendencias del año', GENEROS_CINE.map(g => `<p>${g}: <b>${this.tendencia(g)}</b></p>`).join(''), '📊') },
      ];
      if (d.peliculas.length) {
        its.push({ sec: 'Filmografía' });
        for (const f of [...d.peliculas].reverse()) its.push({ ic: f.premio ? '🏆' : '🎞️', t: `${f.titulo} (${f.anio})`, s: `${f.genero} · ⭐ ${f.nota.toFixed(1)} · taquilla ${fmt$(f.taquilla)} · presupuesto ${fmt$(f.presupuesto)}` });
      }
      return its;
    });
  },
  fundar() {
    const p = S.p;
    Modal.mostrar({
      ic: '🎬', titulo: 'Nueva productora', texto: '<p>¿Cómo se llamará tu productora?</p>',
      html: `<input type="text" id="m-txt" maxlength="30" value="${esc(p.apellido)} Films">`,
      opciones: [{ t: 'Fundar', cls: 'ok', fn: () => {
        const n = ($('#m-txt').value || '').trim() || `${p.apellido} Films`;
        p.esp.director = { productora: n, habilidad: tieneTitulo('universidad', 'Cine y Audiovisuales') ? 30 : 12, reputacion: 5, peliculas: [], estatuillas: 0 };
        log(`🎬 Fundaste tu productora: <b>${esc(n)}</b>.`, 'bueno');
      } }, { t: 'Cancelar' }],
    });
  },

  /* Asistente de producción en varios pasos */
  producir() {
    const p = S.p, d = p.esp.director;
    if (!usar('pelicula', d.reputacion >= 60 ? 2 : 1)) return;
    const pel = { titulo: `${R.pick(PALABRAS_TITULO.a)} ${R.pick(PALABRAS_TITULO.b)}` };
    Modal.mostrar({
      ic: '🎞️', titulo: 'Paso 1: Título y género',
      html: `<input type="text" id="m-txt" maxlength="40" value="${esc(pel.titulo)}">`,
      texto: '<p>Elige el género. Las tendencias del público cambian cada año.</p>',
      opciones: GENEROS_CINE.map(g => ({ t: `${g} — ${this.tendencia(g)}`, fn: () => { pel.titulo = ($('#m-txt').value || '').trim() || pel.titulo; pel.genero = g; this.pasoGuion(pel); } })),
    });
  },
  pasoGuion(pel) {
    const p = S.p;
    Modal.mostrar({
      ic: '📝', titulo: 'Paso 2: Guion', texto: `<p><b>${esc(pel.titulo)}</b> (${pel.genero}). ¿Quién escribe el guion?</p>`,
      opciones: GUIONES.map(([id, t, costo, rango]) => ({ t: `${t}${costo ? ' — ' + fmt$(costo) : ''}`, fn: () => {
        pel.costoGuion = costo;
        pel.guion = rango ? R.int(rango[0], rango[1]) : clamp(Math.round(p.st.inteligencia * 0.55 + p.esp.director.habilidad * 0.35 + R.int(-15, 15)));
        this.pasoPresupuesto(pel);
      } })),
    });
  },
  pasoPresupuesto(pel) {
    const p = S.p, d = p.esp.director;
    const estudioMax = d.reputacion >= 80 ? 4 : d.reputacion >= 55 ? 3 : d.reputacion >= 30 ? 2 : d.reputacion >= 12 ? 1 : 0;
    Modal.mostrar({
      ic: '💰', titulo: 'Paso 3: Presupuesto',
      texto: `<p>Con tu reputación (${d.reputacion}%), un estudio te financia hasta <b>${PRESUPUESTOS[estudioMax][1]}</b> (se queda con el 75% de las ganancias). También puedes financiarla tú.</p>`,
      opciones: PRESUPUESTOS.flatMap(([id, n, monto], i) => {
        const ops = [];
        if (i <= estudioMax) ops.push({ t: `🏢 ${n} — ${fmt$(monto)} (estudio)`, fn: () => { pel.presupuesto = monto; pel.estudio = true; this.pasoElenco(pel); } });
        ops.push({ t: `💵 ${n} — ${fmt$(monto + pel.costoGuion)} (tu dinero)`, dis: p.dinero < monto + pel.costoGuion, fn: () => { pel.presupuesto = monto; pel.estudio = false; this.pasoElenco(pel); } });
        return ops;
      }),
    });
  },
  pasoElenco(pel) {
    const p = S.p;
    const actores = [0, 1, 2].map(i => {
      const fama = clamp(R.int(10, 50) + i * 22 + (pel.presupuesto > 2e7 ? 15 : 0));
      const talento = clamp(R.int(35, 95));
      const costo = Math.round(Math.min(pel.presupuesto * 0.35, (fama ** 2) * 150 + talento * 1000));
      const g = R.chance(0.5) ? 'M' : 'F';
      return { nombre: `${nombreAleatorio(g, 'Estados Unidos')} ${R.pick(APELLIDOS.concat(APELLIDOS_EN))}`, fama, talento, costo };
    });
    const ops = actores.map(a => ({ t: `⭐ ${a.nombre} — fama ${a.fama}, talento ${a.talento} · ${fmt$(a.costo)}`, fn: () => { pel.actor = a; this.pasoMarketing(pel); } }));
    if (p.esp.actor) ops.push({ t: `🎭 Protagonizarla tú (fama ${p.st.fama})`, fn: () => { pel.actor = { nombre: `${p.nombre} ${p.apellido}`, fama: p.st.fama, talento: 40 + p.esp.actor.nivel * 12, costo: 0, yo: true }; this.pasoMarketing(pel); } });
    Modal.mostrar({ ic: '🎭', titulo: 'Paso 4: Protagonista', texto: '<p>La fama vende entradas; el talento mejora la crítica.</p>', opciones: ops });
  },
  pasoMarketing(pel) {
    Modal.mostrar({
      ic: '📣', titulo: 'Paso 5: Marketing', texto: '<p>¿Cuánto inviertes en promoción?</p>',
      opciones: [['Mínimo', 0.05], ['Normal', 0.25], ['Agresivo', 0.6]].map(([n, f]) => ({ t: `${n} — ${fmt$(pel.presupuesto * f)}`, fn: () => { pel.marketing = f; this.estrenar(pel); } })),
    });
  },
  estrenar(pel, listo) {
    if (!listo) return Efectos.suspenso('🍿 Se apagan las luces del estreno…', () => this.estrenar(pel, true), 1800, '🎬');
    const p = S.p, d = p.esp.director;
    const costoTotal = pel.presupuesto + pel.costoGuion + pel.actor.costo + pel.presupuesto * pel.marketing;
    if (!pel.estudio) {
      if (p.dinero < costoTotal) { log('No tenías suficiente dinero para terminar la película y el rodaje se canceló.', 'malo'); p.dinero -= Math.min(p.dinero, pel.presupuesto * 0.5); return aviso('Rodaje cancelado', '<p>Te quedaste sin fondos a mitad del rodaje.</p>', '💸'); }
      p.dinero -= costoTotal;
    }
    const tend = S.cine.tendencias[pel.genero] ?? 1;
    const calidad = clamp(pel.guion * 0.42 + pel.actor.talento * 0.2 + d.habilidad * 0.33 + (Rasgos.tiene('artista') ? 6 : 0) + R.int(-12, 12) + (pel.presupuesto >= 2e7 ? 4 : 0));
    const nota = clamp(calidad / 10 + R.float(-0.4, 0.4), 1, 10);
    let mult = Math.pow(0.25 + calidad / 48, 2.2) * tend * (0.7 + pel.marketing) * (0.65 + pel.actor.fama / 110) * R.float(0.55, 1.5);
    if (pel.genero === 'Terror' || pel.genero === 'Documental') mult *= pel.presupuesto <= 2e6 ? 1.6 : 0.85;
    if (pel.genero === 'Animación' && pel.presupuesto >= 8e7) mult *= 1.25;
    if (R.chance(0.04)) mult *= 4; // fenómeno inesperado
    const taquilla = Math.round(pel.presupuesto * mult * 1.6);
    const ganancia = taquilla * 0.5 - costoTotal;
    let pago;
    if (pel.estudio) pago = Math.round(pel.presupuesto * 0.04 + Math.max(0, ganancia) * 0.25);
    else pago = Math.round(taquilla * 0.5);
    p.dinero += pago;
    p.cont.peliculas++;
    d.habilidad = clamp(d.habilidad + R.int(3, 7));
    d.reputacion = clamp(d.reputacion + Math.round((nota - 5) * 3 + (ganancia > 0 ? 6 : -6)));
    mod({ fama: Math.round(clamp(Math.log10(Math.max(taquilla, 1e5)) * 3 - 15 + nota, 0, 20)), felicidad: ganancia > 0 ? 8 : -6 });
    if (pel.actor.yo) { p.esp.actor.prestigio += 3; mod({ fama: 4 }); }
    const f = { titulo: pel.titulo, genero: pel.genero, nota, taquilla, presupuesto: pel.presupuesto, anio: S.anio, premio: false };
    d.peliculas.push(f);
    const veredicto = nota >= 8.5 ? 'una obra maestra' : nota >= 7 ? 'muy buena' : nota >= 5 ? 'aceptable' : nota >= 3 ? 'floja' : 'un desastre';
    log(`🎬 Estrenaste <b>${esc(pel.titulo)}</b> (${pel.genero}). La crítica la calificó como ${veredicto} (⭐ ${nota.toFixed(1)}). Taquilla: ${fmt$(taquilla)}.`, ganancia > 0 ? 'bueno' : 'malo');
    aviso('¡Estreno!', `<p><b>${esc(pel.titulo)}</b></p><p>⭐ Crítica: <b>${nota.toFixed(1)}/10</b> (${veredicto})</p><p>🎟️ Taquilla mundial: <b>${fmt$(taquilla)}</b></p><p>💰 Costo total: ${fmt$(costoTotal)}</p><p>${ganancia > 0 ? '📈' : '📉'} Resultado: ${fmt$(ganancia)}</p><p>Tu parte: <b>${fmt$(pago)}</b>${pel.estudio ? '' : ' (ingresos de taquilla)'}</p>`, nota >= 7 ? '🍿' : '🍅');
  },

  /* Temporada de premios */
  anual() {
    const p = S.p, d = p.esp.director;
    this.nuevasTendencias();
    if (!d) return;
    const delAnio = d.peliculas.filter(f => !f.evaluada);
    for (const f of delAnio) {
      f.evaluada = true;
      if (f.nota >= 8.2 && R.chance(0.75)) {
        log(`🏆 <b>${esc(f.titulo)}</b> fue nominada a la Estatuilla Dorada a Mejor Película.`, 'raro');
        if (R.chance(clamp((f.nota - 7.9) * 0.45, 0.05, 0.85))) {
          f.premio = true; d.estatuillas++; d.reputacion = clamp(d.reputacion + 20);
          mod({ fama: 20, felicidad: 20 });
          log(`🏆🏆 ¡<b>${esc(f.titulo)}</b> GANÓ la Estatuilla Dorada a Mejor Película!`, 'raro');
          Efectos.celebrar('🏆', '¡Estatuilla Dorada!', `<p><b>${esc(f.titulo)}</b> ganó Mejor Película. Subes al escenario temblando…</p>`);
          Noticias.emitir(`«${esc(f.titulo)}», de ${p.nombre} ${p.apellido}, gana la Estatuilla Dorada a Mejor Película.`);
          Estado.darLogro('estatuilla');
        } else log('No ganó, pero la nominación aumentó tu prestigio.', 'gris');
      }
    }
  },
};
