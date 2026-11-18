'use strict';
/* =========================================================
   HABILIDADES: se aprenden practicando (niveles 0-10).
   Desbloquean ingresos, trabajos, bonos y sirven para
   sobrevivir al fin del mundo.
   ========================================================= */
const HABILIDADES = {
  cocina:      { ic: '🍳', n: 'Cocina', edad: 8, rasgo: null, usos: [[3, 'Cocinar para tu familia y amigos'], [5, 'Vender comida casera'], [8, 'Dar clases de cocina']] },
  carisma:     { ic: '😎', n: 'Carisma', edad: 6, rasgo: 'carisma', usos: [[4, 'Ayuda en citas, entrevistas y elecciones']] },
  programacion:{ ic: '💻', n: 'Programación', edad: 10, rasgo: 'genio', usos: [[4, 'Trabajos freelance'], [6, 'Trabajar de programador sin título'], [9, 'Crear tu propia app']] },
  musica:      { ic: '🎸', n: 'Música', edad: 6, rasgo: 'artista', usos: [[5, 'Tocar en bares'], [8, 'Grabar un disco']] },
  pintura:     { ic: '🎨', n: 'Pintura', edad: 6, rasgo: 'artista', usos: [[4, 'Vender cuadros'], [9, 'Pintar una obra maestra']] },
  escritura:   { ic: '✍️', n: 'Escritura', edad: 8, rasgo: 'genio', usos: [[4, 'Escribir artículos'], [7, 'Publicar una novela']] },
  jardineria:  { ic: '🌱', n: 'Jardinería', edad: 6, rasgo: null, usos: [[3, 'Huerto propio: gastas menos en comida'], [6, 'Vender en la feria']] },
  mecanica:    { ic: '🔧', n: 'Mecánica', edad: 12, rasgo: null, usos: [[3, 'Mantener tus autos cuesta la mitad'], [5, 'Reparar autos de vecinos']] },
  combate:     { ic: '🥋', n: 'Defensa personal', edad: 8, rasgo: 'atleta', usos: [[3, 'Más fuerza en peleas y asaltos'], [7, 'Dar clases de defensa personal']] },
  auxilios:    { ic: '🩹', n: 'Primeros auxilios', edad: 12, rasgo: null, usos: [[3, 'Las enfermedades te afectan menos'], [6, 'Ser voluntario en emergencias']] },
};
const CLUB_HABILIDAD = { deportes: 'combate', teatro: 'carisma', debate: 'escritura', musica: 'musica', robotica: 'programacion' };

