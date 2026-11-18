'use strict';
/* =========================================================
   FINANZAS: impuestos, gastos de vida, deudas, inversiones,
   bienes raíces, vehículos, lujos y negocios
   ========================================================= */
const INVERSIONES = {
  indice:  { n: 'Fondo indexado', ic: '📊', m: 0.075, sd: 0.14, desc: 'Diversificado. La opción sensata a largo plazo.' },
  acciones:{ n: 'Acciones individuales', ic: '📈', m: 0.08, sd: 0.24, desc: 'Más volátil: puedes ganar o perder mucho.' },
  bonos:   { n: 'Bonos del gobierno', ic: '🏦', m: 0.035, sd: 0.03, desc: 'Seguro y aburrido.' },
  cripto:  { n: 'Criptomonedas', ic: '🪙', m: 0.18, sd: 0.85, desc: 'Montaña rusa. Puede multiplicarse… o desaparecer.' },
};
const MANTENIMIENTO = { casa: 0.01, auto: 0.04, lujo: 0.03, terreno: 0.002 };

const Finanzas = {
  impuesto(ingreso) {
    const e = eco(), max = pais().impMax;
    const tramos = [[10000 * e, 0], [40000 * e, 0.12], [100000 * e, 0.22], [250000 * e, (0.22 + max) / 2], [Infinity, max]];
    let rest = ingreso, prev = 0, imp = 0;
    for (const [tope, tasa] of tramos) { const t = Math.min(rest, tope - prev); if (t <= 0) break; imp += t * tasa; rest -= t; prev = tope; }
    return Math.round(imp);
  },
  agregarDeuda(tipo, nombre, monto, tasa, anios, bienId) {
    const p = S.p;
    const ex = tipo === 'estudiantil' && p.deudas.find(d => d.tipo === 'estudiantil');
    if (ex) { ex.saldo += monto; ex.anios = Math.max(ex.anios, anios); return; }
    p.deudas.push({ id: uid(), tipo, nombre, saldo: Math.round(monto), tasa, anios, bienId });
  },
  cuota(d) { return d.anios <= 1 ? d.saldo * (1 + d.tasa) : d.saldo * d.tasa / (1 - Math.pow(1 + d.tasa, -d.anios)); },
  gastosVida() {
    const p = S.p, e = eco();
    if (p.carcel || p.monasterio) return 0;
    if (p.edad < 18) return 0;
    let g;
    if (viveConPadres()) g = p.edad < 23 && !p.trabajo ? 0 : 1500 * e;
    else {
      g = 7000 * e;
      if (p.vivienda === 'alquiler') g += 9000 * e;
      if (p.vivienda === 'calle') g = 600 * e;
    }
    g *= { austero: 0.65, normal: 1, lujoso: 2.8 }[p.estilo];
    if (Habilidades.nivel('jardineria') >= 3) g *= 0.95;
    g += hijos().filter(h => h.edad < 18 && h.viveCon !== 'otro').length * 3500 * e;
    g += p.mascotas.filter(m => m.vivo).length * 500 * e;
    if (p.objetos && p.objetos.seguro) g += 1800 * e;
    return Math.round(g);
  },

  /* Cierre financiero del año */
  anual(ingresoBruto) {
    const p = S.p, e = eco();
    const neto = ingresoBruto - this.impuesto(ingresoBruto);
    if (ingresoBruto > 0) log(`💵 Ingresos: ${fmt$(ingresoBruto)} · impuestos ${fmt$(ingresoBruto - neto)}.`, 'gris');
    p.dinero += neto;
    // Gastos
    let g = this.gastosVida();
    // Sin ingresos y sin ahorros, se sobrevive con lo mínimo
    if (g && p.dinero < g && ingresoBruto <= 0) {
      g = Math.round(g * 0.4);
      if (p.estilo !== 'austero') { p.estilo = 'austero'; log('Sin ingresos, tuviste que recortar todos tus gastos al mínimo.', 'malo'); }
    }
    if (g) p.dinero -= g;
    if (p.edad >= 18 && !p.carcel) {
      if (p.estilo === 'lujoso') mod({ felicidad: 4 }); else if (p.estilo === 'austero') mod({ felicidad: -2 });
      if (p.vivienda === 'calle') mod({ salud: -8, felicidad: -10 });
      if (viveConPadres() && p.edad > 27) mod({ felicidad: -2 });
    }
    // Deudas
    for (const d of [...p.deudas]) {
      const c = Math.round(this.cuota(d));
      p.dinero -= c;
      d.saldo = Math.round(d.saldo * (1 + d.tasa) - c); d.anios--;
      if (d.saldo <= 50 || d.anios <= 0) { p.deudas = p.deudas.filter(x => x !== d); log(`✅ Terminaste de pagar: ${d.nombre}.`, 'bueno'); }
    }
    // Inversiones
    let cambioInv = 0;
    for (const [k, inv] of Object.entries(INVERSIONES)) {
      const monto = p.inv[k]; if (!monto) continue;
      let r = R.normal(inv.m, inv.sd);
      if (S.eco.estado === 'recesion') r -= { acciones: 0.25, indice: 0.18, bonos: -0.01, cripto: 0.35 }[k];
      if (S.eco.estado === 'auge') r += { acciones: 0.1, indice: 0.07, bonos: 0, cripto: 0.2 }[k];
      if (k === 'cripto' && R.chance(0.1)) r = -R.float(0.55, 0.85);
      r = Math.max(-0.92, r);
      const dlt = Math.round(monto * r); p.inv[k] += dlt; cambioInv += dlt;
    }
    if (cambioInv) log(`📈 Tus inversiones ${cambioInv >= 0 ? 'ganaron' : 'perdieron'} ${fmt$(Math.abs(cambioInv))}.`, cambioInv >= 0 ? 'bueno' : 'malo');
    // Bienes
    for (const b of p.bienes) {
      let r;
      if (b.tipo === 'casa') r = R.normal(0.035, 0.05) - (S.eco.estado === 'recesion' ? 0.09 : 0);
      else if (b.tipo === 'terreno') r = R.normal(0.05, 0.07) - (S.eco.estado === 'recesion' ? 0.06 : 0);
      else if (b.tipo === 'auto' && !b.aprecia) r = -R.float(0.1, 0.18);
      else r = b.aprecia ? R.normal(0.06, 0.15) : -0.07;
      b.valor = Math.max(100, Math.round(b.valor * (1 + r)));
      p.dinero -= Math.round(b.valor * (MANTENIMIENTO[b.tipo] || 0.02) * (b.tipo === 'auto' && Habilidades.nivel('mecanica') >= 3 ? 0.5 : 1) * (b.n === 'Yate' ? 3 : b.n === 'Jet privado' ? 2.5 : 1));
      if (b.alquilada) { const a = Math.round(b.valor * (b.renta || 0.045)); p.dinero += a; }
      if (b.robado && R.chance(0.1)) { p.bienes = p.bienes.filter(x => x !== b); log(`🚓 La policía identificó tu ${b.n} como robado y lo confiscó.`, 'malo'); if (R.chance(0.4)) Crimen.arrestar('receptación de bienes robados', [1, 3]); }
      if (b.n === 'Club de fútbol') { const t = R.pick(['campeón de liga', 'subcampeón', 'de mitad de tabla', 'casi descendido']); mod({ fama: t === 'campeón de liga' ? 6 : 1, felicidad: t === 'campeón de liga' ? 10 : t === 'casi descendido' ? -6 : 0 }); log(`⚽ Tu club terminó la temporada ${t}.`, t === 'campeón de liga' ? 'raro' : ''); if (t === 'campeón de liga') Noticias.emitir(`¡El club de ${p.nombre} ${p.apellido} es campeón de liga!`); }
    }
    // Saldo negativo
    if (p.dinero < 0 && p.edad >= 18) {
      const interes = Math.round(-p.dinero * 0.14);
      p.dinero -= interes; mod({ felicidad: -8, estres: 10 });
      log(`⚠️ Estás en números rojos. Pagaste ${fmt$(interes)} en intereses de tarjetas.`, 'malo');
      if (p.dinero < -60000 * e) this.embargo();
    }
  },
  embargo() {
    const p = S.p;
    const casa = p.bienes.filter(b => b.tipo !== 'casa').sort((a, b) => b.valor - a.valor)[0] || p.bienes.sort((a, b) => b.valor - a.valor)[0];
    if (casa && R.chance(0.6)) {
      this.venderBien(casa, 0.7, true);
      log(`🏦 El banco embargó tu ${casa.n} para cubrir tus deudas.`, 'malo');
    }
  },

  /* ---------- Panel Bienes ---------- */
  panel() {
    Panel.abrir('Bienes y finanzas', () => {
      const p = S.p, its = [];
      const totInv = Object.values(p.inv).reduce((s, v) => s + v, 0);
      const totDeu = p.deudas.reduce((s, d) => s + d.saldo, 0);
      its.push({ kv: [['💵 Efectivo', fmt$(p.dinero)], ['📊 Inversiones', fmt$(totInv)], ['🏠 Bienes', fmt$(p.bienes.reduce((s, b) => s + b.valor, 0))], ['🏢 Empresas', fmt$(p.negocios.reduce((s, n) => s + n.valor * n.participacion, 0))], ['💳 Deudas', fmt$(totDeu)], ['🧾 Patrimonio neto', `<b>${fmt$(patrimonio())}</b>`]] });
      if (p.esp.org && p.esp.org.dineroSucio > 0) its.push({ info: `🕶️ Dinero sin lavar: <b>${fmt$(p.esp.org.dineroSucio)}</b> (no cuenta en tu patrimonio).` });
      if (p.edad < 18) { its.push({ info: 'Eres menor de edad: tus padres administran el hogar. Puedes pedirles dinero desde Relaciones.' }); if (p.negocios.length) { its.push({ sec: 'Empresas familiares' }, { info: 'Un administrador gestiona tus empresas hasta que cumplas 18. Los dividendos llegan a tu cuenta.' }); for (const n of p.negocios) its.push({ ic: n.ic, t: n.nombre, s: `${n.sectorN} · valor ${fmt$(n.valor)}` }); } }
      if (p.carcel) { its.push({ info: 'Estás en prisión: no puedes hacer operaciones.' }); return its; }
      if (Apocalipsis.activo()) { its.push({ info: '🧟 Los bancos cerraron y el dinero no vale nada. Lo que importa ahora está en la pestaña de supervivencia.' }); return its; }
      if (p.edad >= 18) {
        its.push({ sec: 'Vida diaria' });
        its.push({ ic: '🏡', t: 'Vivienda', s: { padres: 'Con tus padres', alquiler: 'Alquilas un departamento', propia: 'En tu propia casa', calle: 'Sin hogar' }[p.vivienda], fn: () => this.mudarse() });
        its.push({ ic: '🛍️', t: 'Estilo de vida', s: `${cap(p.estilo)} · gastos ~${fmt$(this.gastosVida())}/año`, fn: () => this.estiloVida() });
        its.push({ sec: 'Comprar' });
        its.push({ ic: '🏠', t: 'Bienes raíces', s: 'Casas, departamentos, mansiones', fn: () => this.mercado('casa') });
        its.push({ ic: '🚗', t: 'Vehículos', fn: () => this.mercado('auto') });
        its.push({ ic: '🌱', t: 'Terrenos', s: 'Se revalorizan y casi no cuestan mantener', fn: () => this.mercado('terreno') });
        its.push({ ic: '💎', t: 'Lujos', s: 'Arte, joyas, caballos, yates, jets, clubes', fn: () => this.mercado('lujo') });
        its.push({ ic: '🛍️', t: 'Tienda', s: 'Tecnología, ropa, seguro médico, detector de metales…', fn: () => Tienda.panel() });
        its.push({ ic: '🕳️', t: 'Mercado negro', s: 'Barato, ilegal y arriesgado', cls: 'peligro', fn: () => MercadoNegro.panel() });
      }
      if (p.bienes.length) {
        its.push({ sec: 'Mis bienes' });
        for (const b of p.bienes) its.push({ ic: b.ic, t: b.n, s: `Valor ${fmt$(b.valor)}${b.alquilada ? ' · alquilada' : ''}${p.casaId === b.id ? ' · vives aquí' : ''}`, fn: () => this.gestionarBien(b) });
      }
      if (p.edad >= 18) {
        its.push({ sec: 'Inversiones' });
        for (const [k, inv] of Object.entries(INVERSIONES)) its.push({ ic: inv.ic, t: inv.n, s: inv.desc, der: fmt$(p.inv[k]), fn: () => this.invertir(k) });
        its.push({ sec: 'Empresas' });
        for (const n of p.negocios) its.push({ ic: n.ic, t: n.nombre, s: `${n.sectorN} · valor ${fmt$(n.valor)} · ${n.ultimaGanancia >= 0 ? 'ganó' : 'perdió'} ${fmt$(Math.abs(n.ultimaGanancia || 0))}${n.publico ? ' · 🔔 en bolsa' : ''}`, fn: () => Negocios.panel(n), cls: 'destacado' });
        its.push({ ic: '➕', t: 'Emprender un negocio', fn: () => Negocios.crear() });
        its.push({ sec: 'Crédito' });
        for (const d of p.deudas) its.push({ ic: '💳', t: d.nombre, s: `Saldo ${fmt$(d.saldo)} · ${Math.round(d.tasa * 100)}% · ${d.anios} años · cuota ~${fmt$(this.cuota(d))}/año`, fn: () => this.pagarDeuda(d) });
        its.push({ ic: '🏦', t: 'Pedir un préstamo personal', s: '15% anual a 5 años', dis: p.quiebra > S.anio ? 'Tu historial de quiebra te impide pedir crédito.' : false, fn: () => this.prestamo() });
        if (patrimonio() < 0) its.push({ ic: '⚖️', t: 'Declararse en quiebra', cls: 'peligro', s: 'Borra deudas, pierdes casi todo', fn: () => this.quiebra() });
        its.push({ sec: 'Otros' });
        its.push({ ic: '🏺', t: 'Tu colección', s: (p.coleccion || []).length ? `${p.coleccion.length} artículos raros` : 'Busca tesoros en bazares y playas', fn: () => Coleccion.panel(), cls: (p.coleccion || []).length ? 'destacado' : '' });
        its.push({ ic: '🎁', t: 'Donar a una causa', s: `Donado en tu vida: ${fmt$(p.cont.donado)}`, fn: () => this.donar() });
      }
      return its;
    });
  },
  mudarse() {
    const p = S.p, ops = [];
    if (personas('padre', 'madre').length) ops.push({ t: '👪 Vivir con mis padres (barato)', fn: () => { p.vivienda = 'padres'; p.casaId = null; log('Te mudaste con tus padres.'); } });
    ops.push({ t: `🏢 Alquilar un departamento (~${fmt$(9000 * eco())}/año)`, fn: () => { p.vivienda = 'alquiler'; p.casaId = null; p.monasterio = false; log('Te mudaste a un departamento alquilado.'); Barrio.mudanza(); mod({ felicidad: 3 }); } });
    for (const b of p.bienes.filter(b => b.tipo === 'casa')) ops.push({ t: `🏠 Vivir en mi ${b.n}`, fn: () => { p.vivienda = 'propia'; p.casaId = b.id; b.alquilada = false; log(`Te mudaste a tu ${b.n}.`); Barrio.mudanza(); mod({ felicidad: 5 }); } });
    ops.push({ t: 'Cancelar' });
    Modal.mostrar({ ic: '🏡', titulo: 'Mudarse', texto: '<p>¿Dónde quieres vivir?</p>', opciones: ops });
  },
  estiloVida() {
    const p = S.p;
    Modal.mostrar({ ic: '🛍️', titulo: 'Estilo de vida', texto: '<p>Define cuánto gastas en el día a día. Gastar más te hace más feliz, pero cuidado con el saldo.</p>', opciones: [
      { t: '🥖 Austero (−35% gastos, −felicidad)', fn: () => { p.estilo = 'austero'; } },
      { t: '🙂 Normal', fn: () => { p.estilo = 'normal'; } },
      { t: '🥂 Lujoso (×2,8 gastos, +felicidad)', fn: () => { p.estilo = 'lujoso'; } },
    ] });
  },
  mercado(tipo) {
    const p = S.p;
    if (!p.mercado || p.mercado.anio !== S.anio) p.mercado = { anio: S.anio };
    if (!p.mercado[tipo]) {
      const base = { casa: TIPOS_CASA, auto: TIPOS_AUTO, lujo: TIPOS_LUJO, terreno: TIPOS_TERRENO }[tipo];
      p.mercado[tipo] = base.flatMap(t => [0, 1].slice(0, tipo === 'casa' ? 2 : 1).map(() => {
        const factor = t.base >= 1e6 ? Math.max(0.6, eco()) : tipo === 'auto' ? Math.max(0.7, eco()) : eco();
        const estado = tipo === 'casa' ? R.pick(['Excelente estado', 'Buen estado', 'Para remodelar']) : '';
        const m = estado === 'Para remodelar' ? 0.75 : estado === 'Excelente estado' ? 1.12 : 1;
        return { id: uid(), tipo, n: t.n, ic: t.ic, aprecia: t.aprecia, renta: t.renta, estado, valor: Math.round(t.base * factor * R.float(0.82, 1.22) * m) };
      }));
    }
    Panel.abrir({ casa: 'Bienes raíces', auto: 'Concesionario', lujo: 'Artículos de lujo', terreno: 'Terrenos' }[tipo], () => [
      { info: tipo === 'casa' ? 'Puedes pagar al contado o con hipoteca (20% de inicial, 25 años al 7%). Las casas suelen revalorizarse; los autos pierden valor cada año.' : `Tienes ${fmt$(p.dinero)}.` },
      ...p.mercado[tipo].map(o => ({ ic: o.ic, t: o.n, s: `${fmt$(o.valor)}${o.estado ? ' · ' + o.estado : ''}`, fn: () => this.comprar(o) })),
    ]);
  },
  comprar(o) {
    const p = S.p;
    const ops = [{ t: `💵 Pagar al contado (${fmt$(o.valor)})`, dis: p.dinero < o.valor, fn: () => this.cerrarCompra(o, false) }];
    if (o.tipo === 'casa') {
      const ingreso = (p.trabajo ? Trabajo.salario() : 0) + p.pension + p.negocios.reduce((s, n) => s + Math.max(0, n.ultimaGanancia || 0), 0);
      const cuota = (o.valor * 0.8) * 0.07 / (1 - Math.pow(1.07, -25));
      const ok = p.dinero >= o.valor * 0.2 && ingreso >= cuota * 2.5 && !(p.quiebra > S.anio);
      ops.push({ t: `🏦 Hipoteca: inicial ${fmt$(o.valor * 0.2)} · cuota ~${fmt$(cuota)}/año`, dis: !ok, fn: () => this.cerrarCompra(o, true) });
      if (!ok) ops.push({ t: 'ℹ️ Para la hipoteca necesitas la inicial y un ingreso anual de al menos 2,5 veces la cuota.', dis: true });
    }
    ops.push({ t: 'Cancelar' });
    Modal.mostrar({ ic: o.ic, titulo: o.n, texto: `<p>Precio: <b>${fmt$(o.valor)}</b>${o.estado ? ` · ${o.estado}` : ''}</p>`, opciones: ops });
  },
  cerrarCompra(o, hipoteca) {
    const p = S.p;
    const b = { ...o, id: uid(), compra: o.valor, anio: S.anio };
    if (hipoteca) { p.dinero -= Math.round(o.valor * 0.2); this.agregarDeuda('hipoteca', `Hipoteca: ${o.n}`, o.valor * 0.8, 0.07, 25, b.id); }
    else p.dinero -= o.valor;
    p.bienes.push(b);
    p.mercado[o.tipo] = p.mercado[o.tipo].filter(x => x.id !== o.id);
    mod({ felicidad: o.valor > 1e6 ? 10 : 5 });
    log(`🔑 Compraste: <b>${o.n}</b> por ${fmt$(o.valor)}${hipoteca ? ' (con hipoteca)' : ''}.`, 'bueno');
    if (o.n === 'Club de fútbol') { mod({ fama: 15 }); Noticias.emitir(`${p.nombre} ${p.apellido} compra un club de fútbol por ${fmt$(o.valor)}.`); }
    if (o.valor >= 1e6) Efectos.celebrar(o.ic, '¡Es tuyo!', `<p>Compraste <b>${o.n}</b> por ${fmt$(o.valor)}.</p>`);
    if (o.tipo === 'casa' && p.vivienda !== 'propia') Modal.mostrar({ ic: '🏠', titulo: '¿Te mudas?', texto: '<p>¿Quieres vivir en tu nueva propiedad?</p>', opciones: [{ t: 'Sí, me mudo', cls: 'ok', fn: () => { p.vivienda = 'propia'; p.casaId = b.id; } }, { t: 'No por ahora' }] });
    Panel.atras();
  },
  gestionarBien(b) {
    const p = S.p, ops = [];
    const deuda = p.deudas.find(d => d.bienId === b.id);
    ops.push({ t: `💰 Vender (~${fmt$(b.valor)}${deuda ? `, se cancela la hipoteca de ${fmt$(deuda.saldo)}` : ''})`, fn: () => this.venderBien(b, R.float(0.92, 1.05)) });
    if (b.tipo === 'casa' && p.casaId !== b.id) ops.push({ t: b.alquilada ? '🔑 Dejar de alquilarla' : `🏘️ Ponerla en alquiler (~${fmt$(b.valor * (b.renta || 0.045))}/año)`, fn: () => { b.alquilada = !b.alquilada; log(b.alquilada ? `Pusiste en alquiler tu ${b.n}.` : `Dejaste de alquilar tu ${b.n}.`); } });
    if (b.tipo === 'casa') ops.push({ t: `🔨 Remodelar (${fmt$(b.valor * 0.1)}, sube su valor)`, dis: p.dinero < b.valor * 0.1, fn: () => { if (!usar('remodelar_' + b.id, 1)) return; p.dinero -= Math.round(b.valor * 0.1); b.valor = Math.round(b.valor * R.float(1.08, 1.2)); log(`Remodelaste tu ${b.n}.`); } });
    if (b.n === 'Caballo de carreras') ops.push({ t: '🏇 Inscribirlo en una carrera', fn: () => { if (!usar('carrera' + b.id, 1)) return; Efectos.suspenso('🏇 ¡Arrancan!', () => { const x = Math.random(); if (x < 0.25) { const g = Math.round(R.int(50000, 2000000) * Math.max(eco(), 0.5)); p.dinero += g; b.valor = Math.round(b.valor * 1.3); mod({ felicidad: 10, fama: 2 }); log(`🏆 ¡Tu caballo ganó la carrera! Premio: ${fmt$(g)}.`, 'raro'); Efectos.celebrar('🏇', '¡Ganó tu caballo!', `<p>Premio: <b>${fmt$(g)}</b>. Su valor subió.</p>`); } else if (x < 0.04 + 0.25) { b.valor = Math.round(b.valor * 0.4); log('Tu caballo se lesionó en la carrera. Perdió mucho valor.', 'malo'); } else log('Tu caballo no ganó esta vez.'); }); } });
    if (b.tipo === 'terreno') ops.push({ t: '⛏️ Excavar para construir', fn: () => { if (!usar('excavar' + b.id, 1)) return; p.dinero -= Math.round(2000 * eco()); if (R.chance(0.04)) Coleccion.encontrar(R.pick(['fosil', 'huaco', 'moneda']), 'excavando tu terreno'); else { b.valor = Math.round(b.valor * 1.05); log(`Preparaste tu ${b.n.toLowerCase()} para construir.`); } } });
    if (b.tipo === 'auto') ops.push({ t: '🛣️ Dar un paseo', fn: () => { if (!usar('paseo', 1)) return; mod({ felicidad: 4 }); if (!p.licencia && R.chance(0.3)) { log('La policía te detuvo por manejar sin licencia. Multa.', 'malo'); p.dinero -= Math.round(500 * eco()); } else if (R.chance(0.04)) { Salud.accidente(); } else log(`Saliste a pasear en tu ${b.n}.`); } });
    ops.push({ t: 'Cancelar' });
    Modal.mostrar({ ic: b.ic, titulo: b.n, texto: `<p>Valor actual: <b>${fmt$(b.valor)}</b> (compra: ${fmt$(b.compra)})</p>`, opciones: ops });
  },
  venderBien(b, factor = 1, silencioso = false) {
    const p = S.p;
    const monto = Math.round(b.valor * factor);
    const deuda = p.deudas.find(d => d.bienId === b.id);
    p.dinero += monto - (deuda ? deuda.saldo : 0);
    if (deuda) p.deudas = p.deudas.filter(d => d !== deuda);
    p.bienes = p.bienes.filter(x => x !== b);
    if (p.casaId === b.id) { p.casaId = null; p.vivienda = personas('padre', 'madre').length ? 'padres' : 'alquiler'; }
    if (!silencioso) log(`Vendiste tu ${b.n} por ${fmt$(monto)}.`);
  },
  invertir(k) {
    const p = S.p, inv = INVERSIONES[k];
    Modal.mostrar({ ic: inv.ic, titulo: inv.n, texto: `<p>${inv.desc}</p><p>Invertido: <b>${fmt$(p.inv[k])}</b> · Efectivo: ${fmt$(p.dinero)}</p>`, opciones: [
      { t: '➕ Invertir', dis: p.dinero <= 0, fn: () => Modal.numero({ ic: inv.ic, titulo: `Invertir en ${inv.n}`, max: p.dinero, valor: p.dinero * 0.25, fn: v => { if (!v) return; p.dinero -= v; p.inv[k] += v; log(`Invertiste ${fmt$(v)} en ${inv.n}.`); } }) },
      { t: '➖ Retirar', dis: p.inv[k] <= 0, fn: () => Modal.numero({ ic: inv.ic, titulo: `Retirar de ${inv.n}`, max: p.inv[k], valor: p.inv[k], fn: v => { if (!v) return; p.inv[k] -= v; const imp = Math.round(v * 0.05); p.dinero += v - imp; log(`Retiraste ${fmt$(v)} de ${inv.n} (comisiones e impuestos: ${fmt$(imp)}).`); } }) },
      { t: 'Cerrar' },
    ] });
  },
  pagarDeuda(d) {
    const p = S.p;
    Modal.numero({ ic: '💳', titulo: `Abonar a ${d.nombre}`, texto: `<p>Saldo: ${fmt$(d.saldo)}</p>`, max: Math.min(p.dinero, d.saldo), valor: Math.min(p.dinero, d.saldo), etiqueta: 'Pagar', fn: v => {
      if (!v) return; p.dinero -= v; d.saldo -= v;
      if (d.saldo <= 0) { p.deudas = p.deudas.filter(x => x !== d); log(`✅ Pagaste por completo: ${d.nombre}.`, 'bueno'); } else log(`Abonaste ${fmt$(v)} a ${d.nombre}.`);
    } });
  },
  prestamo() {
    const p = S.p;
    const ingreso = (p.trabajo ? Trabajo.salario() : 0) + p.pension;
    const max = Math.round(Math.max(2000 * eco(), ingreso * 1.2) - p.deudas.filter(d => d.tipo === 'personal').reduce((s, d) => s + d.saldo, 0));
    if (max <= 0) return aviso('Crédito denegado', '<p>El banco considera que ya debes demasiado.</p>', '🏦');
    Modal.numero({ ic: '🏦', titulo: 'Préstamo personal', texto: '<p>El banco te ofrece hasta:</p>', max, valor: max / 2, etiqueta: 'Pedir', fn: v => { if (!v) return; p.dinero += v; this.agregarDeuda('personal', 'Préstamo personal', v, 0.15, 5); log(`Pediste un préstamo de ${fmt$(v)}.`); } });
  },
  quiebra() {
    const p = S.p;
    Modal.mostrar({ ic: '⚖️', titulo: 'Declararse en quiebra', texto: '<p>Perderás tus bienes e inversiones, tus deudas se cancelarán y no tendrás crédito durante 7 años.</p>', opciones: [{ t: 'Declarar quiebra', cls: 'peligro', fn: () => {
      p.bienes = []; p.inv = { acciones: 0, indice: 0, bonos: 0, cripto: 0 }; p.deudas = []; p.dinero = 0; p.negocios = []; p.quiebra = S.anio + 7;
      if (p.vivienda === 'propia') p.vivienda = personas('padre', 'madre').length ? 'padres' : 'alquiler';
      mod({ felicidad: -20, estres: -10 }); log('⚖️ Te declaraste en quiebra.', 'malo');
    } }, { t: 'Cancelar' }] });
  },
  donar() {
    const p = S.p;
    if (p.dinero <= 0) return toast('No tienes dinero para donar.');
    Modal.mostrar({ ic: '🎁', titulo: 'Donar', texto: '<p>¿A qué causa?</p>', opciones: ['🏥 Hospital infantil', '🐾 Refugio de animales', '📚 Becas para estudiantes', '🌳 Reforestación', '🍲 Comedor popular'].map(c => ({ t: c, fn: () => Modal.numero({ titulo: `Donar a ${c}`, max: p.dinero, valor: p.dinero * 0.1, etiqueta: 'Donar', fn: v => {
      if (!v) return; p.dinero -= v; p.cont.donado += v;
      const k = clamp(Math.round(Math.log10(v + 1) * 2.5), 1, 15);
      mod({ karma: k, felicidad: Math.min(8, k) }); if (v > 1e6) mod({ fama: 4 });
      log(`🎁 Donaste ${fmt$(v)} a ${c.replace(/^\S+\s/, '')}.`, 'bueno');
    } }) })).concat([{ t: 'Cancelar' }]) });
  },
};

