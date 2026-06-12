# api-webshield

API REST en Express.js (ES Modules) que sirve como backend del dashboard de WebShield. Gestiona autenticación, expone métricas de eventos registrados por el WAF, actúa como proxy hacia la ML API y recibe eventos del WAF mediante un endpoint de ingesta.

---

## Responsabilidades

- **Auth** — registro, login y sesiones JWT via cookie HttpOnly
- **Dashboard** — consulta y sirve eventos de seguridad almacenados en MySQL
- **Proxy ML** — reenvía peticiones de inspección al servicio `machineLearning-api`
- **Ingest** — recibe eventos del `waf_proxy` y los persiste en MySQL con validación estricta

---

## Instalación

```bash
cd back/api-webshield
npm install
cp .env.example .env
```

Edita `.env` con tus valores (ver sección Variables de entorno).

---

## Ejecución

```bash
npm run dev    # desarrollo — node --watch
npm start      # producción
```

Verifica: `GET http://localhost:3001/api/health`

---

## TLS (HTTPS)

Si `TLS_CERT_PATH` y `TLS_KEY_PATH` están configurados y los archivos existen, el servidor arranca en HTTPS automáticamente. Si no, cae a HTTP con un aviso en consola.

Para generar un certificado autofirmado de desarrollo:
```bash
bash scripts/gen-cert.sh
```

---

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Comprueba conexión a MySQL |
| `POST` | `/api/auth/register` | Registra un nuevo usuario |
| `POST` | `/api/auth/login` | Inicia sesión y establece cookie de sesión |
| `POST` | `/api/auth/logout` | Cierra sesión y borra la cookie |

### Requieren sesión (cookie JWT)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/auth/me` | Devuelve el usuario autenticado actual |
| `GET` | `/api/dashboard` | Eventos recientes del WAF (últimos 200) |
| `GET` | `/api/model/health` | Proxy al `/health` de la ML API (consulta directa, fuera del flujo normal del WAF) |
| `POST` | `/api/model/inspect` | Proxy al ML API para inspección directa desde el dashboard |

### Requieren Bearer token (WAF → API)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/ingest/events` | Recibe y persiste un evento del WAF |

---

## Autenticación

### Sesiones de usuario

El login y el registro devuelven un **JWT** almacenado como cookie `HttpOnly` con los atributos:

- `httpOnly: true` — inaccesible desde JavaScript del navegador
- `secure: true` — solo se envía por HTTPS
- `sameSite` — configurable con `COOKIE_SAMESITE` (default `Strict`, pero `Lax` es necesario cuando el frontend y backend se sirven en dominios distintos o cuando hay un reverse proxy en medio)
- Duración: `JWT_EXPIRES_IN` (default 7 días)

Las rutas protegidas usan el middleware `requireAuth`, que verifica la cookie y adjunta `req.user` con los datos del usuario.

### Auth de ingesta (WAF → API)

El `waf_proxy` autentica sus peticiones a `/api/ingest/events` con un Bearer token en el header `Authorization`:

```
Authorization: Bearer <INGEST_API_TOKEN>
```

El token se configura en la variable `INGEST_API_TOKEN`.

---

## Ingesta de eventos

