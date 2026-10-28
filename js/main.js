/* =============================================================
   PORTAL DE TRABAJO — comportamiento compartido
   -------------------------------------------------------------
   Funciones usadas por todas las pantallas: avisos flotantes,
   contadores animados, marcado de la sección activa y utilidades
   de formato. No depende de Bootstrap más allá de los menús.
   ============================================================= */

// Una sola lista de ubicaciones para portada, búsqueda, perfil y empresas.
function prepararUbicacionesDelPortal() {
  const ciudades = [...new Set([...CONFIG_PORTAL.ciudades,
    ...EMPRESAS.filter(e=>e.pais === CONFIG_PORTAL.pais).map(e=>e.ciudad),
    ...VACANTES.filter(v=>!v.pais || v.pais === CONFIG_PORTAL.pais).map(v=>ciudadDelPortal(v.ciudad))
  ])].filter(Boolean);
  ["campoCiudad","filtroCiudad","fUbicacion","fCiudad","fCiudadAlerta"].forEach(id=>{
    const select=document.getElementById(id); if(!select) return;
    const valor=ciudadDelPortal(select.value), vacia=[...select.options].find(o=>o.value === "");
    select.replaceChildren();
    if(vacia) select.add(new Option("Todo El Salvador",""));
    ciudades.forEach(ciudad=>select.add(new Option(ciudad,ciudad)));
    if(ciudades.includes(valor) || valor === "") select.value=valor;
  });
}

/* ---------------------------------------------------------------
   Avisos flotantes (equivalente liviano a los toasts)
   Se crea una sola vez y se reutiliza en todas las pantallas.
   --------------------------------------------------------------- */
const zonaAvisos = document.createElement("div");
zonaAvisos.className = "aviso-posicion";
zonaAvisos.setAttribute("role", "status");
zonaAvisos.setAttribute("aria-live", "polite");
document.body.appendChild(zonaAvisos);

/**
 * Muestra un mensaje breve en la esquina inferior.
 * @param {string} texto  mensaje para la persona usuaria
 * @param {string} tono   "exito" | "aviso" (por defecto aviso)
 */
function avisar(texto, tono = "aviso") {
  const aviso = document.createElement("div");
  aviso.className = `aviso ${tono === "exito" ? "exito" : ""}`;

  const punto = document.createElement("span");
  punto.className = `punto ${tono === "exito" ? "punto-verde" : "punto-bermellon"}`;
  punto.style.marginTop = "0.45rem";

  const mensaje = document.createElement("p");
  mensaje.textContent = texto;
  mensaje.style.margin = "0";
  mensaje.style.flex = "1";

  const cerrar = document.createElement("button");
  cerrar.className = "aviso-cerrar";
  cerrar.setAttribute("aria-label", "Cerrar aviso");
  cerrar.innerHTML = "&times;";
  cerrar.addEventListener("click", () => aviso.remove());

  aviso.append(punto, mensaje, cerrar);
  zonaAvisos.appendChild(aviso);

  /* Se retira solo a los 4.5 segundos */
  setTimeout(() => aviso.remove(), 4500);
}

/* ---------------------------------------------------------------
   Contadores animados
   Recorre los elementos con data-contador y cuenta desde cero
   hasta el valor indicado cuando entran en pantalla.
   --------------------------------------------------------------- */
function animarContadores() {
  const elementos = document.querySelectorAll("[data-contador]");
  if (!elementos.length) return;

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        const el = entrada.target;
        const destino = Number(el.dataset.contador);
        const sufijo = el.dataset.sufijo || "";
        const duracion = 1400;
        const inicio = performance.now();

        function paso(ahora) {
          const avance = Math.min((ahora - inicio) / duracion, 1);
          /* curva suave: la mayoría del avance ocurre al inicio */
          const suavizado = 1 - Math.pow(1 - avance, 3);
          el.textContent = Math.round(destino * suavizado).toLocaleString(CONFIG_PORTAL.locale) + sufijo;
          if (avance < 1) requestAnimationFrame(paso);
        }

        requestAnimationFrame(paso);
        observador.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  elementos.forEach((el) => observador.observe(el));
}