/* =========================================================
   NEGOCIOS
   ========================================================= */
const Negocios = {
  crear() {
    const p = S.p;
    if (p.edad < 18) return toast('Debes ser mayor de edad.');
    Panel.abrir('Emprender', () => [
      { info: 'Muchos negocios fracasan en los primeros años. Invierte en <b>calidad</b>, <b>marketing</b> y el <b>personal</b> adecuado. Las startups son una lotería con premio gordo.' },
      ...SECTORES.map(s => { const inv = Math.round(s.inv * Math.max(0.5, eco())); return { ic: s.ic, t: s.n, s: `Inversión mínima ${fmt$(inv)} · margen ${Math.round(s.margen * 100)}% · riesgo ${s.riesgo >= 0.4 ? 'alto' : s.riesgo >= 0.25 ? 'medio' : 'bajo'}`, dis: p.dinero < inv ? `Necesitas ${fmt$(inv)}.` : false, fn: () => this.fundar(s, inv) }; }),
    ]);
  },
  fundar(s, inv) {
    const p = S.p;
    Modal.mostrar({
      ic: s.ic, titulo: `Nuevo: ${s.n}`, texto: '<p>Nombre de tu empresa:</p>',
      html: `<input type="text" id="m-txt" maxlength="30" value="${esc(R.pick([p.apellido + ' & Asociados', s.n.split(' ')[0] + ' ' + p.nombre, 'Grupo ' + p.apellido, R.pick(MARCAS) + ' ' + s.n.split(' ')[0]]))}">`,
      opciones: [{ t: 'Siguiente', cls: 'ok', fn: () => {
        const nombre = ($('#m-txt').value || '').trim() || 'Mi empresa';
        Modal.numero({ ic: '💵', titulo: 'Capital inicial', texto: `<p>Mínimo ${fmt$(inv)}. Más capital = negocio más grande.</p>`, min: inv, max: p.dinero, valor: inv, etiqueta: 'Fundar', fn: v => {
          p.dinero -= v;
          p.negocios.push({ id: uid(), nombre, sector: s.id, sectorN: s.n, ic: s.ic, capital: v, valor: v, empleados: Math.max(1, Math.round(v / 150000)), calidad: R.int(35, 60), marketing: 20, anios: 0, ultimaGanancia: 0, publico: false, participacion: 1, reinversion: 0.5 });
          log(`🏪 Fundaste <b>${esc(nombre)}</b> (${s.n}) con ${fmt$(v)}.`, 'bueno');
          Estado.darLogro('empresario'); mod({ felicidad: 6, estres: 6 }); Rasgos.pista('emprendedor');
          Panel.cerrar();
        } });
      } }, { t: 'Cancelar' }],
    });
  },
  necesarios(n) { return Math.max(1, Math.round(n.capital / 150000)); },
  panel(n) {
    Panel.abrir(n.nombre, () => {
      const p = S.p;
      if (!p.negocios.includes(n)) return [{ info: 'Esta empresa ya no es tuya.' }];
      const nec = this.necesarios(n);
      return [
        { kv: [['Sector', n.sectorN], ['Años', n.anios], ['Capital operativo', fmt$(n.capital)], ['Valor de la empresa', fmt$(n.valor)], ['Tu participación', Math.round(n.participacion * 100) + '%'], ['Último resultado', fmt$(n.ultimaGanancia || 0)], ['Empleados', `${n.empleados} (recomendado: ${nec})`], ['Reinversión de ganancias', Math.round(n.reinversion * 100) + '%']] },
        { barra: ['Calidad', n.calidad] }, { barra: ['Marketing', n.marketing] },
        { ic: '💵', t: 'Inyectar capital', dis: p.dinero <= 0, fn: () => Modal.numero({ titulo: 'Inyectar capital', max: p.dinero, valor: p.dinero * 0.25, fn: v => { p.dinero -= v; n.capital += v; n.valor += v; log(`Invertiste ${fmt$(v)} en ${esc(n.nombre)}.`); } }) },
        { ic: '👥', t: 'Contratar empleados', s: `Costo ~${fmt$(28000 * eco())}/año cada uno`, fn: () => { n.empleados += Math.max(1, Math.round(nec * 0.25)); log(`Contrataste personal en ${esc(n.nombre)}.`); } },
        { ic: '✂️', t: 'Despedir empleados', dis: n.empleados <= 1, fn: () => { n.empleados = Math.max(1, n.empleados - Math.max(1, Math.round(nec * 0.25))); mod({ karma: -1 }); log(`Recortaste personal en ${esc(n.nombre)}.`); } },
        { ic: '📣', t: 'Campaña de marketing', s: `Costo ${fmt$(n.capital * 0.05)}`, dis: p.dinero < n.capital * 0.05, fn: () => { if (!usar('mkt_' + n.id, 2)) return; p.dinero -= Math.round(n.capital * 0.05); n.marketing = clamp(n.marketing + R.int(12, 22)); log(`Lanzaste una campaña de marketing para ${esc(n.nombre)}.`); } },
        { ic: '⭐', t: 'Mejorar calidad / producto', s: `Costo ${fmt$(n.capital * 0.08)}`, dis: p.dinero < n.capital * 0.08, fn: () => { if (!usar('cal_' + n.id, 2)) return; p.dinero -= Math.round(n.capital * 0.08); n.calidad = clamp(n.calidad + R.int(6, 14)); log(`Mejoraste la calidad de ${esc(n.nombre)}.`); } },
        { ic: '🔁', t: 'Política de reinversión', fn: () => Modal.mostrar({ titulo: 'Reinversión', texto: '<p>¿Qué parte de las ganancias se reinvierte en la empresa? El resto te lo llevas como dividendos.</p>', opciones: [0, 0.25, 0.5, 0.75, 1].map(f => ({ t: `${f * 100}%`, fn: () => { n.reinversion = f; } })) }) },
        { ic: '🔔', t: 'Salir a bolsa (IPO)', s: 'Vende 30% de acciones, sube la valoración', dis: n.publico ? 'Ya cotiza en bolsa.' : n.valor < 50e6 ? 'La empresa debe valer al menos $50 M.' : false, fn: () => {
          const caja = Math.round(n.valor * 0.3 * R.float(1.1, 1.5));
          n.publico = true; n.participacion = 0.7; n.valor = Math.round(n.valor * 1.5); p.dinero += caja;
          mod({ fama: 10, felicidad: 15 }); log(`🔔 ¡${esc(n.nombre)} salió a bolsa! Recibiste ${fmt$(caja)} por la venta de acciones.`, 'raro'); Estado.darLogro('bolsa');
        } },
        { ic: '🤝', t: 'Vender la empresa', s: `Oferta estimada ${fmt$(n.valor * n.participacion)}`, fn: () => Modal.mostrar({ titulo: 'Vender empresa', texto: `<p>Un comprador ofrece <b>${fmt$(n.valor * n.participacion * 0.95)}</b>.</p>`, opciones: [{ t: 'Aceptar', cls: 'ok', fn: () => { const m = Math.round(n.valor * n.participacion * R.float(0.88, 1.05)); p.dinero += m; p.negocios = p.negocios.filter(x => x !== n); log(`🤝 Vendiste ${esc(n.nombre)} por ${fmt$(m)}.`, 'bueno'); Panel.atras(); } }, { t: 'Rechazar' }] }) },
        { ic: '🔒', t: 'Cerrar la empresa', cls: 'peligro', fn: () => { const m = Math.round(n.capital * 0.2 * n.participacion); p.dinero += m; p.negocios = p.negocios.filter(x => x !== n); log(`Cerraste ${esc(n.nombre)} y recuperaste ${fmt$(m)}.`, 'malo'); Panel.atras(); } },
      ];
    });
  },
  anual() {
    const p = S.p;
    let dividendos = 0;
    for (const n of [...p.negocios]) {
      const s = SECTORES.find(x => x.id === n.sector);
      n.anios++;
      const nec = this.necesarios(n);
      const falta = Math.max(0, nec - n.empleados) / nec, sobra = Math.max(0, n.empleados - nec * 1.3);
      let r = s.margen + (n.calidad - 50) / 260 + (n.marketing - 30) / 450 - falta * 0.15 + (S.eco.estado === 'recesion' ? -0.09 : S.eco.estado === 'auge' ? 0.05 : 0) + R.normal(0, s.riesgo * 0.3);
      r += Math.min(0.06, (p.st.inteligencia - 50) / 800) + (Rasgos.tiene('emprendedor') ? 0.04 : 0) + (['rest', 'cafe'].includes(n.sector) ? Habilidades.nivel('cocina') * 0.006 : 0) + (n.sector === 'startup' ? Habilidades.nivel('programacion') * 0.006 : 0);
      let g = Math.round(n.capital * r * s.escala * 0.8 - sobra * 28000 * eco());
      if (n.sector === 'startup' && n.calidad >= 55 && R.chance(0.08)) {
        const x = R.float(3, 12); n.valor = Math.round(n.valor * x);
        log(`🚀 ¡${esc(n.nombre)} cerró una ronda de inversión que multiplica su valor por ${x.toFixed(1)}!`, 'raro');
      }
      n.ultimaGanancia = g;
      if (g > 0) {
        const re = Math.round(g * n.reinversion); n.capital += re;
        const div = Math.round((g - re) * n.participacion); dividendos += div;
      } else n.capital = Math.max(0, n.capital + g);
      n.valor = Math.max(n.capital, Math.round(n.capital * 0.8 + Math.max(0, g) * (n.publico ? 14 : 8) + (n.valor - n.capital) * 0.6));
      if (n.publico) n.valor = Math.round(n.valor * (1 + R.normal(0.06, 0.2)));
      n.marketing = clamp(n.marketing - 8); n.calidad = clamp(n.calidad - 2);
      log(`${n.ic} ${esc(n.nombre)} ${g >= 0 ? 'ganó' : 'perdió'} ${fmt$(Math.abs(g))} este año.`, g >= 0 ? 'bueno' : 'malo');
      if (n.capital <= 0 || (n.anios <= 3 && r < -0.15 && R.chance(0.35))) {
        log(`💥 ${esc(n.nombre)} quebró y tuvo que cerrar.`, 'malo');
        p.negocios = p.negocios.filter(x => x !== n); mod({ felicidad: -15, estres: 10 });
      }
      mod({ estres: 2 });
    }
    return dividendos;
  },
};
