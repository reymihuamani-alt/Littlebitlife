'use strict';
/* =========================================================
   HISTORIAS ENCADENADAS: tus decisiones regresan años después
   ========================================================= */
const Historias = {
  sembrar(id, d = {}, enAnios = 5) { const p = S.p; if (!p.hilos) p.hilos = []; p.hilos.push({ id, en: S.anio + enAnios, d }); },
  anual() {
    const p = S.p;
    if (!p.hilos || !p.hilos.length) return;
    const h = p.hilos.find(x => x.en <= S.anio);
    if (!h) return;
    p.hilos = p.hilos.filter(x => x !== h);
    if ((p.carcel && h.id !== 'serie_sobre_ti') || !HISTORIAS[h.id]) { h.en = S.anio + 2; if (HISTORIAS[h.id] && p.edad < 95) p.hilos.push(h); return; }
    Estado.darLogro('historia');
    HISTORIAS[h.id](h.d, p);
  },
  /* Encabezado común para que se note que es una historia que vuelve */
  modal(ic, titulo, texto, opciones) { Modal.mostrar({ ic, titulo: `↩️ ${titulo}`, texto: `<p class="nota">Una historia de tu pasado vuelve…</p>${texto}`, opciones, clase: 'historia' }); },
  mejorTrabajo() {
    const ok = TRABAJOS.filter(d => d.cat !== 'Sin estudios' && !Trabajo.cumple(d).length);
    return ok.sort((a, b) => b.salarios[0] - a.salarios[0])[0] || TRABAJOS.find(d => !Trabajo.cumple(d).length);
  },
};

