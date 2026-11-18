'use strict';
/* =========================================================
   DATOS DEL MUNDO
   Dinero en dólares. "eco" escala salarios y precios por país.
   ========================================================= */
const PAISES = {
  'Perú':          { eco: 0.32, esperanza: 77, impMax: 0.30, bandera: '🇵🇪', uni: 4000,  saludPublica: false, sismos: true },
  'México':        { eco: 0.38, esperanza: 75, impMax: 0.35, bandera: '🇲🇽', uni: 5000,  saludPublica: false, sismos: true },
  'Colombia':      { eco: 0.30, esperanza: 77, impMax: 0.39, bandera: '🇨🇴', uni: 4000,  saludPublica: false },
  'Argentina':     { eco: 0.33, esperanza: 77, impMax: 0.35, bandera: '🇦🇷', uni: 600,   saludPublica: true, inflacion: true },
  'Chile':         { eco: 0.48, esperanza: 80, impMax: 0.40, bandera: '🇨🇱', uni: 7000,  saludPublica: false, sismos: true },
  'España':        { eco: 0.65, esperanza: 83, impMax: 0.47, bandera: '🇪🇸', uni: 1500,  saludPublica: true, monarquia: true },
  'Estados Unidos':{ eco: 1.00, esperanza: 78, impMax: 0.37, bandera: '🇺🇸', uni: 30000, saludPublica: false, ingles: true },
  'Reino Unido':   { eco: 0.85, esperanza: 81, impMax: 0.45, bandera: '🇬🇧', uni: 12000, saludPublica: true, monarquia: true, ingles: true },
};

const NOMBRES = {
  M: ['Mateo','Santiago','Sebastián','Diego','Alejandro','Nicolás','Lucas','Gabriel','Daniel','Joaquín','Adrián','Tomás','Emiliano','Andrés','Rodrigo','Martín','Javier','Pablo','Hugo','Leonardo','Carlos','Miguel','Fernando','Renato','Bruno','Thiago','Iker','Álvaro','Rafael','Esteban'],
  F: ['Sofía','Valentina','Isabella','Camila','Lucía','Martina','Valeria','Daniela','Mariana','Gabriela','Victoria','Ximena','Paula','Elena','Carmen','Julieta','Renata','Antonella','Fernanda','Natalia','Andrea','Carla','Alba','Emma','Regina','Florencia','Luciana','Ana','Rocío','Abril'],
};
const NOMBRES_EN = {
  M: ['James','Oliver','Henry','Jack','William','Noah','Ethan','Lucas','George','Leo','Samuel','Owen'],
  F: ['Olivia','Emma','Amelia','Charlotte','Ava','Grace','Lily','Sophie','Chloe','Ella','Mia','Harper'],
};
const APELLIDOS = ['García','Rodríguez','Martínez','López','González','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Vargas','Castillo','Rojas','Morales','Ortiz','Quispe','Mamani','Huamán','Chávez','Mendoza','Silva','Romero','Herrera','Medina','Aguilar','Navarro','Fuentes','Paredes','Salazar','Cárdenas','Ríos','Valdivia'];
const APELLIDOS_EN = ['Smith','Johnson','Brown','Taylor','Wilson','Davies','Miller','Clark','Walker','Hughes','Turner','Wright'];
const CASAS_REALES = { 'España': 'de Borbón-Altamira', 'Reino Unido': 'of Windmere' };

const PROFESIONES_NPC = ['Profesor','Enfermero','Contador','Comerciante','Ingeniero','Chofer','Médico','Abogado','Policía','Cocinero','Vendedor','Albañil','Diseñador','Programador','Agricultor','Secretario','Mecánico','Desempleado','Artista','Empresario','Psicólogo','Periodista'];

