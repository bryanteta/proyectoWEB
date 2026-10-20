/* =============================================================
   PORTAL DE TRABAJO — lógica de la pantalla de foros
   -------------------------------------------------------------
   Gestiona el listado de temas del foro: pintado, filtrado por
   categoría y por texto, publicación de temas nuevos y avisos.
   Los datos llegan de TEMAS_FORO (js/datos.js); aquí se copian
   a una lista local para poder añadir temas sin tocar el archivo
   de datos original.
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------------------------------
     Estado local de la pantalla
     --------------------------------------------------------------- */

  /* Copia local de los temas: los nuevos se agregan aquí arriba sin
     modificar el TEMAS_FORO original de datos.js */
  const temas = TEMAS_FORO.map((tema) => ({ ...tema }));

  /* Categoría seleccionada en el panel izquierdo ("" = todas) */
  let categoriaActiva = "";

  /* Referencias a los elementos de la página */
  const listaTemas = document.getElementById("listaTemas");
  const contadorTemas = document.getElementById("contadorTemas");
  const buscarTema = document.getElementById("buscarTema");
  const listaCategorias = document.getElementById("listaCategorias");
  const btnNuevoTema = document.getElementById("btnNuevoTema");
  const panelNuevoTema = document.getElementById("panelNuevoTema");
  const btnCancelarTema = document.getElementById("btnCancelarTema");
  const formTema = document.getElementById("formTema");
  const fTitulo = document.getElementById("fTitulo");
  const fCategoria = document.getElementById("fCategoria");
  const fMensaje = document.getElementById("fMensaje");

  /* ---------------------------------------------------------------
     Utilidad: escapa texto antes de insertarlo con innerHTML
     Evita que un título con etiquetas HTML rompa la lista.
     --------------------------------------------------------------- */
  function escapar(texto) {
    const cajon = document.createElement("div");
    cajon.textContent = texto;
    return cajon.innerHTML;
  }

  /* ---------------------------------------------------------------
     Pintado de categorías
     Cuenta cuántos temas hay por categoría y escribe el número en
     el .contador de cada botón (incluido "Todos los temas").
     --------------------------------------------------------------- */
  function pintarCategorias() {
    /* Contador global: todos los temas de la lista */
    const conteoTodos = document.getElementById("conteoTodos");
    if (conteoTodos) conteoTodos.textContent = temas.length;

    /* Un contador por cada botón con data-cat */
    listaCategorias.querySelectorAll(".categoria-foro").forEach((boton) => {
      const categoria = boton.dataset.cat;
      const contador = boton.querySelector(".contador");
      if (!contador || categoria === "") return;

      /* Cuenta solo los temas de esa categoría */
      const total = temas.filter((tema) => tema.categoria === categoria).length;
      contador.textContent = total;
    });
  }

  /* ---------------------------------------------------------------
     Pintado de la lista de temas
     Aplica los dos filtros (categoría y texto del buscador), deja
     los fijados siempre arriba y repinta la lista completa.
     --------------------------------------------------------------- */
  function pintarTemas() {
    const texto = buscarTema.value.trim().toLowerCase();

    /* 1. Filtrado: por categoría y por texto en título o autor
          (sin distinguir mayúsculas ni minúsculas) */
    let visibles = temas.filter((tema) => {
      const coincideCategoria = categoriaActiva === "" || tema.categoria === categoriaActiva;
      const coincideTexto =
        texto === "" ||
        tema.titulo.toLowerCase().includes(texto) ||
        tema.autor.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });

    /* 2. Orden: los fijados van primero; el resto respeta el
          orden original de la lista (más recientes arriba) */
    visibles = visibles.sort((a, b) => Number(b.fijado) - Number(a.fijado));

    /* 3. Contador de la barra, con plural correcto */
    contadorTemas.textContent =
      visibles.length === 1 ? "1 tema" : `${visibles.length} temas`;

    /* 4. Estado vacío: si no hay coincidencias se muestra un aviso
          en lugar de una lista en blanco */
    if (!visibles.length) {
      listaTemas.innerHTML = `
        <div class="vacio">
          <span class="disco" aria-hidden="true">0</span>
          <h3>Sin coincidencias</h3>
          <p class="texto-suave mb-0">
            No encontramos temas con ese criterio. Prueba con otra palabra o
            cambia de categoría.
          </p>
        </div>`;
      return;
    }

    /* 5. Repintado de los temas como filas con avatar, título,
          metadatos y cifras de respuestas/vistas */
    listaTemas.innerHTML = visibles
      .map(
        (tema) => `
      <article class="tema">
        <span class="avatar" aria-hidden="true">${escapar(tema.iniciales)}</span>
        <div>
          <h3>
            <a href="#" data-titulo-tema>${escapar(tema.titulo)}</a>
            ${tema.fijado ? '<span class="etiqueta-chip acento">Fijado</span>' : ""}
          </h3>
          <p class="tema-meta mb-0">
            <span>${escapar(tema.autor)}</span>
            <span>${escapar(tema.categoria)}</span>
            <span>Última actividad: ${escapar(tema.ultimo)}</span>
          </p>
        </div>
        <div class="tema-cifras">
          <div><strong>${tema.respuestas}</strong><span>respuestas</span></div>
          <div><strong>${tema.vistas}</strong><span>vistas</span></div>
        </div>
      </article>`
      )
      .join("");
  }

  /* ---------------------------------------------------------------
     Selección de categoría
     Al pulsar una fila del panel izquierdo se marca como activa,
     se actualiza el listado y los contadores.
     --------------------------------------------------------------- */
  listaCategorias.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".categoria-foro");
    if (!boton) return;

    /* Cambia la clase .activo al botón pulsado */
    listaCategorias.querySelectorAll(".categoria-foro").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");

    categoriaActiva = boton.dataset.cat;
    pintarTemas();
  });

  /* ---------------------------------------------------------------
     Buscador en vivo
     Cada pulsación de tecla repinta la lista con el texto actual.
     --------------------------------------------------------------- */
  buscarTema.addEventListener("input", pintarTemas);

  /* ---------------------------------------------------------------
     Panel de nuevo tema
     El botón alterna la visibilidad del formulario; "Cancelar" lo
     cierra sin publicar nada.
     --------------------------------------------------------------- */
  btnNuevoTema.addEventListener("click", () => {
    panelNuevoTema.hidden = !panelNuevoTema.hidden;
  });

  btnCancelarTema.addEventListener("click", () => {
    panelNuevoTema.hidden = true;
    formTema.reset();
    /* Limpia también los avisos de campo inválido */
    fTitulo.classList.remove("invalido");
    fMensaje.classList.remove("invalido");
  });

  /* Al escribir en un campo inválido se quita el marca de error */
  [fTitulo, fMensaje].forEach((campo) => {
    campo.addEventListener("input", () => campo.classList.remove("invalido"));
  });

  /* ---------------------------------------------------------------
     Publicación de un tema nuevo
     Valida que título y mensaje tengan contenido; si todo está bien,
     agrega el tema arriba de la lista, repinta y cierra el panel.
     --------------------------------------------------------------- */
  formTema.addEventListener("submit", (evento) => {
    evento.preventDefault();

    /* Validación: ambos campos son obligatorios */
    const tituloValido = fTitulo.value.trim() !== "";
    const mensajeValido = fMensaje.value.trim() !== "";
    fTitulo.classList.toggle("invalido", !tituloValido);
    fMensaje.classList.toggle("invalido", !mensajeValido);

    if (!tituloValido || !mensajeValido) {
      avisar("Completa el título y el mensaje para publicar el tema.");
      return;
    }

    /* El mensaje no se almacena en la demo; el tema nace con cero
       respuestas, una vista y sin fijar */
    temas.unshift({
      id: Date.now(),
      titulo: fTitulo.value.trim(),
      categoria: fCategoria.value,
      autor: "Tú",
      iniciales: "TÚ",
      respuestas: 0,
      vistas: 1,
      ultimo: "hace un instante",
      fijado: false,
    });

    /* Se muestra el tema publicado: se limpia el buscador y se
       salta a la categoría elegida para que aparezca arriba */
    buscarTema.value = "";
    categoriaActiva = fCategoria.value;
    listaCategorias.querySelectorAll(".categoria-foro").forEach((b) => {
      b.classList.toggle("activo", b.dataset.cat === categoriaActiva);
    });

    pintarCategorias();
    pintarTemas();

    /* Cierra el formulario y lo deja limpio para otra publicación */
    panelNuevoTema.hidden = true;
    formTema.reset();
    avisar("Tema publicado correctamente.", "exito");
  });

  /* ---------------------------------------------------------------
     Apertura del hilo (alcance del prototipo)
     La pantalla de detalle del hilo queda fuera de este prototipo:
     al pulsar el título solo se avisa que se mostraría en una
     pantalla propia.
     --------------------------------------------------------------- */
  listaTemas.addEventListener("click", (evento) => {
    const enlace = evento.target.closest("[data-titulo-tema]");
    if (!enlace) return;
    evento.preventDefault();
    avisar("Esta es una demostración: el hilo completo se mostraría en una pantalla propia.");
  });

  /* ---------------------------------------------------------------
     Arranque: primer pintado de categorías y listado
     --------------------------------------------------------------- */
  pintarCategorias();
  pintarTemas();
});
