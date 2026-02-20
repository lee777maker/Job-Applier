# Product Specification

> **Version:** 3.0  
> **Date:** February 2026  
> **Author:** Lethabo Neo  
> **Status:** Beta

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for JobApplier AI — an intelligent job application assistant designed for South African job seekers.

### 1.2 Scope

JobApplier AI streamlines the job search process by:
- Automating CV parsing and profile creation
- Providing personalised job recommendations
- Generating tailored application materials (CVs, cover letters)
- Calculating ATS compatibility scores
- Tracking application progress
- Offering AI-powered career coaching and preparation

### 1.3 Definitions

| Term | Definition |
|------|------------|
| **ATS** | Applicant Tracking System — software used by employers to filter CV |
| **Neilwe** | AI career coach assistant |
| **CV** | Curriculum Vitae / Resume |
| **POPIA** | Protection of Personal Information Act (South Africa) |

---

## 2. System Features

### 2.1 User Authentication & Profile Management

**Priority:** High

**Description:** Secure user registration, authentication, and profile management.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users can register with email, password, first name, and last name | High |
| FR-1.2 | System validates email uniqueness during registration | High |
| FR-1.3 | Passwords hashed using Argon2 (3 iterations, 65536 memory, 1 parallelism) | High |
| FR-1.4 | Users can log in with email and password | High |
| FR-1.5 | System supports password reset via email | Medium |
| FR-1.6 | Users can update profile information | High |
| FR-1.7 | Profile stores contact info, experience, education, skills, projects, certifications | High |
| FR-1.8 | System enforces POPIA compliance for personal data | High |

**User Flow:**
```
Register → Upload CV → Extract Data → Review Profile → Set Preferences → Dashboard
```

---

### 2.2 CV Intelligence Engine

**Priority:** High

**Description:** Automated CV parsing using AI to extract structured data from PDF and Word documents.

**Supported Formats:** PDF, DOCX, DOC, TXT

**Maximum File Size:** 10MB

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Accept CV uploads in PDF, DOCX, DOC, and TXT formats | High |
| FR-2.2 | Reject files larger than 10MB | High |
| FR-2.3 | Extract text using PDFMiner (PDF) or python-docx (DOCX) | High |
| FR-2.4 | Parse CV using GPT-4 to extract structured data | High |
| FR-2.5 | Extract contact info: name, email, phone, LinkedIn, GitHub | High |
| FR-2.6 | Extract up to 7 work experience entries | High |
| FR-2.7 | Extract up to 4 education entries | High |
| FR-2.8 | Extract up to 35 skills with proficiency levels | High |
| FR-2.9 | Extract up to 6 projects | Medium |
| FR-2.10 | Extract up to 15 certifications | Medium |
| FR-2.11 | Suggest 3-5 relevant job titles based on CV content | High |
| FR-2.12 | Store original CV text for future processing | Medium |

**Extracted Data Schema:**
```json
{
  "contactInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string"
  },
  "experiences": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [...],
  "skills": [
    {
      "id": "string",
      "name": "string",
      "level": "Beginner|Intermediate|Advanced|Expert"
    }
  ],
  "projects": [...],
  "certifications": [...],
  "languages": [...],
  "rawText": "string"
}
```

---

### 2.3 Job Discovery Engine

**Priority:** High

**Description:** Real-time job search and recommendation system aggregating listings from Indeed and LinkedIn.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Search job listings from Indeed and LinkedIn | High |
| FR-3.2 | Filter jobs to South Africa region by default | High |
| FR-3.3 | Support search by keyword, location, job type, remote option | High |
| FR-3.4 | Retrieve jobs posted within last 30 days by default | High |
| FR-3.5 | Deduplicate job listings based on application URL | High |
| FR-3.6 | Calculate initial match scores based on keyword relevance | High |
| FR-3.7 | Enhance match scores based on user's skills overlap | High |
| FR-3.8 | Support searching by user profile with AI-suggested job titles | High |
| FR-3.9 | Return up to 50 job results per query | Medium |
| FR-3.10 | Display job title, company, location, description, URL, date, type, salary | High |

