/* =============================================================
   PORTAL DE TRABAJO — datos de prueba
   -------------------------------------------------------------
   Contenido simulado del prototipo. En un sistema real estos
   objetos llegarían desde una base de datos a través de una API.
   Aquí se mantienen en el navegador para poder recorrer las
   pantallas sin servidor.

   Estructura:
     EMPRESAS      -> directorio de empresas del portal
     VACANTES      -> ofertas publicadas (base de la búsqueda)
     RECURSOS      -> artículos, tutoriales y videos
     TEMAS_FORO    -> hilos de discusión
     POSTULACIONES -> candidatos por vacante (módulo empresarial)
     MODERACION    -> contenidos denunciados (administración)
   ============================================================= */

/* Configuración nacional compartida por formularios, filtros y fechas. */
const CONFIG_PORTAL = Object.freeze({
  pais:"SV", nombrePais:"El Salvador", locale:"es-SV", moneda:"USD",
  zonaHoraria:"America/El_Salvador", prefijoTelefono:"+503",
  ciudades:Object.freeze(["San Salvador","Santa Tecla","Santa Ana","San Miguel","Sonsonate"])
});
// Compatibilidad de la demo anterior. No se reescriben textos ni auditorías.
const CIUDADES_DEMO_ANTERIORES = Object.freeze({Quito:"San Salvador",Guayaquil:"Santa Tecla",Cuenca:"San Miguel",Loja:"Santa Ana",Ambato:"Sonsonate"});
function ciudadDelPortal(ciudad) { return CIUDADES_DEMO_ANTERIORES[ciudad] || ciudad; }
function correoDemoLocal(correo) {
  const anteriores={"admin@portaltrabajo.ec":"admin@portaltrabajo.example","rrhh@empresa-demo.ec":"rrhh@empresa-demo.example","candidato@demo.ec":"candidato@demo.example","ana.morales@correo.ec":"ana.morales@correo.example","talento@andessoftware.ec":"talento@cuscatlansoftware.example"};
  return anteriores[correo] || correo;
}

/* Empresa de ejemplo reutilizada en varias pantallas */
const EMPRESAS = [
  {
    id: 1,
    nombre: "Cuscatlán Software",
    iniciales: "CS",
    rubro: "Tecnología",
    tamano: "120 empleados",
    ciudad: "San Salvador",
    valoracion: 4.6,
    resenas: 38,
    descripcion:
      "Empresa salvadoreña de desarrollo de software para el sector financiero. Trabaja con equipos pequeños, metodología ágil y horarios flexibles.",
  },
  {
    id: 2,
    nombre: "Café Altura",
    iniciales: "CA",
    rubro: "Agroindustria",
    tamano: "310 empleados",
    ciudad: "Santa Ana",
    valoracion: 4.1,
    resenas: 52,
    descripcion:
      "Cooperativa de exportación de café de altura. Combina procesos productivos con programas de formación para jóvenes técnicos.",
  },
  {
    id: 3,
    nombre: "Estudio Cardinal",
    iniciales: "EC",
    rubro: "Diseño y publicidad",
    tamano: "24 empleados",
    ciudad: "Santa Tecla",
    valoracion: 4.8,
    resenas: 17,
    descripcion:
      "Estudio creativo enfocado en identidad de marca y editorial. Cultura de crítica abierta y acompañamiento de proyectos personales.",
  },
  {
    id: 4,
    nombre: "Salud Integral",
    iniciales: "SI",
    rubro: "Salud",
    tamano: "540 empleados",
    ciudad: "San Miguel",
    valoracion: 3.7,
    resenas: 64,
    descripcion:
      "Red de clínicas privadas con presencia en cuatro departamentos. Ofrece turnos rotativos y convenios de especialización.",
  },
  {
    id: 5,
    nombre: "Ruta Norte",
    iniciales: "RN",
    rubro: "Logística",
    tamano: "210 empleados",
    ciudad: "Sonsonate",
    valoracion: 4.0,
    resenas: 29,
    descripcion:
      "Operador logístico de carga terrestre regional. Fuerte inversión en seguridad vial y capacitación de conductores.",
  },
  {
    id: 6,
    nombre: "Banco del Valle",
    iniciales: "BV",
    rubro: "Finanzas",
    tamano: "890 empleados",
    ciudad: "San Salvador",
    valoracion: 3.9,
    resenas: 81,
    descripcion:
      "Institución financiera con red nacional de agencias. Programa de rotación gerencial para profesionales en formación.",
  },
];

/* Las seis empresas de demostración representan registros ya aprobados. */
EMPRESAS.forEach(e => { e.estadoRegistro = "aprobado"; e.pais=CONFIG_PORTAL.pais; });
const empresasRegistradas = leerObjeto("pt_flujos_v1").empresas;
if (Array.isArray(empresasRegistradas)) {
  empresasRegistradas.filter(e => e && Number.isSafeInteger(e.id) && e.estadoRegistro === "aprobado" && ["nombre","iniciales","rubro","tamano","ciudad","descripcion"].every(k=>typeof e[k] === "string")).forEach(e => {
    if (!EMPRESAS.some(base => base.id === e.id)) EMPRESAS.push(e);
  });
}

