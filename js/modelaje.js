'use strict';
/* =========================================================
   MODELAJE A FONDO: agencias, book, perfil, castings por tipo,
   semanas de la moda con pasarela, portadas, contratos de
   embajador, vida de celebridad, agotamiento y reinvención.
   (Marcas, revistas y agencias son ficticias.)
   ========================================================= */
const NIV_MOD = ['Nuevo rostro', 'Modelo comercial', 'Modelo de pasarela', 'Modelo internacional', 'Supermodelo', 'Ícono de la moda'];
const UMB_MOD = [0, 6, 16, 32, 55, 95];
const AGENCIAS_MOD = [
  { id: 'local', n: 'Agencia local', ic: '🏠', tier: 0, com: 0.25, req: 0 },
  { id: 'nacional', n: 'Prisma Models', ic: '🔷', tier: 1, com: 0.22, req: 6 },
  { id: 'internacional', n: 'Vértice Management', ic: '🌐', tier: 2, com: 0.20, req: 16 },
  { id: 'elite', n: 'Aurum Talent', ic: '👑', tier: 3, com: 0.18, req: 32 },
];
const PERFILES_MOD = { clasico: '🎩 Clásico y elegante', rudo: '🔥 Rudo y rebelde', androgino: '🌙 Andrógino y vanguardista', fresco: '☀️ Fresco y cercano' };
const REVISTAS = ['Élan', 'Vanité', 'Lustre', 'Kaleido', 'Revista Mode', 'Atelier'];
const CAPITALES_MODA = ['Nueva York', 'Londres', 'Milán', 'París'];
const DISENADORES = [
  { n: 'una casa minimalista japonesa', pose: 'fija', musica: 'lenta' },
  { n: 'un diseñador italiano teatral', pose: 'vuelta', musica: 'clasica' },
  { n: 'una marca deportiva de lujo', pose: 'giro', musica: 'rapida' },
  { n: 'una maison francesa clásica', pose: 'fija', musica: 'clasica' },
  { n: 'un joven diseñador rebelde de Londres', pose: 'giro', musica: 'rapida' },
  { n: 'una firma de alta costura escandinava', pose: 'vuelta', musica: 'lenta' },
];
const TIPOS_CASTING = {
  catalogo:  { n: '📒 Catálogo de tienda', nivel: 0, pago: 0.5, pres: 1, desc: 'Fácil y poco glamuroso' },
  comercial: { n: '📺 Comercial de TV', nivel: 1, pago: 1.2, pres: 1, desc: 'Paga bien, poco prestigio' },
  editorial: { n: '📰 Editorial de revista', nivel: 1, pago: 0.4, pres: 2.2, desc: 'Paga poco, da mucho prestigio' },
  lujo:      { n: '💎 Campaña de lujo', nivel: 2, pago: 2.2, pres: 1.8, desc: 'Lo más codiciado' },
};
const PAGO_BASE_MOD = [2000, 7000, 25000, 90000, 350000, 900000];
const PAGO_DESFILE = [0, 0, 3000, 12000, 45000, 120000];

