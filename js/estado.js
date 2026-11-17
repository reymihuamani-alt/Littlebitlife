'use strict';
/* =========================================================
   ESTADO: creación de vidas, personas, guardado
   ========================================================= */
const CLAVE_PARTIDA = 'otravida_partida_v1';
const CLAVE_LOGROS = 'otravida_logros_v1';

const eco = () => PAISES[S.p.pais].eco;
const pais = () => PAISES[S.p.pais];

function nombreAleatorio(genero, paisN) {
  const lista = PAISES[paisN] && PAISES[paisN].ingles ? NOMBRES_EN : NOMBRES;
  return R.pick(lista[genero]);
}
function apellidoAleatorio(paisN) {
  return R.pick(PAISES[paisN] && PAISES[paisN].ingles ? APELLIDOS_EN : APELLIDOS);
}
function statAleatoria(m = 55, sd = 20) { return clamp(Math.round(R.normal(m, sd)), 5, 100); }

const Estado = {
  persona({ tipo, genero, edad, apellido, paisN, clase = 'media', nombre }) {
    genero = genero || (R.chance(0.5) ? 'M' : 'F');
    paisN = paisN || (S ? S.p.pais : 'Perú');
    const e = PAISES[paisN].eco;
    const riqueza = { pobre: [500, 12000], media: [15000, 160000], alta: [250000, 2500000], rica: [4e6, 6e7], real: [8e7, 4e8] }[clase] || [5000, 80000];
    return {
      id: uid(), tipo, genero, edad: edad ?? R.int(18, 40),
      nombre: nombre || nombreAleatorio(genero, paisN), apellido: apellido || apellidoAleatorio(paisN),
      cercania: R.int(50, 95), vivo: true,
      profesion: tipo === 'hijo' ? null : R.pick(PROFESIONES_NPC),
      dinero: Math.round(R.float(riqueza[0], riqueza[1]) * (clase === 'real' ? 1 : e)),
      apa: statAleatoria(), int: statAleatoria(), anios: 0,
    };
  },

  nuevaVida(cfg) {
    const paisN = cfg.pais, genero = cfg.genero;
    let clase = cfg.real ? 'real' : (cfg.clase || R.peso([[30, 'pobre'], [50, 'media'], [15, 'alta'], [5, 'rica']]));
    const apellido = cfg.apellido || (cfg.real ? CASAS_REALES[paisN] : apellidoAleatorio(paisN));
    const p = {
      nombre: cfg.nombre || nombreAleatorio(genero, paisN), apellido, genero, pais: paisN, paisNacimiento: paisN,
      edad: 0, vivo: true, causa: null, clase,
      st: { felicidad: R.int(70, 100), salud: R.int(72, 100), inteligencia: statAleatoria(52, 22), apariencia: statAleatoria(52, 22), estres: R.int(0, 10), fama: cfg.real ? 45 : 0, karma: 50 },
      dinero: 0, vivienda: 'padres', estilo: 'normal',
      edu: { enCurso: null, titulos: [], abandono: false, notas: R.int(45, 85), club: null },
      trabajo: null, medioTiempo: null, expTrab: {}, jubilado: false, pension: 0, ultimoSalario: 0,
      rel: [], mascotas: [], bienes: [], inv: { acciones: 0, indice: 0, bonos: 0, cripto: 0 },
      negocios: [], deudas: [], carcel: null, antecedentes: 0, enf: [], adic: { alcohol: 0, tabaco: 0, apuestas: 0 },
      esp: { modelo: null, actor: null, director: null, luchador: null, politica: null, org: null, realeza: null, astronauta: null, redes: null },
      objetivo: cfg.objetivo || 'libre', reto: cfg.reto || 'ninguno', objCumplido: false, retoCumplido: false,
      cont: { crimenes: 0, aniosCarcel: 0, fugas: 0, matrimonios: 0, parejas: 0, hijos: 0, donado: 0, viajes: 0, profesiones: [], cirugias: 0, peliculas: 0, sumaFel: 0, maxPatrimonio: 0, cargos: [] },
      usos: {}, log: [], generacion: cfg.generacion || 1, dios: false, licencia: false, vistos: {},
    };
    S = { v: 1, anio: cfg.anio || 2026, p, eco: { estado: 'normal', anios: 0 }, cine: { tendencias: {} }, dinastia: cfg.dinastia || { millonarios: [] } };
    Cine.nuevasTendencias();

    // Familia
    const papa = this.persona({ tipo: 'padre', genero: 'M', edad: R.int(22, 42), apellido, paisN, clase });
    const mama = this.persona({ tipo: 'madre', genero: 'F', edad: R.int(20, 40), paisN, clase });
    if (clase === 'pobre') { papa.profesion = R.pick(['Albañil', 'Agricultor', 'Chofer', 'Desempleado', 'Vendedor ambulante']); mama.profesion = R.pick(['Ama de casa', 'Vendedora', 'Costurera', 'Limpieza']); }
    if (clase === 'rica') { papa.profesion = R.pick(['Empresario', 'Banquero', 'Cirujano', 'Abogado']); }
    if (cfg.real) {
      papa.profesion = paisN === 'España' ? 'Rey' : 'Rey'; papa.real = true; papa.monarca = true;
      mama.profesion = 'Reina consorte'; mama.real = true;
      papa.dinero = R.int(2e8, 6e8); mama.dinero = R.int(5e6, 3e7);
    }
    p.rel.push(papa, mama);
    const nHerm = R.peso([[30, 0], [35, 1], [22, 2], [13, 3]]);
    for (let i = 0; i < nHerm; i++) {
      const h = this.persona({ tipo: 'hermano', edad: R.chance(0.6) ? R.int(1, 12) : 0, apellido, paisN, clase });
      h.profesion = null; h.dinero = 0;
      if (cfg.real) h.real = true;
      if (h.edad === 0) h.edad = -R.int(1, 6); // nacerá más adelante
      p.rel.push(h);
    }
    if (cfg.real) Realeza.iniciarNacimiento();

    p.log.push({ edad: 0, anio: S.anio, l: [] });
    log(`Naciste ${gx(p, 'niño', 'niña')} en ${paisN} ${PAISES[paisN].bandera}. Te llamaron <b>${p.nombre} ${p.apellido}</b>.`, 'info');
    log(`Tu padre es ${papa.nombre} (${papa.profesion}, ${papa.edad} años) y tu madre es ${mama.nombre} (${mama.profesion}, ${mama.edad} años).`);
    const desc = { pobre: 'una familia humilde con dificultades económicas', media: 'una familia de clase media', alta: 'una familia acomodada', rica: 'una familia muy rica', real: 'la familia real' }[clase];
    log(`Creces en ${desc}.`, 'gris');
    const nacidos = p.rel.filter(r => r.tipo === 'hermano' && r.edad > 0);
    if (nacidos.length) log(`Tienes ${nacidos.length} herman${nacidos.length > 1 ? 'os' : gx(nacidos[0], 'o', 'a')} mayor${nacidos.length > 1 ? 'es' : ''}: ${nacidos.map(h => h.nombre).join(', ')}.`);
    const ob = OBJETIVOS.find(o => o.id === p.objetivo);
    if (ob.id !== 'libre') log(`🎯 Meta de esta vida: <b>${ob.nombre}</b>. ${ob.desc}`, 'raro');
    return S;
  },

  guardar() {
    try { localStorage.setItem(CLAVE_PARTIDA, JSON.stringify(S)); } catch (e) { /* almacenamiento no disponible */ }
  },
  cargar() {
    try { const t = localStorage.getItem(CLAVE_PARTIDA); if (!t) return null; const s = JSON.parse(t); return s && s.p ? s : null; } catch (e) { return null; }
  },
  borrar() { try { localStorage.removeItem(CLAVE_PARTIDA); } catch (e) {} },
  logros() { try { return JSON.parse(localStorage.getItem(CLAVE_LOGROS) || '[]'); } catch (e) { return []; } },
  darLogro(id) {
    if (S.p.dios) return;
    const l = this.logros(); if (l.includes(id)) return;
    l.push(id); try { localStorage.setItem(CLAVE_LOGROS, JSON.stringify(l)); } catch (e) {}
    const lg = LOGROS.find(x => x.id === id);
    if (lg) { log(`🏆 Logro desbloqueado: <b>${lg.n}</b>`, 'raro'); toast(`🏆 ${lg.n}`); }
  },
};