/* ---------------------------------------------------------------
   Anillos de métricas
   Dibuja el progreso del anillo circular según el porcentaje
   indicado en data-anillo (0 a 100).
   --------------------------------------------------------------- */
function pintarAnillos() {
  document.querySelectorAll("[data-anillo]").forEach((anillo) => {
    const circulo = anillo.querySelector(".progreso");
    if (!circulo) return;
    const radio = circulo.r.baseVal.value;
    const circunferencia = 2 * Math.PI * radio;
    const porcentaje = Number(anillo.dataset.anillo) / 100;

    circulo.style.strokeDasharray = `${circunferencia}`;
    circulo.style.strokeDashoffset = `${circunferencia}`;

    /* El anillo se dibuja al entrar en pantalla */
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          circulo.style.strokeDashoffset = `${circunferencia * (1 - porcentaje)}`;
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.5 }
    );
    observador.observe(anillo);
  });
}

/* ---------------------------------------------------------------
   Marcado de la sección activa del menú principal
   Compara el archivo actual con el enlace del menú y le aplica
   la clase .activo (subrayado + punto bermellón).
   Algunas pantallas son detalle de otra sección (una vacante se
   consulta desde los resultados de búsqueda), así que se puede
   indicar a qué sección pertenecen.
   --------------------------------------------------------------- */
const SECCION_POR_PAGINA = {
  "vacante.html": "busqueda.html",
};

function marcarSeccionActiva() {
  /* Se normalizan los caminos para que "./busqueda.html" y
     "busqueda.html" se consideren el mismo destino. */
  const limpiar = (ruta) => (ruta || "").split("/").pop().split("?")[0];
  const archivo = limpiar(location.pathname) || "index.html";
  const seccion = SECCION_POR_PAGINA[archivo] || archivo;

  document.querySelectorAll(".nav-principal .nav-link").forEach((enlace) => {
    if (limpiar(enlace.getAttribute("href")) === seccion) {
      enlace.classList.add("activo");
      enlace.setAttribute("aria-current", "page");
    }
  });
}

/* ---------------------------------------------------------------
   Altura real de la cabecera
   La cabecera es sticky y varios paneles laterales se desplazan
   por debajo usando la variable --cabecera-alto. En pantallas
   estrechas el formulario de acceso salta a una segunda fila y la
   cabecera crece; aquí se mide su altura real y se actualiza la
   variable para que ningún panel quede oculto detrás.
   --------------------------------------------------------------- */
function fijarAlturaCabecera() {
  const cabecera = document.querySelector(".cabecera");
  if (!cabecera) return;

  let pendiente = null;
  const medir = () => {
    if (pendiente) return;
    /* Se mide en el siguiente cuadro para no forzar reflujo
       dentro del propio evento de redimensionado */
    pendiente = requestAnimationFrame(() => {
      pendiente = null;
      document.documentElement.style.setProperty("--cabecera-alto", `${cabecera.offsetHeight}px`);
    });
  };

  medir();
  window.addEventListener("resize", medir);
  window.addEventListener("load", medir);
  /* Las tipografías locales cambian el tamaño del texto al cargarse,
     así que se vuelve a medir cuando ya están disponibles */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
}

/* ---------------------------------------------------------------
   Formulario de acceso de la cabecera
   Es una maqueta: no valida credenciales, solo demuestra el
   flujo de la interfaz.
   --------------------------------------------------------------- */
/* ---------------------------------------------------------------
   Botones genéricos con confirmación
   Cualquier botón con data-accion puede lanzar un aviso.
   Uso: <button data-accion="guardar" data-mensaje="...">`
   --------------------------------------------------------------- */
