'use strict';
/* =========================================================
   MODO ABSURDO Y MULTIVERSO
   Ciencia loca, un tío abuelo excéntrico, abducciones,
   mascotas que hablan… y portales a otras versiones de tu
   vida a las que puedes saltar. Se desactiva en el menú.
   ========================================================= */
const CLAVE_ABSURDO = 'otravida_absurdo';
const Absurdo = {
  activo() { try { return localStorage.getItem(CLAVE_ABSURDO) !== '0'; } catch (e) { return true; } },
  alternar() { try { localStorage.setItem(CLAVE_ABSURDO, this.activo() ? '0' : '1'); } catch (e) {} },
};

const VARIANTES = {
  capo:        { ic: '🕶️', edad: 20, d: (c, p) => `Eres ${gx(p, 'el capo más temido', 'la capo más temida')} de ${c}. Tienes poder, dinero sucio… y enemigos.` },
  presidente:  { ic: '🏛️', edad: 35, d: (c, p) => `Eres ${gx(p, 'Presidente', 'Presidenta')} de la República. Tu cara está en todos los noticieros.` },
  estrella:    { ic: '🎬', edad: 18, d: (c, p) => `Eres una estrella de cine internacional con tres estatuillas en la repisa.` },
  indigente:   { ic: '🥫', edad: 18, d: (c, p) => `Vives en la calle en ${c}. No tienes nada… salvo tu libertad.` },
  magnate:     { ic: '💎', edad: 22, d: (c, p) => `Fundaste una empresa tecnológica que cotiza en bolsa. Eres absurdamente ric${gx(p, 'o', 'a')}.` },
  cientifico:  { ic: '🔬', edad: 26, d: (c, p) => `Eres ${gx(p, 'un científico respetado', 'una científica respetada')} a punto de un descubrimiento histórico.` },
  monje:       { ic: '🧘', edad: 18, d: (c, p) => `Renunciaste a todo y vives en un monasterio. Tienes una paz infinita.` },
  prisionero:  { ic: '⛓️', edad: 18, d: (c, p) => `Estás en prisión por un crimen que no recuerdas haber cometido.` },
  supermodelo: { ic: '📸', edad: 18, edadMax: 38, d: (c, p) => `Eres supermodelo: tu cara está en vallas de todo el mundo.` },
  astronauta:  { ic: '🚀', edad: 26, edadMax: 55, d: (c, p) => `Eres astronauta ${gx(p, 'veterano', 'veterana')} con dos misiones espaciales.` },
  rey:         { ic: '👑', edad: 18, d: (c, p) => `En esta historia alternativa tu familia gobierna el país. Eres monarca.` },
};

