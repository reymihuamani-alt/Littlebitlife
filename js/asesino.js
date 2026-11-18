'use strict';
/* =========================================================
   ASESINOS EN SERIE (ficción, sin detalles gráficos)
   1) Caso: un asesino aterroriza tu ciudad. Sale en el
      noticiero, deja pistas y puedes investigarlo.
   2) Sombra: tu propia doble vida de justiciero con código,
      al estilo de una serie de TV. Los medios te ponen apodo,
      las redes se dividen y la policía te va cercando.
   ========================================================= */
const APODOS_NPC = ['El Asesino de la Neblina', 'El Coleccionista', 'El Relojero', 'El Fantasma de la Línea Roja', 'El Vecino Silencioso', 'El Pintor', 'El Hombre del Paraguas'];
const APODOS_SOMBRA = ['El Justiciero', 'La Sombra', 'El Juez Nocturno', 'El Ángel Negro', 'El Verdugo Silencioso'];
const VEHICULOS = ['un taxi blanco', 'una moto roja', 'una camioneta gris', 'un auto negro'];
const OBJETIVOS_SOMBRA = [
  'Un estafador que dejó en la calle a cientos de jubilados y salió libre por un tecnicismo.',
  'Un traficante que compró a un juez para que archivaran su caso.',
  'Un conductor ebrio que atropelló a una familia y nunca pisó la cárcel.',
  'Un usurero que extorsiona a los comerciantes del mercado.',
  'Un empresario que envenenó un río y sobornó a todos los inspectores.',
  'Un líder de banda que recluta a niños para delinquir.',
  'Un falso médico que vendía curas milagrosas a enfermos terminales.',
];

