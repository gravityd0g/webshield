# WebShield — Arquitectura Final

> **Mención especial:** Este proyecto no hubiera sido posible sin **Gabriel Muñoz Luna**, quien nos brindó acceso a la infraestructura a través de la VPN. Su apoyo fue fundamental para completar el despliegue y las pruebas del sistema.

---

## Visión General

WebShield es un sistema de prevención de intrusiones (IPS) basado en Machine Learning que protege aplicaciones web clasificando cada petición HTTP/HTTPS como válida o anómala usando un modelo Random Forest entrenado con reglas OWASP CRS.

El sistema expone una única IP pública. El WAF recibe todo el tráfico, lo inspecciona contra el modelo ML y lo separa por dominio/puerto hacia dos entornos: el dashboard de monitoreo y la aplicación objetivo.

---

## Diagrama de Arquitectura

```
Internet
    │
    │ IP Pública única
    ▼
┌─────────────────────────────────────────┐
│              waf-DEN                    │
│           172.16.67.172                 │
│                                         │
│  :8081 → Dashboard (frontend)           │
│  :8082 → App objetivo (atacable)        │
│                                         │
│  Inspección → infra2 (física local)     │
│  Threshold: 0.64                        │
└────────────┬────────────────────────────┘
             │
             │ Consulta ML
             ▼
┌─────────────────────────────────────────┐
│              infra2                     │
│           172.16.67.67                  │
│        (Servidor físico local)          │
│                                         │
│  Random Forest Classifier               │
│  60 features OWASP CRS                  │
│  /inspect → prob_anomalous              │
│                                         │
│  < 0.64 → ALLOW                         │
│  ≥ 0.64 → BLOCK (403)                   │
└─────────────────────────────────────────┘
             │
     Red interna 172.16.67.0/24
             │
    ┌────────┴────────────┐
    │                     │
    ▼                     ▼
 :8081                 :8082
DASHBOARD           APP OBJETIVO
    │                     │
    │                     ▼
    │            ┌─────────────────┐
    │            │    app-DEN      │
    │            │ 172.16.67.149   │
    │            │ (todo en una    │
    │            │  sola instancia)│
    │            └─────────────────┘
    │
    ├─────────────────────────────────┐
    │                                 │
    ▼                                 ▼
┌──────────────────┐       ┌──────────────────┐
│  frontend-DEN    │       │  backend-DEN     │
│  172.16.67.148   │◄─────►│  172.16.67.144   │
│  (UI/React)      │       │  API :3001        │
└──────────────────┘       └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │    db-DEN        │
                           │  172.16.67.136   │
                           │  MySQL :3306     │
                           │  (Docker)        │
                           └──────────────────┘
```

---

## Instancias

| Instancia | IP | Puerto | Público | Rol |
|---|---|---|---|---|
| waf-DEN | 172.16.67.172 | 8081, 8082 | ✅ | WAF + punto de entrada único |
| app-DEN | 172.16.67.149 | 8000 | ❌ | App objetivo + API atacable |
| frontend-DEN | 172.16.67.148 | 3001 | ❌ | UI Dashboard |
| backend-DEN | 172.16.67.144 | 3001 | ❌ | API Dashboard |
| db-DEN | 172.16.67.136 | 3306 | ❌ | MySQL (Docker) |
| infra2 | 172.16.67.67 | 8000 | ❌ local | ML API (físico) |

---

## Flujo de Tráfico

### Puerto 8081 — Dashboard
```
Internet → waf-DEN:8081 → frontend-DEN:3001
                               │
                               ▼
                          backend-DEN:3001
                               │
                               ▼
                           db-DEN:3306
```

### Puerto 8082 — App Objetivo
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

---

## Separación de Entornos

Aunque no se cuenta con dominio DNS, el WAF separa el tráfico por puerto:

| Puerto | Destino | Descripción |
|---|---|---|
| 8081 | frontend-DEN | Dashboard de monitoreo — solo lectura |
| 8082 | app-DEN | Aplicación expuesta a ataques |

---

## Security Groups

### waf-DEN (172.16.67.172) — público
| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 0.0.0.0/0 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 80 | 0.0.0.0/0 |
| Entrante | TCP | 443 | 0.0.0.0/0 |
| Entrante | TCP | 3001 | 172.16.67.67/32 |

### app-DEN (172.16.67.149) — interno
| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.0/24 |
| Entrante | TCP | 80 | 172.16.67.0/24 |
| Entrante | TCP | 443 | 172.16.67.0/24 |
| Entrante | TCP | 8000 | 172.16.67.0/24 |

### backend-DEN (172.16.67.144) — interno
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

### db-DEN (172.16.67.136) — más restringido
| Dirección | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 3306 (MySQL) | 172.16.67.144/32 |

### frontend-DEN (172.16.67.148) — interno
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

---

## Motor de Inspección ML (infra2)

Servidor físico en red local. No es una instancia OpenStack — su acceso está controlado por UFW directamente.

### Modelo

| Campo | Valor |
|---|---|
| Algoritmo | Random Forest Classifier |
| Versión | 1.0.0 |
| Features | 60 características HTTP |
| Accuracy | 90.75% |
| ROC-AUC | 0.9584 |
| PR-AUC | 0.9745 |
| Threshold | 0.64 |

### Reglas OWASP CRS implementadas

| CRS | Categoría | Ejemplos |
|---|---|---|
| CRS 941 | XSS | `<script>`, `onerror=`, `alert()` |
| CRS 942 | SQL Injection | `union select`, `or 1=1`, `drop table` |
| CRS 930 | LFI | `/etc/passwd`, `php://filter` |
| CRS 931 | RFI | `=http://`, `include=https://` |
| CRS 932 | RCE | `exec()`, `system()`, `/bin/sh` |
| CRS 933 | PHP Attacks | `<?php`, `base64_decode` |
| CRS 934 | NoSQL | `$where`, `$gt`, `$regex` |
| CRS 944 | Log4Shell | `${jndi:}`, `ldap://` |
| CRS 920 | Protocol | Null bytes `%00`, double encoding |
| — | Scanners | `sqlmap`, `nikto`, `nmap`, `masscan` |
| — | Admin paths | `/wp-admin`, `/phpmyadmin` |
| — | Sensitive files | `.env`, `.git`, `wp-config.php` |

---

## Razonamiento de Seguridad

**Una sola IP pública** — solo waf-DEN es visible desde internet. Todos los demás son inaccesibles externamente.

**App objetivo en una sola instancia** — todo lo atacable está contenido en app-DEN. Simplifica el entorno de pruebas.

**Dashboard en tres instancias separadas** — frontend, backend y DB aislados por seguridad. Si una capa es comprometida las otras permanecen protegidas.

**ML API en servidor físico local** — el modelo no está en la nube. Acceso controlado por UFW, solo accesible desde la red interna `172.16.67.0/24`.

**MySQL en Docker** — aislamiento del servicio de base de datos dentro de db-DEN.

**SSH restringido por IP** — cada instancia solo acepta SSH desde IPs específicas con `/32`, no desde toda la red.