**Job Search Parameters:**
```json
{
  "keyword": "Software Engineer",
  "location": "Johannesburg, South Africa",
  "remote": false,
  "job_type": "full-time",
  "max_results": 20,
  "days_old": 30,
  "sites": ["indeed", "linkedin"]
}
```

---

### 2.4 ATS Matching Engine

**Priority:** High

**Description:** AI-powered ATS compatibility analysis comparing user CV against job descriptions.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Calculate ATS compatibility score (0-100) | High |
| FR-4.2 | Calculate match score (0.0-1.0) | High |
| FR-4.3 | Identify and list candidate's strengths | High |
| FR-4.4 | Identify and list gaps between profile and job requirements | High |
| FR-4.5 | Extract and recommend keywords to add to resume | High |
| FR-4.6 | Generate recommended bullet points tailored to job | High |
| FR-4.7 | Provide analysis within 10 seconds | Medium |
| FR-4.8 | Cache analysis results for identical CV-job pairs | Low |

**Response Schema:**
```json
{
  "ats_score": 85,
  "match_score": 0.85,
  "strengths": [
    "5+ years Python experience matches requirement",
    "Strong leadership background"
  ],
  "gaps": [
    "Missing AWS certification",
    "No mention of Agile methodology"
  ],
  "keywords_to_add": [
    "AWS",
    "Agile",
    "Scrum",
    "CI/CD"
  ],
  "recommended_bullets": [
    "Led Agile development teams using Scrum methodology",
    "Implemented CI/CD pipelines reducing deployment time by 40%"
  ]
}
```

---

### 2.5 Resume Tailoring Engine

**Priority:** High

**Description:** AI-powered resume customization to align with specific job descriptions.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Accept original resume and job description as input | High |
| FR-5.2 | Generate tailored resume highlighting relevant experience | High |
| FR-5.3 | Integrate job description keywords naturally | High |
| FR-5.4 | Maintain truthful representation — no fabricated experience | Critical |
| FR-5.5 | Use professional formatting | High |
| FR-5.6 | Quantify achievements where possible | Medium |

---

### 2.6 Cover Letter Generator

**Priority:** High

**Description:** Generate personalized cover letters based on user profile and job description.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Generate cover letter from user profile and job description | High |
| FR-6.2 | Address letter to hiring manager when name available | Medium |
| FR-6.3 | Highlight 2-3 most relevant qualifications | High |
| FR-6.4 | Explain why user is a good fit for role and company | High |
| FR-6.5 | Maintain professional yet personable tone | High |
| FR-6.6 | Keep letter concise (1 page max) | High |

---

### 2.7 Email Generator

**Priority:** Medium

**Description:** Generate professional outreach emails to recruiters or hiring managers.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Generate outreach email from user profile and job description | Medium |
| FR-7.2 | Support recruiter and hiring manager recipient types | Medium |
| FR-7.3 | Include professional subject line | Medium |
| FR-7.4 | Briefly highlight 2-3 key qualifications | Medium |
| FR-7.5 | Include clear call to action | Medium |
| FR-7.6 | Keep under 200 words | Medium |

---

### 2.8 AI Career Coach (Neilwe)

**Priority:** High

**Description:** Personal AI assistant for job search strategy, interview prep, and career advice.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Answer questions about user's experience and skills | High |
| FR-8.2 | Identify most impressive achievements | High |
| FR-8.3 | Spot and flag profile issues (typos, gaps, weak descriptions) | High |
| FR-8.4 | Suggest profile improvements | High |
| FR-8.5 | Assist with interview preparation | High |
| FR-8.6 | Provide salary negotiation advice | Medium |
| FR-8.7 | Support career pivot discussions | Medium |
| FR-8.8 | Use web search for current market information | Medium |
| FR-8.9 | Keep responses under 250 words unless detailed review | Medium |
| FR-8.10 | Detect profile updates from chat messages | High |

