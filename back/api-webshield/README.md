# WebShield — Backend API

API REST de solo lectura que sirve los datos de monitoreo al dashboard de WebShield.

## Stack

| Herramienta | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.21 | Framework HTTP |
| mysql2 | 3.12 | Conexión a MySQL (pool) |
| dotenv | 16 | Variables de entorno |

El servidor usa ES Modules (`"type": "module"`).

## Instalación

```bash
npm install
```

## Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `webshield` |
| `API_HOST` | Interfaz de escucha | `127.0.0.1` |
| `API_PORT` | Puerto de la API | `3001` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:5173` |

## Ejecución

```bash
npm run dev    # node --watch (recarga automática)
npm start      # producción
npm run seed   # poblar la base de datos con datos de prueba
```

## Endpoints

### `GET /api/health`

Verifica que la API y la base de datos estén disponibles.

```json
{ "backend": "healthy", "db": "healthy" }
```

### `GET /api/dashboard`

Devuelve todos los datos necesarios para el dashboard principal: KPIs, eventos recientes, distribución de ataques, top IPs, top endpoints y estado del modelo.

---

## Estructura

```
src/
├── index.js              # Entry point — Express app, middlewares, listen
├── db.js                 # Pool de conexiones MySQL + función ping()
├── middleware/
│   └── security.js       # CORS, security headers, sendSafeError()
├── routes/
│   └── dashboard.js      # GET /api/dashboard
└── services/
    └── dashboardService.js  # Lógica de consultas a la BD
```

## Seguridad

- `X-Powered-By` deshabilitado
- Headers de seguridad en todas las respuestas (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.)
- CORS estricto: solo los orígenes en `ALLOWED_ORIGINS` son permitidos
- Body limit de 8kb para evitar payloads gigantes
- Los errores internos nunca exponen detalles al cliente (`sendSafeError`)

## Agregar una ruta nueva

1. Crea `src/routes/nuevaRuta.js` con un `Router` de Express
2. Crea `src/services/nuevaRutaService.js` con las queries a la BD
3. Importa y monta el router en `src/index.js`:
   ```js
   import nuevaRuta from './routes/nuevaRuta.js'
   app.use('/api/nueva-ruta', nuevaRuta)
   ```
