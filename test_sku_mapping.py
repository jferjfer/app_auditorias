"""
Script para probar la carga de mapeos de SKU
Crea un Excel de ejemplo y lo carga en la BD
"""
import pandas as pd
from backend.database import SessionLocal
from backend import crud

def crear_excel_ejemplo():
    """Crea un Excel de ejemplo con mapeos de SKU"""
    data = {
        'SKU ANTIGUO': ['ABC123', 'DEF456', 'GHI789', 'JKL012'],
        'SKU NUEVO': ['XYZ999', 'UVW888', 'RST777', 'OPQ666']
    }
    
    df = pd.DataFrame(data)
    filename = 'mapeos_sku_ejemplo.xlsx'
    df.to_excel(filename, index=False)
    print(f"Excel de ejemplo creado: {filename}")
    return filename

def cargar_mapeos_desde_dict(mappings_data, user_id=1):
    """Carga mapeos directamente desde un diccionario"""
    db = SessionLocal()
    try:
        result = crud.bulk_create_sku_mappings(db, mappings_data, user_id)
        print(f"\nResultados:")
        print(f"  Creados: {result['creados']}")
        print(f"  Actualizados: {result['actualizados']}")
        print(f"  Errores: {result['errores']}")
        if result['detalles_errores']:
            print(f"  Detalles de errores:")
            for error in result['detalles_errores']:
                print(f"    - {error}")
        
        # Listar mapeos creados
        mappings = crud.get_all_sku_mappings(db, activo_only=True)
        print(f"\nMapeos activos en BD: {len(mappings)}")
        for m in mappings[:5]:  # Mostrar solo los primeros 5
            print(f"  {m.sku_antiguo} -> {m.sku_nuevo}")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=== PRUEBA DE MAPEO DE SKUs ===\n")
    
    # Datos de ejemplo
    mappings_data = [
        {'sku_antiguo': 'ABC123', 'sku_nuevo': 'XYZ999'},
        {'sku_antiguo': 'DEF456', 'sku_nuevo': 'UVW888'},
        {'sku_antiguo': 'GHI789', 'sku_nuevo': 'RST777'},
        {'sku_antiguo': 'JKL012', 'sku_nuevo': 'OPQ666'},
        {'sku_antiguo': '000123', 'sku_nuevo': 'NEW123'},  # Con ceros iniciales
    ]
    
    print("Cargando mapeos de prueba...")
    success = cargar_mapeos_desde_dict(mappings_data)
    
    if success:
        print("\nOK: Mapeos cargados exitosamente")
        print("\nPuedes probar escaneando:")
        print("  - SKU antiguo: ABC123 -> Deberia encontrar producto con SKU: XYZ999")
        print("  - SKU antiguo: 000123 -> Deberia encontrar producto con SKU: NEW123")
    else:
        print("\nERROR: No se pudieron cargar los mapeos")
