const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('js/datos.js', 'utf8');
function portal(storage = new Map(), bloquear = false) {
  const context = vm.createContext({ document: {addEventListener(){}}, localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => { if (bloquear) throw Error('quota'); storage.set(key, value); },
  }});
  vm.runInContext(source, context);
  return { storage, run: code => vm.runInContext(code, context), login: (rol, usuario = rol, empresaId = 1) => storage.set('pt_sesion', JSON.stringify({usuario, rol, empresaId, nombre: 'Prueba', correo:'prueba@example.test'})) };
}
test('publicación conserva todos los campos al navegar/recargar', () => {
  const p = portal(); p.login('empresa');
  assert.equal(p.run(`guardarPublicacionExtra({id:111,empresaId:1,titulo:'QA',salario:null}, {id:111,descripcion:'Texto completo\\nSegunda línea',habilidades:['Node.js'],requisitos:['SQL'],responsabilidades:['Probar'],beneficios:['Remoto'],contacto:{correo:'qa@example.test'}})`), true);
  const next = portal(p.storage);
  assert.equal(next.run('VACANTES.find(v=>v.id===111).salario'), null);
  assert.equal(next.run('DETALLES_VACANTE[111].habilidades[0]'), 'Node.js');
  assert.equal(next.run('DETALLES_VACANTE[111].descripcion'), 'Texto completo\nSegunda línea');
  assert.equal(next.run('DETALLES_VACANTE[111].contacto.correo'), 'qa@example.test');
});
test('cerrar, retirar y suspender afecta disponibilidad entre páginas', () => {
  const p = portal(); p.login('empresa');
  assert.equal(p.run('cambiarEstadoVacante(102,"Cerrada")'), false);
  assert.equal(p.run('cambiarEstadoVacante(101,"Cerrada")'), true);
  assert.equal(portal(p.storage).run('vacanteDisponible(VACANTES[0])'), false);
  p.login('candidato'); assert.equal(p.run('guardarPostulacion({vacanteId:101})'), false);
  p.login('administrador'); assert.equal(p.run('cambiarEstadoVacante(101,"Retirada")'), true);
  p.login('empresa'); assert.equal(p.run('cambiarEstadoVacante(101,"Publicada")'), false);
  p.login('administrador'); p.run('cambiarEstadoVacante(101,"Publicada"); suspenderEmpresa(1,true)');
  assert.equal(portal(p.storage).run('vacanteDisponible(VACANTES[0])'), false);
});
test('postulación llega a empresa, evita duplicados, y preselección vuelve al candidato', () => {
  const p = portal();
  assert.equal(p.run('guardarPostulacion({vacanteId:101})'), false);
  p.login('empresa'); assert.equal(p.run('guardarPostulacion({vacanteId:101})'), false);
  p.login('candidato','ana');
  p.run(`guardarPerfil({fNombres:'Ana QA',fPerfil:'Desarrollo',habilidades:['SQL']})`);
  assert.equal(p.run('guardarPostulacion({vacanteId:101})'), true);
  p.run('guardarPostulacion({vacanteId:101})'); assert.equal(p.run('leerPostulaciones().length'), 1);
  p.login('empresa'); assert.equal(p.run('candidatosDeVacante(101).length'), 4);
  assert.equal(p.run('candidatosDeVacante(101)[0].nombre'), 'Ana QA');
  assert.equal(p.run('actualizarEstadoCandidato(101,"ana","Preseleccionada")'), true);
  const next = portal(p.storage); next.login('candidato','ana');
  assert.equal(next.run('estadoPostulacion(leerPostulaciones()[0])'), 'Preseleccionada');
  next.login('candidato','otra'); assert.equal(next.run('leerPostulaciones().length'), 0);
});
test('perfil, favoritos y reseñas se mantienen por usuario y empresa', () => {
  const p = portal(); p.login('candidato','ana');
  p.run('guardarPerfil({fNombres:"Ana"}); alternarGuardado("vacantes",101); alternarGuardado("recursos",2); guardarResena(3,4,"Buena experiencia")');
  const next = portal(p.storage);
  assert.equal(next.run('leerPerfil().fNombres'), 'Ana');
  assert.equal(next.run('leerGuardados("vacantes")[0]'), 101);
  assert.equal(next.run('leerGuardados("recursos")[0]'), 2);
  assert.equal(next.run('resenasDeEmpresa(3).length'), 1);
  assert.equal(next.run('resenasDeEmpresa(2).length'), 0);
  next.login('candidato','otra'); assert.equal(next.run('leerGuardados("vacantes").length'), 0);
  next.login('candidato','ana'); next.run('alternarGuardado("vacantes",101)'); assert.equal(next.run('leerGuardados("vacantes").length'), 0);
});
test('foro conserva el cuerpo del mensaje', () => {
  const p = portal(); p.run('guardarTemasForo([{id:1,titulo:"Tema",mensaje:"Mensaje completo",usuario:"ana"}])');
  assert.equal(portal(p.storage).run('leerTemasForo()[0].mensaje'), 'Mensaje completo');
});
test('almacenamiento bloqueado o inválido no produce falsos éxitos', () => {
  const p = portal(new Map([['pt_vacantes_extra','{}'],['pt_estados_vacantes','[]'],['pt_postulaciones','null']]), true);
  p.login('candidato'); assert.equal(p.run('guardarPostulacion({vacanteId:101})'), false);
  assert.equal(p.run('VACANTES.length'),10);
  assert.equal(p.run('guardarPublicacionExtra({id:111},{})'),false);
});
test('texto de usuario se escapa y fechas no dependen de una fecha fija', () => {
  const p = portal();
  assert.equal(p.run('escaparHTML(`<img src=x onerror="x">`)').includes('<img'), false);
  assert.equal(p.run('fechaCercana(fechaHoy())'), 'hoy');
  assert.equal(p.run('fechaCercana("inválida")'), 'Fecha no disponible');
  assert.equal(p.run('salarioFormateado(null)'), 'A convenir');
  assert.equal(p.run('salarioFormateado(0)'), '$0');
});

