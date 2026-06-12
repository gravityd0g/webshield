# waf_proxy

Proxy HTTP inverso que actúa como punto de entrada del sistema WebShield. Intercepta cada petición entrante, la envía a la ML API para clasificación, y decide si bloquearla (HTTP 403) o reenviarla al backend protegido.

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
  ├── action == "block"  →  HTTP 403 (petición bloqueada)
  └── action == "allow"  →  reenvía al BACKEND_URL
```

Si la ML API no está disponible, el comportamiento depende de `FAIL_MODE`:
- `closed` (default): rechaza la petición con HTTP 503
- `open`: deja pasar la petición sin inspección

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

El proxy se configura mediante variables de entorno:

| Variable | Descripción | Default |
|---|---|---|
| `ML_API_URL` | URL del endpoint `/inspect` de la ML API | `http://ml-api:8001/inspect` |
| `BACKEND_URL` | URL del backend protegido | `http://demo-backend:9000` |
| `INTERNAL_API_KEY` | API key para autenticar con la ML API | `""` (sin auth) |
| `ML_TIMEOUT_SECONDS` | Timeout en segundos para llamadas a la ML API | `2.0` |
| `FAIL_MODE` | Comportamiento si la ML API falla: `closed` o `open` | `closed` |
| `MAX_BODY_BYTES` | Bytes máximos del body enviados al modelo | `65536` |

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
  "ml_api_url": "http://ml-api:8001/inspect",
  "backend_url": "http://demo-backend:9000",
  "fail_mode": "closed"
}
```

### `ANY /{path}`

Punto de entrada para todas las peticiones HTTP. Acepta `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` y `HEAD`.

**Petición bloqueada (HTTP 403):**
```json
{
  "detail": "Request blocked by WebShield",
  "label": "anomalous",
  "prob_anomalous": 0.92,
  "threshold": 0.5,
  "model_version": "v1"
}
```

**Petición permitida:** se reenvía al backend transparentemente y se devuelve la respuesta original.

---

## Headers de trazabilidad

El proxy añade los siguientes headers al reenviar al backend:

| Header | Valor |
|---|---|
| `x-webshield-inspected` | `true` |
| `x-forwarded-for` | IP real del cliente |
| `x-forwarded-proto` | Esquema de la petición original (`http`/`https`) |

Los headers hop-by-hop (`connection`, `transfer-encoding`, etc.) se eliminan automáticamente antes del reenvío.

---

## FAIL_MODE

| Modo | Comportamiento cuando la ML API no responde |
|---|---|
| `closed` | Devuelve HTTP 503 — ninguna petición pasa sin inspección |
| `open` | Reenvía la petición al backend — prioriza disponibilidad sobre seguridad |

El modo `closed` es el recomendado en producción.
