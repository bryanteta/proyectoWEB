/* =============================================================
   PORTAL DE TRABAJO — módulo empresarial
   -------------------------------------------------------------
   Lógica de la pantalla empresas.html:
     · Cambio de sección del índice lateral (un panel visible).
     · Formulario de publicación con validación de campos.
     · Listado de ofertas propias con cierre y reapertura.
     · Postulantes por oferta con cambio de estado.
     · Habilidades dinámicas en el formulario (chips eliminables).
     · Directorio de empresas con búsqueda en vivo.
     · Valoraciones de las empresas del portal.
   ============================================================= */

/* ---------------------------------------------------------------
   Estado de la pantalla (memoria del navegador, sin servidor)
   --------------------------------------------------------------- */

/* Ofertas "propias": tres vacantes de ejemplo hacen de ofertas ya
   publicadas por la empresa demo. Delante se colocan las que se
   hayan publicado desde el formulario y quedaron guardadas en el
   navegador (así siguen visibles al recargar la página). */
const sesionEmpresa = sesionDatos();
let misOfertas = VACANTES.filter(v => v.empresaId === sesionEmpresa?.empresaId)
  .map(v => ({ ...v, estado: estadoVacante(v) === "Publicada" ? "Abierta" : estadoVacante(v) }));
function empresaDemoParaPublicacion() {
  const id=sesionDatos()?.rol === "empresa" ? sesionDatos().empresaId : null;
  return EMPRESAS.find(e => e.id === id) || {id:null,ciudad:""};
}

/* Habilidades seleccionadas para la oferta en edición */
let habilidadesOferta = [];

/* Habilidades con las que arranca cada oferta nueva.
   Se restauran al limpiar el formulario. */
const HABILIDADES_BASE = ["Excel", "Comunicación", "Inglés", "Trabajo en equipo"];

/* ---------------------------------------------------------------
   Utilidades compartidas
   --------------------------------------------------------------- */

/* Cuenta las postulaciones registradas para una oferta */
function contarPostulantes(idOferta) {
  return candidatosDeVacante(idOferta).length;
}

/* Chip de estado del candidato con su color correspondiente */
function chipEstado(estado) {
  const tonos = { "Nueva": "ambar", "En revisión": "cielo", "Preseleccionada": "verde", "En entrevista": "cielo", "Seleccionada": "verde", "Contratada": "verde", "Rechazada": "acento" };
  return `<span class="etiqueta-chip ${tonos[estado] || ""}">${escaparHTML(estado)}</span>`;
}

/* Cinco puntos de valoración: los llenos representan la nota */
function puntosValoracion(nota) {
  const enteros = Math.round(nota);
  return Array.from(
    { length: 5 },
    (_, i) => `<span class="punto-valoracion ${i < enteros ? "lleno" : ""}"></span>`
  ).join("");
}

/* El rubro del directorio no siempre coincide con el sector de
   búsqueda; esta tabla ajusta los nombres antes de crear el enlace */
function sectorDe(empresa) {
  const equivalencias = { "Diseño y publicidad": "Diseño" };
  return equivalencias[empresa.rubro] || empresa.rubro;
}

/* ---------------------------------------------------------------
   Cambio de sección
   El índice lateral muestra un panel a la vez: se marca el botón
   activo y se alterna el atributo hidden de los paneles. También
   se respeta el ancla del enlace (#postulaciones, #directorio o
   #valoraciones) cuando la página se abre desde otra pantalla.
   --------------------------------------------------------------- */
function cambiarSeccion(clave) {
  /* Si la clave no corresponde a una sección, se usa la primera */
  const existe = [...document.querySelectorAll(".indice-lateral button[data-seccion]")].some(b => b.dataset.seccion === clave);
  if (!existe) clave = "publicar";

  /* Mueve la marca .activo del índice lateral */
  document.querySelectorAll(".indice-lateral button").forEach((boton) => {
    const activo = boton.dataset.seccion === clave;
    boton.classList.toggle("activo", activo);
    if (activo) {
      boton.setAttribute("aria-current", "true");
    } else {
      boton.removeAttribute("aria-current");
    }
  });

  /* Muestra solo el panel elegido (hidden = display: none) */
  document.querySelectorAll(".panel-gestion").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== clave;
  });
}

