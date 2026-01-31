#!/usr/bin/env python3
import os
import json
import httpx

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8001")

def pretty(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False)

def main():
    print(f"Testing against: {BASE_URL}")

    with httpx.Client(base_url=BASE_URL, timeout=60.0) as client:
        # 1) Health check
        r = client.get("/health")
        print("\nGET /health")
        print("Status:", r.status_code)
        print(pretty(r.json()))
        r.raise_for_status()

        # 2) Upload resume (multipart/form-data)
        # Endpoint accepts .pdf/.docx/.txt; text extraction is simple decode in your code.
        resume_text = (
            "Lethabo Neo\n"
            "Skills: Python, FastAPI, SQL, Docker\n"
            "Experience: Built automation tools and APIs.\n"
        )
        files = {
            "file": ("resume.txt", resume_text.encode("utf-8"), "text/plain")
        }
        r = client.post("/agents/upload-resume", files=files)
        print("\nPOST /agents/upload-resume")
        print("Status:", r.status_code)
        print(pretty(r.json()))
        r.raise_for_status()

        # 3) Match score (requires job_description length >= 30)
        # Your model enforces min_length=30 on job_description. :contentReference[oaicite:6]{index=6}
        payload = {
            "user_profile": {
                "name": "Lethabo Neo",
                "skills": ["Python", "FastAPI", "SQL", "Docker"],
                "target_title": "Junior Software Engineer",
                "industry": "Software"
            },
            "resume_text": resume_text,
            "job_description": (
                "We need a Python developer to build FastAPI services, "
                "work with SQL databases, and deploy with Docker."
            )
        }

        r = client.post("/agents/match-score", json=payload)
        print("\nPOST /agents/match-score")
        print("Status:", r.status_code)
        print(pretty(r.json()))
        r.raise_for_status()

    print("\n✅ Smoke test passed.")

if __name__ == "__main__":
    main()
