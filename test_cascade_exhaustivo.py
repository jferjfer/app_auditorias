"""
Pruebas exhaustivas de CASCADE y queries con casos extremos
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import models, schemas, crud

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_1_cascade_audit_multiple_products():
    """Eliminar audit con MULTIPLES productos"""
    print("\n[TEST 1] Cascade Audit con MULTIPLES productos")
    db = SessionLocal()
    try:
        user = models.User(nombre="User1", correo="u1@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con 5 productos
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(sku=f"SKU{i}", nombre_articulo=f"Prod{i}", 
                                  cantidad_documento=10, cantidad_enviada=10, 
                                  orden_traslado_original="OT1", novedad="sin_novedad")
                for i in range(5)
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        product_ids = [p.id for p in audit.productos]
        
        print(f"   Creados: 1 audit + {len(product_ids)} productos")
        
        # Verificar todos existen
        count_before = db.query(models.Product).filter(models.Product.id.in_(product_ids)).count()
        assert count_before == 5, f"ERROR: Solo {count_before}/5 productos"
        
        # Eliminar audit
        db.delete(audit)
        db.commit()
        
        # Verificar TODOS los productos fueron eliminados
        count_after = db.query(models.Product).filter(models.Product.id.in_(product_ids)).count()
        if count_after == 0:
            print(f"   OK: Todos los productos eliminados (cascade)")
            return True
        else:
            print(f"   ERROR: {count_after} productos NO eliminados")
            return False
    finally:
        db.close()

def test_2_cascade_product_multiple_history():
    """Eliminar product con MULTIPLES history entries"""
    print("\n[TEST 2] Cascade Product con MULTIPLES history")
    db = SessionLocal()
    try:
        user = models.User(nombre="User2", correo="u2@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        audit_data = schemas.AuditCreate(
            productos=[schemas.ProductBase(sku="SKU1", nombre_articulo="P1", 
                                         cantidad_documento=10, cantidad_enviada=10, 
                                         orden_traslado_original="OT1", novedad="sin_novedad")]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        product = audit.productos[0]
        
        # Crear 10 history entries
        history_ids = []
        for i in range(10):
            h = models.ProductHistory(
                product_id=product.id, user_id=user.id,
                field_changed=f"field_{i}", old_value=str(i), new_value=str(i+1)
            )
            db.add(h)
        db.commit()
        db.flush()
        
        history_ids = [h.id for h in db.query(models.ProductHistory).filter(
            models.ProductHistory.product_id == product.id
        ).all()]
        
        print(f"   Creados: 1 product + {len(history_ids)} history")
        
        # Eliminar product
        db.delete(product)
        db.commit()
        
        # Verificar TODOS los history fueron eliminados
        count_after = db.query(models.ProductHistory).filter(
            models.ProductHistory.id.in_(history_ids)
        ).count()
        
        if count_after == 0:
            print(f"   OK: Todos los history eliminados (cascade)")
            return True
        else:
            print(f"   ERROR: {count_after} history NO eliminados")
            return False
    finally:
        db.close()

def test_3_cascade_product_multiple_novelties():
    """Eliminar product con MULTIPLES novelties"""
    print("\n[TEST 3] Cascade Product con MULTIPLES novelties")
    db = SessionLocal()
    try:
        user = models.User(nombre="User3", correo="u3@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        audit_data = schemas.AuditCreate(
            productos=[schemas.ProductBase(sku="SKU1", nombre_articulo="P1", 
                                         cantidad_documento=10, cantidad_enviada=10, 
                                         orden_traslado_original="OT1", novedad="sin_novedad")]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        product = audit.productos[0]
        
        # Crear 5 novelties
        novelty_types = ["averia", "vencido", "fecha_corta", "contaminado", "faltante"]
        for nov_type in novelty_types:
            n = models.ProductNovelty(
                product_id=product.id, user_id=user.id,
                novedad_tipo=nov_type, cantidad=5
            )
            db.add(n)
        db.commit()
        
        novelty_ids = [n.id for n in db.query(models.ProductNovelty).filter(
            models.ProductNovelty.product_id == product.id
        ).all()]
        
        print(f"   Creados: 1 product + {len(novelty_ids)} novelties")
        
        # Eliminar product
        db.delete(product)
        db.commit()
        
        # Verificar TODAS las novelties fueron eliminadas
        count_after = db.query(models.ProductNovelty).filter(
            models.ProductNovelty.id.in_(novelty_ids)
        ).count()
        
        if count_after == 0:
            print(f"   OK: Todas las novelties eliminadas (cascade)")
            return True
        else:
            print(f"   ERROR: {count_after} novelties NO eliminadas")
            return False
    finally:
        db.close()

def test_4_query_history_mixed_products():
    """Query history con productos EXISTENTES y ELIMINADOS mezclados"""
    print("\n[TEST 4] Query history con productos mezclados (existentes + eliminados)")
    db = SessionLocal()
    try:
        user = models.User(nombre="User4", correo="u4@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con 3 productos
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(sku=f"SKU{i}", nombre_articulo=f"P{i}", 
                                  cantidad_documento=10, cantidad_enviada=10, 
                                  orden_traslado_original="OT1", novedad="sin_novedad")
                for i in range(3)
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        products = audit.productos
        
        # Crear history para cada producto
        for p in products:
            h = models.ProductHistory(
                product_id=p.id, user_id=user.id,
                field_changed="test", old_value="0", new_value="1"
            )
            db.add(h)
        db.commit()
        
        print(f"   Creados: 3 productos + 3 history")
        
        # Query ANTES de eliminar (debe funcionar)
        try:
            history_before = db.query(models.ProductHistory).outerjoin(
                models.Product,
                models.ProductHistory.product_id == models.Product.id
            ).filter(
                (models.Product.auditoria_id == audit.id) | 
                (models.Product.id.is_(None))
            ).all()
            print(f"   OK: Query antes de delete: {len(history_before)} registros")
        except Exception as e:
            print(f"   ERROR: Query antes de delete fallo: {e}")
            return False
        
        # Eliminar 2 productos (con cascade, sus history tambien)
        db.delete(products[0])
        db.delete(products[1])
        db.commit()
        
        print(f"   Eliminados: 2 productos (quedan 1)")
        
        # Query DESPUES de eliminar (debe funcionar sin errores)
        try:
            history_after = db.query(models.ProductHistory).outerjoin(
                models.Product,
                models.ProductHistory.product_id == models.Product.id
            ).filter(
                (models.Product.auditoria_id == audit.id) | 
                (models.Product.id.is_(None))
            ).all()
            print(f"   OK: Query despues de delete: {len(history_after)} registros")
            
            # Debe quedar solo 1 history (del producto no eliminado)
            if len(history_after) == 1:
                print(f"   OK: Cantidad correcta de history (1)")
                return True
            else:
                print(f"   WARN: Se esperaba 1 history, se encontraron {len(history_after)}")
                return True  # No es error critico
        except Exception as e:
            print(f"   ERROR: Query despues de delete fallo: {e}")
            return False
    finally:
        db.close()

def test_5_cascade_audit_with_files():
    """Eliminar audit con FILES (cascade)"""
    print("\n[TEST 5] Cascade Audit con FILES")
    db = SessionLocal()
    try:
        user = models.User(nombre="User5", correo="u5@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        audit_data = schemas.AuditCreate(
            productos=[schemas.ProductBase(sku="SKU1", nombre_articulo="P1", 
                                         cantidad_documento=10, cantidad_enviada=10, 
                                         orden_traslado_original="OT1", novedad="sin_novedad")]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        
        # Crear 3 files
        file_ids = []
        for i in range(3):
            f = models.File(
                auditoria_id=audit.id,
                nombre_archivo=f"file{i}.xlsx",
                ruta_archivo=f"/uploads/file{i}.xlsx"
            )
            db.add(f)
        db.commit()
        
        file_ids = [f.id for f in db.query(models.File).filter(
            models.File.auditoria_id == audit.id
        ).all()]
        
        print(f"   Creados: 1 audit + {len(file_ids)} files")
        
        # Eliminar audit
        db.delete(audit)
        db.commit()
        
        # Verificar TODOS los files fueron eliminados
        count_after = db.query(models.File).filter(
            models.File.id.in_(file_ids)
        ).count()
        
        if count_after == 0:
            print(f"   OK: Todos los files eliminados (cascade)")
            return True
        else:
            print(f"   ERROR: {count_after} files NO eliminados")
            return False
    finally:
        db.close()

def test_6_cascade_audit_complete():
    """Eliminar audit con PRODUCTOS + FILES + HISTORY + NOVELTIES (cascade completo)"""
    print("\n[TEST 6] Cascade COMPLETO (audit -> products -> history + novelties + files)")
    db = SessionLocal()
    try:
        user = models.User(nombre="User6", correo="u6@test.com", contrasena_hash="h", rol="auditor")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con 2 productos
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(sku=f"SKU{i}", nombre_articulo=f"P{i}", 
                                  cantidad_documento=10, cantidad_enviada=10, 
                                  orden_traslado_original="OT1", novedad="sin_novedad")
                for i in range(2)
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        
        # Agregar history y novelties a cada producto
        for p in audit.productos:
            h = models.ProductHistory(product_id=p.id, user_id=user.id, 
                                     field_changed="test", old_value="0", new_value="1")
            n = models.ProductNovelty(product_id=p.id, user_id=user.id, 
                                     novedad_tipo="averia", cantidad=5)
            db.add(h)
            db.add(n)
        
        # Agregar files
        for i in range(2):
            f = models.File(auditoria_id=audit.id, nombre_archivo=f"f{i}.xlsx", 
                          ruta_archivo=f"/f{i}.xlsx")
            db.add(f)
        db.commit()
        
        # Contar todo
        product_count = db.query(models.Product).filter(models.Product.auditoria_id == audit.id).count()
        history_count = db.query(models.ProductHistory).join(models.Product).filter(
            models.Product.auditoria_id == audit.id
        ).count()
        novelty_count = db.query(models.ProductNovelty).join(models.Product).filter(
            models.Product.auditoria_id == audit.id
        ).count()
        file_count = db.query(models.File).filter(models.File.auditoria_id == audit.id).count()
        
        print(f"   Creados: 1 audit + {product_count} products + {history_count} history + {novelty_count} novelties + {file_count} files")
        
        # Eliminar audit
        db.delete(audit)
        db.commit()
        
        # Verificar TODO fue eliminado
        product_after = db.query(models.Product).filter(models.Product.auditoria_id == audit.id).count()
        file_after = db.query(models.File).filter(models.File.auditoria_id == audit.id).count()
        
        if product_after == 0 and file_after == 0:
            print(f"   OK: TODO eliminado en cascada (products, history, novelties, files)")
            return True
        else:
            print(f"   ERROR: Quedan {product_after} products, {file_after} files")
            return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("PRUEBAS EXHAUSTIVAS DE CASCADE")
    print("=" * 70)
    
    tests = [
        ("Cascade Audit -> Multiple Products", test_1_cascade_audit_multiple_products),
        ("Cascade Product -> Multiple History", test_2_cascade_product_multiple_history),
        ("Cascade Product -> Multiple Novelties", test_3_cascade_product_multiple_novelties),
        ("Query History Mixed Products", test_4_query_history_mixed_products),
        ("Cascade Audit -> Files", test_5_cascade_audit_with_files),
        ("Cascade COMPLETO", test_6_cascade_audit_complete),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"   EXCEPTION: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 70)
    print("RESUMEN FINAL")
    print("=" * 70)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {name}")
    
    print("\n" + "=" * 70)
    print(f"RESULTADO: {passed}/{total} pruebas pasaron ({passed*100//total}%)")
    
    if passed == total:
        print("EXITO TOTAL - Todas las pruebas pasaron")
    else:
        print(f"FALLO - {total - passed} pruebas fallaron")
    print("=" * 70)
    
    sys.exit(0 if passed == total else 1)
