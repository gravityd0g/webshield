# Guía de contribución

## Flujo de trabajo con Git

```
main (producción)
  └── develop (integración)
        └── <rama-del-issue> (feature / fix / docs)
```

1. **Crea una rama desde `develop`** nombrada a partir del número de issue:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b 42-nombre-descriptivo
   ```

2. **Haz commits** con mensajes descriptivos en inglés o español.

3. **Abre un PR hacia `develop`** para revisión.

4. Eventualmente `develop` hace merge a `main`.

---

## Convenciones de branches

| Prefijo | Uso |
|---|---|
| `<número>-descripcion` | Feature o fix de un issue específico |
| `docs/<descripcion>` | Documentación |
| `hotfix/<descripcion>` | Fix urgente directo a main |

---

## Variables de entorno

Nunca commitees archivos `.env` con valores reales. Usa siempre `.env.example` como plantilla. Los archivos `.env` están en `.gitignore`.

---

## Correr el proyecto en local

Ver [setup.md](setup.md) para la guía completa.

## Estructura del repo

```
webshield/
├── back/api-webshield/    # Backend API (Express.js)
├── front/                 # Dashboard (React + Vite)
├── waf_proxy/             # WAF Proxy (FastAPI)
├── machineLearning-api/   # ML Classifier API (FastAPI)
├── modelo/                # Entrenamiento del modelo RF
├── recetas-app/           # App demo protegida por el WAF
├── database/              # Esquema MySQL y datos de ejemplo
├── scripts/               # Scripts de setup de BD
├── docs/                  # Esta documentación
├── Documentación/         # Arquitectura de producción y despliegue
└── docker-compose.yml     # MySQL para desarrollo local
```
