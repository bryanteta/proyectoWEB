/* =============================================================
   PORTAL DE TRABAJO — pantalla de resultados de búsqueda
   -------------------------------------------------------------
   Gestiona el filtrado, ordenamiento y visualización de vacantes
   a partir de los parámetros de URL y los controles del panel
   de filtros. Usa los mismos componentes visuales que inicio.js.
   ============================================================= */

/* ---------------------------------------------------------------
   Estado global de filtros
   --------------------------------------------------------------- */
const filtrosEstado = {
  empresaId: null,
  texto: "",
  ciudad: "",
  niveles: [],      // array de niveles seleccionados
  sectores: [],     // array de sectores seleccionados
  contratos: [],    // array de contratos seleccionados
  modalidades: [],  // array de modalidades seleccionadas
  salarioMin: 0,
  soloDestacadas: false
};

let paginaActual = 1;
let firmaFiltros = "";
const TAMANO_PAGINA = 6;
let ordenActual = "recientes"; // recientes | salario_alto | salario_bajo

/* ---------------------------------------------------------------
   Lee los parámetros de la URL que envía el buscador de index.html
   y precarga los controles correspondientes
   --------------------------------------------------------------- */
function leerParametrosURL() {
  const ciudades = document.getElementById("filtroCiudad");
  if (ciudades) [...new Set(VACANTES.map(v=>v.ciudad))].filter(Boolean).forEach(ciudad=>{
    if (![...ciudades.options].some(o=>o.value === ciudad)) ciudades.add(new Option(ciudad,ciudad));
  });
  const params = new URLSearchParams(window.location.search);
  
  filtrosEstado.empresaId = params.has("empresa") ? Number(params.get("empresa")) : null;
  // Parámetros del buscador principal
  if (params.get("q")) {
    filtrosEstado.texto = params.get("q");
    const inputTexto = document.getElementById("filtroTexto");
    if (inputTexto) inputTexto.value = filtrosEstado.texto;
  }
  
  if (params.get("ciudad")) {
    filtrosEstado.ciudad = params.get("ciudad");
    const selectCiudad = document.getElementById("filtroCiudad");
    if (selectCiudad) selectCiudad.value = filtrosEstado.ciudad;
  }
  
  if (params.get("contrato")) {
    const contrato = params.get("contrato");
    filtrosEstado.contratos = [contrato];
    const checkContratos = document.querySelectorAll('input[data-filtro="contrato"]');
    checkContratos.forEach(chk => {
      if (chk.value === contrato) chk.checked = true;
    });
  }
  
  if (params.get("nivel")) {
    const nivel = params.get("nivel");
    filtrosEstado.niveles = [nivel];
    const checkNiveles = document.querySelectorAll('input[data-filtro="nivel"]');
    checkNiveles.forEach(chk => {
      if (chk.value === nivel) chk.checked = true;
    });
  }
  
  if (params.get("sector")) {
    const sector = params.get("sector");
    filtrosEstado.sectores = [sector];
    const checkSectores = document.querySelectorAll('input[data-filtro="sector"]');
    checkSectores.forEach(chk => {
      if (chk.value === sector) chk.checked = true;
    });
  }
  
  ["nivel", "sector", "contrato", "modalidad"].forEach(tipo => {
    const valores = params.getAll(tipo);
    document.querySelectorAll(`input[data-filtro="${tipo}"]`).forEach(c => { c.checked = valores.includes(c.value); });
  });
  const destacada = document.getElementById("filtroDestacada");
  if (destacada) destacada.checked = params.get("destacada") === "1";
  const orden = document.getElementById("ordenarPor");
  if (orden) orden.value = ["recientes", "salario_alto", "salario_bajo"].includes(params.get("orden")) ? params.get("orden") : "recientes";
  // El name del salario en index.html es el valor mínimo en dólares
  if (params.get("salario")) {
    const salario = parseInt(params.get("salario"));
    if (!isNaN(salario)) {
      filtrosEstado.salarioMin = salario;
      const rangeSalario = document.getElementById("filtroSalario");
      const outputSalario = document.getElementById("salarioOutput");
      if (rangeSalario) {
        rangeSalario.value = salario;
        if (outputSalario) {
          outputSalario.textContent = `$${salario}`;
        }
      }
    }
  }
}

