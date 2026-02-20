# Testing Strategy

## 1. Overview

This document outlines the comprehensive testing approach for JobApplier AI, covering unit tests, integration tests, and end-to-end testing across all services.

### Testing Pyramid

```
         /\
        /  \
       / E2E\          Few tests, full user journeys
      /______\         (Cypress/Playwright)
     /        \
    /Integration\      Service-to-service testing
   /____________\      (TestContainers, HTTP clients)
  /              \
 /    Unit Tests   \   Many tests, isolated components
/__________________\   (JUnit, pytest, Jest)
```

---

## 2. Unit Testing

### 2.1 Backend (Java/Spring Boot)

**Framework:** JUnit 5 + Mockito

**Test Structure:**
```
backend/src/test/java/jobapplier/
├── unit/
│   ├── api/
│   │   ├── AuthControllerTest.java
│   │   ├── ProfileControllerTest.java
│   │   └── JobControllerTest.java
│   ├── model/
│   │   ├── UserTest.java
│   │   ├── ApplicationTest.java
│   │   └── JobTest.java
│   └── service/
│       ├── ManagerTest.java
│       └── AuditServiceTest.java
└── integration/
    └── ...
```

**Key Test Cases:**

#### User Model Tests
```java
@Test
void shouldCreateUserWithValidData() {
    User user = new User(UUID.randomUUID(), "John", "Doe", 
                         "john@example.com", "password123", null);
    
    assertNotNull(user.getId());
    assertEquals("john@example.com", user.getEmail());
    assertTrue(user.verifyPassword("password123"));
}

@Test
void shouldRejectInvalidEmail() {
    assertThrows(IllegalArgumentException.class, () -> {
        new User(UUID.randomUUID(), "John", "Doe", 
                 "invalid-email", "password123", null);
    });
}

@Test
void shouldHashPasswordWithArgon2() {
    User user = new User(UUID.randomUUID(), "John", "Doe", 
                         "john@example.com", "password123", null);
    
    assertNotEquals("password123", user.getPasswordHash());
    assertTrue(user.getPasswordHash().startsWith("$argon2"));
}

@Test
void shouldVerifyCorrectPassword() {
    User user = new User(UUID.randomUUID(), "John", "Doe", 
                         "john@example.com", "password123", null);
    
    assertTrue(user.verifyPassword("password123"));
    assertFalse(user.verifyPassword("wrongpassword"));
}
```

#### Auth Controller Tests
```java
@WebMvcTest(AuthController.class)
class AuthControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private Manager manager;
    
    @MockBean
    private UserRepository userRepo;
    
    @Test
    void shouldRegisterNewUser() throws Exception {
        when(userRepo.findByEmail(any())).thenReturn(null);
        when(manager.saveProfile(any())).thenReturn(new User(...));
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }
    
    @Test
    void shouldRejectDuplicateEmail() throws Exception {
        when(userRepo.findByEmail(any())).thenReturn(new User(...));
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "existing@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Email already in use"));
    }
    
    @Test
    void shouldLoginWithValidCredentials() throws Exception {
        User user = new User(UUID.randomUUID(), "John", "Doe", 
                            "john@example.com", "password123", null);
        when(manager.authenticate("john@example.com", "password123")).thenReturn(user);
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }
}
```

#### Application Model Tests
```java
@Test
void shouldCreateApplicationWithRequiredFields() {
    UUID userId = UUID.randomUUID();
    Application app = new Application(userId, "Google", "Software Engineer");
    
    assertNotNull(app.getId());
    assertEquals(userId, app.getUserId());
    assertEquals("Google", app.getCompany());
    assertEquals("Software Engineer", app.getRole());
    assertEquals(ApplicationStatus.DRAFT, app.getStatus());
}

@Test
void shouldUpdateStatus() {
    Application app = new Application(UUID.randomUUID(), "Google", "Software Engineer");
    
    app.setStatus(ApplicationStatus.INTERVIEWING);
    
    assertEquals(ApplicationStatus.INTERVIEWING, app.getStatus());
    assertTrue(app.isActive());
}

@Test
void shouldBeReadyForSubmission() {
    Application app = new Application(UUID.randomUUID(), "Google", "Software Engineer");
    
    assertTrue(app.isReadyForSubmission());
    
    app.setStatus(ApplicationStatus.SUBMITTED);
    assertFalse(app.isReadyForSubmission());
}
```

