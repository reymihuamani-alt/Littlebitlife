'use strict';
/* =========================================================
   POLÍTICA: campañas, debates, mandatos, leyes y escándalos
   ========================================================= */
const DEBATES = [
  { q: '¿Qué harás contra la inseguridad ciudadana?', tema: 'Seguridad', o: [['Más policías, mejor tecnología y respeto a los derechos humanos.', 2], ['Mano dura total, cueste lo que cueste.', 1], ['La inseguridad es solo una percepción exagerada.', -2]] },
  { q: '¿Cómo vas a generar empleo?', tema: 'Empleo', o: [['Incentivos a pequeñas empresas y formalización.', 2], ['El Estado contratará a todos los desempleados.', 0], ['El mercado se regula solo; no haré nada.', -1]] },
  { q: 'Tu rival te acusa de recibir dinero de una constructora. ¿Qué respondes?', tema: 'Corrupción', o: [['Publico mis cuentas hoy mismo y pido una auditoría.', 2], ['Es una campaña sucia de mi rival.', 0], ['No voy a responder esa pregunta.', -2]] },
  { q: '¿Qué propones para la salud pública?', tema: 'Salud', o: [['Más hospitales en zonas olvidadas y medicinas genéricas.', 2], ['Privatizar todo el sistema de salud.', -1], ['Mejorar la gestión de lo que ya existe.', 1]] },
  { q: '¿Cuál es tu plan para la educación?', tema: 'Educación', o: [['Mejores sueldos para docentes y escuelas con internet.', 2], ['Reducir el presupuesto educativo.', -2], ['Más becas para universitarios.', 1]] },
  { q: 'Hay una crisis por el costo de la vivienda. ¿Qué harás?', tema: 'Vivienda', o: [['Programa de vivienda social y crédito accesible.', 2], ['Congelar todos los alquileres por ley.', 0], ['Que cada uno se las arregle.', -2]] },
  { q: 'Una minera quiere operar cerca de un río. ¿Qué opinas?', tema: 'Medio ambiente', o: [['Solo con estudios ambientales serios y consulta a la comunidad.', 2], ['Que opere ya: trae inversión.', 0], ['Prohibiré toda la minería del país.', -1]] },
  { q: '¿Cómo enfrentarás la inflación?', tema: 'Economía', o: [['Disciplina fiscal y un banco central independiente.', 2], ['Imprimir más dinero para repartir.', -2], ['Controlar los precios de los alimentos.', 0]] },
];
const LEYES = [
  { n: 'Subir el salario mínimo', ap: [-4, 12], karma: 2 },
  { n: 'Bajar impuestos', ap: [-6, 10] },
  { n: 'Reforma de salud universal', ap: [-8, 14], karma: 3 },
  { n: 'Plan nacional de seguridad', ap: [-3, 10] },
  { n: 'Inversión en educación pública', ap: [-2, 9], karma: 3 },
  { n: 'Ley de protección ambiental', ap: [-7, 9], karma: 2 },
  { n: 'Programa de vivienda social', ap: [-3, 10], karma: 2 },
  { n: 'Aumentarte el sueldo', ap: [-25, -8], dinero: true, karma: -4 },
];

