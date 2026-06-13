# WebShield

> **Mención especial:** Este proyecto no hubiera sido posible sin **Gabriel Muñoz Luna**, quien nos brindó acceso a la infraestructura a través de la VPN. Su apoyo fue fundamental para completar el despliegue y las pruebas del sistema.

WebShield es una plataforma de seguridad web que combina un **Web Application Firewall (WAF) impulsado por Machine Learning** con un **dashboard de monitoreo en tiempo real**. Detecta y bloquea amenazas como SQLi, XSS, path traversal, Log4Shell y otros ataques OWASP, registrando cada evento en una base de datos para análisis posterior.

---

## Arquitectura

```
                   ┌──────────────┐
   Cliente ───▶    │  WAF (proxy) │ ──── POST /inspect ──▶ ┌────────┐
                   │  Python      │ ◀─── decisión ──────── │ ML API │
                   │  :8080 / 81  │                        │ :8000  │
                   └──────┬───────┘                        └────────┘
                          │ block(403)  /  forward + ingest async
                          │
                          ├──▶ App protegida (single_app / split_app)
                          │
                          └──▶ POST /api/ingest/events (Bearer)
                                       │
                                       ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
   │   Frontend  │─▶│  Backend API │─▶│   MySQL 8.4      │
   │  React+Vite │  │  Express     │  │  (webshield DB)  │
   │  nginx :443 │  │  :3001       │  │  :3306           │
   └─────────────┘  └──────────────┘  └──────────────────┘
```

| Componente | Tecnología | Puerto |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 | nginx :443 (prod) / Vite :5173 (dev) |
| Backend API | Express.js 4 (ES Modules) | 3001 |
| WAF | FastAPI + httpx + nginx (port-based routing) | uvicorn 8080 (interno) + nginx 8081/8082 |
| ML API | FastAPI + scikit-learn (Random Forest) | 8000 |
| Base de datos | MySQL 8.4 | 3306 |
| App demo (opcional) | `recetas-app/` — Express + JWT | 3000 |

---

## Estructura del repositorio

```
webshield/
├── back/
│   └── api-webshield/         API REST del dashboard (Express, ES Modules)
│       ├── src/
│       │   ├── routes/        auth, dashboard, ingest, model
│       │   ├── services/      authService, dashboardService, ingestService, modelService
│       │   ├── middleware/    auth (JWT cookie), bearerAuth (WAF→API), security
│       │   └── db.js          pool MySQL2
│       └── scripts/gen-cert.sh
├── front/                     Dashboard React + Vite
│   ├── src/pages/Dashboard/   tabla live + drawer + hooks de polling
│   └── src/i18n/              traducciones en/es
├── database/
│   └── webshield.sql          esquema (3 tablas: request_events, request_http, users)
├── machineLearning-api/       README de la ML API (código en webshield_full_port_deploy)
├── waf_proxy/                 README del WAF (código en webshield_full_port_deploy)
├── modelo/
│   ├── training/              scripts de entrenamiento del Random Forest
│   ├── exports/               modelos exportados (.joblib)
│   └── client/                cliente de inferencia local
├── recetas-app/               app demo opcional para que el WAF tenga algo que proteger
├── scripts/                   utilidades (setup-db, gen-cert)
├── Documentación/             notas de arquitectura del equipo
├── docker-compose.yml         MySQL local para desarrollo
└── README.md
```

> El código real del WAF y de la ML API que corre en producción vive en un repo aparte (`webshield_full_port_deploy`). Lo que está en `waf_proxy/` y `machineLearning-api/` son solo los READMEs de referencia.

---

## Esquema de base de datos

3 tablas, todas con `ENGINE=InnoDB` y `utf8mb4`:

| Tabla | Descripción |
|---|---|
| `request_events` | Una fila por petición inspeccionada. `event_id`, `detected_at`, `verdict` (`valid`/`anomalous`), `action` (`allowed`/`blocked`), `confidence_score`, `client_ip`, `latency_ms`, `model_version` |
| `request_http` | Detalles HTTP del request (1:1 con `request_events`). Método, URI, query, body, cookie, user-agent, content-length, host-header, y `request_headers` como JSON con todos los headers |
| `users` | Usuarios del dashboard. `email`, `password_hash` (bcrypt), `display_name`, timestamps |

El esquema completo está en `database/webshield.sql`.

---

## Modelo de Machine Learning

El WAF usa un clasificador **Random Forest** con 60 features extraídas de cada petición HTTP.

- **Modelo exportado**: `modelo/exports/webshield_rf_v1.joblib`
- **Script de entrenamiento**: `modelo/training/train_classifier.py`
- **Umbral de clasificación**: configurable con `ANOMALY_THRESHOLD` (default `0.64`)
- **Salida**: probabilidad de anomalía + label (`valid`/`anomalous`) + acción (`allow`/`block`)

