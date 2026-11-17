'use strict';
/* =========================================================
   MINIJUEGOS: pelea por turnos, fuga en laberinto,
   casino (ruleta, blackjack, tragamonedas), lotería,
   examen de manejo
   ========================================================= */
const MOVS = {
  golpe:   { n: '👊 Golpe', vence: 'derribo', pista: 'levanta los puños y se acerca…' },
  patada:  { n: '🦵 Patada', vence: 'golpe', pista: 'cambia el peso a la pierna trasera…' },
  derribo: { n: '🤼 Derribo', vence: 'patada', pista: 'baja el centro de gravedad…' },
  defender:{ n: '🛡️ Defender', vence: null, pista: 'se cubre y espera tu ataque…' },
};

const Minijuegos = {
  /* ---------- Pelea ---------- */
  pelea({ titulo, rival, poder, alFin }) {
    const st = { yo: 100, el: 100, ronda: 0, max: 10, fin: false };
    const estilo = { golpe: R.int(1, 5), patada: R.int(1, 5), derribo: R.int(1, 5), defender: R.int(1, 3) };
    const dYo = 13 * clamp(poder, 10, 120) / 60, dEl = 13 * clamp(rival.fuerza, 10, 120) / 60;
    let plan = this.planRival(estilo);
    const m = Pantalla.abrir(`<h2>${titulo}</h2><p class="nota">Lee las pistas del rival: 👊 vence a 🤼, 🤼 vence a 🦵, 🦵 vence a 👊. 🛡️ reduce el daño.</p>
      <div class="vs"><div><div class="cara">${avatarDe(S.p)}</div><b>Tú</b><div class="nota">Potencia ${Math.round(poder)}</div><div class="hp"><i id="hp-yo" style="width:100%"></i></div></div>
      <div><div class="cara">😠</div><b>${rival.nombre}</b><div class="nota">Potencia ${Math.round(rival.fuerza)}</div><div class="hp"><i id="hp-el" style="width:100%"></i></div></div></div>
      <div class="relato" id="relato"></div><div class="movs" id="movs">${Object.entries(MOVS).map(([k, v]) => `<button class="btn sec" data-m="${k}">${v.n}</button>`).join('')}</div>`);
    const relato = m.querySelector('#relato');
    const pista = () => {
      if (R.chance(0.65)) { const mostrado = R.chance(0.78) ? plan : R.pick(Object.keys(MOVS)); relato.innerHTML = `<span class="pista">Ronda ${st.ronda + 1}: tu rival ${MOVS[mostrado].pista}</span>`; }
      else relato.innerHTML = `<span class="pista">Ronda ${st.ronda + 1}: no logras leer a tu rival.</span>`;
    };
    pista();
    const terminar = () => {
      st.fin = true;
      const gano = st.el <= 0 || (st.yo > 0 && st.yo >= st.el);
      m.querySelector('#movs').innerHTML = `<button class="btn ${gano ? 'ok' : 'peligro'}" id="fin" style="grid-column:1/-1">${gano ? '🏆 ¡Ganaste! Continuar' : '💀 Perdiste. Continuar'}</button>`;
      m.querySelector('#fin').onclick = () => { Pantalla.cerrar(); alFin(gano); actualizar(); };
    };
    m.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      if (st.fin) return;
      const yo = b.dataset.m, el = plan;
      let a = 0, c = 0, txt;
      if (yo === el) { if (yo !== 'defender') { a = dYo * 0.6; c = dEl * 0.6; } txt = `Ambos usan ${MOVS[yo].n}. Intercambio parejo.`; }
      else if (yo === 'defender') { a = dYo * 0.25; c = dEl * 0.3; txt = `Te cubres de su ${MOVS[el].n} y contraatacas.`; }
      else if (el === 'defender') { a = dYo * 0.3; c = dEl * 0.25; txt = `Tu ${MOVS[yo].n} choca contra su guardia.`; }
      else if (MOVS[yo].vence === el) { a = dYo * 1.6; txt = `¡Tu ${MOVS[yo].n} anula su ${MOVS[el].n}! Gran impacto.`; }
      else { c = dEl * 1.6; txt = `Su ${MOVS[el].n} anula tu ${MOVS[yo].n}. ¡Te dio fuerte!`; }
      a *= R.float(0.8, 1.2); c *= R.float(0.8, 1.2);
      st.el = Math.max(0, st.el - a); st.yo = Math.max(0, st.yo - c); st.ronda++;
      m.querySelector('#hp-yo').style.width = st.yo + '%'; m.querySelector('#hp-el').style.width = st.el + '%';
      m.querySelector('#hp-yo').style.background = colorStat('x', st.yo); m.querySelector('#hp-el').style.background = colorStat('x', st.el);
      relato.innerHTML = `<p>${txt}</p>`;
      if (st.yo <= 0 || st.el <= 0 || st.ronda >= st.max) { relato.innerHTML += `<p><b>${st.el <= 0 ? '¡KO! Tu rival cae a la lona.' : st.yo <= 0 ? '¡KO! Caes a la lona.' : 'Fin del combate: deciden los jueces.'}</b></p>`; return terminar(); }
      plan = this.planRival(estilo);
      pista(); relato.insertAdjacentHTML('afterbegin', `<p>${txt}</p>`);
    });
  },
  planRival(estilo) { return R.peso(Object.entries(estilo).map(([k, w]) => [w, k])); },

  /* ---------- Laberinto de fuga ---------- */
  laberinto({ dificultad = 1, alFin }) {
    const N = 11 + dificultad * 2;
    const g = Array.from({ length: N }, () => Array(N).fill(1));
    const pila = [[1, N - 2]]; g[N - 2][1] = 0;
    while (pila.length) {
      const [x, y] = pila[pila.length - 1];
      const vec = R.shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]]).filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx > 0 && ny > 0 && nx < N - 1 && ny < N - 1 && g[ny][nx]; });
      if (!vec.length) { pila.pop(); continue; }
      const [dx, dy] = vec[0]; g[y + dy / 2][x + dx / 2] = 0; g[y + dy][x + dx] = 0; pila.push([x + dx, y + dy]);
    }
    for (let i = 0; i < N * 1.5; i++) { const x = R.int(1, N - 2), y = R.int(1, N - 2); if (g[y][x] && ((g[y][x - 1] === 0 && g[y][x + 1] === 0) || (g[y - 1][x] === 0 && g[y + 1][x] === 0))) g[y][x] = 0; }
    const salida = [N - 2, 1];
    let yo = [1, N - 2];
    const libres = []; for (let y = 1; y < N / 2; y++) for (let x = Math.floor(N / 3); x < N - 1; x++) if (!g[y][x] && !(x === salida[0] && y === salida[1])) libres.push([x, y]);
    let guardia = R.pick(libres.filter(([x, y]) => Math.abs(x - salida[0]) + Math.abs(y - salida[1]) > 3)) || libres[0];
    const pMov = [0, 0.6, 0.72, 0.85][dificultad];
    let fin = false;
    const m = Pantalla.abrir(`<h2>🏃 Fuga de prisión</h2><p class="nota">Llega a la puerta 🚪 sin que el guardia 👮 te atrape. Usa las flechas o el teclado.</p><div class="laberinto" id="lab" style="grid-template-columns:repeat(${N},1fr)"></div>
      <div class="cruceta"><span></span><button data-d="0,-1">⬆️</button><span></span><button data-d="-1,0">⬅️</button><button id="rendirse" title="Rendirse">🏳️</button><button data-d="1,0">➡️</button><span></span><button data-d="0,1">⬇️</button><span></span></div><p class="nota" id="lab-msg"></p>`);
    const pintar = () => {
      m.querySelector('#lab').innerHTML = g.flatMap((fila, y) => fila.map((c, x) => {
        let t = '';
        if (x === yo[0] && y === yo[1]) t = '🧍'; else if (x === guardia[0] && y === guardia[1]) t = '👮'; else if (x === salida[0] && y === salida[1]) t = '🚪';
        return `<div class="${c ? 'muro' : ''}">${t}</div>`;
      })).join('');
    };
    const bfs = (desde, hasta) => {
      const key = ([x, y]) => y * N + x, prev = new Map([[key(desde), null]]), q = [desde];
      while (q.length) { const c = q.shift(); if (c[0] === hasta[0] && c[1] === hasta[1]) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = [c[0] + dx, c[1] + dy]; if (!g[n[1]][n[0]] && !prev.has(key(n))) { prev.set(key(n), c); q.push(n); } } }
      let c = hasta, paso = null; while (c && prev.get(key(c))) { paso = c; c = prev.get(key(c)); if (c[0] === desde[0] && c[1] === desde[1]) break; }
      return paso;
    };
    const cerrar = ok => { fin = true; m.querySelector('#lab-msg').innerHTML = ok ? '<b>¡Lo lograste!</b>' : '<b>¡Te atraparon!</b>'; setTimeout(() => { Pantalla.cerrar(); alFin(ok); actualizar(); }, 900); };
    const mover = (dx, dy) => {
      if (fin) return;
      const n = [yo[0] + dx, yo[1] + dy];
      if (g[n[1]][n[0]]) return;
      yo = n;
      if (yo[0] === salida[0] && yo[1] === salida[1]) { pintar(); return cerrar(true); }
      if (yo[0] === guardia[0] && yo[1] === guardia[1]) { pintar(); return cerrar(false); }
      if (R.chance(pMov)) { const s = bfs(guardia, yo); if (s) guardia = s; }
      pintar();
      if (yo[0] === guardia[0] && yo[1] === guardia[1]) cerrar(false);
    };
    m.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const [dx, dy] = b.dataset.d.split(',').map(Number); mover(dx, dy); });
    m.querySelector('#rendirse').onclick = () => { if (!fin) cerrar(false); };
    document.onkeydown = e => { const k = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key]; if (k) { e.preventDefault(); mover(...k); } };
    pintar();
  },

  /* ---------- Casino ---------- */
  casino() {
    const p = S.p;
    if (p.edad < 18) return toast('Debes ser mayor de edad.');
    if (p.dinero <= 0) return toast('No tienes dinero para apostar.');
    Modal.mostrar({ ic: '🎰', titulo: 'Casino', texto: `<p>Tienes ${fmt$(p.dinero)}. La casa siempre gana… casi siempre.</p>`, opciones: [
      { t: '🎡 Ruleta', fn: () => this.apuesta(v => this.ruleta(v)) },
      { t: '🃏 Blackjack', fn: () => this.apuesta(v => this.blackjack(v)) },
      { t: '🎰 Tragamonedas', fn: () => this.apuesta(v => this.tragamonedas(v)) },
      { t: 'Salir' },
    ] });
  },
  apuesta(fn) {
    const p = S.p;
    if (!usar('casino', 6)) return;
    Modal.numero({ ic: '💵', titulo: '¿Cuánto apuestas?', min: 1, max: Math.max(1, p.dinero), valor: Math.max(1, Math.round(p.dinero * 0.05)), etiqueta: 'Apostar', fn: v => { if (v <= 0 || v > p.dinero) return; p.adic.apuestas = clamp(p.adic.apuestas + 6); fn(v); } });
  },
  pagarApuesta(v, mult, txt) {
    const p = S.p, g = Math.round(v * mult) - v;
    p.dinero += g;
    log(`🎰 ${txt} ${g >= 0 ? 'Ganaste' : 'Perdiste'} ${fmt$(Math.abs(g))} en el casino.`, g >= 0 ? 'bueno' : 'malo');
    mod({ felicidad: g > 0 ? 4 : -3 });
  },
  ruleta(v) {
    Modal.mostrar({ ic: '🎡', titulo: 'Ruleta', texto: `<p>Apuesta: ${fmt$(v)}. ¿A qué?</p>`, opciones: [
      ['🔴 Rojo (×2)', n => n > 0 && n % 2 === 1, 2], ['⚫ Negro (×2)', n => n > 0 && n % 2 === 0, 2], ['1-12 (×3)', n => n >= 1 && n <= 12, 3], ['🍀 Número 7 (×36)', n => n === 7, 36],
    ].map(([t, cond, mult]) => ({ t, fn: () => {
      const n = R.int(0, 36), col = n === 0 ? '🟢' : n % 2 ? '🔴' : '⚫';
      const gana = cond(n);
      this.pagarApuesta(v, gana ? mult : 0, `La bola cayó en ${col} ${n}.`);
      aviso(gana ? '¡Ganaste!' : 'Perdiste', `<div class="ruleta">${col} ${n}</div>`, '🎡');
    } })) });
  },
  blackjack(v) {
    const mazo = R.shuffle([].concat(...['♠', '♥', '♦', '♣'].map(s => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(c => c + s))));
    const val = mano => { let t = 0, a = 0; for (const c of mano) { const r = c.slice(0, -1); if (r === 'A') { a++; t += 11; } else t += ['J', 'Q', 'K'].includes(r) ? 10 : +r; } while (t > 21 && a--) t -= 10; return t; };
    const yo = [mazo.pop(), mazo.pop()], casa = [mazo.pop(), mazo.pop()];
    const fin = () => {
      while (val(casa) < 17) casa.push(mazo.pop());
      const a = val(yo), b = val(casa);
      let mult = a > 21 ? 0 : b > 21 || a > b ? (a === 21 && yo.length === 2 ? 2.5 : 2) : a === b ? 1 : 0;
      this.pagarApuesta(v, mult, `Blackjack: ${a} contra ${b}.`);
      aviso(mult > 1 ? '¡Ganaste!' : mult === 1 ? 'Empate' : 'Perdiste', `<p>Tu mano: <b>${yo.join(' ')}</b> (${a})</p><p>Casa: <b>${casa.join(' ')}</b> (${b})</p>`, '🃏');
    };
    const turno = () => Modal.mostrar({ ic: '🃏', titulo: 'Blackjack', texto: `<p>Tu mano: <b>${yo.join(' ')}</b> (${val(yo)})</p><p>Casa muestra: <b>${casa[0]} 🂠</b></p>`, opciones: val(yo) >= 21 ? [{ t: 'Ver resultado', fn: fin }] : [
      { t: '➕ Pedir carta', fn: () => { yo.push(mazo.pop()); if (val(yo) > 21) fin(); else turno(); } },
      { t: '✋ Plantarse', fn: fin },
    ] });
    turno();
  },
  tragamonedas(v) {
    const s = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
    const r = [R.pick(s), R.pick(s), R.pick(s)];
    const mult = r[0] === r[1] && r[1] === r[2] ? (r[0] === '7️⃣' ? 50 : r[0] === '💎' ? 20 : 8) : (r[0] === r[1] || r[1] === r[2]) ? 1.5 : 0;
    this.pagarApuesta(v, mult, `Tragamonedas: ${r.join(' ')}.`);
    aviso(mult > 1 ? '¡Premio!' : 'Sin suerte', `<div class="ruleta">${r.join(' ')}</div>`, '🎰');
  },

  /* ---------- Lotería ---------- */
  loteria() {
    const p = S.p, precio = Math.max(1, Math.round(2 * eco()));
    if (p.edad < 18) return toast('Debes ser mayor de edad.');
    Modal.mostrar({ ic: '🎟️', titulo: 'Lotería nacional', texto: `<p>Cada boleto cuesta ${fmt$(precio)}. Premio mayor: ~${fmt$(15e6 * Math.max(eco(), 0.4))}. Probabilidad del premio mayor: 1 entre 1.500.000 por boleto.</p>`, opciones: [1, 10, 100].map(n => ({ t: `🎟️ Comprar ${n} boleto${n > 1 ? 's' : ''} (${fmt$(precio * n)})`, dis: p.dinero < precio * n, fn: () => {
      if (!usar('loteria', 3)) return;
      p.dinero -= precio * n;
      let premio = 0, mayor = false;
      for (let i = 0; i < n; i++) { const x = Math.random(); if (x < 1 / 1500000) { premio += Math.round(15e6 * Math.max(eco(), 0.4) * R.float(0.6, 2)); mayor = true; } else if (x < 1 / 6000) premio += precio * 1000; else if (x < 1 / 60) premio += precio * 10; }
      if (mayor) { p.dinero += premio; mod({ felicidad: 30, fama: 10 }); log(`🎉🎉 ¡GANASTE EL PREMIO MAYOR DE LA LOTERÍA: ${fmt$(premio)}!`, 'raro'); Estado.darLogro('loteria'); aviso('¡¡PREMIO MAYOR!!', `<p>Ganaste <b>${fmt$(premio)}</b>.</p><p class="nota">Cuidado: familiares lejanos ya empiezan a llamarte…</p>`, '🤑'); }
      else if (premio) { p.dinero += premio; log(`🎟️ Ganaste ${fmt$(premio)} en la lotería.`, 'bueno'); toast(`🎟️ +${fmt$(premio)}`); }
      else { log(`Compraste ${n} boleto${n > 1 ? 's' : ''} de lotería. Nada.`); toast('Sin premio.'); }
    } })).concat([{ t: 'Cancelar' }]) });
  },

  /* ---------- Examen de manejo ---------- */
  examenManejo() {
    const p = S.p;
    if (p.licencia) return toast('Ya tienes licencia.');
    if (!usar('manejo', 2)) return;
    const preguntas = R.shuffle([
      { q: 'El semáforo está en amarillo y estás cerca del cruce. ¿Qué haces?', o: [['Freno con precaución si puedo detenerme a tiempo.', 1], ['Acelero para pasar.', 0], ['Toco la bocina.', 0]] },
      { q: 'Un peatón está cruzando por el paso de cebra.', o: [['Me detengo y espero a que termine de cruzar.', 1], ['Paso por detrás de él.', 0], ['Le hago señas para que se apure.', 0]] },
      { q: 'Tomaste dos cervezas en una fiesta.', o: [['No manejo: pido un taxi.', 1], ['Manejo despacio.', 0], ['Tomo un café y manejo.', 0]] },
      { q: 'Escuchas una sirena de ambulancia detrás de ti.', o: [['Me orillo y le cedo el paso.', 1], ['Acelero para no estorbar.', 0], ['Sigo igual.', 0]] },
    ]).slice(0, 3);
    let pts = 0, i = 0;
    const sig = () => {
      if (i >= preguntas.length) {
        const ok = pts >= 2 && R.chance(0.55 + p.st.inteligencia / 250);
        if (ok) { p.licencia = true; log('🚗 ¡Aprobaste el examen de manejo y obtuviste tu licencia!', 'bueno'); aviso('¡Aprobado!', `<p>${pts}/3 en la teoría y buen desempeño en la práctica.</p>`, '🪪'); }
        else { log('Reprobaste el examen de manejo.', 'malo'); aviso('Reprobado', `<p>${pts}/3 en la teoría. ${pts >= 2 ? 'Fallaste en la práctica (te subiste a la vereda).' : ''}</p>`, '🚧'); }
        return;
      }
      const pr = preguntas[i++];
      Modal.mostrar({ ic: '🪪', titulo: `Examen de manejo (${i}/3)`, texto: `<p>${pr.q}</p>`, opciones: R.shuffle(pr.o).map(([t, v]) => ({ t, fn: () => { pts += v; sig(); } })) });
    };
    sig();
  },
};
