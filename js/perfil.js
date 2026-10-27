/* =============================================================
   PORTAL DE TRABAJO — pantalla de perfil de usuario
   -------------------------------------------------------------
   Comportamiento de la pestaña "Mi perfil":
   · Cambio de pestañas internas (perfil, currículum, alertas...).
   · Validación y guardado del formulario de datos personales.
   · Habilidades dinámicas (añadir y eliminar chips).
   · Carga simulada de currículum y eliminación de archivos.
   · Alertas de empleo con interruptores de activación.
   · Gráfico de visitas de los últimos 8 meses.
   · Publicación de valoraciones a empresas.
   Usa avisar() de js/main.js para los mensajes flotantes y
   datos.js para el directorio de empresas.
   ============================================================= */

/* ---------------------------------------------------------------
   1. Cambio de pestañas
   Cada botón lleva data-pestana con la clave de su panel; el
   panel se identifica como "pestana" + clave en mayúscula
   (ej. data-pestana="curriculum" -> id="pestanaCurriculum").
   --------------------------------------------------------------- */
function inicializarPestanas() {
  const botones = document.querySelectorAll(".pestanas-enlace");
  const paneles = document.querySelectorAll("[id^='pestana']");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const clave = boton.dataset.pestana;
      /* La clave "valoraciones" genera el id "pestanaValoraciones" */
      const idPanel = "pestana" + clave.charAt(0).toUpperCase() + clave.slice(1);

      /* Se marca solo el botón pulsado y se muestra su panel */
      botones.forEach((b) => {
        const activo = b === boton;
        b.classList.toggle("activo", activo);
        b.setAttribute("aria-selected", activo ? "true" : "false");
      });

      paneles.forEach((panel) => {
        panel.hidden = panel.id !== idPanel;
      });
    });
  });

  /* Las pestañas se inicializan en "Perfil": se oculta todo
     panel que no sea el primero por seguridad */
  paneles.forEach((panel) => {
    panel.hidden = panel.id !== "pestanaPerfil";
  });
}

/* ---------------------------------------------------------------
   2. Formulario de datos personales
   Validación propia (sin depender de la validación del
   navegador): comprueba los campos required y el formato del
   correo antes de simular el guardado.
   --------------------------------------------------------------- */
function inicializarFormularioPerfil() {
  const formulario = document.getElementById("formPerfil");
  if (!formulario) return;

  /* Expresión sencilla para verificar el correo */
  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    /* Se revisan todos los campos obligatorios */
    const requeridos = formulario.querySelectorAll("[required]");
    let camposInvalidos = 0;

    requeridos.forEach((campo) => {
      const vacio = !campo.value.trim();
      const correoMalFormado =
        campo.type === "email" && campo.value.trim() && !patronCorreo.test(campo.value.trim());

      if (vacio || correoMalFormado) {
        campo.classList.add("invalido");
        camposInvalidos += 1;
      } else {
        campo.classList.remove("invalido");
      }
    });

    if (camposInvalidos > 0) {
      avisar("Revisa los campos marcados antes de guardar.", "aviso");
      return;
    }

    avisar("Perfil actualizado correctamente.", "exito");
  });

  /* Al escribir en un campo marcado se limpia su error */
  formulario.addEventListener("input", (evento) => {
    if (evento.target.classList) evento.target.classList.remove("invalido");
  });
}

/* ---------------------------------------------------------------
   3. Habilidades dinámicas
   Se pueden añadir con el botón o con la tecla Enter; cada chip
   tiene su botón × para eliminarse. No se permiten duplicados
   (se comparan sin distinguir mayúsculas ni acentos).
   --------------------------------------------------------------- */
