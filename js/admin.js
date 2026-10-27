/* =============================================================
   PORTAL DE TRABAJO — panel de administración (admin.html)
   -------------------------------------------------------------
   Lógica de las siete secciones del panel:

     · Cambio de sección desde el índice lateral.
     · Pintado de la actividad reciente (ACTIVIDAD_ADMIN).
     · Anillo SVG de vacantes por sector (VACANTES).
     · Tabla de usuarios con filtro de rol y acciones de cuenta.
     · Tabla de empresas con buscador en vivo y bajas.
     · Tabla de vacantes con filtro de estado y publicación.
     · Moderación de contenidos denunciados (MODERACION).
     · Estadísticas: barras de postulaciones y top de empresas.
     · Configuración del portal y restablecimiento de datos.

   Los datos viven en js/datos.js; aquí se copian a arrays
   editables (…Admin) para poder simular altas, bajas y cambios
   sin tocar el archivo de datos original.
   ============================================================= */

/* ---------------------------------------------------------------
   1. Cambio de sección
   El índice lateral marca su botón con .activo y muestra solo el
   panel cuyo data-panel coincida con el data-seccion pulsado; el
   resto queda con el atributo hidden (display: none).
   --------------------------------------------------------------- */
function cambiarSeccion(clave) {
  /* Si la clave no corresponde a ninguna sección se usa la primera */
  const existe = [...document.querySelectorAll(".admin-lateral button[data-seccion]")].some(b => b.dataset.seccion === clave);
  if (!existe) clave = "principal";

  /* Mueve la marca .activo del índice lateral */
  document.querySelectorAll(".admin-lateral button").forEach((boton) => {
    const activo = boton.dataset.seccion === clave;
    boton.classList.toggle("activo", activo);
    if (activo) {
      boton.setAttribute("aria-current", "true");
    } else {
      boton.removeAttribute("aria-current");
    }
  });

  /* Muestra solo el panel elegido */
  document.querySelectorAll(".adm-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== clave;
  });

  /* El contenido nuevo comienza en la parte superior de la pantalla */
  const cuerpo = document.getElementById("contenido");
  if (cuerpo && window.scrollY > cuerpo.offsetTop) {
    cuerpo.scrollIntoView({ block: "start" });
  }

  /* El gráfico de barras se vuelve a animar cada vez que se muestra */
  if (clave === "estadisticas") animarBarras();
}

/* ---------------------------------------------------------------
   2. Actividad reciente
   Cada evento se pinta como un elemento de la lista .actividad:
   punto de estado, texto y hora. El tono del dato decide la clase
   del punto (verde, bermellón, ámbar o neutro).
   --------------------------------------------------------------- */
function pintarActividad() {
  const lista = document.getElementById("listaActividad");
  if (!lista) return;

  const resultado = ejecutarFlujo(()=>flujos.actividad());
  if (!resultado.ok) { lista.textContent=resultado.mensaje; return; }
  lista.innerHTML = resultado.dato.map(e=>`<li><span class="punto" aria-hidden="true"></span><p>${escaparHTML(e.actor)} · ${e.tipo === "empresa" ? "Registro empresarial" : "Tema del foro"} · ${escaparHTML(e.accion)} · v${e.version}</p><time>${fechaRevision(e.fecha)}</time></li>`).join("") || '<li>Todavía no hay actividad de revisión.</li>';
  const cifras = [cargarUsuariosAdmin().length,EMPRESAS.filter(e=>empresaHabilitada(e.id)).length,VACANTES.filter(vacanteDisponible).length,POSTULACIONES.reduce((n,p)=>n+p.candidatos.length,0)+leerTodasPostulaciones().length];
  document.querySelectorAll("#panelPrincipal .resumen-tarjeta strong").forEach((el,i)=>el.textContent=cifras[i]);
}

/* ---------------------------------------------------------------
   3. Anillo de vacantes por sector
   El anillo se dibuja con SVG usando la técnica de stroke-dasharray:
   cada sector ocupa un trazo continuo cuya longitud es proporcional
   a su cantidad de vacantes.

   FÓRMULA
     circunferencia = 2 · π · r
     Con r = 15.9155 en un viewBox de 42 × 42 la circunferencia
     vale aproximadamente 100, de modo que cada unidad de
     stroke-dasharray equivale a 1 % del anillo completo.

   Para cada sector se dibuja un <circle> con:
     stroke-dasharray = [porción pintada, resto del anillo]
     stroke-dashoffset = desplazamiento acumulado (negativo)
     transform rotate(-90 21 21) → el primer tramo arranca arriba
   --------------------------------------------------------------- */
