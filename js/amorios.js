'use strict';
/* =========================================================
   AMORÍOS, INTIMIDAD Y FERTILIDAD
   - Intimidad con tu pareja o tu amante: baja el estrés.
   - Amantes secretos con riesgo de que te descubran.
   - Hijos fuera de la pareja: tu pareja puede aceptarlos,
     o puedes ocultarlos (y pagar manutención en secreto).
   - Fertilidad realista, con una posibilidad remotísima
     de ser padre o madre en la vejez.
   Solo entre adultos. Sin contenido explícito.
   ========================================================= */
const Amorios = {
  /* Probabilidad de embarazo de una pareja en un intento */
  fertilidad(r) {
    const p = S.p;
    if (!r || p.genero === r.genero || p.edad < 18 || r.edad < 18) return 0;
    const mujer = p.genero === 'F' ? p : r, hombre = p.genero === 'M' ? p : r;
    const e = mujer.edad;
    let f = e < 30 ? 0.65 : e < 35 ? 0.5 : e < 40 ? 0.3 : e < 45 ? 0.1 : e < 50 ? 0.02 : e < 60 ? 0.004 : 0.0008;
    if (hombre.edad > 75) f *= 0.12; else if (hombre.edad > 60) f *= 0.35; else if (hombre.edad > 50) f *= 0.7;
    if (Rasgos.tiene('fragil')) f *= 0.8;
    return f;
  },
  milagro(madreEdad, padreEdad) { return madreEdad >= 45 || padreEdad >= 70; },

  /* Intimidad: con protección casi no hay embarazo */
  intimidad(r) {
    const p = S.p;
    if (p.edad < 18 || r.edad < 18) return toast('Solo entre adultos.');
    Modal.mostrar({ ic: '💞', titulo: `Una noche con ${r.nombre}`, texto: '<p>Apagan las luces…</p>', opciones: [
      op('🛡️ Con protección', () => this.noche(r, 0.03)),
      op('🎲 Sin protección', () => this.noche(r, 1)),
      op('Mejor otro día', () => {}),
    ] });
  },
  noche(r, factor) {
    const p = S.p;
    if (!usar('intimidad' + r.id, 2)) return;
    const amante = r.tipo === 'amante';
    mod({ estres: -R.int(8, 15), felicidad: R.int(3, 7), karma: amante ? -2 : 0 });
    r.cercania = clamp(r.cercania + R.int(3, 8));
    log(amante ? `🌙 Pasaste la noche a escondidas con ${r.nombre}.` : `💞 Tuviste una noche romántica con ${r.nombre}.`, amante ? 'raro' : 'bueno');
    toast('😌 −estrés');
    if (amante && pareja() && R.chance(0.06)) return this.descubierto(r);
    const f = this.fertilidad(r) * factor;
    if (f > 0 && R.chance(f)) this.embarazo(r);
  },
  embarazo(r) {
    const p = S.p;
    const mujer = p.genero === 'F' ? p : r, hombre = p.genero === 'M' ? p : r;
    if (this.milagro(mujer.edad, hombre.edad)) {
      log(`🍼 ¡Un milagro! Contra todo pronóstico, ${p.genero === 'F' ? 'quedaste embarazada' : `${r.nombre} quedó embarazada`} a los ${mujer.edad} años${hombre.edad >= 70 ? ` y con un padre de ${hombre.edad}` : ''}.`, 'raro');
      Noticias.emitir(`Insólito: una pareja de ${mujer.edad} y ${hombre.edad} años espera un bebé en ${ciudad()}. Los médicos no lo pueden creer.`);
    }
    Relaciones.nacer(r);
  },

  /* ---------- Amantes ---------- */
  nuevoAmante(c) {
    const p = S.p;
    c.tipo = 'amante'; c.cercania = R.int(55, 80); c.anios = 0;
    if (!p.rel.includes(c)) p.rel.push(c);
    p.cont.parejas++; p.cont.amantes = (p.cont.amantes || 0) + 1;
    mod({ karma: -6, felicidad: 6, estres: 4 });
    Estado.darLogro('amante');
    log(`🤫 Empezaste una aventura secreta con <b>${c.nombre}</b>.`, 'raro');
  },
  descubierto(am) {
    const p = S.p, pa = pareja();
    if (!pa || !am.vivo) return;
    mod({ estres: 15, felicidad: -12 });
    log(`💥 ${pa.nombre} descubrió tu aventura con ${am.nombre}.`, 'malo');
    Modal.mostrar({ ic: '💥', titulo: '¡Te descubrieron!', texto: `<p><b>${pa.nombre}</b> encontró mensajes entre tú y <b>${am.nombre}</b>. Te mira llorando: "¿Cuánto tiempo llevas engañándome?"</p>`, opciones: [
      op(`🙏 Pedir perdón y terminar con ${am.nombre}`, () => {
        am.tipo = 'ex'; am.cercania = clamp(am.cercania - 30);
        if (R.chance(pa.cercania / 130 + (pa.tipo === 'conyuge' ? 0.1 : 0))) { pa.cercania = clamp(pa.cercania - 30); log(`${pa.nombre} decidió darte otra oportunidad… pero nada será igual.`, 'malo'); }
        else { log(`${pa.nombre} no pudo perdonarte.`, 'malo'); if (pa.tipo === 'conyuge') Relaciones.divorcio(pa, true); else Relaciones.terminar(pa, true); }
      }),
      op(`❤️ Elegir a ${am.nombre}`, () => { if (pa.tipo === 'conyuge') Relaciones.divorcio(pa, true); else Relaciones.terminar(pa, true); am.tipo = 'pareja'; am.cercania = clamp(am.cercania + 10); log(`Dejaste a ${pa.nombre} por ${am.nombre}. Ahora están juntos oficialmente.`, 'raro'); }),
      op('🙅 Negarlo todo', () => { if (R.chance(0.3)) { pa.cercania = clamp(pa.cercania - 10); mod({ karma: -4 }); log(`Convenciste a ${pa.nombre} de que era un malentendido.`, 'raro'); } else { log(`${pa.nombre} no te creyó y te dejó.`, 'malo'); if (pa.tipo === 'conyuge') Relaciones.divorcio(pa, true); else Relaciones.terminar(pa, true); } }),
    ] });
  },
  itemsPersona(r, a) {
    const p = S.p, pa = pareja();
    if (r.tipo === 'amante') {
      a('🌙', 'Pasar la noche juntos', () => this.intimidad(r), 'Baja el estrés · riesgo de que te descubran');
      a('🍷', 'Cita a escondidas', () => { if (!usar('citaSecreta' + r.id, 2)) return; p.dinero -= Math.round(R.int(80, 400) * eco()); r.cercania = clamp(r.cercania + R.int(4, 10)); mod({ felicidad: 4 }); log(`🍷 Saliste a escondidas con ${r.nombre}.`); if (pa && R.chance(0.08)) this.descubierto(r); });
      if (pa) a('💔', `Dejar a ${pa.nombre} por ${r.nombre}`, () => { if (pa.tipo === 'conyuge') Relaciones.divorcio(pa); else Relaciones.terminar(pa); r.tipo = 'pareja'; r.anios = 0; log(`Dejaste a ${pa.nombre} para estar con ${r.nombre}.`, 'raro'); });
      else a('💍', 'Formalizar la relación', () => { r.tipo = 'pareja'; r.anios = 0; log(`Tú y ${r.nombre} ya no se esconden: ahora son pareja.`, 'bueno'); });
      a('🚪', 'Terminar la aventura', () => { r.tipo = 'ex'; r.cercania = clamp(r.cercania - 25); mod({ estres: -5 }); log(`Terminaste tu aventura con ${r.nombre}.`); });
    }
    if ((r.tipo === 'pareja' || r.tipo === 'conyuge') && p.edad >= 18 && r.edad >= 18) a('💞', 'Intimidad', () => this.intimidad(r), 'Baja el estrés y une a la pareja');
    if (r.tipo === 'amigo' && pa && p.edad >= 18 && r.edad >= 18 && (r.chispa || 0) >= 40) a('🤫', 'Tener una aventura', () => { if (!usar('aventura' + r.id, 1)) return; if (R.chance(0.4 + (r.chispa || 0) / 200)) this.nuevoAmante(r); else { r.cercania = clamp(r.cercania - 15); log(`${r.nombre} te recordó que tienes pareja y se alejó.`, 'malo'); } }, 'Hay chispa… pero tienes pareja');
  },

  /* ---------- Hijos fuera de la pareja ---------- */
  hijoNacido(h, otro) {
    const p = S.p;
    if (!otro || otro.tipo !== 'amante') return;
    const pa = pareja();
    h.fueraPareja = true;
    h.viveCon = p.genero === 'M' ? 'otro' : 'yo';
    if (!pa) { log(`👶 ${h.nombre} es hij${gx(h, 'o', 'a')} de tu relación con ${otro.nombre}.`); return; }
    if (p.genero === 'M') {
      Modal.mostrar({ ic: '👶', titulo: `${otro.nombre} tuvo un hijo tuyo`, texto: `<p>${otro.nombre} te presenta a <b>${h.nombre}</b>. Es tu hij${gx(h, 'o', 'a')}. ${pa.nombre} no sabe nada.</p>`, opciones: [
        op(`🗣️ Contarle la verdad a ${pa.nombre}`, () => this.confesarHijo(h, pa, 0)),
        op('🤫 Ocultarlo y pagar manutención en secreto', () => { h.secreto = true; mod({ estres: 10, karma: -4 }); log(`🤫 Decidiste ocultarle a ${pa.nombre} la existencia de ${h.nombre}. Pagarás su manutención en secreto.`, 'malo'); Historias.sembrar('hijo_secreto', { id: h.id }, R.int(3, 12)); }),
        op('🙅 No reconocerlo', () => { h.cercania = 10; h.noReconocido = true; otro.cercania = clamp(otro.cercania - 40); mod({ karma: -12 }); log(`🙅 Te negaste a reconocer a ${h.nombre}.`, 'malo'); Historias.sembrar('paternidad', { id: h.id, madre: otro.nombre }, R.int(1, 4)); }),
      ] });
    } else {
      Modal.mostrar({ ic: '🤰', titulo: 'Un bebé… ¿de quién?', texto: `<p>El padre de <b>${h.nombre}</b> es ${otro.nombre}, no ${pa.nombre}.</p>`, opciones: [
        op(`🗣️ Contarle la verdad a ${pa.nombre}`, () => this.confesarHijo(h, pa, 0)),
        op(`🤫 Dejar que ${pa.nombre} crea que es suyo`, () => { h.secreto = true; h.otroPadre = pa.id; mod({ karma: -10, estres: 8 }); log(`🤫 ${pa.nombre} cree que ${h.nombre} es su hij${gx(h, 'o', 'a')}.`, 'malo'); Historias.sembrar('adn', { id: h.id, padre: otro.nombre }, R.int(4, 15)); }),
      ] });
    }
  },
  /* La pareja decide si acepta al hijo. "penal" empeora las probabilidades (si se enteró sola) */
  confesarHijo(h, pa, penal) {
    const p = S.p;
    const prob = pa.cercania / 150 + (p.st.karma - 50) / 300 + (pa.tipo === 'conyuge' ? 0.1 : 0) + (hijos().length > 1 ? 0.05 : 0) - penal;
    Efectos.suspenso(`😶 ${pa.nombre} se queda en silencio…`, () => {
      h.secreto = false;
      if (R.chance(clamp(prob * 100, 5, 85) / 100)) {
        pa.cercania = clamp(pa.cercania - 20); h.aceptado = true;
        Modal.mostrar({ ic: '🫂', titulo: `${pa.nombre} acepta a ${h.nombre}`, texto: `<p>"Me dolió en el alma. Pero ${gx(h, 'ese niño', 'esa niña')} no tiene la culpa de nada."</p><p>¿Dónde vivirá ${h.nombre}?</p>`, opciones: [
          op('🏠 Con nosotros, como uno más de la familia', () => { h.viveCon = 'yo'; h.cercania = clamp(h.cercania + 10); log(`🫂 ${pa.nombre} aceptó a ${h.nombre}, que ahora vive con ustedes.`, 'raro'); Efectos.celebrar('🫂', 'Una familia distinta', `<p>${pa.nombre} decidió aceptar a ${h.nombre} como parte de la familia.</p>`); }),
          op('🏡 Con su otro progenitor, pero con visitas', () => { h.viveCon = p.genero === 'M' ? 'otro' : 'yo'; log(`🫂 ${pa.nombre} aceptó que formes parte de la vida de ${h.nombre}.`, 'bueno'); }),
        ] });
      } else {
        log(`💔 ${pa.nombre} no pudo aceptarlo y se fue.`, 'malo');
        if (pa.tipo === 'conyuge') Relaciones.divorcio(pa, true); else Relaciones.terminar(pa, true);
      }
    }, 1600, '😶');
  },
  /* Cada año: manutención, descubrimientos y presión del amante */
  anual() {
    const p = S.p, pa = pareja();
    const fuera = hijos().filter(h => h.viveCon === 'otro' && h.edad < 18 && !h.noReconocido);
    if (fuera.length) { const m = Math.round(fuera.length * 3000 * eco()); p.dinero -= m; log(`👶 Pagaste ${fmt$(m)} de manutención por ${fuera.map(h => h.nombre).join(', ')}.`, 'gris'); }
    const amantes = p.rel.filter(r => r.tipo === 'amante' && r.vivo);
    if (!pa || !amantes.length) return;
    mod({ estres: 3 * amantes.length });
    for (const am of amantes) {
      if (R.chance(0.08 + 0.05 * (amantes.length - 1))) return this.descubierto(am);
      if (am.anios >= 2 && am.cercania > 75 && R.chance(0.12)) return Modal.mostrar({ ic: '😤', titulo: `${am.nombre} está cansad${gx(am, 'o', 'a')}`, texto: `<p>"¿Cuándo vas a dejar a ${pa.nombre}? No quiero seguir escondiéndome."</p>`, opciones: [
        op(`Dejar a ${pa.nombre}`, () => { if (pa.tipo === 'conyuge') Relaciones.divorcio(pa); else Relaciones.terminar(pa); am.tipo = 'pareja'; am.anios = 0; log(`Dejaste a ${pa.nombre} por ${am.nombre}.`, 'raro'); }),
        op('"Pronto, te lo prometo"', () => { am.cercania = clamp(am.cercania - 10); mod({ karma: -2 }); }),
        op('Terminar la aventura', () => { am.tipo = 'ex'; log(`Terminaste con ${am.nombre}.`); }),
      ] });
    }
  },
};