/* Lee el ancla de la URL para abrir la sección indicada */
function seccionInicial() {
  const clave = location.hash.replace("#", "");
  return clave || "publicar";
}

/* ---------------------------------------------------------------
   Publicar oferta
   Valida los campos obligatorios y el salario; si todo está bien
   crea la oferta en memoria, la agrega al listado "Mis ofertas",
   limpia el formulario y avisa el resultado.
   --------------------------------------------------------------- */
function publicarOferta(evento) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  if (sesionDatos()?.rol!=="empresa" || !empresaHabilitada(empresaDemoParaPublicacion().id)) {avisar("Solo una empresa aprobada puede publicar vacantes.");return;}
  const campos = {
    titulo: document.getElementById("fTitulo"),
    correo: document.getElementById("fCorreo"),
    requisitos: document.getElementById("fRequisitos"),
    descripcion: document.getElementById("fDescripcion"),
    salario: document.getElementById("fSalario"),
  };

  /* Limpia los marcados de la validación anterior */
  Object.values(campos).forEach((campo) => campo.classList.remove("invalido"));

  /* 1) Campos obligatorios vacíos */
  const obligatorios = [campos.titulo, campos.correo, campos.requisitos, campos.descripcion];
  const vacios = obligatorios.filter((campo) => !campo.value.trim());
  if (vacios.length) {
    vacios.forEach((campo) => campo.classList.add("invalido"));
    avisar("Completa los campos obligatorios.");
    vacios[0].focus();
    return;
  }

  /* 2) El correo debe tener formato de correo */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.correo.value.trim())) {
    campos.correo.classList.add("invalido");
    avisar("El correo de contacto no tiene un formato válido.");
    campos.correo.focus();
    return;
  }

  /* 3) El salario es opcional, pero si se escribe debe ser número */
  const salarioTexto = campos.salario.value.trim();
  if (salarioTexto !== "" && (!Number.isFinite(Number(salarioTexto)) || Number(salarioTexto) < 0)) {
    campos.salario.classList.add("invalido");
    avisar("El salario debe ser un número mayor o igual a cero.");
    campos.salario.focus();
    return;
  }

  /* Todo correcto: se arma la oferta con los datos del formulario */
  const siguienteId = siguienteIdVacante();

  const empresa = empresaDemoParaPublicacion();

  const nuevaOferta = {
    id: siguienteId,
    titulo: campos.titulo.value.trim(),
    publicada: fechaHoy(),
    estado: "Abierta",
    contacto: campos.correo.value.trim(),
    requisitos: campos.requisitos.value.trim().split("\n").filter(Boolean),
    descripcion: campos.descripcion.value.trim(),
    habilidades: [...habilidadesOferta],
    empresaId: empresa.id,
    ubicacion: document.getElementById("fUbicacion").value,
    modalidad: document.getElementById("fModalidad").value,
    contrato: document.getElementById("fContrato").value,
    nivel: document.getElementById("fNivel").value,
    sector: document.getElementById("fSector").value,
    salarioMin: salarioTexto === "" ? null : Number(salarioTexto),
    destacada: false,
  };



  /* INTEGRACIÓN ENTRE MÓDULOS
     La oferta se guarda en localStorage con la misma estructura que
     usan el buscador, la portada y el detalle de vacante. datos.js la
     recupera al cargar cualquier página, de modo que la publicación
     no se pierde al navegar (el prototipo no tiene servidor). */
  const descripcionLimpia = nuevaOferta.descripcion || "";
  const resumenAuto =
    descripcionLimpia.length > 140
      ? descripcionLimpia.slice(0, 137) + "..."
      : descripcionLimpia || nuevaOferta.titulo;

  /* Objeto resumido: es el que consume la lista de resultados */
  const vacantePublicada = {
    id: nuevaOferta.id,
    titulo: nuevaOferta.titulo,
    empresaId: nuevaOferta.empresaId,
    ciudad: nuevaOferta.ubicacion,
    pais: CONFIG_PORTAL.pais,
    modalidad: nuevaOferta.modalidad,
    contrato: nuevaOferta.contrato,
    nivel: nuevaOferta.nivel,
    sector: nuevaOferta.sector,
    salario: nuevaOferta.salarioMin,
    estado: "Publicada",
    publicada: nuevaOferta.publicada,
    destacada: false,
    resumen: resumenAuto,
  };

  /* Ficha larga: responsabilidades, requisitos, beneficios y
     contacto que pinta vacante.html */
  const lineas = id => document.getElementById(id).value.split("\n").map(t => t.trim()).filter(Boolean);
  const detallePublicado = {
    id: nuevaOferta.id,
    descripcion: nuevaOferta.descripcion,
    habilidades: nuevaOferta.habilidades,
    responsabilidades: lineas("fResponsabilidades"),
    requisitos: nuevaOferta.requisitos,
    beneficios: lineas("fBeneficios"),
    contacto: {
      correo: nuevaOferta.contacto,
      telefono: document.getElementById("fTelefonoContacto").value.trim(),
      direccion: document.getElementById("fDireccionContacto").value.trim(),
      responsable: document.getElementById("fResponsableContacto").value.trim(),
    },
  };
  if (!guardarPublicacionExtra(vacantePublicada, detallePublicado)) {
    avisar("No se pudo guardar la oferta. Revisa el almacenamiento del navegador."); return;
  }
  VACANTES.unshift(vacantePublicada);
  DETALLES_VACANTE[vacantePublicada.id] = detallePublicado;
  misOfertas.unshift(nuevaOferta);

  /* Se refrescan el listado y el selector de postulaciones */
  pintarOfertas();
  pintarSelectorOfertas();
  pintarCandidatos();

  /* El reset dispara el evento "reset", que restaura los chips */
  formulario.reset();

  avisar("Oferta publicada correctamente. Ya aparece en el buscador.", "exito");
}

