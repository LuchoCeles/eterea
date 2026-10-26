# Etérea New Concept

Storefront y panel de administración construidos con Next.js App Router, React, TypeScript, Tailwind CSS y Prisma ORM sobre TiDB compatible con MySQL.

## Requisitos

- Node.js 20.9 o posterior.
- Una base de datos TiDB accesible mediante el protocolo MySQL.
- `DATABASE_URL`, `AUTH_SECRET` y las credenciales de Cloudinary configuradas en `.env` (ver `.env.example`).

## Desarrollo

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:migrate-catalog
npm run db:migrate-content -- --apply
npm run dev
```

Abrí `http://localhost:3000`. La primera cuenta que se registre recibe el rol de administración. Luego ingresá a `/auth` para administrar promociones, banners, productos, textos e Instagram.

## Categorías y productos

Creá las categorías en **Catálogo → Categorías** y asignalas a los productos. Podés ocultar una categoría sin borrarla: todos sus productos dejan de aparecer en el inicio, el catálogo y los filtros. También podés ocultar un producto individual. Los registros anteriores se consideran visibles hasta que el administrador cambie su estado.

Las categorías, los productos, sus precios por medio de pago y las tarjetas destacadas del inicio se guardan en las tablas `Category`, `Product`, `ProductPaymentPrice` y `HomeCategoryCard`. Cada producto puede tener descripción, talles, colores y hasta cinco fotos ordenadas en `ProductImage`, `ProductSize` y `ProductColor`. La primera foto es la portada del catálogo y de la ficha `/productos/<nombre-normalizado>`; el administrador puede elegirla y reordenar las demás. Si dos nombres generan la misma URL, se añade un sufijo corto derivado del ID. Los enlaces anteriores por ID redirigen a la URL nueva. El administrador elige qué tarjetas destacar en **Inicio → Diseño del inicio**; las anteriores quedan ocultas hasta que se elijan. Los productos anteriores conservan su orden y quedan sin fecha cuando no se conoce su alta real.

Para una base existente, seguí la secuencia de **Migración relacional** más abajo. Los importadores no modifican usuarios ni roles.

## Migración relacional

`prisma/migrations/20261025010000_content_relacional/migration.sql` crea las tablas de promociones, banners, textos, contacto, Instagram y limpieza de imágenes. No retira `SiteContent` durante la creación: esa tabla se necesita para copiar los datos heredados. El esquema Prisma y la aplicación nueva ya usan exclusivamente las tablas relacionales.

`prisma/migrations/20261026000000_product_details_and_gallery/migration.sql` agrega la ficha y las tablas de fotos y opciones. Copia cada `Product.image` existente a `ProductImage` en la posición cero, sin eliminar la columna anterior. También crea `CloudinaryPendingUpload` para registrar las cargas antes de enviarlas al proveedor. Revisá y autorizá esta migración antes de aplicarla en TiDB compartido.

En una base existente, prepará una copia de seguridad y detené las escrituras del administrador durante el corte. Revisá el SQL y obtené la autorización explícita requerida por `AGENTS.md` antes de aplicarlo en un entorno compartido. Después:

1. Aplicá las migraciones pendientes con `npm run db:migrate:deploy`. Si el catálogo aún no se migró, ejecutá `npm run db:migrate-catalog`.
2. Ejecutá `npm run db:migrate-content` para auditar las claves heredadas, el formato y las tablas de destino sin escribir. Corregí cualquier dato inválido o clave desconocida antes de seguir.
3. Ejecutá `npm run db:migrate-content -- --apply`. La copia es transaccional y verifica el contenido importado. Conservá una exportación externa de `SiteContent` y compará el storefront y el administrador antes de habilitar escrituras.
4. Desplegá la aplicación nueva. Cuando la verificación esté terminada, ejecutá el SQL de `scripts/finalize-content-migration.sql` con autorización explícita en el entorno compartido. Ese paso retira la última columna JSON junto con la tabla heredada.

Las secciones vacías se distinguen de las que usan valores por defecto mediante `ContentSection`. El token de Instagram sigue cifrado en `InstagramConnection`; sus cachés, las publicaciones curadas y la cola de Cloudinary usan tablas propias. Durante el intervalo entre los pasos 1 y 4, `SiteContent` es solo una fuente heredada de lectura para el importador; la aplicación nueva no escribe allí.

## Publicaciones de Instagram en el home

La sección «El universo Etérea» muestra primero los enlaces cargados en el administrador. Si la lista está vacía, muestra hasta seis publicaciones recientes de la cuenta vinculada. La caché se revisa cada 15 minutos; cuando vence, el home entrega temporalmente los datos guardados y los renueva después de responder. Si Meta no responde, se usa la última lista obtenida durante un día. Con la cuenta conectada, el servidor busca las publicaciones propias por su enlace, obtiene el archivo y la portada mediante la API de Meta y los reproduce en el home sin pedir inicio de sesión a cada visitante. El token nunca se envía al navegador. Si Meta no entrega el archivo, se intenta la inserción pública; cuando tampoco está permitida, el home muestra la portada cargada (si existe) y un enlace a Instagram.

Para activar la reproducción directa y la actualización automática:

