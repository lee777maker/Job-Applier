import json
import os
from typing import Any, Dict, List, Optional, Union
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI, AsyncOpenAI
from sentence_transformers import SentenceTransformer
import numpy as np
import pdfminer
import docx
import re
# Load environment variables from .env file (backup safety measure)
load_dotenv()

app = FastAPI(title="JobApplier AI Agent")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # In production, restrict to your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=api_key)
async_client = AsyncOpenAI(api_key=api_key)

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

#   ==============================
#           Models
#   ==============================

class ContactInfo(BaseModel):
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""

class Experience(BaseModel):
    id: str=""
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""

class Education(BaseModel):
    id: str=""
    degree: str = ""
    institution: str = ""
    field: str = ""
    duration: str = ""
    description: str = ""

class Project(BaseModel):
    id: str=""
    name: str = ""
    description: str = ""
    link: str = ""

class Certification(BaseModel):
    id: str=""
    name: str = ""
    issuer: str = ""
    date: str = ""

class Skill(BaseModel):
    id: str=""
    name: str = ""
    level: str = ""

class Language(BaseModel):
    id: str=""
    name: str = ""
    proficiency: str = ""
    
class CVExtractedData(BaseModel):
    contactInfo: ContactInfo = ContactInfo()
    experiences: List[Experience] = []
    educations: List[Education] = []
    projects: List[Project] = []
    certifications: List[Certification] = []
    skills: List[Union[str,Skill]] = []
    languages: List[Language] = []
    rawText: str = ""


class MatchScoreRequest(BaseModel):
    userPrfile: Dict[str, Any]
    jobDescription: str = Field(min_length=30)
    resumeText: Optional[str] = None

class MatchScoreResponse(BaseModel):
    matchScore: float = Field(ge=0, le=1.0)
    strengths: List[str]
    gaps: List[str]
    keywords_to_add: List[str]
    recommened_bullets: List[str]
    confidence: float = Field(ge=0, le=1.0)
    atsScore:  Optional[float] = Field(default=None, ge=0, le=100.0)

class TailorCVRequest(BaseModel):
    orginalCV: str
    jobDescription: str 
    userProfile: Dict[str, Any]
    style: Optional[str] = "professional"
    tone: Optional[str] = "professional"
    length: Optional[str] = "standard"

class TailorCVResponse(BaseModel):
    tailoredCV: str
    changesMade: Dict[str, Any]
    optimizationScore: float

class GenerateCoverLetterRequest(BaseModel):
    jobDescription: str
    userProfile: Dict[str, Any]
    companyName: Optional[str] = ""
    hiringManager: Optional[str] = ""
    style: Optional[str] = "professional"
    tone: Optional[str] = "professional"
    length: Optional[str] = "standard"

class NeilweChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = {}
    chatHistory: Optional[List[Dict[str, str]]] = []

class NeilweChatResponse(BaseModel):
    response: str
    suggestedActions: List[str]
    confidence: float

class JobRequest(BaseModel):
    query: str
    location: Optional[str] = ""
    page: Optional[int] = 1


##   ============================== 
#     Prompts
#   ==============================

CV_EXTRACTION_SYSTEM_PROMPT = """You are three experts:
1. A CV/Resume Parser: You extract structured information from CVs/Resumes.
2. A JSON Formatter: You format the extracted information into a predefined JSON schema.
3. A Data Cleaner: You ensure the extracted data is clean, consistent, and free of errors.

CRITICAL: Return ONLY a valid JSON object. For the skills field, you MUST return an array of objects with id, name, and level fields.
Format:
{
  "contactInfo": {
    "firstName": string,
    "lastName": string,
    "email": string,
    "phone": string,
    "linkedin": string,
    "github": string
    },
    "experiences": [
    {
      "id": string,
      "title": string,
      "company": string,
      "duration": string,
      "description": string
    }],
    "education": [
    {
      "id": string,
      "degree": string,
      "institution": string,
      "field": string,
      "duration": string,
      "description": string
    }],
    "skills": [
    {
      "id": string,
      "name": string,
      "level": string
    }],

    "projects": [
    {
      "id": string,
      "name": string,
      "description": string,
      "link": string
    }],
    "certifications": [
    {
      "id": string,
      "name": string,
      "issuer": string,
      "date": string
    }],
    "languages": [
    {
        "id": string,
        "name": string,
        "proficiency": string
    }],
    "rawText": "string (original extracted text)"
}
Rules:
- EXTRACT ALL information accurately
- Use empty strings for missing fields
- Generate unique IDs for each item
- skills MUST be objects with id, name, and level fields, NOT simple strings
- Include ALL skills mentioned
- Preserve original text in rawText
    
    """
