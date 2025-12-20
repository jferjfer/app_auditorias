# 📦 Nueva Novedad: "NO SALIÓ"

## 🎯 Definición

**"No Salió"** es una novedad que identifica productos que:
1. Aparecen en el documento con `cantidad_documento = 0`
2. NO fueron auditados/escaneados (`cantidad_fisica = NULL`)

---

## 📋 Regla de Negocio

```
SI cantidad_documento = 0 
Y cantidad_fisica = NULL
ENTONCES novedad = "no_salio"
```

**Interpretación:** Productos que no debían salir en el traslado (cantidad = 0 en documento) y que efectivamente no se encontraron para auditar.

---

## 📊 Ejemplos de Uso

### **Caso 1: Producto que No Salió**
```
SKU: PD12345
Cantidad Documento: 0
Cantidad Física: NULL (no escaneado)
Novedad: no_salio ✅

Interpretación: El producto no debía salir y efectivamente no salió
```

### **Caso 2: Producto Sobrante (NO es "No Salió")**
```
SKU: PD67890
Cantidad Documento: 0
Cantidad Física: 5 (escaneado)
Novedad: sobrante ✅

Interpretación: El producto no debía salir pero se encontró
```

### **Caso 3: Producto Pendiente (NO es "No Salió")**
```
SKU: PD11111
Cantidad Documento: 10
Cantidad Física: NULL (no escaneado)
Novedad: sin_novedad ✅

Interpretación: Producto pendiente de auditar
```

---

## 🔍 Diferencias con Otras Novedades

| Novedad | Cant. Doc | Cant. Fís | Cuándo Aplica |
|---------|-----------|-----------|---------------|
| **no_salio** | 0 | NULL | Producto con 0 en documento y NO auditado |
| **sobrante** | 0 o < Fís | > 0 | Más cantidad de la esperada |
| **faltante** | > 0 | < Doc | Menos cantidad de la esperada |
| **sin_novedad** | > 0 | = Doc | Cantidad correcta |
| **averia** | Cualquiera | Cualquiera | Producto dañado (tabla novelties) |
| **vencido** | Cualquiera | Cualquiera | Producto vencido (tabla novelties) |

---

## 🔧 Implementación Técnica

### **1. Enum Actualizado**
```python
class NovedadEnum(str, enum.Enum):
    sin_novedad = "sin_novedad"
    sobrante = "sobrante"
    faltante = "faltante"
    averia = "averia"
    fecha_corta = "fecha_corta"
    contaminado = "contaminado"
    vencido = "vencido"
    no_salio = "no_salio"  # ← NUEVO
```

### **2. Migración de Base de Datos**
```sql
ALTER TYPE novedadenum ADD VALUE IF NOT EXISTS 'no_salio';
```

### **3. Detección Automática (Futuro)**
```python
# Al finalizar auditoría, detectar automáticamente:
for producto in productos:
    if producto.cantidad_documento == 0 and producto.cantidad_fisica is None:
        producto.novedad = "no_salio"
```

---

## 📈 Impacto en Reportes

### **Reporte Excel:**
```
SKU     | Cant.Doc | Cant.Fís | Novedad
PD001   | 10       | 10       | sin_novedad
PD002   | 5        | 3        | faltante
PD003   | 0        | NULL     | no_salio     ← NUEVO
PD004   | 0        | 2        | sobrante
```

### **Estadísticas:**
```
Distribución de Novedades:
- sin_novedad: 150
- faltante: 25
- sobrante: 10
- no_salio: 8        ← NUEVO
- averia: 5
```

---

## 🎯 Casos de Uso Reales

### **Escenario 1: Bodega de Tránsito**
```
Orden de Traslado VE12345:
- 50 productos con cantidad > 0 (deben salir)
- 10 productos con cantidad = 0 (no deben salir)

Al auditar:
- 50 productos escaneados ✅
- 10 productos NO escaneados (cantidad_fisica = NULL)
- Sistema marca automáticamente: novedad = "no_salio"

Resultado: Se confirma que los 10 productos efectivamente no salieron
```

### **Escenario 2: Control de Calidad**
```
Productos con cantidad = 0 en documento:
- SKU001: No escaneado → no_salio ✅
- SKU002: Escaneado con 3 unidades → sobrante ❗

Interpretación:
- SKU001: Correcto, no debía salir y no salió
- SKU002: Problema, no debía salir pero se encontró
```

---

## 📝 Notas Importantes

1. **Detección Manual vs Automática:**
   - Actualmente: El auditor debe seleccionar manualmente
   - Futuro: Detección automática al finalizar auditoría

2. **Diferencia con "sin_novedad":**
   - `sin_novedad`: Productos pendientes de auditar (cantidad_documento > 0)
   - `no_salio`: Productos que no debían salir (cantidad_documento = 0)

3. **Uso en Análisis:**
   - Permite identificar productos que correctamente no salieron
   - Diferencia de sobrantes (que no debían salir pero aparecieron)
   - Útil para control de inventario y trazabilidad

---

## 🚀 Próximos Pasos

1. ✅ Agregar enum `no_salio`
2. ✅ Crear migración de BD
3. ⏳ Actualizar frontend para mostrar opción
4. ⏳ Implementar detección automática (opcional)
5. ⏳ Agregar a reportes y estadísticas

---

## 📁 Archivos Modificados

1. ✅ `backend/models.py` - Enum NovedadEnum
2. ✅ `backend/schemas.py` - Enum NovedadTipoEnum
3. ✅ `alembic/versions/add_no_salio_novelty.py` - Migración

---

**Fecha de implementación**: Enero 2025  
**Impacto**: Medio (nueva funcionalidad)  
**Riesgo**: Bajo (solo agrega opción)  
**Requiere migración**: Sí (ALTER TYPE)
