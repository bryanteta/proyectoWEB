/* =============================================================
   PORTAL DE TRABAJO — página de inicio
   -------------------------------------------------------------
   Genera tres bloques a partir de los datos de prueba:
     · Categorías con el recuento de ofertas por sector.
     · Ofertas recientes ordenadas por fecha de publicación.
     · Avance de la sección de recursos.
   ============================================================= */

/* ---------------------------------------------------------------
   Categorías
   Se calcula cuántas vacantes hay por sector y se pinta una
   tarjeta cuadrada por cada uno, con enlace a los resultados
   ya filtrados.
   --------------------------------------------------------------- */
function pintarCategorias() {
  const contenedor = document.getElementById("rejillaCategorias");
  if (!contenedor) return;

  /* Cuenta las vacantes de cada sector */
  const sectores = {};
  VACANTES.filter(vacanteDisponible).forEach((vacante) => {
    sectores[vacante.sector] = (sectores[vacante.sector] || 0) + 1;
  });

  /* Iniciales cortas para el disco de cada categoría */
  const simbolos = {
    Tecnología: "Tc",
    Finanzas: "Fi",
    Diseño: "Ds",
    Agroindustria: "Ag",
    Salud: "Sa",
    Logística: "Lo",
  };

  contenedor.innerHTML = Object.entries(sectores)
    .map(
      ([sector, cantidad]) => `
      <a class="categoria" href="./busqueda.html?sector=${encodeURIComponent(sector)}">
        <span class="disco" aria-hidden="true">${simbolos[sector] || sector.slice(0, 2)}</span>
        <span>
          <strong>${sector}</strong>
          <small>${cantidad} ${cantidad === 1 ? "oferta" : "ofertas"}</small>
        </span>
      </a>`
    )
    .join("");
}

/* ---------------------------------------------------------------
   Ofertas recientes
   Se muestran las cinco vacantes más nuevas. Cada fila usa la
   misma estructura que la pantalla de resultados para que la
   persona usuaria reconozca el componente.
   --------------------------------------------------------------- */
function pintarRecientes() {
  const contenedor = document.getElementById("listaRecientes");
  if (!contenedor) return;

  const recientes = VACANTES.filter(vacanteDisponible)
    .sort((a, b) => new Date(b.publicada) - new Date(a.publicada))
    .slice(0, 5);

  contenedor.innerHTML = recientes
    .map((vacante) => {
      const empresa = empresaPorId(vacante.empresaId);
      return `
      <article class="resultado ${vacante.destacada ? "resultado-destacado" : ""}">
        <span class="marca-empresa ${vacante.destacada ? "acento" : ""}" aria-hidden="true">${escaparHTML(empresa.iniciales)}</span>
        <div class="resultado-cuerpo">
          <h3><a href="./vacante.html?id=${vacante.id}">${escaparHTML(vacante.titulo)}</a></h3>
          <p class="resultado-empresa">${escaparHTML(empresa.nombre)} · ${escaparHTML(empresa.rubro)}</p>
          <div class="resultado-meta">
            <span><span class="punto" aria-hidden="true"></span>${escaparHTML(vacante.ciudad)}</span>
            <span><span class="punto" aria-hidden="true"></span>${escaparHTML(vacante.modalidad)}</span>
            <span><span class="punto" aria-hidden="true"></span>${escaparHTML(vacante.contrato)}</span>
            <span><span class="punto" aria-hidden="true"></span>${escaparHTML(vacante.nivel)}</span>
          </div>
        </div>
        <div class="resultado-lado">
          <span class="resultado-salario">${salarioFormateado(vacante.salario)}</span>
          <span class="resultado-fecha">${fechaCercana(vacante.publicada)}</span>
          <a class="btn btn-linea btn-sm" href="./vacante.html?id=${vacante.id}">Ver oferta</a>
        </div>
      </article>`;
    })
    .join("");
}

/* ---------------------------------------------------------------
   Recursos destacados (avance)
   Se toman los tres primeros recursos del conjunto de datos.
   --------------------------------------------------------------- */
function pintarRecursosInicio() {
  const contenedor = document.getElementById("listaRecursosInicio");
  if (!contenedor) return;

  contenedor.innerHTML = RECURSOS.slice(0, 3)
    .map((recurso) => {
      /* Color del disco según el tipo de recurso */
      const clase = recurso.tipo === "Video" ? "disco-tinta" : "";
      return `
      <div class="col-md-4">
        <a class="tarjeta recurso-tarjeta h-100 text-decoration-none" href="./recursos.html?id=${recurso.id}">
          <div class="recurso-miniatura">
            <span class="disco ${clase}" aria-hidden="true">${recurso.tipo.slice(0, 2).toUpperCase()}</span>
            <span class="duracion">${recurso.duracion}</span>
          </div>
          <div class="tarjeta-cuerpo">
            <span class="etiqueta-chip acento mb-2" style="align-self: flex-start">${recurso.tipo}</span>
            <h3>${recurso.titulo}</h3>
            <p>${recurso.resumen}</p>
            <div class="recurso-pie">
              <span class="datos texto-tenue">${recurso.autor}</span>
              <span class="datos texto-acento">Leer →</span>
            </div>
          </div>
        </a>
      </div>`;
    })
    .join("");
}

/* Pinta los tres bloques al cargar la página */
document.addEventListener("DOMContentLoaded", () => {
  pintarCategorias();
  pintarRecientes();
  pintarRecursosInicio();
});
