'use strict';
/* =========================================================
   LEGADO: puntos que ganas al morir, colección de cintas y
   mejoras permanentes para tus próximas vidas
   ========================================================= */
const CLAVE_LEGADO = 'otravida_legado_v1';
const CINTAS = [
  { id: 'realeza', ic: '👑', n: 'Realeza', d: 'Llevaste una corona.' },
  { id: 'magnate', ic: '💎', n: 'Magnate', d: 'Moriste con más de mil millones.' },
  { id: 'rico', ic: '💰', n: 'Rico', d: 'Dejaste una fortuna.' },
  { id: 'famoso', ic: '🌟', n: 'Famoso', d: 'Todo el mundo sabía tu nombre.' },
  { id: 'estadista', ic: '🏛️', n: 'Jefe de Estado', d: 'Gobernaste tu país.' },
  { id: 'politico', ic: '🗳️', n: 'Político', d: 'Ocupaste cargos públicos.' },
  { id: 'criminal', ic: '🕶️', n: 'Criminal', d: 'Viviste al margen de la ley.' },
  { id: 'sombra', ic: '🌑', n: 'Sombra', d: 'Llevaste una doble vida que estremeció al país.' },
  { id: 'detective', ic: '🔎', n: 'Detective', d: 'Desenmascaraste a un asesino en serie.' },
  { id: 'presidiario', ic: '⛓️', n: 'Presidiario', d: 'Pasaste media vida tras las rejas.' },
  { id: 'academico', ic: '📜', n: 'Académico', d: 'Llegaste a lo más alto del saber.' },
  { id: 'casanova', ic: '💘', n: 'Casanova', d: 'Tuviste muchísimos amores.' },
  { id: 'familiar', ic: '👨‍👩‍👧‍👦', n: 'Familiar', d: 'Criaste una gran familia.' },
  { id: 'longevo', ic: '🐢', n: 'Longevo', d: 'Viviste muchísimos años.' },
  { id: 'generoso', ic: '😇', n: 'Generoso', d: 'Dejaste el mundo mejor que como lo encontraste.' },
  { id: 'aventurero', ic: '🧳', n: 'Aventurero', d: 'Recorriste el mundo.' },
  { id: 'estrella', ic: '🎬', n: 'Estrella de cine', d: 'Tu nombre brilló en la pantalla.' },
  { id: 'atleta', ic: '🥊', n: 'Campeón', d: 'Fuiste el mejor en lo tuyo.' },
  { id: 'astronauta', ic: '🚀', n: 'Explorador', d: 'Viste la Tierra desde el espacio.' },
  { id: 'empresario', ic: '🏢', n: 'Empresario', d: 'Construiste empresas.' },
  { id: 'coleccionista', ic: '🏺', n: 'Coleccionista', d: 'Encontraste tesoros que otros no vieron.' },
  { id: 'tragico', ic: '🥀', n: 'Trágico', d: 'Tu vida terminó demasiado pronto.' },
  { id: 'endeudado', ic: '💸', n: 'Endeudado', d: 'Moriste debiendo dinero.' },
  { id: 'melancolico', ic: '🌧️', n: 'Melancólico', d: 'La felicidad te fue esquiva.' },
  { id: 'feliz', ic: '🌈', n: 'Feliz', d: 'Fuiste genuinamente feliz.' },
  { id: 'ordinario', ic: '😐', n: 'Ordinario', d: 'Una vida tranquila y sin sobresaltos.' },
];
const MEJORAS = [
  { id: 'talento', ic: '🎁', n: 'Don de nacimiento', d: 'Naces con un talento positivo extra y lo conoces desde el inicio.', costo: 120 },
  { id: 'genes', ic: '🧬', n: 'Buenos genes', d: 'Al crear tu personaje eliges una estadística que empieza +20.', costo: 160 },
  { id: 'vision', ic: '🔮', n: 'Autoconocimiento', d: 'Ves todos tus rasgos ocultos desde que naces.', costo: 200 },
  { id: 'fondo', ic: '🏦', n: 'Fondo familiar', d: 'A los 18 recibes un fondo fiduciario del legado familiar.', costo: 250 },
  { id: 'destino', ic: '🎯', n: 'Destino', d: 'Eliges uno de tus rasgos al nacer.', costo: 350 },
  { id: 'segunda', ic: '💫', n: 'Segunda oportunidad', d: 'Una vez por vida sobrevives a una muerte segura.', costo: 450 },
];

