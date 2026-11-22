# Guía de instalación — Tu propia Sala

Monta tu Sala en unos 20 minutos. Todo con planes gratuitos: Supabase (base de datos), GitHub (código) y Cloudflare Pages (web). No hace falta tarjeta en ninguno.

## Qué tienes en este paquete

- La app completa (código): agenda, estudios con temario y tests, simulacros de examen, idiomas (japonés/inglés), música, comida, deporte, dinero, notificaciones y modo sin conexión.
- `schema.sql`: crea toda la base de datos de una vez.
- `config.js`: el único archivo que tienes que editar.
- Sin datos de nadie: tu Sala empieza vacía y la llenas tú.

## Paso 1 — Supabase (base de datos, gratis)

1. Entra en [supabase.com](https://supabase.com) y crea una cuenta (botón "Start your project").
2. "New project": ponle un nombre (p. ej. `mi-sala`), una contraseña de base de datos (guárdala) y la región más cercana.
3. Cuando termine de crearse, ve a **Project Settings → Data API** (o "API") y copia:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - La clave **anon public** (`eyJ...` larga). Es pública por diseño; la seguridad la dan las políticas que crea el schema.

## Paso 2 — Crear las tablas

1. En Supabase, abre **SQL Editor → New query**.
2. Pega TODO el contenido de `schema.sql` y pulsa **Run**.
3. Si termina sin errores, ya están las tablas, la seguridad (RLS) y los buckets de archivos.

## Paso 3 — Crear tu usuario

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Pon tu email y una contraseña. Marca "Auto Confirm User".
3. En **Authentication → Sign In / Providers**, desactiva **"Allow new users to sign up"** para que nadie más pueda registrarse.

## Paso 4 — Editar config.js

Abre `config.js` y rellena:

- `SUPABASE_URL`: la Project URL del paso 1.
- `SUPABASE_ANON_KEY`: la anon key del paso 1.
- `ALLOWED_EMAILS`: tu email (el del paso 3), entre comillas.
- `OWNER_NAME`: tu nombre (aparece en el saludo; también puedes ponerlo luego en Configuración → Nombre visible).

El resto puedes dejarlo como está.

## Paso 5 — Subir el código a GitHub (gratis)

1. Crea un repo nuevo en [github.com](https://github.com) (puede ser privado), p. ej. `mi-sala`.
2. Sube TODOS los archivos de este paquete (botón "uploading an existing file" o por git).
   - No subas nunca claves privadas: la anon key de `config.js` es la pública y es correcto que esté ahí.

## Paso 6 — Publicar en Cloudflare Pages (gratis)

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Elige tu repo. En el build:
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Build output directory: `/`
3. Deploy. En un minuto tendrás tu Sala en `https://TU-PROYECTO.pages.dev`.

## Paso 7 — Entrar y hacerla tuya

1. Abre tu URL, inicia sesión con el usuario del paso 3.
2. En **Configuración** pon tu nombre y elige los apartados visibles.
3. Instálala como app:
   - **iPhone**: Safari → Compartir → "Añadir a pantalla de inicio".
   - **Mac**: Safari → Archivo → "Añadir al Dock" (o Chrome → icono de instalar).
4. Sin conexión: pulsa el botón de descarga (junto a Actualizar) para tener todo disponible offline.

## Opcionales

- **Fondo propio**: sube tu imagen como `fondo-sala.webp` al repo y cambia la última regla de `app.css` (está comentada al final, marcada como PLANTILLA BASE).
- **Tests de tus temas**: añade preguntas en la tabla `test_questions` (Table Editor o SQL). Ejemplo:

  ```sql
  insert into test_questions (bank, subject, ord, question, options, correct, explanation)
  values ('Mi Asignatura U01', 'Mi Asignatura', 1,
    '¿Pregunta de ejemplo?',
    '["Opción A", "Opción B", "Opción C", "Opción D"]', 0,
    'La A es correcta porque...');
  ```

  Y registra el banco en `config.js → TEST_BANKS`:
  `{ "bank": "Mi Asignatura U01", "subject": "Mi Asignatura" }`
- **Google Calendar**: la agenda funciona con tus tareas sin conectar nada. La sincronización con Google Calendar necesita una función RPC propia y un Client ID de Google Cloud; no va incluida en la plantilla.
- **Notificaciones push**: necesitan claves VAPID y una Edge Function (`push-send`); tampoco van incluidas. El botón de Configuración avisará de que no están configuradas.

## Problemas comunes

- **"No puedes entrar" al iniciar sesión**: tu email no está en `ALLOWED_EMAILS` de `config.js`, o el usuario no está confirmado en Supabase.
- **Pantalla en blanco o datos vacíos**: revisa que `SUPABASE_URL` y `SUPABASE_ANON_KEY` están bien pegadas y que el `schema.sql` corrió sin errores.
- **No se ven los últimos cambios**: botón Actualizar de la app (o Configuración → Actualización).
