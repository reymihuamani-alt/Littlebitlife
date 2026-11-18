'use strict';
/* =========================================================
   EVENTOS ALEATORIOS CON DECISIONES
   Cada evento: rango de edad, probabilidad, condición y efecto.
   ========================================================= */
const op = (t, fn) => ({ t, fn });
const EVENTOS = [
  /* ---------- Infancia ---------- */
  { id: 'perro', edad: [5, 14], p: 0.05, fn: p => Modal.mostrar({ ic: '🐕', titulo: 'Un perrito callejero', texto: '<p>Un perro flaco te sigue hasta tu casa moviendo la cola.</p>', opciones: [
    op('Pedirles a mis padres quedármelo', () => { if (R.chance(0.55)) { p.mascotas.push({ id: uid(), t: 'Perro', ic: '🐕', nombre: R.pick(NOMBRES_MASCOTA), edad: 1, vida: R.int(10, 15), vivo: true }); log('🐕 ¡Tus padres te dejaron quedarte con el perrito!', 'bueno'); mod({ felicidad: 10, karma: 3 }); } else { log('Tus padres no te dejaron quedarte con el perro.', 'malo'); mod({ felicidad: -5 }); } }),
    op('Darle algo de comer', () => { mod({ karma: 3, felicidad: 3 }); log('Le diste comida a un perro callejero.'); }),
    op('Ignorarlo', () => mod({ karma: -1 })),
  ] }) },
  { id: 'bully', edad: [7, 16], p: 0.07, fn: p => { const g = R.chance(0.5) ? 'M' : 'F', n = `${R.pick(NOMBRES[g])} ${R.pick(APELLIDOS)}`; if (!p.vistos.nemesis) { p.vistos.nemesis = 1; Historias.sembrar('nemesis', { n, g, paso: 1 }, R.int(3, 6)); } Modal.mostrar({ ic: '😠', titulo: 'Te molestan en el colegio', texto: `<p>${n}, de tu salón, se burla de ti todos los días.</p>`, opciones: [
    op('Enfrentarlo', () => { if (R.chance(p.st.salud / 130)) { log('Enfrentaste a quien te molestaba y te dejó en paz.', 'bueno'); mod({ felicidad: 6 }); } else { log('Intentaste defenderte, pero terminaste con un ojo morado.', 'malo'); mod({ salud: -5, felicidad: -6 }); } }),
    op('Contárselo a un profesor', () => { log('Le contaste al profesor y el acoso se detuvo.', 'bueno'); mod({ felicidad: 3 }); }),
    op('Ignorarlo', () => { mod({ felicidad: -5, estres: 6 }); log('Aguantaste las burlas en silencio.', 'malo'); }),
    op('Burlarme de vuelta', () => { mod({ karma: -2 }); if (R.chance(0.5)) { log('Tu respuesta hizo reír a toda la clase.', 'bueno'); mod({ felicidad: 4 }); } else log('La situación empeoró.', 'malo'); }),
  ] }); } },
  { id: 'talentos', edad: [6, 16], p: 0.05, fn: p => Modal.mostrar({ ic: '🎤', titulo: 'Concurso de talentos', texto: '<p>Tu colegio organiza un concurso de talentos. ¿Qué presentas?</p>', opciones: [
    ...[['🎶 Cantar', 'felicidad'], ['💃 Bailar', 'salud'], ['😂 Contar chistes', 'inteligencia']].map(([t, s]) => op(t, () => { if (R.chance(p.st[s] / 140 + p.st.apariencia / 400)) { log(`🏆 ¡Ganaste el concurso de talentos ${t.slice(t.indexOf(' ') + 1).toLowerCase()}!`, 'bueno'); mod({ felicidad: 10, fama: 3 }); } else { log('No ganaste el concurso de talentos, pero te divertiste.'); mod({ felicidad: 2 }); } })),
    op('No participar', () => {}),
  ] }) },
  { id: 'divorcioPadres', edad: [3, 17], p: 0.025, once: true, cond: () => personas('padre').length && personas('madre').length, fn: p => {
    const [pa, ma] = [personas('padre')[0], personas('madre')[0]];
    mod({ felicidad: -12, estres: 8 });
    Modal.mostrar({ ic: '💔', titulo: 'Tus padres se divorcian', texto: '<p>Después de muchas peleas, tus padres decidieron separarse. ¿Con quién quieres vivir?</p>', opciones: [
      op(`Con mi padre, ${pa.nombre}`, () => { pa.cercania = clamp(pa.cercania + 10); ma.cercania = clamp(ma.cercania - 10); log('Tus padres se divorciaron. Te fuiste a vivir con tu padre.', 'malo'); }),
      op(`Con mi madre, ${ma.nombre}`, () => { ma.cercania = clamp(ma.cercania + 10); pa.cercania = clamp(pa.cercania - 10); log('Tus padres se divorciaron. Te fuiste a vivir con tu madre.', 'malo'); }),
    ] });
  } },
  { id: 'regaloAbuela', edad: [4, 15], p: 0.05, fn: p => { const m = Math.round(R.int(20, 200) * eco()); Modal.mostrar({ ic: '👵', titulo: 'Un regalo de tu abuela', texto: `<p>Tu abuela te mandó ${fmt$(m)} por tu cumpleaños.</p>`, opciones: [
    op('Ahorrarlo', () => { p.dinero += m; log(`Ahorraste los ${fmt$(m)} que te regaló tu abuela.`); }),
    op('Gastarlo en dulces y juguetes', () => { mod({ felicidad: 6, salud: -1 }); log('Te gastaste el regalo de tu abuela en dulces.'); }),
  ] }); } },
  { id: 'hermanoJuguete', edad: [4, 13], p: 0.05, cond: () => personas('hermano').length, fn: p => { const h = R.pick(personas('hermano')); Modal.mostrar({ ic: '🧸', titulo: 'Tu juguete favorito', texto: `<p>${h.nombre} rompió tu juguete favorito.</p>`, opciones: [
    op('Perdonarl' + gx(h, 'o', 'a'), () => { h.cercania = clamp(h.cercania + 8); mod({ karma: 2 }); }),
    op('Pelear', () => { h.cercania = clamp(h.cercania - 10); mod({ felicidad: -2 }); log(`Te peleaste con ${h.nombre}.`, 'malo'); }),
    op('Acusarl' + gx(h, 'o', 'a') + ' con mamá', () => { h.cercania = clamp(h.cercania - 5); log(`Acusaste a ${h.nombre} y l${gx(h, 'o', 'a')} castigaron.`); }),
  ] }); } },
  /* ---------- Adolescencia ---------- */
  { id: 'alcoholFiesta', edad: [14, 19], p: 0.08, fn: p => Modal.mostrar({ ic: '🍺', titulo: 'En una fiesta', texto: '<p>Te ofrecen una cerveza en la fiesta de un amigo.</p>', opciones: [
    op('Aceptar', () => { p.adic.alcohol = clamp(p.adic.alcohol + 10); mod({ felicidad: 5 }); if (R.chance(0.25)) { log('Tomaste de más y tus padres te encontraron borrach' + gx(p, 'o', 'a') + '.', 'malo'); personas('padre', 'madre').forEach(x => x.cercania = clamp(x.cercania - 10)); } else log('Tomaste unas cervezas en la fiesta.'); }),
    op('Rechazarla', () => { mod({ karma: 1 }); log('Rechazaste el alcohol en la fiesta.'); }),
    op('Irme de la fiesta', () => mod({ felicidad: -2 })),
  ] }) },
  { id: 'cigarro', edad: [13, 20], p: 0.06, fn: p => Modal.mostrar({ ic: '🚬', titulo: 'Un cigarro', texto: '<p>Unos chicos mayores te ofrecen un cigarro.</p>', opciones: [
    op('Probarlo', () => { p.adic.tabaco = clamp(p.adic.tabaco + 15); log('Probaste tu primer cigarro.', 'malo'); }),
    op('No, gracias', () => log('Rechazaste el cigarro.')),
  ] }) },
  { id: 'primerAmor', edad: [12, 17], p: 0.07, cond: () => !pareja(), fn: p => { const c = Estado.persona({ tipo: 'pareja', edad: p.edad, genero: R.chance(0.5) ? 'M' : 'F' }); c.profesion = 'Estudiante'; c.dinero = 0; Modal.mostrar({ ic: '💌', titulo: 'Mariposas en el estómago', texto: `<p>Te gusta ${c.nombre}, de tu colegio.</p>`, opciones: [
    op('Declararme', () => { if (R.chance(0.35 + (p.st.apariencia - c.apa) / 150)) { c.cercania = 70; c.anios = 0; p.rel.push(c); p.cont.parejas++; log(`💕 ¡${c.nombre} aceptó ser tu pareja!`, 'bueno'); mod({ felicidad: 12 }); } else { log(`${c.nombre} te rechazó frente a todos.`, 'malo'); mod({ felicidad: -10 }); Historias.sembrar('amor_perdido', { n: c.nombre, g: c.genero, apa: c.apa }, R.int(12, 25)); } }),
    op('Escribirle una carta anónima', () => { mod({ felicidad: 2 }); log(`Le escribiste una carta anónima a ${c.nombre}.`); Historias.sembrar('amor_perdido', { n: c.nombre, g: c.genero, apa: c.apa }, R.int(12, 25)); }),
    op('Guardármelo', () => {}),
  ] }); } },
  { id: 'ciberacoso', edad: [12, 19], p: 0.05, fn: p => Modal.mostrar({ ic: '📱', titulo: 'Ciberacoso', texto: '<p>Alguien publicó una foto vergonzosa tuya en redes sociales.</p>', opciones: [
    op('Reportarla y hablar con un adulto', () => { mod({ estres: -2 }); log('Reportaste la publicación y la eliminaron.', 'bueno'); }),
    op('Responder con insultos', () => { mod({ karma: -3, estres: 5 }); log('Discutiste en redes y todo empeoró.', 'malo'); }),
    op('Ignorarlo', () => { mod({ felicidad: -6 }); }),
  ] }) },
  { id: 'examen', edad: [12, 17], p: 0.06, fn: p => Modal.mostrar({ ic: '📝', titulo: 'Examen final mañana', texto: '<p>Mañana tienes un examen importante y no has estudiado.</p>', opciones: [
    op('Estudiar toda la noche', () => { p.edu.notas = clamp(p.edu.notas + 6); mod({ salud: -2, estres: 5 }); }),
    op('Dormir bien y confiar en mí', () => { p.edu.notas = clamp(p.edu.notas + (p.st.inteligencia > 60 ? 4 : -4)); }),
    op('Preparar un plagio', () => { if (R.chance(0.6)) p.edu.notas = clamp(p.edu.notas + 8); else { p.edu.notas = clamp(p.edu.notas - 15); log('Te atraparon con un plagio en el examen.', 'malo'); } mod({ karma: -3 }); }),
  ] }) },
  { id: 'tatuaje', edad: [16, 30], p: 0.03, fn: p => Modal.mostrar({ ic: '🖋️', titulo: 'Un tatuaje', texto: '<p>Tus amigos se van a tatuar. ¿Te animas?</p>', opciones: [
    op('Sí, un tatuaje pequeño', () => { mod({ felicidad: 4 }); log('Te hiciste un tatuaje.'); }),
    op('¡Uno enorme en la cara!', () => { mod({ felicidad: 3, apariencia: -8, fama: 1 }); log('Te tatuaste la cara. Tu familia no lo puede creer.', 'raro'); }),
    op('No', () => {}),
  ] }) },
  /* ---------- Adultez ---------- */
  { id: 'billetera', edad: [10, 90], p: 0.04, fn: p => { const m = Math.round(R.int(50, 900) * eco()); Modal.mostrar({ ic: '👛', titulo: 'Una billetera en la calle', texto: `<p>Encuentras una billetera con ${fmt$(m)} y un documento de identidad.</p>`, opciones: [
    op('Devolverla a su dueño', () => { mod({ karma: 6, felicidad: 3 }); Historias.sembrar('billetera_devuelta', { n: `${R.pick(NOMBRES.M.concat(NOMBRES.F))} ${R.pick(APELLIDOS)}` }, R.int(6, 18)); if (R.chance(0.4)) { const r = Math.round(m * 0.3); p.dinero += r; log(`Devolviste la billetera y el dueño te dio ${fmt$(r)} de recompensa.`, 'bueno'); } else log('Devolviste la billetera a su dueño.', 'bueno'); }),
    op('Quedarme el dinero', () => { p.dinero += m; mod({ karma: -6 }); Historias.sembrar('billetera_robada', {}, R.int(2, 8)); log(`Te quedaste con ${fmt$(m)} de una billetera ajena.`, 'malo'); }),
    op('Llevarla a la policía', () => { mod({ karma: 4 }); log('Llevaste la billetera a la comisaría.'); }),
  ] }); } },
  { id: 'prestamoAmigo', edad: [20, 80], p: 0.05, cond: () => personas('amigo').length && S.p.dinero > 2000, fn: p => { const a = R.pick(personas('amigo')); const m = Math.round(Math.min(p.dinero * 0.3, R.int(500, 8000) * eco())); Modal.mostrar({ ic: '🤝', titulo: 'Un favor', texto: `<p>Tu amig${gx(a, 'o', 'a')} ${a.nombre} te pide prestado ${fmt$(m)}. Promete devolverlo.</p>`, opciones: [
    op('Prestárselo', () => { p.dinero -= m; if (R.chance(0.55)) { p.dinero += m; a.cercania = clamp(a.cercania + 10); log(`${a.nombre} te devolvió el préstamo. Su amistad es más fuerte.`, 'bueno'); } else { a.cercania = clamp(a.cercania - 15); log(`${a.nombre} nunca te devolvió los ${fmt$(m)}.`, 'malo'); Historias.sembrar('amigo_deudor', { n: a.nombre, g: a.genero }, R.int(5, 15)); } }),
    op('Decirle que no', () => { a.cercania = clamp(a.cercania - 8); }),
  ] }); } },
  { id: 'piramide', edad: [20, 75], p: 0.04, cond: () => S.p.dinero > 3000, fn: p => Modal.mostrar({ ic: '📈', titulo: '¡Inversión garantizada!', texto: '<p>Un conocido te ofrece entrar a un "club de inversión" que paga 50% mensual. Solo necesitas traer a dos amigos más.</p>', opciones: [
    op('Invertir la mitad de mis ahorros', () => { const m = Math.round(p.dinero / 2); p.dinero -= m; if (R.chance(0.1)) { p.dinero += m * 3; log(`Entraste temprano al esquema y sacaste ${fmt$(m * 2)} de ganancia antes de que colapsara.`, 'raro'); mod({ karma: -5 }); } else { log(`💸 Era una estafa piramidal. Perdiste ${fmt$(m)}.`, 'malo'); mod({ felicidad: -12 }); } }),
    op('Rechazarlo', () => log('Rechazaste una oferta que parecía demasiado buena para ser verdad.')),
    op('Denunciarlo a la policía', () => { mod({ karma: 4 }); log('Denunciaste una estafa piramidal.', 'bueno'); Historias.sembrar('testigo', {}, R.int(1, 3)); }),
  ] }) },
  { id: 'asalto', edad: [14, 85], p: 0.04, fn: p => Modal.mostrar({ ic: '🔪', titulo: '¡Un asalto!', texto: '<p>Un ladrón te amenaza en la calle y te pide tus cosas.</p>', opciones: [
    op('Entregarle todo', () => { const m = Math.min(Math.max(0, p.dinero), Math.round(R.int(20, 400) * eco())); p.dinero -= m; mod({ felicidad: -6, estres: 8 }); log(m > 0 ? `Te asaltaron y te robaron ${fmt$(m)} y el celular.` : 'Te asaltaron y te robaron el celular.', 'malo'); }),
    op('Resistirme', () => { if (R.chance(p.st.salud / 200 + (p.esp.luchador ? 0.3 : 0))) { mod({ felicidad: 6 }); log('Te defendiste y el ladrón huyó.', 'raro'); } else { mod({ salud: -R.int(10, 30) }); log('Te resististe y saliste herid' + gx(p, 'o', 'a') + '.', 'malo'); if (R.chance(0.03)) Vida.morir('un asalto a mano armada'); } }),
    op('Correr', () => { if (R.chance(0.6)) log('Corriste y lograste escapar del asaltante.'); else { mod({ salud: -8 }); log('Te alcanzó y te golpeó.', 'malo'); } }),
  ] }) },
  { id: 'herenciaTio', edad: [20, 70], p: 0.008, once: true, fn: p => { const m = Math.round(R.int(10000, 400000) * eco()); p.dinero += m; log(`📜 Un tío lejano que casi no conocías te dejó una herencia de ${fmt$(m)}.`, 'raro'); aviso('Herencia inesperada', `<p>Recibiste ${fmt$(m)}.</p>`, '📜'); } },
  { id: 'pandemia', edad: [0, 120], p: 0.012, once: true, fn: p => {
    log('🦠 Una pandemia mundial paraliza el planeta.', 'malo');
    if (p.trabajo && R.chance(0.2)) Trabajo.dejar('Perdiste tu trabajo durante la pandemia.', 'malo');
    p.inv.acciones = Math.round(p.inv.acciones * 0.75);
    Modal.mostrar({ ic: '🦠', titulo: 'Pandemia', texto: '<p>Hay cuarentena obligatoria y un virus respiratorio se expande. ¿Qué haces?</p>', opciones: [
      op('Quedarme en casa y vacunarme', () => { mod({ felicidad: -6 }); log('Te cuidaste durante la pandemia.'); }),
      op('Seguir mi vida como si nada', () => { if (R.chance(0.4)) { Salud.contraer('Neumonía'); log('Te contagiaste del virus y terminaste con neumonía.', 'malo'); } else log('Tuviste suerte y no te contagiaste.'); }),
    ] });
  } },
  { id: 'terremoto', edad: [0, 120], p: 0.015, cond: () => pais().sismos, fn: p => {
    log(`🌋 Un fuerte terremoto sacudió ${p.pais}.`, 'malo');
    for (const b of p.bienes.filter(b => b.tipo === 'casa')) if (R.chance(0.3)) { b.valor = Math.round(b.valor * 0.7); log(`Tu ${b.n} sufrió daños.`, 'malo'); }
    if (R.chance(0.15)) { mod({ salud: -R.int(10, 25) }); log('Resultaste herid' + gx(p, 'o', 'a') + ' durante el sismo.', 'malo'); }
    mod({ estres: 10 });
  } },
  { id: 'ofertaExtranjero', edad: [24, 55], p: 0.03, cond: () => S.p.trabajo, fn: p => { const destino = R.pick(Object.keys(PAISES).filter(x => x !== p.pais)); Modal.mostrar({ ic: '✈️', titulo: 'Oferta internacional', texto: `<p>Una empresa de ${destino} ${PAISES[destino].bandera} te ofrece un puesto similar al tuyo. ¿Te mudas?</p>`, opciones: [
    op(`Mudarme a ${destino}`, () => Actividades.emigrarA(destino, true)),
    op('Quedarme', () => {}),
  ] }); } },
  { id: 'vecino', edad: [18, 90], p: 0.04, cond: () => !viveConPadres(), fn: p => Modal.mostrar({ ic: '🔊', titulo: 'Vecino ruidoso', texto: '<p>Tu vecino pone música a todo volumen a las 3 a. m.</p>', opciones: [
    op('Hablar amablemente con él', () => { if (R.chance(0.6)) log('Hablaste con tu vecino y bajó el volumen.', 'bueno'); else log('Tu vecino te cerró la puerta en la cara.', 'malo'); }),
    op('Llamar a la policía', () => log('Llamaste a la policía por los ruidos.')),
    op('Poner mi música más fuerte', () => { mod({ karma: -2, felicidad: 2 }); log('Empezó una guerra musical con tu vecino.'); }),
  ] }) },
  { id: 'reunion', edad: [35, 65], p: 0.03, fn: p => Modal.mostrar({ ic: '🎓', titulo: 'Reunión de exalumnos', texto: '<p>Te invitan a la reunión de exalumnos de tu colegio.</p>', opciones: [
    op('Ir y presumir mis logros', () => { mod({ felicidad: patrimonio() > 2e5 ? 6 : -4 }); log('Fuiste a la reunión de exalumnos.'); }),
    op('Ir y reconectar con viejos amigos', () => { mod({ felicidad: 4 }); if (R.chance(0.5)) Relaciones.nuevoAmigo('en la reunión de exalumnos'); }),
    op('No ir', () => {}),
  ] }) },
  { id: 'crisisMediana', edad: [40, 52], p: 0.05, once: true, fn: p => Modal.mostrar({ ic: '🪞', titulo: 'Crisis de la mediana edad', texto: '<p>Te miras al espejo y sientes que la vida se te escapa.</p>', opciones: [
    op('Comprarme un auto deportivo', () => { const c = Math.round(120000 * Math.max(eco(), 0.7)); if (p.dinero > c) { p.dinero -= c; p.bienes.push({ id: uid(), tipo: 'auto', n: 'Deportivo de la crisis', ic: '🏎️', valor: c, compra: c }); mod({ felicidad: 10 }); log('Te compraste un auto deportivo. Te sientes joven otra vez.', 'raro'); } else { mod({ felicidad: -4 }); log('Quisiste comprarte un deportivo, pero no te alcanzó.'); } }),
    op('Hacer un viaje para reencontrarme', () => { p.cont.viajes++; mod({ felicidad: 8, estres: -15 }); p.dinero -= Math.round(4000 * eco()); log('Hiciste un viaje de autodescubrimiento.', 'bueno'); }),
    op('Ir a terapia', () => { mod({ felicidad: 5, estres: -10 }); log('La terapia te ayudó a aceptar el paso del tiempo.', 'bueno'); }),
    op('Aceptarlo y seguir', () => mod({ felicidad: 1 })),
  ] }) },
  { id: 'estafaTel', edad: [55, 110], p: 0.05, cond: () => S.p.dinero > 1000, fn: p => Modal.mostrar({ ic: '📞', titulo: 'Llamada del "banco"', texto: '<p>Te llaman diciendo que son del banco y que necesitan tu clave para "proteger tu cuenta".</p>', opciones: [
    op('Darles la clave', () => { const m = Math.round(p.dinero * R.float(0.2, 0.6)); p.dinero -= m; mod({ felicidad: -12 }); log(`💸 Era una estafa telefónica. Te vaciaron ${fmt$(m)} de la cuenta.`, 'malo'); }),
    op('Colgar y llamar al banco directamente', () => { mod({ inteligencia: 1 }); log('Detectaste una estafa telefónica a tiempo.', 'bueno'); }),
  ] }) },
  { id: 'caida', edad: [70, 120], p: 0.06, fn: p => { mod({ salud: -R.int(5, 18) }); log('🦴 Te caíste en casa y te lastimaste la cadera.', 'malo'); } },
  { id: 'sorteoViaje', edad: [18, 90], p: 0.02, fn: p => Modal.mostrar({ ic: '🏝️', titulo: '¡Ganaste un sorteo!', texto: '<p>Ganaste un viaje todo pagado al Caribe.</p>', opciones: [
    op('¡Ir de viaje!', () => { p.cont.viajes++; mod({ felicidad: 12, estres: -15 }); log('🏝️ Disfrutaste un viaje gratis al Caribe.', 'bueno'); }),
    op('Venderlo', () => { const m = Math.round(3000 * eco()); p.dinero += m; log(`Vendiste el viaje por ${fmt$(m)}.`); }),
  ] }) },
  { id: 'jefeToxico', edad: [18, 70], p: 0.04, cond: () => S.p.trabajo, fn: p => Modal.mostrar({ ic: '😤', titulo: 'Jefe tóxico', texto: '<p>Tu jefe te humilla delante de tus compañeros.</p>', opciones: [
    op('Denunciarlo en Recursos Humanos', () => { if (R.chance(0.5)) { log('RR.HH. sancionó a tu jefe.', 'bueno'); mod({ felicidad: 5 }); } else { p.trabajo.desempeno = clamp(p.trabajo.desempeno - 15); log('RR.HH. no hizo nada y tu jefe ahora te tiene en la mira.', 'malo'); } }),
    op('Aguantar', () => mod({ estres: 10, felicidad: -5 })),
    op('Renunciar en ese mismo momento', () => { Trabajo.dejar('Renunciaste en el acto tras la humillación de tu jefe.'); mod({ felicidad: 4 }); }),
  ] }) },
  { id: 'inspeccion', edad: [18, 100], p: 0.06, cond: () => S.p.negocios.length, fn: p => { const n = R.pick(p.negocios); const multa = Math.round(n.capital * R.float(0.03, 0.1)); Modal.mostrar({ ic: '🧾', titulo: 'Inspección tributaria', texto: `<p>Un inspector encontró irregularidades en ${esc(n.nombre)}. Multa: ${fmt$(multa)}.</p>`, opciones: [
    op('Pagar la multa', () => { p.dinero -= multa; log(`Pagaste una multa de ${fmt$(multa)}.`); }),
    op(`Sobornar al inspector (${fmt$(multa * 0.3)})`, () => { p.dinero -= Math.round(multa * 0.3); mod({ karma: -5 }); if (R.chance(0.25)) { log('El inspector te denunció por intento de soborno.', 'malo'); Crimen.arrestar('cohecho', [1, 4]); } else log('El inspector aceptó el soborno.', 'malo'); }),
    op('Pelearlo en tribunales', () => { const c = Math.round(multa * 0.2); p.dinero -= c; if (R.chance(0.45)) log('Ganaste el caso contra la administración tributaria.', 'bueno'); else { p.dinero -= multa * 1.5; log('Perdiste el juicio y la multa aumentó.', 'malo'); } }),
  ] }); } },
  { id: 'paparazzi', edad: [16, 100], p: 0.08, cond: () => S.p.st.fama >= 50, fn: p => Modal.mostrar({ ic: '📸', titulo: 'Paparazzis', texto: '<p>Un grupo de fotógrafos te persigue a la salida de un restaurante.</p>', opciones: [
    op('Sonreír y posar', () => { mod({ fama: 2 }); }),
    op('Taparme la cara y huir', () => mod({ estres: 5 })),
    op('Romperle la cámara a uno', () => { mod({ fama: 4, karma: -4 }); if (R.chance(0.4)) Crimen.arrestar('daños y agresión', [0, 1]); else log('Rompiste la cámara de un paparazzi. Es tendencia.', 'raro'); }),
  ] }) },
  { id: 'reality', edad: [18, 60], p: 0.04, cond: () => S.p.st.fama >= 25 && S.p.st.fama < 75, fn: p => { const m = Math.round(R.int(20000, 150000) * Math.max(eco(), 0.5)); Modal.mostrar({ ic: '📺', titulo: 'Reality show', texto: `<p>Te invitan a un reality show de convivencia. Pagan ${fmt$(m)}.</p>`, opciones: [
    op('Aceptar', () => { p.dinero += m; mod({ fama: R.int(5, 15), felicidad: R.int(-5, 8), estres: 8 }); log(`📺 Participaste en un reality show y ganaste ${fmt$(m)}.`, 'raro'); if (R.chance(0.6)) Historias.sembrar('meme', {}, R.int(3, 10)); }),
    op('Rechazar', () => {}),
  ] }); } },
  { id: 'mentor', edad: [18, 32], p: 0.03, fn: p => Modal.mostrar({ ic: '🧓', titulo: 'Un mentor', texto: '<p>Una persona muy exitosa se ofrece a ser tu mentor.</p>', opciones: [
    op('Aceptar con gratitud', () => { mod({ inteligencia: R.int(3, 7), felicidad: 4 }); Historias.sembrar('mentor', {}, R.int(12, 30)); if (p.trabajo) p.trabajo.desempeno = clamp(p.trabajo.desempeno + 15); log('Aprendiste muchísimo de tu nuevo mentor.', 'bueno'); }),
    op('Rechazar: prefiero aprender solo', () => {}),
  ] }) },
  { id: 'hijoSuspendido', edad: [30, 70], p: 0.05, cond: () => hijos().some(h => h.edad >= 12 && h.edad <= 18), fn: p => { const h = R.pick(hijos().filter(h => h.edad >= 12 && h.edad <= 18)); Modal.mostrar({ ic: '🏫', titulo: 'Llamada del colegio', texto: `<p>Suspendieron a ${h.nombre} por pelearse en clase.</p>`, opciones: [
    op('Hablar con calma', () => { h.cercania = clamp(h.cercania + 6); log(`Hablaste con ${h.nombre} sobre lo que pasó.`); Historias.sembrar('hijo_agradece', { id: h.id }, R.int(4, 9)); }),
    op('Castigarl' + gx(h, 'o', 'a') + ' sin celular un mes', () => { h.cercania = clamp(h.cercania - 8); log(`Castigaste a ${h.nombre}.`); if (R.chance(0.5)) Historias.sembrar('hijo_problemas', { id: h.id }, R.int(3, 7)); }),
    op('Restarle importancia', () => { h.cercania = clamp(h.cercania + 2); mod({ karma: -1 }); Historias.sembrar('hijo_problemas', { id: h.id }, R.int(3, 7)); }),
  ] }); } },
  { id: 'familiarDinero', edad: [25, 100], p: 0.05, cond: () => patrimonio() > 1e6, fn: p => { const m = Math.round(R.int(5000, 50000) * Math.max(eco(), 0.5)); Modal.mostrar({ ic: '🙏', titulo: 'Un pariente necesitado', texto: `<p>Un primo al que no ves hace años te pide ${fmt$(m)} para "un negocio seguro".</p>`, opciones: [
    op('Dárselo', () => { p.dinero -= m; mod({ karma: 3 }); log(`Le diste ${fmt$(m)} a tu primo.`); }),
    op('Negarme', () => mod({ karma: -1 })),
  ] }); } },
  { id: 'voluntariado', edad: [12, 90], p: 0.03, fn: p => Modal.mostrar({ ic: '🤲', titulo: 'Voluntariado', texto: '<p>Una ONG busca voluntarios para construir casas en una zona afectada por un huaico.</p>', opciones: [
    op('Ofrecerme como voluntario', () => { mod({ karma: 6, felicidad: 5, salud: -1 }); Historias.sembrar('voluntario', {}, R.int(8, 20)); log('Fuiste voluntari' + gx(p, 'o', 'a') + ' construyendo casas.', 'bueno'); }),
    op('Donar en lugar de ir', () => { const m = Math.round(100 * eco()); p.dinero -= m; p.cont.donado += m; mod({ karma: 2 }); }),
    op('No tengo tiempo', () => {}),
  ] }) },
  { id: 'loteriaRegalo', edad: [18, 100], p: 0.015, fn: p => { const m = Math.round(R.int(1000, 25000) * eco()); p.dinero += m; log(`🎁 Ganaste ${fmt$(m)} en un sorteo del supermercado.`, 'bueno'); } },
  /* ---------- Hallazgos raros ---------- */
  { id: 'atico', edad: [6, 17], p: 0.02, once: true, fn: p => Modal.mostrar({ ic: '📦', titulo: 'El ático de los abuelos', texto: '<p>Visitando a tus abuelos subes al ático. Entre telarañas hay un baúl viejo cerrado.</p>', opciones: [
    op('Abrir el baúl', () => { const rz = R.peso([[45, 'comun'], [35, 'raro'], [16, 'epico'], [4, 'legendario']]); Coleccion.encontrar(Coleccion.idDeRareza(rz), 'en el baúl del ático de tus abuelos'); }),
    op('Mejor no tocar nada', () => {}),
  ] }) },
  { id: 'cartasInfancia', edad: [7, 14], p: 0.04, once: true, fn: p => Modal.mostrar({ ic: '🃏', titulo: 'Un sobre de cartas', texto: '<p>Te regalan un sobre de cartas coleccionables. ¡Una brilla de forma rara!</p>', opciones: [
    op('Guardarla con cuidado en una funda', () => Coleccion.encontrar(R.chance(0.85) ? 'carta' : 'comic', 'en un sobre de cartas coleccionables')),
    op('Cambiarla por dulces en el recreo', () => { mod({ felicidad: 4 }); log('Cambiaste tu carta brillante por dulces. Nunca sabrás cuánto valía.'); }),
  ] }) },
  { id: 'remodelacion', edad: [20, 90], p: 0.02, once: true, cond: () => S.p.bienes.some(b => b.tipo === 'casa'), fn: p => { log('🔨 Remodelando tu casa, los albañiles encontraron algo detrás de una pared.', 'raro'); const rz = R.peso([[40, 'comun'], [35, 'raro'], [20, 'epico'], [5, 'legendario']]); Coleccion.encontrar(Coleccion.idDeRareza(rz), 'escondido detrás de una pared de tu casa'); } },
  { id: 'playa', edad: [8, 80], p: 0.006, fn: p => { if (R.chance(0.15)) Coleccion.encontrar('meteorito', 'en la playa: una piedra negra muy pesada'); else Coleccion.encontrar(R.pick(['moneda', 'reloj']), 'enterrado en la arena de la playa'); } },
  { id: 'peleaPareja', edad: [16, 90], p: 0.05, cond: () => pareja(), fn: p => { const r = pareja(); Modal.mostrar({ ic: '💢', titulo: 'Discusión de pareja', texto: `<p>${r.nombre} está molest${gx(r, 'o', 'a')} porque sientes que no le dedicas tiempo.</p>`, opciones: [
    op('Pedir perdón y planear algo especial', () => { r.cercania = clamp(r.cercania + 6); }),
    op('Defender mi punto de vista con calma', () => { r.cercania = clamp(r.cercania + R.int(-4, 4)); }),
    op('Gritar y dar un portazo', () => { r.cercania = clamp(r.cercania - 15); mod({ karma: -2 }); log(`Tuviste una fuerte pelea con ${r.nombre}.`, 'malo'); }),
  ] }); } },
];

const Eventos = {
  anual() {
    const p = S.p;
    if (p.carcel || !p.vivo) return;
    let n = 0;
    for (const ev of R.shuffle(EVENTOS)) {
      if (n >= 2) break;
      if (p.edad < ev.edad[0] || p.edad > ev.edad[1]) continue;
      if (ev.once && p.vistos[ev.id]) continue;
      if (ev.cond && !ev.cond()) continue;
      if (!R.chance(ev.p)) continue;
      p.vistos[ev.id] = (p.vistos[ev.id] || 0) + 1;
      ev.fn(p); n++;
    }
  },
};