/* Vacantes: cada una indica el tipo de contrato, modalidad,
   nivel de experiencia y salario mensual en dólares. */
const VACANTES = [
  {
    id: 101,
    titulo: "Desarrollador Frontend Junior",
    empresaId: 1,
    ciudad: "San Salvador",
    modalidad: "Híbrido",
    contrato: "Indefinido",
    nivel: "Junior",
    sector: "Tecnología",
    salario: 850,
    publicada: "2026-10-14",
    destacada: true,
    resumen:
      "Únete al equipo de producto para construir interfaces de usuario con React y TypeScript.",
  },
  {
    id: 102,
    titulo: "Analista de Datos",
    empresaId: 6,
    ciudad: "San Salvador",
    modalidad: "Presencial",
    contrato: "Indefinido",
    nivel: "Semi senior",
    sector: "Finanzas",
    salario: 1400,
    publicada: "2026-10-16",
    destacada: false,
    resumen:
      "Modelado de datos comerciales y construcción de tableros de seguimiento para la gerencia.",
  },
  {
    id: 103,
    titulo: "Diseñador Gráfico",
    empresaId: 3,
    ciudad: "Santa Tecla",
    modalidad: "Remoto",
    contrato: "Por proyecto",
    nivel: "Mid level",
    sector: "Diseño",
    salario: 700,
    publicada: "2026-10-17",
    destacada: true,
    resumen:
      "Desarrollo de identidad visual para clientes regionales, desde el concepto hasta el manual.",
  },
  {
    id: 104,
    titulo: "Técnico de Mantenimiento",
    empresaId: 2,
    ciudad: "Santa Ana",
    modalidad: "Presencial",
    contrato: "Indefinido",
    nivel: "Junior",
    sector: "Agroindustria",
    salario: 620,
    publicada: "2026-10-12",
    destacada: false,
    resumen:
      "Mantenimiento preventivo y correctivo de líneas de beneficio y empaque de café.",
  },
  {
    id: 105,
    titulo: "Enfermera/o de Turno",
    empresaId: 4,
    ciudad: "San Miguel",
    modalidad: "Presencial",
    contrato: "Por horas",
    nivel: "Junior",
    sector: "Salud",
    salario: 780,
    publicada: "2026-10-18",
    destacada: false,
    resumen:
      "Atención de pacientes en pabellón de hospitalización durante turno nocturno.",
  },
  {
    id: 106,
    titulo: "Coordinador de Logística",
    empresaId: 5,
    ciudad: "Sonsonate",
    modalidad: "Híbrido",
    contrato: "Indefinido",
    nivel: "Senior",
    sector: "Logística",
    salario: 1900,
    publicada: "2026-10-10",
    destacada: false,
    resumen:
      "Planificación de rutas, control de flota y negociación con transportistas aliados.",
  },
  {
    id: 107,
    titulo: "Prácticas en Recursos Humanos",
    empresaId: 6,
    ciudad: "San Salvador",
    modalidad: "Híbrido",
    contrato: "Prácticas",
    nivel: "Estudiante",
    sector: "Finanzas",
    salario: 300,
    publicada: "2026-10-19",
    destacada: true,
    resumen:
      "Apoyo en selección, inducción y archivo de personal durante el semestre académico.",
  },
  {
    id: 108,
    titulo: "Desarrollador Backend",
    empresaId: 1,
    ciudad: "San Salvador",
    modalidad: "Remoto",
    contrato: "Indefinido",
    nivel: "Semi senior",
    sector: "Tecnología",
    salario: 1650,
    publicada: "2026-10-15",
    destacada: false,
    resumen:
      "Construcción y mantenimiento de servicios REST en Node.js y PostgreSQL.",
  },
  {
    id: 109,
    titulo: "Contador General",
    empresaId: 2,
    ciudad: "Santa Ana",
    modalidad: "Presencial",
    contrato: "Indefinido",
    nivel: "Senior",
    sector: "Agroindustria",
    salario: 1250,
    publicada: "2026-10-09",
    destacada: false,
    resumen:
      "Cierre contable mensual, declaraciones tributarias y reportes a la junta directiva.",
  },
  {
    id: 110,
    titulo: "Community Manager",
    empresaId: 3,
    ciudad: "Santa Tecla",
    modalidad: "Remoto",
    contrato: "Por horas",
    nivel: "Junior",
    sector: "Diseño",
    salario: 480,
    publicada: "2026-10-18",
    destacada: false,
    resumen:
      "Gestión de contenidos en redes sociales para tres marcas del portafolio del estudio.",
  },
];

VACANTES.forEach(v=>{v.pais=CONFIG_PORTAL.pais;});

/* Vacante completa para la pantalla de detalle.
   Las demás pantallas usan los datos resumidos de arriba. */
