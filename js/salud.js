'use strict';
/* =========================================================
   SALUD: envejecimiento, enfermedades, estrés, adicciones,
   médicos (público / privado / alternativo), estética
   ========================================================= */
const Salud = {
  contraer(nombre) {
    const p = S.p;
    if (p.enf.some(e => e.n === nombre)) return false;
    p.enf.push({ n: nombre, anios: 0 });
    return true;
  },
  anual() {
    const p = S.p, st = p.st, e = p.edad;
    // Envejecimiento: la salud tiende a un nivel que baja con la edad
    const meta = 92 - Math.max(0, e - 30) * 0.6 - Math.max(0, e - 65) * 1.2;
    mod({ salud: Math.round((meta - st.salud) * 0.12) });
    if (e > 35) mod({ apariencia: -R.int(0, e > 60 ? 2 : 1) });
    if (e > 72) mod({ inteligencia: -R.int(0, 2) });
    // Estrés y ánimo
    if (st.estres > 75) { mod({ salud: -3, felicidad: -4 }); }
    mod({ estres: -4 });
    mod({ felicidad: Math.round((58 - st.felicidad) * 0.1) });
    // Adicciones
    const a = p.adic;
    if (a.alcohol > 50) { mod({ salud: -4, felicidad: -2 }); if (R.chance(0.15)) log('🍺 Tu consumo de alcohol está afectando tu vida.', 'malo'); }
    if (a.tabaco > 30) mod({ salud: -3, apariencia: -1 });
    if (a.apuestas > 50 && p.dinero > 0) { const perd = Math.round(p.dinero * R.float(0.05, 0.2)); p.dinero -= perd; log(`🎰 Tu adicción al juego te costó ${fmt$(perd)} este año.`, 'malo'); }
    for (const k in a) a[k] = clamp(a[k] - 3);
    // Nuevas enfermedades
    let prob = 0.045 + (Rasgos.tiene('fragil') ? 0.06 : 0) + (e > 45 ? 0.04 : 0) + (e > 65 ? 0.07 : 0) + (st.salud < 40 ? 0.1 : 0) + (a.tabaco > 30 ? 0.06 : 0);
    if (st.estres > 70 && R.chance(0.22)) this.contraer(R.pick(['Ansiedad', 'Insomnio', 'Depresión'])) && log('😰 El estrés te está pasando factura: te diagnosticaron un problema de salud mental.', 'malo');
    if (st.felicidad < 20 && R.chance(0.25)) this.contraer('Depresión') && log('🌧️ Te diagnosticaron depresión.', 'malo');
    if (R.chance(prob)) {
      const pool = [[10, 'Gripe fuerte'], [3, 'Neumonía'], [3, 'Migraña crónica']];
      if (e > 35) pool.push([6, 'Hipertensión'], [4, 'Diabetes tipo 2']);
      if (e > 40) pool.push([e > 60 ? 5 : 2 + (a.tabaco > 30 ? 4 : 0), 'Cáncer']);
      if (e > 55) pool.push([3, 'Insuficiencia cardíaca']);
      if (e > 70) pool.push([3, 'Alzhéimer']);
      const n = R.peso(pool);
      if (this.contraer(n)) log(`${ENFERMEDADES[n].ic} Te diagnosticaron <b>${n}</b>.`, 'malo');
    }
    // Progresión
    for (const en of [...p.enf]) {
      const d = ENFERMEDADES[en.n]; en.anios++;
      mod({ salud: -Math.round(d.grav * R.float(0.5, 1.2)), felicidad: d.fel ? Math.round(d.fel / 2) : -2, inteligencia: d.intel ? Math.round(d.intel / 3) : 0 });
      const autoCura = { 'Gripe fuerte': 0.75, 'Neumonía': 0.55, 'Insomnio': 0.4, 'Lesión de rodilla': 0.5, 'Ansiedad': 0.15, 'Depresión': 0.12, 'Migraña crónica': 0.08 }[en.n] || 0;
      if (R.chance(autoCura)) { p.enf = p.enf.filter(x => x !== en); log(`Te recuperaste de: ${en.n}.`, 'bueno'); continue; }
      if (d.muerte && R.chance(d.muerte * (1 + Math.min(en.anios, 5) * 0.25))) { Vida.morir(en.n.toLowerCase()); return; }
    }
  },

  /* ---------- Médico ---------- */
  panel() {
    Panel.abrir('Salud', () => {
      const p = S.p, its = [];
      its.push({ barra: ['Salud', p.st.salud] });
      if (p.adic.alcohol > 40 || p.adic.tabaco > 30 || p.adic.apuestas > 40) its.push({ info: `Adicciones: ${[['alcohol', '🍺 Alcohol'], ['tabaco', '🚬 Tabaco'], ['apuestas', '🎰 Apuestas']].filter(([k]) => p.adic[k] > 30).map(([k, n]) => `${n} ${p.adic[k]}%`).join(' · ')}` });
      its.push({ sec: 'Enfermedades' });
      if (!p.enf.length) its.push({ info: '✅ No tienes enfermedades diagnosticadas.' });
      for (const en of p.enf) its.push({ ic: ENFERMEDADES[en.n].ic, t: en.n, s: `Hace ${en.anios} años · toca para tratar`, fn: () => this.tratar(en) });
      its.push({ sec: 'Servicios' });
      its.push({ ic: '🩺', t: 'Chequeo médico general', s: '+salud leve, detecta problemas', fn: () => { if (!usar('chequeo', 1)) return; this.cobrar(150); mod({ salud: 2 }); log('Te hiciste un chequeo médico general.'); if (p.enf.length) toast(`Tienes ${p.enf.length} enfermedad(es) pendiente(s) de tratar.`); else toast('¡Todo en orden!'); } });
      if (p.edad >= 12) its.push({ ic: '🛋️', t: 'Terapia psicológica', s: `−estrés, ayuda con la salud mental (${fmt$(this.costo(800))})`, fn: () => { if (!usar('terapia', 2)) return; this.cobrar(800); mod({ estres: -R.int(8, 18), felicidad: R.int(2, 6) }); const m = p.enf.find(e => ENFERMEDADES[e.n].mental); if (m && R.chance(0.35)) { p.enf = p.enf.filter(x => x !== m); log(`🛋️ La terapia te ayudó a superar: ${m.n}.`, 'bueno'); } else log('Fuiste a terapia psicológica.'); } });
      if (p.edad >= 18) {
        its.push({ ic: '💉', t: 'Cirugía estética', s: `+apariencia, con riesgos (${fmt$(this.costo(8000, true))})`, fn: () => this.cirugia() });
        for (const [k, n, ic] of [['alcohol', 'Rehabilitación por alcohol', '🍺'], ['tabaco', 'Dejar de fumar', '🚬'], ['apuestas', 'Grupo de ayuda para ludopatía', '🎰']]) if (p.adic[k] > 20) its.push({ ic, t: n, fn: () => { if (!usar('rehab' + k, 1)) return; this.cobrar(k === 'alcohol' ? 6000 : 500, true); if (R.chance(0.55)) { p.adic[k] = 0; mod({ felicidad: 5 }); log(`💪 Superaste tu adicción: ${k}.`, 'bueno'); } else { p.adic[k] = clamp(p.adic[k] - 15); log('Recaíste, pero estás mejorando.', 'malo'); } } });
      }
      return its;
    });
  },
  costo(base, privado = false) { return pais().saludPublica && !privado ? 0 : Math.round(base * Math.max(eco(), 0.35)); },
  cobrar(base, privado = false) {
    const p = S.p, c = this.costo(base, privado);
    if (!c) return 0;
    if (p.edad < 18) { const pa = personas('padre', 'madre').sort((a, b) => b.dinero - a.dinero)[0]; if (pa) { pa.dinero -= c; return c; } }
    p.dinero -= c; return c;
  },
  tratar(en) {
    const p = S.p, d = ENFERMEDADES[en.n];
    const pub = pais().saludPublica;
    Modal.mostrar({
      ic: d.ic, titulo: en.n, texto: `<p>¿Dónde te atiendes?</p>${pub ? '<p class="nota">Tu país tiene salud pública gratuita (con listas de espera).</p>' : ''}`,
      opciones: [
        { t: `🏥 Hospital público — ${fmt$(pub ? 0 : Math.round(d.costo * 0.3 * Math.max(eco(), 0.35)))}`, fn: () => this.resolver(en, d.cura * 0.8, pub ? 0 : d.costo * 0.3) },
        { t: `🏨 Clínica privada — ${fmt$(this.costo(d.costo, true))}`, fn: () => this.resolver(en, Math.min(0.97, d.cura * 1.08), d.costo, true) },
        { t: `🌿 Medicina alternativa — ${fmt$(this.costo(100, true))}`, fn: () => this.resolver(en, d.cura * 0.2, 100, true) },
        { t: 'Cancelar' },
      ],
    });
  },
  resolver(en, prob, costo, privado) {
    const p = S.p;
    if (!usar('tratar' + en.n, 1)) return;
    if (costo && privado && p.objetos && p.objetos.seguro) costo *= 0.1;
    if (costo) { const c = Math.round(costo * Math.max(eco(), 0.35)); if (p.edad < 18) this.cobrar(costo, privado); else p.dinero -= c; }
    if (R.chance(prob)) { p.enf = p.enf.filter(x => x !== en); mod({ salud: 8, felicidad: 5 }); log(`💊 El tratamiento funcionó: superaste ${en.n}.`, 'bueno'); toast('¡Tratamiento exitoso!'); }
    else { mod({ felicidad: -3 }); log(`El tratamiento para ${en.n} no funcionó.`, 'malo'); toast('El tratamiento no funcionó.'); }
  },
  cirugia() {
    const p = S.p, c = this.costo(8000, true);
    if (p.dinero < c) return toast('No te alcanza.');
    if (!usar('cirugia', 1)) return;
    p.dinero -= c; p.cont.cirugias++;
    if (R.chance(0.85 - p.cont.cirugias * 0.04)) { const g = R.int(5, 15); mod({ apariencia: g, felicidad: 5 }); log(`💉 Tu cirugía estética fue un éxito (+${g} apariencia).`, 'bueno'); }
    else { mod({ apariencia: -R.int(5, 15), salud: -R.int(5, 15), felicidad: -10 }); log('💉 La cirugía salió mal y quedaste peor que antes.', 'malo'); if (R.chance(0.03)) Vida.morir('complicaciones de una cirugía estética'); }
  },
  accidente() {
    const p = S.p;
    if (R.chance(0.06)) return Vida.morir('un accidente de tránsito');
    mod({ salud: -R.int(10, 35), felicidad: -8 });
    log('🚑 Tuviste un accidente de tránsito y terminaste en el hospital.', 'malo');
  },
};