### Métricas del modelo

| Métrica | Valor |
|---|---|
| Algoritmo | Random Forest Classifier |
| Versión | 1.0.0 |
| Features | 42 características HTTP |
| Accuracy | 90.75% |
| ROC-AUC | 0.9584 |
| PR-AUC | 0.9745 |
| Threshold | 0.64 |

### Categorías de ataque detectadas (alineadas con OWASP CRS)

| CRS | Categoría | Ejemplos |
|---|---|---|
| CRS 941 | Cross-Site Scripting (básico y avanzado) | `<script>`, `onerror=`, `alert()` |
| CRS 942 | SQL Injection (básico y avanzado) | `union select`, `or 1=1`, `drop table` |
| CRS 930 | Local File Inclusion / Path traversal | `/etc/passwd`, `php://filter`, `../` |
| CRS 931 | Remote File Inclusion | `=http://`, `include=https://` |
| CRS 932 | Remote Code Execution | `exec()`, `system()`, `/bin/sh` |
| CRS 933 | PHP Attacks | `<?php`, `base64_decode` |
| CRS 934 | NoSQL Injection | `$where`, `$gt`, `$regex` |
| CRS 944 | Log4Shell / JNDI injection | `${jndi:}`, `ldap://` |
| CRS 920 | Protocol Attacks | Null bytes `%00`, double URL encoding |
| CRS 913 | Scanner / bot fingerprinting | `sqlmap`, `nikto`, `nmap`, `masscan` |
| — | XXE (XML External Entity) | — |
| — | Deserialization attacks | — |
| — | Sensitive file probing | `.env`, `.git`, `wp-config.php` |
| — | Admin path probing | `/wp-admin`, `/phpmyadmin` |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 22+ (el `package.json` del backend está fijado a Node 22)
- [Python](https://python.org/) 3.10+ (para WAF y ML API)
- MySQL 8.4 — puede levantarse con el `docker-compose.yml` incluido

---

## Instalación y ejecución (desarrollo local)

### 1. Base de datos

Opción A — con Docker:
```bash
docker compose up -d mysql
```
Esto levanta MySQL 8.4 en `:3306`, root password `webshield`, y carga `database/webshield.sql` automáticamente al primer arranque.

Opción B — MySQL nativo:
```bash
mysql -u root -p < database/webshield.sql
```

### 2. Backend API

```bash
cd back/api-webshield
npm install
cp .env.example .env
```

Edita `.env` con tus valores (ver "Variables de entorno" más abajo).

```bash
npm run dev      # node --watch
npm start        # producción
```

Verifica: `curl http://localhost:3001/api/health` debe responder `{"backend":"healthy","db":"healthy"}`.

### 3. Frontend

```bash
cd front
npm install
echo 'VITE_API_URL=https://localhost:3001' > .env
npm run dev
```

Abre `https://localhost:5173`. El primer acceso pide aceptar el cert self-signed.

### 4. WAF (opcional para dev)

El código del WAF que corre en producción está en el repo `webshield_full_port_deploy/waf/`. Para desarrollo local puedes usarlo igual:

```bash
cd ../webshield_full_port_deploy/waf
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Edita env/waf.env con tus valores (ver waf_proxy/README.md)
uvicorn app.main:app --host 127.0.0.1 --port 8080
```

Ver `waf_proxy/README.md` para detalle de env vars (`ML_API_URL`, `ML_API_TOKEN`, `WAF_ROUTES_JSON`, `WEBSHIELD_INGEST_*`, etc.).

### 5. ML API (opcional para dev)

```bash
cd ../webshield_full_port_deploy/ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

MODEL_PATH=../../webshield/modelo/exports/webshield_rf_v1.joblib \
  uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Ver `machineLearning-api/README.md` para detalle.

### 6. App demo — recetas-app (opcional)

Sirve para que el WAF tenga un upstream que proteger. Solo si quieres ver el flujo end-to-end completo en local.

```bash
cd recetas-app
npm install
npm start    # :3000
```

---

## Variables de entorno

### Backend (`back/api-webshield/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | — |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `webshield` |
| `API_HOST` | Interfaz donde escucha la API | `127.0.0.1` |
| `API_PORT` | Puerto de la API | `3001` |
| `TLS_CERT_PATH` | Ruta al cert TLS — activa HTTPS si existe | — |
| `TLS_KEY_PATH` | Ruta a la key TLS | — |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (coma-separados) | `https://localhost:5173` |
| `JWT_SECRET` | Secreto para firmar JWTs — obligatorio en producción | — |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `COOKIE_NAME` | Nombre de la cookie de sesión | `webshield_session` |
| `COOKIE_SAMESITE` | Atributo `SameSite` de la cookie | `Strict` |
| `MODEL_API_URL` | URL base de la ML API (para `/api/model/*`) | — |
| `MODEL_API_KEY` | Bearer token con la ML API | — |
| `MODEL_API_TIMEOUT_MS` | Timeout de llamadas a la ML API (ms) | `5000` |
| `INGEST_API_TOKEN` | Bearer que el WAF usa para `POST /api/ingest/events` | — |

### Frontend (`front/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend API. Dejar vacío en producción para usar URLs relativas (cuando nginx termina TLS y proxy-passea `/api`) | `http://localhost:3001` |

### WAF y ML API

Documentadas en sus READMEs respectivos:
- [`waf_proxy/README.md`](waf_proxy/README.md) — env vars del WAF (`ML_API_URL`, `FAIL_MODE`, `WAF_ROUTES_JSON`, `WEBSHIELD_INGEST_*`)
- [`machineLearning-api/README.md`](machineLearning-api/README.md) — env vars del ML (`MODEL_PATH`, `ANOMALY_THRESHOLD`, `ML_API_TOKEN`)

---

## Endpoints principales del backend

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | — | Estado del backend y conexión a MySQL |
| `POST` | `/api/auth/register` | — | Registra un usuario |
| `POST` | `/api/auth/login` | — | Login + cookie JWT |
| `POST` | `/api/auth/logout` | — | Borra la cookie |
| `GET` | `/api/auth/me` | cookie | Usuario actual |
| `GET` | `/api/dashboard` | cookie | Últimos 200 eventos para la tabla live |
| `POST` | `/api/ingest/events` | Bearer | El WAF mete cada evento aquí (idempotente por `event_id`) |
| `GET` | `/api/model/health` | cookie | Proxy al `/health` de la ML API |
| `POST` | `/api/model/inspect` | cookie | Proxy al `/inspect` de la ML API (consulta directa) |

Detalles del payload de `/api/ingest/events` y comportamiento idempotente en [`back/api-webshield/README.md`](back/api-webshield/README.md).

---

## Deploy en VLAN TEC

El deploy productivo del proyecto NO usa Docker Compose local; corre en 5 VMs separadas dentro de la VLAN `infra2Red` (172.16.67.0/24) del datacenter TEC. Las instrucciones de instalación de arriba son para desarrollo local; este apartado documenta el deploy real.

### Topología

```
┌─────────────────────────────────────────────────────────────┐
│  VLAN infra2Red — 172.16.67.0/24                            │
│                                                             │
│  frontend-DEN .148  ── nginx :443 (HTTPS) + dist React      │
│       │  proxy /api/*                                       │
│       ▼                                                     │
│  backend-DEN .144   ── Node 22 + Express :3001 (HTTP)       │
│       │  mysql2                                             │
│       ▼                                                     │
│  db-DEN .136        ── MySQL 8.4 :3306                      │
│                                                             │
│  waf-DEN .172       ── nginx :8081/:8082 + uvicorn :8080    │
│       │  POST /inspect                  │ POST /api/ingest  │
│       ▼                                 ▼                   │
│  infra2 (físico) .67 ── FastAPI :8000  backend-DEN          │
│                                                             │
│  app-DEN .149       ── App dummy víctima (single_app)       │
└─────────────────────────────────────────────────────────────┘
```

### Instancias y puertos

| Instancia | IP | Puerto | Público | Rol |
|---|---|---|---|---|
| waf-DEN | 172.16.67.172 | 8081, 8082 | ✅ | WAF + punto de entrada único |
| app-DEN | 172.16.67.149 | 8000 | ❌ | App objetivo + API atacable |
| frontend-DEN | 172.16.67.148 | 443 (HTTPS) | ❌ | UI Dashboard (nginx + React dist) |
| backend-DEN | 172.16.67.144 | 3001 | ❌ | API Dashboard (Node/Express) |
| db-DEN | 172.16.67.136 | 3306 | ❌ | MySQL 8.4 (Docker) |
| infra2 (físico) | 172.16.67.67 | 8000 | ❌ local | ML API — servidor físico en red local |

> **Nota:** `infra2` no es una instancia OpenStack, sino un servidor físico. Su acceso está controlado por UFW directamente y solo es accesible desde la red interna `172.16.67.0/24`.

### Flujo de tráfico

**Puerto 8081 — Dashboard:**
```
Internet → waf-DEN:8081 → frontend-DEN:443
                               │
                               ▼
                          backend-DEN:3001
                               │
                               ▼
                           db-DEN:3306
```

**Puerto 8082 — App objetivo:**
```
Internet → waf-DEN:8082
               │
               ├── inspect → infra2:8000/inspect
               │         ← prob_anomalous
               │
               ├── ≥ 0.64 → BLOCK 403
               │
               └── < 0.64 → PASS → app-DEN:8000
```

### Separación de entornos

Aunque no se cuenta con dominio DNS, el WAF separa el tráfico por puerto:

| Puerto | Destino | Descripción |
|---|---|---|
| 8081 | frontend-DEN | Dashboard de monitoreo — solo lectura |
| 8082 | app-DEN | Aplicación expuesta a ataques |

### Acceso externo

La VLAN es privada (RFC1918, sin Floating IP en las VMs). El acceso desde fuera requiere SSH tunneling vía cloudflared + miku-bastion:

```bash
# Túnel al dashboard (HTTPS)
ssh -N -L 8443:127.0.0.1:443 frontend-DEN
# luego abrir https://localhost:8443 en el browser

# Túnel al WAF para feed de tráfico
ssh -N -L 8082:127.0.0.1:8082 -J tec equipo68@172.16.67.172
```

### Security Groups (OpenStack)

Las reglas están en el SG attachado a cada VM. **Cambios en los SGs deben coordinarse con infra** para no romper conectividad inter-VM.

**waf-DEN (172.16.67.172) — público:**

| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 0.0.0.0/0 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 80 | 0.0.0.0/0 |
| Entrante | TCP | 443 | 0.0.0.0/0 |
| Entrante | TCP | 3001 | 172.16.67.67/32 |

**app-DEN (172.16.67.149) — interno:**

| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.0/24 |
| Entrante | TCP | 80 | 172.16.67.0/24 |
| Entrante | TCP | 443 | 172.16.67.0/24 |
| Entrante | TCP | 8000 | 172.16.67.0/24 |

**backend-DEN (172.16.67.144) — interno:**

| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.67/32 |
| Entrante | TCP | 3001 | 172.16.67.144/32 |
| Entrante | TCP | 3001 | 172.16.67.172/32 |
| Entrante | TCP | 3306 (MySQL) | 172.16.67.148/32 |
| Entrante | TCP | 3306 (MySQL) | 172.16.67.136/32 |

**db-DEN (172.16.67.136) — más restringido:**

| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 3306 (MySQL) | 172.16.67.144/32 |

**frontend-DEN (172.16.67.148) — interno:**

| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | any | 172.16.67.172/32 |
| Entrante | TCP | any | 172.16.67.144/32 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 80 | 172.16.67.172/32 |
| Entrante | TCP | 80 | 172.16.67.144/32 |
| Entrante | TCP | 443 | 172.16.67.144/24 |
| Entrante | TCP | 3001 | 172.16.67.144/32 |
| Entrante | TCP | 3306 (MySQL) | 172.16.67.144/32 |

### Tokens compartidos (`.env` en cada VM)

| Token | Propósito | Sincronizar entre |
|---|---|---|
| `ML_API_TOKEN` | Auth WAF → ML | waf-DEN y infra2 |
| `INGEST_API_TOKEN` | Auth WAF → backend `/api/ingest/events` | waf-DEN y backend-DEN |
| `JWT_SECRET` | Firmar cookies de sesión del dashboard | Solo backend-DEN |
| MySQL passwords | `root` y `webshield@172.16.67.144/32` | Solo db-DEN; backend-DEN usa el del user app |

Si se rota un token compartido, debe actualizarse en ambos lados simultáneamente para no perder eventos.

### Razonamiento de seguridad

**Una sola IP pública** — solo waf-DEN es visible desde internet. Todos los demás son inaccesibles externamente.

**App objetivo contenida** — todo lo atacable está en app-DEN. Simplifica el entorno de pruebas y limita el blast radius.

**Dashboard en tres instancias separadas** — frontend, backend y DB aislados. Si una capa es comprometida, las otras permanecen protegidas.

**ML API en servidor físico local** — el modelo no está en la nube. Acceso controlado por UFW, solo accesible desde la red interna `172.16.67.0/24`.

**MySQL en Docker** — aislamiento del servicio de base de datos dentro de db-DEN.

**SSH restringido por IP** — cada instancia solo acepta SSH desde IPs específicas con `/32`, no desde toda la red.

---

## Documentación por componente

- [`back/api-webshield/README.md`](back/api-webshield/README.md) — endpoints, auth, validación de ingest, env vars
- [`front/README.md`](front/README.md) — stack, scripts de Vite, i18n, theming
- [`waf_proxy/README.md`](waf_proxy/README.md) — routing por app, headers de proxy, ingest, despliegue port-based
- [`machineLearning-api/README.md`](machineLearning-api/README.md) — features, endpoints, hot-reload del modelo

---

## Licencia

Ver [LICENSE](LICENSE).
