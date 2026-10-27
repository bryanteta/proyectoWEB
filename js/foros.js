document.addEventListener("DOMContentLoaded",()=>{
  const lista = document.getElementById("listaTemas"), propias = document.getElementById("misTemasForo"), categorias = document.getElementById("listaCategorias"), buscar = document.getElementById("buscarTema"), form = document.getElementById("formTema"), panel = document.getElementById("panelNuevoTema");
  let categoria = "", correccion = null, publicos = [], mios = [];
  const modal = new bootstrap.Modal(document.getElementById("modalHilo"));
  function pintar() {
    const visibles = ejecutarFlujo(()=>flujos.temasPublicos()), personales = ejecutarFlujo(()=>flujos.misTemas());
    if (!visibles.ok || !personales.ok) { lista.textContent = visibles.mensaje || personales.mensaje; return; }
    publicos = [...visibles.dato,...TEMAS_FORO.map(t=>({...t,estado:"aprobado"}))]; mios = personales.dato;
    const texto = buscar.value.trim().toLowerCase();
    const filtrados = publicos.filter(t=>(!categoria || t.categoria===categoria) && `${t.titulo} ${t.autor}`.toLowerCase().includes(texto)).sort((a,b)=>Number(b.fijado)-Number(a.fijado));
    document.getElementById("totalTemasPublicos").textContent = `${publicos.length} temas publicados`;
    document.getElementById("totalRespuestasPublicas").textContent = `${publicos.reduce((n,t)=>n+(t.respuestas||0),0)} respuestas de ejemplo`;
    document.getElementById("contadorTemas").textContent = `${filtrados.length} temas publicados`;
    document.getElementById("conteoTodos").textContent = publicos.length;
    categorias.querySelectorAll("[data-cat]").forEach(b=>{const c=b.querySelector(".contador");if(c)c.textContent=b.dataset.cat?publicos.filter(t=>t.categoria===b.dataset.cat).length:publicos.length;});
    lista.innerHTML = filtrados.map(t=>`<article class="tema"><span class="avatar" aria-hidden="true">${escaparHTML(t.iniciales)}</span><div><h3><a href="#" data-leer-tema="${escaparHTML(t.id)}">${escaparHTML(t.titulo)}</a> ${t.fijado?'<span class="etiqueta-chip acento">Fijado</span>':""}</h3><p class="tema-meta"><span>${escaparHTML(t.autor)}</span><span>${escaparHTML(t.categoria)}</span><span>${t.revisada ? "Aprobado: "+fechaRevision(t.revisada) : escaparHTML(t.ultimo)}</span></p></div><div class="tema-cifras"><div><strong>${t.respuestas || 0}</strong><span>respuestas</span></div><div><strong>${t.vistas || 0}</strong><span>vistas</span></div></div></article>`).join("") || '<p class="vacio">No hay temas publicados que coincidan.</p>';
    document.getElementById("seccionMisTemas").hidden = !sesionDatos();
    propias.innerHTML = mios.map(t=>`<article class="panel mb-3"><div class="panel-cuerpo"><h3>${escaparHTML(t.titulo)}</h3><p><span class="etiqueta-chip ${t.estado==="aprobado"?"verde":"ambar"}">${etiquetaRevision(t.estado)}</span> · ${fechaRevision(t.actualizada)}</p>${t.motivo?`<p class="revision-texto">Motivo: ${escaparHTML(t.motivo)}</p>`:""}<div class="d-flex gap-2 flex-wrap"><button class="btn btn-linea btn-sm" type="button" data-leer-propio="${escaparHTML(t.id)}">Ver mi envío</button>${t.estado==="rechazado"?`<button class="btn btn-bermellon btn-sm" type="button" data-corregir-tema="${escaparHTML(t.id)}">Corregir y reenviar</button>`:t.estado==="pendiente"?'<span class="datos">No es visible públicamente.</span>':""}</div></div></article>`).join("") || '<p>Todavía no has enviado temas a revisión.</p>';
  }
  function limpiar() { correccion=null;form.reset();document.getElementById("tituloFormularioTema").textContent="Enviar un tema a revisión";document.getElementById("errorTema").hidden=true; }
  document.getElementById("btnNuevoTema").addEventListener("click",()=>{
    if (!sesionDatos()) {location.href="./login.html?destino=foros.html&motivo=sin_sesion";return;}
    limpiar();panel.hidden=false;document.getElementById("fTitulo").focus();
  });
  document.getElementById("btnCancelarTema").addEventListener("click",()=>{limpiar();panel.hidden=true;});
  buscar.addEventListener("input",pintar);
  categorias.addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;categoria=b.dataset.cat;categorias.querySelectorAll("button").forEach(x=>x.classList.toggle("activo",x===b));pintar();});
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const datos={titulo:document.getElementById("fTitulo").value,categoria:document.getElementById("fCategoria").value,mensaje:document.getElementById("fMensaje").value};
    const resultado=ejecutarFlujo(()=>correccion?flujos.corregir("tema",correccion.id,correccion.version,datos):flujos.enviarTema(datos));
    const error=document.getElementById("errorTema");
    form.querySelectorAll('[aria-invalid="true"]').forEach(c=>c.removeAttribute("aria-invalid"));
    if(!resultado.ok){error.hidden=false;error.textContent=resultado.mensaje+" "+Object.entries(resultado.campos).map(([k,v])=>`${{titulo:"Título",mensaje:"Mensaje",categoria:"Categoría"}[k]}: ${v}`).join(" ");Object.keys(resultado.campos).forEach(k=>document.getElementById({titulo:"fTitulo",mensaje:"fMensaje",categoria:"fCategoria"}[k])?.setAttribute("aria-invalid","true"));error.focus();return;}
    limpiar();panel.hidden=true;pintar();avisar("Tema enviado a moderación. Se publicará cuando administración lo apruebe.","exito");propias.scrollIntoView({block:"start"});
  });
  document.getElementById("contenido").addEventListener("click",e=>{
    const corregir=e.target.closest("[data-corregir-tema]");
    if(corregir){correccion=mios.find(t=>String(t.id)===corregir.dataset.corregirTema);if(!correccion)return;document.getElementById("fTitulo").value=correccion.titulo;document.getElementById("fCategoria").value=correccion.categoria;document.getElementById("fMensaje").value=correccion.mensaje;document.getElementById("tituloFormularioTema").textContent="Corregir tema rechazado";panel.hidden=false;panel.scrollIntoView({block:"start"});return;}
    const enlace=e.target.closest("[data-leer-tema], [data-leer-propio]");if(!enlace)return;e.preventDefault();
    // El detalle solo resuelve temas públicos o envíos del usuario actual.
    const id=enlace.dataset.leerTema||enlace.dataset.leerPropio,t=[...publicos,...mios].find(x=>String(x.id)===id);if(!t)return;
    document.getElementById("tituloHilo").textContent=t.titulo;document.getElementById("autorHilo").textContent=`${t.autor} · ${t.categoria}`;document.getElementById("mensajeHilo").textContent=t.mensaje||"Tema de demostración: no se conserva el mensaje original.";modal.show();
  });
  pintar();
});
