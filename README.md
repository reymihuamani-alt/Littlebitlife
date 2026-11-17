# Otra Vida — simulador de vida en español

Juego de texto en el navegador: naces, creces, estudias, trabajas, te enamoras, emprendes, quizás delinques… y al morir puedes continuar con tus hijos y construir una dinastía. Cada decisión cuenta, como en la vida real.

## Cómo jugar

1. Abre `index.html` en cualquier navegador moderno (no necesita instalación ni servidor). También funciona publicado en GitHub Pages.
2. Crea a tu personaje: nombre, género, país, origen familiar (o nace en la familia real en España / Reino Unido).
3. **Elige primero tu objetivo de vida**: millonario, multimillonario, celebridad, CEO, presidente, astronauta, supermodelo, director de cine, realeza, capo, director médico, campeón de MMA, gran familia o Matusalén. Opcionalmente, un **reto** extra.
4. Pulsa **＋ Edad** para avanzar un año. Usa las pestañas Trabajo/Escuela, Bienes, Relaciones y Actividades para tomar decisiones.

La partida y los logros se guardan automáticamente en el navegador.

## Sistemas

| Área | Qué incluye |
|---|---|
| **Estadísticas** | Felicidad, salud, inteligencia, apariencia, estrés, fama y karma. El estrés alto enferma; la salud tiende a bajar con la edad. |
| **Educación** | Primaria, secundaria con notas y clubes, examen de admisión, universidad pública o privada, becas, préstamos estudiantiles, 19 carreras, maestría/MBA, doctorado, residencia médica y escuela de aviación. |
| **Trabajo** | 38 profesiones con requisitos reales, entrevistas, desempeño, ascensos, aumentos, horas extra, despidos (también por recesión), medio tiempo para adolescentes, jubilación y pensión. |
| **Carreras especiales** | Modelaje (castings: interpreta el brief), actuación (audiciones), dirección de cine (guion, presupuesto, elenco, marketing, tendencias, taquilla y la Estatuilla Dorada), política (campaña, debate, mandatos, leyes, corrupción), astronauta (tres pruebas y misiones), MMA (combate por turnos), redes sociales/influencer. |
| **Dinero** | Impuestos progresivos por país, gastos según estilo de vida y vivienda, hipotecas, préstamos, quiebra, inversiones (índice, acciones, bonos, cripto), bienes raíces (alquilar, remodelar), autos, lujos, donaciones. |
| **Negocios** | 10 sectores, capital, empleados, calidad, marketing, reinversión, rondas de inversión, salida a bolsa y venta. |
| **Relaciones** | Padres, hermanos, amigos, citas, galas de alta sociedad, matrimonio (con o sin acuerdo prenupcial), divorcio, hijos, adopción, nietos, mascotas, herencias. |
| **Crimen** | Delitos menores y mayores, juicios con distintos abogados, prisión (conducta, pandillas, libertad condicional, apelación), fuga en un laberinto y la **organización criminal**: rangos, respeto, calor policial, territorios, producción, sobornos, informantes, redadas y lavado de dinero. |
| **Realeza** | Línea de sucesión, coronación, popularidad, abdicación, casarse con la realeza, abolición de la monarquía. |
| **Vida real** | Recesiones y auges, inflación, terremotos, pandemias, estafas, asaltos, accidentes, crisis de la mediana edad, sistema de salud público vs. privado, emigración con visas. |
| **Legado** | Cintas al morir, logros persistentes, continuar como uno de tus hijos (generaciones y dinastías). |
| **Modo Dios** | Edita estadísticas, dinero y antecedentes (desactiva los logros de esa vida). |

## Estructura

```
index.html          Página principal
css/estilos.css     Estilos (modo claro y oscuro, diseño móvil)
js/datos.js         Países, carreras, trabajos, objetivos, bienes, enfermedades…
js/ui.js            Render, paneles, modales
js/estado.js        Creación de vidas y guardado
js/vida.js          El paso de los años, muerte y generaciones
js/*.js             Un módulo por sistema (educación, trabajo, carreras, cine,
                    política, finanzas, relaciones, salud, crimen, realeza,
                    eventos, objetivos, actividades, minijuegos)
```

Juego original inspirado en el género de simuladores de vida.