NEILWE_SYSTEM_PROMPT = """You are Neilwe. You are three experts:
1. A Career Coach: You provide personalized career advice and job search assistance.
2. An Interview Specialist: You help users prepare for interviews with tips and mock questions.
3. A Recruiter assistant: You help JobApplier recruit talent.


Your personality:
- Professional yet friendly and encouraging
- Knowledgeable about job markets, careers, and recruitment
- Proactive in offering helpful suggestions
- Concise but thorough in your responses

Your capabilities:
1. Job Recommendations - Help users find suitable jobs based on their profile
2. Interview Preparation - Provide tips, conduct mock interviews, give feedback
3. Resume/CV Optimization - Suggest improvements, ATS tips, keyword optimization
4. Career Advice - Guide on career paths, skill development, salary negotiations
5. Company Insights - Provide information about companies and roles
6. Application Assistance - Help with cover letters, outreach emails

When responding:
- Be specific and actionable
- Use bullet points for lists
- Ask clarifying questions when needed
- Suggest next steps or actions
- Keep responses under 200 words when possible

Context you may receive:
- User profile (skills, experience, education)
- Job preferences (role, location, contract type)
- Recent job matches
- Previous chat history

Always maintain a helpful, professional tone.
"""

MATCH_SCORE_SYSTEM_PROMPT = """You are a three experts:
1. A Job Matching Specialist: You analyze user profiles and job descriptions to determine fit.
2. A Career Advisor: You identify strengths and gaps in user profiles relative to job requirements.
3. An ATS Optimization Expert: You suggest improvements to enhance ATS compatibility.

Your Task: Return ONLY valid JSON matching this schema:

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
- Be realistic; do not exaggerate match_score
- Base output strictly on provided user_profile/resume_text vs job_description
- Keep bullet recommendations concise and ATS-friendly
- ats_score: Estimate ATS compatibility score (0-100) based on formatting, keywords, structure
"""

RESUME_TAILOR_SYSTEM_PROMPT = """You are three experts:
1. A Resume Optimization Specialist: You enhance resumes to better align with job descriptions.
2. A Career Coach: You provide actionable suggestions to improve resume effectiveness.
3. An ATS Expert: You ensure resumes are optimized for Applicant Tracking Systems.

Task: Optimize the provided resume to align with the job description.

Guidelines:
1. Preserve all factual information (dates, companies, education, certifications)
2. Add a professional summary at the top tailored to this job
3. Reorder experience sections by relevance to the job
4. Rewrite bullet points to include keywords from the job description
5. Highlight quantifiable achievements with metrics
6. Ensure ATS compatibility (clear formatting, standard sections)
7. Keep the requested style and tone

Return ONLY the tailored resume text, no additional commentary.
"""

COVER_LETTER_SYSTEM_PROMPT = """You are three experts:
1. A Cover Letter Writer: You craft compelling cover letters tailored to job descriptions.
2. A Career Advisor: You ensure cover letters effectively highlight user strengths and fit.
3. A Professional Communicator: You maintain a polished and engaging tone.

Task: Generate a cover letter based on the job description and user profile.

Guidelines:
1. Address the letter to the hiring manager (use provided name if available)
2. Start with a strong opening that captures attention
3. Highlight relevant skills, experiences, and achievements
4. Explain why the user is a great fit for the role and company
5. Maintain a professional yet personable tone
6. Keep the letter concise (1 page max)

Return ONLY the cover letter text, no additional commentary.

"""

def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        from io import BytesIO
        from pdfminer.high_level import extract_text

        with BytesIO(file) as pdf_file:
            text = extract_text(pdf_file)
        return text
    except ImportError:
        return "PDF parsing not implemented. Please install pdfminer.six to enable this feature."
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"
    
def extract_text_from_docx(file: UploadFile) -> str:
    try:
        from io import BytesIO
        import docx

        with BytesIO(file) as docx_file:
            doc = docx.Document(docx_file)
            text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except ImportError:
        return "DOCX parsing not implemented. Please install python-docx to enable this feature."
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"
    