/* ---------------------------------------------------------------
   Mis ofertas
   Pinta cada fila de la tabla: enlace al detalle, fecha, contador
   de postulantes, chip de estado y acciones (ver, cerrar, reabrir).
   --------------------------------------------------------------- */
function pintarOfertas() {
  const cuerpo = document.getElementById("cuerpoOfertas");
  if (!cuerpo) return;

  cuerpo.innerHTML = misOfertas
    .map((oferta) => {
      const cerrada = oferta.estado !== "Abierta";
      const postulantes = contarPostulantes(oferta.id);

      return `
      <tr class="${cerrada ? "emp-oferta-cerrada" : ""}">
        <td>
          <a class="fuerte" href="./vacante.html?id=${oferta.id}">${escaparHTML(oferta.titulo)}</a>
          <div class="datos texto-tenue">Código #${oferta.id}</div>
        </td>
        <td class="datos">${fechaCercana(oferta.publicada)}</td>
        <td>
          <button class="btn btn-linea btn-sm" type="button" data-ver-postulantes="${oferta.id}" aria-label="Ver ${postulantes} postulaciones de ${escaparHTML(oferta.titulo)}">${postulantes} · Ver postulantes</button>
        </td>
        <td>
          ${cerrada
            ? `<span class="etiqueta-chip rellena">${escaparHTML(oferta.estado)}</span>`
            : '<span class="etiqueta-chip verde">Abierta</span>'}
        </td>
        <td>
          <div class="emp-tabla-acciones">
            <a class="btn btn-linea btn-sm" href="./vacante.html?id=${oferta.id}">Ver</a>
            ${cerrada
              ? `<button class="btn btn-fantasma btn-sm" type="button" data-reabrir="${oferta.id}">Reabrir</button>`
              : `<button class="btn btn-fantasma btn-sm" type="button" data-cerrar="${oferta.id}">Cerrar oferta</button>`}
          </div>
        </td>
      </tr>`;
    })
    .join("");

  /* Resumen de la cabecera: total y ofertas aún abiertas */
  const resumen = document.getElementById("resumenOfertas");
  if (resumen) {
    const abiertas = misOfertas.filter((o) => o.estado === "Abierta").length;
    resumen.textContent = `${misOfertas.length} ofertas · ${abiertas} abiertas · ${misOfertas.length - abiertas} cerradas`;
  }
}