const DETALLE_VACANTE = {
  id: 101,
  responsabilidades: [
    "Implementar interfaces web siguiendo los diseños entregados en Figma.",
    "Construir componentes reutilizables en React y mantener su documentación.",
    "Participar en revisiones de código con el equipo de producto.",
    "Corregir incidencias reportadas por soporte técnico dentro del ciclo ágil.",
  ],
  requisitos: [
    "Conocimientos sólidos de HTML, CSS y JavaScript moderno.",
    "Experiencia previa con al menos un framework de interfaz (React, Vue o similar).",
    "Nivel de inglés técnico de lectura.",
    "Disponibilidad para trabajo híbrido en San Salvador (3 días en oficina).",
  ],
  beneficios: [
    "Jornada de 40 horas semanales con horario flexible.",
    "Presupuesto anual de capacitación y certificaciones.",
    "Seguro médico privado desde el tercer mes.",
    "Dos días de trabajo remoto adicionales al mes para formación.",
  ],
  contacto: {
    correo: "talento@cuscatlansoftware.example",
    telefono: "+503 0000 0000",
    direccion: "Dirección de demostración, San Salvador",
    responsable: "Carla Andrade — Talento humano",
  },
};

/* Reseñas de la empresa asociada a la vacante en detalle */
const RESENAS_EMPRESA = [
  {
    autor: "Mateo López",
    iniciales: "ML",
    fecha: "2026-09-28",
    nota: 5,
    texto:
      "Entré como junior y el acompañamiento fue real: tuve mentor asignado durante los primeros tres meses. Las revisiones de código son exigentes pero muy útiles.",
  },
  {
    autor: "Paula Herrera",
    iniciales: "PH",
    fecha: "2026-08-14",
    nota: 4,
    texto:
      "El horario flexible ayuda mucho. Mejorable: la comunicación entre equipos depende demasiado de una sola persona.",
  },
  {
    autor: "Diego Pérez",
    iniciales: "DP",
    fecha: "2026-07-02",
    nota: 5,
    texto:
      "Los proyectos son interesantes y el salario está por encima del promedio del sector en San Salvador.",
  },
];

/* Recursos: artículos, tutoriales y videos */
const RECURSOS = [
  {
    id: 1,
    tipo: "Artículo",
    titulo: "Cómo armar un currículum que pase el primer filtro",
    resumen:
      "Los sistemas de selección automática buscan palabras clave exactas. Aprende a ordenar tu documento para que lo lea primero una máquina y después una persona.",
    autor: "Carla Andrade",
    duracion: "8 min de lectura",
    categoria: "Currículum",
  },
  {
    id: 2,
    tipo: "Video",
    titulo: "Simulacro de entrevista técnica: 25 minutos",
    resumen:
      "Grabación de una entrevista real simulada con preguntas de fondo técnico, algoritmos y trabajo en equipo, con comentarios del entrevistador.",
    autor: "Cuscatlán Software",
    duracion: "25:40",
    categoria: "Entrevistas",
  },
  {
    id: 3,
    tipo: "Tutorial",
    titulo: "Negociar el salario sin perder la oferta",
    resumen:
      "Guía paso a paso con rangos salariales del mercado salvadoreño y frases concretas para usar durante la conversación.",
    autor: "Rocío López",
    duracion: "12 min de lectura",
    categoria: "Carrera",
  },
  {
    id: 4,
    tipo: "Artículo",
    titulo: "Perfil de LinkedIn que atrae reclutadores",
    resumen:
      "Qué incluir en el titular, cómo describir logros con cifras y por qué el resumen importa más que la lista de habilidades.",
    autor: "Estudio Cardinal",
    duracion: "6 min de lectura",
    categoria: "Marca personal",
  },
  {
    id: 5,
    tipo: "Video",
    titulo: "Errores comunes en la prueba práctica",
    resumen:
      "Revisión de cinco pruebas reales anonimizadas: qué separa un entregado aceptable de uno sobresaliente.",
    autor: "Cuscatlán Software",
    duracion: "18:12",
    categoria: "Entrevistas",
  },
  {
    id: 6,
    tipo: "Tutorial",
    titulo: "Carta de presentación breve y concreta",
    resumen:
      "Plantilla de cuatro párrafos adaptada a ofertas de tecnología, salud y administración, con ejemplos reales.",
    autor: "Carla Andrade",
    duracion: "9 min de lectura",
    categoria: "Currículum",
  },
];

