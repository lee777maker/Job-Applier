import os
import httpx
import pytest

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8001")

def test_health():
    r = httpx.get(f"{BASE_URL}/health", timeout=10.0)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["service"] == "jobapplier-ai-agent"

def test_upload_resume_txt(tmp_path):
    resume_path = tmp_path / "resume.txt"
    resume_path.write_text("Skills: Python, FastAPI, SQL\n", encoding="utf-8")

    with open(resume_path, "rb") as f:
        files = {"file": ("resume.txt", f, "text/plain")}
        r = httpx.post(f"{BASE_URL}/agents/upload-resume", files=files, timeout=30.0)

    assert r.status_code == 200
    data = r.json()
    assert data["filename"] == "resume.txt"
    assert "word_count" in data
    assert "extracted_skills" in data

@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set")
def test_match_score_requires_openai():
    payload = {
        "user_profile": {"name": "Test", "skills": ["Python", "FastAPI"]},
        "resume_text": "Built APIs with FastAPI.",
        "job_description": "Need Python dev to build FastAPI APIs and deploy services."
    }
    r = httpx.post(f"{BASE_URL}/agents/match-score", json=payload, timeout=120.0)
    assert r.status_code == 200
    data = r.json()
    assert 0.0 <= data["match_score"] <= 1.0
    assert isinstance(data["strengths"], list)
