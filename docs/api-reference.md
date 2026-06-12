# Referencia de API

## Backend API (`back/api-webshield`) — puerto 3001

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor y la base de datos |
| `POST` | `/api/auth/register` | Registra un nuevo usuario del dashboard |
| `POST` | `/api/auth/login` | Inicia sesión, establece cookie `HttpOnly` |
| `POST` | `/api/auth/logout` | Cierra sesión y borra la cookie |

### Requieren sesión (cookie JWT)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/auth/me` | Usuario autenticado actual |
| `GET` | `/api/dashboard` | Últimos 200 eventos del WAF |
| `GET` | `/api/model/health` | Proxy a `GET machineLearning-api/health` |
| `POST` | `/api/model/inspect` | Proxy a `POST machineLearning-api/inspect` |

### Requieren Bearer token (WAF → API)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/ingest/events` | Recibe y persiste un evento del WAF |

#### Body de `/api/ingest/events`

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "detected_at": "2026-06-12T10:30:00.000Z",
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

Si `event_id` ya existe devuelve `200 { "duplicate": true }` en lugar de error. La inserción es transaccional (`request_events` + `request_http`).

---

## ML API (`machineLearning-api`) — puerto 8000

### `GET /health`

```json
{
  "status": "ok",
  "model_version": "1.0.0",
  "features": 42,
  "threshold": 0.9,
  "trained_at": "2026-06-10T03:15:32Z"
}
```

### `POST /inspect`

Requiere `Authorization: Bearer <ML_API_TOKEN>` si está configurado.

**Request:**
```json
{
  "method": "POST",
  "uri": "/login",
  "query": "",
  "headers": {
    "user-agent": "Mozilla/5.0",
    "content-type": "application/json"
  },
  "body": "{ \"user\": \"admin' OR 1=1--\" }",
  "client_ip": "192.168.1.10"
}
```

**Response:**
```json
{
  "label": "anomalous",
  "prediction": 1,
  "prob_anomalous": 0.94,
  "threshold": 0.9,
  "action": "block",
  "model_version": "1.0.0"
}
```

| `label` | `action` | Significado |
|---|---|---|
| `valid` | `allow` | Petición legítima |
| `anomalous` | `block` | Petición bloqueada |

---

## WAF Proxy (`waf_proxy`) — puerto 8080

### `GET /health`

```json
{
  "status": "ok",
  "ml_api_url": "http://localhost:8000/inspect",
  "fail_mode": "open",
  "apps": ["recetas"]
}
```

### `ANY /{path}`

Punto de entrada para todas las peticiones. El WAF inspecciona, decide y reenvía.

**Petición bloqueada (HTTP 403):**
```json
{
  "detail": "Request blocked by WebShield",
  "label": "anomalous",
  "prob_anomalous": 0.92,
  "model_version": "1.0.0"
}
```

**Petición permitida:** respuesta transparente del backend protegido.

---

## App demo (`recetas-app`) — puerto 3000

### Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/registro` | — | Crear cuenta |
| `POST` | `/api/auth/login` | — | Login, devuelve JWT |
| `GET` | `/api/auth/perfil` | Bearer | Ver perfil |
| `PUT` | `/api/auth/perfil` | Bearer | Editar perfil |

### Recetas — `/api/recetas`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/recetas` | Opcional | Listar (filtros: `categoria`, `buscar`, `dificultad`, `orden`) |
| `GET` | `/api/recetas/:id` | Opcional | Detalle con ingredientes, pasos y comentarios |
| `POST` | `/api/recetas` | Bearer | Crear |
| `PUT` | `/api/recetas/:id` | Bearer | Editar (solo el autor) |
| `DELETE` | `/api/recetas/:id` | Bearer | Eliminar (solo el autor) |

### Otras rutas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/categorias` | — | Categorías con conteo de recetas |
| `GET` | `/api/favoritos` | Bearer | Mis favoritos |
| `POST` | `/api/favoritos/:id` | Bearer | Agregar favorito |
| `DELETE` | `/api/favoritos/:id` | Bearer | Quitar favorito |
| `GET` | `/api/comentarios/:receta_id` | — | Comentarios de una receta |
| `POST` | `/api/comentarios/:receta_id` | Bearer | Agregar comentario |
| `DELETE` | `/api/comentarios/:id` | Bearer | Eliminar comentario (solo el autor) |