/* ---------------------------------------------------------------
   Sincroniza el estado de filtros con los controles del formulario
   --------------------------------------------------------------- */
function sincronizarEstadoConControles() {
  // Texto
  const inputTexto = document.getElementById("filtroTexto");
  if (inputTexto) filtrosEstado.texto = inputTexto.value.toLowerCase().trim();
  
  // Ciudad
  const selectCiudad = document.getElementById("filtroCiudad");
  if (selectCiudad) filtrosEstado.ciudad = selectCiudad.value;
  
  // Niveles
  filtrosEstado.niveles = [];
  document.querySelectorAll('input[data-filtro="nivel"]:checked').forEach(chk => {
    filtrosEstado.niveles.push(chk.value);
  });
  
  // Sectores
  filtrosEstado.sectores = [];
  document.querySelectorAll('input[data-filtro="sector"]:checked').forEach(chk => {
    filtrosEstado.sectores.push(chk.value);
  });
  
  // Contratos
  filtrosEstado.contratos = [];
  document.querySelectorAll('input[data-filtro="contrato"]:checked').forEach(chk => {
    filtrosEstado.contratos.push(chk.value);
  });
  
  // Modalidades
  filtrosEstado.modalidades = [];
  document.querySelectorAll('input[data-filtro="modalidad"]:checked').forEach(chk => {
    filtrosEstado.modalidades.push(chk.value);
  });
  
  // Salario
  const rangeSalario = document.getElementById("filtroSalario");
  if (rangeSalario) filtrosEstado.salarioMin = parseInt(rangeSalario.value);
  
  // Solo destacadas
  const chkDestacada = document.getElementById("filtroDestacada");
  if (chkDestacada) filtrosEstado.soloDestacadas = chkDestacada.checked;
  
  // Ordenamiento
  const selectOrden = document.getElementById("ordenarPor");
  if (selectOrden) ordenActual = selectOrden.value;
}

/* ---------------------------------------------------------------
   Aplica todos los filtros sobre el array VACANTES
   --------------------------------------------------------------- */
function aplicarFiltros() {
  let resultados = VACANTES.filter(vacanteDisponible);
  if (filtrosEstado.empresaId !== null) resultados = resultados.filter(v => v.empresaId === filtrosEstado.empresaId);
  
  // Filtro por texto: busca en título, resumen y nombre de empresa
  if (filtrosEstado.texto) {
    resultados = resultados.filter(vacante => {
      const empresa = empresaPorId(vacante.empresaId);
      const textoBuscado = filtrosEstado.texto;
      return (
        vacante.titulo.toLowerCase().includes(textoBuscado) ||
        vacante.resumen.toLowerCase().includes(textoBuscado) ||
        empresa.nombre.toLowerCase().includes(textoBuscado)
      );
    });
  }
  
  // Filtro por ciudad
  if (filtrosEstado.ciudad) {
    resultados = resultados.filter(vacante => vacante.ciudad === filtrosEstado.ciudad);
  }
  
  // Filtro por niveles (OR: si hay varios seleccionados)
  if (filtrosEstado.niveles.length > 0) {
    resultados = resultados.filter(vacante => filtrosEstado.niveles.includes(vacante.nivel));
  }
  
  // Filtro por sectores
  if (filtrosEstado.sectores.length > 0) {
    resultados = resultados.filter(vacante => filtrosEstado.sectores.includes(vacante.sector));
  }
  
  // Filtro por contratos
  if (filtrosEstado.contratos.length > 0) {
    resultados = resultados.filter(vacante => filtrosEstado.contratos.includes(vacante.contrato));
  }
  
  // Filtro por modalidades
  if (filtrosEstado.modalidades.length > 0) {
    resultados = resultados.filter(vacante => filtrosEstado.modalidades.includes(vacante.modalidad));
  }
  
  // Filtro por salario mínimo
  if (filtrosEstado.salarioMin > 0) {
    resultados = resultados.filter(vacante => vacante.salario >= filtrosEstado.salarioMin);
  }
  
  // Filtro por solo destacadas
  if (filtrosEstado.soloDestacadas) {
    resultados = resultados.filter(vacante => vacante.destacada === true);
  }
  
  // Ordenamiento
  if (ordenActual === "salario_alto") {
    resultados.sort((a, b) => b.salario - a.salario);
  } else if (ordenActual === "salario_bajo") {
    resultados.sort((a, b) => a.salario - b.salario);
  } else {
    // Por defecto: más recientes primero
    resultados.sort((a, b) => new Date(b.publicada) - new Date(a.publicada));
  }
  
  return resultados;
}

