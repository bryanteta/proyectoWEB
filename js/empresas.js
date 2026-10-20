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

/* Ofertas "propias": las tres primeras vacantes del conjunto de
   datos hacen de ofertas ya publicadas por la empresa demo. A esta
   lista se agregan las que se publiquen en el formulario. */
let misOfertas = VACANTES.slice(0, 3).map((vacante) => ({
  id: vacante.id,
  titulo: vacante.titulo,
  publicada: vacante.publicada,
  estado: "Abierta",
}));

/* Empresas dadas de baja en el directorio (solo en memoria) */
const empresasSuspendidas = new Set();

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
  const registro = POSTULACIONES.find((p) => p.vacanteId === idOferta);
  return registro ? registro.candidatos.length : 0;
}

/* Chip de estado del candidato con su color correspondiente */
function chipEstado(estado) {
  const tonos = { "Nueva": "ambar", "En revisión": "cielo", "Preseleccionada": "verde" };
  return `<span class="etiqueta-chip ${tonos[estado] || ""}">${estado}</span>`;
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
  const existe = document.querySelector(`.indice-lateral button[data-seccion="${clave}"]`);
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
  if (salarioTexto !== "" && (Number.isNaN(Number(salarioTexto)) || Number(salarioTexto) < 0)) {
    campos.salario.classList.add("invalido");
    avisar("El salario debe ser un número mayor o igual a cero.");
    campos.salario.focus();
    return;
  }

  /* Todo correcto: se arma la oferta con los datos del formulario */
  const siguienteId =
    Math.max(...VACANTES.map((v) => v.id), ...misOfertas.map((o) => o.id)) + 1;

  const nuevaOferta = {
    id: siguienteId,
    titulo: campos.titulo.value.trim(),
    publicada: new Date().toISOString().slice(0, 10),
    estado: "Abierta",
    contacto: campos.correo.value.trim(),
    requisitos: campos.requisitos.value.trim().split("\n").filter(Boolean),
    descripcion: campos.descripcion.value.trim(),
    habilidades: [...habilidadesOferta],
  };

  misOfertas.unshift(nuevaOferta);

  /* Se refrescan el listado y el selector de postulaciones */
  pintarOfertas();
  pintarSelectorOfertas();

  /* El reset dispara el evento "reset", que restaura los chips */
  formulario.reset();

  avisar("Oferta publicada correctamente.", "exito");
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
      const cerrada = oferta.estado === "Cerrada";
      const postulantes = contarPostulantes(oferta.id);

      return `
      <tr class="${cerrada ? "emp-oferta-cerrada" : ""}">
        <td>
          <a class="fuerte" href="./vacante.html?id=${oferta.id}">${oferta.titulo}</a>
          <div class="datos texto-tenue">Código #${oferta.id}</div>
        </td>
        <td class="datos">${fechaCercana(oferta.publicada)}</td>
        <td>
          <span class="datos ${postulantes ? "fuerte" : "texto-tenue"}">${postulantes}</span>
        </td>
        <td>
          ${cerrada
            ? '<span class="etiqueta-chip rellena">Cerrada</span>'
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
  oferta.estado = estado;
  pintarOfertas();

  if (estado === "Cerrada") {
    avisar(`Oferta «${oferta.titulo}» cerrada. Ya no recibe postulaciones nuevas.`);
  } else {
    avisar(`Oferta «${oferta.titulo}» reabierta para postulaciones.`, "exito");
  }
}

/* ---------------------------------------------------------------
   Postulaciones recibidas
   El selector elige la oferta; debajo se pintan las fichas de las
   personas postuladas con su estado, la descarga del currículum y
   el botón de preselección.
   --------------------------------------------------------------- */

/* Rellena el selector con las ofertas propias */
function pintarSelectorOfertas() {
  const selector = document.getElementById("selectOferta");
  if (!selector) return;

  const anterior = selector.value;
  selector.innerHTML = misOfertas
    .map((oferta) => `<option value="${oferta.id}">${oferta.titulo}</option>`)
    .join("");

  /* Conserva la selección anterior si esa oferta sigue existiendo */
  if (anterior && misOfertas.some((o) => String(o.id) === anterior)) {
    selector.value = anterior;
  }
}

/* Pinta las fichas de candidatos de la oferta elegida */
function pintarCandidatos() {
  const contenedor = document.getElementById("listaCandidatos");
  const selector = document.getElementById("selectOferta");
  if (!contenedor || !selector) return;

  /* Solo la vacante 101 tiene postulantes de prueba en datos.js */
  const registro = POSTULACIONES.find((p) => p.vacanteId === Number(selector.value));
  const candidatos = registro ? registro.candidatos : [];

  /* Aviso de vacío cuando la oferta todavía no tiene postulantes */
  if (!candidatos.length) {
    contenedor.innerHTML = `
      <div class="vacio">
        <span class="disco" aria-hidden="true">0</span>
        <h3>Aún no hay postulantes</h3>
        <p class="texto-suave mb-0">
          Cuando alguien postule a esta oferta aparecerá aquí con su currículum.
        </p>
      </div>`;
    return;
  }

  contenedor.innerHTML = candidatos
    .map(
      (candidato, indice) => `
      <article class="candidato">
        <span class="avatar" aria-hidden="true">${candidato.iniciales}</span>
        <div>
          <h4>${candidato.nombre}</h4>
          <p class="texto-suave mb-0">${candidato.titulo} · ${candidato.experiencia}</p>
          <div class="habilidades">
            ${candidato.habilidades
              .map((habilidad) => `<span class="etiqueta-chip">${habilidad}</span>`)
              .join("")}
          </div>
        </div>
        <div class="emp-candidato-acciones">
          ${chipEstado(candidato.estado)}
          <div class="d-flex gap-2">
            <button class="btn btn-linea btn-sm" type="button" data-cv="${indice}">
              Descargar CV
            </button>
            ${candidato.estado === "Preseleccionada"
              ? ""
              : `<button class="btn btn-bermellon btn-sm" type="button" data-preseleccionar="${indice}">
                   Preseleccionar
                 </button>`}
          </div>
        </div>
      </article>`
    )
    .join("");
}

/* Mueve al candidato a la lista de preseleccionados */
function preseleccionarCandidato(idOferta, indice) {
  const registro = POSTULACIONES.find((p) => p.vacanteId === idOferta);
  if (!registro) return;

  const candidato = registro.candidatos[indice];
  candidato.estado = "Preseleccionada";
  pintarCandidatos();
  avisar(`${candidato.nombre} pasa a la lista de preseleccionados.`, "exito");
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
    quitar.setAttribute("aria-label", `Quitar ${habilidad}`);
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

/* ---------------------------------------------------------------
   Directorio de empresas
   Pinta una tarjeta por empresa del portal. La búsqueda filtra en
   vivo por nombre, rubro o ciudad; las empresas dadas de baja
   quedan atenuadas con el chip "Suspendida".
   --------------------------------------------------------------- */
function pintarDirectorio() {
  const rejilla = document.getElementById("rejillaEmpresas");
  if (!rejilla) return;

  /* Texto del filtro en vivo */
  const campo = document.getElementById("buscarEmpresa");
  const texto = (campo ? campo.value : "").trim().toLowerCase();

  const encontradas = EMPRESAS.filter((empresa) => {
    if (!texto) return true;
    return [empresa.nombre, empresa.rubro, empresa.ciudad].some((dato) =>
      dato.toLowerCase().includes(texto)
    );
  });

  /* Cuenta de resultados junto al buscador */
  const cuenta = document.getElementById("cuentaEmpresas");
  if (cuenta) {
    cuenta.textContent = `${encontradas.length} de ${EMPRESAS.length} empresas en el directorio`;
  }

  /* Mensaje de vacío cuando el filtro no encuentra nada */
  if (!encontradas.length) {
    rejilla.innerHTML = `
      <div class="col-12">
        <div class="vacio">
          <span class="disco" aria-hidden="true">0</span>
          <h3>Sin coincidencias</h3>
          <p class="texto-suave mb-0">Prueba con otro nombre, rubro o ciudad.</p>
        </div>
      </div>`;
    return;
  }

  rejilla.innerHTML = encontradas
    .map((empresa) => {
      const suspendida = empresasSuspendidas.has(empresa.id);

      return `
      <div class="col-md-6 col-lg-4">
        <div class="tarjeta tarjeta-estatica emp-empresa h-100 ${suspendida ? "emp-suspendida" : ""}">
          <div class="emp-empresa-cab">
            <span class="marca-empresa" aria-hidden="true">${empresa.iniciales}</span>
            <div>
              <h3>${empresa.nombre}</h3>
              <p class="datos texto-tenue mb-0">${empresa.rubro}</p>
            </div>
            ${suspendida ? '<span class="etiqueta-chip acento">Suspendida</span>' : ""}
          </div>
          <div class="emp-datos">
            <span>${empresa.tamano}</span>
            <span>${empresa.ciudad}</span>
          </div>
          <div class="valoracion" title="Valoración media de la empresa">
            ${puntosValoracion(empresa.valoracion)}
            <span class="valoracion-nota">${empresa.valoracion.toFixed(1)}</span>
          </div>
          <div class="emp-empresa-pie">
            <button class="btn btn-linea btn-sm" type="button" data-editar="${empresa.id}">
              Editar ficha
            </button>
            ${suspendida
              ? `<button class="btn btn-fantasma btn-sm" type="button" data-reactivar="${empresa.id}">Reactivar</button>`
              : `<button class="btn btn-fantasma btn-sm" type="button" data-baja="${empresa.id}">Dar de baja</button>`}
          </div>
        </div>
      </div>`;
    })
    .join("");
}

/* ---------------------------------------------------------------
   Valoraciones
   Una tarjeta por empresa con valoración: nota grande, reseñas,
   puntos de valoración y enlace a las ofertas de su sector.
   --------------------------------------------------------------- */
function pintarValoraciones() {
  const rejilla = document.getElementById("rejillaValoraciones");
  if (!rejilla) return;

  rejilla.innerHTML = EMPRESAS.filter((empresa) => empresa.valoracion > 0)
    .map(
      (empresa) => `
      <div class="col-md-6 col-lg-4">
        <div class="tarjeta tarjeta-estatica emp-valoracion h-100">
          <div class="nota-grande">
            <strong>${empresa.valoracion.toFixed(1)}</strong>
            <span>sobre 5</span>
          </div>
          <div class="emp-valoracion-cuerpo">
            <h3>${empresa.nombre}</h3>
            <p class="datos texto-tenue mb-2">${empresa.rubro}</p>
            <div class="valoracion">
              ${puntosValoracion(empresa.valoracion)}
              <span class="valoracion-nota">${empresa.resenas} reseñas</span>
            </div>
            <a
              class="btn btn-linea btn-sm mt-3"
              href="./busqueda.html?sector=${encodeURIComponent(sectorDe(empresa))}"
            >
              Ver ofertas
            </a>
          </div>
        </div>
      </div>`
    )
    .join("");
}

/* ---------------------------------------------------------------
   Arranque de la pantalla
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* Estado inicial de los bloques pintados con JavaScript */
  habilidadesOferta = [...HABILIDADES_BASE];
  pintarHabilidades();
  pintarOfertas();
  pintarSelectorOfertas();
  pintarCandidatos();
  pintarDirectorio();
  pintarValoraciones();

  /* Índice lateral: cada botón muestra su panel */
  document.querySelectorAll(".indice-lateral button").forEach((boton) => {
    boton.addEventListener("click", () => cambiarSeccion(boton.dataset.seccion));
  });

  /* Sección inicial: la que indique el ancla de la URL */
  cambiarSeccion(seccionInicial());

  /* También se atiende el cambio de ancla sin recargar la página
     (por ejemplo, al pulsar un enlace del pie estando en esta misma
     pantalla) */
  window.addEventListener("hashchange", () => cambiarSeccion(seccionInicial()));

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
      const cerrar = evento.target.closest("[data-cerrar]");
      const reabrir = evento.target.closest("[data-reabrir]");
      if (cerrar) cambiarEstadoOferta(Number(cerrar.dataset.cerrar), "Cerrada");
      if (reabrir) cambiarEstadoOferta(Number(reabrir.dataset.reabrir), "Abierta");
    });
  }

  /* Cambio de oferta en el selector de postulaciones */
  const selectorOferta = document.getElementById("selectOferta");
  if (selectorOferta) selectorOferta.addEventListener("change", pintarCandidatos);

  /* Acciones sobre los candidatos (descargar CV y preseleccionar) */
  const listaCandidatos = document.getElementById("listaCandidatos");
  if (listaCandidatos) {
    listaCandidatos.addEventListener("click", (evento) => {
      const selector = document.getElementById("selectOferta");
      const idOferta = Number(selector.value);

      const cv = evento.target.closest("[data-cv]");
      if (cv) {
        avisar("Descargando currículum (demostración)...");
        return;
      }

      const preseleccionar = evento.target.closest("[data-preseleccionar]");
      if (preseleccionar) {
        preseleccionarCandidato(idOferta, Number(preseleccionar.dataset.preseleccionar));
      }
    });
  }

  /* Búsqueda en vivo del directorio */
  const buscarEmpresa = document.getElementById("buscarEmpresa");
  if (buscarEmpresa) buscarEmpresa.addEventListener("input", pintarDirectorio);

  /* Acciones del directorio (editar, dar de baja y reactivar) */
  const rejillaEmpresas = document.getElementById("rejillaEmpresas");
  if (rejillaEmpresas) {
    rejillaEmpresas.addEventListener("click", (evento) => {
      const editar = evento.target.closest("[data-editar]");
      const baja = evento.target.closest("[data-baja]");
      const reactivar = evento.target.closest("[data-reactivar]");

      if (editar) {
        const empresa = empresaPorId(Number(editar.dataset.editar));
        avisar(`Ficha de «${empresa.nombre}» abierta para editar (demostración).`);
      }

      if (baja) {
        const empresa = empresaPorId(Number(baja.dataset.baja));
        empresasSuspendidas.add(empresa.id);
        pintarDirectorio();
        avisar(`«${empresa.nombre}» queda suspendida del directorio.`);
      }

      if (reactivar) {
        const empresa = empresaPorId(Number(reactivar.dataset.reactivar));
        empresasSuspendidas.delete(empresa.id);
        pintarDirectorio();
        avisar(`«${empresa.nombre}» vuelve al directorio.`, "exito");
      }
    });
  }
});
