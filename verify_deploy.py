#!/usr/bin/env python3
"""
Script de verificación pre-despliegue
Verifica que todo esté listo para deploy en Render
"""
import os
import sys
import json
from pathlib import Path

def check_file_exists(filepath, required=True):
    """Verifica que un archivo exista"""
    exists = Path(filepath).exists()
    status = "OK" if exists else ("FAIL" if required else "WARN")
    print(f"[{status}] {filepath}")
    return exists

def check_gitignore():
    """Verifica que archivos sensibles esten en .gitignore"""
    print("\nVerificando .gitignore...")
    required = [".env", "*.db", "uploads/*", "*.log"]
    
    if not Path(".gitignore").exists():
        print("[FAIL] .gitignore no existe")
        return False
    
    with open(".gitignore", "r") as f:
        content = f.read()
    
    all_ok = True
    for item in required:
        if item in content:
            print(f"[OK] {item} esta en .gitignore")
        else:
            print(f"[FAIL] {item} NO esta en .gitignore")
            all_ok = False
    
    return all_ok

def check_env_example():
    """Verifica que .env.example exista y no tenga valores reales"""
    print("\nVerificando .env.example...")
    
    if not Path(".env.example").exists():
        print("[WARN] .env.example no existe")
        return True
    
    with open(".env.example", "r") as f:
        lines = [l for l in f.readlines() if not l.strip().startswith("#")]
        content = "".join(lines)
    
    # Verificar que DATABASE_URL no tenga credenciales reales (ignorando comentarios)
    if "DATABASE_URL=postgresql://" in content and "@dpg-" in content:
        print("[FAIL] .env.example contiene credenciales reales")
        return False
    
    print("[OK] .env.example esta limpio")
    return True

def check_requirements():
    """Verifica que requirements.txt tenga las dependencias necesarias"""
    print("\nVerificando requirements.txt...")
    
    if not Path("requirements.txt").exists():
        print("[FAIL] requirements.txt no existe")
        return False
    
    with open("requirements.txt", "r") as f:
        content = f.read()
    
    required = ["fastapi", "uvicorn", "sqlalchemy", "alembic", "psycopg2-binary", "python-jose", "passlib", "bcrypt"]
    all_ok = True
    
    for pkg in required:
        if pkg in content.lower():
            print(f"[OK] {pkg}")
        else:
            print(f"[FAIL] {pkg} falta")
            all_ok = False
    
    return all_ok

def check_frontend_build():
    """Verifica que el frontend se pueda construir"""
    print("\nVerificando configuracion del frontend...")
    
    if not Path("frontend-app/package.json").exists():
        print("[FAIL] frontend-app/package.json no existe")
        return False
    
    with open("frontend-app/package.json", "r") as f:
        pkg = json.load(f)
    
    if "build" not in pkg.get("scripts", {}):
        print("[FAIL] Script 'build' no esta en package.json")
        return False
    
    print("[OK] Script de build configurado")
    return True

def check_build_script():
    """Verifica que build.sh exista"""
    print("\nVerificando build.sh...")
    
    if not Path("build.sh").exists():
        print("[FAIL] build.sh no existe")
        return False
    
    with open("build.sh", "r") as f:
        content = f.read()
    
    checks = [
        ("pip install", "Instalación de Python"),
        ("npm install", "Instalación de Node"),
        ("npm run build", "Build del frontend"),
        ("alembic upgrade head", "Migraciones de BD")
    ]
    
    all_ok = True
    for check, desc in checks:
        if check in content:
            print(f"[OK] {desc}")
        else:
            print(f"[WARN] {desc} no encontrado")
    
    return all_ok

def check_alembic():
    """Verifica configuracion de Alembic"""
    print("\nVerificando Alembic...")
    
    if not Path("alembic.ini").exists():
        print("[FAIL] alembic.ini no existe")
        return False
    
    if not Path("alembic/env.py").exists():
        print("[FAIL] alembic/env.py no existe")
        return False
    
    versions_dir = Path("alembic/versions")
    if not versions_dir.exists():
        print("[FAIL] alembic/versions no existe")
        return False
    
    migrations = list(versions_dir.glob("*.py"))
    migrations = [m for m in migrations if m.name != "__pycache__"]
    
    print(f"[OK] {len(migrations)} migraciones encontradas")
    return True

def main():
    """Ejecuta todas las verificaciones"""
    print("Verificacion Pre-Despliegue para Render\n")
    print("=" * 50)
    
    checks = [
        ("Archivos requeridos", lambda: all([
            check_file_exists("requirements.txt"),
            check_file_exists("build.sh"),
            check_file_exists("backend/main.py"),
            check_file_exists("frontend-app/package.json"),
            check_file_exists("alembic.ini"),
        ])),
        (".gitignore", check_gitignore),
        (".env.example", check_env_example),
        ("Dependencias Python", check_requirements),
        ("Frontend", check_frontend_build),
        ("Build Script", check_build_script),
        ("Alembic", check_alembic),
    ]
    
    results = []
    for name, check_fn in checks:
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"[ERROR] Error en {name}: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("\nResumen:\n")
    
    all_passed = True
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"[{status}] {name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    
    if all_passed:
        print("\nTodo listo para desplegar en Render!")
        print("\nProximos pasos:")
        print("1. git add .")
        print("2. git commit -m 'Preparar para deploy'")
        print("3. git push origin main")
        print("4. Crear servicio en Render Dashboard")
        return 0
    else:
        print("\nHay problemas que deben resolverse antes del deploy")
        print("Revisa los errores arriba y corrigelos")
        return 1

if __name__ == "__main__":
    sys.exit(main())
