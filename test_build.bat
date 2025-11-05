@echo off
echo ========================================
echo Probando Build Local del Frontend
echo ========================================
echo.

cd frontend-app

echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install fallo
    exit /b 1
)

echo.
echo [2/3] Construyendo frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build fallo
    exit /b 1
)

echo.
echo [3/3] Verificando build...
if exist "dist\index.html" (
    echo OK: dist\index.html existe
) else (
    echo ERROR: dist\index.html no existe
    exit /b 1
)

if exist "dist\assets" (
    echo OK: dist\assets existe
) else (
    echo ERROR: dist\assets no existe
    exit /b 1
)

cd ..

echo.
echo ========================================
echo BUILD EXITOSO!
echo ========================================
echo.
echo El frontend esta listo para produccion en:
echo   frontend-app\dist\
echo.
