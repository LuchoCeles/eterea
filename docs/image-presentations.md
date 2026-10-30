# Formatos y encuadres de imágenes de producto

## Modelo

Cada fila de `ProductImage` conserva la URL original. `format`, `zoom`, `offsetX` y `offsetY` describen la vista de galería. `sourceWidth` y `sourceHeight` corresponden al archivo original. La primera fila puede incluir `coverZoom`, `coverX` y `coverY`: describen exclusivamente la portada 16:9. La posición cero sigue siendo la única portada activa.

Los campos son opcionales. Una fila anterior, con valores nulos, mantiene la entrega y el recorte visual previos. `Product.image` continúa apuntando a la primera URL para conservar las referencias existentes. Los parámetros se guardan en columnas relacionales tipadas; no se modifica el archivo de Cloudinary ni se almacena una segunda URL.

El editor calcula el encuadre sobre el archivo original. La entrega de Cloudinary extrae esa región mediante `c_crop` y después aplica los tamaños optimizados existentes. La portada usa siempre 16:9; las vistas de galería usan el formato elegido para cada foto. Las tarjetas de catálogo y carrusel conservan el marco 4:5 y muestran la portada nueva completa con un fondo neutro. Las filas anteriores siguen usando `object-cover`.

## Migración y despliegue

`prisma/migrations/20261030000000_image_presentations/migration.sql` agrega nueve columnas opcionales. No actualiza filas, URLs ni archivos. En un entorno compartido, revisar y autorizar el SQL antes de aplicarlo. Aplicar la migración antes de desplegar el código que lee esas columnas. No se debe usar `migrate reset`.

## Compatibilidad

Las fotos recortadas y subidas con el editor anterior ya son archivos derivados; si su original no se conservó por otro medio, el proyecto no puede reconstruirlo. El nuevo editor preserva el original de las cargas nuevas. Las imágenes antiguas sin metadatos no reciben un nuevo recorte automáticamente.

Las transformaciones editables se entregan mediante las URLs administradas de Cloudinary. Las URLs antiguas de otro proveedor o del almacén privado se siguen mostrando, pero su encuadre nuevo no puede entregarse mediante Cloudinary. Antes de ofrecer edición para esas URLs habría que migrar su original o incorporar un transformador de entrega propio.
