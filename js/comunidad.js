/* Temas editoriales de administración y comentarios con publicación automática. */
function temasDeComunidad(administracion=false) {
  const vista=flujos.vistaForo(), registros=administracion ? flujos.colaTemas() : vista.publicos;
  return [...registros,...TEMAS_EDITORIALES_BASE.filter(t=>!vista.basesModificadas.includes(t.id))];
}
function comentariosDeTema(id) {
  if(!temasDeComunidad().some(t=>t.id===id)) return [];
  return leerLista("pt_comentarios_foro").filter(c=>c && c.temaId===id && !c.eliminado && typeof c.texto==="string").map(c=>({...c,texto:censurarComentario(c.texto)}));
}
function publicarComentario(id,texto) {
  const sesion=sesionDatos();
  if(!sesion) return {ok:false,mensaje:"Inicia sesión para comentar."};
  const tema=temasDeComunidad().find(t=>t.id===id);
  if(!tema || tema.comentariosAbiertos===false) return {ok:false,mensaje:"Este tema no admite comentarios."};
  if(typeof texto!=="string" || texto.trim().length<3 || texto.trim().length>2000) return {ok:false,mensaje:"Escribe entre 3 y 2000 caracteres."};
  const limpio=censurarComentario(texto.trim()), todos=leerLista("pt_comentarios_foro");
  const ultimo=todos.find(c=>c && c.usuario===sesion.usuario && c.temaId===id && !c.eliminado);
  if(ultimo && (ultimo.texto===limpio || Date.now()-new Date(ultimo.fecha).getTime()<15000)) return {ok:false,mensaje:"Evita comentarios repetidos. Espera unos segundos antes de enviar otro."};
  const comentario={id:crypto.randomUUID(),temaId:id,usuario:sesion.usuario,autor:sesion.rol==="candidato" ? leerPerfil().fNombres || sesion.nombre : sesion.nombre,texto:limpio,fecha:new Date().toISOString()};
  if(!escribirAlmacen("pt_comentarios_foro",[comentario,...todos]))return {ok:false,mensaje:"No se pudo guardar el comentario. Tu texto se conserva en el formulario."};
  return {ok:true,dato:comentario};
}
function retirarComentario(id) {
  const sesion=sesionDatos(),todos=leerLista("pt_comentarios_foro"), comentario=todos.find(c=>c?.id===id);
  if(!sesion || !comentario || comentario.eliminado || !(sesion.rol==="administrador" || sesion.usuario===comentario.usuario)) return false;
  comentario.eliminado=true;comentario.texto="Comentario retirado";comentario.retiradoPor=sesion.usuario;
  return escribirAlmacen("pt_comentarios_foro",todos);
}

function resumenDeComunidad(administracion=false){
 const vista=flujos.vistaForo(),registros=administracion?flujos.colaTemas():vista.publicos;
 const temas=[...registros,...TEMAS_EDITORIALES_BASE.filter(t=>!vista.basesModificadas.includes(t.id))], conteos={};
 for(const c of leerLista('pt_comentarios_foro'))if(c&&!c.eliminado&&typeof c.texto==='string')conteos[c.temaId]=(conteos[c.temaId]||0)+1;
 return {temas,conteos};
}
function paginaComentariosTema(id,pagina=1,orden='recientes'){
 if(!temasDeComunidad().some(t=>t.id===id))return {items:[],total:0,pagina:1,paginas:1};
 const lista=leerLista('pt_comentarios_foro').filter(c=>c&&c.temaId===id&&!c.eliminado&&typeof c.texto==='string');
 lista.sort((a,b)=>{const fecha=String(a.fecha).localeCompare(String(b.fecha));const desempate=fecha||String(a.id).localeCompare(String(b.id));return orden==='antiguos'?desempate:-desempate;});
 const paginas=Math.max(1,Math.ceil(lista.length/10)),actual=Math.max(1,Math.min(paginas,Number.isSafeInteger(pagina)?pagina:1));
 return {items:lista.slice((actual-1)*10,actual*10).map(c=>({...c,texto:censurarComentario(c.texto)})),total:lista.length,pagina:actual,paginas};
}
