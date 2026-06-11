Readme
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

Esto levanta MySQL 8.4 en el puerto `3306`. Luego carga el esquema y los datos de ejemplo:

```bash
# Linux / macOS
bash scripts/setup-db.sh

# Windows (PowerShell)
.\scripts\setup-db.ps1
```

O bien de forma manual:

```sql
mysql -u root -p < database/webshield.sql
mysql -u root -p webshield < database/webshield_data.sql
```

---

### 2. Backend API

```bash
cd back/api-webshield
npm install
```

Crea el archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de base de datos:

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

Inicia el servidor:

```bash
npm run dev      # modo desarrollo (node --watch)
npm start        # producción
```

Verifica que funcione: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

### 3. Frontend

```bash
cd front
npm install
```

Crea el archivo `.env`:

```env
VITE_API_URL=http://localhost:3001
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

### 4. WAF (Web Application Firewall)

```bash
cd waf
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Crea el archivo `.env` en la carpeta `waf/`:

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

Inicia el WAF:

```bash
python app.py
```

---

### 5. App Demo — recetas-app (opcional)

Aplicación Express de demostración que se protege con el WAF.

```bash
cd recetas-app
npm install
npm run dev    # nodemon en puerto 3000
```

---

## Orden de arranque recomendado

```
1. docker-compose up -d mysql          ← Base de datos
2. cd back/api-webshield && npm run dev ← Backend API
3. cd front && npm run dev              ← Dashboard
4. cd waf && python app.py              ← WAF (opcional)
5. cd recetas-app && npm run dev        ← App demo (opcional)
```

---

## Modelo de Machine Learning

El WAF utiliza un clasificador **Random Forest** con 42 features para detectar ataques en tiempo real.

- **Archivo del modelo**: `modelo/exports/webshield_rf_v1.joblib`
- **Script de entrenamiento**: `modelo/training/train_classifier.py`
- **Tipos de ataque detectados**:
  - SQL Injection (SQLi)
  - Cross-Site Scripting (XSS)
  - Path Traversal
  - Payloads codificados (Base64, URL encoding)
  - Admin probing
  - Otras anomalías
- **Umbral de bloqueo**: configurable vía `BLOCK_THRESHOLD` (default: `0.5`)
- **Salida**: binaria — `0` (válido) / `1` (anomalía)

---

## Estructura del proyecto

```
webshield/
├── back/
│   └── api-webshield/         # API REST (Express.js, ES Modules)
│       ├── src/
│       │   ├── index.js       # Punto de entrada
│       │   └── routes/        # Rutas del dashboard
│       ├── .env.example
│       └── package.json
├── front/                     # Dashboard React + Vite
│   ├── src/
│   │   ├── main.jsx           # Punto de entrada
│   │   ├── pages/             # Login, Dashboard, Alertas, Triage…
│   │   └── components/
│   ├── .env.example
│   └── package.json
├── waf/                       # WAF Python con ML
│   └── app.py
├── modelo/
│   ├── training/              # Scripts de entrenamiento
│   └── exports/               # Modelos exportados (.joblib)
├── recetas-app/               # App demo protegida por WAF
├── database/
│   ├── webshield.sql          # Esquema de base de datos
│   ├── webshield_data.sql     # Datos de ejemplo
│   └── DiagramaEntidadRelacion.png
├── scripts/
│   ├── setup-db.sh            # Inicialización de DB (Linux/macOS)
│   └── setup-db.ps1           # Inicialización de DB (Windows)
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
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `webshield` |
| `API_HOST` | Host donde escucha la API | `127.0.0.1` |
| `API_PORT` | Puerto de la API | `3001` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:5173` |

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
| `MODEL_PATH` | Ruta al modelo `.joblib` | `./webshield_rf_v1.joblib` |
| `BLOCK_THRESHOLD` | Umbral de bloqueo (0.0–1.0) | `0.5` |
| `DB_HOST` | Host de MySQL para logging | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Base de datos para logging | `webshield` |

---

## Flujo de trabajo con Git

- Las branches nuevas se crean a partir de `develop`
- Se hace PR a `develop` para revisión
- Eventualmente se hace merge a `main`
- Las branches se crean a partir del issue correspondiente

---

## Licencia

MIT — ver archivo [LICENSE](LICENSE).