### 2.2 AI Service (Python)

**Framework:** pytest + pytest-asyncio + pytest-mock

**Test Structure:**
```
ai-service/tests/
├── unit/
│   ├── test_app.py
│   ├── test_cv_parser.py
│   ├── test_agents.py
│   └── test_helpers.py
└── conftest.py
```

**Key Test Cases:**

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_cv_text():
    return """
    John Doe
    john.doe@example.com
    +27 123 456 7890
    
    EXPERIENCE
    Software Engineer at Tech Corp (2020-2023)
    - Built scalable web applications using Python and React
    - Led a team of 5 developers
    
    EDUCATION
    BSc Computer Science - University of Cape Town (2016-2019)
    
    SKILLS
    Python, JavaScript, React, Docker, AWS
    """

# test_app.py
import pytest
from fastapi.testclient import TestClient

class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "ai-service"

class TestCVExtraction:
    def test_extract_cv_invalid_file_type(self, client):
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("test.exe", b"invalid content", "application/octet-stream")}
        )
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]
    
    def test_extract_cv_empty_file(self, client):
        response = client.post(
            "/agents/extract-cv",
            files={"file": ("empty.pdf", b"", "application/pdf")}
        )
        assert response.status_code == 400

class TestBuildUserContext:
    def test_build_user_context_with_full_profile(self):
        from app import build_user_context
        
        profile = {
            "contactInfo": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com",
                "phone": "+27 123 456 7890",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe"
            },
            "skills": [
                {"id": "1", "name": "Python", "level": "Advanced"},
                {"id": "2", "name": "React", "level": "Intermediate"}
            ],
            "experience": [
                {
                    "id": "1",
                    "title": "Software Engineer",
                    "company": "Tech Corp",
                    "duration": "2020-2023",
                    "description": "Built scalable applications"
                }
            ]
        }
        
        context = build_user_context(profile)
        
        assert "John Doe" in context
        assert "Python" in context
        assert "Tech Corp" in context
        assert "Software Engineer" in context
    
    def test_build_user_context_empty_profile(self):
        from app import build_user_context
        
        context = build_user_context({})
        assert context == "No user profile available."
    
    def test_build_user_context_none_profile(self):
        from app import build_user_context
        
        context = build_user_context(None)
        assert context == "No user profile available."

class TestNeilweChat:
    @pytest.mark.asyncio
    async def test_neilwe_chat_with_profile(self, client, mocker):
        # Mock the Runner.run to avoid actual OpenAI calls
        mock_result = mocker.MagicMock()
        mock_result.final_output_as.return_value = "Hello! I see you have Python experience."
        
        mocker.patch("app.Runner.run", return_value=mock_result)
        
        response = client.post("/agents/neilwe-chat", json={
            "message": "What jobs should I apply for?",
            "profile": {
                "contactInfo": {"firstName": "John", "lastName": "Doe"},
                "skills": [{"name": "Python", "level": "Advanced"}]
            },
            "chatHistory": []
        })
        
        assert response.status_code == 200
        assert "response" in response.json()

class TestTailorResume:
    @pytest.mark.asyncio
    async def test_tailor_resume_missing_fields(self, client):
        response = client.post("/agents/tailor-resume", json={
            "original_resume": "",
            "job_description": "Looking for a Python developer"
        })
        
        assert response.status_code == 400
        assert "Original resume is required" in response.json()["detail"]

class TestGenerateCoverLetter:
    @pytest.mark.asyncio
    async def test_generate_coverletter_missing_job_description(self, client):
        response = client.post("/agents/generate-cover-letter", json={
            "job_description": "",
            "user_profile": {"name": "John"}
        })
        
        assert response.status_code == 400
        assert "Job description is required" in response.json()["detail"]
```

### 2.3 JobSpy Service (Python)

```python
# tests/test_jobspy_service.py
import pytest
from fastapi.testclient import TestClient
from jobspy_service import app

