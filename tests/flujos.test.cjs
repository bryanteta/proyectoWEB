const {test} = require('node:test');
const assert = require('node:assert/strict');
const {crearServicioFlujos} = require('../js/dominio-flujos.js');
const fs = require('node:fs'), vm = require('node:vm');
const solicitud = {razonSocial:'Servicios de Integración SA',nombreComercial:'Empresa QA',identificacionFiscal:'0614-123456-001-0',pais:'SV',ciudad:'San Salvador',direccion:'Avenida de pruebas número 123',sector:'Tecnología',tamano:'11–50',descripcion:'Empresa de desarrollo de software enfocada en servicios empresariales y pruebas de integración.',contactoNombre:'Responsable QA',contactoCargo:'Gerente',contactoCorreo:'qa@example.test',contactoTelefono:'+503 2222 0000',sitioWeb:'https://example.test',declaracion:true};
const tema = {titulo:'Consulta sobre entrevistas técnicas',categoria:'Tecnología',mensaje:'¿Cómo preparan las entrevistas técnicas para un puesto de desarrollo?'};
function entorno(cuentaActiva = () => true) {
 let s={schemaVersion:1,temas:[],solicitudes:[],empresas:[],miembros:[],auditoria:[]},u={usuario:'candidato',nombre:'Candidato Demo',rol:'solicitante'},contador=0,bloqueado=false;
 const f=crearServicioFlujos({cuentaActiva,leer:()=>structuredClone(s),guardar:n=>{if(bloqueado)return false;s=structuredClone(n);return true;},actor:()=>u,nuevoId:()=>`id-${++contador}`,ahora:()=> '2026-10-27T05:00:00Z',empresasBase:[{id:6}]});
 return {f,usuario:n=>u=n,admin:()=>u={usuario:'admin',nombre:'Admin',rol:'administrador'},snapshot:()=>structuredClone(s),bloquear:()=>bloqueado=true};
}
function codigo(fn,c) { assert.throws(fn,e=>e.codigo===c); }
test('solo administración publica temas y se publican directamente',()=>{
 const e=entorno();codigo(()=>e.f.enviarTema(tema),'SIN_PERMISO');e.usuario(null);codigo(()=>e.f.enviarTema(tema),'NO_AUTENTICADO');
 e.admin();const t=e.f.enviarTema({...tema,estado:'pendiente',usuario:'otra'});assert.equal(t.estado,'aprobado');assert.equal(t.usuario,'admin');assert.equal(e.f.temasPublicos().length,1);
});
test('administración edita, archiva y vuelve a publicar sin cola de aprobación',()=>{
 const e=entorno();e.admin();const t=e.f.enviarTema(tema);const editado=e.f.editarTema(t.id,1,{...tema,mensaje:tema.mensaje+' Más información.'});assert.equal(editado.version,2);
 const archivado=e.f.gestionarTema(t.id,2,'archivar');assert.equal(archivado.estado,'archivado');assert.equal(e.f.temasPublicos().length,0);
 e.f.gestionarTema(t.id,3,'publicar');assert.equal(e.f.temasPublicos().length,1);assert.equal(e.f.auditoria('tema',t.id).length,4);
});
test('un formulario editorial desactualizado no sobrescribe cambios',()=>{
 const e=entorno();e.admin();const t=e.f.enviarTema(tema);e.f.gestionarTema(t.id,1,'fijar');const antes=e.snapshot();
 codigo(()=>e.f.editarTema(t.id,1,tema),'CONFLICTO');assert.deepEqual(e.snapshot(),antes);
});
test('empresas y candidatos no pueden editar ni gestionar temas',()=>{
 const e=entorno();e.admin();const t=e.f.enviarTema(tema);for(const rol of ['candidato','empresa','solicitante']){e.usuario({usuario:'otra',nombre:'Otra',rol});codigo(()=>e.f.editarTema(t.id,1,tema),'SIN_PERMISO');codigo(()=>e.f.gestionarTema(t.id,1,'archivar'),'SIN_PERMISO');}
});
test('validación empresarial exige identificación, contacto, declaración y URL segura',()=>{
 const e=entorno();for(const d of [{...solicitud,declaracion:false},{...solicitud,contactoCorreo:'correo'},{...solicitud,identificacionFiscal:''},{...solicitud,sitioWeb:'javascript:alert(1)'},{...solicitud,descripcion:'Corta'}])codigo(()=>e.f.enviarSolicitud(d),'VALIDACION');assert.equal(e.snapshot().solicitudes.length,0);
});
test('empresa pendiente no tiene ficha pública ni membresía; aprobar crea ambas con auditoría',()=>{
 const e=entorno(),s=e.f.enviarSolicitud({...solicitud,estado:'aprobado',empresaId:1});assert.equal(s.estado,'pendiente');assert.equal(e.snapshot().empresas.length,0);assert.equal(e.snapshot().miembros.length,0);
 e.admin();const r=e.f.decidir('empresa',s.id,1,'aprobar');assert.equal(r.empresaId,7);assert.equal(e.snapshot().miembros[0].usuario,'candidato');assert.equal(e.snapshot().empresas[0].estadoRegistro,'aprobado');assert.equal(e.snapshot().empresas[0].contactoCorreo,undefined);assert.equal(e.f.auditoria('empresa',s.id).length,2);
});
test('solicitudes duplicadas, incluso con identificación formateada, se rechazan',()=>{
 const e=entorno();e.f.enviarSolicitud(solicitud);codigo(()=>e.f.enviarSolicitud(solicitud),'SOLICITUD_EXISTENTE');e.usuario({usuario:'otra',nombre:'Otra',rol:'solicitante'});codigo(()=>e.f.enviarSolicitud({...solicitud,identificacionFiscal:'06141234560010'}),'EMPRESA_DUPLICADA');
});
test('empresa rechazada puede corregirse conservando historial y sin acceso prematuro',()=>{
 const e=entorno(),s=e.f.enviarSolicitud(solicitud);e.admin();e.f.decidir('empresa',s.id,1,'rechazar','La dirección comercial está incompleta.');assert.equal(e.snapshot().miembros.length,0);
 e.usuario({usuario:'candidato',nombre:'Candidato',rol:'solicitante'});const r=e.f.corregir('empresa',s.id,2,{...solicitud,direccion:'Dirección comercial corregida número 100'});assert.equal(r.estado,'pendiente');assert.equal(r.version,3);assert.equal(e.snapshot().miembros.length,0);
});
test('fallo de almacenamiento no deja aprobación ni auditoría parcial',()=>{
 const e=entorno(),s=e.f.enviarSolicitud(solicitud);e.admin();const antes=e.snapshot();e.bloquear();codigo(()=>e.f.decidir('empresa',s.id,1,'aprobar'),'ALMACEN_NO_DISPONIBLE');assert.deepEqual(e.snapshot(),antes);
});
test('aprobación empresarial hidrata sesión, directorio y publicación tras recargar',()=>{
 const e=entorno(),s=e.f.enviarSolicitud(solicitud);
 function cargar(){const map=new Map([['pt_sesion',JSON.stringify({usuario:'candidato',nombre:'Candidato',rol:'solicitante'})],['pt_flujos_v1',JSON.stringify(e.snapshot())]]);const c=vm.createContext({localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}});vm.runInContext(fs.readFileSync('js/datos.js','utf8'),c);return code=>vm.runInContext(code,c);}
 let run=cargar();assert.equal(run('sesionDatos().rol'),'solicitante');assert.equal(run('EMPRESAS.length'),6);assert.equal(run('guardarPublicacionExtra({id:111,empresaId:7,titulo:"QA"},{})'),false);
 e.admin();e.f.decidir('empresa',s.id,1,'aprobar');run=cargar();assert.equal(run('sesionDatos().rol'),'empresa');assert.equal(run('sesionDatos().empresaId'),7);assert.equal(run('EMPRESAS.length'),7);assert.equal(run('guardarPublicacionExtra({id:111,empresaId:7,titulo:"QA"},{})'),true);
});
test('límites del foro y categorías inválidas se validan en dominio',()=>{const e=entorno();e.admin();for(const d of [{...tema,categoria:'Otra'},{...tema,mensaje:'Corto'},{...tema,titulo:'x'.repeat(161)}])codigo(()=>e.f.enviarTema(d),'VALIDACION');});

