# Arquitectura

## Visión general

WebShield es un IPS (Intrusion Prevention System) basado en Machine Learning que protege aplicaciones web clasificando cada petición HTTP/HTTPS como válida o anómala usando un modelo Random Forest entrenado con reglas OWASP CRS.

---

## Diagrama — Entorno local (desarrollo)

```
Browser
  │
  ▼
front :5173  ─────────────────────▶  back/api-webshield :3001
  │          (dashboard data)               │
  │                                         ▼
  │                                     MySQL :3306
  │
  │
Cliente HTTP
  │
  ▼
waf_proxy :8080  ──── POST /inspect ────▶  machineLearning-api :8000
  │                                                │
  │               ◀─── { action, label } ──────────┘
  │
  ├── block  ──▶  HTTP 403 al cliente
  └── allow  ──▶  recetas-app :3000
        │
        └── fire-and-forget ──▶  back/api-webshield :3001/api/ingest/events
```

## Diagrama — Entorno de producción (VLAN)

```
Internet
    │  IP pública única
    ▼
waf-DEN 172.16.67.172
  :8081 → Dashboard
  :8082 → App objetivo
    │
    ├── POST /inspect ──▶  infra2 172.16.67.67:8000 (ML física)
    │
    ├── :8081 ──▶  frontend-DEN 172.16.67.148:80
    │                   └──▶  backend-DEN 172.16.67.144:3001
    │                               └──▶  db-DEN 172.16.67.136:3306
    │
    └── :8082 ──▶  app-DEN 172.16.67.149:8000
```

Ver [Documentación/Instancias.md](../Documentación/Instancias.md) para la descripción completa de security groups y flujo de tráfico en producción.

---

## Componentes

| Componente | Carpeta | Tecnología | Puerto local |
|---|---|---|---|
| Dashboard UI | `front/` | React 19 + Vite + Tailwind CSS | 5173 |
| Backend API | `back/api-webshield/` | Express.js (ES Modules) | 3001 |
| WAF Proxy | `waf_proxy/` | FastAPI + httpx | 8080 |
| ML API | `machineLearning-api/` | FastAPI + scikit-learn | 8000 |
| App demo | `recetas-app/` | Express.js (CommonJS) | 3000 |
| Base de datos | Docker | MySQL 8.4 | 3306 |

---

## Decisiones de diseño

**ML API separada del WAF proxy** — El clasificador corre en su propio proceso. El WAF solo orquesta: inspecciona, decide y reenvía. Esto permite actualizar el modelo sin tocar el proxy y escalar cada servicio de forma independiente.

**Ingest fire-and-forget** — El WAF envía el evento al backend de forma asíncrona. Si el backend no responde, el cliente no lo nota. El flujo crítico (inspección → decisión → reenvío) nunca espera al logging.

**`FAIL_MODE` configurable** — Si la ML API no responde, `open` deja pasar el tráfico (disponibilidad primero) y `closed` bloquea con 503 (seguridad primero). El default es `open` para no convertir una falla del clasificador en un outage.

**Cookie HttpOnly + SameSite=Strict** — El dashboard usa sesiones por cookie en lugar de JWT en `localStorage` para eliminar el riesgo de XSS exfiltrando tokens.

**TLS automático en el backend** — Si `TLS_CERT_PATH` y `TLS_KEY_PATH` existen, el servidor arranca en HTTPS. Si no, cae a HTTP con un aviso. Sin condicionales en el código de rutas.