/* Cambia el estado de una oferta y vuelve a pintar la tabla */
function cambiarEstadoOferta(idOferta, estado) {
  const oferta = misOfertas.find((o) => o.id === idOferta);
  if (!oferta) return;
  if (!cambiarEstadoVacante(idOferta, estado === "Abierta" ? "Publicada" : estado)) {
    avisar("No se pudo cambiar el estado. Una retirada administrativa requiere aprobación del administrador."); return;
  }
  oferta.estado = estado;
  pintarOfertas();

  if (estado === "Cerrada") {
    avisar(`Oferta «${escaparHTML(oferta.titulo)}» cerrada. Ya no recibe postulaciones nuevas.`);
  } else {
    avisar(`Oferta «${escaparHTML(oferta.titulo)}» reabierta para postulaciones.`, "exito");
  }
}

/* ---------------------------------------------------------------
   Postulaciones recibidas
   El selector elige la oferta; debajo se pintan las fichas de las
   personas postuladas con su estado y una ficha de revisión del proceso de selección.
   --------------------------------------------------------------- */

/* Rellena el selector con las ofertas propias */
function pintarSelectorOfertas() {
  const selector = document.getElementById("selectOferta");
  if (!selector) return;

  const anterior = selector.value;
  selector.innerHTML = misOfertas
    .map((oferta) => `<option value="${oferta.id}">${escaparHTML(oferta.titulo)} (${contarPostulantes(oferta.id)})</option>`)
    .join("");

  /* Conserva la selección anterior si esa oferta sigue existiendo */
  if (anterior && misOfertas.some((o) => String(o.id) === anterior)) {
    selector.value = anterior;
  }
}

/* Pinta las fichas de candidatos de la oferta elegida */
function pintarCandidatos() {
  const contenedor = document.getElementById("listaCandidatos"), selector = document.getElementById("selectOferta");
  if (!contenedor || !selector) return;
  const id = Number(selector.value), todos = puedeGestionarCandidatos(id) ? candidatosDeVacante(id) : [];
  const texto = (document.getElementById("buscarCandidato")?.value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtro = document.getElementById("estadoCandidato")?.value || "";
  const candidatos = todos.filter(c => (!filtro || c.estado === filtro) && [c.nombre,c.titulo,...c.habilidades].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto));
  const seleccionadas=todos.filter(c=>c.estado === "Seleccionada").length, contratadas=todos.filter(c=>c.estado === "Contratada").length;
  document.getElementById("resumenCandidatos").textContent = `${candidatos.length} de ${todos.length} candidaturas · ${seleccionadas} ${seleccionadas===1 ? "seleccionada" : "seleccionadas"} · ${contratadas} ${contratadas===1 ? "contratada" : "contratadas"}`;
  contenedor.innerHTML = candidatos.length ? candidatos.map(c => `
    <article class="candidato">
      <span class="avatar" aria-hidden="true">${escaparHTML(c.iniciales)}</span>
      <div><h3 class="fs-5">${escaparHTML(c.nombre)}</h3><p class="texto-suave">${escaparHTML(c.titulo)} · ${escaparHTML(c.experiencia)}</p>
      <div class="habilidades">${c.habilidades.map(h=>`<span class="etiqueta-chip">${escaparHTML(h)}</span>`).join("")}</div></div>
      <div class="emp-candidato-acciones">${chipEstado(c.estado)}
        <button class="btn btn-bermellon btn-sm" type="button" data-candidatura="${escaparHTML(c.clave)}">Revisar candidatura</button>
      </div>
    </article>`).join("") : `<div class="vacio"><h3>${todos.length ? "Sin coincidencias" : "Aún no hay postulantes"}</h3><p>${todos.length ? "Cambia el estado o la búsqueda para consultar otras candidaturas." : "Selecciona otra oferta o comparte el enlace del puesto para recibir postulaciones."}</p></div>`;
}

