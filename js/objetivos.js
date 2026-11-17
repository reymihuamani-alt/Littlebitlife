'use strict';
/* =========================================================
   OBJETIVOS, RETOS, LOGROS GLOBALES Y CINTAS
   ========================================================= */
const Objetivos = {
  cumple(id) {
    const p = S.p, e = p.esp, t = p.trabajo;
    switch (id) {
      case 'millonario': return patrimonio() >= 1e6;
      case 'multimillonario': return patrimonio() >= 1e9;
      case 'famoso': return p.st.fama >= 90;
      case 'ceo': return (t && t.id === 'ejecutivo' && t.nivel === 4) || p.negocios.some(n => n.valor >= 1e8);
      case 'presidente': return p.cont.cargos.includes('presidente');
      case 'astronauta': return !!(e.astronauta && e.astronauta.misiones > 0);
      case 'supermodelo': return !!(e.modelo && e.modelo.nivel === 4);
      case 'director': return !!(e.director && e.director.estatuillas > 0);
      case 'realeza': return !!p.cont.reino;
      case 'capo': return !!(e.org && e.org.rango === 5);
      case 'medico': return !!(t && t.id === 'medico' && t.nivel === 4);
      case 'campeon': return !!(e.luchador && e.luchador.campeon);
      case 'familia': return !!(p.rel.some(r => r.tipo === 'conyuge' && r.vivo) && hijos().length >= 3 && p.edad >= 60 && p.st.felicidad >= 70);
      case 'matusalen': return p.edad >= 100;
      default: return false;
    }
  },
  cumpleReto(id, final = false) {
    const p = S.p;
    switch (id) {
      case 'pobreRico': return p.clase === 'pobre' && patrimonio() >= 1e6;
      case 'casanova': return p.cont.matrimonios >= 4;
      case 'fugitivo': return p.cont.fugas >= 2;
      case 'erudito': return p.edu.titulos.some(t => t.tipo === 'universidad' && t.honores) && tieneTitulo('doctorado');
      case 'santo': return final && p.st.karma >= 90 && p.cont.donado >= 100000;
      case 'renacentista': return p.cont.profesiones.length >= 5;
      case 'ermitano': return p.edad >= 70 && p.cont.matrimonios === 0 && p.cont.hijos === 0 && p.st.felicidad >= 60;
      case 'dinastia': { if (!final) return false; const m = [...S.dinastia.millonarios, patrimonio() >= 1e6]; return m.length >= 3 && m.slice(-3).every(Boolean); }
      default: return false;
    }
  },
  pista() {
    const p = S.p, e = p.esp;
    if (p.objCumplido) return '¡Cumplido!';
    switch (p.objetivo) {
      case 'millonario': return `Patrimonio ${fmt$(patrimonio())} / $1 M`;
      case 'multimillonario': return `Patrimonio ${fmt$(patrimonio())} / $1.000 M`;
      case 'famoso': return `Fama ${p.st.fama}/90`;
      case 'ceo': return p.edad < 18 ? 'Estudia Administración o Economía' : p.trabajo && p.trabajo.id === 'ejecutivo' ? `Puesto: ${Trabajo.tituloActual()}` : 'Carrera ejecutiva o empresa de $100 M';
      case 'presidente': return p.cont.cargos.length ? `Cargos: ${p.cont.cargos.map(c => CARGOS[c].n).join(', ')}` : p.edad < 21 ? 'Prepárate: inteligencia y fama' : 'Empieza como concejal';
      case 'astronauta': return e.astronauta ? `${NIV_ASTRO[e.astronauta.nivel]}` : 'STEM + posgrado + salud 70';
      case 'supermodelo': return e.modelo ? `${e.modelo.nivelN}` : 'Apariencia alta y una agencia';
      case 'director': return e.director ? `${e.director.peliculas.length} películas, habilidad ${e.director.habilidad}` : 'Estudia Cine o funda una productora';
      case 'realeza': return e.realeza ? e.realeza.titulo : 'Gala de la alta sociedad';
      case 'capo': return e.org ? `${RANGOS_ORG[e.org.rango]} · respeto ${e.org.respeto}` : 'Actividades → Crimen';
      case 'medico': return p.trabajo && p.trabajo.id === 'medico' ? Trabajo.tituloActual() : 'Estudia Medicina';
      case 'campeon': return e.luchador ? `Ranking #${e.luchador.ranking}` : 'Salud 60 y un gimnasio de MMA';
      case 'familia': return `${hijos().length}/3 hijos · ${pareja() && pareja().tipo === 'conyuge' ? 'casad' + gx(p, 'o', 'a') : 'sin casarte'}`;
      case 'matusalen': return `${p.edad}/100 años`;
      default: return 'Vive a tu manera';
    }
  },
  revisar(final = false) {
    if (!S || !S.p) return;
    const p = S.p;
    if (!p.vivo && !final) return;
    if (!p.objCumplido && p.objetivo !== 'libre' && this.cumple(p.objetivo)) {
      p.objCumplido = true;
      const o = OBJETIVOS.find(x => x.id === p.objetivo);
      log(`🎯✅ ¡OBJETIVO CUMPLIDO: <b>${o.nombre}</b>!`, 'raro'); Estado.darLogro('objetivo'); mod({ felicidad: 15 });
      if (!final) aviso('¡Objetivo cumplido!', `<p>Lograste tu meta de vida: <b>${o.ic} ${o.nombre}</b>.</p><p>Puedes seguir viviendo esta vida como quieras.</p>`, '🎯');
    }
    if (!p.retoCumplido && p.reto !== 'ninguno' && this.cumpleReto(p.reto, final)) {
      p.retoCumplido = true;
      const r = RETOS.find(x => x.id === p.reto);
      log(`🏵️ ¡RETO COMPLETADO: <b>${r.nombre}</b>!`, 'raro'); Estado.darLogro('reto');
      if (!final) aviso('¡Reto completado!', `<p>${r.ic} <b>${r.nombre}</b>: ${r.desc}</p>`, '🏵️');
    }
    const pt = patrimonio();
    p.cont.maxPatrimonio = Math.max(p.cont.maxPatrimonio, pt);
    if (pt >= 1e6) Estado.darLogro('millon');
    if (pt >= 1e9) Estado.darLogro('milmillones');
    if (p.st.fama >= 90) Estado.darLogro('famoso');
    if (p.edad >= 100) Estado.darLogro('centenario');
    if (p.generacion >= 3) Estado.darLogro('generacion3');
  },

  /* Cintas: resumen de la vida al morir */
  cintas() {
    const p = S.p, c = p.cont, e = p.esp, pt = patrimonio(), out = [];
    const add = (ic, n, d) => out.push({ ic, n, d });
    if (c.reino) add('👑', 'Realeza', 'Llevaste una corona.');
    if (pt >= 1e9) add('💎', 'Magnate', 'Moriste con más de mil millones.');
    else if (pt >= 5e6) add('💰', 'Rico', 'Dejaste una fortuna.');
    if (p.st.fama >= 80) add('🌟', 'Famoso', 'Todo el mundo sabía tu nombre.');
    if (c.cargos.includes('presidente')) add('🏛️', 'Jefe de Estado', 'Gobernaste tu país.');
    else if (c.cargos.length) add('🗳️', 'Político', 'Ocupaste cargos públicos.');
    if ((e.org && e.org.rango >= 3) || c.crimenes >= 12) add('🕶️', 'Criminal', 'Viviste al margen de la ley.');
    if (c.aniosCarcel >= 15) add('⛓️', 'Presidiario', 'Pasaste media vida tras las rejas.');
    if (tieneTitulo('doctorado')) add('📜', 'Académico', 'Llegaste a lo más alto del saber.');
    if (c.parejas >= 8) add('💘', 'Casanova', 'Tuviste muchísimos amores.');
    if (c.hijos >= 4) add('👨‍👩‍👧‍👦', 'Familiar', 'Criaste una gran familia.');
    if (p.edad >= 95) add('🐢', 'Longevo', 'Viviste muchísimos años.');
    if (p.st.karma >= 85 || c.donado >= 1e5) add('😇', 'Generoso', 'Dejaste el mundo mejor que como lo encontraste.');
    if (c.viajes >= 8) add('🧳', 'Aventurero', 'Recorriste el mundo.');
    if (p.edad < 30) add('🥀', 'Trágico', 'Tu vida terminó demasiado pronto.');
    if (pt < 0) add('💸', 'Endeudado', 'Moriste debiendo dinero.');
    if (c.anios && c.sumaFel / c.anios < 35) add('🌧️', 'Melancólico', 'La felicidad te fue esquiva.');
    if (!out.length) add('😐', 'Ordinario', 'Una vida tranquila y sin sobresaltos.');
    return out;
  },

  panelLogros() {
    const tiene = Estado.logros();
    Panel.abrir('Logros', () => [
      { info: `Desbloqueados: <b>${tiene.length}/${LOGROS.length}</b>. Los logros se conservan entre vidas.` },
      ...LOGROS.map(l => ({ ic: tiene.includes(l.id) ? l.ic : '🔒', t: l.n, s: l.d, cls: tiene.includes(l.id) ? 'destacado' : 'dis' })),
    ]);
  },
};
