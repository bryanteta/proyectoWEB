const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function render(rol,empresaId,seleccion=1){
 const salida={innerHTML:''}; const sesion={usuario:'demo',nombre:'Demo',rol,empresaId};
 const c=vm.createContext({document:{addEventListener(){},getElementById:id=>id==='rejillaValoraciones'?salida:id==='empresaValoraciones'?{value:String(seleccion)}:null},localStorage:{getItem:k=>k==='pt_sesion'?JSON.stringify(sesion):null,setItem(){}}});
 vm.runInContext(fs.readFileSync('js/datos.js','utf8'),c);vm.runInContext(fs.readFileSync('js/empresas.js','utf8'),c);vm.runInContext('pintarValoraciones()',c);return salida.innerHTML;
}
test('la empresa ve sus reseñas completas, aunque el selector indique otra organización',()=>{const h=render('empresa',1,2);assert.match(h,/4\.7/);assert.match(h,/Mateo López/);assert.match(h,/Paula Herrera/);assert.match(h,/Diego Pérez/);assert.match(h,/3 reseñas recibidas/);assert.match(h,/Distribución de puntuaciones/);});
test('sin reseñas no se presenta un cero como calificación',()=>{const h=render('empresa',2,1);assert.match(h,/Café Altura/);assert.match(h,/Sin puntuación/);assert.match(h,/aún no tiene valoraciones/);assert.doesNotMatch(h,/Mateo López|0\.0/);});
test('administración puede consultar la organización seleccionada',()=>{const h=render('administrador',null,2);assert.match(h,/Café Altura/);assert.doesNotMatch(h,/Cuscatlán Software/);});
