# Auditoría de rendimiento y datos

Fecha: 26 de octubre de 2026.

## Alcance

Se revisaron las rutas públicas y del administrador, los Route Handlers, los módulos de Prisma y las reglas de caché e imágenes. Se midió el snapshot relacional con consultas de solo lectura contra la conexión directa de TiDB y se ejecutó `EXPLAIN` para catálogo y precios. No se ejecutaron `EXPLAIN ANALYZE`, pruebas de carga ni escrituras de prueba en la base compartida.

## Mejoras aplicadas

| Área | Cambio | Efecto esperado |
| --- | --- | --- |
| Lectura pública | Snapshot relacional cacheado entre pedidos durante cinco minutos, con invalidación inmediata al guardar contenido o cambiar la conexión de Instagram. Los errores de base de datos no se guardan como contenido por defecto en la caché. | Evita reconstruir el catálogo y los textos para cada visita. |
| Instagram | El usuario público y la presencia de una conexión se leen una vez dentro del snapshot cacheado. Sin conexión, la portada evita volver a consultar TiDB. Las cachés vencidas de publicaciones y archivos se sirven durante su período de respaldo y se renuevan después de responder, con una renovación por instancia. La sección se transmite con `Suspense`. | Evita llamadas repetidas a TiDB y a Meta y permite entregar el Hero aunque una primera carga de Instagram tarde. |
| SQL de lectura | `ContentSection` se consulta una sola vez por snapshot; las tablas de secciones no guardadas no se consultan. El nombre de categoría se toma de las categorías ya leídas. Las imágenes, talles, colores y precios activos se leen con un `UNION ALL` y se reconstruyen en memoria. | En la medición directa del snapshot, pasó de 19 a 6 consultas SQL. |
| SQL de escritura | El guardado de categorías, productos y tarjetas del inicio reutiliza las filas ya cargadas. Los precios activos de productos modificados se leen juntos y se desactivan en una operación. | Reduce consultas dentro de transacciones largas. |
| Render público | Se quitó la segunda copia de `ContentProvider` en inicio, catálogo y detalle. El proveedor público recibe productos sin galerías ni descripciones; el detalle recibe solo la prenda completa abierta. La portada consulta Instagram solamente cuando la sección está visible. | Reduce datos serializados y trabajo de servidor y navegador. |
| Navegador | La lista de productos resuelta se calcula una vez por actualización del proveedor. Los nombres para las URLs de productos se agrupan una vez por catálogo. | Evita volver a recorrer y ordenar todo el catálogo por cada tarjeta. |
| Imágenes | Las fotos propias de Cloudinary usan `srcSet` con ancho, formato y calidad automáticos. La foto original queda como respaldo si falla una transformación. | Reduce bytes descargados en móviles, tarjetas y miniaturas sin duplicar URLs en la base de datos. |
| Subida de imágenes | La limpieza se agenda después de responder y comprueba primero si hay reservas vencidas o borrados pendientes; una cola vacía tampoco vuelve a leer el snapshot. Al guardar contenido, solo se borran o agregan filas de la cola que cambiaron. | Evita reconstruir el snapshot y ejecutar un `DELETE` sin efecto cuando no hay imágenes para limpiar. |

## Medición directa de TiDB

La base consultada tiene 11 productos, 8 categorías, 1 fila de `ProductImage`, 1 tarjeta de categoría y ninguna fila en `ProductPaymentPrice`, `InstagramConnection`, `InstagramFeedState`, `InstagramFeedPost`, `InstagramMediaEntry`, `CloudinaryCleanup` o `Media`. Las únicas secciones guardadas son `homeCategoryCards`, `homeSections` y `products`.

| Snapshot relacional | Original | Secciones guardadas | Relaciones agrupadas |
| --- | ---: | ---: | ---: |
| Consultas SQL registradas | 19 | 9 | 6 |
| Tiempo de pared de muestras calientes | 2.580–2.639 ms | 946–1.412 ms | 933–1.105 ms |