const Multiverso = {
  /* Crea una versión alternativa del jugador */
  variante(tipo) {
    const p = S.p, q = JSON.parse(JSON.stringify(p)), e = Math.max(eco(), 0.5), c = ciudad();
    q.usos = {}; q.monasterio = false; q.dimension = `C-${R.int(100, 999)}`;
    const quitarPareja = () => { q.rel = q.rel.filter(r => !(r.tipo === 'pareja' || r.tipo === 'conyuge')); };
    const quitarHijos = () => { q.rel = q.rel.filter(r => r.tipo !== 'hijo' && r.tipo !== 'nieto'); };
    // La vida amorosa también es distinta en cada dimensión
    if (R.chance(0.6)) { quitarPareja(); if (R.chance(0.5)) { const c2 = Estado.persona({ tipo: 'conyuge', edad: clamp(p.edad + R.int(-5, 5), 18, 99) }); c2.cercania = R.int(50, 95); q.rel.push(c2); } }
    if (R.chance(0.4)) quitarHijos();
    const limpiar = () => { q.trabajo = null; q.carcel = null; q.esp.politica = q.esp.politica && { ...q.esp.politica, cargo: null }; };
    const T = {
      capo: () => { limpiar(); q.esp.org = { activo: true, rango: 4, respeto: 350, calor: 45, territorios: 5, operacion: 3, seguridad: 60, sobornos: true, dineroSucio: Math.round(3e6 * e), miembros: 25, perfilBajo: false, nombre: 'La Familia del Otro Lado' }; q.dinero = Math.round(5e5 * e); q.st.karma = 15; q.antecedentes = Math.max(1, q.antecedentes); q.st.fama = 45; },
      presidente: () => { limpiar(); q.esp.politica = { cargo: 'presidente', aprobacion: 55, mandato: 3, reelecciones: 0, sobornos: 0 }; q.cont.cargos = ['concejal', 'alcalde', 'congresista', 'presidente']; q.st.fama = 85; q.dinero = Math.round(2e6 * e); },
      estrella: () => { limpiar(); q.esp.actor = { nivel: 4, prestigio: 35, papeles: 25 }; q.st.fama = 95; q.dinero = Math.round(3e7 * e); q.st.apariencia = Math.max(q.st.apariencia, 85); },
      indigente: () => { limpiar(); q.dinero = 0; q.deudas = []; q.bienes = []; q.negocios = []; q.inv = { acciones: 0, indice: 0, bonos: 0, cripto: 0 }; q.vivienda = 'calle'; q.st.felicidad = 20; q.st.salud = 45; q.adic.alcohol = 40; },
      magnate: () => { limpiar(); q.negocios = [{ id: uid(), nombre: `${q.apellido} Technologies`, sector: 'startup', sectorN: 'Startup tecnológica', ic: '🚀', capital: 8e7, valor: 4e8, empleados: 500, calidad: 80, marketing: 60, anios: 10, ultimaGanancia: 2e7, publico: true, participacion: 0.6, reinversion: 0.5 }]; q.dinero = Math.round(2e7 * e); q.st.fama = 60; },
      cientifico: () => { limpiar(); for (const t of [{ tipo: 'universidad', nombre: 'Física' }, { tipo: 'maestria', nombre: 'Física' }, { tipo: 'doctorado', nombre: 'Física' }]) if (!q.edu.titulos.some(x => x.tipo === t.tipo)) q.edu.titulos.push(t); q.trabajo = { id: 'cientifico', nivel: 3, anios: 3, total: 12, desempeno: 85 }; q.st.inteligencia = Math.max(q.st.inteligencia, 90); q.st.fama = 40; },
      monje: () => { limpiar(); quitarPareja(); quitarHijos(); q.dinero = 0; q.bienes = []; q.negocios = []; q.inv = { acciones: 0, indice: 0, bonos: 0, cripto: 0 }; q.deudas = []; q.st.felicidad = 92; q.st.estres = 0; q.st.karma = 95; q.adic = { alcohol: 0, tabaco: 0, apuestas: 0 }; q.vivienda = 'alquiler'; q.monasterio = true; },
      prisionero: () => { limpiar(); q.carcel = { total: 15, restantes: R.int(5, 12), delito: 'un crimen que no recuerdas haber cometido', conducta: 40, pandilla: false }; q.antecedentes = Math.max(2, q.antecedentes); },
      supermodelo: () => { limpiar(); q.esp.modelo = { nivel: 4, prestigio: 60, agencia: 'elite', book: 80, rep: 85, portadas: 5, desfiles: 60, aperturas: 1, contratos: [], campanias: 30, perfil: 'clasico' }; q.st.apariencia = Math.max(q.st.apariencia, 92); q.st.fama = 85; q.dinero = Math.round(6e6 * e); },
      astronauta: () => { limpiar(); q.esp.astronauta = { nivel: 2, misiones: 2, entreno: 50 }; if (!q.edu.titulos.some(t => t.tipo === 'universidad')) q.edu.titulos.push({ tipo: 'universidad', nombre: 'Ingeniería Aeroespacial' }); if (!q.edu.titulos.some(t => t.tipo === 'maestria')) q.edu.titulos.push({ tipo: 'maestria', nombre: 'Ingeniería Aeroespacial' }); q.st.fama = 55; q.st.salud = Math.max(q.st.salud, 90); },
      rey: () => { limpiar(); q.esp.realeza = { pais: q.pais, popularidad: 60, monarca: true, consorte: false, titulo: Realeza.tituloMonarca(q.pais, q.genero, false) }; q.cont.reino = true; q.dinero = Math.round(5e7 * e); q.st.fama = 80; },
    };
    T[tipo]();
    const pa = q.rel.find(r => r.vivo && (r.tipo === 'conyuge' || r.tipo === 'pareja'));
    const nh = q.rel.filter(r => r.tipo === 'hijo' && r.vivo).length;
    const v = VARIANTES[tipo];
    return { tipo, q, ic: v.ic, desc: `${v.d(c, p)} ${pa ? `Estás con ${pa.nombre}.` : 'Estás solter' + gx(p, 'o', 'a') + '.'} ${nh ? `Tienes ${nh} hijo${nh > 1 ? 's' : ''}.` : 'No tienes hijos.'}` };
  },
  abrir(origen = 'Un portal verde se abre frente a ti') {
    const p = S.p;
    if (p.edad < 16 || p.carcel || (typeof Apocalipsis !== 'undefined' && Apocalipsis.activo())) return;
    const tipos = R.shuffle(Object.keys(VARIANTES).filter(k => p.edad >= VARIANTES[k].edad && p.edad <= (VARIANTES[k].edadMax || 120))).slice(0, 3);
    const vs = tipos.map(t => this.variante(t));
    Estado.darLogro('portal');
    Efectos.vibrar([40, 60, 40]);
    Modal.mostrar({
      ic: '🌀', titulo: 'Un portal al multiverso', clase: 'historia',
      texto: `<p>${origen}. Al otro lado ves versiones de ti viviendo vidas que pudieron ser.</p>${vs.map(v => `<p>${v.ic} <b>Dimensión ${v.q.dimension}</b>: ${v.desc}</p>`).join('')}<p class="nota">Si saltas, te quedas con esa vida: su dinero, su familia y sus problemas. No hay vuelta atrás.</p>`,
      opciones: vs.map(v => ({ t: `${v.ic} Saltar a la dimensión ${v.q.dimension}`, fn: () => this.saltar(v) })).concat([op('🚪 Cerrar el portal y quedarme en mi vida', () => { log('🌀 Cerraste el portal. Prefieres tu propia vida.'); mod({ felicidad: 3 }); })]),
    });
  },
  saltar(v) {
    const viejo = S.p, q = v.q;
    q.log = viejo.log;
    q.cont.saltos = (q.cont.saltos || 0) + 1;
    S.p = q;
    log(`🌀 <b>Saltaste a la dimensión ${q.dimension}.</b> ${v.desc}`, 'raro');
    Estado.darLogro('multiverso');
    Efectos.celebrar('🌀', `Dimensión ${q.dimension}`, `<p>${v.desc}</p><p class="nota">Tus recuerdos de la otra vida se desvanecen poco a poco…</p>`);
    Historias.sembrar('doble', { dim: q.dimension }, R.int(2, 7));
  },

  /* ---------- Ciencia loca ---------- */
  experimento() {
    const p = S.p;
    if (!usar('experimento', 1)) return;
    const c = Math.round(500 * Math.max(eco(), 0.4)); p.dinero -= c;
    Efectos.suspenso('🧪 Mezclas cosas que no deberías mezclar…', () => {
      const r = R.peso([[20, 'suero'], [18, 'explota'], [14, 'patente'], [12, 'clon'], [10, 'pelo'], [10, 'mascota'], [8, 'nada'], [8 + (p.st.inteligencia > 85 ? 6 : 0), 'portal']]);
      const R2 = {
        suero: () => { mod({ inteligencia: R.int(3, 8) }); if (R.chance(0.4)) { mod({ apariencia: -6 }); log('🧪 Tu suero de inteligencia funcionó… pero se te cayó la mitad del pelo.', 'raro'); } else log('🧪 Inventaste un suero que te hace más inteligente.', 'raro'); },
        explota: () => { mod({ salud: -R.int(5, 20) }); log('💥 Tu laboratorio del garaje explotó. Los vecinos llamaron a los bomberos.', 'malo'); },
        patente: () => { const g = Math.round(R.int(20000, 900000) * Math.max(eco(), 0.5)); p.dinero += g; log(`💡 Patentaste un invento absurdo que se volvió furor: ${fmt$(g)}.`, 'raro'); Efectos.celebrar('💡', '¡Patente vendida!', `<p>Una empresa compró tu invento por <b>${fmt$(g)}</b>.</p>`); },
        clon: () => Modal.mostrar({ ic: '👯', titulo: 'Creaste un clon', texto: '<p>Tu máquina creó una copia exacta de ti. Te mira con la misma cara de confusión.</p>', opciones: [
          op('Mandarlo al trabajo en tu lugar', () => { if (p.trabajo) { p.trabajo.desempeno = clamp(p.trabajo.desempeno + 15); mod({ estres: -15 }); log('👯 Tu clon fue a trabajar por ti todo el año. Nadie lo notó.', 'raro'); } else { mod({ felicidad: 5 }); log('👯 Tu clon hizo todas tus tareas de la casa.', 'raro'); } if (R.chance(0.3)) Historias.sembrar('clon', {}, R.int(1, 3)); }),
          op('Desmontar la máquina', () => log('👯 Tu clon se desvaneció como una burbuja. Mejor así.')),
        ] }),
        pelo: () => { mod({ apariencia: R.int(-8, 8), felicidad: 3 }); log('💇 Probaste tu tónico capilar y ahora tu pelo cambia de color según tu humor.', 'raro'); },
        mascota: () => { const m = p.mascotas.find(x => x.vivo); if (m) { m.habla = true; log(`🐾 Por accidente le diste tu fórmula a ${m.nombre}… y ahora habla. Tiene MUCHAS opiniones.`, 'raro'); } else log('🐁 Un ratón del garaje probó tu fórmula y ahora resuelve sudokus.', 'raro'); },
        nada: () => log('🧪 Tu experimento solo produjo un olor horrible que duró tres semanas.'),
        portal: () => this.abrir('Tu experimento rasga el espacio-tiempo: un remolino verde aparece en el garaje'),
      };
      R2[r]();
    }, 1500, '🧪');
  },
};

