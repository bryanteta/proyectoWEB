# Auditoría de lógica — 27 de octubre de 2026

## Errores corregidos

- **Vacantes sobrescritas entre pestañas:** el siguiente identificador consulta también las publicaciones persistidas. La operación de creación rechaza IDs ya existentes, incluidos los de las ofertas semilla, en lugar de sobrescribirlos. Esto protege aperturas desactualizadas; las carreras simultáneas reales siguen necesitando transacciones del backend.
- **Cambio de cuenta con un formulario abierto:** la página comprueba usuario, rol y empresa antes de actuar y al recibir cambios de sesión. Si cambian, oculta el contenido anterior y exige actualizar la sesión. Evita guardar un borrador del usuario A bajo la cuenta B. La suspensión también invalida pantallas abiertas.
- **Sesiones mal formadas:** arrays, valores primitivos, identidades incompletas y roles desconocidos no se consideran sesiones válidas.
- **Estados de candidatos:** se valida la existencia del candidato y la transición solicitada. No se crean estados para candidatos inexistentes ni se aceptan etiquetas arbitrarias. Una empresa suspendida no puede cambiar vacantes ni preselecciones.
- **Postulaciones heredadas:** se normalizan nombres y habilidades ausentes y se deduplican por usuario/vacante; las listas empresariales ya no fallan al abrir registros antiguos.
- **Puntuaciones inválidas:** se rechazan NaN, infinitos, strings, fracciones y valores fuera de 1–5. Las reseñas antiguas dañadas no rompen la carga.
- **Guardado sobre datos dañados:** un JSON ilegible o una estructura incompatible no se sustituye silenciosamente por datos vacíos al guardar.
- **Aprobaciones de cuentas inactivas:** no se aprueban temas ni empresas cuyo autor está suspendido o eliminado. La solicitud y la auditoría permanecen intactas si falla la decisión.
- **Datos de revisión inconsistentes:** se valida la estructura antes de mostrar o modificar las colas. Una corrección elimina los datos de la decisión anterior del estado actual y conserva el historial.
- **Corrección de registro:** cancelar o terminar una corrección limpia su versión, título, errores y controles; el formulario vuelve a un estado coherente. No se ofrecen correcciones que ya estén bloqueadas por otra solicitud o empresa aprobada.
- **Perfil:** avatar, nombre, profesión y ciudad se muestran según sus datos. Las pestañas responden a cambios de ancla y a navegación por teclado.
- **Alertas:** si falla el guardado se revierte el interruptor y no se anuncia un éxito inexistente.

## Optimización y navegación

La cola administrativa obtiene solicitudes e historial mediante una sola lectura del documento, en lugar de leer y clonar todo el almacén por cada tarjeta. Los eventos se agrupan por entidad una vez. El foro también reúne publicaciones y envíos propios en una sola lectura.

La búsqueda construye un índice de texto al cargar la página. Busca en título, resumen, descripción y habilidades sin distinguir mayúsculas ni acentos. Conserva la página en `?pagina=`, restaura controles al navegar y respeta importes como 850 sin redondearlos al paso anterior del slider. Los salarios no indicados quedan al final al ordenar. El filtro empresarial se muestra y puede quitarse sin borrar los demás filtros.

## Validación

```bash
node tests/integracion.test.cjs
node tests/flujos.test.cjs
node tests/busqueda.test.cjs
node tests/sesion.test.cjs
```

35 pruebas automatizadas en total. Cubren los flujos originales y las regresiones de esta revisión, incluyendo conflictos entre pestañas, corrupción del almacenamiento, privacidad de sesión, estados inválidos, búsqueda y permisos de aprobación.

En navegador: verificadas las diez pantallas, cambio de cuenta entre pestañas, actualización de sesión, navegación entre pestañas del perfil, página 2 del buscador tras recargar, búsqueda sin acentos y filtro empresarial visible. Los flujos principales se revisaron a 480 px, sin desbordes en las vistas comprobadas.

## Límites

El portal conserva su arquitectura estática y cuentas de demostración. No se ha implementado autenticación de servidor ni una base de datos. Estos controles locales no constituyen una barrera de seguridad frente a alguien que edite su navegador. El acceso concurrente real y la protección multiusuario corresponden a la API Node/PostgreSQL descrita en los documentos de arquitectura. Los archivos de CV y los correos continúan fuera de este prototipo.

Los cambios de esta auditoría se dejan en el espacio de trabajo; no se publican automáticamente en GitHub.
