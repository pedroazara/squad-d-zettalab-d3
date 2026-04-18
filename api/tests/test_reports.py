import pytest


class TestCreateFireReport:
    """Tests for POST /reports/fire endpoint."""
    
    def test_create_report_success(self, client, brigadista_token):
        """Test successful fire report creation."""
        response = client.post(
            "/reports/fire",
            json={
                "location": "Cerrado - Brasília",
                "description": "Fire detected in forest area",
                "phone": "61999999999",
                "reporter_name": "John Doe",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["location"] == "Cerrado - Brasília"
        assert data["status"] in ["recebido", "pendente"]  # Accept either status
    
    def test_create_report_without_reporter_name(self, client, brigadista_token):
        """Test creating report without reporter name (optional field)."""
        response = client.post(
            "/reports/fire",
            json={
                "location": "Cerrado - Brasília",
                "description": "Fire detected",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["location"] == "Cerrado - Brasília"
    
    def test_create_report_missing_required_fields(self, client, brigadista_token):
        """Test creating report with missing required fields."""
        response = client.post(
            "/reports/fire",
            json={
                "location": "Cerrado - Brasília",
                # missing description and phone
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 422


class TestListFireReports:
    """Tests for GET /reports/fire endpoint."""
    
    def test_list_reports_empty(self, client, brigadista_token):
        """Test listing reports when none exist."""
        response = client.get("/reports/fire", headers={"Authorization": f"Bearer {brigadista_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    def test_list_reports_with_data(self, client, brigadista_token):
        """Test listing reports with existing data."""
        # Create multiple reports
        for i in range(3):
            response = client.post(
                "/reports/fire",
                json={
                    "location": f"Location {i}",
                    "description": f"Fire detected in area {i}",
                    "phone": "61999999999",
                },
                headers={"Authorization": f"Bearer {brigadista_token}"},
            )
            assert response.status_code == 201
        
        # List reports
        response = client.get("/reports/fire", headers={"Authorization": f"Bearer {brigadista_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_list_reports_pagination(self, client, brigadista_token):
        """Test pagination in reports list."""
        # Create 10 reports
        for i in range(10):
            response = client.post(
                "/reports/fire",
                json={
                    "location": f"Location {i}",
                    "description": f"Fire detected in area {i}",
                    "phone": "61999999999",
                },
                headers={"Authorization": f"Bearer {brigadista_token}"},
            )
            assert response.status_code == 201
        
        # Test with limit
        response = client.get(
            "/reports/fire?limit=5&offset=0",
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Test offset
        response = client.get(
            "/reports/fire?limit=5&offset=5",
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

    def test_get_report_by_id(self, client, brigadista_token):
        create_response = client.post(
            "/reports/fire",
            json={
                "location": "Test Location",
                "description": "Test fire detected in the area",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert create_response.status_code == 201
        report_id = create_response.json()["id"]

        response = client.get(f"/reports/fire/{report_id}", headers={"Authorization": f"Bearer {brigadista_token}"})
        assert response.status_code == 200
        assert response.json()["id"] == report_id


class TestUpdateFireReportStatus:
    """Tests for PATCH /reports/fire/{report_id}/status endpoint."""
    
    def test_update_report_status_success(self, client, admin_token, brigadista_token):
        """Test updating report status as admin."""
        # Create report
        create_response = client.post(
            "/reports/fire",
            json={
                "location": "Test Location",
                "description": "Test fire detected in the area",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert create_response.status_code == 201
        report_id = create_response.json()["id"]
        
        # Update status
        response = client.patch(
            f"/reports/fire/{report_id}/status",
            json={"status": "em_revisao"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "em_revisao"
    
    def test_update_report_status_without_permission(self, client, brigadista_token):
        """Test updating report status without permission."""
        # Create report
        create_response = client.post(
            "/reports/fire",
            json={
                "location": "Test Location",
                "description": "Test fire detected in the area",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert create_response.status_code == 201
        report_id = create_response.json()["id"]
        
        # Try to update status
        response = client.patch(
            f"/reports/fire/{report_id}/status",
            json={"status": "em_revisao"},
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert response.status_code == 403
    
    def test_update_report_status_without_auth(self, client, brigadista_token):
        """Test updating report status without authentication."""
        # Create report
        create_response = client.post(
            "/reports/fire",
            json={
                "location": "Test Location",
                "description": "Test fire detected in the area",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert create_response.status_code == 201
        report_id = create_response.json()["id"]
        
        # Try to update status
        response = client.patch(
            f"/reports/fire/{report_id}/status",
            json={"status": "em_revisao"},
        )
        assert response.status_code == 401
    
    def test_update_nonexistent_report_status(self, client, admin_token):
        """Test updating non-existent report status."""
        response = client.patch(
            "/reports/fire/9999/status",
            json={"status": "em_revisao"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404
    
    def test_update_report_to_approved(self, client, admin_token, brigadista_token):
        """Test updating report status to approved."""
        # Create report
        create_response = client.post(
            "/reports/fire",
            json={
                "location": "Test Location",
                "description": "Test fire detected in the area",
                "phone": "61999999999",
            },
            headers={"Authorization": f"Bearer {brigadista_token}"},
        )
        assert create_response.status_code == 201
        report_id = create_response.json()["id"]
        
        # Update to em_revisao
        client.patch(
            f"/reports/fire/{report_id}/status",
            json={"status": "em_revisao"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        
        # Update to aprovado
        response = client.patch(
            f"/reports/fire/{report_id}/status",
            json={"status": "aprovado"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "aprovado"
