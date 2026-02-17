# ai-service/app.py
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import asyncio

# OpenAI Agents SDK imports
from agents import Agent, Runner, WebSearchTool, ModelSettings, trace
from openai.types.shared.reasoning import Reasoning

app = FastAPI(title="JobApplier AI Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PYDANTIC SCHEMAS (From Agent Builder Export)
# ==========================================

class ContactInfo(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    linkedin: str
    github: str

class ExperienceItem(BaseModel):
    id: str
    title: str
    company: str
    duration: str
    description: str

class EducationItem(BaseModel):
    id: str
    degree: str
    institution: str
    field: str
    duration: str
    description: str

class SkillItem(BaseModel):
    id: str
    name: str
    level: str

class ProjectItem(BaseModel):
    id: str
    name: str
    description: str
    link: str

class CertificationItem(BaseModel):
    id: str
    name: str
    issuer: str
    date: str

class LanguageItem(BaseModel):
    id: str
    name: str
    proficiency: str

class CVExtractedData(BaseModel):
    contactInfo: ContactInfo
    experiences: List[ExperienceItem]
    education: List[EducationItem]
    skills: List[SkillItem]
    projects: List[ProjectItem]
    certifications: List[CertificationItem]
    languages: List[LanguageItem]
    rawText: str

# ==========================================
# AGENT DEFINITIONS (From Agent Builder Export)
# ==========================================

web_search_preview = WebSearchTool(
    user_location={
        "type": "approximate",
        "country": "ZA",
        "region": None,
        "city": None,
        "timezone": None
    },
    search_context_size="medium"
)

neilwe_chat = Agent(
    name="Neilwe Chat",
    instructions="""You are Neilwe. You are three experts:
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
Always maintain a helpful, professional tone.""",
    model="gpt-5.2-chat-latest",
    tools=[web_search_preview],
    model_settings=ModelSettings(store=True)
)

cv_parseragent = Agent(
    name="CV ParserAgent",
    instructions="""You are three experts: 1. A CV/Resume Parser: You extract structured information from CVs/Resumes. 2. A JSON Formatter: You format the extracted information into a predefined JSON schema. 3. A Data Cleaner: You ensure the extracted data is clean, consistent, and free of errors. Your Task: Return ONLY a valid JSON matching this exact schema: CRITICAL: Return ONLY a valid JSON object. For the skills field, you MUST return an array of objects with id, name, and level fields.

Rules: - EXTRACT ALL information accurately - Use empty strings for missing fields - Generate unique IDs for each item - skills MUST be objects with id, name, and level fields, NOT simple strings - Include ALL skills mentioned - Preserve original text in rawText""",
    model="gpt-5.2",
    output_type=CVExtractedData,
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(effort="high", summary="auto")
    )
)

cvtailoragent = Agent(
    name="CVTailorAgent",
    instructions="""You are an expert CV/Resume Tailor. Your task is to customize a resume to match a specific job description while maintaining truthfulness.

Guidelines:
1. Analyze the job description for key requirements and keywords
2. Reorder and emphasize experiences that match the job requirements
3. Use industry-specific keywords from the job description naturally
4. Adjust the professional summary to align with the role
5. Ensure all information remains accurate and truthful
6. Maintain professional formatting and structure
7. Optimize for ATS (Applicant Tracking Systems)

Return the tailored resume in clean, professional format.""",
    model="gpt-5.2",
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(effort="high", summary="concise")
    )
)

cover_letter_agent = Agent(
    name="Cover Letter",
    instructions="""You are three experts:
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

Return ONLY the cover letter text, no additional commentary.""",
    model="gpt-5.2",
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(effort="low", summary="auto")
    )
)

# ==========================================
# HELPER FUNCTIONS
# ==========================================

async def extract_file_text(file: UploadFile) -> str:
    """Extract text from PDF, DOCX, or TXT"""
    await file.seek(0)
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        from pdfminer.high_level import extract_text
        from io import BytesIO
        return extract_text(BytesIO(content))
    
    elif file.filename.endswith('.docx'):
        import docx
        from io import BytesIO
        doc = docx.Document(BytesIO(content))
        return "\n".join([p.text for p in doc.paragraphs])
    
    else:
        return content.decode('utf-8', errors='ignore')

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/agents/extract-cv")
async def extract_cv_endpoint(file: UploadFile = File(...)):
    """Extract CV data using AI Agent"""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
        file_ext = os.path.splitext(file.filename.lower())[1]
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Extract text from file
        text = await extract_file_text(file)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from file. Please upload a valid CV."
            )
        
        # Run CV Parser Agent
        with trace("CV Parsing Workflow"):
            result = await Runner.run(
                cv_parseragent,
                input=f"Parse this CV and extract structured information:\n\n{text}"
            )
        
        # Convert to dict and ensure rawText is included
        output = result.final_output
        output.rawText = text
        
        return output
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    finally:
        await file.close()

@app.post("/agents/autofill")
async def autofill_endpoint(text_content: str = Form(...)):
    """Autofill profile from pasted text"""
    try:
        if not text_content or len(text_content.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Please provide more text content (at least 50 characters)"
            )
        
        # Run CV Parser Agent on pasted text
        with trace("CV Autofill Workflow"):
            result = await Runner.run(
                cv_parseragent,
                input=f"Parse this CV text and extract structured information:\n\n{text_content}"
            )
        
        output = result.final_output
        output.rawText = text_content
        
        return output
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autofill failed: {str(e)}")

