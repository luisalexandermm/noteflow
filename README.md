# NoteFlow

> **Tus ideas, mejor organizadas.**

Plataforma de organización académica para estudiantes: notas por materia, tareas, calendario, progreso y un asistente de IA.

## Estado del proyecto

| | Qué | Estado |
|---|---|---|
| ✅ | Página de bienvenida: hero, información y footer | Lista |
| ✅ | Registro e inicio **solo con el correo** (código de 6 números) | Listo |
| ✅ | Base de datos **PostgreSQL en Neon** | Lista |
| ✅ | Cada usuario empieza vacío y solo ve lo suyo | Probado |
| ✅ | Imágenes de las notas (comprimidas y guardadas en la base de datos) | Listo |
| ✅ | App completa: inicio, notas, editor, materias, tareas, calendario, progreso, asistente, configuración | Lista |
| ✅ | Interfaz nueva: menú flotante en PC, barra inferior en el celular, tablero "Tu día" | Lista |
| ✅ | Recordatorio con cuenta regresiva, agenda de la semana, modo enfoque (Pomodoro) y racha | Listo |
| ✅ | **PWA**: se instala en el celular y el computador, abre sin internet | Lista (fase 9) |
| ⏳ | IA real | Fase 7 (hoy: modo demostración) |
| ⏳ | Publicar en internet y Android (Capacitor) | Fases siguientes |

---

## Cómo está armado

```text
Navegador (frontend)  ──fetch──►  Servidor Express (backend)  ──pg──►  Neon (PostgreSQL)
  · nunca ve claves                · revisa la sesión (cookie)          · solo el servidor
  · cookie de sesión HttpOnly      · valida todo lo que llega             tiene la clave
                                   · cada consulta lleva usuario_id     (DATABASE_URL)
                                   · envía el código por correo (SMTP)
```

El navegador **nunca** habla directo con la base de datos. Todo pasa por el backend, que revisa quién eres antes de cada consulta.

---

## Paso a paso para que funcione

### 1. Instalar y probar en modo local (sin base de datos)

