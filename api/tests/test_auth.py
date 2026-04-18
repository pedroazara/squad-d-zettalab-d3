import pytest


class TestAuthLogin:
    """Tests for POST /auth/login endpoint."""
    
    def test_login_success(self, client, admin_user):
        """Test successful login with valid credentials."""
        response = client.post(
            "/auth/login",
            json={"email": "admin@example.com", "password": "admin123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "message" in data
        assert data["message"] == "Login realizado com sucesso"
    
    def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )
        assert response.status_code == 401
    
    def test_login_invalid_password(self, client, admin_user):
        """Test login with invalid password."""
        response = client.post(
            "/auth/login",
            json={"email": "admin@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
    
    def test_login_inactive_user(self, client, test_db_session):
        """Test login with inactive user."""
        from models.entities import User
        from services.auth_service import hash_password
        
        inactive_user = User(
            name="Inactive User",
            email="inactive@example.com",
            organization="Test Org",
            role="brigadista",
            password_hash=hash_password("pass123"),
            active=False,
        )
        test_db_session.add(inactive_user)
        test_db_session.commit()
        
        response = client.post(
            "/auth/login",
            json={"email": "inactive@example.com", "password": "pass123"},
        )
        assert response.status_code == 401


class TestAuthRegister:
    """Tests for POST /auth/register endpoint."""
    
    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post(
            "/auth/register",
            json={
                "name": "New User",
                "email": "newuser@example.com",
                "organization": "New Org",
                "role": "brigadista",
                "password": "newpass123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Cadastro realizado com sucesso"
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["name"] == "New User"
        assert data["user"]["role"] == "brigadista"
    
    def test_register_duplicate_email(self, client, admin_user):
        """Test registration with existing email."""
        response = client.post(
            "/auth/register",
            json={
                "name": "Another User",
                "email": "admin@example.com",
                "organization": "Test Org",
                "role": "brigadista",
                "password": "pass123",
            },
        )
        assert response.status_code == 409
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format."""
        response = client.post(
            "/auth/register",
            json={
                "name": "New User",
                "email": "not-an-email",
                "organization": "Test Org",
                "role": "brigadista",
                "password": "pass123",
            },
        )
        assert response.status_code == 422

    def test_register_admin_role_forbidden(self, client):
        """Test that public registration cannot create administrator users."""
        response = client.post(
            "/auth/register",
            json={
                "name": "Admin User",
                "email": "admin.new@example.com",
                "organization": "Test Org",
                "role": "administrador",
                "password": "pass123",
            },
        )
        assert response.status_code == 422


class TestAuthMe:
    """Tests for GET /auth/me endpoint."""
    
    def test_get_me_authenticated(self, client, admin_token):
        """Test retrieving current user data when authenticated."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@example.com"
        assert data["name"] == "Admin User"
    
    def test_get_me_unauthenticated(self, client):
        """Test retrieving current user data without authentication."""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_get_me_invalid_token(self, client):
        """Test retrieving current user data with invalid token."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401


class TestAuthPermissions:
    """Tests for permissions endpoints."""
    
    def test_get_permissions(self, client, admin_token):
        """Test retrieving permissions for current user."""
        response = client.get(
            "/auth/me/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "users.read" in data
    
    def test_check_permission_allowed(self, client, admin_token):
        """Test checking if user has specific permission."""
        response = client.get(
            "/auth/permissions/reports-review",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
    
    def test_check_permission_denied(self, client, brigadista_token):
        """Test checking permission that user doesn't have."""
        response = client.get(
            "/auth/permissions/reports-review",
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 403
