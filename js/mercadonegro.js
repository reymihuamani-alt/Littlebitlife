'use strict';
/* =========================================================
   MERCADO NEGRO: ofertas que cambian cada año. Barato,
   ilegal y arriesgado: estafas, falsificaciones y policía.
   ========================================================= */
const OFERTAS_MN = [
  { id: 'pasaporte', ic: '🛂', n: 'Pasaporte falso', d: 'Emigra a cualquier país sin pedir visa (riesgo al usarlo).', c: 8000 },
  { id: 'identidad', ic: '🪪', n: 'Nueva identidad completa', d: 'Nuevo nombre, borra tus antecedentes y tu condición de prófugo.', c: 60000 },
  { id: 'autoRobado', ic: '🚘', n: 'Auto de lujo "sin papeles"', d: 'A un tercio de su precio… hasta que la policía lo encuentre.', c: 0 },
  { id: 'antiguedad', ic: '🏺', n: 'Antigüedad de procedencia dudosa', d: 'Puede ser un tesoro… o una baratija bien pintada.', c: 0 },
  { id: 'relojes', ic: '⌚', n: 'Lote de relojes réplica para revender', d: 'Ganancia rápida si nadie te pilla.', c: 2500 },
  { id: 'soplo', ic: '📈', n: 'Soplo de información privilegiada', d: 'Una acción que "va a explotar". Ilegal y muy tentador.', c: 10000 },
  { id: 'exotico', ic: '🐯', n: 'Cachorro de tigre', d: 'La mascota más presumible… y peligrosa.', c: 15000 },
  { id: 'cuadro', ic: '🖼️', n: 'Cuadro "recuperado" de un museo', d: 'Dicen que es auténtico. Dicen.', c: 0 },
];