/* ---------- Historias absurdas ---------- */
Object.assign(HISTORIAS, {
  doble(d, p) {
    Historias.modal('🧍', 'Tu otro yo', `<p>Alguien idéntico a ti toca tu puerta. Es el ${p.nombre} original de la dimensión ${d.dim}: "Esta es MI vida. Quiero que me la devuelvas."</p>`, [
      op('🤝 Negociar: le das la mitad de tu dinero', () => { const m = Math.max(0, Math.round(p.dinero / 2)); p.dinero -= m; log(`↩️ Le diste ${fmt$(m)} a tu otro yo y se fue a vivir a la playa.`, 'raro'); }),
      op('🥊 Pelear por tu nueva vida', () => Minijuegos.pelea({ titulo: '🥊 Contra ti mism' + gx(p, 'o', 'a'), rival: { nombre: `${p.nombre} (dim. ${d.dim})`, fuerza: Math.round(p.st.salud * 0.6) }, poder: p.st.salud * 0.6 + Habilidades.nivel('combate') * 2, alFin: g => { if (g) log('↩️ Venciste a tu otro yo. Desapareció en un destello verde.', 'raro'); else { mod({ salud: -10, felicidad: -10 }); p.dinero = Math.round(p.dinero * 0.6); log('↩️ Tu otro yo te ganó y se llevó buena parte de tus ahorros.', 'malo'); } } })),
      op('🏠 Proponerle vivir juntos y turnarse la vida', () => { mod({ estres: -10, felicidad: 6 }); log('↩️ Ahora tú y tu otro yo se turnan: uno trabaja, el otro descansa. Funciona sorprendentemente bien.', 'raro'); }),
    ]);
  },
  clon(d, p) {
    Historias.modal('👯', 'Tu clon tiene ideas propias', '<p>Tu clon empezó a salir con gente, a firmar cosas con tu nombre y a usar tu tarjeta.</p>', [
      op('Desactivarlo', () => { log('↩️ Desactivaste a tu clon. Fue más triste de lo que esperabas.'); mod({ felicidad: -4 }); }),
      op('Dejarlo vivir su vida', () => { const m = Math.round(Math.max(0, p.dinero) * 0.2); p.dinero -= m; mod({ karma: 3 }); log(`↩️ Tu clon se mudó a otra ciudad (con ${fmt$(m)} de tu cuenta).`); }),
    ]);
  },
});

