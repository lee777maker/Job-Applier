# Design Decisions

This document records key architectural and technical decisions I made during the development of JobApplier AI, along with the rationale and trade-offs.

---

## 1. Architecture Decisions

### ADR-001: Microservices vs Monolith

**Decision:** Use a microservices architecture with 4 services

**Context:**
- I needed to support different technology stacks for optimal AI/ML processing
- I have expertise in both Java and Python
- Wanted clear separation of concerns

**Decision:**
Split into:
1. Frontend (React/TypeScript)
2. Backend API (Spring Boot)
3. AI Service (Python/FastAPI)
4. Job Scraping Service (Python/FastAPI)

**Consequences:**
- ✅ Can use best tool for each job (Java for business logic due to speed and security, Python for AI)
- ✅ Services can scale independently
- ✅ Future teams can work on services independently
- ❌ Increased operational complexity
- ❌ Network latency between services
- ❌ Need for service discovery and health checks

**Alternatives Considered:**
- Single monolithic Spring Boot app with Python subprocess calls
  - Rejected: Tight coupling, harder to scale AI components

---

### ADR-002: Database Choice

**Decision:** Use PostgreSQL for production, H2 for development

**Context:**
- Need relational data with JSON support for flexible profile storage
- South African market considerations (data residency)
- I have familiarity with SQL databases

**Decision:**
- PostgreSQL 15 for production
- H2 in-memory database for development/testing

**Consequences:**
- ✅ PostgreSQL is robust, well-supported, has excellent JSON support
- ✅ H2 allows quick development without Docker
- ✅ Easy to switch profiles for testing
- ❌ There are differences between H2 and PostgreSQL behavior with increases load
- ❌ Need to maintain schema compatibility

**Alternatives Considered:**
- MongoDB: Rejected due to team familiarity with SQL, ACID requirements
- MySQL: Rejected due to superior JSON support in PostgreSQL

---

### ADR-003: AI Service Architecture

**Decision:** Use OpenAI Agents SDK with specialized agents

**Context:**
- Need multiple AI capabilities (CV parsing, tailoring, chat)
- Want consistent interface for LLM interactions
- Need to support both structured and unstructured outputs

**Decision:**
Implement specialized agents:
- `cv_parseragent` — Structured CV extraction
- `cvtailoragent` — Resume tailoring
- `cover_letter_agent` — Cover letter generation
- `email_agent` — Outreach emails
- `neilwe_chat` — Career coach with web search

**Consequences:**
- ✅ Clear separation of concerns per agent
- ✅ Easy to test and iterate individual agents
- ✅ Can use different models/settings per agent
- ❌ Some code duplication in agent setup
- ❌ More complex prompt management
- ❌ Development is costly due to usage charges

**Alternatives Considered:**
- Single general-purpose agent with routing
  - Rejected: Harder to optimize prompts, less predictable outputs

---

## 2. Technology Stack Decisions

### ADR-101: Frontend Framework

**Decision:** React 18 + TypeScript + Vite + Tailwind CSS

**Context:**
- Need modern, performant UI
- Strong typing for maintainability
- Fast development iteration

**Decision:**
- React 18 with hooks
- TypeScript for type safety
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for components

**Consequences:**
- ✅ Excellent developer experience with Vite HMR
- ✅ Type safety catches errors early
- ✅ Tailwind enables rapid UI development
- ✅ shadcn/ui provides accessible, customizable components
- ❌ Steep learning curve for Tailwind
- ❌ Bundle size considerations with React

**Alternatives Considered:**
- Vue.js: Rejected due to my React experience
- Next.js: Rejected to avoid framework lock-in, simpler deployment
- Plain CSS: Rejected for slower development

---

### ADR-102: Backend Framework

**Decision:** Spring Boot 3.2 with Java 21

**Context:**
- Need robust, enterprise-grade backend
- Strong security requirements
- I have Java expertise

**Decision:**
- Spring Boot 3.2
- Java 21 (LTS)
- Spring Security with Argon2
- Spring Data JPA

