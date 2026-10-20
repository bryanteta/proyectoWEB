/* =============================================================
   PORTAL DE TRABAJO — detalle de vacante
   -------------------------------------------------------------
   Lógica de la pantalla vacante.html (trabajo académico).
   Se lee el parámetro ?id=, se carga la vacante, la empresa,
   el detalle (con respaldo si no existe) y se gestionan:
   - Postulación (botones principal y lateral, sincronizados)
   - Guardado de oferta (alternado)
   - Reseñas (pintado, cálculo de media, publicación)
   - Otras ofertas de la misma empresa
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------------------
     1. Obtener ID de la URL y seleccionar vacante
     ------------------------------------------------------------ */
  // Funcionalidad: leer parámetro id para mostrar la oferta correcta
  // Lógica: si no existe o no coincide con ninguna vacante, usar 101 por defecto (respaldo del prototipo)
  const params = new URLSearchParams(location.search);
  let vacanteId = parseInt(params.get("id"), 10);
  let vacante = VACANTES.find((v) => v.id === vacanteId);

  if (!vacante) {
    // Respaldo del prototipo: cargar vacante 101 por defecto cuando el id es inválido o falta
    vacanteId = 101;
    vacante = VACANTES.find((v) => v.id === 101);
  }

  // Obtener empresa asociada
  const empresa = empresaPorId(vacante.empresaId);

  /* ------------------------------------------------------------
     2. Rellenar cabecera, ficha y lateral
     ------------------------------------------------------------ */
  // Cabecera
  const empresaMarca = document.getElementById("empresaMarca");
  if (empresaMarca) {
    empresaMarca.textContent = empresa.iniciales || "";
  }
  const vacanteTitulo = document.getElementById("vacanteTitulo");
  if (vacanteTitulo) vacanteTitulo.textContent = vacante.titulo;

  const vacanteEmpresa = document.getElementById("vacanteEmpresa");
  if (vacanteEmpresa) vacanteEmpresa.textContent = empresa.nombre;

  // Chips
  const chipUbicacion = document.getElementById("chipUbicacion");
  if (chipUbicacion) chipUbicacion.textContent = vacante.ciudad;
  const chipModalidad = document.getElementById("chipModalidad");
  if (chipModalidad) chipModalidad.textContent = vacante.modalidad;
  const chipContrato = document.getElementById("chipContrato");
  if (chipContrato) chipContrato.textContent = vacante.contrato;
  const chipNivel = document.getElementById("chipNivel");
  if (chipNivel) chipNivel.textContent = vacante.nivel;

  // Ficha de datos
  const datoUbicacion = document.getElementById("datoUbicacion");
  if (datoUbicacion) datoUbicacion.textContent = vacante.ciudad;
  const datoSalario = document.getElementById("datoSalario");
  if (datoSalario) datoSalario.textContent = salarioFormateado(vacante.salario);
  const datoContrato = document.getElementById("datoContrato");
  if (datoContrato) datoContrato.textContent = vacante.contrato;
  const datoModalidad = document.getElementById("datoModalidad");
  if (datoModalidad) datoModalidad.textContent = vacante.modalidad;
  const datoNivel = document.getElementById("datoNivel");
  if (datoNivel) datoNivel.textContent = vacante.nivel;
  const datoPublicada = document.getElementById("datoPublicada");
  if (datoPublicada) datoPublicada.textContent = fechaCercana(vacante.publicada);

  // Descripción
  const descResumen = document.getElementById("descResumen");
  if (descResumen) descResumen.textContent = vacante.resumen || "";
  const descContexto = document.getElementById("descContexto");
  if (descContexto) {
    // Contexto genérico coherente con la oferta (para mantener uniformidad visual)
    descContexto.textContent =
      "Esta vacante forma parte del proceso de selección del portal. El equipo de talento humano revisará tu perfil y te contactará si cumples con los requisitos.";
  }

  // Lateral
  const salarioLateral = document.getElementById("salarioLateral");
  if (salarioLateral) salarioLateral.textContent = salarioFormateado(vacante.salario);
  const empresaNombre = document.getElementById("empresaNombre");
  if (empresaNombre) empresaNombre.textContent = empresa.nombre;
  const empresaRubro = document.getElementById("empresaRubro");
  if (empresaRubro) empresaRubro.textContent = empresa.rubro;
  const empresaTamano = document.getElementById("empresaTamano");
  if (empresaTamano) empresaTamano.textContent = empresa.tamano;
  const empresaCiudad = document.getElementById("empresaCiudad");
  if (empresaCiudad) empresaCiudad.textContent = empresa.ciudad;
  const empresaResenas = document.getElementById("empresaResenas");
  if (empresaResenas) {
    empresaResenas.textContent = `${empresa.resenas} reseñas`;
  }
  const linkOfertasEmpresa = document.getElementById("linkOfertasEmpresa");
  if (linkOfertasEmpresa) {
    linkOfertasEmpresa.href = `./busqueda.html?sector=${encodeURIComponent(empresa.rubro)}`;
  }

  // Valoración empresa lateral
  const valoracionEmpresa = document.getElementById("valoracionEmpresa");
  if (valoracionEmpresa) {
    pintarPuntos(valoracionEmpresa, Math.round(empresa.valoracion || 0), 5);
  }

  /* ------------------------------------------------------------
     3. Detalle largo: responsabilidades/requisitos/beneficios/contacto
     ------------------------------------------------------------ */
  // Funcionalidad: obtener detalle desde DETALLE_VACANTE (solo existe para 101)
  // Lógica: si no existe para la vacante actual, se genera texto genérico coherente con el resumen
  let detalle = null;
  if (DETALLE_VACANTE && DETALLE_VACANTE.id === vacante.id) {
    detalle = DETALLE_VACANTE;
  } else {
    // Respaldo genérico para otras vacantes (coherente con el resumen)
    detalle = {
      id: vacante.id,
      responsabilidades: [
        "Desarrollar las tareas asignadas de acuerdo con el perfil de la oferta.",
        "Colaborar con el equipo para alcanzar los objetivos del puesto.",
        "Mantener la calidad y los plazos establecidos.",
      ],
      requisitos: [
        "Formación o experiencia acorde al nivel solicitado.",
        "Capacidad para trabajar en equipo y buena comunicación.",
        "Orientación a resultados y cumplimiento de plazos.",
      ],
      beneficios: [
        "Ambiente de trabajo colaborativo y profesional.",
        "Oportunidades de desarrollo y aprendizaje continuo.",
        "Condiciones contractuales según lo establecido en la oferta.",
      ],
      contacto: {
        correo: "talento@empresa.ec",
        telefono: "+593 2 000 0000",
        direccion: "Dirección de la empresa",
        responsable: "Equipo de Talento Humano",
      },
    };
  }

  // Pintar listas
  function pintarLista(id, items) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = "";
    (items || []).forEach((texto) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "punto";
      li.appendChild(span);
      li.appendChild(document.createTextNode(texto));
      ul.appendChild(li);
    });
  }

  pintarLista("listaResponsabilidades", detalle.responsabilidades);
  pintarLista("listaRequisitos", detalle.requisitos);
  pintarLista("listaBeneficios", detalle.beneficios);

  // Contacto
  const contactoCorreo = document.getElementById("contactoCorreo");
  if (contactoCorreo) contactoCorreo.textContent = detalle.contacto.correo;
  const contactoTelefono = document.getElementById("contactoTelefono");
  if (contactoTelefono) contactoTelefono.textContent = detalle.contacto.telefono;
  const contactoDireccion = document.getElementById("contactoDireccion");
  if (contactoDireccion) contactoDireccion.textContent = detalle.contacto.direccion;
  const contactoResponsable = document.getElementById("contactoResponsable");
  if (contactoResponsable) contactoResponsable.textContent = detalle.contacto.responsable;

  /* ------------------------------------------------------------
     4. Botones Postularme (principal y lateral) sincronizados
     ------------------------------------------------------------ */
  // Estados
  let postulada = false;
  let contadorPost = 27; // valor inicial mostrado en lateral
  const btnPostularme = document.getElementById("btnPostularme");
  const btnPostularmeLateral = document.getElementById("btnPostularmeLateral");
  const contadorPostulacionesEl = document.getElementById("contadorPostulaciones");

  function actualizarBotonesPostulacion() {
    const textoPostulada = "Postulación enviada ✓";
    if (postulada) {
      // Estado: Postulada (deshabilitado, clase btn-tinta)
      if (btnPostularme) {
        btnPostularme.disabled = true;
        btnPostularme.classList.remove("btn-bermellon");
        btnPostularme.classList.add("btn-tinta");
        btnPostularme.innerHTML = `<span class="punto" aria-hidden="true"></span>${textoPostulada}`;
      }
      if (btnPostularmeLateral) {
        btnPostularmeLateral.disabled = true;
        btnPostularmeLateral.classList.remove("btn-bermellon");
        btnPostularmeLateral.classList.add("btn-tinta");
        btnPostularmeLateral.innerHTML = `<span class="punto" aria-hidden="true"></span>${textoPostulada}`;
      }
    } else {
      // Estado: No postulada
      if (btnPostularme) {
        btnPostularme.disabled = false;
        btnPostularme.classList.remove("btn-tinta");
        btnPostularme.classList.add("btn-bermellon");
        btnPostularme.innerHTML = `<span class="punto" aria-hidden="true"></span>Postularme`;
      }
      if (btnPostularmeLateral) {
        btnPostularmeLateral.disabled = false;
        btnPostularmeLateral.classList.remove("btn-tinta");
        btnPostularmeLateral.classList.add("btn-bermellon");
        btnPostularmeLateral.innerHTML = `<span class="punto" aria-hidden="true"></span>Postularme ahora`;
      }
    }
    if (contadorPostulacionesEl) {
      contadorPostulacionesEl.textContent = contadorPost.toString();
    }
  }

  // Lógica de postulación: cambia estado, muestra aviso, incrementa contador y sincroniza
  function postular() {
    if (postulada) return;
    postulada = true;
    contadorPost += 1;
    // Mostrar aviso de éxito
    if (typeof avisar === "function") {
      avisar("Postulación enviada. Recibirás novedades en tu perfil.", "exito");
    }
    actualizarBotonesPostulacion();
  }

  if (btnPostularme) btnPostularme.addEventListener("click", postular);
  if (btnPostularmeLateral) btnPostularmeLateral.addEventListener("click", postular);
  actualizarBotonesPostulacion();

  /* ------------------------------------------------------------
     5. Botón Guardar oferta
     ------------------------------------------------------------ */
  // Funcionalidad: alternar texto y estilo, mostrar avisos
  let guardada = false;
  const btnGuardar = document.getElementById("btnGuardar");
  function actualizarGuardar() {
    if (!btnGuardar) return;
    if (guardada) {
      btnGuardar.textContent = "Guardada";
      btnGuardar.classList.remove("btn-linea");
      btnGuardar.classList.add("btn-tinta");
    } else {
      btnGuardar.textContent = "Guardar oferta";
      btnGuardar.classList.remove("btn-tinta");
      btnGuardar.classList.add("btn-linea");
    }
  }
  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      guardada = !guardada;
      if (typeof avisar === "function") {
        if (guardada) {
          avisar("Oferta guardada en tu perfil.");
        } else {
          avisar("Oferta eliminada de tus guardados.");
        }
      }
      actualizarGuardar();
    });
  }
  actualizarGuardar();

  /* ------------------------------------------------------------
     6. Reseñas: pintar, calcular media y formulario
     ------------------------------------------------------------ */
  // Datos base
  let reseñas = Array.isArray(RESENAS_EMPRESA) ? RESENAS_EMPRESA.slice() : [];
  const listaResenasEl = document.getElementById("listaResenas");
  const notaMediaEl = document.getElementById("notaMedia");

  // Función para pintar puntos de valoración (dentro de .valoracion)
  function pintarPuntos(contenedor, nota, max = 5) {
    if (!contenedor) return;
    contenedor.innerHTML = "";
    for (let i = 1; i <= max; i++) {
      const p = document.createElement("span");
      p.className = "punto-valoracion" + (i <= nota ? " lleno" : "");
      contenedor.appendChild(p);
    }
  }

  // Calcular nota media con un decimal
  function calcularMedia() {
    if (reseñas.length === 0) return 0;
    const suma = reseñas.reduce((acc, r) => acc + (r.nota || 0), 0);
    return Math.round((suma / reseñas.length) * 10) / 10;
  }

  // Pintar reseña individual
  function crearResenaElemento(r) {
    const resena = document.createElement("div");
    resena.className = "resena";

    const avatarCol = document.createElement("div");
    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-acento";
    avatar.textContent = r.iniciales || "";
    avatarCol.appendChild(avatar);

    const cuerpo = document.createElement("div");
    const cabecera = document.createElement("div");
    cabecera.className = "resena-cabecera";

    const izquierda = document.createElement("div");
    const autor = document.createElement("strong");
    autor.textContent = r.autor || "";
    const fecha = document.createElement("div");
    fecha.className = "datos texto-tenue";
    fecha.textContent = r.fecha === "hoy" ? "hoy" : fechaCercana(r.fecha) || r.fecha;
    izquierda.appendChild(autor);
    izquierda.appendChild(fecha);

    const derecha = document.createElement("div");
    derecha.className = "d-flex align-items-center gap-2";
    const valoracion = document.createElement("div");
    valoracion.className = "valoracion";
    pintarPuntos(valoracion, Math.round(r.nota || 0), 5);
    const notaNum = document.createElement("span");
    notaNum.className = "valoracion-nota";
    notaNum.textContent = r.nota.toFixed(1);
    derecha.appendChild(valoracion);
    derecha.appendChild(notaNum);

    cabecera.appendChild(izquierda);
    cabecera.appendChild(derecha);

    const texto = document.createElement("p");
    texto.textContent = r.texto || "";

    cuerpo.appendChild(cabecera);
    cuerpo.appendChild(texto);

    resena.appendChild(avatarCol);
    resena.appendChild(cuerpo);
    return resena;
  }

  // Pintar lista de reseñas y media
  function pintarResenas() {
    if (listaResenasEl) {
      listaResenasEl.innerHTML = "";
      reseñas.forEach((r) => {
        listaResenasEl.appendChild(crearResenaElemento(r));
      });
    }
    if (notaMediaEl) {
      notaMediaEl.textContent = calcularMedia().toFixed(1);
    }
  }
  pintarResenas();

  // Formulario
  let notaSeleccionada = 0;
  const valoracionFormulario = document.getElementById("valoracionFormulario");
  const resenaTexto = document.getElementById("resenaTexto");
  const btnPublicarResena = document.getElementById("btnPublicarResena");

  if (valoracionFormulario) {
    valoracionFormulario.querySelectorAll(".punto-valoracion").forEach((btn) => {
      btn.addEventListener("click", () => {
        notaSeleccionada = parseInt(btn.dataset.nota, 10) || 0;
        // Resaltar selección
        valoracionFormulario.querySelectorAll(".punto-valoracion").forEach((b) => {
          const n = parseInt(b.dataset.nota, 10) || 0;
          if (n <= notaSeleccionada) {
            b.classList.add("lleno");
          } else {
            b.classList.remove("lleno");
          }
        });
        // Limpiar invalido si hay texto
        if (resenaTexto && resenaTexto.classList.contains("invalido") && resenaTexto.value.trim()) {
          resenaTexto.classList.remove("invalido");
        }
      });
    });
  }

  if (btnPublicarResena) {
    btnPublicarResena.addEventListener("click", () => {
      const texto = resenaTexto ? resenaTexto.value.trim() : "";
      let valido = true;
      if (notaSeleccionada < 1 || notaSeleccionada > 5) {
        valido = false;
      }
      if (!texto) {
        valido = false;
        if (resenaTexto) resenaTexto.classList.add("invalido");
      } else if (resenaTexto) {
        resenaTexto.classList.remove("invalido");
      }
      if (!valido) {
        if (typeof avisar === "function") {
          avisar("Elige una nota y escribe tu comentario.");
        }
        return;
      }
      // Crear nueva reseña (autor "Tú", iniciales "TÚ", fecha "hoy")
      const nueva = {
        autor: "Tú",
        iniciales: "TÚ",
        fecha: "hoy",
        nota: notaSeleccionada,
        texto: texto,
      };
      // Agregar al inicio de la lista
      reseñas.unshift(nueva);
      // Limpiar formulario
      notaSeleccionada = 0;
      if (valoracionFormulario) {
        valoracionFormulario.querySelectorAll(".punto-valoracion").forEach((b) => b.classList.remove("lleno"));
      }
      if (resenaTexto) {
        resenaTexto.value = "";
        resenaTexto.classList.remove("invalido");
      }
      // Repintar y avisar
      pintarResenas();
      if (typeof avisar === "function") {
        avisar("Tu reseña se publicó correctamente.", "exito");
      }
    });
  }

  /* ------------------------------------------------------------
     7. Otras ofertas de la misma empresa
     ------------------------------------------------------------ */
  const otrasOfertasEl = document.getElementById("otrasOfertas");
  function pintarOtrasOfertas() {
    if (!otrasOfertasEl) return;
    otrasOfertasEl.innerHTML = "";
    // Obtener ofertas de la misma empresa, excluyendo la actual
    const otras = VACANTES.filter((v) => v.empresaId === empresa.id && v.id !== vacante.id);
    if (otras.length === 0) {
      // Mostrar vacío pequeño
      const vacio = document.createElement("div");
      vacio.className = "vacio w-100 py-4";
      const disco = document.createElement("span");
      disco.className = "disco disco-linea";
      disco.textContent = "0";
      const h4 = document.createElement("h4");
      h4.textContent = "No hay otras ofertas de esta empresa";
      const p = document.createElement("p");
      p.innerHTML = `Esta empresa solo tiene esta oferta. <a href="./busqueda.html">Ver todos los resultados</a>`;
      vacio.appendChild(disco);
      vacio.appendChild(h4);
      vacio.appendChild(p);
      otrasOfertasEl.appendChild(vacio);
      return;
    }
    // Pintar tarjetas (.tarjeta) enlazadas a vacante.html?id=N
    otras.forEach((v) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";
      const tarjeta = document.createElement("a");
      tarjeta.className = "tarjeta d-flex flex-column h-100";
      tarjeta.href = `./vacante.html?id=${v.id}`;

      const cuerpo = document.createElement("div");
      cuerpo.className = "tarjeta-cuerpo d-flex flex-column h-100";
      const titulo = document.createElement("h3");
      titulo.textContent = v.titulo;
      const emp = document.createElement("p");
      emp.className = "resultado-empresa mb-2";
      emp.textContent = empresa.nombre;
      const chips = document.createElement("div");
      chips.className = "chips mb-2";
      [v.ciudad, v.modalidad, v.contrato, v.nivel].forEach((txt) => {
        const chip = document.createElement("span");
        chip.className = "etiqueta-chip";
        chip.textContent = txt;
        chips.appendChild(chip);
      });
      const resumen = document.createElement("p");
      resumen.className = "texto-suave mb-3";
      resumen.textContent = v.resumen;
      const pie = document.createElement("div");
      pie.className = "mt-auto d-flex align-items-center justify-content-between gap-2";
      const salario = document.createElement("span");
      salario.className = "resultado-salario";
      salario.textContent = salarioFormateado(v.salario);
      const fecha = document.createElement("span");
      fecha.className = "resultado-fecha";
      fecha.textContent = fechaCercana(v.publicada);
      pie.appendChild(salario);
      pie.appendChild(fecha);

      cuerpo.appendChild(titulo);
      cuerpo.appendChild(emp);
      cuerpo.appendChild(chips);
      cuerpo.appendChild(resumen);
      cuerpo.appendChild(pie);
      tarjeta.appendChild(cuerpo);
      col.appendChild(tarjeta);
      otrasOfertasEl.appendChild(col);
    });
  }
  pintarOtrasOfertas();
});
