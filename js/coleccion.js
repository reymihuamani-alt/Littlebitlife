'use strict';
/* =========================================================
   ARTÍCULOS RAROS: hallazgos casi imposibles que pueden valer
   fortunas (o ser falsificaciones). Tasación, subastas,
   coleccionistas, casas de empeño, museos.
   Y la TIENDA de objetos con efectos.
   ========================================================= */
const RAREZAS = {
  comun:      { n: 'Curioso', ic: '⚪', color: 'var(--txt2)' },
  raro:       { n: 'Raro', ic: '🔵', color: 'var(--info)' },
  epico:      { n: 'Épico', ic: '🟣', color: 'var(--fama)' },
  legendario: { n: 'Legendario', ic: '🟡', color: '#d4a106' },
};
const RAROS = {
  billete:    { ic: '💵', n: 'Billete con error de impresión', r: 'comun', v: [300, 25000] },
  reloj:      { ic: '⌚', n: 'Reloj de bolsillo antiguo', r: 'comun', v: [200, 30000] },
  vinilo:     { ic: '💿', n: 'Vinilo de prensaje original firmado', r: 'comun', v: [300, 60000] },
  carta:      { ic: '🃏', n: 'Carta holográfica de primera edición', r: 'raro', v: [2000, 400000] },
  moneda:     { ic: '🪙', n: 'Moneda de oro colonial', r: 'raro', v: [3000, 250000] },
  videojuego: { ic: '🎮', n: 'Videojuego retro sellado de fábrica', r: 'raro', v: [1000, 1500000] },
  libro:      { ic: '📖', n: 'Primera edición firmada de un clásico', r: 'raro', v: [5000, 600000] },
  vino:       { ic: '🍷', n: 'Botella de vino centenaria', r: 'raro', v: [2000, 300000] },
  comic:      { ic: '📕', n: 'Cómic número 1 de un superhéroe', r: 'epico', v: [20000, 3000000] },
  meteorito:  { ic: '☄️', n: 'Fragmento de meteorito marciano', r: 'epico', v: [50000, 2000000] },
  diamante:   { ic: '💎', n: 'Diamante en bruto', r: 'epico', v: [80000, 8000000] },
  mapa:       { ic: '🗺️', n: 'Mapa antiguo de navegantes', r: 'epico', v: [30000, 1200000] },
  huaco:      { ic: '🏺', n: 'Cerámica precolombina', r: 'epico', v: [20000, 900000], patrimonio: true },
  fosil:      { ic: '🦖', n: 'Fósil de dinosaurio casi completo', r: 'legendario', v: [1e6, 3e7] },
  violin:     { ic: '🎻', n: 'Violín de un luthier de Cremona (siglo XVIII)', r: 'legendario', v: [2e6, 1.6e7] },
  pintura:    { ic: '🖼️', n: 'Pintura perdida de un gran maestro', r: 'legendario', v: [5e6, 9e7] },
  huevo:      { ic: '🥚', n: 'Huevo imperial enjoyado', r: 'legendario', v: [3e6, 3.3e7] },
};
const PROB_FALSO = { comun: 0.05, raro: 0.2, epico: 0.3, legendario: 0.35 };