**Consequences:**
- ✅ Mature ecosystem with excellent tooling
- ✅ Strong security framework
- ✅ Excellent database integration
- ✅ Good observability support
- ❌ Higher memory usage than alternatives
- ❌ Longer startup time

**Alternatives Considered:**
- Node.js/Express: Rejected for type safety and enterprise features
- Python/FastAPI for backend too: Rejected for better security ecosystem
- Go: Rejected due to Java expertise

---

### ADR-103: Password Hashing

**Decision:** Use Argon2id for password hashing

**Context:**
- POPIA compliance requires strong password protection
- Need future-proof hashing algorithm

**Decision:**
Use Argon2id with parameters:
- Iterations: 3
- Memory: 65536 KB
- Parallelism: 1

**Consequences:**
- ✅ Winner of Password Hashing Competition
- ✅ Resistant to GPU/ASIC attacks
- ✅ Memory-hard function
- ❌ Higher computational cost than bcrypt
- ❌ Java library (argon2-jvm) adds dependency

**Alternatives Considered:**
- bcrypt: Rejected as older, less memory-hard
- PBKDF2: Rejected as weaker against hardware attacks
- scrypt: Rejected as Argon2 is the modern standard

---

### ADR-104: Job Scraping Strategy

**Decision:** Use JobSpy library with Indeed primary, LinkedIn backup

**Context:**
- Need reliable job data from South African market
- Legal and technical constraints of scraping

**Decision:**
- Use JobSpy Python library
- Primary: Indeed (better SA coverage)
- Backup: LinkedIn
- Remove Glassdoor (no SA support)

**Consequences:**
- ✅ Abstracts scraping complexity
- ✅ Handles rate limiting and retries
- ✅ Returns structured data
- ❌ Dependency on third-party library maintenance
- ❌ Scraping can break when sites change
- ❌ Rate limits may affect user experience

**Alternatives Considered:**
- Direct API integrations: Rejected due to cost and availability
- Custom scrapers: Rejected for maintenance burden
- Paid job data APIs: Rejected for cost

---

## 3. API Design Decisions

### ADR-201: API Communication Pattern

**Decision:** Use REST with JSON, direct service calls in Docker

**Context:**
- Services need to communicate within Docker network
- Frontend needs to call multiple services

**Decision:**
- REST APIs with JSON payloads
- Frontend calls Backend API
- Backend proxies to AI/JobSpy services
- Services communicate via Docker network

**Consequences:**
- ✅ Simple, well-understood pattern
- ✅ Easy to debug with curl/Postman
- ✅ Language agnostic
- ❌ Synchronous calls block threads
- ❌ No built-in retry/circuit breaker

**Alternatives Considered:**
- gRPC: Rejected for complexity, browser support
- GraphQL: Rejected for simpler use case
- Message queue: Rejected for synchronous requirements

---

### ADR-202: AI Service Endpoints

**Decision:** Use `/agents/{agent-name}` pattern for AI endpoints

**Context:**
- Multiple AI capabilities needed
- Want clear, discoverable API

**Decision:**
- `/agents/extract-cv` — CV parsing
- `/agents/tailor-resume` — Resume tailoring
- `/agents/generate-cover-letter` — Cover letters
- `/agents/neilwe-chat` — AI coach
- `/agents/match-score` — ATS scoring

**Consequences:**
- ✅ Clear naming convention
- ✅ Easy to add new agents
- ✅ Consistent interface
- ❌ Some endpoints do multiple things

**Alternatives Considered:**
- Resource-based REST: Rejected for agent-centric design
- Single `/chat` endpoint with intent routing: Rejected for clarity

---

## 4. Data Model Decisions

### ADR-301: Profile Storage

**Decision:** Store profile as JSON in PostgreSQL TEXT column

**Context:**
- Profile has nested, flexible structure
- Need to query some fields (email) but not all
- Want to avoid schema migrations for profile changes

**Decision:**
- Store structured profile data as JSON string
- Key fields (email, name) as separate columns
- Parse JSON in application layer

