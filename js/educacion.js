'use strict';
/* =========================================================
   EDUCACIÓN: escuela, universidad pública/privada, posgrados
   ========================================================= */
const Educacion = {
  etapaEscolar() {
    const p = S.p;
    if (p.edu.abandono || p.carcel) return null;
    if (p.edad >= 6 && p.edad < 12) return 'primaria';
    if (p.edad >= 12 && p.edad < 17) return 'secundaria';
    return null;
  },

  anual() {
    const p = S.p, e = p.edu;
    // Hitos escolares
    if (p.edad === 6 && !p.carcel) log('🎒 Empezaste la escuela primaria.', 'info');
    if (p.edad === 12 && !e.abandono) { e.titulos.push({ tipo: 'primaria', nombre: 'Primaria' }); log('🏫 Terminaste la primaria y empezaste la secundaria.', 'info'); }
    const etapa = this.etapaEscolar();
    if (etapa) {
      e.notas = clamp(e.notas + (p.st.inteligencia - 50) / 12 + R.int(-7, 6) - (p.st.estres > 70 ? 5 : 0));
      if (e.club) this.efectoClub();
    }
    if (p.edad === 17 && !e.abandono && !p.carcel && !tieneTitulo('secundaria')) this.graduarSecundaria();

    // Estudios superiores
    const c = e.enCurso;
    if (c && !p.carcel) {
      e.notasU = clamp((e.notasU ?? 60) + (p.st.inteligencia - (CARRERAS[c.nombre]?.dif ?? 60)) / 10 + R.int(-8, 7) - (p.st.estres > 75 ? 6 : 0));
      this.pagarAnio(c);
      if (e.notasU < 18 && R.chance(0.45)) {
        log(`📉 Te expulsaron de ${c.nombre} por bajo rendimiento académico.`, 'malo'); mod({ felicidad: -15 });
        e.enCurso = null; return;
      }
      c.anio++;
      if (c.anio > c.dur) this.graduar(c);
      else log(`📚 Cursas el año ${c.anio} de ${c.dur} de ${c.nombre} (promedio ${Math.round(e.notasU / 5)}/20).`, 'gris');
    } else if (c && p.carcel) {
      log(`Tu matrícula en ${c.nombre} quedó anulada por tu condena.`, 'malo'); e.enCurso = null;
    }
  },

  efectoClub() {
    const p = S.p, c = p.edu.club;
    const ef = { deportes: { salud: 3, apariencia: 1 }, teatro: { fama: 1, felicidad: 2 }, debate: { inteligencia: 2 }, musica: { felicidad: 2, inteligencia: 1 }, robotica: { inteligencia: 3 } }[c];
    if (ef) mod(ef);
  },

  graduarSecundaria() {
    const p = S.p, e = p.edu;
    e.titulos.push({ tipo: 'secundaria', nombre: 'Secundaria', honores: e.notas >= 88 });
    log(`🎓 ¡Terminaste la secundaria${e.notas >= 88 ? ' como uno de los mejores de tu promoción' : ''}!`, 'bueno');
    mod({ felicidad: 6 });
    Modal.mostrar({
      ic: '🎓', titulo: '¿Y ahora qué?',
      texto: `<p>Terminaste el colegio con un promedio de <b>${Math.round(e.notas / 5)}/20</b>. Es momento de decidir tu futuro.</p><p class="nota">Consejo: piensa en tu objetivo de vida. Muchas carreras profesionales exigen un título universitario.</p>`,
      opciones: [
        { t: '🏛️ Postular a la universidad', cls: 'ok', fn: () => this.elegirCarrera() },
        { t: '✈️ Escuela de aviación', fn: () => this.inscribirPosgrado('aviacion') },
        { t: '💼 Ponerme a trabajar', fn: () => { log('Decidiste entrar directo al mundo laboral.'); } },
        { t: '🌴 Tomarme un año sabático', fn: () => { mod({ felicidad: 8 }); log('Te tomaste un año sabático para pensar.'); } },
      ],
    });
  },

  /* Lista de carreras con examen de admisión */
  elegirCarrera() {
    const p = S.p;
    Panel.abrir('Elige una carrera', () => {
      const its = [{ info: `Tu inteligencia: <b>${p.st.inteligencia}%</b>. La universidad pública es casi gratuita pero muy exigente; la privada es cara pero más accesible.` }];
      for (const [n, c] of Object.entries(CARRERAS)) {
        const hecha = tieneTitulo('universidad', n);
        its.push({ ic: c.ic, t: n, s: `${c.anios} años · exigencia ${c.dif}%${hecha ? ' · ya tienes este título' : ''}`, dis: hecha ? 'Ya tienes este título.' : false, fn: () => this.elegirUniversidad(n) });
      }
      return its;
    });
  },
  costoUni(tipo) {
    const u = pais().uni;
    return Math.round(tipo === 'publica' ? u * (pais().ingles ? 0.4 : 0.08) : u * (pais().ingles ? 1.4 : 1.0));
  },
  elegirUniversidad(carrera) {
    const c = CARRERAS[carrera];
    Modal.mostrar({
      ic: c.ic, titulo: carrera,
      texto: `<p>¿A qué universidad quieres postular?</p>`,
      opciones: [
        { t: `🏛️ Pública — ${fmt$(this.costoUni('publica'))}/año (examen difícil)`, fn: () => this.examenAdmision(carrera, 'publica') },
        { t: `🏢 Privada — ${fmt$(this.costoUni('privada'))}/año`, fn: () => this.examenAdmision(carrera, 'privada') },
        { t: 'Cancelar' },
      ],
    });
  },
  examenAdmision(carrera, tipo) {
    // Pregunta de examen generada al azar
    const a = R.int(6, 19), b = R.int(3, 12), c = R.int(2, 30);
    const tipoP = R.int(0, 2);
    let pregunta, correcta;
    if (tipoP === 0) { pregunta = `¿Cuánto es ${a} × ${b} + ${c}?`; correcta = a * b + c; }
    else if (tipoP === 1) { pregunta = `Un producto cuesta $${a * 10}. Tiene un descuento del ${b * 5}%. ¿Cuánto pagas?`; correcta = Math.round(a * 10 * (1 - b * 5 / 100) * 100) / 100; }
    else { pregunta = `Si 3 obreros construyen un muro en ${b * 2} horas, ¿cuántas horas tardarían 6 obreros?`; correcta = b; }
    const opciones = R.shuffle([correcta, correcta + R.int(1, 6), Math.max(1, correcta - R.int(1, 5)), Math.round(correcta * 1.5) + 1]);
    Modal.mostrar({
      ic: '📝', titulo: 'Examen de admisión', texto: `<p>Pregunta de razonamiento:</p><p><b>${pregunta}</b></p>`,
      opciones: [...new Set(opciones)].map(o => ({ t: String(o).replace('.', ','), fn: () => this.resolverAdmision(carrera, tipo, o === correcta) })),
    });
  },
  resolverAdmision(carrera, tipo, acerto, listo) {
    if (!listo) return Efectos.suspenso('📋 Publicando la lista de ingresantes…', () => this.resolverAdmision(carrera, tipo, acerto, true));
    const p = S.p, dif = CARRERAS[carrera].dif;
    const umbral = tipo === 'publica' ? dif - 10 : dif - 40;
    let prob = 0.5 + (p.st.inteligencia - umbral) / 40 + (acerto ? 0.2 : -0.15) + (p.edu.notas - 60) / 200 + (Rasgos.tiene('genio') ? 0.12 : 0);
    prob = Math.min(0.97, Math.max(0.03, prob));
    if (R.chance(prob)) {
      Efectos.vibrar([30, 40, 60]); Efectos.confeti();
      Modal.mostrar({
        ic: '🎉', titulo: '¡Ingresaste!', clase: 'celebra', texto: `<p>Fuiste admitid${gx(p, 'o', 'a')} en ${carrera} (${tipo === 'publica' ? 'universidad pública' : 'universidad privada'}). ${acerto ? 'Tu examen fue excelente.' : ''}</p><p>¿Cómo pagarás los estudios? (${fmt$(this.costoUni(tipo))} al año)</p>`,
        opciones: this.opcionesPago(carrera, tipo),
      });
    } else {
      mod({ felicidad: -8 });
      log(`❌ No aprobaste el examen de admisión a ${carrera}.`, 'malo');
      aviso('No ingresaste', `<p>No alcanzaste vacante en ${carrera}. Puedes volver a intentarlo el próximo año o elegir una universidad menos exigente.</p>`, '😞');
    }
  },
  opcionesPago(carrera, tipo) {
    const p = S.p, costo = this.costoUni(tipo), anios = CARRERAS[carrera].anios;
    const padres = personas('padre', 'madre');
    const fondosPadres = padres.reduce((s, x) => s + x.dinero, 0);
    const ops = [];
    if (costo < 300) ops.push({ t: '✅ Es casi gratis. ¡Empezar!', cls: 'ok', fn: () => this.empezar(carrera, tipo, 'propio') });
    else {
      ops.push({ t: '👪 Pedir a mis padres que paguen', dis: !padres.length, fn: () => {
        if (fondosPadres > costo * anios * 1.3 && R.chance(0.85)) this.empezar(carrera, tipo, 'padres');
        else { aviso('Tus padres no pueden', '<p>Tus padres te dijeron que no tienen el dinero para pagar tus estudios.</p>', '😔'); Modal.mostrar({ titulo: 'Otra opción', texto: '<p>¿Cómo quieres pagar?</p>', opciones: this.opcionesPago(carrera, tipo).filter(o => !o.t.includes('padres')) }); }
      } });
      ops.push({ t: '🏅 Solicitar una beca', fn: () => {
        const prob = (p.st.inteligencia - 55) / 50 + (p.edu.notas - 70) / 60 + (p.clase === 'pobre' ? 0.15 : 0);
        if (R.chance(clamp(prob * 100, 2, 92) / 100)) { log(`🏅 ¡Ganaste una beca completa para estudiar ${carrera}!`, 'bueno'); this.empezar(carrera, tipo, 'beca'); }
        else { aviso('Beca denegada', '<p>No conseguiste la beca esta vez.</p>', '📄'); Modal.mostrar({ titulo: 'Otra opción', texto: '<p>¿Cómo quieres pagar?</p>', opciones: this.opcionesPago(carrera, tipo).filter(o => !o.t.includes('beca')) }); }
      } });
      ops.push({ t: '🏦 Préstamo estudiantil', fn: () => this.empezar(carrera, tipo, 'prestamo') });
      ops.push({ t: `💵 Pagar con mi dinero (${fmt$(costo)}/año)`, dis: p.dinero < costo, fn: () => this.empezar(carrera, tipo, 'propio') });
    }
    ops.push({ t: 'Mejor no estudiar ahora' });
    return ops;
  },
  empezar(nombre, tipo, fin) {
    const p = S.p;
    p.edu.enCurso = { tipo: 'universidad', nombre, uni: tipo, anio: 1, dur: CARRERAS[nombre].anios, fin, costo: this.costoUni(tipo) };
    p.edu.notasU = clamp(p.edu.notas * 0.6 + 25);
    Panel.cerrar();
    log(`🏛️ Empezaste a estudiar <b>${nombre}</b> en una universidad ${tipo === 'publica' ? 'pública' : 'privada'}.`, 'bueno');
    mod({ felicidad: 8 });
  },
  pagarAnio(c) {
    const p = S.p, costo = c.costo || 0;
    if (!costo) return;
    if (c.fin === 'beca') return;
    if (c.fin === 'padres') {
      const pa = personas('padre', 'madre').sort((a, b) => b.dinero - a.dinero)[0];
      if (pa && pa.dinero >= costo) { pa.dinero -= costo; return; }
      log('Tus padres ya no pueden pagar tus estudios. Pasaste a un préstamo estudiantil.', 'malo'); c.fin = 'prestamo';
    }
    if (c.fin === 'propio') {
      if (p.dinero >= costo) { p.dinero -= costo; return; }
      c.fin = 'prestamo'; log('No te alcanzó el dinero: tomaste un préstamo estudiantil.', 'malo');
    }
    if (c.fin === 'prestamo') Finanzas.agregarDeuda('estudiantil', 'Préstamo estudiantil', costo, 0.06, 10);
  },
  graduar(c) {
    const p = S.p, e = p.edu, honores = (e.notasU ?? 60) >= 85;
    e.titulos.push({ tipo: c.tipo, nombre: c.nombre, honores });
    e.enCurso = null;
    if (c.tipo === 'universidad') {
      log(`🎓 ¡Te graduaste de <b>${c.nombre}</b>${honores ? ' con honores (cum laude)' : ''}!`, 'bueno');
      Efectos.celebrar('🎓', '¡Te graduaste!', `<p>Ahora tienes el título de <b>${c.nombre}</b>${honores ? ' con honores' : ''}.</p>`);
      Estado.darLogro('graduado'); if (honores) Estado.darLogro('honores');
    } else {
      log(`📜 ¡Completaste: <b>${POSGRADOS[c.tipo].nombre}</b>${c.tipo !== 'aviacion' && c.tipo !== 'residencia' ? ' en ' + c.nombre : ''}!`, 'bueno');
      if (c.tipo === 'doctorado') Estado.darLogro('doctor');
    }
    mod({ felicidad: 10, inteligencia: 3 });
  },

  /* Posgrados */
  inscribirPosgrado(tipo) {
    const p = S.p, pg = POSGRADOS[tipo];
    if (p.edu.enCurso) return toast('Ya estás estudiando algo.');
    let req = true, motivo = '';
    if (pg.req === 'universidad' && !tieneTitulo('universidad')) { req = false; motivo = 'Necesitas un título universitario.'; }
    if (pg.req === 'maestria' && !tieneTitulo('maestria')) { req = false; motivo = 'Necesitas una maestría.'; }
    if (pg.req === 'Medicina' && !tieneTitulo('universidad', 'Medicina')) { req = false; motivo = 'Necesitas el título de Medicina.'; }
    if (pg.req === 'secundaria' && !tieneTitulo('secundaria')) { req = false; motivo = 'Necesitas terminar la secundaria.'; }
    if (tieneTitulo(tipo)) { req = false; motivo = 'Ya tienes este título.'; }
    if (!req) return aviso('No cumples los requisitos', `<p>${motivo}</p>`, '🚫');
    const costo = pg.costoFijo ? Math.round(pg.costoFijo * Math.max(0.5, eco())) : Math.round(pais().uni * pg.costoMult);
    const area = tipo === 'maestria' || tipo === 'doctorado' ? (carrerasObtenidas()[0] || 'Ciencias') : (tipo === 'residencia' ? 'Medicina' : 'Aviación');
    const difUmbral = { maestria: 45, doctorado: 65, residencia: 60, aviacion: 40 }[tipo];
    Modal.mostrar({
      ic: pg.ic, titulo: pg.nombre,
      texto: `<p>Duración: ${pg.anios} años. ${pg.pagada ? `Recibirás un estipendio de ${fmt$(pg.pagada * eco())} al año.` : `Costo: ${fmt$(costo)} al año.`}</p><p>Área: ${area}</p>`,
      opciones: [
        { t: 'Postular', cls: 'ok', fn: () => {
          if (!R.chance(clamp(0.5 + (p.st.inteligencia - difUmbral) / 40, 0.05, 0.95))) { log(`❌ Te rechazaron en ${pg.nombre}.`, 'malo'); return aviso('Rechazado', '<p>No te admitieron esta vez.</p>', '📭'); }
          let fin = 'propio';
          if (pg.pagada) { fin = 'beca'; }
          else if (tipo === 'doctorado' && R.chance(0.6)) { fin = 'beca'; log('El doctorado incluye una beca de investigación.', 'bueno'); }
          else if (p.dinero < costo) fin = 'prestamo';
          p.edu.enCurso = { tipo, nombre: area, anio: 1, dur: pg.anios, fin, costo: pg.pagada ? 0 : costo, estipendio: pg.pagada ? Math.round(pg.pagada * eco()) : 0 };
          p.edu.notasU = clamp(p.st.inteligencia * 0.8 + 10);
          log(`📚 Empezaste: <b>${pg.nombre}</b>.`, 'bueno');
          Panel.cerrar();
        } },
        { t: 'Cancelar' },
      ],
    });
  },

  /* Ítems del panel Ocupación */
  items() {
    const p = S.p, e = p.edu, its = [];
    const etapa = this.etapaEscolar();
    its.push({ sec: 'Educación' });
    const titulos = e.titulos.filter(t => t.tipo !== 'primaria');
    its.push({ kv: [
      ['Nivel', ['Sin estudios', 'Primaria', 'Secundaria', 'Universitario', 'Maestría', 'Doctorado'][nivelEdu()]],
      ['Títulos', titulos.length ? titulos.map(t => (t.tipo === 'universidad' ? t.nombre : (POSGRADOS[t.tipo]?.nombre || t.nombre)) + (t.honores ? ' 🏅' : '')).join(', ') : '—'],
    ] });
    if (etapa) {
      its.push({ barra: [`Notas en ${etapa}`, e.notas] });
      its.push({ ic: '📖', t: 'Estudiar más', s: `+inteligencia, +notas (${usosRestantes('estudiar', 3)} restantes este año)`, fn: () => this.estudiar() });
      its.push({ ic: '🧑‍🏫', t: 'Hablar con un profesor', s: 'Pedir ayuda o consejo', fn: () => this.profesor() });
      its.push({ ic: '🏃', t: 'Faltar a clases', s: 'Más diversión, peores notas', fn: () => { if (!usar('faltar', 2)) return; mod({ felicidad: 4 }); e.notas = clamp(e.notas - R.int(5, 10)); log('Faltaste a clases para ir a pasear.'); if (R.chance(0.3)) { log('Tus padres se enteraron y se enojaron contigo.', 'malo'); personas('padre', 'madre').forEach(x => x.cercania = clamp(x.cercania - 8)); } } });
      its.push({ ic: '🎭', t: e.club ? `Club: ${{ deportes: 'Deportes', teatro: 'Teatro', debate: 'Debate', musica: 'Música', robotica: 'Robótica' }[e.club]}` : 'Unirse a un club', s: 'Los clubes mejoran estadísticas cada año', fn: () => this.club() });
      if (p.edad >= 12) its.push({ ic: '📝', t: 'Copiar en un examen', s: 'Arriesgado', fn: () => { if (!usar('copiar', 1)) return; if (R.chance(0.6)) { e.notas = clamp(e.notas + 12); log('Copiaste en el examen y sacaste buena nota.'); mod({ karma: -3 }); } else { e.notas = clamp(e.notas - 15); log('¡Te atraparon copiando! Te suspendieron una semana.', 'malo'); mod({ felicidad: -8, karma: -4 }); } } });
      if (p.edad >= 16) its.push({ ic: '🚪', t: 'Abandonar la escuela', cls: 'peligro', fn: () => Modal.mostrar({ ic: '🚪', titulo: '¿Abandonar la escuela?', texto: '<p>Sin secundaria muchas puertas se cierran. ¿Seguro?</p>', opciones: [{ t: 'Sí, abandonar', cls: 'peligro', fn: () => { e.abandono = true; log('Abandonaste la escuela.', 'malo'); } }, { t: 'No' }] }) });
    }
    if (e.enCurso) {
      const c = e.enCurso;
      its.push({ info: `<b>${c.tipo === 'universidad' ? c.nombre : POSGRADOS[c.tipo].nombre}</b> — año ${c.anio} de ${c.dur} · ${c.fin === 'beca' ? 'becad' + gx(p, 'o', 'a') : c.fin === 'padres' ? 'pagan tus padres' : c.fin === 'prestamo' ? 'con préstamo' : 'pagas tú'}` });
      its.push({ barra: ['Promedio', e.notasU ?? 60] });
      its.push({ ic: '📖', t: 'Estudiar más', s: `(${usosRestantes('estudiar', 3)} restantes este año)`, fn: () => this.estudiar() });
      its.push({ ic: '🎉', t: 'Ir a una fiesta universitaria', fn: () => { if (!usar('fiestaU', 2)) return; mod({ felicidad: 7, salud: -2, estres: -6 }); e.notasU = clamp((e.notasU ?? 60) - 5); p.adic.alcohol = clamp(p.adic.alcohol + 3); log('Fuiste a una fiesta universitaria épica.'); if (R.chance(0.25)) Relaciones.nuevoAmigo('en una fiesta universitaria'); } });
      its.push({ ic: '🚪', t: 'Abandonar los estudios', cls: 'peligro', fn: () => Modal.mostrar({ titulo: '¿Abandonar?', texto: '<p>Perderás el progreso, pero tus deudas se quedan.</p>', opciones: [{ t: 'Abandonar', cls: 'peligro', fn: () => { log(`Abandonaste ${c.nombre}.`, 'malo'); e.enCurso = null; } }, { t: 'Seguir estudiando' }] }) });
    } else if (p.edad >= 17 && !etapa) {
      if (!tieneTitulo('secundaria')) its.push({ ic: '📘', t: 'Secundaria para adultos', s: 'Obtén tu título escolar (1 año)', fn: () => { if (p.carcel) return; if (!usar('ged', 1)) return; if (R.chance(0.5 + p.st.inteligencia / 200)) { e.titulos.push({ tipo: 'secundaria', nombre: 'Secundaria' }); e.abandono = false; log('🎓 Obtuviste tu título de secundaria en el programa para adultos.', 'bueno'); } else log('Reprobaste el examen de secundaria para adultos.', 'malo'); } });
      else {
        its.push({ ic: '🏛️', t: 'Estudiar una carrera universitaria', fn: () => this.elegirCarrera() });
        its.push({ ic: '🎓', t: 'Maestría / MBA', dis: tieneTitulo('universidad') ? false : 'Requiere título universitario.', fn: () => this.inscribirPosgrado('maestria') });
        its.push({ ic: '📜', t: 'Doctorado (PhD)', dis: tieneTitulo('maestria') ? false : 'Requiere una maestría.', fn: () => this.inscribirPosgrado('doctorado') });
        its.push({ ic: '🏥', t: 'Residencia médica', dis: tieneTitulo('universidad', 'Medicina') ? false : 'Requiere el título de Medicina.', fn: () => this.inscribirPosgrado('residencia') });
        its.push({ ic: '✈️', t: 'Escuela de aviación', fn: () => this.inscribirPosgrado('aviacion') });
      }
    }
    return its;
  },
  estudiar() {
    if (!usar('estudiar', 3)) return;
    const p = S.p;
    mod({ inteligencia: R.int(1, 3) + (Rasgos.tiene('genio') ? 2 : 0), felicidad: -1, estres: 2 }); Rasgos.pista('genio');
    if (p.edu.enCurso) p.edu.notasU = clamp((p.edu.notasU ?? 60) + R.int(5, 11)); else p.edu.notas = clamp(p.edu.notas + R.int(5, 11));
    log('Estudiaste duro.');
    toast('📖 +inteligencia, +notas');
  },
  profesor() {
    if (!usar('profesor', 1)) return;
    Modal.mostrar({ ic: '🧑‍🏫', titulo: 'Tu profesor', texto: '<p>¿Qué le dices?</p>', opciones: [
      { t: 'Pedir ayuda con una materia difícil', fn: () => { S.p.edu.notas = clamp(S.p.edu.notas + 6); mod({ inteligencia: 1 }); log('Tu profesor te ayudó con una materia difícil.', 'bueno'); } },
      { t: 'Pedir consejo sobre qué estudiar', fn: () => { const ob = OBJETIVOS.find(o => o.id === S.p.objetivo); aviso('Consejo del profesor', `<p>"Si tu meta es <b>${ob.nombre}</b>, concéntrate en ${ob.stats.length ? ob.stats.map(s => NOMBRE_STAT[s]).join(' y ') : 'lo que te haga feliz'}. Prepárate desde temprano."</p>`, '💡'); } },
      { t: 'Hacerle una broma', fn: () => { mod({ felicidad: 3, karma: -2 }); S.p.edu.notas = clamp(S.p.edu.notas - 8); log('Le hiciste una broma a tu profesor. No le hizo gracia.', 'malo'); } },
    ] });
  },
  club() {
    const op = (id, t) => ({ t, fn: () => { S.p.edu.club = id; log(`Te uniste al club de ${t.replace(/^\S+ /, '')}.`); } });
    Modal.mostrar({ ic: '🎭', titulo: 'Clubes escolares', texto: '<p>Elige un club (cambia cuando quieras).</p>', opciones: [op('deportes', '⚽ Deportes'), op('teatro', '🎭 Teatro'), op('debate', '🗣️ Debate'), op('musica', '🎸 Música'), op('robotica', '🤖 Robótica'), { t: 'Salir del club', fn: () => { S.p.edu.club = null; } }] });
  },
};
