'use strict';
/* =========================================================
   FIN DEL MUNDO: un brote que empieza como rumor en el
   noticiero, te deja prepararte y luego cambia las reglas:
   el tiempo avanza por MESES y sobrevives con comida, agua,
   medicinas, materiales, munición, tu refugio y tu grupo.
   (Ficción sin detalles gráficos.)
   ========================================================= */
const LUGARES_APOC = {
  super:     { n: '🛒 Supermercado saqueado', riesgo: 0.18, botin: { comida: [2, 8], agua: [1, 5] } },
  farmacia:  { n: '💊 Farmacia', riesgo: 0.22, botin: { medicinas: [1, 4] }, antidoto: 0.1 },
  ferreteria:{ n: '🔨 Ferretería', riesgo: 0.2, botin: { materiales: [2, 6] } },
  comisaria: { n: '🚓 Comisaría abandonada', riesgo: 0.3, botin: { municion: [2, 7] } },
  hospital:  { n: '🏥 Hospital', riesgo: 0.4, botin: { medicinas: [2, 6] }, antidoto: 0.22 },
  casas:     { n: '🏚️ Casas abandonadas', riesgo: 0.12, botin: { comida: [0, 3], agua: [0, 2], materiales: [0, 2] }, semillas: 0.3 },
};
const SUPERVIVIENTES = [
  { rol: 'médica', ic: '🩺', ef: 'medico' }, { rol: 'exsoldado', ic: '🎖️', ef: 'soldado' }, { rol: 'mecánico', ic: '🔧', ef: 'mecanico' },
  { rol: 'agricultora', ic: '🌾', ef: 'agricultor' }, { rol: 'cocinero', ic: '🍳', ef: 'cocinero' }, { rol: 'adolescente asustado', ic: '🧒', ef: null },
];