function abrirCandidatura(id, clave) {
  if (!puedeGestionarCandidatos(id)) { avisar("No tienes acceso a esta candidatura."); return; }
  const c = candidatosDeVacante(id).find(c=>c.clave === clave);
  if (!c) { avisar("Esta candidatura ya no está disponible."); return; }
  const vacante = VACANTES.find(v=>v.id === id), opciones = TRANSICIONES_CANDIDATURA[c.estado] || [];
  const modal = document.createElement("div"); modal.className="modal"; modal.tabIndex=-1; modal.setAttribute("aria-labelledby","tituloCandidatura");
  modal.innerHTML = `<div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">
    <div class="modal-header"><h2 class="modal-title fs-4" id="tituloCandidatura">${escaparHTML(c.nombre)}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
    <div class="modal-body"><p class="datos">${escaparHTML(vacante.titulo)}</p>${chipEstado(c.estado)}
      <h3 class="fs-5 mt-4">Perfil enviado</h3><p>${escaparHTML(c.titulo)}</p><p>${escaparHTML(c.presentacion || c.experiencia || "Sin presentación adicional.")}</p>
      <p>${c.ciudad ? "Ciudad: "+escaparHTML(c.ciudad) : "Ciudad no indicada"}</p>
      <div class="habilidades">${c.habilidades.map(h=>`<span class="etiqueta-chip">${escaparHTML(h)}</span>`).join("")}</div>
      <p class="mt-3">${c.correo ? "Correo de contacto: "+escaparHTML(c.correo) : "Este perfil de ejemplo no incluye correo de contacto."}</p>
      <p class="texto-suave">No hay un archivo de CV disponible para esta candidatura. Puedes revisar aquí los datos enviados; la carga y descarga de documentos requiere almacenamiento de archivos.</p>
      <h3 class="fs-5 mt-4">Historial del proceso</h3><ol>${c.historial.map(e=>`<li><strong>${escaparHTML(e.estado)}</strong> · ${escaparHTML(new Date(e.fecha).toLocaleString(CONFIG_PORTAL.locale,{timeZone:CONFIG_PORTAL.zonaHoraria}))}${e.observacion ? `<p style="white-space:pre-wrap">${escaparHTML(e.observacion)}</p>` : ""}</li>`).join("") || "<li>Sin cambios registrados. Estado inicial: "+escaparHTML(c.estado)+".</li>"}</ol>
      ${opciones.length ? `<form id="formDecisionCandidato"><h3 class="fs-5 mt-4">Actualizar candidatura</h3><label class="form-label" for="nuevoEstadoCandidato">Siguiente etapa</label><select id="nuevoEstadoCandidato" class="form-select" required><option value="">Selecciona una etapa</option>${opciones.map(e=>`<option>${escaparHTML(e)}</option>`).join("")}</select><label class="form-label mt-3" for="observacionCandidato">Mensaje para el candidato</label><textarea id="observacionCandidato" class="form-control" maxlength="1000" rows="3" aria-describedby="ayudaDecision"></textarea><p id="ayudaDecision" class="texto-suave mt-2">El mensaje y el nuevo estado serán visibles en su perfil. Para rechazar o reconsiderar escribe un motivo de al menos 10 caracteres. Seleccionar no cierra la oferta ni rechaza otras candidaturas.</p><p id="errorDecision" class="text-danger" role="alert"></p><button class="btn btn-bermellon" type="submit">Guardar etapa</button></form>` : '<p class="mt-4">Proceso finalizado: contratación registrada.</p>'}
    </div><div class="modal-footer"><button type="button" class="btn btn-linea" data-bs-dismiss="modal">Cerrar</button></div></div></div>`;
  document.body.append(modal); const instancia = new bootstrap.Modal(modal);
  modal.addEventListener("hidden.bs.modal",()=>{instancia.dispose();modal.remove();});
  modal.querySelector("form")?.addEventListener("submit",e=>{
    e.preventDefault(); const estado=modal.querySelector("select").value, mensaje=modal.querySelector("textarea").value.trim();
    if ((estado === "Rechazada" || c.estado === "Rechazada") && mensaje.length<10) {modal.querySelector("#errorDecision").textContent="Escribe un motivo de al menos 10 caracteres.";return;}
    if (!actualizarEstadoCandidato(id,clave,estado,mensaje,c.version)) {modal.querySelector("#errorDecision").textContent="No se pudo guardar. La candidatura o tus permisos cambiaron; cierra y vuelve a abrir la ficha.";return;}
    instancia.hide();pintarCandidatos();avisar("Etapa actualizada. El candidato puede consultarla en su perfil.","exito");
  }); instancia.show();
}

/* ---------------------------------------------------------------
   Habilidades dinámicas del formulario
   Los chips se pintan delante del botón y del campo de entrada;
   cada uno lleva un botón × que lo retira de la oferta.
   --------------------------------------------------------------- */
