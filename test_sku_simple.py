import pandas as pd

# Simular el procesamiento del backend
def test_sku_processing():
    # Leer el archivo como lo hace el backend
    df = pd.read_excel('mapeos_sku_test.xlsx', engine='openpyxl')
    
    print("=== ANTES DE NORMALIZAR ===")
    print("Columnas originales:", list(df.columns))
    
    # Normalizar como lo hace el backend
    df.columns = df.columns.str.strip().str.upper()
    
    print("\n=== DESPUES DE NORMALIZAR ===")
    print("Columnas normalizadas:", list(df.columns))
    
    # Verificar columnas requeridas
    required_cols = ["SKU ANTIGUO", "SKU NUEVO"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    print(f"\nColumnas requeridas: {required_cols}")
    print(f"Columnas faltantes: {missing_cols}")
    
    if missing_cols:
        print(f"ERROR: Faltan columnas requeridas: {', '.join(missing_cols)}")
        return False
    else:
        print("OK: Todas las columnas estan presentes")
        
        # Procesar datos
        mappings_data = []
        for _, row in df.iterrows():
            sku_antiguo = str(row.get("SKU ANTIGUO", "")).strip()
            sku_nuevo = str(row.get("SKU NUEVO", "")).strip()
            
            if sku_antiguo and sku_nuevo and sku_antiguo.lower() != 'nan' and sku_nuevo.lower() != 'nan':
                mappings_data.append({
                    "sku_antiguo": sku_antiguo,
                    "sku_nuevo": sku_nuevo
                })
        
        print(f"\nDatos procesados: {len(mappings_data)} mapeos validos")
        for i, mapping in enumerate(mappings_data):
            print(f"  {i+1}. {mapping['sku_antiguo']} -> {mapping['sku_nuevo']}")
        return True

if __name__ == "__main__":
    success = test_sku_processing()
    print(f"\nResultado: {'EXITO' if success else 'ERROR'}")