/* ---------- Eventos absurdos (solo con el modo absurdo activo) ---------- */
EVENTOS.push(
  { id: 'reflejo', edad: [16, 90], p: 0.005, cond: () => Absurdo.activo(), fn: p => Modal.mostrar({ ic: '🪞', titulo: 'Tu reflejo te guiña un ojo', texto: '<p>Te lavas la cara y, al mirar el espejo, tu reflejo… te guiña un ojo. Tú no lo hiciste.</p>', opciones: [op('Tocar el espejo', () => Multiverso.abrir('El espejo se vuelve líquido y se abre como una puerta')), op('Taparlo con una toalla', () => mod({ estres: 5 }))] }) },
  { id: 'abduccion', edad: [14, 90], p: 0.004, once: true, cond: () => Absurdo.activo(), fn: p => Modal.mostrar({ ic: '🛸', titulo: 'Luces en el cielo', texto: '<p>Una luz enorme te envuelve en medio de la carretera. Despiertas tres horas después en un campo, con un leve dolor de cabeza… y sabiendo cálculo avanzado.</p>', opciones: [
    op('Contárselo a todo el mundo', () => { mod({ inteligencia: 5 }); if (R.chance(0.4)) { mod({ fama: 10 }); log('🛸 Contaste tu abducción en televisión. Eres un fenómeno.', 'raro'); Noticias.emitir(`${p.nombre} ${p.apellido} asegura haber sido abducid${gx(p, 'o', 'a')} por extraterrestres.`); } else { mod({ felicidad: -5 }); log('🛸 Contaste tu abducción. Todos creen que perdiste la razón.', 'malo'); } }),
    op('Guardar el secreto', () => { mod({ inteligencia: 5, estres: 5 }); log('🛸 Nunca le contaste a nadie lo de aquella noche.', 'raro'); }),
  ] }) },
  { id: 'mascotaHabla', edad: [6, 100], p: 0.006, cond: () => Absurdo.activo() && S.p.mascotas.some(m => m.vivo), fn: p => { const m = p.mascotas.find(x => x.vivo); Modal.mostrar({ ic: m.ic, titulo: `${m.nombre} habló`, texto: `<p>${m.nombre} te mira fijamente y dice: <i>"${R.pick(['Tenemos que hablar de tu forma de vestir.', 'Sé lo que hiciste el verano pasado.', 'La comida de lata es un insulto.', 'Invierte en terrenos. Confía en mí.'])}"</i>. Luego nunca vuelve a decir nada.</p>`, opciones: [op('Grabarlo para las redes', () => { if (p.esp.redes) { p.esp.redes.seguidores += R.int(5000, 300000); log(`📱 Nadie creyó el video de ${m.nombre} hablando, pero se volvió viral.`, 'raro'); } else log('Intentaste grabarlo, pero ya no habló más.'); }), op('Ir al psicólogo', () => mod({ estres: -5 }))] }); } },
  { id: 'tioAbuelo', edad: [6, 17], p: 0.012, once: true, cond: () => Absurdo.activo(), fn: p => {
    const t = Estado.persona({ tipo: 'tio', genero: 'M', edad: R.int(68, 80), apellido: p.apellido }); t.profesion = 'Científico excéntrico'; t.cercania = 60; t.dinero = 0;
    p.rel.push(t);
    Modal.mostrar({ ic: '🧓', titulo: 'Llega tu tío abuelo', texto: `<p>Tu tío abuelo <b>${t.nombre}</b>, un científico excéntrico al que la familia no veía hace años, se muda a tu casa con un garaje lleno de aparatos.</p><p class="nota">Búscalo en Relaciones: puede llevarte a aventuras… peligrosas.</p>`, opciones: [op('¡Qué emoción!', () => mod({ felicidad: 4 })), op('Esto no va a terminar bien', () => {})] });
  } },
);

