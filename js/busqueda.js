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
function normalizarBusqueda(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
const indiceBusqueda = new Map(VACANTES.map(v=>{
  const detalle = DETALLES_VACANTE[v.id];
  return [v.id, normalizarBusqueda([v.titulo,v.resumen,empresaPorId(v.empresaId).nombre,detalle?.descripcion,...(Array.isArray(detalle?.habilidades) ? detalle.habilidades : [])].join(" "))];
}));
function leerParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  const ciudades = document.getElementById("filtroCiudad");
  if (ciudades) [...new Set(VACANTES.map(v=>v.ciudad))].filter(Boolean).forEach(ciudad=>{
    if (![...ciudades.options].some(o=>o.value === ciudad)) ciudades.add(new Option(ciudad,ciudad));
  });
  const empresa = Number(params.get("empresa"));
  filtrosEstado.empresaId = params.has("empresa") && Number.isSafeInteger(empresa) && empresa > 0 ? empresa : null;
  const texto = document.getElementById("filtroTexto"); if (texto) texto.value = params.get("q") || "";
  if (ciudades) ciudades.value = params.get("ciudad") || "";
  ["nivel","sector","contrato","modalidad"].forEach(tipo=>{
    const valores = params.getAll(tipo);
    document.querySelectorAll(`input[data-filtro="${tipo}"]`).forEach(c=>{c.checked=valores.includes(c.value);});
  });
  const destacada = document.getElementById("filtroDestacada"); if (destacada) destacada.checked = params.get("destacada") === "1";
  const orden = document.getElementById("ordenarPor"); if (orden) orden.value = ["recientes","salario_alto","salario_bajo"].includes(params.get("orden")) ? params.get("orden") : "recientes";
  const valor = Number(params.get("salario"));
  const salario = Number.isFinite(valor) && valor >= 0 && valor <= 1000000 ? Math.floor(valor) : 0;
  const rango = document.getElementById("filtroSalario");
  if (rango) { rango.step="1"; rango.max=Math.max(5000,salario,...VACANTES.map(v=>Number(v.salario)||0)); rango.value=salario; }
  const salida = document.getElementById("salarioOutput"); if (salida) salida.textContent=`$${salario}`;
  sincronizarEstadoConControles();
  firmaFiltros = JSON.stringify([filtrosEstado,ordenActual]);
  const pagina = Number(params.get("pagina")); paginaActual = Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1;
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
      return (indiceBusqueda.get(vacante.id) || normalizarBusqueda(vacante.titulo)).includes(normalizarBusqueda(textoBuscado));
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
    resultados.sort((a,b)=>a.salario == null ? (b.salario == null ? 0 : 1) : b.salario == null ? -1 : b.salario-a.salario);
  } else if (ordenActual === "salario_bajo") {
    resultados.sort((a,b)=>a.salario == null ? (b.salario == null ? 0 : 1) : b.salario == null ? -1 : a.salario-b.salario);
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
  const firma = JSON.stringify([filtrosEstado, ordenActual]);
  if (firma !== firmaFiltros) { paginaActual = 1; firmaFiltros = firma; }
  const resultados = aplicarFiltros();
  const paginas = Math.max(1, Math.ceil(resultados.length / TAMANO_PAGINA));
  paginaActual = Math.min(paginaActual, paginas);
  if (paginaActual > 1) query.set("pagina",paginaActual);
  history.replaceState(null,"",location.pathname + (query.size ? "?"+query : "") + location.hash);
  let contextoEmpresa = document.getElementById("filtroEmpresaActivo");
  if (!contextoEmpresa) {
    contextoEmpresa = document.createElement("div"); contextoEmpresa.id="filtroEmpresaActivo"; contextoEmpresa.className="datos mb-3";
    document.getElementById("listaResultados")?.before(contextoEmpresa);
  }
  contextoEmpresa.hidden = filtrosEstado.empresaId === null;
  contextoEmpresa.textContent = "";
  if (!contextoEmpresa.hidden) {
    contextoEmpresa.append(document.createTextNode("Empresa: "+(EMPRESAS.find(e=>e.id === filtrosEstado.empresaId)?.nombre || "No encontrada")+" "));
    const quitar = document.createElement("button"); quitar.type="button"; quitar.className="btn btn-linea btn-sm"; quitar.textContent="Quitar filtro de empresa";
    quitar.addEventListener("click",()=>{filtrosEstado.empresaId=null;pintarResultados();}); contextoEmpresa.append(quitar);
  }
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
  paginaActual = 1;
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

window.addEventListener("popstate",()=>{leerParametrosURL();pintarResultados();});