function dibujarAnilloSectores() {
  const svg = document.getElementById("anilloSectores");
  const leyenda = document.getElementById("leyendaSectores");
  if (!svg || !leyenda) return;

  /* Recuento de vacantes por sector, conservando el orden de aparición */
  const sectores = [];
  VACANTES.forEach((vacante) => {
    const existente = sectores.find((sector) => sector.nombre === vacante.sector);
    if (existente) {
      existente.cantidad += 1;
    } else {
      sectores.push({ nombre: vacante.sector, cantidad: 1 });
    }
  });

  const total = VACANTES.length;
  const radio = 15.9155;
  const circunferencia = 2 * Math.PI * radio; /* ≈ 100 */

  /* Paleta del sistema para los tramos del anillo */
  const colores = [
    "var(--bermellon)",
    "var(--tinta)",
    "var(--cielo)",
    "var(--verde)",
    "var(--ambar)",
    "var(--linea-fuerte)",
  ];

  /* Limpia tramos anteriores y leyenda (por si el anillo se redibuja) */
  svg.querySelectorAll(".tramo").forEach((tramo) => tramo.remove());
  leyenda.innerHTML = "";

  let acumulado = 0; /* desplazamiento del tramo actual */

  sectores.forEach((sector, i) => {
    const fraccion = sector.cantidad / total;
    const porcion = circunferencia * fraccion; /* longitud pintada */
    const resto = circunferencia - porcion;    /* longitud vacía   */
    const color = colores[i % colores.length];

    /* Se crea el círculo del sector dentro del SVG */
    const tramo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    tramo.setAttribute("class", "tramo");
    tramo.setAttribute("cx", "21");
    tramo.setAttribute("cy", "21");
    tramo.setAttribute("r", String(radio));
    tramo.setAttribute("fill", "none");
    tramo.setAttribute("stroke-width", "4");
    tramo.setAttribute("transform", "rotate(-90 21 21)");
    /* El color se asigna por estilo para poder usar las variables */
    tramo.style.stroke = color;
    tramo.style.strokeDasharray = `${porcion} ${resto}`;
    /* Desplazamiento negativo: encadena el tramo tras el anterior */
    tramo.style.strokeDashoffset = `${-acumulado}`;
    svg.appendChild(tramo);

    acumulado += porcion;

    /* Fila de la leyenda: punto del mismo color, nombre y porcentaje */
    leyenda.insertAdjacentHTML(
      "beforeend",
      `<li>
        <span class="punto" style="background: ${color}" aria-hidden="true"></span>
        <span>${sector.nombre}</span>
        <span class="valor">${Math.round(fraccion * 100)} %</span>
      </li>`
    );
  });

  /* Cifra junto al título del panel */
  const totalSectores = document.getElementById("totalSectores");
  if (totalSectores) {
    totalSectores.textContent = `${total} ofertas · ${sectores.length} sectores`;
  }
}

/* ---------------------------------------------------------------
   Utilidades compartidas de formato
   --------------------------------------------------------------- */

/* Fecha en texto cercano con la concordancia corregida.
   fechaCercana() (js/datos.js) devuelve "hace 1 meses" o
   "hace 1 semanas" cuando el valor es singular; aquí se ajusta
   la terminación sin modificar el archivo de datos compartido */
function fechaTexto(iso) {
  return fechaCercana(iso).replace("1 meses", "1 mes").replace("1 semanas", "1 semana");
}

/* ---------------------------------------------------------------
   4. Gestión de usuarios
   Copia editable del listado de cuentas. La tabla se repinta
   completa en cada cambio (filtro, suspensión o eliminación).
   --------------------------------------------------------------- */

/* Cuentas de ejemplo: no vienen en datos.js porque son propias
   de esta pantalla (prototipo de administración) */