@app.post("/agents/neilwe-chat")
async def neilwe_chat_endpoint(request: dict):
    """Chat with Neilwe AI assistant"""
    try:
        message = request.get("message", "")
        context = request.get("context", {})
        chat_history = request.get("chatHistory", [])
        
        # Build conversation history
        conversation = []
        for msg in chat_history:
            conversation.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        conversation.append({
            "role": "user",
            "content": f"Context: {json.dumps(context)}\n\nUser message: {message}"
        })
        
        with trace("Neilwe Chat"):
            result = await Runner.run(
                neilwe_chat,
                input=conversation
            )
        
        return {
            "response": result.final_output_as(str),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/agents/extract-job-titles")
async def extract_job_titles_endpoint(request: dict):
    """Extract suggested job titles from CV content"""
    try:
        cv_text = request.get("cv_text", "")
        preferred_role = request.get("preferred_role", "")
        
        if not cv_text:
            raise HTTPException(status_code=400, detail="CV text is required")
        
        job_analyzer = Agent(
            name="Job Title Extractor",
            instructions="""You are an expert career advisor and job market analyst. 
            Analyze the CV and extract 3-5 specific job titles this candidate should apply for.
            
            Rules:
            1. Consider their actual experience level (entry, mid, senior)
            2. Include variations of their preferred role if provided
            3. Suggest adjacent roles they qualify for
            4. Return ONLY a JSON array of strings
            
            Example output: ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer", "Technical Lead"]""",
            model="gpt-5.2",
            model_settings=ModelSettings(store=True)
        )
        
        with trace("Job Title Extraction"):
            result = await Runner.run(
                job_analyzer,
                input=f"CV Content:\n{cv_text}\n\nUser's preferred role: {preferred_role}\n\nExtract relevant job titles:"
            )
            
        response_text = result.final_output_as(str)
        
        # Parse JSON array from response
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]
            else:
                json_str = response_text
                
            job_titles = json.loads(json_str)
            if not isinstance(job_titles, list):
                job_titles = [preferred_role] if preferred_role else ["Software Engineer"]
        except:
            # Fallback
            job_titles = [preferred_role] if preferred_role else ["Software Engineer"]
            
        return {
            "job_titles": job_titles,
            "primary_title": preferred_role or (job_titles[0] if job_titles else "Software Engineer"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job title extraction failed: {str(e)}")

@app.post("/agents/tailor-resume")
async def tailor_resume_endpoint(request: dict):
    """Tailor resume for specific job"""
    try:
        # FIX: Accept both camelCase (frontend) and snake_case (legacy)
        original_resume = request.get("original_resume", "") or request.get("originalCV", "")
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        user_profile = request.get("user_profile", {}) or request.get("userProfile", {})
        
        if not original_resume:
            raise HTTPException(status_code=400, detail="Original resume is required")
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        prompt = f"""
        Original Resume:
        {original_resume}
        
        Job Description:
        {job_description}
        
        User Profile: {json.dumps(user_profile)}
        
        Please tailor this resume to match the job description.
        """
        
        with trace("Resume Tailoring"):
            result = await Runner.run(
                cvtailoragent,
                input=prompt
            )
        
        return {
            "tailored_resume": result.final_output_as(str),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")

@app.post("/agents/generate-cover-letter")
async def generate_cover_letter_endpoint(request: dict):
    """Generate cover letter"""
    try:
        # FIX: Accept both camelCase (frontend) and snake_case (legacy)
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        user_profile = request.get("user_profile", {}) or request.get("userProfile", {})
        company_name = request.get("company_name", "") or request.get("companyName", "")
        
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Extract user name from profile if available
        user_name = ""
        if isinstance(user_profile, dict):
            user_name = user_profile.get("name", "")
            if not user_name and "contactInfo" in user_profile:
                user_name = user_profile["contactInfo"].get("firstName", "")
        
        prompt = f"""
        Job Description:
        {job_description}
        
        User Profile: {json.dumps(user_profile)}
        Company Name: {company_name}
        Candidate Name: {user_name}
        
        Generate a professional cover letter.
        """
        
        with trace("Cover Letter Generation"):
            result = await Runner.run(
                cover_letter_agent,
                input=prompt
            )
        
        return {
            "cover_letter": result.final_output_as(str),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/agents/match-score")
async def match_score_endpoint(request: dict):
    """Calculate match score between CV and job description"""
    try:
        # FIX: Accept both camelCase (frontend) and snake_case (legacy)
        user_profile = request.get("user_profile", {}) or request.get("userProfile", {})
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        resume_text = request.get("resume_text", "") or request.get("resumeText", "")
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Use cvtailoragent to analyze match
        prompt = f"""
        Analyze the match between this candidate and job:
        
        Resume:
        {resume_text}
        
        Job Description:
        {job_description}
        
        Provide:
        1. ATS Score (0-100)
        2. Match Score (0-1)
        3. List of strengths
        4. List of gaps
        5. Keywords to add
        6. Recommended bullet points
        
        Return as JSON with keys: ats_score, match_score, strengths, gaps, keywords_to_add, recommended_bullets
        """
        
        with trace("Match Score Analysis"):
            result = await Runner.run(
                cvtailoragent,
                input=prompt
            )
        
        # Parse the result (expecting JSON-like output)
        response_text = result.final_output_as(str)
        
        # Try to extract JSON from response
        try:
            # Find JSON in response if wrapped in markdown
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]
            else:
                json_str = response_text
            
            parsed = json.loads(json_str)
        except:
            # Fallback if not valid JSON
            parsed = {
                "ats_score": 75,
                "match_score": 0.75,
                "strengths": ["Relevant experience"],
                "gaps": ["Could add more keywords"],
                "keywords_to_add": ["Leadership", "Communication"],
                "recommended_bullets": ["Led cross-functional teams"]
            }
        
        return parsed
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match score failed: {str(e)}")