**Neilwe Capabilities:**
- Career coaching and strategy
- Interview preparation and mock questions
- Recruiter insights
- Profile review and optimization
- Job-specific advice

---

### 2.9 Application Tracking

**Priority:** High

**Description:** Track job applications with status, notes, and outcomes.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | Create application record with company, role, location | High |
| FR-9.2 | Store application URL and source | High |
| FR-9.3 | Track status: applied, interviewing, offered, rejected | High |
| FR-9.4 | Store application notes | Medium |
| FR-9.5 | Record match score at time of application | Medium |
| FR-9.6 | Update application status | High |
| FR-9.7 | View application history | High |

**Application Statuses:**
- `DRAFT` — Application being prepared
- `APPLIED` — Application submitted
- `INTERVIEWING` — In interview process
- `OFFERED` — Offer received
- `REJECTED` — Application rejected
- `ACCEPTED` — Offer accepted
- `DECLINED` — Offer declined

---

### 2.10 Dashboard Analytics

**Priority:** Medium

**Description:** Visual analytics for job search progress.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | Display total applications count | Medium |
| FR-10.2 | Show interview rate percentage | Medium |
| FR-10.3 | Show offer rate percentage | Medium |
| FR-10.4 | Display status breakdown (applied, interviewing, offered, rejected) | Medium |
| FR-10.5 | Show weekly activity chart | Low |
| FR-10.6 | Display match score trend over time | Low |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Page load time | < 3 seconds |
| NFR-1.2 | CV parsing completion | < 15 seconds |
| NFR-1.3 | ATS score calculation | < 10 seconds |
| NFR-1.4 | Job search results | < 30 seconds |
| NFR-1.5 | Neilwe chat response | < 5 seconds |
| NFR-1.6 | Concurrent users supported | 100 |

### 3.2 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-2.1 | Password hashing with Argon2 | Critical |
| NFR-2.2 | HTTPS in production | Critical |
| NFR-2.3 | Input validation on all endpoints | High |
| NFR-2.4 | POPIA compliance | High |
| NFR-2.5 | No sensitive data in logs | High |

### 3.3 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | System uptime | 99.5% |
| NFR-3.2 | Data backup frequency | Daily |
| NFR-3.3 | Recovery time objective (RTO) | 4 hours |

### 3.4 Usability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-4.1 | Mobile-responsive design | High |
| NFR-4.2 | Clear error messages | High |
| NFR-4.3 | Onboarding tutorial | Medium |
| NFR-4.4 | In-app tooltips | Medium |

---

## 4. User Interface Requirements

### 4.1 Pages

| Page | Description |
|------|-------------|
| Welcome | Landing page with feature overview |
| Login/Register | Authentication forms |
| CV Upload | File upload with progress |
| Profile | Edit personal info, experience, education, skills |
| Job Preferences | Set target role, location, contract types |
| Dashboard | Job listings with chat panel |
| Application History | List of tracked applications |
| ATS Score | Match analysis for specific job |
| Cover Letter | Generated cover letter view |

### 4.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, chat as overlay |
| Tablet | 640-1024px | Two columns, collapsible chat |
| Desktop | > 1024px | Full layout with resizable panels |

---

## 5. External Dependencies

| Service | Purpose | Criticality |
|---------|---------|-------------|
| OpenAI API | LLM features | Critical |
| Indeed/LinkedIn | Job listings | High |
| PostgreSQL | Primary database | Critical |
| Redis | Session cache | Medium |

---

## 6. Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| LinkedIn Integration | Direct LinkedIn profile import | Medium |
| Email Notifications | Application status updates | Medium |
| Interview Prep Module | Mock interviews, question bank | Medium |
| Auto-Application | Automated form filling | Low |
| Mobile App | React Native companion | Low |
| HR Portal | Recruiter analytics dashboard | Low |
