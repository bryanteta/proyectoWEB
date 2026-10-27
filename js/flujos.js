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
const flujos = crearServicioFlujos({
  leer:leerEstadoFlujos, guardar:s=>escribirAlmacen(CLAVE_FLUJOS,s),
  actor:()=>sesionDatos(), nuevoId:()=>crypto.randomUUID(), ahora:()=>new Date().toISOString(), empresasBase:EMPRESAS
});
function ejecutarFlujo(accion) {
  try { return {ok:true,dato:accion()}; }
  catch (error) { return {ok:false,codigo:error.codigo || "ALMACEN_NO_DISPONIBLE",mensaje:error.codigo ? error.message : "No se pudieron leer o guardar los datos. No se ha confirmado ningún cambio.",campos:error.campos || {}}; }
}
function etiquetaRevision(estado, femenino = false) {
  return {pendiente:"Pendiente",aprobado:femenino?"Aprobada":"Aprobado",rechazado:femenino?"Rechazada":"Rechazado"}[estado] || "Pendiente";
}
function fechaRevision(iso) { return new Date(iso).toLocaleString("es",{dateStyle:"medium",timeStyle:"short"}); }
