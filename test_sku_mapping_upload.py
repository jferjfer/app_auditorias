"""
Script para probar la carga de mapeos de SKU
"""
from backend.database import SessionLocal
from backend import crud, models
import pandas as pd

def test_upload():
    db = SessionLocal()
    
    try:
        # Leer Excel de prueba
        df = pd.read_excel('test_mapeos_sku.xlsx')
        print(f"Archivo leido: {len(df)} mapeos")
        print(df.head())
        
        # Convertir a lista de diccionarios
        mappings = []
        for _, row in df.iterrows():
            mappings.append({
                'sku_antiguo': str(row['SKU_ANTIGUO']),
                'sku_nuevo': str(row['SKU_NUEVO'])
            })
        
        # Crear mapeos (user_id=1 = admin)
        result = crud.bulk_create_sku_mappings(db, mappings, user_id=1)
        
        print(f"\nResultado:")
        print(f"   Creados: {result['creados']}")
        print(f"   Actualizados: {result['actualizados']}")
        print(f"   Errores: {result['errores']}")
        
        if result['detalles_errores']:
            print(f"\nErrores:")
            for error in result['detalles_errores']:
                print(f"   - {error}")
        
        # Verificar mapeos creados
        all_mappings = crud.get_all_sku_mappings(db)
        print(f"\nTotal de mapeos en BD: {len(all_mappings)}")
        
        for m in all_mappings[:5]:
            print(f"   {m.sku_antiguo} -> {m.sku_nuevo} (activo: {m.activo})")
        
        # Probar busqueda
        print(f"\nProbando busqueda:")
        test_sku = 'ABC123'
        mapping = crud.get_sku_mapping(db, test_sku)
        if mapping:
            print(f"   OK: {test_sku} -> {mapping.sku_nuevo}")
        else:
            print(f"   ERROR: No se encontro mapeo para {test_sku}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    test_upload()