/* ---------- Educación ---------- */
const CARRERAS = {
  'Medicina':               { anios: 7, dif: 85, ic: '🩺' },
  'Derecho':                { anios: 5, dif: 68, ic: '⚖️' },
  'Ingeniería Civil':       { anios: 5, dif: 72, ic: '🏗️' },
  'Ingeniería Aeroespacial':{ anios: 5, dif: 85, ic: '🚀' },
  'Informática':            { anios: 5, dif: 68, ic: '💻' },
  'Administración':         { anios: 5, dif: 50, ic: '📊' },
  'Economía':               { anios: 5, dif: 65, ic: '📈' },
  'Contabilidad':           { anios: 5, dif: 55, ic: '🧮' },
  'Psicología':             { anios: 5, dif: 55, ic: '🧠' },
  'Arquitectura':           { anios: 5, dif: 65, ic: '📐' },
  'Educación':              { anios: 5, dif: 40, ic: '🍎' },
  'Comunicación':           { anios: 5, dif: 45, ic: '📰' },
  'Bellas Artes':           { anios: 4, dif: 35, ic: '🎨' },
  'Cine y Audiovisuales':   { anios: 4, dif: 45, ic: '🎬' },
  'Física':                 { anios: 5, dif: 85, ic: '⚛️' },
  'Biología':               { anios: 5, dif: 70, ic: '🧬' },
  'Enfermería':             { anios: 5, dif: 55, ic: '💉' },
  'Ciencias Políticas':     { anios: 5, dif: 55, ic: '🏛️' },
  'Música':                 { anios: 4, dif: 40, ic: '🎼' },
};
const POSGRADOS = {
  maestria:  { nombre: 'Maestría / MBA', anios: 2, req: 'universidad', costoMult: 1.6, ic: '🎓' },
  doctorado: { nombre: 'Doctorado (PhD)', anios: 4, req: 'maestria', costoMult: 0.6, ic: '📜' },
  residencia:{ nombre: 'Residencia médica (especialidad)', anios: 3, req: 'Medicina', costoMult: 0, pagada: 40000, ic: '🏥' },
  aviacion:  { nombre: 'Escuela de aviación', anios: 2, req: 'secundaria', costoFijo: 70000, ic: '✈️' },
};
const NIVEL_EDU = { ninguna: 0, primaria: 1, secundaria: 2, universidad: 3, maestria: 4, doctorado: 5 };

/* ---------- Trabajos ----------
   salarios: sueldo anual base (EE.UU.) por nivel. req: requisitos de ingreso.
   reqNivel: requisitos para ascender a un nivel concreto. */
