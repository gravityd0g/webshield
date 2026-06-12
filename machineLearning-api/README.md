# machineLearning-api

Microservicio FastAPI que carga el modelo Random Forest de WebShield y expone un endpoint `/inspect` para clasificar peticiones HTTP como `valid` o `anomalous`. Es consumido internamente por el `waf_proxy`.

---

## Responsabilidades

1. Cargar el modelo `.joblib` al arrancar (y recargarlo automáticamente si el archivo cambia).
2. Convertir los campos de una petición HTTP en las 42 features que espera el modelo.
3. Devolver la probabilidad de anomalía, el label, la acción recomendada y la versión del modelo.

---

## Instalación

```bash
cd machineLearning-api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi uvicorn joblib pandas scikit-learn
```

---

## Configuración

| Variable | Descripción | Default |
|---|---|---|
| `MODEL_PATH` | Ruta al archivo `.joblib` del modelo | `models/webshield_rf_v1.joblib` |
| `ANOMALY_THRESHOLD` | Umbral de clasificación (0.0–1.0) | `0.50` |
| `INTERNAL_API_KEY` | API key requerida en header `X-Internal-API-Key` | `""` (sin auth) |

---

## Ejecución

```bash
MODEL_PATH=../modelo/exports/webshield_rf_v1.joblib uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Endpoints

### `GET /health`

Devuelve el estado del servicio y metadatos del modelo cargado.

```json
{
  "status": "ok",
  "model_path": "models/webshield_rf_v1.joblib",
  "model_version": "v1",
  "trained_at": "2025-06-01T12:00:00",
  "metrics": { "accuracy": 0.97, "f1": 0.96 },
  "threshold": 0.5,
  "feature_count": 42
}
```

### `POST /inspect`

Clasifica una petición HTTP. Requiere el header `X-Internal-API-Key` si `INTERNAL_API_KEY` está configurado.

**Request body:**
```json
{
  "method": "POST",
  "uri": "/login",
  "query": "",
  "headers": {
    "user-agent": "Mozilla/5.0",
    "content-type": "application/json"
  },
  "body": "{ \"user\": \"admin' OR 1=1--\", \"pass\": \"x\" }",
  "client_ip": "192.168.1.10"
}
```

**Response:**
```json
{
  "label": "anomalous",
  "prediction": 1,
  "prob_anomalous": 0.94,
  "threshold": 0.5,
  "action": "block",
  "model_version": "v1",
  "inspected_at": 1748780000.123
}
```

| Campo | Descripción |
|---|---|
| `label` | `"valid"` o `"anomalous"` |
| `prediction` | `0` (válido) o `1` (anomalía) |
| `prob_anomalous` | Probabilidad de anomalía (0.0–1.0) |
| `threshold` | Umbral usado en esta clasificación |
| `action` | `"allow"` o `"block"` |
| `model_version` | Versión del modelo cargado |
| `inspected_at` | Unix timestamp de la inspección |

---

## Pipeline de features

Cada petición se convierte en un vector de **42 features** antes de pasarlo al modelo:

| Grupo | Features | Descripción |
|---|---|---|
| Baseline (19) | `Content-Length`, `len_*`, indicadores OWASP básicos, `cnt_*` | Longitudes, conteos de símbolos y palabras clave comunes |
| Banderas CRS (15) | `has_rce_kw`, `has_lfi_kw`, `has_rfi_kw`, `has_php_attack`, `has_xxe`, `has_log4j`, `has_nosql`, `has_serialization`, `has_xss_advanced`, `has_sql_advanced`, `has_sensitive_file`, `has_admin_path`, `has_shell_extension`, `has_double_encoded`, `has_null_byte` | Reglas basadas en OWASP Core Rule Set |
| User-Agent (5) | `ua_scanner`, `ua_lib`, `ua_browser`, `ua_len`, `ua_word_count` | Fingerprinting del cliente (CRS 913) |
| Categóricas (3) | `Method_POST`, `Method_PUT`, `Host-Header_HTTP/1.1` | Codificación one-hot de método y host |

El vector se alinea con `feature_names` del artefacto `.joblib` para garantizar compatibilidad con el modelo entrenado.

---

## Hot-reload del modelo

El servicio comprueba el `mtime` del archivo `.joblib` en cada petición. Si el archivo cambió (porque se re-entrenó el modelo), lo recarga automáticamente sin necesidad de reiniciar el servidor. La carga está protegida con un `threading.Lock` para evitar condiciones de carrera.
