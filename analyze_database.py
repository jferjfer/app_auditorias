import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def analyze_database():
    """Analiza la estructura de la base de datos existente"""
    
    # Obtener URL de la base de datos
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ No se encontró DATABASE_URL en .env")
        return
    
    # Ajustar URL para SQLAlchemy
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    print(f"🔗 Conectando a: {database_url.split('@')[1] if '@' in database_url else 'base de datos'}")
    
    try:
        # Crear conexión
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 10}
        )
        
        # Probar conexión
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Conectado exitosamente")
            print(f"📊 Versión PostgreSQL: {version.split()[1]}")
        
        # Inspeccionar estructura
        inspector = inspect(engine)
        
        print("\n" + "="*60)
        print("📋 ESTRUCTURA DE LA BASE DE DATOS")
        print("="*60)
        
        # Obtener todas las tablas
        tables = inspector.get_table_names()
        print(f"\n🗂️  TABLAS ENCONTRADAS ({len(tables)}):")
        for table in sorted(tables):
            print(f"   • {table}")
        
        print("\n" + "="*60)
        print("📊 DETALLE DE CADA TABLA")
        print("="*60)
        
        # Analizar cada tabla
        for table_name in sorted(tables):
            print(f"\n🔍 TABLA: {table_name}")
            print("-" * 40)
            
            # Obtener columnas
            columns = inspector.get_columns(table_name)
            print("   COLUMNAS:")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                default = f" DEFAULT {col['default']}" if col['default'] else ""
                print(f"     • {col['name']:<25} {str(col['type']):<20} {nullable}{default}")
            
            # Obtener índices
            indexes = inspector.get_indexes(table_name)
            if indexes:
                print("   ÍNDICES:")
                for idx in indexes:
                    unique = "UNIQUE " if idx['unique'] else ""
                    columns_str = ", ".join(idx['column_names'])
                    print(f"     • {unique}{idx['name']}: ({columns_str})")
            
            # Obtener foreign keys
            foreign_keys = inspector.get_foreign_keys(table_name)
            if foreign_keys:
                print("   FOREIGN KEYS:")
                for fk in foreign_keys:
                    print(f"     • {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
            
            # Contar registros
            try:
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.fetchone()[0]
                    print(f"   REGISTROS: {count:,}")
            except Exception as e:
                print(f"   REGISTROS: Error contando - {e}")
        
        print("\n" + "="*60)
        print("🔍 BÚSQUEDA DE TABLAS RELACIONADAS CON SKU")
        print("="*60)
        
        # Buscar tablas o columnas relacionadas con SKU
        sku_related = []
        for table_name in tables:
            columns = inspector.get_columns(table_name)
            for col in columns:
                if 'sku' in col['name'].lower():
                    sku_related.append(f"{table_name}.{col['name']} ({col['type']})")
        
        if sku_related:
            print("   COLUMNAS CON 'SKU':")
            for item in sku_related:
                print(f"     • {item}")
        else:
            print("   ❌ No se encontraron columnas con 'SKU'")
        
        # Buscar tablas de mapeo existentes
        mapping_tables = [t for t in tables if 'mapping' in t.lower() or 'map' in t.lower()]
        if mapping_tables:
            print(f"\n   TABLAS DE MAPEO EXISTENTES:")
            for table in mapping_tables:
                print(f"     • {table}")
        else:
            print(f"\n   ❌ No se encontraron tablas de mapeo")
        
        print("\n✅ Análisis completado")
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False
    
    return True

if __name__ == "__main__":
    analyze_database()