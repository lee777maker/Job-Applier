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
    sites: List[str] = ["indeed","linkedin","google"]  # Removed glassdoor - not available in SA
    additional_keywords: List[str] =[]

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
    match_score: float =0.0

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
        
        search_terms =[request.keyword]+ request.additional_keywords[:2]
        all_jobs =[]
        for search_term in search_terms:
            try:
                print(f"Searching for: {search_term} in {request.location}")
                df = scrape_jobs(
                    site_name=request.sites,
                    search_term=search_term,
                    location=request.location,
                    results_wanted=request.max_results// len(search_terms),
                    hours_old=hours_old,
                    country_indeed="south africa",
                    is_remote=request.remote,
                    job_type=job_type_map.get(request.job_type) if request.job_type else None
                )
        
                print(f"Found {len(df)} jobs for {search_term}")
                
                if df is None or len(df) == 0:
                    print(f"No jobs found for {search_term}")
                    continue
      
                for idx, row in df.iterrows():
                    title = safe_str(row.get('title'), "").lower()
                    desc = safe_str(row.get('description'), "").lower()

                    relevance =0.0
                    if request.keyword.lower() in title:
                        relevance += 0.5
                    
                    if any(kw.lower() in title for kw in request.additional_keywords):
                        relevance+=0.3
                    if request.keyword.lower() in desc:
                        relevance += 0.2

                    job = JobListing(
                        id=f"{search_term}-{idx}-{row.get('id', '')}",
                        title=safe_str(row.get('title'), "Unknown Title"),
                        company=safe_str(row.get('company'), "Unknown Company"),
                        location=safe_str(row.get('location'), "Unknown Location"),
                        description=safe_str(row.get('description'), "")[:500] + "...",
                        apply_url=safe_str(row.get('job_url'), ""),
                        date_posted=safe_str(row.get('date_posted'), ""),
                        job_type=safe_str(row.get('job_type')) if pd.notna(row.get('job_type')) else None,
                        salary=safe_str(row.get('compensation')) if pd.notna(row.get('compensation')) else None,
                        source=safe_str(row.get('site'), "unknown"),
                        match_score=min(relevance, 1.0)
                    )

                    all_jobs.append(job)
            except Exception as e:
                print(f"Error searching for {search_term}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Total jobs found before deduplication: {len(all_jobs)}")
        
        seen_urls = set()
        unique_jobs = []
        for job in all_jobs:
            if job.apply_url not in seen_urls:
                seen_urls.add(job.apply_url)
                unique_jobs.append(job)
        
        print(f"Unique jobs after deduplication: {len(unique_jobs)}")
                
        # Sort by match score
        unique_jobs.sort(key=lambda x: x.match_score, reverse=True)
            
        return unique_jobs[:request.max_results]
        
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-by-profile")
async def search_by_profile(request: dict):
    """Search jobs using user profile data including AI-extracted titles"""
    try:
        profile = request.get("profile", {})
        preferences = request.get("preferences", {})
        
        # Extract data from profile/preferences
        primary_role = preferences.get("preferredRole", profile.get("title", "Software Engineer"))
        location = preferences.get("location", "Johannesburg, South Africa")
        remote = preferences.get("openToRemote", True)
        job_type = preferences.get("contractTypes", ["full-time"])[0] if preferences.get("contractTypes") else None
        
        # Get AI-suggested job titles from profile
        ai_job_titles = profile.get("suggestedJobTitles", [])
        
        # Skills for matching
        skills = profile.get("skills", [])
        
        search_request = JobSearchRequest(
            keyword=primary_role,
            location=location,
            remote=remote,
            job_type=job_type,
            max_results=request.get("max_results", 20),
            days_old=preferences.get("daysOld", 30),
            additional_keywords=ai_job_titles[:3]  # Use top 3 AI suggestions
        )
        
        jobs = await search_jobs(search_request)
        
        # Enhance match scores based on skills
        for job in jobs:
            job_desc = job.description.lower()
            skill_matches = sum(1 for skill in skills if skill.lower() in job_desc)
            job.match_score = min(1.0, job.match_score + (skill_matches * 0.1))
            
        # Re-sort by enhanced match scores
        jobs.sort(key=lambda x: x.match_score, reverse=True)
        
        return {
            "jobs": [job.dict() for job in jobs],
            "search_terms_used": [primary_role] + ai_job_titles[:3],
            "total_found": len(jobs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "jobspy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)