const Apocalipsis = {
  activo() { return !!(S && S.apoc && S.apoc.fase === 'colapso'); },
  a() { return S.apoc; },

  /* ---------- Antes del colapso: rumores y preparación ---------- */
  anual() {
    const p = S.p;
    if (S.apoc) return;
    if (p.objetivo === 'superviviente' && !S.apocProgramado) S.apocProgramado = S.anio + (p.edad >= 18 ? R.int(3, 8) : 18 - p.edad + R.int(2, 10));
    if (!S.apocProgramado && Absurdo.activo() && p.edad >= 14 && p.edad <= 70 && R.chance(0.0015)) S.apocProgramado = S.anio + 2;
    if (!S.apocProgramado) return;
    const d = S.apocProgramado - S.anio;
    if (d === 2) Noticias.emitir('Brote de una "gripe agresiva" en una ciudad portuaria de Asia. La OMS pide calma.');
    else if (d === 1) {
      Noticias.emitir(`Primeros casos en ${ciudad()}: pacientes violentos y desorientados en los hospitales. El gobierno descarta una emergencia.`, { modal: true, ic: '🦠', cuerpo: '<p>En redes circulan videos muy raros. Mucha gente se ríe. Algunos empiezan a llenar sus despensas.</p>' });
      if (p.edad >= 14) this.preparar();
    } else if (d <= 0) this.colapso();
  },
  preparar() {
    const p = S.p, e = Math.max(eco(), 0.4);
    S.apocPrep = S.apocPrep || { comida: 0, agua: 0, medicinas: 0, defensa: 0 };
    const prep = S.apocPrep;
    Modal.mostrar({ ic: '🎒', titulo: '¿Te preparas?', texto: `<p>Algo no anda bien. ¿Haces algo al respecto?</p><p class="nota">Provisiones guardadas: 🥫${prep.comida} 💧${prep.agua} 💊${prep.medicinas} · refuerzos +${prep.defensa}</p>`, opciones: [
      { t: `🥫 Comprar comida y agua (${fmt$(100 * e)} por ración)`, dis: p.dinero < 100 * e, fn: () => Modal.numero({ ic: '🥫', titulo: '¿Cuántas raciones?', min: 1, max: Math.max(1, Math.floor(p.dinero / (100 * e))), valor: 12, paso: 1, etiqueta: 'Comprar', fn: n => { p.dinero -= Math.round(n * 100 * e); prep.comida += n; prep.agua += n; log(`🎒 Llenaste tu despensa con ${n} raciones de comida y agua. Tus vecinos se burlan.`); this.preparar(); } }) },
      { t: `💊 Botiquín de medicinas (${fmt$(300 * e)} c/u)`, dis: p.dinero < 300 * e, fn: () => { const n = Math.min(5, Math.floor(p.dinero / (300 * e))); p.dinero -= Math.round(n * 300 * e); prep.medicinas += n; log(`🎒 Compraste ${n} kits de medicinas.`); this.preparar(); } },
      { t: `🔨 Reforzar puertas y ventanas (${fmt$(5000 * e)})`, dis: p.dinero < 5000 * e || prep.defensa >= 30, fn: () => { p.dinero -= Math.round(5000 * e); prep.defensa += 15; log('🎒 Reforzaste las puertas y ventanas de tu casa.'); this.preparar(); } },
      op('Listo / Ignorar los rumores', () => {}),
    ] });
  },
  /* ---------- El colapso ---------- */
  colapso() {
    const p = S.p, prep = S.apocPrep || { comida: 0, agua: 0, medicinas: 0, defensa: 0 };
    const refugios = [];
    const casa = p.bienes.find(b => b.id === p.casaId);
    refugios.push({ n: p.vivienda === 'calle' ? 'Un puente bajo la autopista' : p.vivienda === 'padres' ? 'La casa de tus padres' : casa ? `Tu ${casa.n.toLowerCase()}` : 'Tu departamento alquilado', base: p.vivienda === 'calle' ? 5 : casa && /Mansión|Penthouse/.test(casa.n) ? 30 : p.vivienda === 'alquiler' ? 35 : 25, ic: '🏠' });
    const seguros = { 'Cabaña en la montaña': 60, 'Casa de campo con viñedo': 55, 'Castillo europeo': 75, 'Isla privada': 92, 'Villa frente al mar': 40 };
    for (const b of p.bienes.filter(b => seguros[b.n])) refugios.push({ n: `Tu ${b.n.toLowerCase()}`, base: seguros[b.n], ic: b.ic });
    refugios.push({ n: 'El refugio del gobierno en el estadio', base: 50, ic: '🏟️', gobierno: true });
    Noticias.emitir('EMERGENCIA NACIONAL: el brote está fuera de control. El gobierno pide a la población refugiarse.', { modal: true, ic: '🧟', cuerpo: '<p>Las calles se llenan de gente que ya no es gente. Las comunicaciones fallan. El dinero deja de importar.</p><p><b>A partir de ahora el tiempo avanza mes a mes.</b></p>' });
    Modal.mostrar({ ic: '🏚️', titulo: '¿Dónde te refugias?', texto: '<p>Tienes minutos para decidir. Los lugares aislados son más seguros.</p>', opciones: refugios.map(r => op(`${r.ic} ${r.n} — defensa ${r.base}`, () => this.iniciar(r, prep))) });
  },
  iniciar(ref, prep) {
    const p = S.p;
    const grupo = [];
    const sumar = (r, prob) => { if (r && r.vivo && r.edad >= 0 && R.chance(prob)) grupo.push(r.id); };
    sumar(pareja(), 0.95);
    hijos().forEach(h => sumar(h, h.edad < 18 ? 1 : 0.5));
    personas('padre', 'madre').forEach(x => sumar(x, p.edad < 18 ? 1 : 0.5));
    personas('amigo').filter(x => x.cercania > 70).forEach(x => sumar(x, 0.3));
    const n = grupo.length + 1;
    S.apoc = { fase: 'colapso', inicio: S.anio, mes: 0, rescate: R.int(16, 34), refugio: ref.n, gobierno: !!ref.gobierno, defensa: clamp(ref.base + prep.defensa), comida: prep.comida + n * 2, agua: prep.agua + n * 2, medicinas: prep.medicinas, materiales: 1, municion: 0, huerto: 0, semillas: Habilidades.nivel('jardineria') >= 2, colector: false, infectado: 0, grupo, extras: [], ruido: 10, muertes: 0, antidoto: 0 };
    p.trabajo = null; p.medioTiempo = null; p.edu.enCurso = null;
    if (p.esp.politica) p.esp.politica.cargo = null;
    log(`🧟 <b>El mundo colapsó.</b> Te refugias en: ${ref.n}. Tu grupo: ${grupo.length ? grupo.map(id => p.rel.find(r => r.id === id).nombre).join(', ') : 'nadie más'}.`, 'malo');
    if (grupo.length < [pareja(), ...hijos(), ...personas('padre', 'madre')].filter(Boolean).length) log('No pudiste reunir a toda tu familia. No sabes qué fue de algunos.', 'malo');
    S.apocProgramado = null;
  },

  /* ---------- Un mes de supervivencia ---------- */
  miembros() { const a = this.a(); return [...a.grupo.map(id => S.p.rel.find(r => r.id === id)).filter(r => r && r.vivo), ...a.extras.filter(x => x.vivo)]; },
  tiene(ef) { return this.a().extras.some(x => x.vivo && x.ef === ef); },
  turno() {
    const p = S.p, a = this.a();
    Panel.cerrar();
    a.mes++; p.usos = {};
    if (a.mes % 12 === 0) { p.edad++; S.anio++; p.rel.forEach(r => { if (r.vivo) r.edad++; }); }
    p.log.push({ edad: p.edad, anio: S.anio, mes: a.mes, l: [] });
    const bocas = 1 + this.miembros().length;
    // Producción
    if (a.huerto) { const g = a.huerto + Math.floor(Habilidades.nivel('jardineria') / 3) + (this.tiene('agricultor') ? 1 : 0); a.comida += g; }
    if (R.chance(0.35)) { const g = R.int(1, 4) + (a.colector ? 3 : 0); a.agua += g; log(`🌧️ Llovió: juntaron ${g} raciones de agua.`); }
    if (a.gobierno && R.chance(0.6)) { a.comida += 2; a.agua += 2; }
    // Consumo
    a.comida -= bocas; a.agua -= bocas;
    if (a.agua < 0) { a.agua = 0; mod({ salud: -12, felicidad: -8 }); log('💧 No queda agua potable. La sed es insoportable.', 'malo'); this.perderMiembro('la deshidratación', 0.2); }
    if (a.comida < 0) { a.comida = 0; mod({ salud: -8, felicidad: -6 }); log('🥫 No queda comida. El grupo pasa hambre.', 'malo'); this.perderMiembro('el hambre', 0.12); }
    mod({ felicidad: -2, estres: 3 });
    if (a.comida > 0 && a.agua > 0 && !a.infectado) mod({ salud: 3 });
    // Infección
    if (a.infectado) {
      a.infectado++;
      mod({ salud: -12 });
      log(`🤒 La herida infectada empeora (etapa ${a.infectado} de 5).`, 'malo');
      if (a.infectado >= 5) return this.morir('la infección');
    }
    // Eventos
    if (R.chance(0.55)) this.evento();
    a.ruido = clamp(a.ruido - 5);
    a.defensa = clamp(a.defensa - 1);
    if (p.st.salud <= 0) return this.morir('las heridas y el agotamiento');
    if (a.mes >= a.rescate) this.rescate();
    Estado.guardar();
    actualizar();
  },
  perderMiembro(causa, prob) {
    const m = R.pick(this.miembros());
    if (!m || !R.chance(prob)) return;
    m.vivo = false; this.a().muertes++;
    log(`🕯️ ${m.nombre} no sobrevivió a ${causa}.`, 'malo');
    mod({ felicidad: -12 });
  },
  morir(causa) { Vida.morir(causa); Estado.guardar(); actualizar(); },
  poderCombate() { const p = S.p, a = this.a(); return p.st.salud * 0.3 + Habilidades.nivel('combate') * 5 + Math.min(a.municion, 10) * 3 + (this.tiene('soldado') ? 15 : 0) + (Rasgos.tiene('atleta') ? 8 : 0); },
  herir(texto) {
    const p = S.p, a = this.a();
    mod({ salud: -R.int(8, 22) });
    log(`🩸 ${texto}`, 'malo');
    if (!a.infectado && R.chance(0.18)) { a.infectado = 1; log('🦠 La herida se ve mal. Sabes lo que eso significa… salvo que encuentres un antídoto.', 'malo'); Modal.mostrar({ ic: '🦠', titulo: 'La herida no se ve bien', texto: '<p>Tienes unos cuatro meses. Los rumores hablan de un antídoto experimental en hospitales y farmacias.</p>' }); }
  },
  evento() {
    const p = S.p, a = this.a();
    const ev = R.peso([[26 + a.ruido / 3, 'horda'], [14, 'saqueadores'], [12, 'superviviente'], [10, 'enfermo'], [10, 'radio'], [10, 'tranquilo'], [8, 'hallazgo'], [6, 'conflicto']]);
    if (ev === 'horda') {
      const fuerza = R.int(20, 70) + a.mes;
      const def = a.defensa + this.poderCombate() * 0.6 + this.miembros().length * 4;
      if (def >= fuerza) { a.defensa = clamp(a.defensa - R.int(4, 12)); if (a.municion) a.municion = Math.max(0, a.municion - R.int(1, 3)); log('🧟 Una horda rodeó el refugio de noche, pero las defensas resistieron.', 'raro'); }
      else {
        a.defensa = clamp(a.defensa - R.int(20, 35));
        Modal.mostrar({ ic: '🧟', titulo: '¡Rompieron una barricada!', texto: '<p>Una horda logra entrar por una ventana. ¿Qué haces?</p>', opciones: [
          op('🛡️ Defender la entrada', () => { if (R.chance(this.poderCombate() / 100 + 0.25)) log('🛡️ Contuviste la entrada y sellaron la ventana.', 'raro'); else this.herir('Te hirieron defendiendo la entrada.'); }),
          op('🏃 Huir por el techo con lo que puedan cargar', () => { a.comida = Math.floor(a.comida / 2); a.agua = Math.floor(a.agua / 2); a.medicinas = Math.floor(a.medicinas / 2); a.defensa = 15; log('🏃 Escaparon por el techo y perdieron la mitad de las provisiones.', 'malo'); this.perderMiembro('la huida', 0.25); }),
        ] });
      }
    } else if (ev === 'saqueadores') {
      Modal.mostrar({ ic: '🔫', titulo: 'Saqueadores', texto: '<p>Un grupo armado exige la mitad de sus provisiones.</p>', opciones: [
        op('🥫 Pagar y evitar problemas', () => { a.comida = Math.floor(a.comida / 2); a.agua = Math.floor(a.agua / 2); log('Pagaste a los saqueadores. Se fueron… por ahora.'); }),
        op('⚔️ Enfrentarlos', () => { if (R.chance(this.poderCombate() / 110 + 0.2)) { a.municion += R.int(2, 5); a.comida += R.int(1, 4); log('⚔️ Ahuyentaste a los saqueadores y te quedaste con parte de su botín.', 'raro'); } else { this.herir('Los saqueadores te dieron una paliza.'); a.comida = Math.floor(a.comida / 3); } }),
        op('🤫 Esconderse y esperar', () => { if (R.chance(0.6 - a.ruido / 200)) log('🤫 No los encontraron. Se fueron con las manos vacías.'); else { a.comida = 0; log('Los encontraron. Se llevaron toda la comida.', 'malo'); } }),
      ] });
    } else if (ev === 'superviviente') {
      const s = R.pick(SUPERVIVIENTES), g = /a$/.test(s.rol.split(' ')[0]) ? 'F' : 'M';
      const nombre = nombreAleatorio(g, p.pais);
      Modal.mostrar({ ic: s.ic, titulo: 'Alguien toca la puerta', texto: `<p><b>${nombre}</b>, ${s.rol}, pide refugio. Es una boca más que alimentar… y un par de manos más.</p>`, opciones: [
        op('Dejarl' + (g === 'F' ? 'a' : 'o') + ' entrar', () => { a.extras.push({ id: uid(), nombre, rol: s.rol, ic: s.ic, ef: s.ef, vivo: true }); mod({ karma: 4 }); if (s.ef === 'soldado') a.defensa = clamp(a.defensa + 10); if (s.ef === 'mecanico') a.materiales += 2; log(`${s.ic} ${nombre}, ${s.rol}, se unió al grupo.`, 'bueno'); }),
        op('Cerrarle la puerta', () => { mod({ karma: -5, felicidad: -3 }); log(`Le cerraste la puerta a ${nombre}. No pudiste dormir esa noche.`, 'malo'); }),
      ] });
    } else if (ev === 'enfermo') {
      const m = R.pick(this.miembros()); if (!m) return;
      Modal.mostrar({ ic: '🤒', titulo: `${m.nombre} está enferm${gx(m, 'o', 'a')}`, texto: '<p>Fiebre alta. ¿Usan medicinas?</p>', opciones: [
        { t: `💊 Usar una medicina (quedan ${a.medicinas})`, dis: a.medicinas < 1, fn: () => { a.medicinas--; log(`💊 ${m.nombre} se recuperó gracias a las medicinas.`, 'bueno'); } },
        op('Esperar que lo supere', () => { if (R.chance(0.5 + (this.tiene('medico') ? 0.3 : 0) + Habilidades.nivel('auxilios') * 0.04)) log(`${m.nombre} superó la fiebre.`); else { m.vivo = false; a.muertes++; mod({ felicidad: -12 }); log(`🕯️ ${m.nombre} no superó la fiebre.`, 'malo'); } }),
      ] });
    } else if (ev === 'radio') { if (R.chance(0.6)) { a.rescate = Math.max(a.mes + 1, a.rescate - R.int(1, 4)); mod({ felicidad: 6 }); log('📻 Una radio capta un mensaje: "Zona segura en construcción. Resistan." Hay esperanza.', 'raro'); } else log('📻 Solo estática en la radio.'); }
    else if (ev === 'hallazgo') { const k = R.pick(['comida', 'agua', 'medicinas', 'materiales', 'municion']); const g = R.int(1, 4); a[k] += g; log(`📦 Encontraron un escondite con ${g} de ${{ comida: 'comida', agua: 'agua', medicinas: 'medicinas', materiales: 'materiales', municion: 'munición' }[k]}.`, 'bueno'); }
    else if (ev === 'conflicto') { const m = R.pick(this.miembros()); if (m) Modal.mostrar({ ic: '😠', titulo: 'Tensión en el grupo', texto: `<p>${m.nombre} quiere tomar el control de las provisiones.</p>`, opciones: [op('Hablarlo con calma', () => { if (R.chance(0.5 + Habilidades.nivel('carisma') * 0.05)) log('😮‍💨 Calmaste los ánimos.'); else { a.comida = Math.max(0, a.comida - 3); log(`${m.nombre} se llevó comida a escondidas.`, 'malo'); } }), op('Imponer tu liderazgo', () => { mod({ estres: 6 }); if (R.chance(0.4)) { m.vivo = false; log(`${m.nombre} se fue del grupo enojad${gx(m, 'o', 'a')}.`, 'malo'); } else log('El grupo aceptó tu liderazgo.'); })] }); }
    else log('🌙 Un mes tranquilo. Demasiado tranquilo.');
  },

  /* ---------- Acciones del mes ---------- */
  panel() {
    Panel.abrir('Supervivencia', () => {
      const p = S.p, a = this.a();
      if (!this.activo()) return [{ info: 'El mundo volvió a la normalidad.' }];
      const m = this.miembros();
      const its = [
        { info: `🧟 Mes <b>${a.mes}</b> del fin del mundo · Refugio: ${a.refugio}${a.infectado ? `<br>🦠 <b>Estás infectad${gx(p, 'o', 'a')} (etapa ${a.infectado}/5).</b> Busca un antídoto en hospitales y farmacias.` : ''}` },
        { kv: [['🥫 Comida', a.comida], ['💧 Agua', a.agua], ['💊 Medicinas', a.medicinas], ['🪵 Materiales', a.materiales], ['🎯 Munición', a.municion], ['🌱 Huerto', a.huerto ? `nivel ${a.huerto}` : a.semillas ? 'Tienes semillas' : 'Sin semillas'], ['👥 Grupo', `${m.length + 1} personas (consumen ${m.length + 1} de comida y agua al mes)`]] },
        { barra: ['🛡️ Defensa del refugio', a.defensa, 'var(--info)'] },
        { info: `Te quedan <b>${usosRestantes('accionApoc', 2)}</b> acciones este mes.` },
      ];
      const ac = (ic, t, s, fn, dis) => its.push({ ic, t, s, dis: dis || (usosRestantes('accionApoc', 2) <= 0 ? 'Ya no te quedan acciones este mes.' : false), fn: () => { if (!usar('accionApoc', 2)) return; fn(); } });
      ac('🔍', 'Salir a buscar suministros', 'Elige el lugar: más botín, más riesgo', () => this.explorar());
      ac('🔨', 'Reforzar el refugio', `Usa 2 materiales · +defensa${Habilidades.nivel('mecanica') ? ' (bono de mecánica)' : ''}`, () => { a.materiales -= 2; a.defensa = clamp(a.defensa + 8 + Habilidades.nivel('mecanica') * 1.5 + (this.tiene('mecanico') ? 4 : 0)); Habilidades.ganar('mecanica', 10, true); log('🔨 Reforzaste las barricadas del refugio.'); }, a.materiales < 2 ? 'Necesitas 2 materiales.' : false);
      ac('🌱', 'Trabajar el huerto', 'Comida cada mes', () => { a.huerto = Math.min(3 + Math.floor(Habilidades.nivel('jardineria') / 2), a.huerto + 1); Habilidades.ganar('jardineria', 12, true); log(`🌱 Ampliaste el huerto (nivel ${a.huerto}).`); }, !a.semillas ? 'Necesitas semillas (búscalas en casas abandonadas) o jardinería nivel 2.' : false);
      if (!a.colector) ac('💧', 'Instalar un colector de lluvia', 'Usa 3 materiales · más agua cuando llueve', () => { a.materiales -= 3; a.colector = true; log('💧 Instalaste un colector de agua de lluvia.'); }, a.materiales < 3 ? 'Necesitas 3 materiales.' : false);
      ac('🩹', 'Curar heridas', `Usa 1 medicina${Habilidades.nivel('auxilios') ? ' (bono de primeros auxilios)' : ''}`, () => { a.medicinas--; mod({ salud: 12 + Habilidades.nivel('auxilios') * 2 + (this.tiene('medico') ? 8 : 0) }); if (a.infectado > 1) { a.infectado--; log('💊 Las medicinas frenaron un poco la infección.'); } else log('🩹 Curaste tus heridas.'); }, a.medicinas < 1 ? 'No tienes medicinas.' : false);
      ac('🍳', 'Cocinar algo decente para todos', 'Usa 1 comida · sube la moral', () => { a.comida--; mod({ felicidad: 6 + Habilidades.nivel('cocina') }); log('🍳 Esa noche comieron algo que casi parecía normal.'); }, a.comida < 1 ? 'No hay comida.' : false);
      ac('📻', 'Escuchar la radio', 'Noticias del rescate', () => { if (R.chance(0.35)) { a.rescate = Math.max(a.mes + 1, a.rescate - R.int(1, 3)); mod({ felicidad: 5 }); log('📻 Captaste coordenadas de una zona segura. El rescate está más cerca.', 'raro'); } else log('📻 Solo estática.'); });
      ac('😴', 'Descansar', '+salud, −estrés', () => { mod({ salud: 5, estres: -10 }); log('😴 Dormiste una noche entera por primera vez en semanas.'); });
      if (m.length || a.extras.length) { its.push({ sec: 'Tu grupo' }); for (const x of m) its.push({ ic: x.ic || Relaciones.icono(x), t: x.nombre, s: x.rol || etiquetaRel(x) }); }
      return its;
    });
  },
  explorar() {
    const p = S.p, a = this.a();
    Modal.mostrar({ ic: '🔍', titulo: '¿A dónde vas?', opciones: Object.entries(LUGARES_APOC).map(([k, l]) => op(`${l.n} — riesgo ${Math.round(l.riesgo * 100)}%`, () => this.ir(k))) });
  },
  ir(k) {
    const p = S.p, a = this.a(), l = LUGARES_APOC[k];
    Efectos.suspenso(`${l.n.split(' ')[0]} Avanzas en silencio…`, () => {
      a.ruido = clamp(a.ruido + 8);
      const encuentro = R.chance(Math.max(0.05, l.riesgo - Habilidades.nivel('combate') * 0.015 + a.ruido / 400));
      if (encuentro) {
        if (R.chance(this.poderCombate() / 100 + 0.2)) { if (a.municion) a.municion--; log('🧟 Te cruzaste con infectados, pero lograste escapar.', 'raro'); Habilidades.ganar('combate', 15, true); }
        else { this.herir(`Te atacaron en ${l.n.replace(/^\S+ /, '').toLowerCase()}.`); if (R.chance(0.05)) return this.morir('un ataque mientras buscaba suministros'); return; }
      }
      const botin = [];
      for (const [rec, [mn, mx]] of Object.entries(l.botin)) { const g = R.int(mn, mx); if (g) { a[rec] += g; botin.push(`${g} ${{ comida: 'comida', agua: 'agua', medicinas: 'medicinas', materiales: 'materiales', municion: 'munición' }[rec]}`); } }
      if (l.semillas && !a.semillas && R.chance(l.semillas)) { a.semillas = true; botin.push('¡semillas para un huerto!'); }
      if (l.antidoto && R.chance(l.antidoto)) {
        a.antidoto++; botin.push('💉 ¡un ANTÍDOTO experimental!');
        if (a.infectado) { a.infectado = 0; a.antidoto--; Efectos.celebrar('💉', '¡Antídoto!', '<p>Te lo inyectas temblando. Horas después, la fiebre baja. Vas a vivir.</p>'); }
      }
      log(`🔍 Exploraste ${l.n.replace(/^\S+ /, '').toLowerCase()}: ${botin.length ? botin.join(', ') : 'no quedaba nada útil'}.`, botin.length ? 'bueno' : '');
    }, 1300, '🔍');
  },
  rescate() {
    const p = S.p, a = this.a();
    a.fase = 'fin'; p.cont.sobrevivioApoc = true; p.cont.mesesApoc = a.mes;
    S.eco = { estado: 'recesion', anios: 3 };
    p.dinero = Math.round(p.dinero * 0.4);
    p.bienes.forEach(b => b.valor = Math.round(b.valor * (b.tipo === 'casa' ? 0.6 : 0.5)));
    p.negocios.forEach(n => { n.capital = Math.round(n.capital * 0.4); n.valor = Math.round(n.valor * 0.4); });
    for (const k in p.inv) p.inv[k] = Math.round(p.inv[k] * 0.5);
    if (p.vivienda === 'calle') p.vivienda = 'alquiler';
    mod({ felicidad: 25, estres: -30, fama: 10 });
    Estado.darLogro('superviviente');
    log(`🚁 <b>¡Rescate!</b> Tras ${a.mes} meses, el ejército llega con una vacuna. La civilización vuelve a empezar.`, 'raro');
    Efectos.celebrar('🚁', '¡Sobreviviste al fin del mundo!', `<p>Resististe <b>${a.mes} meses</b>. Sobrevivientes de tu grupo: ${this.miembros().length}.</p><p class="nota">El mundo que encuentras es distinto: tu dinero perdió valor, la economía está en recesión… pero estás viv${gx(p, 'o', 'a')}.</p>`);
    Noticias.emitir('La vacuna funciona: las ciudades empiezan a reconstruirse.');
  },
};