const Coleccion = {
  lista() { const p = S.p; if (!p.coleccion) p.coleccion = []; return p.coleccion; },
  /* Crea un artículo: valor real oculto hasta tasarlo; casi siempre cerca del mínimo */
  crear(id, { dudoso = false, falsoProb } = {}) {
    const d = RAROS[id];
    const [a, b] = d.v;
    const valor = Math.round(a * Math.pow(b / a, Math.pow(Math.random(), 2.4)));
    const falso = R.chance(falsoProb ?? PROB_FALSO[d.r]);
    return { uid: uid(), id, n: d.n, ic: d.ic, r: d.r, valor: falso ? Math.round(R.int(20, 400) * eco()) : valor, falso, tasado: false, dudoso, anio: S.anio };
  },
  encontrar(id, donde, opts = {}) {
    const p = S.p, it = this.crear(id, opts);
    this.lista().push(it);
    const rz = RAREZAS[it.r];
    log(`${it.ic} Encontraste ${donde}: <b>${it.n}</b> ${rz.ic}.`, 'raro');
    if (it.r === 'legendario' && !it.falso) { p.cont.tesoros = (p.cont.tesoros || 0) + 1; Estado.darLogro('tesoro'); }
    const txt = `<p>${donde.charAt(0).toUpperCase() + donde.slice(1)} encontraste: <b>${it.n}</b>.</p><p>Rareza: <b style="color:${rz.color}">${rz.ic} ${rz.n}</b></p><p class="nota">No sabes cuánto vale ni si es auténtico. Llévalo a tasar en Bienes → Tu colección.</p>`;
    if (it.r === 'epico' || it.r === 'legendario') Efectos.celebrar(it.ic, '¡Un hallazgo increíble!', txt);
    else Modal.mostrar({ ic: it.ic, titulo: '¡Encontraste algo!', texto: txt });
    return it;
  },
  /* Sorteo de qué aparece según el lugar */
  azar(pesos) { return R.peso(pesos.map(([w, r]) => [w, r])); },
  idDeRareza(r) { return R.pick(Object.keys(RAROS).filter(k => RAROS[k].r === r)); },

  anual() {
    const p = S.p;
    for (const it of this.lista()) if (!it.falso) it.valor = Math.max(10, Math.round(it.valor * (1 + R.normal(0.04, 0.08))));
    // Objetos de la tienda con efecto pasivo
    const o = p.objetos || {};
    if (o.bici) mod({ salud: 1 });
    if (o.gymCasa) mod({ salud: 2, apariencia: 1 });
    if (o.ropa && R.chance(0.5)) mod({ apariencia: 1 });
    if (o.consola) mod({ felicidad: 2 });
    if (o.piano) mod({ felicidad: 1, inteligencia: 1 });
  },

  /* ---------- Bazar y búsquedas ---------- */
  bazar() {
    const p = S.p;
    if (!usar('bazar', 2)) return;
    const c = Math.round(R.int(20, 150) * eco()); p.dinero -= c;
    Efectos.suspenso('🧺 Revuelves cajas polvorientas…', () => {
      const x = Math.random(), suerte = Rasgos.tiene('suerte') ? 2 : 1;
      if (x < 0.003 * suerte) this.encontrar(this.idDeRareza('legendario'), 'entre los trastos de un bazar de antigüedades');
      else if (x < 0.03 * suerte) this.encontrar(this.idDeRareza('epico'), 'en un mercado de pulgas');
      else if (x < 0.13 * suerte) this.encontrar(this.idDeRareza('raro'), 'en un mercado de pulgas');
      else if (x < 0.33) this.encontrar(this.idDeRareza('comun'), 'en un mercado de pulgas');
      else { mod({ felicidad: 2 }); log(`🧺 Pasaste la tarde en un mercado de pulgas y gastaste ${fmt$(c)} en cachivaches sin valor.`); toast('Nada interesante esta vez.'); }
    }, 1200, '🧺');
  },
  detector() {
    const p = S.p;
    if (!usar('detector', 2)) return;
    Efectos.suspenso('🔎 Bip… bip… bip…', () => {
      const x = Math.random();
      if (x < 0.004) this.encontrar('meteorito', 'enterrado en la arena con tu detector de metales');
      else if (x < 0.05) this.encontrar('moneda', 'enterrada en la playa con tu detector de metales');
      else if (x < 0.25) { const g = Math.round(R.int(5, 300) * eco()); p.dinero += g; log(`🔎 Tu detector encontró monedas y un anillo perdido: ${fmt$(g)}.`, 'bueno'); }
      else { log('🔎 Tu detector solo encontró latas y chapitas.'); toast('Solo chapitas…'); }
    }, 1200, '🔎');
  },

  /* ---------- Panel de la colección ---------- */
  panel() {
    Panel.abrir('Tu colección', () => {
      const p = S.p, l = this.lista(), its = [];
      its.push({ info: 'Los artículos raros aparecen muy de vez en cuando: en bazares, en la playa, en herencias, en áticos… Su valor es un misterio hasta que los tasas, y algunos resultan ser falsos.' });
      if (p.edad >= 12) its.push({ ic: '🧺', t: 'Buscar en un mercado de pulgas', s: `${usosRestantes('bazar', 2)} visitas restantes este año`, fn: () => this.bazar() });
      if (p.objetos && p.objetos.detector) its.push({ ic: '🔎', t: 'Buscar tesoros con el detector', s: `${usosRestantes('detector', 2)} salidas restantes`, fn: () => this.detector() });
      if (!l.length) its.push({ info: 'Todavía no tienes artículos raros.' });
      else its.push({ sec: `Artículos (${l.length})` });
      for (const it of l) {
        const rz = RAREZAS[it.r];
        its.push({ ic: it.ic, t: it.n, s: `${rz.ic} ${rz.n}${it.dudoso ? ' · procedencia dudosa' : ''} · ${it.tasado ? (it.falso ? '❌ Falsificación' : 'Tasado') : 'Sin tasar'}`, der: it.tasado ? fmt$(it.valor) : '¿?', fn: () => this.gestionar(it), cls: it.r === 'legendario' && !(it.tasado && it.falso) ? 'destacado' : '' });
      }
      return its;
    });
  },
  quitar(it) { S.p.coleccion = this.lista().filter(x => x !== it); },
  gestionar(it) {
    const p = S.p, d = RAROS[it.id], costoTasa = Math.round(300 * Math.max(eco(), 0.5) * (it.r === 'legendario' ? 10 : it.r === 'epico' ? 3 : 1));
    const ops = [];
    if (!it.tasado) ops.push({ t: `🔍 Tasarlo con un experto (${fmt$(costoTasa)})`, dis: p.dinero < costoTasa && p.edad >= 18, fn: () => this.tasar(it, costoTasa) });
    if (p.edad >= 18) {
      if (!it.falso || !it.tasado) {
        ops.push({ t: '🔨 Llevarlo a una casa de subastas', dis: !it.tasado || it.dudoso || d.patrimonio, fn: () => this.subasta(it) });
        ops.push({ t: '🤝 Ofrecerlo a un coleccionista privado', dis: d.patrimonio, fn: () => this.coleccionista(it) });
      }
      ops.push({ t: '🏪 Casa de empeño (dinero rápido, poco)', dis: d.patrimonio, fn: () => { const m = Math.round((it.tasado ? it.valor : it.valor * R.float(0.3, 1)) * R.float(0.15, 0.3)); p.dinero += m; this.quitar(it); log(`🏪 Empeñaste tu ${it.n.toLowerCase()} por ${fmt$(m)}.`); } });
      ops.push({ t: '🕳️ Venderlo en el mercado negro', fn: () => MercadoNegro.vender(it) });
    }
    if (!it.falso || !it.tasado) ops.push({ t: '🏛️ Donarlo a un museo', fn: () => { const k = clamp(Math.round(Math.log10(it.valor + 10) * 2), 2, 18); mod({ karma: k, fama: it.valor > 1e6 ? 8 : 2, felicidad: 6 }); this.quitar(it); log(`🏛️ Donaste tu ${it.n.toLowerCase()} a un museo.`, 'bueno'); if (it.valor > 1e6 && !it.falso) Noticias.emitir(`${p.nombre} ${p.apellido} dona al museo nacional ${it.n.toLowerCase()} valorado en ${fmt$(it.valor)}.`); } });
    ops.push({ t: 'Cerrar' });
    const extra = d.patrimonio ? '<p class="nota">⚠️ Es patrimonio cultural: venderlo legalmente está prohibido. Puedes donarlo… o arriesgarte en el mercado negro.</p>' : it.dudoso ? '<p class="nota">⚠️ Procedencia dudosa: ninguna casa de subastas seria lo aceptará.</p>' : !it.tasado ? '<p class="nota">Las subastas solo aceptan piezas tasadas.</p>' : '';
    Modal.mostrar({ ic: it.ic, titulo: it.n, texto: `<p>Rareza: <b style="color:${RAREZAS[it.r].color}">${RAREZAS[it.r].ic} ${RAREZAS[it.r].n}</b></p><p>Valor: <b>${it.tasado ? (it.falso ? 'Falsificación sin valor' : fmt$(it.valor)) : 'Desconocido'}</b></p>${extra}`, opciones: ops });
  },
  tasar(it, costo) {
    const p = S.p;
    if (p.edad >= 18) p.dinero -= costo;
    Efectos.suspenso('🔍 El experto examina la pieza con lupa…', () => {
      it.tasado = true;
      if (it.falso) { mod({ felicidad: -8 }); log(`🔍 Malas noticias: tu ${it.n.toLowerCase()} es una falsificación.`, 'malo'); aviso('Es falso', `<p>El experto suspira: "Lo siento, es una imitación. Vale unos ${fmt$(it.valor)}".</p>`, '😩'); }
      else if (it.valor >= 1e6) { mod({ felicidad: 15 }); log(`🔍 ¡Tu ${it.n.toLowerCase()} es auténtico y vale ${fmt$(it.valor)}!`, 'raro'); Efectos.celebrar(it.ic, '¡Es auténtico!', `<p>El experto se queda sin palabras.</p><p>Valor estimado: <b>${fmt$(it.valor)}</b></p>`); if (it.r === 'legendario') { p.cont.tesoros = (p.cont.tesoros || 0) + 1; Estado.darLogro('tesoro'); } }
      else { mod({ felicidad: 4 }); log(`🔍 Tasaron tu ${it.n.toLowerCase()} en ${fmt$(it.valor)}.`, 'bueno'); aviso('Tasación', `<p>Es auténtico. Valor estimado: <b>${fmt$(it.valor)}</b>.</p>`, it.ic); }
    }, 1600, '🔍');
  },
  subasta(it) {
    const p = S.p;
    Efectos.suspenso('🔨 ¿Quién da más? A la una… a las dos…', () => {
      let mult = R.float(0.7, 1.25);
      if (R.chance(0.2)) mult = R.float(1.4, 2.6);   // guerra de pujas
      if (R.chance(0.08)) mult = 0;                    // nadie puja
      if (!mult) { log(`🔨 Nadie pujó por tu ${it.n.toLowerCase()}. Volvió contigo.`, 'malo'); return aviso('Sin pujas', '<p>La sala quedó en silencio. Quizá el próximo año.</p>', '🔇'); }
      const bruto = Math.round(it.valor * mult), neto = Math.round(bruto * 0.85);
      p.dinero += neto; this.quitar(it);
      log(`🔨 ¡Vendido! Tu ${it.n.toLowerCase()} se subastó por ${fmt$(bruto)} (recibes ${fmt$(neto)} tras la comisión).`, 'raro');
      if (bruto >= 1e6) { Estado.darLogro('subasta'); Noticias.emitir(`Récord en subasta: ${it.n.toLowerCase()} se vende por ${fmt$(bruto)}.`); }
      Efectos.celebrar('🔨', '¡Vendido!', `<p>${mult > 1.35 ? '¡Hubo una guerra de pujas! ' : ''}Precio final: <b>${fmt$(bruto)}</b></p><p>Recibes ${fmt$(neto)} (15% de comisión).</p>`);
    }, 2000, '🔨');
  },
  coleccionista(it) {
    const p = S.p;
    const oferta = Math.round(it.tasado ? it.valor * R.float(0.75, 1.05) : (it.falso ? R.int(50, 500) * eco() : it.valor * R.float(0.25, 0.8)));
    Modal.mostrar({ ic: '🤝', titulo: 'Un coleccionista privado', texto: `<p>Te ofrece <b>${fmt$(oferta)}</b> por tu ${it.n.toLowerCase()}.${it.tasado ? '' : ' (Sin tasación, ofrece a ciegas.)'}</p>`, opciones: [
      op('Aceptar', () => { p.dinero += oferta; this.quitar(it); log(`🤝 Vendiste tu ${it.n.toLowerCase()} a un coleccionista por ${fmt$(oferta)}.`, 'bueno'); }),
      op('Regatear', () => { if (R.chance(0.5)) { const m = Math.round(oferta * R.float(1.1, 1.3)); p.dinero += m; this.quitar(it); log(`🤝 Regateaste y lo vendiste por ${fmt$(m)}.`, 'bueno'); } else { log('El coleccionista se ofendió y se fue.', 'malo'); toast('Se fue sin comprar.'); } }),
      op('Rechazar', () => {}),
    ] });
  },
};