function pintarHabilidades() {
  const contenedor = document.getElementById("chipsHabilidad");
  if (!contenedor) return;

  /* Se quitan los chips y se vuelven a dibujar desde cero */
  contenedor.querySelectorAll(".emp-chip").forEach((chip) => chip.remove());
  const boton = contenedor.querySelector("#btnAgregarHabilidad");

  habilidadesOferta.forEach((habilidad) => {
    const chip = document.createElement("span");
    chip.className = "etiqueta-chip emp-chip";
    chip.dataset.habilidad = habilidad;
    chip.append(document.createTextNode(habilidad));

    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "emp-quitar";
    quitar.setAttribute("aria-label", `Quitar ${escaparHTML(habilidad)}`);
    quitar.innerHTML = "&times;";
    chip.append(quitar);

    contenedor.insertBefore(chip, boton);
  });
}

/* Agrega la habilidad escrita en el campo (evita duplicados) */
function agregarHabilidad() {
  const campo = document.getElementById("fHabilidad");
  if (!campo) return;

  const texto = campo.value.trim();
  if (!texto) {
    avisar("Escribe la habilidad que quieres agregar.");
    campo.focus();
    return;
  }
  if (habilidadesOferta.includes(texto)) {
    avisar("Esa habilidad ya está en la lista.");
    campo.select();
    return;
  }

  habilidadesOferta.push(texto);
  campo.value = "";
  pintarHabilidades();
  campo.focus();
}

/* Ficha propia; el directorio público vive en directorio.html. */
function pintarDirectorio() {
  const rejilla = document.getElementById("rejillaEmpresas"); if (!rejilla) return;
  const sesion=sesionDatos(), propia=EMPRESAS.find(e=>e.id === sesion?.empresaId);
  rejilla.innerHTML = propia ? `<div class="col-12"><article class="panel"><div class="panel-cuerpo">
    <h3>${escaparHTML(propia.nombre)}</h3><p>${escaparHTML(propia.rubro)} · ${escaparHTML(propia.ciudad)} · ${escaparHTML(propia.tamano)}</p>
    <p>${escaparHTML(propia.descripcion || "Completa la descripción de tu organización.")}</p>
    <p>Estado: <strong>${empresaHabilitada(propia.id) ? "Aprobada y activa" : "Suspendida"}</strong> · ${ofertasPublicasDeEmpresa(propia.id).length} ofertas abiertas</p>
    <div class="d-flex gap-2 flex-wrap"><button class="btn btn-bermellon" type="button" data-editar="${propia.id}">Editar mi ficha</button><a class="btn btn-linea" href="./directorio.html?empresa=${propia.id}">Ver ficha pública</a><a class="btn btn-linea" href="./registro-empresa.html">Ver registro empresarial</a></div>
  </div></article></div>` : '<div class="col-12"><p>Estás en una cuenta administrativa. La edición y suspensión de empresas se realiza desde <a href="./admin.html#empresas">Gestión de empresas</a>.</p></div>';
}

/* ---------------------------------------------------------------
   Valoraciones
   Una tarjeta por empresa con valoración: nota grande, reseñas,
   puntos de valoración y enlace a las ofertas de su sector.
   --------------------------------------------------------------- */
