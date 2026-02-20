"""
Pytest configuration and shared fixtures for AI service tests.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Import the app - adjust path as needed
import sys
sys.path.insert(0, '.')
from app import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_cv_text():
    """Return a sample CV text for testing."""
    return """
    John Doe
    Software Engineer
    john.doe@example.com | +27 123 456 7890 | linkedin.com/in/johndoe
    
    SUMMARY
    Experienced software engineer with 5+ years in full-stack development.
    Passionate about building scalable applications and leading teams.
    
    EXPERIENCE
    Senior Software Engineer | Tech Corp | 2020 - Present
    - Led development of microservices architecture serving 1M+ users
    - Reduced API response time by 40% through caching optimization
    - Mentored team of 5 junior developers
    
    Software Engineer | Startup Inc | 2018 - 2020
    - Built React frontend and Node.js backend
    - Implemented CI/CD pipelines reducing deployment time by 60%
    
    EDUCATION
    BSc Computer Science | University of Cape Town | 2014 - 2017
    - Graduated with distinction
    
    SKILLS
    Python, JavaScript, React, Node.js, Docker, AWS, PostgreSQL, Redis, Kubernetes
    
    CERTIFICATIONS
    AWS Certified Solutions Architect - Associate (2022)
    Certified Scrum Master (2021)
    """


@pytest.fixture
def sample_profile():
    """Return a sample user profile for testing."""
    return {
        "contactInfo": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "phone": "+27 123 456 7890",
            "linkedin": "linkedin.com/in/johndoe",
            "github": "github.com/johndoe"
        },
        "skills": [
            {"id": "1", "name": "Python", "level": "Advanced"},
            {"id": "2", "name": "React", "level": "Intermediate"},
            {"id": "3", "name": "Docker", "level": "Intermediate"},
            {"id": "4", "name": "AWS", "level": "Beginner"}
        ],
        "experience": [
            {
                "id": "1",
                "title": "Senior Software Engineer",
                "company": "Tech Corp",
                "duration": "2020 - Present",
                "description": "Led development of microservices architecture"
            },
            {
                "id": "2",
                "title": "Software Engineer",
                "company": "Startup Inc",
                "duration": "2018 - 2020",
                "description": "Built full-stack applications"
            }
        ],
        "education": [
            {
                "id": "1",
                "degree": "BSc Computer Science",
                "institution": "University of Cape Town",
                "field": "Computer Science",
                "duration": "2014 - 2017"
            }
        ],
        "projects": [
            {
                "id": "1",
                "name": "E-commerce Platform",
                "description": "Built scalable e-commerce platform",
                "link": "github.com/johndoe/ecommerce"
            }
        ],
        "certifications": [
            {
                "id": "1",
                "name": "AWS Certified Solutions Architect",
                "issuer": "Amazon",
                "date": "2022"
            }
        ],
        "languages": [
            {"id": "1", "name": "English", "proficiency": "Native"},
            {"id": "2", "name": "Afrikaans", "proficiency": "Conversational"}
        ]
    }


@pytest.fixture
def sample_job_description():
    """Return a sample job description for testing."""
    return """
    Senior Software Engineer
    
    About the Role:
    We are looking for an experienced Software Engineer to join our team.
    You will be responsible for designing and implementing scalable solutions.
    
    Requirements:
    - 5+ years of experience in software development
    - Strong proficiency in Python and JavaScript
    - Experience with React and modern frontend frameworks
    - Knowledge of Docker and containerization
    - Experience with AWS or other cloud platforms
    - Strong understanding of databases (PostgreSQL, Redis)
    - Excellent problem-solving skills
    - Bachelor's degree in Computer Science or equivalent
    
    Nice to Have:
    - Experience with Kubernetes
    - Open source contributions
    - Technical leadership experience
    
    Benefits:
    - Competitive salary
    - Remote work options
    - Professional development budget
    """


@pytest.fixture
def mock_runner_run():
    """Mock the OpenAI Runner.run function."""
    with patch('app.Runner.run') as mock_run:
        mock_result = MagicMock()
        mock_result.final_output = MagicMock()
        mock_result.final_output_as = MagicMock(return_value="Mocked response")
        mock_run.return_value = mock_result
        yield mock_run


@pytest.fixture
def mock_openai_agents():
    """Mock OpenAI agents for testing."""
    with patch('app.Agent') as mock_agent_class:
        mock_agent = MagicMock()
        mock_agent_class.return_value = mock_agent
        yield mock_agent_class


@pytest.fixture
def empty_profile():
    """Return an empty profile for testing edge cases."""
    return {}


@pytest.fixture
def minimal_profile():
    """Return a minimal profile with only contact info."""
    return {
        "contactInfo": {
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com"
        }
    }


@pytest.fixture
def sample_pdf_bytes():
    """Return sample PDF bytes (minimal valid PDF header)."""
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n"


@pytest.fixture
def sample_docx_bytes():
    """Return sample DOCX bytes (ZIP header since DOCX is a ZIP file)."""
    return b"PK\x03\x04"  # ZIP file signature
