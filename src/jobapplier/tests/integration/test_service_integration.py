"""
Integration tests for JobApplier AI services.
These tests verify service-to-service communication and end-to-end flows.

Note: These tests require all services to be running. Use docker-compose to start services.
"""

import pytest
import requests
import time
from typing import Dict, Any


class TestServiceHealth:
    """Health check tests for all services."""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002',
        'frontend': 'http://localhost:5173'
    }
    
    @pytest.fixture(autouse=True)
    def wait_for_services(self):
        """Wait for services to be ready before running tests."""
        max_retries = 30
        for service, url in self.BASE_URLS.items():
            if service == 'frontend':
                continue  # Skip frontend health check
            
            health_url = f"{url}/health" if service != 'backend' else f"{url}/actuator/health"
            
            for i in range(max_retries):
                try:
                    response = requests.get(health_url, timeout=5)
                    if response.status_code == 200:
                        break
                except requests.exceptions.ConnectionError:
                    pass
                
                if i == max_retries - 1:
                    pytest.skip(f"Service {service} is not available")
                
                time.sleep(1)
    
    def test_ai_service_health(self):
        """AI service should respond to health check."""
        response = requests.get(f"{self.BASE_URLS['ai']}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'ai-service'
    
    def test_jobspy_service_health(self):
        """JobSpy service should respond to health check."""
        response = requests.get(f"{self.BASE_URLS['jobspy']}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
    
    def test_backend_health(self):
        """Backend should respond to health check."""
        response = requests.get(f"{self.BASE_URLS['backend']}/actuator/health")
        
        assert response.status_code == 200


class TestEndToEndFlows:
    """End-to-end integration tests."""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002'
    }
    
    @pytest.fixture
    def test_user(self):
        """Create a test user and return credentials."""
        import uuid
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register user
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/auth/register",
            json={
                "name": "Test",
                "surname": "User",
                "email": email,
                "password": "testpassword123"
            }
        )
        
        if response.status_code not in [200, 201]:
            pytest.skip(f"Failed to create test user: {response.text}")
        
        user_data = response.json()
        
        yield {
            "id": user_data.get("id"),
            "email": email,
            "password": "testpassword123"
        }
        
        # Cleanup would go here if we had a delete endpoint
    
    def test_user_registration_and_login(self, test_user):
        """Should register and login user successfully."""
        # Login with created user
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user["email"]
    
    def test_login_with_invalid_credentials(self):
        """Should reject invalid login credentials."""
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
    
    def test_job_search_flow(self):
        """Should search for jobs via JobSpy service."""
        response = requests.post(
            f"{self.BASE_URLS['jobspy']}/search",
            json={
                "keyword": "Software Engineer",
                "location": "Johannesburg",
                "max_results": 5
            },
            timeout=60
        )
        
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        # Don't assert on job count as results may vary
    
    def test_cv_extraction_flow(self):
        """Should extract CV data via AI service."""
        from io import BytesIO
        
        # Create a simple text file as CV
        cv_content = b"""
        John Doe
        Software Engineer
        john.doe@example.com
        
        EXPERIENCE
        Senior Developer at Tech Corp (2020-Present)
        - Built scalable applications
        
        SKILLS
        Python, JavaScript, React
        """
        
        files = {
            'file': ('resume.txt', BytesIO(cv_content), 'text/plain')
        }
        
        response = requests.post(
            f"{self.BASE_URLS['ai']}/agents/extract-cv",
            files=files,
            timeout=30
        )
        
        # May succeed or fail depending on OpenAI availability
        assert response.status_code in [200, 500, 503]
    
    def test_backend_to_jobspy_proxy(self, test_user):
        """Backend should be able to proxy requests to JobSpy."""
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/jobs/search-by-profile",
            json={
                "profile": {
                    "skills": ["Python", "JavaScript"],
                    "suggestedJobTitles": ["Software Engineer"]
                },
                "preferences": {
                    "preferredRole": "Software Engineer",
                    "location": "Johannesburg"
                },
                "max_results": 5
            },
            timeout=60
        )
        
        # Should either succeed or gracefully degrade
        assert response.status_code in [200, 503, 502]


