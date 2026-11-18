'use strict';
/* =========================================================
   EFECTOS: números flotantes, destellos, vibración,
   suspenso y celebraciones con confeti
   ========================================================= */
const Efectos = {
  pend: {}, dineroPrev: null,
  reiniciar() { this.pend = {}; this.dineroPrev = S && S.p ? S.p.dinero : null; },
  registrar(k, d) { if (d) this.pend[k] = (this.pend[k] || 0) + d; },
  mostrar() {
    if (!S || !S.p || !S.p.vivo || $('#app').classList.contains('oculto') || !$('#inicio').classList.contains('oculto')) { this.pend = {}; this.dineroPrev = S && S.p ? S.p.dinero : null; return; }
    const p = S.p;
    if (this.dineroPrev !== null && Math.round(this.dineroPrev) !== Math.round(p.dinero)) {
      const d = p.dinero - this.dineroPrev;
      this.chip($('#dinero-jugador'), `${d > 0 ? '+' : '−'}${fmt$(Math.abs(d))}`, d > 0 ? 'ok' : 'mal');
    }
    this.dineroPrev = p.dinero;
    for (const [k, d] of Object.entries(this.pend)) {
      const el = document.querySelector(`.stat[data-k="${k}"]`);
      if (!el || !d) continue;
      const bueno = k === 'estres' ? d < 0 : d > 0;
      this.chip(el, `${d > 0 ? '+' : ''}${d}`, bueno ? 'ok' : 'mal');
      el.classList.remove('flash-ok', 'flash-mal'); void el.offsetWidth; el.classList.add(bueno ? 'flash-ok' : 'flash-mal');
    }
    this.pend = {};
  },
  chip(el, txt, tipo) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const c = document.createElement('div');
    c.className = 'chip ' + tipo; c.textContent = txt;
    c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top - 4) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  },
  vibrar(patron = 35) { try { if (navigator.vibrate) navigator.vibrate(patron); } catch (e) {} },
  /* Pantalla de espera con puntitos antes de revelar un resultado */
  suspenso(titulo, fn, ms = 1400, ic = '⏳') { Modal.mostrar({ ic, titulo, espera: { ms, fn } }); },
  /* Gran momento: modal dorado + confeti + vibración */
  celebrar(ic, titulo, texto) {
    this.vibrar([30, 40, 70]);
    Modal.mostrar({ ic, titulo, texto, clase: 'celebra', alAbrir: () => this.confeti() });
  },
  confeti() {
    const cont = document.createElement('div'); cont.className = 'confeti';
    const piezas = ['🎉', '✨', '🎊', '⭐', '💫', '🟡', '🟣', '🔵'];
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.textContent = R.pick(piezas);
      s.style.left = R.int(0, 100) + 'vw'; s.style.fontSize = R.int(14, 26) + 'px';
      s.style.animationDuration = R.float(1.6, 2.8) + 's'; s.style.animationDelay = R.float(0, 0.5) + 's';
      cont.appendChild(s);
    }
    document.body.appendChild(cont);
    setTimeout(() => cont.remove(), 3500);
  },
};
