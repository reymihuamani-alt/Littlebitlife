'use strict';
/* =========================================================
   INTERFAZ: render principal, paneles, modales, toasts
   ========================================================= */
let S = null;                 // estado global de la partida
const $ = sel => document.querySelector(sel);

function log(t, tipo = '') {
  const p = S.p; if (!p.log.length) p.log.push({ edad: p.edad, anio: S.anio, l: [] });
  p.log[p.log.length - 1].l.push([t, tipo]);
}
/* Modifica estadísticas con límites 0..100 */
function mod(c) {
  const st = S.p.st;
  for (const k in c) {
    if (S.p.dios && S.p.diosBloq && S.p.diosBloq[k]) continue;
    const antes = st[k] ?? 0;
    st[k] = clamp(Math.round(antes + c[k]));
    if (typeof Efectos !== 'undefined') Efectos.registrar(k, st[k] - antes);
  }
}
function toast(msg) {
  const t = $('#toast'); t.innerHTML = msg; t.classList.add('ver');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('ver'), 2200);
}
/* Limita cuántas veces al año se puede hacer algo */
function usar(clave, max = 1) {
  const u = S.p.usos; u[clave] = (u[clave] || 0) + 1;
  if (u[clave] > max) { u[clave]--; toast('Ya hiciste esto suficiente este año. Cumple años para volver a intentarlo.'); return false; }
  return true;
}
function usosRestantes(clave, max) { return Math.max(0, max - (S.p.usos[clave] || 0)); }

/* ---------- Render principal ---------- */
function avatarDe(p) {
  const e = p.edad, f = p.genero === 'F';
  if (!p.vivo) return '🪦';
  if (p.esp.realeza && p.esp.realeza.monarca) return f ? '👸' : '🤴';
  if (e < 3) return '👶'; if (e < 13) return f ? '👧' : '👦';
  if (e < 20) return '🧑'; if (e < 65) return f ? '👩' : '👨';
  return f ? '👵' : '👴';
}
function colorStat(k, v) {
  if (k === 'estres') return v > 66 ? 'var(--mal)' : v > 33 ? 'var(--med)' : 'var(--ok)';
  if (k === 'fama') return 'var(--fama)';
  if (k === 'karma') return 'var(--info)';
  return v > 66 ? 'var(--ok)' : v > 33 ? 'var(--med)' : 'var(--mal)';
}
const NOMBRE_STAT = { felicidad: '😊 Felicidad', salud: '❤️ Salud', inteligencia: '🧠 Inteligencia', apariencia: '✨ Apariencia', estres: '😣 Estrés', fama: '🌟 Fama', karma: '☯️ Karma' };

function render() {
  if (!S) return;
  const p = S.p;
  $('#avatar').textContent = avatarDe(p);
  $('#nombre-jugador').textContent = `${p.nombre} ${p.apellido}`;
  $('#sub-jugador').textContent = `${PAISES[p.pais].bandera} ${p.edad} años · ${ocupacionTexto()}`;
  const d = $('#dinero-jugador'); d.textContent = fmt$(p.dinero); d.classList.toggle('neg', p.dinero < 0);
  const ob = OBJETIVOS.find(o => o.id === p.objetivo);
  const re = RETOS.find(r => r.id === p.reto);
  $('#barra-objetivo').innerHTML = `${ob.ic} Objetivo: <b>${ob.nombre}</b>${p.objCumplido ? ' ✅' : ''} — ${esc(Objetivos.pista())}${re && re.id !== 'ninguno' ? ` · ${re.ic} Reto: <b>${re.nombre}</b>${p.retoCumplido ? ' ✅' : ''}` : ''}`;
  // registro
  const reg = $('#registro');
  reg.innerHTML = p.log.slice(-60).map(e => `<div class="anio"><h4>Edad ${e.edad} · ${e.anio}</h4>${e.l.map(([t, c]) => `<p class="${c}">${t}</p>`).join('') || '<p class="gris">Un año tranquilo.</p>'}</div>`).join('');
  reg.scrollTop = reg.scrollHeight;
  // stats
  const keys = ['felicidad', 'salud', 'inteligencia', 'apariencia', 'estres', 'fama'];
  $('#stats').innerHTML = keys.map(k => { const v = p.st[k]; return `<div class="stat" data-k="${k}"><div class="fila"><span>${NOMBRE_STAT[k]}</span><b>${v}%</b></div><div class="barra"><i style="width:${v}%;background:${colorStat(k, v)}"></i></div></div>`; }).join('');
  $('#nav-ocupacion').textContent = p.carcel ? 'Prisión' : (p.edad < 18 || p.edu.enCurso) && !p.trabajo ? 'Escuela' : 'Trabajo';
  document.querySelector('[data-nav="ocupacion"] span').textContent = p.carcel ? '⛓️' : (p.edad < 18 || p.edu.enCurso) && !p.trabajo ? '🎓' : '💼';
  $('#btn-edad').classList.toggle('muerto', !p.vivo);
}

