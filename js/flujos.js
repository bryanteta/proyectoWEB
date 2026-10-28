/* Adaptador del prototipo. En producción se reemplaza por una API Node
   que autentique al actor y haga transacciones en PostgreSQL. */
const CLAVE_FLUJOS = "pt_flujos_v1";
function leerEstadoFlujos() {
  const crudo = localStorage.getItem(CLAVE_FLUJOS);
  if (crudo) return JSON.parse(crudo);
  // Los temas antiguos no se aprueban implícitamente al migrar.
  const temas = leerTemasForo().filter(t => t && t.titulo).map(t => ({...t,
    id: `legacy-${t.id}`, usuario:t.usuario || "candidato", autor:t.autor || "Candidato Demo",
    mensaje:t.mensaje || "", estado:"pendiente", version:1, motivo:"",
    creada:t.creada || new Date().toISOString(), actualizada:new Date().toISOString()
  }));
  return {schemaVersion:1,temas,solicitudes:[],empresas:[],miembros:[],auditoria:[]};
}
const TEMAS_EDITORIALES_BASE = TEMAS_FORO.map(t=>({...t,id:"base-"+t.id,usuario:"admin",autor:"Equipo del portal",iniciales:"PT",estado:"aprobado",editorial:true,version:1,creada:"2026-10-20T12:00:00Z",actualizada:"2026-10-20T12:00:00Z",comentariosAbiertos:true,fijado:false,mensaje:t.mensaje || `Espacio de orientación sobre ${t.categoria.toLowerCase()}. Comparte experiencias y consejos relacionados con «${t.titulo}». Evita publicar datos privados de personas o empresas. Los comentarios se publican con un filtro automático de palabras.`}));
const flujos = crearServicioFlujos({
  paisObjetivo:CONFIG_PORTAL.pais, temasBase:TEMAS_EDITORIALES_BASE,
  leer:leerEstadoFlujos, guardar:s=>escribirAlmacen(CLAVE_FLUJOS,s),
  cuentaActiva:usuario=>!["Suspendido","Eliminado"].includes(leerObjeto("pt_cuentas_estado")[usuario]),
  actor:()=>sesionDatos(), nuevoId:()=>crypto.randomUUID(), ahora:()=>new Date().toISOString(), empresasBase:EMPRESAS
});
function ejecutarFlujo(accion) {
  try { return {ok:true,dato:accion()}; }
  catch (error) { return {ok:false,codigo:error.codigo || "ALMACEN_NO_DISPONIBLE",mensaje:error.codigo ? error.message : "No se pudieron leer o guardar los datos. No se ha confirmado ningún cambio.",campos:error.campos || {}}; }
}
function etiquetaRevision(estado, femenino = false) {
  return {pendiente:"Pendiente",aprobado:femenino?"Aprobada":"Aprobado",rechazado:femenino?"Rechazada":"Rechazado"}[estado] || "Pendiente";
}
function fechaRevision(iso) { return new Date(iso).toLocaleString(CONFIG_PORTAL.locale,{timeZone:CONFIG_PORTAL.zonaHoraria,dateStyle:"medium",timeStyle:"short"}); }