const Asesino = {
  /* ---------- El caso del asesino de la ciudad ---------- */
  nuevoCaso() {
    const mano = R.pick(['zurdo', 'diestro']), veh = R.pick(VEHICULOS), talla = R.int(38, 45);
    const sosp = () => ({ nombre: `${R.pick(NOMBRES.M.concat(NOMBRES.F))} ${R.pick(APELLIDOS)}`, profesion: R.pick(['Taxista', 'Enfermero', 'Profesor de química', 'Guardia nocturno', 'Carnicero', 'Fotógrafo', 'Contador', 'Veterinario']) });
    const culpable = { ...sosp(), mano, veh, talla };
    const s2 = { ...sosp(), mano: mano === 'zurdo' ? 'diestro' : 'zurdo', veh, talla };
    const s3 = { ...sosp(), mano, veh: R.pick(VEHICULOS.filter(v => v !== veh)), talla: talla + R.pick([-2, 2]) };
    S.caso = { apodo: R.pick(APODOS_NPC), victimas: 1, anios: 0, fin: R.int(5, 9), activo: true, pistas: [], ocultas: R.shuffle(['mano', 'veh', 'talla']), culpable, sospechosos: R.shuffle([culpable, s2, s3]), acusado: false };
    S.casosVistos = (S.casosVistos || 0) + 1;
    Noticias.emitir(`Hallan sin vida a una persona en un parque de ${ciudad()}. La policía no descarta que sea obra de un asesino en serie.`, { modal: true, ic: '🚨', cuerpo: '<p>Los vecinos tienen miedo de salir de noche.</p>' });
  },
  textoPista(k) {
    const c = S.caso.culpable;
    return { mano: `El forense determina que el agresor es <b>${c.mano}</b>.`, veh: `Testigos vieron <b>${c.veh}</b> cerca de la escena.`, talla: `Encontraron huellas de zapato <b>talla ${c.talla}</b>.` }[k];
  },
  revelarPista(fuente = 'La policía revela una nueva pista') {
    const c = S.caso; if (!c.ocultas.length) return false;
    const k = c.ocultas.shift(); c.pistas.push(k);
    Noticias.emitir(`${fuente} sobre ${c.apodo}: ${this.textoPista(k)}`);
    return true;
  },
  veSospechosos() {
    const p = S.p, t = p.trabajo;
    return S.caso.anios >= 2 || (t && ['policia', 'periodista', 'juez'].includes(t.id)) || p.cont.investigoCaso;
  },
  anual() {
    const p = S.p;
    if ((!S.caso || !S.caso.activo) && p.edad >= 8 && (S.casosVistos || 0) < 2 && R.chance(0.025)) return this.nuevoCaso();
    const c = S.caso;
    if (!c || !c.activo) return;
    c.anios++; c.acusado = false;
    mod({ estres: 2 });
    if (c.anios >= c.fin) {
      c.activo = false;
      if (R.chance(0.65)) Noticias.emitir(`Capturan a ${c.apodo}: era ${c.culpable.nombre}, ${c.culpable.profesion.toLowerCase()}. Ya preparan una serie sobre el caso.`, { modal: true, ic: '🚔', cuerpo: `<p>Cayó tras ${c.victimas} víctimas.</p>` });
      else Noticias.emitir(`Cinco años sin noticias de ${c.apodo}. El caso queda oficialmente sin resolver.`);
      return;
    }
    if (R.chance(0.7)) {
      c.victimas += R.int(1, 2);
      Noticias.emitir(`${c.apodo} vuelve a atacar en ${ciudad()}. Ya se le atribuyen ${c.victimas} víctimas.`, { modal: c.victimas % 3 === 0, ic: '🚨' });
    }
    if (R.chance(0.5)) this.revelarPista();
    if (p.edad >= 16 && R.chance(0.1)) this.teSigue();
  },
  teSigue() {
    const p = S.p, c = S.caso;
    Modal.mostrar({ ic: '👣', titulo: 'Alguien te sigue', texto: `<p>Volviendo a casa de noche, notas pasos detrás de ti. Recuerdas las noticias sobre ${c.apodo}…</p>`, opciones: [
      op('🏃 Correr hacia una calle iluminada', () => { mod({ estres: 8 }); log('Corriste hasta una calle con gente. Los pasos desaparecieron.'); }),
      op('📞 Llamar a la policía y describir lo que ves', () => { mod({ estres: 5, karma: 2 }); if (!this.revelarPista('Gracias a la llamada de un ciudadano, la policía obtiene una pista')) log('La patrulla llegó, pero no encontró a nadie.'); }),
      op('✊ Darte la vuelta y enfrentarle', () => {
        if (R.chance(0.5 + p.st.salud / 300 + (Rasgos.tiene('atleta') ? 0.15 : 0))) { mod({ felicidad: 5 }); log('Te diste la vuelta y la figura huyó. Viste algo importante.', 'raro'); this.revelarPista('Un testigo que enfrentó al sospechoso aporta una pista'); }
        else { mod({ salud: -R.int(15, 30) }); log('Te atacaron y terminaste en el hospital, pero sobreviviste.', 'malo'); if (R.chance(0.04)) Vida.morir(`un ataque de ${c.apodo}`); }
      }),
    ] });
  },
  panelCaso() {
    Panel.abrir(() => S.caso ? S.caso.apodo : 'Caso', () => {
      const c = S.caso, p = S.p;
      if (!c || !c.activo) return [{ info: 'No hay ningún caso abierto.' }];
      const its = [
        { info: `🚨 <b>${c.apodo}</b> aterroriza ${ciudad()} desde hace ${c.anios} año${c.anios === 1 ? '' : 's'}. Víctimas: <b>${c.victimas}</b>.` },
        { sec: 'Pistas conocidas' },
        ...(c.pistas.length ? c.pistas.map(k => ({ info: '🔍 ' + this.textoPista(k) })) : [{ info: 'Todavía no hay pistas públicas.' }]),
        { sec: 'Sospechosos' },
      ];
      if (this.veSospechosos()) for (const s of c.sospechosos) its.push({ ic: '🧍', t: s.nombre, s: `${s.profesion} · ${s.mano} · maneja ${s.veh} · calza ${s.talla}` });
      else its.push({ info: 'La lista de sospechosos es confidencial. Policías, periodistas y jueces la conocen; o investiga por tu cuenta.' });
      its.push({ sec: 'Acciones' });
      its.push({ ic: '🔎', t: 'Investigar por tu cuenta', s: 'Puedes descubrir pistas… o llamar su atención', dis: p.edad < 16 ? 'Eres muy joven.' : false, fn: () => {
        if (!usar('investigarCaso', 1)) return;
        p.cont.investigoCaso = true; mod({ estres: 5 });
        if (R.chance(0.08)) { mod({ salud: -20 }); log(`${c.apodo} notó que lo investigabas. Te atacaron en la oscuridad.`, 'malo'); return; }
        if (R.chance(0.6) && c.ocultas.length) { const k = c.ocultas.shift(); c.pistas.push(k); log(`🔎 Descubriste una pista: ${this.textoPista(k)}`, 'raro'); toast('🔎 ¡Nueva pista!'); }
        else log('Pasaste semanas investigando sin resultados.');
      } });
      if (p.trabajo && p.trabajo.id === 'periodista') its.push({ ic: '📰', t: 'Cubrir el caso en tu medio', fn: () => { if (!usar('cubrirCaso', 1)) return; mod({ fama: 4 }); p.trabajo.desempeno = clamp(p.trabajo.desempeno + 8); if (R.chance(0.4)) this.revelarPista('En exclusiva, ' + p.nombre + ' ' + p.apellido + ' revela'); else log('Publicaste un reportaje sobre el caso.'); } });
      its.push({ ic: '☝️', t: 'Señalar al culpable', s: 'Si te equivocas, arruinas la vida de un inocente', dis: !c.pistas.length ? 'Necesitas al menos una pista.' : !this.veSospechosos() ? 'No conoces a los sospechosos.' : c.acusado ? 'Ya lo intentaste este año.' : false, fn: () => this.acusar() });
      return its;
    });
  },
  acusar() {
    const c = S.caso, p = S.p;
    Modal.mostrar({ ic: '☝️', titulo: '¿Quién es el culpable?', texto: c.pistas.map(k => `<p>🔍 ${this.textoPista(k)}</p>`).join(''), opciones: c.sospechosos.map(s => ({ t: `${s.nombre} — ${s.mano}, ${s.veh}, talla ${s.talla}`, fn: () => {
      c.acusado = true;
      Efectos.suspenso('🔬 Comparando pruebas…', () => {
        if (s === c.culpable) {
          c.activo = false; p.cont.detective = true;
          mod({ fama: 22, felicidad: 15, karma: 8 });
          if (p.trabajo && p.trabajo.id === 'policia') { p.trabajo.desempeno = 100; const d = Trabajo.def('policia'); if (p.trabajo.nivel < d.niveles.length - 1) Trabajo.ascender('¡Te ascendieron por resolver el caso!'); }
          Estado.darLogro('detective');
          Noticias.emitir(`${p.nombre} ${p.apellido} desenmascara a ${c.apodo}: era ${s.nombre}, ${s.profesion.toLowerCase()}.`);
          Efectos.celebrar('🔎', '¡Caso resuelto!', `<p>Tus deducciones llevaron a la captura de <b>${c.apodo}</b>. Todo el país habla de ti.</p>`);
          Historias.sembrar('serie_detective', { apodo: c.apodo }, R.int(2, 4));
        } else {
          mod({ fama: 3, karma: -8, felicidad: -10 });
          if (p.trabajo && p.trabajo.id === 'policia') p.trabajo.desempeno = clamp(p.trabajo.desempeno - 25);
          log(`☝️ Señalaste a ${s.nombre}, pero era inocente. ${c.apodo} sigue libre.`, 'malo');
          Noticias.emitir(`Liberan a ${s.nombre}: era inocente. Indignación por la acusación de ${p.nombre} ${p.apellido}.`);
        }
      }, 1600, '🔬');
    } })).concat([op('Todavía no estoy segur' + gx(p, 'o', 'a'), () => {})]) });
  },
};

