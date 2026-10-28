document.addEventListener("DOMContentLoaded", () => {
  document.title = "Registrar empresa — Portal de Trabajo";
  const form = document.getElementById("formRegistroEmpresa"), lista = document.getElementById("listaSolicitudesPropias"), resumen = document.getElementById("erroresRegistro");
  const sesion = sesionDatos(); let correccion = null;
  const ciudades=document.createElement("datalist"); ciudades.id="ciudadesRegistroSV";
  CONFIG_PORTAL.ciudades.forEach(ciudad=>{const opcion=document.createElement("option");opcion.value=ciudad;ciudades.append(opcion);});
  form.append(ciudades); document.getElementById("ciudad").setAttribute("list",ciudades.id);
  document.getElementById("sector").innerHTML = '<option value="">Seleccionar sector</option>' + flujos.sectores.map(s=>`<option>${escaparHTML(s)}</option>`).join("");
  document.getElementById("registroAcceso").hidden = !!sesion;
  form.hidden = !sesion || !!sesion.empresaId || sesion.rol === "administrador";
  if (sesion) { document.getElementById("contactoNombre").value = sesion.nombre; document.getElementById("contactoCorreo").value = sesion.correo; }
  function pintar() {
    if (!sesion) { document.getElementById("estadoRegistro").hidden = true; return; }
    const resultado = ejecutarFlujo(()=>flujos.misSolicitudes());
    if (!resultado.ok) { lista.textContent = resultado.mensaje; form.hidden = true; return; }
    const items = resultado.dato;
    const hayPendiente = items.some(s=>s.estado === "pendiente");
    const puedeSolicitar = !sesion.empresaId && sesion.rol !== "administrador" && !hayPendiente && !items.some(s=>s.estado === "aprobado");
    lista.innerHTML = items.map(s=>`<article class="mb-4"><h3>${escaparHTML(s.datos.nombreComercial)}</h3><p><span class="etiqueta-chip ${s.estado === "aprobado" ? "verde" : "ambar"}">${etiquetaRevision(s.estado,true)}</span> · ${fechaRevision(s.actualizada)}</p><p class="datos">Solicitud ${escaparHTML(s.id)}</p>${s.motivo ? `<p class="revision-texto">Motivo: ${escaparHTML(s.motivo)}</p>` : ""}${s.estado === "rechazado" && puedeSolicitar ? `<button class="btn btn-linea" type="button" data-corregir="${escaparHTML(s.id)}">Corregir y reenviar</button>` : s.estado === "aprobado" ? '<a class="btn btn-bermellon" href="./empresas.html">Ir al módulo empresarial</a>' : '<p>La empresa todavía no está habilitada para publicar vacantes.</p>'}</article>`).join("") || (sesion.empresaId ? '<p>Tu empresa ya está habilitada. <a href="./empresas.html">Abrir módulo empresarial</a></p>' : sesion.rol === "administrador" ? '<a href="./admin.html#empresas">Revisar solicitudes en administración</a>' : '<p>Aún no has enviado una solicitud.</p>');
    form.hidden = !puedeSolicitar;
  }
  function errores(resultado) {
    form.querySelectorAll('[aria-invalid="true"]').forEach(c=>c.removeAttribute("aria-invalid"));
    resumen.hidden = false; resumen.textContent = resultado.mensaje;
    const ul = document.createElement("ul");
    Object.entries(resultado.campos || {}).forEach(([campo,texto])=>{
      const input = form.elements.namedItem(campo); if (input) input.setAttribute("aria-invalid","true");
      const li = document.createElement("li"), enlace = document.createElement("a"); enlace.href = "#"+campo; enlace.textContent = `${document.querySelector(`label[for="${campo}"]`)?.textContent || campo}: ${texto}`; li.append(enlace); ul.append(li);
    });
    resumen.append(ul); resumen.focus();
  }
  form.addEventListener("submit",evento=>{
    evento.preventDefault(); const datos = Object.fromEntries(new FormData(form)); datos.declaracion = document.getElementById("declaracion").checked;
    const resultado = ejecutarFlujo(()=>correccion ? flujos.corregir("empresa",correccion.id,correccion.version,datos) : flujos.enviarSolicitud(datos));
    if (!resultado.ok) { errores(resultado); return; }
    limpiarCorreccion(); form.hidden = true; pintar(); avisar("Solicitud enviada. Queda pendiente de revisión.","exito"); lista.scrollIntoView({block:"start"});
  });
  lista.addEventListener("click",evento=>{
    const boton = evento.target.closest("[data-corregir]"); if (!boton) return;
    const resultado = ejecutarFlujo(()=>flujos.misSolicitudes()); if (!resultado.ok) { avisar(resultado.mensaje); return; }
    correccion = resultado.dato.find(s=>s.id === boton.dataset.corregir); if (!correccion) return;
    Object.entries(correccion.datos).forEach(([k,v])=>{ const campo = form.elements.namedItem(k); if(campo && campo.type !== "checkbox") campo.value = k === "pais" ? CONFIG_PORTAL.pais : v; });
    document.getElementById("declaracion").checked = false; document.getElementById("tituloRegistro").textContent = "Corregir solicitud rechazada";
    document.getElementById("cancelarCorreccion").hidden = false; resumen.hidden = true; form.hidden = false; form.scrollIntoView({block:"start"});
  });
  function limpiarCorreccion() {
    correccion = null; form.reset(); resumen.hidden = true;
    form.querySelectorAll('[aria-invalid="true"]').forEach(c=>c.removeAttribute("aria-invalid"));
    document.getElementById("tituloRegistro").textContent = "Datos para revisión";
    document.getElementById("cancelarCorreccion").hidden = true;
    document.getElementById("contactoNombre").value = sesion?.nombre || "";
    document.getElementById("contactoCorreo").value = sesion?.correo || "";
  }
  document.getElementById("cancelarCorreccion").addEventListener("click",()=>{limpiarCorreccion();pintar();});
  form.addEventListener("input",e=>e.target.removeAttribute("aria-invalid"));
  pintar();
});
