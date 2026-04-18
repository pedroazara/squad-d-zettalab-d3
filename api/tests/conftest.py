import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from models.entities import Base
from db import get_db
from main import app
from services.auth_service import hash_password, create_user


@pytest.fixture(scope="function")
def test_db_engine(tmp_path):
    """Create a temporary SQLite database for each test."""
    database_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
    )
    # Criar todas as tabelas
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def test_db_session(test_db_engine):
    """Create a test database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    session = SessionLocal()
    
    yield session
    
    session.close()


@pytest.fixture(scope="function")
def client(test_db_engine):
    """Create FastAPI test client with overridden database."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)

    def _override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(test_db_session):
    """Create an admin user in the test database."""
    from models.entities import User
    
    user = User(
        name="Admin User",
        email="admin@example.com",
        organization="Test Org",
        role="administrador",
        password_hash=hash_password("admin123"),
        active=True,
    )
    test_db_session.add(user)
    test_db_session.commit()
    test_db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def brigadista_user(test_db_session):
    """Create a brigadista user in the test database."""
    from models.entities import User
    
    user = User(
        name="Brigadista User",
        email="brigadista@example.com",
        organization="Test Org",
        role="brigadista",
        password_hash=hash_password("brig123"),
        active=True,
    )
    test_db_session.add(user)
    test_db_session.commit()
    test_db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_token(client, admin_user):
    """Get JWT token for admin user."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    return data["token"]


@pytest.fixture(scope="function")
def brigadista_token(client, brigadista_user):
    """Get JWT token for brigadista user."""
    response = client.post(
        "/auth/login",
        json={"email": "brigadista@example.com", "password": "brig123"},
    )
    assert response.status_code == 200
    data = response.json()
    return data["token"]
