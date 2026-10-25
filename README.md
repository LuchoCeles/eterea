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

La sección «El universo Etérea» muestra hasta seis publicaciones recientes de `@eterea.newconcept` y las integra con el reproductor oficial de Instagram. La lista se actualiza cada 15 minutos. Si Meta no responde, se usa la última lista obtenida durante un día; después, se usan los enlaces cargados en la pestaña Instagram del administrador.

Para activar la actualización automática:

1. Usá una cuenta profesional de Instagram (Business o Creator) para `@eterea.newconcept` y configurá una app de Meta con **Instagram API with Instagram Login** y el permiso `instagram_business_basic`.
2. Generá un token de acceso **de larga duración** para esa cuenta en Meta. No lo incluyas en código ni en variables públicas `NEXT_PUBLIC_*`.
3. Entrá al panel de administración, abrí la pestaña **Instagram** y pegá el token en **Conexión automática con Instagram**. El servidor verifica el nombre de la cuenta y el permiso de lectura antes de guardarlo cifrado en una fila privada de `site_content`. El panel solo muestra si hay un token guardado; nunca lo devuelve al navegador.

El servidor renueva el token guardado mientras el sitio recibe visitas. Si la cuenta deja de autorizar la app o el token vence después de un período prolongado sin visitas, generá otro token y reemplazalo desde la misma pestaña. El cifrado usa `AUTH_SECRET`: si cambiás ese secreto, tendrás que volver a ingresar el token. Instagram solo integra publicaciones públicas de cuentas que permiten inserciones; el comportamiento de reproducción depende también del navegador y de Meta.

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
