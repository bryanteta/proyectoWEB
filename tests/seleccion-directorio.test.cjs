const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function portal(storage=new Map(),fail=false){
 const context=vm.createContext({document:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');storage.set(k,v);}}});
 vm.runInContext(fs.readFileSync('js/datos.js','utf8'),context);
 vm.runInContext(fs.readFileSync('js/directorio.js','utf8'),context);
 return {storage,run:s=>vm.runInContext(s,context),login:(rol,usuario=rol,empresaId=1)=>storage.set('pt_sesion',JSON.stringify({rol,usuario,empresaId,nombre:'Prueba'}))};
}
test('proceso completo conserva versión, historial y estado visible al candidato',()=>{
 const p=portal();p.login('candidato','ana');assert.equal(p.run('guardarPostulacion({vacanteId:101})'),true);p.login('empresa');
 for(const [version,estado] of ['En revisión','Preseleccionada','En entrevista','Seleccionada','Contratada'].entries()) {
  assert.equal(p.run(`actualizarEstadoCandidato(101,'ana',${JSON.stringify(estado)},'Mensaje de seguimiento',${version})`),true);
 }
 p.login('candidato','ana');assert.equal(p.run('estadoPostulacion(leerPostulaciones()[0])'),'Contratada');
 const next=portal(p.storage);assert.equal(next.run("seguimientoCandidatura(101,'ana').historial.length"),5);
 assert.equal(next.run("seguimientoCandidatura(101,'ana').historial[4].observacion"),'Mensaje de seguimiento');
 p.login('empresa');assert.equal(p.run("actualizarEstadoCandidato(101,'ana','Rechazada','Motivo suficientemente largo')"),false);
});
test('rechazo y reconsideración exigen motivo y no omiten selección',()=>{
 const p=portal();p.login('empresa');
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Seleccionada')"),false);
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Rechazada','corto')"),false);
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Rechazada','Requisitos pendientes para esta vacante')"),true);
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','En revisión')"),false);
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','En revisión','Se revisará la experiencia adicional')"),true);
});
test('una revisión desactualizada no sobrescribe una decisión posterior',()=>{
 const p=portal();p.login('empresa');assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','En revisión','',0)"),true);
 const before=p.storage.get('pt_candidatos_estado');
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Preseleccionada','',0)"),false);
 assert.equal(p.storage.get('pt_candidatos_estado'),before);
});
test('estados heredados se leen y evolucionan sin perder la candidatura',()=>{
 const p=portal(new Map([['pt_candidatos_estado',JSON.stringify({'101:demo-0':'Preseleccionada'})]]));p.login('empresa');
 assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Seleccionada','',0)"),true);
 assert.equal(p.run("seguimientoCandidatura(101,'demo-0').historial[0].anterior"),'Preseleccionada');
});
test('permisos por empresa, cuenta candidata y suspensión siguen vigentes',()=>{
 const p=portal();p.login('candidato');assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Preseleccionada')"),false);
 p.login('empresa','otra',2);assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Preseleccionada')"),false);
 p.login('administrador');p.run('suspenderEmpresa(1,true)');p.login('empresa');assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Preseleccionada')"),false);
});
test('fallo de escritura conserva estado e historial anteriores',()=>{
 const p=portal(new Map(),true);p.login('empresa');assert.equal(p.run("actualizarEstadoCandidato(101,'demo-0','Preseleccionada')"),false);
 assert.equal(p.run("seguimientoCandidatura(101,'demo-0').estado"),'Nueva');assert.equal(p.run("seguimientoCandidatura(101,'demo-0').historial.length"),0);
});
test('directorio excluye suspendidas y ofertas cerradas; búsqueda ignora acentos',()=>{
 const p=portal();assert.equal(p.run("filtrarEmpresasPublicas({texto:'cafe'}).length"),1);
 p.login('administrador');assert.equal(p.run('suspenderEmpresa(2,true)'),true);
 assert.equal(p.run("filtrarEmpresasPublicas({texto:'cafe'}).length"),0);
 p.login('empresa','estudio',3);p.run('cambiarEstadoVacante(103,"Cerrada");cambiarEstadoVacante(110,"Cerrada")');
 assert.equal(p.run("filtrarEmpresasPublicas({ciudad:'Santa Tecla',abiertas:true}).length"),0);
 assert.equal(p.run("filtrarEmpresasPublicas({ciudad:'Santa Tecla',abiertas:false}).length"),1);
});
test('publicaciones conservan el perfil enviado, no ediciones posteriores',()=>{
 const p=portal();p.login('candidato','ana');p.run("guardarPerfil({fAcerca:'Presentación original',fCiudad:'San Salvador'});guardarPostulacion({vacanteId:101});guardarPerfil({fAcerca:'Texto cambiado'})");
 assert.equal(p.run('leerPostulaciones()[0].presentacion'),'Presentación original');assert.equal(p.run('leerPostulaciones()[0].ciudad'),'San Salvador');
});
