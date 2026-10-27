/* =============================================================
   PORTAL DE TRABAJO — inicio de sesión y control de acceso
   -------------------------------------------------------------
   El prototipo no tiene servidor: las cuentas son de demostración
   y la sesión se guarda en localStorage (clave "pt_sesion").

   Cuentas de prueba
     · admin / admin123          -> administrador
     · empresa / empresa123      -> empresa
     · candidato / candidato123  -> candidato

   Vistas según el rol
     · visitante      -> portada, buscador, recursos, foros, login
     · candidato      -> además, su perfil y sus postulaciones
     · empresa        -> además, el módulo empresarial
     · administrador  -> además, el panel de administración

   La cabecera se adapta: si hay sesión muestra el nombre y el
   botón para cerrarla; si no, convierte el formulario de acceso
   en un login real.
   ============================================================= */

const USUARIOS_PRUEBA = [
  {
    usuario: "admin",
    contrasena: "admin123",
    rol: "administrador",
    nombre: "Administrador",
    correo: "admin@portaltrabajo.ec",
    empresaId: null,
  },
  {
    usuario: "empresa",
    contrasena: "empresa123",
    rol: "empresa",
    nombre: "Empresa Demo",
    correo: "rrhh@empresa-demo.ec",
    empresaId: 1,
  },
  {
    usuario: "candidato",
    contrasena: "candidato123",
    rol: "candidato",
    nombre: "Candidato Demo",
    correo: "candidato@demo.ec",
    empresaId: null,
  },
];

/* Nombre corto del rol para las etiquetas de la cabecera */
const ROTULO_ROL = {
  administrador: "Admin",
  empresa: "Empresa",
  candidato: "Candidato",
};

function etiquetaRol(rol) {
  return ROTULO_ROL[rol] || rol;
}

/* Página inicial de cada rol después de iniciar sesión */
const PANEL_POR_ROL = {
  administrador: "./admin.html",
  empresa: "./empresas.html",
  candidato: "./perfil.html",
};

/* Páginas que exigen un rol concreto. La clave es el archivo. */
const ACCESO_POR_PAGINA = {
  "admin.html": ["administrador"],
  "empresas.html": ["empresa", "administrador"],
  "perfil.html": ["candidato", "empresa", "administrador"],
};

/* ---------------------------------------------------------------
   Sesión
   --------------------------------------------------------------- */
function obtenerSesion() {
  try {
    const crudo = localStorage.getItem("pt_sesion");
    return crudo ? JSON.parse(crudo) : null;
  } catch (error) {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    localStorage.setItem("pt_sesion", JSON.stringify(sesion));
    return true;
  } catch (error) {
    return false;
  }
}

function iniciarSesion(usuario, contrasena) {
  const encontrado = USUARIOS_PRUEBA.find(
    (cuenta) =>
      cuenta.usuario === String(usuario || "").trim() &&
      cuenta.contrasena === String(contrasena || "")
  );

  if (!encontrado) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  const sesion = {
    usuario: encontrado.usuario,
    rol: encontrado.rol,
    nombre: encontrado.nombre,
    correo: encontrado.correo,
    empresaId: encontrado.empresaId || null,
  };

  guardarSesion(sesion);
  return { ok: true, sesion };
}

function cerrarSesion() {
  try {
    localStorage.removeItem("pt_sesion");
  } catch (error) {
    /* Sin almacenamiento disponible: se recarga igualmente */
  }
  window.location.href = "./index.html";
}

function panelDeSesion(sesion) {
  if (!sesion) return "./login.html";
  return PANEL_POR_ROL[sesion.rol] || "./index.html";
}

function puedeVer(rol, pagina) {
  const permitidos = ACCESO_POR_PAGINA[pagina];
  if (!permitidos) return true;
  return permitidos.includes(rol);
}

/* ---------------------------------------------------------------
   Protección de las vistas por rol
   Si la página exige una sesión que no existe (o un rol distinto),
   se redirige al login conservando el destino. El login muestra el
   motivo y las cuentas de prueba.
   --------------------------------------------------------------- */
function aplicarControlAcceso() {
  const pagina = location.pathname.split("/").pop() || "index.html";
  if (pagina === "login.html") return;

  const requeridos = ACCESO_POR_PAGINA[pagina];
  if (!requeridos) return;

  const sesion = obtenerSesion();
  if (sesion && puedeVer(sesion.rol, pagina)) return;

  const destino = encodeURIComponent(pagina + location.search + location.hash);
  const motivo = sesion ? "sin_permiso" : "sin_sesion";
  /* replace evita que el botón Atrás vuelva a la vista bloqueada */
  window.location.replace(`./login.html?destino=${destino}&motivo=${motivo}`);
}

