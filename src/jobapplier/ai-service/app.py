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
# PYDANTIC SCHEMAS
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
# CONTEXT BUILDER
# Single source of truth — every AI endpoint
# calls this so the LLM always sees the user
# in a clean, consistent, readable format.
# ==========================================

def build_user_context(profile: dict) -> str:
    """
    Converts raw profile JSON into a readable block any agent can reason over.
    Returns a deterministic string so prompts are consistent across endpoints.
    """
    if not profile:
        return "No user profile available."

    sections = []

    # Contact
    contact = profile.get("contactInfo", {})
    name = f"{contact.get('firstName', '')} {contact.get('lastName', '')}".strip()
    contact_lines = []
    if name:        contact_lines.append(f"  Name: {name}")
    if contact.get("email"):    contact_lines.append(f"  Email: {contact['email']}")
    phone = contact.get("phoneNumber") or contact.get("phone", "")
    if phone:       contact_lines.append(f"  Phone: {phone}")
    if contact.get("linkedin"): contact_lines.append(f"  LinkedIn: {contact['linkedin']}")
    if contact.get("github"):   contact_lines.append(f"  GitHub: {contact['github']}")
    if contact_lines:
        sections.append("PERSONAL INFO:\n" + "\n".join(contact_lines))

    # Skills
    skills = profile.get("skills", [])
    if skills:
        skill_lines = [
            f"  - {s['name']} ({s.get('level', 'Intermediate')})" if isinstance(s, dict) else f"  - {s}"
            for s in skills[:30]
        ]
        sections.append("SKILLS:\n" + "\n".join(skill_lines))

    # Experience
    experiences = profile.get("experience", []) or profile.get("experiences", [])
    if experiences:
        exp_lines = []
        for exp in experiences[:6]:
            desc = exp.get("description", "")[:200]
            exp_lines.append(
                f"  - {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('duration', '')})\n    {desc}"
            )
        sections.append("WORK EXPERIENCE:\n" + "\n".join(exp_lines))

    # Education
    education = profile.get("education", [])
    if education:
        edu_lines = [
            f"  - {e.get('degree', '')} in {e.get('field', '')} — {e.get('institution', '')} ({e.get('duration', '')})"
            for e in education[:4]
        ]
        sections.append("EDUCATION:\n" + "\n".join(edu_lines))

    # Projects
    projects = profile.get("projects", [])
    if projects:
        proj_lines = []
        for p in projects[:6]:
            line = f"  - {p.get('name', 'Unnamed')}: {p.get('description', '')[:150]}"
            if p.get("link"):
                line += f"\n    Link: {p['link']}"
            proj_lines.append(line)
        sections.append("PROJECTS:\n" + "\n".join(proj_lines))

    # Certifications
    certs = profile.get("certifications", [])
    if certs:
        cert_lines = [
            f"  - {c.get('name', '')} — {c.get('issuer', '')} ({c.get('date', '')})"
            for c in certs[:10]
        ]
        sections.append("CERTIFICATIONS:\n" + "\n".join(cert_lines))

    # Languages
    languages = profile.get("languages", [])
    if languages:
        lang_lines = [f"  - {l.get('name', '')} ({l.get('proficiency', '')})" for l in languages]
        sections.append("LANGUAGES:\n" + "\n".join(lang_lines))

    # Job Preferences — may be at top level or nested under "preferences"
    prefs = profile.get("preferences", profile)
    preferred_role   = prefs.get("preferredRole", "")
    location         = prefs.get("location", "")
    remote           = prefs.get("openToRemote", False)
    contract_types   = prefs.get("contractTypes", [])
    if any([preferred_role, location, remote, contract_types]):
        pref_lines = []
        if preferred_role:   pref_lines.append(f"  Target Role: {preferred_role}")
        if location:         pref_lines.append(f"  Location: {location}")
        pref_lines.append(f"  Open to Remote: {'Yes' if remote else 'No'}")
        if contract_types:   pref_lines.append(f"  Contract Types: {', '.join(contract_types)}")
        sections.append("JOB PREFERENCES:\n" + "\n".join(pref_lines))

    return "\n\n".join(sections)