function ocupacionTexto() {
  const p = S.p, e = p.esp;
  if (!p.vivo) return 'Fallecido';
  if (p.carcel) return `En prisión (${p.carcel.restantes} años restantes)`;
  if (p.monasterio) return 'Vives en un monasterio';
  if (e.realeza && e.realeza.titulo) return e.realeza.titulo;
  if (e.politica && e.politica.cargo) return CARGOS[e.politica.cargo].n;
  if (p.trabajo) return Trabajo.tituloActual();
  if (p.medioTiempo) return p.medioTiempo.titulo + ' (medio tiempo)';
  const esp = [];
  if (e.modelo) esp.push(NIV_MOD[e.modelo.nivel] || 'Modelo');
  if (e.actor) esp.push('Actor');
  if (e.director) esp.push('Director de cine');
  if (e.luchador) esp.push('Luchador MMA');
  if (e.astronauta) esp.push(NIV_ASTRO[e.astronauta.nivel]);
  if (e.org && e.org.activo) esp.push('Negocios turbios');
  if (esp.length) return esp.join(' · ');
  if (p.edu.enCurso) return 'Estudiante de ' + (p.edu.enCurso.nombre);
  if (p.edad < 6) return 'Niño' + (p.genero === 'F' ? 'a' : '') + ' pequeñ' + gx(p, 'o', 'a');
  if (p.edad < 12) return 'Escuela primaria';
  if (p.edad < 17 && !p.edu.abandono) return 'Escuela secundaria';
  if (p.jubilado) return 'Jubilad' + gx(p, 'o', 'a');
  if (p.negocios.length) return 'Empresari' + gx(p, 'o', 'a');
  return 'Desemplead' + gx(p, 'o', 'a');
}

