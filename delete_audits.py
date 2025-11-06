from backend.database import SessionLocal
from backend.models import Audit

db = SessionLocal()
try:
    count = db.query(Audit).count()
    print(f"📊 Auditorías encontradas: {count}")
    
    if count > 0:
        confirm = input(f"⚠️  ¿Estás seguro de eliminar {count} auditorías? (escribe 'SI' para confirmar): ")
        if confirm == 'SI':
            db.query(Audit).delete()
            db.commit()
            print("✅ Todas las auditorías eliminadas exitosamente")
        else:
            print("❌ Operación cancelada")
    else:
        print("ℹ️  No hay auditorías para eliminar")
except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
finally:
    db.close()
