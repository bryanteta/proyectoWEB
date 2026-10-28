# Localización para El Salvador

El portal está orientado a El Salvador. La configuración compartida `CONFIG_PORTAL`, en `js/datos.js`, define país `SV`, idioma `es-SV`, moneda `USD`, zona horaria `America/El_Salvador`, prefijo telefónico `+503` y las ubicaciones de demostración.

## Cambios

- Ubicaciones compartidas: San Salvador, Santa Tecla, Santa Ana, San Miguel y Sonsonate. Se usan en portada, búsqueda, perfil, alertas y publicación. El registro ofrece estas ciudades como sugerencias y permite escribir otras localidades.
- Las empresas y vacantes semilla pertenecen a El Salvador. Andes Software se sustituyó por Cuscatlán Software; se adaptaron fichas, autores y material de ejemplo.
- Teléfonos de ejemplo con +503, direcciones de demostración salvadoreñas y correos reservados `.example`, para no atribuir contactos ficticios a dominios reales.
- Números con formato salvadoreño; por ejemplo, `$1,250`. Se mantienen salarios ficticios: no son referencias de mercado ni mínimos legales.
- Fechas de calendario y revisión en la zona horaria de El Salvador, independientemente de la del dispositivo.
- Nuevas solicitudes empresariales limitadas a país `SV`, con NIT y teléfono nacional de ocho dígitos, con +503 opcional. Se normaliza el teléfono al guardar. La validación no certifica la autenticidad tributaria del NIT.
- Las diez páginas declaran `lang="es-SV"` y el portal identifica explícitamente su ámbito nacional.

## Compatibilidad con datos anteriores

Los antiguos nombres de ciudades de la demo se adaptan al leer las preferencias y publicaciones: Quito → San Salvador; Guayaquil → Santa Tecla; Cuenca → San Miguel; Loja → Santa Ana; Ambato → Sonsonate. Esto representa un cambio de ejemplos del prototipo, no una equivalencia geográfica real.

La adaptación no borra el almacenamiento ni modifica mensajes, descripciones escritas por usuarios, identificaciones fiscales o auditorías históricas. Solo normaliza ubicaciones y valores conocidos de demostración. Las solicitudes aprobadas anteriormente conservan la información de su revisión; las nuevas solicitudes deben corresponder a El Salvador.

## Validación

```bash
node tests/integracion.test.cjs
node tests/flujos.test.cjs
node tests/busqueda.test.cjs
node tests/sesion.test.cjs
node tests/localizacion.test.cjs
```

41 pruebas automatizadas, incluidas seis específicas de localización. En navegador se comprobaron las diez pantallas sin errores de consola ni referencias antiguas en las vistas revisadas, el filtro de Santa Ana con sus resultados y el detalle de vacante en San Salvador con contacto +503.