`POST /api/ingest/events` espera el siguiente payload (todos los campos son requeridos salvo los marcados como opcionales):

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "detected_at": "2025-06-12T10:30:00.000Z",
  "verdict": "anomalous",
  "action": "blocked",
  "confidence_score": 0.94,
  "client_ip": "192.168.1.10",
  "latency_ms": 12,
  "model_version": "v1",
  "http": {
    "method": "POST",
    "uri": "/login",
    "get_query": "",
    "post_data": "user=admin'--&pass=x",
    "cookie": "",
    "user_agent": "sqlmap/1.7",
    "content_length": 22,
    "host_header": "HTTP/1.1",
    "request_headers": { "content-type": "application/x-www-form-urlencoded" }
  }
}
```

| Campo | Tipo | Validación |
|---|---|---|
| `event_id` | string | UUID v4 |
| `detected_at` | string | ISO 8601 (opcional) |
| `verdict` | string | `"valid"` o `"anomalous"` |
| `action` | string | `"allowed"` o `"blocked"` |
| `confidence_score` | number | 0.0 – 1.0 |
| `client_ip` | string | No vacío |
| `latency_ms` | integer | ≥ 0 |
| `model_version` | string | Opcional |
| `http.method` | string | No vacío |
| `http.uri` | string | No vacío |
| `http.host_header` | string | `"HTTP/1.0"` o `"HTTP/1.1"` (opcional) |
| `http.request_headers` | object | Opcional |

La inserción es transaccional: escribe en `request_events` y `request_http` en una sola transacción. Si `event_id` ya existe (el WAF reintentó el mismo evento) la operación es idempotente: el endpoint responde `204 No Content` igual que en el caso de éxito, sin volver a insertar.

---

## Proxy ML

Las rutas `/api/model/*` reenvían peticiones al servicio `machineLearning-api` configurado en `MODEL_API_URL`. Requieren sesión activa. Se usan para consultar el modelo directamente desde herramientas internas; el flujo normal de eventos en producción no pasa por aquí (lo ingesta el WAF).

```
GET  /api/model/health   →  MODEL_API_URL/health
POST /api/model/inspect  →  MODEL_API_URL/inspect
```

El timeout es configurable con `MODEL_API_TIMEOUT_MS`. Si se usa Bearer auth con el ML, el token va en `MODEL_API_KEY`.

---

## Seguridad aplicada

| Mecanismo | Detalle |
|---|---|
| Helmet + CSP | `defaultSrc 'self'`, sin inline scripts, sin objetos externos |
| CORS | Solo orígenes en `ALLOWED_ORIGINS`; `credentials: true` |
| Rate limiting | Auth endpoints: 10 peticiones / 15 minutos por IP |
| Cookie flags | `HttpOnly`, `Secure`, `SameSite=Strict` |
| `X-Powered-By` | Desactivado |
| `Cache-Control` | `no-store` en todas las respuestas |
| `trust proxy` | Activado para leer IP real detrás de un reverse proxy |
| TLS | HTTPS automático si se proporcionan cert y key |

---

## Estructura de archivos

```
src/
├── index.js                  # Punto de entrada — configura Express y arranca el servidor
├── db.js                     # Pool de conexiones MySQL2
├── middleware/
│   ├── auth.js               # requireAuth (JWT cookie), set/clearSessionCookie
│   ├── bearerAuth.js         # Verifica INGEST_API_TOKEN para el WAF
│   └── security.js           # Helmet, CORS, headers de seguridad, sendSafeError
├── routes/
│   ├── auth.js               # /api/auth/*
│   ├── dashboard.js          # /api/dashboard
│   ├── ingest.js             # /api/ingest/events
│   └── model.js              # /api/model/*
└── services/
    ├── authService.js        # registerUser, verifyPassword, signToken, verifyToken
    ├── dashboardService.js   # getDashboardData — consulta request_events + request_http
    ├── ingestService.js      # insertEvent con validación y transacción
    └── modelService.js       # modelHealth, modelAnalyze — cliente HTTP hacia ML API
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `webshield` |
| `API_HOST` | Interfaz donde escucha el servidor | `127.0.0.1` |
| `API_PORT` | Puerto del servidor | `3001` |
| `TLS_CERT_PATH` | Ruta al certificado TLS (activa HTTPS) | — |
| `TLS_KEY_PATH` | Ruta a la clave privada TLS | — |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (coma-separados) | `https://localhost:5173` |
| `JWT_SECRET` | Secreto para firmar JWTs — **cambiar en producción** | — |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `COOKIE_NAME` | Nombre de la cookie de sesión | `webshield_session` |
| `COOKIE_SAMESITE` | Atributo `SameSite` de la cookie | `Strict` |
| `MODEL_API_URL` | URL base de la ML API | — |
| `MODEL_API_KEY` | Bearer token para autenticar con la ML API | — |
| `MODEL_API_TIMEOUT_MS` | Timeout de llamadas a la ML API (ms) | `5000` |
| `INGEST_API_TOKEN` | Bearer token que usa el WAF para `POST /api/ingest/events` | — |
