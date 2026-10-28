# Moderación previa y registro empresarial

## Comportamiento implementado

Los temas enviados desde el foro pasan a `pendiente`. Solo `aprobado` entra en el listado público y en sus contadores. El autor consulta sus envíos y el motivo de rechazo; otra persona no ve los pendientes del autor. Un rechazo requiere entre 10 y 1000 caracteres de explicación. El autor puede corregir un rechazado y reenviarlo: vuelve a pendiente y aumenta su versión. No se permite editar un aprobado mediante esta operación.

La cola administrativa permite filtrar por estado, buscar, revisar el mensaje completo y consultar el historial. Se pagina a diez solicitudes por vista. Los seis temas de ejemplo se consideran previamente aprobados. Los envíos heredados del almacenamiento anterior se migran a pendientes; nunca se aprueban por omisión. Si no se conserva su mensaje original, deben corregirse antes de aprobarse.

Las empresas disponen de `registro-empresa.html`. La solicitud exige una cuenta autenticada y estos datos:

- Razón social y nombre comercial.
- País de registro El Salvador e identificación fiscal de la empresa (NIT).
- Sector, tamaño, ciudad, dirección comercial y descripción de la actividad.
- Nombre, cargo, correo y teléfono del contacto responsable.
- Confirmación de representación y exactitud de la información.
- Sitio web opcional, limitado a HTTP/HTTPS sin credenciales.

Los datos fiscales y del contacto quedan en la solicitud de revisión; la ficha del directorio solo recibe los datos públicos. Se normaliza la identificación para detectar duplicados dentro de un país. No se verifica automáticamente la autenticidad del identificador ni del correo.

Una empresa pendiente o rechazada no tiene ficha pública ni obtiene acceso empresarial. Administración revisa los datos completos y aprueba o rechaza con motivo. La aprobación crea la empresa y su membresía de propietario en la misma escritura que la decisión y su auditoría. El login y la sesión obtienen el acceso empresarial de esa membresía, no de un campo que el solicitante envía. Una cuenta administra una empresa en esta primera versión.

Las seis empresas semilla representan registros ya aprobados. Se mantiene su funcionamiento y el de la cuenta `empresa`.

## Estados y autorización

| Entidad | Transición | Actor |
|---|---|---|
| Tema / registro empresarial | Nuevo → pendiente | Usuario autenticado |
| Pendiente | Aprobado | Administrador distinto del autor |
| Pendiente | Rechazado, con motivo | Administrador |
| Rechazado | Pendiente, nueva versión | Autor |
| Empresa aprobada | Suspendida / reactivada | Administración, desde el directorio |

Se comprueba `id + version + estado` antes de decidir. Repetir una aprobación o usar una versión vieja devuelve conflicto. Se registran actor, fecha UTC, acción, motivo y versión; los eventos de envío conservan una copia del contenido de esa revisión. La interfaz muestra las fechas en la zona del navegador.

## Organización del código

- `js/dominio-flujos.js`: validaciones y transiciones sin DOM, importable desde Node con `require`. Recibe repositorio, actor autenticado, reloj e identificadores mediante inyección de dependencias.
- `js/flujos.js`: adaptador de almacenamiento local, migración y traducción de errores para la interfaz.
- `js/foros.js`: foro público y envíos propios.
- `js/registro-empresa.js`: formulario, estado, corrección y reenvío.
- `js/admin-revisiones.js`: colas, búsqueda, paginación, decisiones e historial.
- `js/datos.js`: hidrata las empresas aprobadas antes de cargar vacantes y calcula la sesión empresarial desde las membresías.

Se utiliza `pt_flujos_v1` para guardar solicitudes, temas, empresas aprobadas, membresías y auditoría como un solo documento versionado. Esta decisión evita escrituras parciales dentro de una operación local. No representa una transacción multiusuario: dos pestañas todavía pueden competir por ese documento. Una escritura rechazada no produce éxito en la interfaz.

## Paso a Node y PostgreSQL

El módulo de dominio se ejecuta ya en las pruebas de Node. El adaptador actual es síncrono y carga el documento completo; **no debe trasladarse tal cual a un servidor con muchos usuarios**. Para producción, las operaciones deben utilizar repositorios asíncronos por entidad y transacciones en PostgreSQL, manteniendo los mismos estados, validaciones y códigos de error.

Tablas propuestas:

- `solicitudes_empresa`: id UUID, solicitante, datos de registro, estado, versión, timestamps y revisor.
- `revisiones_solicitud_empresa`: copia inmutable de los datos de cada envío y su versión.
- `empresas`: ficha pública aprobada, referencia única a la solicitud, estado de suspensión.
- `miembros_empresa`: empresa, usuario, permiso; única por usuario/empresa. Preparada para varias personas por organización.
- `temas_foro`: autor, título, categoría, cuerpo, estado, versión y fechas.
- `revisiones_tema`: contenido inmutable de cada envío.
- `eventos_revision`: tipo de entidad, id, versión, acción, actor, motivo y fecha.

Restricciones e índices necesarios:

- UUID generados en servidor, claves foráneas y `CHECK` para estados y puntuaciones.
- Índice único sobre `(pais, identificacion_normalizada)` para empresas; índice parcial en solicitudes no rechazadas para impedir registros simultáneos duplicados.
- `UNIQUE(solicitud_id)` en empresas para impedir crearla dos veces.
- Índices de las colas por `(estado, creada, id)` y de envíos propios por `(solicitante_id, creada, id)`; paginación por cursor en la API.
- Transacción para decidir: bloquear solicitud, comprobar versión y permisos, crear empresa/membresía cuando corresponda, escribir evento y confirmar todo junto. Si falla cualquier escritura, rollback.
- `UPDATE ... WHERE id = $1 AND version = $2 AND estado = 'pendiente' RETURNING ...` como control de concurrencia; ausencia de fila → HTTP 409.
- Clave de idempotencia por operación, vinculada al actor y al hash de la petición, para reintentos de red. La protección por versión actual evita dobles decisiones, pero no sustituye una respuesta idempotente del servidor.
- Sesión autenticada en servidor, permisos por organización, cookies seguras, protección CSRF, límites de tamaño/frecuencia y consultas parametrizadas.

Endpoints:

| Método / ruta | Responsabilidad |
|---|---|
| `POST /api/temas` | Enviar a moderación; el servidor fija pendiente y autor |
| `GET /api/temas` | Solo aprobados |
| `GET /api/mi/temas` | Estado y contenido de los envíos propios |
| `PUT /api/mi/temas/:id/reenvio` | Corregir un rechazado con versión |
| `POST /api/solicitudes-empresa` | Enviar registro |
| `GET /api/mi/solicitudes-empresa` | Consulta privada del solicitante |
| `PUT /api/mi/solicitudes-empresa/:id/reenvio` | Corregir rechazo |
| `GET /api/admin/temas` | Cola paginada y filtrada |
| `GET /api/admin/solicitudes-empresa` | Cola privada de empresas |
| `POST /api/admin/temas/:id/decision` | Decisión, versión y motivo |
| `POST /api/admin/solicitudes-empresa/:id/decision` | Aprobación/rechazo transaccional |
| `GET /api/admin/revisiones/:tipo/:id` | Historial autorizado |

En producción también hacen falta verificación de correo, política de retención de datos, recuperación de acceso, notificaciones y, si se solicitan documentos, almacenamiento privado con permisos. No se solicitan archivos en esta versión. El registro empresarial no equivale a implementar el alta de identidades nuevas: aquí se usan cuentas de demostración.

## Pruebas y demostración

```bash
node tests/integracion.test.cjs
node tests/flujos.test.cjs
```

La segunda suite verifica autorización, privacidad de pendientes, rechazo y reenvío, control de versiones, rechazo de estados/identidades enviados por el cliente, duplicados, validación, fallos de escritura y activación empresarial después de recargar.

Cuenta adicional para probar el alta empresarial: `solicitante / solicitante123`. Las cuentas `candidato`, `empresa` y `admin` conservan sus credenciales. Una vez aprobada, la cuenta solicitante entra al módulo de su empresa.

Se comprobó en navegador el flujo completo: tema pendiente → aprobación → publicación; empresa pendiente → rechazo con motivo → corrección → nueva revisión → aprobación → acceso empresarial → publicación de una vacante con la empresa y ciudad correctas. Los registros QA son ficticios.

La aplicación continúa siendo estática. Los controles locales pueden ser alterados desde el navegador y no sustituyen la autorización de un backend. No se ha desplegado ningún servicio ni enviado información a terceros.

Revisión visual: registro, foro, login y colas administrativas comprobados a 480 px; corregido el ancho mínimo del panel empresarial, también con datos privados e historial desplegados. No se detectaron errores de consola en los flujos probados. La sesión de revisión quedó en administración y las solicitudes QA muestran las decisiones persistidas.


Actualización de localización: el registro nuevo se limita a El Salvador (SV); el teléfono acepta ocho dígitos nacionales, con prefijo +503 opcional, y se guarda con ese prefijo. La revisión no comprueba la autenticidad tributaria del NIT. Los registros e historiales anteriores conservan sus datos originales.
