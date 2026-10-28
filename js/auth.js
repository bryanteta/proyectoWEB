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
  { usuario:"solicitante", contrasena:"solicitante123", rol:"solicitante", nombre:"Solicitante Empresa", correo:"registro@example.test", empresaId:null },
  {
    usuario: "admin",
    contrasena: "admin123",
    rol: "administrador",
    nombre: "Administrador",
    correo: "admin@portaltrabajo.example",
    empresaId: null,
  },
  {
    usuario: "empresa",
    contrasena: "empresa123",
    rol: "empresa",
    nombre: "Empresa Demo",
    correo: "rrhh@empresa-demo.example",
    empresaId: 1,
  },
  {
    usuario: "candidato",
    contrasena: "candidato123",
    rol: "candidato",
    nombre: "Candidato Demo",
    correo: "candidato@demo.example",
    empresaId: null,
  },
];

/* Nombre corto del rol para las etiquetas de la cabecera */
const ROTULO_ROL = {
  administrador: "Admin",
  empresa: "Empresa",
  candidato: "Candidato",
  solicitante: "Registro empresarial",
};

function nombreDeSesion(sesion) { return sesion?.rol === "candidato" ? leerPerfil().fNombres || sesion.nombre : sesion?.nombre || ""; }
function etiquetaRol(rol) {
  return ROTULO_ROL[rol] || rol;
}

/* Página inicial de cada rol después de iniciar sesión */
const PANEL_POR_ROL = {
  administrador: "./admin.html",
  empresa: "./empresas.html",
  candidato: "./perfil.html",
  solicitante: "./registro-empresa.html",
};

/* Páginas que exigen un rol concreto. La clave es el archivo. */
const ACCESO_POR_PAGINA = {
  "admin.html": ["administrador"],
  "empresas.html": ["empresa"],
  "perfil.html": ["candidato"],
  "registro-empresa.html": ["solicitante", "empresa"],
};

/* ---------------------------------------------------------------
   Sesión
   --------------------------------------------------------------- */
function obtenerSesion() { return sesionDatos(); }

function guardarSesion(sesion) {
  try {
    localStorage.setItem("pt_sesion", JSON.stringify(sesion));
    return true;
  } catch (error) {
    return false;
  }
}

