'use strict';
/* =========================================================
   NOTICIERO: el mundo sigue mientras vives. Titulares
   generales, chismes sobre ti cuando eres famoso y
   últimas horas que interrumpen tu año.
   ========================================================= */
const CIUDADES = { 'Perú': 'Lima', 'México': 'Ciudad de México', 'Colombia': 'Bogotá', 'Argentina': 'Buenos Aires', 'Chile': 'Santiago', 'España': 'Madrid', 'Estados Unidos': 'Nueva York', 'Reino Unido': 'Londres' };
const ciudad = () => CIUDADES[S.p.pais] || 'la capital';
const TITULARES = [
  () => `La selección de ${S.p.pais} clasifica al Mundial tras un partido infartante.`,
  () => `Récord de calor en ${ciudad()}: expertos alertan por el cambio climático.`,
  () => 'Una inteligencia artificial gana un concurso de poesía y desata la polémica.',
  () => 'Lanzan un teléfono plegable que cuesta más que un auto usado.',
  () => 'Las criptomonedas se desploman tras el tuit de un multimillonario.',
  () => `El tráfico en ${ciudad()} es el peor del continente, según un estudio.`,
  () => 'Científicos anuncian avances prometedores en una vacuna contra el cáncer.',
  () => 'Una cantante pop anuncia gira mundial y las entradas se agotan en 3 minutos.',
  () => 'Descubren un planeta potencialmente habitable a 40 años luz.',
  () => `Huelga de transportistas paraliza ${ciudad()}.`,
  () => 'Se viraliza un perro que "habla" usando botones. Ya tiene 10 millones de seguidores.',
  () => 'Escándalo en el Congreso: revelan audios comprometedores.',
  () => 'Precio de la vivienda sube por tercer año consecutivo.',
  () => 'Una startup local es comprada por una gigante tecnológica.',
  () => 'Hallan un tesoro arqueológico en una obra de construcción.',
  () => 'La final de la liga termina en penales y en polémica arbitral.',
];
const CHISMES = [
  p => `${p.nombre} ${p.apellido} fue visto cenando con una persona misteriosa.`,
  p => `¿Crisis? ${p.nombre} ${p.apellido} borró todas sus fotos de redes.`,
  p => `${p.nombre} ${p.apellido} sorprende con un cambio radical de look.`,
  p => `Fans de ${p.nombre} ${p.apellido} colapsan el centro de ${ciudad()} para verle.`,
  p => `${p.nombre} ${p.apellido} donó en secreto a un hospital, revela una enfermera.`,
  p => `Polémica: ${p.nombre} ${p.apellido} respondió con dureza a un periodista.`,
];

const Noticias = {
  emitir(titular, { modal = false, ic = '📺', cuerpo = '' } = {}) {
    log(`<span class="tv">📺 NOTICIERO</span> ${titular}`, 'noticia');
    if (modal) {
      Efectos.vibrar([20, 30, 20]);
      Modal.mostrar({ ic, titulo: '🔴 ÚLTIMA HORA', texto: `<p><b>${titular}</b></p>${cuerpo}`, clase: 'urgente' });
    }
  },
  anual() {
    const p = S.p;
    if (p.edad < 5) return;
    if (R.chance(0.35)) this.emitir(R.pick(TITULARES)());
    if (p.st.fama >= 35 && R.chance(0.3 + p.st.fama / 250)) {
      this.emitir(R.pick(CHISMES)(p));
      if (p.esp.redes && R.chance(0.5)) { const g = Math.round(p.esp.redes.seguidores * R.float(0.02, 0.1)) + 100; p.esp.redes.seguidores += g; log(`📱 Eres tendencia: +${fmtNum(g)} seguidores.`, 'raro'); }
    }
  },
};