const TRABAJOS = [
  // Sin estudios
  { id:'cajero', cat:'Sin estudios', ic:'🛒', niveles:['Cajero','Cajero senior','Supervisor de caja','Gerente de tienda'], salarios:[24000,27000,34000,52000], req:{} },
  { id:'mesero', cat:'Sin estudios', ic:'🍽️', niveles:['Mesero','Mesero senior','Jefe de sala'], salarios:[22000,28000,40000], req:{} },
  { id:'repartidor', cat:'Sin estudios', ic:'🛵', niveles:['Repartidor por app','Repartidor fijo','Coordinador de reparto'], salarios:[21000,26000,38000], req:{edadMin:18} },
  { id:'obrero', cat:'Sin estudios', ic:'👷', niveles:['Peón de obra','Obrero','Maestro de obra','Capataz'], salarios:[28000,34000,45000,58000], req:{salud:45} },
  { id:'limpieza', cat:'Sin estudios', ic:'🧹', niveles:['Personal de limpieza','Encargado de limpieza'], salarios:[21000,29000], req:{} },
  { id:'seguridad', cat:'Sin estudios', ic:'🦺', niveles:['Vigilante','Guardia de seguridad','Jefe de seguridad'], salarios:[25000,31000,45000], req:{salud:40} },
  { id:'agricultor', cat:'Sin estudios', ic:'🌾', niveles:['Jornalero','Agricultor','Capataz agrícola'], salarios:[20000,26000,36000], req:{} },
  { id:'callcenter', cat:'Sin estudios', ic:'🎧', niveles:['Teleoperador','Teleoperador senior','Supervisor'], salarios:[23000,27000,38000], req:{} },
  { id:'taxista', cat:'Sin estudios', ic:'🚕', niveles:['Conductor de app','Taxista','Dueño de flota pequeña'], salarios:[24000,30000,55000], req:{edadMin:18, licencia:true} },
  { id:'barista', cat:'Sin estudios', ic:'☕', niveles:['Barista','Barista principal','Encargado de cafetería'], salarios:[22000,26000,36000], req:{} },
  // Secundaria / técnico
  { id:'recepcionista', cat:'Secundaria', ic:'🛎️', niveles:['Recepcionista','Recepcionista senior','Jefe de recepción'], salarios:[28000,33000,45000], req:{edu:'secundaria'} },
  { id:'administrativo', cat:'Secundaria', ic:'🗂️', niveles:['Asistente administrativo','Administrativo','Jefe de oficina'], salarios:[30000,38000,52000], req:{edu:'secundaria'} },
  { id:'policia', cat:'Secundaria', ic:'👮', niveles:['Cadete','Oficial','Sargento','Teniente','Capitán','Comisario','Jefe de policía'], salarios:[38000,50000,60000,72000,88000,105000,140000], req:{edu:'secundaria', salud:55, sinAntecedentes:true} },
  { id:'bombero', cat:'Secundaria', ic:'🚒', niveles:['Bombero en prácticas','Bombero','Teniente de bomberos','Jefe de bomberos'], salarios:[36000,52000,70000,98000], req:{edu:'secundaria', salud:60} },
  { id:'militar', cat:'Secundaria', ic:'🎖️', niveles:['Soldado','Cabo','Sargento','Teniente','Capitán','Coronel','General'], salarios:[30000,36000,46000,58000,75000,110000,190000], req:{edu:'secundaria', salud:60, edadMax:30} },
  { id:'electricista', cat:'Secundaria', ic:'⚡', niveles:['Aprendiz','Electricista','Electricista maestro','Contratista eléctrico'], salarios:[32000,48000,62000,85000], req:{edu:'secundaria'} },
  { id:'mecanico', cat:'Secundaria', ic:'🔧', niveles:['Aprendiz de mecánico','Mecánico','Jefe de taller'], salarios:[30000,44000,60000], req:{edu:'secundaria'} },
  { id:'cocinero', cat:'Secundaria', ic:'👨‍🍳', niveles:['Ayudante de cocina','Cocinero','Sous chef','Chef ejecutivo'], salarios:[25000,34000,50000,85000], req:{edu:'secundaria'} },
  { id:'peluquero', cat:'Secundaria', ic:'💇', niveles:['Ayudante de peluquería','Estilista','Estilista de celebridades'], salarios:[23000,36000,90000], req:{edu:'secundaria'} },
  { id:'inmobiliario', cat:'Secundaria', ic:'🏘️', niveles:['Agente inmobiliario','Agente senior','Bróker'], salarios:[35000,65000,130000], req:{edu:'secundaria', apa:45} },
  // Universitarios
  { id:'medico', cat:'Universitario', ic:'🩺', niveles:['Médico interno','Médico general','Médico especialista','Jefe de servicio','Director médico'], salarios:[62000,125000,230000,310000,430000], req:{carrera:['Medicina']}, reqNivel:{2:{titulo:'residencia'}, 4:{int:70}} },
  { id:'enfermero', cat:'Universitario', ic:'💉', niveles:['Enfermero','Enfermero especialista','Supervisor de enfermería'], salarios:[60000,78000,98000], req:{carrera:['Enfermería','Medicina']} },
  { id:'abogado', cat:'Universitario', ic:'⚖️', niveles:['Abogado junior','Abogado asociado','Abogado senior','Socio','Socio director'], salarios:[58000,92000,155000,290000,520000], req:{carrera:['Derecho']} },
  { id:'juez', cat:'Universitario', ic:'👨‍⚖️', niveles:['Juez de paz','Juez de primera instancia','Juez superior','Magistrado supremo'], salarios:[90000,140000,190000,260000], req:{carrera:['Derecho'], int:70, edadMin:32, sinAntecedentes:true} },
  { id:'ingeniero', cat:'Universitario', ic:'🏗️', niveles:['Ingeniero junior','Ingeniero','Ingeniero senior','Jefe de proyectos','Director de ingeniería'], salarios:[65000,85000,110000,140000,190000], req:{carrera:['Ingeniería Civil','Ingeniería Aeroespacial','Física']} },
  { id:'programador', cat:'Universitario', ic:'💻', niveles:['Desarrollador junior','Desarrollador','Desarrollador senior','Líder técnico','Director de tecnología (CTO)'], salarios:[70000,95000,135000,170000,260000], req:{carrera:['Informática','Física','Ingeniería Civil','Ingeniería Aeroespacial']} },
  { id:'contador', cat:'Universitario', ic:'🧮', niveles:['Contador junior','Contador','Contador senior','Director financiero (CFO)'], salarios:[52000,68000,90000,210000], req:{carrera:['Contabilidad','Economía','Administración']} },
  { id:'ejecutivo', cat:'Universitario', ic:'💼', niveles:['Analista','Gerente','Director','Vicepresidente','Director general (CEO)'], salarios:[58000,98000,185000,360000,1600000], req:{carrera:['Administración','Economía','Contabilidad','Derecho','Ingeniería Civil','Informática']}, reqNivel:{3:{titulo:'maestria'}, 4:{int:72, fel:0}} },
  { id:'banquero', cat:'Universitario', ic:'🏦', niveles:['Analista de inversiones','Asociado','Vicepresidente','Director gerente','Socio'], salarios:[90000,150000,250000,450000,900000], req:{carrera:['Economía','Administración','Contabilidad'], int:65} },
  { id:'arquitecto', cat:'Universitario', ic:'📐', niveles:['Arquitecto junior','Arquitecto','Arquitecto principal','Socio fundador'], salarios:[55000,75000,105000,180000], req:{carrera:['Arquitectura']} },
  { id:'profesor', cat:'Universitario', ic:'🍎', niveles:['Profesor auxiliar','Profesor','Coordinador académico','Director de colegio'], salarios:[40000,50000,62000,85000], req:{carrera:['Educación','Música','Bellas Artes','Física','Biología','Psicología']} },
  { id:'catedratico', cat:'Universitario', ic:'📚', niveles:['Profesor asistente','Profesor asociado','Catedrático','Decano'], salarios:[75000,95000,130000,190000], req:{titulo:'doctorado'} },
  { id:'psicologo', cat:'Universitario', ic:'🧠', niveles:['Psicólogo','Psicólogo clínico','Director de clínica'], salarios:[55000,80000,120000], req:{carrera:['Psicología']} },
  { id:'periodista', cat:'Universitario', ic:'📰', niveles:['Reportero','Periodista','Editor','Jefe de redacción','Director de medio'], salarios:[38000,50000,68000,90000,160000], req:{carrera:['Comunicación','Ciencias Políticas','Derecho']} },
  { id:'cientifico', cat:'Universitario', ic:'🔬', niveles:['Investigador asistente','Investigador','Investigador principal','Director de laboratorio'], salarios:[55000,78000,110000,160000], req:{carrera:['Física','Biología','Ingeniería Aeroespacial','Medicina'], titulo:'maestria'} },
  { id:'disenador', cat:'Universitario', ic:'🎨', niveles:['Diseñador junior','Diseñador','Director de arte','Director creativo'], salarios:[42000,58000,85000,140000], req:{carrera:['Bellas Artes','Arquitectura','Comunicación','Cine y Audiovisuales']} },
  { id:'diplomatico', cat:'Universitario', ic:'🌐', niveles:['Agregado','Secretario de embajada','Cónsul','Embajador'], salarios:[60000,85000,120000,180000], req:{carrera:['Ciencias Políticas','Derecho','Economía'], int:60, sinAntecedentes:true} },
  { id:'musico', cat:'Universitario', ic:'🎻', niveles:['Músico de sesión','Músico de orquesta','Primer violín / solista','Director de orquesta'], salarios:[30000,52000,80000,150000], req:{carrera:['Música']} },
  { id:'piloto', cat:'Especial', ic:'✈️', niveles:['Primer oficial','Capitán','Capitán senior','Jefe de pilotos'], salarios:[90000,180000,250000,300000], req:{titulo:'aviacion', salud:55} },
];
/* Trabajos de medio tiempo para adolescentes */
const MEDIO_TIEMPO = [
  { id:'mt_niñera', ic:'🍼', titulo:'Niñera / Cuidador de niños', salario:4000 },
  { id:'mt_tienda', ic:'🏪', titulo:'Ayudante en bodega', salario:5000 },
  { id:'mt_lavacoches', ic:'🚗', titulo:'Lavacoches', salario:4500 },
  { id:'mt_comida', ic:'🍔', titulo:'Ayudante en comida rápida', salario:6000 },
  { id:'mt_tutor', ic:'✏️', titulo:'Tutor escolar', salario:5500, int:65 },
];