const MercadoNegro = {
  ofertas() {
    const p = S.p;
    if (!p.mn || p.mn.anio !== S.anio) {
      p.mn = { anio: S.anio, ofertas: R.shuffle(OFERTAS_MN).slice(0, 5).map(o => {
        let c = o.c;
        if (o.id === 'autoRobado') c = R.int(25000, 90000);
        if (o.id === 'antiguedad') c = R.int(3000, 40000);
        if (o.id === 'cuadro') c = R.int(50000, 400000);
        return { ...o, c: Math.round(c * Math.max(eco(), 0.5)) };
      }) };
    }
    return p.mn.ofertas;
  },
  panel() {
    const p = S.p;
    if (p.edad < 18) return toast('Nadie te deja entrar: eres menor de edad.');
    if (p.carcel) return toast('Estás en prisión.');
    Panel.abrir('Mercado negro', () => [
      { info: '🕳️ Un contacto te lleva a la trastienda de un taller. Las ofertas cambian cada año. Aquí <b>nadie da garantías</b>: hay estafas, falsificaciones y policías encubiertos.' },
      ...this.ofertas().map(o => ({ ic: o.ic, t: o.n, s: o.d, der: fmt$(o.c), dis: p.dinero < o.c ? 'No te alcanza.' : o.vendido ? 'Ya se vendió.' : false, fn: () => this.comprar(o) })),
      { info: 'También puedes vender aquí tus artículos raros (Bienes → Tu colección) sin preguntas ni papeles.' },
    ]);
  },
  comprar(o) {
    const p = S.p;
    if (!usar('mn_' + o.id, 1)) return;
    p.dinero -= o.c; o.vendido = true; mod({ karma: -3, estres: 4 });
    Estado.darLogro('mercadoNegro');
    if (R.chance(0.06)) { log(`🚨 ¡Era un policía encubierto! Te detuvieron comprando: ${o.n.toLowerCase()}.`, 'malo'); return Crimen.arrestar('compra de mercancía ilegal', [0, 3]); }
    if (R.chance(0.12)) { log(`🕳️ Te estafaron: pagaste ${fmt$(o.c)} por ${o.n.toLowerCase()} y el vendedor desapareció.`, 'malo'); mod({ felicidad: -8 }); return aviso('Estafado', '<p>El vendedor se esfumó con tu dinero. ¿A quién vas a denunciarlo?</p>', '🤡'); }
    const efectos = {
      pasaporte: () => { p.pasaporteFalso = true; log('🛂 Conseguiste un pasaporte falso. Puedes emigrar sin visa.', 'malo'); },
      identidad: () => {
        const viejo = `${p.nombre} ${p.apellido}`;
        p.nombre = nombreAleatorio(p.genero, p.pais); p.apellido = apellidoAleatorio(p.pais);
        p.antecedentes = 0; p.fugitivo = false;
        if (p.esp.sombra) p.esp.sombra.sospecha = Math.round(p.esp.sombra.sospecha / 2);
        log(`🪪 ${viejo} dejó de existir. Ahora eres <b>${p.nombre} ${p.apellido}</b>, sin antecedentes.`, 'raro');
        Historias.sembrar('identidad', { viejo }, R.int(3, 15));
      },
      autoRobado: () => { const t = R.pick(['Sedán de lujo', 'Deportivo italiano']); const v = Math.round(o.c * R.float(2.5, 3.5)); p.bienes.push({ id: uid(), tipo: 'auto', n: t, ic: '🚘', valor: v, compra: o.c, robado: true }); log(`🚘 Compraste un ${t.toLowerCase()} robado por ${fmt$(o.c)}.`, 'malo'); },
      antiguedad: () => { const r = R.peso([[60, 'raro'], [32, 'epico'], [8, 'legendario']]); Coleccion.encontrar(Coleccion.idDeRareza(r), 'en el mercado negro', { dudoso: true, falsoProb: 0.5 }); },
      cuadro: () => { const it = Coleccion.crear('pintura', { dudoso: true, falsoProb: 0.6 }); Coleccion.lista().push(it); log('🖼️ Compraste un cuadro "recuperado". Nadie puede saber que lo tienes.', 'malo'); aviso('Un cuadro en tu sótano', '<p>Lo escondes detrás de una cortina. Si es auténtico, vale una fortuna… y es robado.</p>', '🖼️'); Historias.sembrar('cuadro_robado', { uid: it.uid }, R.int(2, 8)); },
      relojes: () => { if (R.chance(0.15)) { log('🚓 Te atraparon revendiendo relojes falsificados.', 'malo'); Crimen.arrestar('venta de mercancía falsificada', [0, 2]); } else { const g = Math.round(o.c * R.float(1.5, 3)); p.dinero += g; log(`⌚ Revendiste los relojes réplica por ${fmt$(g)}.`, 'malo'); } },
      soplo: () => Modal.numero({ ic: '📈', titulo: '¿Cuánto inviertes en el soplo?', max: Math.max(0, p.dinero), valor: Math.max(0, p.dinero * 0.2), fn: v => {
        p.dinero -= v;
        Efectos.suspenso('📈 Esperando la apertura de la bolsa…', () => {
          const x = Math.random();
          if (x < 0.6) { const g = Math.round(v * R.float(1.5, 3.5)); p.dinero += g; log(`📈 El soplo era real: tu inversión se convirtió en ${fmt$(g)}.`, 'raro'); Efectos.celebrar('📈', '¡La acción explotó!', `<p>Recibes <b>${fmt$(g)}</b>.</p><p class="nota">Ojalá nadie revise las operaciones…</p>`); if (R.chance(0.15)) Historias.sembrar('insider', { g }, R.int(1, 3)); }
          else if (x < 0.85) { log(`📉 El soplo era humo. Perdiste ${fmt$(v)}.`, 'malo'); }
          else { log('🚨 Los reguladores detectaron la operación.', 'malo'); Crimen.arrestar('uso de información privilegiada', [1, 5]); }
        });
      } }),
      exotico: () => { p.mascotas.push({ id: uid(), t: 'Tigre', ic: '🐯', nombre: R.pick(['Rajá', 'Sultán', 'Kiara', 'Shere']), edad: 0, vida: R.int(15, 20), vivo: true, exotico: true }); mod({ fama: 3, felicidad: 8 }); log('🐯 Ahora tienes un tigre como mascota. Tus vecinos están aterrados.', 'raro'); Historias.sembrar('tigre', {}, R.int(1, 4)); },
    };
    efectos[o.id]();
  },
  vender(it) {
    const p = S.p;
    const oferta = Math.round((it.falso && it.tasado) ? R.int(20, 200) * eco() : it.valor * R.float(0.3, 0.55) * (it.tasado ? 1 : R.float(0.5, 1.1)));
    Modal.mostrar({ ic: '🕳️', titulo: 'Comprador sin preguntas', texto: `<p>Un intermediario ofrece <b>${fmt$(oferta)}</b> en efectivo por tu ${it.n.toLowerCase()}. Nada de papeles.</p>`, opciones: [
      op('Aceptar', () => {
        if (R.chance(0.07)) { log('🚨 El comprador era un agente encubierto.', 'malo'); Coleccion.quitar(it); return Crimen.arrestar('tráfico de bienes culturales', [1, 4]); }
        p.dinero += oferta; Coleccion.quitar(it); mod({ karma: RAROS[it.id].patrimonio ? -10 : -2 });
        log(`🕳️ Vendiste tu ${it.n.toLowerCase()} en el mercado negro por ${fmt$(oferta)}.`, 'malo');
      }),
      op('Mejor no', () => {}),
    ] });
  },
};

