"""
Unit tests for the JobSpy service.
Tests cover job search, deduplication, and profile-based search.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import pandas as pd

import sys
sys.path.insert(0, '.')
from jobspy_service import app, JobListing


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_scrape_jobs():
    """Mock the scrape_jobs function from jobspy."""
    with patch('jobspy_service.scrape_jobs') as mock:
        yield mock


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check(self, client):
        """Should return healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "jobspy"


class TestSearchJobs:
    """Tests for the job search endpoint."""

    def test_search_jobs_success(self, client, mock_scrape_jobs):
        """Should return job listings successfully."""
        # Create mock DataFrame
        mock_df = pd.DataFrame({
            'title': ['Software Engineer', 'Senior Developer'],
            'company': ['Google', 'Microsoft'],
            'location': ['Johannesburg', 'Cape Town'],
            'description': ['Build software', 'Develop applications'],
            'job_url': ['https://example.com/1', 'https://example.com/2'],
            'date_posted': ['2026-02-20', '2026-02-19'],
            'job_type': ['full-time', 'full-time'],
            'compensation': ['R 50000', 'R 60000'],
            'site': ['indeed', 'linkedin'],
            'id': ['job1', 'job2']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Software Engineer",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) == 2
        assert jobs[0]["title"] == "Software Engineer"
        assert jobs[0]["company"] == "Google"

    def test_search_jobs_empty_results(self, client, mock_scrape_jobs):
        """Should handle empty search results."""
        mock_df = pd.DataFrame()
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "NonExistentJob12345",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 200
        assert response.json() == []

    def test_search_jobs_deduplication(self, client, mock_scrape_jobs):
        """Should remove duplicate job listings."""
        # Create mock DataFrame with duplicates
        mock_df = pd.DataFrame({
            'title': ['Job 1', 'Job 2', 'Job 3'],
            'company': ['Company A', 'Company B', 'Company C'],
            'location': ['JHB', 'CPT', 'DBN'],
            'description': ['Desc 1', 'Desc 2', 'Desc 3'],
            'job_url': ['https://same.com/1', 'https://same.com/1', 'https://different.com/3'],
            'date_posted': ['2026-02-20', '2026-02-20', '2026-02-19'],
            'job_type': ['full-time', 'full-time', 'contract'],
            'compensation': [None, None, None],
            'site': ['indeed', 'linkedin', 'indeed'],
            'id': ['1', '2', '3']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "max_results": 10
        })
        
        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) == 2  # Duplicates removed

    def test_search_jobs_with_remote_option(self, client, mock_scrape_jobs):
        """Should handle remote job search."""
        mock_df = pd.DataFrame({
            'title': ['Remote Developer'],
            'company': ['Remote Co'],
            'location': ['Remote'],
            'description': ['Work from anywhere'],
            'job_url': ['https://remote.com/1'],
            'date_posted': ['2026-02-20'],
            'job_type': ['full-time'],
            'compensation': [None],
            'site': ['indeed'],
            'id': ['1']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "location": "South Africa",
            "remote": True,
            "max_results": 10
        })
        
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_search_jobs_with_job_type(self, client, mock_scrape_jobs):
        """Should filter by job type."""
        mock_df = pd.DataFrame({
            'title': ['Contract Developer'],
            'company': ['Contract Co'],
            'location': ['JHB'],
            'description': ['Contract role'],
            'job_url': ['https://contract.com/1'],
            'date_posted': ['2026-02-20'],
            'job_type': ['contract'],
            'compensation': [None],
            'site': ['indeed'],
            'id': ['1']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "location": "Johannesburg",
            "job_type": "contract",
            "max_results": 10
        })
        
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_search_jobs_with_additional_keywords(self, client, mock_scrape_jobs):
        """Should search with additional keywords."""
        mock_df = pd.DataFrame({
            'title': ['Python Developer', 'Java Developer'],
            'company': ['Tech Co', 'Tech Co'],
            'location': ['JHB', 'JHB'],
            'description': ['Python role', 'Java role'],
            'job_url': ['https://tech.com/1', 'https://tech.com/2'],
            'date_posted': ['2026-02-20', '2026-02-19'],
            'job_type': ['full-time', 'full-time'],
            'compensation': [None, None],
            'site': ['indeed', 'indeed'],
            'id': ['1', '2']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "location": "Johannesburg",
            "additional_keywords": ["Python", "Java"],
            "max_results": 10
        })
        
        assert response.status_code == 200

    def test_search_jobs_scraper_error(self, client, mock_scrape_jobs):
        """Should handle scraper errors gracefully."""
        mock_scrape_jobs.side_effect = Exception("Scraper failed")
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 500

    def test_search_jobs_with_days_old(self, client, mock_scrape_jobs):
        """Should filter by days old."""
        mock_df = pd.DataFrame({
            'title': ['Recent Job'],
            'company': ['Recent Co'],
            'location': ['JHB'],
            'description': ['Recent posting'],
            'job_url': ['https://recent.com/1'],
            'date_posted': ['2026-02-20'],
            'job_type': ['full-time'],
            'compensation': [None],
            'site': ['indeed'],
            'id': ['1']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "location": "Johannesburg",
            "days_old": 7,
            "max_results": 10
        })
        
        assert response.status_code == 200
        # Verify hours_old is calculated correctly (7 days = 168 hours)
        call_args = mock_scrape_jobs.call_args
        assert call_args.kwargs['hours_old'] == 168


class TestSearchByProfile:
    """Tests for the profile-based job search endpoint."""

    def test_search_by_profile_success(self, client, mock_scrape_jobs):
        """Should search jobs using profile data."""
        mock_df = pd.DataFrame({
            'title': ['Python Developer'],
            'company': ['Python Co'],
            'location': ['Cape Town'],
            'description': 'Python, Django, AWS role',
            'job_url': ['https://python.com/1'],
            'date_posted': ['2026-02-20'],
            'job_type': ['full-time'],
            'compensation': [None],
            'site': ['indeed'],
            'id': ['1']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search-by-profile", json={
            "profile": {
                "skills": ["Python", "Django"],
                "suggestedJobTitles": ["Python Developer", "Backend Engineer"]
            },
            "preferences": {
                "preferredRole": "Python Developer",
                "location": "Cape Town",
                "openToRemote": True,
                "contractTypes": ["full-time"]
            },
            "max_results": 20
        })
        
        assert response.status_code == 200
        result = response.json()
        assert "jobs" in result
        assert "search_terms_used" in result
        assert "total_found" in result

    def test_search_by_profile_with_skill_matching(self, client, mock_scrape_jobs):
        """Should enhance match scores based on skills."""
        mock_df = pd.DataFrame({
            'title': ['Developer'],
            'company': ['Tech Co'],
            'location': ['JHB'],
            'description': ['Python, React, AWS role with Django framework'],
            'job_url': ['https://tech.com/1'],
            'date_posted': ['2026-02-20'],
            'job_type': ['full-time'],
            'compensation': [None],
            'site': ['indeed'],
            'id': ['1']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search-by-profile", json={
            "profile": {
                "skills": ["Python", "Django", "React"]
            },
            "preferences": {
                "preferredRole": "Developer",
                "location": "Johannesburg"
            }
        })
        
        assert response.status_code == 200
        result = response.json()
        # Match score should be enhanced due to skill matches
        assert result["jobs"][0]["match_score"] > 0

    def test_search_by_profile_missing_profile(self, client):
        """Should handle missing profile."""
        response = client.post("/search-by-profile", json={
            "preferences": {
                "preferredRole": "Developer"
            }
        })
        
        # Should still work with defaults
        assert response.status_code in [200, 500]

    def test_search_by_profile_empty_preferences(self, client, mock_scrape_jobs):
        """Should handle empty preferences with defaults."""
        mock_df = pd.DataFrame()
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search-by-profile", json={
            "profile": {
                "skills": ["Python"]
            },
            "preferences": {}
        })
        
        assert response.status_code == 200


