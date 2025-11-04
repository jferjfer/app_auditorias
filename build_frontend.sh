#!/bin/bash
# Script para construir el frontend React y moverlo al backend

echo "📦 Instalando dependencias del frontend..."
cd frontend-app
npm install

echo "🔨 Construyendo frontend React..."
npm run build

echo "📁 Moviendo build al backend..."
cd ..
rm -rf frontend-react
mv frontend-app/dist frontend-react

echo "✅ Frontend construido y listo para servir desde FastAPI"
