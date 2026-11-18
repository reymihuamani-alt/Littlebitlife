'use strict';
/* =========================================================
   CARRERAS ESPECIALES: modelaje, actuación, MMA,
   astronauta, redes sociales
   ========================================================= */
const NIV_MODELO = ['Modelo de catálogo', 'Modelo comercial', 'Modelo de pasarela', 'Modelo internacional', 'Supermodelo'];
const UMB_MODELO = [0, 4, 10, 20, 34];
const PAGO_MODELO = [2500, 9000, 35000, 140000, 650000];
const NIV_ACTOR = ['Extra', 'Actor de reparto', 'Actor secundario', 'Protagonista', 'Estrella internacional'];
const UMB_ACTOR = [0, 3, 8, 16, 28];
const PAGO_ACTOR = [1500, 12000, 60000, 400000, 4000000];
const NIV_ASTRO = ['Candidato a astronauta', 'Astronauta', 'Astronauta veterano', 'Comandante de misión'];
const MARCAS = ['Lumière', 'Nórdika', 'Aurea', 'Vellini', 'Kasai', 'Brava', 'Solenne', 'Ombra', 'Mareva', 'Fiero'];
const PRODUCTOS = ['perfume', 'ropa deportiva', 'joyas', 'relojes de lujo', 'jeans', 'maquillaje', 'trajes de baño', 'alta costura', 'gafas de sol', 'zapatillas'];
const RASGOS = {
  actitud: { 1: ['dulce', 'tierna', 'serena', 'amable'], 2: ['segura', 'decidida', 'confiada', 'firme'], 3: ['feroz', 'desafiante', 'intensa', 'salvaje'] },
  pose:    { 1: ['natural', 'relajada', 'espontánea', 'casual'], 2: ['elegante', 'estilizada', 'refinada', 'pulida'], 3: ['dramática', 'escultural', 'teatral', 'imponente'] },
  estilo:  { 1: ['clásico', 'sobrio', 'atemporal', 'minimalista'], 2: ['moderno', 'urbano', 'fresco', 'actual'], 3: ['extravagante', 'vanguardista', 'excéntrico', 'arriesgado'] },
};
const ESCENAS = [
  { g: 'Drama', d: 'Una madre se despide de su hijo en el aeropuerto sin saber si volverá a verlo.', best: 'dramatica', ok: 'sutil' },
  { g: 'Comedia', d: 'Un mesero torpe derrama sopa sobre un millonario el día de su boda.', best: 'comica', ok: 'fisica' },
  { g: 'Acción', d: 'Una agente salta de un tren en marcha mientras la persiguen.', best: 'fisica', ok: 'dramatica' },
  { g: 'Suspenso', d: 'Un detective interroga a un sospechoso que miente con calma.', best: 'sutil', ok: 'dramatica' },
  { g: 'Terror', d: 'Escuchas pasos en el ático a las tres de la madrugada.', best: 'sutil', ok: 'fisica' },
  { g: 'Romance', d: 'Dos ex se reencuentran por casualidad bajo la lluvia.', best: 'sutil', ok: 'dramatica' },
  { g: 'Comedia', d: 'Un abuelo intenta entender cómo funciona un teléfono inteligente.', best: 'comica', ok: 'sutil' },
  { g: 'Drama', d: 'Un abogado descubre que su cliente es culpable en pleno juicio.', best: 'dramatica', ok: 'sutil' },
  { g: 'Musical', d: 'Una vendedora del mercado empieza a cantar y todo el mercado la sigue.', best: 'fisica', ok: 'comica' },
];

