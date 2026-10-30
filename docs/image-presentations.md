# Formatos y encuadres de imágenes de producto

## Modelo

Cada fila de `ProductImage` conserva la URL original. `format`, `zoom`, `offsetX` y `offsetY` describen la vista de galería. `sourceWidth` y `sourceHeight` corresponden al archivo original. La primera fila puede incluir `coverZoom`, `coverX` y `coverY`: describen exclusivamente la portada 4:5. La posición cero sigue siendo la única portada activa.

Los campos son opcionales. Una fila anterior, con valores nulos, mantiene la entrega y el recorte visual previos. `Product.image` continúa apuntando a la primera URL para conservar las referencias existentes. Los parámetros se guardan en columnas relacionales tipadas; no se modifica el archivo de Cloudinary ni se almacena una segunda URL.

El editor calcula el encuadre sobre el archivo original. La entrega de Cloudinary extrae esa región mediante `c_crop` y después aplica los tamaños optimizados existentes. La portada nueva usa 4:5, igual que el marco de las tarjetas de catálogo y carrusel; las vistas nuevas de galería usan 1:1. Las filas anteriores sin encuadre siguen usando `object-cover`.

Las fotos nuevas reciben un encuadre **1:1** para la ficha `/productos/[slug]`; el administrador puede moverlo y ampliarlo sin elegir formato. Al usar una foto como portada, el administrador ajusta además una vista **4:5** para las tarjetas. Ambas vistas se generan a partir de la misma URL original y se guardan como parámetros independientes; no se duplica el archivo. Los formatos anteriores siguen siendo válidos para no alterar productos existentes al guardar otros datos. Si se edita una foto anterior, su nuevo encuadre de ficha pasa a 1:1.

## Migración y despliegue

`prisma/migrations/20261030000000_image_presentations/migration.sql` agrega nueve columnas opcionales. No actualiza filas, URLs ni archivos. En un entorno compartido, revisar y autorizar el SQL antes de aplicarlo. Aplicar la migración antes de desplegar el código que lee esas columnas. No se debe usar `migrate reset`.

## Compatibilidad

Las fotos recortadas y subidas con el editor anterior ya son archivos derivados; si su original no se conservó por otro medio, el proyecto no puede reconstruirlo. El nuevo editor preserva el original de las cargas nuevas. Las imágenes antiguas sin metadatos no reciben un nuevo recorte automáticamente.

Las transformaciones editables se entregan mediante las URLs administradas de Cloudinary. Las URLs antiguas de otro proveedor o del almacén privado se siguen mostrando, pero su encuadre nuevo no puede entregarse mediante Cloudinary. Antes de ofrecer edición para esas URLs habría que migrar su original o incorporar un transformador de entrega propio.