**Consequences:**
- ✅ Flexible schema for profile changes
- ✅ No migrations needed for new fields
- ✅ Easy to serialize/deserialize
- ❌ No database-level validation
- ❌ Can't query nested fields in SQL
- ❤️ Mitigation: Use TypeScript types for validation

**Alternatives Considered:**
- PostgreSQL JSONB: Considered but TEXT is sufficient
- Separate tables for each section: Rejected for complexity
- MongoDB: Rejected for transaction support

---

### ADR-302: Application Status Tracking

**Decision:** Use enum for application status with workflow states

**Context:**
- Need to track application lifecycle
- Want to support analytics

**Decision:**
```java
enum ApplicationStatus {
    DRAFT,          // Application being prepared
    APPLIED,        // Submitted
    INTERVIEWING,   // In interview process
    OFFERED,        // Offer received
    REJECTED,       // Application rejected
    ACCEPTED,       // Offer accepted
    DECLINED        // Offer declined
}
```

**Consequences:**
- ✅ Clear state definitions
- ✅ Easy to query by status
- ✅ Supports analytics
- ❌ Linear progression assumed
- ❤️ Mitigation: Allow status updates in any direction

**Alternatives Considered:**
- String status: Rejected for type safety
- Separate boolean flags: Rejected for complexity

---

## 5. Security Decisions

### ADR-401: Authentication Approach

**Decision:** Use session-based auth for MVP, JWT planned for future

**Context:**
- Need quick implementation for MVP
- Want stateless auth for future mobile app

**Decision:**
- Current: Session-based with Spring Security
- Future: JWT tokens

**Consequences:**
- ✅ Quick to implement
- ✅ Works well with server-side rendering
- ❌ Not ideal for mobile/SPA
- ❤️ Mitigation: Plan JWT migration

**Alternatives Considered:**
- JWT from start: Rejected for time constraints
- OAuth2: Rejected for complexity

---

### ADR-402: CORS Configuration

**Decision:** Allow all origins in development, restrict in production

**Context:**
- Development requires flexibility
- Production needs security

**Decision:**
- Development: `*` allowed origins
- Production: Specific origins only
- Credentials disabled with wildcard

**Consequences:**
- ✅ Easy local development
- ✅ Production security
- ❌ Potential security risk if misconfigured
- ❤️ Mitigation: Environment-specific config

---

## 6. Frontend Architecture Decisions

### ADR-501: State Management

**Decision:** Use React Context for global state

**Context:**
- Need to share auth, profile, jobs across components
- Want to avoid prop drilling

**Decision:**
- Single `AppContext` for global state
- Local state for component-specific data
- localStorage for persistence

**Consequences:**
- ✅ Simple, no external dependencies
- ✅ Easy to understand
- ✅ localStorage persistence works well
- ❌ Can become complex with many states
- ❌ No built-in performance optimizations
- ❤️ Mitigation: Split context if needed in future

**Alternatives Considered:**
- Redux: Rejected for complexity
- Zustand: Rejected to minimize dependencies
- Recoil: Rejected as experimental

---

### ADR-502: Component Library

**Decision:** Use shadcn/ui with Tailwind CSS

**Context:**
- Need accessible, customizable components
- Want consistent design system

**Decision:**
- shadcn/ui for base components
- Tailwind for custom styling
- Radix UI primitives for accessibility

**Consequences:**
- ✅ Accessible by default
- ✅ Customizable styling
- ✅ Copy-paste components (no dependency)
- ❌ More setup than pre-built libraries
- ❤️ Mitigation: Good documentation and CLI

**Alternatives Considered:**
- Material-UI: Rejected for less customization
- Chakra UI: Rejected for shadcn's approach
- Ant Design: Rejected for design preferences

---

### ADR-503: Chat Interface Design

**Decision:** Implement resizable chat panel on dashboard

**Context:**
- Neilwe chat is key feature
- Users need to see jobs and chat simultaneously
- Different users prefer different layouts

**Decision:**
- Resizable chat panel (drag to resize)
- Minimize/maximize functionality
- Persist dimensions in localStorage