/* Temas del foro de discusión */
const TEMAS_FORO = [
  {
    id: 1,
    titulo: "¿Cuánto pedir en el primer empleo como desarrollador?",
    categoria: "Tecnología",
    autor: "Jorge Ponce",
    iniciales: "JP",
    respuestas: 34,
    vistas: 1280,
    ultimo: "hace 2 horas",
    fijado: true,
  },
  {
    id: 2,
    titulo: "Experiencia con entrevistas en el sector salud",
    categoria: "Salud",
    autor: "Nadia Ruiz",
    iniciales: "NR",
    respuestas: 12,
    vistas: 430,
    ultimo: "hace 5 horas",
    fijado: false,
  },
  {
    id: 3,
    titulo: "Prácticas remotas: ¿sirven tanto como las presenciales?",
    categoria: "Primer empleo",
    autor: "Iván García",
    iniciales: "IG",
    respuestas: 27,
    vistas: 910,
    ultimo: "ayer",
    fijado: false,
  },
  {
    id: 4,
    titulo: "Portfolio de diseño sin clientes: qué proyectos poner",
    categoria: "Diseño",
    autor: "Camila Flores",
    iniciales: "CF",
    respuestas: 19,
    vistas: 640,
    ultimo: "hace 3 días",
    fijado: false,
  },
  {
    id: 5,
    titulo: "Vacantes falsas: cómo detectarlas antes de enviar datos",
    categoria: "Seguridad laboral",
    autor: "Foro — Equipo del portal",
    iniciales: "FP",
    respuestas: 48,
    vistas: 3105,
    ultimo: "hace 1 día",
    fijado: true,
  },
  {
    id: 6,
    titulo: "Consejos para el turno nocturno en salud",
    categoria: "Salud",
    autor: "Sofía Guamán",
    iniciales: "SG",
    respuestas: 8,
    vistas: 260,
    ultimo: "hace 6 días",
    fijado: false,
  },
];

/* Postulantes por vacante (lo consulta la empresa) */
const POSTULACIONES = [
  {
    vacanteId: 101,
    candidatos: [
      {
        nombre: "Ana Belén Morales",
        iniciales: "AM",
        titulo: "Ingeniera en Sistemas — UES",
        experiencia: "1 año de prácticas",
        habilidades: ["React", "CSS", "Git"],
        estado: "Nueva",
      },
      {
        nombre: "Kevin Hernández",
        iniciales: "KH",
        titulo: "Técnico en Desarrollo de Software — ITCA-FEPADE",
        experiencia: "2 años freelance",
        habilidades: ["Vue", "JavaScript", "REST"],
        estado: "En revisión",
      },
      {
        nombre: "Marcela Martínez",
        iniciales: "MM",
        titulo: "Diseñadora de Interacción — UDB",
        experiencia: "1.5 años",
        habilidades: ["Figma", "React", "Accesibilidad"],
        estado: "Preseleccionada",
      },
    ],
  },
];

/* Contenidos denunciados que revisa la administración */
const MODERACION = [
  {
    id: 1,
    tipo: "Reseña",
    contenido:
      "Trabajé tres años en Salud Integral y el ambiente entre compañeros es bueno, aunque la comunicación con jefaturas mejora cuando hay proyectos definidos.",
    autor: "Usuario 4471",
    motivo: "Denunciada por posible contenido difamatorio",
    fecha: "2026-10-17",
  },
  {
    id: 2,
    tipo: "Tema de foro",
    contenido:
      "¿Alguien tiene el contacto del reclutador de Ruta Norte? Es urgente, escribo por WhatsApp y no responde.",
    autor: "Usuario 8820",
    motivo: "Solicitud de datos de contacto personales",
    fecha: "2026-10-18",
  },
  {
    id: 3,
    tipo: "Comentario",
    contenido:
      "Esta oferta de empleo parece falsa, piden pagar 40 USD por el uniforme antes de empezar.",
    autor: "Usuario 1193",
    motivo: "Posible fraude reportado en vacante #112",
    fecha: "2026-10-19",
  },
];

/* Actividad reciente del panel administrativo */
const ACTIVIDAD_ADMIN = [
  { texto: "Cuscatlán Software publicó la vacante «Desarrollador Backend»", hora: "hace 1 h", tono: "bermellon" },
  { texto: "32 nuevas postulaciones registradas hoy", hora: "hace 2 h", tono: "verde" },
  { texto: "Salud Integral actualizó su ficha de empresa", hora: "hace 4 h", tono: "" },
  { texto: "Se denunció una reseña de la empresa Ruta Norte", hora: "hace 6 h", tono: "ambar" },
  { texto: "Se dio de baja al usuario 2291 por publicación repetida", hora: "ayer", tono: "" },
];

