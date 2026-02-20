# Architecture Overview

## System Architecture

JobApplier AI follows a microservices architecture with clear separation of concerns across four main services:
```
(_Incoming draw.io file_)
```

## Service Descriptions

### 1. Frontend Service (React + TypeScript)

**Port:** 5173 (dev) / 8080 (production via Nginx)

**Responsibilities:**
- User interface and experience
- State management via React Context
- API communication with backend services
- File upload handling (CVs)
- Real-time chat interface (Neilwe)

**Key Technologies:**
- React 18 with hooks
- TypeScript for type safety
- Vite for fast development
- Tailwind CSS for styling
- shadcn/ui component library
- React Markdown for chat rendering

**Key Components:**
- `AppContext.tsx` - Global state management
- `api.ts` - API client layer
- `Navigation.tsx` - App navigation
- `HomePage.tsx` - Main dashboard with job listings and chat

### 2. Backend Service (Spring Boot)

**Port:** 8080

**Responsibilities:**
- User authentication and authorisation
- Profile management
- Application tracking
- Job recommendation orchestration
- Database persistence
- API proxying to AI service

**Key Technologies:**
- Spring Boot 3.2
- Java 21
- Spring Security with Argon2 password hashing
- Spring Data JPA
- PostgreSQL (production) / H2 (development)

**Package Structure:**
```
jobapplier/
├── api/           # REST controllers
│   └── rest/      # REST endpoints
├── config/        # Configuration classes
│   ├── SecurityConfig.java
│   └── AppConfig.java
├── model/         # JPA entities
│   ├── User.java
│   ├── Job.java
│   ├── Application.java
│   ├── Resume.java
│   └── Task.java
├── repository/    # Spring Data repositories
│   ├── UserRepository.java
│   ├── JobRepository.java
│   ├── ApplicationRepository.java
│   └── TaskRepository.java
└── service/       # Business logic
    ├── Manager.java
    ├── AuditService.java
    └── JobSpyClient.java
```

### 3. AI Service (Python FastAPI)

**Port:** 8001

**Responsibilities:**
- CV parsing and extraction
- CV tailoring
- Cover letter generation
- ATS match scoring
- Email generation
- AI career coaching (Neilwe)

**Key Technologies:**
- Python 3.11
- FastAPI framework
- OpenAI Agents SDK
- GPT-4/5.2 models
- PDFMiner for PDF parsing
- python-docx for Word documents

**Agent Architecture:**
```python
# Core Agents
- cv_parseragent        # Extracts structured data from CVs
- cvtailoragent         # Tailors CV for specific jobs
- cover_letter_agent    # Generates cover letters
- email_agent           # Generates outreach emails
- neilwe_chat           # AI career coach with web search

# Helper Functions
- build_user_context()  # Formats profile for LLM consumption
- detect_profile_update() # Detects profile updates from chat
- extract_file_text()   # Extracts text from PDF/DOCX/TXT
```

### 4. JobSpy Service (Python FastAPI)

**Port:** 8002

**Responsibilities:**
- Job scraping from Indeed and LinkedIn
- Job deduplication
- Match score calculation
- Profile-based job search

**Key Technologies:**
- Python 3.11
- FastAPI
- JobSpy library
- Pandas for data processing

## Data Flow

### User Registration Flow
```
1. User submits registration form (Frontend)
2. Backend validates and hashes password with Argon2
3. User record created in PostgreSQL
4. JWT token returned (future implementation)
5. User redirected to CV upload
```

### CV Upload & Processing Flow
```
1. User uploads CV (PDF/DOCX) (Frontend)
2. File sent to AI Service /agents/extract-cv
3. AI Service extracts text using PDFMiner/python-docx
4. GPT-5 parses structured data (contact, experience, skills, etc.)
5. Structured JSON returned to Frontend
6. Frontend populates profile form
7. User confirms and saves to Backend
```

### Job Search Flow
```
1. User sets job preferences (Frontend)
2. Frontend calls Backend /api/jobs/search-by-profile
3. Backend calls JobSpy Service /search-by-profile
4. JobSpy scrapes Indeed/LinkedIn
5. Results deduplicated and scored
6. Jobs returned to Frontend
7. Frontend displays with match scores
```

### Application Tracking Flow
```
1. User clicks "I Applied" on a job (Frontend)
2. Application data sent to Backend /api/applications
3. Backend creates application record
4. Application stored with status, notes, job description
5. User can update status via Dashboard
```

## Database Schema

### Entity Relationship Diagram

```
(_Incoming draw.io file_)
```

### Table Definitions

**users**
- Primary user account storage
- Argon2 password hashing
- JSON profile data

**resumes**
- CV file metadata
- One-to-one with users

**jobs**
- Scraped job listings
- Stores job description and URL

**applications**
- User job applications
- Tracks status (applied, interviewing, offered, rejected)
- Stores application notes and match score

**tasks**
- Background task tracking
- Linked to applications

## Security Architecture

### Authentication
- Argon2id password hashing (3 iterations, 65536 memory, 1 parallelism)
- Stateless session (JWT planned for future)
- CORS configured for development

### Authorization
- Spring Security filter chain
- Public endpoints: `/api/auth/**`, `/actuator/health`
- Semi-protected: `/api/**` (development mode)

### Data Protection
- POPIA compliance considerations
- No sensitive data in logs
- HTTPS in production

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  frontend:    # Nginx serving React build
  backend:     # Spring Boot with health checks
  ai-service:  # FastAPI with OpenAI
  jobspy:      # FastAPI job scraper
  postgres:    # PostgreSQL 15
  redis:       # Redis 7 (session cache)
  nginx:       # Reverse proxy (production)
```

### Resource Allocation

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---------|-----------|--------------|-------------|----------------|
| Frontend | 0.5 | 512M | 0.25 | 256M |
| Backend | 2 | 4G | 1 | 2G |
| AI Service | 2 | 4G | 1 | 2G |
| JobSpy | 1 | 2G | 0.5 | 1G |
| PostgreSQL | 1 | 2G | 0.5 | 1G |
| Redis | 0.5 | 512M | 0.25 | 256M |
| Nginx | 0.5 | 256M | 0.25 | 128M |

## External Integrations

### OpenAI API
- **Purpose:** LLM-powered features
- **Endpoints Used:** Chat completions, structured outputs
- **Models:** GPT-4, GPT-5.2
- **Features:** CV parsing, CV tailoring, cover letters, coaching

### JobSpy (Job Scraping)
- **Purpose:** Aggregate job listings
- **Sources:** Indeed (primary), LinkedIn (backup)
- **Region:** South Africa focused
- **Rate Limiting:** Built-in delays to avoid blocking

### NewsData.io (Planned)
- **Purpose:** Career news and market insights
- **Integration:** Java-based news service

## Scalability Considerations

### Current Limitations
- Single-instance deployment
- No load balancing
- Synchronous job scraping

### Future Improvements
- Kubernetes deployment
- Horizontal pod autoscaling
- Async job processing with Celery/RabbitMQ
- CDN for static assets
- Database read replicas