function cuentasDelPortal() {
  return [...USUARIOS_PRUEBA,...leerLista("pt_cuentas_locales").filter(u=>u && (["candidato","solicitante"].includes(u.rol) || (u.rol==="administrador" && typeof u.creadaPorAdmin==="string")) && !USUARIOS_PRUEBA.some(d=>d.usuario===u.usuario))];
}
async function derivarClave(clave,sal) {
  const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(clave),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(sal.match(/.{2}/g),v=>parseInt(v,16)),iterations:100000,hash:"SHA-256"},material,256);
  return [...new Uint8Array(bits)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function registrarCuenta(datos, personal = false) {
  const adminCreador=personal && sesionDatos()?.rol==="administrador" ? sesionDatos().usuario : null;
  if(!datos || !(personal ? adminCreador && datos.rol==="administrador" : ["candidato","solicitante"].includes(datos.rol))) return {ok:false,error:"Elige Candidato o Empresa."};
  const nombre=String(datos.nombre||"").trim(),usuario=String(datos.usuario||"").trim().toLowerCase(),correo=String(datos.correo||"").trim().toLowerCase();
  if(nombre.length<3 || nombre.length>120 || !/^[a-z0-9_-]{3,40}$/.test(usuario) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length>160) return {ok:false,error:"Revisa nombre, correo y usuario (3 a 40 letras, números, guion o guion bajo)."};
  if(typeof datos.contrasena!=="string" || datos.contrasena.length<8 || datos.contrasena.length>128) return {ok:false,error:"Usa una contraseña de 8 a 128 caracteres."};
  if(cuentasDelPortal().some(u=>u.usuario===usuario || u.correo.toLowerCase()===correo)) return {ok:false,error:"El usuario o correo ya está registrado en este navegador."};
  try {
    const sal=[...crypto.getRandomValues(new Uint8Array(16))].map(v=>v.toString(16).padStart(2,"0")).join("");
    const cuenta={usuario,nombre,correo,rol:datos.rol,empresaId:null,sal,claveHash:await derivarClave(datos.contrasena,sal),creada:new Date().toISOString(),...(personal?{creadaPorAdmin:adminCreador}:{})};
    // Releer después de derivar evita descartar otra cuenta registrada durante la espera.
    if(cuentasDelPortal().some(u=>u.usuario===usuario || u.correo.toLowerCase()===correo)) return {ok:false,error:"El usuario o correo acaba de registrarse. Prueba otro."};
    if(personal && (sesionDatos()?.usuario!==adminCreador || sesionDatos()?.rol!=="administrador")) return {ok:false,error:"La sesión administrativa cambió. Vuelve a abrir el formulario."};
    if(!escribirAlmacen("pt_cuentas_locales",[...leerLista("pt_cuentas_locales"),cuenta])) return {ok:false,error:"No se pudo guardar la cuenta."};
    return personal ? {ok:true} : iniciarSesion(usuario,datos.contrasena);
  } catch { return {ok:false,error:"No se pudo crear la cuenta. Abre el portal desde el servidor local."}; }
}
async function iniciarSesion(usuario, contrasena) {
  const encontrado = cuentasDelPortal().find(
    (cuenta) => cuenta.usuario === String(usuario || "").trim().toLowerCase()
  );

  const valida = encontrado && (encontrado.claveHash ? await derivarClave(String(contrasena),encontrado.sal).then(h=>h===encontrado.claveHash).catch(()=>false) : encontrado.contrasena === String(contrasena || ""));
  if (!valida) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  if (["Suspendido", "Eliminado"].includes(leerObjeto("pt_cuentas_estado")[encontrado.usuario])) {
    return { ok: false, error: "La cuenta no está activa. Contacta con administración." };
  }
  const sesion = {
    usuario: encontrado.usuario,
    rol: encontrado.rol,
    nombre: encontrado.nombre,
    correo: encontrado.correo,
    empresaId: encontrado.empresaId || null,
  };

  if (!guardarSesion(sesion)) return { ok: false, error: "No se pudo guardar la sesión. Habilita el almacenamiento del navegador." };
  return { ok: true, sesion: obtenerSesion() };
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
  if (sesion.rol === "solicitante") return "./registro-empresa.html";
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
    sesion.rol === "solicitante" ? "Registro empresarial" : sesion.rol === "administrador"
      ? "Administración"
      : sesion.rol === "empresa"
        ? "Módulo empresarial"
        : "Mi perfil";

  const contenedor = document.createElement("div");
  contenedor.className = "zona-usuario d-none d-lg-flex align-items-center gap-2";
  contenedor.innerHTML = `
    <a class="zona-usuario-datos" href="${panel}" title="Ir a ${textoPanel}">
      <span class="zona-usuario-nombre">${escaparHTML(nombreDeSesion(sesion))}</span>
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

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const usuario = formulario.querySelector('[name="usuario"]').value;
    const contrasena = formulario.querySelector('[name="contrasena"]').value;
    const resultado = await iniciarSesion(usuario, contrasena);

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
  document.querySelectorAll('a[href]').forEach(enlace=>{
    const ruta=(enlace.getAttribute("href")||"").split("?")[0].split("#")[0];
    if(ruta.endsWith("registro-empresa.html") && (!sesion || sesion.rol==="candidato")) {
      enlace.href="./login.html?modo=registro&tipo=empresa";
      if(sesion?.rol==="candidato") enlace.textContent="Crear cuenta de empresa";
    }
    if(sesion?.rol==="administrador" && ruta.endsWith("empresas.html")) enlace.hidden=true;
    if(sesion?.rol==="administrador" && ruta.endsWith("registro-empresa.html")) {enlace.href="./admin.html#empresas";enlace.textContent="Gestionar empresas";}
    if(ruta.endsWith("admin.html") && sesion?.rol!=="administrador") enlace.hidden=true;
    if(ruta.endsWith("perfil.html") && sesion && sesion.rol!=="candidato") {
      if(enlace.closest("header,footer")) {enlace.href=panelDeSesion(sesion);enlace.textContent=sesion.rol==="administrador" ? "Mi panel" : "Mi empresa";}
      else enlace.hidden=true;
    }
    if(ruta.endsWith("empresas.html") && sesion?.rol==="candidato") enlace.hidden=true;
    if(ruta.endsWith("empresas.html") && sesion?.rol==="solicitante") {
      if(enlace.getAttribute("href").includes("#postulaciones")) enlace.hidden=true;
      else {enlace.href="./registro-empresa.html";enlace.textContent="Registro de mi empresa";}
    }
  });
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
          <span class="zona-usuario-nombre">${escaparHTML(nombreDeSesion(sesion))}</span>
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

  const alta=document.getElementById("formCrearCuenta");
  document.querySelectorAll("[data-modo-acceso]").forEach(b=>b.addEventListener("click",()=>{
    const crear=b.dataset.modoAcceso==="registro";document.getElementById("panelCrearCuenta").hidden=!crear;document.getElementById("panelEntrar").hidden=crear;
    document.querySelectorAll("[data-modo-acceso]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  }));
  function rotuloAlta() {const empresa=alta?.querySelector('[name="rol"]:checked')?.value==="solicitante";const label=document.querySelector('label[for="altaNombre"]');if(label)label.textContent=empresa?"Nombre del responsable":"Nombre completo";}
  alta?.querySelectorAll('[name="rol"]').forEach(c=>c.addEventListener("change",rotuloAlta));
  const parametros=new URLSearchParams(location.search);
  if(parametros.get("modo")==="registro") {
    document.getElementById("panelCrearCuenta").hidden=false;document.getElementById("panelEntrar").hidden=true;
    document.querySelectorAll("[data-modo-acceso]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.modoAcceso==="registro")));
    if(parametros.get("tipo")==="empresa" && alta) alta.querySelector('[name="rol"][value="solicitante"]').checked=true;
  }
  rotuloAlta();
  alta?.addEventListener("submit",async e=>{
    e.preventDefault();const datos=Object.fromEntries(new FormData(alta)),error=document.getElementById("errorCrearCuenta"),boton=alta.querySelector('button[type="submit"]');
    error.textContent="";
    if(datos.contrasena!==datos.confirmar) {error.textContent="Las contraseñas no coinciden.";return;}
    boton.disabled=true;
    try {const r=await registrarCuenta(datos);if(!r.ok)error.textContent=r.error;else location.href=panelDeSesion(r.sesion);} finally {boton.disabled=false;}
  });
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
        Sesión activa: <strong>${escaparHTML(nombreDeSesion(sesion))}</strong>
        <span class="etiqueta-chip">${etiquetaRol(sesion.rol)}</span>
      </p>
      <div class="d-flex flex-wrap gap-2">
        <a class="btn btn-tinta btn-sm" href="${panelDeSesion(sesion)}">Continuar como ${escaparHTML(nombreDeSesion(sesion))}</a>
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

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const resultado = await iniciarSesion(campoUsuario.value, campoContrasena.value);

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
      /^(index|busqueda|vacante|recursos|foros|perfil|empresas|admin|directorio|registro-empresa)\.html$/.test(paginaDestino) && puedeVer(resultado.sesion.rol, paginaDestino);

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

// Una pestaña conserva el contexto con que se abrió. Nunca envía un formulario
// anterior usando silenciosamente la cuenta iniciada en otra pestaña.
function huellaSesion(sesion) {
  return JSON.stringify(sesion ? [sesion.usuario, sesion.rol, sesion.empresaId || null] : null);
}
function instalarProteccionSesion() {
  const inicial = huellaSesion(obtenerSesion());
  let bloqueada = false;
  function comprobar(evento) {
    if (evento?.target?.closest?.('[data-actualizar-sesion]')) return true;
    if (!bloqueada && huellaSesion(obtenerSesion()) === inicial) return true;
    evento?.preventDefault?.(); evento?.stopImmediatePropagation?.();
    if (bloqueada) return false;
    bloqueada = true;
    const contenido = document.getElementById("contenido");
    if (contenido) { contenido.hidden = true; contenido.inert = true; }
    const mensaje = document.createElement("section");
    mensaje.className = "contenedor seccion"; mensaje.setAttribute("role", "alert");
    const titulo = document.createElement("h1"); titulo.textContent = "La sesión cambió";
    const texto = document.createElement("p"); texto.textContent = "Tu cuenta o tus permisos cambiaron en otra pestaña. Actualiza esta página antes de continuar para evitar guardar datos en otra cuenta.";
    const boton = document.createElement("button"); boton.type = "button"; boton.className = "btn btn-bermellon"; boton.dataset.actualizarSesion = ""; boton.textContent = "Actualizar sesión";
    boton.addEventListener("click",()=>window.location.reload());
    mensaje.append(titulo,texto,boton); if (contenido) contenido.before(mensaje); else document.body.prepend(mensaje); boton.focus();
    return false;
  }
  document.addEventListener("submit",comprobar,true);
  document.addEventListener("click",comprobar,true);
  window.addEventListener("focus",()=>comprobar());
  document.addEventListener("visibilitychange",()=>{if (!document.hidden) comprobar();});
  window.addEventListener("storage",evento=>{if (!evento.key || ["pt_sesion","pt_cuentas_estado","pt_flujos_v1"].includes(evento.key)) comprobar();});
}
document.addEventListener("DOMContentLoaded",instalarProteccionSesion);