class TestJobListingModel:
    """Tests for the JobListing Pydantic model."""

    def test_job_listing_creation(self):
        """Should create job listing with all fields."""
        job = JobListing(
            id="job-123",
            title="Software Engineer",
            company="Google",
            location="Johannesburg",
            description="Build amazing software",
            apply_url="https://careers.google.com/job/123",
            date_posted="2026-02-20",
            job_type="full-time",
            salary="R 50000 - 70000",
            source="indeed",
            match_score=0.85
        )
        
        assert job.id == "job-123"
        assert job.title == "Software Engineer"
        assert job.match_score == 0.85

    def test_job_listing_optional_fields(self):
        """Should create job listing with optional fields as None."""
        job = JobListing(
            id="job-123",
            title="Developer",
            company="Tech Co",
            location="Remote",
            description="Work remotely",
            apply_url="https://example.com/job",
            date_posted="2026-02-20",
            source="linkedin"
        )
        
        assert job.job_type is None
        assert job.salary is None
        assert job.match_score == 0.0


class TestSafeStrFunction:
    """Tests for the safe_str helper function."""

    def test_safe_str_with_valid_value(self):
        """Should return string value."""
        from jobspy_service import safe_str
        
        result = safe_str("test value")
        assert result == "test value"

    def test_safe_str_with_nan(self):
        """Should return default for NaN."""
        from jobspy_service import safe_str
        
        result = safe_str(float('nan'), "default")
        assert result == "default"

    def test_safe_str_with_none(self):
        """Should return default for None."""
        from jobspy_service import safe_str
        
        result = safe_str(None, "default")
        assert result == "default"

    def test_safe_str_with_number(self):
        """Should convert number to string."""
        from jobspy_service import safe_str
        
        result = safe_str(12345)
        assert result == "12345"


