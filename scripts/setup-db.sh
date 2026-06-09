#!/usr/bin/env bash
# Load WebShield schema + seed data.
# IMPORTANT: This machine has TWO database servers:
#   - MySQL 8.0  → port 3306  (webshield was created here via Workbench)
#   - MariaDB    → port 3309  (different root password)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

pick_mysql() {
  if [[ -x "/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" ]]; then
    echo "/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"
  elif [[ -x "/c/Program Files/MariaDB 11.8/bin/mysql.exe" ]]; then
    echo "/c/Program Files/MariaDB 11.8/bin/mysql.exe"
  elif command -v mysql >/dev/null 2>&1; then
    echo "mysql"
  else
    echo ""
  fi
}

MYSQL_BIN="${MYSQL_BIN:-$(pick_mysql)}"
PORT="${DB_PORT:-3306}"

if [[ -z "$MYSQL_BIN" ]]; then
  echo "mysql client not found."
  exit 1
fi

echo "=== WebShield DB setup ==="
echo "Client: $MYSQL_BIN"
echo "Port:   $PORT"
echo ""
echo "Use the SAME password as your MySQL Workbench connection 'ProyectoFinal'."
echo "If port 3306 fails, MySQL 8.0 service may be stopped — start 'MYSQL80' in Windows Services (as admin)."
echo "MariaDB runs on port 3309 and has a DIFFERENT root password."
echo ""

read -r -p "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || exit 0

"$MYSQL_BIN" -P "$PORT" -u root -p -e "SELECT VERSION() AS server_version;"

"$MYSQL_BIN" -P "$PORT" -u root -p < "$ROOT_DIR/database/webshield.sql"
"$MYSQL_BIN" -P "$PORT" -u root -p webshield < "$ROOT_DIR/database/webshield_data.sql"

echo ""
echo "Done. Set webshield-api/.env → DB_PORT=$PORT and DB_PASSWORD=<your password>"