/* ---------------------------------------------------------------
   Cabecera: zona de usuario o login
   Se distinguen los dos formularios de la cabecera:
     · escritorio -> form.acceso
     · móvil      -> #menuMovil form[data-acceso]
   --------------------------------------------------------------- */
function pintarZonaUsuario(sesion) {
  const panel = panelDeSesion(sesion);
  const textoPanel =
    sesion.rol === "administrador"
      ? "Administración"
      : sesion.rol === "empresa"
        ? "Módulo empresarial"
        : "Mi perfil";

  const contenedor = document.createElement("div");
  contenedor.className = "zona-usuario d-none d-lg-flex align-items-center gap-2";
  contenedor.innerHTML = `
    <a class="zona-usuario-datos" href="${panel}" title="Ir a ${textoPanel}">
      <span class="zona-usuario-nombre">${sesion.nombre}</span>
      <span class="etiqueta-chip">${etiquetaRol(sesion.rol)}</span>
    </a>
    <button class="btn btn-linea btn-sm" type="button" data-cerrar-sesion>
      Cerrar sesión
    </button>
  `;
  contenedor
    .querySelector("[data-cerrar-sesion]")
    .addEventListener("click", cerrarSesion);
  return contenedor;
}

function pintarFormularioLogin(formulario, movil) {
  formulario.setAttribute("id", movil ? "formLoginMovil" : "formLoginCabecera");

  if (movil) {
    formulario.innerHTML = `
      <input class="form-control" type="text" name="usuario" placeholder="Usuario"
             aria-label="Usuario" autocomplete="username" required />
      <input class="form-control" type="password" name="contrasena" placeholder="Contraseña"
             aria-label="Contraseña" autocomplete="current-password" required />
      <div class="d-flex gap-2">
        <button class="btn btn-tinta flex-fill" type="submit">Entrar</button>
        <a class="btn btn-linea flex-fill" href="./login.html">Cuentas demo</a>
      </div>
    `;
  } else {
    formulario.innerHTML = `
      <input class="acceso-campo" type="text" name="usuario" placeholder="Usuario"
             aria-label="Usuario" autocomplete="username" required />
      <input class="acceso-campo" type="password" name="contrasena" placeholder="Contraseña"
             aria-label="Contraseña" autocomplete="current-password" required />
      <button class="btn btn-tinta btn-sm" type="submit">Entrar</button>
      <a class="btn btn-linea btn-sm" href="./login.html">Cuentas demo</a>
    `;
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const usuario = formulario.querySelector('[name="usuario"]').value;
    const contrasena = formulario.querySelector('[name="contrasena"]').value;
    const resultado = iniciarSesion(usuario, contrasena);

    if (!resultado.ok) {
      if (typeof avisar === "function") avisar(resultado.error);
      else window.alert(resultado.error);
      return;
    }

    if (typeof avisar === "function") {
      avisar(`Bienvenido/a, ${resultado.sesion.nombre}.`, "exito");
    }
    window.setTimeout(() => {
      window.location.href = panelDeSesion(resultado.sesion);
    }, 450);
  });
}

/* En la pantalla de perfil se muestran los datos de la cuenta activa
   (el formulario trae un ejemplo fijo en el HTML). */
function rellenarPerfilConSesion(sesion) {
  if (!sesion) return;
  const pagina = location.pathname.split("/").pop();
  if (pagina !== "perfil.html") return;

  const nombre = document.getElementById("fNombres");
  const correo = document.getElementById("fCorreo");
  if (nombre) nombre.value = sesion.nombre;
  if (correo) correo.value = sesion.correo;
}

function actualizarEnlacesPorRol(sesion) {
  /* Los enlaces a vistas que el rol no puede abrir se ocultan.
     Un visitante sí los ve: al pulsarlos se le pedirá iniciar sesión
     y el login explicará qué cuenta necesita. */
  if (!sesion) return;

  if (sesion.rol !== "administrador") {
    document.querySelectorAll('a[href*="admin.html"]').forEach((enlace) => {
      enlace.hidden = true;
    });
  }

  /* El módulo empresarial es para empresas y administración: un
     candidato no debe encontrar un enlace que lo lleve a un bloqueo. */
  if (sesion.rol === "candidato") {
    document.querySelectorAll('a[href*="empresas.html"]').forEach((enlace) => {
      enlace.hidden = true;
    });

    /* En el pie, la columna "Empresas" quedaría con enlaces ocultos y
       espacios vacíos: se oculta la columna completa. */
    document.querySelectorAll(".pie h5").forEach((titulo) => {
      if (titulo.textContent.trim().toLowerCase() !== "empresas") return;
      const columna = titulo.closest("[class*='col-']");
      if (columna) columna.hidden = true;
    });
  }
}

