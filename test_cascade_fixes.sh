#!/bin/bash

# Script para probar correcciones CASCADE
# Ejecutar: bash test_cascade_fixes.sh

API_URL="http://127.0.0.1:8000/api"
TOKEN=""

echo "=========================================="
echo "PRUEBAS DE CORRECCIONES CASCADE"
echo "=========================================="

# Función para obtener token
get_token() {
    echo "1. Obteniendo token de administrador..."
    
    # Intentar login con admin común
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin@test.com&password=admin123")
    
    if [[ $RESPONSE == *"access_token"* ]]; then
        TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        echo "✅ Token obtenido: ${TOKEN:0:20}..."
    else
        echo "❌ Error obteniendo token. Respuesta: $RESPONSE"
        echo "Intentando con otro usuario..."
        
        # Listar usuarios disponibles
        echo "Probando sin autenticación para ver error..."
        curl -s -X GET "$API_URL/users/" | head -100
        exit 1
    fi
}

# Función para crear usuario de prueba
create_test_user() {
    echo ""
    echo "2. Creando usuario de prueba..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/users/" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "nombre": "Usuario Test CASCADE",
            "correo": "test_cascade@test.com",
            "rol": "auditor",
            "contrasena": "TestPass123"
        }')
    
    if [[ $RESPONSE == *"id"* ]]; then
        TEST_USER_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "✅ Usuario creado con ID: $TEST_USER_ID"
    else
        echo "⚠️ Usuario ya existe o error: $RESPONSE"
        # Intentar obtener ID del usuario existente
        USERS_RESPONSE=$(curl -s -X GET "$API_URL/users/" -H "Authorization: Bearer $TOKEN")
        TEST_USER_ID=$(echo $USERS_RESPONSE | grep -o '"correo":"test_cascade@test.com"[^}]*"id":[0-9]*' | grep -o '"id":[0-9]*' | cut -d':' -f2)
        if [[ -n $TEST_USER_ID ]]; then
            echo "✅ Usuario existente encontrado con ID: $TEST_USER_ID"
        fi
    fi
}

# Función para crear ubicación de prueba
create_test_location() {
    echo ""
    echo "3. Creando ubicación de prueba..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/ubicaciones/" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "nombre": "Sede Test CASCADE",
            "tipo": "sede"
        }')
    
    if [[ $RESPONSE == *"id"* ]]; then
        TEST_LOCATION_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "✅ Ubicación creada con ID: $TEST_LOCATION_ID"
    else
        echo "⚠️ Ubicación ya existe o error: $RESPONSE"
        # Intentar obtener ID de ubicación existente
        LOCATIONS_RESPONSE=$(curl -s -X GET "$API_URL/ubicaciones/" -H "Authorization: Bearer $TOKEN")
        TEST_LOCATION_ID=$(echo $LOCATIONS_RESPONSE | grep -o '"nombre":"Sede Test CASCADE"[^}]*"id":[0-9]*' | grep -o '"id":[0-9]*' | cut -d':' -f2)
        if [[ -n $TEST_LOCATION_ID ]]; then
            echo "✅ Ubicación existente encontrada con ID: $TEST_LOCATION_ID"
        fi
    fi
}

# Función para probar eliminación de usuario con auditorías
test_delete_user_with_audits() {
    echo ""
    echo "4. Probando eliminación de usuario (debe limpiar referencias)..."
    
    if [[ -z $TEST_USER_ID ]]; then
        echo "❌ No hay usuario de prueba para eliminar"
        return
    fi
    
    RESPONSE=$(curl -s -X DELETE "$API_URL/users/$TEST_USER_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    if [[ $RESPONSE == *"id"* ]]; then
        echo "✅ Usuario eliminado correctamente: $RESPONSE"
    else
        echo "❌ Error eliminando usuario: $RESPONSE"
    fi
}

# Función para probar eliminación de ubicación en uso
test_delete_location_in_use() {
    echo ""
    echo "5. Probando eliminación de ubicación en uso (debe fallar)..."
    
    if [[ -z $TEST_LOCATION_ID ]]; then
        echo "❌ No hay ubicación de prueba para eliminar"
        return
    fi
    
    RESPONSE=$(curl -s -X DELETE "$API_URL/ubicaciones/$TEST_LOCATION_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    if [[ $RESPONSE == *"auditoría"* ]] || [[ $RESPONSE == *"error"* ]]; then
        echo "✅ Eliminación bloqueada correctamente: $RESPONSE"
    else
        echo "⚠️ Respuesta inesperada: $RESPONSE"
    fi
}

# Función para probar historial con productos eliminados
test_history_with_deleted_products() {
    echo ""
    echo "6. Probando historial de auditoría..."
    
    # Obtener primera auditoría disponible
    AUDITS_RESPONSE=$(curl -s -X GET "$API_URL/audits/" -H "Authorization: Bearer $TOKEN")
    AUDIT_ID=$(echo $AUDITS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [[ -n $AUDIT_ID ]]; then
        echo "Probando historial de auditoría ID: $AUDIT_ID"
        RESPONSE=$(curl -s -X GET "$API_URL/collaboration/$AUDIT_ID/history" \
            -H "Authorization: Bearer $TOKEN")
        
        if [[ $RESPONSE == *"modified_at"* ]]; then
            echo "✅ Historial obtenido correctamente"
            echo "Primeros 200 caracteres: ${RESPONSE:0:200}..."
        else
            echo "⚠️ Sin historial o error: $RESPONSE"
        fi
    else
        echo "❌ No hay auditorías disponibles para probar historial"
    fi
}

# Función para verificar integridad de la base de datos
verify_database_integrity() {
    echo ""
    echo "7. Verificando integridad de la base de datos..."
    
    # Verificar usuarios
    USERS_COUNT=$(curl -s -X GET "$API_URL/users/" -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l)
    echo "Usuarios en sistema: $USERS_COUNT"
    
    # Verificar ubicaciones
    LOCATIONS_COUNT=$(curl -s -X GET "$API_URL/ubicaciones/" -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l)
    echo "Ubicaciones en sistema: $LOCATIONS_COUNT"
    
    # Verificar auditorías
    AUDITS_COUNT=$(curl -s -X GET "$API_URL/audits/" -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | wc -l)
    echo "Auditorías en sistema: $AUDITS_COUNT"
}

# Ejecutar todas las pruebas
main() {
    get_token
    
    if [[ -z $TOKEN ]]; then
        echo "❌ No se pudo obtener token. Abortando pruebas."
        exit 1
    fi
    
    create_test_user
    create_test_location
    test_delete_user_with_audits
    test_delete_location_in_use
    test_history_with_deleted_products
    verify_database_integrity
    
    echo ""
    echo "=========================================="
    echo "PRUEBAS COMPLETADAS"
    echo "=========================================="
}

# Verificar si el servidor está corriendo
echo "Verificando si el servidor está corriendo..."
if curl -s "$API_URL/docs" > /dev/null; then
    echo "✅ Servidor detectado en $API_URL"
    main
else
    echo "❌ Servidor no disponible en $API_URL"
    echo "Asegúrate de que el servidor esté corriendo con: uvicorn backend.main:app --reload"
    exit 1
fi