/* Historias del mercado negro */
Object.assign(HISTORIAS, {
  identidad(d, p) {
    Historias.modal('👤', 'Alguien te reconoce', `<p>En el supermercado una persona te mira fijamente: "¿${d.viejo}? ¡Eres tú! ¿Por qué usas otro nombre?"</p>`, [
      op('"Me confunde con otra persona"', () => { if (R.chance(0.7)) log('↩️ Lograste convencerla de que te confundía.'); else { log('↩️ No te creyó y avisó a la policía.', 'malo'); if (R.chance(0.5)) Crimen.arrestar('falsificación de identidad', [1, 4]); } }),
      op(`Sobornarla para que calle (${fmt$(5000 * eco())})`, () => { p.dinero -= Math.round(5000 * eco()); mod({ karma: -3 }); log('↩️ Compraste su silencio.'); }),
    ]);
  },
  cuadro_robado(d, p) {
    const it = (p.coleccion || []).find(x => x.uid === d.uid);
    if (!it) return;
    Noticias.emitir(`La Interpol sigue la pista de una pintura robada de un museo europeo. Creen que está en ${ciudad()}.`, { modal: true, ic: '🕵️', cuerpo: '<p>Tu cuadro escondido podría ser el que buscan…</p>' });
    Modal.mostrar({ ic: '🖼️', titulo: '¿Qué haces con el cuadro?', opciones: [
      op('Devolverlo anónimamente', () => { Coleccion.quitar(it); mod({ karma: 8 }); log('↩️ Dejaste el cuadro en la puerta de una iglesia con una nota. Fue devuelto al museo.', 'bueno'); }),
      op('Esconderlo mejor', () => { if (R.chance(0.25)) { Coleccion.quitar(it); log('↩️ La Interpol allanó tu casa y encontró el cuadro.', 'malo'); Crimen.arrestar('posesión de arte robado', [2, 8]); } else log('↩️ El cuadro sigue escondido en tu sótano.'); }),
    ] });
  },
  insider(d, p) {
    Historias.modal('🧑‍💼', 'La comisión de valores', `<p>Los reguladores investigan operaciones sospechosas del año en que ganaste ${fmt$(d.g)}. Te citan a declarar.</p>`, [
      op('Contratar al mejor abogado', () => { p.dinero -= Math.round(40000 * eco()); if (R.chance(0.75)) log('↩️ Tu abogado consiguió archivar la investigación.', 'bueno'); else Crimen.arrestar('uso de información privilegiada', [1, 4]); }),
      op('Llegar a un acuerdo y pagar una multa', () => { const m = Math.round(d.g * 1.2); p.dinero -= m; log(`↩️ Pagaste una multa de ${fmt$(m)} para cerrar el caso.`, 'malo'); }),
    ]);
  },
  tigre(d, p) {
    const t = p.mascotas.find(m => m.exotico && m.vivo); if (!t) return;
    Historias.modal('🐯', `${t.nombre} creció`, `<p>Tu tigre ${t.nombre} ya pesa 150 kilos. Los vecinos llamaron a las autoridades.</p>`, [
      op('Entregarlo a un santuario', () => { t.vivo = false; mod({ karma: 4, felicidad: -6 }); log(`↩️ Entregaste a ${t.nombre} a un santuario de animales.`); }),
      op('Esconderlo', () => { if (R.chance(0.4)) { t.vivo = false; log('↩️ Las autoridades confiscaron a tu tigre y te multaron.', 'malo'); p.dinero -= Math.round(20000 * eco()); } else if (R.chance(0.15)) { mod({ salud: -35 }); log(`↩️ ${t.nombre} te atacó jugando. Terminaste en el hospital.`, 'malo'); } else log('↩️ Lograste esconder a tu tigre… por ahora.'); }),
    ]);
  },
});