function inicializarCabecera() {
  const sesion = obtenerSesion();

  /* Formulario de escritorio (el móvil no lleva la clase "acceso") */
  document.querySelectorAll("header form.acceso").forEach((formulario) => {
    if (sesion) formulario.replaceWith(pintarZonaUsuario(sesion));
    else pintarFormularioLogin(formulario, false);
  });

  /* Formulario del menú móvil */
  const formMovil = document.querySelector("#menuMovil form[data-acceso]");
  if (formMovil) {
    if (sesion) {
      const bloque = document.createElement("div");
      bloque.className = "d-flex flex-column gap-2";
      bloque.innerHTML = `
        <a class="zona-usuario-datos" href="${panelDeSesion(sesion)}">
          <span class="zona-usuario-nombre">${sesion.nombre}</span>
          <span class="etiqueta-chip">${etiquetaRol(sesion.rol)}</span>
        </a>
        <button class="btn btn-linea" type="button" data-cerrar-sesion-movil>
          Cerrar sesión
        </button>
      `;
      formMovil.replaceWith(bloque);
      bloque
        .querySelector("[data-cerrar-sesion-movil]")
        .addEventListener("click", cerrarSesion);
    } else {
      pintarFormularioLogin(formMovil, true);
    }
  }

  actualizarEnlacesPorRol(sesion);
  rellenarPerfilConSesion(sesion);
}

/* ---------------------------------------------------------------
   Pantalla login.html
   --------------------------------------------------------------- */
function inicializarPaginaLogin() {
  const formulario = document.getElementById("formLogin");
  if (!formulario) return;

  const campoUsuario = document.getElementById("loginUsuario");
  const campoContrasena = document.getElementById("loginPass");
  const zonaError = document.getElementById("loginError");
  const destino = new URLSearchParams(location.search).get("destino");
  const motivo = new URLSearchParams(location.search).get("motivo");

  /* Mensaje explicativo si se llegó desde una vista protegida */
  const aviso = document.getElementById("loginAviso");
  if (aviso && motivo) {
    aviso.hidden = false;
    aviso.textContent =
      motivo === "sin_sesion"
        ? "Esa vista necesita una sesión. Elige una cuenta de prueba para entrar."
        : "Tu rol no tiene acceso a esa vista. Prueba con otra cuenta de demostración.";
  }

  /* Si ya hay sesión, se ofrece continuar o cambiarla */
  const sesion = obtenerSesion();
  const zonaSesion = document.getElementById("loginSesionActiva");
  if (sesion && zonaSesion) {
    zonaSesion.hidden = false;
    zonaSesion.innerHTML = `
      <p class="mb-2">
        Sesión activa: <strong>${sesion.nombre}</strong>
        <span class="etiqueta-chip">${etiquetaRol(sesion.rol)}</span>
      </p>
      <div class="d-flex flex-wrap gap-2">
        <a class="btn btn-tinta btn-sm" href="${panelDeSesion(sesion)}">Continuar como ${sesion.nombre}</a>
        <button class="btn btn-linea btn-sm" type="button" data-cambiar-cuenta>
          Cambiar de cuenta
        </button>
        <button class="btn btn-linea btn-sm" type="button" data-salir-login>
          Cerrar sesión
        </button>
      </div>
    `;
    zonaSesion
      .querySelector("[data-cambiar-cuenta]")
      .addEventListener("click", () => {
        zonaSesion.hidden = true;
        campoUsuario.focus();
      });
    zonaSesion
      .querySelector("[data-salir-login]")
      .addEventListener("click", cerrarSesion);
  }

  /* Botones de las cuentas de prueba: rellenan el formulario */
  document.querySelectorAll("[data-demo-usuario]").forEach((boton) => {
    boton.addEventListener("click", () => {
      campoUsuario.value = boton.dataset.demoUsuario;
      campoContrasena.value = boton.dataset.demoContrasena;
      campoUsuario.focus();
      if (zonaError) zonaError.hidden = true;
    });
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const resultado = iniciarSesion(campoUsuario.value, campoContrasena.value);

    if (!resultado.ok) {
      if (zonaError) {
        zonaError.hidden = false;
        zonaError.textContent = resultado.error;
      }
      campoContrasena.select();
      return;
    }

    /* Se respeta el destino solo si el rol puede verlo */
    const paginaDestino = destino ? destino.split("?")[0].split("#")[0] : "";
    const destinoPermitido =
      paginaDestino && puedeVer(resultado.sesion.rol, paginaDestino);

    window.location.href = destinoPermitido
      ? `./${destino}`
      : panelDeSesion(resultado.sesion);
  });
}

/* ---------------------------------------------------------------
   Arranque (auth.js se carga antes que el script de cada página)
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  aplicarControlAcceso();
  inicializarCabecera();
  inicializarPaginaLogin();
});
