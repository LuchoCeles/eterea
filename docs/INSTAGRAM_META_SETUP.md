# Configurar Instagram API con Meta — Etérea New Concept

Guía para obtener y validar el **Instagram User ID** y un **System User Access Token (SUAT)**, y conectar la cuenta desde el administrador. Refleja la implementación del repositorio revisada el 28 de octubre de 2026.

## Alcance de la integración

Etérea usa una conexión manual: un administrador pega el token y el Instagram User ID. El servidor consulta `graph.facebook.com/v25.0`, valida el perfil y una muestra del feed, pide confirmación del usuario identificado y luego guarda el token cifrado. La aplicación **no implementa OAuth automático**, no tiene una ruta callback de Instagram y no renueva SUAT mediante endpoints de Instagram Login.

La versión `v25.0`, los endpoints y los campos de este documento reflejan el código actual. Meta puede cambiar los nombres de productos, menús, permisos o requisitos de su panel; verificá las etiquetas actuales en Meta for Developers. Si una pantalla exige una URL de redirección, no inventes una: Etérea no tiene un callback OAuth.

## Requisitos previos

- Una cuenta profesional de Instagram, **Business** o **Creator**.
- Una cuenta de Meta con acceso administrativo al portfolio comercial, a la app y a la cuenta profesional.
- Una aplicación de Meta asociada al portfolio que se usará para generar el token.
- Un System User con acceso a la aplicación y al activo de Instagram correspondiente.
- El permiso `instagram_basic` en el token para leer el perfil y las publicaciones usadas por Etérea.
- Acceso al entorno de Etérea que se va a configurar. El administrador debe tener el rol `admin`.

La cuenta y el System User deben estar autorizados en el portfolio correcto. Si Meta presenta varios portfolios o activos con nombres similares, verificá cuál controla la cuenta que querés mostrar.

## Crear o configurar la aplicación de Meta