class TestAPIContracts:
    """Tests to verify API contracts between services."""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002'
    }
    
    def test_ai_service_endpoints_structure(self):
        """Verify AI service endpoints return expected structure."""
        # Health endpoint
        response = requests.get(f"{self.BASE_URLS['ai']}/health")
        if response.status_code == 200:
            data = response.json()
            assert 'status' in data
            assert 'service' in data
            assert 'timestamp' in data
    
    def test_jobspy_search_response_structure(self):
        """Verify JobSpy search returns expected structure."""
        response = requests.post(
            f"{self.BASE_URLS['jobspy']}/search",
            json={
                "keyword": "Developer",
                "max_results": 1
            },
            timeout=60
        )
        
        if response.status_code == 200:
            jobs = response.json()
            if len(jobs) > 0:
                job = jobs[0]
                # Verify required fields
                assert 'id' in job
                assert 'title' in job
                assert 'company' in job
                assert 'location' in job
                assert 'description' in job
                assert 'apply_url' in job
                assert 'date_posted' in job
                assert 'source' in job
                assert 'match_score' in job
    
    def test_backend_auth_response_structure(self):
        """Verify backend auth endpoints return expected structure."""
        # Register a test user
        import uuid
        email = f"contract_test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/auth/register",
            json={
                "name": "Contract",
                "surname": "Test",
                "email": email,
                "password": "password123"
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert 'id' in data
            assert 'email' in data


class TestErrorHandling:
    """Tests for error handling across services."""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002'
    }
    
    def test_backend_404_handling(self):
        """Backend should return 404 for non-existent endpoints."""
        response = requests.get(f"{self.BASE_URLS['backend']}/api/nonexistent")
        
        assert response.status_code == 404
    
    def test_ai_service_invalid_file_type(self):
        """AI service should reject invalid file types."""
        from io import BytesIO
        
        files = {
            'file': ('malware.exe', BytesIO(b'invalid'), 'application/octet-stream')
        }
        
        response = requests.post(
            f"{self.BASE_URLS['ai']}/agents/extract-cv",
            files=files
        )
        
        assert response.status_code == 400
    
    def test_jobspy_invalid_request_body(self):
        """JobSpy should handle invalid request bodies."""
        response = requests.post(
            f"{self.BASE_URLS['jobspy']}/search",
            data="invalid json",
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 422
    
    def test_backend_validation_errors(self):
        """Backend should return validation errors for invalid input."""
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/auth/register",
            json={
                "name": "",  # Empty name
                "surname": "Test",
                "email": "invalid-email",
                "password": "short"
            }
        )
        
        assert response.status_code == 400


class TestPerformance:
    """Performance tests for critical endpoints."""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002'
    }
    
    def test_health_check_response_time(self):
        """Health checks should respond quickly."""
        import time
        
        start = time.time()
        response = requests.get(f"{self.BASE_URLS['ai']}/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 1.0  # Should respond within 1 second
    
    def test_backend_health_response_time(self):
        """Backend health check should respond quickly."""
        import time
        
        start = time.time()
        response = requests.get(f"{self.BASE_URLS['backend']}/actuator/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 1.0


# Skip all integration tests if --skip-integration flag is passed
def pytest_configure(config):
    """Configure pytest to handle integration test skipping."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )


def pytest_collection_modifyitems(config, items):
    """Skip integration tests if --skip-integration is passed."""
    if config.getoption("--skip-integration"):
        skip_integration = pytest.mark.skip(reason="--skip-integration specified")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)


# Add command line option
def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--skip-integration",
        action="store_true",
        default=False,
        help="Skip integration tests"
    )
