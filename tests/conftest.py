# tests/conftest.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import Base, get_db
from backend import crud, schemas
from backend.services.auth_service import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """
    Create a new database session for a test.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_client(db_session):
    """
    Create a test client that uses the override_get_db fixture.
    """
    def override_get_db_for_client():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db_for_client
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}


@pytest.fixture(scope="function")
def test_user(db_session):
    """
    Create a test user in the database.
    """
    user_in = schemas.UserCreate(
        correo="test@example.com",
        nombre="Test User",
        rol="auditor",
        contrasena="testpassword"
    )
    return crud.create_user(db=db_session, user=user_in)


@pytest.fixture(scope="function")
def admin_user(db_session):
    """
    Create a test admin user in the database.
    """
    user_in = schemas.UserCreate(
        correo="admin@example.com",
        nombre="Admin User",
        rol="administrador",
        contrasena="testpassword"
    )
    return crud.create_user(db=db_session, user=user_in)
