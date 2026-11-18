'use strict';
/* =========================================================
   BARRIO VIVO: vecinos con personalidad que viven su propia
   vida (se casan, se pelean, se mudan, ganan la lotería…)
   y con los que puedes relacionarte.
   ========================================================= */
const TIPOS_VECINO = {
  chismosa:   { ic: '👀', n: 'Lo sabe todo de todos' },
  rico:       { ic: '💰', n: 'Familia adinerada que presume todo' },
  ruidoso:    { ic: '🔊', n: 'Pone música a todo volumen' },
  amable:     { ic: '😊', n: 'Ayuda a todo el mundo' },
  misterioso: { ic: '🕶️', n: 'Nadie sabe a qué se dedica' },
  sabio:      { ic: '🧓', n: 'Conoce toda la historia del barrio' },
  numerosa:   { ic: '👨‍👩‍👧‍👦', n: 'Familia numerosa' },
  deportista: { ic: '🏃', n: 'Vive para el deporte' },
  artista:    { ic: '🎨', n: 'Alma bohemia y artista' },
};
const NOMBRES_BARRIO = ['Las Flores', 'San Martín', 'Los Olivos', 'Santa Rosa', 'El Mirador', 'La Alameda', 'Los Pinos', 'Villa Esperanza', 'El Retiro', 'Las Palmeras'];

