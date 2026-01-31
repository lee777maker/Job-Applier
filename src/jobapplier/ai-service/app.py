import json
import os
from typing import Any, Dict, List, Optional, Union
import asyncio

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI, AsyncOpenAI
from sentence_transformers import SentenceTransformer
import numpy as np

# Load environment variables from .env file (backup safety measure)
load_dotenv()

app = FastAPI(title="JobApplier AI Agent")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client (v1.x syntax)
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=api_key)
async_client = AsyncOpenAI(api_key=api_key)

# Initialize embedding model (for semantic matching)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Models (you can keep or update these)
class MatchScoreRequest(BaseModel):
    user_profile: Dict[str, Any]
    job_description: str = Field(min_length=30)
    resume_text: Optional[str] = None

class MatchScoreResponse(BaseModel):
    match_score: float = Field(ge=0.0, le=1.0)
    strengths: List[str]
    gaps: List[str]
    keywords_to_add: List[str]
    recommended_bullets: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    ats_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)

class TailorResumeRequest(BaseModel):
    original_resume: str
    job_description: str
    user_profile: Dict[str, Any]
    style: Optional[str] = "professional"
    tone: Optional[str] = "professional"
    length: Optional[str] = "standard"  # concise, standard, detailed

class TailorResumeResponse(BaseModel):
    tailored_resume: str
    changes_made: Dict[str, Any]
    optimization_score: float

class GenerateCoverLetterRequest(BaseModel):
    user_profile: Dict[str, Any]
    job_description: str
    company_name: Optional[str] = ""
    hiring_manager: Optional[str] = ""

class GenerateCoverLetterResponse(BaseModel):
    cover_letter: str
    tone: str
    word_count: int
    keywords_included: List[str]

# System Prompts
MATCH_SCORE_SYSTEM_PROMPT = """You are a job application matching and scoring agent.
Return ONLY valid JSON matching this schema:

{
  "match_score": number (0..1),
  "strengths": string[],
  "gaps": string[],
  "keywords_to_add": string[],
  "recommended_bullets": string[],
  "confidence": number (0..1),
  "ats_score": number (0..100) or null
}

Rules:
- Be realistic; do not exaggerate match_score.
- Base output strictly on provided user_profile/resume_text vs job_description.
- Keep bullet recommendations concise and ATS-friendly.
- ats_score: Estimate ATS compatibility score (0-100) based on formatting, keywords, structure.
"""

RESUME_TAILOR_SYSTEM_PROMPT = """You are a professional resume writer and ATS optimization expert.
Your task is to tailor resumes for specific job descriptions.

Rules:
1. Preserve all factual information (dates, companies, education, certifications)
2. Reorder sections based on relevance to the job
3. Rewrite bullet points to include keywords from the job description
4. Add a professional summary at the top tailored to this job
5. Ensure ATS compatibility (clear formatting, standard sections)
6. Keep the style requested by the user
7. Return ONLY the tailored resume text
"""

COVER_LETTER_SYSTEM_PROMPT = """You are a professional cover letter writer.
Write compelling cover letters that:
1. Address the hiring manager appropriately
2. Highlight 2-3 key skills matching the job
3. Show enthusiasm for the company/role
4. Are 3-4 paragraphs (250-400 words)
5. Professional tone
6. Include a call to action
Return ONLY the cover letter text.
"""

@app.post("/agents/match-score", response_model=MatchScoreResponse)
async def match_score(req: MatchScoreRequest):
    """Calculate match score between user and job"""
    
    # Method 1: Calculate keyword score
    keyword_score = calculate_keyword_score(
        req.user_profile.get("skills", []),
        req.resume_text or "",
        req.job_description
    )
    
    # Method 2: Calculate semantic similarity
    semantic_score = calculate_semantic_score(
        req.user_profile,
        req.resume_text or "",
        req.job_description
    )
    
    # Method 3: Get AI analysis
    ai_result = await get_ai_match_analysis(
        req.user_profile,
        req.resume_text,
        req.job_description
    )
    
    # Combine scores (weighted average)
    final_score = (
        keyword_score * 0.3 +
        semantic_score * 0.3 +
        ai_result.get("match_score", 0.5) * 0.4
    )
    
    return MatchScoreResponse(
        match_score=round(final_score, 2),
        strengths=ai_result.get("strengths", []),
        gaps=ai_result.get("gaps", []),
        keywords_to_add=ai_result.get("keywords_to_add", []),
        recommended_bullets=ai_result.get("recommended_bullets", []),
        confidence=ai_result.get("confidence", 0.8),
        ats_score=ai_result.get("ats_score")
    )