function inicializarHabilidades() {
  const lista = document.getElementById("listaHabilidades");
  const entrada = document.getElementById("fHabilidad");
  const boton = document.getElementById("btnHabilidad");
  if (!lista || !entrada || !boton) return;

  /* Normaliza el texto para comparar habilidades repetidas */
  const normalizar = (texto) =>
    texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /* Crea un chip con su botón de eliminar */
  function crearChip(texto) {
    const chip = document.createElement("span");
    chip.className = "etiqueta-chip";
    chip.dataset.valor = texto;
    chip.append(document.createTextNode(texto + " "));

    const quitar = document.createElement("button");
    quitar.className = "per-quitar";
    quitar.type = "button";
    quitar.innerHTML = "&times;";
    quitar.setAttribute("aria-label", `Quitar habilidad ${texto}`);
    chip.appendChild(quitar);
    return chip;
  }

  /* Añade la habilidad escrita en el campo */
  function agregarHabilidad() {
    const texto = entrada.value.trim();
    if (!texto) return;

    /* Se comprueba si ya existe algún chip con el mismo texto */
    const existe = [...lista.querySelectorAll(".etiqueta-chip")].some(
      (chip) => normalizar(chip.dataset.valor || "") === normalizar(texto)
    );

    if (existe) {
      avisar(`La habilidad «${texto}» ya está en tu perfil.`, "aviso");
      entrada.value = "";
      return;
    }

    lista.insertBefore(crearChip(texto), entrada);
    entrada.value = "";
    avisar(`Habilidad «${texto}» añadida.`, "exito");
  }

  boton.addEventListener("click", agregarHabilidad);
  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      agregarHabilidad();
    }
  });

  /* Eliminación delegada: un solo escucha para todos los chips */
  lista.addEventListener("click", (evento) => {
    const botonQuitar = evento.target.closest(".per-quitar");
    if (!botonQuitar) return;
    const chip = botonQuitar.closest(".etiqueta-chip");
    const texto = chip.dataset.valor || chip.textContent.trim();
    chip.remove();
    avisar(`Habilidad «${texto}» eliminada.`);
  });
}

/* ---------------------------------------------------------------
   4. Carga de currículum (simulada)
   El input file entrega el nombre y el peso del archivo elegido;
   en la demostración, si el navegador no entrega archivo se usa
   un nombre de ejemplo para poder mostrar el comportamiento.
   --------------------------------------------------------------- */
