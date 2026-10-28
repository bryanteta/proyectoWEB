# Revisión de flujos empresariales y selección

- Directorio público para visitantes y candidatos, separado de Mi empresa y de la administración. Filtros por texto sin acentos, rubro, ciudad y vacantes abiertas; fichas con descripción, ofertas y reseñas reales del almacén de la demo. No se muestran organizaciones suspendidas o pendientes.
- Mi empresa permite editar la ficha propia y ver su resultado público. Las decisiones de registro y suspensión permanecen en administración.
- Mis ofertas enlaza directamente a sus postulantes; el puesto queda en la URL y se recupera al recargar.
- Candidaturas con búsqueda, filtro por etapa, resumen, ficha del perfil enviado e historial. El proceso continúa más allá de la preselección hasta entrevista, selección y contratación; rechazo y reconsideración requieren un motivo.
- Claves estables y versión esperada para que una lista filtrada o ficha obsoleta no cambie otra candidatura ni reemplace una decisión posterior.
- Estado y mensajes visibles en el perfil del candidato. Una selección no cierra el puesto ni rechaza otras solicitudes.
- Administración debe escoger la empresa cuando publica una oferta, en lugar de asignarla silenciosamente a la primera empresa.
- Las valoraciones llevan a la ficha con sus reseñas. Hay estados vacíos explícitos y no se promete descargar un CV que no existe.
- La edición empresarial admite una descripción de hasta 3000 caracteres, coherente con el registro. Los ajustes de correo, mantenimiento y reseñas se explican como preferencias que requieren backend.

Validación: ocho pruebas nuevas de dominio cubren proceso completo, privacidad del directorio, filtros, permisos, rechazos, revisiones obsoletas, compatibilidad de estados, fallos de escritura y conservación del perfil enviado. Se conservan las pruebas anteriores. En navegador se revisa la conexión de Mis ofertas a candidatos y la selección de una candidatura QA, seguida de la lectura del estado y mensaje desde la cuenta candidata.

El sitio sigue siendo un prototipo estático con almacenamiento local. Los datos de prueba y las decisiones QA son ficticios. El PDF de pantallas se actualizó a 51 páginas con las correcciones de directorio, selección y valoraciones. La reputación empresarial ahora presenta promedio, distribución y reseñas completas a todo el ancho del panel; las empresas consultan su propia organización y administración puede seleccionar otra. Tres pruebas adicionales verifican el ámbito por cuenta y los estados sin reseñas.