def extract_skills_from_text(text: str) -> List[str]:
    # Placeholder skill extraction logic
    common_skills = {
        'python', 'java', 'javascript', 'typescript', 'react', 'node.js', 'sql',
        'aws', 'docker', 'kubernetes', 'machine learning', 'data analysis',
        'project management', 'agile', 'scrum', 'leadership', 'communication',
        'spring boot', 'fastapi', 'postgresql', 'mongodb', 'redis',
        'git', 'github', 'ci/cd', 'jenkins', 'terraform', 'ansible',
        'html', 'css', 'tailwind', 'bootstrap', 'vue', 'angular',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
        'tableau', 'powerbi', 'excel', 'google analytics',
        'product management', 'ux design', 'figma', 'sketch',
        'salesforce', 'hubspot', 'crm', 'marketing automation'}
    
    extracted_skills = []
    text_lower = text.lower()
    for skill in common_skills:
        if skill in text_lower:
            extracted_skills.append(skill)

    return extracted_skills[:20]

def clean_resume_text(text: str) -> str:
    """
    Normalize and sanitize resume text:
    - Ensure consistent newlines
    - Remove non-printable and non-ascii characters
    - Collapse excessive whitespace and newlines
    - Trim leading/trailing whitespace
    """
    if not text:
        return ""
    import re

    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove non-ascii characters (keep basic unicode if desired, adjust as needed)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)

    # Remove control characters except newline and tab
    text = ''.join(ch for ch in text if ch.isprintable() or ch in '\n\t')

    # Collapse multiple spaces/tabs into single space
    text = re.sub(r'[ \t]+', ' ', text)

    # Collapse 3+ newlines into 2 newlines to keep paragraph breaks
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Strip leading/trailing whitespace
    return text.strip()

def calculate_keyword_score(user_skills: List[str], resume_text: str, job_description: str) -> float:
    """Calculate keyword overlap score"""
    if not job_description:
        return 0.0
    
    job_desc_lower = job_description.lower()
    all_user_text = " ".join(user_skills).lower() + " " + resume_text.lower()
    
    job_keywords = set([
        word.lower() for word in job_description.split() 
        if len(word) > 3 and word.isalpha()
    ])
    
    matches = sum(1 for keyword in job_keywords if keyword in all_user_text)
    
    if not job_keywords:
        return 0.0
    
    return min(1.0, matches / len(job_keywords))

def calculate_semantic_score(user_profile: Dict, resume_text: str, job_description: str) -> float:
    """Calculate semantic similarity using embeddings"""
    user_text = json.dumps(user_profile, ensure_ascii=False) + " " + resume_text
    
    if not user_text or not job_description:
        return 0.5
    
    try:
        user_embedding = embedding_model.encode(user_text)
        job_embedding = embedding_model.encode(job_description)
        
        similarity = np.dot(user_embedding, job_embedding) / (
            np.linalg.norm(user_embedding) * np.linalg.norm(job_embedding)
        )
        
        return max(0.0, min(1.0, (similarity + 1) / 2))
    except Exception:
        return 0.5