function cargarUsuariosAdmin() {
  const roles = { candidato: "Candidato", empresa: "Empresa", administrador: "Administrador" };
  const estados = leerObjeto("pt_cuentas_estado");
  const perfiles = leerObjeto("pt_perfiles");
  return USUARIOS_PRUEBA.map((u, i) => ({ id: i + 1, usuario: u.usuario,
    nombre: perfiles[u.usuario]?.fNombres || u.nombre, correo: perfiles[u.usuario]?.fCorreo || u.correo,
    iniciales: u.nombre.slice(0, 2).toUpperCase(), rol: roles[(leerObjeto("pt_flujos_v1").miembros || []).some(m=>m.usuario === u.usuario) && u.rol !== "administrador" ? "empresa" : u.rol],
    estado: estados[u.usuario] || "Activo", registro: "2026-10-26" })).filter(u => u.estado !== "Eliminado");
}

let usuariosAdmin = [];

/* Chip de estado de la cuenta: verde para activa, ámbar para suspendida */
function chipEstadoCuenta(estado) {
  const clase = estado === "Activo" ? "verde" : "ambar";
  return `<span class="etiqueta-chip ${clase}">${estado}</span>`;
}

function pintarUsuarios() {
  const cuerpo = document.getElementById("cuerpoUsuarios");
  if (!cuerpo) return;

  /* Filtro de rol en vivo: el valor vacío muestra todo */
  const campo = document.getElementById("filtroRol");
  const filtro = campo ? campo.value : "";
  const lista = usuariosAdmin.filter((usuario) => !filtro || usuario.rol === filtro);

  /* Cuenta de resultados bajo la tabla */
  const cuenta = document.getElementById("cuentaUsuarios");
  if (cuenta) {
    cuenta.textContent = `${lista.length} de ${usuariosAdmin.length} cuentas mostradas`;
  }

  /* Mensaje de vacío cuando el filtro no encuentra nada */
  if (!lista.length) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="6" class="texto-tenue text-center">
          No hay cuentas para este filtro.
        </td>
      </tr>`;
    return;
  }

  cuerpo.innerHTML = lista
    .map(
      (usuario) => `
      <tr>
        <td>
          <span class="adm-usuario">
            <span class="avatar avatar-sm" aria-hidden="true">${escaparHTML(usuario.iniciales)}</span>
            <span>${escaparHTML(usuario.nombre)}</span>
          </span>
        </td>
        <td class="tabla-datos">${escaparHTML(usuario.correo)}</td>
        <td>${usuario.rol}</td>
        <td>${chipEstadoCuenta(usuario.estado)}</td>
        <td class="tabla-datos">${fechaTexto(usuario.registro)}</td>
        <td>
          <span class="adm-acciones">
            <button class="btn btn-linea btn-sm" type="button" data-usuario-estado="${usuario.id}">
              ${usuario.estado === "Activo" ? "Suspender" : "Reactivar"}
            </button>
            <button class="btn btn-fantasma btn-sm" type="button" data-usuario-eliminar="${usuario.id}">
              Eliminar
            </button>
          </span>
        </td>
      </tr>`
    )
    .join("");
}

/* ---------------------------------------------------------------
   5. Gestión de empresas
   Misma mecánica que usuarios: copia editable del directorio,
   buscador en vivo por nombre, rubro o ciudad y acciones sobre
   cada ficha. La baja atenúa la fila y cambia el chip.
   --------------------------------------------------------------- */
let empresasAdmin = [];

/* Cinco puntos de valoración: los llenos representan la nota */
function puntosValoracionAdm(nota) {
  const enteros = Math.round(nota);
  return Array.from(
    { length: 5 },
    (_, i) => `<span class="punto-valoracion ${i < enteros ? "lleno" : ""}"></span>`
  ).join("");
}

/* Cantidad de ofertas publicadas por una empresa */
function ofertasDeEmpresa(idEmpresa) {
  return VACANTES.filter((vacante) => vacante.empresaId === idEmpresa).length;
}

function pintarEmpresas() {
  pintarSolicitudesEmpresa();
  const cuerpo = document.getElementById("cuerpoEmpresas");
  if (!cuerpo) return;

  /* Texto del buscador en vivo */
  const campo = document.getElementById("buscarEmpresaAdmin");
  const texto = campo ? campo.value.trim().toLowerCase() : "";

  const lista = empresasAdmin.filter((empresa) => {
    if (!texto) return true;
    return [empresa.nombre, empresa.rubro, empresa.ciudad].some((dato) =>
      dato.toLowerCase().includes(texto)
    );
  });

  const cuenta = document.getElementById("cuentaEmpresasAdmin");
  if (cuenta) {
    cuenta.textContent = `${lista.length} de ${empresasAdmin.length} empresas en la tabla`;
  }

  if (!lista.length) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="6" class="texto-tenue text-center">
          No hay empresas que coincidan con la búsqueda.
        </td>
      </tr>`;
    return;
  }

  cuerpo.innerHTML = lista
    .map((empresa) => {
      const ofertas = ofertasDeEmpresa(empresa.id);
      return `
      <tr class="${empresa.suspendida ? "adm-fila-inactiva" : ""}">
        <td>
          <span class="adm-usuario">
            <span class="marca-empresa" aria-hidden="true">${escaparHTML(empresa.iniciales)}</span>
            <span>
              ${escaparHTML(empresa.nombre)}
              ${empresa.suspendida ? '<span class="etiqueta-chip ambar">Suspendida</span>' : ""}
            </span>
          </span>
        </td>
        <td>${escaparHTML(empresa.rubro)}</td>
        <td class="tabla-datos">${escaparHTML(empresa.ciudad)}</td>
        <td>
          <span class="valoracion" title="Valoración media de la empresa">
            ${puntosValoracionAdm(empresa.valoracion)}
            <span class="valoracion-nota">${empresa.valoracion.toFixed(1)}</span>
          </span>
        </td>
        <td class="tabla-datos">${ofertas}</td>
        <td>
          <span class="adm-acciones">
            <button class="btn btn-linea btn-sm" type="button" data-empresa-editar="${empresa.id}">
              Editar ficha
            </button>
            ${
              empresa.suspendida
                ? `<button class="btn btn-fantasma btn-sm" type="button" data-empresa-reactivar="${empresa.id}">Reactivar ficha</button>`
                : `<button class="btn btn-fantasma btn-sm" type="button" data-empresa-baja="${empresa.id}">Dar de baja</button>`
            }
          </span>
        </td>
      </tr>`;
    })
    .join("");
}

