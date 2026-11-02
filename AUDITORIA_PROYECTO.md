# Auditoría del proyecto — 2 de noviembre de 2026

## Alcance y método

Se revisaron las rutas de Next.js, Server Actions, Route Handlers, acceso a Prisma, reglas del storefront, componentes cliente, dependencias y estructura del repositorio. Las conclusiones combinan lectura del código, análisis de imports desde las entradas del App Router, pruebas locales y compilación de producción. No se consultó ni modificó una base TiDB compartida y no se midió tráfico real.

## Seguridad

| Prioridad | Hallazgo y corrección |
| --- | --- |
| P1 | `loginAction` permitía intentos ilimitados. Ahora usa `RateLimitBucket`: ocho intentos por bucket de usuario y 1200 globales cada 15 minutos. Los buckets de usuario se derivan con HMAC para no guardar nombres. |
| P1 | El cotizador público podía provocar llamadas autenticadas ilimitadas a Correo Argentino. Ahora limita 600 solicitudes globales cada 15 minutos y el cuerpo de cada solicitud a 512 bytes. |
| P2 | La carga de imágenes confiaba en el MIME declarado por el cliente. Ahora verifica la firma binaria de JPEG, PNG, WebP, GIF y AVIF, además del tipo y tamaño; el multipart se corta a 51 MB antes de procesarse. |
| P2 | `.env.example` incluía un `AUTH_SECRET` público que superaba el mínimo exigido. El marcador nuevo es inválido hasta que se reemplace. |
| P2 | El optimizador de Next.js aceptaba imágenes remotas de cualquier cuenta Cloudinary o Meta sin que el proyecto lo necesitara. Se retiraron esos patrones. |
| P2 | Mensajes guardados y enlaces de descuentos podían aparecer con ofertas apagadas. El storefront ahora oculta esos anuncios, el filtro y la sección de descuentos; conserva anuncios de marca por defecto. |

No se encontró un bypass directo del rol `admin` en las operaciones administrativas revisadas. Las consultas SQL inspeccionadas usan parámetros. La edición de Cloudinary valida que la URL pertenezca a un recurso administrado y rechaza redirecciones.

El lock instala Next.js 16.4.3 y React 19.3.1. La [actualización oficial de seguridad de Next.js de octubre](https://nextjs.org/blog/nextjs-security-update-october-14-2026) indica que los fallos críticos y de denegación de servicio de esa tanda se corrigieron desde 16.4.1. `npm audit --offline --omit=dev` informó cero vulnerabilidades según la caché local; esa consulta no comprueba avisos publicados después de la última actualización de la caché.

## Rendimiento

| Prioridad | Hallazgo y resultado |
| --- | --- |
| P2 | `ProductCarousel` duplicaba dos o tres productos hasta mostrar diez tarjetas. Ahora renderiza una tarjeta por producto para esos catálogos y activa navegación y avance automático según el desplazamiento disponible. |
| P2 condicionado | El detalle carga el snapshot relacional completo del catálogo. La caché de cinco minutos amortigua las consultas; conviene separar la lectura de detalle si aumentan el catálogo, el payload o el p95. El reporte previo de rendimiento midió 11 productos; no se hizo una medición nueva. |
| P3 condicionado | Los filtros del catálogo y el fallback de `ProductImage` trabajan en el cliente. Su costo requiere perfilado con un catálogo mayor antes de cambiar la interacción. |

## Arquitectura y limpieza

Se quitaron 21 directorios locales vacíos, entre ellos rutas de Next.js sin archivos. También se eliminaron 36 archivos versionados sin alcance desde la aplicación, pruebas o scripts: 34 componentes UI y dos editores administrativos obsoletos. Se retiraron 27 dependencias directas exclusivas de esos archivos y 61 entradas de paquetes que dejaron de ser alcanzables en `package-lock.json`. Se corrigieron un alias a `src/hooks` inexistente y un enlace roto en la documentación de Instagram.

La guía `AGENTS.md` se actualizó según la decisión del proyecto de conservar Cloudinary para imágenes nuevas y el feed automático de Meta. La tabla `Media` permanece para imágenes heredadas. La hidratación única del borrador administrativo podría retener un snapshot nuevo si el provider siguiera montado, pero no se reprodujo ese caso en el flujo actual; también protege ediciones sin guardar al navegar.

## Verificación y paso pendiente

- `npm run typecheck`, `npm run lint`, `npm test` (**119 pruebas**) y `npm run build`: correctos.
- `npm ci --dry-run --ignore-scripts --offline --omit=optional`: correcto para comprobar la coherencia del lock. La actualización automática offline del lock no fue posible porque faltaba un paquete opcional de Tailwind en la caché; se podó el grafo conservando las dependencias transitivas alcanzables.
- `prisma generate` y `prisma validate`: correctos.
- La migración `prisma/migrations/20261102020000_rate_limit_buckets/migration.sql` está preparada y **no fue aplicada**. Debe revisarse y autorizarse antes de ejecutarla en TiDB compartido. Sin esa tabla, el login y el cotizador responden con error.

Los cupos globales limitan el abuso sin confiar en cabeceras IP del cliente. Un atacante aún podría agotarlos y provocar bloqueos temporales de solicitudes legítimas. Para evitar ese caso hace falta un identificador de origen confiable o un control en el borde.