function prepararAccionesGenericas() {
  document.querySelectorAll("[data-accion]").forEach(elemento => {
    const formulario = elemento.tagName === "FORM";
    elemento.addEventListener(formulario ? "submit" : "click", evento => {
      evento.preventDefault();
      if (formulario && elemento.dataset.accion === "suscripcion") {
        const correo = elemento.querySelector('input[type="email"]');
        correo.required = true;
        if (!elemento.reportValidity()) return;
        avisar("La suscripción por correo estará disponible al conectar el servidor."); return;
      }
      if (elemento.dataset.accion === "editar") {
        document.querySelector('[data-pestana="perfil"]')?.click();
        document.getElementById("fNombres")?.focus(); return;
      }
      if (elemento.dataset.accion === "compartir") {
        avisar("Los perfiles públicos compartidos estarán disponibles al conectar el servidor."); return;
      }
      avisar(elemento.dataset.mensaje || "Acción de demostración.", elemento.dataset.tono || "aviso");
    });
  });
}

/* ---------------------------------------------------------------
   Arranque
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  prepararUbicacionesDelPortal();
  fijarAlturaCabecera();
  marcarSeccionActiva();
  animarContadores();
  pintarAnillos();
  prepararAccionesGenericas();

  /* Año del pie de página: se actualiza sin tocar el HTML */
  document.querySelectorAll("[data-anio]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});

window.addEventListener("pageshow", evento => { if (evento.persisted) window.location.reload(); });
window.addEventListener("storage", evento => {
  if (evento.key?.startsWith("pt_")) {
    // Preserve drafts: notify rather than silently discarding form input.
    setTimeout(()=>{
      if (!document.querySelector("[data-actualizar-sesion]")) avisar("Los datos cambiaron en otra pestaña. Recarga para ver la información actualizada.");
    },0);
  }
});

function abrirEdicionEmpresa(id, alGuardar) {
  const empresa = EMPRESAS.find(e => e.id === id), sesion = sesionDatos();
  if (!empresa || !(sesion?.rol === "administrador" || (sesion?.rol === "empresa" && sesion.empresaId === id))) {
    avisar("Solo puedes editar la ficha de tu empresa."); return;
  }
  const modal = document.createElement("div");
  modal.className = "modal fade"; modal.tabIndex = -1;
  modal.setAttribute("aria-labelledby", "tituloEditarEmpresa");
  const campos = [["nombre", "Nombre"], ["rubro", "Rubro"], ["ciudad", "Ciudad"], ["tamano", "Tamaño"], ["descripcion", "Descripción"]];
  modal.innerHTML = `<div class="modal-dialog"><form class="modal-content">
    <div class="modal-header"><h2 class="modal-title fs-5" id="tituloEditarEmpresa">Editar empresa</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
    <div class="modal-body">${campos.map(([clave, titulo]) => `<label class="form-label" for="empresa-${clave}">${titulo}</label><input id="empresa-${clave}" class="form-control mb-3" name="${clave}" value="${escaparHTML(empresa[clave])}" required maxlength="500">`).join("")}</div>
    <div class="modal-footer"><button type="submit" class="btn btn-bermellon">Guardar ficha</button></div></form></div>`;
  document.body.append(modal);
  const instancia = new bootstrap.Modal(modal);
  modal.addEventListener("hidden.bs.modal", () => { instancia.dispose(); modal.remove(); });
  modal.querySelector("form").addEventListener("submit", evento => {
    evento.preventDefault();
    const cambios = Object.fromEntries(campos.map(([clave]) => [clave, modal.querySelector(`[name="${clave}"]`).value.trim()]));
    if (Object.values(cambios).some(v => !v)) { avisar("Completa los campos de la empresa."); return; }
    const fichas = leerObjeto("pt_empresas_fichas"); fichas[id] = cambios;
    if (!escribirAlmacen("pt_empresas_fichas", fichas)) { avisar("No se pudo guardar la ficha."); return; }
    Object.assign(empresa, cambios); instancia.hide(); alGuardar(); avisar("Ficha de empresa actualizada.", "exito");
  });
  instancia.show();
}