const Modelaje = {
  m() { return S.p.esp.modelo; },
  /* Completa modelos guardados con la versión anterior */
  norm(m) {
    if (!m) return m;
    m.agencia = m.agencia || 'local'; m.book = m.book ?? 20; m.rep = m.rep ?? 50;
    m.portadas = m.portadas || 0; m.desfiles = m.desfiles || 0; m.aperturas = m.aperturas || 0; m.contratos = m.contratos || [];
    m.campanias = m.campanias || 0; m.perfil = m.perfil || 'clasico'; m.nivelN = NIV_MOD[m.nivel];
    return m;
  },
  agencia() { return AGENCIAS_MOD.find(a => a.id === this.m().agencia); },
  cobrar(bruto, concepto) {
    const p = S.p, ag = this.agencia(), neto = Math.round(bruto * (1 - ag.com));
    p.dinero += neto;
    return neto;
  },
  escala() { return Math.max(0.6, eco()); },

  /* ---------- Panel principal ---------- */
  panel() {
    Panel.abrir('Modelaje', () => {
      const p = S.p, m = this.norm(this.m());
      if (!m) return this.itemsInicio();
      const ag = this.agencia(), sig = UMB_MOD[m.nivel + 1];
      const faltaIcono = m.nivel === 4 ? [m.aperturas < 1 ? 'cerrar un desfile en una Semana de la Moda' : '', m.portadas < 4 ? `${4 - m.portadas} portada(s) más` : ''].filter(Boolean) : [];
      const its = [
        { kv: [['Nivel', `📸 ${NIV_MOD[m.nivel]}`], ['Agencia', `${ag.ic} ${ag.n} (comisión ${Math.round(ag.com * 100)}%)`], ['Perfil', PERFILES_MOD[m.perfil]], ['Prestigio', `${m.prestigio}${sig ? ' / ' + sig : ''}`], ['Trayectoria', `${m.campanias} campañas · ${m.desfiles} desfiles · ${m.portadas} portadas`]] },
        faltaIcono.length ? { info: `👑 Para ser <b>Ícono de la moda</b> además necesitas: ${faltaIcono.join(' y ')}.` } : null,
        m.nivel < 5 ? Barras.prog(`🌟 Hacia ${NIV_MOD[m.nivel + 1]}`, m.prestigio, UMB_MOD[m.nivel + 1], 'var(--fama)', UMB_MOD[m.nivel]) : null,
        { barra: ['📷 Calidad de tu book', m.book, 'var(--info)'] },
        { barra: ['🏛️ Reputación en la industria', m.rep, 'var(--fama)'] },
      ];
      if (m.contratos.length) { its.push({ sec: 'Contratos de embajador' }); for (const c of m.contratos) its.push({ ic: '🤝', t: `Rostro de ${c.marca}`, s: `${c.producto} · ${fmt$(c.pago)}/año · ${c.anios} año${c.anios === 1 ? '' : 's'} restantes` }); }
      its.push({ sec: 'Trabajo' });
      its.push({ ic: '📷', t: 'Ir a un casting', s: `${usosRestantes('casting', 3)} restantes este año`, fn: () => this.elegirCasting() });
      its.push({ ic: '🗓️', t: 'Semana de la Moda', s: m.nivel >= 2 ? 'Desfila en las capitales de la moda (1 al año)' : 'Desde Modelo de pasarela', dis: m.nivel < 2 ? 'Necesitas ser Modelo de pasarela.' : false, fn: () => this.semanaModa() });
      its.push({ ic: '📰', t: 'Pedirle a tu agente una portada', s: 'Depende de tu nivel y reputación', dis: m.nivel < 1 ? 'Aún eres un rostro nuevo.' : false, fn: () => { if (!usar('pedirPortada', 1)) return; if (R.chance(0.15 + m.nivel * 0.1 + (m.rep - 50) / 200)) this.ofertaPortada(); else { log('Tu agente lo intentó, pero ninguna revista importante te quiere en portada todavía.'); toast('Ninguna revista respondió.'); } } });
      its.push({ ic: '🖼️', t: 'Sesión de fotos para tu book', s: `Mejora tus castings (${fmt$(this.costoBook())})`, dis: p.dinero < this.costoBook() ? 'No te alcanza.' : false, fn: () => { if (!usar('book', 2)) return; p.dinero -= this.costoBook(); m.book = clamp(m.book + R.int(8, 18)); log('Hiciste una sesión con un fotógrafo de moda para renovar tu book.'); toast('📷 +book'); } });
      its.push({ sec: 'Imagen y estilo de vida' });
      its.push({ ic: '🥂', t: 'Fiesta exclusiva de la industria', s: 'Contactos, fama… y tentaciones', fn: () => this.fiesta() });
      its.push({ ic: '🧴', t: 'Rutina de cuidado de la piel', s: `+apariencia (${fmt$(800 * this.escala())})`, fn: () => { if (!usar('piel', 1)) return; p.dinero -= Math.round(800 * this.escala()); mod({ apariencia: R.int(1, 3) }); log('Seguiste una rutina profesional de cuidado de la piel.'); } });
      its.push({ ic: '🏋️', t: 'Entrenamiento con preparador personal', s: '+salud, +apariencia', fn: () => { if (!usar('preparador', 1)) return; p.dinero -= Math.round(1500 * this.escala()); mod({ salud: 3, apariencia: R.int(1, 2), estres: -3 }); log('Entrenaste con un preparador físico de modelos.'); } });
      its.push({ ic: '🥬', t: 'Dieta extrema antes de un desfile', s: '+apariencia rápida, −salud (peligroso si se repite)', cls: 'peligro', fn: () => this.dietaExtrema() });
      its.push({ ic: '🏢', t: 'Cambiar de agencia', s: `Ahora: ${ag.n}`, fn: () => this.cambiarAgencia() });
      its.push({ ic: '🎭', t: 'Cambiar de perfil', s: 'Reinventar tu look', fn: () => this.elegirPerfil() });
      if (m.nivel >= 2 || p.edad >= 27) {
        its.push({ sec: 'Reinvención' });
        its.push({ ic: '👗', t: 'Lanzar tu propia marca de moda', s: m.marcaPropia ? 'Ya la tienes' : `Inversión ${fmt$(this.costoMarca())}. Tu fama la impulsa`, dis: m.marcaPropia ? 'Ya tienes tu marca.' : p.dinero < this.costoMarca() ? 'No te alcanza.' : false, fn: () => this.marcaPropia() });
        its.push({ ic: '🎬', t: 'Dar el salto a la actuación', s: p.esp.actor ? 'Ya actúas' : 'Empiezas como actor de reparto', dis: p.esp.actor ? 'Ya tienes carrera de actor.' : false, fn: () => { p.esp.actor = { nivel: Math.min(2, m.nivel), prestigio: UMB_ACTOR[Math.min(2, m.nivel)], papeles: 0 }; mod({ fama: 3 }); log('🎬 Tu fama como modelo te abrió las puertas de la actuación.', 'raro'); } });
        its.push({ ic: '📺', t: 'Ser jurado de un reality de modelos', s: 'Fama e ingresos', dis: p.st.fama < 45 ? 'Necesitas fama 45.' : false, fn: () => { if (!usar('jurado', 1)) return; const g = this.cobrar(Math.round(R.int(60000, 300000) * this.escala())); mod({ fama: 5 }); log(`📺 Fuiste jurado de un reality de modelos y ganaste ${fmt$(g)}.`, 'raro'); } });
      }
      its.push({ ic: '🚪', t: 'Retirarte del modelaje', cls: 'peligro', fn: () => Modal.mostrar({ ic: '🚪', titulo: '¿Retirarte?', texto: '<p>Perderás tu agencia y tus contratos.</p>', opciones: [{ t: 'Retirarme', cls: 'peligro', fn: () => { log(`📸 Te retiraste del modelaje como ${NIV_MOD[m.nivel]}.`, 'info'); p.esp.modelo = null; } }, { t: 'Seguir' }] }) });
      return its;
    });
  },
  itemsInicio() {
    const p = S.p;
    return [
      { info: '📸 <b>La carrera de modelo</b>: empiezas en una agencia local como nuevo rostro. Construye tu <b>book</b>, elige un <b>perfil</b>, haz castings, desfila en las semanas de la moda, consigue portadas y contratos de embajador. Las agencias aceptan de 16 a 30 años; con apariencia alta tienes más opciones.' },
      { ic: '✍️', t: 'Buscar agencia', s: `Tu apariencia: ${p.st.apariencia}%`, dis: p.edad < 16 ? 'Desde los 16 años.' : false, fn: () => {
        if (!usar('agenciaM', 1)) return;
        if (p.edad > 30) return aviso('Rechazado', '<p>"Lo sentimos, buscamos perfiles más jóvenes."</p>', '📸');
        const prob = (p.st.apariencia - 45) * 2.2 + (Rasgos.tiene('belleza') ? 15 : 0) + (p.st.fama > 30 ? 10 : 0);
        if (R.chance(clamp(prob, 3, 95) / 100)) {
          p.esp.modelo = this.norm({ nivel: 0, prestigio: 0 });
          log('📸 ¡Te firmó una agencia de modelos local!', 'bueno'); mod({ felicidad: 8 });
          Efectos.celebrar('📸', '¡Tienes agencia!', '<p>Eres oficialmente un <b>nuevo rostro</b>. Ahora define tu perfil.</p>');
          this.elegirPerfil();
        } else { log('Una agencia de modelos te rechazó.', 'malo'); aviso('Rechazado', '<p>"No eres lo que buscamos ahora mismo."</p><p class="nota">Mejora tu apariencia (gimnasio, cuidado de la piel, estética) y vuelve el próximo año.</p>', '😕'); }
      } },
      { ic: '🕵️', t: 'Esperar a que te descubra un cazatalentos', s: 'A veces pasa… en un aeropuerto, en la playa, en un café', dis: p.edad < 14 ? 'Muy pronto.' : false, fn: () => {
        if (!usar('cazatalentos', 1)) return;
        if (p.st.apariencia >= 75 && R.chance(0.2 + (p.st.apariencia - 75) / 60)) {
          p.esp.modelo = this.norm({ nivel: 0, prestigio: 3, agencia: 'nacional', book: 35 });
          log('🕵️ ¡Un cazatalentos te descubrió en la calle y te firmó una agencia nacional!', 'raro');
          Efectos.celebrar('🕵️', '¡Te descubrieron!', '<p>Un cazatalentos te paró en la calle: "¿Alguna vez pensaste en ser modelo?"</p><p>Empiezas directo en <b>Prisma Models</b>.</p>');
          this.elegirPerfil();
        } else { log('Pasaste el año esperando que alguien te descubriera. No pasó.'); toast('Nadie te descubrió esta vez.'); }
      } },
    ];
  },
  costoBook() { return Math.round([300, 800, 2000, 5000][this.agencia().tier] * this.escala()); },
  costoMarca() { return Math.round(500000 * this.escala()); },
  elegirPerfil() {
    const m = this.m();
    Modal.mostrar({ ic: '🎭', titulo: 'Tu perfil como modelo', texto: '<p>¿Qué imagen quieres proyectar? Algunos castings buscan un perfil concreto.</p>', opciones: Object.entries(PERFILES_MOD).map(([k, t]) => ({ t, fn: () => { m.perfil = k; log(`🎭 Definiste tu perfil de modelo: ${t.replace(/^\S+ /, '').toLowerCase()}.`); } })) });
  },

  /* ---------- Castings ---------- */
  elegirCasting() {
    const m = this.m();
    if (usosRestantes('casting', 3) <= 0) return toast('Ya fuiste a todos los castings posibles este año.');
    Modal.mostrar({ ic: '📷', titulo: '¿A qué casting vas?', opciones: Object.entries(TIPOS_CASTING).map(([k, t]) => ({ t: `${t.n} — ${t.desc}`, dis: m.nivel < t.nivel, fn: () => this.casting(k) })).concat([op('Cancelar', () => {})]) });
  },
  casting(tipo) {
    if (!usar('casting', 3)) return;
    const p = S.p, m = this.m(), tc = TIPOS_CASTING[tipo];
    const obj = { actitud: R.int(1, 3), pose: R.int(1, 3), estilo: R.int(1, 3) };
    const pidePerfil = R.chance(0.45) ? R.pick(Object.keys(PERFILES_MOD)) : null;
    const marca = tipo === 'editorial' ? R.pick(REVISTAS) : R.pick(MARCAS), prod = R.pick(PRODUCTOS);
    const w = k => R.pick(RASGOS[k][obj[k]]);
    const intro = tipo === 'editorial' ? `La revista <b>${marca}</b> prepara una editorial de ${prod}.` : tipo === 'comercial' ? `<b>${marca}</b> graba un comercial de ${prod} para TV.` : tipo === 'catalogo' ? `Una tienda por departamentos necesita fotos de ${prod} para su catálogo.` : `<b>${marca}</b> lanza su campaña global de ${prod}.`;
    Modal.mostrar({
      ic: '📸', titulo: TIPOS_CASTING[tipo].n.replace(/^\S+ /, ''),
      texto: `<p>${intro} Buscan una mirada <b>${w('actitud')}</b>, una pose <b>${w('pose')}</b> y un look <b>${w('estilo')}</b>.${pidePerfil ? ` Prefieren un perfil <b>${PERFILES_MOD[pidePerfil].replace(/^\S+ /, '').toLowerCase()}</b>.` : ''}</p>`,
      html: `<div class="nota">Actitud</div>${htmlSelector('s-act', [[1, 'Suave'], [2, 'Segura'], [3, 'Feroz']], 2)}<div class="nota">Pose</div>${htmlSelector('s-pos', [[1, 'Natural'], [2, 'Elegante'], [3, 'Dramática']], 2)}<div class="nota">Estilo</div>${htmlSelector('s-est', [[1, 'Clásico'], [2, 'Moderno'], [3, 'Vanguardista']], 2)}`,
      alAbrir: activarSelectores,
      opciones: [{ t: '📷 ¡Posar!', cls: 'ok', fn: () => {
        const a = +leerSelector('s-act'), b = +leerSelector('s-pos'), c = +leerSelector('s-est');
        const aciertos = (a === obj.actitud) + (b === obj.pose) + (c === obj.estilo);
        const prob = 0.1 + aciertos * 0.22 + (p.st.apariencia - 60) / 170 + m.book / 600 + this.agencia().tier * 0.04 + (pidePerfil ? (pidePerfil === m.perfil ? 0.12 : -0.08) : 0) + (Rasgos.tiene('belleza') ? 0.08 : 0) - (tipo === 'lujo' ? 0.08 : 0);
        Rasgos.pista('belleza');
        Efectos.suspenso('📸 El director de casting revisa las fotos…', () => {
          if (R.chance(clamp(prob * 100, 3, 95) / 100)) {
            const bruto = Math.round(PAGO_BASE_MOD[m.nivel] * tc.pago * R.float(0.7, 1.3) * this.escala());
            const neto = this.cobrar(bruto);
            m.prestigio += Math.round((1 + aciertos) * tc.pres); m.campanias++; m.rep = clamp(m.rep + 2);
            mod({ fama: Math.round((m.nivel + 1) * (tipo === 'lujo' ? 1.5 : 1)), felicidad: 5 });
            if (p.esp.redes) p.esp.redes.seguidores += Math.round(R.int(200, 3000) * (m.nivel + 1) * tc.pres);
            log(`📸 ¡Te eligieron para ${tipo === 'editorial' ? 'la editorial de ' + marca : tipo === 'catalogo' ? 'el catálogo' : 'la campaña de ' + marca}! Cobraste ${fmt$(neto)} (tras comisión).`, 'bueno');
            aviso('¡Te eligieron!', `<p>Acertaste ${aciertos} de 3 rasgos${pidePerfil ? (pidePerfil === m.perfil ? ' y tu perfil era justo el que buscaban' : ', aunque tu perfil no era el ideal') : ''}.</p><p>Pago: <b>${fmt$(bruto)}</b> (tu agencia se queda ${Math.round(this.agencia().com * 100)}%).</p>`, '🎉');
            this.subir();
          } else {
            mod({ felicidad: -4 }); log(`No te eligieron en el casting${tipo === 'catalogo' ? '' : ' de ' + marca}.`, 'malo');
            aviso('No quedaste', `<p>Acertaste ${aciertos} de 3. Buscaban: actitud <b>${['', 'Suave', 'Segura', 'Feroz'][obj.actitud]}</b>, pose <b>${['', 'Natural', 'Elegante', 'Dramática'][obj.pose]}</b>, estilo <b>${['', 'Clásico', 'Moderno', 'Vanguardista'][obj.estilo]}</b>.</p>`, '😞');
          }
        }, 1300, '📸');
      } }],
    });
  },
  subir() {
    const p = S.p, m = this.m();
    while (m.nivel < 5 && m.prestigio >= UMB_MOD[m.nivel + 1] && (m.nivel < 4 || (m.aperturas >= 1 && m.portadas >= 4))) {
      m.nivel++; m.nivelN = NIV_MOD[m.nivel];
      log(`🌟 ¡Subiste de nivel! Ahora eres <b>${m.nivelN}</b>.`, 'raro');
      if (m.nivel === 4) { Estado.darLogro('supermodelo'); mod({ fama: 15 }); Efectos.celebrar('📸', '¡Supermodelo!', '<p>Tu cara está en vallas de todo el mundo. Las marcas pelean por ti.</p>'); Noticias.emitir(`${p.nombre} ${p.apellido} es ${gx(p, 'el nuevo supermodelo', 'la nueva supermodelo')} del momento.`); }
      else if (m.nivel === 5) { Estado.darLogro('icono'); mod({ fama: 15 }); Efectos.celebrar('👑', '¡Ícono de la moda!', '<p>Ya no sigues tendencias: las creas. Tu carrera ya no depende de tu edad.</p>'); Noticias.emitir(`${p.nombre} ${p.apellido}, ${gx(p, 'el', 'la')} modelo que se convirtió en ícono de una generación.`); }
      else Efectos.celebrar('🌟', '¡Nuevo nivel!', `<p>Ahora eres <b>${m.nivelN}</b>.</p>`);
    }
  },

  /* ---------- Semana de la Moda con pasarela ---------- */
  semanaModa() {
    const p = S.p, m = this.m();
    if (!usar('semanaModa', 1)) return;
    Modal.mostrar({ ic: '🗓️', titulo: 'Semana de la Moda', texto: '<p>¿En qué capital desfilas este año?</p>', opciones: CAPITALES_MODA.map((c, i) => ({ t: `${['🗽', '💂', '🇮🇹', '🗼'][i]} ${c}${i === 3 ? ' (la más exigente)' : ''}`, fn: () => {
      const maxShows = [0, 0, 4, 8, 14, 20][m.nivel];
      Modal.mostrar({ ic: '📋', titulo: `Semana de la Moda de ${c}`, texto: `<p>Tu agencia te consiguió hasta <b>${maxShows}</b> desfiles. Más desfiles = más dinero y prestigio, pero también agotamiento.</p>`, opciones: [
        { t: `🙂 Pocos desfiles (${Math.max(1, Math.round(maxShows / 4))})`, fn: () => this.pasarela(c, Math.max(1, Math.round(maxShows / 4))) },
        { t: `😅 Agenda llena (${Math.round(maxShows / 2)})`, fn: () => this.pasarela(c, Math.round(maxShows / 2)) },
        { t: `🥵 Todos los que pueda (${maxShows})`, fn: () => this.pasarela(c, maxShows) },
      ] });
    } })) });
  },
  pasarela(ciudadModa, shows) {
    const p = S.p, m = this.m();
    const dis = R.pick(DISENADORES);
    const musicaTxt = { lenta: 'una música lenta y envolvente', rapida: 'música electrónica a todo volumen', clasica: 'un cuarteto de cuerdas en vivo' }[dis.musica];
    let pts = 0;
    Modal.mostrar({ ic: '🎵', titulo: 'El gran desfile', texto: `<p>Tu desfile principal es para <b>${dis.n}</b>. Suena ${musicaTxt}. ¿A qué ritmo caminas?</p>`, opciones: [['lenta', '🐢 Lento y pausado'], ['clasica', '🚶 Elegante y medido'], ['rapida', '⚡ Rápido y con fuerza']].map(([k, t]) => ({ t, fn: () => {
      if (k === dis.musica) pts++;
      Modal.mostrar({ ic: '🔚', titulo: 'Al final de la pasarela', texto: '<p>Llegas al final, frente a los fotógrafos. ¿Qué haces?</p>', opciones: [['fija', '👁️ Mirada fija a la cámara'], ['giro', '💪 Giro de hombros con actitud'], ['vuelta', '🌀 Media vuelta teatral']].map(([k2, t2]) => ({ t: t2, fn: () => {
        if (k2 === dis.pose) pts++;
        const incidente = R.pick([
          { q: '¡Se te rompe un tacón/la suela a mitad de la pasarela!', ops: [['Seguir caminando como si nada', 1], ['Quitarte los zapatos y seguir descalz' + gx(p, 'o', 'a'), 2], ['Detenerte y salir', -1]] },
          { q: 'Un abrigo larguísimo se te engancha en la escenografía.', ops: [['Soltarlo con un gesto elegante', 2], ['Tirar fuerte', 0], ['Pedir ayuda al público', -1]] },
          { q: 'Te equivocas de salida y te cruzas con otro modelo.', ops: [['Hacer una pose juntos y seguir', 2], ['Pedir perdón en voz alta', -1], ['Ignorarlo', 1]] },
          null,
        ]);
        const fin = (extra) => this.resultadoSemana(ciudadModa, shows, pts + extra, dis);
        if (!incidente) return fin(1);
        Modal.mostrar({ ic: '😱', titulo: '¡Imprevisto!', texto: `<p>${incidente.q}</p>`, opciones: R.shuffle(incidente.ops).map(([t3, v]) => ({ t: t3, fn: () => fin(v) })) });
      } })) });
    } })) });
  },
  resultadoSemana(ciudadModa, shows, pts, dis) {
    const p = S.p, m = this.m();
    Efectos.suspenso('📸 Los flashes no paran…', () => {
      const calidad = pts + (p.st.apariencia - 60) / 20 + m.book / 50 + (Rasgos.tiene('belleza') ? 1 : 0);
      const bruto = Math.round(PAGO_DESFILE[m.nivel] * shows * R.float(0.8, 1.2) * this.escala());
      const neto = this.cobrar(bruto);
      m.desfiles += shows; m.prestigio += Math.round(shows * (calidad >= 3 ? 0.6 : 0.3));
      m.rep = clamp(m.rep + (calidad >= 3 ? 6 : calidad >= 1.5 ? 2 : -5));
      mod({ estres: Math.round(shows * 1.8), salud: -Math.round(shows / 4), fama: Math.round(shows / 2) + (calidad >= 3 ? 3 : 0) });
      Estado.darLogro('semanaModa');
      let txt = `<p>Desfilaste en <b>${shows}</b> shows en ${ciudadModa}. Cobraste <b>${fmt$(neto)}</b> (tras comisión).</p>`;
      if (pts >= 4 && m.nivel >= 3 && R.chance(0.5)) {
        m.aperturas++; m.prestigio += 6; mod({ fama: 6 });
        txt += `<p>🌟 <b>${dis.n.charAt(0).toUpperCase() + dis.n.slice(1)}</b> te eligió para <b>cerrar su desfile</b>. Es el máximo honor de la temporada.</p>`;
        Noticias.emitir(`${p.nombre} ${p.apellido} cierra el desfile más esperado de la Semana de la Moda de ${ciudadModa}.`);
      } else if (pts >= 3) txt += '<p>La prensa de moda destacó tu caminata.</p>';
      else if (pts <= 0) txt += '<p>Un crítico de moda escribió que "caminabas como en el supermercado". Auch.</p>';
      if (pts >= 4) txt += '<p class="nota">El momento del imprevisto se volvió viral en redes.</p>';
      if (pts >= 4 && p.esp.redes) p.esp.redes.seguidores += R.int(20000, 200000);
      log(`🗓️ Desfilaste ${shows} veces en la Semana de la Moda de ${ciudadModa}. Ganaste ${fmt$(neto)}.`, pts >= 3 ? 'raro' : 'bueno');
      this.subir();
      if (pts >= 3) Efectos.celebrar('👠', '¡Semana de la Moda!', txt); else aviso('Semana de la Moda', txt, '👠');
    }, 1600, '📸');
  },

  /* ---------- Portadas y contratos ---------- */
  ofertaPortada() {
    const p = S.p, m = this.m(), rev = R.pick(REVISTAS);
    Modal.mostrar({ ic: '📰', titulo: `Portada de ${rev}`, texto: `<p>La revista <b>${rev}</b> te quiere en su portada del próximo mes. ¿Cómo quieres que sea la sesión?</p>`, opciones: [
      op('✨ Glamurosa y elegante', () => this.portada(rev, 0.75, 'glamurosa')),
      op('🔥 Atrevida y provocadora', () => this.portada(rev, 0.6, 'atrevida', true)),
      op('🌿 Natural, sin maquillaje', () => this.portada(rev, 0.65 + p.st.apariencia / 400, 'natural')),
      op('Rechazarla', () => {}),
    ] });
  },
  portada(rev, prob, estilo, polemica) {
    const p = S.p, m = this.m();
    Efectos.suspenso('📰 Imprimiendo la nueva edición…', () => {
      m.portadas++; Estado.darLogro('portada');
      const g = this.cobrar(Math.round(PAGO_BASE_MOD[m.nivel] * 0.3 * this.escala()));
      if (R.chance(prob)) {
        m.prestigio += 4 + m.nivel; m.rep = clamp(m.rep + 6); mod({ fama: 5, felicidad: 8 });
        log(`📰 Saliste en la portada de ${rev} con una sesión ${estilo}. ¡Se agotó en los quioscos!`, 'raro');
        Efectos.celebrar('📰', '¡Portada!', `<p>Tu portada ${estilo} de <b>${rev}</b> se agotó.</p><p>Cobraste ${fmt$(g)}.</p>`);
        if (polemica && R.chance(0.4)) { mod({ fama: 5 }); Noticias.emitir(`La portada de ${p.nombre} ${p.apellido} en ${rev} desata un debate en redes.`); }
      } else {
        m.rep = clamp(m.rep - 4); mod({ fama: 2 });
        log(`📰 Saliste en la portada de ${rev}, pero la sesión ${estilo} recibió críticas.`, 'malo');
        aviso('Portada polémica', '<p>Las críticas no fueron buenas… pero se habló de ti.</p>', '📰');
      }
      this.subir();
    }, 1400, '📰');
  },
  ofertaContrato() {
    const p = S.p, m = this.m();
    const marca = R.pick(MARCAS.filter(x => !m.contratos.some(c => c.marca === x)));
    if (!marca) return;
    const producto = R.pick(['su nueva fragancia', 'su línea de relojes', 'su colección de alta costura', 'su campaña de joyería', 'su línea de cosméticos', 'su ropa interior de lujo']);
    const pago = Math.round([0, 0, 0, 150000, 1500000, 5000000][m.nivel] * R.float(0.6, 1.4) * this.escala());
    const anios = R.int(2, 4);
    if (!pago) return;
    Modal.mostrar({ ic: '🤝', titulo: `${marca} te quiere`, texto: `<p><b>${marca}</b> quiere que seas el rostro de ${producto}: <b>${fmt$(pago)} al año</b> durante ${anios} años.</p><p class="nota">Incluye cláusula moral: un escándalo grave cancela el contrato.</p>`, opciones: [
      op('✍️ Firmar', () => this.firmar(marca, producto, pago, anios)),
      op('💼 Que tu agente negocie', () => { if (R.chance(0.55 + m.rep / 300)) { const n = Math.round(pago * R.float(1.15, 1.5)); log(`💼 Tu agente subió la oferta de ${marca} a ${fmt$(n)} al año.`, 'bueno'); this.firmar(marca, producto, n, anios); } else { log(`💼 ${marca} retiró la oferta tras la negociación.`, 'malo'); aviso('Oferta retirada', `<p>${marca} eligió a otr${gx(p, 'o', 'a')} modelo.</p>`, '😬'); } }),
      op('Rechazar', () => {}),
    ] });
  },
  firmar(marca, producto, pago, anios) {
    const p = S.p, m = this.m();
    m.contratos.push({ marca, producto: producto.replace(/^su /, ''), pago, anios });
    m.prestigio += 5; mod({ fama: 6, felicidad: 10 });
    Estado.darLogro('embajador');
    log(`🤝 Firmaste como rostro de ${marca} (${producto}) por ${fmt$(pago)} al año.`, 'raro');
    Noticias.emitir(`${p.nombre} ${p.apellido} es ${gx(p, 'el nuevo rostro', 'la nueva cara')} de ${marca}.`);
    Efectos.celebrar('🤝', '¡Contrato de embajador!', `<p>Eres el rostro de <b>${marca}</b>.</p><p>${fmt$(pago)} al año durante ${anios} años.</p>`);
    this.subir();
  },

  /* ---------- Vida de modelo ---------- */
  fiesta() {
    const p = S.p, m = this.m();
    if (!usar('fiestaModa', 2)) return;
    const pasa = R.peso([[30, 'contacto'], [20, 'celebridad'], [20, 'normal'], [15, 'excesos'], [15, 'paparazzi']]);
    if (pasa === 'contacto') { m.rep = clamp(m.rep + 6); m.book = clamp(m.book + 5); log('🥂 Conociste a un fotógrafo famoso en una fiesta. Quiere trabajar contigo.', 'bueno'); }
    else if (pasa === 'celebridad') {
      const c = Estado.persona({ tipo: 'pareja', edad: clamp(p.edad + R.int(-4, 6), 18, 80) });
      c.profesion = R.pick(['Estrella de cine', 'Cantante pop', 'Futbolista', 'Piloto de carreras', 'Modelo']); c.dinero = Math.round(R.int(2e6, 4e7)); c.apa = R.int(75, 98); c.famoso = true;
      Modal.mostrar({ ic: '✨', titulo: 'Química en la fiesta', texto: `<p>Conoces a <b>${c.nombre}</b>, ${c.profesion.toLowerCase()} famos${gx(c, 'o', 'a')}. Hay química.</p>`, opciones: [
        op('Darle tu número', () => { if (pareja()) { mod({ karma: -4 }); log(`Coqueteaste con ${c.nombre} aunque tienes pareja. Las revistas ya especulan.`, 'raro'); mod({ fama: 3 }); return; } c.cercania = R.int(55, 80); c.anios = 0; p.rel.push(c); p.cont.parejas++; mod({ fama: 6, felicidad: 8 }); log(`💕 Empezaste a salir con ${c.nombre}, ${c.profesion.toLowerCase()}.`, 'raro'); Noticias.emitir(`¡Nueva pareja del momento! ${p.nombre} ${p.apellido} y ${c.nombre} fueron vistos juntos.`); }),
        op('Solo charlar', () => { mod({ fama: 1 }); }),
      ] });
    }
    else if (pasa === 'excesos') { p.adic.alcohol = clamp(p.adic.alcohol + 12); mod({ salud: -4, felicidad: 4 }); log('🍾 La fiesta se salió de control. Al día siguiente tenías un casting…', 'malo'); m.rep = clamp(m.rep - 5); }
    else if (pasa === 'paparazzi') { mod({ fama: 3 }); if (R.chance(0.4)) this.escandalo('Fotos tuyas de madrugada saliendo de la fiesta inundan las revistas.'); else log('📸 Los paparazzis te fotografiaron saliendo de la fiesta. Te veías increíble.', 'raro'); }
    else { mod({ felicidad: 4 }); log('🥂 Fuiste a una fiesta exclusiva de la industria de la moda.'); }
  },
  escandalo(texto) {
    const p = S.p, m = this.m();
    m.rep = clamp(m.rep - 12); mod({ fama: 4, felicidad: -6 });
    log(`📰 Escándalo: ${texto}`, 'malo');
    Noticias.emitir(texto);
    if (m.contratos.length && R.chance(0.5)) { const c = m.contratos.shift(); log(`💔 ${c.marca} canceló tu contrato por la cláusula moral.`, 'malo'); }
  },
  dietaExtrema() {
    const p = S.p, m = this.m();
    if (!usar('dietaExtrema', 1)) return;
    m.dietas = (m.dietas || 0) + 1;
    mod({ apariencia: R.int(2, 5), salud: -R.int(5, 10), felicidad: -5, estres: 6 });
    log('🥬 Hiciste una dieta extrema antes de la temporada de desfiles.', 'malo');
    if (m.dietas >= 3 && R.chance(0.35)) {
      Salud.contraer('Ansiedad'); mod({ salud: -15 });
      Modal.mostrar({ ic: '🫂', titulo: 'Tu cuerpo dice basta', texto: '<p>Te desmayas en un ensayo. El médico te habla seriamente sobre la presión de la industria y los trastornos alimenticios.</p>', opciones: [
        op('Pedir ayuda profesional y tomarme un descanso', () => { m.dietas = 0; mod({ estres: -15, felicidad: 4 }); m.rep = clamp(m.rep - 3); log('Pediste ayuda y te tomaste un tiempo para cuidarte.', 'bueno'); }),
        op('Hablar públicamente de la presión en la moda', () => { m.dietas = 0; mod({ fama: 8, karma: 6 }); m.rep = clamp(m.rep + 5); log('Tu testimonio sobre la presión en la moda inspiró a miles.', 'raro'); Noticias.emitir(`${p.nombre} ${p.apellido} rompe el silencio sobre la presión estética en la moda.`); }),
        op('Ignorarlo y seguir', () => { mod({ salud: -10 }); }),
      ] });
    }
  },
  cambiarAgencia() {
    const p = S.p, m = this.m();
    Modal.mostrar({ ic: '🏢', titulo: 'Agencias', texto: '<p>Las agencias más grandes cobran menos comisión y te dan acceso a mejores castings, pero exigen prestigio.</p>', opciones: AGENCIAS_MOD.map(a => ({ t: `${a.ic} ${a.n} — comisión ${Math.round(a.com * 100)}% · pide prestigio ${a.req}`, dis: a.id === m.agencia, fn: () => {
      if (!usar('cambiarAgencia', 1)) return;
      if (m.prestigio >= a.req && R.chance(0.5 + (m.rep - 40) / 100)) { m.agencia = a.id; m.rep = clamp(m.rep + 3); log(`🏢 Firmaste con ${a.n}.`, 'raro'); if (a.tier >= 2) Efectos.celebrar(a.ic, '¡Nueva agencia!', `<p>Ahora te representa <b>${a.n}</b>.</p>`); }
      else { log(`🏢 ${a.n} no quiso representarte por ahora.`, 'malo'); aviso('No te aceptaron', `<p>${a.n} pide más prestigio y mejor reputación.</p>`, '🏢'); }
    } })).concat([op('Cancelar', () => {})]) });
  },
  marcaPropia() {
    const p = S.p, m = this.m(), c = this.costoMarca();
    Modal.mostrar({ ic: '👗', titulo: 'Tu marca de moda', html: `<input type="text" id="m-txt" maxlength="30" value="${esc(p.apellido.toUpperCase())}">`, texto: '<p>¿Cómo se llamará tu marca?</p>', opciones: [{ t: 'Lanzar', cls: 'ok', fn: () => {
      const n = ($('#m-txt').value || '').trim() || p.apellido;
      p.dinero -= c; m.marcaPropia = true;
      p.negocios.push({ id: uid(), nombre: n, sector: 'ropa', sectorN: 'Marca de moda', ic: '👗', capital: c, valor: c * 1.5, empleados: Math.max(1, Math.round(c / 150000)), calidad: clamp(50 + m.nivel * 6), marketing: clamp(40 + p.st.fama / 2), anios: 0, ultimaGanancia: 0, publico: false, participacion: 1, reinversion: 0.5 });
      Estado.darLogro('empresario'); mod({ fama: 4 });
      log(`👗 Lanzaste tu propia marca de moda: <b>${esc(n)}</b>. Tu fama le da un empujón enorme.`, 'raro');
      Noticias.emitir(`${p.nombre} ${p.apellido} lanza su propia marca de moda, «${esc(n)}».`);
    } }, { t: 'Cancelar' }] });
  },

  /* ---------- Paso del tiempo ---------- */
  anual() {
    const p = S.p, m = this.norm(this.m());
    if (!m) return 0;
    let ingreso = 0;
    // Contratos
    for (const c of [...m.contratos]) {
      if (p.carcel || p.st.karma < 20) { m.contratos = m.contratos.filter(x => x !== c); log(`💔 ${c.marca} canceló tu contrato por la cláusula moral.`, 'malo'); continue; }
      ingreso += Math.round(c.pago * (1 - this.agencia().com)); c.anios--;
      if (c.anios <= 0) { m.contratos = m.contratos.filter(x => x !== c); log(`Terminó tu contrato como rostro de ${c.marca}.`); }
    }
    if (p.carcel) { log('📸 Tu agencia rompió contigo al ir a prisión.', 'malo'); p.esp.modelo = null; return ingreso; }
    if (!p.usos.casting && !p.usos.semanaModa) m.prestigio = Math.max(0, m.prestigio - 2);
    // La edad pesa (salvo para los íconos)
    if (m.nivel < 5 && p.edad > 30) m.prestigio = Math.max(0, m.prestigio - Math.round((p.edad - 30) / 3));
    if (m.nivel < 5 && (p.st.apariencia < 40 || (p.edad > 40 && R.chance(0.3)))) { log('📸 Tu agencia decidió no renovarte el contrato.', 'malo'); p.esp.modelo = null; return ingreso; }
    if (p.st.estres > 85 && R.chance(0.4)) { m.rep = clamp(m.rep - 6); mod({ salud: -5 }); log('🥵 El agotamiento te obligó a cancelar varios trabajos. La industria lo notó.', 'malo'); }
    // Ofertas que llegan solas
    if (m.nivel >= 3 && R.chance(0.3 + m.rep / 400)) this.ofertaContrato();
    if (m.nivel >= 2 && R.chance(0.25 + m.rep / 500)) this.ofertaPortada();
    if (m.nivel >= 2 && R.chance(0.08)) { const r = R.pick(['Un fotógrafo famoso te elige como musa para su nuevo libro.', 'Un video tuyo en el backstage se volvió viral.', 'Una cantante te pide protagonizar su videoclip.']); m.prestigio += 3; mod({ fama: 3 }); log(`✨ ${r}`, 'raro'); }
    return ingreso;
  },
};