/* ---------- Historias que regresan ---------- */
Object.assign(HISTORIAS, {
  hijo_secreto(d, p) {
    const h = p.rel.find(r => r.id === d.id && r.vivo), pa = pareja();
    if (!h || !pa || !h.secreto) return;
    Historias.modal('📱', 'El secreto sale a la luz', `<p>${pa.nombre} encontró los pagos de manutención… y una foto de <b>${h.nombre}</b>. "¿Quién es este niño?"</p>`, [
      op('Confesar todo', () => Amorios.confesarHijo(h, pa, 0.2)),
      op('Inventar una excusa', () => { if (R.chance(0.25)) { mod({ karma: -4 }); log('↩️ Inventaste una excusa. Por ahora funcionó.'); Historias.sembrar('hijo_secreto', { id: h.id }, R.int(3, 8)); } else Amorios.confesarHijo(h, pa, 0.35); }),
    ]);
  },
  paternidad(d, p) {
    const h = p.rel.find(r => r.id === d.id && r.vivo); if (!h) return;
    const costo = Math.round(Math.min(h.edad + 1, 18) * 2500 * eco());
    Historias.modal('⚖️', 'Demanda de paternidad', `<p>${d.madre} te demandó. La prueba de ADN confirma que <b>${h.nombre}</b> es tu hij${gx(h, 'o', 'a')}. El juez te ordena pagar ${fmt$(costo)} de manutención atrasada.</p>`, [
      op('Pagar y conocer a tu hijo', () => { p.dinero -= costo; h.noReconocido = false; h.viveCon = 'otro'; h.cercania = 30; mod({ karma: 5 }); log(`↩️ Pagaste la manutención y empezaste a conocer a ${h.nombre}.`, 'bueno'); }),
      op('Pagar y seguir sin verlo', () => { p.dinero -= costo; h.noReconocido = false; h.viveCon = 'otro'; log(`↩️ Pagaste lo que ordenó el juez por ${h.nombre}.`); }),
    ]);
    if (pareja()) Historias.sembrar('hijo_secreto', { id: h.id }, 1);
  },
  adn(d, p) {
    const h = p.rel.find(r => r.id === d.id && r.vivo), pa = pareja();
    if (!h || !pa || !h.secreto) return;
    Historias.modal('🧬', 'Una prueba de ADN', `<p>Por una enfermedad, ${pa.nombre} y ${h.nombre} se hicieron pruebas genéticas. El resultado es claro: ${pa.nombre} no es el padre. El padre es ${d.padre}.</p>`, [
      op('Pedir perdón con toda el alma', () => Amorios.confesarHijo(h, pa, 0.25)),
    ]);
  },
});