function pintarValoraciones() {
  const contenedor = document.getElementById("rejillaValoraciones");
  if (!contenedor) return;
  const sesion=sesionDatos(), selector=document.getElementById("empresaValoraciones");
  const empresa=EMPRESAS.find(e=>sesion?.rol === "empresa" && e.id === sesion.empresaId);
  if (!empresa) {contenedor.innerHTML='<div class="vacio"><h3>Selecciona una empresa</h3><p>Consulta su puntuación y las experiencias recibidas.</p></div>';return;}
  const resenas=resenasDeEmpresa(empresa.id), total=resenas.length;
  const nota=total ? (resenas.reduce((n,r)=>n+r.nota,0)/total).toFixed(1) : null;
  const conteo=Array.from({length:5},(_,i)=>resenas.filter(r=>r.nota===5-i).length);
  contenedor.innerHTML=`<section class="emp-reputacion" aria-label="Resumen de valoraciones de ${escaparHTML(empresa.nombre)}">
    <div class="emp-reputacion-nota"><p class="datos mb-2">${escaparHTML(empresa.nombre)}</p>
      <p class="emp-reputacion-promedio">${nota || '—'}<span>${total ? 'de 5' : 'Sin puntuación'}</span></p>
      <p class="mb-0">${total ? `${total} ${total===1?'reseña recibida':'reseñas recibidas'}` : 'Aún no hay reseñas'}</p>
    </div>
    <div class="emp-reputacion-distribucion"><h3>Distribución de puntuaciones</h3>
      ${conteo.map((n,i)=>`<div class="emp-distribucion-fila"><span>${5-i} <span aria-hidden="true">★</span><span class="visually-hidden"> estrellas</span></span><div class="emp-distribucion-pista" aria-hidden="true"><span style="width:${total ? n/total*100 : 0}%"></span></div><span class="datos">${n}<span class="visually-hidden"> reseñas</span></span></div>`).join("")}
      <p class="texto-suave small mb-0 mt-3">Cada reseña tiene el mismo peso en el promedio.</p>
    </div>
  </section>
  <div class="emp-resenas-cabecera"><h3>Experiencias recibidas</h3>${empresaHabilitada(empresa.id) ? `<a class="btn btn-linea btn-sm" href="./directorio.html?empresa=${empresa.id}">Ver ficha pública</a>` : '<span class="etiqueta-chip">Empresa suspendida</span>'}</div>
  <div class="emp-resenas-lista">${resenas.map(r=>`<article class="emp-resena"><div class="emp-resena-cabecera"><div class="d-flex gap-3 align-items-center"><span class="avatar avatar-sm" aria-hidden="true">${escaparHTML(r.iniciales || r.autor?.slice(0,2) || "US")}</span><div><h4>${escaparHTML(r.autor)}</h4><p class="datos texto-tenue mb-0">${escaparHTML(fechaCercana(r.fecha))}</p></div></div><span class="emp-resena-nota" aria-label="${r.nota} de 5 estrellas"><span aria-hidden="true">${"★".repeat(r.nota)}<span class="texto-tenue">${"☆".repeat(5-r.nota)}</span></span><span>${r.nota}/5</span></span></div><p class="emp-resena-texto">${escaparHTML(r.texto)}</p></article>`).join("") || '<div class="vacio emp-resenas-vacio"><h4>Tu empresa aún no tiene valoraciones</h4><p>Las experiencias publicadas por candidatos aparecerán aquí. No se muestra una nota de cero cuando todavía no hay reseñas.</p></div>'}</div>`;
}

