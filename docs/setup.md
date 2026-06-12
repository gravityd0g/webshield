# Guía de instalación local

Todo el sistema corriendo en tu máquina para desarrollo.

## Requisitos

- Node.js 18+
- Python 3.10+
- Docker y Docker Compose
- Git

---

## 1. Base de datos

```bash
docker-compose up -d mysql
```

Luego carga el esquema y los datos de ejemplo:

```bash
# Linux / macOS
bash scripts/setup-db.sh

# Windows (PowerShell)
.\scripts\setup-db.ps1
```

O manualmente:

```bash
mysql -u root -p < database/webshield.sql
mysql -u root -p webshield < database/webshield_data.sql
```

---

## 2. ML API

```bash
cd machineLearning-api
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install fastapi uvicorn joblib pandas scikit-learn

MODEL_PATH=../modelo/exports/webshield_rf_v1.joblib \
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verifica: `GET http://localhost:8000/health`

---

## 3. Backend API (dashboard)

```bash
cd back/api-webshield
npm install
cp .env.example .env
```

Edita `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=webshield

API_HOST=127.0.0.1
API_PORT=3001
ALLOWED_ORIGINS=https://localhost:5173,http://localhost:5173

JWT_SECRET=cambia_esto_en_produccion
INGEST_API_TOKEN=token_compartido_con_el_waf

MODEL_API_URL=http://localhost:8000
MODEL_API_KEY=               # igual que ML_API_TOKEN en machineLearning-api
```

```bash
npm run dev
```

Verifica: `GET http://localhost:3001/api/health`

---

## 4. WAF Proxy

```bash
cd waf_proxy
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn httpx
```

Configura las variables de entorno:

```bash
export ML_API_URL=http://localhost:8000/inspect
export ML_API_TOKEN=                        # vacío si no pusiste auth en la ML API
export FAIL_MODE=open
export WEBSHIELD_INGEST_URL=http://localhost:3001/api/ingest/events
export WEBSHIELD_INGEST_TOKEN=token_compartido_con_el_waf
export WAF_ROUTES_JSON='{"apps":{"recetas":{"mode":"single_vm","app_url":"http://localhost:3000","bypass_paths":["/health"]}}}'

uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## 5. App demo (recetas-app)

```bash
cd recetas-app
npm install
npm run dev
```

Escucha en `http://localhost:3000`. El WAF en `:8080` la protege.

---

## 6. Frontend (dashboard)

```bash
cd front
npm install
cp .env.example .env
# VITE_API_URL=https://localhost:3001
npm run dev
```

Abre `https://localhost:5173` (o `http://localhost:5173` si no usas TLS).

---

## Orden de arranque recomendado

```
1. docker-compose up -d mysql
2. cd machineLearning-api && uvicorn main:app --port 8000
3. cd back/api-webshield && npm run dev
4. cd waf_proxy && uvicorn main:app --port 8080
5. cd recetas-app && npm run dev
6. cd front && npm run dev
```

---

## Verificación rápida

```bash
# Base de datos + backend
curl http://localhost:3001/api/health

# ML API
curl http://localhost:8000/health

# WAF (request válida — debe pasar al backend)
curl http://localhost:8080/api/recetas

# WAF (SQLi — debe devolver 403)
curl "http://localhost:8080/api/recetas?id=1+UNION+SELECT+*+FROM+usuarios--"
```