const Legado = {
  cargar() {
    const base = { puntos: 0, total: 0, mejoras: [], cintas: [], vidas: 0 };
    try { return { ...base, ...(JSON.parse(localStorage.getItem(CLAVE_LEGADO)) || {}) }; } catch (e) { return base; }
  },
  guardar(l) { try { localStorage.setItem(CLAVE_LEGADO, JSON.stringify(l)); } catch (e) {} },
  tiene(id) { return this.cargar().mejoras.includes(id); },

  /* Se ejecuta una sola vez por vida, al morir */
  registrarMuerte() {
    const p = S.p;
    if (p.legado) return p.legado;
    const l = this.cargar();
    const cintas = Objetivos.cintas();
    const detalle = [];
    let pts = 0;
    for (const c of cintas) {
      const nueva = !l.cintas.includes(c.id);
      const v = nueva ? 35 : 15; pts += v;
      detalle.push([`${c.ic} ${c.n}${nueva ? ' (¡nueva!)' : ''}`, v]);
      if (nueva) l.cintas.push(c.id);
    }
    if (p.objCumplido && p.objetivo !== 'libre') { pts += 100; detalle.push(['🎯 Objetivo cumplido', 100]); }
    if (p.retoCumplido) { pts += 80; detalle.push(['🏵️ Reto completado', 80]); }
    const anios = Math.floor(p.edad / 5) * 2; pts += anios; detalle.push([`🎂 ${p.edad} años vividos`, anios]);
    if (p.generacion > 1) { const g = p.generacion * 5; pts += g; detalle.push([`🌳 Generación ${p.generacion}`, g]); }
    if (p.dios) { pts = 0; detalle.length = 0; detalle.push(['⚡ Modo Dios: sin puntos', 0]); }
    l.puntos += pts; l.total += pts; l.vidas++;
    this.guardar(l);
    p.legado = { pts, detalle };
    return p.legado;
  },

  panel() {
    Panel.abrir('Legado', () => {
      const l = this.cargar();
      const its = [
        { info: `🏛️ Tienes <b>${l.puntos}</b> puntos de legado (ganados en total: ${l.total}, en ${l.vidas} vidas).<br>Ganas puntos al morir según tus cintas (las nuevas valen más), tu objetivo y tu reto. Las mejoras son permanentes.` },
        { ic: '🎗️', t: 'Colección de cintas', s: `${l.cintas.length}/${CINTAS.length} conseguidas`, fn: () => this.coleccion() },
        { sec: 'Mejoras para tus próximas vidas' },
      ];
      for (const m of MEJORAS) {
        const tiene = l.mejoras.includes(m.id);
        its.push({ ic: m.ic, t: m.n, s: m.d, der: tiene ? '✅' : `${m.costo} pts`, cls: tiene ? 'destacado' : '', dis: tiene ? 'Ya la tienes.' : l.puntos < m.costo ? `Te faltan ${m.costo - l.puntos} puntos.` : false, fn: () => {
          const x = this.cargar(); if (x.puntos < m.costo || x.mejoras.includes(m.id)) return;
          x.puntos -= m.costo; x.mejoras.push(m.id); this.guardar(x);
          Efectos.celebrar(m.ic, '¡Mejora desbloqueada!', `<p><b>${m.n}</b></p><p>${m.d}</p><p class="nota">Se aplica a partir de tu próxima vida.</p>`);
          if (S && S.p) Estado.darLogro('legado');
        } });
      }
      return its;
    });
  },
  coleccion() {
    const l = this.cargar();
    Panel.abrir('Colección de cintas', () => [
      { info: `Has conseguido <b>${l.cintas.length}/${CINTAS.length}</b> cintas. Cada cinta nueva da 35 puntos de legado.` },
      ...CINTAS.map(c => l.cintas.includes(c.id) ? { ic: c.ic, t: c.n, s: c.d, cls: 'destacado' } : { ic: '🔒', t: '???', s: c.d }),
    ]);
  },
};