Son pocas ejecuciones secuenciales desde este entorno; estas cifras no representan p50/p95 ni una comparación bajo carga. El tiempo SQL acumulado de consultas concurrentes no equivale al tiempo de pared. `EXPLAIN` mostró un escaneo completo y ordenamiento de `Product` sobre solo 11 filas estimadas; el plan de precios usa el índice de `productId`, aunque la tabla está vacía. Por ahora, reducir viajes a TiDB aporta más evidencia de beneficio que agregar índices.

Se comparó el mismo snapshot de solo lectura con pools de 5 y 10 conexiones (tres ejecuciones por configuración). Tras la primera conexión, los tiempos fueron 1.409 y 946 ms con 5 conexiones, frente a 1.414 y 1.073 ms con 10. No se observó una mejora consistente, por lo que el pool de producción quedó en 5.

También se probó la función Preview `relationJoins` de Prisma para reunir las relaciones del producto en una consulta. La lectura directa devolvió `P2019` y no completó el snapshot en TiDB. Se retiró esa función y se regeneró el cliente; la consulta de producción sigue usando la estrategia que sí completó las lecturas. No hay evidencia para activar `join` en este entorno.

La consulta `UNION ALL` de producción se probó también dentro de una transacción de solo lectura. La ruta de detalle, la portada y el catálogo conservaron el cuerpo HTML previo en la prueba local. La tabla de precios está vacía hoy; el orden y la conversión de importes se verificaron con pruebas unitarias, pero falta observar filas reales de precios en TiDB.

En una comprobación HTTP local del build de producción, `/` respondió con 200 en 4.994 ms en frío y 725 ms en una segunda visita; `/productos` respondió con 200 en 37 ms con la caché ya caliente. Después de reducir el producto enviado al proveedor público, una nueva comprobación recibió 200 en portada, catálogo y detalle; el cuerpo HTML de portada y catálogo bajó aproximadamente 737 bytes en cada ruta con los 11 productos actuales. El detalle conservó el nombre y la acción de compra. Son solicitudes de un solo cliente: no representan una prueba de carga ni permiten comparar las latencias de ambas compilaciones.

Con la conexión de Instagram vacía y su estado incluido en la caché pública, una comprobación posterior midió `/` en 36 y 16 ms con la caché caliente; `/productos` respondió en 26 ms. La primera visita de esa ejecución tardó 4.363 ms por la lectura fría. Los tiempos dependen de red, arranque y caché, pero la ausencia de la consulta adicional a TiDB está confirmada por el código y el conteo de conexiones.

## Riesgos a vigilar al crecer el catálogo o el tráfico

### Catálogo completo en la lectura SQL y las listas públicas

`src/server/content.ts` y `src/server/catalog.ts` cargan todos los productos con imágenes, talles, colores y precios incluso para un detalle individual. Las relaciones ahora requieren un solo viaje SQL y la caché reduce el trabajo de TiDB; el proveedor público ya omite galerías y descripciones. Sin embargo, las listas de portada y catálogo todavía contienen todos los productos en el cliente. El costo crecerá con la cantidad de productos. Medir p95 y tamaño del payload cuando el catálogo crezca; después separar consultas de lista paginada y detalle individual, conservando `resolveContent` y los valores por defecto.

### Guardado masivo de productos con escrituras secuenciales

`src/server/catalog.ts` recibe el catálogo entero en un PUT, pero omite las prendas que no cambiaron. Para cada producto modificado hace `upsert` y, según el cambio, borra y vuelve a crear imágenes, talles y colores; cada precio se guarda con otro `upsert`. El editor actual no permite reordenamiento masivo de productos y la tabla de precios está vacía, por lo que no se observó ese caso costoso en los datos actuales. Si aparece edición por lote, medir filas modificadas y duración de la transacción antes de reemplazar el PUT completo por operaciones individuales o lotes de cambios.

### Primera carga de Instagram y coordinación entre instancias

`src/server/instagram.ts` ahora entrega datos guardados durante el período de respaldo y renueva tras responder. Si no existe caché, si llegaron publicaciones nuevas o si la caché superó ese período, la visita todavía puede esperar mientras se recorren hasta 30 páginas de Meta y se piden los archivos. El control de renovaciones simultáneas vive en cada proceso; un despliegue con varias instancias necesita coordinación compartida si se observa una carga alta. Las URLs de archivos pueden expirar y no deben persistirse en el navegador.

