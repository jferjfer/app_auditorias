@echo off
echo ========================================
echo PRUEBA DE BUSQUEDA DE OT
echo ========================================
echo.

REM Configurar URL base
set API_URL=http://127.0.0.1:8000

echo 1. Login como AUDITOR...
curl -X POST "%API_URL%/api/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=auditor@test.com&password=password123" ^
  -o temp_auditor_token.json
echo.

REM Extraer token del auditor
for /f "tokens=2 delims=:," %%a in ('type temp_auditor_token.json ^| findstr "access_token"') do set AUDITOR_TOKEN=%%a
set AUDITOR_TOKEN=%AUDITOR_TOKEN:"=%
set AUDITOR_TOKEN=%AUDITOR_TOKEN: =%

echo Token auditor: %AUDITOR_TOKEN%
echo.

echo 2. Buscar OT como AUDITOR (solo sus auditorias)...
curl -X GET "%API_URL%/api/audits/search-by-ot/VE3" ^
  -H "Authorization: Bearer %AUDITOR_TOKEN%"
echo.
echo.

echo 3. Buscar MULTIPLES OTs como AUDITOR...
curl -X GET "%API_URL%/api/audits/search-by-ot/VE3,VE4,VE5" ^
  -H "Authorization: Bearer %AUDITOR_TOKEN%"
echo.
echo.

echo 4. Login como ANALISTA...
curl -X POST "%API_URL%/api/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=analista@test.com&password=password123" ^
  -o temp_analista_token.json
echo.

REM Extraer token del analista
for /f "tokens=2 delims=:," %%a in ('type temp_analista_token.json ^| findstr "access_token"') do set ANALISTA_TOKEN=%%a
set ANALISTA_TOKEN=%ANALISTA_TOKEN:"=%
set ANALISTA_TOKEN=%ANALISTA_TOKEN: =%

echo Token analista: %ANALISTA_TOKEN%
echo.

echo 5. Buscar OT como ANALISTA (toda la BD)...
curl -X GET "%API_URL%/api/audits/search-by-ot/VE3" ^
  -H "Authorization: Bearer %ANALISTA_TOKEN%"
echo.
echo.

echo 6. Buscar MULTIPLES OTs como ANALISTA...
curl -X GET "%API_URL%/api/audits/search-by-ot/VE3,VE4,VE5" ^
  -H "Authorization: Bearer %ANALISTA_TOKEN%"
echo.
echo.

REM Limpiar archivos temporales
del temp_auditor_token.json 2>nul
del temp_analista_token.json 2>nul

echo ========================================
echo PRUEBAS COMPLETADAS
echo ========================================
pause