/* ---------------------------------------------------------------
   Pinta la lista de resultados usando el mismo marcado que inicio.js
   --------------------------------------------------------------- */
function pintarResultados() {
  sincronizarEstadoConControles();
  const query = new URLSearchParams();
  if (filtrosEstado.texto) query.set("q", filtrosEstado.texto);
  if (filtrosEstado.ciudad) query.set("ciudad", filtrosEstado.ciudad);
  if (filtrosEstado.empresaId !== null) query.set("empresa", filtrosEstado.empresaId);
  [["nivel", "niveles"], ["sector", "sectores"], ["contrato", "contratos"], ["modalidad", "modalidades"]].forEach(([param, campo]) => filtrosEstado[campo].forEach(v => query.append(param, v)));
  if (filtrosEstado.salarioMin) query.set("salario", filtrosEstado.salarioMin);
  if (filtrosEstado.soloDestacadas) query.set("destacada", "1");
  if (ordenActual !== "recientes") query.set("orden", ordenActual);
  history.replaceState(null, "", location.pathname + (query.size ? "?" + query : ""));
  const firma = JSON.stringify([filtrosEstado, ordenActual]);
  if (firma !== firmaFiltros) { paginaActual = 1; firmaFiltros = firma; }
  const resultados = aplicarFiltros();
  const paginas = Math.max(1, Math.ceil(resultados.length / TAMANO_PAGINA));
  paginaActual = Math.min(paginaActual, paginas);
  const nav = document.querySelector(".paginacion");
  if (nav) {
    nav.hidden = paginas <= 1;
    nav.innerHTML = Array.from({length: paginas}, (_, i) => `<li class="page-item ${paginaActual === i + 1 ? "activo" : ""}"><button class="page-link" type="button" data-pagina="${i + 1}" ${paginaActual === i + 1 ? 'aria-current="page"' : ""}>${i + 1}</button></li>`).join("");
  }
  
  const contenedor = document.getElementById("listaResultados");
  const contadorPrincipal = document.getElementById("contadorResultados");
  const contadorBarra = document.getElementById("contadorBarra");
  const estadoVacio = document.getElementById("estadoVacio");
  
  if (!contenedor) return;
  
  // Actualiza contadores con plural correcto
  const cantidad = resultados.length;
  const textoContador = cantidad === 1 ? "1 oferta encontrada" : `${cantidad} ofertas encontradas`;
  
  if (contadorPrincipal) contadorPrincipal.textContent = textoContador;
  if (contadorBarra) contadorBarra.textContent = textoContador;
  
  // Si no hay resultados, muestra estado vacío
  if (cantidad === 0) {
    contenedor.innerHTML = "";
    if (estadoVacio) estadoVacio.classList.remove("d-none");
    return;
  }
  
  // Oculta estado vacío si hay resultados
  if (estadoVacio) estadoVacio.classList.add("d-none");
  
  // Pinta resultados con el mismo marcado que js/inicio.js
  contenedor.innerHTML = resultados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA)
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
   Configura los event listeners para todos los controles
   --------------------------------------------------------------- */
