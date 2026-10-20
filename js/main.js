/* =============================================================
   PORTAL DE TRABAJO — comportamiento compartido
   -------------------------------------------------------------
   Funciones usadas por todas las pantallas: avisos flotantes,
   contadores animados, marcado de la sección activa y utilidades
   de formato. No depende de Bootstrap más allá de los menús.
   ============================================================= */

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
          el.textContent = Math.round(destino * suavizado).toLocaleString("es-EC") + sufijo;
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
function prepararAccesoCabecera() {
  const formulario = document.querySelector("[data-acceso]");
  if (!formulario) return;
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const correo = formulario.querySelector("input[type='email']");
    if (!correo.value.trim()) {
      correo.classList.add("invalido");
      avisar("Escribe tu correo para continuar.");
      return;
    }
    correo.classList.remove("invalido");
    avisar("Sesión iniciada (demostración). Bienvenido de vuelta.", "exito");
  });
}

/* ---------------------------------------------------------------
   Botones genéricos con confirmación
   Cualquier botón con data-accion puede lanzar un aviso.
   Uso: <button data-accion="guardar" data-mensaje="...">`
   --------------------------------------------------------------- */
function prepararAccionesGenericas() {
  document.querySelectorAll("[data-accion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const mensaje = boton.dataset.mensaje || "Acción registrada.";
      avisar(mensaje, boton.dataset.tono || "exito");
    });
  });
}

/* ---------------------------------------------------------------
   Arranque
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  fijarAlturaCabecera();
  marcarSeccionActiva();
  animarContadores();
  pintarAnillos();
  prepararAccesoCabecera();
  prepararAccionesGenericas();

  /* Año del pie de página: se actualiza sin tocar el HTML */
  document.querySelectorAll("[data-anio]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