/* Aventura con el tío abuelo (se llama desde el panel de la persona) */
const AventuraTio = {
  ir(t) {
    const p = S.p;
    if (!usar('aventuraTio', 1)) return;
    Efectos.suspenso(`🧓 ${t.nombre} enciende un aparato que zumba…`, () => {
      const r = R.peso([[22, 'dinero'], [20, 'saber'], [18, 'herida'], [12, 'tiempo'], [10, 'portal'], [18, 'nada']]);
      t.cercania = clamp(t.cercania + 6);
      if (r === 'dinero') { const g = Math.round(R.int(500, 60000) * Math.max(eco(), 0.4)); p.dinero += g; log(`🧓 Tu tío abuelo y tú vendieron un "repelente de fantasmas" en la feria y ganaron ${fmt$(g)}.`, 'raro'); }
      else if (r === 'saber') { mod({ inteligencia: R.int(2, 5) }); Habilidades.ganar(R.pick(['mecanica', 'auxilios', 'programacion']), 40, true); log(`🧓 ${t.nombre} te enseñó a construir un robot con piezas de una licuadora.`, 'raro'); }
      else if (r === 'herida') { mod({ salud: -R.int(5, 15), felicidad: 3 }); log(`🧓 La aventura con ${t.nombre} terminó en urgencias. Valió la pena.`, 'malo'); }
      else if (r === 'tiempo') { mod({ felicidad: 8, estres: -8 }); log(`⏳ ${t.nombre} te llevó "diez minutos al pasado". Viste a tus padres de jóvenes en su primera cita.`, 'raro'); }
      else if (r === 'portal' && p.edad >= 16) Multiverso.abrir(`${t.nombre} abre un portal con su pistola de remolinos`);
      else log(`🧓 Pasaste la tarde con ${t.nombre} armando un cohete que nunca despegó.`);
    }, 1400, '🧓');
  },
};
