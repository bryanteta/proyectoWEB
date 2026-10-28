# Modelo vigente de cuentas y comunidad

Esta revisión sustituye el modelo anterior de solicitantes tratados como candidatos y de temas enviados a moderación. Los documentos anteriores y el PDF representan capturas históricas; este archivo describe las reglas actuales.

## Registro y navegación

Desde `login.html` se puede iniciar sesión o crear una cuenta de tipo **Candidato** o **Empresa**. Candidato abre su perfil laboral; Empresa crea una identidad de **solicitante empresarial**, que completa la ficha de la organización. Esa identidad no tiene perfil de candidato, currículum ni permiso para postular a empleos.

La navegación pública Empresas abre el directorio para todos. El acceso personal de un solicitante apunta siempre a su registro empresarial, incluso después de abrir búsqueda, recursos o foro. Una vez aprobada la organización, la membresía convierte el acceso efectivo en Empresa y abre el módulo empresarial. La cuenta demo `solicitante` guardada antiguamente como candidato se reconoce como solicitante; las membresías aprobadas se conservan.

El candidato que quiere registrar una organización debe crear una cuenta de Empresa. No se cambia su tipo de cuenta al pulsar un enlace ni se mezclan sus datos laborales con los de una organización.

Las nuevas cuentas locales conservan una clave derivada con PBKDF2 y sal aleatoria, nunca la contraseña escrita. Esto sigue siendo una demostración local, no autenticación de servidor. Las cuentas demo permanecen disponibles y usan contraseñas ficticias. Administración muestra también las nuevas cuentas locales. Los nuevos candidatos comienzan sin currículum ni habilidades ajenas de ejemplo.

## Empresas y vacantes

Administración aprueba organizaciones, no cada publicación. Una empresa aprobada y activa publica vacantes directamente. Se conserva la gestión propia de ofertas, cierre/reapertura y candidaturas. Se retiraron el panel, las acciones y el acceso de gestión masiva de vacantes de administración. La suspensión empresarial sigue bloqueando publicación y operaciones empresariales.

## Foro editorial

Solo Administración puede crear, editar, publicar, archivar, fijar y abrir/cerrar comentarios de los temas. La publicación administrativa es directa; no existe una segunda aprobación. Las comprobaciones se aplican también en las operaciones de dominio, no solo ocultando botones.

Los seis temas base pertenecen al equipo del portal. Los temas anteriores enviados por usuarios no se publican automáticamente bajo el modelo nuevo: se conservan como registros anteriores en la gestión editorial. Administración puede revisarlos, editarlos y publicarlos bajo su responsabilidad. Archivar no borra el registro ni su historial. Una versión desactualizada no puede sobrescribir una edición posterior.

## Comentarios y reseñas

Los usuarios autenticados pueden comentar en un tema publicado y abierto. Los comentarios se publican inmediatamente; no hay cola de moderación. Un filtro base y palabras adicionales configuradas por Administración sustituyen coincidencias por `***`. Reconoce palabras completas, mayúsculas, acentos y algunas sustituciones de letras y separadores. No censura una palabra solo por contener otra como subcadena.

El filtro se aplica a comentarios y reseñas al guardar y al mostrar datos anteriores. Los comentarios nuevos conservan únicamente el texto ya censurado. Quitar una palabra del filtro adicional no recupera texto que ya se guardó censurado. El autor puede retirar su comentario y Administración puede hacerlo excepcionalmente, sin revisar cada comentario antes de publicarlo. Los comentarios repetidos o enviados muy rápidamente al mismo tema se rechazan con un mensaje.

El filtro de palabras no comprende todo el contexto ni garantiza detectar cualquier evasión. En producción debe ejecutarse en el servidor y acompañarse de límites de frecuencia y mecanismos de denuncia.

## Preparación para Node

Separar `tipo_cuenta` (candidato / empresa / administrador), estado del registro empresarial y membresías. Validar permisos desde sesión de servidor. Registrar organización y aprobarla con transacciones. Las vacantes de empresas aprobadas nacen publicadas. Usar estados editoriales publicado/archivado y versión para temas; los comentarios se vinculan a un tema y conservan autor, texto censurado, fecha y retirada.

La implementación actual usa `pt_cuentas_locales`, `pt_flujos_v1`, `pt_comentarios_foro` y `pt_filtro_comentarios`. No garantiza concurrencia multiusuario, identidad segura ni cifrado de los datos del navegador. Para migrar, usar una API autenticada, repositorios por entidad, transacciones, paginación e índices por organización/estado/tema y permisos de propietario.

## Actualización: administración independiente y foro multimedia

Las acciones de guardar ofertas y dejar reseñas son exclusivas de candidatos. La publicación y gestión de vacantes y candidaturas son exclusivas de la empresa propietaria habilitada. Administración consulta la información pública, aprueba/suspende organizaciones y administra el foro; no puede publicar ofertas, postularse, guardar ni reseñar. Las reseñas antiguas identificadas como administrativas o empresariales no se utilizan para calcular reputación pública, sin borrar los registros guardados.

La antigua Gestión de usuarios se reemplaza por **Personal administrativo**. Solo lista cuentas administrativas y permite crear/suspender accesos internos. No incluye candidatos ni duplica las cuentas empresariales. La gestión de organizaciones continúa en Gestión de empresas. El alta de personal exige una sesión administrativa y no cambia la identidad del creador. La cuenta propia no se puede suspender.

Los temas base ya no aparecen fijados por datos de ejemplo. Fijar/Desfijar es una acción administrativa visible junto al tema, persistente y con control de versión. El distintivo indica que lo fijó administración.

El editor permite adjuntar una imagen PNG/JPEG/WebP de hasta 3 MB y 4096 × 4096 píxeles, con descripción alternativa. Se valida formato real y decodificación. Los archivos se guardan en IndexedDB separados del documento de temas y sobreviven a recargas en el mismo navegador. Los videos admiten enlaces HTTPS normalizados de YouTube o Vimeo. No se aceptan iframes ni HTML arbitrario, y el reproductor externo solo se carga tras pulsar Reproducir. No se implementó carga directa de archivos de video.

Los comentarios se consultan de diez en diez, con orden por recientes/antiguos y página acotada al rango existente. Los textos largos se presentan con lectura ampliada. Los temas públicos y la gestión editorial también se paginan. Los contadores se calculan con una lectura agrupada de comentarios, en lugar de volver a leer el almacenamiento por cada tema.

Esto limita el DOM, pero el prototipo todavía consulta los datos locales completos. Para producción, la API debe paginar por cursor y devolver conteos agregados, con índices por tema/fecha/id. Las imágenes pasarán a un almacenamiento de objetos con permisos y URLs de lectura; IndexedDB no comparte archivos entre equipos. El backend debe aplicar nuevamente las mismas restricciones de permisos, tipo, tamaño y contenido.
