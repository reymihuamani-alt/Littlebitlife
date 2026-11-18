'use strict';
/* =========================================================
   CRIANZA: paternidad joven (18-23), criar en solitario,
   apoyo de la familia, buscar trabajo para mantener al bebé
   y decisiones del día a día con hijos pequeños.
   ========================================================= */
const Crianza = {
  /* Hijos menores que viven contigo */
  aCargo() { return hijos().filter(h => h.edad < 18 && h.viveCon !== 'otro'); },
  soltero() { return this.aCargo().length > 0 && !pareja(); },

  /* ---------- Paternidad joven ---------- */
  nacimiento(h, otro) {
    const p = S.p;
    if (!otro || h.adoptado || p.edad > 23 || otro.tipo === 'amante') return;
    const esPareja = otro.tipo === 'pareja' || otro.tipo === 'conyuge';
    p.cont.padreJoven = true;
    log(`🍼 Te convertiste en ${gx(p, 'padre', 'madre')} a los ${p.edad} años. Tu vida acaba de cambiar por completo.`, 'raro');
    mod({ estres: 15 });
    const otroRol = gx(otro, 'el padre', 'la madre');
    // La otra persona decide cómo quiere vivirlo
    const quiere = R.chance(clamp(otro.cercania + (esPareja ? 15 : 0), 10, 95) / 100);
    const ops = [];
    if (quiere) ops.push(op(`👨‍👩‍👧 Formar una familia con ${otro.nombre}`, () => { if (otro.tipo !== 'conyuge') { otro.tipo = 'pareja'; otro.anios = otro.anios || 0; } otro.cercania = clamp(otro.cercania + 10); h.viveCon = 'yo'; log(`👨‍👩‍👧 Tú y ${otro.nombre} deciden criar juntos a ${h.nombre}.`, 'bueno'); this.familia(h); }));
    ops.push(op(`🏡 Criarlo por separado: ${otro.nombre} y tú se turnan`, () => { if (otro.tipo === 'pareja') otro.tipo = 'ex'; h.viveCon = p.genero === 'F' ? 'yo' : 'otro'; h.custodiaCompartida = true; log(`🏡 ${otro.nombre} y tú criarán a ${h.nombre} por separado, con custodia compartida.`); this.familia(h); }));
    Modal.mostrar({ ic: '🍼', titulo: `${h.nombre} llegó a tu vida`, texto: `<p>Tienes ${p.edad} años y ahora eres ${gx(p, 'padre', 'madre')}. ${quiere ? `${otro.nombre} quiere formar una familia contigo.` : `${otro.nombre} no se siente preparad${gx(otro, 'o', 'a')} para formar una familia.`}</p>`, opciones: quiere ? ops : [
      ...ops,
      op(`🧍 Que ${otro.nombre} se aleje: criarlo sol${gx(p, 'o', 'a')}`, () => { if (otro.tipo === 'pareja' || otro.tipo === 'conyuge') otro.tipo = 'ex'; otro.cercania = clamp(otro.cercania - 20); h.viveCon = 'yo'; log(`🧍 ${otro.nombre} se alejó. Criarás a ${h.nombre} sol${gx(p, 'o', 'a')}.`, 'malo'); this.familia(h); }),
    ] });
    if (!quiere && p.genero === 'M' && R.chance(0.35)) log(`${cap(otroRol)} de ${h.nombre} te pidió que te hagas cargo del bebé.`, 'gris');
  },
  /* La familia reacciona */
  familia(h) {
    const p = S.p, padres = personas('padre', 'madre');
    if (!padres.length) return this.trabajo(h, false);
    const prom = padres.reduce((s, x) => s + x.cercania, 0) / padres.length;
    const prob = prom / 120 + ({ pobre: -0.1, media: 0, alta: 0.1, rica: 0.15, real: -0.2 }[p.clase] || 0);
    Efectos.suspenso(`😬 Le cuentas a tu familia que tienes un bebé…`, () => {
      if (R.chance(clamp(prob * 100, 10, 90) / 100)) {
        p.apoyoFamiliar = { desde: S.anio, hasta: S.anio + R.int(3, 8), dinero: Math.round(R.int(1500, 6000) * eco() * (p.clase === 'rica' || p.clase === 'alta' ? 3 : 1)) };
        padres.forEach(x => x.cercania = clamp(x.cercania + 5));
        Modal.mostrar({ ic: '🫂', titulo: 'Tu familia te apoya', texto: `<p>Después del susto inicial, tus padres te abrazan: "Vamos a ayudarte."</p><p>Te darán unos <b>${fmt$(p.apoyoFamiliar.dinero)} al año</b> y cuidarán a ${h.nombre} cuando lo necesites.</p>`, opciones: [
          op('🎓 Aprovechar su ayuda para seguir estudiando', () => { p.crianzaEstudio = true; log('🫂 Con la ayuda de tu familia sigues estudiando mientras crías a tu bebé.', 'bueno'); this.trabajo(h, true); }),
          op('💼 Buscar trabajo igual para independizarme', () => this.trabajo(h, true, true)),
        ] });
        log(`🫂 Tu familia decidió apoyarte con ${h.nombre}.`, 'bueno');
      } else {
        padres.forEach(x => x.cercania = clamp(x.cercania - 20));
        mod({ felicidad: -10, estres: 10 });
        const echan = R.chance(0.35) && p.vivienda === 'padres';
        if (echan) { p.vivienda = 'alquiler'; Barrio.mudanza(); }
        log(`💔 Tus padres se decepcionaron mucho${echan ? ' y te pidieron que te fueras de la casa' : ''}.`, 'malo');
        Modal.mostrar({ ic: '💔', titulo: 'Tu familia no te apoya', texto: `<p>"Tú te lo buscaste. Ahora hazte cargo."${echan ? ' Tienes que irte de la casa.' : ''}</p><p class="nota">Con el tiempo pueden cambiar de opinión si se acercan.</p>`, opciones: [op('Seguir adelante', () => this.trabajo(h, false, true))] });
        Historias.sembrar('abuelos_vuelven', { hId: h.id }, R.int(1, 4));
      }
    }, 1500, '😬');
  },
  /* Conseguir ingresos para mantener al bebé */
  trabajo(h, apoyo, forzar) {
    const p = S.p;
    if (p.trabajo && !forzar) return;
    if (p.trabajo) return log(`💼 Tu trabajo como ${Trabajo.tituloActual()} ahora es más importante que nunca.`);
    const opciones = R.shuffle(TRABAJOS.filter(d => !Trabajo.cumple(d).length)).slice(0, 3);
    Modal.mostrar({ ic: '💼', titulo: 'Necesitas ingresos', texto: `<p>Pañales, leche, médico… ${h.nombre} necesita muchas cosas. ${apoyo ? 'Tu familia ayuda, pero no alcanza para todo.' : 'Estás por tu cuenta.'}</p><p>Estas son las ofertas que encontraste:</p>`, opciones: [
      ...opciones.map(d => op(`${d.ic} ${d.niveles[0]} — ${fmt$(d.salarios[0] * eco())}/año`, () => { if (R.chance(0.7 + (p.st.inteligencia - 50) / 300)) { Trabajo.contratar(d); log('💼 Conseguiste trabajo para mantener a tu familia.', 'bueno'); } else { log(`No te contrataron como ${d.niveles[0]}. Seguirás buscando.`, 'malo'); toast('No te contrataron esta vez.'); } })),
      op(apoyo ? 'Esperar un poco y cuidar al bebé' : 'Arreglármelas con trabajos sueltos', () => { if (!apoyo) { const g = Math.round(R.int(800, 3000) * eco()); p.dinero += g; mod({ estres: 8 }); log(`Hiciste trabajos sueltos y juntaste ${fmt$(g)}.`); } }),
    ] });
  },

  /* ---------- Cada año ---------- */
  anual() {
    const p = S.p;
    const a = p.apoyoFamiliar;
    if (a) {
      if (S.anio > a.hasta || !personas('padre', 'madre').length) { log('🫂 Tus padres dejaron de ayudarte económicamente: ya te toca a ti.', 'gris'); p.apoyoFamiliar = null; }
      else { const pa = personas('padre', 'madre').sort((x, y) => y.dinero - x.dinero)[0]; const m = Math.min(a.dinero, Math.max(0, pa.dinero)); pa.dinero -= m; p.dinero += m; if (m) log(`🫂 Tus padres te ayudaron con ${fmt$(m)} para la crianza.`, 'gris'); }
    }
    const peques = this.aCargo();
    if (!peques.length) { if (p.crianzaSola) p.crianzaSola = false; return; }
    // Detectar crianza en solitario
    if (this.soltero() && !p.crianzaSola) { p.crianzaSola = true; p.cont.crianzaSola = true; Estado.darLogro('crianzaSola'); log(`🧍 Ahora crías sol${gx(p, 'o', 'a')} a ${peques.map(h => h.nombre).join(' y ')}. Es duro, pero no estás sol${gx(p, 'o', 'a')} en el mundo.`, 'info'); }
    else if (!this.soltero()) p.crianzaSola = false;
    if (p.crianzaSola) mod({ estres: 4 + peques.length * 2, felicidad: -1 });
    if (p.crianzaSola && p.trabajo && !p.apoyoFamiliar && peques.some(h => h.edad < 6)) { p.trabajo.desempeno = clamp(p.trabajo.desempeno - 5); }
    if (R.chance(p.crianzaSola ? 0.55 : 0.35)) this.evento(R.pick(peques));
  },
  evento(h) {
    const p = S.p, solo = p.crianzaSola, e = h.edad, nom = h.nombre;
    const pool = [];
    if (e <= 2) pool.push('palabras', 'noches', 'guarderia');
    if (e >= 3 && e <= 12) pool.push('enfermo', 'cumple', 'escuela', 'berrinche', 'pregunta');
    if (e >= 6 && e <= 17) pool.push('reunion', 'talento');
    if (solo) pool.push('cita', 'agotamiento', 'redApoyo');
    if (h.custodiaCompartida || hijos().some(x => x.fueraPareja)) pool.push('custodia');
    const ev = R.pick(pool);
    const E = {
      palabras: () => { h.cercania = clamp(h.cercania + 8); mod({ felicidad: 8 }); log(`🗣️ ${nom} dijo su primera palabra: "${R.pick([gx(p, 'papá', 'mamá'), 'agua', 'no', 'perro', 'más'])}". Lloraste de emoción.`, 'raro'); },
      noches: () => Modal.mostrar({ ic: '🌙', titulo: 'Noches sin dormir', texto: `<p>${nom} llora toda la noche. Llevas semanas sin dormir.</p>`, opciones: [
        op('Turnarme con alguien de la familia', () => { if (pareja() || p.apoyoFamiliar) { mod({ estres: -5 }); log('🌙 Gracias a la ayuda, por fin dormiste una noche completa.'); } else { mod({ estres: 8, salud: -3 }); log('🌙 No tenías a nadie con quien turnarte.', 'malo'); } }),
        op('Aguantar: es solo una etapa', () => { mod({ estres: 10, salud: -2 }); h.cercania = clamp(h.cercania + 5); }),
      ] }),
      guarderia: () => { const c = Math.round(4000 * eco()); Modal.mostrar({ ic: '🧸', titulo: '¿Quién cuida a ' + nom + '?', texto: '<p>Necesitas que alguien cuide al bebé mientras trabajas o estudias.</p>', opciones: [
        { t: `🏫 Guardería (${fmt$(c)}/año)`, dis: p.dinero < c, fn: () => { p.dinero -= c; mod({ estres: -6 }); h.int = clamp(h.int + 2); log(`🏫 Inscribiste a ${nom} en una guardería.`); } },
        op('👵 Pedir ayuda a los abuelos', () => { const ab = personas('padre', 'madre')[0]; if (ab && ab.cercania > 40) { ab.cercania = clamp(ab.cercania + 4); mod({ estres: -8 }); log(`👵 ${ab.nombre} cuida a ${nom} mientras trabajas.`, 'bueno'); } else { mod({ estres: 6 }); log('Los abuelos no pudieron ayudarte.', 'malo'); } }),
        op('🏠 Dejar el trabajo o los estudios un tiempo', () => { if (p.trabajo) Trabajo.dejar('Dejaste tu trabajo para cuidar a tu bebé.'); else if (p.edu.enCurso) { p.edu.enCurso = null; log('Dejaste los estudios para cuidar a tu bebé.'); } h.cercania = clamp(h.cercania + 12); mod({ estres: -4, felicidad: 2 }); }),
      ] }); },
      enfermo: () => Modal.mostrar({ ic: '🤒', titulo: `${nom} tiene fiebre`, texto: `<p>Son las 3 de la mañana y ${nom} tiene 39 °C.${p.trabajo ? ' Mañana tienes una reunión importante.' : ''}</p>`, opciones: [
        op('🏥 Llevarl' + gx(h, 'o', 'a') + ' a emergencias', () => { p.dinero -= Salud.costo(300); h.cercania = clamp(h.cercania + 6); mod({ estres: 6 }); log(`🏥 Pasaste la noche en emergencias con ${nom}. Se recuperó.`); }),
        op('🧊 Bajarle la fiebre en casa' + (Habilidades.nivel('auxilios') >= 3 ? ' (sabes primeros auxilios)' : ''), () => { if (Habilidades.nivel('auxilios') >= 3 || R.chance(0.7)) { h.cercania = clamp(h.cercania + 4); log(`🧊 Cuidaste a ${nom} toda la noche. Al amanecer la fiebre bajó.`, 'bueno'); } else { mod({ estres: 12 }); log(`La fiebre de ${nom} no bajaba y tuviste que correr al hospital.`, 'malo'); } }),
      ] }),
      cumple: () => Modal.mostrar({ ic: '🎂', titulo: `El cumpleaños de ${nom}`, texto: `<p>${nom} cumple ${e} años. ¿Cómo lo celebran?</p>`, opciones: [
        { t: `🎉 Fiesta con piñata y todos sus amigos (${fmt$(600 * eco())})`, dis: p.dinero < 600 * eco(), fn: () => { p.dinero -= Math.round(600 * eco()); h.cercania = clamp(h.cercania + 10); mod({ felicidad: 6 }); log(`🎉 ${nom} tuvo la mejor fiesta de cumpleaños.`, 'bueno'); } },
        op('🍰 Algo sencillo en casa, con mucho cariño', () => { h.cercania = clamp(h.cercania + 6); mod({ felicidad: 4 }); log(`🍰 Celebraron el cumpleaños de ${nom} en casa.`); }),
        op(p.trabajo ? '💼 No llegué por el trabajo' : '😓 Se me olvidó', () => { h.cercania = clamp(h.cercania - 15); mod({ felicidad: -5 }); log(`😢 ${nom} te esperó toda la tarde en su cumpleaños.`, 'malo'); }),
      ] }),
      escuela: () => { mod({ felicidad: 5 }); h.cercania = clamp(h.cercania + 3); log(`🎒 ${nom} empezó un nuevo año escolar y te contó todo lo que hizo en el día.`); },
      berrinche: () => Modal.mostrar({ ic: '😫', titulo: 'Berrinche en el supermercado', texto: `<p>${nom} se tira al piso gritando porque quiere un juguete. Todos te miran.</p>`, opciones: [
        op('🧘 Mantener la calma y explicarle', () => { h.int = clamp(h.int + 1); h.cercania = clamp(h.cercania + 2); log(`🧘 Manejaste con calma el berrinche de ${nom}.`, 'bueno'); }),
        op('🧸 Comprarle el juguete para que se calle', () => { p.dinero -= Math.round(40 * eco()); h.cercania = clamp(h.cercania + 3); log(`🧸 Le compraste el juguete a ${nom}. Aprendió que gritar funciona.`); }),
        op('😤 Gritarle', () => { h.cercania = clamp(h.cercania - 8); mod({ karma: -2, estres: 3 }); }),
      ] }),
      pregunta: () => Modal.mostrar({ ic: '❓', titulo: 'Una pregunta difícil', texto: `<p>${nom} te pregunta: "${solo ? `¿Por qué yo no tengo ${gx(p, 'mamá', 'papá')} en casa como mis amigos?` : '¿De dónde vienen los bebés?'}"</p>`, opciones: [
        op('Explicarle con honestidad y palabras sencillas', () => { h.cercania = clamp(h.cercania + 6); h.int = clamp(h.int + 1); log(`Tuviste una conversación honesta con ${nom}.`, 'bueno'); }),
        op('Cambiar de tema', () => {}),
      ] }),
      reunion: () => Modal.mostrar({ ic: '🏫', titulo: 'Reunión de padres', texto: `<p>La profesora de ${nom} quiere verte. Coincide con tu horario de ${p.trabajo ? 'trabajo' : 'estudio'}.</p>`, opciones: [
        op('Pedir permiso e ir', () => { if (p.trabajo) p.trabajo.desempeno = clamp(p.trabajo.desempeno - 3); h.cercania = clamp(h.cercania + 5); h.int = clamp(h.int + 2); log(`🏫 Fuiste a la reunión de padres de ${nom}.`); }),
        op('No ir', () => { h.cercania = clamp(h.cercania - 5); }),
      ] }),
      talento: () => { const t = R.pick(['dibuja increíble', 'es buenísim' + gx(h, 'o', 'a') + ' en fútbol', 'canta precioso', 'es un genio en matemáticas']); Modal.mostrar({ ic: '🌟', titulo: `${nom} tiene un talento`, texto: `<p>Descubres que ${nom} ${t}.</p>`, opciones: [
        { t: `Pagarle clases (${fmt$(1500 * eco())}/año)`, dis: p.dinero < 1500 * eco(), fn: () => { p.dinero -= Math.round(1500 * eco()); h.int = clamp(h.int + 4); h.cercania = clamp(h.cercania + 8); log(`🌟 Inscribiste a ${nom} en clases: ${t}.`, 'bueno'); } },
        op('Animarl' + gx(h, 'o', 'a') + ' a practicar en casa', () => { h.cercania = clamp(h.cercania + 4); }),
      ] }); },
      cita: () => Modal.mostrar({ ic: '💘', titulo: `${gx(p, 'Papá soltero', 'Mamá soltera')} en una cita`, texto: `<p>Te invitan a una cita, pero ¿quién cuida a ${nom}? ¿Y qué pensará de alguien nuevo?</p>`, opciones: [
        op('Ir a la cita', () => { mod({ felicidad: 5, estres: -4 }); if (R.chance(0.35)) Relaciones.nuevoAmigo('en una cita'); log('💘 Te diste una noche para ti. Lo necesitabas.'); }),
        op(`Quedarme con ${nom}`, () => { h.cercania = clamp(h.cercania + 4); }),
      ] }),
      agotamiento: () => Modal.mostrar({ ic: '🥵', titulo: 'Estás al límite', texto: '<p>Trabajo, casa, colegio, comidas… sin descanso. Sientes que no das más.</p>', opciones: [
        op('🛋️ Ir a terapia', () => { p.dinero -= Salud.costo(800); mod({ estres: -15, felicidad: 4 }); log('🛋️ La terapia te ayudó a sostener la crianza en solitario.', 'bueno'); }),
        op('📞 Pedir ayuda a tus amigos', () => { if (personas('amigo').length) { mod({ estres: -10 }); log('📞 Tus amigos se turnaron para ayudarte.', 'bueno'); } else { mod({ estres: 5 }); log('📞 No tenías a quién llamar.', 'malo'); } }),
        op('😶 Seguir aguantando', () => { mod({ estres: 8, salud: -4 }); }),
      ] }),
      redApoyo: () => { const v = Barrio.b().vecinos.find(x => x.cercania > 50 && x.tipo === 'amable') || R.pick(Barrio.b().vecinos); if (v) { v.cercania = clamp(v.cercania + 8); mod({ estres: -6 }); log(`🏘️ Tu vecin${gx(v, 'o', 'a')} ${v.nombre} se ofreció a cuidar a ${nom} los martes. Gente buena existe.`, 'bueno'); } },
      custodia: () => Modal.mostrar({ ic: '⚖️', titulo: 'Disputa por la custodia', texto: `<p>${gx(p, 'La madre', 'El padre')} de ${nom} quiere cambiar el régimen de custodia.</p>`, opciones: [
        { t: `👔 Contratar abogado y pelear (${fmt$(10000 * eco())})`, dis: p.dinero < 10000 * eco(), fn: () => { p.dinero -= Math.round(10000 * eco()); Efectos.suspenso('⚖️ El juez revisa el caso…', () => { if (R.chance(0.55 + (p.trabajo ? 0.1 : 0) - p.antecedentes * 0.1)) { h.viveCon = 'yo'; h.cercania = clamp(h.cercania + 8); log(`⚖️ El juez te dio la custodia principal de ${nom}.`, 'bueno'); } else { h.viveCon = 'otro'; h.cercania = clamp(h.cercania - 5); log(`⚖️ El juez le dio la custodia principal al otro progenitor de ${nom}.`, 'malo'); } }); } },
        op('🤝 Llegar a un acuerdo amistoso', () => { h.cercania = clamp(h.cercania + 3); mod({ estres: -3 }); log(`🤝 Llegaron a un acuerdo amistoso sobre ${nom}. Lo mejor para todos.`, 'bueno'); }),
      ] }),
    };
    E[ev]();
  },
};

Object.assign(HISTORIAS, {
  abuelos_vuelven(d, p) {
    const h = p.rel.find(r => r.id === d.hId && r.vivo), padres = personas('padre', 'madre');
    if (!h || !padres.length) return;
    Historias.modal('🫂', 'Tus padres tocan la puerta', `<p>Tus padres aparecen con un regalo para ${h.nombre}. "Fuimos muy duros contigo. Queremos conocer a nuestr${gx(h, 'o', 'a')} niet${gx(h, 'o', 'a')}."</p>`, [
      op('Abrirles la puerta', () => { padres.forEach(x => x.cercania = clamp(x.cercania + 25)); p.apoyoFamiliar = { desde: S.anio, hasta: S.anio + R.int(2, 5), dinero: Math.round(R.int(1000, 4000) * eco()) }; mod({ felicidad: 12, estres: -8 }); log('↩️ Te reconciliaste con tus padres. Ahora te ayudan con la crianza.', 'raro'); }),
      op('Todavía duele: no estoy list' + gx(p, 'o', 'a'), () => { padres.forEach(x => x.cercania = clamp(x.cercania - 5)); }),
    ]);
  },
});
