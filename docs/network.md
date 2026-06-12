# Red

## Topología de producción

Una sola IP pública. Todo el tráfico externo entra por `waf-DEN` y se distribuye internamente por la VLAN `172.16.67.0/24`.

```
Internet
    │
    │  IP pública única
    ▼
┌─────────────────────────────────────────┐
│              waf-DEN                    │
│           172.16.67.172                 │
│                                         │
│  :8081 → Dashboard                      │
│  :8082 → App objetivo                   │
│                                         │
│  Inspección → infra2 (servidor físico)  │
│  Threshold: 0.64                        │
└────────────┬────────────────────────────┘
             │
             │ POST /inspect
             ▼
┌─────────────────────────────────────────┐
│              infra2                     │
│           172.16.67.67                  │
│        (servidor físico local)          │
│                                         │
│  Random Forest — 60 features OWASP CRS  │
│  < 0.64 → ALLOW                         │
│  ≥ 0.64 → BLOCK (403)                   │
└─────────────────────────────────────────┘
             │
     Red interna 172.16.67.0/24
             │
    ┌────────┴──────────────┐
    │                       │
    ▼                       ▼
 :8081                   :8082
DASHBOARD            APP OBJETIVO
    │                       │
    ├── frontend-DEN        └── app-DEN
    │   172.16.67.148           172.16.67.149
    │
    └── backend-DEN
        172.16.67.144
            │
            └── db-DEN
                172.16.67.136
```

---

## Instancias

| Instancia | IP | Puerto | Público | Rol |
|---|---|---|---|---|
| waf-DEN | 172.16.67.172 | 8081, 8082 | ✅ | WAF + punto de entrada único |
| infra2 | 172.16.67.67 | 8000 | ❌ local | ML API (servidor físico) |
| frontend-DEN | 172.16.67.148 | 80 | ❌ | UI Dashboard (React) |
| backend-DEN | 172.16.67.144 | 3001 | ❌ | API Dashboard (Express) |
| db-DEN | 172.16.67.136 | 3306 | ❌ | MySQL (Docker) |
| app-DEN | 172.16.67.149 | 8000 | ❌ | App objetivo + API atacable |

---

## Flujo de tráfico

### Puerto 8081 — Dashboard

```
Internet → waf-DEN:8081 → frontend-DEN:80
                               │
                               ▼
                          backend-DEN:3001
                               │
                               ▼
                           db-DEN:3306
```

### Puerto 8082 — App objetivo

```
Internet → waf-DEN:8082
               │
               ├── POST /inspect → infra2:8000
               │         ← { action, prob_anomalous }
               │
               ├── ≥ 0.64 → BLOCK 403
               └── < 0.64 → PASS → app-DEN:8000
```

---

## Security Groups

### waf-DEN (172.16.67.172) — público

| Dir. | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 0.0.0.0/0 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 80 | 0.0.0.0/0 |
| Entrante | TCP | 443 | 0.0.0.0/0 |
| Entrante | TCP | 3001 | 172.16.67.67/32 |

### app-DEN (172.16.67.149) — interno

| Dir. | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 any | any | 0.0.0.0/0 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.0/24 |
| Entrante | TCP | 80 | 172.16.67.0/24 |
| Entrante | TCP | 443 | 172.16.67.0/24 |
| Entrante | TCP | 8000 | 172.16.67.0/24 |

### backend-DEN (172.16.67.144) — interno

| Dir. | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.67/32 |
| Entrante | TCP | 3001 | 172.16.67.144/32 |
| Entrante | TCP | 3001 | 172.16.67.172/32 |
| Entrante | TCP | 3306 | 172.16.67.148/32 |
| Entrante | TCP | 3306 | 172.16.67.136/32 |

### db-DEN (172.16.67.136) — más restringido

| Dir. | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 3306 | 172.16.67.144/32 |

### frontend-DEN (172.16.67.148) — interno

| Dir. | Protocolo | Puerto | Origen |
|---|---|---|---|
| Saliente | IPv4 TCP | any | 172.16.67.144/32 |
| Saliente | IPv6 any | any | ::/0 |
| Entrante | ICMP | any | 172.16.67.0/24 |
| Entrante | TCP | 22 (SSH) | 172.16.67.144/32 |
| Entrante | TCP | 80 | 172.16.67.172/32 |
| Entrante | TCP | 80 | 172.16.67.144/32 |
| Entrante | TCP | 443 | 172.16.67.144/24 |
| Entrante | TCP | 3001 | 172.16.67.144/32 |
| Entrante | TCP | 3306 | 172.16.67.144/32 |

---

## Razonamiento de seguridad

**Una sola IP pública** — solo `waf-DEN` es accesible desde internet. Todas las demás instancias son inaccesibles externamente.

**App objetivo aislada** — todo lo atacable está contenido en `app-DEN`. Si es comprometida, no tiene salida a las instancias del dashboard.

**Dashboard en tres capas** — `frontend`, `backend` y `db` están separados. Si una capa es comprometida las otras permanecen protegidas.

**ML API en servidor físico** — `infra2` no es una instancia OpenStack. Su acceso está controlado por UFW directamente y solo es alcanzable desde la red interna `172.16.67.0/24`.

**SSH restringido por IP con `/32`** — cada instancia solo acepta SSH desde IPs específicas, no desde toda la red.