/* ---------- Objetivos de vida (elige primero tu meta) ---------- */
const OBJETIVOS = [
  { id:'libre',        ic:'🕊️', nombre:'Vida libre',          desc:'Sin meta fija: vive como quieras.', stats:[] },
  { id:'millonario',   ic:'💵', nombre:'Millonario',          desc:'Patrimonio neto de $1 M.', stats:['inteligencia'] },
  { id:'multimillonario',ic:'💎',nombre:'Multimillonario',    desc:'Patrimonio de $1.000 M (negocios e inversiones).', stats:['inteligencia'] },
  { id:'famoso',       ic:'🌟', nombre:'Celebridad',          desc:'Alcanzar 90 de fama.', stats:['apariencia','fama'] },
  { id:'ceo',          ic:'💼', nombre:'CEO',                 desc:'Ser Director general de una corporación o fundar una empresa de $100 M.', stats:['inteligencia'] },
  { id:'presidente',   ic:'🏛️', nombre:'Presidente',          desc:'Ganar la elección presidencial.', stats:['inteligencia','fama'] },
  { id:'astronauta',   ic:'🚀', nombre:'Astronauta',          desc:'Completar una misión espacial.', stats:['inteligencia','salud'] },
  { id:'supermodelo',  ic:'📸', nombre:'Supermodelo',         desc:'Llegar a la cima del modelaje.', stats:['apariencia','salud'] },
  { id:'director',     ic:'🎬', nombre:'Director de cine',    desc:'Ganar la Estatuilla Dorada a Mejor Película.', stats:['inteligencia','fama'] },
  { id:'realeza',      ic:'👑', nombre:'Realeza',             desc:'Ser Rey o Reina (también consorte).', stats:['apariencia','fama'] },
  { id:'capo',         ic:'🕶️', nombre:'Capo',                desc:'Llegar a Jefe del cártel sin morir en el intento.', stats:['salud','inteligencia'] },
  { id:'medico',       ic:'🩺', nombre:'Director médico',     desc:'Llegar a dirigir un hospital.', stats:['inteligencia'] },
  { id:'campeon',      ic:'🥊', nombre:'Campeón de lucha',    desc:'Ganar el cinturón mundial de MMA.', stats:['salud'] },
  { id:'familia',      ic:'👨‍👩‍👧‍👦', nombre:'Gran familia',   desc:'Casarte, tener 3+ hijos y llegar a los 60 con felicidad ≥ 70.', stats:['felicidad'] },
  { id:'matusalen',    ic:'🐢', nombre:'Matusalén',           desc:'Vivir 100 años.', stats:['salud','felicidad'] },
];
/* Retos opcionales */
const RETOS = [
  { id:'ninguno',   ic:'—',  nombre:'Sin reto', desc:'' },
  { id:'pobreRico', ic:'🪙', nombre:'De la nada a la cima', desc:'Nace en familia pobre y llega a $1 M.' },
  { id:'casanova',  ic:'💘', nombre:'Casanova', desc:'Cásate 4 veces.' },
  { id:'fugitivo',  ic:'🏃', nombre:'Fugitivo', desc:'Escápate de prisión 2 veces.' },
  { id:'erudito',   ic:'📜', nombre:'Erudito', desc:'Gradúate con honores y obtén un doctorado.' },
  { id:'santo',     ic:'😇', nombre:'Alma noble', desc:'Muere con karma ≥ 90 y habiendo donado $100.000.' },
  { id:'renacentista',ic:'🎭',nombre:'Renacentista', desc:'Trabaja en 5 profesiones distintas.' },
  { id:'ermitano',  ic:'🏔️', nombre:'Ermitaño feliz', desc:'Llega a 70 sin casarte ni tener hijos, felicidad ≥ 60.' },
  { id:'dinastia',  ic:'🏰', nombre:'Dinastía', desc:'Tres generaciones seguidas mueren millonarias.' },
];