Necesitas **Node.js 18 o superior** ([nodejs.org](https://nodejs.org), versión LTS).

```bash
cd noteflow
npm install
cp .env.example .env        # en Windows (CMD): copy .env.example .env
npm start
```

Abre **http://localhost:3000**. En este modo entras con cualquier correo y los datos quedan solo en ese navegador.

> No abras los HTML con doble clic ni con Live Server: usa siempre `npm start`.

### 2. Crear la base de datos en Neon

1. Entra a [neon.com](https://neon.com) → **Sign up** (puedes usar tu cuenta de GitHub o Google).
2. **Create project**: nombre `noteflow`, región la más cercana (por ejemplo *AWS US East*), versión de Postgres la que sugiera.
3. En el panel del proyecto, botón **Connect**. Copia la **connection string**, que se ve así:
   ```
   postgresql://neondb_owner:xxxx@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Pégala en tu `.env`:
   ```
   DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxxx-pooler....neon.tech/neondb?sslmode=require
   ```
5. Crea las tablas desde tu terminal:
   ```bash
   npm run crear-tablas
   ```
   Debe decir `✔ Listo. Tablas en la base de datos (12)`.
   (También puedes pegar `base-datos/tablas.sql` en el **SQL Editor** de Neon.)

### 3. Configurar el correo (para que llegue el código)

En un hosting como Render, se recomienda usar la API HTTPS de [Resend](https://resend.com/), porque algunos hostings bloquean conexiones SMTP salientes:

1. Crea una cuenta en Resend y genera una API key en **API Keys**.
2. Para una prueba, puedes usar `onboarding@resend.dev` como remitente; Resend solo permite enviar con ese remitente a la dirección asociada a tu cuenta.
3. Para que cualquier persona pueda registrarse, verifica un dominio propio en Resend y configura su DNS. Usa como remitente una dirección de ese dominio, por ejemplo `NoteFlow <acceso@tu-dominio.com>`.
4. En Render → servicio → **Environment**, configura:
   ```
   RESEND_API_KEY=re_...
   CORREO_REMITENTE=NoteFlow <acceso@tu-dominio.com>
   NODE_ENV=production
   ```
   Guarda los cambios para que Render reinicie el servicio. No publiques la API key.

La API de Resend tiene prioridad si se configura `RESEND_API_KEY`. SMTP con Gmail se puede usar para desarrollo local:

Con Gmail:
1. En tu cuenta de Google activa la **Verificación en 2 pasos** (Seguridad).
2. Entra a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crea una contraseña de aplicación llamada `NoteFlow` y copia las 16 letras.
3. En tu `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PUERTO=465
   SMTP_USUARIO=tucorreo@gmail.com
   SMTP_CLAVE=abcdefghijklmnop
   ```

> **Sin servicio de correo:** mientras desarrollas, el código aparece en la terminal donde corre `npm start` (`✉ [MODO DESARROLLO] Código para…`). Así puedes probar sin configurar correo.

### 4. Reiniciar y comprobar

`Ctrl + C` y `npm start`. Debe decir:
```
Base de datos: Neon (PostgreSQL)
Correo: servicio configurado (los códigos llegan por correo)
```

Para comprobar que todo funciona:
1. Entra a http://localhost:3000 y toca **Iniciar**.
2. Escribe tu correo y escribe el código que te llega.
3. Crea una materia, una nota (con imagen) y una tarea.
4. En Neon → **Tables**, deberías ver tus datos.

---

## La app instalable (PWA)

NoteFlow se puede instalar como una app, sin tienda:

| Dispositivo | Cómo se instala |
|---|---|
| Android (Chrome) | Botón **Instalar app** en la hoja **Más**, o el aviso del inicio |
| iPhone / iPad (Safari) | Botón **Instalar app** → muestra los 3 pasos (Compartir → *Agregar a pantalla de inicio*) |
| PC / portátil (Chrome o Edge) | Tarjeta **Instalar app** en el menú lateral, o el ícono de instalar en la barra de direcciones |

Archivos que la hacen funcionar:

- `frontend/manifest.webmanifest`: nombre, colores, íconos y accesos directos (Nueva nota, Nueva tarea, Calendario).
- `frontend/service-worker.js`: guarda la app en el dispositivo para que abra rápido y sin internet. **Nunca** guarda `/api/...` (tus datos privados siempre van al servidor).
- `frontend/js/pwa.js`: registra el service worker y muestra los botones de instalar.
- `frontend/offline.html`: lo que ves si no hay internet.
- `frontend/img/iconos/`: íconos 192, 512, maskable y de iPhone.

> **Importante:** la instalación solo funciona en `https://` (cuando la publiques) o en `http://localhost`.
> Cuando cambies archivos del frontend, incrementa la versión en `service-worker.js` (por ejemplo, `noteflow-v2` → `noteflow-v3`) para que los celulares descarguen lo nuevo.

---

## Si algo falla

| Síntoma | Solución |
|---|---|
| Dice "MODO LOCAL" | `DATABASE_URL` vacía o el `.env` no está junto a `package.json`. |
| `npm run crear-tablas` da error de conexión | Revisa que copiaste la cadena completa, con la clave. |
| "La base de datos no responde" | Neon se "duerme" tras 5 minutos sin uso; la primera petición tarda ~1 s. Si sigue, revisa tu internet o la `DATABASE_URL`. |
| "No pudimos enviar el correo" | Revisa la terminal: si dice `Invalid login`, la contraseña de aplicación está mal (son 16 letras, sin espacios). |
| No llega el código | Revisa spam. Se puede pedir un código por minuto. |
| "Demasiados intentos" | Espera 15 minutos o pide un código nuevo. |
| No veo el botón "Instalar app" | Ya está instalada, o abriste con `http://` en una IP (usa `localhost` o `https`). En Firefox de PC no existe la instalación. |
| Cambié el código y no se ve | Con internet la app siempre pide lo nuevo; recarga con Ctrl + Shift + R. Para íconos o fuentes, sube la versión en `service-worker.js`. |

---

## Seguridad

- **Login sin contraseñas:**
  - El código de 6 números vence en 10 minutos.
  - Admite máximo 5 intentos y sirve una sola vez.
  - Se guarda como huella (hash), nunca en texto.
- **Sesión en cookie HttpOnly:**
  - JavaScript no la puede leer y dura 30 días.
  - En la base de datos solo está la huella del token.
- **Cada consulta lleva `usuario_id`** de la sesión, nunca uno que mande el navegador. Probado con dos usuarios: uno no puede ver, cambiar, borrar ni enlazar nada del otro.
- **Consultas parametrizadas** (`$1, $2…`): sin inyección SQL.
- **Protección CSRF:** otros sitios no pueden hacer peticiones con tu sesión (se revisan el origen y el tipo de contenido).
- **Límites anti-abuso:** pocos códigos por IP y por correo.
- **Imágenes:**
  - El navegador las comprime y el servidor revisa su "firma" (que de verdad sean PNG, JPG, WEBP o GIF).
  - Máximo 1 MB cada una y 50 MB por usuario.
  - Solo su dueño puede verlas.
- **Todo se valida en el backend** (largos, fechas, opciones) y también en la base de datos (reglas `check`).
- **Política de contenido (CSP):** solo scripts propios. El texto del usuario siempre se escapa y el HTML de las notas se limpia.
- **Claves solo en `.env`**, que está en `.gitignore`.

---

## Estructura

```text
noteflow/
├── frontend/
│   ├── index.html                Bienvenida (hero, información, footer)
│   ├── manifest.webmanifest      ★ datos de la app instalable
│   ├── service-worker.js         ★ funciona sin internet (nunca guarda /api)
│   ├── offline.html              página "Sin conexión"
│   ├── paginas/                  App privada: inicio, notas, nota, materias, tareas,
│   │                             calendario, estadisticas, asistente, configuracion
│   ├── css/                      estilos · componentes · paginas · bienvenida · responsive
│   ├── js/
│   │   ├── api.js                ★ pedir(): habla con el backend
│   │   ├── sesion.js             ★ quién está conectado; código por correo; salir
│   │   ├── datos.js              ★ todos los datos del usuario (memoria + guardado)
│   │   ├── bienvenida.js         botón Iniciar, correo y código
│   │   ├── navegacion.js         menú lateral (PC), riel (tablet), barra inferior y "Más" (celular)
│   │   ├── inicio.js             tablero: mosaicos, materias, recordatorio, agenda, racha
│   │   ├── enfoque.js            modo enfoque (Pomodoro) → guarda sesiones de estudio
│   │   ├── pwa.js                instalar la app
│   │   └── …                     una por pantalla + piezas comunes
│   ├── 3d/  vendor/  fuentes/  img/
├── backend/
│   ├── servidor.js               arranca Express y monta las rutas
│   ├── db.js                     ★ conexión a Neon (consulta, transaccion)
│   ├── rutas/                    auth, datos, materias, notas, tareas, eventos, chat, imagenes, ia
│   ├── controladores/            qué hace cada ruta (SQL)
│   ├── servicios/                validar.js, correo.js
│   └── middleware/               autenticacion (sesiones), proteccion (CSRF y límites),
│                                 seguridad (CSP), errores
├── base-datos/
│   ├── tablas.sql                12 tablas
│   └── crear-tablas.js           npm run crear-tablas
└── .env.example · package.json · README.md
```

### Rutas de la API

| Ruta | Para qué |
|---|---|
| `POST /api/auth/enviar-codigo` | Envía el código al correo |
| `POST /api/auth/verificar` | Revisa el código y crea la sesión (y la cuenta si es nueva) |
| `GET /api/auth/sesion` · `POST /api/auth/salir` | ¿Quién soy? · Cerrar sesión |
| `GET /api/datos` · `DELETE /api/datos` | Todo lo del usuario · Borrar todo |
| `PUT /api/perfil` | Nombre, carrera y preferencias |
| `POST/DELETE /api/materias` | Crear · Eliminar materia |
| `PUT/DELETE /api/notas/:id` | Guardar (con etiquetas) · Eliminar nota |
| `PUT/DELETE /api/tareas/:id` · `/api/eventos/:id` | Lo mismo para tareas y eventos |
| `POST /api/chat/mensajes` · `DELETE /api/chat` | Chat del asistente |
| `POST /api/imagenes` · `GET /api/imagenes/:id` | Subir · Ver imagen |

---

## Límites del plan gratis de Neon

- **1 GB de base de datos.** Con imágenes comprimidas (~200 KB) caben miles de notas con fotos.
- **Se duerme tras 5 minutos sin uso** y despierta en la siguiente petición (tarda ~1 s).

---

Hecho por **Luis Alexander Maturana** · Maturana Tech · Quibdó, Chocó