test('no se aprueba una solicitud cuyo autor fue suspendido',()=>{
 let activa=true;const e=entorno(u=>u==='admin'||activa),s=e.f.enviarSolicitud(solicitud);activa=false;e.admin();const antes=e.snapshot();codigo(()=>e.f.decidir('empresa',s.id,1,'aprobar'),'CUENTA_INACTIVA');assert.deepEqual(e.snapshot(),antes);
});
test('datos estructuralmente dañados generan error de dominio sin sobrescribirlos',()=>{
 for(const s of [null,{}, {schemaVersion:1,temas:[null],solicitudes:[],empresas:[],miembros:[],auditoria:[]}]){
  let escritos=0;const f=crearServicioFlujos({leer:()=>s,guardar:()=>{escritos++;return true;},actor:()=>null});codigo(()=>f.temasPublicos(),'ALMACEN_INVALIDO');assert.equal(escritos,0);
 }
});
test('vista de revisión reúne solicitudes e historial con una sola lectura',()=>{
 let lecturas=0;const s={schemaVersion:1,temas:[],solicitudes:[],empresas:[],miembros:[],auditoria:[]};const f=crearServicioFlujos({leer:()=>{lecturas++;return s;},guardar:()=>true,actor:()=>({usuario:'admin',nombre:'Admin',rol:'administrador'})});
 assert.deepEqual(f.vistaRevision('tema'),{items:[],historial:[]});assert.equal(lecturas,1);
});
