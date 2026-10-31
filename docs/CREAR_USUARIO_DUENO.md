# Crear una cuenta dueña

El acceso al panel se realiza desde `/auth`; la tienda no tiene registro público. Una cuenta dueña necesita los roles `admin` y `owner`. La forma de crearla depende de si la base de datos está vacía o ya tiene cuentas.

## Primera cuenta en una base vacía

Usá este procedimiento para una instalación nueva, antes de crear cualquier otro usuario:

1. Revisá que `DATABASE_URL` apunte a la base correcta y que `AUTH_SECRET` esté configurado con al menos 32 bytes. Tomá como referencia `.env.example` y mantené los secretos fuera del repositorio.
2. Aplicá las migraciones pendientes: `npm run db:migrate:deploy` en el entorno de despliegue o `npm run db:migrate` en desarrollo.
3. En el entorno privado que ejecutará el comando, configurá temporalmente:
   - `BOOTSTRAP_OWNER_USERNAME`: usuario de acceso de 3 a 191 caracteres. Se convierte a minúsculas y admite letras, números y `._@+-`.
   - `BOOTSTRAP_OWNER_PASSWORD`: contraseña de 12 a 128 caracteres.
   - `BOOTSTRAP_OWNER_NAME`: nombre visible de hasta 100 caracteres. Es opcional; si se omite, se usa el usuario.
4. Ejecutá `npm run db:bootstrap-owner`.
5. Cuando aparezca el mensaje de creación, quitá las tres variables temporales del entorno y entrá en `/auth` con el usuario y la contraseña elegidos.

El comando crea los roles `admin` y `owner` dentro de una transacción. Comprueba que no haya ninguna cuenta y se detiene si ya existe al menos una; no sirve para agregar un dueño a una base poblada.

## Base de datos que ya tiene usuarios

La migración `20261026030000_owner_role` agrega el rol `owner` y, si todavía no existe ninguno, se lo asigna al administrador más antiguo (por fecha de creación y luego por ID). Conserva las cuentas, contraseñas y roles `admin` existentes.

Para una base de datos compartida, revisá primero el SQL de esa migración y obtené la autorización explícita requerida por `AGENTS.md` antes de aplicarla. Después, desplegá las migraciones pendientes con `npm run db:migrate:deploy`. En desarrollo podés usar `npm run db:migrate`. El administrador elegido puede iniciar sesión con sus credenciales actuales y gestionar las cuentas desde **Cuenta → Usuarios** (`/admin/usuarios`).

Si la migración ya se aplicó, iniciá sesión con la cuenta que recibió el rol y revisá **Cuenta → Usuarios**. Esa pantalla permite crear y administrar cuentas administradoras; no permite transferir el rol de dueño. Si necesitás que una cuenta distinta sea dueña, el proyecto todavía no ofrece una operación soportada para elegirla: prepará un cambio específico y revisado para ese entorno antes de modificar roles.

## Si el comando falla

- **La base ya tiene cuentas:** no vuelvas a ejecutar el bootstrap; seguí el procedimiento para una base poblada.
- **Faltan variables o no cumplen el formato:** revisá los nombres y límites indicados arriba.
- **No conecta o faltan tablas:** verificá `DATABASE_URL` y aplicá las migraciones en el entorno correcto.
