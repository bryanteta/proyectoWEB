/* Las colas comparten decisiones, versiones y auditoría con el registro y foro. */
const estadoColas = { tema:{pagina:1}, empresa:{pagina:1} };
function pintarColaRevision(tipo) {
  const empresa = tipo === "empresa", sufijo = empresa ? "Empresas" : "Foros";
  const lista = document.getElementById(empresa ? "listaSolicitudesEmpresa" : "listaModeracion");
  if (!lista) return;
  const resultado = ejecutarFlujo(()=>empresa ? flujos.colaEmpresas() : flujos.colaTemas());
  if (!resultado.ok) { lista.textContent = resultado.mensaje; return; }
  const todos = resultado.dato, filtro = document.getElementById("estadoRevision"+sufijo)?.value || "pendiente";
  const busqueda = (document.getElementById("buscarRevision"+sufijo)?.value || "").trim().toLowerCase();
  const filtrados = todos.filter(x=>(filtro === "todos" || x.estado === filtro) && (!busqueda || (empresa ? `${x.datos.nombreComercial} ${x.datos.razonSocial} ${x.datos.identificacionFiscal} ${x.usuario}` : `${x.titulo} ${x.autor} ${x.categoria}`).toLowerCase().includes(busqueda)));
  const cola = estadoColas[tipo], paginas = Math.max(1,Math.ceil(filtrados.length/10)); cola.pagina = Math.min(cola.pagina,paginas);
  const campo = (nombre,valor) => `<div><dt>${nombre}</dt><dd class="revision-texto">${escaparHTML(valor || "No indicado")}</dd></div>`;
  lista.innerHTML = filtrados.slice((cola.pagina-1)*10,cola.pagina*10).map(item=>{
    const titulo = empresa ? item.datos.nombreComercial : item.titulo;
    const historial = ejecutarFlujo(()=>flujos.auditoria(tipo,item.id));
    return `<article class="panel mb-3" data-revision-id="${escaparHTML(item.id)}">
      <div class="panel-cabecera"><h3>${escaparHTML(titulo)}</h3><span class="etiqueta-chip ${item.estado === "aprobado" ? "verde" : "ambar"}">${etiquetaRevision(item.estado,empresa)}</span></div>
      <div class="panel-cuerpo"><p class="datos">Cuenta: ${escaparHTML(item.usuario)} · ${fechaRevision(item.creada)} · Versión ${item.version}</p>
      ${empresa ? `<details><summary>Ver datos de registro y contacto</summary><dl class="revision-datos mt-3">${[["Razón social",item.datos.razonSocial],["Identificación fiscal",item.datos.identificacionFiscal],["País",item.datos.pais],["Sector",item.datos.sector],["Tamaño",item.datos.tamano],["Ciudad",item.datos.ciudad],["Dirección",item.datos.direccion],["Actividad",item.datos.descripcion],["Sitio web",item.datos.sitioWeb],["Responsable",item.datos.contactoNombre],["Cargo",item.datos.contactoCargo],["Correo",item.datos.contactoCorreo],["Teléfono",item.datos.contactoTelefono]].map(([n,v])=>campo(n,v)).join("")}</dl><p>La declaración de representación fue confirmada por el solicitante. Revisa los datos antes de aprobar.</p></details>` : `<p class="datos">Categoría: ${escaparHTML(item.categoria)}</p><p class="revision-texto">${escaparHTML(item.mensaje || "Sin mensaje original: solicita una corrección antes de publicar.")}</p>`}
      ${item.motivo ? `<p class="revision-texto">Motivo: ${escaparHTML(item.motivo)}</p>` : ""}
      ${item.estado === "pendiente" ? `<label class="form-label mt-3" for="motivo-${escaparHTML(item.id)}">Observación de revisión (obligatoria al rechazar)</label><textarea class="form-control mb-3" id="motivo-${escaparHTML(item.id)}" maxlength="1000" rows="2" data-motivo></textarea><div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-bermellon" data-decidir="aprobar" data-tipo="${tipo}" data-id="${escaparHTML(item.id)}" data-version="${item.version}">Aprobar ${empresa ? "empresa" : "tema"}</button><button type="button" class="btn btn-linea" data-decidir="rechazar" data-tipo="${tipo}" data-id="${escaparHTML(item.id)}" data-version="${item.version}">Rechazar ${empresa ? "empresa" : "tema"}</button></div><p class="mt-2" data-error-revision role="alert"></p>` : `<p class="datos">Revisado por ${escaparHTML(item.revisadaPor)} · ${fechaRevision(item.revisada)}</p>`}
      <details class="mt-3"><summary>Historial de revisión</summary><ol>${historial.ok ? historial.dato.map(a=>`<li>${fechaRevision(a.fecha)} · ${escaparHTML(a.actor)} · ${escaparHTML(a.accion)} · v${a.version}${a.motivo ? ': '+escaparHTML(a.motivo) : ""}</li>`).join("") : ""}</ol></details>
      </div></article>`;
  }).join("") || '<div class="vacio"><h3>Sin solicitudes en esta vista</h3><p>Cambia el filtro para consultar otras revisiones.</p></div>';
  const pendientes = todos.filter(x=>x.estado === "pendiente").length;
  const contador = document.getElementById(empresa ? "contadorSolicitudesEmpresa" : "contadorModeracion");
  if (contador) contador.textContent = `${pendientes} pendientes`;
  const pagina = document.getElementById("paginacionRevision"+sufijo);
  if (pagina) pagina.innerHTML = paginas > 1 ? `<button class="btn btn-linea" data-cola="${tipo}" data-pagina-cola="${cola.pagina-1}" ${cola.pagina===1?"disabled":""}>Anterior</button> <span>Página ${cola.pagina} de ${paginas}</span> <button class="btn btn-linea" data-cola="${tipo}" data-pagina-cola="${cola.pagina+1}" ${cola.pagina===paginas?"disabled":""}>Siguiente</button>` : "";
}
function pintarSolicitudesEmpresa() { pintarColaRevision("empresa"); }
function pintarColaTemas() { pintarColaRevision("tema"); }
document.addEventListener("DOMContentLoaded",()=>{
  for (const [tipo,sufijo] of [["tema","Foros"],["empresa","Empresas"]]) {
    ["estadoRevision","buscarRevision"].forEach(prefijo=>document.getElementById(prefijo+sufijo)?.addEventListener(prefijo === "estadoRevision" ? "change":"input",()=>{estadoColas[tipo].pagina=1;pintarColaRevision(tipo);}));
  }
  document.getElementById("contenido").addEventListener("click",evento=>{
    const pagina = evento.target.closest("[data-pagina-cola]");
    if (pagina) {estadoColas[pagina.dataset.cola].pagina=Number(pagina.dataset.paginaCola);pintarColaRevision(pagina.dataset.cola);return;}
    const boton = evento.target.closest("[data-decidir]"); if (!boton) return;
    const tarjeta = boton.closest("[data-revision-id]"), motivo = tarjeta.querySelector("[data-motivo]").value;
    const resultado = ejecutarFlujo(()=>flujos.decidir(boton.dataset.tipo,boton.dataset.id,Number(boton.dataset.version),boton.dataset.decidir,motivo));
    if (!resultado.ok) { tarjeta.querySelector("[data-error-revision]").textContent=resultado.mensaje; if(resultado.campos.motivo) tarjeta.querySelector("[data-motivo]").focus(); return; }
    pintarColaRevision(boton.dataset.tipo);
    pintarActividad();
    if (boton.dataset.tipo === "empresa" && boton.dataset.decidir === "aprobar") {
      // Una recarga hidrata empresa, membresía y sesión desde el mismo registro aprobado.
      window.location.reload(); return;
    }
    avisar(boton.dataset.decidir === "aprobar" ? "Aprobado. Ya está disponible públicamente." : "Rechazado. El autor puede consultar el motivo y corregirlo.","exito");
  });
});
