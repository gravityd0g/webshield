# Modelo ML

## Resumen

| Campo | Valor |
|---|---|
| Algoritmo | Random Forest Classifier |
| Tipo | Clasificación binaria: `0` válido / `1` anomalía |
| Features | 42 |
| Threshold de producción | 0.64 |
| Threshold ML API | 0.90 (configurable) |
| Accuracy | 90.75% |
| ROC-AUC | 0.9584 |
| PR-AUC | 0.9745 |
| Archivo exportado | `modelo/exports/webshield_rf_v1.joblib` |

---

## Features (42 total)

### Grupo 1 — Baseline (19 features)

Longitudes de campos HTTP y conteo de símbolos frecuentes en ataques:

| Feature | Descripción |
|---|---|
| `Content-Length` | Longitud del body en bytes |
| `len_URI` | Longitud de la URI |
| `len_GET_Query` | Longitud del query string |
| `len_POST_Data` | Longitud del body POST |
| `len_Cookie` | Longitud de la cookie |
| `len_User_Agent` | Longitud del User-Agent |
| `has_sql_kw` | Palabras clave SQL básicas (`union`, `select`, `drop`…) |
| `has_xss_kw` | Patrones XSS básicos (`script`, `onerror`, `alert`…) |
| `has_traversal` | Path traversal (`../`, `/etc/passwd`…) |
| `has_encoded` | Caracteres codificados (`%2f`, `%3c`…) |
| `has_admin` | Palabras admin (`admin`, `login`, `passwd`…) |
| `cnt_equal` | Cantidad de `=` |
| `cnt_ampersand` | Cantidad de `&` |
| `cnt_percent` | Cantidad de `%` |
| `cnt_slash` | Cantidad de `/` |
| `cnt_dot` | Cantidad de `.` |
| `cnt_quote` | Cantidad de `'` y `"` |
| `cnt_semicolon` | Cantidad de `;` |
| `cnt_comment` | Cantidad de `--` |

### Grupo 2 — Banderas OWASP CRS (15 features)

| Feature | CRS | Categoría |
|---|---|---|
| `has_rce_kw` | 932 | Remote Code Execution |
| `has_lfi_kw` | 930 | Local File Inclusion |
| `has_rfi_kw` | 931 | Remote File Inclusion |
| `has_php_attack` | 933 | PHP Injection |
| `has_xxe` | — | XML External Entity |
| `has_log4j` | 944 | Log4Shell / JNDI |
| `has_nosql` | 934 | NoSQL Injection |
| `has_serialization` | — | Deserialización PHP |
| `has_xss_advanced` | 941 | XSS expandido |
| `has_sql_advanced` | 942 | SQLi expandido |
| `has_sensitive_file` | — | Archivos sensibles (`.env`, `.git`, `wp-config.php`…) |
| `has_admin_path` | — | Paths admin (`/wp-admin`, `/phpmyadmin`…) |
| `has_shell_extension` | — | Extensiones de script (`.sh`, `.php`, `.jsp`…) |
| `has_double_encoded` | 920 | Double URL encoding |
| `has_null_byte` | 920 | Null byte (`%00`) |

### Grupo 3 — User-Agent fingerprinting (5 features)

| Feature | Descripción |
|---|---|
| `ua_scanner` | Scanners conocidos (`sqlmap`, `nikto`, `nmap`, `masscan`…) |
| `ua_lib` | Clientes HTTP automatizados (`curl`, `python-requests`…) |
| `ua_browser` | Navegadores reales (`Mozilla/`, `Chrome/`…) |
| `ua_len` | Longitud del User-Agent |
| `ua_word_count` | Cantidad de palabras en el User-Agent |

### Grupo 4 — Categóricas (3 features)

`Method_POST`, `Method_PUT`, `Host-Header_HTTP/1.1` — one-hot encoding.

---

## Formato del bundle `.joblib`

```python
import joblib

bundle = joblib.load("modelo/exports/webshield_rf_v1.joblib")
model           = bundle["model"]            # RandomForestClassifier
feature_columns = bundle["feature_columns"]  # list[str], len=42
```

La ML API alinea el vector de cada petición con `feature_columns` antes de clasificar, llenando con `0` las features ausentes.

---

## Reentrenar el modelo

```bash
cd modelo/training
python train_classifier.py
```

El script genera el bundle en `modelo/exports/webshield_rf_v1.joblib`. Copia el archivo al servidor de la ML API y recarga el servicio (la ML API tiene hot-reload automático: detecta cambios en el `mtime` del archivo).

---

## Hot-reload en la ML API

La ML API comprueba el `mtime` del `.joblib` en cada petición a `/inspect`. Si el archivo cambió (nuevo entrenamiento), lo recarga automáticamente con un lock para evitar condiciones de carrera. No es necesario reiniciar el servicio para actualizar el modelo.