const Carreras = {
  /* ---------- Resumen en Ocupación ---------- */
  resumenItems() {
    const p = S.p, e = p.esp, its = [];
    if (e.realeza) its.push({ ic: '👑', t: e.realeza.titulo || 'Familia real', s: `Popularidad ${e.realeza.popularidad}%`, fn: () => Realeza.panel(), cls: 'destacado' });
    if (p.edad >= 16) its.push({ ic: '📸', t: 'Modelaje', s: e.modelo ? `${e.modelo.nivelN} · prestigio ${e.modelo.prestigio}` : 'Firmar con una agencia', fn: () => this.panelModelo(), cls: e.modelo ? 'destacado' : '' });
    if (p.edad >= 8) its.push({ ic: '🎭', t: 'Actuación', s: e.actor ? `${NIV_ACTOR[e.actor.nivel]} · ${e.actor.papeles} papeles` : 'Buscar un agente', fn: () => this.panelActor(), cls: e.actor ? 'destacado' : '' });
    if (p.edad >= 18) its.push({ ic: '🎬', t: 'Dirección de cine', s: e.director ? `${e.director.peliculas.length} películas · habilidad ${e.director.habilidad}` : 'Fundar tu productora', fn: () => Cine.panel(), cls: e.director ? 'destacado' : '' });
    if (p.edad >= 18) its.push({ ic: '🥊', t: 'Lucha profesional (MMA)', s: e.luchador ? `Récord ${e.luchador.g}-${e.luchador.p} · ranking #${e.luchador.ranking}${e.luchador.campeon ? ' · 🏆 Campeón' : ''}` : 'Entrar a un gimnasio de MMA', fn: () => this.panelLucha(), cls: e.luchador ? 'destacado' : '' });
    if (p.edad >= 21) its.push({ ic: '🏛️', t: 'Política', s: e.politica && e.politica.cargo ? `${CARGOS[e.politica.cargo].n} · aprobación ${e.politica.aprobacion}%` : 'Postular a un cargo', fn: () => Politica.panel(), cls: e.politica && e.politica.cargo ? 'destacado' : '' });
    if (p.edad >= 22) its.push({ ic: '🚀', t: 'Agencia espacial', s: e.astronauta ? `${NIV_ASTRO[e.astronauta.nivel]} · ${e.astronauta.misiones} misiones` : 'Postular como astronauta', fn: () => this.panelAstro(), cls: e.astronauta ? 'destacado' : '' });
    if (p.edad >= 13) its.push({ ic: '📱', t: 'Redes sociales', s: e.redes ? `${fmtNum(e.redes.seguidores)} seguidores` : 'Crear una cuenta', fn: () => this.panelRedes(), cls: e.redes && e.redes.seguidores > 10000 ? 'destacado' : '' });
    return its;
  },

  /* Ingresos y efectos anuales de todas las carreras especiales */
  anual() {
    const p = S.p, e = p.esp;
    let ingreso = 0;
    if (p.carcel) return 0;
    // Modelo
    if (e.modelo) {
      const m = e.modelo;
      if (!p.usos.casting) m.prestigio = Math.max(0, m.prestigio - 2);
      ingreso += Math.round(PAGO_MODELO[m.nivel] * 0.5);
      if (p.st.apariencia < 40 || (p.edad > 38 && R.chance(0.25))) { log('📸 Tu agencia de modelos decidió no renovarte el contrato.', 'malo'); e.modelo = null; }
    }
    // Actor
    if (e.actor) {
      const a = e.actor;
      if (!p.usos.audicion) a.prestigio = Math.max(0, a.prestigio - 1);
      if (a.nivel >= 2) ingreso += Math.round(PAGO_ACTOR[a.nivel] * 0.15);
      mod({ fama: a.nivel >= 3 ? 1 : 0 });
    }
    // Luchador
    if (e.luchador) {
      const l = e.luchador;
      l.entreno = clamp(l.entreno - 4);
      if (p.edad > 34) mod({ salud: -2 });
      if (R.chance(0.08)) { Salud.contraer('Lesión de rodilla'); log('🦵 Te lesionaste la rodilla entrenando.', 'malo'); }
    }
    // Astronauta
    if (e.astronauta) {
      const a = e.astronauta;
      ingreso += Math.round([80000, 125000, 160000, 210000][a.nivel] * Math.max(0.6, eco()));
      a.entreno = clamp(a.entreno + R.int(8, 16));
      if (a.nivel === 0 && a.entreno >= 40) { a.nivel = 1; log('🚀 Terminaste el entrenamiento básico: ahora eres <b>Astronauta</b>.', 'bueno'); }
      else if (a.nivel >= 1 && a.entreno >= 60 && R.chance(0.35)) this.mision();
      if (p.st.salud < 55 && R.chance(0.4)) { log('🩺 Reprobaste el examen médico anual y la agencia te dio de baja.', 'malo'); e.astronauta = null; }
    }
    // Redes
    if (e.redes) {
      const r = e.redes;
      if (!p.usos.publicar) r.seguidores = Math.round(r.seguidores * 0.95);
      if (r.seguidores >= 10000) {
        const g = Math.round(r.seguidores * 0.012);
        ingreso += g;
      }
      const famaRedes = r.seguidores > 1000 ? Math.min(92, Math.log10(r.seguidores) * 14 - 35) : 0;
      if (p.st.fama < famaRedes) p.st.fama = Math.round(famaRedes);
    }
    // La fama se diluye si no haces nada para mantenerla
    if (p.st.fama > 5 && !e.realeza && !(e.politica && e.politica.cargo)) mod({ fama: -R.int(1, 3) });
    return ingreso;
  },

  /* ---------- MODELAJE ---------- */
  panelModelo() {
    Panel.abrir('Modelaje', () => {
      const p = S.p, m = p.esp.modelo;
      if (!m) return [
        { info: 'Para modelar necesitas buena <b>apariencia</b> (idealmente 70%+), salud y constancia. Las agencias aceptan entre 16 y 35 años.' },
        { ic: '✍️', t: 'Firmar con una agencia de modelos', s: `Tu apariencia: ${p.st.apariencia}%`, fn: () => {
          if (!usar('agenciaM', 1)) return;
          if (p.edad > 35) return aviso('Rechazado', '<p>"Lo sentimos, buscamos perfiles más jóvenes."</p>', '📸');
          if (R.chance(clamp((p.st.apariencia - 45) * 2.2, 3, 95) / 100)) { p.esp.modelo = { nivel: 0, nivelN: NIV_MODELO[0], prestigio: 0, campanias: 0 }; log('📸 ¡Firmaste con una agencia de modelos!', 'bueno'); mod({ felicidad: 8 }); }
          else { log('Una agencia de modelos te rechazó.', 'malo'); aviso('Rechazado', '<p>"No eres lo que buscamos ahora mismo."</p><p class="nota">Mejora tu apariencia (gimnasio, dieta, estética) y vuelve el próximo año.</p>', '😕'); }
        } },
      ];
      const sig = UMB_MODELO[m.nivel + 1];
      return [
        { kv: [['Nivel', m.nivelN], ['Prestigio', `${m.prestigio}${sig ? ' / ' + sig : ''}`], ['Campañas', m.campanias], ['Pago por campaña', '~' + fmt$(PAGO_MODELO[m.nivel])]] },
        { info: 'En cada casting lee el brief con atención: elige la <b>actitud</b>, la <b>pose</b> y el <b>estilo</b> que pide el cliente. Cuantos más aciertes, más probable que te elijan.' },
        { ic: '📷', t: 'Ir a un casting', s: `${usosRestantes('casting', 3)} restantes este año`, fn: () => this.casting() },
        { ic: '🥗', t: 'Cuidar la figura', s: '+apariencia, +salud', fn: () => { if (!usar('figura', 1)) return; mod({ apariencia: R.int(1, 3), salud: 2, felicidad: -1 }); log('Seguiste una rutina estricta de dieta y entrenamiento.'); } },
        { ic: '🚪', t: 'Dejar el modelaje', cls: 'peligro', fn: () => { p.esp.modelo = null; log('Dejaste el modelaje.'); } },
      ];
    });
  },
  casting() {
    if (!usar('casting', 3)) return;
    const p = S.p, m = p.esp.modelo;
    const obj = { actitud: R.int(1, 3), pose: R.int(1, 3), estilo: R.int(1, 3) };
    const marca = R.pick(MARCAS), prod = R.pick(PRODUCTOS);
    const w = k => R.pick(RASGOS[k][obj[k]]);
    const frases = [
      `Para la campaña de ${prod} de <b>${marca}</b> buscamos una mirada <b>${w('actitud')}</b>, una pose <b>${w('pose')}</b> y un look <b>${w('estilo')}</b>.`,
      `<b>${marca}</b> lanza su línea de ${prod}. El director quiere una energía <b>${w('actitud')}</b>, movimientos <b>${w('pose')}</b> y un estilismo <b>${w('estilo')}</b>.`,
    ];
    Modal.mostrar({
      ic: '📸', titulo: `Casting: ${marca}`,
      texto: `<p>${R.pick(frases)}</p>`,
      html: `<div class="nota">Actitud</div>${htmlSelector('s-act', [[1, 'Suave'], [2, 'Segura'], [3, 'Feroz']], 2)}<div class="nota">Pose</div>${htmlSelector('s-pos', [[1, 'Natural'], [2, 'Elegante'], [3, 'Dramática']], 2)}<div class="nota">Estilo</div>${htmlSelector('s-est', [[1, 'Clásico'], [2, 'Moderno'], [3, 'Vanguardista']], 2)}`,
      alAbrir: activarSelectores,
      opciones: [{ t: '📷 ¡Posar!', cls: 'ok', fn: () => {
        const a = +leerSelector('s-act'), b = +leerSelector('s-pos'), c = +leerSelector('s-est');
        const aciertos = (a === obj.actitud) + (b === obj.pose) + (c === obj.estilo);
        const prob = 0.12 + aciertos * 0.26 + (p.st.apariencia - 60) / 160 - m.nivel * 0.03 + (Rasgos.tiene('belleza') ? 0.08 : 0); Rasgos.pista('belleza');
        if (R.chance(clamp(prob * 100, 3, 95) / 100)) {
          const pago = Math.round(PAGO_MODELO[m.nivel] * R.float(0.7, 1.3) * Math.max(0.6, eco()));
          p.dinero += pago; m.prestigio += 1 + aciertos; m.campanias++;
          mod({ fama: m.nivel + 1, felicidad: 5 });
          log(`📸 ¡Te eligieron para la campaña de ${marca}! Ganaste ${fmt$(pago)}.`, 'bueno');
          this.subirModelo();
          aviso('¡Te eligieron!', `<p>Acertaste ${aciertos} de 3 rasgos. Pago: <b>${fmt$(pago)}</b>.</p>`, '🎉');
        } else {
          mod({ felicidad: -4 });
          log(`No te eligieron en el casting de ${marca}.`, 'malo');
          aviso('No quedaste', `<p>Acertaste ${aciertos} de 3. El cliente quería: actitud <b>${['', 'Suave', 'Segura', 'Feroz'][obj.actitud]}</b>, pose <b>${['', 'Natural', 'Elegante', 'Dramática'][obj.pose]}</b>, estilo <b>${['', 'Clásico', 'Moderno', 'Vanguardista'][obj.estilo]}</b>.</p>`, '😞');
        }
      } }],
    });
  },
  subirModelo() {
    const m = S.p.esp.modelo;
    while (m.nivel < 4 && m.prestigio >= UMB_MODELO[m.nivel + 1]) {
      m.nivel++; m.nivelN = NIV_MODELO[m.nivel];
      log(`🌟 ¡Subiste de nivel! Ahora eres <b>${m.nivelN}</b>.`, 'raro');
      if (m.nivel === 4) { Estado.darLogro('supermodelo'); mod({ fama: 15 }); Efectos.celebrar('📸', '¡Supermodelo!', '<p>Eres la cara de las marcas más importantes del mundo.</p>'); Noticias.emitir(`${S.p.nombre} ${S.p.apellido} es la nueva supermodelo del momento.`); }
    }
  },

  /* ---------- ACTUACIÓN ---------- */
  panelActor() {
    Panel.abrir('Actuación', () => {
      const p = S.p, a = p.esp.actor;
      if (!a) return [
        { info: 'Un agente te consigue audiciones. Ayudan la <b>apariencia</b>, la <b>fama</b>, el club de teatro y estudiar Cine o Bellas Artes.' },
        { ic: '🤝', t: 'Buscar un agente', fn: () => {
          if (!usar('agenteA', 1)) return;
          const bonus = (p.edu.club === 'teatro' ? 15 : 0) + (tieneTitulo('universidad', 'Cine y Audiovisuales') || tieneTitulo('universidad', 'Bellas Artes') ? 20 : 0);
          if (R.chance(clamp(25 + (p.st.apariencia - 50) * 0.8 + p.st.fama * 0.5 + bonus, 5, 95) / 100)) { p.esp.actor = { nivel: 0, prestigio: 0, papeles: 0 }; log('🎭 ¡Conseguiste un agente de actuación!', 'bueno'); }
          else { log('Ningún agente quiso representarte.', 'malo'); aviso('Sin agente', '<p>Prueba de nuevo el próximo año. Toma clases de actuación para mejorar.</p>', '🎭'); }
        } },
        { ic: '🎓', t: 'Tomar clases de actuación', s: '$500', fn: () => { if (!usar('clasesA', 1)) return; if (p.dinero < 500 * eco()) return toast('No tienes suficiente dinero.'); p.dinero -= Math.round(500 * eco()); mod({ fama: 1, felicidad: 3, apariencia: 1 }); log('Tomaste clases de actuación.'); } },
      ];
      const sig = UMB_ACTOR[a.nivel + 1];
      return [
        { kv: [['Nivel', NIV_ACTOR[a.nivel]], ['Prestigio', `${a.prestigio}${sig ? ' / ' + sig : ''}`], ['Papeles', a.papeles], ['Pago por papel', '~' + fmt$(PAGO_ACTOR[a.nivel])]] },
        { info: 'En la audición, elige la interpretación que mejor encaje con la escena.' },
        { ic: '🎬', t: 'Ir a una audición', s: `${usosRestantes('audicion', 3)} restantes este año`, fn: () => this.audicion() },
        { ic: '🎓', t: 'Tomar clases de actuación', fn: () => { if (!usar('clasesA', 1)) return; a.prestigio++; mod({ felicidad: 2 }); log('Tomaste clases intensivas de actuación.'); } },
        { ic: '🚪', t: 'Dejar la actuación', cls: 'peligro', fn: () => { p.esp.actor = null; log('Dejaste la actuación.'); } },
      ];
    });
  },
  audicion() {
    if (!usar('audicion', 3)) return;
    const p = S.p, a = p.esp.actor, esc = R.pick(ESCENAS);
    const tipoProd = ['un comercial', 'una telenovela', 'una serie de streaming', 'una película independiente', 'una superproducción'][a.nivel];
    const op = (id, t) => ({ t, fn: () => {
      const pts = id === esc.best ? 2 : id === esc.ok ? 1 : 0;
      const prob = 0.15 + pts * 0.27 + (p.st.apariencia - 50) / 220 + p.st.fama / 300 - a.nivel * 0.04 + (Rasgos.tiene('artista') ? 0.08 : 0); Rasgos.pista('artista');
      if (R.chance(clamp(prob * 100, 4, 92) / 100)) {
        const pago = Math.round(PAGO_ACTOR[a.nivel] * R.float(0.7, 1.4) * Math.max(0.5, eco()));
        p.dinero += pago; a.prestigio += 1 + pts; a.papeles++;
        mod({ fama: 1 + a.nivel * 2, felicidad: 6 });
        log(`🎭 ¡Conseguiste un papel en ${tipoProd} de ${esc.g.toLowerCase()}! Ganaste ${fmt$(pago)}.`, 'bueno');
        while (a.nivel < 4 && a.prestigio >= UMB_ACTOR[a.nivel + 1]) { a.nivel++; log(`🌟 Tu carrera despega: ahora eres <b>${NIV_ACTOR[a.nivel]}</b>.`, 'raro'); }
      } else { mod({ felicidad: -3 }); log(`No te dieron el papel en ${tipoProd}.`, 'malo'); toast(pts === 2 ? 'Buena lectura, pero eligieron a otro.' : 'Esa interpretación no convenció.'); }
    } });
    Modal.mostrar({ ic: '🎬', titulo: `Audición: ${esc.g}`, texto: `<p>Audicionas para ${tipoProd}.</p><p><b>Escena:</b> ${esc.d}</p><p>¿Cómo la interpretas?</p>`, opciones: R.shuffle([op('dramatica', '😭 Intensa y dramática'), op('comica', '😂 Cómica y exagerada'), op('sutil', '🤫 Contenida y sutil'), op('fisica', '🤸 Física y enérgica')]) });
  },

  /* ---------- LUCHA MMA ---------- */
  panelLucha() {
    Panel.abrir('Lucha profesional', () => {
      const p = S.p, l = p.esp.luchador;
      if (!l) return [
        { info: 'Para pelear profesionalmente necesitas <b>salud ≥ 60</b> y tener entre 18 y 35 años. Entrena para subir tu potencia.' },
        { ic: '🥋', t: 'Inscribirse en un gimnasio de MMA', dis: p.st.salud < 60 ? 'Necesitas salud de 60%.' : p.edad > 35 ? 'Eres demasiado mayor para debutar.' : false, fn: () => { p.esp.luchador = { g: 0, p: 0, ranking: 100, entreno: 20, campeon: false, defensas: 0 }; log('🥋 Te uniste a un gimnasio de MMA para pelear profesionalmente.', 'bueno'); } },
      ];
      return [
        { kv: [['Récord', `${l.g} victorias · ${l.p} derrotas`], ['Ranking mundial', l.campeon ? '🏆 Campeón' : '#' + l.ranking], ['Defensas del título', l.defensas]] },
        { barra: ['Entrenamiento', l.entreno] },
        { ic: '🏋️', t: 'Entrenar', s: `${usosRestantes('entrenarL', 3)} restantes`, fn: () => { if (!usar('entrenarL', 3)) return; l.entreno = clamp(l.entreno + R.int(5, 10)); mod({ salud: 1, estres: 2, apariencia: 1 }); log('Entrenaste duro en el gimnasio.'); toast('🏋️ +entrenamiento'); } },
        { ic: '🥊', t: l.campeon ? 'Defender el título' : l.ranking <= 3 ? '🏆 Pelear por el título mundial' : 'Pelear la siguiente pelea', s: `${usosRestantes('pelearL', 2)} peleas restantes`, fn: () => this.pelearMMA() },
        { ic: '🚪', t: 'Retirarse de la lucha', cls: 'peligro', fn: () => { log(`Te retiraste de la lucha con un récord de ${l.g}-${l.p}.`); p.esp.luchador = null; } },
      ];
    });
  },
  poderLucha() { const p = S.p, l = p.esp.luchador; return p.st.salud * 0.45 + (l ? l.entreno : 0) * 0.55 - Math.max(0, p.edad - 32) * 1.5 + (Rasgos.tiene('atleta') ? 12 : 0); },
  pelearMMA() {
    const p = S.p, l = p.esp.luchador;
    if (p.st.salud < 30) return toast('Estás demasiado lastimad' + gx(p, 'o', 'a') + ' para pelear.');
    if (!usar('pelearL', 2)) return;
    const titulo = l.campeon || l.ranking <= 3;
    const fuerza = clamp(100 - l.ranking * 0.6 + (titulo ? 12 : 0) + R.int(-8, 8), 20, 98);
    const rival = { nombre: `${R.pick(['"El Toro"', '"La Sombra"', '"Martillo"', '"Cobra"', '"El Tanque"', '"Relámpago"'])} ${R.pick(APELLIDOS)}`, fuerza };
    Minijuegos.pelea({
      titulo: titulo ? '🏆 Pelea por el título' : '🥊 Pelea profesional', rival, poder: this.poderLucha(),
      alFin: gano => {
        const bolsa = Math.round((titulo ? 400000 : 4000 + (100 - l.ranking) * 900) * R.float(0.8, 1.2));
        if (gano) {
          l.g++; p.dinero += bolsa; mod({ fama: titulo ? 12 : 2, felicidad: 8 });
          if (l.campeon) { l.defensas++; log(`🏆 ¡Defendiste tu cinturón ante ${rival.nombre}! Bolsa: ${fmt$(bolsa)}.`, 'bueno'); }
          else if (titulo) { l.campeon = true; l.ranking = 1; log(`🏆 ¡ERES CAMPEÓN MUNDIAL! Venciste a ${rival.nombre}. Bolsa: ${fmt$(bolsa)}.`, 'raro'); Estado.darLogro('campeon'); Efectos.celebrar('🏆', '¡Campeón mundial!', `<p>Levantas el cinturón frente a 20.000 personas.</p><p>Bolsa: <b>${fmt$(bolsa)}</b></p>`); Noticias.emitir(`${p.nombre} ${p.apellido} es el nuevo campeón mundial de MMA.`); }
          else { l.ranking = Math.max(1, l.ranking - R.int(8, 18)); log(`🥊 Venciste a ${rival.nombre}. Subes al puesto #${l.ranking}. Bolsa: ${fmt$(bolsa)}.`, 'bueno'); }
        } else {
          l.p++; p.dinero += Math.round(bolsa * 0.3); mod({ salud: -R.int(4, 10), felicidad: -8 });
          if (l.campeon) { l.campeon = false; l.ranking = R.int(3, 8); log(`💔 Perdiste tu cinturón contra ${rival.nombre}.`, 'malo'); }
          else { l.ranking = Math.min(100, l.ranking + R.int(4, 10)); log(`Perdiste contra ${rival.nombre}. Caes al puesto #${l.ranking}.`, 'malo'); }
        }
      },
    });
  },

  /* ---------- ASTRONAUTA ---------- */
  panelAstro() {
    Panel.abrir('Agencia espacial', () => {
      const p = S.p, a = p.esp.astronauta;
      if (!a) {
        const falta = [];
        const carrerasOk = ['Ingeniería Aeroespacial', 'Física', 'Ingeniería Civil', 'Medicina', 'Biología', 'Informática'];
        if (!carrerasOk.some(c => tieneTitulo('universidad', c))) falta.push('Título en ciencias o ingeniería');
        if (!tieneTitulo('maestria') && !tieneTitulo('doctorado')) falta.push('Maestría o doctorado');
        if (p.st.inteligencia < 75) falta.push('Inteligencia 75%');
        if (p.st.salud < 70) falta.push('Salud 70%');
        if (p.edad < 25 || p.edad > 46) falta.push('Edad entre 25 y 46');
        if (p.antecedentes) falta.push('Sin antecedentes');
        return [
          { info: 'El camino al espacio: carrera STEM → posgrado → excelente salud → superar tres pruebas (física, técnica y psicológica).' },
          { kv: [['Requisitos pendientes', falta.length ? falta.join('<br>') : '✅ Ninguno']] },
          { ic: '📝', t: 'Postular a la agencia espacial', dis: falta.length ? 'Te faltan requisitos.' : false, fn: () => this.pruebasAstro() },
        ];
      }
      return [
        { kv: [['Rango', NIV_ASTRO[a.nivel]], ['Misiones', a.misiones]] },
        { barra: ['Entrenamiento', a.entreno] },
        { ic: '🧑‍🚀', t: 'Entrenamiento en simulador', fn: () => { if (!usar('simulador', 2)) return; a.entreno = clamp(a.entreno + R.int(5, 10)); mod({ estres: 3, inteligencia: 1 }); log('Pasaste horas en el simulador de vuelo espacial.'); } },
        { ic: '🏃', t: 'Preparación física', fn: () => { if (!usar('fisicaA', 1)) return; mod({ salud: 3 }); log('Completaste tu preparación física.'); } },
        { ic: '🚪', t: 'Dejar la agencia', cls: 'peligro', fn: () => { p.esp.astronauta = null; log('Dejaste la agencia espacial.'); } },
      ];
    });
  },
  pruebasAstro() {
    if (!usar('postAstro', 1)) return;
    const p = S.p; let pts = 0;
    if (R.chance(p.st.salud / 110)) pts++;
    const v = R.int(3, 9), t = R.int(2, 6);
    Modal.mostrar({
      ic: '🧪', titulo: 'Prueba técnica', texto: `<p>La prueba física fue ${pts ? '<b>superada</b>' : '<b>reprobada</b>'}.</p><p>Ahora la técnica: un objeto parte del reposo y acelera a ${v} m/s². ¿Qué velocidad tiene a los ${t} segundos?</p>`,
      opciones: R.shuffle([v * t, v + t, v * t * 2, v * t - 3]).map(x => ({ t: `${x} m/s`, fn: () => {
        if (x === v * t) pts++;
        Modal.mostrar({
          ic: '🧠', titulo: 'Prueba psicológica', texto: '<p>Estás a 400 km de la Tierra. Una alarma suena y un compañero entra en pánico. ¿Qué haces?</p>',
          opciones: R.shuffle([
            { t: 'Mantengo la calma, sigo el protocolo y le asigno una tarea concreta.', fn: () => this.resultadoAstro(pts + 1) },
            { t: 'Le grito que se calme.', fn: () => this.resultadoAstro(pts) },
            { t: 'Intento arreglar todo yo solo sin decir nada.', fn: () => this.resultadoAstro(pts) },
          ]),
        });
      } })),
    });
  },
  resultadoAstro(pts) {
    const p = S.p;
    if (pts >= 2 && R.chance(0.55 + pts * 0.12)) {
      if (p.trabajo) Trabajo.dejar(`Dejaste tu empleo para unirte a la agencia espacial.`);
      p.esp.astronauta = { nivel: 0, misiones: 0, entreno: 15 };
      log('🚀 ¡Te seleccionaron como <b>candidato a astronauta</b>!', 'raro'); mod({ felicidad: 15, fama: 5 });
      aviso('¡Seleccionado!', `<p>Superaste ${pts} de 3 pruebas. Bienvenid${gx(p, 'o', 'a')} a la agencia espacial.</p>`, '🚀');
    } else { log('No pasaste el proceso de selección de astronautas.', 'malo'); aviso('No seleccionado', `<p>Superaste ${pts} de 3 pruebas. Puedes intentarlo el próximo año.</p>`, '🛰️'); }
  },
  mision() {
    const p = S.p, a = p.esp.astronauta;
    Modal.mostrar({
      ic: '🚀', titulo: '¡Misión espacial!', texto: '<p>Fuiste asignad' + gx(p, 'o', 'a') + ' a una misión a la estación espacial. Durante el acoplamiento, un sensor marca una fuga leve de presión.</p>',
      opciones: [
        { t: 'Abortar el acoplamiento y revisar sistemas', fn: () => this.finMision(0.85, 'La revisión detectó una falla menor. La misión fue un éxito.') },
        { t: 'Seguir: probablemente es un error del sensor', fn: () => this.finMision(0.6, 'Era un error del sensor. ¡Acoplamiento perfecto!') },
        { t: 'Hacer una caminata espacial para repararla', fn: () => this.finMision(0.72, 'Tu caminata espacial salió en todas las noticias del mundo.', 10) },
      ],
    });
  },
  finMision(prob, texto, famaExtra = 0) {
    const p = S.p, a = p.esp.astronauta;
    if (R.chance(prob + a.entreno / 500)) {
      a.misiones++; a.entreno = 30; mod({ fama: 12 + famaExtra, felicidad: 15 });
      log(`🌍 ¡Misión espacial completada! ${texto}`, 'raro'); Estado.darLogro('astronauta'); Efectos.celebrar('🌍', '¡Misión cumplida!', `<p>${texto}</p><p>Viste la Tierra desde el espacio.</p>`); Noticias.emitir(`La misión espacial con ${p.nombre} ${p.apellido} regresa con éxito.`);
      if (a.nivel < 3 && a.misiones >= a.nivel) { a.nivel++; log(`Ascendiste a <b>${NIV_ASTRO[a.nivel]}</b>.`, 'bueno'); }
    } else if (R.chance(0.25)) {
      Vida.morir('un accidente durante una misión espacial');
    } else { mod({ salud: -15, felicidad: -10 }); log('🚨 La misión tuvo que abortarse por una emergencia. Volviste herid' + gx(p, 'o', 'a') + ', pero con vida.', 'malo'); }
  },

  /* ---------- REDES SOCIALES ---------- */
  panelRedes() {
    Panel.abrir('Redes sociales', () => {
      const p = S.p, r = p.esp.redes;
      if (!r) return [{ ic: '📱', t: 'Crear una cuenta', s: 'Empieza tu camino de influencer', fn: () => { p.esp.redes = { seguidores: R.int(20, 150), posts: 0 }; log('📱 Creaste tu cuenta en redes sociales.'); } }];
      return [
        { kv: [['Seguidores', fmtNum(r.seguidores)], ['Publicaciones', r.posts], ['Monetización', r.seguidores >= 10000 ? `~${fmt$(r.seguidores * 0.012)}/año` : 'Desde 10 mil seguidores']] },
        { ic: '🤳', t: 'Publicar una selfie', s: 'Depende de tu apariencia', fn: () => this.publicar('selfie') },
        { ic: '😂', t: 'Publicar un video de humor', s: 'Depende de tu ingenio', fn: () => this.publicar('humor') },
        { ic: '🧑‍🏫', t: 'Publicar un tutorial educativo', s: 'Depende de tu inteligencia', fn: () => this.publicar('tutorial') },
        { ic: '🔥', t: 'Publicar algo polémico', s: 'Puede explotar… o arruinarte', fn: () => this.publicar('polemica') },
        { ic: '🤝', t: 'Hacer una colaboración pagada', dis: r.seguidores < 10000 ? 'Necesitas 10 mil seguidores.' : false, fn: () => { if (!usar('colab', 2)) return; const g = Math.round(r.seguidores * R.float(0.004, 0.012)); p.dinero += g; r.seguidores = Math.round(r.seguidores * 0.98); log(`Hiciste una publicidad pagada y ganaste ${fmt$(g)}.`, 'bueno'); } },
        { ic: '🗑️', t: 'Eliminar la cuenta', cls: 'peligro', fn: () => { p.esp.redes = null; log('Eliminaste tu cuenta de redes sociales.'); } },
      ];
    });
  },
  publicar(tipo) {
    if (!usar('publicar', 4)) return;
    const p = S.p, r = p.esp.redes; r.posts++;
    const base = Math.max(15, r.seguidores * 0.07);
    const f = { selfie: p.st.apariencia / 50, humor: (p.st.felicidad + p.st.inteligencia) / 100, tutorial: p.st.inteligencia / 55, polemica: 1 }[tipo] * (Rasgos.tiene('artista') ? 1.3 : 1); Rasgos.pista('artista');
    let g = Math.round(base * f * R.float(0.4, 1.6));
    if (tipo === 'polemica') {
      if (R.chance(0.5)) { g *= 4; mod({ fama: 3, karma: -3 }); log('🔥 Tu publicación polémica se volvió tendencia.', 'raro'); }
      else { g = -Math.round(r.seguidores * 0.18); mod({ felicidad: -8, karma: -3 }); log('🔥 Te "cancelaron" por tu publicación polémica.', 'malo'); }
    } else if (R.chance(0.06)) { g = Math.round(g * R.int(8, 25) + 5000); log('🚀 ¡Una publicación tuya se volvió <b>viral</b>!', 'raro'); mod({ fama: 5, felicidad: 8 }); }
    r.seguidores = Math.max(0, r.seguidores + g);
    toast(`${g >= 0 ? '+' : '−'}${fmtNum(Math.abs(g))} seguidores`);
    if (r.seguidores >= 1e6) Estado.darLogro('viral');
  },
};
