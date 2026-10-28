const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function buscador(query='') {
 const controles=Object.fromEntries(['filtroCiudad','filtroTexto','filtroSalario','salarioOutput','ordenarPor','filtroDestacada'].map(id=>[id,{value:'',checked:false,textContent:'',options:[{value:''}],add(o){this.options.push(o);}}]));
 const c=vm.createContext({URLSearchParams,Option:class{constructor(text,value){this.text=text;this.value=value;}},localStorage:{getItem:()=>null},window:{location:{search:query},addEventListener(){}},document:{addEventListener(){},getElementById:id=>controles[id],querySelectorAll:()=>[]}});
 vm.runInContext(fs.readFileSync('js/datos.js','utf8'),c);
 vm.runInContext(`VACANTES.push({id:111,empresaId:1,titulo:'Oferta QA',resumen:'Texto breve',ciudad:'San Salvador',salario:null,publicada:'2026-10-27'});DETALLES_VACANTE[111]={descripcion:'Descripción completa de pruebas',habilidades:['Rust']};`,c);
 vm.runInContext(fs.readFileSync('js/busqueda.js','utf8'),c);
 return {controles,run:code=>vm.runInContext(code,c),query:q=>c.window.location.search=q};
}
test('recupera la página del enlace y restaura controles al navegar',()=>{
 const p=buscador('?q=tecnico&pagina=2&salario=850');p.run('leerParametrosURL()');assert.equal(p.run('paginaActual'),2);assert.equal(Number(p.controles.filtroSalario.value),850);assert.equal(p.run('filtrosEstado.texto'),'tecnico');
 p.query('');p.run('leerParametrosURL()');assert.equal(p.run('paginaActual'),1);assert.equal(p.run('filtrosEstado.texto'),'');assert.equal(Number(p.controles.filtroSalario.value),0);
});
test('búsqueda ignora acentos y encuentra habilidades del detalle',()=>{
 const p=buscador('?q=tecnico');p.run('leerParametrosURL()');assert.ok(p.run('aplicarFiltros().some(v=>v.id===104)'));
 p.query('?q=rust');p.run('leerParametrosURL()');assert.equal(p.run('aplicarFiltros().length'),1);assert.equal(p.run('aplicarFiltros()[0].id'),111);
});
test('salarios no indicados quedan al final en ambos órdenes',()=>{
 const p=buscador();p.run('leerParametrosURL();ordenActual="salario_bajo"');assert.equal(p.run('aplicarFiltros().at(-1).id'),111);
 p.run('ordenActual="salario_alto"');assert.equal(p.run('aplicarFiltros().at(-1).id'),111);
});
