'use strict';
/* =========================================================
   REALEZA: nacer o casarse con la realeza, línea sucesoria,
   coronación, popularidad, abdicación
   ========================================================= */
const Realeza = {
  tituloHeredero(paisN, genero, esHeredero) {
    if (paisN === 'España') return esHeredero ? (genero === 'F' ? 'Princesa de Asturias' : 'Príncipe de Asturias') : (genero === 'F' ? 'Infanta de España' : 'Infante de España');
    return esHeredero ? (genero === 'F' ? 'Princesa de Gales' : 'Príncipe de Gales') : (genero === 'F' ? 'Princesa' : 'Príncipe');
  },
  tituloMonarca(paisN, genero, consorte) { return `${genero === 'F' ? 'Reina' : 'Rey'}${consorte ? ' consorte' : ''} de ${paisN}`; },
  linea() {
    const p = S.p;
    const mayores = p.rel.filter(r => r.tipo === 'hermano' && r.vivo && r.edad > p.edad && r.real);
    return mayores.length + 1;
  },
  iniciarNacimiento() {
    const p = S.p;
    p.esp.realeza = { pais: p.pais, popularidad: 60, monarca: false, consorte: false, titulo: '' };
    p.esp.realeza.titulo = this.tituloHeredero(p.pais, p.genero, this.linea() === 1);
    p.dinero = 0;
  },
  actualizarTitulo() {
    const p = S.p, r = p.esp.realeza;
    if (!r || r.monarca || r.consorte || r.emerito) return;
    r.titulo = this.tituloHeredero(r.pais, p.genero, this.linea() === 1);
  },
  muereMonarca(rey) {
    const p = S.p, r = p.esp.realeza;
    if (!r || r.consorte) return;
    rey.monarca = false;
    if (this.linea() === 1) this.coronar();
    else {
      const h = p.rel.filter(x => x.tipo === 'hermano' && x.vivo && x.real && x.edad > p.edad).sort((a, b) => b.edad - a.edad)[0];
      if (h) { h.monarca = true; h.profesion = h.genero === 'F' ? 'Reina' : 'Rey'; log(`👑 Tu herman${gx(h, 'o', 'a')} ${h.nombre} fue coronad${gx(h, 'o', 'a')}.`, 'raro'); }
    }
  },
  coronar() {
    const p = S.p, r = p.esp.realeza;
    p.cont.reino = true; r.monarca = true; r.titulo = this.tituloMonarca(r.pais, p.genero, false); r.popularidad = clamp(r.popularidad + 10);
    mod({ fama: 25, felicidad: 20 });
    log(`👑👑 ¡Fuiste coronad${gx(p, 'o', 'a')} como <b>${r.titulo}</b>!`, 'raro');
    Estado.darLogro('rey');
    Efectos.celebrar('👑', '¡Larga vida!', `<p>Hoy te conviertes en <b>${r.titulo}</b>.</p>`);
    Noticias.emitir(`Coronación histórica: ${p.nombre} es proclamad${gx(p, 'o', 'a')} ${r.titulo}.`);
  },
  casarConRealeza(c) {
    const p = S.p;
    if (p.esp.realeza) return;
    p.esp.realeza = { pais: c.paisReal, popularidad: 50, monarca: false, consorte: true, conyuge: c.id, titulo: `${p.genero === 'F' ? 'Princesa' : 'Príncipe'} consorte de ${c.paisReal}` };
    mod({ fama: 30 });
    log(`👑 Al casarte con ${c.nombre} te convertiste en <b>${p.esp.realeza.titulo}</b>.`, 'raro');
  },
  nacimientoHeredero(h) { h.real = true; h.titulo = this.tituloHeredero(S.p.esp.realeza.pais, h.genero, !hijos().some(x => x !== h && x.real)); },

  anual() {
    const p = S.p, r = p.esp.realeza;
    if (!r) return 0;
    this.actualizarTitulo();
    r.popularidad = clamp(r.popularidad + R.int(-4, 3) + (p.st.karma > 70 ? 1 : 0) - (p.carcel ? 20 : 0));
    if (p.st.fama < 50) p.st.fama = 50;
    // Consorte: el cónyuge puede heredar el trono
    if (r.consorte && !r.monarca) {
      const c = p.rel.find(x => x.id === r.conyuge);
      if (c && c.vivo && R.chance(0.1)) { r.monarca = true; r.titulo = this.tituloMonarca(r.pais, p.genero, true); c.monarca = true; p.cont.reino = true; c.titulo = this.tituloMonarca(r.pais, c.genero, false); log(`👑 ${c.nombre} heredó el trono. Ahora eres <b>${r.titulo}</b>.`, 'raro'); Estado.darLogro('rey'); mod({ fama: 15 }); }
    }
    if (r.monarca && r.popularidad < 15 && R.chance(0.2)) {
      log(`🔥 Tras meses de protestas, ${r.pais} abolió la monarquía. Perdiste tu corona.`, 'malo');
      p.esp.realeza = null; mod({ felicidad: -30 }); return 0;
    }
    if (p.edad < 18) return 0;
    return Math.round(r.monarca ? 3000000 : 350000);
  },
  panel() {
    Panel.abrir('Casa Real', () => {
      const p = S.p, r = p.esp.realeza;
      if (!r) return [{ info: 'Ya no perteneces a la realeza.' }];
      const its = [
        { kv: [['Título', r.titulo], ['País', `${PAISES[r.pais]?.bandera || ''} ${r.pais}`], r.consorte ? ['Por matrimonio', 'Sí'] : ['Línea de sucesión', r.monarca ? 'Reinas' : '#' + this.linea()], ['Asignación anual', fmt$(r.monarca ? 3e6 : 3.5e5)]] },
        { barra: ['Popularidad', r.popularidad] },
      ];
      const a = (ic, t, s, fn) => its.push({ ic, t, s, fn });
      if (p.edad >= 6) a('🎗️', 'Acto benéfico', '+popularidad, +karma', () => { if (!usar('benefico', 2)) return; r.popularidad = clamp(r.popularidad + R.int(3, 8)); mod({ karma: 3, felicidad: 2 }); log('Presidiste un acto benéfico.'); });
      if (p.edad >= 12) a('🌍', 'Visita oficial', '+fama, +popularidad', () => { if (!usar('visita', 1)) return; r.popularidad = clamp(r.popularidad + R.int(-2, 6)); mod({ fama: 2 }); p.cont.viajes++; log(`Hiciste una visita oficial a ${R.pick(['Japón', 'Francia', 'México', 'Marruecos', 'Canadá', 'Perú', 'India'])}.`); });
      if (p.edad >= 16) a('🎤', 'Dar un discurso a la nación', 'Depende de tu inteligencia', () => { if (!usar('discursoR', 1)) return; const d = Math.round((p.st.inteligencia - 45) / 8 + R.int(-4, 4)); r.popularidad = clamp(r.popularidad + d); log(d >= 0 ? 'Tu discurso emocionó al país.' : 'Tu discurso fue criticado por la prensa.', d >= 0 ? 'bueno' : 'malo'); });
      if (p.edad >= 18) a('🍾', 'Fiesta privada escandalosa', '+felicidad, −popularidad', () => { if (!usar('fiestaR', 1)) return; mod({ felicidad: 8 }); if (R.chance(0.5)) { r.popularidad = clamp(r.popularidad - R.int(8, 18)); log('📰 Los paparazzis publicaron fotos de tu fiesta. Escándalo.', 'malo'); } else log('Disfrutaste una fiesta discreta… esta vez.'); });
      if (p.edad >= 18) a('🎙️', 'Entrevista televisiva', 'Arriesgado', () => { if (!usar('entrevistaR', 1)) return; const d = R.int(-12, 10); r.popularidad = clamp(r.popularidad + d); log(`Diste una entrevista ${d >= 0 ? 'muy bien recibida' : 'polémica'}.`, d >= 0 ? 'bueno' : 'malo'); });
      if (r.monarca && !r.consorte) a('🪑', 'Abdicar', 'Cede el trono a tu heredero', () => this.abdicar());
      if (!r.monarca) a('🚪', 'Renunciar a tus títulos', 'Vida de plebeyo', () => Modal.mostrar({ ic: '🚪', titulo: '¿Renunciar?', texto: '<p>Perderás títulos y asignación.</p>', opciones: [{ t: 'Renunciar', cls: 'peligro', fn: () => { p.esp.realeza = null; log('Renunciaste a tus títulos reales.', 'info'); } }, { t: 'Cancelar' }] }));
      return its;
    });
  },
  abdicar() {
    const p = S.p, r = p.esp.realeza;
    const h = hijos().filter(x => x.real).sort((a, b) => b.edad - a.edad)[0];
    if (!h) return aviso('Sin heredero', '<p>No tienes un heredero directo a quien ceder el trono.</p>', '👑');
    Modal.mostrar({ ic: '🪑', titulo: 'Abdicar', texto: `<p>${h.nombre} se convertirá en ${h.genero === 'F' ? 'Reina' : 'Rey'}.</p>`, opciones: [{ t: 'Abdicar', cls: 'peligro', fn: () => { h.monarca = true; h.titulo = this.tituloMonarca(r.pais, h.genero, false); r.monarca = false; r.titulo = `${p.genero === 'F' ? 'Reina' : 'Rey'} emérit${gx(p, 'o', 'a')}`; r.emerito = true; log(`🪑 Abdicaste en favor de ${h.nombre}.`, 'raro'); mod({ estres: -20 }); } }, { t: 'Cancelar' }] });
  },
};
