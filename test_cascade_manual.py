"""
Script manual para probar cascades sin TestClient
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import models, schemas, crud

# Crear BD en memoria
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_cascade_audit_products():
    """Prueba que eliminar audit elimina productos (cascade)"""
    print("\nTEST 1: Cascade Audit -> Products")
    db = SessionLocal()
    
    try:
        # Crear usuario
        user = models.User(
            nombre="Test User",
            correo="test@test.com",
            contrasena_hash="hash",
            rol="auditor"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con productos
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(
                    sku="TEST123",
                    nombre_articulo="Test Product",
                    cantidad_documento=10,
                    cantidad_enviada=10,
                    orden_traslado_original="OT-999",
                    novedad="sin_novedad"
                )
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        audit_id = audit.id
        product_id = audit.productos[0].id
        
        print(f"   OK Audit creado: ID={audit_id}")
        print(f"   OK Product creado: ID={product_id}")
        
        # Verificar producto existe
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        assert product is not None, "ERROR Producto no encontrado"
        print(f"   OK Producto verificado en BD")
        
        # Eliminar audit
        db.delete(audit)
        db.commit()
        print(f"   OK Audit eliminado")
        
        # Verificar producto fue eliminado (cascade)
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if product is None:
            print(f"   OK CASCADE FUNCIONA: Producto eliminado automaticamente")
            return True
        else:
            print(f"   ERROR CASCADE FALLA: Producto aun existe")
            return False
            
    finally:
        db.close()

def test_cascade_product_history():
    """Prueba que eliminar product elimina history (cascade)"""
    print("\nTEST 2: Cascade Product -> History")
    db = SessionLocal()
    
    try:
        # Crear usuario
        user = models.User(
            nombre="Test User 2",
            correo="test2@test.com",
            contrasena_hash="hash",
            rol="auditor"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con producto
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(
                    sku="TEST456",
                    nombre_articulo="Test Product 2",
                    cantidad_documento=10,
                    cantidad_enviada=10,
                    orden_traslado_original="OT-888",
                    novedad="sin_novedad"
                )
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        product = audit.productos[0]
        
        print(f"   OK Product creado: ID={product.id}")
        
        # Crear history entry
        history = models.ProductHistory(
            product_id=product.id,
            user_id=user.id,
            field_changed="cantidad_fisica",
            old_value="10",
            new_value="15"
        )
        db.add(history)
        db.commit()
        history_id = history.id
        
        print(f"   OK History creado: ID={history_id}")
        
        # Verificar history existe
        hist = db.query(models.ProductHistory).filter(models.ProductHistory.id == history_id).first()
        assert hist is not None, "ERROR History no encontrado"
        print(f"   OK History verificado en BD")
        
        # Eliminar product
        db.delete(product)
        db.commit()
        print(f"   OK Product eliminado")
        
        # Verificar history fue eliminado (cascade)
        hist = db.query(models.ProductHistory).filter(models.ProductHistory.id == history_id).first()
        if hist is None:
            print(f"   OK CASCADE FUNCIONA: History eliminado automaticamente")
            return True
        else:
            print(f"   ERROR CASCADE FALLA: History aun existe")
            return False
            
    finally:
        db.close()

def test_collaboration_history_query():
    """Prueba que el query de collaboration history no falla con productos eliminados"""
    print("\nTEST 3: Collaboration History Query con productos eliminados")
    db = SessionLocal()
    
    try:
        # Crear usuario
        user = models.User(
            nombre="Test User 3",
            correo="test3@test.com",
            contrasena_hash="hash",
            rol="auditor"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crear audit con producto
        audit_data = schemas.AuditCreate(
            productos=[
                schemas.ProductBase(
                    sku="TEST789",
                    nombre_articulo="Test Product 3",
                    cantidad_documento=10,
                    cantidad_enviada=10,
                    orden_traslado_original="OT-777",
                    novedad="sin_novedad"
                )
            ]
        )
        audit = crud.create_audit(db, audit_data, user.id)
        product = audit.productos[0]
        
        print(f"   OK Audit y Product creados")
        
        # Crear history entry
        history = models.ProductHistory(
            product_id=product.id,
            user_id=user.id,
            field_changed="cantidad_fisica",
            old_value="10",
            new_value="15"
        )
        db.add(history)
        db.commit()
        
        print(f"   OK History creado")
        
        # Query original (el que tenia el bug)
        try:
            history_old = db.query(models.ProductHistory).outerjoin(models.Product).filter(
                models.Product.auditoria_id == audit.id
            ).all()
            print(f"   OK Query original funciona: {len(history_old)} registros")
        except Exception as e:
            print(f"   WARN Query original falla: {e}")
        
        # Query mejorado
        try:
            history_new = db.query(models.ProductHistory).outerjoin(
                models.Product,
                models.ProductHistory.product_id == models.Product.id
            ).filter(
                (models.Product.auditoria_id == audit.id) | 
                (models.Product.id.is_(None))
            ).all()
            print(f"   OK Query mejorado funciona: {len(history_new)} registros")
        except Exception as e:
            print(f"   ERROR Query mejorado falla: {e}")
            return False
        
        # Eliminar producto (con cascade, history tambien se elimina)
        db.delete(product)
        db.commit()
        print(f"   OK Product eliminado (history tambien por cascade)")
        
        # Intentar query mejorado de nuevo (no deberia fallar)
        try:
            history_after = db.query(models.ProductHistory).outerjoin(
                models.Product,
                models.ProductHistory.product_id == models.Product.id
            ).filter(
                (models.Product.auditoria_id == audit.id) | 
                (models.Product.id.is_(None))
            ).all()
            print(f"   OK Query mejorado funciona despues de delete: {len(history_after)} registros")
            return True
        except Exception as e:
            print(f"   ERROR Query mejorado falla despues de delete: {e}")
            return False
            
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("PRUEBAS DE CASCADE Y COLLABORATION HISTORY")
    print("=" * 60)
    
    results = []
    
    results.append(("Cascade Audit -> Products", test_cascade_audit_products()))
    results.append(("Cascade Product -> History", test_cascade_product_history()))
    results.append(("Collaboration History Query", test_collaboration_history_query()))
    
    print("\n" + "=" * 60)
    print("RESUMEN DE RESULTADOS")
    print("=" * 60)
    
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status} - {name}")
    
    all_passed = all(r[1] for r in results)
    print("\n" + "=" * 60)
    if all_passed:
        print("TODAS LAS PRUEBAS PASARON")
    else:
        print("ALGUNAS PRUEBAS FALLARON")
    print("=" * 60)
    
    sys.exit(0 if all_passed else 1)