function inicializarCurriculum() {
  const input = document.getElementById("inputArchivo");
  const lista = document.getElementById("listaArchivos");
  if (!input || !lista) return;

  /* Convierte los bytes en texto legible (KB o MB) */
  function pesoLegible(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  /* Construye una fila .archivo-fila y la añade a la lista */
  function agregarFila(nombre, peso) {
    const fila = document.createElement("div");
    fila.className = "archivo-fila";

    const disco = document.createElement("span");
    disco.className = "disco";
    disco.setAttribute("aria-hidden", "true");
    disco.textContent = "PDF";

    const texto = document.createElement("div");
    texto.className = "flex-grow-1";
    const fuerte = document.createElement("strong");
    fuerte.textContent = nombre;
    const detalle = document.createElement("small");
    detalle.className = "datos texto-tenue";
    detalle.textContent = `Subido hoy · ${peso}`;
    texto.append(fuerte, document.createElement("br"), detalle);

    const quitar = document.createElement("button");
    quitar.className = "btn btn-fantasma btn-sm";
    quitar.type = "button";
    quitar.dataset.quitarArchivo = "";
    quitar.textContent = "Eliminar";

    fila.append(disco, texto, quitar);
    lista.prepend(fila);
  }

  input.addEventListener("change", () => {
    const archivo = input.files && input.files[0];

    /* Demostración: si no hay archivo elegido (por ejemplo al
       cancelar el diálogo), se simula con un nombre de ejemplo */
    const nombre = archivo ? archivo.name : "curriculum-ana-morales.pdf";
    const peso = archivo ? pesoLegible(archivo.size) : "240 KB";

    agregarFila(nombre, peso);
    avisar(`Currículum «${nombre}» cargado correctamente.`, "exito");
    input.value = ""; /* Se limpia para poder volver a elegir */
  });

  /* Eliminar archivos: se delega el evento en el contenedor */
  lista.addEventListener("click", (evento) => {
    if (!evento.target.closest("[data-quitar-archivo]")) return;
    const fila = evento.target.closest(".archivo-fila");
    const nombre = fila.querySelector("strong").textContent;
    fila.remove();
    avisar(`Archivo «${nombre}» eliminado.`);
  });
}

/* ---------------------------------------------------------------
   5. Alertas de empleo
   Se pintan tres alertas de ejemplo con su interruptor; al
   cambiar el interruptor se avisa del nuevo estado. El botón
   "Nueva alerta" muestra el formulario y "Crear alerta" añade
   una fila a la lista.
   --------------------------------------------------------------- */
function inicializarAlertas() {
  const lista = document.getElementById("listaAlertas");
  const botonNueva = document.getElementById("btnNuevaAlerta");
  const formulario = document.getElementById("formAlerta");
  const botonCrear = document.getElementById("btnCrearAlerta");
  if (!lista || !botonNueva || !formulario || !botonCrear) return;

  /* Crea una fila de alerta completa con interruptor */
  function crearFilaAlerta(titulo, detalle, activa) {
    const fila = document.createElement("div");
    fila.className = "alerta-fila";

    const texto = document.createElement("div");
    texto.className = "flex-grow-1";
    const fuerte = document.createElement("strong");
    fuerte.textContent = titulo;
    const pequeno = document.createElement("small");
    pequeno.textContent = detalle;
    texto.append(fuerte, pequeno);

    /* Interruptor: input oculto + pista visible (.interruptor) */
    const etiqueta = document.createElement("label");
    etiqueta.className = "interruptor";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = activa;
    check.setAttribute("aria-label", `Activar alerta ${titulo}`);

    const pista = document.createElement("span");
    pista.className = "pista-i";

    /* Aviso según el nuevo estado del interruptor */
    check.addEventListener("change", () => {
      avisar(
        check.checked ? "Alerta activada." : "Alerta desactivada.",
        check.checked ? "exito" : "aviso"
      );
    });

    etiqueta.append(check, pista);
    fila.append(texto, etiqueta);
    return fila;
  }

  /* Tres alertas de ejemplo iniciales */
  const alertasEjemplo = [
    { titulo: "Tecnología en Quito", detalle: "Salario desde $900 · diaria", activa: true },
    { titulo: "Diseño remoto", detalle: "Salario desde $600 · semanal", activa: true },
    { titulo: "Prácticas en Quito", detalle: "Salario desde $300 · inmediata", activa: false },
  ];

  alertasEjemplo.forEach((alerta) => {
    lista.appendChild(crearFilaAlerta(alerta.titulo, alerta.detalle, alerta.activa));
  });

  /* El botón "Nueva alerta" alterna la visibilidad del formulario */
  botonNueva.addEventListener("click", () => {
    formulario.hidden = !formulario.hidden;
  });

  /* "Crear alerta" lee los selects, añade la fila y oculta el form */
  botonCrear.addEventListener("click", () => {
    const sector = document.getElementById("fSectorAlerta").value;
    const ciudad = document.getElementById("fCiudadAlerta").value;
    const salario = document.getElementById("fSalarioAlerta").value;

    const titulo = `${sector} en ${ciudad}`;
    const detalle = `Salario desde $${Number(salario).toLocaleString("es-EC")} · diaria`;

    lista.appendChild(crearFilaAlerta(titulo, detalle, true));
    formulario.hidden = true;
    avisar(`Alerta «${titulo}» creada.`, "exito");
  });
}

/* ---------------------------------------------------------------
   6. Gráfico de visitas
   Ocho valores (marzo a octubre); cada barra se dibuja con una
   altura proporcional al máximo y la última se resalta en
   bermellón. El CSS se encarga de la animación de la transición.
   --------------------------------------------------------------- */
function inicializarGraficoVisitas() {
  const contenedor = document.getElementById("graficoVisitas");
  if (!contenedor) return;

  /* Visitas mensuales simuladas (marzo a octubre) */
  const valores = [64, 78, 71, 96, 88, 112, 105, 128];
  const maximo = Math.max(...valores);

  const barras = valores.map((valor, indice) => {
    const barra = document.createElement("div");
    barra.className = "barra" + (indice === valores.length - 1 ? " resalte" : "");
    /* Altura inicial en cero: la transición sube la barra */
    barra.style.height = "0%";
    barra.title = `${valor} visitas`;
    contenedor.appendChild(barra);
    return { barra, valor };
  });

  /* Se asigna la altura definitiva en el siguiente cuadro para
     que la transición del CSS se ejecute de cero */
  requestAnimationFrame(() => {
    barras.forEach(({ barra, valor }) => {
      barra.style.height = `${(valor / maximo) * 100}%`;
    });
  });
}

/* ---------------------------------------------------------------
   7. Valoraciones
   Los cinco .punto-valoracion eligen la nota; antes de publicar
   se comprueba que existan nota y texto. La nueva valoración se
   coloca al inicio de la lista con las iniciales "TÚ".
   --------------------------------------------------------------- */
function inicializarValoraciones() {
  const formulario = document.getElementById("formValorar");
  const puntos = document.querySelectorAll("#valoracionEstrellas .punto-valoracion");
  const notaElegida = document.getElementById("notaElegida");
  const lista = document.getElementById("listaMisValoraciones");
  if (!formulario || !puntos.length || !lista) return;

  let nota = 0; /* Nota seleccionada (0 = ninguna) */

  /* Marca como llenos los puntos hasta la nota elegida */
  function pintarNota(valor) {
    nota = valor;
    puntos.forEach((punto) => {
      punto.classList.toggle("lleno", Number(punto.dataset.nota) <= valor);
    });
    notaElegida.textContent = valor > 0 ? String(valor) : "—";
  }

  puntos.forEach((punto) => {
    punto.addEventListener("click", () => pintarNota(Number(punto.dataset.nota)));
  });

  /* Construye la tarjeta .resena de la valoración publicada */
  function crearResena(nombreEmpresa, valor, texto) {
    const resena = document.createElement("article");
    resena.className = "resena";

    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-sm";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "TÚ";

    const cuerpo = document.createElement("div");
    const cabecera = document.createElement("div");
    cabecera.className = "resena-cabecera";

    const fuerte = document.createElement("strong");
    fuerte.textContent = nombreEmpresa;

    /* Valoración con puntos llenos/vacíos y nota numérica */
    const valoracion = document.createElement("span");
    valoracion.className = "valoracion";
    for (let i = 1; i <= 5; i += 1) {
      const punto = document.createElement("span");
      punto.className = "punto-valoracion" + (i <= valor ? " lleno" : "");
      valoracion.appendChild(punto);
    }
    const notaTexto = document.createElement("span");
    notaTexto.className = "valoracion-nota";
    notaTexto.textContent = String(valor);
    valoracion.appendChild(notaTexto);

    cabecera.append(fuerte, valoracion);

    const parrafo = document.createElement("p");
    parrafo.textContent = texto;

    const fecha = document.createElement("small");
    fecha.className = "datos texto-tenue";
    fecha.textContent = "Publicada hoy";

    cuerpo.append(cabecera, parrafo, fecha);
    resena.append(avatar, cuerpo);
    return resena;
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const texto = document.getElementById("fTextoValorar").value.trim();
    const select = document.getElementById("fEmpresaValorar");

    /* Validación: se exige nota y comentario antes de publicar */
    if (!nota || !texto) {
      avisar("Selecciona una nota y escribe cómo fue tu experiencia.", "aviso");
      return;
    }

    /* La empresa elegida en el select se busca en el directorio */
    const empresa = EMPRESAS.find((e) => e.id === Number(select.value)) || EMPRESAS[0];

    lista.prepend(crearResena(empresa.nombre, nota, texto));
    formulario.reset();
    pintarNota(0);
    avisar("Valoración publicada correctamente.", "exito");
  });
}