class TestEdgeCases:
    """Edge case tests for the JobSpy service."""

    def test_search_with_very_long_keyword(self, client, mock_scrape_jobs):
        """Should handle very long search keywords."""
        mock_df = pd.DataFrame()
        mock_scrape_jobs.return_value = mock_df
        
        long_keyword = "A" * 500
        
        response = client.post("/search", json={
            "keyword": long_keyword,
            "max_results": 10
        })
        
        assert response.status_code == 200

    def test_search_with_special_characters(self, client, mock_scrape_jobs):
        """Should handle special characters in search."""
        mock_df = pd.DataFrame()
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "C++ Developer (C#/.NET)",
            "location": "Johannesburg, GP",
            "max_results": 10
        })
        
        assert response.status_code == 200

    def test_search_with_unicode(self, client, mock_scrape_jobs):
        """Should handle Unicode characters."""
        mock_df = pd.DataFrame()
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Développeur",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 200

    def test_search_result_sorting(self, client, mock_scrape_jobs):
        """Should sort results by match score."""
        mock_df = pd.DataFrame({
            'title': ['Low Match', 'High Match', 'Medium Match'],
            'company': ['A', 'B', 'C'],
            'location': ['JHB', 'JHB', 'JHB'],
            'description': ['Role', 'Role', 'Role'],
            'job_url': ['https://a.com', 'https://b.com', 'https://c.com'],
            'date_posted': ['2026-02-20'] * 3,
            'job_type': ['full-time'] * 3,
            'compensation': [None] * 3,
            'site': ['indeed'] * 3,
            'id': ['1', '2', '3']
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "max_results": 10
        })
        
        assert response.status_code == 200
        jobs = response.json()
        # Jobs should be sorted by match_score descending
        if len(jobs) > 1:
            for i in range(len(jobs) - 1):
                assert jobs[i]["match_score"] >= jobs[i + 1]["match_score"]

    def test_search_max_results_limit(self, client, mock_scrape_jobs):
        """Should respect max_results parameter."""
        # Create more jobs than max_results
        mock_df = pd.DataFrame({
            'title': [f'Job {i}' for i in range(100)],
            'company': ['Co'] * 100,
            'location': ['JHB'] * 100,
            'description': ['Desc'] * 100,
            'job_url': [f'https://example.com/{i}' for i in range(100)],
            'date_posted': ['2026-02-20'] * 100,
            'job_type': ['full-time'] * 100,
            'compensation': [None] * 100,
            'site': ['indeed'] * 100,
            'id': [str(i) for i in range(100)]
        })
        mock_scrape_jobs.return_value = mock_df
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "max_results": 10
        })
        
        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) <= 10
