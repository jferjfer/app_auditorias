import pandas as pd

# Crear datos de prueba para mapeos de SKU
data = {
    'SKU ANTIGUO': ['PD001', 'PD002', 'PD003', 'PD004', 'PD005'],
    'SKU NUEVO': ['NEW001', 'NEW002', 'NEW003', 'NEW004', 'NEW005']
}

df = pd.DataFrame(data)
df.to_excel('mapeos_sku_test.xlsx', index=False)
print("Archivo mapeos_sku_test.xlsx creado exitosamente")