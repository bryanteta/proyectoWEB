const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {crearServicioFlujos}=require('../js/dominio-flujos.js');
function portal(storage=new Map()) {
 const c=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext(fs.readFileSync('js/datos.js','utf8'),c);return {storage,run:code=>vm.runInContext(code,c)};
}
const datos={razonSocial:'Empresa de pruebas SA',nombreComercial:'Empresa QA',identificacionFiscal:'QASV20261027',pais:'SV',ciudad:'San Salvador',direccion:'Dirección comercial de demostración',sector:'Tecnología',tamano:'11–50',descripcion:'Organización ficticia de desarrollo de software y servicios empresariales en El Salvador.',contactoNombre:'Persona de pruebas',contactoCargo:'Gerente',contactoCorreo:'qa@example.test',contactoTelefono:'+503 0000 0000',sitioWeb:'',declaracion:true};
function servicio(){let s={schemaVersion:1,temas:[],solicitudes:[],empresas:[],miembros:[],auditoria:[]},i=0;return crearServicioFlujos({leer:()=>s,guardar:n=>{s=n;return true;},actor:()=>({usuario:'qa',rol:'candidato',nombre:'QA'}),nuevoId:()=>String(++i),ahora:()=>new Date().toISOString()});}
test('empresas y vacantes de ejemplo pertenecen a El Salvador',()=>{
 const p=portal();assert.equal(p.run('CONFIG_PORTAL.pais'),'SV');assert.equal(p.run('EMPRESAS.every(e=>e.pais==="SV" && CONFIG_PORTAL.ciudades.includes(e.ciudad))'),true);assert.equal(p.run('VACANTES.every(v=>v.pais==="SV" && CONFIG_PORTAL.ciudades.includes(v.ciudad))'),true);assert.equal(p.run('empresaPorId(1).nombre'),'Cuscatlán Software');assert.ok(p.run('DETALLE_VACANTE.contacto.telefono').startsWith('+503'));
});
test('HTML y formularios no conservan ubicaciones de Ecuador',()=>{
 for(const nombre of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){const s=fs.readFileSync(nombre,'utf8');assert.ok(s.includes('lang="es-SV"'),nombre);assert.doesNotMatch(s,/Quito|Guayaquil|Cuenca|Loja|Ambato|\+593|Ecuador|RUC, NIT/);}
 const registro=fs.readFileSync('registro-empresa.html','utf8');assert.match(registro,/<option value="SV" selected>El Salvador<\/option>/);assert.match(registro,/NIT de la empresa/);
});
test('formato monetario y calendario corresponden a El Salvador',()=>{
 const p=portal();assert.equal(p.run('salarioFormateado(1400)'),'$1,400');assert.equal(p.run('fechaISOElSalvador(new Date("2026-10-27T02:00:00Z"))'),'2026-10-26');assert.equal(p.run('fechaISOElSalvador(new Date("2026-10-27T07:00:00Z"))'),'2026-10-27');assert.equal(p.run('fechaCercana(null)'),'Fecha no disponible');
});
test('preferencias antiguas se adaptan sin reescribir datos ni mensajes',()=>{
 const perfil={fCiudad:'Quito',fCorreo:'candidato@demo.ec',fAcerca:'Mi experiencia personal en Quito',alertas:[{titulo:'Tecnología en Quito',activa:true}]};
 const raw=JSON.stringify({candidato:perfil});const storage=new Map([['pt_sesion',JSON.stringify({usuario:'candidato',rol:'candidato',nombre:'Candidato',correo:'candidato@demo.ec'})],['pt_perfiles',raw],['pt_empresas_fichas',JSON.stringify({1:{nombre:'Andes Software',ciudad:'Quito'}})],['pt_vacantes_extra',JSON.stringify([{vacante:{id:111,empresaId:1,titulo:'Texto original Quito',ciudad:'Guayaquil'},detalle:{descripcion:'Descripción original Quito',contacto:{telefono:'+593 2 000 0000'}}}])]]);
 const p=portal(storage);assert.equal(p.run('leerPerfil().fCiudad'),'San Salvador');assert.equal(p.run('leerPerfil().fCorreo'),'candidato@demo.example');assert.equal(p.run('leerPerfil().fAcerca'),perfil.fAcerca);assert.equal(p.run('leerPerfil().alertas[0].titulo'),'Tecnología en San Salvador');assert.equal(p.run('empresaPorId(1).nombre'),'Cuscatlán Software');assert.equal(p.run('VACANTES.find(v=>v.id===111).ciudad'),'Santa Tecla');assert.equal(p.run('DETALLES_VACANTE[111].descripcion'),'Descripción original Quito');assert.equal(storage.get('pt_perfiles'),raw);
});
test('registro acepta teléfonos salvadoreños y normaliza el prefijo',()=>{
 for(const contactoTelefono of ['2222-3333','+503 2222 3333','50322223333']){const s=servicio().enviarSolicitud({...datos,contactoTelefono});assert.equal(s.datos.contactoTelefono,'+503 2222 3333');}
});
test('registro rechaza países y prefijos extranjeros',()=>{
 for(const cambio of [{pais:'EC'},{contactoTelefono:'+593 2 555 0142'},{contactoTelefono:'+502 2222 3333'},{contactoTelefono:'+22223333'},{contactoTelefono:'22+223333'}])assert.throws(()=>servicio().enviarSolicitud({...datos,...cambio}),e=>e.codigo==='VALIDACION');
});
