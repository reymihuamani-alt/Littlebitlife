'use strict';
/* =========================================================
   RELACIONES: familia, amigos, citas, matrimonio, hijos,
   mascotas, herencias
   ========================================================= */
const MASCOTAS = [
  { t: 'Perro', ic: '🐕', vida: [10, 15], costo: 300 }, { t: 'Gato', ic: '🐈', vida: [12, 18], costo: 200 },
  { t: 'Loro', ic: '🦜', vida: [20, 40], costo: 400 }, { t: 'Hámster', ic: '🐹', vida: [2, 3], costo: 30 },
  { t: 'Tortuga', ic: '🐢', vida: [30, 60], costo: 80 }, { t: 'Conejo', ic: '🐇', vida: [7, 10], costo: 60 },
];
const NOMBRES_MASCOTA = ['Firulais', 'Luna', 'Max', 'Coco', 'Rocky', 'Nala', 'Toby', 'Kira', 'Simón', 'Pelusa', 'Chispa', 'Lola', 'Bruno', 'Canela'];

const Relaciones = {
  icono(r) {
    if (!r.vivo) return '🪦';
    if (r.real) return r.genero === 'F' ? '👸' : '🤴';
    if (r.edad < 3) return '👶'; if (r.edad < 13) return r.genero === 'F' ? '👧' : '👦';
    if (r.edad < 65) return r.genero === 'F' ? '👩' : '👨';
    return r.genero === 'F' ? '👵' : '👴';
  },
  panel() {
    Panel.abrir('Relaciones', () => {
      const p = S.p, its = [];
      const grupo = (titulo, lista) => { if (!lista.length) return; its.push({ sec: titulo }); for (const r of lista) its.push({ ic: this.icono(r), t: `${r.nombre} ${r.apellido}${r.titulo ? ' · ' + r.titulo : ''}`, s: `${etiquetaRel(r)} · ${r.vivo ? r.edad + ' años' : 'fallecid' + gx(r, 'o', 'a')}${r.profesion && r.vivo && r.edad >= 18 ? ' · ' + r.profesion : ''}`, der: r.vivo ? `❤️ ${r.cercania}%` : '', fn: r.vivo ? () => this.persona(r) : null }); };
      grupo('Padres', p.rel.filter(r => r.tipo === 'padre' || r.tipo === 'madre'));
      grupo('Hermanos', p.rel.filter(r => r.tipo === 'hermano' && r.edad >= 0));
      grupo('Pareja', p.rel.filter(r => (r.tipo === 'pareja' || r.tipo === 'conyuge') && r.vivo));
      grupo('Hijos', p.rel.filter(r => r.tipo === 'hijo'));
      grupo('Nietos', p.rel.filter(r => r.tipo === 'nieto'));
      grupo('Amigos', p.rel.filter(r => r.tipo === 'amigo' && r.vivo));
      grupo('Exparejas', p.rel.filter(r => r.tipo === 'ex' && r.vivo).slice(-6));
      const mas = p.mascotas.filter(m => m.vivo);
      if (mas.length) { its.push({ sec: 'Mascotas' }); for (const m of mas) its.push({ ic: m.ic, t: m.nombre, s: `${m.t} · ${m.edad} años`, fn: () => this.mascota(m) }); }
      its.push({ sec: 'Conocer gente' });
      if (p.edad >= 6) its.push({ ic: '🙋', t: 'Hacer nuevos amigos', fn: () => { if (!usar('amigos', 2)) return; if (R.chance(0.6 + (p.st.felicidad - 50) / 200)) this.nuevoAmigo(p.edad < 18 ? 'en el colegio' : 'en un evento'); else toast('No conectaste con nadie esta vez.'); } });
      if (p.edad >= 16 && !p.carcel) its.push({ ic: '💘', t: 'Buscar pareja', s: pareja() ? 'Ya tienes pareja… ¿seguro?' : 'Citas y apps', fn: () => this.citas() });
      if (p.edad >= 21 && !p.carcel) its.push({ ic: '🥂', t: 'Gala de la alta sociedad', s: 'Conoce gente rica… o de la realeza', dis: p.st.fama < 40 && patrimonio() < 1e6 ? 'Necesitas fama 40 o patrimonio de $1 M.' : false, fn: () => this.gala() });
      if (p.edad >= 25 && !p.carcel) its.push({ ic: '🧸', t: 'Adoptar un niño', s: `Trámite ~${fmt$(15000 * eco())}`, fn: () => this.adoptar() });
      if (p.edad >= 6) its.push({ ic: '🐾', t: 'Adoptar una mascota', fn: () => this.adoptarMascota() });
      return its;
    });
  },

  persona(r) {
    Panel.abrir(`${r.nombre} ${r.apellido}`, () => {
      const p = S.p;
      if (!r.vivo) return [{ info: `${r.nombre} falleció.` }];
      const its = [{ kv: [['Relación', etiquetaRel(r)], ['Edad', r.edad], ['Profesión', r.edad < 18 ? 'Estudiante' : r.profesion || '—'], ['Dinero', r.edad >= 18 ? fmt$(r.dinero) : '—']] }, { barra: ['Cercanía', r.cercania] }];
      if (r.tipo === 'amigo' && r.chispa > 0 && this.puedeRomance(r)) its.push({ barra: ['💗 Chispa', r.chispa, '#e8508a'] });
      const a = (ic, t, fn, s, dis) => its.push({ ic, t, s, fn, dis });
      const accion = (clave, max, fn) => () => { if (!usar(clave + r.id, max)) return; fn(); };
      if (p.carcel) { a('📞', 'Llamar desde prisión', accion('llamar', 1, () => { r.cercania = clamp(r.cercania + R.int(2, 8)); log(`Llamaste a ${r.nombre} desde prisión.`); })); return its; }
      a('⏳', 'Pasar tiempo juntos', accion('tiempo', 2, () => { r.cercania = clamp(r.cercania + R.int(4, 10)); mod({ felicidad: 3 }); log(`Pasaste tiempo con ${r.nombre}.`); }));
      a('💬', 'Conversar', accion('conv', 2, () => { const d = R.chance(0.85) ? R.int(2, 6) : -R.int(2, 6); r.cercania = clamp(r.cercania + d); log(d > 0 ? `Tuviste una linda conversación con ${r.nombre}.` : `La conversación con ${r.nombre} terminó en discusión.`, d > 0 ? '' : 'malo'); }));
      a('😊', 'Hacer un cumplido', accion('cumplido', 1, () => { r.cercania = clamp(r.cercania + R.int(2, 7)); log(`Le dijiste algo bonito a ${r.nombre}.`); }));
      if (p.edad >= 12) a('🎁', 'Dar un regalo', () => this.regalo(r));
      if (['padre', 'madre'].includes(r.tipo) || (r.tipo === 'conyuge' && r.dinero > 1000) || (r.tipo === 'hijo' && r.edad >= 22)) a('💰', 'Pedir dinero', accion('pedir', 1, () => this.pedirDinero(r)));
      if (r.tipo === 'hijo' && r.edad < 18) {
        a('📚', 'Ayudar con las tareas', accion('tareas', 1, () => { r.int = clamp(r.int + R.int(2, 5)); r.cercania = clamp(r.cercania + 4); log(`Ayudaste a ${r.nombre} con sus tareas.`); }));
        a('🧭', 'Darle un consejo de vida', accion('consejo', 1, () => { r.cercania = clamp(r.cercania + 3); log(`Le diste un buen consejo a ${r.nombre}.`); }));
      }
      if (r.tipo === 'hijo' && r.edad >= 18) a('💸', 'Darle dinero', () => Modal.numero({ titulo: `Darle dinero a ${r.nombre}`, max: Math.max(0, p.dinero), valor: Math.max(0, p.dinero * 0.05), fn: v => { p.dinero -= v; r.dinero += v; r.cercania = clamp(r.cercania + Math.min(20, Math.round(v / (2000 * eco())))); log(`Le diste ${fmt$(v)} a ${r.nombre}.`); } }));
      if (['padre', 'madre'].includes(r.tipo) && r.edad >= 70) a('🫶', 'Cuidar de tu ' + etiquetaRel(r).toLowerCase(), accion('cuidar', 1, () => { r.cercania = clamp(r.cercania + 8); mod({ karma: 3, estres: 3 }); log(`Cuidaste de ${r.nombre} en su vejez.`, 'bueno'); }));
      if (r.tipo === 'amigo' && this.puedeRomance(r)) {
        a('😏', 'Coquetear', accion('coquetear', 2, () => this.coquetear(r)), `Sube la chispa (${usosRestantes('coquetear' + r.id, 2)} restantes este año)`);
        a('💌', 'Confesar lo que sientes', accion('confesar', 1, () => this.confesar(r)), r.chispa >= 40 ? 'Hay química… ¿te animas?' : 'Arriesgado si no hay chispa', pareja() ? 'Ya tienes pareja.' : false);
      }
      if (r.tipo === 'pareja') {
        a('🌹', 'Salir en una cita romántica', accion('cita', 2, () => { const c = Math.round(R.int(50, 300) * eco()); p.dinero -= c; r.cercania = clamp(r.cercania + R.int(5, 12)); mod({ felicidad: 5 }); log(`Saliste en una cita romántica con ${r.nombre}.`); }));
        a('💍', 'Proponer matrimonio', () => this.proponer(r), '', p.edad < 18 ? 'Debes ser mayor de edad.' : false);
        a('👶', 'Intentar tener un hijo', () => this.tenerHijo(r), '', p.edad < 18 ? 'Eres menor de edad.' : false);
        a('💔', 'Terminar la relación', () => this.terminar(r));
      }
      if (r.tipo === 'conyuge') {
        a('👶', 'Intentar tener un hijo', () => this.tenerHijo(r));
        a('✈️', 'Viaje romántico', accion('viajeRom', 1, () => { const c = Math.round(3000 * eco()); if (p.dinero < c) return toast('No te alcanza.'); p.dinero -= c; r.cercania = clamp(r.cercania + 15); mod({ felicidad: 8, estres: -8 }); p.cont.viajes++; log(`Hiciste un viaje romántico con ${r.nombre}.`, 'bueno'); }));
        a('🛋️', 'Terapia de pareja', accion('terapiaP', 1, () => { const c = Math.round(1500 * eco()); p.dinero -= c; r.cercania = clamp(r.cercania + R.int(6, 18)); log('Fueron a terapia de pareja.'); }));
        a('📄', 'Pedir el divorcio', () => this.divorcio(r));
      }
      if (r.tipo === 'ex') a('🔁', 'Intentar volver', accion('volver', 1, () => { if (!pareja() && R.chance(r.cercania / 200)) { r.tipo = 'pareja'; r.anios = 0; log(`Volviste con ${r.nombre}.`, 'bueno'); } else log(`${r.nombre} no quiere volver contigo.`, 'malo'); }));
      a('😠', 'Discutir', accion('discutir', 1, () => { r.cercania = clamp(r.cercania - R.int(5, 15)); mod({ estres: -2 }); log(`Discutiste con ${r.nombre}.`, 'malo'); }));
      a('🤬', 'Insultar', accion('insultar', 1, () => { r.cercania = clamp(r.cercania - R.int(10, 25)); mod({ karma: -2 }); log(`Insultaste a ${r.nombre}.`, 'malo'); }));
      if (r.tipo === 'amigo') a('🚫', 'Terminar la amistad', () => { r.vivo = false; r.tipo = 'borrado'; log(`Terminaste tu amistad con ${r.nombre}.`); Panel.atras(); });
      return its;
    });
  },
  /* Romance solo entre adolescentes de edad parecida o entre adultos */
  puedeRomance(r) {
    const a = S.p.edad, b = r.edad;
    if (a < 13 || b < 13) return false;
    if (a < 18 || b < 18) return a < 18 && b < 18 && Math.abs(a - b) <= 3;
    return true;
  },
  hacerPareja(r, texto) {
    const p = S.p;
    r.tipo = 'pareja'; r.anios = 0; r.cercania = clamp(r.cercania + 10); r.chispa = 0;
    p.cont.parejas++; mod({ felicidad: 12 });
    log(texto || `💕 ¡Tú y ${r.nombre} pasaron de amigos a pareja!`, 'raro');
    Efectos.celebrar('💕', '¡De amigos a pareja!', `<p>Tú y <b>${r.nombre}</b> ahora están juntos.</p>`);
  },
  coquetear(r) {
    const p = S.p;
    Rasgos.pista('carisma');
    const sube = R.int(6, 16) + (Rasgos.tiene('carisma') ? 6 : 0) + Math.round((p.st.apariencia - 50) / 10);
    if (R.chance(0.18)) { r.cercania = clamp(r.cercania - 6); log(`Coqueteaste con ${r.nombre}, pero fue incómodo para ambos.`, 'malo'); return toast('😬 Momento incómodo…'); }
    r.chispa = clamp((r.chispa || 0) + Math.max(3, sube));
    const reacciones = r.chispa >= 70 ? [`${r.nombre} se puso roj${gx(r, 'o', 'a')} y no dejó de sonreír.`, `${r.nombre} te devolvió el coqueteo sin disimulo.`] : r.chispa >= 40 ? [`${r.nombre} se rió nerviosamente.`, `${r.nombre} te miró de una forma distinta.`] : [`${r.nombre} no pareció darse cuenta.`, `${r.nombre} creyó que bromeabas.`];
    log(`😏 Coqueteaste con ${r.nombre}. ${R.pick(reacciones)}`);
    toast(`💗 Chispa ${r.chispa}%`);
  },
  confesar(r) {
    const p = S.p;
    if (pareja()) return toast('Ya tienes pareja.');
    const prob = (r.chispa || 0) / 120 + r.cercania / 400 + (Rasgos.tiene('carisma') ? 0.1 : 0) + (p.st.apariencia - r.apa) / 300;
    Efectos.suspenso('💌 Le dices lo que sientes…', () => {
      if (R.chance(clamp(prob * 100, 3, 92) / 100)) this.hacerPareja(r, `💕 Le confesaste tus sentimientos a ${r.nombre}… ¡y siente lo mismo!`);
      else {
        r.chispa = 0; mod({ felicidad: -8 });
        if (R.chance(0.3)) { r.cercania = clamp(r.cercania - 25); log(`💔 ${r.nombre} no siente lo mismo y ahora la amistad está rara.`, 'malo'); }
        else { r.cercania = clamp(r.cercania - 8); log(`💔 ${r.nombre} te dijo que te quiere… pero como amig${gx(p, 'o', 'a')}.`, 'malo'); }
        aviso('Zona de amigos', `<p>"Eres muy especial para mí, pero no te veo de esa forma."</p>`, '💔');
      }
    }, 1500, '💌');
  },
  /* Tu amigo o amiga se enamora de ti */
  enamorado(r) {
    const p = S.p, pa = pareja();
    Modal.mostrar({ ic: '💘', titulo: `${r.nombre} está enamorad${gx(r, 'o', 'a')} de ti`, texto: `<p>${r.nombre} te cuenta, muy nervios${gx(r, 'o', 'a')}, que hace tiempo siente algo más que amistad por ti.</p>${pa ? `<p>Pero tú estás con ${pa.nombre}…</p>` : ''}`, opciones: [
      op(pa ? `Dejar a ${pa.nombre} por ${r.nombre}` : 'Yo también siento lo mismo', () => { if (pa) { if (pa.tipo === 'conyuge') Relaciones.divorcio(pa); else Relaciones.terminar(pa); } this.hacerPareja(r, `💕 ${r.nombre} se te declaró y empezaron a salir.`); }),
      op('Prefiero que sigamos siendo amigos', () => { r.chispa = 0; if (R.chance(0.35)) { r.cercania = clamp(r.cercania - 25); log(`${r.nombre} se alejó un poco después de que l${gx(r, 'o', 'a')} rechazaras.`, 'malo'); } else { r.cercania = clamp(r.cercania - 5); log(`Le dijiste a ${r.nombre} que prefieres su amistad. Lo entendió.`); } }),
      op('Necesito pensarlo', () => { r.chispa = clamp((r.chispa || 0) + 25); log(`Le pediste tiempo a ${r.nombre} para pensarlo.`); }),
    ] });
  },
  regalo(r) {
    const p = S.p;
    const ops = [['🍫 Chocolates', 20], ['💐 Flores', 60], ['📱 Un teléfono nuevo', 800], ['⌚ Un reloj caro', 5000], ['🚗 Un auto', 25000]].map(([t, c]) => {
      const costo = Math.round(c * eco());
      return { t: `${t} — ${fmt$(costo)}`, dis: p.dinero < costo, fn: () => { if (!usar('regalo' + r.id, 2)) return; p.dinero -= costo; r.cercania = clamp(r.cercania + Math.min(25, 3 + Math.round(Math.log10(c) * 4))); log(`Le regalaste ${t.slice(t.indexOf(' ') + 1).toLowerCase()} a ${r.nombre}.`); } };
    });
    Modal.mostrar({ ic: '🎁', titulo: `Regalo para ${r.nombre}`, opciones: [...ops, { t: 'Cancelar' }] });
  },
  pedirDinero(r) {
    const p = S.p;
    const prob = r.cercania / 120 + (r.dinero > 50000 * eco() ? 0.2 : 0);
    if (r.dinero > 100 && R.chance(prob)) {
      const m = Math.max(10, Math.round(Math.min(r.dinero * R.float(0.005, 0.04), (p.edad < 18 ? 200 : 20000) * Math.max(eco(), r.real ? 5 : 0.3))));
      r.dinero -= m; p.dinero += m; r.cercania = clamp(r.cercania - 3);
      log(`${r.nombre} te dio ${fmt$(m)}.`, 'bueno'); toast(`💰 +${fmt$(m)}`);
    } else { r.cercania = clamp(r.cercania - 6); log(`${r.nombre} se negó a darte dinero.`, 'malo'); toast('Te dijo que no.'); }
  },
  nuevoAmigo(donde) {
    const p = S.p;
    const a = Estado.persona({ tipo: 'amigo', edad: clamp(p.edad + R.int(-3, 3), 4, 110), clase: 'media' });
    a.cercania = R.int(40, 70);
    if (a.edad < 18) { a.profesion = null; a.dinero = 0; }
    p.rel.push(a);
    log(`🤝 Hiciste un${gx(a, '', 'a')} nuev${gx(a, 'o', 'a')} amig${gx(a, 'o', 'a')} ${donde}: ${a.nombre}.`, 'bueno');
    mod({ felicidad: 3 });
  },

  /* ---------- Citas ---------- */
  citas() {
    const p = S.p;
    Modal.mostrar({ ic: '💘', titulo: '¿Qué buscas?', texto: '<p>¿A quién te gustaría conocer?</p>', opciones: [
      { t: '👨 Hombres', fn: () => this.candidatos('M') }, { t: '👩 Mujeres', fn: () => this.candidatos('F') }, { t: '🌈 Me da igual', fn: () => this.candidatos(null) },
    ] });
  },
  candidatos(genero, gala = false) {
    const p = S.p;
    if (!usar(gala ? 'gala' : 'citas', gala ? 1 : 2)) return;
    const lista = [0, 1, 2].map(() => {
      const c = Estado.persona({ tipo: 'pareja', genero: genero || (R.chance(0.5) ? 'M' : 'F'), edad: clamp(p.edad + R.int(-5, 6), 16, 99), clase: gala ? R.pick(['alta', 'rica']) : R.pick(['pobre', 'media', 'media', 'alta']) });
      if (c.edad < 18) { c.profesion = 'Estudiante'; c.dinero = 0; }
      if (gala && R.chance(0.22)) {
        const pr = R.pick(Object.keys(CASAS_REALES));
        c.real = true; c.paisReal = pr; c.apellido = CASAS_REALES[pr]; c.titulo = `${c.genero === 'F' ? 'Princesa' : 'Príncipe'} de ${pr}`; c.profesion = 'Realeza'; c.dinero = R.int(5e6, 4e7);
      }
      return c;
    });
    Modal.mostrar({
      ic: gala ? '🥂' : '📱', titulo: gala ? 'En la gala conoces a…' : 'Coincidencias',
      texto: '<p>¿A quién invitas a salir?</p>',
      opciones: lista.map(c => ({ t: `${this.icono(c)} ${c.nombre}${c.titulo ? ' · <b>' + c.titulo + '</b>' : ''}, ${c.edad} · ${c.profesion} · ✨${c.apa}%`, fn: () => this.invitar(c) })).concat([{ t: 'Nadie me convence' }]),
    });
  },
  invitar(c) {
    const p = S.p;
    const actual = pareja();
    Rasgos.pista('carisma');
    let prob = 0.45 + (Rasgos.tiene('carisma') ? 0.12 : 0) + (p.st.apariencia - c.apa) / 120 + p.st.fama / 250 + (patrimonio() > 1e6 ? 0.1 : 0) + (p.st.felicidad - 50) / 300;
    if (c.real) prob -= 0.25 - p.st.fama / 300;
    if (R.chance(clamp(prob * 100, 5, 92) / 100)) {
      if (actual) {
        mod({ karma: -6 });
        if (R.chance(0.45)) { log(`💥 ${actual.nombre} descubrió que l${gx(actual, 'o', 'a')} engañabas con ${c.nombre}.`, 'malo'); if (actual.tipo === 'conyuge') this.divorcio(actual, true); else this.terminar(actual, true); }
        else log(`Tuviste una aventura secreta con ${c.nombre}.`, 'raro');
        if (pareja()) return;
      }
      c.tipo = 'pareja'; c.cercania = R.int(55, 80); c.anios = 0;
      p.rel.push(c); p.cont.parejas++;
      log(`💕 Empezaste a salir con <b>${c.nombre}</b>${c.titulo ? ', ' + c.titulo : ''}.`, 'bueno');
      mod({ felicidad: 10 });
    } else { mod({ felicidad: -4 }); log(`${c.nombre} rechazó tu invitación.`, 'malo'); toast('Te rechazó 💔'); }
  },
  gala() {
    const p = S.p, c = Math.round(20000 * Math.max(eco(), 0.5));
    if (p.dinero < c) return toast(`La entrada cuesta ${fmt$(c)}.`);
    Modal.mostrar({ ic: '🥂', titulo: 'Gala benéfica', texto: `<p>La entrada cuesta ${fmt$(c)}. ¿A quién te interesa conocer?</p>`, opciones: [
      { t: '👨 Hombres', fn: () => { p.dinero -= c; mod({ fama: 1 }); this.candidatos('M', true); } },
      { t: '👩 Mujeres', fn: () => { p.dinero -= c; mod({ fama: 1 }); this.candidatos('F', true); } },
      { t: 'Cancelar' },
    ] });
  },

  /* ---------- Compromiso y matrimonio ---------- */
  proponer(r) {
    const p = S.p;
    if (!usar('proponer', 1)) return;
    const prob = r.cercania / 110 + Math.min(r.anios, 4) * 0.07 - (r.real ? 0.15 : 0) + (p.objetos && p.objetos.anillo ? 0.12 : 0);
    if (!R.chance(clamp(prob * 100, 5, 95) / 100)) { r.cercania = clamp(r.cercania - 15); mod({ felicidad: -12 }); log(`💔 ${r.nombre} rechazó tu propuesta de matrimonio.`, 'malo'); return aviso('Te dijo que no', '<p>Quizás fue muy pronto…</p>', '💔'); }
    Modal.mostrar({
      ic: '💍', titulo: '¡Dijo que sí!', texto: `<p>${r.nombre} aceptó casarse contigo. ¿Qué tipo de boda quieren?</p>`,
      html: `<label class="chk"><input type="checkbox" id="m-prenup"> Proponer acuerdo prenupcial</label>`,
      opciones: [['Civil sencilla', 2000], ['Boda tradicional', 20000], ['Boda de lujo', 150000], ['Boda de ensueño en una isla', 1500000]].map(([n, c]) => {
        const costo = Math.round(c * eco());
        return { t: `${n} — ${fmt$(costo)}`, dis: p.dinero < costo && c > 2000, fn: () => {
          const pre = $('#m-prenup').checked;
          p.dinero -= costo;
          let prenup = false;
          if (pre) { if (R.chance(0.65)) prenup = true; else { r.cercania = clamp(r.cercania - 10); log(`${r.nombre} se ofendió por el acuerdo prenupcial y no lo firmó.`, 'malo'); } }
          this.casarse(r, prenup, n);
        } };
      }),
    });
  },
  casarse(r, prenup, tipoBoda) {
    const p = S.p;
    r.tipo = 'conyuge'; r.prenup = prenup; r.anios = 0;
    p.cont.matrimonios++;
    log(`💒 ¡Te casaste con <b>${r.nombre}</b> (${tipoBoda.toLowerCase()})${prenup ? ', con acuerdo prenupcial' : ''}!`, 'raro');
    Efectos.celebrar('💒', '¡Recién casad' + gx(p, 'o', 'a') + 's!', `<p>Tú y <b>${r.nombre}</b> se dieron el sí.</p>`);
    if (p.st.fama >= 40) Noticias.emitir(`Boda del año: ${p.nombre} ${p.apellido} se casó con ${r.nombre}.`);
    mod({ felicidad: 18 });
    Estado.darLogro('casado');
    if (r.real) Realeza.casarConRealeza(r);
  },
  terminar(r, silencioso) {
    const p = S.p;
    r.tipo = 'ex'; r.cercania = clamp(r.cercania - 35);
    if (!silencioso) log(`💔 Terminaste con ${r.nombre}.`, 'malo');
    mod({ felicidad: -10 });
  },
  divorcio(r, porEl) {
    const p = S.p;
    r.tipo = 'ex'; r.cercania = clamp(r.cercania - 40);
    let perdida = 0;
    if (!r.prenup && patrimonio() > r.dinero) {
      const liq = p.dinero > 0 ? Math.round(p.dinero * 0.5) : 0;
      p.dinero -= liq; perdida += liq;
      for (const k in p.inv) { const m = Math.round(p.inv[k] * 0.5); p.inv[k] -= m; perdida += m; }
      for (const b of p.bienes.filter(b => b.tipo === 'casa')) { const m = Math.round(b.valor * 0.5); p.dinero -= m; perdida += m; }
      r.dinero += perdida;
    }
    const abogados = Math.round(8000 * eco()); p.dinero -= abogados;
    if (p.esp.realeza && p.esp.realeza.consorte && r.real) { log('Perdiste tu título real con el divorcio.', 'malo'); p.esp.realeza = null; }
    log(`📄 Te divorciaste de ${r.nombre}.${perdida ? ` Por no tener acuerdo prenupcial perdiste ${fmt$(perdida)}.` : ''}`, 'malo');
    mod({ felicidad: -15, estres: 10 });
  },

  /* ---------- Hijos ---------- */
  tenerHijo(r) {
    const p = S.p;
    if (!usar('hijo', 1)) return;
    const mujer = p.genero === 'F' ? p : r.genero === 'F' ? r : null;
    if (p.genero === r.genero) {
      return Modal.mostrar({ ic: '👶', titulo: 'Formar una familia', texto: '<p>Como pareja del mismo sexo, ¿cómo quieren tener un hijo?</p>', opciones: [
        { t: `🧸 Adopción (~${fmt$(15000 * eco())})`, fn: () => this.adoptar(r) },
        { t: `🧬 Gestación subrogada / FIV (~${fmt$(90000 * eco())})`, dis: p.dinero < 90000 * eco(), fn: () => { p.dinero -= Math.round(90000 * eco()); if (R.chance(0.6)) this.nacer(r); else log('El tratamiento no funcionó esta vez.', 'malo'); } },
        { t: 'Cancelar' },
      ] });
    }
    const e = mujer.edad;
    const prob = e < 30 ? 0.65 : e < 35 ? 0.5 : e < 40 ? 0.3 : e < 45 ? 0.1 : 0;
    if (R.chance(prob)) this.nacer(r);
    else if (e >= 45) aviso('No es posible', '<p>A esta edad un embarazo natural es casi imposible. Pueden considerar la adopción.</p>', '🩺');
    else { log('Lo intentaron, pero no hubo embarazo este año.'); toast('Sin embarazo este año.'); }
  },
  nacer(otro, adoptado = false, edad = 0) {
    const p = S.p;
    const g = R.chance(0.5) ? 'M' : 'F';
    const h = Estado.persona({ tipo: 'hijo', genero: g, edad, apellido: p.apellido });
    h.cercania = 90; h.profesion = null; h.dinero = 0;
    h.apa = adoptado ? statAleatoria() : clamp(Math.round((p.st.apariencia + (otro ? otro.apa : 50)) / 2 + R.int(-15, 15)));
    h.int = adoptado ? statAleatoria() : clamp(Math.round((p.st.inteligencia + (otro ? otro.int : 50)) / 2 + R.int(-15, 15)));
    h.otroPadre = otro ? otro.id : null; h.adoptado = adoptado;
    Modal.mostrar({
      ic: g === 'F' ? '👧' : '👦', titulo: adoptado ? '¡Nueva familia!' : `¡Es un${g === 'F' ? 'a niña' : ' niño'}!`,
      texto: `<p>¿Cómo se llamará ${adoptado ? `tu hij${gx(h, 'o', 'a')} adoptiv${gx(h, 'o', 'a')}` : 'el bebé'}?</p>`,
      html: `<input type="text" id="m-txt" maxlength="20" value="${h.nombre}">`,
      opciones: [{ t: 'Confirmar', cls: 'ok', fn: () => {
        h.nombre = ($('#m-txt').value || '').trim() || h.nombre;
        p.rel.push(h); p.cont.hijos++;
        log(adoptado ? `🧸 Adoptaste a <b>${esc(h.nombre)}</b> (${edad} años).` : `👶 ¡Nació tu hij${gx(h, 'o', 'a')} <b>${esc(h.nombre)}</b>!`, 'raro');
        Efectos.vibrar([30, 40, 70]); Efectos.confeti();
        mod({ felicidad: 15, estres: 6 });
        Estado.darLogro('padre');
        if (p.esp.realeza) Realeza.nacimientoHeredero(h);
      } }],
    });
  },
  adoptar(otro) {
    const p = S.p, c = Math.round(15000 * eco());
    if (p.dinero < c) return toast(`La adopción cuesta ${fmt$(c)}.`);
    if (p.antecedentes > 1) return aviso('Solicitud rechazada', '<p>Tus antecedentes penales impiden la adopción.</p>', '🚫');
    if (!usar('adoptar', 1)) return;
    p.dinero -= c;
    this.nacer(otro || pareja(), true, R.int(0, 9));
  },

  /* ---------- Mascotas ---------- */
  adoptarMascota() {
    const p = S.p;
    Modal.mostrar({ ic: '🐾', titulo: 'Adoptar una mascota', texto: p.edad < 18 ? '<p>Tus padres tienen que aceptar…</p>' : '', opciones: MASCOTAS.map(m => ({ t: `${m.ic} ${m.t} — ${fmt$(m.costo * eco())}`, fn: () => {
      if (p.edad < 18 && R.chance(0.5)) { log('Tus padres no te dejaron tener una mascota.', 'malo'); return; }
      const c = Math.round(m.costo * eco()); if (p.edad >= 18 && p.dinero < c) return toast('No te alcanza.');
      if (p.edad >= 18) p.dinero -= c;
      const x = { id: uid(), t: m.t, ic: m.ic, nombre: R.pick(NOMBRES_MASCOTA), edad: R.int(0, 2), vida: R.int(m.vida[0], m.vida[1]), vivo: true };
      p.mascotas.push(x); mod({ felicidad: 6 });
      log(`🐾 Adoptaste un${m.t === 'Tortuga' ? 'a' : ''} ${m.t.toLowerCase()} llamad${m.t === 'Tortuga' ? 'a' : 'o'} <b>${x.nombre}</b>.`, 'bueno');
    } })).concat([{ t: 'Cancelar' }]) });
  },
  mascota(m) {
    Modal.mostrar({ ic: m.ic, titulo: m.nombre, texto: `<p>${m.t}, ${m.edad} años.</p>`, opciones: [
      { t: '🎾 Jugar', fn: () => { if (!usar('masc' + m.id, 2)) return; mod({ felicidad: 3, estres: -3 }); log(`Jugaste con ${m.nombre}.`); } },
      { t: '🩺 Llevar al veterinario', fn: () => { const c = Math.round(150 * eco()); S.p.dinero -= c; m.vida++; log(`Llevaste a ${m.nombre} al veterinario.`); } },
      { t: '🏠 Darla en adopción', cls: 'peligro', fn: () => { m.vivo = false; mod({ felicidad: -6, karma: -2 }); log(`Diste en adopción a ${m.nombre}.`); } },
      { t: 'Cerrar' },
    ] });
  },

  /* ---------- Paso del tiempo ---------- */
  anual() {
    const p = S.p;
    for (const r of p.rel) {
      if (!r.vivo) continue;
      r.edad++;
      if (r.tipo === 'hermano' && r.edad === 0) { log(`👶 ¡Nació tu herman${gx(r, 'o', 'a')} <b>${r.nombre}</b>!`, 'bueno'); continue; }
      if (r.edad < 0) continue;
      r.anios = (r.anios || 0) + 1;
      if (!p.usos['tiempo' + r.id] && !p.usos['conv' + r.id] && !Rasgos.tiene('empatico')) r.cercania = clamp(r.cercania - R.int(0, 4));
      if (r.edad === 18 && ['hijo', 'hermano', 'nieto'].includes(r.tipo)) { r.profesion = R.pick(PROFESIONES_NPC); r.dinero = Math.round(R.int(500, 8000) * eco()); }
      if (r.edad >= 18 && r.profesion && r.profesion !== 'Desempleado') r.dinero += Math.round(R.int(500, 6000) * eco() * (r.real ? 50 : 1));
      if (r.tipo === 'hijo' && r.edad === 18) log(`🎓 ${r.nombre} cumplió 18 y se independizó.`);
      // Muerte de NPC
      const q = Math.exp(-10.3 + 0.093 * r.edad);
      if (r.edad > 0 && R.chance(q)) { this.muerte(r); continue; }
      // Dinámica de pareja
      if (r.tipo === 'pareja') {
        if (r.cercania < 22 && R.chance(0.45)) { log(`💔 ${r.nombre} terminó contigo.`, 'malo'); r.tipo = 'ex'; mod({ felicidad: -10 }); }
        else if (r.anios >= 2 && r.cercania > 72 && p.edad >= 18 && R.chance(0.15)) this.propuestaDe(r);
      }
      if (r.tipo === 'conyuge') {
        if (R.chance(0.03 + (r.cercania < 40 ? 0.08 : 0))) { log(`😳 Descubriste que ${r.nombre} te fue infiel.`, 'malo'); r.cercania = clamp(r.cercania - 30); mod({ felicidad: -15 }); }
        if (r.cercania < 12 && R.chance(0.5)) { log(`${r.nombre} pidió el divorcio.`, 'malo'); this.divorcio(r); }
      }
      if (r.tipo === 'amigo' && !pareja() && this.puedeRomance(r) && r.cercania >= 65 && !p.carcel && R.chance(0.025 + (r.chispa || 0) / 500 + (Rasgos.tiene('carisma') ? 0.02 : 0) + (p.st.apariencia - 50) / 2000)) { this.enamorado(r); continue; }
      if (r.tipo === 'amigo' && r.chispa) r.chispa = clamp(r.chispa - 5);
      if (r.tipo === 'amigo' && r.cercania < 15 && R.chance(0.3)) { r.tipo = 'borrado'; r.vivo = false; log(`Te distanciaste de tu amig${gx(r, 'o', 'a')} ${r.nombre}.`, 'gris'); }
      // Nietos
      if (r.tipo === 'hijo' && r.edad >= 24 && r.edad <= 42 && R.chance(0.07)) {
        const n = Estado.persona({ tipo: 'nieto', edad: 0, apellido: r.genero === 'M' ? r.apellido : apellidoAleatorio(p.pais) });
        n.cercania = 70; n.profesion = null; n.dinero = 0; p.rel.push(n);
        log(`👶 ¡Tu hij${gx(r, 'o', 'a')} ${r.nombre} tuvo un bebé: ${n.nombre}! Eres abuel${gx(p, 'o', 'a')}.`, 'raro');
        mod({ felicidad: 8 }); Estado.darLogro('abuelo');
      }
    }
    for (const m of p.mascotas.filter(m => m.vivo)) {
      m.edad++; mod({ felicidad: 1, estres: -1 });
      if (m.edad >= m.vida) { m.vivo = false; log(`🌈 Tu ${m.t.toLowerCase()} ${m.nombre} murió de viejo.`, 'malo'); mod({ felicidad: -10 }); }
    }
    // Soledad en la adultez
    if (p.edad > 25 && !pareja() && !personas('amigo').length) mod({ felicidad: -3 });
  },
  propuestaDe(r) {
    Modal.mostrar({ ic: '💍', titulo: '¡Propuesta!', texto: `<p>${r.nombre} se arrodilla y te pide matrimonio. ¿Aceptas?</p>`, opciones: [
      { t: '💍 ¡Sí, acepto!', cls: 'ok', fn: () => { S.p.dinero -= Math.round(5000 * eco()); this.casarse(r, false, 'Boda sencilla'); } },
      { t: 'Todavía no estoy list' + gx(S.p, 'o', 'a'), fn: () => { r.cercania = clamp(r.cercania - 12); log(`Rechazaste la propuesta de ${r.nombre}.`); } },
    ] });
  },
  muerte(r) {
    const p = S.p;
    r.vivo = false;
    const causa = R.pick(r.edad > 70 ? ['causas naturales', 'un infarto', 'una neumonía', 'un derrame cerebral'] : ['un accidente de tránsito', 'una enfermedad', 'un infarto', 'un accidente']);
    log(`🕯️ Tu ${etiquetaRel(r).toLowerCase()} <b>${r.nombre}</b> murió a los ${r.edad} años por ${causa}.`, 'malo');
    if (['padre', 'madre', 'conyuge', 'hijo', 'hermano'].includes(r.tipo)) mod({ felicidad: -R.int(10, 25), estres: 8 });
    if (r.monarca) Realeza.muereMonarca(r);
    // Reliquia familiar (rarísimo)
    if (['padre', 'madre'].includes(r.tipo) && R.chance(0.06)) { const rz = R.peso([[55, 'comun'], [30, 'raro'], [12, 'epico'], [3, 'legendario']]); Coleccion.encontrar(Coleccion.idDeRareza(rz), `entre las cosas que dejó ${r.nombre}`); }
    // Herencia
    if (['padre', 'madre', 'conyuge'].includes(r.tipo) && r.dinero > 0) {
      let parte;
      if (r.tipo === 'conyuge') parte = r.dinero;
      else {
        const otro = personas('padre', 'madre').find(x => x !== r);
        const herederos = 1 + personas('hermano').length;
        parte = r.dinero / herederos * (otro ? 0.4 : 1);
      }
      parte = Math.round(parte * 0.9);
      if (parte > 0) { p.dinero += parte; log(`📜 Recibiste una herencia de <b>${fmt$(parte)}</b>.`, 'bueno'); }
      r.dinero = 0;
    }
    if (r.tipo === 'conyuge') { r.tipo = 'conyuge'; log('Quedaste viud' + gx(p, 'o', 'a') + '.', 'gris'); }
    if (p.vivienda === 'padres' && !personas('padre', 'madre').length && p.edad >= 18) { p.vivienda = 'alquiler'; log('Tuviste que mudarte a un departamento alquilado.'); }
  },
};
