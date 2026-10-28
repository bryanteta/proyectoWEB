document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id), lista=$('listaTemas'),gestion=$('misTemasForo'),form=$('formTema'),panel=$('panelNuevoTema');
 const esAdmin=sesionDatos()?.rol==='administrador', modal=new bootstrap.Modal($('modalHilo'));
 let categoria='',editando=null,abierto=null,publicos=[],administrados=[],conteos={},paginaTemas=1,paginaGestion=1,paginaComentarios=1,urlImagen=null,lecturaMedia=0;
 $('paginasComentarios').before($('avisoComentario'),$('formComentario'));
 function paginar(items,pagina,tamano=10){const paginas=Math.max(1,Math.ceil(items.length/tamano)),actual=Math.max(1,Math.min(paginas,pagina));return {items:items.slice((actual-1)*tamano,actual*tamano),pagina:actual,paginas,total:items.length};}
 function controles(id,datos,tipo){$(id).innerHTML=datos.total>10?`<button class="btn btn-linea btn-sm" data-pagina-${tipo}="${datos.pagina-1}" ${datos.pagina===1?'disabled':''}>Anterior</button><span class="datos">Página ${datos.pagina} de ${datos.paginas} · ${datos.total} ${tipo==='comentarios'?'comentarios':'temas'}</span><button class="btn btn-linea btn-sm" data-pagina-${tipo}="${datos.pagina+1}" ${datos.pagina===datos.paginas?'disabled':''}>Siguiente</button>`:`<span class="datos">${datos.total} ${tipo==='comentarios'?'comentarios':'temas'}</span>`;}
 function errorForm(m){$('errorTema').textContent=m;$('errorTema').hidden=!m;}
 function pintar(){
  const r=ejecutarFlujo(()=>resumenDeComunidad(esAdmin));if(!r.ok){lista.textContent=r.mensaje;return;}
  administrados=esAdmin?r.dato.temas:[];publicos=r.dato.temas.filter(t=>t.estado==='aprobado'&&t.editorial===true);conteos=r.dato.conteos;
  const texto=$('buscarTema').value.trim().toLowerCase();
  const filtrados=publicos.filter(t=>(!categoria||t.categoria===categoria)&&`${t.titulo} ${t.autor}`.toLowerCase().includes(texto)).sort((a,b)=>Number(b.fijado)-Number(a.fijado)||String(b.actualizada||'').localeCompare(String(a.actualizada||'')));
  const pagina=paginar(filtrados,paginaTemas);paginaTemas=pagina.pagina;
  $('btnNuevoTema').hidden=!esAdmin;$('seccionMisTemas').hidden=!esAdmin;
  $('totalTemasPublicos').textContent=`${publicos.length} temas de administración`;
  const total=publicos.reduce((n,t)=>n+(conteos[t.id]||0),0);$('totalRespuestasPublicas').textContent=`${total} ${total===1?'comentario publicado':'comentarios publicados'}`;
  $('contadorTemas').textContent=`${filtrados.length} temas disponibles`;$('conteoTodos').textContent=publicos.length;
  $('listaCategorias').querySelectorAll('[data-cat]').forEach(b=>{const c=b.querySelector('.contador');if(c)c.textContent=b.dataset.cat?publicos.filter(t=>t.categoria===b.dataset.cat).length:publicos.length;});
  lista.innerHTML=pagina.items.map(t=>`<article class="tema"><span class="avatar" aria-hidden="true">PT</span><div><h3><a href="#tema=${encodeURIComponent(t.id)}" data-leer-tema="${escaparHTML(t.id)}">${escaparHTML(t.titulo)}</a> ${t.fijado?'<span class="etiqueta-chip acento">Fijado por administración</span>':''}</h3><p class="tema-meta"><span>${escaparHTML(t.autor)}</span><span>${escaparHTML(t.categoria)}</span>${t.imagen?'<span>Imagen</span>':''}${t.video?'<span>Video</span>':''}${t.comentariosAbiertos===false?'<span>Comentarios cerrados</span>':''}</p>${esAdmin?`<div class="d-flex gap-2 flex-wrap"><button class="btn btn-linea btn-sm" data-accion-tema="fijar" data-tema="${escaparHTML(t.id)}">${t.fijado?'Desfijar':'Fijar'}</button><button class="btn btn-linea btn-sm" data-editar-tema="${escaparHTML(t.id)}">Editar tema</button></div>`:''}</div><div class="tema-cifras"><div><strong>${conteos[t.id]||0}</strong><span>comentarios</span></div></div></article>`).join('')||'<div class="vacio"><h3>Sin temas que coincidan</h3><p>Prueba otra categoría o búsqueda.</p></div>';
  controles('paginasTemas',pagina,'temas');
  if(esAdmin){const pag=paginar(administrados,paginaGestion);paginaGestion=pag.pagina;
   gestion.innerHTML=pag.items.map(t=>{const publicado=t.estado==='aprobado'&&t.editorial===true;return `<article class="panel mb-3"><div class="panel-cuerpo"><h3 class="fs-5">${escaparHTML(t.titulo)}</h3><p class="datos">${publicado?'Publicado':t.estado==='archivado'?'Archivado':'Registro anterior sin publicar'} · versión ${t.version}</p><div class="d-flex gap-2 flex-wrap"><button class="btn btn-linea btn-sm" data-editar-tema="${escaparHTML(t.id)}">Editar</button><button class="btn btn-linea btn-sm" data-accion-tema="${publicado?'archivar':'publicar'}" data-tema="${escaparHTML(t.id)}">${publicado?'Archivar':'Publicar'}</button><button class="btn btn-linea btn-sm" data-accion-tema="fijar" data-tema="${escaparHTML(t.id)}">${t.fijado?'Desfijar':'Fijar'}</button><button class="btn btn-linea btn-sm" data-accion-tema="comentarios" data-tema="${escaparHTML(t.id)}">${t.comentariosAbiertos===false?'Abrir comentarios':'Cerrar comentarios'}</button></div></div></article>`;}).join('');controles('paginasGestionTemas',pag,'gestion');
  }
 }
 function estadoImagen(){const actual=editando?.imagen;$('imagenActualTema').textContent=actual?'Hay una imagen adjunta. Se conservará si no eliges otra ni marcas quitar.':'Sin imagen adjunta.';$('quitarImagenTema').disabled=!actual;}
 function limpiar(){editando=null;form.reset();errorForm('');$('tituloFormularioTema').textContent='Publicar un tema';estadoImagen();}
 $('btnNuevoTema').addEventListener('click',()=>{if(!esAdmin)return;limpiar();panel.hidden=false;$('fTitulo').focus();});
 $('btnCancelarTema').addEventListener('click',()=>{limpiar();panel.hidden=true;});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!esAdmin||!form.reportValidity())return;
  const actor=sesionDatos()?.usuario,boton=form.querySelector('[type="submit"]');let nuevaImagen=null;
  const archivo=$('fImagenTema').files[0],alt=$('fImagenAlt').value.trim();
  if((archivo||editando?.imagen&&!$('quitarImagenTema').checked)&&alt.length<3){errorForm('Describe la imagen con al menos 3 caracteres.');return;}
  boton.disabled=true;errorForm('');
  try{
   let imagen=$('quitarImagenTema').checked?null:editando?.imagen?{...editando.imagen,alt}:null;
   if(archivo){nuevaImagen=await guardarImagenForo(archivo);imagen={id:nuevaImagen,alt};}
   if(sesionDatos()?.usuario!==actor||sesionDatos()?.rol!=='administrador')throw Error('La sesión cambió. Vuelve a abrir el formulario.');
   const datos={titulo:$('fTitulo').value,categoria:$('fCategoria').value,mensaje:$('fMensaje').value,imagen,video:$('fVideoTema').value.trim()};
   const r=ejecutarFlujo(()=>editando?flujos.editarTema(editando.id,editando.version,datos):flujos.enviarTema(datos));
   if(!r.ok)throw Error(r.mensaje+' '+Object.values(r.campos||{}).join(' '));
   limpiar();panel.hidden=true;paginaTemas=1;pintar();avisar('Tema guardado. Los temas publicados están disponibles en el foro.','exito');
  }catch(err){if(nuevaImagen)await descartarImagenForo(nuevaImagen).catch(()=>{});errorForm(err.message||'No se pudo guardar el tema.');}finally{boton.disabled=false;}
 });
 $('buscarTema').addEventListener('input',()=>{paginaTemas=1;pintar();});
 $('listaCategorias').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;categoria=b.dataset.cat;paginaTemas=1;$('listaCategorias').querySelectorAll('button').forEach(x=>x.classList.toggle('activo',x===b));pintar();});
 function pintarComentarios(){
  const tema=publicos.find(t=>t.id===abierto);if(!tema)return;
  const resultado=ejecutarFlujo(()=>paginaComentariosTema(abierto,paginaComentarios,$('ordenComentarios').value));if(!resultado.ok){$('comentariosHilo').textContent=resultado.mensaje;return;}
  const datos=resultado.dato,s=sesionDatos();paginaComentarios=datos.pagina;$('tituloComentarios').textContent=`Comentarios (${datos.total})`;
  controles('paginasComentarios',datos,'comentarios');
  $('comentariosHilo').innerHTML=datos.items.map(c=>`<article class="panel foro-comentario mb-3"><div class="panel-cuerpo"><p><strong>${escaparHTML(c.autor)}</strong> · ${escaparHTML(fechaRevision(c.fecha))}</p>${c.texto.length>400?`<p class="revision-texto">${escaparHTML(c.texto.slice(0,280))}…</p><details><summary>Leer comentario completo</summary><p class="revision-texto mt-2">${escaparHTML(c.texto)}</p></details>`:`<p class="revision-texto">${escaparHTML(c.texto)}</p>`}${s&&(esAdmin||s.usuario===c.usuario)?`<button class="btn btn-linea btn-sm" data-retirar-comentario="${escaparHTML(c.id)}">Retirar comentario</button>`:''}</div></article>`).join('')||'<p class="texto-suave">Todavía no hay comentarios. Puedes iniciar la conversación.</p>';
  $('formComentario').hidden=!s||tema.comentariosAbiertos===false;
  $('avisoComentario').textContent=tema.comentariosAbiertos===false?'Administración cerró los comentarios de este tema.':!s?'Inicia sesión para comentar.':'Se publican directamente y las palabras del filtro se sustituyen por ***. Máximo 2000 caracteres.';
 }
 async function mostrarMedia(tema){
  const lectura=++lecturaMedia;if(urlImagen){URL.revokeObjectURL(urlImagen);urlImagen=null;}$('mediaHilo').replaceChildren();
  if(tema.imagen){const figura=document.createElement('figure'),estado=document.createElement('p');estado.textContent='Cargando imagen…';figura.append(estado);$('mediaHilo').append(figura);
   try{const blob=await leerImagenForo(tema.imagen.id);if(lectura!==lecturaMedia)return;if(!blob)throw Error();urlImagen=URL.createObjectURL(blob);const img=document.createElement('img');img.src=urlImagen;img.alt=tema.imagen.alt||'Imagen del tema';img.className='foro-imagen';figura.replaceChildren(img);const pie=document.createElement('figcaption');pie.textContent=img.alt;figura.append(pie);}catch{if(lectura===lecturaMedia)estado.textContent='La imagen no está disponible en este navegador.';}
  }
  const v=tema.video,seguro=v&&((v.proveedor==='youtube'&&/^[a-zA-Z0-9_-]{11}$/.test(v.id))||(v.proveedor==='vimeo'&&/^\d{5,12}$/.test(v.id)));
  if(seguro&&lectura===lecturaMedia){const zona=document.createElement('div');zona.className='foro-video';const boton=document.createElement('button');boton.type='button';boton.className='btn btn-linea';boton.textContent=`Reproducir video de ${v.proveedor==='youtube'?'YouTube':'Vimeo'}`;
   const ayuda=document.createElement('p');ayuda.className='texto-suave small';ayuda.textContent='Al reproducir se carga contenido del proveedor externo.';zona.append(boton,ayuda);$('mediaHilo').append(zona);
   boton.addEventListener('click',()=>{const iframe=document.createElement('iframe');iframe.src=v.proveedor==='youtube'?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}`:`https://player.vimeo.com/video/${encodeURIComponent(v.id)}`;iframe.title='Video del tema';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');zona.replaceChildren(iframe);});
  }
 }
 function abrirTema(id){const tema=publicos.find(t=>t.id===id);if(!tema){avisar('Este tema no está publicado.');return;}abierto=id;paginaComentarios=1;$('ordenComentarios').value='recientes';$('tituloHilo').textContent=tema.titulo;$('autorHilo').textContent=`${tema.autor} · ${tema.categoria}`;$('mensajeHilo').textContent=tema.mensaje;$('formComentario').reset();$('errorComentario').textContent='';pintarComentarios();mostrarMedia(tema);history.replaceState(null,'','#tema='+encodeURIComponent(id));modal.show();}
 $('modalHilo').addEventListener('hidden.bs.modal',()=>{lecturaMedia++;if(urlImagen)URL.revokeObjectURL(urlImagen);urlImagen=null;$('mediaHilo').replaceChildren();abierto=null;history.replaceState(null,'',location.pathname+location.search);});
 $('contenido').addEventListener('click',e=>{
  const pag=e.target.closest('[data-pagina-temas],[data-pagina-gestion]');if(pag){if(pag.dataset.paginaTemas)paginaTemas=Number(pag.dataset.paginaTemas);else paginaGestion=Number(pag.dataset.paginaGestion);pintar();return;}
  const editar=e.target.closest('[data-editar-tema]');if(editar&&esAdmin){editando=administrados.find(t=>t.id===editar.dataset.editarTema);if(!editando)return;form.reset();$('fTitulo').value=editando.titulo;$('fCategoria').value=editando.categoria;$('fMensaje').value=editando.mensaje;$('fImagenAlt').value=editando.imagen?.alt||'';$('fVideoTema').value=editando.video?.enlace||'';estadoImagen();errorForm('');$('tituloFormularioTema').textContent='Editar tema';panel.hidden=false;panel.scrollIntoView({block:'start'});return;}
  const accion=e.target.closest('[data-accion-tema]');if(accion&&esAdmin){const tema=administrados.find(t=>t.id===accion.dataset.tema);if(!tema)return;const r=ejecutarFlujo(()=>flujos.gestionarTema(tema.id,tema.version,accion.dataset.accionTema));if(!r.ok)avisar(r.mensaje);else if(accion.dataset.accionTema==='fijar')avisar(r.dato.fijado?'Tema fijado al principio del listado.':'Tema desfijado.','exito');pintar();return;}
  const link=e.target.closest('[data-leer-tema]');if(link){e.preventDefault();abrirTema(link.dataset.leerTema);}
 });
 $('ordenComentarios').addEventListener('change',()=>{paginaComentarios=1;pintarComentarios();});
 $('paginasComentarios').addEventListener('click',e=>{const b=e.target.closest('[data-pagina-comentarios]');if(b){paginaComentarios=Number(b.dataset.paginaComentarios);pintarComentarios();}});
 $('formComentario').addEventListener('submit',e=>{e.preventDefault();const campo=$('textoComentario'),r=ejecutarFlujo(()=>publicarComentario(abierto,campo.value)),resultado=r.ok?r.dato:r;
  if(!resultado.ok){$('errorComentario').textContent=resultado.mensaje;return;}campo.value='';$('errorComentario').textContent='';paginaComentarios=1;$('ordenComentarios').value='recientes';pintar();pintarComentarios();});
 $('comentariosHilo').addEventListener('click',e=>{const b=e.target.closest('[data-retirar-comentario]');if(b&&retirarComentario(b.dataset.retirarComentario)){pintar();pintarComentarios();}});
 pintar();const id=new URLSearchParams(location.hash.slice(1)).get('tema');if(id)abrirTema(id);
});