**Consequences:**
- ✅ Flexible user experience
- ✅ Users can customize layout
- ❌ More complex implementation
- ❤️ Mitigation: Good default dimensions

---

## 7. Deployment Decisions

### ADR-601: Container Strategy

**Decision:** Use Docker Compose for deployment

**Context:**
- Need consistent environments
- Want easy local development
- Planning for cloud deployment
- I have Docker expertise

**Decision:**
- Docker Compose for orchestration
- Separate Dockerfiles per service
- Health checks on all services

**Consequences:**
- ✅ Consistent environments
- ✅ Easy local development
- ✅ Simple to understand
- ❌ Not suitable for production scale
- ❤️ Mitigation: Plan Kubernetes migration

**Alternatives Considered:**
- Kubernetes: Rejected for complexity
- AWS ECS: Rejected for vendor lock-in
- Nomad: Rejected for smaller ecosystem

---

### ADR-602: Environment Configuration

**Decision:** Use environment variables for all configuration

**Context:**
- Need different configs per environment
- Security requirements for secrets

**Decision:**
- `.env` file for local development
- Environment variables in Docker
- `.env.example` for documentation

**Consequences:**
- ✅ 12-factor app compliance
- ✅ Easy to configure per environment
- ✅ Secrets not in code
- ❌ Need to manage .env files
- ❤️ Mitigation: Document all variables

---

## 8. Testing Decisions

### ADR-701: Testing Strategy

**Decision:** Unit + Integration + E2E testing pyramid

**Context:**
- Need confidence in code quality
- Want fast feedback during development

**Decision:**
- Unit tests for business logic (JUnit, pytest, Jest)
- Integration tests for service communication
- E2E tests for critical user flows

**Consequences:**
- ✅ Comprehensive coverage
- ✅ Fast unit test feedback
- ✅ Confidence in deployments
- ❌ Test maintenance overhead
- ❤️ Mitigation: Good test organization

---

## 9. Documentation Decisions

### ADR-801: Documentation Strategy

**Decision:** Markdown docs in repository

**Context:**
- Need living documentation
- Want version control
- Team familiar with Markdown

**Decision:**
- `docs/` folder in repository
- Markdown format
- README as entry point

**Consequences:**
- ✅ Version controlled with code
- ✅ Easy to edit
- ✅ Rendered well by GitHub
- ❌ No interactive features
- ❤️ Mitigation: Use GitHub wiki for extended docs

---

## Decision Log Summary

| ADR | Decision | Status | Date |
|-----|----------|--------|------|
| ADR-001 | Microservices architecture | Accepted | 2025-01 |
| ADR-002 | PostgreSQL + H2 | Accepted | 2025-01 |
| ADR-003 | OpenAI Agents SDK | Accepted | 2025-02 |
| ADR-101 | React + TypeScript + Vite | Accepted | 2025-01 |
| ADR-102 | Spring Boot 3.2 + Java 21 | Accepted | 2025-01 |
| ADR-103 | Argon2id password hashing | Accepted | 2025-01 |
| ADR-104 | JobSpy for scraping | Accepted | 2025-02 |
| ADR-201 | REST API pattern | Accepted | 2025-01 |
| ADR-202 | `/agents/{name}` endpoints | Accepted | 2025-02 |
| ADR-301 | JSON profile storage | Accepted | 2025-01 |
| ADR-302 | Enum application status | Accepted | 2025-02 |
| ADR-401 | Session auth (JWT future) | Accepted | 2025-01 |
| ADR-402 | Environment-based CORS | Accepted | 2025-01 |
| ADR-501 | React Context state | Accepted | 2025-01 |
| ADR-502 | shadcn/ui components | Accepted | 2025-01 |
| ADR-503 | Resizable chat panel | Accepted | 2025-02 |
| ADR-601 | Docker Compose | Accepted | 2025-01 |
| ADR-602 | Environment variables | Accepted | 2025-01 |
| ADR-701 | Testing pyramid | Accepted | 2025-02 |
| ADR-801 | Markdown documentation | Accepted | 2025-01 |
