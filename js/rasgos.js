'use strict';
/* =========================================================
   RASGOS: talentos y defectos de nacimiento que descubres
   al vivir (o desde el inicio con mejoras de legado)
   ========================================================= */
const RASGOS_VIDA = {
  genio:        { ic: '🧠', n: 'Mente prodigiosa', d: 'Aprendes muchísimo más rápido que los demás.', pos: true },
  carisma:      { ic: '😎', n: 'Carisma magnético', d: 'Caes bien: ayuda en citas, entrevistas y elecciones.', pos: true },
  atleta:       { ic: '🏃', n: 'Atleta nato', d: 'Tu cuerpo responde increíble al ejercicio y a la pelea.', pos: true },
  belleza:      { ic: '✨', n: 'Belleza natural', d: 'Envejeces más lento y la cámara te ama.', pos: true },
  artista:      { ic: '🎨', n: 'Alma de artista', d: 'Brillas actuando, dirigiendo y creando contenido.', pos: true },
  emprendedor:  { ic: '💡', n: 'Olfato para los negocios', d: 'Tus empresas rinden más.', pos: true },
  suerte:       { ic: '🍀', n: 'Nacido con estrella', d: 'El azar suele sonreírte.', pos: true },
  longevo:      { ic: '🐢', n: 'Genes longevos', d: 'En tu familia se vive muchos años.', pos: true },
  empatico:     { ic: '🫶', n: 'Empático', d: 'Tus relaciones no se enfrían con el tiempo.', pos: true },
  lider:        { ic: '🦁', n: 'Líder nato', d: 'Los jefes te ven como alguien a quien ascender.', pos: true },
  adictivo:     { ic: '🍷', n: 'Personalidad adictiva', d: 'Los vicios te atrapan el doble.', pos: false },
  fragil:       { ic: '🤒', n: 'Salud frágil', d: 'Te enfermas con más facilidad.', pos: false },
  temperamental:{ ic: '🌋', n: 'Temperamental', d: 'A veces explotas y dañas tus relaciones.', pos: false },
  ansioso:      { ic: '😰', n: 'Ansioso', d: 'El estrés te golpea más fuerte.', pos: false },
  torpe:        { ic: '🫠', n: 'Torpe', d: 'Tropiezos, golpes y accidentes ridículos.', pos: false },
  frio:         { ic: '🧊', n: 'Sangre fría', d: 'Nada te altera… quizás demasiado. Tienes mente criminal.', pos: null },
};
const HEREDABLES = ['genio', 'atleta', 'belleza', 'longevo', 'artista', 'fragil', 'adictivo'];

const Rasgos = {
  tiene(id) { return !!(S && S.p && S.p.rasgos && S.p.rasgos.some(x => x.id === id)); },
  /* Genera los rasgos al nacer según las mejoras de legado */
  generar({ talento, vision, elegido, heredados = [] } = {}) {
    const ids = Object.keys(RASGOS_VIDA);
    const out = [];
    const add = (id, visto) => { if (id && RASGOS_VIDA[id] && !out.some(x => x.id === id)) out.push({ id, visto: !!visto, revela: R.int(4, 17) }); };
    if (elegido) add(elegido, true);
    for (const h of heredados) add(h, false);
    if (talento) add(R.pick(ids.filter(i => RASGOS_VIDA[i].pos)), true);
    while (out.length < (talento || elegido ? 3 : 2)) add(R.pick(ids), false);
    if (vision) out.forEach(x => x.visto = true);
    return out;
  },
  descubrir(x) {
    if (!x || x.visto) return;
    x.visto = true;
    const r = RASGOS_VIDA[x.id];
    log(`🧬 Descubriste algo sobre ti: <b>${r.ic} ${r.n}</b>. ${r.d}`, r.pos === false ? 'malo' : 'raro');
    Estado.darLogro('rasgo');
    if (r.pos) Efectos.celebrar(r.ic, '¡Descubriste un talento!', `<p><b>${r.n}</b></p><p>${r.d}</p>`);
    else Modal.mostrar({ ic: r.ic, titulo: 'Descubriste algo sobre ti', texto: `<p><b>${r.n}</b></p><p>${r.d}</p>` });
  },
  /* Revela un rasgo cuando haces algo relacionado */
  pista(id) { const x = S.p.rasgos && S.p.rasgos.find(r => r.id === id && !r.visto); if (x && R.chance(0.5)) this.descubrir(x); },
  anual() {
    const p = S.p;
    if (!p.rasgos) return;
    for (const x of p.rasgos) if (!x.visto && p.edad >= x.revela) { this.descubrir(x); break; }
    if (this.tiene('genio') && p.edad < 25) mod({ inteligencia: R.int(1, 2) });
    if (this.tiene('belleza') && p.edad > 35 && R.chance(0.6)) mod({ apariencia: 1 });
    if (this.tiene('ansioso')) mod({ estres: 4 });
    if (this.tiene('adictivo')) for (const k in p.adic) if (p.adic[k] > 0) p.adic[k] = clamp(p.adic[k] + 5);
    if (this.tiene('torpe') && R.chance(0.08)) { mod({ salud: -R.int(2, 6) }); log(R.pick(['Te tropezaste con tu propio cordón frente a mucha gente.', 'Te golpeaste el dedo pequeño con la mesa. Dolor nivel dios.', 'Te caíste de la bicicleta de la forma más ridícula posible.']), 'malo'); }
    if (this.tiene('temperamental') && p.edad >= 10 && R.chance(0.15)) {
      const r = R.pick(p.rel.filter(r => r.vivo && r.edad >= 6));
      if (r) { r.cercania = clamp(r.cercania - R.int(6, 14)); log(`🌋 Explotaste de rabia con ${r.nombre} por una tontería.`, 'malo'); }
    }
  },
  panel() {
    Panel.abrir('Tus rasgos', () => {
      const p = S.p, its = [{ info: 'Todos nacemos con talentos y defectos. Algunos los descubrirás con los años o haciendo cosas relacionadas.' }];
      for (const x of p.rasgos || []) {
        const r = RASGOS_VIDA[x.id];
        its.push(x.visto ? { ic: r.ic, t: r.n, s: r.d, cls: r.pos ? 'destacado' : '' } : { ic: '❔', t: 'Rasgo oculto', s: 'Aún no lo descubres.' });
      }
      return its;
    });
  },
};
