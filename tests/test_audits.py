from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend import crud, schemas

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
                "orden_traslado_original": "OT-123"
            }
        ]
    }
    
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 200
    data = response.json()
    assert data["ubicacion_destino"] == audit_in["ubicacion_destino"]
    assert data["auditor_id"] == test_user.id
    assert len(data["productos"]) == 1
    assert data["productos"][0]["sku"] == audit_in["productos"][0]["sku"]

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
        "productos": []
    }
    test_client.post("/api/audits/", headers=headers, json=audit_in)
    
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
        "productos": []
    }
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 200
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
        "productos": []
    }
    response = test_client.post("/api/audits/", headers=headers, json=audit_in)
    assert response.status_code == 200
    audit_id = response.json()["id"]
    
    response = test_client.put(f"/api/audits/{audit_id}/iniciar", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["estado"] == "en_progreso"