/* ---------- Bienes ---------- */
const TIPOS_CASA = [
  { n:'Minidepartamento', base:60000, ic:'🏢' },
  { n:'Departamento de 2 habitaciones', base:140000, ic:'🏬' },
  { n:'Casa familiar', base:260000, ic:'🏠' },
  { n:'Cabaña en la montaña', base:180000, ic:'🛖' },
  { n:'Casa con jardín y piscina', base:550000, ic:'🏡' },
  { n:'Penthouse', base:1500000, ic:'🌆' },
  { n:'Casa de campo con viñedo', base:1200000, ic:'🍇' },
  { n:'Edificio de departamentos', base:3500000, ic:'🏢', renta:0.075 },
  { n:'Mansión', base:4500000, ic:'🏰' },
  { n:'Villa frente al mar', base:9000000, ic:'🏖️' },
  { n:'Castillo europeo', base:25000000, ic:'🏯' },
  { n:'Isla privada', base:45000000, ic:'🏝️' },
];
const TIPOS_TERRENO = [
  { n:'Terreno agrícola', base:40000, ic:'🌾' },
  { n:'Lote urbano', base:120000, ic:'📍' },
  { n:'Hectáreas en la selva', base:300000, ic:'🌳' },
  { n:'Hectáreas frente al mar', base:900000, ic:'🌊' },
];
const TIPOS_AUTO = [
  { n:'Moto urbana', base:3000, ic:'🛵' },
  { n:'Auto usado económico', base:6000, ic:'🚙' },
  { n:'Moto de alta gama', base:30000, ic:'🏍️' },
  { n:'Sedán compacto nuevo', base:22000, ic:'🚗' },
  { n:'SUV familiar', base:42000, ic:'🚐' },
  { n:'Camioneta pickup', base:48000, ic:'🛻' },
  { n:'Sedán de lujo', base:95000, ic:'🚘' },
  { n:'Deportivo italiano', base:280000, ic:'🏎️' },
  { n:'Auto clásico de colección', base:120000, ic:'🚔', aprecia:true },
  { n:'Limusina', base:200000, ic:'🚖' },
  { n:'Hiperdeportivo', base:2500000, ic:'🏁' },
  { n:'Helicóptero', base:3000000, ic:'🚁' },
];
const TIPOS_LUJO = [
  { n:'Reloj de alta relojería', base:35000, ic:'⌚' },
  { n:'Colección de vinos', base:80000, ic:'🍾', aprecia:true },
  { n:'Joyas de diamantes', base:150000, ic:'💍', aprecia:true },
  { n:'Obra de arte', base:250000, ic:'🖼️', aprecia:true },
  { n:'Caballo de carreras', base:400000, ic:'🏇' },
  { n:'Yate', base:6000000, ic:'🛥️' },
  { n:'Submarino privado', base:15000000, ic:'🛟' },
  { n:'Jet privado', base:25000000, ic:'🛩️' },
  { n:'Club de fútbol', base:250000000, ic:'⚽' },
];

