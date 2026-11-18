'use strict';
/* =========================================================
   TRABAJO: empleos, entrevistas, ascensos, jubilación
   y el panel "Ocupación"
   ========================================================= */
const ESTRES_TRABAJO = { medico: 8, abogado: 7, ejecutivo: 6, banquero: 9, policia: 6, militar: 6, bombero: 5, juez: 5, piloto: 5, callcenter: 5, programador: 4, periodista: 5, cocinero: 5 };

const Trabajo = {
  def: id => TRABAJOS.find(t => t.id === id),
  tituloActual() { const t = S.p.trabajo; return t ? this.def(t.id).niveles[t.nivel] : ''; },
  salario(t = S.p.trabajo) {
    const d = this.def(t.id);
    return Math.round(d.salarios[t.nivel] * eco() * (1 + 0.025 * Math.min(t.anios, 10)) * (t.bono || 1));
  },
  cumple(d, nivel = 0) {
    const p = S.p, r = d.req, m = [];
    if (p.edad < (r.edadMin || 18)) m.push(`Edad mínima ${r.edadMin || 18}`);
    if (r.edadMax && p.edad > r.edadMax) m.push(`Edad máxima ${r.edadMax}`);
    if (r.edu && nivelEdu() < NIVEL_EDU[r.edu]) m.push(`Estudios: ${r.edu}`);
    if (r.carrera && !r.carrera.some(c => tieneTitulo('universidad', c)) && !(d.id === 'programador' && Habilidades.nivel('programacion') >= 6)) m.push(`Título en ${r.carrera.join(' / ')}`);
    if (r.titulo && !tieneTitulo(r.titulo)) m.push(`Título: ${POSGRADOS[r.titulo]?.nombre || r.titulo}`);
    if (r.int && p.st.inteligencia < r.int) m.push(`Inteligencia ${r.int}%`);
    if (r.apa && p.st.apariencia < r.apa) m.push(`Apariencia ${r.apa}%`);
    if (r.salud && p.st.salud < r.salud) m.push(`Salud ${r.salud}%`);
    if (r.sinAntecedentes && p.antecedentes > 0) m.push('Sin antecedentes penales');
    if (r.licencia && !p.licencia) m.push('Licencia de conducir');
    return m;
  },

  /* Bolsa de empleo */
  buscar() {
    const p = S.p;
    Panel.abrir('Bolsa de empleo', () => {
      const its = [{ info: `Elige trabajos que acerquen tu objetivo. Con experiencia previa puedes entrar en un puesto más alto. Los requisitos en rojo aún no los cumples.` }];
      let cat = '';
      for (const d of TRABAJOS) {
        if (d.cat !== cat) { cat = d.cat; its.push({ sec: cat }); }
        const falta = this.cumple(d);
        const exp = p.expTrab[d.id] || 0;
        its.push({ ic: d.ic, t: d.niveles[0], s: falta.length ? '🔒 ' + falta.join(' · ') : `${fmt$(d.salarios[0] * eco())}/año${exp ? ` · ${exp} años de experiencia` : ''}`, dis: falta.length ? 'Requisitos: ' + falta.join(', ') : false, fn: () => this.entrevista(d) });
      }
      return its;
    });
  },
  entrevista(d) {
    const p = S.p;
    if (p.trabajo && p.trabajo.id === d.id) return toast('Ya trabajas aquí.');
    if (!usar('postular_' + d.id, 1)) return;
    const PREG = [
      { q: '¿Cuál es tu mayor defecto?', o: [['Soy demasiado perfeccionista.', 0], ['A veces me cuesta delegar, pero estoy aprendiendo a hacerlo.', 1], ['Odio madrugar, la verdad.', -1]] },
      { q: '¿Por qué quieres trabajar con nosotros?', o: [['Admiro su trayectoria y puedo aportar en sus proyectos.', 1], ['Necesito el dinero.', -1], ['Me queda cerca de casa.', 0]] },
      { q: '¿Dónde te ves en cinco años?', o: [['Creciendo dentro de esta empresa con más responsabilidades.', 1], ['En su silla, jefe.', 0], ['No tengo idea.', -1]] },
      { q: 'Un compañero no cumple su parte de un proyecto. ¿Qué haces?', o: [['Hablo con él para entender el problema y buscar solución.', 1], ['Lo reporto de inmediato al jefe.', 0], ['Hago su parte y me quejo con todos.', -1]] },
      { q: '¿Qué expectativa salarial tienes?', o: [['Lo que sea justo según el mercado y mi experiencia.', 1], ['El doble de lo que ofrecen.', -1], ['Me da igual.', 0]] },
    ];
    const pr = R.pick(PREG);
    Modal.mostrar({
      ic: '🤝', titulo: `Entrevista: ${d.niveles[0]}`, texto: `<p>El entrevistador pregunta:</p><p><b>"${pr.q}"</b></p>`,
      opciones: R.shuffle(pr.o).map(([t, v]) => ({ t, fn: () => {
        const dific = d.cat === 'Universitario' ? 0.05 : d.cat === 'Especial' ? 0.1 : -0.05;
        let prob = 0.42 + v * 0.22 + (Rasgos.tiene('carisma') ? 0.1 : 0) + Habilidades.nivel('carisma') * 0.012 + (p.apellidoRep || 0) / 500 + (p.st.inteligencia - 50) / 220 + (p.st.apariencia - 50) / 350 - dific + (p.expTrab[d.id] ? 0.15 : 0) - (p.antecedentes ? 0.12 : 0) - (S.eco.estado === 'recesion' ? 0.12 : 0) - (p.edad > 55 ? 0.15 : 0);
        if (R.chance(clamp(prob * 100, 5, 92) / 100)) this.contratar(d);
        else { log(`No te contrataron como ${d.niveles[0]}.`, 'malo'); mod({ felicidad: -4 }); aviso('No fue esta vez', `<p>"Gracias por tu tiempo. Hemos decidido seguir con otros candidatos."</p>${S.eco.estado === 'recesion' ? '<p class="nota">La recesión hace que haya menos vacantes.</p>' : ''}`, '📭'); }
      } })),
    });
  },
  contratar(d) {
    const p = S.p;
    if (p.trabajo) this.dejar(`Renunciaste a tu trabajo como ${this.tituloActual()}.`);
    const exp = p.expTrab[d.id] || 0;
    let nivel = Math.min(d.niveles.length - 2, Math.floor(exp / 4));
    while (nivel > 0 && !this.puedeNivel(d, nivel)) nivel--;
    p.trabajo = { id: d.id, nivel: Math.max(0, nivel), anios: 0, total: 0, desempeno: 55 };
    p.medioTiempo = null;
    if (!p.cont.profesiones.includes(d.id)) p.cont.profesiones.push(d.id);
    log(`💼 ¡Te contrataron como <b>${d.niveles[p.trabajo.nivel]}</b>! Sueldo: ${fmt$(this.salario())}/año.`, 'bueno');
    Efectos.celebrar(d.ic, '¡Te contrataron!', `<p>Nuevo puesto: <b>${d.niveles[p.trabajo.nivel]}</b></p><p>Sueldo: ${fmt$(this.salario())} al año.</p>`);
    mod({ felicidad: 8 });
    Estado.darLogro('primerTrabajo');
    Panel.cerrar();
  },
  puedeNivel(d, n) {
    const r = d.reqNivel && d.reqNivel[n]; if (!r) return true;
    if (r.titulo && !tieneTitulo(r.titulo)) return false;
    if (r.int && S.p.st.inteligencia < r.int) return false;
    return true;
  },
  motivoNivel(d, n) {
    const r = d.reqNivel && d.reqNivel[n]; if (!r) return '';
    if (r.titulo && !tieneTitulo(r.titulo)) return `Necesitas: ${POSGRADOS[r.titulo].nombre}.`;
    if (r.int && S.p.st.inteligencia < r.int) return `Necesitas inteligencia de ${r.int}%.`;
    return '';
  },
  ascender(motivo) {
    const p = S.p, t = p.trabajo, d = this.def(t.id);
    t.nivel++; t.anios = 0; t.desempeno = clamp(t.desempeno - 15);
    log(`📈 ${motivo || '¡Te ascendieron!'} Ahora eres <b>${d.niveles[t.nivel]}</b> (${fmt$(this.salario())}/año).`, 'bueno');
    Efectos.celebrar('📈', '¡Ascenso!', `<p>${motivo || ''}</p><p>Ahora eres <b>${d.niveles[t.nivel]}</b>.</p><p>Nuevo sueldo: ${fmt$(this.salario())} al año.</p>`);
    mod({ felicidad: 10 });
    if (d.id === 'ejecutivo' && t.nivel === 4) Estado.darLogro('ceo');
  },
  dejar(msg, tipo = '') {
    const p = S.p; if (!p.trabajo) return;
    p.ultimoSalario = this.salario();
    if (msg) log(msg, tipo);
    p.trabajo = null;
  },

  anual() {
    const p = S.p;
    let ingreso = 0;
    if (p.medioTiempo) {
      ingreso += Math.round(p.medioTiempo.salario * eco());
      p.edu.notas = clamp(p.edu.notas - 3); mod({ estres: 2 });
      if (p.edad >= 18) { log('Dejaste tu trabajo de medio tiempo al cumplir 18.'); p.medioTiempo = null; }
    }
    const t = p.trabajo;
    if (!t || p.carcel) return ingreso;
    const d = this.def(t.id);
    t.anios++; t.total++; p.expTrab[t.id] = (p.expTrab[t.id] || 0) + 1;
    ingreso += this.salario();
    t.bono = 1;
    t.desempeno = clamp(t.desempeno + R.int(-7, 5) + (p.st.inteligencia - 55) / 15 + (p.st.felicidad - 50) / 25 - (p.st.estres > 75 ? 6 : 0) - (p.st.salud < 30 ? 6 : 0));
    mod({ estres: (ESTRES_TRABAJO[t.id] || 3) + t.nivel - 4 });
    // Ascenso automático
    if (t.nivel < d.niveles.length - 1 && t.desempeno > 80 && t.anios >= 2 && this.puedeNivel(d, t.nivel + 1) && R.chance(Rasgos.tiene('lider') ? 0.45 : 0.3)) this.ascender('¡Tu jefe reconoció tu gran trabajo!');
    // Despidos
    if (t.desempeno < 15 && R.chance(0.55)) { this.dejar(`🔥 Te despidieron de tu trabajo como ${d.niveles[t.nivel]} por bajo desempeño.`, 'malo'); mod({ felicidad: -15 }); }
    else if (S.eco.estado === 'recesion' && R.chance(0.07 + (t.desempeno < 40 ? 0.1 : 0))) { this.dejar(`📉 Por la recesión, la empresa hizo recortes y te despidieron.`, 'malo'); mod({ felicidad: -12, estres: 8 }); }
    return ingreso;
  },

  items() {
    const p = S.p, its = [];
    if (p.trabajo) {
      const t = p.trabajo, d = this.def(t.id);
      its.push({ sec: 'Trabajo' });
      its.push({ kv: [['Puesto', `${d.ic} ${d.niveles[t.nivel]}`], ['Sueldo', fmt$(this.salario()) + '/año'], ['Años en el puesto', t.anios], ['Siguiente puesto', d.niveles[t.nivel + 1] || '— (cima)']] });
      its.push({ barra: ['Desempeño', t.desempeno] });
      if (d.niveles[t.nivel + 1]) its.push({ barra: [`📈 Camino al ascenso: ${d.niveles[t.nivel + 1]}`, clamp(Math.min(t.anios, 2) * 25 + Math.max(0, t.desempeno - 30)), 'var(--ok)'] });
      its.push({ ic: '💪', t: 'Trabajar más duro', s: '+desempeño, +estrés', fn: () => { if (!usar('duro', 2)) return; t.desempeno = clamp(t.desempeno + R.int(6, 12)); mod({ estres: 5, felicidad: -1 }); log('Trabajaste más duro que nunca.'); toast('💪 +desempeño'); } });
      its.push({ ic: '⏰', t: 'Hacer horas extra', s: '+dinero, +estrés, −salud', fn: () => { if (!usar('extra', 2)) return; const g = Math.round(this.salario() * 0.06); p.dinero += g; mod({ estres: 7, salud: -2 }); t.desempeno = clamp(t.desempeno + 3); log(`Hiciste horas extra y ganaste ${fmt$(g)}.`); } });
      its.push({ ic: '📈', t: 'Pedir un ascenso', dis: !d.niveles[t.nivel + 1] ? 'Ya estás en la cima.' : false, fn: () => this.pedirAscenso() });
      its.push({ ic: '💵', t: 'Pedir un aumento', fn: () => { if (!usar('aumento', 1)) return; if (R.chance(t.desempeno / 130)) { t.bono = 1.08; log('Tu jefe aceptó darte un aumento del 8% este año.', 'bueno'); toast('💵 ¡Aumento aprobado!'); } else { t.desempeno = clamp(t.desempeno - 5); log('Tu jefe rechazó tu pedido de aumento.', 'malo'); toast('Aumento rechazado'); } } });
      its.push({ ic: '🍻', t: 'Socializar con compañeros', fn: () => { if (!usar('socializar', 1)) return; mod({ felicidad: 3, estres: -3 }); t.desempeno = clamp(t.desempeno + 2); if (R.chance(0.45)) Relaciones.nuevoAmigo('en el trabajo'); else log('Saliste con tus compañeros después del trabajo.'); } });
      its.push({ ic: '🚪', t: 'Renunciar', cls: 'peligro', fn: () => Modal.mostrar({ ic: '🚪', titulo: '¿Renunciar?', texto: `<p>Dejarás de ganar ${fmt$(this.salario())} al año.</p>`, opciones: [{ t: 'Renunciar', cls: 'peligro', fn: () => this.dejar(`Renunciaste a tu trabajo como ${d.niveles[t.nivel]}.`) }, { t: 'Mejor no' }] }) });
    }
    if (p.edad >= 55 && (p.trabajo || !p.jubilado)) {
      const aniosTot = Object.values(p.expTrab).reduce((s, v) => s + v, 0);
      its.push({ ic: '🏖️', t: 'Jubilarse', s: `Años trabajados: ${aniosTot}. ${aniosTot >= 10 ? 'Tendrás pensión.' : 'Sin pensión (menos de 10 años de aportes).'}`, fn: () => this.jubilar() });
    }
    if (!p.trabajo) {
      its.push({ sec: 'Empleo' });
      if (p.edad >= 18) its.push({ ic: '🔎', t: 'Buscar empleo', s: 'Bolsa de trabajo con requisitos', fn: () => this.buscar() });
      else if (p.edad >= 14) {
        if (p.medioTiempo) its.push({ ic: p.medioTiempo.ic, t: p.medioTiempo.titulo, s: `Medio tiempo · ${fmt$(p.medioTiempo.salario * eco())}/año`, fn: () => Modal.mostrar({ titulo: 'Medio tiempo', texto: '<p>¿Dejar este trabajo?</p>', opciones: [{ t: 'Renunciar', cls: 'peligro', fn: () => { p.medioTiempo = null; log('Dejaste tu trabajo de medio tiempo.'); } }, { t: 'Seguir' }] }) });
        else for (const m of MEDIO_TIEMPO) its.push({ ic: m.ic, t: m.titulo, s: `${fmt$(m.salario * eco())}/año · baja un poco tus notas`, dis: m.int && p.st.inteligencia < m.int ? `Necesitas inteligencia ${m.int}%.` : false, fn: () => { if (R.chance(0.7)) { p.medioTiempo = { ...m }; log(`Conseguiste un trabajo de medio tiempo: ${m.titulo}.`, 'bueno'); } else { usar('mt', 99); toast('No te contrataron.'); } } });
      } else its.push({ info: 'Aún eres muy joven para trabajar.' });
    }
    return its;
  },
  pedirAscenso() {
    const p = S.p, t = p.trabajo, d = this.def(t.id);
    if (!usar('ascenso', 1)) return;
    const motivo = this.motivoNivel(d, t.nivel + 1);
    if (motivo) return aviso('Ascenso imposible', `<p>${motivo}</p>`, '🚫');
    const prob = (t.desempeno - 40) / 60 + Math.min(t.anios, 4) * 0.06 - t.nivel * 0.04 + (Rasgos.tiene('lider') ? 0.12 : 0); Rasgos.pista('lider');
    if (t.anios >= 1 && R.chance(clamp(prob * 100, 3, 90) / 100)) this.ascender('¡Te dieron el ascenso que pediste!');
    else { t.desempeno = clamp(t.desempeno - 4); log('Pediste un ascenso pero te dijeron que aún no.', 'malo'); aviso('Todavía no', `<p>"Sigue esforzándote${t.anios < 1 ? ', acabas de empezar en este puesto' : ''}."</p>`, '⏳'); }
  },
  jubilar() {
    const p = S.p;
    const aniosTot = Object.values(p.expTrab).reduce((s, v) => s + v, 0);
    const ult = p.trabajo ? this.salario() : p.ultimoSalario;
    if (p.trabajo) this.dejar();
    p.jubilado = true;
    p.pension = aniosTot >= 10 ? Math.round(ult * (aniosTot >= 30 ? 0.6 : aniosTot >= 20 ? 0.5 : 0.35)) : 0;
    log(`🏖️ Te jubilaste. ${p.pension ? `Recibirás una pensión de ${fmt$(p.pension)} al año.` : 'No te corresponde pensión.'}`, 'info');
    mod({ felicidad: 10, estres: -20 });
  },
};

/* ---------- Panel "Ocupación" ---------- */
const Ocupacion = {
  abrir() {
    if (S.p.carcel) return Crimen.panelCarcel();
    if (Apocalipsis.activo()) return Apocalipsis.panel();
    Panel.abrir(() => S.p.edad < 18 ? 'Escuela y trabajo' : 'Ocupación', () => {
      const p = S.p;
      if (p.carcel) return [{ info: 'Estás en prisión.' }];
      const its = [...Trabajo.items(), ...Educacion.items()];
      const esp = Carreras.resumenItems();
      if (esp.length) its.push({ sec: 'Carreras especiales' }, ...esp);
      return its;
    });
  },
};
