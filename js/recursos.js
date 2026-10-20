/* =============================================================
   PORTAL DE TRABAJO — pantalla de Recursos
   -------------------------------------------------------------
   Gestiona la biblioteca de consejos de carrera:
     · Pinta el recurso destacado (el primero de RECURSOS).
     · Filtra la rejilla por tipo y por categoría con chips.
     · Abre el modal de lectura con contenido de demostración.
   Los datos provienen de RECURSOS (js/datos.js).
   ============================================================= */

/* ---------------------------------------------------------------
   Estado de los filtros
   Guarda el tipo y la categoría seleccionados. Una cadena vacía
   significa "sin filtrar" (chip "Todos" / "Todas").
   --------------------------------------------------------------- */
const estadoFiltros = { tipo: "", categoria: "" };

/* Recurso destacado: el primer elemento de la lista de datos */
const recursoDestacado = RECURSOS[0];

/* Instancia del modal de Bootstrap reutilizada en toda la pantalla */
let modalRecurso = null;

/* ---------------------------------------------------------------
   Textos de demostración por categoría
   Mapa con dos párrafos por categoría. En un sistema real el
   contenido completo vendría de una base de datos; aquí es
   material de muestra para completar el texto del modal a partir
   del resumen que ya existe en los datos.
   --------------------------------------------------------------- */
const TEXTOS_POR_CATEGORIA = {
  Currículum: [
    "Antes de enviar tu documento, revisa que los encabezados sean estándar («Experiencia», «Formación», «Habilidades») y que no haya tablas, columnas ni imágenes, porque los rastreadores de selección no saben leerlas. Usa también los sinónimos exactos que aparecen en la oferta: si la vacante pide «atención al cliente», esa frase debe estar en tu currículum.",
    "Aplica el mismo criterio con el resto del expediente: una carta de presentación de cuatro párrafos basta, y el archivo debe llamarse de forma clara, por ejemplo «Currículum_Analista_Datos.pdf». Un documento limpio y bien etiquetado transmite orden incluso antes de que alguien lo abra.",
  ],
  Entrevistas: [
    "Prepara respuestas con el método STAR (Situación, Tarea, Acción, Resultado): dos o tres ejemplos concretos de tu experiencia sirven para la mayoría de las preguntas conductuales. Practícalas en voz alta y cronometra cada respuesta; entre tres y cuatro minutos es el rango cómodo para el entrevistador.",
    "Ten también preguntas propias preparadas: sobre el equipo, los objetivos del primer trimestre o la forma de medir el desempeño. Preguntar demuestra interés genuino y te da información para decidir si el puesto realmente te conviene.",
  ],
  Carrera: [
    "Negociar no es exigir: investiga el rango salarial del puesto en tu ciudad, menciona tus logros con cifras concretas y deja claro que tu decisión considera el paquete completo (flexibilidad, capacitación, seguro). Si te ofrecen por debajo de tu rango, puedes pedir una revisión a los seis meses en lugar de rechazar la oferta.",
    "Planifica tu crecimiento en ciclos semestrales: define una habilidad que quieres dominar, busca el recurso o curso que te lleve hasta ahí y respáldala con un proyecto real. Los avances pequeños y constantes pesan más en una entrevista que una certificación aislada.",
  ],
  "Marca personal": [
    "En redes profesionales el titular es lo primero que ve un reclutador: combina el puesto que buscas con tu valor principal («Analista de datos | Tableros de seguimiento en Power BI»). Después describe logros con porcentajes o cifras en lugar de adjetivos, y actualiza el perfil con las palabras clave de las ofertas a las que postulas.",
    "Mantén la coherencia entre el titular, el resumen y la experiencia: el reclutador revisa las tres secciones en menos de un minuto. Publica o comenta contenido de tu sector con moderación; la constancia puntual convierte un perfil estático en una vitrina viva de lo que sabes hacer.",
  ],
};

/* ---------------------------------------------------------------
   Pintado del recurso destacado
   Rellena título, resumen y ficha del recurso destacado usando los
   mismos datos que alimentarán el modal de lectura.
   --------------------------------------------------------------- */
function pintarDestacado() {
  const titulo = document.getElementById("destacadoTitulo");
  if (!titulo) return;

  document.getElementById("destacadoTitulo").textContent = recursoDestacado.titulo;
  document.getElementById("destacadoResumen").textContent = recursoDestacado.resumen;
  document.getElementById("destacadoTipo").textContent = recursoDestacado.tipo;
  document.getElementById("destacadoDuracion").textContent = recursoDestacado.duracion;
}

/* ---------------------------------------------------------------
   Pintado de la rejilla de recursos
   Filtra RECURSOS según el estado de los chips, actualiza el
   contador y vuelve a dibujar las tarjetas. Si la combinación no
   devuelve nada, muestra el estado vacío con opción de limpiar.
   --------------------------------------------------------------- */
