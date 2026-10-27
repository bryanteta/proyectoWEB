# Auditoría de integración

Actualización posterior: ver [Moderación previa y registro empresarial](REVISION-Y-REGISTRO.md). Los temas nuevos ya no se publican directamente y las empresas nuevas requieren aprobación.

## Cambios realizados

- Publicación → detalle: conserva descripción completa, requisitos, habilidades, responsabilidades, beneficios, correo, teléfono, responsable y dirección. Añadidos al formulario los campos que el detalle mostraba sin permitir capturarlos.
- Eliminados beneficios y teléfonos ficticios generados para publicaciones nuevas. Sector visible en el detalle.
- Salario sin indicar representado como `null`; salario cero no se confunde con ausencia.
- Mis ofertas y selector de postulantes filtran por empresa de la sesión; administración puede ver todas.
- Estados compartidos de oferta: cierre, reapertura y retirada sobreviven a recargas y afectan inicio, búsqueda, ofertas relacionadas y botón de postulación.
- Suspender una empresa desde administración afecta la disponibilidad de sus ofertas. Una empresa no puede suspender otras empresas ni reabrir una retirada administrativa.
- Postulaciones vinculadas al usuario y vacante, sin duplicados; visibles en empresa, perfil y contadores de administración.
- Preselección persistente visible en el perfil del candidato. Eliminadas las postulaciones ficticias que se atribuían automáticamente a toda cuenta.
- Administración de las cuentas demo conectada al login: suspensión, reactivación y eliminación local; se impide bloquear la propia cuenta administrativa.
- Perfil y alertas conservados por cuenta; guardados de ofertas y recursos visibles en el perfil.
- Reseñas filtradas por empresa y compartidas con perfil, directorio y detalle; resumen calculado sobre reseñas disponibles.
- Ficha de empresa editable por propietario o administrador y compartida con los demás módulos.
- Foro conserva el mensaje completo y permite leerlo en un modal. Las respuestas siguen pendientes.
- Recursos de portada enlazan al contenido concreto; guardados persistentes.
- Búsqueda con filtro real por empresa, paginación real de seis resultados y filtros conservados en URL.
- Oferta inexistente muestra un estado de error, sin sustituirla por otra oferta.
- Fechas relativas basadas en fecha local actual; retirado el día fijo del prototipo.
- Texto de publicaciones escapado al generar listas HTML.
- Corregido el manejador antiguo del login móvil que buscaba un campo email ya sustituido por usuario.
- Errores de almacenamiento no confirman publicación, postulación o login como exitosos.
- Navegación de pestañas del perfil y secciones empresariales conserva el ancla.
- Boletín y compartir perfil explican su estado pendiente en vez de confirmar un envío o copia inexistentes.

## Pruebas automatizadas

Ejecutar desde la raíz:

```bash
node tests/integracion.test.cjs
```

Usa el ejecutor de pruebas de Node y contextos aislados de la capa de datos. No necesita paquetes externos ni un backend. Comprueba publicación y recarga, estados, propiedad, suspensión, postulaciones, preselección, separación de usuarios, guardados, reseñas, mensajes de foro, almacenamiento no disponible, fechas y escape de texto.

## Persistencia

Se conservan las claves antiguas `pt_sesion`, `pt_vacantes_extra`, `pt_postulaciones` y `pt_temas_foro`. Se añaden estados de vacantes y empresas, fichas de empresa, estados de candidatos, perfiles, guardados, reseñas, usuarios administrativos de ejemplo y preferencias.

Las postulaciones antiguas sin usuario se atribuyen a la cuenta demo `candidato` por compatibilidad. Las habilidades o mensajes que la versión anterior descartó no pueden reconstruirse. Las nuevas publicaciones sí conservan esos datos.

## Límites explícitos

- La autorización local sigue siendo demostrativa: cualquier usuario puede modificar su almacenamiento. La protección real corresponde al backend.
- El panel de usuarios administra las tres cuentas del login demo. Suspensión y eliminación impiden su acceso local; la sesión deja de ser válida. La autorización real todavía requiere servidor.
- Los gráficos históricos, visitas, entrevistas y actividad administrativa contienen ejemplos.
- El CV continúa como vista previa temporal: no existe archivo persistido ni descarga real desde empresa.
- Las alertas guardan preferencias locales; no ejecutan búsquedas programadas ni envían correos.
- Configuración administrativa conserva preferencias de demostración; no activa mantenimiento ni servicios de correo.
- Moderación muestra casos de ejemplo; no está conectada a un servicio real de denuncias.
- No hay respuestas en foro, registro real, recuperación de contraseña ni perfiles públicos.
- Dos pestañas avisan cuando los datos cambian; se requiere recargar para actualizar su vista. No hay sincronización multiusuario ni transacciones reales.

Ver `BACKEND-NODE.md` para llevar estas reglas a una API y PostgreSQL.

## Verificación en navegador

- Recorridas las nueve páginas con scripts actualizados; sin errores nuevos de consola en la pasada final.
- Revisadas las nueve pantallas a ancho de escritorio y 480 px. Corregido el desborde de pestañas del perfil; comprobado nuevamente tras el cambio.
- Publicación con descripción mayor de 140 caracteres, requisitos, habilidades y contactos: todos visibles en el detalle.
- Postulación como candidato → recepción y preselección en empresa → estado actualizado en perfil.
- Cierre → oferta excluida de búsqueda y postulación deshabilitada; reapertura comprobada.
- Estado cerrado y contador de postulantes visibles también en administración.
- Tema del foro publicado, recargado y leído con el mensaje completo.
- Recurso guardado desde su modal y visible en el perfil.
- Edición de ficha empresarial abierta y guardada; paginación con seis resultados en la primera página y los restantes en la segunda.
- ID inexistente muestra «Oferta no encontrada».

Se dejó una vacante de prueba identificada como «Verificación de integración Node QA» y un tema «Verificación QA del foro» para revisar los flujos. La cuenta activa se restauró a Empresa Demo.