@pytest.fixture
def client():
    return TestClient(app)

class TestHealth:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

class TestSearchJobs:
    def test_search_jobs_success(self, client, mocker):
        # Mock the scrape_jobs function
        mock_df = mocker.MagicMock()
        mock_df.iterrows.return_value = [
            (0, {
                "title": "Software Engineer",
                "company": "Google",
                "location": "Johannesburg",
                "description": "Build amazing software",
                "job_url": "https://example.com/job/1",
                "date_posted": "2026-02-20",
                "job_type": "full-time",
                "compensation": "R 50000 - 70000",
                "site": "indeed"
            })
        ]
        mock_df.__len__ = mocker.MagicMock(return_value=1)
        
        mocker.patch("jobspy_service.scrape_jobs", return_value=mock_df)
        
        response = client.post("/search", json={
            "keyword": "Software Engineer",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) == 1
        assert jobs[0]["title"] == "Software Engineer"
    
    def test_search_jobs_empty_results(self, client, mocker):
        mock_df = mocker.MagicMock()
        mock_df.__len__ = mocker.MagicMock(return_value=0)
        
        mocker.patch("jobspy_service.scrape_jobs", return_value=mock_df)
        
        response = client.post("/search", json={
            "keyword": "NonExistentJob12345",
            "location": "Johannesburg",
            "max_results": 10
        })
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_search_jobs_deduplication(self, client, mocker):
        # Test that duplicate URLs are removed
        mock_df = mocker.MagicMock()
        mock_df.iterrows.return_value = [
            (0, {"title": "Job 1", "company": "Co", "location": "JHB", 
                 "description": "Desc", "job_url": "https://same-url.com",
                 "date_posted": "2026-02-20", "site": "indeed"}),
            (1, {"title": "Job 2", "company": "Co", "location": "JHB",
                 "description": "Desc", "job_url": "https://same-url.com",
                 "date_posted": "2026-02-20", "site": "linkedin"})
        ]
        mock_df.__len__ = mocker.MagicMock(return_value=2)
        
        mocker.patch("jobspy_service.scrape_jobs", return_value=mock_df)
        
        response = client.post("/search", json={
            "keyword": "Developer",
            "max_results": 10
        })
        
        jobs = response.json()
        assert len(jobs) == 1  # Duplicates removed

class TestSearchByProfile:
    def test_search_by_profile_success(self, client, mocker):
        mock_df = mocker.MagicMock()
        mock_df.iterrows.return_value = [
            (0, {
                "title": "Python Developer",
                "company": "Tech Co",
                "location": "Cape Town",
                "description": "Python, Django, AWS",
                "job_url": "https://example.com/job/1",
                "date_posted": "2026-02-20",
                "site": "indeed"
            })
        ]
        mock_df.__len__ = mocker.MagicMock(return_value=1)
        
        mocker.patch("jobspy_service.scrape_jobs", return_value=mock_df)
        
        response = client.post("/search-by-profile", json={
            "profile": {
                "skills": ["Python", "Django"],
                "suggestedJobTitles": ["Python Developer", "Backend Engineer"]
            },
            "preferences": {
                "preferredRole": "Python Developer",
                "location": "Cape Town",
                "openToRemote": True
            }
        })
        
        assert response.status_code == 200
        result = response.json()
        assert "jobs" in result
        assert "search_terms_used" in result
```

### 2.4 Frontend (React/TypeScript)

**Framework:** Jest + React Testing Library

**Test Structure:**
```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── Navigation.test.tsx
│   │   └── JobCard.test.tsx
│   ├── context/
│   │   └── AppContext.test.tsx
│   ├── lib/
│   │   └── api.test.ts
│   └── pages/
│       └── HomePage.test.tsx
```

```typescript
// __tests__/lib/api.test.ts
import { login, register, extractCV, getMatchScore } from '@/lib/api';

global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = { id: '123', email: 'test@example.com', name: 'Test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await login('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw on invalid credentials', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      });

      await expect(login('test@example.com', 'wrongpass')).rejects.toThrow();
    });
  });

  describe('extractCV', () => {
    it('should upload and extract CV', async () => {
      const mockFile = new File(['test content'], 'cv.pdf', { type: 'application/pdf' });
      const mockResponse = {
        contactInfo: { firstName: 'John', lastName: 'Doe' },
        skills: [{ name: 'Python', level: 'Advanced' }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await extractCV(mockFile);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/extract-cv'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

// __tests__/context/AppContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/AppContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  it('should have default state', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.profile).toBeNull();
    expect(result.current.recommendedJobs).toEqual([]);
  });

  it('should login user', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.login({
        id: '123',
        email: 'test@example.com',
        name: 'John',
        surname: 'Doe',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'John',
      surname: 'Doe',
    });
  });

  it('should logout user', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.login({ id: '123', email: 'test@example.com', name: 'John', surname: 'Doe' });
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should set profile', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    const mockProfile = {
      contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      skills: [{ name: 'Python', level: 'Advanced' }],
    };

    act(() => {
      result.current.setProfile(mockProfile);
    });

    expect(result.current.profile).toEqual(mockProfile);
  });

  it('should update profile partially', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setProfile({ contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
    });

    act(() => {
      result.current.updateProfile({ skills: [{ name: 'React', level: 'Intermediate' }] });
    });

    expect(result.current.profile).toEqual({
      contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      skills: [{ name: 'React', level: 'Intermediate' }],
    });
  });
});
```

---

## 3. Integration Testing

### 3.1 Backend Integration Tests

**Framework:** Spring Boot Test + TestContainers

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class BackendIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("jobapplier_test")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }
    
    @Test
    void fullUserRegistrationFlow() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk());
        
        // Verify user in database
        User user = userRepository.findByEmail("john@example.com");
        assertNotNull(user);
        assertEquals("John", user.getName());
        
        // Login
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }
    
    @Test
    void applicationTrackingFlow() throws Exception {
        // Create user first
        String userResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andReturn()
            .getResponse()
            .getContentAsString();
        
        String userId = JsonPath.read(userResponse, "$.id");
        
        // Create application
        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                        "userId": "%s",
                        "company": "Google",
                        "role": "Software Engineer",
                        "location": "Johannesburg",
                        "status": "applied"
                    }
                    """, userId)))
            .andExpect(status().isOk());
        
        // Get applications
        mockMvc.perform(get("/api/applications/user/" + userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].company").value("Google"));
    }
}
```