/* Utilidad compartida: convierte la fecha en texto cercano */
function fechaCercana(iso) {
  if (typeof iso !== "string" || !iso.trim()) return "Fecha no disponible";
  const fecha = typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : fechaISOElSalvador(new Date(iso));
  if (!fecha || Number.isNaN(Date.parse(fecha))) return "Fecha no disponible";
  const dias = Math.round((Date.parse(fechaHoy()+"T00:00:00Z")-Date.parse(fecha+"T00:00:00Z"))/86400000);
  if (dias < 0) return "Próximamente";
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} ${Math.floor(dias / 7) === 1 ? "semana" : "semanas"}`;
  return `hace ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? "mes" : "meses"}`;
}

/* Devuelve el nombre de la empresa a partir del id */
function empresaPorId(id) {
  return EMPRESAS.find((e) => e.id === id) || EMPRESAS[0];
}

/* Formatea el salario en dólares. Las ofertas publicadas sin salario
   (el campo es opcional) se muestran como "A convenir". */
function salarioFormateado(valor) {
  if (valor === null || valor === undefined || valor === "") return "A convenir";
  return `$${Number(valor).toLocaleString(CONFIG_PORTAL.locale,{maximumFractionDigits:2})}`;
}

/* =============================================================
   PERSISTENCIA DEL PROTOTIPO (sin servidor)
   -------------------------------------------------------------
   El portal son páginas HTML independientes: al navegar se recarga
   todo y los cambios en memoria se perderían. Para que las acciones
   de un módulo se vean en otro (publicar una vacante y encontrarla
   en el buscador, postularse y verlo en el perfil, publicar un tema
   y conservarlo en el foro) se guardan en localStorage.
   ============================================================= */

const CLAVES_ALMACEN = {
  vacantes: "pt_vacantes_extra",
  postulaciones: "pt_postulaciones",
  temasForo: "pt_temas_foro",
};

/* Lectura tolerante a errores: si el navegador bloquea localStorage
   o el contenido está dañado, se devuelve el valor de respaldo. */
function leerAlmacen(clave, respaldo) {
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return respaldo;
    const dato = JSON.parse(crudo);
    return dato === null || dato === undefined ? respaldo : dato;
  } catch (error) {
    return respaldo;
  }
}

function escribirAlmacen(clave, valor) {
  try {
    // Un almacén dañado no debe desaparecer al intentar guardar un cambio.
    const anterior = localStorage.getItem(clave);
    if (anterior !== null) {
      const existente = JSON.parse(anterior);
      if (existente !== null && (typeof existente !== typeof valor || Array.isArray(existente) !== Array.isArray(valor))) return false;
    }
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    return false;
  }
}

/* Publicaciones hechas desde empresas.html */
const PUBLICACIONES_EXTRA = leerLista(CLAVES_ALMACEN.vacantes).filter(r => r && r.vacante && Number.isSafeInteger(r.vacante.id) && typeof r.vacante.titulo === "string" && EMPRESAS.some(e => e.id === r.vacante.empresaId)).map(r=>({
  ...r,vacante:{...r.vacante,ciudad:ciudadDelPortal(r.vacante.ciudad),pais:r.vacante.pais || CONFIG_PORTAL.pais},
  detalle:r.detalle ? {...r.detalle,contacto:r.detalle.contacto ? {...r.detalle.contacto,
    correo:correoDemoLocal(r.detalle.contacto.correo),
    telefono:r.detalle.contacto.telefono === "+593 2 000 0000" ? "" : r.detalle.contacto.telefono,
    direccion:ciudadDelPortal(r.detalle.contacto.direccion)
  } : r.detalle.contacto} : r.detalle
}));

/* Fichas largas de las vacantes publicadas, por id. La vacante 101
   conserva su ficha original de DETALLE_VACANTE. */
const DETALLES_VACANTE = { [DETALLE_VACANTE.id]: DETALLE_VACANTE };

if (Array.isArray(PUBLICACIONES_EXTRA)) {
  /* Se recorre de la más antigua a la más nueva para que al final
     las recién publicadas queden arriba (igual que en empresas). */
  PUBLICACIONES_EXTRA.slice()
    .reverse()
    .forEach((registro) => {
      if (!registro || !registro.vacante) return;
      const { vacante, detalle } = registro;
      if (!VACANTES.some((v) => v.id === vacante.id)) {
        VACANTES.unshift(vacante);
      }
      if (detalle) DETALLES_VACANTE[vacante.id] = detalle;
    });
}

/* Guarda una vacante publicada y su ficha. La usa js/empresas.js. */
function guardarPublicacionExtra(vacante, detalle) {
  const sesion = sesionDatos();
  if (!vacante || !empresaHabilitada(vacante.empresaId) || !(sesion?.rol === "administrador" || (sesion?.rol === "empresa" && sesion.empresaId === vacante.empresaId))) return false;
  if (!Number.isSafeInteger(vacante.id) || vacante.id < 1 || VACANTES.some(v=>v.id === vacante.id) || leerLista(CLAVES_ALMACEN.vacantes).some(r=>r?.vacante?.id === vacante.id)) return false;
  const registros = leerAlmacen(CLAVES_ALMACEN.vacantes, []);
  const lista = Array.isArray(registros)
    ? registros.filter(
        (registro) => registro && registro.vacante && registro.vacante.id !== vacante.id
      )
    : [];
  lista.unshift({ vacante, detalle });
  return escribirAlmacen(CLAVES_ALMACEN.vacantes, lista);
}

/* Postulaciones hechas desde vacante.html (las lee el perfil) */
function leerTodasPostulaciones() {
  const unicas = new Map(), perfiles = leerObjeto("pt_perfiles");
  for (const registro of leerLista(CLAVES_ALMACEN.postulaciones)) {
    if (!registro || !Number.isSafeInteger(registro.vacanteId)) continue;
    const usuario = typeof registro.usuario === "string" && registro.usuario ? registro.usuario : "candidato";
    const clave = `${usuario}:${registro.vacanteId}`;
    if (unicas.has(clave)) continue;
    unicas.set(clave,{...registro,usuario,correo:correoDemoLocal(registro.correo),ciudad:ciudadDelPortal(registro.ciudad),
      nombre:typeof registro.nombre === "string" ? registro.nombre : perfiles[usuario]?.fNombres || usuario,
      titulo:typeof registro.titulo === "string" ? registro.titulo : "Candidato",
      habilidades:Array.isArray(registro.habilidades) ? registro.habilidades.filter(h=>typeof h === "string") : [],
      estado:["Nueva","Enviada","Recibida","En revisión","Preseleccionada","Rechazada"].includes(registro.estado) ? registro.estado : "Nueva"
    });
  }
  return [...unicas.values()];
}
function leerPostulaciones() {
  const usuario = sesionDatos()?.usuario;
  return leerTodasPostulaciones().filter(r => r.usuario === usuario);
}
function guardarPostulacion(registro) {
  if (!registro || !Number.isSafeInteger(registro.vacanteId)) return false;
  const sesion = sesionDatos();
  const vacante = VACANTES.find(v => v.id === registro.vacanteId);
  if (sesion?.rol !== "candidato" || !vacanteDisponible(vacante)) return false;
  if (yaPostulado(registro.vacanteId)) return true;
  const perfil = leerPerfil();
  const nueva = { vacanteId: vacante.id, usuario: sesion.usuario, empresaId: vacante.empresaId,
    nombre: perfil.fNombres || sesion.nombre, correo: perfil.fCorreo || sesion.correo,
    titulo: perfil.fPerfil || "Candidato", habilidades: perfil.habilidades || [],
    presentacion: typeof perfil.fAcerca === "string" ? perfil.fAcerca : "", ciudad: perfil.fCiudad || "",
    fecha: fechaHoy(), estado: "Nueva" };
  return escribirAlmacen(CLAVES_ALMACEN.postulaciones, [nueva, ...leerTodasPostulaciones()]);
}
function yaPostulado(vacanteId) {
  return leerPostulaciones().some(item => item.vacanteId === vacanteId);
}

/* Temas nuevos del foro (se conservan al recargar) */
function leerTemasForo() {
  const lista = leerAlmacen(CLAVES_ALMACEN.temasForo, []);
  return Array.isArray(lista) ? lista : [];
}

function guardarTemasForo(temas) {
  return escribirAlmacen(CLAVES_ALMACEN.temasForo, temas);
}

/* Repositorio local compartido. Los módulos consumen las mismas entidades.
   La futura API Node debe conservar estas reglas y aplicarlas en servidor. */
function leerLista(clave) {
  const valor = leerAlmacen(clave, []);
  return Array.isArray(valor) ? valor : [];
}
function leerObjeto(clave) {
  const valor = leerAlmacen(clave, {});
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
}
function sesionDatos() {
  const sesion = leerAlmacen("pt_sesion", null);
  const estado = leerObjeto("pt_cuentas_estado")[sesion?.usuario];
  if (estado === "Suspendido" || estado === "Eliminado" || !sesion || typeof sesion !== "object" || Array.isArray(sesion)) return null;
  if (typeof sesion.usuario !== "string" || !sesion.usuario.trim() || typeof sesion.nombre !== "string" || !sesion.nombre.trim() || !["candidato","empresa","administrador"].includes(sesion.rol)) return null;
  if (sesion.rol === "empresa" && !Number.isSafeInteger(sesion.empresaId)) return null;
  const miembros = leerObjeto("pt_flujos_v1").miembros;
  sesion.correo = correoDemoLocal(sesion.correo);
  const miembro = Array.isArray(miembros) ? miembros.find(m => m.usuario === sesion.usuario) : null;
  return miembro && sesion.rol !== "administrador" ? {...sesion,rol:"empresa",empresaId:miembro.empresaId} : sesion;
}
function cambiarEstadoCuenta(usuario, estado) {
  const sesion = sesionDatos();
  if (sesion?.rol !== "administrador" || usuario === sesion.usuario || !["Activo", "Suspendido", "Eliminado"].includes(estado)) return false;
  const estados = leerObjeto("pt_cuentas_estado"); estados[usuario] = estado;
  return escribirAlmacen("pt_cuentas_estado", estados);
}
function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
}
function estadoVacante(vacante) {
  return leerObjeto("pt_estados_vacantes")[vacante.id] || vacante.estado || "Publicada";
}
function vacanteDisponible(vacante) {
  return !!vacante && estadoVacante(vacante) === "Publicada" && empresaHabilitada(vacante.empresaId);
}
function cambiarEstadoVacante(id, estado) {
  const vacante = VACANTES.find(v => v.id === id), sesion = sesionDatos();
  if (!vacante || !["Publicada", "Cerrada", "Retirada", "Pendiente"].includes(estado)) return false;
  if (sesion?.rol === "empresa" && !empresaHabilitada(vacante.empresaId)) return false;
  if (sesion?.rol !== "administrador" && !(sesion?.rol === "empresa" && sesion.empresaId === vacante.empresaId && ["Cerrada", "Publicada"].includes(estado) && estadoVacante(vacante) !== "Retirada")) return false;
  const estados = leerObjeto("pt_estados_vacantes"); estados[id] = estado;
  return escribirAlmacen("pt_estados_vacantes", estados);
}
function suspenderEmpresa(id, suspendida) {
  if (sesionDatos()?.rol !== "administrador" || !EMPRESAS.some(e=>e.id === id) || typeof suspendida !== "boolean") return false;
  const estados = leerObjeto("pt_empresas_estado"); estados[id] = suspendida;
  if (!escribirAlmacen("pt_empresas_estado", estados)) return false;
  const empresa = EMPRESAS.find(e => e.id === id);
  if (empresa) empresa.suspendida = suspendida;
  return true;
}
EMPRESAS.forEach(e => { e.suspendida = leerObjeto("pt_empresas_estado")[e.id] === true; });
const TRANSICIONES_CANDIDATURA = Object.freeze({
  Nueva: ["En revisión", "Preseleccionada", "Rechazada"],
  Enviada: ["En revisión", "Preseleccionada", "Rechazada"],
  Recibida: ["En revisión", "Preseleccionada", "Rechazada"],
  "En revisión": ["Preseleccionada", "Rechazada"],
  Preseleccionada: ["En entrevista", "Seleccionada", "Rechazada"],
  "En entrevista": ["Seleccionada", "Rechazada"],
  Seleccionada: ["Contratada", "Rechazada"],
  Contratada: [], Rechazada: ["En revisión"]
});
function seguimientoCandidatura(id, clave, estadoInicial = "Nueva") {
  const registro = leerObjeto("pt_candidatos_estado")[`${id}:${clave}`];
  const estado = typeof registro === "string" ? registro : registro?.estado;
  return {
    estado: Object.hasOwn(TRANSICIONES_CANDIDATURA, estado) ? estado : estadoInicial,
    version: Number.isSafeInteger(registro?.version) ? registro.version : 0,
    historial: Array.isArray(registro?.historial) ? registro.historial.filter(e => e && typeof e.estado === "string" && typeof e.fecha === "string") : []
  };
}
function candidatosDeVacante(id) {
  const base = (POSTULACIONES.find(p => p.vacanteId === id)?.candidatos || []).map((c, i) => ({ ...c, clave: `demo-${i}` }));
  const nuevas = leerTodasPostulaciones().filter(p => p.vacanteId === id).map(p => ({ ...p,
    clave: p.usuario, iniciales: p.nombre?.slice(0, 2).toUpperCase() || "CA", experiencia: "Postulación desde el portal" }));
  return [...nuevas, ...base].map(c => ({ ...c, ...seguimientoCandidatura(id, c.clave, c.estado) }));
}
function puedeGestionarCandidatos(id) {
  const sesion = sesionDatos(), vacante = VACANTES.find(v => v.id === id);
  return !!vacante && (sesion?.rol === "administrador" || (sesion?.rol === "empresa" && sesion.empresaId === vacante.empresaId && empresaHabilitada(vacante.empresaId)));
}
function actualizarEstadoCandidato(id, clave, estado, observacion = "", versionEsperada = null) {
  if (!puedeGestionarCandidatos(id)) return false;
  const candidato = candidatosDeVacante(id).find(c => c.clave === clave);
  if (!candidato || !Object.hasOwn(TRANSICIONES_CANDIDATURA, estado) || typeof observacion !== "string" || observacion.trim().length > 1000) return false;
  if (versionEsperada !== null && versionEsperada !== candidato.version) return false;
  if (candidato.estado === estado) return true;
  if (!TRANSICIONES_CANDIDATURA[candidato.estado]?.includes(estado)) return false;
  if ((estado === "Rechazada" || candidato.estado === "Rechazada") && observacion.trim().length < 10) return false;
  const evento = { estado, anterior: candidato.estado, observacion: observacion.trim(), actor: sesionDatos().usuario, fecha: new Date().toISOString() };
  const estados = leerObjeto("pt_candidatos_estado");
  estados[`${id}:${clave}`] = {estado, version:candidato.version + 1, historial:[...candidato.historial, evento]};
  return escribirAlmacen("pt_candidatos_estado", estados);
}
function estadoPostulacion(p) { return seguimientoCandidatura(p.vacanteId, p.usuario, p.estado).estado; }
function empresasPublicas() { return EMPRESAS.filter(e => empresaHabilitada(e.id)); }
function ofertasPublicasDeEmpresa(id) { return VACANTES.filter(v => v.empresaId === id && vacanteDisponible(v)); }
function leerPerfil() {
  const perfil = leerObjeto("pt_perfiles")[sesionDatos()?.usuario];
  return perfil && typeof perfil === "object" && !Array.isArray(perfil) ? {...perfil,fCiudad:ciudadDelPortal(perfil.fCiudad),fCorreo:correoDemoLocal(perfil.fCorreo),
    alertas:Array.isArray(perfil.alertas) ? perfil.alertas.map(a=>a && typeof a.titulo === "string" ? {...a,titulo:a.titulo.replace(/ en (Quito|Guayaquil|Cuenca|Loja|Ambato)$/,(_,ciudad)=>" en "+ciudadDelPortal(ciudad))} : a) : perfil.alertas
  } : {};
}
function guardarPerfil(perfil) {
  const usuario = sesionDatos()?.usuario; if (!usuario || !perfil || typeof perfil !== "object" || Array.isArray(perfil)) return false;
  const perfiles = leerObjeto("pt_perfiles"); perfiles[usuario] = perfil;
  return escribirAlmacen("pt_perfiles", perfiles);
}
function leerGuardados(tipo) { const ids = leerObjeto("pt_guardados")[sesionDatos()?.usuario]?.[tipo]; return Array.isArray(ids) ? ids : []; }
function alternarGuardado(tipo, id) {
  const usuario = sesionDatos()?.usuario; if (!usuario) return false;
  const todos = leerObjeto("pt_guardados"), datos = todos[usuario] || {};
  const ids = Array.isArray(datos[tipo]) ? datos[tipo] : [];
  datos[tipo] = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  todos[usuario] = datos; return escribirAlmacen("pt_guardados", todos);
}
function resenasDeEmpresa(id) {
  return [...leerLista("pt_resenas").filter(r => r && r.empresaId === id && Number.isInteger(r.nota) && r.nota >= 1 && r.nota <= 5 && typeof r.texto === "string"), ...(id === 1 ? RESENAS_EMPRESA : [])];
}
function guardarResena(empresaId, nota, texto) {
  const sesion = sesionDatos();
  if (!sesion || !EMPRESAS.some(e => e.id === empresaId) || !Number.isInteger(nota) || nota < 1 || nota > 5 || typeof texto !== "string" || !texto.trim() || texto.trim().length > 3000) return false;
  const resena = { id: Date.now(), empresaId, usuario: sesion.usuario, autor: leerPerfil().fNombres || sesion.nombre,
    iniciales: sesion.nombre.slice(0, 2), fecha: fechaHoy(), nota, texto: texto.trim() };
  const ok = escribirAlmacen("pt_resenas", [resena, ...leerLista("pt_resenas")]);
  if (ok) actualizarResumenResenas();
  return ok;
}

function fechaISOElSalvador(fecha = new Date()) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return null;
  const partes = Object.fromEntries(new Intl.DateTimeFormat(CONFIG_PORTAL.locale,{timeZone:CONFIG_PORTAL.zonaHoraria,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(fecha).map(p=>[p.type,p.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}
function fechaHoy() { return fechaISOElSalvador(); }

function actualizarResumenResenas() {
  EMPRESAS.forEach(e => {
    const resenas = resenasDeEmpresa(e.id);
    e.resenas = resenas.length;
    e.valoracion = resenas.length ? resenas.reduce((s, r) => s + r.nota, 0) / resenas.length : 0;
  });
}
actualizarResumenResenas();

EMPRESAS.forEach(empresa => {
  const ficha = leerObjeto("pt_empresas_fichas")[empresa.id];
  if (ficha && typeof ficha === "object") {
    ["nombre", "rubro", "ciudad", "tamano", "descripcion"].forEach(clave => {
      if (typeof ficha[clave] === "string") {
        empresa[clave] = clave === "ciudad" ? ciudadDelPortal(ficha[clave]) : ficha[clave];
        if (empresa.id === 1 && clave === "nombre" && ficha[clave] === "Andes Software") empresa.nombre="Cuscatlán Software";
        if (empresa.id === 1 && clave === "descripcion" && ficha[clave].startsWith("Empresa ecuatoriana de desarrollo")) empresa.descripcion=ficha[clave].replace("Empresa ecuatoriana","Empresa salvadoreña");
      }
    });
  }
});

function empresaHabilitada(id) {
  const empresa = EMPRESAS.find(e => e.id === id);
  const suspendida = leerObjeto("pt_empresas_estado")[id] === true;
  return !!empresa && empresa.estadoRegistro === "aprobado" && !suspendida;
}

// Releer el almacenamiento evita reutilizar IDs calculados en otra pestaña.
function siguienteIdVacante() {
  return Math.max(0,...VACANTES.map(v=>v.id),...leerLista(CLAVES_ALMACEN.vacantes).map(r=>r?.vacante?.id).filter(Number.isSafeInteger)) + 1;
}