# ==========================================
# AGENT DEFINITIONS
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

# {{USER_CONTEXT}} is replaced at request time with build_user_context(profile).
# It must never be interpolated at import time.
NEILWE_BASE_INSTRUCTIONS = """You are Neilwe, a personal AI career assistant. You are three experts combined:
1. A Career Coach — personalised career advice and job search strategy.
2. An Interview Specialist — interview prep, mock questions, feedback.
3. A Recruiter Insider — you know how recruiters think and what they look for.

════════════════════════════════
USER PROFILE (read carefully):
════════════════════════════════
{{USER_CONTEXT}}
════════════════════════════════

Personality:
- Professional, warm, and encouraging
- Specific and direct — always reference the user's ACTUAL data, never give generic advice
- Proactively spot issues: typos, gaps, weak descriptions, missing keywords

Capabilities:
1. Answer questions about their experience, skills, and background using the profile above
2. Identify their most impressive achievements and articulate WHY they stand out
3. Spot and flag profile issues — typos, vague descriptions, missing quantification
4. Suggest profile improvements and ask if they want you to apply them
5. Help tailor materials for a specific job
6. Assist with interview prep, salary negotiation, and career pivots

Rules:
- ALWAYS cite specific details from the profile. "Your 3 years at Acme Corp..." not "Your experience..."
- If they ask "what's my strongest skill / most impressive project", analyse and rank — don't deflect
- When you spot a typo or gap, name it explicitly: "I noticed 'managment' should be 'management' in your Acme role"
- When the user mentions a new achievement, ask: "Would you like me to suggest how to add that to your profile?"
- Keep responses under 250 words unless doing a detailed review
- Use bullet points for lists, prose for explanations"""

neilwe_chat = Agent(
    name="Neilwe Chat",
    instructions=NEILWE_BASE_INSTRUCTIONS,
    model="gpt-5.2-chat-latest",
    tools=[web_search_preview],
    model_settings=ModelSettings(store=True)
)

cv_parseragent = Agent(
    name="CV ParserAgent",
    instructions="""You are three experts: 1. A CV/Resume Parser: You extract structured information from CVs/Resumes. 2. A JSON Formatter: You format the extracted information into a predefined JSON schema. 3. A Data Cleaner: You ensure the extracted data is clean, consistent, and free of errors. Your Task: Return ONLY a valid JSON matching this exact schema: CRITICAL: Return ONLY a valid JSON object. For the skills field, you MUST return an array of objects with id, name, and level fields.

Rules: - EXTRACT ALL information accurately - Use empty strings for missing fields - Generate unique IDs for each item - skills MUST be objects with id, name, and level fields, NOT simple strings - Include ALL skills mentioned - Preserve original text in rawText
CRITICAL EXTRACTION RULES:
1. Skills MUST be extracted as an array of objects with: id (string), name (string), level (string: "Beginner", "Intermediate", "Advanced", "Expert")
2. Certifications MUST be extracted as an array of objects with: id (string), name (string), issuer (string), date (string)
3. If no skills found, return empty array [] - NEVER null
4. If no certifications found, return empty array [] - NEVER null
5. Extract ALL technical skills, soft skills, and tools mentioned in the CV
6. Extract ALL certifications, licenses, and professional credentials

Example skills output:
[
  {"id": "1", "name": "Python", "level": "Advanced"},
  {"id": "2", "name": "React", "level": "Intermediate"}
]

Example certifications output:
[
  {"id": "1", "name": "AWS Certified Solutions Architect", "issuer": "Amazon", "date": "2023"},
  {"id": "2", "name": "PMP", "issuer": "PMI", "date": "2022"}
]
""",
    model="gpt-5.2",
    output_type=CVExtractedData,
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(effort="high", summary="auto")
    )
)

