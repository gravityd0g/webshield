# WebShield

WebShield es una plataforma de seguridad web que combina un **Web Application Firewall (WAF) impulsado por Machine Learning** con un **dashboard de monitoreo en tiempo real**. Detecta y bloquea amenazas como SQLi, XSS, path traversal y otros ataques OWASP, registrando cada evento en una base de datos para análisis posterior.

---

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend  │────▶│  Backend API │────▶│   MySQL 8.4      │
│  React/Vite │     │  Express.js  │     │  (webshield DB)  │
│  :5173      │     │  :3001       │     │  :3306           │
└─────────────┘     └──────────────┘     └──────────────────┘
                                                  ▲
┌─────────────┐     ┌──────────────┐             │
│  App Demo   │────▶│     WAF      │─────────────┘
│ recetas-app │     │  Python/ML   │  (registra eventos)
│  :3000      │     │  :8080       │
└─────────────┘     └──────────────┘
```

| Componente | Tecnología | Puerto |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 | 5173 |
| Backend API | Express.js 4 (ES Modules) | 3001 |
| WAF | Python 3 + scikit-learn (Random Forest) | 8080 |
| App Demo | Express.js 4 (CommonJS) + JWT | 3000 |
| Base de datos | MySQL 8.4 | 3306 |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [Python](https://python.org/) 3.10+
- [Docker](https://www.docker.com/) y Docker Compose
- MySQL 8.4 (puede levantarse con Docker)

---

## Instalación y ejecución

### 1. Base de datos (MySQL con Docker)

```bash
cd webshield
docker-compose up -d mysql
```

Esto levanta MySQL 8.4 en el puerto `3306`. Luego carga el esquema:

```bash
# Linux / macOS
bash scripts/setup-db.sh

# Windows (PowerShell)
.\scripts\setup-db.ps1
```

O bien de forma manual:

```sql
mysql -u root -p < database/webshield.sql
```

---

### 2. Backend API

```bash
cd back/api-webshield
npm install
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=webshield

API_HOST=127.0.0.1
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

```bash
npm run dev      # desarrollo
npm start        # producción
```

Verifica: `GET http://localhost:3001/api/health`

---

### 3. Frontend

```bash
cd front
npm install
```

Crea `.env`:

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

### 4. WAF (Web Application Firewall)

```bash
cd waf
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Crea `.env` en `waf/`:

```env
WAF_HOST=0.0.0.0
WAF_PORT=8080
BACKEND_URL=http://localhost:3000
MODEL_PATH=../modelo/exports/webshield_rf_v1.joblib
BLOCK_THRESHOLD=0.5
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=webshield
```

```bash
python app.py
```

---

### 5. App Demo — recetas-app (opcional)

Aplicación de demostración que actúa como backend protegido por el WAF.

```bash
cd recetas-app
npm install
npm run dev    # puerto 3000
```

---

## Orden de arranque recomendado

```
1. docker-compose up -d mysql           ← Base de datos
2. cd back/api-webshield && npm run dev ← Backend API
3. cd front && npm run dev              ← Dashboard
4. cd waf && python app.py              ← WAF (opcional)
5. cd recetas-app && npm run dev        ← App demo (opcional)
```

---

## Modelo de Machine Learning

El WAF usa un clasificador **Random Forest** con 42 features extraídas de cada petición HTTP.

- **Modelo exportado**: `modelo/exports/webshield_rf_v1.joblib`
- **Script de entrenamiento**: `modelo/training/train_classifier.py`
- **Umbral de bloqueo**: configurable con `BLOCK_THRESHOLD` (default `0.5`)
- **Salida**: binaria — `0` válido / `1` anomalía

Categorías de ataque detectadas (alineadas con OWASP CRS):

| Categoría | Referencia CRS |
|---|---|
| SQL Injection (básico y avanzado) | CRS 942 |
| Cross-Site Scripting (básico y avanzado) | CRS 941 |
| Remote Code Execution | CRS 932 |
| Local File Inclusion | CRS 930 |
| Remote File Inclusion | CRS 931 |
| PHP attacks | CRS 933 |
| XXE (XML External Entity) | — |
| Log4Shell / JNDI injection | CRS 944 |
| NoSQL injection | — |
| Deserialization attacks | — |
| Sensitive file probing | — |
| Admin path probing | — |
| Double URL encoding (evasión) | — |
| Null byte injection | — |
| Scanner / bot fingerprinting | CRS 913 |
| Path traversal | CRS 930 |

---

## Estructura del proyecto

```
webshield/
├── back/
│   └── api-webshield/         # API REST (Express.js, ES Modules)
│       ├── src/
│       │   ├── index.js
│       │   ├── routes/
│       │   └── services/
│       └── .env.example
├── front/                     # Dashboard React + Vite
│   ├── src/
│   │   ├── pages/
│   │   └── components/
│   └── .env.example
├── waf/                       # Proxy WAF (Python + scikit-learn)
├── modelo/
│   ├── training/              # Scripts de entrenamiento
│   └── exports/               # Modelos exportados (.joblib)
├── recetas-app/               # App demo protegida por el WAF
├── database/
│   ├── webshield.sql          # Esquema de base de datos
│   └── DiagramaEntidadRelacion.png
├── scripts/
│   ├── setup-db.sh
│   └── setup-db.ps1
├── docker-compose.yml
└── README.md
```

---

## Esquema de base de datos

| Tabla | Descripción |
|---|---|
| `attack_type_catalog` | Catálogo de tipos de ataque (SQLi, XSS, etc.) |
| `request_events` | Eventos de seguridad con veredicto, acción y score de confianza |
| `request_http` | Detalles HTTP de cada request (headers, método, URI, body) |
| `request_ml_indicators` | Valores de features de ML por request |

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
| `API_HOST` | Host donde escucha la API | `127.0.0.1` |
| `API_PORT` | Puerto de la API | `3001` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (coma-separados) | `http://localhost:5173` |

### Frontend (`front/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend API | `http://localhost:3001` |

### WAF (`waf/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `WAF_HOST` | Host donde escucha el WAF | `0.0.0.0` |
| `WAF_PORT` | Puerto del WAF | `8080` |
| `BACKEND_URL` | URL del backend protegido | `http://localhost:3000` |
| `MODEL_PATH` | Ruta al modelo `.joblib` | `./waf_model.pkl` |
| `BLOCK_THRESHOLD` | Umbral de bloqueo (0.0–1.0) | `0.5` |
| `DB_HOST` | Host de MySQL para logging | `db` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `webshield` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `webshield` |

---

## Convenciones del repositorio

- Las branches nuevas se crean a partir de `develop`.
- Los PRs se dirigen a `develop`; eventualmente se hace merge a `main`.
- Las branches se nombran a partir del issue correspondiente.
