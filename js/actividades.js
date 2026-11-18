'use strict';
/* =========================================================
   ACTIVIDADES: cuerpo, mente, ocio, trámites, carreras y crimen
   ========================================================= */
const DESTINOS = [
  ['🏔️ Cusco y Machu Picchu', 1500], ['🏖️ Cancún', 2500], ['🗼 París', 5000], ['🗽 Nueva York', 4500], ['🏯 Tokio', 6000], ['🦁 Safari en Kenia', 7000], ['🛳️ Crucero por el Mediterráneo', 9000], ['🏝️ Maldivas en hotel de lujo', 25000],
];

const Actividades = {
  panel() {
    Panel.abrir('Actividades', () => {
      const p = S.p, e = p.edad, its = [];
      const a = (ic, t, s, fn, dis) => its.push({ ic, t, s, fn, dis });
      if (p.carcel) {
        its.push({ info: 'Estás en prisión. Tus opciones son limitadas.' });
        a('⛓️', 'Vida en prisión', 'Conducta, ejercicio, fuga…', () => Crimen.panelCarcel());
        a('🩺', 'Enfermería de la prisión', '', () => Salud.panel());
        return its;
      }
      if (e < 6) {
        its.push({ info: 'Todavía eres muy pequeñ' + gx(p, 'o', 'a') + '. ¡Cumple años para desbloquear más actividades!' });
        a('🧸', 'Jugar con mis juguetes', '+felicidad', () => { if (!usar('jugar', 3)) return; mod({ felicidad: 3 }); log('Jugaste con tus juguetes.'); });
        a('😭', 'Hacer un berrinche', '', () => { if (!usar('berrinche', 1)) return; personas('padre', 'madre').forEach(x => x.cercania = clamp(x.cercania - 3)); mod({ felicidad: 1 }); log('Hiciste un berrinche monumental en el supermercado.'); });
        if (e >= 3) a('📖', 'Pedir que me lean un cuento', '+inteligencia', () => { if (!usar('cuento', 2)) return; mod({ inteligencia: 1, felicidad: 2 }); log('Tus padres te leyeron un cuento antes de dormir.'); });
        a('🩺', 'Médico', '', () => Salud.panel());
        return its;
      }
      if (S.caso && S.caso.activo) { its.push({ sec: '🚨 Caso abierto' }); a('🔎', S.caso.apodo, `${S.caso.victimas} víctimas · ${S.caso.pistas.length} pistas`, () => Asesino.panelCaso()); }
      its.push({ sec: 'Cuerpo y mente' });
      a('🏋️', 'Gimnasio', '+salud, +apariencia', () => { if (!usar('gym', 3)) return; mod({ salud: R.int(1, 3) + (Rasgos.tiene('atleta') ? 2 : 0), apariencia: R.int(0, 2), estres: -3, felicidad: 1 }); Rasgos.pista('atleta'); if (R.chance(0.02)) { Salud.contraer('Lesión de rodilla'); log('Te lesionaste en el gimnasio.', 'malo'); } else log('Fuiste al gimnasio.'); }, e < 12 ? 'Desde los 12 años.' : false);
      a('🏃', 'Salir a correr', '+salud', () => { if (!usar('correr', 3)) return; mod({ salud: R.int(1, 3), estres: -2 }); log('Saliste a correr.'); });
      a('🧘', 'Meditar', '−estrés, +felicidad', () => { if (!usar('meditar', 3)) return; mod({ estres: -R.int(4, 9), felicidad: 2 }); log('Meditaste un rato.'); }, e < 10 ? 'Desde los 10 años.' : false);
      a('📚', 'Ir a la biblioteca', '+inteligencia', () => { if (!usar('biblio', 3)) return; mod({ inteligencia: R.int(1, 2) + (Rasgos.tiene('genio') ? 1 : 0) }); Rasgos.pista('genio'); log('Pasaste la tarde en la biblioteca.'); });
      a('🥗', 'Seguir una dieta saludable', '+salud, +apariencia', () => { if (!usar('dieta', 1)) return; mod({ salud: 3, apariencia: 1, felicidad: -1 }); log('Seguiste una dieta saludable todo el año.'); }, e < 13 ? 'Desde los 13 años.' : false);
      a('🩺', 'Salud y médicos', 'Enfermedades, terapia, cirugía, rehabilitación', () => Salud.panel());
      its.push({ sec: 'Ocio' });
      if (e >= 12) a('🧺', 'Mercado de pulgas', 'Cachivaches… y muy de vez en cuando, un tesoro', () => Coleccion.bazar());
      a('🎬', 'Ir al cine', '+felicidad', () => { if (!usar('cine', 2)) return; p.dinero -= e >= 18 ? Math.round(10 * eco()) : 0; mod({ felicidad: 3 }); log(`Fuiste a ver una película de ${R.pick(GENEROS_CINE).toLowerCase()}.`); });
      if (e >= 18) {
        a('✈️', 'Vacaciones', '−estrés, +felicidad', () => this.vacaciones());
        a('🪩', 'Ir a una discoteca', '+felicidad, conoce gente', () => this.discoteca());
        a('💆', 'Spa', `−estrés (${fmt$(200 * eco())})`, () => { if (!usar('spa', 2)) return; p.dinero -= Math.round(200 * eco()); mod({ estres: -10, apariencia: 1, felicidad: 3 }); log('Pasaste un día relajante en el spa.'); });
        a('🎰', 'Casino', 'Ruleta, blackjack, tragamonedas', () => Minijuegos.casino());
        a('🎟️', 'Lotería', 'Casi imposible… casi', () => Minijuegos.loteria());
      }
      its.push({ sec: 'Carreras y fama' });
      for (const it of Carreras.resumenItems()) its.push(it);
      its.push({ sec: 'Trámites y vida' });
      a('🪪', 'Licencia de conducir', p.licencia ? 'Ya tienes licencia ✅' : 'Examen teórico y práctico', () => Minijuegos.examenManejo(), e < 16 ? 'Desde los 16 años.' : p.licencia ? 'Ya tienes licencia.' : false);
      if (e >= 18) {
        a('🌎', 'Emigrar a otro país', `Ahora vives en ${pais().bandera} ${p.pais}`, () => this.emigrar());
        a('🏡', 'Mudarse', '', () => Finanzas.mudarse());
        a('✍️', 'Cambiar de nombre', '', () => this.cambiarNombre());
      }
      a('🐾', 'Adoptar una mascota', '', () => Relaciones.adoptarMascota());
      if (e >= 10) { its.push({ sec: 'El lado oscuro' }); a('🦹', 'Crimen', 'Delitos, crimen organizado', () => Crimen.panel()); }
      return its;
    });
  },
  vacaciones() {
    const p = S.p;
    Modal.mostrar({ ic: '✈️', titulo: '¿A dónde vamos?', opciones: DESTINOS.map(([d, c]) => { const costo = Math.round(c * Math.max(eco(), 0.6)); return { t: `${d} — ${fmt$(costo)}`, dis: p.dinero < costo, fn: () => {
      if (!usar('vacaciones', 2)) return;
      p.dinero -= costo; p.cont.viajes++;
      mod({ felicidad: R.int(6, 14), estres: -R.int(10, 25), salud: 1 });
      const pa = pareja(); if (pa) pa.cercania = clamp(pa.cercania + 8);
      log(`✈️ Te fuiste de vacaciones a ${d.slice(d.indexOf(' ') + 1)}.`, 'bueno');
      if (R.chance(0.08)) Relaciones.nuevoAmigo('durante el viaje');
      if (R.chance(0.03)) { Salud.contraer('Gripe fuerte'); log('Volviste del viaje con una gripe terrible.', 'malo'); }
    } }; }).concat([{ t: 'Cancelar' }]) });
  },
  discoteca() {
    const p = S.p;
    if (!usar('disco', 2)) return;
    p.dinero -= Math.round(60 * eco());
    Modal.mostrar({ ic: '🪩', titulo: 'En la discoteca', texto: '<p>La música está buenísima. ¿Qué haces?</p>', opciones: [
      op('💃 Bailar toda la noche', () => { mod({ felicidad: 6, salud: 1, estres: -5 }); log('Bailaste toda la noche en la discoteca.'); if (R.chance(0.25)) Relaciones.nuevoAmigo('en la discoteca'); }),
      op('🍹 Tomar unos tragos', () => { p.adic.alcohol = clamp(p.adic.alcohol + 8); mod({ felicidad: 5, salud: -2 }); log('Tomaste unos tragos en la discoteca.'); if (R.chance(0.06)) { log('Te peleaste con un borracho y llegó la policía.', 'malo'); Crimen.arrestar('alteración del orden público', [0, 1]); } }),
      op('😏 Coquetear con alguien', () => { if (R.chance(0.3 + p.st.apariencia / 250) && !pareja()) { const c = Estado.persona({ tipo: 'pareja', edad: clamp(p.edad + R.int(-4, 4), 18, 90) }); c.cercania = 55; c.anios = 0; p.rel.push(c); p.cont.parejas++; log(`💕 Conociste a ${c.nombre} en la discoteca y empezaron a salir.`, 'bueno'); mod({ felicidad: 8 }); } else log('Coqueteaste un poco, pero nada serio.'); }),
    ] });
  },
  emigrar() {
    const p = S.p;
    Modal.mostrar({ ic: '🌎', titulo: 'Emigrar', texto: '<p>Mudarte de país cambia sueldos, precios, impuestos y oportunidades. Perderás tu empleo actual.</p>', opciones: Object.keys(PAISES).filter(x => x !== p.pais).map(d => ({ t: `${PAISES[d].bandera} ${d}`, fn: () => this.emigrarA(d, false) })).concat([{ t: 'Cancelar' }]) });
  },
  emigrarA(destino, conTrabajo) {
    const p = S.p;
    const costo = Math.round(3000 * Math.max(eco(), PAISES[destino].eco));
    if (p.dinero < costo) return aviso('Sin fondos', `<p>Necesitas ${fmt$(costo)} para mudarte.</p>`, '🧳');
    if (!usar('emigrar', 1)) return;
    if (p.pasaporteFalso && !conTrabajo) {
      if (R.chance(0.15)) { p.dinero -= costo; log('🛂 En migraciones detectaron tu pasaporte falso.', 'malo'); p.pasaporteFalso = false; return Crimen.arrestar('uso de documentos falsos', [1, 4]); }
      p._sinVisa = true; log('🛂 Pasaste migraciones con tu pasaporte falso sin problemas.', 'malo');
    }
    const dificil = PAISES[destino].eco > 0.6 && PAISES[p.pais].eco < 0.6;
    const prob = conTrabajo || p._sinVisa ? 0.99 : dificil ? 0.3 + (nivelEdu() >= 3 ? 0.35 : 0) + (patrimonio() > 5e5 ? 0.3 : 0) - (p.antecedentes ? 0.25 : 0) : 0.8;
    if (!R.chance(clamp(prob * 100, 5, 98) / 100)) { log(`🛂 Te negaron la visa para ${destino}.`, 'malo'); return aviso('Visa denegada', '<p>El consulado rechazó tu solicitud. Un título universitario o más patrimonio ayudan.</p>', '🛂'); }
    p._sinVisa = false;
    p.dinero -= costo;
    const ecoAntes = eco();
    if (!conTrabajo && p.trabajo) Trabajo.dejar(`Dejaste tu empleo para emigrar.`);
    p.pais = destino;
    if (p.vivienda === 'padres') p.vivienda = 'alquiler';
    if (p.esp.politica && p.esp.politica.cargo) { log('Perdiste tu cargo político al emigrar.', 'malo'); p.esp.politica.cargo = null; }
    p.cont.viajes++;
    mod({ felicidad: R.int(-5, 10), estres: 10 });
    log(`🌎 Emigraste a <b>${destino}</b> ${PAISES[destino].bandera}.${conTrabajo ? ' Conservas tu puesto en la sede local.' : ''}`, 'info');
    if (eco() > ecoAntes * 1.5) log('Los sueldos aquí son mucho más altos… y los precios también.', 'gris');
  },
  cambiarNombre() {
    const p = S.p;
    Modal.mostrar({ ic: '✍️', titulo: 'Cambiar de nombre', html: `<input type="text" id="m-txt" maxlength="20" value="${esc(p.nombre)}">`, opciones: [{ t: 'Cambiar', cls: 'ok', fn: () => { const n = ($('#m-txt').value || '').trim(); if (n) { log(`Cambiaste legalmente tu nombre de ${esc(p.nombre)} a ${esc(n)}.`); p.nombre = n; p.dinero -= Math.round(200 * eco()); } } }, { t: 'Cancelar' }] });
  },
};