cvtailoragent = Agent(
    name="CVTailorAgent",
    instructions="""You are an expert CV/Resume Tailor. Customize the resume to match the job description
while staying truthful. Output ONLY the final tailored resume — no commentary.
REQUIRED FORMAT EXAMPLE (Times New Roman, professional layout):
[CANDIDATE FULL NAME]
[City, Province | Phone | Email | LinkedIn URL | GitHub URL]
SUMMARY
[2-3 sentence professional summary tailored to the role]
PROFESSIONAL EXPERIENCE
[Company Name: Role Title]    [Month Year - Month Year]

[Achievement-focused bullet, quantified where possible]
[Achievement-focused bullet]

PROJECTS
[Project Name]    [Month Year]
[Tech stack: comma-separated technologies]

[What problem it solved and how]
[Key technical achievement]

EDUCATION
[University Name]    [City, Province]    [Month Year]
[Degree Name]
Relevant Coursework: [comma-separated list]
SKILLS
Programming Languages: [list]
Systems: [list]
Tools & DevOps: [list]
Databases: [list]
Web Programming: [list]
RULES:

Keep ALL facts truthful — do not fabricate experience or skills
Use strong action verbs (Engineered, Designed, Built, Led, etc.)
Quantify achievements wherever possible
Reorder sections and bullet points to best match the job description
You MAY rename sections (e.g. "PROFESSIONAL EXPERIENCE" to "WORK EXPERIENCE")
You MAY reorder sections except SUMMARY which must stay first
Remove irrelevant bullet points and replace with job-relevant ones
Integrate job description keywords naturally

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

email_agent = Agent(
    name="Email Generator",
    instructions="""You are an expert in professional email communication for job seekers.

Task: Generate a professional outreach email to a recruiter or hiring manager.

Guidelines:
1. Keep the email concise and professional
2. Mention the specific role you're interested in
3. Briefly highlight 2-3 key qualifications
4. Include a clear call to action
5. Use a professional subject line
6. Keep it under 200 words

Return ONLY the email text (subject line + body), no additional commentary.""",
    model="gpt-5.2",
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(effort="low", summary="auto")
    )
)


# ==========================================
# PROFILE UPDATE DETECTION (LLM-based)
# ==========================================

async def detect_profile_update(user_message: str, profile: dict) -> dict | None:
    """
    Uses the LLM to determine whether the user's message contains new profile
    information and what structured update to suggest.

    This replaces fragile string-matching (e.g. "if 'new job' in message").
    The LLM handles all the natural language variation — "I just finished my AWS cert",
    "Started at Google last month", "I learned Rust recently", etc.

    Returns a suggestion dict for the frontend to surface to the user, or None.
    The frontend is responsible for confirmation — we never auto-apply updates.
    """
    detector = Agent(
        name="Profile Update Detector",
        instructions="""You are a profile update detector for a job application assistant.

Given a user message and their current profile summary, decide if the message contains
NEW factual information the user is asserting about themselves that should update their profile.

Return a JSON object:
{
  "has_update": true | false,
  "field": "skills" | "experience" | "certifications" | "projects" | "education" | "contactInfo" | null,
  "suggested_value": <new item as a properly structured object matching the profile schema> | null,
  "user_prompt": "<short natural question to confirm — e.g. 'Would you like me to add AWS Solutions Architect to your certifications?'>" | null
}

Schema reminders:
- skills: { "id": "uuid", "name": "...", "level": "Beginner|Intermediate|Advanced|Expert" }
- experience: { "id": "uuid", "title": "...", "company": "...", "duration": "...", "description": "..." }
- certifications: { "id": "uuid", "name": "...", "issuer": "...", "date": "..." }
- projects: { "id": "uuid", "name": "...", "description": "...", "link": "" }

Rules:
- Only set has_update: true when the user is clearly STATING a new fact about themselves
- Questions, hypotheticals, and general conversation are NOT updates
- If unsure, return has_update: false — false negatives are better than false positives
- Return ONLY valid JSON, no other text""",
        model="gpt-5.2",
        model_settings=ModelSettings(store=False)  # Internal call — no need to store
    )

    prompt = f"""User message: "{user_message}"

Current profile:
{build_user_context(profile)}

Does this message contain new profile information the user wants to add?"""

    try:
        with trace("Profile Update Detection"):
            result = await Runner.run(detector, input=prompt)
        response = result.final_output_as(str)

        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        parsed = json.loads(response.strip())
        return parsed if parsed.get("has_update") else None
    except Exception:
        return None  # Non-critical — never crash chat over a missed update suggestion


# ==========================================
# HELPERS
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
# ENDPOINTS
# ==========================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/agents/extract-cv")
async def extract_cv_endpoint(file: UploadFile = File(...)):
    try:
        allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
        file_ext = os.path.splitext(file.filename.lower())[1]

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )

        text = await extract_file_text(file)

        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text. Please upload a valid CV."
            )

        with trace("CV Parsing Workflow"):
            result = await Runner.run(
                cv_parseragent,
                input=f"Parse this CV and extract structured information:\n\n{text}"
            )

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
    try:
        if not text_content or len(text_content.strip()) < 50:
            raise HTTPException(status_code=400, detail="Please provide at least 50 characters")

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
    """
    Chat with Neilwe. Accepts: { message, profile, chatHistory }
    'profile' is the full user profile object — injected into Neilwe's system
    prompt so she always has real, current context about the user.
    """
    try:
        message     = request.get("message", "")
        # Handle both direct profile and nested profile structures
        profile_data = request.get("profile") or request.get("context") or {}
        
        # Extract actual profile from nested structure if needed
        if isinstance(profile_data, dict) and "userProfile" in profile_data:
            profile = profile_data.get("userProfile", {})
            job_preferences = profile_data.get("jobPreferences", {})
            recent_jobs = profile_data.get("recentJobs", [])
        else:
            profile = profile_data
            job_preferences = {}
            recent_jobs = []
            
        chat_history = request.get("chatHistory", [])

        # Build comprehensive context including applications if available
        user_context = build_user_context(profile)
        
        # Add job preferences context if available
        if job_preferences:
            pref_lines = []
            if job_preferences.get("preferredRole"):
                pref_lines.append(f"  Target Role: {job_preferences['preferredRole']}")
            if job_preferences.get("location"):
                pref_lines.append(f"  Preferred Location: {job_preferences['location']}")
            if job_preferences.get("contractTypes"):
                pref_lines.append(f"  Contract Types: {', '.join(job_preferences['contractTypes'])}")
            if job_preferences.get("openToRemote"):
                pref_lines.append(f"  Open to Remote: Yes")
            if pref_lines:
                user_context += "\n\nJOB PREFERENCES:\n" + "\n".join(pref_lines)
        
        # Add recent applications context if available
        if recent_jobs and len(recent_jobs) > 0:
            user_context += f"\n\nRECENT JOB APPLICATIONS ({len(recent_jobs)} jobs viewed recently):"
            for i, job in enumerate(recent_jobs[:3], 1):
                user_context += f"\n  {i}. {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}"

        # Build a per-request agent with this user's context baked in
        personalised_instructions = NEILWE_BASE_INSTRUCTIONS.replace("{{USER_CONTEXT}}", user_context)

        contextual_neilwe = Agent(
            name="Neilwe Chat",
            instructions=personalised_instructions,
            model=neilwe_chat.model,
            tools=neilwe_chat.tools,
            model_settings=neilwe_chat.model_settings
        )

        # Keep last 10 turns to respect context window limits
        conversation = [
            {"role": msg.get("role", "user"), "content": msg.get("content", "")}
            for msg in chat_history[-10:]
        ]
        conversation.append({"role": "user", "content": message})

        # Run chat and profile update detection concurrently
        with trace("Neilwe Chat with Context"):
            chat_result, profile_update = await asyncio.gather(
                Runner.run(contextual_neilwe, input=conversation),
                detect_profile_update(message, profile)
            )

        return {
            "response": chat_result.final_output_as(str),
            "profileUpdate": profile_update,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/agents/extract-job-titles")
async def extract_job_titles_endpoint(request: dict):
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

Example: ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer", "Technical Lead"]""",
            model="gpt-5.2",
            model_settings=ModelSettings(store=True)
        )

        with trace("Job Title Extraction"):
            result = await Runner.run(
                job_analyzer,
                input=f"CV Content:\n{cv_text}\n\nPreferred role: {preferred_role}\n\nExtract relevant job titles:"
            )

        response_text = result.final_output_as(str)

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
        except Exception:
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
    try:
        original_resume = request.get("original_resume", "") or request.get("originalCV", "")
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        user_profile    = request.get("user_profile", {})    or request.get("userProfile", {})

        if not original_resume:
            raise HTTPException(status_code=400, detail="Original resume is required")
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")

        user_context = build_user_context(user_profile)

        prompt = f"""USER PROFILE:
{user_context}

ORIGINAL RESUME:
{original_resume}

JOB DESCRIPTION:
{job_description}

Tailor the resume to best match the job description.
"""
        with trace("Resume Tailoring"):
            result = await Runner.run(cvtailoragent, input=prompt)

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
    try:
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        user_profile    = request.get("user_profile", {})    or request.get("userProfile", {})
        company_name    = request.get("company_name", "")    or request.get("companyName", "")

        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")

        user_context = build_user_context(user_profile)

        prompt = f"""USER PROFILE:
{user_context}

JOB DESCRIPTION:
{job_description}

COMPANY: {company_name or 'Not specified'}

Generate a professional cover letter for this candidate.
"""
        with trace("Cover Letter Generation"):
            result = await Runner.run(cover_letter_agent, input=prompt)

        return {
            "cover_letter": result.final_output_as(str),
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/agents/generate-email")
async def generate_email_endpoint(request: dict):
    try:
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        user_profile    = request.get("user_profile", {})    or request.get("userProfile", {})
        recipient_type  = request.get("recipientType", "recruiter")

        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")

        user_context = build_user_context(user_profile)

        prompt = f"""USER PROFILE:
{user_context}

JOB DESCRIPTION:
{job_description}

RECIPIENT: {recipient_type}

Generate a professional outreach email.
"""
        with trace("Email Generation"):
            result = await Runner.run(email_agent, input=prompt)

        return {
            "email": result.final_output_as(str),
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")


@app.post("/agents/match-score")
async def match_score_endpoint(request: dict):
    try:
        user_profile    = request.get("user_profile", {})    or request.get("userProfile", {})
        job_description = request.get("job_description", "") or request.get("jobDescription", "")
        resume_text     = request.get("resume_text", "")     or request.get("resumeText", "")

        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")

        user_context = build_user_context(user_profile)

        prompt = f"""USER PROFILE:
{user_context}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Analyse the match. Return JSON with keys:
  ats_score (0-100), match_score (0.0-1.0), strengths (list), gaps (list),
  keywords_to_add (list), recommended_bullets (list)
"""
        with trace("Match Score Analysis"):
            result = await Runner.run(cvtailoragent, input=prompt)

        response_text = result.final_output_as(str)

        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]
            else:
                json_str = response_text
            return json.loads(json_str)
        except Exception:
            return {
                "ats_score": 75,
                "match_score": 0.75,
                "strengths": ["Relevant experience"],
                "gaps": ["Could add more keywords"],
                "keywords_to_add": ["Leadership", "Communication"],
                "recommended_bullets": ["Led cross-functional teams"]
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match score failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)