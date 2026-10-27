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

/* Empresa de ejemplo reutilizada en varias pantallas */
const EMPRESAS = [
  {
    id: 1,
    nombre: "Andes Software",
    iniciales: "AS",
    rubro: "Tecnología",
    tamano: "120 empleados",
    ciudad: "Quito",
    valoracion: 4.6,
    resenas: 38,
    descripcion:
      "Empresa ecuatoriana de desarrollo de software para el sector financiero. Trabaja con equipos pequeños, metodología ágil y horarios flexibles.",
  },
  {
    id: 2,
    nombre: "Café Altura",
    iniciales: "CA",
    rubro: "Agroindustria",
    tamano: "310 empleados",
    ciudad: "Loja",
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
    ciudad: "Guayaquil",
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
    ciudad: "Cuenca",
    valoracion: 3.7,
    resenas: 64,
    descripcion:
      "Red de clínicas privadas con presencia en cuatro provincias. Ofrece turnos rotativos y convenios de especialización.",
  },
  {
    id: 5,
    nombre: "Ruta Norte",
    iniciales: "RN",
    rubro: "Logística",
    tamano: "210 empleados",
    ciudad: "Ambato",
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
    ciudad: "Quito",
    valoracion: 3.9,
    resenas: 81,
    descripcion:
      "Institución financiera con red nacional de agencias. Programa de rotación gerencial para profesionales en formación.",
  },
];

/* Vacantes: cada una indica el tipo de contrato, modalidad,
   nivel de experiencia y salario mensual en dólares. */
const VACANTES = [
  {
    id: 101,
    titulo: "Desarrollador Frontend Junior",
    empresaId: 1,
    ciudad: "Quito",
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
    ciudad: "Quito",
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
    ciudad: "Guayaquil",
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
    ciudad: "Loja",
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
    ciudad: "Cuenca",
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
    ciudad: "Ambato",
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
    ciudad: "Quito",
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
    ciudad: "Quito",
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
    ciudad: "Loja",
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
    ciudad: "Guayaquil",
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
    "Disponibilidad para trabajo híbrido en Quito (3 días en oficina).",
  ],
  beneficios: [
    "Jornada de 40 horas semanales con horario flexible.",
    "Presupuesto anual de capacitación y certificaciones.",
    "Seguro médico privado desde el tercer mes.",
    "Dos días de trabajo remoto adicionales al mes para formación.",
  ],
  contacto: {
    correo: "talento@andessoftware.ec",
    telefono: "+593 2 555 0142",
    direccion: "Av. República N36-141, Quito",
    responsable: "Carla Andrade — Talento humano",
  },
};

/* Reseñas de la empresa asociada a la vacante en detalle */
const RESENAS_EMPRESA = [
  {
    autor: "Mateo Chalá",
    iniciales: "MC",
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
    autor: "Diego Yépez",
    iniciales: "DY",
    fecha: "2026-07-02",
    nota: 5,
    texto:
      "Los proyectos son interesantes y el salario está por encima del promedio del sector en Quito.",
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
    autor: "Andes Software",
    duracion: "25:40",
    categoria: "Entrevistas",
  },
  {
    id: 3,
    tipo: "Tutorial",
    titulo: "Negociar el salario sin perder la oferta",
    resumen:
      "Guía paso a paso con rangos salariales del mercado ecuatoriano y frases concretas para usar durante la conversación.",
    autor: "Rocío Vintimilla",
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
    autor: "Andes Software",
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
    autor: "Iván Zambrano",
    iniciales: "IZ",
    respuestas: 27,
    vistas: 910,
    ultimo: "ayer",
    fijado: false,
  },
  {
    id: 4,
    titulo: "Portfolio de diseño sin clientes: qué proyectos poner",
    categoria: "Diseño",
    autor: "Camila Toapanta",
    iniciales: "CT",
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
        titulo: "Ingeniera en Sistemas — EPN",
        experiencia: "1 año de prácticas",
        habilidades: ["React", "CSS", "Git"],
        estado: "Nueva",
      },
      {
        nombre: "Kevin Almeida",
        iniciales: "KA",
        titulo: "Tecnólogo en Software — UTPL",
        experiencia: "2 años freelance",
        habilidades: ["Vue", "JavaScript", "REST"],
        estado: "En revisión",
      },
      {
        nombre: "Marcela Ordóñez",
        iniciales: "MO",
        titulo: "Diseñadora de Interacción — USFQ",
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
  { texto: "Andes Software publicó la vacante «Desarrollador Backend»", hora: "hace 1 h", tono: "bermellon" },
  { texto: "32 nuevas postulaciones registradas hoy", hora: "hace 2 h", tono: "verde" },
  { texto: "Salud Integral actualizó su ficha de empresa", hora: "hace 4 h", tono: "" },
  { texto: "Se denunció una reseña de la empresa Ruta Norte", hora: "hace 6 h", tono: "ambar" },
  { texto: "Se dio de baja al usuario 2291 por publicación repetida", hora: "ayer", tono: "" },
];

/* Utilidad compartida: convierte la fecha en texto cercano */
function fechaCercana(iso) {
  const dias = Math.round((new Date("2026-10-20") - new Date(iso)) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.round(dias / 7)} semanas`;
  return `hace ${Math.round(dias / 30)} meses`;
}

/* Devuelve el nombre de la empresa a partir del id */
function empresaPorId(id) {
  return EMPRESAS.find((e) => e.id === id) || EMPRESAS[0];
}

/* Formatea el salario en dólares. Las ofertas publicadas sin salario
   (el campo es opcional) se muestran como "A convenir". */
function salarioFormateado(valor) {
  if (!valor) return "A convenir";
  return `$${Number(valor).toLocaleString("es-EC")}`;
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
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    return false;
  }
}

/* Publicaciones hechas desde empresas.html */
const PUBLICACIONES_EXTRA = leerAlmacen(CLAVES_ALMACEN.vacantes, []);

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
function leerPostulaciones() {
  const lista = leerAlmacen(CLAVES_ALMACEN.postulaciones, []);
  return Array.isArray(lista) ? lista : [];
}

function guardarPostulacion(registro) {
  const lista = leerPostulaciones().filter(
    (item) => item.vacanteId !== registro.vacanteId
  );
  lista.unshift(registro);
  return escribirAlmacen(CLAVES_ALMACEN.postulaciones, lista);
}

function yaPostulado(vacanteId) {
  return leerPostulaciones().some((item) => item.vacanteId === vacanteId);
}

/* Temas nuevos del foro (se conservan al recargar) */
function leerTemasForo() {
  const lista = leerAlmacen(CLAVES_ALMACEN.temasForo, []);
  return Array.isArray(lista) ? lista : [];
}

function guardarTemasForo(temas) {
  return escribirAlmacen(CLAVES_ALMACEN.temasForo, temas);
}
