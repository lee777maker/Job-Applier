from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from jobspy import scrape_jobs
import pandas as pd
from typing import List, Optional
import math

app = FastAPI(title="JobSpy Scraper Service")

class JobSearchRequest(BaseModel):
    keyword: str
    location: str = "Johannesburg, South Africa"
    remote: bool = False
    job_type: Optional[str] = None
    max_results: int = 20
    days_old: int = 30
    sites: List[str] = ["indeed"]

class JobListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    apply_url: str
    date_posted: str
    job_type: Optional[str] = None
    salary: Optional[str] = None
    source: str

def safe_str(value, default=""):
    """Safely convert pandas value to string, handling NaN"""
    if pd.isna(value):
        return default
    return str(value)

@app.post("/search", response_model=List[JobListing])
async def search_jobs(request: JobSearchRequest):
    try:
        job_type_map = {
            "full-time": "fulltime",
            "part-time": "parttime", 
            "contract": "contract",
            "internship": "internship"
        }
        hours_old = request.days_old * 24
        
        df = scrape_jobs(
            site_name=request.sites,
            search_term=request.keyword,
            location=request.location,
            results_wanted=request.max_results,
            hours_old=hours_old,
            country_indeed="south africa",
            is_remote=request.remote,
            job_type=job_type_map.get(request.job_type) if request.job_type else None
        )
        
        jobs = []
        for idx, row in df.iterrows():
            job = JobListing(
                id=str(idx),
                title=safe_str(row.get('title'), "Unknown Title"),
                company=safe_str(row.get('company'), "Unknown Company"),  # FIXED
                location=safe_str(row.get('location'), "Unknown Location"),
                description=safe_str(row.get('description'), "")[:500] + "...",
                apply_url=safe_str(row.get('job_url'), ""),
                date_posted=safe_str(row.get('date_posted'), ""),
                job_type=safe_str(row.get('job_type')) if pd.notna(row.get('job_type')) else None,
                salary=safe_str(row.get('compensation')) if pd.notna(row.get('compensation')) else None,
                source=safe_str(row.get('site'), "unknown")
            )
            jobs.append(job)
            
        return jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "jobspy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)