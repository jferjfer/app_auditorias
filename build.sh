#!/usr/bin/env bash
set -o errexit

echo "==> Instalando dependencias Python..."
pip install -r requirements.txt

echo "==> Construyendo frontend React..."
cd frontend-app
npm install
npm run build
cd ..

echo "==> Verificando build del frontend..."
if [ -d "frontend-app/dist" ]; then
    echo "OK: frontend-app/dist existe"
    ls -la frontend-app/dist/
else
    echo "ERROR: frontend-app/dist no existe"
    exit 1
fi

echo "==> Ejecutando migraciones..."
alembic upgrade head

echo "==> Build completado!"