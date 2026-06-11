#!/usr/bin/env bash
# Generate self-signed TLS cert para HTTPS local/demo.
# El cert dura 365 días. NO para producción real — usar Let's Encrypt allá.

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/cert.pem" && -f "$CERT_DIR/key.pem" ]]; then
  echo "Cert ya existe en $CERT_DIR (skip). Borralo si quieres regenerar."
  exit 0
fi

openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERT_DIR/key.pem"
echo "Cert generado en $CERT_DIR/"