1. Usá la cuenta profesional de Instagram (Business o Creator) que publica los videos. En [Meta for Developers](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login), creá o abrí una app, configurá **Instagram API with Instagram Login** y solicitá el permiso `instagram_business_basic`. Este flujo no exige vincular una página de Facebook. Completá los pasos de autorización de la cuenta en Meta.
2. Generá un token de acceso **de larga duración** para esa cuenta. Guardalo en un lugar privado: no lo incluyas en código, capturas, mensajes ni variables públicas `NEXT_PUBLIC_*`.
3. Entrá a `/admin`, abrí la pestaña **Instagram** y pegá el token en **Conexión automática con Instagram**. El servidor consulta `id` y `username` de la cuenta y verifica que pueda leer sus publicaciones. Después guarda el token cifrado en `InstagramConnection`. El panel muestra el `@usuario` vinculado, pero nunca devuelve el token.
4. En **Perfil público de Instagram**, revisá el usuario que se usará para los enlaces si Meta no responde o todavía no hay conexión. Podés editarlo sin cambiar código. En la misma pestaña, cargá enlaces a publicaciones o reels de la cuenta vinculada. Al abrir el home, comprobá que el video tenga controles de reproducción. Los enlaces a publicaciones de otras cuentas no pueden reproducirse mediante este token.

La vinculación usa el ID de cuenta que entrega Meta, no un nombre de usuario fijo. Si la cuenta cambia su `@usuario`, el servidor toma el nombre actual para los enlaces y el panel en la siguiente consulta exitosa. El usuario público guardado sigue disponible como respaldo cuando Meta no responde. Si vinculás una cuenta distinta, reemplazá el token desde el administrador y revisá los enlaces manuales, porque los videos de la cuenta anterior dejarán de ser propios.

El servidor renueva el token guardado mientras el sitio recibe visitas. Si la cuenta deja de autorizar la app o el token vence después de un período prolongado sin visitas, generá otro token y reemplazalo desde la misma pestaña. El cifrado usa `AUTH_SECRET`: si cambiás ese secreto, tendrás que volver a ingresar el token. La reproducción directa requiere que Meta entregue `media_url` para una publicación propia; si el archivo no está disponible, se conserva la portada y el enlace. Las inserciones públicas siguen sujetas a los permisos de cada publicación.

Si antes configuraste `INSTAGRAM_ACCESS_TOKEN` en el entorno, ingresá ese token una vez desde el panel y después quitá la variable: el home ahora lee únicamente la conexión guardada en la base de datos.

Referencias de Meta: [API con Instagram Login](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login), [renovación del token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token) e [inserción de publicaciones](https://developers.facebook.com/docs/instagram-platform/oembed).

## Imágenes

Las imágenes nuevas se suben a Cloudinary dentro de `eterea/<sección>/imagenes` y el contenido guarda su URL segura. La carga conserva el archivo original, sin transformaciones ni compresión agregada por la aplicación. Se admiten fotos de hasta 50 MB cada una y tandas de hasta 20 fotos. Next.js también queda configurado para aceptar respuestas de origen de hasta 50.000.000 bytes al optimizar imágenes.

Cada carga usa un UUID propio, con sobrescritura desactivada, y reserva su identificador en `CloudinaryPendingUpload` antes de enviarse. Al guardar cambios o eliminar un producto, las fotos que ya no estén referenciadas quedan en `CloudinaryCleanup` dentro de la misma transacción; los borrados fallidos se reintentan en la siguiente actividad. Las cargas abandonadas se revisan después de siete días, al ocurrir una nueva carga o guardado. Para eliminar un producto vinculado a banners, Instagram o destacados, primero hay que desvincularlo. La tabla `Media` se conserva para poder mostrar imágenes antiguas; las subidas nuevas ya no guardan bytes en la base.

## Comandos

- `npm run dev`: servidor de desarrollo Next.js.
- `npm run build` / `npm run start`: compilación y servidor de producción.
- `npm run lint`: ESLint.
- `npm run db:generate`: genera Prisma Client.
- `npm run db:migrate`: aplica migraciones pendientes en el entorno local configurado.
- `npm run db:migrate:deploy`: aplica migraciones versionadas en el entorno de despliegue.
- `npm run db:import-content -- ./legacy-site-content.json`: importa filas exportadas de contenido JSON.
- `npm run db:migrate-catalog`: copia categorías, productos y destacados heredados a sus tablas propias después de aplicar el SQL.
- `npm run db:migrate-content`: audita la importación relacional sin escribir; agregá `-- --apply` para realizarla.

## Datos existentes

La aplicación nueva puede mostrar valores por defecto definidos en `src/lib/content.ts`. Para conservar ajustes de un proveedor anterior, exportá las filas a un archivo local, cargalas en `SiteContent` con `npm run db:import-content -- ./archivo.json` antes de migrar el catálogo y luego seguí **Migración relacional**. No agregues el archivo exportado al repositorio. Los roles actuales de administrador no se modifican. Las fotos vinculadas a URLs antiguas deben copiarse y actualizarse a enlaces del almacén configurado.

## Recursos gráficos

Los recursos locales se sirven desde `public/`. Si se migran fotografías del sitio anterior, copiarlas a esa carpeta y actualizar las rutas por defecto de `src/lib/content.ts` y `src/lib/products.ts`.