const Politica = {
  estado() { const p = S.p; if (!p.esp.politica) p.esp.politica = { cargo: null, aprobacion: 50, mandato: 0, reelecciones: 0, sobornos: 0 }; return p.esp.politica; },
  panel() {
    Panel.abrir('Política', () => {
      const p = S.p, po = this.estado(), its = [];
      if (po.cargo) {
        const c = CARGOS[po.cargo];
        its.push({ kv: [['Cargo', c.n], ['Sueldo', fmt$(c.salario * eco()) + '/año'], ['Años restantes de mandato', po.mandato], ['Cargos ocupados', p.cont.cargos.map(x => CARGOS[x].n).join(', ')]] });
        its.push({ barra: ['Aprobación ciudadana', po.aprobacion] });
        its.push({ ic: '📜', t: 'Proponer una ley', s: `${usosRestantes('ley', 2)} restantes`, fn: () => this.proponerLey() });
        its.push({ ic: '🎤', t: 'Dar un discurso', fn: () => { if (!usar('discurso', 2)) return; const d = R.int(-3, 6) + Math.round((p.st.inteligencia - 50) / 20); po.aprobacion = clamp(po.aprobacion + d); mod({ fama: 1 }); log(`Diste un discurso ${d > 0 ? 'que fue muy aplaudido' : 'que no convenció a nadie'}.`); } });
        its.push({ ic: '🤝', t: 'Recorrer barrios y escuchar a la gente', fn: () => { if (!usar('barrios', 1)) return; po.aprobacion = clamp(po.aprobacion + R.int(1, 6)); mod({ karma: 1, estres: 2 }); log('Recorriste barrios y escuchaste a los vecinos.'); } });
        if (po.cargo === 'presidente') its.push({ ic: '✈️', t: 'Viaje oficial al extranjero', fn: () => { if (!usar('viajeOf', 1)) return; po.aprobacion = clamp(po.aprobacion + R.int(-4, 5)); mod({ fama: 3, felicidad: 3 }); log('Hiciste un viaje oficial y firmaste acuerdos comerciales.'); } });
        its.push({ ic: '💰', t: 'Aceptar un "regalo" de un empresario', s: 'Corrupción: dinero fácil, riesgo enorme', cls: 'peligro', fn: () => {
          if (!usar('soborno', 1)) return;
          const m = Math.round(CARGOS[po.cargo].salario * eco() * R.float(0.5, 3));
          p.dinero += m; po.sobornos++; mod({ karma: -10 });
          log(`Aceptaste ${fmt$(m)} "por debajo de la mesa".`, 'malo');
        } });
        its.push({ ic: '🚪', t: 'Renunciar al cargo', cls: 'peligro', fn: () => { log(`Renunciaste a tu cargo de ${c.n}.`, 'malo'); po.cargo = null; po.mandato = 0; mod({ fama: -5 }); } });
        return its;
      }
      its.push({ info: 'La carrera política se construye paso a paso: concejal → alcalde → congresista o gobernador → presidente. Necesitas dinero para la campaña, fama e inteligencia ayudan, y un buen debate puede cambiarlo todo.' });
      for (const [id, c] of Object.entries(CARGOS)) {
        const falta = [];
        if (p.edad < c.edad) falta.push(`Edad mínima ${c.edad}`);
        if (c.req && !c.req.some(r => p.cont.cargos.includes(r)) && p.st.fama < 75) falta.push(`Haber sido ${c.req.map(r => CARGOS[r].n).join(' o ')} (o fama 75)`);
        if (p.carcel) falta.push('Estás en prisión');
        its.push({ ic: c.nivel === 4 ? pais().bandera : ['', '🏘️', '🏙️', '🏛️'][c.nivel], t: `Postular a ${c.n}`, s: falta.length ? '🔒 ' + falta.join(' · ') : `Campaña desde ${fmt$(c.costo * eco() * 0.5)} · mandato de ${c.mandato} años`, dis: falta.length ? falta.join(', ') : false, fn: () => this.campana(id) });
      }
      return its;
    });
  },

  /* Campaña electoral: encuesta → prioridades → gasto → debate */
  campana(id, reeleccion = false) {
    const p = S.p, c = CARGOS[id], po = this.estado();
    if (!reeleccion && !usar('campana', 1)) return;
    const preocupaciones = R.shuffle(TEMAS).slice(0, 2);
    Modal.mostrar({
      ic: '🗳️', titulo: `Campaña: ${c.n}`,
      texto: `<p>📊 Las encuestas dicen que a los votantes les preocupa sobre todo: <b>${preocupaciones.join('</b> y <b>')}</b>.</p><p>Elige <b>dos</b> temas para tu campaña:</p>`,
      html: `<div class="selector" id="s-temas" style="flex-wrap:wrap">${TEMAS.map(t => `<button type="button" data-v="${t}" style="flex:1 0 45%">${t}</button>`).join('')}</div>`,
      alAbrir: m => {
        const bs = [...m.querySelectorAll('#s-temas button')];
        bs.forEach(b => b.onclick = () => { if (b.classList.contains('sel')) b.classList.remove('sel'); else if (bs.filter(x => x.classList.contains('sel')).length < 2) b.classList.add('sel'); });
      },
      opciones: [{ t: 'Continuar', cls: 'ok', fn: () => {
        const elegidos = [...document.querySelectorAll('#s-temas button.sel')].map(b => b.dataset.v);
        const coinc = elegidos.filter(t => preocupaciones.includes(t)).length;
        this.pasoGasto(id, { coinc, preocupaciones, reeleccion });
      } }],
    });
  },
  pasoGasto(id, cam) {
    const p = S.p, c = CARGOS[id];
    const donantes = Math.round(c.costo * eco() * (p.st.fama / 140 + (cam.reeleccion ? 0.3 : 0)));
    Modal.mostrar({
      ic: '💸', titulo: 'Financiar la campaña', texto: `<p>Tus donantes aportan <b>${fmt$(donantes)}</b>. El resto sale de tu bolsillo.</p>`,
      opciones: [['Austera', 0.5, -0.05], ['Normal', 1, 0.04], ['Masiva', 2.2, 0.12]].map(([n, f, b]) => {
        const costo = Math.max(0, Math.round(c.costo * eco() * f - donantes));
        return { t: `${n} — pagas ${fmt$(costo)}`, dis: p.dinero < costo, fn: () => { p.dinero -= costo; cam.gasto = b; this.pasoDebate(id, cam); } };
      }),
    });
  },
  pasoDebate(id, cam) {
    const deb = R.shuffle(DEBATES).sort((a, b) => cam.preocupaciones.includes(b.tema) - cam.preocupaciones.includes(a.tema))[0];
    Modal.mostrar({
      ic: '🎙️', titulo: 'Debate electoral', texto: `<p>El moderador pregunta:</p><p><b>"${deb.q}"</b></p>`,
      opciones: R.shuffle(deb.o).map(([t, v]) => ({ t, fn: () => { cam.debate = v * (cam.preocupaciones.includes(deb.tema) ? 1.5 : 1); this.resultado(id, cam); } })),
    });
  },
  resultado(id, cam) {
    const p = S.p, c = CARGOS[id], po = this.estado();
    let prob = 0.36 + cam.coinc * 0.12 + cam.gasto + cam.debate * 0.05 + (p.st.fama - 30) / 260 + (p.st.inteligencia - 50) / 400 + (p.st.karma - 50) / 600 + (p.st.apariencia - 50) / 600 - c.dif - po.sobornos * 0.03 - (p.antecedentes ? 0.1 : 0);
    if (cam.reeleccion) prob += (po.aprobacion - 50) / 120;
    prob = clamp(prob * 100, 3, 92) / 100;
    const gano = R.chance(prob);
    const pct = gano ? R.int(51, 68) : R.int(28, 49);
    if (gano) {
      if (!cam.reeleccion && p.trabajo && id !== 'concejal') Trabajo.dejar('Dejaste tu empleo para asumir el cargo público.');
      po.cargo = id; po.mandato = c.mandato; po.aprobacion = R.int(50, 65);
      if (cam.reeleccion) po.reelecciones++; else po.reelecciones = 0;
      if (!p.cont.cargos.includes(id)) p.cont.cargos.push(id);
      mod({ fama: c.nivel * 6, felicidad: 15 });
      log(`🗳️ ¡GANASTE la elección a <b>${c.n}</b> con el ${pct}% de los votos!`, 'raro');
      if (id === 'presidente') Estado.darLogro('presidente');
      aviso('¡Victoria!', `<p>Obtuviste el <b>${pct}%</b> de los votos. ¡Eres ${c.n}!</p>`, '🎉');
    } else {
      if (cam.reeleccion) { po.cargo = null; po.mandato = 0; }
      mod({ felicidad: -12 });
      log(`🗳️ Perdiste la elección a ${c.n} con el ${pct}% de los votos.`, 'malo');
      aviso('Derrota', `<p>Obtuviste el ${pct}% de los votos. ${cam.coinc < 2 ? 'Tus temas no conectaron con lo que preocupaba a la gente.' : 'Faltó poco.'}</p>`, '😔');
    }
  },
  proponerLey() {
    if (!usar('ley', 2)) return;
    const p = S.p, po = this.estado();
    Modal.mostrar({
      ic: '📜', titulo: 'Proponer ley', texto: '<p>¿Qué ley quieres impulsar?</p>',
      opciones: R.shuffle(LEYES).slice(0, 5).map(l => ({ t: l.n, fn: () => {
        const aprobada = R.chance(clamp(po.aprobacion + 20 + CARGOS[po.cargo].nivel * 5, 10, 90) / 100);
        if (!aprobada) { po.aprobacion = clamp(po.aprobacion - 3); return log(`La propuesta "${l.n}" fue rechazada.`, 'malo'); }
        const d = R.int(l.ap[0], l.ap[1]); po.aprobacion = clamp(po.aprobacion + d);
        if (l.karma) mod({ karma: l.karma });
        if (l.dinero) p.dinero += Math.round(CARGOS[po.cargo].salario * eco() * 0.3);
        log(`📜 Se aprobó tu ley: "${l.n}". Aprobación ${d >= 0 ? '+' : ''}${d}.`, d >= 0 ? 'bueno' : 'malo');
      } })),
    });
  },

  anual() {
    const p = S.p, po = p.esp.politica;
    if (!po || !po.cargo) return 0;
    if (p.carcel) { log(`Perdiste tu cargo de ${CARGOS[po.cargo].n} al ir a prisión.`, 'malo'); po.cargo = null; return 0; }
    const c = CARGOS[po.cargo];
    po.aprobacion = clamp(po.aprobacion + R.int(-6, 4) + (S.eco.estado === 'recesion' ? -7 : S.eco.estado === 'auge' ? 4 : 0));
    mod({ estres: 4 + c.nivel, fama: 1 });
    // Escándalos de corrupción
    if (po.sobornos && R.chance(0.12 * po.sobornos)) {
      po.aprobacion = clamp(po.aprobacion - 25); mod({ fama: 5, felicidad: -15 });
      log('📰 ¡ESCÁNDALO! La prensa reveló tus sobornos.', 'malo');
      if (R.chance(0.35)) { po.cargo = null; Crimen.arrestar('corrupción de funcionarios', [3, 9]); return 0; }
    }
    if (po.aprobacion < 12 && R.chance(0.4)) { log(`Masivas protestas te obligaron a renunciar como ${c.n}.`, 'malo'); po.cargo = null; return 0; }
    po.mandato--;
    if (po.mandato <= 0) {
      const puede = !(po.cargo === 'presidente' && po.reelecciones >= 1);
      const id = po.cargo;
      if (puede) Modal.mostrar({ ic: '🗳️', titulo: 'Fin del mandato', texto: `<p>Tu mandato como ${c.n} terminó. Aprobación: <b>${po.aprobacion}%</b>. ¿Buscas la reelección?</p>`, opciones: [{ t: 'Sí, a la reelección', cls: 'ok', fn: () => this.campana(id, true) }, { t: 'No, me retiro', fn: () => { po.cargo = null; log(`Terminaste tu mandato como ${c.n}.`); } }] });
      else { po.cargo = null; log(`Terminaste tu mandato como ${c.n}. La ley no permite otra reelección.`); }
    }
    return Math.round(c.salario * eco());
  },
};