const Barrio = {
  vecino(tipo) {
    const p = S.p, g = R.chance(0.5) ? 'M' : 'F';
    const v = { id: uid(), tipo: tipo || R.pick(Object.keys(TIPOS_VECINO)), genero: g, nombre: nombreAleatorio(g, p.pais), apellido: apellidoAleatorio(p.pais), edad: R.int(22, 80), cercania: R.int(25, 55), vivo: true, pareja: R.chance(0.55), hijos: R.int(0, 3), historia: [] };
    if (v.tipo === 'sabio') v.edad = R.int(70, 90);
    if (v.tipo === 'numerosa') v.hijos = R.int(4, 7);
    this.fortuna(v);
    return v;
  },
  /* Riqueza, apariencia e inteligencia de un vecino (se calculan si faltan) */
  fortuna(v) {
    const e = eco();
    if (v.dinero === undefined) v.dinero = Math.round((v.tipo === 'rico' ? R.int(600000, 6000000) : v.tipo === 'artista' ? R.int(500, 30000) : v.tipo === 'sabio' ? R.int(20000, 200000) : R.int(3000, 150000)) * (v.tipo === 'rico' ? Math.max(e, 0.6) : e));
    if (v.apa === undefined) v.apa = statAleatoria();
    if (v.int === undefined) v.int = clamp(statAleatoria() + (v.tipo === 'sabio' ? 20 : 0));
    return v;
  },
  generar() { return { nombre: R.pick(NOMBRES_BARRIO), vecinos: R.shuffle(Object.keys(TIPOS_VECINO)).slice(0, 6).map(t => this.vecino(t)), novedades: [] }; },
  b() { const p = S.p; if (!p.barrio) p.barrio = this.generar(); return p.barrio; },
  mudanza() { S.p.barrio = this.generar(); log(`🏘️ Llegaste a un barrio nuevo: <b>${S.p.barrio.nombre}</b>.`, 'info'); },
  novedad(v, txt, aLog) {
    const b = this.b();
    v.historia.push(`${S.anio}: ${txt}`);
    b.novedades.unshift(`${TIPOS_VECINO[v.tipo].ic} ${v.nombre}: ${txt}`);
    b.novedades = b.novedades.slice(0, 12);
    if (aLog) log(`🏘️ ${v.nombre} ${v.apellido} ${txt}`);
  },

  /* ---------- La vida del barrio cada año ---------- */
  anual() {
    const p = S.p, b = this.b();
    if (p.carcel) return;
    let enLog = 0;
    for (const v of [...b.vecinos]) {
      v.edad++;
      if (v.edad > 70 && R.chance(Math.exp(-10.3 + 0.093 * v.edad))) {
        this.novedad(v, 'falleció. El barrio lo despidió con flores.', true); enLog++;
        if (v.cercania > 60) mod({ felicidad: -6 });
        b.vecinos = b.vecinos.filter(x => x !== v); b.vecinos.push(this.vecino()); continue;
      }
      if (!R.chance(0.35)) continue;
      const ev = R.peso([
        [v.pareja ? 0 : 5, 'boda'], [v.pareja && v.edad < 45 ? 5 : 0, 'bebe'], [v.pareja ? 3 : 0, 'divorcio'], [4, 'auto'], [3, 'trabajo'], [3, 'despido'],
        [1, 'loteria'], [3, 'mudanza'], [2, 'perro'], [2, 'remodela'], [2, 'pelea'], [1, 'arresto'], [2, 'negocio'], [2, 'viaje'],
      ]);
      const verbo = gx(v, 'o', 'a');
      const T = {
        boda: () => { v.pareja = true; this.novedad(v, 'se casó. ¡Hubo fiesta en toda la cuadra!', enLog++ < 2); if (v.cercania > 50) { mod({ felicidad: 3 }); log(`💒 Fuiste invitad${gx(p, 'o', 'a')} a la boda de ${v.nombre}.`); } },
        bebe: () => { v.hijos++; this.novedad(v, 'tuvo un bebé.', false); },
        divorcio: () => { v.pareja = false; this.novedad(v, 'se divorció. Se escucharon gritos toda la noche.', enLog++ < 2); },
        auto: () => { this.novedad(v, 'se compró un auto nuevo y lo estaciona frente a tu casa.', v.tipo === 'rico' && enLog++ < 2); if (v.tipo === 'rico' && !p.bienes.some(x => x.tipo === 'auto' && x.valor > 40000)) { mod({ felicidad: -2 }); log('😒 No puedes evitar compararte con tus vecinos ricos.', 'gris'); } },
        trabajo: () => this.novedad(v, 'consiguió un trabajo nuevo.', false),
        despido: () => this.novedad(v, 'perdió su trabajo.', false),
        loteria: () => { this.novedad(v, '¡ganó la lotería! Ahora todos le piden prestado.', true); enLog++; v.tipo = 'rico'; v.dinero = (v.dinero || 0) + Math.round(R.int(1e6, 8e6) * Math.max(eco(), 0.5)); },
        mudanza: () => { this.novedad(v, 'se mudó a otra ciudad.', enLog++ < 2); b.vecinos = b.vecinos.filter(x => x !== v); const n = this.vecino(); b.vecinos.push(n); this.novedad(n, 'se mudó a la casa de al lado.', enLog++ < 2); },
        perro: () => this.novedad(v, 'adoptó un perro que ladra a las 5 a. m.', false),
        remodela: () => this.novedad(v, 'remodeló su casa durante meses. El ruido fue insoportable.', false),
        pelea: () => { const o = R.pick(b.vecinos.filter(x => x !== v)); if (o) this.novedad(v, `se peleó con ${o.nombre} por un estacionamiento.`, enLog++ < 2); },
        arresto: () => { this.novedad(v, `fue detenid${verbo} por la policía. ¡Nadie lo esperaba!`, true); enLog++; },
        negocio: () => this.novedad(v, 'abrió una bodega en la esquina.', false),
        viaje: () => this.novedad(v, 'se fue de viaje y te dejó encargada su planta.', false),
      };
      T[ev]();
    }
    if (R.chance(0.3)) this.eventoBarrio();
  },
  eventoBarrio() {
    const p = S.p, b = this.b();
    if (p.edad < 10) return;
    const ev = R.pick(['fiesta', 'junta', 'robo', 'perdido', 'arbol']);
    if (ev === 'fiesta') Modal.mostrar({ ic: '🎉', titulo: `Fiesta del barrio ${b.nombre}`, texto: '<p>Los vecinos organizan una fiesta en la calle.</p>', opciones: [
      op(Habilidades.nivel('cocina') >= 3 ? '🍳 Llevar un plato que cocinaste tú' : '🥤 Ir con unas bebidas', () => { const extra = Habilidades.nivel('cocina') >= 3 ? 8 : 3; b.vecinos.forEach(v => v.cercania = clamp(v.cercania + extra)); mod({ felicidad: 5 }); log(`🎉 Fuiste a la fiesta del barrio${extra > 3 ? ' y tu comida fue la estrella' : ''}.`, 'bueno'); }),
      op(Habilidades.nivel('musica') >= 4 ? '🎸 Tocar música para todos' : '💃 Bailar toda la noche', () => { b.vecinos.forEach(v => v.cercania = clamp(v.cercania + 5)); mod({ felicidad: 6, fama: Habilidades.nivel('musica') >= 4 ? 1 : 0 }); }),
      op('Quedarme en casa', () => { b.vecinos.forEach(v => v.cercania = clamp(v.cercania - 2)); }),
    ] });
    else if (ev === 'junta' && p.edad >= 18) Modal.mostrar({ ic: '🗳️', titulo: 'Junta de vecinos', texto: '<p>Hay que votar en qué usar el fondo común del barrio.</p>', opciones: [
      op('📹 Cámaras de seguridad', () => { b.seguridad = true; log('🗳️ El barrio instaló cámaras de seguridad.'); }),
      op('🌳 Arreglar el parque', () => { mod({ felicidad: 3 }); log('🗳️ El barrio arregló el parque. Ahora los niños juegan ahí.'); }),
      op('🎆 Una gran fiesta de fin de año', () => { mod({ felicidad: 4 }); b.vecinos.forEach(v => v.cercania = clamp(v.cercania + 3)); }),
    ] });
    else if (ev === 'robo') { if (b.seguridad) log('📹 Las cámaras del barrio ayudaron a atrapar a unos ladrones.', 'bueno'); else { const m = Math.min(Math.max(0, p.dinero), Math.round(R.int(100, 2000) * eco())); p.dinero -= m; log(`🚨 Robaron en varias casas del barrio, incluida la tuya (${fmt$(m)}).`, 'malo'); } }
    else if (ev === 'perdido') { const v = R.pick(b.vecinos); Modal.mostrar({ ic: '🐶', titulo: 'Perro perdido', texto: `<p>El perro de ${v.nombre} se perdió. Hay carteles por todas partes.</p>`, opciones: [
      op('Salir a buscarlo', () => { if (R.chance(0.6)) { v.cercania = clamp(v.cercania + 20); mod({ karma: 4, felicidad: 4 }); log(`🐶 Encontraste al perro de ${v.nombre}. Ahora te adora.`, 'bueno'); } else log('Buscaste al perro toda la tarde sin suerte.'); }),
      op('No es mi problema', () => mod({ karma: -1 })),
    ] }); }
    else if (ev === 'arbol') log('🌳 Un árbol cayó en la calle tras una tormenta. Los vecinos lo retiraron juntos.');
  },

  /* ---------- Panel ---------- */
  panel() {
    Panel.abrir(() => `Barrio ${this.b().nombre}`, () => {
      const p = S.p, b = this.b(), its = [];
      if (b.novedades.length) { its.push({ sec: 'Novedades' }); its.push({ info: b.novedades.slice(0, 6).join('<br>') }); }
      its.push({ sec: 'Tus vecinos' });
      for (const v of b.vecinos) its.push({ ic: TIPOS_VECINO[v.tipo].ic, t: `${v.nombre} ${v.apellido}`, s: `${TIPOS_VECINO[v.tipo].n} · ${v.edad} años${v.pareja ? ' · casad' + gx(v, 'o', 'a') : ''}${v.hijos ? ` · ${v.hijos} hijo${v.hijos > 1 ? 's' : ''}` : ''}`, der: `${Barras.icono(this.fortuna(v).dinero)} ❤️ ${v.cercania}%`, fn: () => this.vecinoPanel(v) });
      return its;
    });
  },
  vecinoPanel(v) {
    const p = S.p;
    const ops = [
      op('👋 Saludar y conversar', () => { if (!usar('vec_' + v.id, 2)) return; v.cercania = clamp(v.cercania + R.int(3, 8)); Habilidades.ganar('carisma', 8, true); log(`Conversaste con tu vecin${gx(v, 'o', 'a')} ${v.nombre}.`); }),
      op('🍽️ Invitar a cenar', () => { if (!usar('cena_' + v.id, 1)) return; const c = Habilidades.nivel('cocina'); v.cercania = clamp(v.cercania + 6 + c * 2); log(`🍽️ Invitaste a ${v.nombre} a cenar${c >= 5 ? '. ¡Quedó maravillad' + gx(v, 'o', 'a') + ' con tu comida!' : '.'}`); Habilidades.ganar('cocina', 10, true); }),
    ];
    if (v.tipo === 'chismosa') ops.push(op('🗣️ Chismear', () => { if (!usar('chisme', 1)) return; mod({ karma: -1, felicidad: 2 }); const o = R.pick(this.b().vecinos.filter(x => x !== v)); log(`🗣️ ${v.nombre} te contó que ${o ? o.nombre + ' ' + R.pick(['debe tres meses de alquiler', 'tiene un romance secreto', 'esconde algo en su garaje', 'se compró todo a crédito']) : 'nadie hace nada interesante'}.`, 'raro'); }));
    if (v.tipo === 'sabio') ops.push(op('🧓 Pedirle un consejo', () => { if (!usar('sabio', 1)) return; mod({ inteligencia: 1, estres: -4 }); log(`🧓 ${v.nombre}: "${R.pick(['El dinero va y viene; la familia se queda.', 'Nunca firmes nada sin leerlo dos veces.', 'Aprende un oficio con las manos: algún día te salvará.', 'Ahorra para cuando llueva… y para cuando el mundo se vuelva loco.'])}"`); }));
    if (v.tipo === 'ruidoso') ops.push(op('😤 Quejarte por el ruido', () => { if (!usar('queja', 1)) return; if (R.chance(0.5)) { mod({ estres: -4 }); log(`${v.nombre} prometió bajar el volumen.`); } else { v.cercania = clamp(v.cercania - 12); log(`${v.nombre} subió la música aún más fuerte.`, 'malo'); } }));
    if (v.tipo === 'misterioso') ops.push(op('🔎 Averiguar a qué se dedica', () => { if (!usar('misterio', 1)) return; log(`🔎 Descubriste que ${v.nombre} ${R.pick(['es un escritor famoso que usa seudónimo', 'trabaja de noche como guardia de un museo', 'es un exagente de inteligencia retirado', 'cría orquídeas rarísimas', 'es un mago de fiestas infantiles'])}.`, 'raro'); v.cercania = clamp(v.cercania + 3); }));
    if (v.cercania >= 60 && p.edad >= 12) ops.push(op('🙏 Pedir un favor', () => { if (!usar('favor', 1)) return; const f = R.pick(['te prestó herramientas', 'cuidó tu casa cuando viajaste', 'te recomendó para un trabajo', 'te ayudó con una mudanza']); if (f.includes('trabajo') && p.trabajo) p.trabajo.desempeno = clamp(p.trabajo.desempeno + 5); mod({ felicidad: 2 }); log(`🙏 ${v.nombre} ${f}.`, 'bueno'); }));
    if (v.cercania >= 70 && !p.rel.some(r => r.vecinoId === v.id)) ops.push(op('🤝 Hacerse amigos', () => { const a = Estado.persona({ tipo: 'amigo', genero: v.genero, edad: v.edad, nombre: v.nombre, apellido: v.apellido }); a.cercania = v.cercania; a.vecinoId = v.id; p.rel.push(a); Estado.darLogro('vecino'); log(`🤝 Tu vecin${gx(v, 'o', 'a')} ${v.nombre} ahora es tu amig${gx(v, 'o', 'a')}.`, 'bueno'); }));
    ops.push(op('Cerrar', () => {}));
    Modal.mostrar({ ic: TIPOS_VECINO[v.tipo].ic, titulo: `${v.nombre} ${v.apellido}`, texto: `<p>${TIPOS_VECINO[v.tipo].n}.</p>${(() => { this.fortuna(v); const q = Barras.riquezaDe(v.dinero); return Barras.html('❤️ Cercanía', v.cercania, colorStat('x', v.cercania)) + Barras.html(`${q.ic} Riqueza: ${q.nombre} (${fmt$(v.dinero)})`, q.pct, 'linear-gradient(90deg,#16a34a,#eab308)') + Barras.html('✨ Apariencia', v.apa, colorStat('apariencia', v.apa)) + Barras.html('🧠 Inteligencia', v.int, colorStat('inteligencia', v.int)); })()}${v.historia.length ? `<p class="nota">${v.historia.slice(-4).join('<br>')}</p>` : ''}`, opciones: ops });
  },
};