#   ==============================
# API Endpoints
#   ==============================
@app.post("/agents/extract-cv", response_model=CVExtractedData)
async def extract_cv(file: UploadFile = File(...)):
    """Extract structured data from uploaded CV"""
    if not file.filename.endswith(('.pdf', '.docx', '.txt', '.doc')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT")
    
    content = await file.read()
    text_content = ""
    
    try:
        if file.filename.endswith('.pdf'):
            text_content = extract_text_from_pdf(content)
        elif file.filename.endswith('.docx'):
            text_content = extract_text_from_docx(content)
        else:
            text_content = content.decode('utf-8', errors='ignore')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
    
    cleaned_text = clean_resume_text(text_content)
    
    # Use OpenAI to extract structured data
    try:
        response = await async_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": CV_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract information from this resume:\n\n{cleaned_text}"}
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        result['rawText'] = cleaned_text
        
        # Ensure all required fields exist with defaults
        if 'contactInfo' not in result:
            result['contactInfo'] = {"firstName": "", "lastName": "", "email": "", "phone": "", "linkedin": "", "github": ""}
        if 'experiences' not in result:
            result['experiences'] = []
        if 'education' not in result:
            result['educations'] = []
        if 'projects' not in result:
            result['projects'] = []
        if 'certifications' not in result:
            result['certifications'] = []
        if 'languages' not in result:
            result['languages'] = []
        
        # Normalize skills to handle both string list and object list
        if 'skills' not in result:
            result['skills'] = []
        else:
            normalized_skills = []
            for i, skill in enumerate(result['skills']):
                if isinstance(skill, str):
                    # Convert string to Skill object
                    normalized_skills.append({
                        "id": str(i + 1),
                        "name": skill,
                        "level": ""
                    })
                elif isinstance(skill, dict):
                    # Ensure dict has all required fields
                    normalized_skills.append({
                        "id": str(skill.get('id', i + 1)),
                        "name": skill.get('name', ''),
                        "level": skill.get('level', '')
                    })
            result['skills'] = normalized_skills
        
        return CVExtractedData(**result)
        
    except Exception as e:
        # Fallback: return basic extraction with empty structured data
        return CVExtractedData(
            contactInfo=ContactInfo(),
            experiences=[],
            educations=[],
            skills=[], 
            projects=[],
            certifications=[],
            languages=[],
            rawText=cleaned_text
        )