/* ---------- Negocios ---------- */
const SECTORES = [
  { id:'cafe',     n:'Cafetería',          ic:'☕', inv:40000,   margen:0.12, riesgo:0.25, escala:1.0 },
  { id:'rest',     n:'Restaurante',        ic:'🍝', inv:120000,  margen:0.10, riesgo:0.30, escala:1.2 },
  { id:'ropa',     n:'Tienda de ropa',     ic:'👗', inv:80000,   margen:0.14, riesgo:0.25, escala:1.3 },
  { id:'gym',      n:'Gimnasio',           ic:'🏋️', inv:150000,  margen:0.15, riesgo:0.20, escala:1.2 },
  { id:'agencia',  n:'Agencia de marketing',ic:'📣', inv:60000,  margen:0.18, riesgo:0.30, escala:1.6 },
  { id:'constr',   n:'Constructora',       ic:'🏗️', inv:500000,  margen:0.12, riesgo:0.20, escala:1.5 },
  { id:'inmob',    n:'Inmobiliaria',       ic:'🏘️', inv:300000,  margen:0.16, riesgo:0.20, escala:1.6 },
  { id:'fabrica',  n:'Fábrica de alimentos',ic:'🏭', inv:1000000, margen:0.11, riesgo:0.15, escala:1.8 },
  { id:'startup',  n:'Startup tecnológica',ic:'🚀', inv:200000,  margen:0.05, riesgo:0.55, escala:3.0 },
  { id:'farma',    n:'Laboratorio farmacéutico',ic:'💊', inv:3000000, margen:0.20, riesgo:0.35, escala:2.2 },
];

/* ---------- Crimen ---------- */
const CRIMENES = [
  { id:'hurto',    ic:'🍫', n:'Robar en una tienda',     edad:10, exito:0.78, botin:[10,250],      pena:[0,1],  karma:-3 },
  { id:'cartera',  ic:'👛', n:'Robar una cartera',       edad:12, exito:0.66, botin:[20,600],      pena:[0,1],  karma:-5 },
  { id:'vandal',   ic:'🖌️', n:'Hacer grafitis / vandalismo', edad:12, exito:0.7, botin:[0,0],       pena:[0,1],  karma:-2, fel:4 },
  { id:'auto',     ic:'🚗', n:'Robar un auto',           edad:16, exito:0.48, botin:[2000,22000],  pena:[1,4],  karma:-8 },
  { id:'casa',     ic:'🏚️', n:'Allanar una casa',        edad:16, exito:0.5,  botin:[400,15000],   pena:[2,6],  karma:-10 },
  { id:'estafa',   ic:'💻', n:'Estafa por internet',     edad:16, exito:0.55, botin:[1000,60000],  pena:[1,5],  karma:-9, int:55 },
  { id:'joyeria',  ic:'💍', n:'Asaltar una joyería',     edad:18, exito:0.35, botin:[15000,180000],pena:[4,10], karma:-14 },
  { id:'banco',    ic:'🏦', n:'Asaltar un banco',        edad:18, exito:0.22, botin:[60000,800000],pena:[8,20], karma:-18 },
];
const RANGOS_ORG = ['Vendedor callejero','Distribuidor','Productor','Lugarteniente','Capo','Jefe del cártel'];
const RESPETO_RANGO = [0, 35, 90, 180, 320, 520];

