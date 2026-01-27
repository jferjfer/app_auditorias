"""
Script para probar login y carga de mapeos SKU
"""
from backend.database import SessionLocal
from backend.models import User
from backend.crud import bulk_create_sku_mappings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Verificar usuario
user = db.query(User).filter(User.correo == 'javier@laika.com.co').first()

if not user:
    print("ERROR: Usuario no encontrado")
    db.close()
    exit(1)

print(f"Usuario encontrado: {user.nombre}")
print(f"Email: {user.correo}")
print(f"Rol: {user.rol}")
print(f"ID: {user.id}")

# Verificar contraseña
password_ok = pwd_context.verify('A1234567a', user.contrasena_hash)
print(f"Contrasena correcta: {password_ok}")

if not password_ok:
    print("ERROR: Contrasena incorrecta")
    db.close()
    exit(1)

# Probar carga de mapeos
print("\nProbando carga de mapeos...")
mappings_data = [
    {'sku_antiguo': 'ABC123', 'sku_nuevo': 'NEW001'},
    {'sku_antiguo': 'DEF456', 'sku_nuevo': 'NEW002'},
    {'sku_antiguo': 'GHI789', 'sku_nuevo': 'NEW003'}
]

result = bulk_create_sku_mappings(db, mappings_data, user.id)

print(f"\nResultado:")
print(f"  Creados: {result['creados']}")
print(f"  Actualizados: {result['actualizados']}")
print(f"  Errores: {result['errores']}")

if result['detalles_errores']:
    print(f"\nErrores:")
    for error in result['detalles_errores']:
        print(f"  - {error}")

# Verificar mapeos creados
from backend.crud import get_all_sku_mappings
mappings = get_all_sku_mappings(db)
print(f"\nTotal mapeos en BD: {len(mappings)}")
for m in mappings[:5]:
    print(f"  {m.sku_antiguo} -> {m.sku_nuevo} (activo: {m.activo})")

db.close()
print("\nOK: Prueba completada exitosamente")
