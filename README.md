# AI Automated Job Applier
<p align="center">
  <img src="docs/HomePage.png" alt="Recommended Jobs" width="900" />
</p>

## JobApplier AI

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.0-6DB33F?logo=spring-boot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</p>

<p align="center">
  <b>AI-Powered Job Application Assistant</b><br>
  Automate your job search with intelligent resume tailoring, ATS optimization, and personalized cover letters.
</p>

<h4 align="center">
  <a href="https://discord.com/channels/1466486232027500815/1466486232585470163">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="discord" style="height: 20px;">
  </a>
  <a href="https://www.linkedin.com/in/lethabo-neo/">
    <img src="https://img.shields.io/badge/-LinkedIn-blue?style=flat-square&logo=Linkedin&logoColor=white&link=YOUR_LINKEDIN_URL" alt="linkedin" style="height: 20px;">
  </a>
</h4>

## Introduction

This system streamlines job applications by leveraging AI to:
- Tailor CV based on **experience, education, skills, projects**
- Generate **custom cover letters** from job descriptions and personal information
- Recommend relevant jobs automatically
- Message recruiters
- Reduce repetitive manual work end-to-end
  
This happens seamlessly and intelligently, adapting as it learns more about you.
<details open>
<p align="center">
  <img src="docs/Profile.png" alt="Recommended Jobs" width="900" />
</p>
<p align="center">
  <img src="docs/Jobs.png" alt="Recommended Jobs" width="900" />
</p>
</details>

## Key Features

- **Real Job Listings** - Live job listing from South Africa (last 30 days)
- **AI Chat Assistant (Neilwe)** - Personal career coach for job search strategy
- **CV Intelligence** - Upload PDF/DOCX and auto-extract skills, experience, education
- **ATS Optimization** - Match scoring and keyword recommendations
- **Cover Letter Generator** - Tailored cover letters in seconds
- **Resume Tailoring** - AI-optimized resumes for specific job postings
- **Dashboard Analytics** - Track applications and match scores
- **Location-Based Search** - Johannesburg, Cape Town, Durban, Pretoria, or Remote

<details>
<summary>📸 Screenshots</summary>
<p align="center">
  <img src="docs/Dashboard.png" alt="CV analysis" width="800" />
  <img src="docs/ProfilePage.png" alt="Profile management" width="800" />
</p>
</details>

## Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui components
- **React Router** for navigation
- **Context API** for state management

### Backend
- Spring Boot 3.2 with Java 21
- Spring Security with Argon2 password hashing
- JPA/Hibernate with H2 (dev) / PostgreSQL (prod)
- RestTemplate for service communication

### AI Service
- **Python 3.11** with FastAPI (Main AI service)
- **OpenAI GPT-5.2** - Language model integration
- **Sentence Transformers** - Semantic similarity matching
- **PDFMiner & python-docx** - Document parsing
- **JobSpy** - Indeed job scraping


> ⚠️ This is a **prototype**. Many agents are still under active development.

## Usage 
You can run the project locally for testing and exploration.


## Pre-requisites
- Docker & Docker Compose (recommended)
OR:
- Java 21 and Maven
- Python 3.11
- OpenAI API key
- Node.js 18


## 🚀 Quick Start (Docker)

The easiest way to run the full stack:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/jobapplier-ai.git
cd jobapplier-ai

# 2. Set your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key-here" > ai-service/.env

# 3. Start all services
docker-compose up --build