/* ---------- Salud ---------- */
const ENFERMEDADES = {
  'Gripe fuerte':     { grav: 3,  cura: 0.95, costo: 150,   muerte: 0.002, ic:'🤧' },
  'Neumonía':         { grav: 10, cura: 0.85, costo: 3000,  muerte: 0.03, ic:'🫁' },
  'Depresión':        { grav: 2,  fel: -10,   cura: 0.55, costo: 1800, mental: true, ic:'🌧️' },
  'Ansiedad':         { grav: 1,  fel: -8,    cura: 0.6,  costo: 1500, mental: true, ic:'😰' },
  'Insomnio':         { grav: 2,  fel: -5,    cura: 0.7,  costo: 600, ic:'🌙' },
  'Hipertensión':     { grav: 2,  cura: 0.45, costo: 1200,  muerte: 0.004, ic:'❤️‍🩹' },
  'Diabetes tipo 2':  { grav: 3,  cura: 0.15, costo: 2500,  muerte: 0.006, ic:'🩸' },
  'Migraña crónica':  { grav: 1,  fel: -6,    cura: 0.5,  costo: 800, ic:'🤕' },
  'Lesión de rodilla':{ grav: 4,  cura: 0.8,  costo: 9000, ic:'🦵' },
  'Cáncer':           { grav: 15, cura: 0.5,  costo: 90000, muerte: 0.1, ic:'🎗️' },
  'Insuficiencia cardíaca': { grav: 10, cura: 0.35, costo: 60000, muerte: 0.08, ic:'💔' },
  'Alzhéimer':        { grav: 6, intel: -10, cura: 0.02, costo: 20000, muerte: 0.05, ic:'🧩' },
};

/* ---------- Cine ---------- */
const GENEROS_CINE = ['Acción','Comedia','Drama','Terror','Ciencia ficción','Animación','Romance','Suspenso','Documental','Musical'];
const PALABRAS_TITULO = {
  a: ['La última','El silencio de la','Sombras de la','El regreso de la','Crónicas de la','La noche de la','Más allá de la','El secreto de la','Fuego en la','Corazones de la'],
  b: ['frontera','ciudad','tormenta','luna','memoria','selva','montaña','familia','galaxia','revolución','costa','herencia'],
};

/* ---------- Política ---------- */
const CARGOS = {
  concejal:    { n:'Concejal',           edad:21, costo:8000,     salario:45000,  mandato:4, nivel:1, dif:0.0 },
  alcalde:     { n:'Alcalde',            edad:25, costo:60000,    salario:95000,  mandato:4, nivel:2, dif:0.08, req:['concejal'] },
  congresista: { n:'Congresista',        edad:25, costo:180000,   salario:150000, mandato:5, nivel:3, dif:0.12, req:['concejal','alcalde'] },
  gobernador:  { n:'Gobernador regional',edad:30, costo:400000,   salario:170000, mandato:4, nivel:3, dif:0.14, req:['alcalde','congresista'] },
  presidente:  { n:'Presidente',         edad:35, costo:3000000,  salario:400000, mandato:5, nivel:4, dif:0.22, req:['congresista','gobernador'] },
};
const TEMAS = ['Economía','Seguridad','Salud','Educación','Corrupción','Medio ambiente','Empleo','Vivienda'];

