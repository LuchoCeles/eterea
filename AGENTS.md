# Guía de trabajo del proyecto

## Idioma y nombres

- Escribí la documentación, los comentarios explicativos, los mensajes de interfaz y los mensajes de error en español.
- Conservá en inglés los nombres convencionales de código y del ecosistema: `Header`, `Hero`, `Navbar`, `Footer`, `layout`, `page`, `route`, `hook`, `server action`, `middleware`, `props` y nombres similares.
- Usá nombres de componentes en PascalCase y nombres de funciones, variables y archivos utilitarios en camelCase o kebab-case según la convención de Next.js.
- El texto visible debe usar español rioplatense coherente con la tienda: «Entrá», «Descubrí», «Escribinos».

## Escritura y tamaño

- Antes de editar, leé el código cercano y respetá sus convenciones y responsabilidades.
- Mantené cada archivo de código fuente (`.ts`, `.tsx`, `.js`, `.jsx`) por debajo de 400 líneas. Si crece, extraé componentes, validaciones o lógica de dominio a módulos con una responsabilidad clara.
- Mantené CSS, SQL, Markdown y configuración por debajo de 500 líneas. Los lockfiles, archivos generados y recursos binarios no cuentan para estos límites.
- No agregues dependencias cuando una API nativa o dependencia existente resuelva bien el problema.
- No guardes secretos, credenciales ni archivos locales de entorno en el repositorio. Las variables necesarias deben documentarse en `.env.example`.
- No escribas HTML crudo para contenido; preferí componentes React y clases Tailwind. Mantené Tailwind como sistema de estilos principal.
- No mezcles acceso a Prisma con componentes cliente. El acceso a datos y los secretos viven en módulos de servidor.
- Preferí Server Components en Next.js. Agregá `"use client"` solamente en el límite que necesite estado, efectos o APIs del navegador.

## Estructura

- `src/app/`: App Router, páginas, layouts, errores y Route Handlers.
- `src/components/`: componentes reutilizables, organizados por dominio (`store`, `admin`, `ui`).
- `src/lib/`: tipos, reglas de negocio y utilidades sin estado de interfaz.
- `src/server/`: Prisma, autenticación, almacenamiento y operaciones privadas de servidor.
- `prisma/`: esquema y migraciones de TiDB/MySQL.
- `public/`: recursos servidos tal cual, incluidos los recursos de marca.
- Las rutas públicas deben ser delgadas; delegá interfaz y reglas a módulos con nombre descriptivo.

## Reglas de negocio y seguridad

- Todo contenido editable del storefront (promos, banners, productos, textos e Instagram) se guarda como JSON en `site_content`, identificado por clave. Los valores por defecto viven en `src/lib/content.ts`.
- Resolvé siempre el contenido guardado con `resolveContent`, tanto en el storefront como en el borrador del administrador. Al combinar textos anidados, completá los valores por defecto sin activar secciones nuevas por accidente.
- Las promociones persistidas, incluso las heredadas, obedecen el mismo interruptor de ofertas que los valores por defecto. No permitas que mensajes promocionales aparezcan con ofertas desactivadas.
- Mantené la validación segura de enlaces y la visibilidad de Instagram en `src/lib/storefront-rules.ts`. Instagram es curado manualmente, tiene una lista vacía por defecto y solo acepta enlaces válidos a publicaciones o reels reales.
- La primera cuenta creada recibe el rol `admin`; todas las operaciones administrativas deben verificar ese rol en el servidor.
- Las imágenes cargadas se guardan en el almacén privado definido por el proyecto y se referencian mediante enlaces firmados por diez años. Validá el tipo y tamaño en el servidor.
- Nunca envíes credenciales de base de datos, secretos de sesión ni acceso privilegiado al cliente.

## Uso de subagentes

- Se pueden usar subagentes para tareas acotadas que puedan avanzar en paralelo (por ejemplo, una revisión de Prisma y otra de componentes), siempre que la tarea general permita delegación.
- Cada asignación debe indicar objetivo, archivos incluidos, límites de edición, dependencias y criterio de aceptación. Pedí al subagente que informe los cambios y las verificaciones realizadas.
- No asignes el mismo archivo mutable a más de un agente a la vez. Si dos tareas comparten una interfaz, asigná a una persona la interfaz y a la otra un contrato explícito.
- Los subagentes no deben desplegar, publicar, enviar mensajes externos, borrar datos, cambiar secretos ni ejecutar migraciones destructivas.
- El agente principal integra, revisa el diff completo y resuelve conflictos. No aceptes cambios de un subagente sin inspeccionarlos.

## Cambios de base de datos

- Declarar el modelo en `prisma/schema.prisma` y versionar las migraciones SQL en `prisma/migrations/`.
- No ejecutar `migrate reset`, borrar tablas ni reemplazar datos de TiDB. Antes de aplicar una migración en un entorno compartido, prepará el SQL y pedí autorización explícita.
- Las migraciones desde el proveedor anterior deben conservar el contenido JSON y los roles de administrador; documentá cualquier paso que requiera exportar datos fuera del proyecto.