/* ---------- Consultas comunes ---------- */
function tieneTitulo(tipo, nombre) { return S.p.edu.titulos.some(t => t.tipo === tipo && (!nombre || t.nombre === nombre)); }
function nivelEdu() { return S.p.edu.titulos.reduce((m, t) => Math.max(m, NIVEL_EDU[t.tipo] ?? 0), 0); }
function carrerasObtenidas() { return S.p.edu.titulos.filter(t => t.tipo === 'universidad').map(t => t.nombre); }
function personas(...tipos) { return S.p.rel.filter(r => r.vivo && tipos.includes(r.tipo) && r.edad >= 0); }
function pareja() { return S.p.rel.find(r => r.vivo && (r.tipo === 'pareja' || r.tipo === 'conyuge')); }
function hijos() { return S.p.rel.filter(r => r.tipo === 'hijo' && r.vivo); }
function viveConPadres() { return S.p.vivienda === 'padres' && personas('padre', 'madre').length > 0; }
function patrimonio() {
  const p = S.p;
  let t = p.dinero;
  t += p.bienes.reduce((s, b) => s + b.valor, 0);
  t += Object.values(p.inv).reduce((s, v) => s + v, 0);
  t += p.negocios.reduce((s, n) => s + n.valor * (n.participacion ?? 1), 0);
  t -= p.deudas.reduce((s, d) => s + d.saldo, 0);
  return Math.round(t);
}
function etiquetaRel(r) {
  const g = r.genero === 'F';
  return { padre: 'Padre', madre: 'Madre', hermano: g ? 'Hermana' : 'Hermano', pareja: g ? 'Novia' : 'Novio', conyuge: g ? 'Esposa' : 'Esposo', hijo: g ? 'Hija' : 'Hijo', amigo: g ? 'Amiga' : 'Amigo', ex: g ? 'Expareja' : 'Expareja', nieto: g ? 'Nieta' : 'Nieto' }[r.tipo] || r.tipo;
}
