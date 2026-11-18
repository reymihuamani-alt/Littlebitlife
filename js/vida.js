'use strict';
/* =========================================================
   VIDA: el paso de los años, la economía, la muerte
   y la continuación con la siguiente generación
   ========================================================= */
const Vida = {
  cumplirAnios() {
    if (!S || !S.p.vivo || Modal.activo) return;
    if (Apocalipsis.activo()) return Apocalipsis.turno();
    const p = S.p;
    Panel.cerrar();
    p.edad++; S.anio++;
    p.log.push({ edad: p.edad, anio: S.anio, l: [] });
    this.economia();
    Relaciones.anual();
    Educacion.anual();
    let ingreso = Trabajo.anual();
    ingreso += Carreras.anual();
    ingreso += Politica.anual();
    ingreso += Realeza.anual();
    ingreso += Negocios.anual();
    if (p.jubilado && p.pension) ingreso += p.pension;
    if (p.edu.enCurso && p.edu.enCurso.estipendio) ingreso += p.edu.enCurso.estipendio;
    Cine.anual();
    Crimen.anualOrg();
    Crimen.anualCarcel();
    Finanzas.anual(ingreso);
    if (p.vivo) Salud.anual();
    if (p.vivo) this.hitos();
    if (p.vivo) Rasgos.anual();
    if (p.vivo) Coleccion.anual();
    if (p.vivo) Habilidades.anual();
    if (p.vivo) Barrio.anual();
    if (p.vivo) Sombra.anual();
    p.cont.sumaFel += p.st.felicidad; p.cont.anios++;
    p.usos = {};
    if (p.vivo) Noticias.anual();
    if (p.vivo) Apocalipsis.anual();
    if (p.vivo) Asesino.anual();
    if (p.vivo) Historias.anual();
    if (p.vivo) Eventos.anual();
    if (p.vivo) this.chequeoMuerte();
    Objetivos.revisar();
    Estado.guardar();
    actualizar();
  },

  economia() {
    const e = S.eco;
    if (e.estado === 'normal') {
      if (R.chance(0.09)) { e.estado = 'recesion'; e.anios = R.int(1, 3); log('📉 El país entró en <b>recesión</b>: hay despidos y la bolsa cae.', 'malo'); }
      else if (R.chance(0.08)) { e.estado = 'auge'; e.anios = R.int(1, 3); log('📈 La economía vive un <b>auge</b>: más empleo y la bolsa sube.', 'bueno'); }
    } else if (--e.anios <= 0) { log(e.estado === 'recesion' ? '🌤️ La recesión terminó.' : 'La economía volvió a la normalidad.', 'gris'); e.estado = 'normal'; }
    if (pais().inflacion && R.chance(0.2)) { log('💸 La inflación se disparó este año: todo está más caro.', 'malo'); S.p.dinero = Math.round(S.p.dinero * 0.9); }
  },

  hitos() {
    const p = S.p;
    if (p.edad === 16 && !p.licencia) log('🪪 Ya tienes edad para sacar la licencia de conducir (Actividades).', 'gris');
    if (p.edad === 18 && Legado.tiene('fondo')) { const f = Math.round(25000 * Math.max(eco(), 0.5)); p.dinero += f; log(`🏦 Recibiste ${fmt$(f)} del fondo familiar que dejaron tus antepasados.`, 'bueno'); }
    if (p.edad === 18) {
      log('🎂 ¡Cumpliste 18! Ya eres mayor de edad.', 'info');
      const pa = personas('padre', 'madre');
      if (p.clase === 'alta' || p.clase === 'rica') {
        const m = Math.round(pa.reduce((s, x) => s + x.dinero, 0) * (p.clase === 'rica' ? 0.02 : 0.03));
        if (m > 0) { p.dinero += m; pa.forEach(x => x.dinero -= m / pa.length); log(`🎁 Tus padres te regalaron ${fmt$(m)} por tu mayoría de edad.`, 'bueno'); }
      }
      if (!pa.length) p.vivienda = 'alquiler';
    }
    if (p.edad === 65 && p.trabajo) Modal.mostrar({ ic: '🏖️', titulo: 'Edad de jubilación', texto: '<p>Cumpliste 65. ¿Te jubilas o sigues trabajando?</p>', opciones: [{ t: '🏖️ Jubilarme', fn: () => Trabajo.jubilar() }, { t: '💼 Seguir trabajando' }] });
    if (p.edad === 75 && p.trabajo && R.chance(0.5)) { log('Tu empresa te obligó a jubilarte por edad.', 'gris'); Trabajo.jubilar(); }
  },

  chequeoMuerte() {
    const p = S.p, st = p.st;
    if (st.salud <= 0) {
      const enf = p.enf.sort((a, b) => ENFERMEDADES[b.n].grav - ENFERMEDADES[a.n].grav)[0];
      return this.morir(enf ? enf.n.toLowerCase() : 'el deterioro de su salud');
    }
    const ajuste = 78 - pais().esperanza;
    const factor = st.salud < 20 ? 4 : st.salud < 40 ? 2 : st.salud < 60 ? 1.25 : st.salud > 85 ? 0.6 : 1;
    let q = Math.exp(-10.6 + 0.095 * (p.edad + ajuste)) * factor * (Rasgos.tiene('longevo') ? 0.6 : 1);
    if (p.edad < 5) q = 0.0008;
    if (p.adic.alcohol > 70) q *= 1.5;
    if (R.chance(q)) {
      const causa = p.edad > 75 ? R.pick(['causas naturales', 'un paro cardíaco mientras dormía', 'un derrame cerebral', 'una neumonía']) : R.pick(['un accidente de tránsito', 'un infarto fulminante', 'un accidente doméstico', 'un aneurisma']);
      this.morir(causa);
    }
  },

  morir(causa) {
    const p = S.p;
    if (!p.vivo) return;
    if (Legado.tiene('segunda') && !p.cont.segundaUsada && p.edad < 100) {
      p.cont.segundaUsada = true; p.st.salud = Math.max(p.st.salud, 35);
      log(`💫 Estuviste a punto de morir por ${causa}… pero sobreviviste milagrosamente.`, 'raro');
      Efectos.celebrar('💫', 'Segunda oportunidad', `<p>Los médicos no se lo explican: deberías haber muerto por ${causa}.</p><p class="nota">Tu mejora de legado se consumió en esta vida.</p>`);
      return;
    }
    p.vivo = false; p.causa = causa;
    log(`🪦 <b>Moriste a los ${p.edad} años</b> por ${causa}.`, 'malo');
    Objetivos.revisar(true);
    Legado.registrarMuerte();
    Estado.guardar();
  },

  /* ---------- Pantalla de defunción ---------- */
  mostrarMuerte() {
    const p = S.p, el = $('#inicio');
    if (!el.classList.contains('oculto') && el.dataset.modo === 'muerte') return;
    Panel.cerrar();
    const pt = patrimonio(), cintas = Objetivos.cintas();
    const ob = OBJETIVOS.find(o => o.id === p.objetivo), re = RETOS.find(r => r.id === p.reto);
    const hs = hijos();
    el.dataset.modo = 'muerte';
    el.innerHTML = `<div class="inicio-caja">
      <div class="lapida">🪦</div>
      <h2 style="text-align:center;margin:4px 0">${esc(p.nombre)} ${esc(p.apellido)}</h2>
      <p class="nota" style="text-align:center">${S.anio - p.edad} – ${S.anio} · ${PAISES[p.pais].bandera} ${p.pais} · Generación ${p.generacion}</p>
      <div class="tarjeta"><p style="margin:0 0 8px">Murió a los <b>${p.edad} años</b> por ${esc(p.causa)}.</p>
        <div class="infobox" style="margin:0">
          <div class="kv"><span>Última ocupación</span><b>${esc(this.ultimaOcupacion())}</b></div>
          <div class="kv"><span>Patrimonio</span><b>${fmt$(pt)}</b></div>
          <div class="kv"><span>Patrimonio máximo</span><b>${fmt$(p.cont.maxPatrimonio)}</b></div>
          <div class="kv"><span>Hijos</span><b>${p.cont.hijos}</b></div>
          <div class="kv"><span>Matrimonios</span><b>${p.cont.matrimonios}</b></div>
          <div class="kv"><span>Fama</span><b>${p.st.fama}%</b></div>
          <div class="kv"><span>Karma</span><b>${p.st.karma}%</b></div>
          <div class="kv"><span>Objetivo</span><b>${ob.ic} ${ob.nombre} ${ob.id === 'libre' ? '' : p.objCumplido ? '✅' : '❌'}</b></div>
          ${re.id !== 'ninguno' ? `<div class="kv"><span>Reto</span><b>${re.ic} ${re.nombre} ${p.retoCumplido ? '✅' : '❌'}</b></div>` : ''}
        </div></div>
      <div class="tarjeta" style="text-align:center"><h3>Cintas de esta vida</h3>
        <span class="cinta">${cintas[0].ic} ${cintas[0].n}</span><p class="nota">${cintas[0].d}</p>
        ${cintas.slice(1).map(c => `<span class="cinta sec">${c.ic} ${c.n}</span>`).join('')}</div>
      ${hs.length ? `<div class="tarjeta"><h3>Continuar con tu descendencia</h3><p class="nota">Tu patrimonio se reparte entre tus herederos (10% de impuesto a la herencia).</p>${hs.map(h => `<button class="btn sec" data-hijo="${h.id}">${Relaciones.icono(h)} Continuar como ${esc(h.nombre)} (${h.edad} años)</button>`).join('')}</div>` : ''}
      ${this.htmlLegado()}
      <button class="btn ok" id="btn-nueva">✨ Empezar una nueva vida</button>
      <button class="btn sec" id="btn-ver-vida">📜 Ver el registro de esta vida</button>
    </div>`;
    el.classList.remove('oculto');
    el.scrollTop = 0;
    el.querySelectorAll('[data-hijo]').forEach(b => b.onclick = () => this.continuarComo(hs.find(h => h.id === b.dataset.hijo)));
    $('#btn-nueva').onclick = () => { Estado.borrar(); Inicio.mostrar(); };
    if ($('#btn-legado')) $('#btn-legado').onclick = () => Legado.panel();
    if (this._legadoAnimado !== p) { this._legadoAnimado = p; Efectos.vibrar([30, 50, 30]); }
    $('#btn-ver-vida').onclick = () => { el.classList.add('oculto'); el.dataset.modo = 'revision'; $('#app').classList.remove('oculto'); toast('Toca ＋ para volver a la pantalla final.'); };
  },
  htmlLegado() {
    const p = S.p, lg = p.legado || Legado.registrarMuerte(), l = Legado.cargar();
    return `<div class="tarjeta legado"><h3>🏛️ Legado ganado: +${lg.pts} puntos</h3>${lg.detalle.map(([t, v]) => `<div class="kv-l"><span>${t}</span><b>+${v}</b></div>`).join('')}
      <p class="nota">Total disponible: <b>${l.puntos}</b> puntos · Colección: ${l.cintas.length}/${CINTAS.length} cintas</p>
      <button class="btn sec" id="btn-legado">🏛️ Gastar puntos de legado</button></div>`;
  },
  /* Reputación del apellido (−100 escándalo … +100 prestigio). Se diluye con cada generación. */
  reputacionDe(v) {
    const c = v.cont, e = v.esp;
    let r = (v.apellidoRep || 0) * 0.5;
    r += (v.st.karma >= 45 ? 1 : -1) * v.st.fama * 0.4;
    if (c.cargos.includes('presidente')) r += 25; else if (c.cargos.length) r += 8;
    if (e.director && e.director.estatuillas) r += 15;
    if (c.detective) r += 15;
    if (c.donado >= 1e5) r += 15;
    if (c.reino) r += 20;
    if (c.sombraExpuesta) r -= 55;
    if (e.org && e.org.rango >= 3) r -= 20;
    if (c.aniosCarcel >= 10) r -= 15;
    if (v.politicaEscandalo) r -= 10;
    return Math.round(clamp(r, -100, 100));
  },
  textoReputacion(r) {
    return r >= 60 ? 'Leyenda' : r >= 30 ? 'Prestigio' : r >= 15 ? 'Buen nombre' : r > -15 ? 'Neutral' : r > -40 ? 'Mala fama' : 'Escándalo';
  },
  ultimaOcupacion() {
    const p = S.p, e = p.esp;
    if (e.realeza && e.realeza.titulo) return e.realeza.titulo;
    if (p.trabajo) return Trabajo.tituloActual();
    if (e.politica && e.politica.cargo) return CARGOS[e.politica.cargo].n;
    if (e.org && e.org.activo) return RANGOS_ORG[e.org.rango];
    if (p.jubilado) return 'Jubilad' + gx(p, 'o', 'a');
    if (p.carcel) return 'Recluso';
    if (p.edad < 18) return 'Estudiante';
    return p.negocios.length ? 'Empresari' + gx(p, 'o', 'a') : 'Sin ocupación';
  },

  /* ---------- Siguiente generación ---------- */
  continuarComo(h) {
    const viejo = S.p, anio = S.anio;
    const herederos = hijos().length + (viejo.rel.some(r => r.tipo === 'conyuge' && r.vivo) ? 1 : 0);
    const pt = Math.max(0, patrimonio());
    // Las empresas y la productora pasan íntegras al heredero que continúa la historia
    const negocios = viejo.negocios.map(n => ({ ...n }));
    const valorNeg = negocios.reduce((s, n) => s + n.valor * (n.participacion ?? 1), 0);
    const dir = viejo.esp.director;
    const org = viejo.esp.org && viejo.esp.org.rango >= 2 ? viejo.esp.org : null;
    const rep = this.reputacionDe(viejo);
    const parte = Math.round(Math.max(0, pt - valorNeg) * 0.9 / Math.max(1, herederos));
    const lista = [`💵 <b>${fmt$(parte)}</b> en efectivo (tu parte de la herencia)`];
    if (negocios.length) lista.push(`🏢 ${negocios.length === 1 ? 'La empresa familiar' : `Las ${negocios.length} empresas familiares`}: ${negocios.map(n => `<b>${esc(n.nombre)}</b>`).join(', ')} (${fmt$(valorNeg)})`);
    if (dir) lista.push(`🎬 La productora <b>${esc(dir.productora)}</b> (${dir.peliculas.length} película${dir.peliculas.length === 1 ? "" : "s"}${dir.estatuillas ? ', ' + '🏆'.repeat(dir.estatuillas) : ''})`);
    if (org) lista.push(`🕶️ Un lugar en <b>${esc(org.nombre)}</b>, la organización de tu familia`);
    lista.push(`${rep >= 15 ? '🌟' : rep <= -15 ? '🗞️' : '😐'} Reputación del apellido ${esc(viejo.apellido)}: <b>${this.textoReputacion(rep)}</b>`);
    const dinastia = { millonarios: [...S.dinastia.millonarios, pt >= 1e6] };
    const eraMonarca = viejo.esp.realeza && viejo.esp.realeza.monarca && !viejo.esp.realeza.consorte;
    const eraReal = !!viejo.esp.realeza;
    const heredero = hijos().filter(x => x.real).sort((a, b) => b.edad - a.edad)[0];
    const conyuge = viejo.rel.find(r => r.tipo === 'conyuge' && r.vivo) || viejo.rel.find(r => r.id === h.otroPadre);
    Modal.mostrar({
      ic: '🌳', titulo: `La vida de ${h.nombre}`, texto: `<p>Lo que heredas:</p>${lista.map(x => `<p>${x}</p>`).join('')}<p>Elige el objetivo para esta nueva vida:</p>`,
      opciones: OBJETIVOS.map(o => ({ t: `${o.ic} ${o.nombre}`, fn: () => {
        const clase = parte > 5e6 ? 'rica' : parte > 2e5 ? 'alta' : viejo.clase === 'pobre' && parte < 2e4 ? 'pobre' : 'media';
        const heredados = (viejo.rasgos || []).map(x => x.id).filter(id => HEREDABLES.includes(id) && R.chance(0.4));
        Estado.nuevaVida({ nombre: h.nombre, apellido: h.apellido, genero: h.genero, pais: viejo.pais, objetivo: o.id, reto: 'ninguno', generacion: viejo.generacion + 1, anio, dinastia, clase, heredados });
        const p = S.p;
        p.edad = Math.max(0, h.edad); p.clase = clase;
        p.st.apariencia = h.apa; p.st.inteligencia = h.int; p.st.felicidad = clamp(h.cercania - 20); p.st.salud = R.int(60, 100);
        p.st.fama = eraReal ? 50 : Math.round(viejo.st.fama * 0.45);
        p.dinero = parte;
        p.apellidoRep = rep;
        p.negocios = negocios;
        if (dir) p.esp.director = { productora: dir.productora, habilidad: clamp(Math.round(dir.habilidad * 0.25) + 10), reputacion: clamp(Math.round(dir.reputacion * 0.7)), peliculas: [], estatuillas: 0, legado: { fundador: `${viejo.nombre} ${viejo.apellido}`, peliculas: dir.peliculas.length + (dir.legado ? dir.legado.peliculas : 0), estatuillas: dir.estatuillas + (dir.legado ? dir.legado.estatuillas : 0) } };
        if (org) p.esp.org = { ...org, activo: false, operacion: 0, dineroSucio: 0, rango: Math.max(0, org.rango - 2), respeto: Math.round(org.respeto * 0.4), calor: Math.round(org.calor * 0.5), miembros: Math.round(org.miembros * 0.5), seguridad: Math.round(org.seguridad * 0.5) };
        // Familia: el progenitor fallecido, el otro progenitor y los hermanos
        p.rel = [];
        p.rel.push({ id: uid(), tipo: viejo.genero === 'F' ? 'madre' : 'padre', genero: viejo.genero, nombre: viejo.nombre, apellido: viejo.apellido, edad: viejo.edad, cercania: h.cercania, vivo: false, profesion: this.ultimaOcupacion(), dinero: 0, apa: viejo.st.apariencia, int: viejo.st.inteligencia });
        if (conyuge) { const c = { ...conyuge, tipo: conyuge.genero === 'F' ? 'madre' : 'padre', cercania: R.int(60, 95) }; if (!c.vivo) c.vivo = false; c.dinero = conyuge.vivo ? conyuge.dinero + parte : 0; p.rel.push(c); }
        for (const x of hijos().filter(x => x !== h)) p.rel.push({ ...x, tipo: 'hermano' });
        for (const x of viejo.rel.filter(r => r.tipo === 'nieto' && r.vivo)) if (R.chance(0.3)) p.rel.push({ ...x, tipo: 'amigo', nombre: x.nombre });
        // Estudios según edad
        if (p.edad >= 12) p.edu.titulos.push({ tipo: 'primaria', nombre: 'Primaria' });
        if (p.edad >= 17) p.edu.titulos.push({ tipo: 'secundaria', nombre: 'Secundaria' });
        p.vivienda = p.edad < 18 && conyuge && conyuge.vivo ? 'padres' : p.edad < 18 ? 'padres' : 'alquiler';
        // Realeza
        if (eraReal && h.real) {
          p.esp.realeza = { pais: viejo.esp.realeza.pais, popularidad: viejo.esp.realeza.popularidad, monarca: false, consorte: false, titulo: '' };
          if (eraMonarca && heredero === h) { p.esp.realeza.monarca = true; p.cont.reino = true; p.esp.realeza.titulo = Realeza.tituloMonarca(p.esp.realeza.pais, p.genero, false); }
          else Realeza.actualizarTitulo();
        } else p.esp.realeza = null;
        p.log = [{ edad: p.edad, anio, l: [] }];
        log(`🌳 Continúas la historia familiar como <b>${esc(p.nombre)} ${esc(p.apellido)}</b> (${p.edad} años), hij${gx(p, 'o', 'a')} de ${esc(viejo.nombre)}.`, 'info');
        log(`📜 Heredaste ${fmt$(parte)}.`, 'bueno');
        for (const n of p.negocios) log(`🏢 Heredaste la empresa familiar <b>${esc(n.nombre)}</b> (${n.sectorN}, valor ${fmt$(n.valor * (n.participacion ?? 1))}).${p.edad < 18 ? ' Un administrador la gestionará hasta tu mayoría de edad.' : ''}`, 'bueno');
        if (p.esp.director) log(`🎬 Heredaste la productora <b>${esc(p.esp.director.productora)}</b>. La industria respeta el legado de ${esc(viejo.nombre)}.`, 'raro');
        if (p.esp.org) log(`🕶️ Los viejos socios de ${esc(viejo.nombre)} en ${esc(p.esp.org.nombre)} dicen que hay un lugar para ti cuando quieras… (Actividades → Crimen).`, 'malo');
        if (rep >= 15) log(`🌟 El apellido ${esc(p.apellido)} es sinónimo de <b>${this.textoReputacion(rep).toLowerCase()}</b>: abre puertas en entrevistas, citas y elecciones.`, 'raro');
        else if (rep <= -15) log(`🗞️ El apellido ${esc(p.apellido)} carga con <b>${this.textoReputacion(rep).toLowerCase()}</b>: la gente te juzga antes de conocerte.`, 'malo');
        if (p.esp.realeza && p.esp.realeza.monarca) log(`👑 Asciendes al trono como <b>${p.esp.realeza.titulo}</b>.`, 'raro');
        if (o.id !== 'libre') log(`🎯 Meta de esta vida: <b>${o.nombre}</b>. ${o.desc}`, 'raro');
        Objetivos.revisar();
        Estado.guardar();
        Inicio.entrarJuego();
      } })),
    });
  },
};