/* ---------- Logros (persisten entre vidas) ---------- */
const LOGROS = [
  { id:'primerTrabajo', ic:'💼', n:'Primer sueldo', d:'Consigue tu primer empleo.' },
  { id:'graduado',      ic:'🎓', n:'Graduado', d:'Termina la universidad.' },
  { id:'honores',       ic:'🏅', n:'Cum laude', d:'Gradúate con honores.' },
  { id:'doctor',        ic:'📜', n:'Doctor', d:'Obtén un doctorado.' },
  { id:'millon',        ic:'💵', n:'Millonario', d:'Patrimonio de $1 M.' },
  { id:'milmillones',   ic:'💎', n:'Club de los mil millones', d:'Patrimonio de $1.000 M.' },
  { id:'casado',        ic:'💍', n:'Sí, acepto', d:'Cásate.' },
  { id:'padre',         ic:'🍼', n:'Familia', d:'Ten tu primer hijo.' },
  { id:'abuelo',        ic:'👴', n:'Abuelos', d:'Ten un nieto.' },
  { id:'carcel',        ic:'⛓️', n:'Tras las rejas', d:'Ve a prisión.' },
  { id:'fuga',          ic:'🏃', n:'Gran escape', d:'Escápate de prisión.' },
  { id:'capo',          ic:'🕶️', n:'El patrón', d:'Llega a Jefe del cártel.' },
  { id:'presidente',    ic:'🏛️', n:'Su Excelencia', d:'Gana la presidencia.' },
  { id:'rey',           ic:'👑', n:'Coronación', d:'Ocupa un trono.' },
  { id:'astronauta',    ic:'🚀', n:'Más allá del cielo', d:'Viaja al espacio.' },
  { id:'supermodelo',   ic:'📸', n:'Ícono de pasarela', d:'Conviértete en supermodelo.' },
  { id:'estatuilla',    ic:'🏆', n:'Estatuilla Dorada', d:'Gana el máximo premio del cine.' },
  { id:'campeon',       ic:'🥊', n:'Cinturón mundial', d:'Sé campeón de MMA.' },
  { id:'ceo',           ic:'🏢', n:'Director general', d:'Llega a CEO.' },
  { id:'loteria',       ic:'🎰', n:'Golpe de suerte', d:'Gana el premio mayor de la lotería.' },
  { id:'centenario',    ic:'🎂', n:'Centenario', d:'Cumple 100 años.' },
  { id:'famoso',        ic:'🌟', n:'Estrella', d:'Llega a 90 de fama.' },
  { id:'viral',         ic:'📱', n:'Viral', d:'Llega a 1 millón de seguidores.' },
  { id:'empresario',    ic:'🏪', n:'Emprendedor', d:'Funda tu primer negocio.' },
  { id:'bolsa',         ic:'🔔', n:'Toque de campana', d:'Saca una empresa a bolsa.' },
  { id:'generacion3',   ic:'🌳', n:'Árbol genealógico', d:'Juega 3 generaciones de una familia.' },
  { id:'objetivo',      ic:'🎯', n:'Misión cumplida', d:'Completa un objetivo de vida.' },
  { id:'reto',          ic:'🏵️', n:'Retador', d:'Completa un reto.' },
  { id:'rasgo',         ic:'🧬', n:'Conócete a ti mismo', d:'Descubre uno de tus rasgos ocultos.' },
  { id:'historia',      ic:'↩️', n:'El pasado vuelve', d:'Vive una historia que regresa de tu pasado.' },
  { id:'legado',        ic:'🏛️', n:'Herencia eterna', d:'Compra tu primera mejora de legado.' },
  { id:'detective',     ic:'🔎', n:'Detective', d:'Desenmascara a un asesino en serie.' },
  { id:'sombra',        ic:'🌑', n:'Doble vida', d:'Cumple tu código por primera vez.' },
  { id:'apodo',         ic:'📺', n:'Te bautizaron', d:'Los medios te ponen un apodo.' },
  { id:'portada',       ic:'📰', n:'Chica/chico de portada', d:'Sal en la portada de una revista.' },
  { id:'semanaModa',    ic:'👠', n:'Pasarela', d:'Desfila en una Semana de la Moda.' },
  { id:'embajador',     ic:'🤝', n:'Rostro de la marca', d:'Firma un contrato de embajador.' },
  { id:'icono',         ic:'👑', n:'Ícono de la moda', d:'Llega a lo más alto del modelaje.' },
  { id:'maestro',       ic:'🎖️', n:'Maestría', d:'Lleva una habilidad a nivel 10.' },
  { id:'vecino',        ic:'🏘️', n:'Buen vecino', d:'Hazte amigo de un vecino.' },
  { id:'portal',        ic:'🌀', n:'¿Qué es eso verde?', d:'Ve un portal al multiverso.' },
  { id:'multiverso',    ic:'🪐', n:'Viajero entre mundos', d:'Salta a otra versión de tu vida.' },
  { id:'tesoro',        ic:'🏺', n:'Cazatesoros', d:'Encuentra un artículo legendario.' },
  { id:'subasta',       ic:'🔨', n:'¡Vendido!', d:'Vende algo por más de $1 M en una subasta.' },
  { id:'mercadoNegro',  ic:'🕳️', n:'Bajo la mesa', d:'Compra algo en el mercado negro.' },
  { id:'serie',         ic:'🎞️', n:'Basado en hechos reales', d:'Estrenan una serie sobre tu vida.' },
];
