from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend import crud, schemas

def test_create_user(test_client: TestClient, db_session: Session, admin_user: schemas.User):
    """
    Test creating a new user as an administrator.
    """
    login_data = {
        "username": admin_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    user_in = {
        "correo": "test_create@example.com",
        "nombre": "Test Create User",
        "rol": "auditor",
        "contrasena": "testpassword"
    }
    response = test_client.post("/api/users/", headers=headers, json=user_in)
    assert response.status_code == 201
    data = response.json()
    assert data["correo"] == user_in["correo"]
    assert data["nombre"] == user_in["nombre"]
    assert data["rol"] == user_in["rol"]
    assert "id" in data
    
    user_db = crud.get_user_by_email(db_session, email=user_in["correo"])
    assert user_db is not None


def test_login_for_access_token(test_client: TestClient, test_user: schemas.User):
    """
    Test user login and token generation.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_read_current_user(test_client: TestClient, test_user: schemas.User):
    """
    Test fetching the current user.
    """
    login_data = {
        "username": test_user.correo,
        "password": "testpassword"
    }
    response = test_client.post("/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = test_client.get("/api/users/me/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["correo"] == test_user.correo
    assert data["nombre"] == test_user.nombre
    assert data["rol"] == test_user.rol