### 3.2 Service-to-Service Integration

```python
# tests/integration/test_service_integration.py
import pytest
import requests
import time

class TestServiceIntegration:
    """Tests that require all services to be running"""
    
    BASE_URLS = {
        'backend': 'http://localhost:8080',
        'ai': 'http://localhost:8001',
        'jobspy': 'http://localhost:8002'
    }
    
    def test_ai_service_health(self):
        response = requests.get(f"{self.BASE_URLS['ai']}/health")
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'
    
    def test_jobspy_service_health(self):
        response = requests.get(f"{self.BASE_URLS['jobspy']}/health")
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'
    
    def test_backend_health(self):
        response = requests.get(f"{self.BASE_URLS['backend']}/actuator/health")
        assert response.status_code == 200
    
    def test_end_to_end_cv_extraction(self):
        """Test full flow: upload CV -> extract -> get results"""
        # This would require actual file upload testing
        pass
    
    def test_job_search_integration(self):
        """Test that backend can call jobspy service"""
        response = requests.post(
            f"{self.BASE_URLS['backend']}/api/jobs/search-by-profile",
            json={
                "profile": {"skills": ["Python"]},
                "preferences": {"preferredRole": "Developer"}
            }
        )
        # May return 200 or 503 depending on jobspy availability
        assert response.status_code in [200, 503]
```

---

## 4. End-to-End Testing

**Framework:** Cypress or Playwright

