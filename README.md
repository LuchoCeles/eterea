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
npm run dev
```

Abrí `http://localhost:3000`. La primera cuenta que se registre recibe el rol de administración. Luego ingresá a `/auth` para administrar promociones, banners, productos, textos e Instagram.

## Categorías y productos

Creá las categorías en la sección **Categorías** del administrador: solo necesitan un nombre. Tocá **Guardar** y después asignalas a cada producto desde **Productos**. La lista de productos del administrador se muestra como tabla en escritorio. Los productos nuevos se muestran primero según su fecha de creación; ya no se reordenan manualmente. La tienda conserva sus opciones de orden por precio y nombre para cada visitante.

Las categorías se guardan como un JSON independiente con la clave `categories` en `site_content`; los productos se guardan con la clave `products`. No cambia el esquema de Prisma ni hace falta aplicar una migración SQL. Si todavía no existe la fila `categories`, la aplicación recupera las categorías anteriores de `texts` y de los productos; al guardarlas desde la nueva sección crea la fila en la base de datos. Los productos anteriores conservan su orden y quedan sin fecha porque no se conoce su alta real. Al crear productos nuevos, se registra la fecha de alta en el JSON y se conserva en ediciones posteriores. Una categoría que todavía tiene productos asignados no se puede borrar: reasignalos primero.

## Publicaciones de Instagram en el home

La sección «El universo Etérea» muestra primero los enlaces cargados en el administrador. Si la lista está vacía, muestra hasta seis publicaciones recientes de la cuenta vinculada, actualizadas cada 15 minutos. Si Meta no responde, se usa la última lista obtenida durante un día. Con la cuenta conectada, el servidor busca las publicaciones propias por su enlace, obtiene el archivo y la portada mediante la API de Meta y los reproduce en el home sin pedir inicio de sesión a cada visitante. El token nunca se envía al navegador y las URL de los archivos se actualizan cada 15 minutos. Si Meta no entrega el archivo, se intenta la inserción pública; cuando tampoco está permitida, el home muestra la portada cargada (si existe) y un enlace a Instagram.

Para activar la reproducción directa y la actualización automática:

1. Usá la cuenta profesional de Instagram (Business o Creator) que publica los videos. En [Meta for Developers](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login), creá o abrí una app, configurá **Instagram API with Instagram Login** y solicitá el permiso `instagram_business_basic`. Este flujo no exige vincular una página de Facebook. Completá los pasos de autorización de la cuenta en Meta.
2. Generá un token de acceso **de larga duración** para esa cuenta. Guardalo en un lugar privado: no lo incluyas en código, capturas, mensajes ni variables públicas `NEXT_PUBLIC_*`.
3. Entrá a `/admin`, abrí la pestaña **Instagram** y pegá el token en **Conexión automática con Instagram**. El servidor consulta `id` y `username` de la cuenta y verifica que pueda leer sus publicaciones. Después guarda el token cifrado en una fila privada de `site_content`. El panel muestra el `@usuario` vinculado, pero nunca devuelve el token.
4. En **Perfil público de Instagram**, revisá el usuario que se usará para los enlaces si Meta no responde o todavía no hay conexión. Podés editarlo sin cambiar código. En la misma pestaña, cargá enlaces a publicaciones o reels de la cuenta vinculada. Al abrir el home, comprobá que el video tenga controles de reproducción. Los enlaces a publicaciones de otras cuentas no pueden reproducirse mediante este token.

La vinculación usa el ID de cuenta que entrega Meta, no un nombre de usuario fijo. Si la cuenta cambia su `@usuario`, el servidor toma el nombre actual para los enlaces y el panel en la siguiente consulta exitosa. El usuario público guardado sigue disponible como respaldo cuando Meta no responde. Si vinculás una cuenta distinta, reemplazá el token desde el administrador y revisá los enlaces manuales, porque los videos de la cuenta anterior dejarán de ser propios.

El servidor renueva el token guardado mientras el sitio recibe visitas. Si la cuenta deja de autorizar la app o el token vence después de un período prolongado sin visitas, generá otro token y reemplazalo desde la misma pestaña. El cifrado usa `AUTH_SECRET`: si cambiás ese secreto, tendrás que volver a ingresar el token. La reproducción directa requiere que Meta entregue `media_url` para una publicación propia; si el archivo no está disponible, se conserva la portada y el enlace. Las inserciones públicas siguen sujetas a los permisos de cada publicación.

Si antes configuraste `INSTAGRAM_ACCESS_TOKEN` en el entorno, ingresá ese token una vez desde el panel y después quitá la variable: el home ahora lee únicamente la conexión guardada en la base de datos.

Referencias de Meta: [API con Instagram Login](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login), [renovación del token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token) e [inserción de publicaciones](https://developers.facebook.com/docs/instagram-platform/oembed).

## Imágenes

Las imágenes nuevas se suben a Cloudinary dentro de `eterea/<sección>/imagenes` y el contenido guarda su URL segura. La carga conserva el archivo original, sin transformaciones ni compresión agregada por la aplicación. Se admiten fotos de hasta 50 MB cada una y tandas de hasta 20 fotos. Next.js también queda configurado para aceptar respuestas de origen de hasta 50.000.000 bytes al optimizar imágenes.

Al guardar cambios, las imágenes anteriores que ya no están referenciadas se borran de Cloudinary. Si Cloudinary no está disponible, las URLs pendientes quedan en una cola de reintento de `site_content` y el panel informa que falta completar la limpieza. La tabla `Media` se conserva para poder mostrar imágenes antiguas; las subidas nuevas ya no guardan bytes en la base.

## Comandos

- `npm run dev`: servidor de desarrollo Next.js.
- `npm run build` / `npm run start`: compilación y servidor de producción.
- `npm run lint`: ESLint.
- `npm run db:generate`: genera Prisma Client.
- `npm run db:migrate`: aplica migraciones pendientes en el entorno local configurado.
- `npm run db:migrate:deploy`: aplica migraciones versionadas en el entorno de despliegue.
- `npm run db:import-content -- ./legacy-site-content.json`: importa filas exportadas de contenido JSON.

## Datos existentes

La aplicación nueva no necesita filas iniciales para mostrar la tienda: `src/lib/content.ts` define valores por defecto. Para conservar ajustes del sitio anterior, exportá las filas de `site_content` como JSON antes de retirar ese servicio y cargalas con `npm run db:import-content -- ./archivo.json`. El importador conserva solo las claves conocidas y completa ajustes de texto con `resolveContent`. Las fotos vinculadas a URLs antiguas deben copiarse y actualizarse a enlaces firmados del nuevo almacén. Los hashes de contraseñas del proveedor anterior no son portables; las cuentas deben registrarse de nuevo.

## Recursos gráficos

Los recursos locales se sirven desde `public/`. Si se migran fotografías del sitio anterior, copiarlas a esa carpeta y actualizar las rutas por defecto de `src/lib/content.ts` y `src/lib/products.ts`.