### Limpieza de imágenes con cola grande

`src/server/content.ts` vuelve a leer todas las secciones y productos para demostrar que una URL de Cloudinary ya no está referenciada. Esa comprobación evita borrar fotos usadas en otra sección y debe preservarse. Si la cola crece, conviene medir su tamaño y evaluar una consulta específica de referencias o una tabla de referencias mantenida transaccionalmente. `drainCloudinaryCleanupQueue` procesa elementos uno por uno y hoy no tiene límite por pasada.

### Fotos heredadas en TiDB

`src/app/api/media/[id]/route.ts` lee un `LongBlob` completo en cada fallo de caché del navegador. La respuesta tiene caché privada e inmutable durante un año; el enlace firmado dura diez años. La tabla `Media` consultada está vacía, así que esta ruta no explica la lentitud medida. Las imágenes nuevas usan Cloudinary.

### Índices y ordenamientos

`Product`, `Category` y varias tablas de secciones se ordenan por `position, id`. Los índices existentes cubren IDs y relaciones, pero no todos esos ordenamientos. Con 11 productos y el plan observado no hay justificación para agregar índices ahora. Si el catálogo crece o aparecen consultas lentas, medir con `EXPLAIN ANALYZE` antes de preparar una migración versionada. No se aplicó ninguna migración.

## `localStorage` y redundancia

Las URLs de imágenes y el contenido público tienen una fuente de verdad en el servidor. Guardarlos también en `localStorage` duplicaría datos, complicaría la invalidación después de una edición y no aceleraría la descarga de imágenes: esa reutilización corresponde a la caché HTTP del navegador y a Cloudinary. El proyecto ya usa `localStorage` para preferencias del administrador, donde sí corresponde. El carrito vive solo en memoria; persistirlo sería una decisión funcional, no una optimización de SQL.

`Product.image` y la primera fila de `ProductImage` conservan la misma portada para compatibilidad. Antes de quitar una copia hay que contar productos heredados que dependen de `Product.image` y preparar migración sin pérdida de datos. El nombre de categoría ya no se vuelve a cargar mediante la relación de cada producto en la lectura del catálogo.

## Validación recomendada en el entorno real

1. Registrar p50 y p95 de `/`, `/productos`, detalle y guardado de productos, junto con tiempo y número de consultas de TiDB.
2. Repetir `npm run db:audit-performance` cuando aumenten los datos. El comando cuenta filas relevantes y muestra planes `EXPLAIN` del catálogo y los precios; `-- --summary` deja solo los conteos y `-- --snapshot-only --pool=5 --repeat=3` mide únicamente el snapshot. `--legacy-relations` permite comparar las consultas de Prisma anteriores. Medir también el tamaño del payload enviado al cliente.
3. Tomar las consultas lentas de TiDB y ejecutar `EXPLAIN ANALYZE` en una réplica o ventana controlada. Preparar SQL versionado y pedir autorización antes de aplicar migraciones en un entorno compartido.
4. Confirmar si el despliegue usa varias instancias. La invalidación de caché entre instancias requiere un backend compartido o dependerá del vencimiento de cinco minutos. Los cambios hechos por scripts que evitan los Route Handlers también pueden tardar hasta cinco minutos en verse.

## Verificaciones locales

`npm test` (43 pruebas), `npm run lint`, `npm run typecheck`, `git diff --check` y `npm run build` completaron correctamente. Un intento de build dentro del sandbox falló por `EPERM` al crear directorios de `.next`; el mismo build terminó al ejecutarse fuera de esa restricción. La portada, el catálogo y un detalle devolvieron HTTP 200 desde el servidor local de producción. La primera ejecución de la auditoría a TiDB devolvió `P2039` porque el sandbox bloqueaba DNS; con la conexión directa fuera de ese bloqueo, la lectura de solo lectura terminó correctamente.