/* ---------------------------------------------------------------
   6. Gestión de vacantes
   Las diez ofertas de prueba con un estado editable:
     Publicada  → chip verde; se puede retirar.
     Retirada   → chip ámbar; se puede volver a aprobar.
     Pendiente  → chip ámbar; espera revisión y se aprueba.
   La acción «Aprobar» se muestra mientras la oferta no esté
   publicada, así se cubre tanto el estado Pendiente como el
   estado Retirada.
   --------------------------------------------------------------- */
let vacantesAdmin = [];

/* Chip de estado de la oferta */
function chipEstadoVacante(estado) {
  const tonos = { Publicada: "verde", Retirada: "ambar", Pendiente: "ambar", Cerrada: "ambar" };
  return `<span class="etiqueta-chip ${tonos[estado] || ""}">${estado}</span>`;
}

/* Postulantes de una oferta: usa los datos reales del prototipo
   cuando existen y, si no, una cifra simulada y estable derivada
   del identificador (evita números aleatorios que cambien al
   repintar la tabla) */
function postulantesDe(vacante) {
  return candidatosDeVacante(vacante.id).length;
}

function pintarVacantes() {
  const cuerpo = document.getElementById("cuerpoVacantes");
  if (!cuerpo) return;

  /* Filtro de estado en vivo */
  const campo = document.getElementById("filtroEstadoVacante");
  const filtro = campo ? campo.value : "";
  const lista = vacantesAdmin.filter((vacante) => !filtro || vacante.estado === filtro);

  const cuenta = document.getElementById("cuentaVacantes");
  if (cuenta) {
    const publicadas = vacantesAdmin.filter((v) => v.estado === "Publicada").length;
    cuenta.textContent = `${lista.length} ofertas en la tabla · ${publicadas} publicadas`;
  }

  if (!lista.length) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="6" class="texto-tenue text-center">
          No hay ofertas para este filtro.
        </td>
      </tr>`;
    return;
  }

  cuerpo.innerHTML = lista
    .map((vacante) => {
      const empresa = empresaPorId(vacante.empresaId);
      return `
      <tr class="${vacante.estado === "Retirada" ? "adm-fila-inactiva" : ""}">
        <td><a href="./vacante.html?id=${vacante.id}">${escaparHTML(vacante.titulo)}</a></td>
        <td>${escaparHTML(empresa.nombre)}</td>
        <td class="tabla-datos">${fechaTexto(vacante.publicada)}</td>
        <td>${chipEstadoVacante(vacante.estado)}</td>
        <td class="tabla-datos">${postulantesDe(vacante)}</td>
        <td>
          <span class="adm-acciones">
            ${
              vacante.estado === "Publicada"
                ? `<button class="btn btn-linea btn-sm" type="button" data-vacante-retirar="${vacante.id}">Retirar</button>`
                : `<button class="btn btn-bermellon btn-sm" type="button" data-vacante-aprobar="${vacante.id}">Aprobar</button>`
            }
            <a class="btn btn-fantasma btn-sm" href="./vacante.html?id=${vacante.id}">Ver</a>
          </span>
        </td>
      </tr>`;
    })
    .join("");
}

/* ---------------------------------------------------------------
   7. Moderación de contenido
   Una tarjeta .panel por cada denuncia de MODERACION. Los botones
   llevan data-accion y data-mensaje; como se pintan DESPUÉS de que
   main.js prepare sus acciones genéricas, el aviso lo lanza aquí
   (evita dobles mensajes) y la tarjeta se retira del listado.
   --------------------------------------------------------------- */
function pintarModeracion() { pintarColaTemas(); }

/* ---------------------------------------------------------------
   8. Estadísticas del sistema
   Barras de postulaciones por mes y ranking de empresas calculado
   contando las ofertas de VACANTES.
   --------------------------------------------------------------- */

/* Postulaciones por mes (marzo a octubre de 2026). El último mes
   coincide con la cifra de "Postulaciones del mes" del panel */
const POSTULACIONES_MES = [
  { mes: "Mar", valor: 7400 },
  { mes: "Abr", valor: 8100 },
  { mes: "May", valor: 9300 },
  { mes: "Jun", valor: 8700 },
  { mes: "Jul", valor: 10200 },
  { mes: "Ago", valor: 11150 },
  { mes: "Sep", valor: 12040 },
  { mes: "Oct", valor: 12930 },
];

function pintarBarras() {
  const grafico = document.getElementById("graficoPostulaciones");
  if (!grafico) return;

  const maximo = Math.max(...POSTULACIONES_MES.map((dato) => dato.valor));
  const ultimo = POSTULACIONES_MES.length - 1;

  /* La altura de cada barra es un porcentaje de la altura máxima */
  grafico.innerHTML = POSTULACIONES_MES.map((dato, i) => {
    const alto = Math.round((dato.valor / maximo) * 100);
    const resaltada = i === ultimo;
    return `
      <div
        class="barra ${resaltada ? "resalte" : ""}"
        style="height: ${alto}%"
        data-alto="${alto}"
        title="${dato.mes}: ${dato.valor.toLocaleString("es-EC")} postulaciones"
      >
        ${resaltada ? `<span class="adm-barra-valor">${dato.valor.toLocaleString("es-EC")}</span>` : ""}
      </div>`;
  }).join("");

  /* Etiqueta accesible del gráfico completo */
  grafico.setAttribute(
    "aria-label",
    `Postulaciones por mes: ${POSTULACIONES_MES[0].valor.toLocaleString("es-EC")} en ${POSTULACIONES_MES[0].mes} hasta ${maximo.toLocaleString("es-EC")} en ${POSTULACIONES_MES[ultimo].mes}`
  );
}

/* Reproduce la animación de subida de las barras cada vez que la
   sección de estadísticas se vuelve a mostrar */
function animarBarras() {
  const barras = document.querySelectorAll("#graficoPostulaciones .barra");
  if (!barras.length) return;

  /* Se parte de altura cero y al siguiente fotograma se sube hasta
     el valor final: la transición del CSS dibuja el crecimiento */
  barras.forEach((barra) => {
    barra.style.height = "0%";
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barras.forEach((barra) => {
        barra.style.height = `${barra.dataset.alto}%`;
      });
    });
  });
}

/* Las cinco empresas con más ofertas, calculadas sobre VACANTES */
function pintarTopEmpresas() {
  const cuerpo = document.getElementById("cuerpoTopEmpresas");
  if (!cuerpo) return;

  const ranking = EMPRESAS.map((empresa) => ({
    empresa,
    ofertas: ofertasDeEmpresa(empresa.id),
  }))
    .sort((a, b) => b.ofertas - a.ofertas) /* de mayor a menor */
    .slice(0, 5);

  cuerpo.innerHTML = ranking
    .map(
      ({ empresa, ofertas }) => `
      <tr>
        <td>
          <span class="adm-top-empresa">
            <span class="disco disco-sm" aria-hidden="true">${escaparHTML(empresa.iniciales)}</span>
            <span>${escaparHTML(empresa.nombre)}</span>
          </span>
        </td>
        <td class="tabla-datos">${ofertas} ${ofertas === 1 ? "oferta" : "ofertas"}</td>
      </tr>`
    )
    .join("");
}

/* ---------------------------------------------------------------
   9. Buscador de la cabecera
   Filtra en vivo los bloques del panel activo (filas de tablas,
   elementos de la actividad, tarjetas de resumen, denuncias y
   filas de configuración). Al pulsar Intro, si el panel activo no
   tiene coincidencias, salta al primer panel que sí las tiene.
   --------------------------------------------------------------- */
function prepararBusquedaPanel() {
  const campo = document.getElementById("buscarPanel");
  if (!campo) return;

  /* Bloques que se pueden ocultar con el filtro */
  const FILTRABLES =
    "tbody tr, .actividad li, .resumen-tarjeta, .anillo-datos .leyenda li, #listaModeracion .panel, .alerta-fila";

  /* Restaura la visibilidad y limpia el texto escrito */
  function limpiarBusqueda() {
    campo.value = "";
    document.querySelectorAll(".adm-panel .adm-oculto").forEach((el) => el.classList.remove("adm-oculto"));
  }

  /* Oculta en el panel activo los bloques sin coincidencia */
  function filtrarPanelActivo() {
    const activo = document.querySelector(".adm-panel:not([hidden])");
    if (!activo) return;
    const texto = campo.value.trim().toLowerCase();
    activo.querySelectorAll(FILTRABLES).forEach((bloque) => {
      const coincide = !texto || bloque.textContent.toLowerCase().includes(texto);
      bloque.classList.toggle("adm-oculto", !coincide);
    });
  }

  /* Salta al primer panel distinto que contenga el texto */
  function saltarAResultado() {
    const texto = campo.value.trim().toLowerCase();
    if (!texto) return;

    const paneles = Array.from(document.querySelectorAll(".adm-panel"));
    const activo = paneles.find((panel) => !panel.hidden);
    const destino = paneles.find(
      (panel) => panel !== activo && panel.textContent.toLowerCase().includes(texto)
    );

    if (!destino) {
      avisar(`Sin resultados para «${campo.value.trim()}» en el resto del panel.`);
      return;
    }

    const titulo = destino.querySelector("h1");
    limpiarBusqueda();
    cambiarSeccion(destino.dataset.panel);
    avisar(`Coincidencia encontrada en «${titulo ? titulo.textContent : "otra sección"}».`, "exito");
  }

  campo.addEventListener("input", filtrarPanelActivo);
  campo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault(); /* evita el envío del formulario */
      saltarAResultado();
    }
  });
}

/* ---------------------------------------------------------------
   10. Configuración del portal y restablecimiento
   Cada interruptor avisa del cambio; el botón de restablecer
   repinta todas las tablas con los datos originales y limpia los
   filtros aplicados.
   --------------------------------------------------------------- */
function prepararConfiguracion() {
  document.querySelectorAll("[data-config]").forEach((control) => {
    const configuracion = leerObjeto("pt_config");
    if (typeof configuracion[control.dataset.config] === "boolean") control.checked = configuracion[control.dataset.config];
    control.addEventListener("change", () => {
      const config = leerObjeto("pt_config"); config[control.dataset.config] = control.checked;
      if (!escribirAlmacen("pt_config", config)) { avisar("No se pudo guardar la preferencia."); return; }
      avisar("Preferencia guardada. Su aplicación requiere el servidor.");
    });
  });
}

function restablecerDatos() {
  /* Copias frescas de los datos de prueba */
  usuariosAdmin = cargarUsuariosAdmin();
  empresasAdmin = EMPRESAS.map((empresa) => ({ ...empresa }));
  vacantesAdmin = VACANTES.map((vacante) => ({ ...vacante, estado: estadoVacante(vacante) }));

  /* Limpia los filtros y el buscador de la cabecera */
  const filtroRol = document.getElementById("filtroRol");
  if (filtroRol) filtroRol.value = "";
  const buscarEmpresa = document.getElementById("buscarEmpresaAdmin");
  if (buscarEmpresa) buscarEmpresa.value = "";
  const filtroEstado = document.getElementById("filtroEstadoVacante");
  if (filtroEstado) filtroEstado.value = "";
  const campo = document.getElementById("buscarPanel");
  if (campo) {
    campo.value = "";
    document.querySelectorAll(".adm-oculto").forEach((el) => el.classList.remove("adm-oculto"));
  }

  /* Vuelve a pintar el panel entero */
  pintarActividad();
  dibujarAnilloSectores();
  pintarUsuarios();
  pintarEmpresas();
  pintarVacantes();
  pintarModeracion();
  pintarBarras();
  pintarTopEmpresas();

  avisar("Panel actualizado y filtros limpiados.", "exito");
}

/* ---------------------------------------------------------------
   Acciones de las tablas (delegación de eventos)
   Un solo escuchador por tabla atiende los botones de las filas,
   incluso cuando la tabla se vuelve a pintar.
   --------------------------------------------------------------- */
function prepararAccionesTablas() {
  /* --- Usuarios: suspender o reactivar y eliminar --- */
  const cuerpoUsuarios = document.getElementById("cuerpoUsuarios");
  if (cuerpoUsuarios) {
    cuerpoUsuarios.addEventListener("click", (evento) => {
      const cambiar = evento.target.closest("[data-usuario-estado]");
      if (cambiar) {
        const usuario = usuariosAdmin.find((u) => u.id === Number(cambiar.dataset.usuarioEstado));
        if (!usuario) return;
        const estado = usuario.estado === "Activo" ? "Suspendido" : "Activo";
        if (!cambiarEstadoCuenta(usuario.usuario, estado)) { avisar("No se pudo cambiar la cuenta. No puedes suspender tu propia cuenta."); return; }
        usuariosAdmin = cargarUsuariosAdmin();
        pintarUsuarios();
        avisar(
          `${escaparHTML(usuario.nombre)}: cuenta ${estado === "Activo" ? "reactivada" : "suspendida"} (demostración).`,
          estado === "Activo" ? "exito" : "aviso"
        );
        return;
      }

      const eliminar = evento.target.closest("[data-usuario-eliminar]");
      if (eliminar) {
        const id = Number(eliminar.dataset.usuarioEliminar);
        const usuario = usuariosAdmin.find((u) => u.id === id);
        if (!usuario) return;

        /* Confirmación simple antes de borrar la cuenta */
        const aceptado = window.confirm(
          `¿Eliminar la cuenta de ${escaparHTML(usuario.nombre)}? Esta acción no se puede deshacer.`
        );
        if (!aceptado) return;

        if (!cambiarEstadoCuenta(usuario.usuario, "Eliminado")) { avisar("No se pudo eliminar la cuenta. No puedes eliminar tu propia cuenta."); return; }
        usuariosAdmin = cargarUsuariosAdmin();
        pintarUsuarios();
        avisar(`Cuenta de ${escaparHTML(usuario.nombre)} eliminada (demostración).`);
      }
    });
  }

  /* --- Empresas: editar ficha y dar de baja o reactivar --- */
  const cuerpoEmpresas = document.getElementById("cuerpoEmpresas");
  if (cuerpoEmpresas) {
    cuerpoEmpresas.addEventListener("click", (evento) => {
      const editar = evento.target.closest("[data-empresa-editar]");
      if (editar) {
        const empresa = empresasAdmin.find((e) => e.id === Number(editar.dataset.empresaEditar));
        if (!empresa) return;
        abrirEdicionEmpresa(empresa.id, () => { empresasAdmin = EMPRESAS.map(e => ({...e})); pintarEmpresas(); pintarTopEmpresas(); });
        return;
      }

      const baja = evento.target.closest("[data-empresa-baja]");
      if (baja) {
        const empresa = empresasAdmin.find((e) => e.id === Number(baja.dataset.empresaBaja));
        if (!empresa) return;
        if (!suspenderEmpresa(empresa.id, true)) { avisar("No se pudo suspender la empresa."); return; }
        empresa.suspendida = true;
        pintarEmpresas();
        avisar(`Empresa ${escaparHTML(empresa.nombre)} dada de baja (demostración).`);
        return;
      }

      const reactivar = evento.target.closest("[data-empresa-reactivar]");
      if (reactivar) {
        const empresa = empresasAdmin.find((e) => e.id === Number(reactivar.dataset.empresaReactivar));
        if (!empresa) return;
        if (!suspenderEmpresa(empresa.id, false)) { avisar("No se pudo reactivar la empresa."); return; }
        empresa.suspendida = false;
        pintarEmpresas();
        avisar(`Empresa ${escaparHTML(empresa.nombre)} reactivada (demostración).`, "exito");
      }
    });
  }

  /* --- Vacantes: aprobar y retirar ofertas --- */
  const cuerpoVacantes = document.getElementById("cuerpoVacantes");
  if (cuerpoVacantes) {
    cuerpoVacantes.addEventListener("click", (evento) => {
      const aprobar = evento.target.closest("[data-vacante-aprobar]");
      if (aprobar) {
        const vacante = vacantesAdmin.find((v) => v.id === Number(aprobar.dataset.vacanteAprobar));
        if (!vacante) return;
        if (!cambiarEstadoVacante(vacante.id, "Publicada")) { avisar("No se pudo publicar la oferta."); return; }
        vacante.estado = "Publicada";
        pintarVacantes();
        avisar(`Oferta «${vacante.titulo}» aprobada y publicada (demostración).`, "exito");
        return;
      }

      const retirar = evento.target.closest("[data-vacante-retirar]");
      if (retirar) {
        const vacante = vacantesAdmin.find((v) => v.id === Number(retirar.dataset.vacanteRetirar));
        if (!vacante) return;
        if (!cambiarEstadoVacante(vacante.id, "Retirada")) { avisar("No se pudo retirar la oferta."); return; }
        vacante.estado = "Retirada";
        pintarVacantes();
        avisar(`Oferta «${vacante.titulo}» retirada del portal (demostración).`);
      }
    });
  }


}

/* ---------------------------------------------------------------
   Arranque del panel
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* Estado inicial: copias editables de los datos de prueba */
  usuariosAdmin = cargarUsuariosAdmin();
  empresasAdmin = EMPRESAS.map((empresa) => ({ ...empresa }));
  vacantesAdmin = VACANTES.map((vacante) => ({ ...vacante, estado: estadoVacante(vacante) }));

  /* Pintado de los siete paneles */
  pintarActividad();
  dibujarAnilloSectores();
  pintarUsuarios();
  pintarEmpresas();
  pintarVacantes();
  pintarModeracion();
  pintarBarras();
  pintarTopEmpresas();

  /* Índice lateral: cada botón muestra su panel */
  document.querySelectorAll(".admin-lateral button").forEach((boton) => {
    boton.addEventListener("click", () => { history.replaceState(null,"","#"+boton.dataset.seccion); cambiarSeccion(boton.dataset.seccion); });
  });
  cambiarSeccion(location.hash.slice(1) || "principal");

  /* Filtros en vivo de las tablas */
  const filtroRol = document.getElementById("filtroRol");
  if (filtroRol) filtroRol.addEventListener("change", pintarUsuarios);

  const buscarEmpresa = document.getElementById("buscarEmpresaAdmin");
  if (buscarEmpresa) buscarEmpresa.addEventListener("input", pintarEmpresas);

  const filtroEstado = document.getElementById("filtroEstadoVacante");
  if (filtroEstado) filtroEstado.addEventListener("change", pintarVacantes);

  /* Acciones de las tablas y de la moderación */
  prepararAccionesTablas();

  /* Buscador de la cabecera, interruptores y restablecimiento */
  prepararBusquedaPanel();
  prepararConfiguracion();

  const btnRestablecer = document.getElementById("btnRestablecer");
  if (btnRestablecer) btnRestablecer.addEventListener("click", restablecerDatos);
});

window.addEventListener("hashchange",()=>cambiarSeccion(location.hash.slice(1) || "principal"));
