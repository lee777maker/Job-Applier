"""
Unit tests for the AI service FastAPI application.
Tests cover health checks, CV extraction, and agent endpoints.
"""

import pytest
import json
from io import BytesIO
from unittest.mock import patch, MagicMock


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check(self, client):
        """Should return healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-service"
        assert "timestamp" in data

    def test_health_check_returns_valid_timestamp(self, client):
        """Should return a valid ISO timestamp."""
        response = client.get("/health")
        data = response.json()
        
        # Verify timestamp is valid ISO format
        timestamp = data["timestamp"]
        assert isinstance(timestamp, str)
        assert "T" in timestamp  # ISO format separator


class TestBuildUserContext:
    """Tests for the build_user_context helper function."""

    def test_build_user_context_with_full_profile(self, sample_profile):
        """Should build context from complete profile."""
        from app import build_user_context
        
        context = build_user_context(sample_profile)
        
        assert "John Doe" in context
        assert "Python" in context
        assert "Tech Corp" in context
        assert "University of Cape Town" in context
        assert "AWS Certified Solutions Architect" in context

    def test_build_user_context_empty_profile(self):
        """Should return default message for empty profile."""
        from app import build_user_context
        
        context = build_user_context({})
        
        assert context == "No user profile available."

    def test_build_user_context_none_profile(self):
        """Should return default message for None profile."""
        from app import build_user_context
        
        context = build_user_context(None)
        
        assert context == "No user profile available."

    def test_build_user_context_minimal_profile(self, minimal_profile):
        """Should build context from minimal profile."""
        from app import build_user_context
        
        context = build_user_context(minimal_profile)
        
        assert "Jane Smith" in context
        assert "jane@example.com" in context

    def test_build_user_context_skills_limit(self, sample_profile):
        """Should limit skills to 30 items."""
        from app import build_user_context
        
        # Add many skills
        sample_profile["skills"] = [
            {"id": str(i), "name": f"Skill{i}", "level": "Intermediate"}
            for i in range(50)
        ]
        
        context = build_user_context(sample_profile)
        
        # Should only show first 30 skills
        assert context.count("Skill") <= 30

    def test_build_user_context_experience_limit(self, sample_profile):
        """Should limit experience to 6 items."""
        from app import build_user_context
        
        # Add many experiences
        sample_profile["experience"] = [
            {
                "id": str(i),
                "title": f"Job {i}",
                "company": f"Company {i}",
                "duration": "2020-2021",
                "description": "Description"
            }
            for i in range(10)
        ]
        
        context = build_user_context(sample_profile)
        
        # Should only show first 6 experiences
        job_count = context.count("Job")
        assert job_count <= 6


class TestExtractCVEndpoint:
    """Tests for the CV extraction endpoint."""

    def test_extract_cv_invalid_file_type(self, client):
        """Should reject invalid file types."""
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("test.exe", b"invalid content", "application/octet-stream")}
        )
        
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

    def test_extract_cv_empty_file(self, client):
        """Should reject empty files."""
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("empty.pdf", b"", "application/pdf")}
        )
        
        assert response.status_code == 400

    def test_extract_cv_insufficient_text(self, client):
        """Should reject files with insufficient text."""
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("short.pdf", b"Hi", "application/pdf")}
        )
        
        assert response.status_code == 400
        assert "Could not extract sufficient text" in response.json()["detail"]

    def test_extract_cv_valid_pdf(self, client, mock_runner_run):
        """Should process valid PDF file."""
        # Mock the extraction result
        from app import CVExtractedData, ContactInfo
        mock_output = MagicMock()
        mock_output.contactInfo = ContactInfo(
            firstName="John",
            lastName="Doe",
            email="john@example.com",
            phone="+27 123 456 7890",
            linkedin="",
            github=""
        )
        mock_output.experiences = []
        mock_output.education = []
        mock_output.skills = []
        mock_output.projects = []
        mock_output.certifications = []
        mock_output.languages = []
        mock_output.rawText = ""
        mock_runner_run.return_value.final_output = mock_output
        
        pdf_content = b"%PDF-1.4\n" + b"John Doe\njohn@example.com\n" * 10
        
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("resume.pdf", pdf_content, "application/pdf")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "contactInfo" in data


class TestAutofillEndpoint:
    """Tests for the autofill endpoint."""

    def test_autofill_insufficient_text(self, client):
        """Should reject insufficient text content."""
        response = client.post(
            "/agents/autofill",
            data={"text_content": "Too short"}
        )
        
        assert response.status_code == 400
        assert "at least 50 characters" in response.json()["detail"]

    def test_autofill_valid_content(self, client, mock_runner_run):
        """Should process valid text content."""
        from app import CVExtractedData, ContactInfo
        mock_output = MagicMock()
        mock_output.contactInfo = ContactInfo(
            firstName="Jane",
            lastName="Smith",
            email="jane@example.com",
            phone="",
            linkedin="",
            github=""
        )
        mock_output.experiences = []
        mock_output.education = []
        mock_output.skills = []
        mock_output.projects = []
        mock_output.certifications = []
        mock_output.languages = []
        mock_output.rawText = "Sample CV text content"
        mock_runner_run.return_value.final_output = mock_output
        
        long_text = "This is a sample CV text. " * 20
        
        response = client.post(
            "/agents/autofill",
            data={"text_content": long_text}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "contactInfo" in data
        assert data["rawText"] == "Sample CV text content"


class TestTailorResumeEndpoint:
    """Tests for the resume tailoring endpoint."""

    def test_tailor_resume_missing_original(self, client):
        """Should reject missing original resume."""
        response = client.post(
            "/agents/tailor-resume",
            json={
                "original_resume": "",
                "job_description": "Looking for a developer"
            }
        )
        
        assert response.status_code == 400
        assert "Original resume is required" in response.json()["detail"]

    def test_tailor_resume_missing_job_description(self, client):
        """Should reject missing job description."""
        response = client.post(
            "/agents/tailor-resume",
            json={
                "original_resume": "My resume content",
                "job_description": ""
            }
        )
        
        assert response.status_code == 400
        assert "Job description is required" in response.json()["detail"]

    def test_tailor_resume_success(self, client, mock_runner_run, sample_profile):
        """Should tailor resume successfully."""
        mock_runner_run.return_value.final_output_as.return_value = "Tailored resume content"
        
        response = client.post(
            "/agents/tailor-resume",
            json={
                "original_resume": "Original resume content",
                "job_description": "Job description here",
                "user_profile": sample_profile
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "tailored_resume" in data
        assert "timestamp" in data


class TestGenerateCoverLetterEndpoint:
    """Tests for the cover letter generation endpoint."""

    def test_generate_coverletter_missing_job_description(self, client):
        """Should reject missing job description."""
        response = client.post(
            "/agents/generate-cover-letter",
            json={
                "job_description": "",
                "user_profile": {"name": "John"}
            }
        )
        
        assert response.status_code == 400
        assert "Job description is required" in response.json()["detail"]

    def test_generate_coverletter_success(self, client, mock_runner_run, sample_profile):
        """Should generate cover letter successfully."""
        mock_runner_run.return_value.final_output_as.return_value = "Dear Hiring Manager..."
        
        response = client.post(
            "/agents/generate-cover-letter",
            json={
                "job_description": "Software Engineer position",
                "user_profile": sample_profile,
                "company_name": "Tech Corp"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "cover_letter" in data
        assert "timestamp" in data


class TestGenerateEmailEndpoint:
    """Tests for the email generation endpoint."""

    def test_generate_email_missing_job_description(self, client):
        """Should reject missing job description."""
        response = client.post(
            "/agents/generate-email",
            json={
                "job_description": "",
                "user_profile": {"name": "John"}
            }
        )
        
        assert response.status_code == 400
        assert "Job description is required" in response.json()["detail"]

    def test_generate_email_success(self, client, mock_runner_run, sample_profile):
        """Should generate email successfully."""
        mock_runner_run.return_value.final_output_as.return_value = "Subject: Application for..."
        
        response = client.post(
            "/agents/generate-email",
            json={
                "job_description": "Software Engineer position",
                "user_profile": sample_profile,
                "recipientType": "recruiter"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "timestamp" in data


class TestMatchScoreEndpoint:
    """Tests for the match score endpoint."""

    def test_match_score_missing_resume(self, client):
        """Should reject missing resume text."""
        response = client.post(
            "/agents/match-score",
            json={
                "resume_text": "",
                "job_description": "Job description"
            }
        )
        
        assert response.status_code == 400
        assert "Resume text is required" in response.json()["detail"]

    def test_match_score_missing_job_description(self, client):
        """Should reject missing job description."""
        response = client.post(
            "/agents/match-score",
            json={
                "resume_text": "Resume content",
                "job_description": ""
            }
        )
        
        assert response.status_code == 400
        assert "Job description is required" in response.json()["detail"]

    def test_match_score_success(self, client, mock_runner_run, sample_profile):
        """Should calculate match score successfully."""
        mock_response = json.dumps({
            "ats_score": 85,
            "match_score": 0.85,
            "strengths": ["Python experience"],
            "gaps": ["Missing AWS cert"],
            "keywords_to_add": ["Kubernetes"],
            "recommended_bullets": ["Led team of 5 developers"]
        })
        mock_runner_run.return_value.final_output_as.return_value = mock_response
        
        response = client.post(
            "/agents/match-score",
            json={
                "user_profile": sample_profile,
                "job_description": "Software Engineer position",
                "resume_text": "Resume content here"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "ats_score" in data
        assert "match_score" in data
        assert "strengths" in data


class TestNeilweChatEndpoint:
    """Tests for the Neilwe chat endpoint."""

    def test_neilwe_chat_success(self, client, mock_runner_run, sample_profile):
        """Should process chat message successfully."""
        mock_runner_run.return_value.final_output_as.return_value = "Hello! I can help you with your job search."
        
        response = client.post(
            "/agents/neilwe-chat",
            json={
                "message": "What jobs should I apply for?",
                "profile": sample_profile,
                "chatHistory": []
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "timestamp" in data

    def test_neilwe_chat_with_nested_profile(self, client, mock_runner_run):
        """Should handle nested profile structure."""
        mock_runner_run.return_value.final_output_as.return_value = "Based on your profile..."
        
        response = client.post(
            "/agents/neilwe-chat",
            json={
                "message": "Help me find jobs",
                "profile": {
                    "userProfile": {
                        "contactInfo": {"firstName": "John", "lastName": "Doe"}
                    },
                    "jobPreferences": {"preferredRole": "Developer"},
                    "recentJobs": [{"title": "Engineer", "company": "Tech Co"}]
                },
                "chatHistory": []
            }
        )
        
        assert response.status_code == 200
        assert "response" in response.json()

    def test_neilwe_chat_with_chat_history(self, client, mock_runner_run, sample_profile):
        """Should include chat history in context."""
        mock_runner_run.return_value.final_output_as.return_value = "As I mentioned before..."
        
        response = client.post(
            "/agents/neilwe-chat",
            json={
                "message": "Tell me more",
                "profile": sample_profile,
                "chatHistory": [
                    {"role": "user", "content": "What is my strongest skill?"},
                    {"role": "assistant", "content": "Your strongest skill is Python."}
                ]
            }
        )
        
        assert response.status_code == 200


class TestExtractJobTitlesEndpoint:
    """Tests for the job title extraction endpoint."""

    def test_extract_job_titles_missing_cv_text(self, client):
        """Should reject missing CV text."""
        response = client.post(
            "/agents/extract-job-titles",
            json={
                "cv_text": ""
            }
        )
        
        assert response.status_code == 400
        assert "CV text is required" in response.json()["detail"]

    def test_extract_job_titles_success(self, client, mock_runner_run):
        """Should extract job titles successfully."""
        mock_response = '["Senior Software Engineer", "Full Stack Developer", "Backend Engineer"]'
        mock_runner_run.return_value.final_output_as.return_value = mock_response
        
        response = client.post(
            "/agents/extract-job-titles",
            json={
                "cv_text": "Software engineer with 5 years experience...",
                "preferred_role": "Software Engineer"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "job_titles" in data
        assert "primary_title" in data
        assert "timestamp" in data

    def test_extract_job_titles_fallback(self, client, mock_runner_run):
        """Should fallback to preferred role on parse error."""
        mock_runner_run.return_value.final_output_as.return_value = "invalid json"
        
        response = client.post(
            "/agents/extract-job-titles",
            json={
                "cv_text": "Some CV text...",
                "preferred_role": "Data Scientist"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["primary_title"] == "Data Scientist"
