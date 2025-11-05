#!/usr/bin/env bash
set -o errexit

echo "==> Instalando dependencias Python..."
pip install -r requirements.txt

echo "==> Instalando Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

echo "==> Construyendo frontend React..."
cd frontend-app
npm install
npm run build
cd ..

echo "==> Ejecutando migraciones..."
alembic upgrade head

echo "==> Build completado!"