# 4. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
# JobSpy:   http://localhost:8002
```

## Future work
- LinkedIn job integration
- Automated application submission
- Interview prepation module
- Mobile App (React Native)
- Email notifications

  
## Usage

### Getting Started
1. **Upload Your Resume**
   - Click the paperclip icon in the chat
   - Upload PDF, DOCX, or TXT files
   - The AI will extract skills and content

2. **Paste Job Description**
   - Copy a job posting into the chat
   - The AI automatically detects job descriptions

3. **Ask for Help**
   - "Tailor my resume for this job"
   - "What's my ATS match score?"
   - "Generate a cover letter"

### Example Commands

```
"Tailor my CV for this position"
"Calculate my match score"
"Write a cover letter for Deloitte"
"What skills am I missing?"
"Optimize my resume for ATS"
```
## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   AI Service    │
│   (React)       │◄────│  (Spring Boot)  │◄────│   (FastAPI)     │
│   TypeScript    │     │                 │     │                 │
│ • Chat UI       │     │ • REST API      │     │ • GPT-4         │
│ • Profile       │     │ • Auth          │     │ • Embeddings    │
│ • Dashboard     │     │ • Job Mgmt      │     │ • Resume Parser │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                              │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │                 │
                    └─────────────────┘
```

## API Endpoints

### AI Service (`http://localhost:8001`)
| Endpoint                        | Method |Description              |
|---------------------------------|--------|---------------------------|
| `/agents/neilwe-chat`           | POST   | Chat with AI assistant    |
| `/agents/match-score`           | POST   | Calculate ATS match score |
| `/agents/tailor-resume`         | POST   | Tailor resume for job     |
| `/agents/generate-cover-letter` | POST   | Generate cover letter     |
| `/agents/extract-cv`            | POST   | Parse resume pdf/docx     |
| `/health`                       | GET    | Health check              |

### Jobs (`http://localhost:8002`)
| Endpoint  | Method | Description         |
|-----------|--------|--------------------|
| `/seacrh` | POST   | Search Indeed jobs |
| `/health` | GET    | Health check       |

### Backend API (`http://localhost:8080`)
| Endpoint                             | Method |Description              |
|--------------------------------------|--------|-------------------------|
| `/api/auth/register`                 | POST   | User registration       |
| `/api/auth/login`                    | POST   | User login              |
| `/api/jobs/recommendations/{userId}` | GET    | Get personalized jobs   |
| `/api/profile/{userId}`              | GET/PUT| User profile management |
| `/api/ai/**`                         | Various| Proxy to AI service     |


## Configuration

### Environment Variables

| Variable               | Service    | Description                         |
|------------------------|------------|-------------------------------------|
| `OPENAI_API_KEY`       | AI Service | Required for GPT-5 features         |
| `JOBSPY_SERVICE_URL`   | Backend    | Default: http://jobspy-service:8002 |
| `AI_SERVICE_URL`       | Backend    | Default: http://ai-service:8001 |
| `CORS_ALLOWED_ORIGINS` | Backend    | Default: http://localhost:5173 |

### Job search Configuration
Edit jobspy_service.py to customize:
Location: Johannesburg, Cape Town, Durban, Pretoria, Remote
Job Types: full-time, part-time, contract, internship
Sites: indeed (primary), linkedin (backup)
Days: Last 30 days default

## Testing

```bash
# Run all tests
./start.sh test

# AI Service tests
cd ai-service && pytest tests/

# Backend tests
cd backend && ./mvnw test

# Frontend tests
cd frontend && npm test

# Test JobSpy
curl -X POST http://localhost:8002/search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "software engineer",
    "location": "Johannesburg",
    "max_results": 5,
    "days_old": 30,
    "sites": ["indeed"]
  }' | jq .

expected:
[
  {
    "id": "0",
    "title": "Senior Software Engineer",
    "company": "Standard Bank",
    "location": "Johannesburg, GP, ZA",
    "apply_url": "https://za.indeed.com/viewjob?jk=...",
    "job_type": "fulltime"
  }
]
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or use the start script
./start.sh docker
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for more details.


## License

This project is licensed under the MIT License - see the [LICENSE](docs/LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for GPT-5.2 API
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [JobSpy](https://github.com/speedyapply/JobSpy) for job scraping

<p align="center">
  Made with ❤️ for job seekers everywhere
</p>