/* ---------- Paneles apilables ---------- */
const Panel = {
  pila: [], fns: [],
  abrir(titulo, fn) { this.pila.push({ titulo, fn }); this.pintar(); },
  atras() { this.pila.pop(); this.pintar(); },
  cerrar() { this.pila = []; this.pintar(); },
  reemplazar(titulo, fn) { this.pila.pop(); this.abrir(titulo, fn); },
  pintar() {
    const el = $('#panel');
    if (!this.pila.length) { el.classList.add('oculto'); if (this.alCerrar) { const f = this.alCerrar; this.alCerrar = null; f(); } return; }
    const top = this.pila[this.pila.length - 1];
    const titulo = typeof top.titulo === 'function' ? top.titulo() : top.titulo;
    const items = top.fn() || [];
    this.fns = [];
    const html = items.filter(Boolean).map(it => {
      if (it.sec) return `<div class="seccion">${it.sec}</div>`;
      if (it.info) return `<div class="infobox">${it.info}</div>`;
      if (it.kv) return `<div class="infobox">${it.kv.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
      if (it.barra) { const [lab, v, col] = it.barra; return `<div class="infobox mini-barra"><div class="stat"><div class="fila"><span>${lab}</span><b>${Math.round(v)}%</b></div><div class="barra"><i style="width:${clamp(v)}%;background:${col || colorStat('x', v)}"></i></div></div></div>`; }
      const i = this.fns.push(it) - 1;
      return `<button class="item ${it.dis ? 'dis' : ''} ${it.cls || ''}" data-i="${i}"><span class="ic">${it.ic || '•'}</span><span class="tx"><b>${it.t}</b>${it.s ? `<small>${it.s}</small>` : ''}</span>${it.der ? `<span class="der">${it.der}</span>` : ''}${it.fn && !it.dis ? '<span class="der">›</span>' : ''}</button>`;
    }).join('');
    el.innerHTML = `<div class="panel-cab"><button id="p-atras">‹ ${this.pila.length > 1 ? 'Atrás' : 'Cerrar'}</button><h2>${titulo}</h2>${this.pila.length > 1 ? '<button id="p-cerrar">✕</button>' : ''}</div><div class="panel-cuerpo">${html}</div>`;
    el.classList.remove('oculto');
    const cuerpo = el.querySelector('.panel-cuerpo');
    cuerpo.scrollTop = this._scroll && this._scrollTitulo === titulo ? this._scroll : 0;
    cuerpo.onscroll = () => { this._scroll = cuerpo.scrollTop; this._scrollTitulo = titulo; };
    $('#p-atras').onclick = () => this.atras();
    if ($('#p-cerrar')) $('#p-cerrar').onclick = () => this.cerrar();
    el.querySelectorAll('.item').forEach(b => b.onclick = () => {
      const it = this.fns[+b.dataset.i];
      if (it.dis) { if (typeof it.dis === 'string') toast(it.dis); return; }
      if (it.fn) { it.fn(); actualizar(); }
    });
  },
};
function actualizar() {
  if (S && S.p && S.p.vivo && !Modal.activo) Objetivos.revisar();
  render(); Panel.pintar();
  if (typeof Efectos !== 'undefined') Efectos.mostrar();
  if (S && !S.p.vivo && !Modal.activo) Vida.mostrarMuerte();
}

/* ---------- Modales en cola ---------- */
const Modal = {
  cola: [], activo: false, extra: null,
  mostrar(cfg) { (this.extra || this.cola).push(cfg); if (!this.activo) this.siguiente(); },
  siguiente() {
    const cfg = this.cola.shift();
    if (!cfg) { this.activo = false; $('#modal-fondo').classList.add('oculto'); actualizar(); return; }
    this.activo = true; this.cfg = cfg; this.pintar(cfg);
  },
  pintar(cfg) {
    $('#modal').className = cfg.clase || '';
    if (cfg.espera) {
      $('#modal').innerHTML = `<div class="m-ic">${cfg.ic || '⏳'}</div><h3>${cfg.titulo || ''}</h3><div class="puntos"><i></i><i></i><i></i></div>`;
      $('#modal-fondo').classList.remove('oculto');
      setTimeout(() => { if (this.cfg === cfg && this.activo) this.elegir({ fn: cfg.espera.fn }); }, cfg.espera.ms);
      return;
    }
    const ops = cfg.opciones && cfg.opciones.length ? cfg.opciones : [{ t: 'Aceptar' }];
    $('#modal').innerHTML = `${cfg.ic ? `<div class="m-ic">${cfg.ic}</div>` : ''}<h3>${cfg.titulo || ''}</h3><div class="m-tx">${cfg.texto || ''}${cfg.html || ''}</div><div class="m-ops">${ops.map((o, i) => `<button class="btn ${o.cls || (ops.length > 1 ? 'sec' : '')}" data-o="${i}" ${o.dis ? 'disabled' : ''}>${o.t}</button>`).join('')}</div>`;
    $('#modal-fondo').classList.remove('oculto');
    $('#modal').scrollTop = 0;
    if (cfg.alAbrir) cfg.alAbrir($('#modal'));
    $('#modal').querySelectorAll('[data-o]').forEach(b => b.onclick = () => this.elegir(ops[+b.dataset.o]));
  },
  elegir(op) {
    this.extra = [];
    try { if (op.fn) op.fn(); }
    catch (e) { console.error(e); }
    const ex = this.extra; this.extra = null;
    this.cola.unshift(...ex);
    this.siguiente();
  },
  /* Selector numérico con atajos */
  numero({ titulo, texto, min = 0, max, valor, paso = 1, ic, fn, etiqueta = 'Confirmar' }) {
    max = Math.max(min, Math.floor(max)); valor = clamp(valor ?? min, min, max);
    this.mostrar({
      ic, titulo, texto,
      html: `<input type="range" id="m-rng" min="${min}" max="${max}" step="${paso}" value="${valor}"><input type="number" id="m-num" min="${min}" max="${max}" step="${paso}" value="${valor}"><div class="rapidos"><button data-f=".1">10%</button><button data-f=".25">25%</button><button data-f=".5">50%</button><button data-f="1">Todo</button></div><div class="nota" id="m-fmt">${fmt$(valor)}</div>`,
      alAbrir(m) {
        const r = m.querySelector('#m-rng'), n = m.querySelector('#m-num'), f = m.querySelector('#m-fmt');
        const set = v => { v = clamp(Math.round(+v || 0), min, max); r.value = v; n.value = v; f.textContent = fmt$(v); };
        r.oninput = () => set(r.value); n.oninput = () => { f.textContent = fmt$(+n.value || 0); };
        n.onchange = () => set(n.value);
        m.querySelectorAll('.rapidos button').forEach(b => b.onclick = () => set(max * +b.dataset.f));
      },
      opciones: [{ t: etiqueta, cls: 'ok', fn: () => { const v = clamp(Math.round(+$('#m-num').value || 0), min, max); fn(v); } }, { t: 'Cancelar' }],
    });
  },
};
const aviso = (titulo, texto, ic) => Modal.mostrar({ titulo, texto, ic });

/* Lee un grupo .selector del modal abierto */
function leerSelector(id) { const b = document.querySelector(`#${id} button.sel`); return b ? b.dataset.v : null; }
function htmlSelector(id, opciones, sel) {
  return `<div class="selector" id="${id}">${opciones.map(([v, t]) => `<button type="button" data-v="${v}" class="${v == sel ? 'sel' : ''}">${t}</button>`).join('')}</div>`;
}
function activarSelectores(m) {
  m.querySelectorAll('.selector').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => { g.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); }));
}

/* ---------- Minijuegos (pantalla completa) ---------- */
const Pantalla = {
  abrir(html) { const m = $('#minijuego'); m.innerHTML = `<div class="mj">${html}</div>`; m.classList.remove('oculto'); return m; },
  cerrar() { $('#minijuego').classList.add('oculto'); $('#minijuego').innerHTML = ''; document.onkeydown = null; actualizar(); },
};
