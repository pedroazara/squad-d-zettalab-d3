import pytest


class TestListUsers:
    """Tests for GET /users endpoint."""
    
    def test_list_users_as_admin(self, client, admin_token, brigadista_user):
        """Test listing users as admin."""
        response = client.get(
            "/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2  # admin + brigadista
    
    def test_list_users_without_permission(self, client, brigadista_token):
        """Test listing users without permission."""
        response = client.get(
            "/users",
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 403
    
    def test_list_users_unauthenticated(self, client):
        """Test listing users without authentication."""
        response = client.get("/users")
        assert response.status_code == 401
    
    def test_list_users_pagination(self, client, admin_token, test_db_session):
        """Test pagination in user list."""
        # Create multiple users
        from models.entities import User
        from services.auth_service import hash_password
        
        for i in range(5):
            user = User(
                name=f"User {i}",
                email=f"user{i}@example.com",
                organization="Test Org",
                role="brigadista",
                password_hash=hash_password("pass123"),
                active=True,
            )
            test_db_session.add(user)
        test_db_session.commit()
        
        # Test with limit
        response = client.get(
            "/users?limit=3&offset=0",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 3


class TestUpdateUser:
    """Tests for PATCH /users/{id} endpoint."""
    
    def test_update_user_name(self, client, admin_token, admin_user):
        """Test updating user name."""
        response = client.patch(
            f"/users/{admin_user.id}",
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
    
    def test_update_user_organization(self, client, admin_token, brigadista_user):
        """Test updating user organization."""
        response = client.patch(
            f"/users/{brigadista_user.id}",
            json={"organization": "New Organization"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["organization"] == "New Organization"
    
    def test_update_user_role(self, client, admin_token, brigadista_user):
        """Test updating user role."""
        response = client.patch(
            f"/users/{brigadista_user.id}",
            json={"role": "coordenacao"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "coordenacao"
    
    def test_update_own_role_blocked(self, client, admin_token, admin_user):
        """Test that user cannot promote themselves."""
        response = client.patch(
            f"/users/{admin_user.id}",
            json={"role": "coordenacao"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 403
    
    def test_update_nonexistent_user(self, client, admin_token):
        """Test updating non-existent user."""
        response = client.patch(
            "/users/9999",
            json={"name": "Updated"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404
    
    def test_update_user_without_permission(self, client, brigadista_token, admin_user):
        """Test updating user without permission."""
        response = client.patch(
            f"/users/{admin_user.id}",
            json={"name": "Updated"},
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 403


class TestDeactivateUser:
    """Tests for deactivating users."""
    
    def test_deactivate_user(self, client, admin_token, brigadista_user, test_db_session):
        """Test deactivating a user."""
        response = client.patch(
            f"/users/{brigadista_user.id}",
            json={"active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == brigadista_user.role
        test_db_session.refresh(brigadista_user)
        assert brigadista_user.active is False
    
    def test_deactivate_own_user_blocked(self, client, admin_token, admin_user):
        """Test that user cannot deactivate themselves."""
        response = client.patch(
            f"/users/{admin_user.id}",
            json={"active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 403
    
    def test_reactivate_user(self, client, admin_token, test_db_session):
        """Test reactivating an inactive user."""
        from models.entities import User
        from services.auth_service import hash_password
        
        # Create and deactivate user
        user = User(
            name="Temp User",
            email="temp@example.com",
            organization="Test Org",
            role="brigadista",
            password_hash=hash_password("pass123"),
            active=False,
        )
        test_db_session.add(user)
        test_db_session.commit()
        
        # Reactivate
        response = client.patch(
            f"/users/{user.id}",
            json={"active": True},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "brigadista"
        test_db_session.refresh(user)
        assert user.active is True
    
    def test_inactive_user_cannot_login(self, client, test_db_session):
        """Test that inactive user cannot login."""
        from models.entities import User
        from services.auth_service import hash_password
        
        # Create and deactivate user
        user = User(
            name="Inactive User",
            email="inactive_test@example.com",
            organization="Test Org",
            role="brigadista",
            password_hash=hash_password("pass123"),
            active=False,
        )
        test_db_session.add(user)
        test_db_session.commit()
        
        # Try to login
        response = client.post(
            "/auth/login",
            json={"email": "inactive_test@example.com", "password": "pass123"},
        )
        assert response.status_code == 401
    
    def test_reactivated_user_can_login(self, client, admin_token, test_db_session):
        """Test that reactivated user can login."""
        from models.entities import User
        from services.auth_service import hash_password
        
        # Create inactive user
        user = User(
            name="Reactive User",
            email="reactive@example.com",
            organization="Test Org",
            role="brigadista",
            password_hash=hash_password("pass123"),
            active=False,
        )
        test_db_session.add(user)
        test_db_session.commit()
        
        # Reactivate via PATCH
        response = client.patch(
            f"/users/{user.id}",
            json={"active": True},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        
        # Try to login
        response = client.post(
            "/auth/login",
            json={"email": "reactive@example.com", "password": "pass123"},
        )
        assert response.status_code == 200
        assert "token" in response.json()
