'use strict';
/* =========================================================
   INICIO, MENÚ, MODO DIOS Y ARRANQUE
   ========================================================= */
const ORIGENES = [['azar', '🎲 Al azar'], ['pobre', '🪙 Humilde'], ['media', '🏘️ Clase media'], ['alta', '🏡 Acomodada'], ['rica', '💰 Muy rica']];

const Inicio = {
  sel: { objetivo: 'libre' },
  mostrar() {
    const el = $('#inicio');
    el.dataset.modo = 'inicio';
    S = null;
    $('#app').classList.add('oculto');
    Panel.cerrar();
    const guardada = Estado.cargar();
    const g = R.chance(0.5) ? 'M' : 'F';
    el.innerHTML = `<div class="inicio-caja">
      <div class="logo"><h1>Otra Vida</h1><p>Un simulador de vida real: cada decisión cuenta.</p></div>
      ${guardada && guardada.p.vivo ? `<button class="btn ok" id="btn-continuar">▶️ Continuar: ${esc(guardada.p.nombre)} ${esc(guardada.p.apellido)} (${guardada.p.edad} años)</button><div style="height:14px"></div>` : ''}
      <div class="tarjeta"><h3>1. ¿Quién serás?</h3>
        <div class="fila2"><label class="campo">Nombre<input id="i-nombre" maxlength="20" placeholder="Al azar"></label><label class="campo">Apellido<input id="i-apellido" maxlength="24" placeholder="Al azar"></label></div>
        <div class="fila2"><label class="campo">Género<select id="i-genero"><option value="M" ${g === 'M' ? 'selected' : ''}>Masculino</option><option value="F" ${g === 'F' ? 'selected' : ''}>Femenino</option></select></label>
        <label class="campo">País<select id="i-pais">${Object.keys(PAISES).map(k => `<option ${k === 'Perú' ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
        <label class="campo">Origen familiar<select id="i-origen">${ORIGENES.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
        <label class="chk" id="i-real-fila"><input type="checkbox" id="i-real"> 👑 Nacer en la familia real</label>
      </div>
      <div class="tarjeta"><h3>2. Elige primero tu objetivo</h3><p class="nota" style="margin-top:-4px">Lo más importante de una buena estrategia: ¿qué quieres lograr en esta vida? Tus decisiones serán más fáciles.</p>
        <div class="objetivos">${OBJETIVOS.map(o => `<button class="obj ${o.id === this.sel.objetivo ? 'sel' : ''}" data-obj="${o.id}"><b>${o.ic} ${o.nombre}</b>${o.desc}</button>`).join('')}</div>
        <p class="nota" id="i-consejo"></p>
      </div>
      <div class="tarjeta"><h3>3. ¿Un reto extra? (opcional)</h3>
        <label class="campo"><select id="i-reto">${RETOS.map(r => `<option value="${r.id}">${r.ic} ${r.nombre}${r.desc ? ' — ' + r.desc : ''}</option>`).join('')}</select></label>
      </div>
      <button class="btn ok" id="btn-empezar">👶 Nacer</button>
      <button class="btn sec" id="btn-azar">🎲 Vida completamente aleatoria</button>
      <button class="btn sec" id="btn-logros-ini">🏆 Logros (${Estado.logros().length}/${LOGROS.length})</button>
      <p class="nota" style="text-align:center;margin-top:16px">Tu partida se guarda automáticamente en este navegador.</p>
    </div>`;
    el.classList.remove('oculto'); el.scrollTop = 0;
    const realFila = $('#i-real-fila');
    const actReal = () => { realFila.style.display = PAISES[$('#i-pais').value].monarquia ? '' : 'none'; if (!PAISES[$('#i-pais').value].monarquia) $('#i-real').checked = false; };
    $('#i-pais').onchange = actReal; actReal();
    const consejo = () => { const o = OBJETIVOS.find(x => x.id === this.sel.objetivo); $('#i-consejo').innerHTML = o.stats.length ? `💡 Para esta meta, prioriza: <b>${o.stats.map(s => NOMBRE_STAT[s]).join(', ')}</b>. Prepárate desde la infancia.` : ''; };
    consejo();
    el.querySelectorAll('[data-obj]').forEach(b => b.onclick = () => { el.querySelectorAll('[data-obj]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); this.sel.objetivo = b.dataset.obj; consejo(); });
    if ($('#btn-continuar')) $('#btn-continuar').onclick = () => { S = guardada; this.entrarJuego(); };
    $('#btn-empezar').onclick = () => {
      const genero = $('#i-genero').value, paisN = $('#i-pais').value, origen = $('#i-origen').value;
      Estado.nuevaVida({ nombre: $('#i-nombre').value.trim() || null, apellido: $('#i-apellido').value.trim() || null, genero, pais: paisN, real: $('#i-real').checked, clase: origen === 'azar' ? null : origen, objetivo: this.sel.objetivo, reto: $('#i-reto').value });
      this.entrarJuego();
    };
    $('#btn-azar').onclick = () => {
      const paisN = R.pick(Object.keys(PAISES));
      Estado.nuevaVida({ genero: R.chance(0.5) ? 'M' : 'F', pais: paisN, real: PAISES[paisN].monarquia && R.chance(0.04), objetivo: R.pick(OBJETIVOS).id });
      this.entrarJuego();
    };
    $('#btn-logros-ini').onclick = () => Objetivos.panelLogros();
  },
  entrarJuego() {
    $('#inicio').classList.add('oculto'); $('#inicio').dataset.modo = '';
    $('#app').classList.remove('oculto');
    Modal.cola = []; Modal.activo = false; $('#modal-fondo').classList.add('oculto');
    Estado.guardar();
    actualizar();
  },
};

/* ---------- Menú ---------- */
const Menu = {
  abrir() {
    if (!S) return;
    Panel.abrir('Menú', () => {
      const p = S.p, ob = OBJETIVOS.find(o => o.id === p.objetivo), re = RETOS.find(r => r.id === p.reto);
      return [
        { sec: 'Tu vida' },
        { ic: ob.ic, t: `Objetivo: ${ob.nombre}`, s: `${ob.desc} · ${Objetivos.pista()}`, der: p.objCumplido ? '✅' : '', fn: () => this.cambiarObjetivo() },
        re.id !== 'ninguno' ? { ic: re.ic, t: `Reto: ${re.nombre}`, s: re.desc, der: p.retoCumplido ? '✅' : '' } : null,
        { ic: '📊', t: 'Estadísticas de la vida', fn: () => this.estadisticas() },
        { ic: '🏆', t: 'Logros', s: `${Estado.logros().length}/${LOGROS.length}`, fn: () => Objetivos.panelLogros() },
        { ic: '📖', t: 'Guía y estrategia', fn: () => this.guia() },
        { sec: 'Opciones' },
        { ic: '⚡', t: 'Modo Dios', s: p.dios ? 'Activo (los logros están desactivados)' : 'Edita tus estadísticas. Desactiva los logros de esta vida.', fn: () => this.dios() },
        { ic: '🌓', t: 'Cambiar tema claro / oscuro', fn: () => { const r = document.documentElement; const oscuro = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = oscuro ? 'light' : 'dark'; try { localStorage.setItem('otravida_tema', r.dataset.theme); } catch (e) {} } },
        { ic: '💾', t: 'Guardar partida', fn: () => { Estado.guardar(); toast('💾 Partida guardada'); } },
        { ic: '🆕', t: 'Nueva vida', cls: 'peligro', fn: () => Modal.mostrar({ ic: '🆕', titulo: '¿Empezar de nuevo?', texto: '<p>Se perderá la vida actual.</p>', opciones: [{ t: 'Sí, nueva vida', cls: 'peligro', fn: () => { Estado.borrar(); Inicio.mostrar(); } }, { t: 'Cancelar' }] }) },
      ];
    });
  },
  cambiarObjetivo() {
    const p = S.p;
    Modal.mostrar({ ic: '🎯', titulo: 'Cambiar objetivo', texto: '<p>Puedes cambiar de meta en cualquier momento.</p>', opciones: OBJETIVOS.map(o => ({ t: `${o.ic} ${o.nombre}`, fn: () => { p.objetivo = o.id; p.objCumplido = false; log(`🎯 Nueva meta: <b>${o.nombre}</b>.`, 'raro'); Objetivos.revisar(); } })) });
  },
  estadisticas() {
    Panel.abrir('Estadísticas', () => {
      const p = S.p, c = p.cont;
      return [
        { kv: [['Edad', p.edad], ['País', `${PAISES[p.pais].bandera} ${p.pais}`], ['Generación', p.generacion], ['Origen', { pobre: 'Humilde', media: 'Clase media', alta: 'Acomodada', rica: 'Muy rica', real: 'Realeza' }[p.clase]], ['Patrimonio neto', fmt$(patrimonio())], ['Patrimonio máximo', fmt$(c.maxPatrimonio)], ['Karma', p.st.karma + '%']] },
        { kv: [['Parejas', c.parejas], ['Matrimonios', c.matrimonios], ['Hijos', c.hijos], ['Viajes', c.viajes], ['Profesiones', c.profesiones.length], ['Películas', c.peliculas], ['Donado', fmt$(c.donado)]] },
        { kv: [['Delitos', c.crimenes], ['Antecedentes', p.antecedentes], ['Años en prisión', c.aniosCarcel], ['Fugas', c.fugas], ['Cirugías estéticas', c.cirugias]] },
        { kv: [['Economía', { normal: 'Estable', recesion: '📉 Recesión', auge: '📈 Auge' }[S.eco.estado]], ['Gastos de vida', fmt$(Finanzas.gastosVida()) + '/año']] },
      ];
    });
  },
  guia() {
    Panel.abrir('Guía y estrategia', () => [
      { info: '<b>1. Elige un objetivo.</b> Un futuro médico necesita un camino distinto al de un multimillonario, una supermodelo o un presidente. Decide qué quieres lograr y construye tu vida alrededor de eso.' },
      { info: '<b>2. No maximices todo.</b> 😊 Felicidad y ❤️ Salud sostienen tu vida; 🧠 Inteligencia abre carreras profesionales; ✨ Apariencia ayuda en modelaje, actuación y citas; 🌟 Fama es clave para celebridades y política. 😣 El estrés alto enferma.' },
      { info: '<b>3. Prepárate temprano.</b> Estudia en la escuela, únete a clubes y elige bien tu carrera universitaria. Muchas metas se deciden antes de los 18.' },
      { info: '<b>4. Salario ≠ riqueza.</b> Un buen sueldo te da comodidad, pero para fortunas enormes necesitas negocios, inversiones, bienes raíces o herencias. Vigila tus gastos y deudas.' },
      { info: '<b>5. Rutas especiales.</b> Modelaje (castings: lee el brief), actuación (audiciones), cine (guion + elenco + tendencias), política (concejal → presidente), astronauta (STEM + posgrado + salud), MMA (entrena y lee al rival), realeza (nace o cásate en la nobleza), crimen organizado (respeto, calor policial y lavado).' },
      { info: '<b>6. No descuides tu vida personal.</b> Pareja, hijos, amigos y salud importan. Al morir, puedes continuar como uno de tus hijos y construir una dinastía.' },
      { info: '<b>7. La vida real tiene sorpresas.</b> Recesiones, terremotos, pandemias, estafas, accidentes, inflación… Ten un colchón de ahorro y diversifica.' },
    ]);
  },
  dios() {
    const p = S.p;
    const ks = ['felicidad', 'salud', 'inteligencia', 'apariencia', 'estres', 'fama', 'karma'];
    Modal.mostrar({
      ic: '⚡', titulo: 'Modo Dios', texto: '<p>Ajusta tu personaje. Usarlo desactiva los logros en esta vida.</p>',
      html: ks.map(k => `<label class="campo">${NOMBRE_STAT[k]}: <b id="dv-${k}">${p.st[k]}</b><input type="range" min="0" max="100" value="${p.st[k]}" id="d-${k}" oninput="document.getElementById('dv-${k}').textContent=this.value"></label>`).join('') + `<label class="campo">💵 Dinero<input type="number" id="d-dinero" value="${p.dinero}"></label><label class="chk"><input type="checkbox" id="d-lic" ${p.licencia ? 'checked' : ''}> Licencia de conducir</label><label class="chk"><input type="checkbox" id="d-ant"> Borrar antecedentes penales</label>`,
      opciones: [{ t: 'Aplicar', cls: 'ok', fn: () => {
        p.dios = true;
        for (const k of ks) p.st[k] = clamp(+$('#d-' + k).value);
        p.dinero = Math.round(+$('#d-dinero').value || 0);
        p.licencia = $('#d-lic').checked;
        if ($('#d-ant').checked) p.antecedentes = 0;
        log('⚡ Usaste el Modo Dios.', 'raro');
      } }, { t: 'Cancelar' }],
    });
  },
};

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try { const t = localStorage.getItem('otravida_tema'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  document.querySelectorAll('#nav button').forEach(b => b.onclick = () => {
    if (!S || Modal.activo) return;
    if (!S.p.vivo) return Vida.mostrarMuerte();
    const n = b.dataset.nav;
    if (n === 'edad') return Vida.cumplirAnios();
    Panel.cerrar();
    if (n === 'ocupacion') Ocupacion.abrir();
    if (n === 'bienes') Finanzas.panel();
    if (n === 'relaciones') Relaciones.panel();
    if (n === 'actividades') Actividades.panel();
  });
  $('#btn-menu').onclick = () => Menu.abrir();
  Inicio.mostrar();
});