@app.post("/agents/neilwe-chat", response_model=NeilweChatResponse)
async def neilwe_chat(req: NeilweChatRequest):
    """Chat with Neilwe - the AI career coach"""
    
    # Build context from user profile if available
    context_str = ""
    if req.context:
        if 'userProfile' in req.context:
            context_str += f"\nUser Profile: {json.dumps(req.context['userProfile'])}"
        if 'jobPreferences' in req.context:
            context_str += f"\nJob Preferences: {json.dumps(req.context['jobPreferences'])}"
        if 'recentJobs' in req.context:
            context_str += f"\nRecent Job Matches: {json.dumps(req.context['recentJobs'][:3])}"
    
    # Build chat history
    history_str = ""
    for msg in req.chat_history[-5:]:  # Last 5 messages
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        history_str += f"\n{role}: {content}"
    
    prompt = f"""Context:{context_str}

Chat History:{history_str}

User: {req.message}

Respond as Neilwe, the AI career coach. Be helpful, specific, and actionable."""
    
    try:
        response = await async_client.chat.completions.create(
            model="openai/gpt-5.2",
            messages=[
                {"role": "system", "content": NEILWE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content
        
        # Generate suggested actions based on the conversation
        suggested_actions = []
        lower_msg = req.message.lower()
        
        if 'job' in lower_msg or 'position' in lower_msg:
            suggested_actions = ["View recommended jobs", "Search for specific role", "Set job alerts"]
        elif 'interview' in lower_msg:
            suggested_actions = ["Start mock interview", "View common questions", "Schedule practice session"]
        elif 'resume' in lower_msg or 'cv' in lower_msg:
            suggested_actions = ["Get ATS score", "Tailor for job", "Upload new CV"]
        elif 'skill' in lower_msg or 'learn' in lower_msg:
            suggested_actions = ["View skill recommendations", "Find courses", "Set learning goals"]
        else:
            suggested_actions = ["View dashboard", "Update profile", "Chat with Neilwe"]
        
        return NeilweChatResponse(
            response=response_text,
            suggested_actions=suggested_actions,
            confidence=0.9
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neilwe error: {str(e)}")

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
    user_blob = json.dumps(req.user_profile, ensure_ascii=False)
    
    user_content = f"""USER_PROFILE:
{user_blob}

RESUME_TEXT:
{req.resume_text or "No resume provided"}

JOB_DESCRIPTION:
{req.job_description}

Analyze the match between the candidate and job."""
    
    try:
        response = await async_client.chat.completions.create(
            model="openai/gpt-5.2",
            messages=[
                {"role": "system", "content": MATCH_SCORE_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        ai_result = json.loads(response.choices[0].message.content)
        
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
        
    except Exception as e:
        # Fallback response
        return MatchScoreResponse(
            match_score=round((keyword_score + semantic_score) / 2, 2),
            strengths=["Analysis unavailable - using basic scoring"],
            gaps=["Could not analyze gaps"],
            keywords_to_add=[],
            recommended_bullets=[],
            confidence=0.5,
            ats_score=None
        )

@app.post("/agents/tailor-resume", response_model=TailorCVResponse)
async def tailor_resume(req: TailorCVRequest):
    """Tailor resume for specific job"""
    
    prompt = f"""Job Description:
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
6. Keep {req.length} length"""
    
    try:
        response = await async_client.chat.completions.create(
            model="openai/gpt-5.2",
            messages=[
                {"role": "system", "content": RESUME_TAILOR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2500
        )
        
        tailored_resume = response.choices[0].message.content
        
        # Analyze changes
        orig_words = set(req.original_resume.lower().split())
        tailored_words = set(tailored_resume.lower().split())
        added = list(tailored_words - orig_words)
        removed = list(orig_words - tailored_words)
        
        changes = {
            "words_added": len(added),
            "words_removed": len(removed),
            "length_change_percent": ((len(tailored_resume.split()) - len(req.original_resume.split())) / max(len(req.original_resume.split()), 1)) * 100,
            "top_keywords_added": [w for w in added if len(w) > 5][:10]
        }
        
        # Calculate optimization score
        job_words = set([
            word.lower() for word in req.job_description.split() 
            if len(word) > 4 and word.isalpha()
        ])
        matches = sum(1 for word in job_words if word in tailored_resume.lower())
        optimization_score = min(1.0, matches / len(job_words)) if job_words else 0.5
        
        return TailorCVResponse(
            tailored_resume=tailored_resume,
            changes_made=changes,
            optimization_score=round(optimization_score, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/agents/generate-cover-letter")
async def generate_cover_letter(req: GenerateCoverLetterRequest):
    """Generate cover letter for job"""
    
    salutation = f"Dear {req.hiring_manager}" if req.hiring_manager else "Dear Hiring Manager"
    
    prompt = f"""Job Description:
{req.job_description}

Company: {req.company_name}
{salutation}

Candidate Information:
- Name: {req.user_profile.get('name', 'Candidate')}
- Skills: {', '.join(req.user_profile.get('skills', []))}
- Experience: {req.user_profile.get('experience_summary', '')}

Write a professional cover letter (250-400 words) that:
1. Addresses the hiring manager appropriately
2. Highlights 2-3 key skills matching the job
3. Shows enthusiasm for the company/role
4. Is 3-4 paragraphs
5. Includes a call to action"""
    
    try:
        response = await async_client.chat.completions.create(
            model="openai/gpt-5.2",
            messages=[
                {"role": "system", "content": "You are a professional cover letter writer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        cover_letter = response.choices[0].message.content
        
        # Extract keywords included
        job_keywords = set(req.job_description.lower().split())
        cover_keywords = set(cover_letter.lower().split())
        keywords_included = list(job_keywords.intersection(cover_keywords))[:10]
        
        return {
            "cover_letter": cover_letter,
            "tone": "professional",
            "word_count": len(cover_letter.split()),
            "keywords_included": keywords_included
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/agents/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse resume file"""
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    content = await file.read()
    text_content = ""
    
    try:
        if file.filename.endswith('.pdf'):
            text_content = extract_text_from_pdf(content)
        elif file.filename.endswith('.docx'):
            text_content = extract_text_from_docx(content)
        else:
            text_content = content.decode('utf-8', errors='ignore')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")
    
    return {
        "filename": file.filename,
        "content_preview": text_content[:500] + "..." if len(text_content) > 500 else text_content,
        "word_count": len(text_content.split()),
        "extracted_skills": extract_skills_from_text(text_content)
    }

@app.post("/agents/search-jobs")
async def search_jobs(req: JobRequest):
    """Search for jobs using Google Careers API (mock implementation)"""
    
    # This would integrate with Google Careers API in production
    # For now, return mock data
    
    mock_jobs = [
        {
            "id": f"job-{i}",
            "title": f"{req.query} Position",
            "company": ["Google", "Microsoft", "Amazon", "Meta", "Apple"][i % 5],
            "location": req.location or "Remote",
            "description": f"Exciting {req.query} opportunity...",
            "applicationUrl": "https://careers.google.com",
            "matchScore": 0.9 - (i * 0.05)
        }
        for i in range(5)
    ]
    
    return {
        "jobs": mock_jobs,
        "total": len(mock_jobs),
        "page": req.page
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "jobapplier-ai-enhanced",
        "version": "2.0.0",
        "openai_status": "connected" if api_key else "no_key",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)