@app.post("/agents/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(req: TailorResumeRequest):
    """Tailor resume for specific job"""
    
    prompt = f"""
    Job Description:
    {req.job_description}
    
    Job Title: {req.user_profile.get('target_title', '')}
    Industry: {req.user_profile.get('industry', '')}
    
    Original Resume:
    {req.original_resume}
    
    Style: {req.style}
    Tone: {req.tone}
    Length: {req.length}
    
    Instructions:
    1. Create a professional summary tailored to this job
    2. Reorder experience sections by relevance
    3. Rewrite bullet points using keywords from job description
    4. Highlight quantifiable achievements
    5. Ensure ATS compatibility
    6. Keep {req.length} length
    """
    
    try:
        response = await async_client.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4-turbo-preview"
            messages=[
                {"role": "system", "content": RESUME_TAILOR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        tailored_resume = response.choices[0].message.content
        
        # Analyze changes
        changes = analyze_resume_changes(req.original_resume, tailored_resume)
        
        # Calculate optimization score
        optimization_score = calculate_optimization_score(
            tailored_resume, 
            req.job_description
        )
        
        return TailorResumeResponse(
            tailored_resume=tailored_resume,
            changes_made=changes,
            optimization_score=optimization_score
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/agents/generate-cover-letter", response_model=GenerateCoverLetterResponse)
async def generate_cover_letter(req: GenerateCoverLetterRequest):
    """Generate cover letter for job"""
    
    salutation = f"Dear {req.hiring_manager}" if req.hiring_manager else "Dear Hiring Manager"
    
    prompt = f"""
    Job Description:
    {req.job_description}
    
    Company: {req.company_name}
    {salutation}
    
    Candidate Information:
    - Name: {req.user_profile.get('name', 'Candidate')}
    - Skills: {', '.join(req.user_profile.get('skills', []))}
    - Experience: {req.user_profile.get('experience_summary', '')}
    
    Write a professional cover letter.
    """
    
    try:
        response = await async_client.chat.completions.create(
            model="gpt-5-turbo",  
            messages=[
                {"role": "system", "content": COVER_LETTER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        cover_letter = response.choices[0].message.content
        
        # Extract keywords included
        keywords = extract_keywords_from_text(cover_letter, req.job_description)
        
        return GenerateCoverLetterResponse(
            cover_letter=cover_letter,
            tone="professional",
            word_count=len(cover_letter.split()),
            keywords_included=keywords[:10]  # Top 10 keywords
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/agents/batch-match")
async def batch_match_jobs(
    user_profile: Dict[str, Any],
    job_descriptions: List[str],
    resume_text: Optional[str] = None
):
    """Batch match user against multiple jobs"""
    results = []
    
    for job_desc in job_descriptions[:10]:  # Limit to 10 for performance
        req = MatchScoreRequest(
            user_profile=user_profile,
            job_description=job_desc,
            resume_text=resume_text
        )
        
        # Use async for better performance
        result = await match_score(req)
        results.append({
            "job_description": job_desc[:100] + "...",  # Truncate
            "match_score": result.match_score,
            "strengths": result.strengths[:3],  # Top 3
            "gaps": result.gaps[:3]  # Top 3
        })
    
    # Sort by match score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {"matches": results}

@app.post("/agents/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse resume file"""
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    content = await file.read()
    
    # Simple text extraction (in production, use a proper parser)
    try:
        text_content = content.decode('utf-8')
    except:
        # For PDF/DOCX, you'd use a library like python-docx, pdfminer
        text_content = "Resume content could not be extracted automatically."
    
    return {
        "filename": file.filename,
        "content_preview": text_content[:500] + "..." if len(text_content) > 500 else text_content,
        "word_count": len(text_content.split()),
        "extracted_skills": extract_skills_from_text(text_content)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "jobapplier-ai-agent",
        "openai_status": "connected" if api_key else "no_key",
        "timestamp": asyncio.get_event_loop().time()
    }

# Helper Functions
def calculate_keyword_score(user_skills: List[str], resume_text: str, job_description: str) -> float:
    """Calculate keyword overlap score"""
    if not job_description:
        return 0.0
    
    job_desc_lower = job_description.lower()
    all_user_text = " ".join(user_skills) + " " + resume_text.lower()
    
    # Extract keywords from job description (simple version)
    job_keywords = set([
        word.lower() for word in job_description.split() 
        if len(word) > 3 and word.isalpha()
    ])
    
    # Count matches
    matches = sum(1 for keyword in job_keywords if keyword in all_user_text)
    
    if not job_keywords:
        return 0.0
    
    return min(1.0, matches / len(job_keywords))

def calculate_semantic_score(user_profile: Dict, resume_text: str, job_description: str) -> float:
    """Calculate semantic similarity using embeddings"""
    user_text = json.dumps(user_profile, ensure_ascii=False) + " " + resume_text
    
    if not user_text or not job_description:
        return 0.5
    
    # Generate embeddings
    try:
        user_embedding = embedding_model.encode(user_text)
        job_embedding = embedding_model.encode(job_description)
        
        # Cosine similarity
        similarity = np.dot(user_embedding, job_embedding) / (
            np.linalg.norm(user_embedding) * np.linalg.norm(job_embedding)
        )
        
        # Normalize to 0-1
        return max(0.0, min(1.0, (similarity + 1) / 2))
    except Exception:
        return 0.5

async def get_ai_match_analysis(user_profile: Dict, resume_text: Optional[str], job_description: str) -> Dict:
    """Get AI-powered match analysis"""
    user_blob = json.dumps(user_profile, ensure_ascii=False)
    
    user_content = f"""USER_PROFILE:
{user_blob}

RESUME_TEXT:
{resume_text or "No resume provided"}

JOB_DESCRIPTION:
{job_description}

Analyze the match between the candidate and job."""
    
    try:
        response = await async_client.chat.completions.create(
            model="gpt-5.2-turbo",  # Use gpt-4 for better analysis
            messages=[
                {"role": "system", "content": MATCH_SCORE_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content
        return json.loads(result_text)
        
    except Exception as e:
        print(f"AI analysis failed: {e}")
        return {
            "match_score": 0.5,
            "strengths": ["Analysis unavailable"],
            "gaps": ["Could not analyze gaps"],
            "keywords_to_add": [],
            "recommended_bullets": [],
            "confidence": 0.5,
            "ats_score": None
        }

def analyze_resume_changes(original: str, tailored: str) -> Dict[str, Any]:
    """Analyze changes between original and tailored resume"""
    orig_words = original.lower().split()
    tailored_words = tailored.lower().split()
    
    orig_set = set(orig_words)
    tailored_set = set(tailored_words)
    
    added = list(tailored_set - orig_set)
    removed = list(orig_set - tailored_set)
    
    return {
        "words_added": len(added),
        "words_removed": len(removed),
        "length_change_percent": ((len(tailored_words) - len(orig_words)) / max(len(orig_words), 1)) * 100,
        "top_keywords_added": [w for w in added if len(w) > 5][:10]
    }

def calculate_optimization_score(resume: str, job_description: str) -> float:
    """Calculate how optimized the resume is for the job"""
    # Extract nouns and technical terms from job description
    job_words = set([
        word.lower() for word in job_description.split() 
        if len(word) > 4 and word.isalpha()
    ])
    
    resume_lower = resume.lower()
    matches = sum(1 for word in job_words if word in resume_lower)
    
    if not job_words:
        return 0.5
    
    return min(1.0, matches / len(job_words))

def extract_keywords_from_text(text: str, source_text: str) -> List[str]:
    """Extract keywords that appear in both texts"""
    # Simple implementation
    text_words = set(text.lower().split())
    source_words = set(source_text.lower().split())
    
    common = text_words.intersection(source_words)
    return [word for word in common if len(word) > 3][:20]

def extract_skills_from_text(text: str) -> List[str]:
    """Extract potential skills from text (simplified)"""
    # Common tech skills (you'd want a comprehensive list)
    common_skills = {
        'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws',
        'docker', 'kubernetes', 'machine learning', 'data analysis',
        'project management', 'agile', 'scrum', 'leadership', 'communication'
    }
    
    found_skills = []
    text_lower = text.lower()
    
    for skill in common_skills:
        if skill in text_lower:
            found_skills.append(skill)
    
    return found_skills[:10]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)