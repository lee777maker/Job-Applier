# Contributing to JobApplier AI

Thank you for your interest in contributing to JobApplier AI! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Project Structure](#project-structure)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them

### Unacceptable Behavior

- Harassment, discrimination, or intimidation
- Trolling, insulting/derogatory comments
- Personal or political attacks
- Publishing others' private information

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Java 17+ and Maven
- Python 3.11+
- Git

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/jobapplier-ai.git
   cd jobapplier-ai
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/original/jobapplier-ai.git
   ```

4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Set Up Development Environment

```bash
# Configure environment
echo "OPENAI_API_KEY=your_test_key" > ai-service/.env

# Start services
./start.sh dev
```

---

## Development Workflow

### 1. Sync with Upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Create Feature Branch

```bash
git checkout -b feature/descriptive-name
```

Branch naming conventions:
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### 3. Make Changes

- Write clean, maintainable code
- Follow coding standards (see below)
- Add/update tests as needed
- Update documentation

### 4. Commit Changes

```bash
git add .
git commit -m "type: concise description"
```

Commit message format:
```
type: subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Build/config changes

**Examples:**
```
feat: add resume PDF parser
fix: handle empty job descriptions
docs: update API endpoints
test: add match score unit tests
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference to related issues
- Screenshots (if UI changes)
- Test results

---

## Coding Standards

### Frontend (TypeScript/React)

#### Style Guide
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript strict mode
- Use functional components with hooks

#### Code Formatting
```bash
# Run linter
cd frontend
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format with Prettier
npm run format
```

#### Component Structure
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
  onAction: () => void;
}

// Component
export function MyComponent({ title, onAction }: Props) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

#### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase starting with `use` (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE

### Backend (Java)

#### Style Guide
- Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- Use meaningful variable names
- Keep methods under 50 lines

#### Code Formatting
```bash
# Format with Maven
cd backend
./mvnw spotless:apply
```

#### Class Structure
```java
package jobapplier.api;

import java.util.List;

/**
 * Brief class description.
 */
public class JobController {
    
    private final Manager manager;
    
    public JobController(Manager manager) {
        this.manager = manager;
    }
    
    /**
     * Get job recommendations for a user.
     * 
     * @param userId the user ID
     * @param limit maximum number of results
     * @return list of recommended jobs
     */
    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<?> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {
        // Implementation
    }
}
```

### AI Service (Python)

#### Style Guide
- Follow [PEP 8](https://pep8.org/)
- Use type hints
- Document with docstrings

#### Code Formatting
```bash
# Format with Black
cd ai-service
black .

# Check with flake8
flake8 .

# Type checking
mypy app.py
```

#### Function Structure
```python
from typing import Dict, List
from pydantic import BaseModel

class MatchResult(BaseModel):
    """Result of job matching analysis."""
    score: float
    strengths: List[str]

async def calculate_match_score(
    user_profile: Dict[str, any],
    job_description: str
) -> MatchResult:
    """
    Calculate match score between user and job.
    
    Args:
        user_profile: User's profile data
        job_description: Job description text
        
    Returns:
        MatchResult with score and analysis
        
    Raises:
        ValueError: If job_description is empty
    """
    if not job_description:
        raise ValueError("Job description cannot be empty")
    
    # Implementation
    return MatchResult(score=0.85, strengths=["Python"])
```

---

## Testing

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- MyComponent.test.tsx
```

**Test Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders chat interface', () => {
    render(<HomePage />);
    expect(screen.getByPlaceholderText('What would you like to know?')).toBeInTheDocument();
  });
});
```

### Backend Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=JobControllerTest
```

**Test Example:**
```java
@SpringBootTest
class JobControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void shouldReturnRecommendations() throws Exception {
        mockMvc.perform(get("/api/jobs/recommendations/123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobs").isArray());
    }
}
```

### AI Service Tests

```bash
cd ai-service

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test
pytest tests/test_match_score.py
```

**Test Example:**
```python
import pytest
from app import calculate_keyword_score

def test_calculate_keyword_score():
    skills = ["Python", "React"]
    resume = "Experienced Python developer"
    job = "Looking for Python and TypeScript developers"
    
    score = calculate_keyword_score(skills, resume, job)
    
    assert 0 <= score <= 1
    assert score > 0.5  # Should match on "Python"
```

### Test Coverage Requirements

- Frontend: Minimum 70% coverage
- Backend: Minimum 80% coverage
- AI Service: Minimum 75% coverage

---

## Submitting Changes

### Pull Request Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No merge conflicts

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe tests ran:
- Test A
- Test B

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Approval** required before merge
4. **Squash merge** to keep history clean

---

## Project Structure

```
jobapplier-ai/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   ├── tests/             # Test files
│   └── package.json
├── backend/               # Spring Boot backend
│   └── src/main/java/jobapplier/
│       ├── api/           # REST controllers
│       ├── model/         # Domain models
│       ├── repository/    # Data access
│       ├── service/       # Business logic
│       └── config/        # Configuration
├── ai-service/            # Python AI service
│   ├── app.py             # Main application
│   ├── requirements.txt
│   └── tests/             # Test files
├── docs/                  # Documentation
├── logs/                  # Service logs
└── start.sh               # Startup script
```

---

## Questions?

- Open an issue for bugs or feature requests
- Email: lethaboneo@icloud.com

Thank you for contributing! 🚀

---

*Last Updated: February 2026*
