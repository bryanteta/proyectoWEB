const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {webcrypto}=require('node:crypto');
function portal(storage=new Map()){
 const c=vm.createContext({document:{addEventListener(){}},crypto:webcrypto,TextEncoder,URL,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 for(const f of ['datos','dominio-flujos','flujos','auth','comunidad'])vm.runInContext(fs.readFileSync(`js/${f}.js`,'utf8'),c);
 return {storage,run:s=>vm.runInContext(s,c),login:(rol='candidato',usuario='qa',empresaId=null)=>storage.set('pt_sesion',JSON.stringify({usuario,nombre:'Prueba',rol,empresaId,correo:'qa@example.test'}))};
}
test('solicitante conserva identidad y destino empresarial sin perfil candidato',()=>{
 const p=portal();p.login('candidato','solicitante');assert.equal(p.run('sesionDatos().rol'),'solicitante');assert.equal(p.run('panelDeSesion(sesionDatos())'),'./registro-empresa.html');
 assert.equal(p.run('puedeVer("solicitante","perfil.html")'),false);assert.equal(p.run('puedeVer("empresa","perfil.html")'),false);assert.equal(p.run('puedeVer("candidato","perfil.html")'),true);
 assert.equal(p.run('guardarPostulacion({vacanteId:101})'),false);
});
test('crear cuenta empresarial deriva clave y no crea perfil ni membresía anticipada',async()=>{
 const p=portal();const r=await p.run('registrarCuenta({rol:"solicitante",nombre:"Responsable QA",usuario:"negocioqa",correo:"negocio@example.test",contrasena:"ClaveDemo123"})');
 assert.equal(r.ok,true);assert.equal(r.sesion.rol,'solicitante');assert.equal(p.storage.has('pt_perfiles'),false);assert.doesNotMatch(p.storage.get('pt_cuentas_locales'),/ClaveDemo123/);
 assert.equal((await p.run('iniciarSesion("negocioqa","incorrecta")')).ok,false);assert.equal((await p.run('iniciarSesion("negocioqa","ClaveDemo123")')).ok,true);
 assert.equal((await p.run('registrarCuenta({rol:"administrador"})')).ok,false);
});
test('tipo candidato y duplicados se validan al crear cuentas',async()=>{
 const p=portal();assert.equal((await p.run('registrarCuenta({rol:"candidato",nombre:"Persona QA",usuario:"personaqa",correo:"persona@example.test",contrasena:"ClaveDemo123"})')).ok,true);
 assert.equal(p.run('panelDeSesion(sesionDatos())'),'./perfil.html');
 assert.equal((await p.run('registrarCuenta({rol:"solicitante",nombre:"Otro QA",usuario:"personaqa",correo:"otro@example.test",contrasena:"ClaveDemo123"})')).ok,false);
});
test('censura reconoce acentos, mayúsculas y sustituciones sin censurar subcadenas',()=>{
 const p=portal();const s=p.run('censurarComentario("IDIOTA imbécil m13rda p.u.t.a computadora disputa")');
 assert.equal(s,'*** *** *** *** computadora disputa');
});
test('comentario aparece de inmediato censurado y persiste sin texto ofensivo original',()=>{
 const p=portal();p.login();const r=p.run('publicarComentario("base-1","Ese IDIOTA necesita mejorar su comunicación.")');assert.equal(r.ok,true);
 assert.match(r.dato.texto,/\*\*\*/);assert.doesNotMatch(p.storage.get('pt_comentarios_foro'),/IDIOTA/);
 const next=portal(p.storage);assert.equal(next.run('comentariosDeTema("base-1").length'),1);
 assert.equal(p.run('publicarComentario("base-1","Ese IDIOTA necesita mejorar su comunicación.").ok'),false);
});
test('sin sesión, tema privado, archivado o cerrado no se admiten comentarios',()=>{
 const p=portal();assert.equal(p.run('publicarComentario("base-1","Comentario de prueba").ok'),false);p.login();assert.equal(p.run('publicarComentario("inexistente","Comentario de prueba").ok'),false);
 p.login('administrador','admin');p.run('flujos.gestionarTema("base-1",1,"comentarios")');p.login();assert.equal(p.run('publicarComentario("base-1","Comentario de prueba").ok'),false);
 p.login('administrador','admin');p.run('flujos.gestionarTema("base-1",2,"archivar")');assert.equal(p.run('temasDeComunidad().some(t=>t.id==="base-1")'),false);
});
test('solo autor o administración retiran un comentario',()=>{
 const p=portal();p.login();p.run('publicarComentario("base-1","Comentario con contexto suficiente.")');const id=JSON.parse(p.storage.get('pt_comentarios_foro'))[0].id;
 p.login('empresa','otra',1);assert.equal(p.run(`retirarComentario(${JSON.stringify(id)})`),false);
 p.login('administrador','admin');assert.equal(p.run(`retirarComentario(${JSON.stringify(id)})`),true);assert.equal(p.run('comentariosDeTema("base-1").length'),0);
});
test('administración configura palabras adicionales para comentarios y reseñas',()=>{
 const p=portal();p.login();assert.equal(p.run('guardarFiltroComentarios("terminoprohibido")'),false);p.login('administrador','admin');assert.equal(p.run('guardarFiltroComentarios("terminoprohibido")'),true);
 p.login();assert.equal(p.run('guardarResena(1,4,"Un terminoprohibido de ejemplo")'),true);assert.equal(p.run('resenasDeEmpresa(1)[0].texto'),'Un *** de ejemplo');assert.equal(p.run('guardarFiltroComentarios("a.*")'),false);
});
test('administración no contiene gestión de vacantes ni cola de temas',()=>{
 const html=fs.readFileSync('admin.html','utf8');assert.doesNotMatch(html,/data-seccion="vacantes"|id="panelVacantes"|id="estadoRevisionForos"/);assert.match(html,/formFiltroComentarios/);
});