const HISTORIAS = {
  billetera_devuelta(d, p) {
    const dueno = d.n || 'el dueño';
    Historias.modal('🤝', 'La billetera', `<p>Hace años devolviste una billetera perdida. Su dueño, <b>${dueno}</b>, hoy dirige una empresa importante y te reconoce en la calle.</p><p>"Nunca olvidé lo que hiciste. ¿Cómo puedo devolverte el favor?"</p>`, [
      op('💼 Pedirle un buen trabajo', () => {
        if (p.edad < 18) { mod({ felicidad: 5 }); return log(`${dueno} prometió que te ayudaría cuando seas mayor de edad.`); }
        const t = Historias.mejorTrabajo();
        if (t) { Trabajo.contratar(t); if (p.trabajo && p.trabajo.nivel < t.niveles.length - 2) { p.trabajo.nivel++; log('Gracias a tu contacto, empezaste en un puesto más alto.', 'bueno'); } }
      }),
      op('📈 Pedirle consejos de inversión', () => { mod({ inteligencia: 4 }); const g = Math.round(Math.max(0, p.dinero) * R.float(0.1, 0.4) + 3000 * eco()); p.dinero += g; log(`↩️ Los consejos de ${dueno} te hicieron ganar ${fmt$(g)}.`, 'bueno'); }),
      op('🙏 Solo agradecerle', () => { mod({ karma: 5, felicidad: 6 }); log(`↩️ ${dueno} y tú se hicieron amigos.`, 'bueno'); const a = Estado.persona({ tipo: 'amigo', edad: p.edad + R.int(5, 20), nombre: dueno.split(' ')[0] }); a.cercania = 80; a.dinero *= 20; p.rel.push(a); }),
    ]);
  },
  billetera_robada(d, p) {
    const m = Math.min(Math.max(0, p.dinero), Math.round(R.int(200, 1500) * eco()));
    p.dinero -= m; mod({ felicidad: -6 });
    Historias.modal('😬', 'Karma', `<p>Perdiste tu billetera con ${fmt$(m)}. Nadie te la devolvió.</p><p>Recordaste aquella billetera que encontraste hace años y que nunca devolviste…</p>`, [op('Aprendí la lección', () => mod({ karma: 3 })), op('Mala suerte, nada más', () => {})]);
    log('↩️ Perdiste tu billetera. Irónico, ¿no?', 'malo');
  },
  amigo_deudor(d, p) {
    if (R.chance(0.5)) {
      const m = Math.round(R.int(10000, 120000) * eco());
      p.dinero += m; mod({ felicidad: 10 });
      Historias.modal('💸', `${d.n} vuelve`, `<p><b>${d.n}</b>, el amigo que nunca te devolvió aquel préstamo, se hizo rico con un negocio.</p><p>Te transfiere <b>${fmt$(m)}</b>: "Te debía esto con intereses. Perdón por tardar tanto."</p>`, [op('Perdonarle todo', () => mod({ karma: 4 }))]);
      log(`↩️ ${d.n} por fin te devolvió el préstamo… multiplicado: ${fmt$(m)}.`, 'raro');
    } else {
      Historias.modal('📞', `${d.n} vuelve`, `<p>Recibes una llamada desde prisión. Es <b>${d.n}</b>, aquel amigo que nunca te pagó. Necesita ${fmt$(15000 * eco())} para un abogado.</p>`, [
        op('Pagarle el abogado', () => { p.dinero -= Math.round(15000 * eco()); mod({ karma: 6 }); log(`↩️ Pagaste el abogado de ${d.n}.`); Historias.sembrar('amigo_agradecido', { n: d.n }, R.int(4, 10)); }),
        op('Colgar', () => { mod({ karma: -2 }); log(`↩️ Le colgaste a ${d.n}.`); }),
      ]);
    }
  },
  amigo_agradecido(d, p) {
    mod({ felicidad: 8 });
    Historias.modal('🫂', 'Gratitud', `<p><b>${d.n}</b> salió libre, rehízo su vida y abrió un taller. Te regala parte de su primer año de ganancias y te dice que le salvaste la vida.</p>`, [op('Abrazarlo', () => { const m = Math.round(8000 * eco()); p.dinero += m; mod({ karma: 3 }); log(`↩️ ${d.n} te agradeció con ${fmt$(m)}.`, 'bueno'); })]);
  },
  nemesis(d, p) {
    const n = d.n, el = gx({ genero: d.g }, 'él', 'ella');
    if (d.paso === 1) {
      Historias.modal('😤', `${n} otra vez`, `<p><b>${n}</b>, quien te molestaba de niñ${gx(p, 'o', 'a')}, se postula contra ti a delegado del colegio.</p>`, [
        op('Hacer una campaña limpia', () => { if (R.chance(0.45 + p.st.inteligencia / 300 + (Rasgos.tiene('carisma') ? 0.2 : 0))) { mod({ felicidad: 10, fama: 2 }); log(`↩️ Le ganaste a ${n} la elección escolar.`, 'raro'); } else { mod({ felicidad: -6 }); log(`↩️ ${n} te ganó la elección escolar.`, 'malo'); } Historias.sembrar('nemesis', { ...d, paso: 2 }, R.int(10, 16)); }),
        op('Difundir un rumor sobre ' + el, () => { mod({ karma: -5 }); if (R.chance(0.6)) log(`↩️ El rumor hundió a ${n}. Ganaste, pero no te sientes bien.`); else { mod({ felicidad: -8 }); log('↩️ Descubrieron que el rumor venía de ti.', 'malo'); } Historias.sembrar('nemesis', { ...d, paso: 2, odio: true }, R.int(10, 16)); }),
        op('Proponerle hacer las paces', () => { mod({ karma: 5 }); if (R.chance(0.5)) { log(`↩️ Hiciste las paces con ${n}. Ahora son amigos.`, 'bueno'); const a = Estado.persona({ tipo: 'amigo', edad: p.edad, genero: d.g, nombre: n.split(' ')[0] }); a.cercania = 60; p.rel.push(a); } else { log(`↩️ ${n} se burló de tu propuesta.`, 'malo'); Historias.sembrar('nemesis', { ...d, paso: 2 }, R.int(10, 16)); } }),
      ]);
    } else if (d.paso === 2) {
      const jefe = !!p.trabajo;
      Historias.modal('😈', `${n} reaparece`, jefe ? `<p>Llega un nuevo jefe a tu área… es <b>${n}</b>. Tu viejo némesis ahora decide tus ascensos.</p>` : `<p><b>${n}</b> aparece en una reunión, presumiendo su éxito y burlándose de tu vida frente a todos.</p>`, [
        op('Ser profesional y demostrar lo que vales', () => { if (p.trabajo) p.trabajo.desempeno = clamp(p.trabajo.desempeno + 10); mod({ estres: 6, karma: 2 }); log(`↩️ Mantuviste la compostura frente a ${n}.`); Historias.sembrar('nemesis', { ...d, paso: 3 }, R.int(20, 30)); }),
        op('Humillarl' + gx({ genero: d.g }, 'o', 'a') + ' en público', () => { mod({ felicidad: 6, karma: -4 }); if (p.trabajo && R.chance(0.5)) { p.trabajo.desempeno = clamp(p.trabajo.desempeno - 25); log(`↩️ Humillaste a ${n}. Se vengó haciéndote la vida imposible en el trabajo.`, 'malo'); } else log(`↩️ Humillaste a ${n} frente a todos. Fue glorioso.`, 'raro'); Historias.sembrar('nemesis', { ...d, paso: 3, odio: true }, R.int(20, 30)); }),
        op('Ignorarl' + gx({ genero: d.g }, 'o', 'a'), () => { mod({ estres: 3 }); Historias.sembrar('nemesis', { ...d, paso: 3 }, R.int(20, 30)); }),
      ]);
    } else {
      Historias.modal('🕊️', `La última vez con ${n}`, `<p><b>${n}</b> está muy enferm${gx({ genero: d.g }, 'o', 'a')}. Te escribe una carta: quiere pedirte perdón por todo lo que te hizo desde niños${d.odio ? ', aunque tú tampoco fuiste un santo' : ''}.</p>`, [
        op('Visitarl' + gx({ genero: d.g }, 'o', 'a') + ' y perdonar', () => { mod({ felicidad: 15, karma: 8, estres: -15 }); log(`↩️ Perdonaste a ${n} antes de que muriera. Cerraste un ciclo de toda una vida.`, 'raro'); }),
        op('No responder', () => { mod({ felicidad: -4 }); log(`↩️ No respondiste a la carta de ${n}.`); }),
      ]);
    }
  },
  amor_perdido(d, p) {
    const g = d.g, pa = pareja();
    Historias.modal('💞', 'Un reencuentro', `<p>En un aeropuerto alguien dice tu nombre. Es <b>${d.n}</b>, tu primer amor del colegio. Sigue igual de encantador${gx({ genero: g }, '', 'a')}… y no tiene pareja.</p>${pa ? `<p>Pero tú estás con ${pa.nombre}.</p>` : ''}`, [
      op(pa ? 'Tomar un café "solo como amigos"' : '¿Tomamos un café?', () => {
        const c = Estado.persona({ tipo: 'pareja', genero: g, edad: p.edad + R.int(-1, 1), nombre: d.n.split(' ')[0] });
        c.cercania = R.int(70, 90); c.anios = 0; c.apa = d.apa || c.apa;
        if (pa) {
          mod({ karma: -4 });
          if (R.chance(0.4)) { log(`↩️ ${pa.nombre} se enteró de tus encuentros con ${c.nombre}.`, 'malo'); if (pa.tipo === 'conyuge') Relaciones.divorcio(pa, true); else Relaciones.terminar(pa, true); }
          else { log(`↩️ Viste a escondidas a ${c.nombre}. La chispa sigue ahí.`, 'raro'); return; }
        }
        if (!pareja()) { p.rel.push(c); p.cont.parejas++; log(`↩️ 💕 Volviste a enamorarte de ${c.nombre}, tu primer amor.`, 'raro'); Efectos.celebrar('💞', 'Segundas oportunidades', `<p>Tú y ${c.nombre} vuelven a estar juntos, años después.</p>`); }
      }),
      op('Saludar y seguir mi camino', () => { mod({ felicidad: 2 }); log(`↩️ Te cruzaste con ${d.n}, tu primer amor. Solo un saludo.`); }),
    ]);
  },
  mentor(d, p) {
    const m = Math.round(R.int(20000, 200000) * Math.max(eco(), 0.5));
    p.dinero += m; mod({ felicidad: -6, inteligencia: 3 });
    Historias.modal('📜', 'El testamento de tu mentor', `<p>Tu antiguo mentor murió. Te dejó <b>${fmt$(m)}</b> y una carta:</p><p><i>"Vi en ti algo que tú no veías. No desperdicies tu talento."</i></p>`, [op('Honrar su memoria', () => mod({ karma: 3, felicidad: 4 }))]);
    log(`↩️ Tu mentor te dejó ${fmt$(m)} en su testamento.`, 'bueno');
  },
  testigo(d, p) {
    Historias.modal('⚖️', 'Testigo clave', '<p>La fiscalía te cita: aquel "club de inversión" que denunciaste estafó a miles de personas. Tu testimonio puede hundir a sus líderes.</p>', [
      op('Testificar', () => { mod({ karma: 8, fama: 4, estres: 6 }); log('↩️ Tu testimonio llevó a prisión a los cabecillas de la estafa piramidal.', 'raro'); Noticias.emitir(`Condenan a los cabecillas de una estafa piramidal gracias a un testigo clave: ${p.nombre} ${p.apellido}.`); if (R.chance(0.3)) Historias.sembrar('amenaza', {}, R.int(1, 3)); }),
      op('Negarme por miedo', () => { mod({ karma: -3 }); log('↩️ Te negaste a testificar. Los estafadores quedaron libres.', 'malo'); }),
    ]);
  },
  amenaza(d, p) {
    Historias.modal('✉️', 'Una amenaza', '<p>Aparece una nota anónima en tu puerta: "Sabemos dónde vives". Viene de los estafadores que ayudaste a encarcelar.</p>', [
      op('Ir a la policía', () => { mod({ estres: 5 }); log('↩️ La policía puso vigilancia en tu casa.'); }),
      op('Mudarme de inmediato', () => { p.dinero -= Math.round(3000 * eco()); mod({ estres: -4 }); log('↩️ Te mudaste para estar a salvo.'); }),
      op('Ignorarla', () => { if (R.chance(0.2)) { mod({ salud: -15 }); log('↩️ Te atacaron al salir de casa.', 'malo'); } else log('↩️ No pasó nada más.'); }),
    ]);
  },
  hijo_agradece(d, p) {
    const h = p.rel.find(r => r.id === d.id && r.vivo); if (!h) return;
    h.cercania = clamp(h.cercania + 15); mod({ felicidad: 12 });
    Historias.modal('🎓', `El discurso de ${h.nombre}`, `<p>En su graduación, <b>${h.nombre}</b> toma el micrófono: "Todo se lo debo a ${gx(p, 'mi papá', 'mi mamá')}, que me escuchó cuando más lo necesitaba."</p>`, [op('Llorar de orgullo', () => {})]);
    log(`↩️ ${h.nombre} te dedicó su graduación.`, 'raro');
  },
  hijo_problemas(d, p) {
    const h = p.rel.find(r => r.id === d.id && r.vivo); if (!h) return;
    Historias.modal('🚓', `${h.nombre} en problemas`, `<p><b>${h.nombre}</b> fue detenid${gx(h, 'o', 'a')} por pelear en la calle. Te llama desde la comisaría.</p>`, [
      op(`Pagarle un buen abogado (${fmt$(10000 * eco())})`, () => { p.dinero -= Math.round(10000 * eco()); h.cercania = clamp(h.cercania + 10); log(`↩️ Sacaste a ${h.nombre} de la comisaría.`); }),
      op('Que aprenda la lección', () => { h.cercania = clamp(h.cercania - 15); log(`↩️ Dejaste que ${h.nombre} enfrentara las consecuencias.`); }),
      op('Hablar en serio con ' + gx(h, 'él', 'ella'), () => { h.cercania = clamp(h.cercania + 5); mod({ karma: 2 }); log(`↩️ Tuviste una conversación profunda con ${h.nombre}.`); }),
    ]);
  },
  voluntario(d, p) {
    mod({ felicidad: 12, karma: 5 });
    Historias.modal('🏠', 'Una visita inesperada', '<p>Una joven médica toca tu puerta. Su familia vivió en una de las casas que construiste como voluntari' + gx(p, 'o', 'a') + ' hace años. "Gracias a ese techo pude estudiar. Quería conocerte."</p>', [op('Abrazarla', () => {})]);
    log('↩️ Conociste a alguien cuya vida cambió gracias a tu voluntariado.', 'raro');
  },
  meme(d, p) {
    Historias.modal('📱', 'Eres un meme', `<p>Un clip tuyo del reality show resurgió y se volvió <b>el meme del año</b>. Millones lo comparten.</p>`, [
      op('Aprovecharlo: lanzar mercancía', () => { const m = Math.round(R.int(20000, 200000) * Math.max(eco(), 0.5)); p.dinero += m; mod({ fama: 8 }); log(`↩️ Vendiste camisetas con tu propio meme: ${fmt$(m)}.`, 'raro'); }),
      op('Esconderme hasta que pase', () => { mod({ felicidad: -5, fama: 4 }); }),
    ]);
  },
  serie_sobre_ti(d, p) {
    mod({ fama: 25 });
    Estado.darLogro('serie');
    Noticias.emitir(`Una plataforma estrena «${d.apodo}», la serie sobre ${p.nombre} ${p.apellido}. Es la más vista del mundo.`, { modal: true, ic: '🎬', cuerpo: `<p>La serie basada en tu vida es un fenómeno: memes, disfraces, debates en todos los programas.</p><p class="nota">Por ley no puedes cobrar por tu historia, pero recibes miles de cartas al mes.</p>` });
  },
  serie_detective(d, p) {
    mod({ fama: 15 }); const m = Math.round(R.int(50000, 300000) * Math.max(eco(), 0.5)); p.dinero += m;
    Noticias.emitir(`Estrenan una docuserie sobre cómo ${p.nombre} ${p.apellido} atrapó a ${d.apodo}.`, { modal: true, ic: '🎬', cuerpo: `<p>Te pagaron <b>${fmt$(m)}</b> por los derechos de tu historia.</p>` });
  },
};