/* ---------------------------------------------------------------
   Mis postulaciones
   Une cuatro postulaciones de ejemplo con las que se envían desde
   vacante.html (guardadas en localStorage por datos.js). Así el
   trabajo hecho en otra pantalla se ve aquí al cambiar de página.
   --------------------------------------------------------------- */
function inicializarPostulaciones() {
  const contenedor = document.getElementById("listaMisPostulaciones");
  if (!contenedor) return;

  /* Postulaciones de ejemplo del prototipo */
  const ejemplos = [
    { vacanteId: 101, estado: "En revisión", tono: "cielo" },
    { vacanteId: 102, estado: "Preseleccionada", tono: "verde" },
    { vacanteId: 103, estado: "Recibida", tono: "ambar" },
    { vacanteId: 107, estado: "Recibida", tono: "ambar" },
  ];

  /* Las enviadas desde el detalle de la vacante tienen prioridad */
  const enviadas = (typeof leerPostulaciones === "function" ? leerPostulaciones() : []).map(
    (registro) => ({
      vacanteId: registro.vacanteId,
      estado: registro.estado || "Enviada",
      tono: "ambar",
      fecha: registro.fecha,
    })
  );

  /* Se evita duplicar una vacante que ya está en los ejemplos y se
     descartan postulaciones cuya vacante ya no exista (por ejemplo,
     si se borraron los datos guardados del navegador). */
  const idsEjemplo = new Set(ejemplos.map((item) => item.vacanteId));
  const lista = [
    ...enviadas.filter(
      (item) => !idsEjemplo.has(item.vacanteId) && VACANTES.some((v) => v.id === item.vacanteId)
    ),
    ...ejemplos.filter((item) => VACANTES.some((v) => v.id === item.vacanteId)),
  ];

  contenedor.innerHTML = lista
    .map((item) => {
      const vacante = VACANTES.find((v) => v.id === item.vacanteId);
      if (!vacante) return "";
      const empresa = empresaPorId(vacante.empresaId);
      const fecha = item.fecha ? fechaCercana(item.fecha) : "hace unos días";

      return `
      <article class="resultado">
        <span class="marca-empresa" aria-hidden="true">${empresa.iniciales}</span>
        <div class="resultado-cuerpo">
          <h3><a href="./vacante.html?id=${vacante.id}">${vacante.titulo}</a></h3>
          <p class="resultado-empresa">${empresa.nombre} · ${empresa.rubro}</p>
          <div class="resultado-meta">
            <span><span class="punto" aria-hidden="true"></span>${vacante.ciudad}</span>
            <span><span class="punto" aria-hidden="true"></span>${vacante.modalidad}</span>
            <span><span class="punto" aria-hidden="true"></span>${vacante.contrato}</span>
            <span><span class="punto" aria-hidden="true"></span>${vacante.nivel}</span>
          </div>
        </div>
        <div class="resultado-lado">
          <span class="etiqueta-chip ${item.tono}">${item.estado}</span>
          <span class="resultado-salario">${salarioFormateado(vacante.salario)}</span>
          <span class="resultado-fecha">${fecha}</span>
        </div>
      </article>`;
    })
    .join("");

  /* Contadores de la pestaña y del panel */
  const total = lista.length;
  const contadorPestana = document.querySelector(
    '.pestanas-enlace[data-pestana="postulaciones"] .contador'
  );
  if (contadorPestana) contadorPestana.textContent = total;

  const contadorPanel = document.getElementById("contadorMisPostulaciones");
  if (contadorPanel) {
    contadorPanel.textContent =
      total === 1 ? "1 postulación registrada" : `${total} postulaciones registradas`;
  }
}

/* ---------------------------------------------------------------
   Arranque
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  inicializarPestanas();
  inicializarFormularioPerfil();
  inicializarHabilidades();
  inicializarCurriculum();
  inicializarAlertas();
  inicializarGraficoVisitas();
  inicializarValoraciones();
  inicializarPostulaciones();
});