function pintarRejilla() {
  const rejilla = document.getElementById("rejillaRecursos");
  const contador = document.getElementById("contadorRecursos");
  if (!rejilla) return;

  /* Aplica los dos filtros por separado (vacío = sin filtrar) */
  const lista = RECURSOS.filter(
    (recurso) =>
      (!estadoFiltros.tipo || recurso.tipo === estadoFiltros.tipo) &&
      (!estadoFiltros.categoria || recurso.categoria === estadoFiltros.categoria)
  );

  /* Contador con plural correcto */
  contador.textContent = `${lista.length} ${
    lista.length === 1 ? "recurso disponible" : "recursos disponibles"
  }`;

  /* Sin coincidencias: estado vacío con botón para limpiar filtros */
  if (!lista.length) {
    rejilla.innerHTML = `
      <div class="col-12">
        <div class="vacio">
          <span class="disco disco-linea" aria-hidden="true">0</span>
          <h3>Sin resultados</h3>
          <p class="texto-suave mb-4">
            No hay recursos que coincidan con la combinación de filtros seleccionada.
          </p>
          <button class="btn btn-linea" type="button" id="btnLimpiarFiltros">Limpiar filtros</button>
        </div>
      </div>`;
    document.getElementById("btnLimpiarFiltros").addEventListener("click", limpiarFiltros);
    return;
  }

  /* Rejilla de tarjetas: mismo marcado que el avance del inicio */
  rejilla.innerHTML = lista
    .map((recurso) => {
      /* Color del disco según el tipo de recurso */
      const clase = recurso.tipo === "Video" ? "disco-tinta" : "";
      return `
      <div class="col-md-4">
        <article class="tarjeta recurso-tarjeta h-100">
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
              <button class="res-leer datos texto-acento" type="button" data-id="${recurso.id}">Leer &rarr;</button>
            </div>
          </div>
        </article>
      </div>`;
    })
    .join("");
}

/* ---------------------------------------------------------------
   Manejo de los chips de filtro
   El clic delegado detecta el botón pulsado dentro de cada grupo,
   marca su chip como activo (.rellena) y repinta la rejilla.
   --------------------------------------------------------------- */
function prepararFiltros() {
  /* Filtro por tipo */
  document.getElementById("filtroTipos").addEventListener("click", (evento) => {
    const chip = evento.target.closest("[data-tipo]");
    if (!chip) return;
    estadoFiltros.tipo = chip.dataset.tipo;
    marcarChipActivo("filtroTipos", chip);
    pintarRejilla();
  });

  /* Filtro por categoría */
  document.getElementById("filtroCategorias").addEventListener("click", (evento) => {
    const chip = evento.target.closest("[data-cat]");
    if (!chip) return;
    estadoFiltros.categoria = chip.dataset.cat;
    marcarChipActivo("filtroCategorias", chip);
    pintarRejilla();
  });
}

/* Quita .rellena de todo el grupo y la pone solo en el chip activo */
function marcarChipActivo(idGrupo, chipActivo) {
  document
    .querySelectorAll(`#${idGrupo} .etiqueta-chip`)
    .forEach((chip) => chip.classList.toggle("rellena", chip === chipActivo));
}

/* Restaura los filtros a "Todos / Todas" y repinta */
function limpiarFiltros() {
  estadoFiltros.tipo = "";
  estadoFiltros.categoria = "";
  marcarChipActivo("filtroTipos", document.querySelector('#filtroTipos [data-tipo=""]'));
  marcarChipActivo("filtroCategorias", document.querySelector('#filtroCategorias [data-cat=""]'));
  pintarRejilla();
}

/* ---------------------------------------------------------------
   Modal de lectura
   Genera el cuerpo del modal a partir del recurso recibido:
     · Párrafo de introducción con el resumen del dato.
     · Dos párrafos coherentes según la categoría (contenido de
       demostración del mapa TEXTOS_POR_CATEGORIA).
     · Ficha final: autor, tipo y duración.
   --------------------------------------------------------------- */
function abrirRecurso(id) {
  const recurso = RECURSOS.find((item) => item.id === id);
  if (!recurso) return;

  /* Cabecera del modal: tipo y título */
  document.getElementById("modalRecursoTipo").textContent = recurso.tipo;
  document.getElementById("modalRecursoTitulo").textContent = recurso.titulo;

  /* Texto de demostración de la categoría (con respaldo genérico) */
  const parrafos = TEXTOS_POR_CATEGORIA[recurso.categoria] || [
    "Este recurso forma parte de la biblioteca del portal. Su objetivo es acompañarte en el proceso de búsqueda de empleo con consejos prácticos y aplicables desde hoy.",
    "Aplica estas recomendaciones en tu próxima postulación y vuelve a la biblioteca para explorar más contenidos sobre tu área de interés.",
  ];

  document.getElementById("modalRecursoCuerpo").innerHTML = `
    <p class="lead">${recurso.resumen}</p>
    <p>${parrafos[0]}</p>
    <p>${parrafos[1]}</p>
    <div class="res-ficha">
      <div><span>Autor</span><strong>${recurso.autor}</strong></div>
      <div><span>Tipo</span><strong>${recurso.tipo}</strong></div>
      <div><span>Duración</span><strong>${recurso.duracion}</strong></div>
    </div>`;

  modalRecurso.show();
}

/* ---------------------------------------------------------------
   Arranque de la pantalla
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* El modal se crea una sola vez y se reutiliza */
  modalRecurso = new bootstrap.Modal(document.getElementById("modalRecurso"));

  pintarDestacado();
  pintarRejilla();
  prepararFiltros();

  /* Clic en "Leer" de cualquier tarjeta (evento delegado) */
  document.getElementById("rejillaRecursos").addEventListener("click", (evento) => {
    const boton = evento.target.closest(".res-leer");
    if (boton) abrirRecurso(Number(boton.dataset.id));
  });

  /* "Leer el artículo" del recurso destacado */
  document.getElementById("btnAbrirDestacado").addEventListener("click", () => {
    abrirRecurso(recursoDestacado.id);
  });

  /* "Guardar en mi lista" dentro del modal */
  document.getElementById("btnGuardarModal").addEventListener("click", () => {
    avisar("Recurso guardado en tu lista.", "exito");
  });
});
