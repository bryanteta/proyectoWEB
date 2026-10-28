/* Archivos fuera del documento de temas. El backend sustituirá este adaptador por Storage/API. */
let baseAdjuntosForo;
function abrirAdjuntosForo(){
 if(!baseAdjuntosForo) baseAdjuntosForo=new Promise((resolve,reject)=>{
  const req=indexedDB.open('pt_adjuntos_foro',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('imagenes',{keyPath:'id'});
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};req.onerror=()=>reject(Error('No se pudo abrir el almacenamiento de imágenes.'));
 }).catch(e=>{baseAdjuntosForo=null;throw e;});
 return baseAdjuntosForo;
}
async function guardarImagenForo(archivo){
 const actor=sesionDatos()?.usuario;
 if(sesionDatos()?.rol!=='administrador')throw Error('Solo administración adjunta imágenes a temas.');
 if(!archivo || !['image/png','image/jpeg','image/webp'].includes(archivo.type) || archivo.size>3*1024*1024 || !archivo.size)throw Error('Selecciona una imagen PNG, JPEG o WebP de hasta 3 MB.');
 const bytes=new Uint8Array(await archivo.slice(0,16).arrayBuffer());
 const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71, jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255, webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!(archivo.type==='image/png'&&png||archivo.type==='image/jpeg'&&jpeg||archivo.type==='image/webp'&&webp))throw Error('El formato real del archivo no coincide con una imagen permitida.');
 const mapa=await createImageBitmap(archivo);const valida=mapa.width>0&&mapa.height>0&&mapa.width<=4096&&mapa.height<=4096;mapa.close();if(!valida)throw Error('La imagen no puede superar 4096 × 4096 píxeles.');
 const db=await abrirAdjuntosForo(),id=crypto.randomUUID();
 if(sesionDatos()?.rol!=='administrador'||sesionDatos()?.usuario!==actor)throw Error('La sesión cambió antes de guardar la imagen.');
 await new Promise((resolve,reject)=>{const tx=db.transaction('imagenes','readwrite');tx.objectStore('imagenes').add({id,archivo});tx.oncomplete=resolve;tx.onerror=()=>reject(Error('No se pudo guardar la imagen. Revisa el espacio disponible.'));tx.onabort=()=>reject(Error('Se canceló el guardado de la imagen.'));});return id;
}
async function leerImagenForo(id){const db=await abrirAdjuntosForo();return new Promise((resolve,reject)=>{const req=db.transaction('imagenes').objectStore('imagenes').get(id);req.onsuccess=()=>resolve(req.result?.archivo||null);req.onerror=()=>reject(Error('No se pudo leer la imagen.'));});}
async function descartarImagenForo(id){if(sesionDatos()?.rol!=='administrador')return;const db=await abrirAdjuntosForo();await new Promise((resolve,reject)=>{const tx=db.transaction('imagenes','readwrite');tx.objectStore('imagenes').delete(id);tx.oncomplete=resolve;tx.onerror=reject;});}
