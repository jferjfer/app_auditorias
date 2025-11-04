#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Instalando dependencias Python..."
/opt/render/project/src/.venv/bin/pip install -r requirements.txt

echo "==> Instalando Node.js y npm..."
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

echo "==> Moviendo build al backend..."
rm -rf frontend-react
mv frontend-app/dist frontend-react

echo "==> Build completado!"