const Habilidades = {
  xp(k) { const h = S.p.hab || (S.p.hab = {}); return h[k] || 0; },
  nivel(k) { return Math.min(10, Math.floor(this.xp(k) / 100)); },
  ganar(k, base, silencioso) {
    const p = S.p, d = HABILIDADES[k]; if (!p.hab) p.hab = {};
    const antes = this.nivel(k);
    let g = base * (1 + (p.st.inteligencia - 50) / 200) * (d.rasgo && Rasgos.tiene(d.rasgo) ? 1.4 : 1) / (1 + antes * 0.12);
    p.hab[k] = Math.min(1099, this.xp(k) + Math.round(g));
    const despues = this.nivel(k);
    if (despues > antes) {
      log(`${d.ic} Tu habilidad de <b>${d.n}</b> subió a nivel ${despues}.`, 'raro');
      const nuevo = d.usos.find(u => u[0] === despues);
      if (despues === 10) Efectos.celebrar(d.ic, `¡Maestría en ${d.n}!`, `<p>Llegaste al nivel máximo. Eres de los mejores del país.</p>`);
      else if (nuevo) Efectos.celebrar(d.ic, `${d.n} nivel ${despues}`, `<p>Desbloqueaste: <b>${nuevo[1]}</b>.</p>`);
      else if (!silencioso) toast(`${d.ic} ${d.n} nivel ${despues}`);
      if (despues >= 10) Estado.darLogro('maestro');
    }
  },
  /* Clubes escolares y trabajos relacionados entrenan habilidades solas */
  anual() {
    const p = S.p;
    if (p.edu.club && CLUB_HABILIDAD[p.edu.club] && Educacion.etapaEscolar()) this.ganar(CLUB_HABILIDAD[p.edu.club], 25, true);
    const porTrabajo = { cocinero: 'cocina', programador: 'programacion', mecanico: 'mecanica', periodista: 'escritura', musico: 'musica', disenador: 'pintura', agricultor: 'jardineria', enfermero: 'auxilios', medico: 'auxilios', policia: 'combate', militar: 'combate', bombero: 'auxilios' };
    if (p.trabajo && porTrabajo[p.trabajo.id]) this.ganar(porTrabajo[p.trabajo.id], 30, true);
    if (p.esp.luchador) this.ganar('combate', 30, true);
    if (p.esp.politica && p.esp.politica.cargo) this.ganar('carisma', 20, true);
  },
  panel() {
    Panel.abrir('Habilidades', () => {
      const p = S.p, its = [{ info: `Tu tiempo es limitado: cada año tienes <b>${usosRestantes('practicaTotal', 4)}</b> ratos libres para practicar y <b>${usosRestantes('claseTotal', 2)}</b> cursos. Los clubes escolares y tu trabajo también entrenan habilidades. Elige bien en qué ser bueno.` + ' Cada nivel desbloquea algo nuevo, y algunas serán vitales si el mundo se acaba…' }];
      for (const [k, d] of Object.entries(HABILIDADES)) {
        const n = this.nivel(k), prox = d.usos.find(u => u[0] > n);
        its.push({ ic: d.ic, t: `${d.n} — nivel ${n}`, s: p.edad < d.edad ? `Desde los ${d.edad} años` : prox ? `Nivel ${prox[0]}: ${prox[1]}` : 'Todo desbloqueado', der: `${'▰'.repeat(Math.min(n, 10))}${'▱'.repeat(10 - Math.min(n, 10))}`, dis: p.edad < d.edad ? `Desde los ${d.edad} años.` : false, fn: () => this.opciones(k) });
      }
      return its;
    });
  },
  opciones(k) {
    const p = S.p, d = HABILIDADES[k], n = this.nivel(k);
    const costoClase = Math.round(250 * Math.max(eco(), 0.4) * (1 + n * 0.3));
    const ops = [
      { t: `🔁 Practicar (te quedan ${usosRestantes('practicaTotal', 4)} ratos libres este año)`, dis: usosRestantes('practicaTotal', 4) <= 0, fn: () => { if (!usar('practicaTotal', 4)) return; this.ganar(k, R.int(30, 45)); mod({ estres: -1, felicidad: 1 }); log(`${d.ic} Practicaste ${d.n.toLowerCase()}.`); } },
      { t: `🎓 Tomar clases (${fmt$(costoClase)} · ${usosRestantes('claseTotal', 2)} cursos posibles este año)`, dis: (p.dinero < costoClase && p.edad >= 18) || usosRestantes('claseTotal', 2) <= 0, fn: () => { if (!usar('claseTotal', 2)) return; if (p.edad >= 18) p.dinero -= costoClase; else { const pa = personas('padre', 'madre')[0]; if (pa) pa.dinero -= costoClase; } this.ganar(k, R.int(60, 85)); log(`${d.ic} Tomaste clases de ${d.n.toLowerCase()}.`); } },
    ];
    for (const [nv, txt] of d.usos) if (n >= nv && this.accion(k, nv)) ops.push({ t: `✨ ${txt}`, fn: () => this.accion(k, nv)() });
    ops.push({ t: 'Cerrar' });
    Modal.mostrar({ ic: d.ic, titulo: `${d.n} — nivel ${n}`, texto: `<p>${d.usos.map(([nv, t]) => `${n >= nv ? '✅' : '🔒'} Nivel ${nv}: ${t}`).join('<br>')}</p>`, opciones: ops });
  },
  /* Acciones con resultados (solo las que se "usan"; las pasivas devuelven null) */
  accion(k, nv) {
    const p = S.p, e = Math.max(eco(), 0.4), n = this.nivel(k);
    const ingreso = (base, txt, clave) => () => { if (p.edad < 14) return toast('Eres muy joven para cobrar por esto.'); if (!usar(clave, 1)) return; const g = Math.round(base * n * e * R.float(0.6, 1.4)); p.dinero += g; log(`${HABILIDADES[k].ic} ${txt} y ganaste ${fmt$(g)}.`, 'bueno'); this.ganar(k, 15, true); };
    const A = {
      cocina: { 3: () => { if (!usar('cenaFamilia', 1)) return; p.rel.filter(r => r.vivo && ['padre', 'madre', 'hermano', 'pareja', 'conyuge', 'hijo', 'amigo'].includes(r.tipo)).forEach(r => r.cercania = clamp(r.cercania + 4)); mod({ felicidad: 4 }); log('🍳 Cocinaste un banquete para tu gente. Todos quedaron felices.', 'bueno'); }, 5: ingreso(400, 'Vendiste comida casera', 'venderComida'), 8: ingreso(900, 'Diste clases de cocina', 'clasesCocina') },
      programacion: { 4: ingreso(1200, 'Hiciste trabajos freelance de programación', 'freelance'), 9: () => { if (!usar('app', 1)) return; Efectos.suspenso('📱 Publicando tu app…', () => { if (R.chance(0.12 + (Rasgos.tiene('genio') ? 0.08 : 0))) { const g = Math.round(R.int(500000, 20000000) * e); p.dinero += g; mod({ fama: 8 }); log(`📱 ¡Tu app se volvió un éxito mundial! Ganaste ${fmt$(g)}.`, 'raro'); Efectos.celebrar('📱', '¡App viral!', `<p>Millones de descargas. Ganaste <b>${fmt$(g)}</b>.</p>`); Noticias.emitir(`La app de ${p.nombre} ${p.apellido} es la más descargada del año.`); } else log('📱 Publicaste tu app. Casi nadie la descargó.'); }); } },
      musica: { 5: ingreso(500, 'Tocaste en bares', 'bares'), 8: () => { if (!usar('disco', 1)) return; p.dinero -= Math.round(5000 * e); Efectos.suspenso('🎧 Lanzando tu disco…', () => { if (R.chance(0.15 + p.st.fama / 400)) { const g = Math.round(R.int(80000, 3000000) * e); p.dinero += g; mod({ fama: 12 }); log(`💿 ¡Tu disco es un éxito! Ganaste ${fmt$(g)}.`, 'raro'); Efectos.celebrar('💿', '¡Disco de oro!', `<p>Tus canciones suenan en todas las radios. Ganaste <b>${fmt$(g)}</b>.</p>`); Noticias.emitir(`El disco de ${p.nombre} ${p.apellido} encabeza las listas.`); } else { mod({ fama: 1 }); log('💿 Lanzaste tu disco. Lo escucharon tus amigos.'); } }); } },
      pintura: { 4: ingreso(600, 'Vendiste algunos cuadros', 'cuadros'), 9: () => { if (!usar('obraMaestra', 1)) return; Efectos.suspenso('🎨 Das la última pincelada…', () => { if (R.chance(0.25)) { const v = Math.round(R.int(200000, 5000000) * e); p.bienes.push({ id: uid(), tipo: 'lujo', n: 'Tu obra maestra', ic: '🖼️', valor: v, compra: 0, aprecia: true }); mod({ fama: 6 }); log(`🎨 Pintaste una obra maestra. Los críticos la valoran en ${fmt$(v)}.`, 'raro'); Efectos.celebrar('🖼️', '¡Obra maestra!', `<p>Valorada en <b>${fmt$(v)}</b>. Ya está en tus bienes.</p>`); } else log('🎨 Pintaste un buen cuadro, pero no una obra maestra.'); }); } },
      escritura: { 4: ingreso(500, 'Escribiste artículos para revistas', 'articulos'), 7: () => { if (!usar('novela', 1)) return; Efectos.suspenso('📚 Tu novela llega a las librerías…', () => { if (R.chance(0.15 + p.st.fama / 500)) { const g = Math.round(R.int(60000, 2500000) * e); p.dinero += g; mod({ fama: 10 }); log(`📚 ¡Tu novela es un bestseller! Ganaste ${fmt$(g)}.`, 'raro'); Efectos.celebrar('📚', '¡Bestseller!', `<p>Tu novela se traduce a 20 idiomas. Ganaste <b>${fmt$(g)}</b>.</p>`); } else log('📚 Publicaste tu novela. Vendió unas pocas copias.'); }); } },
      jardineria: { 6: ingreso(300, 'Vendiste verduras de tu huerto en la feria', 'feria') },
      mecanica: { 5: ingreso(500, 'Reparaste autos de tus vecinos', 'repararAutos') },
      combate: { 7: ingreso(700, 'Diste clases de defensa personal', 'clasesDefensa') },
      auxilios: { 6: () => { if (!usar('voluntarioEmerg', 1)) return; mod({ karma: 5, felicidad: 4 }); log('🩹 Fuiste voluntari' + gx(p, 'o', 'a') + ' en un equipo de emergencias.', 'bueno'); if (R.chance(0.2)) { mod({ fama: 3 }); Noticias.emitir(`Voluntari${gx(p, 'o', 'a')} salva la vida de un turista en ${ciudad()}: ${p.nombre} ${p.apellido}.`); } } },
    };
    return A[k] && A[k][nv] ? A[k][nv] : null;
  },
};