test('formulario empresarial publica descripción larga, habilidades y contactos sin inventarlos', () => {
  const storage = new Map([['pt_sesion',JSON.stringify({usuario:'empresa',rol:'empresa',empresaId:1})]]);
  const fields = Object.fromEntries(Object.entries({fTitulo:'QA completo',fCorreo:'qa@example.test',fRequisitos:'SQL\nNode',fDescripcion:'Descripción larga '.repeat(30),fSalario:'',fUbicacion:'Quito',fModalidad:'Remoto',fContrato:'Indefinido',fNivel:'Junior',fSector:'Tecnología',fResponsabilidades:'Probar',fBeneficios:'Horario flexible',fTelefonoContacto:'',fDireccionContacto:'',fResponsableContacto:''}).map(([id,value])=>[id,{value,classList:{remove(){},add(){}},focus(){}}]));
  const context = vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:id=>fields[id],addEventListener(){}},avisar(){}});
  vm.runInContext(source,context);
  vm.runInContext(fs.readFileSync('js/empresas.js','utf8'),context);
  vm.runInContext('habilidadesOferta = ["Node.js", "SQL"]; publicarOferta({preventDefault(){},currentTarget:{reset(){}}})',context);
  const publicado = JSON.parse(storage.get('pt_vacantes_extra'))[0];
  assert.equal(publicado.detalle.descripcion,fields.fDescripcion.value.trim());
  assert.deepEqual(publicado.detalle.habilidades,['Node.js','SQL']);
  assert.deepEqual(publicado.detalle.beneficios,['Horario flexible']);
  assert.equal(publicado.detalle.contacto.telefono,'');
  assert.equal(publicado.detalle.contacto.correo,'qa@example.test');
  assert.equal(publicado.vacante.salario,null);
  assert.equal(publicado.vacante.empresaId,1);
  assert.equal(vm.runInContext('misOfertas.every(v=>v.empresaId===1)',context),true);
});

test('administración suspende y reactiva las mismas cuentas del login', () => {
  const p = portal();
  p.run(fs.readFileSync('js/auth.js','utf8'));
  assert.equal(p.run('iniciarSesion("candidato","candidato123").ok'),true);
  p.login('administrador','admin');
  assert.equal(p.run('cambiarEstadoCuenta("admin","Suspendido")'),false);
  assert.equal(p.run('cambiarEstadoCuenta("candidato","Suspendido")'),true);
  assert.equal(p.run('iniciarSesion("candidato","candidato123").ok'),false);
  p.login('candidato','candidato'); assert.equal(p.run('sesionDatos()'),null);
  p.login('administrador','admin'); p.run('cambiarEstadoCuenta("candidato","Activo")');
  assert.equal(p.run('iniciarSesion("candidato","candidato123").ok'),true);
});