/* ---------------------------------------------------------------
   Arranque de la pantalla
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Incluir la ciudad de la empresa aprobada en el formulario de publicación.
  const ciudadEmpresa = empresaDemoParaPublicacion().ciudad;
  const ubicacion = document.getElementById("fUbicacion");
  if (ubicacion && ciudadEmpresa && ![...ubicacion.options].some(o=>o.value === ciudadEmpresa)) ubicacion.add(new Option(ciudadEmpresa,ciudadEmpresa));
  if (ubicacion && ciudadEmpresa) ubicacion.value = ciudadEmpresa;
  /* Estado inicial de los bloques pintados con JavaScript */
  habilidadesOferta = [...HABILIDADES_BASE];
  pintarHabilidades();
  pintarOfertas();
  pintarSelectorOfertas();
  const ofertaURL=new URLSearchParams(location.search).get("oferta");
  if (misOfertas.some(o=>String(o.id)===ofertaURL)) document.getElementById("selectOferta").value=ofertaURL;
  pintarCandidatos();
  pintarDirectorio();
  const selectorValoraciones=document.getElementById("empresaValoraciones");
  pintarValoraciones();

  /* Índice lateral: cada botón muestra su panel */
  document.querySelectorAll(".indice-lateral button").forEach((boton) => {
    boton.addEventListener("click", () => { history.replaceState(null, "", "#" + boton.dataset.seccion); cambiarSeccion(boton.dataset.seccion); });
  });

  /* Sección inicial: la que indique el ancla de la URL */
  cambiarSeccion(seccionInicial());

  /* También se atiende el cambio de ancla sin recargar la página
     (por ejemplo, al pulsar un enlace del pie estando en esta misma
     pantalla) */
  window.addEventListener("hashchange", () => cambiarSeccion(seccionInicial()));
  window.addEventListener("popstate",()=>{
    cambiarSeccion(seccionInicial());const id=new URLSearchParams(location.search).get("oferta");
    if(misOfertas.some(o=>String(o.id)===id)) document.getElementById("selectOferta").value=id;
    pintarCandidatos();
  });

  /* Formulario de publicación: envío, limpieza y borrado de marcas */
  const formulario = document.getElementById("formPublicar");
  if (formulario) {
    formulario.addEventListener("submit", publicarOferta);

    /* Al limpiar se restauran las habilidades base y los marcados */
    formulario.addEventListener("reset", () => {
      habilidadesOferta = [...HABILIDADES_BASE];
      pintarHabilidades();
      formulario.querySelectorAll(".invalido").forEach((campo) => campo.classList.remove("invalido"));
    });

    /* Escribir en un campo borra su marca de error */
    formulario.querySelectorAll(".form-control, .form-select").forEach((campo) => {
      campo.addEventListener("input", () => campo.classList.remove("invalido"));
    });
  }

  /* Habilidades: botón y tecla Intro del campo */
  const botonHabilidad = document.getElementById("btnAgregarHabilidad");
  if (botonHabilidad) botonHabilidad.addEventListener("click", agregarHabilidad);

  const campoHabilidad = document.getElementById("fHabilidad");
  if (campoHabilidad) {
    campoHabilidad.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();   /* evita enviar el formulario */
        agregarHabilidad();
      }
    });
  }

  /* Retiro de habilidades: delegación sobre el contenedor de chips */
  const contenedorChips = document.getElementById("chipsHabilidad");
  if (contenedorChips) {
    contenedorChips.addEventListener("click", (evento) => {
      const quitar = evento.target.closest(".emp-quitar");
      if (!quitar) return;
      const habilidad = quitar.closest(".emp-chip").dataset.habilidad;
      habilidadesOferta = habilidadesOferta.filter((h) => h !== habilidad);
      pintarHabilidades();
    });
  }

  /* Acciones de la tabla de ofertas (cerrar y reabrir) */
  const cuerpoOfertas = document.getElementById("cuerpoOfertas");
  if (cuerpoOfertas) {
    cuerpoOfertas.addEventListener("click", (evento) => {
      const ver = evento.target.closest("[data-ver-postulantes]");
      if (ver) {
        document.getElementById("selectOferta").value=ver.dataset.verPostulantes;
        document.getElementById("buscarCandidato").value="";document.getElementById("estadoCandidato").value="";
        history.pushState(null,"",`?oferta=${ver.dataset.verPostulantes}#postulaciones`);cambiarSeccion("postulaciones");pintarCandidatos();return;
      }
      const cerrar = evento.target.closest("[data-cerrar]");
      const reabrir = evento.target.closest("[data-reabrir]");
      if (cerrar) cambiarEstadoOferta(Number(cerrar.dataset.cerrar), "Cerrada");
      if (reabrir) cambiarEstadoOferta(Number(reabrir.dataset.reabrir), "Abierta");
    });
  }

  /* Cambio de oferta en el selector de postulaciones */
  const selectorOferta = document.getElementById("selectOferta");
  if (selectorOferta) selectorOferta.addEventListener("change", () => {
    history.replaceState(null,"",`?oferta=${selectorOferta.value}#postulaciones`);pintarCandidatos();
  });

  document.getElementById("listaCandidatos")?.addEventListener("click", evento => {
    const boton=evento.target.closest("[data-candidatura]");
    if (boton) abrirCandidatura(Number(document.getElementById("selectOferta").value),boton.dataset.candidatura);
  });
  document.getElementById("buscarCandidato")?.addEventListener("input",pintarCandidatos);
  document.getElementById("estadoCandidato")?.addEventListener("change",pintarCandidatos);
  // Solo la ficha propia se edita aquí; las bajas se gestionan en administración.
  document.getElementById("rejillaEmpresas")?.addEventListener("click", evento => {
    const editar=evento.target.closest("[data-editar]");
    if(editar) abrirEdicionEmpresa(Number(editar.dataset.editar),()=>{pintarDirectorio();pintarValoraciones();});
  });
});