/* ---------- La doble vida del jugador ---------- */
const Sombra = {
  panel() {
    Panel.abrir('Doble vida', () => {
      const p = S.p, s = p.esp.sombra;
      if (!s || !s.activo) return [
        { info: '🌑 <b>Doble vida</b> — De día, tu vida normal. De noche, un justiciero con un código estricto: solo criminales que escaparon de la justicia. Esto es ficción, pero las consecuencias en el juego son enormes: prisión de por vida, tu familia, tu karma… y tu nombre en todos los noticieros.' },
        s ? { info: `Tu pasado: ${s.victimas} caso${s.victimas === 1 ? '' : 's'}${s.apodo ? `, los medios te llamaban «${s.apodo}»` : ''}. Sospecha policial: ${s.sospecha}%.` } : null,
        { ic: '🌑', t: s ? 'Volver a las sombras' : 'Adoptar el código', s: Rasgos.tiene('frio') ? 'Tu sangre fría te da ventaja' : 'Requiere nervios de acero', dis: p.edad < 18 ? 'Debes ser mayor de edad.' : p.carcel ? 'Estás en prisión.' : false, fn: () => {
          if (s) { s.activo = true; log('🌑 Volviste a tu doble vida.', 'malo'); return; }
          p.esp.sombra = { activo: true, victimas: 0, apodo: null, sospecha: 0, notoriedad: 0, prep: 0, firma: false };
          log('🌑 Empezaste una doble vida. Nadie lo sabe… todavía.', 'malo'); mod({ karma: -5 });
        } },
      ].filter(Boolean);
      return [
        { kv: [['Apodo en los medios', s.apodo ? `«${s.apodo}»` : 'Aún sin apodo'], ['Casos', s.victimas], ['Firma', s.firma ? 'Dejas tu marca' : 'Sin rastro']] },
        { barra: ['🚨 Sospecha policial', s.sospecha, s.sospecha > 60 ? 'var(--mal)' : s.sospecha > 30 ? 'var(--med)' : 'var(--ok)'] },
        { barra: ['📺 Notoriedad mediática', s.notoriedad, 'var(--fama)'] },
        { barra: ['🗂️ Preparación', s.prep, 'var(--info)'] },
        { ic: '🗂️', t: 'Estudiar a un objetivo', s: `+preparación (${usosRestantes('estudiarObj', 2)} restantes)`, fn: () => { if (!usar('estudiarObj', 2)) return; s.prep = clamp(s.prep + R.int(18, 32)); mod({ estres: 4 }); log('Pasaste noches siguiendo los pasos de un criminal impune.'); } },
        { ic: '🌑', t: 'Actuar esta noche', s: `${usosRestantes('actuar', Rasgos.tiene('frio') ? 2 : 1)} restantes · más preparación = menos riesgo`, fn: () => this.actuar() },
        { ic: '🧹', t: 'Borrar rastros', s: `−sospecha (${fmt$(2000 * eco())})`, fn: () => { if (!usar('rastros', 1)) return; p.dinero -= Math.round(2000 * eco()); s.sospecha = clamp(s.sospecha - R.int(10, 20)); log('Eliminaste cualquier rastro que pudiera llevar hasta ti.'); } },
        { ic: '✒️', t: s.firma ? 'Dejar de firmar' : 'Dejar una firma', s: 'Los medios enloquecen (más notoriedad, más sospecha)', fn: () => { s.firma = !s.firma; log(s.firma ? 'Decidiste dejar una marca en cada caso. Quieres que el mundo sepa.' : 'Dejaste de firmar tus casos.'); } },
        { ic: '🚪', t: 'Colgar el disfraz', s: 'El pasado puede alcanzarte', cls: 'peligro', fn: () => { s.activo = false; log('Dejaste atrás tu doble vida… por ahora.', 'info'); } },
      ];
    });
  },
  actuar() {
    const p = S.p, s = p.esp.sombra;
    if (!usar('actuar', Rasgos.tiene('frio') ? 2 : 1)) return;
    const opciones = R.shuffle(OBJETIVOS_SOMBRA).slice(0, 3);
    Modal.mostrar({ ic: '🌑', titulo: 'Elige tu objetivo', texto: '<p>Tu código solo permite criminales que escaparon de la justicia.</p>', opciones: opciones.map(t => ({ t, fn: () => this.resolver(t) })).concat([op('Esta noche no', () => {})]) });
  },
  resolver(obj) {
    const p = S.p, s = p.esp.sombra;
    Efectos.suspenso('🌑 Cae la noche…', () => {
      const prob = 0.42 + s.prep / 180 + p.st.inteligencia / 450 + p.st.salud / 700 + (Rasgos.tiene('frio') ? 0.12 : 0);
      if (R.chance(Math.min(0.95, prob))) {
        s.victimas++;
        s.sospecha = clamp(s.sospecha + Math.max(2, R.int(6, 14) - Math.round(s.prep / 12)) + (s.firma ? 6 : 0));
        s.prep = 0;
        s.notoriedad = clamp(s.notoriedad + (s.firma ? 18 : 7));
        mod({ karma: -8, estres: Rasgos.tiene('frio') ? 2 : 12, felicidad: Rasgos.tiene('frio') ? 4 : -6 });
        log('🌑 Cumpliste tu código esta noche. Nadie te vio.', 'malo');
        Estado.darLogro('sombra');
        if (!s.apodo && (s.victimas >= 3 || (s.firma && s.victimas >= 2))) {
          s.apodo = `${R.pick(APODOS_SOMBRA)} de ${ciudad()}`;
          Estado.darLogro('apodo');
          Noticias.emitir(`Los medios ya tienen nombre para el misterioso justiciero: «${s.apodo}».`, { modal: true, ic: '📺', cuerpo: `<p>Todas sus víctimas eran criminales que habían escapado de la justicia. Las redes estallan: <b>#${s.apodo.split(' de ')[0].replace(/\s/g, '')}</b> es tendencia mundial.</p><p>Una encuesta dice que el ${R.int(35, 62)}% de la gente lo considera un héroe.</p>` });
        } else if (s.apodo) Noticias.emitir(`«${s.apodo}» vuelve a actuar. ${R.pick(['La policía está desconcertada.', 'Aparecen murales en su honor.', 'Un político pide mano dura contra el justiciero.', 'Los programas de TV no hablan de otra cosa.'])}`);
        else Noticias.emitir(`Desaparece un hombre con antecedentes en ${ciudad()}. La policía investiga.`);
      } else {
        s.sospecha = clamp(s.sospecha + R.int(15, 25)); mod({ salud: -R.int(5, 20), estres: 15 });
        log('🌑 Algo salió mal: el objetivo escapó y pudo verte.', 'malo');
        if (R.chance(0.15)) this.capturado('Un testigo te identificó');
      }
    }, 1500, '🌑');
  },
  capturado(motivo) {
    const p = S.p, s = p.esp.sombra;
    s.activo = false; p.cont.sombraExpuesta = true;
    const apodo = s.apodo || 'el justiciero misterioso';
    log(`🚔 ${motivo}. Te arrestaron.`, 'malo');
    Noticias.emitir(`¡CAE ${apodo.toUpperCase()}! Era ${p.nombre} ${p.apellido}, ${Vida.ultimaOcupacion().toLowerCase()} de ${p.edad} años.`, { modal: true, ic: '🚔', cuerpo: `<p>Vecinos y compañeros no lo pueden creer: "Parecía una persona totalmente normal".</p><p>Tu cara está en todas las pantallas del mundo.</p>` });
    mod({ fama: 40 });
    Crimen.sentenciar(`los ${s.victimas} casos atribuidos a ${apodo}`, R.int(30, 45));
    Historias.sembrar('serie_sobre_ti', { apodo: s.apodo || 'Doble vida' }, R.int(2, 5));
  },
  anual() {
    const p = S.p, s = p.esp.sombra;
    if (!s || p.carcel) return;
    s.notoriedad = clamp(s.notoriedad - 5);
    s.sospecha = clamp(s.sospecha - (s.activo ? 3 : 6));
    if (!s.activo && s.victimas && s.sospecha > 40 && R.chance(0.05)) return this.capturado('Una vieja investigación te alcanzó');
    if (!s.activo || !s.victimas) return;
    mod({ estres: 5 });
    if (s.sospecha > 40 && R.chance(0.35)) return this.detective();
    const pa = pareja();
    if (pa && s.victimas >= 2 && R.chance(0.12)) return this.pareja(pa);
    if (R.chance(Math.pow(s.sospecha / 100, 2) * 0.45)) return this.capturado('La policía reunió suficientes pruebas');
    if (s.apodo && s.notoriedad > 40 && R.chance(0.4)) Noticias.emitir(R.pick([`Las redes se dividen: ¿«${s.apodo}» es héroe o villano?`, `Venden camisetas de «${s.apodo}» en todos los mercados.`, `Un podcast sobre «${s.apodo}» es el más escuchado del país.`]));
  },
  detective() {
    const p = S.p, s = p.esp.sombra, det = `${R.pick(['la detective', 'el detective'])} ${R.pick(APELLIDOS)}`;
    Modal.mostrar({ ic: '🕵️', titulo: 'Tocan tu puerta', texto: `<p>Es ${det}. "Solo unas preguntas de rutina… ¿Dónde estuvo usted el martes por la noche?"</p>`, opciones: [
      op('😐 Mantener la calma y dar una coartada', () => { if (R.chance(0.45 + p.st.inteligencia / 250 + (Rasgos.tiene('frio') ? 0.2 : 0))) { s.sospecha = clamp(s.sospecha - 12); log(`Convenciste a ${det} con tu coartada.`, 'raro'); } else { s.sospecha = clamp(s.sospecha + 12); log(`${det} no se creyó tu coartada.`, 'malo'); } }),
      op(`⚖️ Llamar a un abogado (${fmt$(8000 * eco())})`, () => { p.dinero -= Math.round(8000 * eco()); s.sospecha = clamp(s.sospecha + 4); log('Tu abogado cortó el interrogatorio.'); }),
      op('😰 Ponerte nervioso y cerrar la puerta', () => { s.sospecha = clamp(s.sospecha + 20); log(`Te pusiste nervioso frente a ${det}. Grave error.`, 'malo'); }),
    ] });
  },
  pareja(pa) {
    const p = S.p, s = p.esp.sombra;
    Modal.mostrar({ ic: '📦', titulo: 'Una caja en el armario', texto: `<p>${pa.nombre} encontró una caja que escondías. Te mira en silencio: "¿Qué es esto?"</p>`, opciones: [
      op('Inventar una excusa', () => { pa.cercania = clamp(pa.cercania - 12); mod({ karma: -2 }); if (R.chance(0.7)) log(`${pa.nombre} aceptó tu excusa… por ahora.`); else { s.sospecha = clamp(s.sospecha + 15); log(`${pa.nombre} no te cree y empezó a hacer preguntas.`, 'malo'); } }),
      op('Confesar la verdad', () => { if (R.chance(0.45 + pa.cercania / 300)) { pa.cercania = clamp(pa.cercania + 10); s.sospecha = clamp(s.sospecha - 10); log(`${pa.nombre} conoce tu secreto… y decidió protegerte.`, 'raro'); } else { log(`${pa.nombre} fue directo a la policía.`, 'malo'); this.capturado(`${pa.nombre} te denunció`); } }),
      op('Terminar la relación', () => { if (pa.tipo === 'conyuge') Relaciones.divorcio(pa); else Relaciones.terminar(pa); s.sospecha = clamp(s.sospecha + 5); }),
    ] });
  },
};
