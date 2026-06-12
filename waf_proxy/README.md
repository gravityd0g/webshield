# waf_proxy

Proxy HTTP inverso que actúa como punto de entrada del sistema WebShield. Intercepta cada petición entrante, la envía a la ML API para clasificación y decide si bloquearla (HTTP 403) o reenviarla al backend protegido. Después de la decisión, envía un evento al backend del dashboard para que quede registrado.

---

## Flujo de una petición

```
Cliente
  │
  ▼
waf_proxy  ──── POST /inspect ────▶  machineLearning-api
  │                                        │
  │         ◀─── { action, label } ────────┘
  │
  ├── action == "block"  →  HTTP 403 al cliente
  └── action == "allow"  →  reenvía al app_url del app correspondiente
  │
  └── fire-and-forget POST  →  backend /api/ingest/events
                                  (Bearer WEBSHIELD_INGEST_TOKEN)
```

Si la ML API no responde, el comportamiento depende de `FAIL_MODE`:
- `open` (default): deja pasar la petición sin inspección
- `closed`: rechaza con HTTP 503

---

## Routing por app

El WAF soporta múltiples apps protegidas dentro de la misma instancia. La selección se hace por el header `X-WebShield-App` (lo inyecta nginx en función del puerto, ver sección "Despliegue").

`WAF_ROUTES_JSON` define las apps disponibles:

```json
{
  "apps": {
    "single_app": {
      "mode": "single_vm",
      "app_url": "http://172.16.67.149:80",
      "bypass_paths": ["/health"]
    },
    "split_app": {
      "mode": "split",
      "frontend_url": "http://172.16.67.148:80",
      "backend_url": "http://172.16.67.144:8000",
      "api_prefixes": ["/api", "/auth", "/admin/api"],
      "bypass_paths": ["/health"]
    }
  }
}
```

- `mode: single_vm` — todo el tráfico va a `app_url`
- `mode: split` — peticiones que comienzan con un `api_prefixes` van a `backend_url`, el resto va a `frontend_url`
- `bypass_paths` — rutas que se reenvían sin pasar por el modelo (típicamente `/health`)

---

## Instalación

```bash
cd waf_proxy
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi uvicorn httpx
```

---

## Configuración

Todas las variables son de entorno.

### ML

| Variable | Descripción | Default |
|---|---|---|
| `ML_API_URL` | URL del endpoint `/inspect` de la ML API | `http://172.16.67.67:8000/inspect` |
| `ML_API_TOKEN` | Bearer token para autenticar con la ML API | `""` (sin auth) |
| `ML_TIMEOUT_SECONDS` | Timeout (segundos) para llamadas al modelo | `1.5` |
| `FAIL_MODE` | `open` o `closed` cuando la ML API no responde | `open` |
| `MAX_INSPECT_BODY_BYTES` | Bytes máximos del body enviados al modelo | `1048576` (1 MB) |

### Routing

| Variable | Descripción | Default |
|---|---|---|
| `WAF_ROUTES_JSON` | JSON con las apps protegidas (ver sección Routing) | `{}` |

### Ingest al dashboard

| Variable | Descripción | Default |
|---|---|---|
| `WEBSHIELD_INGEST_URL` | URL del endpoint del backend que recibe eventos. Si está vacío el ingest queda desactivado | `""` |
| `WEBSHIELD_INGEST_TOKEN` | Bearer token compartido con el backend para autenticar el ingest | `""` |
| `WEBSHIELD_INGEST_VERIFY_TLS` | Si es `false` el cliente HTTPS no valida el cert del backend (útil con self-signed) | `true` |
| `INGEST_TIMEOUT_SECONDS` | Timeout (segundos) para el POST al backend | `2.0` |

### Otros

| Variable | Descripción | Default |
|---|---|---|
| `LOG_LEVEL` | Nivel de log de uvicorn / app | `INFO` |

---

## Ejecución

```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## Endpoints

### `GET /health`

Devuelve el estado del proxy y su configuración activa.

```json
{
  "status": "ok",
  "routing": "port-based via X-WebShield-App",
  "ml_api_url": "http://172.16.67.67:8000/inspect",
  "fail_mode": "open",
  "apps": ["single_app", "split_app"]
}
```

### `ANY /{path}`

Punto de entrada para todas las peticiones HTTP. Acepta `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` y `HEAD`. Determina la app destino por el header `X-WebShield-App` y aplica el routing definido en `WAF_ROUTES_JSON`.

**Petición bloqueada (HTTP 403):**
```json
{
  "detail": "Request blocked by WebShield",
  "app": "single_app",
  "label": "anomalous",
  "prob_anomalous": 0.92,
  "model_version": "1.0.0"
}
```

**Petición permitida:** se reenvía al app destino transparentemente y se devuelve la respuesta original.

---

## Headers de proxy

Antes de reenviar al backend, el WAF:

- Elimina headers hop-by-hop (`connection`, `transfer-encoding`, etc.)
- Elimina `x-webshield-app`, `host`, `content-length`, `accept-encoding`
- Inyecta `accept-encoding: identity` (evita que el cliente reciba un body comprimido que ya descomprimió httpx)
- Inyecta `x-forwarded-for` con la IP real del cliente
- Inyecta `x-forwarded-host` y `x-forwarded-proto` con los valores originales

En la respuesta del backend, también elimina `content-encoding`, `content-length`, `transfer-encoding` y `connection` antes de devolverla al cliente (mismo motivo: `httpx.content` entrega el body ya descomprimido).

---

## Ingest al dashboard

Después de cada decisión del modelo, el WAF lanza una tarea asíncrona (fire-and-forget) que envía un evento al backend del dashboard.

Si el POST falla (red, token, timeout) el request del cliente no se ve afectado. El evento puede perderse pero el flujo de inspección y reenvío continúa normalmente.

Payload del evento:

```json
{
  "event_id": "uuid-v4",
  "detected_at": "2026-06-12T10:30:00.000Z",
  "verdict": "anomalous",
  "action": "blocked",
  "confidence_score": 0.92,
  "model_version": "1.0.0",
  "client_ip": "203.0.113.7",
  "latency_ms": 12,
  "http": {
    "method": "POST",
    "uri": "/login",
    "get_query": "",
    "post_data": "...",
    "cookie": "",
    "user_agent": "sqlmap/1.7",
    "content_length": 22,
    "host_header": "HTTP/1.1",
    "request_headers": { "...": "..." }
  }
}
```

---

## Despliegue (port-based con nginx)

En producción el WAF corre detrás de nginx para soportar routing por puerto:

```
nginx :8081  ──┐
               ├──▶  uvicorn :8080  ──▶  app.main:app
nginx :8082  ──┘
```

nginx inyecta el header `X-WebShield-App` según el puerto de entrada (`:8081 → split_app`, `:8082 → single_app`), y uvicorn solo escucha en `127.0.0.1:8080`. Esto permite exponer cada app en un puerto distinto sin cambiar el código del proxy.
