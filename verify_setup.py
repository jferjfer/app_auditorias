#!/usr/bin/env python3
"""
Script de verificación de configuración local
Verifica que todo esté correctamente configurado antes de ejecutar el proyecto
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Verifica que exista el archivo .env"""
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ Archivo .env no encontrado")
        print("   Copia .env.example a .env y configura tus variables")
        print("   Comando: copy .env.example .env")
        return False
    print("✅ Archivo .env encontrado")
    return True

def check_env_variables():
    """Verifica que las variables de entorno estén configuradas"""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["SECRET_KEY", "DATABASE_URL"]
    missing = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith("tu_"):
            missing.append(var)
        else:
            print(f"✅ {var} configurado")
    
    if missing:
        print(f"❌ Variables faltantes o sin configurar: {', '.join(missing)}")
        return False
    
    return True

def check_database_connection():
    """Verifica la conexión a la base de datos"""
    try:
        from backend.database import engine
        with engine.connect() as conn:
            print("✅ Conexión a base de datos exitosa")
            
            # Verificar si es PostgreSQL o SQLite
            db_url = os.getenv("DATABASE_URL", "")
            if "postgresql" in db_url:
                print("   📊 Usando PostgreSQL (Render)")
            elif "sqlite" in db_url:
                print("   📊 Usando SQLite (Local)")
            
            return True
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False

def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "psycopg2",
        "alembic",
        "python_jose",
        "passlib",
        "pandas",
        "openpyxl"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} instalado")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} NO instalado")
    
    if missing:
        print(f"\n❌ Instala las dependencias faltantes:")
        print(f"   pip install -r requirements.txt")
        return False
    
    return True

def check_frontend():
    """Verifica que el frontend esté configurado"""
    frontend_path = Path("frontend-app")
    if not frontend_path.exists():
        print("❌ Directorio frontend-app no encontrado")
        return False
    
    node_modules = frontend_path / "node_modules"
    if not node_modules.exists():
        print("⚠️  Dependencias del frontend no instaladas")
        print("   Ejecuta: cd frontend-app && npm install")
        return False
    
    print("✅ Frontend configurado")
    return True

def main():
    print("=" * 60)
    print("🔍 VERIFICACIÓN DE CONFIGURACIÓN LOCAL")
    print("=" * 60)
    print()
    
    checks = [
        ("Archivo .env", check_env_file),
        ("Variables de entorno", check_env_variables),
        ("Dependencias Python", check_dependencies),
        ("Conexión a BD", check_database_connection),
        ("Frontend", check_frontend),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 Verificando: {name}")
        print("-" * 60)
        try:
            result = check_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Error en verificación: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    if all(results):
        print("✅ TODAS LAS VERIFICACIONES PASARON")
        print("=" * 60)
        print("\n🚀 Puedes ejecutar el proyecto:")
        print("   Backend:  uvicorn backend.main:app --reload")
        print("   Frontend: cd frontend-app && npm run dev")
        return 0
    else:
        print("❌ ALGUNAS VERIFICACIONES FALLARON")
        print("=" * 60)
        print("\n📖 Revisa LOCAL_SETUP.md para más información")
        return 1

if __name__ == "__main__":
    sys.exit(main())
