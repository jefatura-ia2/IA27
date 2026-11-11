#!/bin/bash
# deploy.sh — Despliega frontend/ en Netlify usando CLI
# Requiere: npm install -g netlify-cli y NETLIFY_AUTH_TOKEN en .env

set -e
source .env 2>/dev/null || true

echo "🚀 Desplegando IA 1º Bach en Netlify..."
npx netlify deploy \
  --dir=frontend \
  --prod \
  --site=$NETLIFY_SITE_ID \
  --auth=$NETLIFY_AUTH_TOKEN

echo "✅ Despliegue completado"
