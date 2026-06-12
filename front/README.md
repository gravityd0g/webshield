# front — Dashboard WebShield

Dashboard de monitoreo en tiempo real para WebShield. Muestra los eventos de seguridad registrados por el WAF, con soporte para tema claro/oscuro e internacionalización (inglés y español).

---

## Stack

| Herramienta | Versión | Rol |
|---|---|---|
| React | 19 | UI |
| Vite | 8 | Bundler y dev server |
| Tailwind CSS | v4 | Estilos |
| i18next + react-i18next | 26 / 17 | Internacionalización |
| `@vitejs/plugin-basic-ssl` | — | HTTPS en desarrollo |

---

## Instalación

```bash
cd front
npm install
cp .env.example .env
```

---

## Configuración

```env
VITE_API_URL=https://localhost:3001
```

`VITE_API_URL` es la URL base del backend API. Todas las peticiones se hacen con `credentials: 'include'` para enviar la cookie de sesión.

---

## Ejecución

```bash
npm run dev      # HTTPS en https://localhost:5173
npm run build    # Build de producción → dist/
npm run preview  # Preview del build
npm run lint     # ESLint
```

El dev server arranca en **HTTPS** por defecto gracias al plugin `basicSsl`. El backend también debe estar en HTTPS para que las cookies `Secure` funcionen correctamente.

---

## Flujo de la aplicación

```
App (mount)
 │
 ├── fetchMe() → sesión activa → Dashboard
 │
 └── sin sesión
      ├── Login
      └── Register
```

Al montar, `App` intenta restaurar la sesión con `GET /api/auth/me`. Si el usuario ya tiene cookie válida, va directo al Dashboard sin pasar por Login.

---

## Páginas y componentes

### Login / Register

Formularios de autenticación. Al completarse, actualizan el estado global del usuario y redirigen al Dashboard. La navegación es por estado en `App`, no usa router.

### Dashboard

Vista principal. Compone:

| Componente | Descripción |
|---|---|
| `AppShell` | Layout con `TopBar` (logo, estado del WAF, toggles de idioma/tema, usuario, logout) y `<main>` |
| `LiveEvents` | Tabla de eventos recientes con polling automático |
| `EventDrawer` | Panel lateral de detalle de un evento seleccionado |

### LiveEvents

- Muestra los últimos 200 eventos del WAF en una tabla.
- **Polling** cada 3 segundos (configurable en `useDashboardData`).
- Botón **Pause / Resume** para detener el refresco automático.
- Filtro por veredicto: `All` / `Anomalous`.
- Click en una fila abre el `EventDrawer`.
- Color-codes por veredicto (`valid` → cyan, `anomalous` → rose) y por método HTTP (`GET` → blue, `POST` → violet, `PUT` → amber, otros → rose).
- Barra de score de confianza: cyan ≤ 0.4, amber 0.4–0.7, rose ≥ 0.7.

### EventDrawer

Panel lateral que se desliza desde la derecha al seleccionar un evento. Muestra:
- Resumen: timestamp, IP, método, URI, veredicto, acción, score
- Headers de la petición original
- Body (si existe), resaltado en rosa como señal de payload potencialmente malicioso

Se cierra con el botón `×`, haciendo click en el fondo oscuro, o con la tecla `Escape`.

---

## Tema (claro / oscuro)

Gestionado por el hook `useTheme`:

1. Al cargar, lee `data-theme` del `<html>` (puesto por un script inline en `index.html`).
2. Si no hay valor en el DOM, consulta `localStorage` (`webshield.theme`).
3. Si tampoco hay preferencia guardada, usa `prefers-color-scheme` del sistema.
4. El toggle escribe en `localStorage` y actualiza `data-theme` en el DOM.

---

## Internacionalización (i18n)

Idiomas disponibles: **Español** y **English**.

- La preferencia se persiste en `localStorage` (`webshield.language`).
- El toggle (`ES` / `EN` en el TopBar) llama a `i18n.changeLanguage()` y actualiza `lang` en el `<html>`.
- Archivos de traducción: `src/i18n/en.json` y `src/i18n/es.json`.

---

## Cliente HTTP

`src/api/client.js` centraliza todas las peticiones:

- Prefija automáticamente con `VITE_API_URL`.
- Incluye `credentials: 'include'` (necesario para las cookies de sesión).
- Parsea la respuesta como JSON y lanza un `Error` con el mensaje del backend si `response.ok` es `false`.
- Las respuestas `204 No Content` devuelven `null`.

---

## Estructura de archivos

```
src/
├── main.jsx                        # Punto de entrada — monta App, inicializa i18n
├── App.jsx                         # Raíz: gestiona sesión y routing por estado
├── index.css                       # Variables CSS del design system (colores, radii)
├── api/
│   ├── client.js                   # fetch wrapper con base URL y cookies
│   ├── auth.js                     # login, register, fetchMe, logout
│   └── dashboard.js                # fetchDashboard, fetchHealth
├── hooks/
│   └── useTheme.js                 # Toggle y persistencia del tema
├── i18n/
│   ├── index.js                    # Configuración de i18next
│   ├── en.json                     # Traducciones en inglés
│   └── es.json                     # Traducciones en español
├── components/
│   └── AccessibilityToggles.jsx    # Controles de accesibilidad
└── pages/
    ├── Login/
    │   ├── Login.jsx               # Formulario de login
    │   └── Register.jsx            # Formulario de registro
    └── Dashboard/
        ├── Dashboard.jsx           # Vista principal
        ├── useDashboardData.js     # Hook de polling hacia /api/dashboard
        └── components/
            ├── AppShell.jsx        # Layout: TopBar + main
            ├── LiveEvents.jsx      # Tabla de eventos con filtros y pause
            └── EventDrawer.jsx     # Panel lateral de detalle de evento
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend API | `https://localhost:3001` |
