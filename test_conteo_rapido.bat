@echo off
echo ========================================
echo PRUEBAS MODO CONTEO RAPIDO
echo ========================================
echo.

echo 1. Verificando servidor...
curl -s http://127.0.0.1:8000/docs > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] El servidor no esta corriendo
    echo.
    echo Por favor inicia el servidor primero:
    echo    cd c:\app_auditorias
    echo    .\venv_app\Scripts\activate.bat
    echo    uvicorn backend.main:app --reload
    echo.
    pause
    exit /b 1
)

echo [OK] Servidor corriendo
echo.

echo 2. Login...
curl -s -X POST "http://127.0.0.1:8000/api/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=auditor@test.com&password=password123" > temp_login.json

echo [OK] Login completado
type temp_login.json
echo.
echo.

echo 3. Extrayendo token...
for /f "tokens=2 delims=:," %%a in ('type temp_login.json ^| findstr "access_token"') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%
echo Token: %TOKEN:~0,30%...
echo.

echo 4. Obteniendo auditorias...
curl -s -X GET "http://127.0.0.1:8000/api/audits/" ^
  -H "Authorization: Bearer %TOKEN%" > temp_audits.json

echo [OK] Auditorias obtenidas
type temp_audits.json
echo.
echo.

echo 5. Extrayendo ID de auditoria...
for /f "tokens=2 delims=:," %%a in ('type temp_audits.json ^| findstr /C:"\"id\"" ^| findstr /N "." ^| findstr "^2:"') do set AUDIT_ID=%%a
set AUDIT_ID=%AUDIT_ID: =%
echo Audit ID: %AUDIT_ID%
echo.

if "%AUDIT_ID%"=="" (
    echo [ERROR] No se encontro auditoria
    echo Crea una auditoria primero desde la interfaz web
    pause
    exit /b 1
)

echo 6. Iniciando auditoria en modo conteo rapido...
curl -s -X PUT "http://127.0.0.1:8000/api/audits/%AUDIT_ID%/iniciar?modo=conteo_rapido" ^
  -H "Authorization: Bearer %TOKEN%" > temp_iniciar.json

echo [OK] Auditoria iniciada
type temp_iniciar.json
echo.
echo.

echo 7. Obteniendo productos...
curl -s -X GET "http://127.0.0.1:8000/api/audits/%AUDIT_ID%" ^
  -H "Authorization: Bearer %TOKEN%" > temp_products.json

echo [OK] Productos obtenidos
echo Primeros 500 caracteres:
type temp_products.json | findstr /C:"productos" | findstr /C:"id"
echo.
echo.

echo 8. Extrayendo ID de primer producto...
for /f "tokens=2 delims=:," %%a in ('type temp_products.json ^| findstr /C:"\"id\"" ^| findstr /N "." ^| findstr "^3:"') do set PRODUCT_ID=%%a
set PRODUCT_ID=%PRODUCT_ID: =%
echo Product ID: %PRODUCT_ID%
echo.

if "%PRODUCT_ID%"=="" (
    echo [ERROR] No se encontro producto
    pause
    exit /b 1
)

echo 9. Actualizando cantidad (simular escaneo)...
curl -s -X PUT "http://127.0.0.1:8000/api/audits/%AUDIT_ID%/products/%PRODUCT_ID%" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"cantidad_fisica\": 5}" > temp_update.json

echo [OK] Producto actualizado
type temp_update.json
echo.
echo.

echo 10. Creando producto no referenciado...
curl -s -X POST "http://127.0.0.1:8000/api/audits/%AUDIT_ID%/products" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"sku\": \"TEST999\", \"cantidad_fisica\": 3, \"observaciones\": \"Producto de prueba\"}" > temp_surplus.json

echo [OK] Producto creado
type temp_surplus.json
echo.
echo.

echo 11. Verificando cumplimiento...
curl -s -X GET "http://127.0.0.1:8000/api/audits/%AUDIT_ID%" ^
  -H "Authorization: Bearer %TOKEN%" | findstr "porcentaje_cumplimiento"
echo.
echo.

echo 12. Obteniendo novedades...
curl -s -X GET "http://127.0.0.1:8000/api/audits/%AUDIT_ID%/novelties-by-sku" ^
  -H "Authorization: Bearer %TOKEN%" > temp_novelties.json

echo [OK] Novedades obtenidas
type temp_novelties.json
echo.
echo.

echo ========================================
echo PRUEBAS COMPLETADAS
echo ========================================
echo.
echo Limpiando archivos temporales...
del temp_*.json 2>nul

pause
