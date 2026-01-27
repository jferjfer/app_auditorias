from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend import crud, schemas, models

def test_create_audit(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test creating a new audit.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    audit_in = {
        "ubicacion_destino": "Test Location",
        "productos": [
            {
                "sku": "12345",
                "nombre_articulo": "Test Product",
                "cantidad_documento": 10,
                "cantidad_enviada": 10,
                "orden_traslado_original": "OT-123",
                "novedad": "sin_novedad"
            }
        ]
    }
    
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 201
    data = response.json()
    assert data["ubicacion_destino"] == audit_in["ubicacion_destino"]
    assert data["auditor_id"] == test_user.id
    assert data["productos_count"] == 1

def test_get_audits(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test getting all audits.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create an audit first
    audit_in = {
        "ubicacion_destino": "Test Location",
        "productos": [
            {
                "sku": "12345",
                "nombre_articulo": "Test Product",
                "cantidad_documento": 10,
                "cantidad_enviada": 10,
                "orden_traslado_original": "OT-123",
                "novedad": "sin_novedad"
            }
        ]
    }
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 201
    
    response = test_client.get("/api/audits/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["ubicacion_destino"] == audit_in["ubicacion_destino"]

def test_get_audit_by_id(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test getting a specific audit by ID.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create an audit first
    audit_in = {
        "ubicacion_destino": "Specific Test Location",
        "productos": [
            {
                "sku": "12345",
                "nombre_articulo": "Test Product",
                "cantidad_documento": 10,
                "cantidad_enviada": 10,
                "orden_traslado_original": "OT-123",
                "novedad": "sin_novedad"
            }
        ]
    }
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 201
    audit_id = response.json()["id"]
    
    response = test_client.get(f"/api/audits/{audit_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == audit_id
    assert data["ubicacion_destino"] == audit_in["ubicacion_destino"]

def test_iniciar_auditoria(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test starting an audit.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create an audit first
    audit_in = {
        "ubicacion_destino": "Test Location for Starting",
        "productos": [
            {
                "sku": "12345",
                "nombre_articulo": "Test Product",
                "cantidad_documento": 10,
                "cantidad_enviada": 10,
                "orden_traslado_original": "OT-123",
                "novedad": "sin_novedad"
            }
        ]
    }
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 201
    audit_id = response.json()["id"]
    
    response = test_client.put(f"/api/audits/{audit_id}/iniciar", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["estado"] == "en_progreso"

def test_cascade_delete_audit_products(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test that deleting an audit cascades to products.
    """
    # Create audit with products
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
    audit = crud.create_audit(db_session, audit_data, test_user.id)
    audit_id = audit.id
    product_id = audit.productos[0].id
    
    # Verify product exists
    product = db_session.query(models.Product).filter(models.Product.id == product_id).first()
    assert product is not None
    
    # Delete audit
    db_session.delete(audit)
    db_session.commit()
    
    # Verify product was deleted (cascade)
    product = db_session.query(models.Product).filter(models.Product.id == product_id).first()
    assert product is None

def test_cascade_delete_product_history(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test that deleting a product cascades to history.
    """
    # Create audit with product
    audit_data = schemas.AuditCreate(
        productos=[
            schemas.ProductBase(
                sku="TEST456",
                nombre_articulo="Test Product",
                cantidad_documento=10,
                cantidad_enviada=10,
                orden_traslado_original="OT-888",
                novedad="sin_novedad"
            )
        ]
    )
    audit = crud.create_audit(db_session, audit_data, test_user.id)
    product = audit.productos[0]
    
    # Create history entry
    history = models.ProductHistory(
        product_id=product.id,
        user_id=test_user.id,
        field_changed="cantidad_fisica",
        old_value="10",
        new_value="15"
    )
    db_session.add(history)
    db_session.commit()
    history_id = history.id
    
    # Verify history exists
    hist = db_session.query(models.ProductHistory).filter(models.ProductHistory.id == history_id).first()
    assert hist is not None
    
    # Delete product
    db_session.delete(product)
    db_session.commit()
    
    # Verify history was deleted (cascade)
    hist = db_session.query(models.ProductHistory).filter(models.ProductHistory.id == history_id).first()
    assert hist is None

def test_collaboration_history_with_deleted_product(test_client: TestClient, db_session: Session, test_user: schemas.User):
    """
    Test that collaboration history endpoint handles deleted products correctly.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create audit with product
    audit_data = schemas.AuditCreate(
        productos=[
            schemas.ProductBase(
                sku="TEST789",
                nombre_articulo="Test Product",
                cantidad_documento=10,
                cantidad_enviada=10,
                orden_traslado_original="OT-777",
                novedad="sin_novedad"
            )
        ]
    )
    audit = crud.create_audit(db_session, audit_data, test_user.id)
    product = audit.productos[0]
    
    # Create history entry
    history = models.ProductHistory(
        product_id=product.id,
        user_id=test_user.id,
        field_changed="cantidad_fisica",
        old_value="10",
        new_value="15"
    )
    db_session.add(history)
    db_session.commit()
    
    # Get history (should work)
    response = test_client.get(f"/api/collaboration/{audit.id}/history", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["sku"] == "TEST789"
    
    # Delete product (history should remain but show "Producto eliminado")
    db_session.delete(product)
    db_session.commit()
    
    # Get history again (should still work with deleted product)
    response = test_client.get(f"/api/collaboration/{audit.id}/history", headers=headers)
    assert response.status_code == 200
    # Note: With cascade, history is deleted too, so this will be empty
    # This test verifies the query doesn't crash