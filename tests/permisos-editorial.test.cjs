const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const {webcrypto}=require('node:crypto');
function portal(storage=new Map()){
 const c=vm.createContext({document:{addEventListener(){}},window:{addEventListener(){}},crypto:webcrypto,TextEncoder,URL,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 for(const f of ['datos','dominio-flujos','flujos','auth','comunidad','admin'])vm.runInContext(fs.readFileSync(`js/${f}.js`,'utf8'),c);
 return {storage,run:s=>vm.runInContext(s,c),login:(rol='candidato',usuario='qa',empresaId=null)=>storage.set('pt_sesion',JSON.stringify({usuario,nombre:'Prueba',rol,empresaId,correo:'qa@example.test'}))};
}
test('administración no guarda, reseña, postula ni publica ofertas',()=>{
 const p=portal();p.login('administrador','admin');const antes=p.storage.size;
 assert.equal(p.run('alternarGuardado("vacantes",101)'),false);assert.equal(p.run('guardarResena(1,4,"Opinión de ejemplo")'),false);assert.equal(p.run('guardarPostulacion({vacanteId:101})'),false);
 assert.equal(p.run('guardarPublicacionExtra({id:999,empresaId:1,titulo:"Oferta"},{})'),false);assert.equal(p.run('actualizarEstadoCandidato(101,"demo-0","Preseleccionada")'),false);assert.equal(p.run('cambiarEstadoVacante(101,"Publicada")'),false);assert.equal(p.storage.size,antes);
});
test('guardar y reseñar son exclusivos de candidatos; publicar es exclusivo de la empresa propietaria',()=>{
 const p=portal();for(const rol of ['empresa','solicitante']){p.login(rol,'qa',1);assert.equal(p.run('guardarResena(1,4,"Opinión de ejemplo")'),false);assert.equal(p.run('alternarGuardado("vacantes",101)'),false);}
 p.login('candidato');assert.equal(p.run('guardarResena(1,4,"Opinión de ejemplo")'),true);assert.equal(p.run('alternarGuardado("vacantes",101)'),true);
 p.login('empresa','empresa',1);assert.equal(p.run('guardarPublicacionExtra({id:999,empresaId:2,titulo:"Ajena"},{})'),false);assert.equal(p.run('guardarPublicacionExtra({id:999,empresaId:1,titulo:"Propia"},{})'),true);
});
test('personal administrativo excluye candidatos, solicitantes y cuentas de empresa',()=>{
 const p=portal();p.login('administrador','admin');assert.equal(p.run('cargarUsuariosAdmin().length'),1);assert.equal(p.run('cargarUsuariosAdmin()[0].usuario'),'admin');assert.equal(p.run('puedeVer("administrador","empresas.html")'),false);
});
test('alta de personal requiere administración y no cambia la sesión del creador',async()=>{
 const p=portal();p.login('empresa','empresa',1);assert.equal((await p.run('registrarCuenta({rol:"administrador",nombre:"Personal QA",usuario:"personalqa",correo:"personal@example.test",contrasena:"DemoPersonal2026"},true)')).ok,false);
 p.login('administrador','admin');assert.equal((await p.run('registrarCuenta({rol:"administrador",nombre:"Personal QA",usuario:"personalqa",correo:"personal@example.test",contrasena:"DemoPersonal2026"},true)')).ok,true);
 assert.equal(p.run('sesionDatos().usuario'),'admin');assert.equal(p.run('cargarUsuariosAdmin().length'),2);assert.equal(p.run('cambiarEstadoCuenta("personalqa","Suspendido")'),true);assert.equal((await p.run('iniciarSesion("personalqa","DemoPersonal2026")')).ok,false);
 assert.equal(p.run('cambiarEstadoCuenta("admin","Suspendido")'),false);assert.equal(p.run('cambiarEstadoCuenta("empresa","Suspendido")'),false);
});
test('los temas base no nacen fijados y el fijado real persiste con versión',()=>{
 const p=portal();p.login('administrador','admin');assert.equal(p.run('TEMAS_EDITORIALES_BASE.some(t=>t.fijado)'),false);p.run('flujos.gestionarTema("base-1",1,"fijar")');
 const next=portal(p.storage);assert.equal(next.run('temasDeComunidad().find(t=>t.id==="base-1").fijado'),true);
 assert.throws(()=>p.run('flujos.gestionarTema("base-1",1,"fijar")'),e=>e.codigo==='CONFLICTO');
});
test('video e imagen conservan metadatos y normalizan proveedores permitidos',()=>{
 const p=portal();p.login('administrador','admin');const t=p.run('flujos.enviarTema({titulo:"Guía de entrevistas laborales",categoria:"Tecnología",mensaje:"Contenido editorial de demostración para preparar una entrevista.",imagen:{id:"imagen-qa",alt:"Ilustración de entrevista"},video:"https://youtu.be/abcdefghijk?si=prueba"})');
 assert.equal(t.imagen.alt,'Ilustración de entrevista');assert.equal(t.video.proveedor,'youtube');assert.equal(t.video.id,'abcdefghijk');assert.equal(t.video.enlace,'https://www.youtube.com/watch?v=abcdefghijk');
 const next=portal(p.storage);assert.equal(next.run('temasDeComunidad().find(t=>t.id==='+JSON.stringify(t.id)+').imagen.id'),'imagen-qa');
});
test('no se aceptan videos arbitrarios ni descripciones inválidas de imagen',()=>{
 const p=portal();p.login('administrador','admin');for(const video of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=abcdefghijk','https://example.test/video','http://vimeo.com/12345678']){
 assert.throws(()=>p.run(`flujos.enviarTema({titulo:"Tema multimedia seguro",categoria:"Tecnología",mensaje:"Texto suficientemente extenso para la publicación.",video:${JSON.stringify(video)}})`),e=>e.codigo==='VALIDACION');}
 assert.throws(()=>p.run('flujos.enviarTema({titulo:"Tema multimedia seguro",categoria:"Tecnología",mensaje:"Texto suficientemente extenso para la publicación.",imagen:{id:"img",alt:""}})'),e=>e.codigo==='VALIDACION');
});
test('35 comentarios se consultan en páginas de 10 con orden y límites estables',()=>{
 const p=portal();const lista=Array.from({length:35},(_,i)=>({id:'c'+i,temaId:'base-1',usuario:'persona'+i,autor:'Persona',texto:'Comentario '+i,fecha:new Date(Date.UTC(2026,9,1,0,i)).toISOString()}));p.storage.set('pt_comentarios_foro',JSON.stringify(lista));
 assert.equal(p.run('paginaComentariosTema("base-1",1,"recientes").items.length'),10);assert.equal(p.run('paginaComentariosTema("base-1",1,"recientes").items[0].id'),'c34');
 assert.equal(p.run('paginaComentariosTema("base-1",4,"recientes").items.length'),5);assert.equal(p.run('paginaComentariosTema("base-1",1,"antiguos").items[0].id'),'c0');assert.equal(p.run('paginaComentariosTema("base-1",999).pagina'),4);assert.equal(p.run('paginaComentariosTema("base-1",-1).pagina'),1);
 assert.equal(p.run('resumenDeComunidad().conteos["base-1"]'),35);
});
test('comentarios retirados no se cuentan ni crean huecos en la paginación',()=>{
 const p=portal();p.storage.set('pt_comentarios_foro',JSON.stringify(Array.from({length:11},(_,i)=>({id:'c'+i,temaId:'base-1',texto:'Comentario',fecha:'2026-10-01',eliminado:i===0}))));assert.equal(p.run('paginaComentariosTema("base-1",2).pagina'),1);assert.equal(p.run('paginaComentariosTema("base-1").total'),10);assert.equal(p.run('paginaComentariosTema("privado").items.length'),0);
});
test('reseñas antiguas de administración no participan en la reputación pública',()=>{
 const p=portal();p.storage.set('pt_resenas',JSON.stringify([{empresaId:1,usuario:'admin',autor:'Admin',nota:1,texto:'Reseña anterior de administración'}]));assert.equal(p.run('resenasDeEmpresa(1).some(r=>r.usuario==="admin")'),false);
});
test('el adaptador de imágenes rechaza permisos, tamaños y formatos falsificados',async()=>{
 const p=portal();p.run(fs.readFileSync('js/adjuntos-foro.js','utf8'));p.login('candidato');await assert.rejects(p.run('guardarImagenForo(null)'),/Solo administración/);
 p.login('administrador','admin');await assert.rejects(p.run('guardarImagenForo({type:"image/png",size:4000000})'),/hasta 3 MB/);
 await assert.rejects(p.run('guardarImagenForo({type:"image/png",size:4,slice:()=>({arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer})})'),/formato real/);
});
test('el adaptador rechaza dimensiones excesivas antes de escribir archivos',async()=>{
 const p=portal();p.run(fs.readFileSync('js/adjuntos-foro.js','utf8'));p.login('administrador','admin');p.run('globalThis.createImageBitmap=async()=>({width:5000,height:20,close(){}})');
 await assert.rejects(p.run('guardarImagenForo({type:"image/png",size:8,slice:()=>({arrayBuffer:async()=>new Uint8Array([137,80,78,71,13,10,26,10]).buffer})})'),/4096/);
});
