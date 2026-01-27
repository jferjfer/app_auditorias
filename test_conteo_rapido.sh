#!/bin/bash

# Script de pruebas para Modo Conteo Rápido
# Ejecutar: bash test_conteo_rapido.sh

echo "🧪 PRUEBAS MODO CONTEO RÁPIDO - API Backend"
echo "=========================================="
echo ""

# Variables
API_URL="http://127.0.0.1:8000"
TOKEN=""
AUDIT_ID=""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. LOGIN
echo "📝 Test 1: Login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=auditor@test.com&password=password123")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    print_result 0 "Login exitoso"
    echo "   Token: ${TOKEN:0:20}..."
else
    print_result 1 "Login fallido"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 2. OBTENER AUDITORÍAS
echo "📋 Test 2: Obtener auditorías"
AUDITS_RESPONSE=$(curl -s -X GET "$API_URL/api/audits/" \
  -H "Authorization: Bearer $TOKEN")

AUDIT_ID=$(echo $AUDITS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$AUDIT_ID" ]; then
    print_result 0 "Auditorías obtenidas"
    echo "   Audit ID: $AUDIT_ID"
else
    print_result 1 "No se encontraron auditorías"
    echo "   Response: $AUDITS_RESPONSE"
fi
echo ""

# 3. INICIAR AUDITORÍA EN MODO CONTEO RÁPIDO
echo "🚀 Test 3: Iniciar auditoría en modo conteo rápido"
INICIAR_RESPONSE=$(curl -s -X PUT "$API_URL/api/audits/$AUDIT_ID/iniciar?modo=conteo_rapido" \
  -H "Authorization: Bearer $TOKEN")

MODO=$(echo $INICIAR_RESPONSE | grep -o '"modo_auditoria":"[^"]*' | cut -d'"' -f4)

if [ "$MODO" = "conteo_rapido" ]; then
    print_result 0 "Auditoría iniciada en modo conteo rápido"
else
    print_result 1 "Error iniciando auditoría"
    echo "   Response: $INICIAR_RESPONSE"
fi
echo ""

# 4. OBTENER DETALLES DE AUDITORÍA
echo "📊 Test 4: Obtener productos de auditoría"
DETAILS_RESPONSE=$(curl -s -X GET "$API_URL/api/audits/$AUDIT_ID" \
  -H "Authorization: Bearer $TOKEN")

PRODUCT_COUNT=$(echo $DETAILS_RESPONSE | grep -o '"productos":\[' | wc -l)

if [ $PRODUCT_COUNT -gt 0 ]; then
    print_result 0 "Productos obtenidos"
    FIRST_PRODUCT_ID=$(echo $DETAILS_RESPONSE | grep -o '"id":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)
    echo "   Primer producto ID: $FIRST_PRODUCT_ID"
else
    print_result 1 "No se encontraron productos"
fi
echo ""

# 5. ACTUALIZAR CANTIDAD DE PRODUCTO (Simular escaneo)
echo "🔍 Test 5: Actualizar cantidad (simular escaneo)"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/api/audits/$AUDIT_ID/products/$FIRST_PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad_fisica": 5}')

if echo $UPDATE_RESPONSE | grep -q "message"; then
    print_result 0 "Producto actualizado correctamente"
else
    print_result 1 "Error actualizando producto"
    echo "   Response: $UPDATE_RESPONSE"
fi
echo ""

# 6. CREAR PRODUCTO NO REFERENCIADO (Sobrante)
echo "➕ Test 6: Crear producto no referenciado"
SURPLUS_RESPONSE=$(curl -s -X POST "$API_URL/api/audits/$AUDIT_ID/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku": "TEST999", "cantidad_fisica": 3, "observaciones": "Producto de prueba"}')

if echo $SURPLUS_RESPONSE | grep -q "sku"; then
    print_result 0 "Producto no referenciado creado"
else
    print_result 1 "Error creando producto"
    echo "   Response: $SURPLUS_RESPONSE"
fi
echo ""

# 7. VERIFICAR PORCENTAJE DE CUMPLIMIENTO
echo "📈 Test 7: Verificar cálculo de cumplimiento"
AUDIT_DETAILS=$(curl -s -X GET "$API_URL/api/audits/$AUDIT_ID" \
  -H "Authorization: Bearer $TOKEN")

CUMPLIMIENTO=$(echo $AUDIT_DETAILS | grep -o '"porcentaje_cumplimiento":[0-9]*' | cut -d':' -f2)

if [ -n "$CUMPLIMIENTO" ]; then
    print_result 0 "Cumplimiento calculado: $CUMPLIMIENTO%"
else
    print_result 1 "Error calculando cumplimiento"
fi
echo ""

# 8. OBTENER NOVEDADES POR SKU
echo "⚠️  Test 8: Obtener novedades por SKU"
NOVELTIES_RESPONSE=$(curl -s -X GET "$API_URL/api/audits/$AUDIT_ID/novelties-by-sku" \
  -H "Authorization: Bearer $TOKEN")

if echo $NOVELTIES_RESPONSE | grep -q "sku"; then
    print_result 0 "Novedades obtenidas"
else
    print_result 1 "Error obteniendo novedades"
fi
echo ""

# 9. FINALIZAR AUDITORÍA
echo "🏁 Test 9: Finalizar auditoría"
FINISH_RESPONSE=$(curl -s -X PUT "$API_URL/api/audits/$AUDIT_ID/finish" \
  -H "Authorization: Bearer $TOKEN")

ESTADO=$(echo $FINISH_RESPONSE | grep -o '"estado":"[^"]*' | cut -d'"' -f4)

if [ "$ESTADO" = "finalizada" ]; then
    print_result 0 "Auditoría finalizada correctamente"
else
    print_result 1 "Error finalizando auditoría"
    echo "   Response: $FINISH_RESPONSE"
fi
echo ""

# RESUMEN
echo "=========================================="
echo "✅ PRUEBAS COMPLETADAS"
echo "=========================================="