function configurarEventos() {
  // Input de texto
  const inputTexto = document.getElementById("filtroTexto");
  if (inputTexto) {
    inputTexto.addEventListener("input", pintarResultados);
  }
  
  // Checkboxes de filtros
  document.querySelectorAll('input[data-filtro]').forEach(chk => {
    chk.addEventListener("change", pintarResultados);
  });
  
  // Checkbox de solo destacadas
  const chkDestacada = document.getElementById("filtroDestacada");
  if (chkDestacada) {
    chkDestacada.addEventListener("change", pintarResultados);
  }
  
  // Select de ciudad
  const selectCiudad = document.getElementById("filtroCiudad");
  if (selectCiudad) {
    selectCiudad.addEventListener("change", pintarResultados);
  }
  
  // Range de salario con actualización del output
  const rangeSalario = document.getElementById("filtroSalario");
  const outputSalario = document.getElementById("salarioOutput");
  if (rangeSalario) {
    rangeSalario.addEventListener("input", () => {
      if (outputSalario) {
        outputSalario.textContent = `$${rangeSalario.value}`;
      }
    });
    rangeSalario.addEventListener("change", pintarResultados);
  }
  
  // Select de ordenamiento
  const selectOrden = document.getElementById("ordenarPor");
  if (selectOrden) {
    selectOrden.addEventListener("change", pintarResultados);
  }
  
  // Botón limpiar filtros
  const btnLimpiar = document.getElementById("limpiarFiltros");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", limpiarFiltros);
  }
  
  // Botón limpiar filtros desde estado vacío
  const btnLimpiarVacio = document.getElementById("limpiarFiltrosVacio");
  if (btnLimpiarVacio) {
    btnLimpiarVacio.addEventListener("click", limpiarFiltros);
  }
  
  document.querySelector(".paginacion")?.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-pagina]"); if (!boton) return;
    paginaActual = Number(boton.dataset.pagina); pintarResultados();
    document.getElementById("listaResultados").scrollIntoView({block: "start"});
  });

}

/* ---------------------------------------------------------------
   Limpia todos los filtros, vacía los controles y repinta
   --------------------------------------------------------------- */
function limpiarFiltros() {
  // Resetear estado
  filtrosEstado.empresaId = null;
  filtrosEstado.texto = "";
  filtrosEstado.ciudad = "";
  filtrosEstado.niveles = [];
  filtrosEstado.sectores = [];
  filtrosEstado.contratos = [];
  filtrosEstado.modalidades = [];
  filtrosEstado.salarioMin = 0;
  filtrosEstado.soloDestacadas = false;
  ordenActual = "recientes";
  
  // Limpiar controles
  const inputTexto = document.getElementById("filtroTexto");
  if (inputTexto) inputTexto.value = "";
  
  const selectCiudad = document.getElementById("filtroCiudad");
  if (selectCiudad) selectCiudad.value = "";
  
  document.querySelectorAll('input[data-filtro]').forEach(chk => {
    chk.checked = false;
  });
  
  const chkDestacada = document.getElementById("filtroDestacada");
  if (chkDestacada) chkDestacada.checked = false;
  
  const rangeSalario = document.getElementById("filtroSalario");
  const outputSalario = document.getElementById("salarioOutput");
  if (rangeSalario) {
    rangeSalario.value = 0;
    if (outputSalario) outputSalario.textContent = "$0";
  }
  
  const selectOrden = document.getElementById("ordenarPor");
  if (selectOrden) selectOrden.value = "recientes";
  
  // Repintar y mostrar aviso
  pintarResultados();
  avisar("Filtros restablecidos");
}

/* ---------------------------------------------------------------
   Inicialización de la página
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Leer parámetros de URL del buscador principal
  leerParametrosURL();
  
  // Configurar eventos de los controles
  configurarEventos();
  
  // Pintar resultados iniciales
  pintarResultados();
});
