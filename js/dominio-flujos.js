/* Reglas de negocio sin DOM ni almacenamiento concreto. Reutilizables desde Node.
   El repositorio real debe ejecutar cada mutación en una transacción. */
function crearServicioFlujos({ leer, guardar, actor, nuevoId, ahora, empresasBase = [], temasBase = [], cuentaActiva = () => true, paisObjetivo = "SV" }) {
  const categorias = ["Tecnología", "Salud", "Primer empleo", "Diseño", "Seguridad laboral"];
  const sectores = ["Tecnología", "Finanzas", "Diseño", "Agroindustria", "Salud", "Logística", "Educación", "Comercio", "Servicios", "Otro"];
  function error(codigo, mensaje, campos = {}) { const e = new Error(mensaje); e.codigo = codigo; e.campos = campos; throw e; }
  function estado() {
    const s = leer();
    const objeto = v => v && typeof v === "object" && !Array.isArray(v);
    const identidad = v => objeto(v) && typeof v.id === "string" && typeof v.usuario === "string" && Number.isSafeInteger(v.version) && v.version >= 1 && ["pendiente","aprobado","rechazado","archivado"].includes(v.estado);
    const valido = objeto(s) && s.schemaVersion === 1 && ["temas","solicitudes","empresas","miembros","auditoria"].every(k=>Array.isArray(s[k]));
    if (!valido || !s.temas.every(t=>identidad(t) && typeof t.titulo === "string" && typeof t.mensaje === "string" && typeof t.autor === "string" && typeof t.categoria === "string") || !s.solicitudes.every(t=>identidad(t) && objeto(t.datos) && ["nombreComercial","razonSocial","identificacionFiscal","pais"].every(k=>typeof t.datos[k] === "string")) || !s.empresas.every(e=>objeto(e) && Number.isSafeInteger(e.id)) || !s.miembros.every(m=>objeto(m) && typeof m.usuario === "string" && Number.isSafeInteger(m.empresaId)) || !s.auditoria.every(a=>objeto(a) && typeof a.entidadId === "string")) error("ALMACEN_INVALIDO", "Los datos guardados están dañados o tienen una versión incompatible. No se ha modificado el almacenamiento.");
    return JSON.parse(JSON.stringify(s));
  }
  function usuario() { const u = actor(); if (!u || !["candidato","solicitante","empresa","administrador"].includes(u.rol) || typeof u.usuario !== "string" || typeof u.nombre !== "string" || !cuentaActiva(u.usuario)) error("NO_AUTENTICADO", "Inicia sesión para continuar."); return u; }
  function admin() { const u = usuario(); if (u.rol !== "administrador") error("SIN_PERMISO", "Solo administración puede revisar solicitudes."); return u; }
  function registrar(s, tipo, entidad, accion, u, motivo = "") {
    s.auditoria.push({ id: nuevoId(), tipo, entidadId: entidad.id, accion, actor: u.usuario, fecha: ahora(), motivo, version: entidad.version, contenido: accion === "enviado" || accion === "enviada" || accion === "reenviado" ? JSON.parse(JSON.stringify(tipo === "empresa" ? entidad.datos : {titulo:entidad.titulo,categoria:entidad.categoria,mensaje:entidad.mensaje})) : undefined });
  }
  function persistir(s) { if (!guardar(s)) error("ALMACEN_NO_DISPONIBLE", "No se pudo guardar. Conserva tus datos e inténtalo de nuevo."); }
  function texto(valor, min, max, campo, errores) {
    const t = typeof valor === "string" ? valor.trim() : "";
    if (t.length < min || t.length > max) errores[campo] = `Debe tener entre ${min} y ${max} caracteres.`;
    return t;
  }
  function validarTema(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) error("VALIDACION", "Los datos del tema son inválidos.");
    const e = {}, titulo = texto(d.titulo, 8, 160, "titulo", e), mensaje = texto(d.mensaje, 20, 10000, "mensaje", e);
    if (!categorias.includes(d.categoria)) e.categoria = "Selecciona una categoría válida.";
    let imagen=null, video=null;
    if(d.imagen) {
      if(typeof d.imagen!=="object" || typeof d.imagen.id!=="string" || !/^[a-z0-9-]{1,80}$/i.test(d.imagen.id) || typeof d.imagen.alt!=="string" || d.imagen.alt.trim().length<3 || d.imagen.alt.trim().length>180) e.imagen="La imagen necesita un identificador y descripción de 3 a 180 caracteres.";
      else imagen={id:d.imagen.id,alt:d.imagen.alt.trim()};
    }
    const enlace=typeof d.video==="object" && d.video ? d.video.enlace : d.video;
    if(enlace) {
      try {
        const url=new URL(enlace);if(url.protocol!=="https:" || url.username || url.password || enlace.length>500) throw Error();
        const host=url.hostname.toLowerCase();let id;
        if(["youtube.com","www.youtube.com","m.youtube.com","youtu.be"].includes(host)) {
          id=host==="youtu.be" ? url.pathname.slice(1) : url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
          if(!/^[a-zA-Z0-9_-]{11}$/.test(id||""))throw Error();video={proveedor:"youtube",id,enlace:`https://www.youtube.com/watch?v=${id}`};
        } else if(["vimeo.com","www.vimeo.com","player.vimeo.com"].includes(host)) {
          id=url.pathname.match(/^\/(?:video\/)?(\d{5,12})\/?$/)?.[1];if(!id)throw Error();video={proveedor:"vimeo",id,enlace:`https://vimeo.com/${id}`};
        } else throw Error();
      } catch {e.video="Usa un enlace HTTPS válido de YouTube o Vimeo.";}
    }
    if (Object.keys(e).length) error("VALIDACION", "Revisa los campos indicados.", e);
    return { titulo, mensaje, categoria: d.categoria, imagen, video };
  }

  function validarSolicitud(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) error("VALIDACION", "Los datos de la solicitud son inválidos.");
    const e = {}, limpio = {};
    for (const [campo, min, max] of [["razonSocial",3,160],["nombreComercial",3,120],["identificacionFiscal",5,40],["pais",2,2],["ciudad",2,100],["direccion",10,250],["tamano",2,40],["descripcion",50,3000],["contactoNombre",3,120],["contactoCargo",2,100],["contactoCorreo",5,160],["contactoTelefono",7,30]]) limpio[campo] = texto(d[campo], min, max, campo, e);
    limpio.identificacionFiscal = limpio.identificacionFiscal.toUpperCase().replace(/[\s.-]/g, "");
    if (!/^[A-Z0-9]{5,40}$/.test(limpio.identificacionFiscal)) e.identificacionFiscal = "Usa letras y números; no se verifica aquí su validez legal.";
    if (limpio.pais !== paisObjetivo) e.pais = "Este portal registra empresas de El Salvador.";
    if (!sectores.includes(d.sector)) e.sector = "Selecciona un sector válido.";
    if (!["1–10", "11–50", "51–200", "201–500", "Más de 500"].includes(limpio.tamano)) e.tamano = "Selecciona el tamaño de la empresa.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio.contactoCorreo)) e.contactoCorreo = "Introduce un correo válido.";
    const digitosTelefono = limpio.contactoTelefono.replace(/\D/g,"");
    const numeroLocal = digitosTelefono.length === 11 && digitosTelefono.startsWith("503") ? digitosTelefono.slice(3) : digitosTelefono;
    if (!/^\+?[\d\s()\-]{7,30}$/.test(limpio.contactoTelefono) || (limpio.contactoTelefono.startsWith("+") && !(digitosTelefono.length === 11 && digitosTelefono.startsWith("503"))) || !/^\d{8}$/.test(numeroLocal)) e.contactoTelefono="Introduce 8 dígitos, con prefijo +503 opcional.";
    else limpio.contactoTelefono="+503 "+numeroLocal.slice(0,4)+" "+numeroLocal.slice(4);
    limpio.sitioWeb = typeof d.sitioWeb === "string" ? d.sitioWeb.trim() : "";
    if (limpio.sitioWeb) { try { const url = new URL(limpio.sitioWeb); if (!["https:","http:"].includes(url.protocol) || url.username || url.password || limpio.sitioWeb.length > 300) throw Error(); } catch { e.sitioWeb = "Usa una dirección http o https válida, sin credenciales."; } }
    if (d.declaracion !== true) e.declaracion = "Confirma que representas a la organización y que los datos son correctos.";
    if (Object.keys(e).length) error("VALIDACION", "Revisa los datos del registro.", e);
    return { ...limpio, sector: d.sector, declaracion: true };
  }
  function pendiente(lista, id, version) {
    const item = lista.find(x => x.id === id);
    if (!item) error("NO_ENCONTRADO", "La solicitud ya no existe.");
    if (item.version !== version) error("CONFLICTO", "La solicitud cambió. Actualiza la lista antes de revisarla.");
    if (item.estado !== "pendiente") error("CONFLICTO", "La solicitud ya fue revisada.");
    return item;
  }
  function temaGestionable(s,id,version) {
    let tema=s.temas.find(t=>t.id===id);
    if(!tema) {const base=temasBase.find(t=>t.id===id);if(base){tema=JSON.parse(JSON.stringify(base));s.temas.push(tema);}}
    if(!tema) error("NO_ENCONTRADO","El tema ya no está disponible.");
    if(tema.version!==version) error("CONFLICTO","El tema cambió. Actualiza antes de actuar.");
    return tema;
  }
  function solicitudDisponible(s, u, datos, ignorarId) {
    if(u.rol !== "solicitante") error("SIN_PERMISO","Usa una cuenta de tipo Empresa para registrar una organización.");
    if (u.empresaId || s.miembros.some(m => m.usuario === u.usuario)) error("EMPRESA_EXISTENTE", "Tu cuenta ya gestiona una empresa o corresponde a administración.");
    if (s.solicitudes.some(x => x.id !== ignorarId && x.estado === "pendiente" && x.usuario === u.usuario)) error("SOLICITUD_EXISTENTE", "Ya tienes una solicitud pendiente de revisión.");
    if (s.solicitudes.some(x => x.id !== ignorarId && x.estado !== "rechazado" && x.datos.pais === datos.pais && x.datos.identificacionFiscal === datos.identificacionFiscal)) error("EMPRESA_DUPLICADA", "Ya existe una solicitud o empresa con esa identificación fiscal y país.");
  }
  return {
    categorias: [...categorias], sectores: [...sectores],
    vistaRevision(tipo) {
      admin(); if (!["tema","empresa"].includes(tipo)) error("VALIDACION","Tipo de revisión inválido.");
      const s = estado();
      return {items:tipo === "tema" ? s.temas : s.solicitudes, historial:s.auditoria.filter(a=>a.tipo === tipo)};
    },
    vistaForo() {
      const s = estado(), u = actor();
      return {basesModificadas:s.temas.map(t=>t.id),publicos:s.temas.filter(t=>t.estado === "aprobado" && t.editorial === true),propios:u && cuentaActiva(u.usuario) ? s.temas.filter(t=>t.usuario === u.usuario) : []};
    },
    temasPublicos: () => estado().temas.filter(t => t.estado === "aprobado" && t.editorial === true),
    misTemas: () => { const u = actor(); return u ? estado().temas.filter(t => t.usuario === u.usuario) : []; },
    misSolicitudes: () => { const u = actor(); return u ? estado().solicitudes.filter(t => t.usuario === u.usuario) : []; },
    colaTemas: () => { admin(); return estado().temas; },
    colaEmpresas: () => { admin(); return estado().solicitudes; },
    actividad: () => { admin(); return estado().auditoria.slice(-20).reverse(); },
    auditoria: (tipo, id) => { admin(); return estado().auditoria.filter(a => a.tipo === tipo && a.entidadId === id); },
    enviarTema(datos) {
      const u=admin(),d=validarTema(datos),s=estado();
      const tema={...d,id:nuevoId(),usuario:u.usuario,autor:u.nombre,iniciales:u.nombre.slice(0,2).toUpperCase(),estado:"aprobado",editorial:true,version:1,creada:ahora(),actualizada:ahora(),respuestas:0,vistas:0,fijado:false,comentariosAbiertos:true};
      s.temas.unshift(tema);registrar(s,"tema",tema,"publicado",u);persistir(s);return tema;
    },
    editarTema(id,version,datos) {
      const u=admin(),s=estado(),tema=temaGestionable(s,id,version);
      Object.assign(tema,validarTema(datos),{editorial:true,usuario:u.usuario,autor:u.nombre,version:tema.version+1,actualizada:ahora()});
      registrar(s,"tema",tema,"editado",u);persistir(s);return tema;
    },
    gestionarTema(id,version,accion) {
      const u=admin(),s=estado(),tema=temaGestionable(s,id,version);
      if(accion==="archivar") tema.estado="archivado";
      else if(accion==="publicar") {validarTema(tema);tema.estado="aprobado";tema.editorial=true;tema.usuario=u.usuario;tema.autor=u.nombre;}
      else if(accion==="fijar") tema.fijado=!tema.fijado;
      else if(accion==="comentarios") tema.comentariosAbiertos=tema.comentariosAbiertos===false;
      else error("VALIDACION","Acción desconocida.");
      tema.version++;tema.actualizada=ahora();registrar(s,"tema",tema,accion,u);persistir(s);return tema;
    },
    enviarSolicitud(datos) {
      const u = usuario(), d = validarSolicitud(datos), s = estado(); solicitudDisponible(s,u,d);
      const item = { id: nuevoId(), usuario: u.usuario, datos: d, estado: "pendiente", version: 1, creada: ahora(), actualizada: ahora(), motivo: "" };
      s.solicitudes.unshift(item); registrar(s,"empresa",item,"enviada",u); persistir(s); return item;
    },
    corregir(tipo, id, version, datos) {
      if(tipo === "tema") error("SIN_PERMISO","Los temas se gestionan desde administración.");
      const u = usuario(), s = estado(), lista = tipo === "tema" ? s.temas : tipo === "empresa" ? s.solicitudes : null;
      if (!lista) error("VALIDACION", "Tipo de solicitud inválido.");
      const item = lista.find(x => x.id === id);
      if (!item || item.usuario !== u.usuario) error("SIN_PERMISO", "No puedes corregir esta solicitud.");
      if (item.version !== version || item.estado !== "rechazado") error("CONFLICTO", "Solo puedes reenviar una solicitud rechazada sin cambios posteriores.");
      if (tipo === "tema") Object.assign(item,validarTema(datos));
      else { const d = validarSolicitud(datos); solicitudDisponible(s,u,d,id); item.datos = d; }
      Object.assign(item,{estado:"pendiente",version:item.version+1,actualizada:ahora(),motivo:"",revisada:null,revisadaPor:null});
      registrar(s,tipo,item,"reenviado",u); persistir(s); return item;
    },
    decidir(tipo, id, version, decision, motivo = "") {
      const u = admin(), s = estado();
      if(tipo === "tema") error("SIN_PERMISO","Los temas administrativos no requieren una cola de aprobación.");
      if (!["tema","empresa"].includes(tipo) || !["aprobar","rechazar"].includes(decision)) error("VALIDACION", "Decisión inválida.");
      const item = pendiente(tipo === "tema" ? s.temas : s.solicitudes,id,version);
      if (decision === "aprobar" && item.usuario === u.usuario) error("REVISION_PROPIA", "Otra persona administradora debe aprobar tu solicitud.");
      motivo = String(motivo).trim();
      if ((decision === "rechazar" && motivo.length < 10) || motivo.length > 1000) error("VALIDACION", "Para rechazar, explica el motivo con entre 10 y 1000 caracteres.",{motivo:"Escribe un motivo claro de al menos 10 caracteres."});
      if (decision === "aprobar" && !cuentaActiva(item.usuario)) error("CUENTA_INACTIVA", "El autor tiene una cuenta suspendida o eliminada. No se puede aprobar su solicitud.");
      if (tipo === "tema" && decision === "aprobar") validarTema(item);
      if (tipo === "empresa" && decision === "aprobar") {
        if (s.miembros.some(m => m.usuario === item.usuario)) error("EMPRESA_EXISTENTE", "La cuenta solicitante ya tiene una empresa asignada.");
        if (s.solicitudes.some(x => x.id !== item.id && x.estado === "aprobado" && x.datos.pais === item.datos.pais && x.datos.identificacionFiscal === item.datos.identificacionFiscal)) error("EMPRESA_DUPLICADA", "La identificación fiscal ya está registrada.");
        const idEmpresa = Math.max(0,...empresasBase.map(e=>e.id),...s.empresas.map(e=>e.id))+1;
        const d = validarSolicitud(item.datos);
        s.empresas.push({id:idEmpresa,solicitudId:item.id,nombre:d.nombreComercial,iniciales:d.nombreComercial.slice(0,2).toUpperCase(),rubro:d.sector,tamano:d.tamano+" empleados",pais:d.pais,ciudad:d.ciudad,descripcion:d.descripcion,sitioWeb:d.sitioWeb,valoracion:0,resenas:0,estadoRegistro:"aprobado"});
        s.miembros.push({usuario:item.usuario,empresaId:idEmpresa,permiso:"propietario",creada:ahora()}); item.empresaId = idEmpresa;
      }
      Object.assign(item,{estado:decision === "aprobar" ? "aprobado" : "rechazado",version:item.version+1,revisadaPor:u.usuario,revisada:ahora(),actualizada:ahora(),motivo});
      registrar(s,tipo,item,decision,u,motivo); persistir(s); return item;
    }
  };
}
if (typeof module !== "undefined" && module.exports) module.exports = { crearServicioFlujos };
