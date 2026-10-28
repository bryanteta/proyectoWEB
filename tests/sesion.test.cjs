const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function pagina() {
 const storage=new Map([['pt_sesion',JSON.stringify({usuario:'candidato',nombre:'Candidato',rol:'candidato'})]]),eventos={},ventana={},secciones=[];
 function elemento(){return {dataset:{},children:[],setAttribute(){},append(...h){this.children.push(...h);},addEventListener(){},focus(){},closest(){return null;}};}
 const principal=elemento();principal.before=e=>secciones.push(e);
 const c=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{body:{append:e=>secciones.push(e),prepend:e=>secciones.push(e)},addEventListener:(tipo,fn)=>{(eventos[tipo]??=[]).push(fn);},createElement:elemento,getElementById:id=>id==='contenido'?principal:null},window:{addEventListener:(tipo,fn)=>{ventana[tipo]=fn;},location:{reload(){}}}});
 vm.runInContext(fs.readFileSync('js/datos.js','utf8'),c);vm.runInContext(fs.readFileSync('js/auth.js','utf8'),c);vm.runInContext('instalarProteccionSesion()',c);
 return {storage,principal,secciones,submit(){const e={target:principal,impedido:false,preventDefault(){this.impedido=true;},stopImmediatePropagation(){this.detenido=true;}};eventos.submit.forEach(fn=>fn(e));return e;},storageEvento:k=>ventana.storage({key:k})};
}
test('una página abierta no envía datos bajo la cuenta iniciada en otra pestaña',()=>{
 const p=pagina();assert.equal(p.submit().impedido,false);
 p.storage.set('pt_sesion',JSON.stringify({usuario:'empresa',nombre:'Empresa',rol:'empresa',empresaId:1}));const e=p.submit();assert.equal(e.impedido,true);assert.equal(e.detenido,true);assert.equal(p.principal.hidden,true);assert.equal(p.secciones.length,1);
 p.submit();assert.equal(p.secciones.length,1);
});
test('la suspensión invalida inmediatamente una pantalla ya abierta',()=>{
 const p=pagina();p.storage.set('pt_cuentas_estado',JSON.stringify({candidato:'Suspendido'}));p.storageEvento('pt_cuentas_estado');assert.equal(p.principal.hidden,true);assert.equal(p.submit().impedido,true);
});