```javascript
// cypress/e2e/auth.cy.js
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should register a new user', () => {
    cy.contains('Create Account').click();
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="surname"]').type('Test');
    cy.get('input[name="email"]').type(`test${Date.now()}@example.com`);
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/upload');
    cy.contains('Upload Your CV');
  });

  it('should login existing user', () => {
    cy.contains('Sign In').click();
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
  });
});

// cypress/e2e/cv-upload.cy.js
describe('CV Upload', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123'); // Custom command
    cy.visit('http://localhost:5173/upload');
  });

  it('should upload and parse CV', () => {
    cy.get('input[type="file"]').attachFile('sample-cv.pdf');
    cy.contains('Uploading...');
    cy.contains('Extracted Information', { timeout: 20000 });
    cy.get('input[name="firstName"]').should('have.value', 'John');
  });
});

// cypress/e2e/job-search.cy.js
describe('Job Search', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('http://localhost:5173/dashboard');
  });

  it('should display job listings', () => {
    cy.contains('Top jobs based on your profile');
    cy.get('.job-card').should('have.length.at.least', 1);
  });

  it('should open job popup on click', () => {
    cy.get('.job-card').first().click();
    cy.contains('Quick Actions');
    cy.contains('Open Job Listing');
  });
});

// cypress/e2e/neilwe-chat.cy.js
describe('Neilwe Chat', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('http://localhost:5173/dashboard');
  });

  it('should send message and receive response', () => {
    cy.get('input[placeholder="What would you like to know?"]').type('What jobs should I apply for?');
    cy.get('button').contains('Send').click();
    
    cy.contains('What jobs should I apply for?');
    cy.get('.animate-bounce', { timeout: 10000 }).should('exist'); // Loading indicator
    cy.get('.animate-bounce', { timeout: 30000 }).should('not.exist');
  });
});
```

---

## 5. Test Coverage Goals

| Layer | Target Coverage | Minimum Coverage |
|-------|-----------------|------------------|
| Backend Unit | 80% | 70% |
| AI Service Unit | 75% | 65% |
| JobSpy Unit | 70% | 60% |
| Frontend Unit | 70% | 60% |
| Integration | N/A | Key flows covered |
| E2E | N/A | Critical paths covered |

---

## 6. CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: jobapplier_test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      - run: cd backend && ./mvnw test

  ai-service-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: |
          cd ai-service
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-mock
          pytest tests/ --cov=app --cov-report=xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd frontend
          npm ci
          npm test -- --coverage

  integration-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, ai-service-tests]
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 7. Test Data Management

### 7.1 Test Fixtures

```python
# ai-service/tests/fixtures/sample_cvs.py
SAMPLE_CV_SOFTWARE_ENGINEER = """
John Doe
Software Engineer
john.doe@example.com | +27 123 456 7890 | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years in full-stack development.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
- Led development of microservices architecture serving 1M+ users
- Reduced API response time by 40% through caching optimization

Software Engineer | Startup Inc | 2018 - 2020
- Built React frontend and Node.js backend
- Implemented CI/CD pipelines

EDUCATION
BSc Computer Science | University of Cape Town | 2014 - 2017

SKILLS
Python, JavaScript, React, Node.js, Docker, AWS, PostgreSQL, Redis
"""

SAMPLE_CV_EMPTY = ""

SAMPLE_CV_MINIMAL = "John Doe\nDeveloper"
```

### 7.2 Database Seeding

```java
// backend/src/test/java/jobapplier/fixtures/TestData.java
public class TestData {
    
    public static User createTestUser() {
        return new User(
            UUID.randomUUID(),
            "Test",
            "User",
            "test@example.com",
            "password123",
            null
        );
    }
    
    public static Application createTestApplication(UUID userId) {
        return new Application(
            userId,
            "Google",
            "Software Engineer"
        );
    }
}
```

---

## 8. Performance Testing

### 8.1 Load Testing with k6

```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up
    { duration: '5m', target: 10 },  // Steady state
    { duration: '2m', target: 20 },  // Ramp up
    { duration: '5m', target: 20 },  // Steady state
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const res = http.get('http://localhost:8080/actuator/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 9. Security Testing

### 9.1 OWASP ZAP Scanning

```yaml
# security/zap-scan.yml
- name: OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.7.0
  with:
    target: 'http://localhost:5173'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a'
```

### 9.2 Dependency Scanning

```yaml
# Snyk or Dependabot integration
- name: Run Snyk
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```