1. Abrí [Meta for Developers — Apps](https://developers.facebook.com/apps/) e iniciá sesión con la cuenta que administra el negocio.
2. Creá una aplicación o elegí la aplicación ya asociada al portfolio que administra Instagram.
3. En el panel de la app, configurá el caso de uso/producto de Instagram para cuentas profesionales usando el flujo unificado que habilita la generación del SUAT. Los nombres exactos pueden variar entre cuentas y versiones del panel.
4. Si Meta ofrece una configuración de **Business Login** para la API de Instagram y la requiere para habilitar el acceso, completala en la misma app y portfolio. No conviertas esta guía en una integración OAuth: Etérea solo recibe un token ya generado.
5. Seleccioná el portfolio comercial correcto y autorizá o agregá la cuenta profesional como activo según lo solicite Meta. Asigná a ese activo el System User que generará el token.
6. Revisá los permisos disponibles. Para el feed que consume esta aplicación, el permiso comprobado es `instagram_basic`. No agregues permisos de publicación, comentarios o mensajes: Etérea no los utiliza.
7. Si Meta requiere una URL de redirección para activar un producto de login, configurá solo una URL real que pertenezca a una aplicación que implemente ese callback. El repositorio de Etérea no implementa ese callback y no debe registrarse una URL ficticia.

El panel de Meta y las opciones pueden diferir según la app, el portfolio y el nivel de acceso. Si no aparece el flujo unificado o el System User no puede recibir el activo, revisá la documentación oficial y el acceso del portfolio antes de seguir; no sustituyas el flujo por el clásico `graph.instagram.com`.

## Generar el System User Access Token

1. Abrí la configuración del portfolio comercial y entrá a **Usuarios → Usuarios del sistema** (Meta puede cambiar estos rótulos).
2. Seleccioná o creá el System User que usará la app. Asignale la aplicación y la cuenta profesional de Instagram como activos con los permisos de lectura necesarios.
3. En la acción para generar un token, elegí esa aplicación y concedé `instagram_basic`. Elegí la caducidad que la política de Meta permita; no asumas que un token es irrevocable o que nunca puede revocarse.
4. Generá el token y guardalo inmediatamente en un gestor de secretos o contraseñas. Meta puede mostrarlo una sola vez. No lo pegues en código, archivos, tickets, capturas ni mensajes.
5. Abrí el [Depurador de tokens de acceso de Meta](https://developers.facebook.com/tools/debug/accesstoken/) y comprobá, sin compartir el valor del token:
   - Que la aplicación emisora sea la que esperás.
   - Que el tipo sea **System User**.
   - Que el token sea válido y cuál es la caducidad informada.
   - Que figure `instagram_basic` entre los permisos concedidos.
6. Si el tipo no es System User, falta el permiso, el token está vencido o pertenece a otra app, generá el token correcto antes de conectarlo a Etérea.

La validación de Etérea confirma que el token puede leer el perfil y el feed indicados; no inspecciona ni persiste una copia del resultado del depurador. Meta puede revocar un token aunque el depurador informe una caducidad lejana o sin vencimiento.

## Obtener el Instagram User ID

El ID que pide Etérea es el **ID de la cuenta profesional de Instagram**. No es el App ID de Meta ni el Business ID del portfolio.

Podés obtenerlo de estas formas:

1. **Desde Meta Business:** abrí los detalles del activo de Instagram del portfolio correcto y copiá el ID de esa cuenta. La ubicación y el rótulo del campo pueden cambiar.
2. **Mediante activos autorizados:** si tu token y tu rol permiten consultar activos del negocio, podés consultar la arista de cuentas propias:

   ```text
   GET https://graph.facebook.com/v25.0/{BUSINESS_ID}/owned_instagram_accounts?fields=id,username
   Authorization: Bearer {SUAT}
   ```

   Esta consulta opcional requiere acceso al Business y al activo. No es un endpoint que use Etérea y puede necesitar permisos de administración del negocio distintos de `instagram_basic`. No los agregues al token del storefront salvo que realmente necesites esta consulta. La especificación oficial de Meta enumera las aristas `owned_instagram_accounts` e `instagram_accounts` en el [esquema Business de Meta](https://github.com/facebook/facebook-business-sdk-codegen/blob/main/api_specs/specs/Business.json).
3. **Verificando el ID obtenido:** consultá el perfil de la cuenta con el endpoint que también usa Etérea:

   ```text
   GET https://graph.facebook.com/v25.0/{IG_USER_ID}?fields=id,username
   Authorization: Bearer {SUAT}
   ```

   La respuesta debe incluir el mismo `id` y el `username` esperado. Para validar el acceso al feed, consultá además `/{IG_USER_ID}/media` como se muestra abajo.

No uses el ID de otra cuenta, el Business ID, el App ID ni el ID de una Página. El ID de LOGABYTE usado en pruebas no está fijado en el código y no se debe copiar a la configuración de producción.

## Probar el perfil y las publicaciones desde PowerShell

El siguiente ejemplo es para Windows PowerShell. Solicita el token como entrada segura, no lo escribe en consola ni lo agrega a la URL. La variable `$token` lo mantiene temporalmente en texto claro en la memoria del proceso porque el encabezado HTTP lo requiere; el bloque `finally` elimina las variables al terminar. No imprimas `$headers` ni `$token`.

```powershell
$secureToken = Read-Host "Token de Meta" -AsSecureString
$token = [System.Net.NetworkCredential]::new("", $secureToken).Password
$igUserId = Read-Host "Instagram User ID"

try {
    if ($igUserId -notmatch '^\d{1,32}$') {
        throw "El Instagram User ID debe contener solamente números."
    }

    $headers = @{ Authorization = "Bearer $token" }
    $profileUri = "https://graph.facebook.com/v25.0/$igUserId`?fields=id,username"
    $feedUri = "https://graph.facebook.com/v25.0/$igUserId/media`?fields=id,permalink,timestamp,media_type,media_url,thumbnail_url,caption&limit=5"

    $profile = Invoke-RestMethod -Method Get -Uri $profileUri -Headers $headers
    Write-Output ("Perfil: @{0} (ID {1})" -f $profile.username, $profile.id)

    $feed = Invoke-RestMethod -Method Get -Uri $feedUri -Headers $headers
    $posts = @($feed.data)
    if ($posts.Count -eq 0) {
        Write-Output "La consulta del feed respondió correctamente, pero no devolvió publicaciones."
    } else {
        Write-Output ("Publicaciones devueltas: {0}" -f $posts.Count)
        # No mostrar media_url ni thumbnail_url: son URLs de Meta que pueden ser temporales.
        $posts | Select-Object id, media_type, permalink, timestamp | Format-Table -AutoSize
    }
}
catch {
    $requestError = $_
    $metaError = $null
    if ($requestError.ErrorDetails.Message) {
        try { $metaError = $requestError.ErrorDetails.Message | ConvertFrom-Json } catch { }
    }

    $statusCode = 0
    if ($requestError.Exception.Response) {
        try { $statusCode = [int]$requestError.Exception.Response.StatusCode } catch { }
    }

    $errorCode = [string]$metaError.error.code
    if ($errorCode -eq "190" -or $statusCode -eq 401) {
        Write-Output "Meta rechazó el token. Revisá el tipo, la aplicación, la validez y la caducidad en el depurador."
    } elseif (@("10", "200") -contains $errorCode -or $statusCode -eq 403) {
        Write-Output "Meta rechazó el acceso por permisos o autorización del activo. Revisá instagram_basic y el portfolio."
    } else {
        Write-Output ("La consulta falló (HTTP {0}). Revisá el ID, el acceso al activo y la disponibilidad de Meta." -f $statusCode)
    }
}
finally {
    if ($secureToken) { $secureToken.Dispose() }
    Remove-Variable -Name secureToken, token, igUserId, headers, profileUri, feedUri, profile, feed, posts, requestError, metaError, statusCode, errorCode -ErrorAction SilentlyContinue
}
```

Interpretación:

- **HTTP 200 con perfil y `data` con elementos:** el token puede leer ese perfil y las publicaciones que devolvió Meta.
- **HTTP 200 con `data: []`:** la consulta del feed fue aceptada, pero no devolvió publicaciones. Confirmá que sea la cuenta correcta y que tenga publicaciones accesibles.
- **OAuthException 190 o HTTP 401:** token inválido, revocado, vencido, de otra aplicación o del flujo equivocado. Revisá el depurador y generá otro SUAT si corresponde.
- **Código 10/200 o HTTP 403:** permiso insuficiente o el System User no tiene acceso al activo. Revisá `instagram_basic` y la asignación del portfolio.
- **Cuenta inaccesible o ID incorrecto:** confirmá que el valor sea el Instagram User ID correcto y que el activo esté autorizado para la app/System User.
- **Error de red o 5xx:** reintentá más tarde; el error no demuestra por sí solo que el token sea inválido.

El ejemplo selecciona solo ID, tipo, permalink y timestamp para mostrar. Aunque la llamada solicita `media_url` y `thumbnail_url`, no copies esos valores a registros permanentes: Meta puede cambiarlos o hacerlos caducar.

## Conectar Instagram desde el administrador de Etérea

1. Iniciá sesión en `/auth` con un usuario administrador.
2. Abrí **Redes y contacto** (`/admin/redes-y-contacto`) y buscá **Conexión automática con Instagram**.
3. Ingresá el Instagram User ID y el token de acceso de Meta en sus campos respectivos.
4. Presioná **Validar cuenta**. El servidor consulta `/{IG_USER_ID}?fields=id,username` y una muestra de `/{IG_USER_ID}/media`. La validación no guarda el token.
5. Revisá el usuario y el ID que muestra Meta. Confirmá solo si corresponden a la cuenta que querés mostrar.
6. Presioná **Confirmar y guardar conexión**. El servidor vuelve a validar el perfil y el feed y comprueba que el usuario coincida antes de guardar.
7. Abrí el Home y revisá las publicaciones, sus portadas y enlaces. El feed reciente puede tardar hasta 15 minutos en refrescar su caché.

La validación administrativa consulta una sola publicación de muestra; el número que muestra no es el total de publicaciones de la cuenta. El Home muestra hasta seis publicaciones con portada. La lista se revalida cada 15 minutos y, si Meta falla, puede usar la última lista recibida durante un día. Usa `media_url` para imágenes y carruseles, y `thumbnail_url` cuando está disponible para videos o reels. Los enlaces llevan a los permalinks originales.

El token se cifra en el servidor con **AES-256-GCM** y se guarda en la fila `InstagramConnection`. Para derivar la clave, el servidor requiere `AUTH_SECRET` con al menos 32 bytes; si cambiás ese secreto, los tokens cifrados existentes dejan de poder descifrarse y hay que volver a ingresar la conexión.

## Desarrollo y producción

- En desarrollo podés conectar una cuenta de prueba que esté autorizada para la app y usar la base de datos de desarrollo.
- En producción usá la cuenta profesional real del negocio, su propio Instagram User ID y un SUAT autorizado para ese activo. No reutilices el token o ID de prueba.
- La configuración se guarda en la base de datos del entorno conectado. El esquema y el código actuales usan una única conexión (`id = 1`) por base: el proyecto no ofrece aislamiento multi-tenant ni varias conexiones simultáneas dentro del mismo entorno.
- El token se puede revocar aunque el depurador informe que no tiene vencimiento. Etérea no lo renueva automáticamente; un administrador debe validar y guardar manualmente un token de reemplazo.
- En cada entorno configurá `AUTH_SECRET` de forma privada. No lo publiques ni lo imprimas para comprobarlo.

Para comprobar desde la carpeta del proyecto que `AUTH_SECRET` está cargado desde el entorno del proceso o los archivos locales `.env`, `.env.local`, `.env.development` y `.env.development.local`, y alcanza la longitud que exige el servidor, sin mostrar su contenido:

```powershell
@'
const fs = require("node:fs");
const dotenv = require("dotenv");
const env = {};
for (const file of [".env", ".env.local", ".env.development", ".env.development.local"]) {
  if (fs.existsSync(file)) Object.assign(env, dotenv.parse(fs.readFileSync(file)));
}
const secret = process.env.AUTH_SECRET || env.AUTH_SECRET || "";
console.log(Buffer.byteLength(secret) >= 32
  ? "AUTH_SECRET configurado con longitud suficiente."
  : "AUTH_SECRET ausente o menor a 32 bytes.");
'@ | node
```

En producción, hacé la misma comprobación en el entorno que ejecuta Etérea; no copies el secreto a una terminal compartida.

## Errores frecuentes

| Síntoma | Causa probable | Qué revisar |
| --- | --- | --- |
| Token rechazado | Token inválido, de otra app, revocado o perteneciente a otro flujo | Revisá aplicación, tipo, validez y caducidad en el depurador. Generá un SUAT para la app y activo correctos. |
| OAuthException 190 | Meta no acepta el token enviado | Confirmá que esté completo, vigente, autorizado y que uses `graph.facebook.com`, no `graph.instagram.com`. Si fue revocado, generá otro. |
| Falta `instagram_basic` | El permiso no fue concedido o el token fue generado con otro conjunto de permisos | Volvé a generar el token con el permiso de lectura requerido y verificá el resultado en el depurador. |
| Cuenta profesional no autorizada | El System User, la app o el portfolio no tienen asignado el activo | En Meta Business, revisá el portfolio, la cuenta profesional, la app y los permisos del System User. |
| Cuenta no encontrada o ID incorrecto | Se ingresó el App ID, Business ID, Page ID o ID de otra cuenta | Obtené el Instagram User ID del activo correcto y verificá el endpoint de perfil. |
| Usuario mostrado no coincide | El ID pertenece a otra cuenta o el token tiene acceso a otro activo | No confirmes. Corregí el ID/token y repetí **Validar cuenta**. |
| `data: []` | La API respondió, pero no devolvió publicaciones en la consulta | Revisá que la cuenta sea la correcta y tenga publicaciones accesibles. La validación de conexión puede ser correcta aunque la muestra esté vacía. |
| Portfolio comercial incorrecto | La app, el System User y la cuenta no están bajo el portfolio esperado o no comparten acceso | Corregí la asignación del activo y generá un token desde el System User y app que correspondan. |
| Permiso/activo inaccesible | El token no incluye el permiso de lectura o el System User no tiene acceso a esa cuenta | Confirmá `instagram_basic` y el acceso del System User a la cuenta profesional. No agregues permisos de escritura para resolver lectura. |
| Las imágenes no aparecen | Meta no devolvió un archivo o la URL temporal venció | Esperá el próximo refresco y revisá que el feed vuelva a responder. Los enlaces a las publicaciones se conservan aunque una portada falle. |
| URL de imagen vencida | `media_url` o `thumbnail_url` se reutilizó fuera de su período de validez | No guardes esas URLs como contenido permanente. Etérea las conserva solo en memoria durante 15 minutos y vuelve a pedirlas a Meta. |
| El panel no guarda el token | `AUTH_SECRET` falta o tiene menos de 32 bytes, o falló la escritura de base de datos | Comprobá la presencia/longitud del secreto sin imprimirlo y revisá disponibilidad de la base. No pegues el token en logs para diagnosticarlo. |

## Seguridad y reemplazo de tokens

- No subas tokens a Git ni los guardes en README, Markdown, `.env.example` o variables `NEXT_PUBLIC_*`.
- No los incluyas en parámetros de URL, logs, tickets, chat o capturas. El ejemplo PowerShell usa `Authorization: Bearer` y no muestra el encabezado.
- No compartas capturas del depurador con el token visible.
- Las URLs `media_url` y `thumbnail_url` pueden ser temporales. Etérea las mantiene en una caché de proceso de 15 minutos y no las persiste en la base como portadas permanentes; la caché de publicaciones guarda IDs y enlaces.
- Si un token se expone, revocalo desde Usuarios del sistema en Meta Business y generá uno nuevo. Ingresalo en Etérea, validá la cuenta, confirmá el usuario correcto y guardá la conexión. No intentes renovarlo con `ig_refresh_token`.
- Si cambia `AUTH_SECRET`, volvé a ingresar el token desde el administrador: el servidor ya no podrá descifrar el token cifrado con el secreto anterior.

## Referencias oficiales

- [Meta for Developers — aplicaciones](https://developers.facebook.com/apps/).
- [Meta for Developers — Instagram Platform](https://developers.facebook.com/documentation/instagram-platform/). Es el punto de entrada a la documentación de la API; los nombres y pantallas del flujo pueden cambiar. Verificá que el token que generes sea un SUAT para el acceso unificado que usa esta integración.
- [Meta for Developers — referencia de Instagram User](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/).
- [Meta for Developers — arista de publicaciones `IG User /media`](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media/).
- [Meta for Developers — System Users](https://developers.facebook.com/docs/marketing-api/system-users/).
- [Meta for Developers — depurador de tokens](https://developers.facebook.com/tools/debug/accesstoken/).
- [Meta — colección oficial de Instagram API en Postman](https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api). Incluye más de un tipo de login; no copies las llamadas de Page/Facebook Login para configurar el SUAT de esta aplicación.
- [Meta — especificación de la API Business](https://github.com/facebook/facebook-business-sdk-codegen/blob/main/api_specs/specs/Business.json), incluida para consultar las aristas de activos de Instagram disponibles.

## Archivos del proyecto revisados

- [Servicio de Instagram](../src/server/instagram.ts)
- [Cliente de Graph API y validación de perfil/feed](../src/server/instagram-meta.ts)
- [Almacenamiento cifrado y cachés](../src/server/instagram-storage.ts)
- [Ruta administrativa](../src/app/api/admin/instagram/route.ts)
- [Formulario de conexión](../src/components/admin/InstagramConnection.tsx)
- [Galería del Home](../src/components/store/InstagramSection.tsx)
