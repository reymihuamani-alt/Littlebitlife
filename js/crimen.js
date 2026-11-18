'use strict';
/* =========================================================
   CRIMEN: delitos, juicios, prisión, fugas y la organización
   (la ruta "del menudeo a capo", con consecuencias reales)
   ========================================================= */
const Crimen = {
  panel() {
    Panel.abrir('Crimen', () => {
      const p = S.p, its = [];
      its.push({ info: '⚠️ El crimen puede pagar… hasta que no. Cada delito suma antecedentes, baja tu karma y cierra puertas (policía, juez, adopción, política).' });
      its.push({ kv: [['Antecedentes penales', p.antecedentes], ['Delitos cometidos', p.cont.crimenes], ['Años en prisión', p.cont.aniosCarcel], p.fugitivo ? ['Estado', '🚨 Prófugo'] : null].filter(Boolean) });
      its.push({ sec: 'Delitos' });
      for (const c of CRIMENES) its.push({ ic: c.ic, t: c.n, s: `Éxito base ${Math.round(c.exito * 100)}% · pena ${c.pena[0]}-${c.pena[1]} años`, dis: p.edad < c.edad ? `Debes tener al menos ${c.edad} años.` : c.int && p.st.inteligencia < c.int ? `Necesitas inteligencia ${c.int}%.` : false, fn: () => this.cometer(c) });
      if (p.edad >= 14) its.push({ ic: '👊', t: 'Pelea callejera', s: 'Gana respeto en la calle', fn: () => this.peleaCallejera() });
      if (p.edad >= 18) { its.push({ sec: 'Crimen organizado' }); its.push({ ic: '🕶️', t: p.esp.org && p.esp.org.activo ? `La organización: ${RANGOS_ORG[p.esp.org.rango]}` : 'Entrar al crimen organizado', s: p.esp.org && p.esp.org.activo ? `Respeto ${p.esp.org.respeto} · calor policial ${p.esp.org.calor}%` : 'La ruta del menudeo a capo', fn: () => this.panelOrg(), cls: p.esp.org && p.esp.org.activo ? 'destacado' : '' }); its.push({ ic: '🕳️', t: 'Mercado negro', s: 'Documentos falsos, autos sin papeles, antigüedades dudosas…', fn: () => MercadoNegro.panel() }); its.push({ ic: '🌑', t: 'Doble vida', s: p.esp.sombra && p.esp.sombra.activo ? `${p.esp.sombra.victimas} casos · sospecha ${p.esp.sombra.sospecha}%` : 'Un justiciero con código… al estilo de una serie', fn: () => Sombra.panel(), cls: p.esp.sombra && p.esp.sombra.activo ? 'destacado' : '' }); }
      return its;
    });
  },
  cometer(c) {
    const p = S.p;
    if (!usar('crimen_' + c.id, 2)) return;
    const bonus = p.esp.org && p.esp.org.activo ? p.esp.org.rango * 0.03 : 0;
    const prob = c.exito + (p.st.inteligencia - 50) / 400 + bonus + (p.st.salud - 50) / 600 + (Rasgos.tiene('frio') ? 0.08 : 0) + (Rasgos.tiene('suerte') ? 0.05 : 0);
    Rasgos.pista('frio');
    p.cont.crimenes++; mod({ karma: c.karma });
    if (R.chance(prob)) {
      const b = Math.round(R.int(c.botin[0], c.botin[1]) * Math.max(eco(), 0.4));
      p.dinero += b; mod({ felicidad: c.fel || 2, estres: 4 });
      log(`${c.ic} ${c.n}: ¡te salió bien!${b ? ` Botín: ${fmt$(b)}.` : ''}`, 'raro');
      toast(b ? `💰 +${fmt$(b)}` : 'Te saliste con la tuya');
    } else if (R.chance(0.72)) {
      log(`🚓 Te atraparon intentando: ${c.n.toLowerCase()}.`, 'malo');
      this.arrestar(c.n.toLowerCase(), c.pena);
    } else { mod({ estres: 8 }); log(`Fallaste al intentar: ${c.n.toLowerCase()}, pero lograste huir.`, 'malo'); toast('¡Escapaste por poco!'); }
  },
  peleaCallejera() {
    const p = S.p;
    if (!usar('peleaCalle', 1)) return;
    const rival = { nombre: `${R.pick(NOMBRES.M)} "${R.pick(['el Loco', 'Puños', 'el Chato', 'la Roca', 'el Flaco'])}"`, fuerza: R.int(30, 75) };
    Minijuegos.pelea({ titulo: '👊 Pelea callejera', rival, poder: p.st.salud * 0.6 + (p.esp.luchador ? p.esp.luchador.entreno * 0.5 : 10) + (Rasgos.tiene('atleta') ? 12 : 0) + Habilidades.nivel('combate') * 2, alFin: gano => {
      Rasgos.pista('atleta'); Rasgos.pista('temperamental');
      mod({ karma: -3 });
      if (gano) { mod({ felicidad: 4 }); if (p.esp.org) p.esp.org.respeto += 4; log(`👊 Le ganaste una pelea callejera a ${rival.nombre}.`, 'raro'); }
      else { mod({ salud: -R.int(5, 15), felicidad: -5 }); log(`👊 ${rival.nombre} te dio una paliza.`, 'malo'); }
      if (R.chance(0.2)) { log('🚓 La policía llegó y te detuvo por agresión.', 'malo'); this.arrestar('agresión', [0, 2]); }
    } });
  },

  /* ---------- Justicia ---------- */
  arrestar(delito, pena) {
    const p = S.p;
    if (p.edad < 16) {
      log(`👮 Como eres menor de edad, la policía te llevó a casa. Tus padres están furiosos.`, 'malo');
      personas('padre', 'madre').forEach(x => x.cercania = clamp(x.cercania - 15));
      mod({ felicidad: -8 });
      if (pena[1] > 2) this.sentenciar(delito, Math.min(2, R.int(1, 2)), true);
      return;
    }
    const e = eco();
    const ops = [
      { t: '⚖️ Defensor público (gratis)', fn: () => this.juicio(delito, pena, 0.22) },
      { t: `👔 Abogado privado — ${fmt$(15000 * e)}`, dis: p.dinero < 15000 * e, fn: () => { p.dinero -= Math.round(15000 * e); this.juicio(delito, pena, 0.42); } },
      { t: `🦈 Bufete de élite — ${fmt$(120000 * e)}`, dis: p.dinero < 120000 * e, fn: () => { p.dinero -= Math.round(120000 * e); this.juicio(delito, pena, 0.62); } },
      { t: `💼 Intentar sobornar al juez — ${fmt$(250000 * e)}`, dis: p.dinero < 250000 * e, fn: () => {
        p.dinero -= Math.round(250000 * e); mod({ karma: -8 });
        if (R.chance(0.5)) { log('💼 El juez "perdió" las pruebas. Quedaste libre.', 'raro'); aviso('Caso cerrado', '<p>Las pruebas desaparecieron misteriosamente.</p>', '🤫'); }
        else { log('El juez denunció tu intento de soborno.', 'malo'); this.sentenciar(delito, R.int(pena[0], pena[1]) + 3); }
      } },
    ];
    Modal.mostrar({ ic: '⚖️', titulo: 'Te acusan de ' + delito, texto: `<p>Vas a juicio. Antecedentes previos: <b>${p.antecedentes}</b> (aumentan la condena). ¿Quién te defiende?</p>`, opciones: ops });
  },
  juicio(delito, pena, probAbsuelto, listo) {
    if (!listo) return Efectos.suspenso('⚖️ El jurado delibera…', () => this.juicio(delito, pena, probAbsuelto, true), 1600, '⚖️');
    const p = S.p;
    if (R.chance(probAbsuelto - p.antecedentes * 0.04)) {
      log(`⚖️ ¡Fuiste declarad${gx(p, 'o', 'a')} inocente de ${delito}!`, 'bueno'); mod({ felicidad: 10 });
      return Efectos.celebrar('🎉', '¡Inocente!', '<p>El jurado te declaró no culpable.</p>');
    }
    let anios = R.int(pena[0], pena[1]) + Math.min(10, p.antecedentes);
    if (probAbsuelto > 0.5) anios = Math.max(pena[0], anios - 2);
    this.sentenciar(delito, anios);
  },
  sentenciar(delito, anios, juvenil = false) {
    const p = S.p;
    p.antecedentes++;
    if (anios <= 0) {
      const multa = Math.round(R.int(300, 3000) * eco()); p.dinero -= multa;
      log(`⚖️ Te condenaron a una multa de ${fmt$(multa)} y servicio comunitario por ${delito}.`, 'malo');
      return aviso('Sentencia', `<p>Multa de ${fmt$(multa)} y 200 horas de servicio comunitario.</p>`, '🧹');
    }
    p.carcel = { total: anios, restantes: anios, delito, conducta: 50, pandilla: false, juvenil };
    p.fugitivo = false;
    if (p.trabajo) Trabajo.dejar(`Perdiste tu trabajo como ${Trabajo.tituloActual()}.`, 'malo');
    p.medioTiempo = null;
    if (p.edu.enCurso) { log(`Perdiste tu lugar en ${p.edu.enCurso.nombre}.`, 'malo'); p.edu.enCurso = null; }
    const pa = pareja(); if (pa && pa.tipo === 'pareja' && R.chance(0.5)) { pa.tipo = 'ex'; log(`💔 ${pa.nombre} te dejó al enterarse de tu condena.`, 'malo'); }
    if (p.esp.org && p.esp.org.activo) { p.esp.org.activo = false; p.esp.org.operacion = 0; p.esp.org.dineroSucio = Math.round(p.esp.org.dineroSucio * 0.2); log('La organización siguió sin ti y la policía incautó casi todo tu dinero sucio.', 'malo'); }
    mod({ felicidad: -25, estres: 15, fama: p.st.fama > 30 ? 5 : 0 });
    if (p.st.fama >= 40) Noticias.emitir(`${p.nombre} ${p.apellido} es condenad${gx(p, 'o', 'a')} a ${anios} años de prisión por ${delito}.`);
    log(`⛓️ Te condenaron a <b>${anios} año${anios > 1 ? 's' : ''}</b> de ${juvenil ? 'centro juvenil' : 'prisión'} por ${delito}.`, 'malo');
    Estado.darLogro('carcel');
    aviso('Sentencia', `<p>${anios} año${anios > 1 ? 's' : ''} de ${juvenil ? 'internamiento en un centro juvenil' : 'prisión'}.</p>`, '⛓️');
    Panel.cerrar();
  },
  liberar(motivo) {
    const p = S.p;
    p.carcel = null;
    p.vivienda = personas('padre', 'madre').length ? 'padres' : 'alquiler';
    log(`🔓 ${motivo}`, 'bueno'); mod({ felicidad: 15 });
  },

  /* ---------- Vida en prisión ---------- */
  panelCarcel() {
    Panel.abrir('Prisión', () => {
      const p = S.p, c = p.carcel;
      if (!c) return [{ info: '¡Eres libre!' }];
      const cumplidos = c.total - c.restantes;
      return [
        { kv: [['Delito', c.delito], ['Condena', `${c.total} años`], ['Te quedan', `${c.restantes} años`], ['Pandilla', c.pandilla ? 'Sí' : 'No']] },
        { barra: ['Buena conducta', c.conducta] },
        { ic: '🏋️', t: 'Hacer ejercicio en el patio', fn: () => { if (!usar('patio', 2)) return; mod({ salud: 3, apariencia: 1, estres: -3 }); log('Hiciste ejercicio en el patio.'); } },
        { ic: '📚', t: 'Leer en la biblioteca', fn: () => { if (!usar('bibliotecaC', 2)) return; mod({ inteligencia: R.int(1, 3), estres: -2 }); c.conducta = clamp(c.conducta + 3); log('Leíste en la biblioteca de la prisión.'); } },
        { ic: '🔨', t: 'Trabajar en el taller', s: 'Mejora tu conducta', fn: () => { if (!usar('taller', 1)) return; c.conducta = clamp(c.conducta + 8); p.dinero += Math.round(300 * eco()); log('Trabajaste en el taller de la prisión.'); } },
        { ic: '🎓', t: 'Estudiar la secundaria en prisión', dis: tieneTitulo('secundaria') ? 'Ya tienes la secundaria.' : false, fn: () => { if (!usar('gedC', 1)) return; if (R.chance(0.45 + p.st.inteligencia / 250)) { p.edu.titulos.push({ tipo: 'secundaria', nombre: 'Secundaria' }); c.conducta = clamp(c.conducta + 10); log('🎓 Obtuviste tu título de secundaria en prisión.', 'bueno'); } else log('Reprobaste el examen.', 'malo'); } },
        { ic: '🧱', t: c.pandilla ? 'Salir de la pandilla' : 'Unirse a una pandilla', s: c.pandilla ? '' : 'Protección a cambio de lealtad', fn: () => { c.pandilla = !c.pandilla; c.conducta = clamp(c.conducta + (c.pandilla ? -15 : 5)); log(c.pandilla ? 'Te uniste a una pandilla de la prisión.' : 'Dejaste la pandilla. Ahora estás sol' + gx(p, 'o', 'a') + '.'); } },
        { ic: '👊', t: 'Pelear con un recluso', fn: () => { if (!usar('peleaC', 1)) return; const rival = { nombre: `${R.pick(NOMBRES.M)} "${R.pick(['el Tatuado', 'Cicatriz', 'el Mudo', 'Bulldog'])}"`, fuerza: R.int(35, 80) }; Minijuegos.pelea({ titulo: '👊 Pelea en el patio', rival, poder: p.st.salud * 0.6 + (c.pandilla ? 12 : 0), alFin: g => { c.conducta = clamp(c.conducta - 15); if (g) { log(`Le ganaste la pelea a ${rival.nombre}. Ahora te respetan.`, 'raro'); mod({ felicidad: 3 }); } else { mod({ salud: -R.int(8, 20) }); log(`${rival.nombre} te dio una paliza.`, 'malo'); } if (R.chance(0.3)) { c.restantes++; c.total++; log('Los guardias te añadieron un año de condena por la pelea.', 'malo'); } } }); } },
        { ic: '📝', t: 'Pedir libertad condicional', s: cumplidos * 3 >= c.total ? 'Depende de tu conducta' : `Debes cumplir al menos un tercio (${Math.ceil(c.total / 3)} años)`, dis: cumplidos * 3 < c.total ? 'Todavía no cumples el tiempo mínimo.' : false, fn: () => { if (!usar('condicional', 1)) return; if (R.chance(c.conducta / 160)) this.liberar('¡Te concedieron la libertad condicional!'); else { log('Te negaron la libertad condicional.', 'malo'); toast('Solicitud denegada.'); } } },
        { ic: '⚖️', t: 'Apelar la sentencia', s: `Abogado: ${fmt$(25000 * eco())}`, dis: p.dinero < 25000 * eco() ? 'No puedes pagar un abogado.' : false, fn: () => { if (!usar('apelar', 1)) return; p.dinero -= Math.round(25000 * eco()); if (R.chance(0.15)) this.liberar('¡Ganaste la apelación y anularon tu condena!'); else if (R.chance(0.3)) { c.restantes = Math.max(1, c.restantes - R.int(1, 3)); log('La apelación redujo tu condena.', 'bueno'); } else log('Perdiste la apelación.', 'malo'); } },
        { ic: '🏃', t: 'Intentar fugarse', s: 'Laberinto: evita al guardia y llega a la salida', cls: 'peligro', fn: () => this.fuga() },
      ];
    });
  },
  fuga() {
    const p = S.p, c = p.carcel;
    if (!usar('fuga', 1)) return;
    Minijuegos.laberinto({ dificultad: Math.min(3, 1 + Math.floor(c.total / 8)), alFin: ok => {
      if (ok) {
        p.cont.fugas++; p.carcel = null; p.fugitivo = true;
        p.vivienda = 'alquiler';
        log('🏃 ¡TE FUGASTE DE PRISIÓN! Ahora eres prófug' + gx(p, 'o', 'a') + ' de la justicia.', 'raro');
        Noticias.emitir(`Se fuga un recluso del penal de ${ciudad()}: ${p.nombre} ${p.apellido}. La policía pide ayuda a la ciudadanía.`);
        Estado.darLogro('fuga'); mod({ felicidad: 20, estres: 15 });
        aviso('¡Libre!', '<p>Escapaste. Pero la policía te busca: cada año hay riesgo de que te recapturen.</p>', '🏃');
      } else {
        const extra = R.int(2, 4); c.restantes += extra; c.total += extra; c.conducta = clamp(c.conducta - 30);
        log(`🚨 Te atraparon intentando fugarte. Te añadieron ${extra} años de condena.`, 'malo');
        aviso('¡Atrapado!', `<p>Un guardia te detuvo. +${extra} años de condena.</p>`, '🚨');
      }
    } });
  },
  anualCarcel() {
    const p = S.p, c = p.carcel;
    if (p.fugitivo && !c) {
      mod({ estres: 6 });
      if (R.chance(0.22)) { log('🚓 La policía te encontró. Volviste a prisión.', 'malo'); p.fugitivo = false; this.sentenciar('fuga de prisión', R.int(3, 6)); }
      return;
    }
    if (!c) return;
    p.cont.aniosCarcel++; c.restantes--;
    mod({ felicidad: -4, estres: 4 });
    if (!c.pandilla && R.chance(0.15)) { mod({ salud: -R.int(5, 15) }); log('Unos reclusos te atacaron en las duchas.', 'malo'); }
    if (c.pandilla && R.chance(0.1)) { c.conducta = clamp(c.conducta - 10); log('Tu pandilla te metió en problemas con los guardias.', 'malo'); }
    if (c.restantes <= 0) return this.liberar(`Cumpliste tu condena. ¡Sales libre después de ${c.total} años!`);
    if (c.conducta >= 80 && (c.total - c.restantes) * 2 >= c.total && R.chance(0.3)) this.liberar('Por buena conducta te dieron la libertad anticipada.');
  },

  /* =========================================================
     LA ORGANIZACIÓN (rango, respeto, calor, territorio, lavado)
     ========================================================= */
  org() { return S.p.esp.org; },
  panelOrg() {
    Panel.abrir('La organización', () => {
      const p = S.p, o = this.org(), e = eco();
      if (!o || !o.activo) return [
        { info: '<b>La ruta del capo</b>: 1) Empieza vendiendo en la calle. 2) Gana respeto para subir de rango. 3) Monta tu propia producción. 4) Expande territorio y protege a tu gente. 5) Mantén bajo el <b>calor policial</b> con sobornos y perfil bajo. 6) <b>Lava</b> tu dinero con negocios legales o no podrás usarlo.<br><br>Cada paso aumenta el riesgo de prisión, ataques de rivales y la muerte.' },
        o && o.dineroSucio > 0 ? { info: `Te queda ${fmt$(o.dineroSucio)} de dinero sucio por lavar.` } : null,
        { ic: '🕶️', t: o ? 'Volver al negocio' : 'Unirse a una banda local', dis: p.carcel ? 'Estás en prisión.' : false, fn: () => {
          if (!usar('unirseOrg', 1)) return;
          if (o) { o.activo = true; log('Volviste al negocio.', 'malo'); return; }
          if (R.chance(0.75)) {
            p.esp.org = { activo: true, rango: 0, respeto: 0, calor: 5, territorios: 1, operacion: 0, seguridad: 10, sobornos: false, dineroSucio: 0, miembros: 0, perfilBajo: false, nombre: R.pick(['Los del Puerto', 'La Hermandad', 'Clan del Norte', 'Los Silenciosos', 'La Familia del Valle']) };
            log(`🕶️ Entraste a <b>${p.esp.org.nombre}</b> como ${RANGOS_ORG[0].toLowerCase()}.`, 'malo'); mod({ karma: -8 });
          } else log('La banda no confía en ti todavía.', 'malo');
        } },
      ].filter(Boolean);
      const sig = RESPETO_RANGO[o.rango + 1];
      const its = [
        { kv: [['Organización', o.nombre], ['Rango', RANGOS_ORG[o.rango]], ['Respeto', `${o.respeto}${sig ? ' / ' + sig : ''}`], ['Territorios', o.territorios], ['Miembros', o.miembros], ['Producción', o.operacion ? `Nivel ${o.operacion}` : 'Sin producción propia'], ['Dinero sucio', fmt$(o.dineroSucio)], ['Sobornos a la policía', o.sobornos ? 'Activos' : 'No']] },
        { barra: ['🚨 Calor policial', o.calor, o.calor > 60 ? 'var(--mal)' : o.calor > 30 ? 'var(--med)' : 'var(--ok)'] },
        { barra: ['🛡️ Seguridad', o.seguridad, 'var(--info)'] },
      ];
      const a = (ic, t, s, fn, dis) => its.push({ ic, t, s, fn, dis });
      its.push({ sec: 'Operaciones' });
      a('🎒', 'Vender mercancía en la calle', `${usosRestantes('vender', 3)} restantes · +respeto, +calor`, () => this.vender());
      if (o.rango <= 2) a('📦', 'Hacer un encargo para el jefe', 'Más respeto, más riesgo', () => this.encargo());
      if (o.rango >= 2 && !o.operacion) a('🏚️', 'Montar tu propia producción', `Costo ${fmt$(150000 * e)} (dinero sucio o limpio)`, () => this.pagar(150000 * e, () => { o.operacion = 1; log('🏚️ Montaste tu propio centro de producción clandestino.', 'malo'); mod({ karma: -10 }); }));
      if (o.operacion && o.operacion < 5) a('⚙️', 'Ampliar la producción', `Nivel ${o.operacion + 1} · ${fmt$(300000 * o.operacion ** 2 * e)}`, () => this.pagar(300000 * o.operacion ** 2 * e, () => { o.operacion++; o.calor = clamp(o.calor + 8); log(`⚙️ Ampliaste la producción al nivel ${o.operacion}.`, 'malo'); }));
      if (o.rango >= 1) {
        a('👥', 'Reclutar gente', `${fmt$(20000 * e)} por 5 miembros`, () => this.pagar(20000 * e, () => { o.miembros += 5; o.calor = clamp(o.calor + 2); log('Reclutaste nuevos miembros para la organización.'); }));
        a('🗺️', 'Expandir territorio', `${fmt$(50000 * o.territorios * e)} · puede desatar enfrentamientos`, () => this.expandir());
        a('🛡️', 'Reforzar la seguridad', `${fmt$(40000 * e)}`, () => this.pagar(40000 * e, () => { o.seguridad = clamp(o.seguridad + 15); log('Reforzaste la seguridad de la organización.'); }));
        a('🤝', o.sobornos ? 'Dejar de sobornar a la policía' : 'Sobornar a la policía', 'Reduce el calor (cuesta parte de las ganancias cada año)', () => { o.sobornos = !o.sobornos; mod({ karma: -3 }); log(o.sobornos ? 'Empezaste a pagar sobornos a policías corruptos.' : 'Dejaste de pagar sobornos.'); });
      }
      its.push({ sec: 'Dinero' });
      a('🧺', 'Lavar dinero', p.negocios.length ? 'A través de tus negocios (85%)' : 'Con contadores dudosos (60%). Tener un negocio mejora la tasa.', () => this.lavar(), o.dineroSucio <= 0 ? 'No tienes dinero sucio.' : false);
      a('🤫', o.perfilBajo ? 'Volver a operar con normalidad' : 'Bajar el perfil este año', 'Sin ingresos, pero baja mucho el calor', () => { o.perfilBajo = !o.perfilBajo; log(o.perfilBajo ? 'Decidiste bajar el perfil por un tiempo.' : 'Volviste a operar a pleno.'); });
      a('🚪', 'Retirarse del negocio', 'El pasado puede alcanzarte', () => Modal.mostrar({ ic: '🚪', titulo: '¿Retirarte?', texto: '<p>Dejarás la organización. Tu dinero sucio queda contigo (aún hay que lavarlo).</p>', opciones: [{ t: 'Retirarme', cls: 'peligro', fn: () => { o.activo = false; o.operacion = 0; log('🚪 Te retiraste del crimen organizado.', 'info'); } }, { t: 'Seguir' }] }));
      return its;
    });
  },
  pagar(monto, fn) {
    const p = S.p, o = this.org(); monto = Math.round(monto);
    if (o.dineroSucio >= monto) { o.dineroSucio -= monto; fn(); }
    else if (o.dineroSucio + p.dinero >= monto) { p.dinero -= monto - o.dineroSucio; o.dineroSucio = 0; fn(); }
    else toast(`Necesitas ${fmt$(monto)}.`);
    this.revisarRango();
  },
  vender() {
    const p = S.p, o = this.org();
    if (!usar('vender', 3)) return;
    if (R.chance(0.06 + o.calor / 450)) { log('🚓 Te detuvieron con mercancía encima.', 'malo'); return this.arrestar('tráfico de sustancias', [2, 6]); }
    const g = Math.round(R.int(500, 3000) * (1 + o.territorios * 0.25) * Math.max(eco(), 0.4) * (1 + o.rango * 0.5));
    o.dineroSucio += g; o.respeto += R.int(2, 5); o.calor = clamp(o.calor + R.int(2, 5));
    mod({ karma: -2, estres: 3 });
    log(`🎒 Vendiste mercancía y ganaste ${fmt$(g)} en efectivo sucio.`, 'malo');
    toast(`+${fmt$(g)} (sucio)`); this.revisarRango();
  },
  encargo() {
    const p = S.p, o = this.org();
    if (!usar('encargo', 1)) return;
    Modal.mostrar({ ic: '📦', titulo: 'Un encargo', texto: '<p>El jefe te pide mover un cargamento al otro lado de la ciudad. Hay un control policial en la ruta principal.</p>', opciones: [
      { t: '🤫 Tomar caminos secundarios con calma', fn: () => this.resolverEncargo(0.75, 8) },
      { t: '🏎️ Ir rápido por la autopista', fn: () => this.resolverEncargo(0.55, 14) },
      { t: '🙅 Negarte: es demasiado arriesgado', fn: () => { o.respeto = Math.max(0, o.respeto - 8); log('Te negaste a hacer el encargo. El jefe no está contento.', 'malo'); } },
    ] });
  },
  resolverEncargo(prob, resp) {
    const o = this.org();
    if (R.chance(prob + o.seguridad / 500)) { o.respeto += resp; o.dineroSucio += Math.round(R.int(5000, 20000) * Math.max(eco(), 0.4)); o.calor = clamp(o.calor + 4); log('📦 Cumpliste el encargo sin problemas. El jefe te respeta más.', 'raro'); this.revisarRango(); }
    else if (R.chance(0.5)) { log('🚓 La policía interceptó el cargamento.', 'malo'); this.arrestar('tráfico de sustancias', [4, 10]); }
    else { o.respeto = Math.max(0, o.respeto - 5); mod({ salud: -10 }); log('El encargo salió mal: perdiste el cargamento y saliste herid' + gx(S.p, 'o', 'a') + '.', 'malo'); }
  },
  expandir() {
    const p = S.p, o = this.org();
    if (!usar('expandir', 1)) return;
    this.pagar(50000 * o.territorios * eco(), () => {
      const fuerza = o.seguridad / 100 * 0.5 + o.miembros / 80 + o.rango * 0.05;
      if (R.chance(clamp(0.35 + fuerza, 0.1, 0.9))) { o.territorios++; o.respeto += 15; o.calor = clamp(o.calor + 6); log(`🗺️ Tomaste el control de un nuevo territorio. Ya controlas ${o.territorios}.`, 'raro'); }
      else { o.calor = clamp(o.calor + 10); o.miembros = Math.max(0, o.miembros - R.int(1, 4)); mod({ salud: -R.int(5, 20), estres: 10 }); log('💥 La banda rival defendió su territorio. Tuviste que retirarte.', 'malo'); if (R.chance(0.05)) Vida.morir('un enfrentamiento entre bandas'); }
      this.revisarRango();
    });
  },
  lavar() {
    const p = S.p, o = this.org();
    if (!usar('lavar', 2)) return;
    const neg = p.negocios[0];
    const tasa = neg ? 0.85 : 0.6;
    const tope = neg ? Math.max(100000 * eco(), neg.capital * 1.5) : 200000 * eco();
    Modal.numero({ ic: '🧺', titulo: 'Lavar dinero', texto: `<p>Tasa de conversión: ${tasa * 100}%. ${neg ? `A través de ${esc(neg.nombre)}.` : 'A través de intermediarios.'}</p>`, max: Math.min(o.dineroSucio, tope), valor: Math.min(o.dineroSucio, tope), etiqueta: 'Lavar', fn: v => {
      if (!v) return;
      o.dineroSucio -= v;
      if (R.chance(neg ? 0.06 : 0.15)) { log('🔎 Una inspección tributaria detectó el lavado. Te incautaron el dinero.', 'malo'); o.calor = clamp(o.calor + 25); if (R.chance(0.35)) this.arrestar('lavado de activos', [3, 9]); return; }
      const limpio = Math.round(v * tasa); p.dinero += limpio;
      log(`🧺 Lavaste ${fmt$(v)} y recibiste ${fmt$(limpio)} limpios.`, 'raro');
    } });
  },
  revisarRango() {
    const o = this.org(); if (!o) return;
    while (o.rango < 5 && o.respeto >= RESPETO_RANGO[o.rango + 1]) {
      o.rango++;
      log(`🕶️ Subiste de rango: ahora eres <b>${RANGOS_ORG[o.rango]}</b>.`, 'raro');
      if (o.rango === 5) { Estado.darLogro('capo'); log('👑 Controlas el cártel. Todos saben tu nombre… incluida la policía.', 'raro'); o.calor = clamp(o.calor + 15); mod({ fama: 15 }); }
    }
  },
  anualOrg() {
    const p = S.p, o = this.org();
    if (!o) return;
    if (!o.activo) {
      o.calor = clamp(o.calor - 10);
      if (o.calor > 40 && !p.carcel && R.chance(0.06)) { log('🚓 Una vieja investigación te alcanzó.', 'malo'); this.arrestar('crimen organizado', [5, 12]); }
      return;
    }
    if (p.carcel) return;
    const e = Math.max(eco(), 0.4);
    let ingresos = 0;
    if (!o.perfilBajo) ingresos = Math.round(((o.operacion ? Math.pow(o.operacion, 1.6) * 120000 : 0) * Math.pow(o.territorios, 0.8) + o.miembros * 4000 + o.rango * 8000) * e * R.float(0.7, 1.3));
    const costos = Math.round(o.miembros * 6000 * e + o.seguridad * 400 * e + (o.sobornos ? ingresos * 0.12 + 20000 * e : 0));
    o.dineroSucio = Math.max(0, o.dineroSucio + ingresos - costos);
    if (ingresos) log(`🕶️ La organización generó ${fmt$(ingresos)} (costos: ${fmt$(costos)}).`, 'malo');
    o.calor = clamp(o.calor + (o.perfilBajo ? -25 : 4 + o.operacion * 3 + o.territorios * 1.5 + o.rango * 1.5) - (o.sobornos ? 9 : 0));
    o.respeto += o.perfilBajo ? 0 : o.operacion * 4 + o.territorios * 2;
    o.seguridad = clamp(o.seguridad - 5);
    o.perfilBajo = false;
    mod({ estres: 6, karma: -4 });
    this.revisarRango();
    // Redada
    const redada = Math.pow(o.calor / 100, 2) * 0.45 * (o.sobornos ? 0.6 : 1);
    if (R.chance(redada)) {
      if (R.chance(0.45 + o.seguridad / 300)) { o.operacion = Math.max(0, o.operacion - 1); o.dineroSucio = Math.round(o.dineroSucio * 0.5); o.calor = clamp(o.calor - 20); log('🚨 La policía hizo una redada. Lograste escapar, pero perdiste mercancía y la mitad del dinero sucio.', 'malo'); }
      else { log('🚨 ¡REDADA! La policía te capturó.', 'malo'); this.arrestar('narcotráfico y crimen organizado', [8, 25]); return; }
    }
    // Rivales
    if (R.chance(0.1 + o.territorios * 0.012)) {
      if (R.chance(0.35 + o.seguridad / 150)) { o.respeto += 8; log('💥 Una banda rival atacó, pero tu gente la repelió.', 'raro'); }
      else { mod({ salud: -R.int(15, 40), felicidad: -10 }); o.miembros = Math.max(0, o.miembros - R.int(2, 6)); log('💥 Una banda rival te emboscó. Sobreviviste de milagro.', 'malo'); if (R.chance(0.1 * (1 - o.seguridad / 120))) return Vida.morir('un ajuste de cuentas'); }
    }
    // Informante
    if (o.miembros > 0 && R.chance(0.07)) Modal.mostrar({ ic: '🐀', titulo: 'Un informante', texto: '<p>Descubres que uno de tus hombres habla con la policía. ¿Qué haces?</p>', opciones: [
      { t: 'Echarlo de la organización', fn: () => { o.calor = clamp(o.calor + 8); o.miembros--; log('Echaste al informante. La policía ya sabe algunas cosas.', 'malo'); } },
      { t: 'Darle información falsa para despistar a la policía', fn: () => { if (R.chance(0.6)) { o.calor = clamp(o.calor - 15); log('La información falsa despistó a la policía.', 'raro'); } else { o.calor = clamp(o.calor + 15); log('La policía no cayó en la trampa.', 'malo'); } } },
      { t: 'Hacer como si nada', fn: () => { o.calor = clamp(o.calor + 20); log('El informante siguió hablando.', 'malo'); } },
    ] });
    // Dinero sucio acumulado llama la atención
    if (o.dineroSucio > 2e6 * e && R.chance(0.1)) { const inc = Math.round(o.dineroSucio * 0.3); o.dineroSucio -= inc; log(`🔎 La policía encontró una caleta con ${fmt$(inc)} de tu dinero sucio.`, 'malo'); }
  },
};
