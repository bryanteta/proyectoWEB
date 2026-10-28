> Modelo actualizado: consulta [ROLES-Y-COMUNIDAD.md](./ROLES-Y-COMUNIDAD.md). La publicación de temas es exclusiva y directa de Administración; los comentarios se filtran automáticamente y las vacantes de empresas aprobadas no pasan por una cola administrativa.

# Preparación del backend Node.js

Estado: propuesta de arquitectura; el portal sigue ejecutándose como sitio estático con almacenamiento local. No se ha instalado ni desplegado un servidor ni conectado una base de datos.

## Base de datos recomendada

Recomiendo **PostgreSQL**. El dominio tiene relaciones claras: una empresa publica muchas vacantes; un candidato puede postular a muchas vacantes; cada postulación tiene un estado. Las claves foráneas, restricciones únicas y transacciones ayudan a mantener esas relaciones. La recomendación es una decisión de diseño para este proyecto.

| Opción | Encaje | Consideración |
|---|---|---|
| PostgreSQL local o en un servidor propio | Desarrollo y despliegue con control de la infraestructura | Hay que operar el servidor, copias y actualizaciones |
| PostgreSQL en Supabase | Servicio administrado; posibilidad de añadir Auth y Storage posteriormente | Decidir si la identidad se gestiona con Supabase o con Node; evitar dos sistemas de sesiones |
| PostgreSQL en Neon | PostgreSQL administrado con conexión desde Node | Evaluar región, conexiones, suspensión y límites del plan antes de contratar |
| SQLite | Demo local y primeras pruebas con un solo servidor | Menor concurrencia de escritura; no compartir el archivo directamente por red |
| MongoDB | Alternativa documental si el dominio cambia hacia documentos muy variables | Para este portal exige decidir referencias e integridad entre muchas entidades; no ofrece una ventaja clara sobre PostgreSQL |

No se han contratado servicios ni verificado precios de planes. Supabase y Neon son opciones de alojamiento de PostgreSQL, no motores de base de datos distintos.

Fuentes oficiales consultadas:

- [Restricciones de PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Usos apropiados de SQLite](https://www.sqlite.org/whentouse.html)
- [Modelado por referencias en MongoDB](https://www.mongodb.com/docs/manual/data-modeling/referencing/)
- [Base de datos PostgreSQL de Supabase](https://supabase.com/docs/guides/database/overview)
- [Conexiones PostgreSQL en Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Driver oficial de Neon para JavaScript](https://github.com/neondatabase/serverless)
- [Consultas parametrizadas con node-postgres](https://node-postgres.com/features/queries)

## Arquitectura propuesta

Navegador → API Node.js → servicios de dominio → repositorios → PostgreSQL.

Una primera implementación puede usar Node.js con TypeScript, Express o Fastify, y `pg` (node-postgres). Son opciones propuestas, no dependencias instaladas. El frontend debe pasar a `fetch` asíncrono con estados de carga y error; no basta con reemplazar `localStorage` por una URL.

```text
backend/
  src/
    app.ts
    routes/         # HTTP y validación de entradas
    middleware/     # sesión y autorización
    services/       # publicar, cerrar, postular, preseleccionar
    repositories/   # consultas parametrizadas
    db/             # pool de conexiones y transacciones
  migrations/
  tests/
```

La identidad y empresa propietaria se obtienen de la sesión validada en servidor. Nunca se aceptan del cuerpo enviado por el navegador para conceder permisos. Sesiones con cookie HttpOnly, Secure en HTTPS y política SameSite apropiada; protección CSRF para operaciones autenticadas, contraseñas con hash y límites en intentos de login.

## Contrato único de vacante

Hoy existe un resumen `VACANTES` y una ficha `DETALLES_VACANTE` por compatibilidad con el prototipo. La API debe derivar listado y detalle de **la misma entidad**; no debe guardar dos copias independientes del título, empresa o estado.

```json
{
  "id": 111,
  "empresaId": 1,
  "titulo": "Desarrollador Node.js",
  "ciudad": "San Salvador",
  "sector": "Tecnología",
  "modalidad": "Remoto",
  "contrato": "Indefinido",
  "nivel": "Junior",
  "salario": null,
  "moneda": "USD",
  "descripcion": "Descripción completa, sin recortar",
  "responsabilidades": ["Construir la API"],
  "requisitos": ["Conocimientos de SQL"],
  "habilidades": ["Node.js", "PostgreSQL"],
  "beneficios": ["Horario flexible"],
  "contacto": {
    "correo": "talento@example.test",
    "telefono": "",
    "direccion": "",
    "responsable": ""
  },
  "estado": "Publicada",
  "destacada": false,
  "publicada": "2026-10-26"
}
```

`null` significa salario no indicado; `0` es un importe válido y distinto. Los campos opcionales vacíos no se sustituyen por teléfonos ni beneficios inventados. El resumen del listado se deriva de la descripción sin alterar el texto completo.

## Entidades

- `usuarios`: identidad, correo único, hash, rol, estado y fechas.
- `sesiones`: sesión revocable, usuario, expiración y token almacenado de forma segura.
- `empresas`: ficha y suspensión.
- `miembros_empresa`: usuario, empresa y permiso dentro de ella.
- `perfiles`: datos profesionales de cada candidato.
- `vacantes`: todos los campos del contrato anterior, empresa y fechas.
- `postulaciones`: candidato, vacante, estado, fecha y versión del CV presentado.
- `curriculums`: metadatos y clave privada del archivo en almacenamiento de objetos.
- `vacantes_guardadas` / `recursos_guardados`: relación única usuario–elemento.
- `resenas`: empresa, autor, puntuación y comentario.
- `recursos`: contenido completo, tipo, categoría y autor.
- `temas_foro` / `respuestas_foro`: autor, cuerpo y estado de moderación.
- `alertas`: usuario y criterios estructurados, no solo el texto mostrado.
- `moderacion` / `auditoria`: contenido afectado, actor, acción y fecha.

Relaciones principales: empresa 1:N vacantes; candidato N:M vacantes a través de postulaciones. `UNIQUE(candidato_id, vacante_id)` impide duplicados; claves foráneas evitan referencias huérfanas. Los cambios administrativos deben poder auditarse.

## Endpoints propuestos

| Método y ruta | Uso y autorización |
|---|---|
| `POST /api/sesion`, `DELETE /api/sesion`, `GET /api/sesion` | Login, logout, sesión actual |
| `GET /api/vacantes` | Filtros, orden y paginación; ofertas disponibles |
| `GET /api/vacantes/:id` | Detalle completo; 404 si no existe |
| `POST /api/empresas/:id/vacantes` | Empresa propietaria o administrador |
| `PATCH /api/vacantes/:id` | Edición por propietario; campos permitidos |
| `PATCH /api/vacantes/:id/estado` | Cerrar/reabrir; retirar/aprobar requiere administración |
| `POST /api/vacantes/:id/postulaciones` | Solo candidato; oferta disponible; duplicado 409 |
| `GET /api/mi/postulaciones` | Solo postulaciones del usuario actual |
| `GET /api/vacantes/:id/postulaciones` | Empresa propietaria o administrador |
| `PATCH /api/postulaciones/:id/estado` | Propietario o administrador; validar transición |
| `GET/PATCH /api/mi/perfil` | Perfil del usuario actual |
| `GET/PUT/DELETE /api/mi/guardados/...` | Guardados del usuario actual |
| `GET/PATCH /api/empresas/:id` | Lectura pública; edición autorizada |
| `GET/POST /api/empresas/:id/resenas` | Listado por empresa y creación autenticada |
| `GET /api/recursos`, `GET /api/recursos/:id` | Biblioteca y contenido |
| `GET/POST /api/temas`, `GET /api/temas/:id` | Listado, publicación y lectura |
| `GET/POST /api/temas/:id/respuestas` | Respuestas autenticadas |
| `GET/POST/PATCH/DELETE /api/mi/alertas` | Criterios del usuario |
| `POST /api/mi/curriculums` | Validación, almacenamiento privado y límites |
| `/api/admin/*` | Usuarios, suspensión, moderación, configuración y auditoría |

Para evitar carreras, la inserción de una postulación debe comprobar disponibilidad y suspensión dentro de una transacción, bloqueando las filas relevantes en un orden consistente con el cierre/suspensión. La restricción única sigue siendo necesaria aunque el frontend desactive el botón. Las estadísticas y contadores deben derivarse de consultas, no de constantes de la interfaz.

Los CV requieren almacenamiento de archivos privado y descargas autorizadas; PostgreSQL conserva sus metadatos. No exponer una carpeta pública con documentos personales.

## Migración por etapas

1. Crear migraciones y semillas de demostración en una base de desarrollo.
2. Implementar sesión, propiedad empresarial y pruebas de autorización en servidor.
3. Migrar publicación, búsqueda, detalle, cierre y postulaciones como un flujo completo.
4. Migrar perfiles, guardados, reseñas, recursos y foro.
5. Implementar archivos, respuestas, alertas por correo y moderación real.
6. Reemplazar estadísticas ficticias con consultas y pruebas de concurrencia.

La importación de `localStorage`, si se ofrece, debe validarse: contiene datos editables por el usuario y no es una fuente confiable para roles, identidad ni estados administrativos.

## Actualización: aprobaciones y registro

La moderación previa de temas y las solicitudes empresariales ya tienen un flujo funcional local. Ver [REVISION-Y-REGISTRO.md](REVISION-Y-REGISTRO.md) para estados, datos solicitados, reglas, transacciones, índices y endpoints. Este documento más reciente sustituye el comportamiento de publicación directa del foro descrito en versiones anteriores.

## Selección de candidatos y directorio público

El directorio público (`directorio.html`) consulta exclusivamente empresas aprobadas y activas. No devuelve datos fiscales ni contactos de revisión. La ficha pública relaciona empresa, ofertas disponibles y reseñas. `empresas.html#directorio` conserva su URL por compatibilidad, pero representa **Mi empresa**, con edición de la ficha propia. Administración mantiene las bajas y aprobaciones.

Las candidaturas tienen etapas explícitas: Nueva → En revisión → Preseleccionada → En entrevista → Seleccionada → Contratada. Se permite preseleccionar desde Nueva y seleccionar desde Preseleccionada. Rechazar exige motivo; reconsiderar un rechazo vuelve a En revisión, también con motivo. Contratada es terminal. Seleccionar no cierra vacantes ni descarta automáticamente otros candidatos: una vacante puede tener varias plazas.

El prototipo conserva estado, versión e historial en una misma entrada de `pt_candidatos_estado`, compatible con los strings heredados. La UI usa la clave estable de la candidatura, no el índice visual. El perfil del candidato consulta el mismo seguimiento y los mensajes enviados por la empresa. La postulación conserva una instantánea del perfil enviado, sin copiar cambios futuros de la cuenta.

Para Node: `GET /api/empresas`, `GET /api/empresas/:id`, `GET /api/empresas/:id/vacantes`, `GET /api/mi/empresa`, `PATCH /api/mi/empresa`, `GET /api/mi/empresa/vacantes/:id/candidaturas` y `POST /api/candidaturas/:id/transiciones`. El último endpoint debe validar pertenencia, etapa y versión, y guardar estado + evento de historial en una transacción. El mensaje se comunica al candidato; las notas internas futuras necesitan un campo y permisos distintos. Usar UUID para candidaturas y eventos; índice por vacante/estado y paginación. La versión evita revisiones obsoletas en la demo, pero no garantiza concurrencia multiusuario de localStorage.

No se ofrece una descarga ficticia de CV: la candidatura informa que no hay archivo disponible hasta integrar almacenamiento privado. No se envían correos al cambiar etapas.
