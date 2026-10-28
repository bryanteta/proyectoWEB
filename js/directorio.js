/* Consulta pública: las decisiones administrativas se realizan en admin.html. */
const filtrosDirectorio = () => ({
  texto:document.getElementById("textoDirectorio").value,
  ciudad:document.getElementById("ciudadDirectorio").value,
  sector:document.getElementById("sectorDirectorio").value,
  abiertas:document.getElementById("conOfertasDirectorio").checked
});
function filtrarEmpresasPublicas(filtros) {
  const normalizar = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return empresasPublicas().filter(e => (!filtros.sector || e.rubro === filtros.sector)
    && (!filtros.ciudad || e.ciudad === filtros.ciudad)
    && (!filtros.abiertas || ofertasPublicasDeEmpresa(e.id).length)
    && normalizar([e.nombre,e.rubro,e.ciudad,e.descripcion].join(" ")).includes(normalizar(filtros.texto)));
}
function pintarEmpresasPublicas() {
  const filtros=filtrosDirectorio(), empresas=filtrarEmpresasPublicas(filtros);
  document.getElementById("totalDirectorio").textContent=`${empresas.length} ${empresas.length===1 ? "empresa encontrada" : "empresas encontradas"}`;
  document.getElementById("empresasPublicas").innerHTML=empresas.map(e=>{
    const ofertas=ofertasPublicasDeEmpresa(e.id);
    return `<div class="col-md-6 col-lg-4"><article class="tarjeta tarjeta-estatica emp-empresa h-100">
      <div class="emp-empresa-cab"><span class="marca-empresa" aria-hidden="true">${escaparHTML(e.iniciales)}</span><div><h2 class="fs-5">${escaparHTML(e.nombre)}</h2><p class="datos">${escaparHTML(e.rubro)}</p></div></div>
      <p>${escaparHTML(e.ciudad)} · ${escaparHTML(e.tamano)}</p><p class="texto-suave">${escaparHTML((e.descripcion || "Organización aprobada en el portal.").slice(0,180))}</p>
      <p>${ofertas.length} ${ofertas.length===1 ? "oferta abierta" : "ofertas abiertas"} · ${e.resenas ? `${e.valoracion.toFixed(1)}/5 (${e.resenas} reseñas)` : "Sin reseñas"}</p>
      <div class="emp-empresa-pie"><button type="button" class="btn btn-bermellon btn-sm" data-ver-empresa="${e.id}">Ver empresa</button>${ofertas.length ? `<a class="btn btn-linea btn-sm" href="./busqueda.html?empresa=${e.id}">Ver ofertas</a>` : '<span class="datos">Sin vacantes abiertas</span>'}</div>
    </article></div>`;
  }).join("") || '<div class="vacio"><h2>Sin empresas que coincidan</h2><p>Prueba otros criterios o limpia los filtros.</p></div>';
  const params=new URLSearchParams();
  if (filtros.texto) params.set("texto",filtros.texto);
  if (filtros.ciudad) params.set("ciudad",filtros.ciudad);
  if (filtros.sector) params.set("sector",filtros.sector);
  if (filtros.abiertas) params.set("abiertas","1");
  const seleccion=new URLSearchParams(location.search).get("empresa"); if(seleccion)params.set("empresa",seleccion);
  history.replaceState(null,"",location.pathname+(params.size?"?"+params:""));
}
function abrirEmpresaPublica(id) {
  const empresa=empresasPublicas().find(e=>e.id===id);
  if (!empresa) {avisar("Esta empresa no está disponible en el directorio público.");return;}
  const ofertas=ofertasPublicasDeEmpresa(id), resenas=resenasDeEmpresa(id), modal=document.createElement("div");
  modal.className="modal";modal.tabIndex=-1;modal.setAttribute("aria-labelledby","tituloEmpresaPublica");
  modal.innerHTML=`<div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-4" id="tituloEmpresaPublica">${escaparHTML(empresa.nombre)}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body">
    <p>${escaparHTML(empresa.rubro)} · ${escaparHTML(empresa.ciudad)} · ${escaparHTML(empresa.tamano)}</p><p style="white-space:pre-wrap">${escaparHTML(empresa.descripcion || "Sin descripción adicional.")}</p>
    <h3 class="fs-5">Ofertas abiertas (${ofertas.length})</h3>${ofertas.length?`<ul>${ofertas.map(v=>`<li><a href="./vacante.html?id=${v.id}">${escaparHTML(v.titulo)}</a> · ${escaparHTML(v.ciudad)} · ${salarioFormateado(v.salario)}</li>`).join("")}</ul>`:'<p>Esta empresa no tiene ofertas abiertas en este momento.</p>'}
    <h3 class="fs-5 mt-4">Experiencias y valoraciones</h3><p>${resenas.length?`${empresa.valoracion.toFixed(1)}/5 · ${resenas.length} reseñas`:'Todavía no hay reseñas sobre esta empresa.'}</p>
    ${resenas.map(r=>`<article class="panel mb-3"><div class="panel-cuerpo"><p><strong>${escaparHTML(r.autor)}</strong> · ${r.nota}/5</p><p style="white-space:pre-wrap">${escaparHTML(r.texto)}</p></div></article>`).join("")}
    <p class="texto-suave">Ficha pública. Los datos fiscales y los contactos privados del registro no se muestran aquí.</p></div><div class="modal-footer"><button type="button" class="btn btn-linea" data-bs-dismiss="modal">Cerrar</button></div></div></div>`;
  document.body.append(modal);const instancia=new bootstrap.Modal(modal);
  const params=new URLSearchParams(location.search);params.set("empresa",id);history.replaceState(null,"","?"+params);
  modal.addEventListener("hidden.bs.modal",()=>{instancia.dispose();modal.remove();const params=new URLSearchParams(location.search);params.delete("empresa");history.replaceState(null,"",location.pathname+(params.size?"?"+params:""));});instancia.show();
}
document.addEventListener("DOMContentLoaded",()=>{
  const params=new URLSearchParams(location.search), empresas=empresasPublicas();
  for(const [id,clave] of [["sectorDirectorio","rubro"],["ciudadDirectorio","ciudad"]]) {
    const select=document.getElementById(id);
    [...new Set(empresas.map(e=>e[clave]))].sort((a,b)=>a.localeCompare(b,CONFIG_PORTAL.locale)).forEach(v=>select.add(new Option(v,v)));
  }
  document.getElementById("textoDirectorio").value=params.get("texto")||"";
  for(const [id,clave] of [["sectorDirectorio","sector"],["ciudadDirectorio","ciudad"]]) document.getElementById(id).value=params.get(clave)||"";
  document.getElementById("conOfertasDirectorio").checked=params.get("abiertas")==="1";
  for(const id of ["textoDirectorio","sectorDirectorio","ciudadDirectorio","conOfertasDirectorio"]) document.getElementById(id).addEventListener(id==="textoDirectorio"?"input":"change",pintarEmpresasPublicas);
  document.getElementById("limpiarDirectorio").addEventListener("click",()=>{document.getElementById("textoDirectorio").value="";document.getElementById("ciudadDirectorio").value="";document.getElementById("sectorDirectorio").value="";document.getElementById("conOfertasDirectorio").checked=false;pintarEmpresasPublicas();});
  document.getElementById("empresasPublicas").addEventListener("click",e=>{const b=e.target.closest("[data-ver-empresa]");if(b)abrirEmpresaPublica(Number(b.dataset.verEmpresa));});
  pintarEmpresasPublicas();if(params.has("empresa"))abrirEmpresaPublica(Number(params.get("empresa")));
});