/* =========================================================
   TIENDA: objetos con efectos (no son inversiones)
   ========================================================= */
const OBJETOS = [
  { id: 'telefono', ic: '📱', n: 'Smartphone de última generación', c: 1200, d: '+felicidad, más alcance en redes', ef: { felicidad: 4 } },
  { id: 'laptop', ic: '💻', n: 'Laptop potente', c: 1500, d: 'Estudiar rinde más', ef: { inteligencia: 1 } },
  { id: 'consola', ic: '🎮', n: 'Consola de videojuegos', c: 500, d: '+felicidad cada año', ef: { felicidad: 5 } },
  { id: 'ropa', ic: '👔', n: 'Ropa de diseñador', c: 3000, d: '+apariencia', ef: { apariencia: 3 } },
  { id: 'bici', ic: '🚲', n: 'Bicicleta', c: 400, d: '+salud cada año', ef: { salud: 1 } },
  { id: 'gymCasa', ic: '🏋️', n: 'Gimnasio en casa', c: 5000, d: '+salud y apariencia cada año', ef: { salud: 2 } },
  { id: 'piano', ic: '🎹', n: 'Piano de cola', c: 8000, d: '+felicidad e inteligencia cada año', ef: { felicidad: 3 } },
  { id: 'anillo', ic: '💍', n: 'Anillo de compromiso', c: 3000, d: 'Más probabilidad de que acepten tu propuesta', ef: { felicidad: 1 } },
  { id: 'detector', ic: '🔎', n: 'Detector de metales', c: 300, d: 'Busca tesoros enterrados', ef: { felicidad: 2 } },
  { id: 'seguro', ic: '🛡️', n: 'Seguro de salud privado', c: 0, d: `Clínica privada casi gratis (cuota anual)`, ef: {} },
];
const Tienda = {
  panel() {
    Panel.abrir('Tienda', () => {
      const p = S.p, o = p.objetos || {};
      return [{ info: `Tienes ${fmt$(p.dinero)}. Algunos objetos tienen efectos cada año.` }, ...OBJETOS.map(x => {
        const c = Math.round(x.c * Math.max(eco(), 0.6));
        const tiene = o[x.id];
        return { ic: x.ic, t: x.n, s: x.id === 'seguro' ? `${x.d}: ${fmt$(1800 * eco())}/año${tiene ? ' · toca para cancelar' : ''}` : `${x.d}`, der: tiene && x.id !== 'seguro' ? '✅' : x.id === 'seguro' ? (tiene ? '✅' : '') : fmt$(c), dis: tiene && x.id !== 'seguro' ? 'Ya lo tienes.' : p.dinero < c ? 'No te alcanza.' : false, fn: () => {
          if (!p.objetos) p.objetos = {};
          if (x.id === 'seguro') { p.objetos.seguro = !p.objetos.seguro; log(p.objetos.seguro ? '🛡️ Contrataste un seguro de salud privado.' : 'Cancelaste tu seguro de salud.'); return; }
          p.dinero -= c; p.objetos[x.id] = true; mod(x.ef);
          log(`🛍️ Compraste: ${x.n.toLowerCase()}.`);
        } };
      })];
    });
  },
};
