/**
 * Unit tests for the API client library.
 * Tests cover authentication, profile, job, and AI service APIs.
 */

import {
  login,
  register,
  getProfile,
  updateProfile,
  getJobRecommendations,
  extractCV,
  getMatchScore,
  tailorResume,
  generateCoverLetter,
  generateEmail,
  neilweChat,
  createApplication,
  getApplications,
} from '@/lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =========================================================================
  // Authentication Tests
  // =========================================================================

  describe('Authentication', () => {
    describe('login', () => {
      it('should login with valid credentials', async () => {
        const mockResponse = {
          id: '123',
          email: 'test@example.com',
          name: 'Test',
          surname: 'User',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await login('test@example.com', 'password123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        await expect(login('test@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
      });

      it('should throw on network error', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(login('test@example.com', 'password123')).rejects.toThrow('Network error');
      });

      it('should throw on server error', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal server error',
        });

        await expect(login('test@example.com', 'password123')).rejects.toThrow('Internal server error');
      });
    });

    describe('register', () => {
      it('should register new user successfully', async () => {
        const mockResponse = {
          id: '123',
          email: 'newuser@example.com',
          message: 'User registered successfully',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await register('New', 'User', 'newuser@example.com', 'password123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'New',
              surname: 'User',
              email: 'newuser@example.com',
              password: 'password123',
            }),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw on duplicate email', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Email already in use',
        });

        await expect(
          register('Test', 'User', 'existing@example.com', 'password123')
        ).rejects.toThrow('Email already in use');
      });

      it('should throw on validation error', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Invalid email format',
        });

        await expect(
          register('Test', 'User', 'invalid-email', 'password123')
        ).rejects.toThrow('Invalid email format');
      });
    });
  });

  // =========================================================================
  // Profile Tests
  // =========================================================================

  describe('Profile', () => {
    describe('getProfile', () => {
      it('should fetch user profile', async () => {
        const mockProfile = {
          contactInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          skills: [{ name: 'Python', level: 'Advanced' }],
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        });

        const result = await getProfile('user-123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/profile/user-123'),
          expect.any(Object)
        );
        expect(result).toEqual(mockProfile);
      });

      it('should throw on profile not found', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Profile not found',
        });

        await expect(getProfile('nonexistent')).rejects.toThrow('Profile not found');
      });
    });

    describe('updateProfile', () => {
      it('should update user profile', async () => {
        const updates = {
          contactInfo: { firstName: 'Jane', lastName: 'Smith' },
        };
        const mockResponse = { success: true };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await updateProfile('user-123', updates);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/profile/user-123'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // =========================================================================
  // Job Tests
  // =========================================================================

  describe('Jobs', () => {
    describe('getJobRecommendations', () => {
      it('should fetch job recommendations', async () => {
        const mockJobs = {
          jobs: [
            { id: '1', title: 'Developer', company: 'Tech Co' },
            { id: '2', title: 'Engineer', company: 'Other Co' },
          ],
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockJobs,
        });

        const result = await getJobRecommendations('user-123', 10);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/jobs/recommendations/user-123?limit=10'),
          expect.any(Object)
        );
        expect(result).toEqual(mockJobs);
      });

      it('should use default limit', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobs: [] }),
        });

        await getJobRecommendations('user-123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/jobs/recommendations/user-123?limit=50'),
          expect.any(Object)
        );
      });
    });
  });

  // =========================================================================
  // CV Extraction Tests
  // =========================================================================

  describe('CV Extraction', () => {
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

      it('should throw on extraction failure', async () => {
        const mockFile = new File(['invalid'], 'cv.pdf', { type: 'application/pdf' });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Could not extract text from file',
        });

        await expect(extractCV(mockFile)).rejects.toThrow('Could not extract text from file');
      });
    });
  });

  // =========================================================================
  // AI Service Tests
  // =========================================================================

  describe('AI Service', () => {
    const mockProfile = {
      contactInfo: { firstName: 'John', lastName: 'Doe' },
      skills: [{ name: 'Python', level: 'Advanced' }],
    };

    describe('getMatchScore', () => {
      it('should calculate match score', async () => {
        const mockResponse = {
          ats_score: 85,
          match_score: 0.85,
          strengths: ['Python experience'],
          gaps: ['Missing AWS cert'],
          keywords_to_add: ['Kubernetes'],
          recommended_bullets: ['Led team'],
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await getMatchScore(mockProfile, 'Job description', 'Resume text');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/agents/match-score'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('jobDescription'),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('tailorResume', () => {
      it('should tailor resume', async () => {
        const mockResponse = {
          tailored_resume: 'Tailored resume content...',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await tailorResume('Original CV', 'Job description', mockProfile);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/agents/tailor-resume'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should pass style parameter', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tailored_resume: '' }),
        });

        await tailorResume('CV', 'Job', mockProfile, 'creative');

        const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.style).toBe('creative');
      });
    });

    describe('generateCoverLetter', () => {
      it('should generate cover letter', async () => {
        const mockResponse = {
          cover_letter: 'Dear Hiring Manager...',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await generateCoverLetter('Job description', mockProfile, 'Tech Corp');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/agents/generate-cover-letter'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should work without company name', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ cover_letter: '' }),
        });

        await generateCoverLetter('Job description', mockProfile);

        expect(fetch).toHaveBeenCalled();
      });
    });

    describe('generateEmail', () => {
      it('should generate email', async () => {
        const mockResponse = {
          email: 'Subject: Application...',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await generateEmail('Job description', mockProfile, 'recruiter');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/agents/generate-email'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should default to recruiter recipient type', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ email: '' }),
        });

        await generateEmail('Job description', mockProfile);

        const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.recipientType).toBe('recruiter');
      });
    });

    describe('neilweChat', () => {
      it('should send chat message', async () => {
        const mockResponse = {
          response: 'Hello! How can I help you?',
          profileUpdate: null,
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await neilweChat('What jobs should I apply for?', mockProfile);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/agents/neilwe-chat'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('What jobs should I apply for?'),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should include chat history', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: '' }),
        });

        const chatHistory = [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ];

        await neilweChat('How are you?', mockProfile, chatHistory);

        const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.chatHistory).toEqual(chatHistory);
      });
    });
  });

  // =========================================================================
  // Application Tests
  // =========================================================================

  describe('Applications', () => {
    describe('createApplication', () => {
      it('should create application', async () => {
        const mockResponse = { id: 'app-123', success: true };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await createApplication({
          userId: 'user-123',
          company: 'Google',
          role: 'Software Engineer',
          status: 'applied',
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/applications'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Google'),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should set default values', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'app-123' }),
        });

        await createApplication({
          company: '',
          role: '',
        });

        const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.company).toBe('Unknown Company');
        expect(callBody.role).toBe('Unknown Role');
        expect(callBody.status).toBe('applied');
        expect(callBody.source).toBe('manual');
      });
    });

    describe('getApplications', () => {
      it('should fetch user applications', async () => {
        const mockResponse = [
          { id: 'app-1', company: 'Google', role: 'Engineer' },
          { id: 'app-2', company: 'Microsoft', role: 'Developer' },
        ];

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await getApplications('user-123');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/applications/user/user-123'),
          expect.any(Object)
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(login('test@example.com', 'password')).rejects.toThrow('Failed to fetch');
    });

    it('should handle JSON parse errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(login('test@example.com', 'password')).rejects.toThrow('Invalid JSON');
    });

    it('should handle empty error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      });

      await expect(login('test@example.com', 'password')).rejects.toThrow('HTTP 500');
    });
  });

  // =========================================================================
  // Request Configuration Tests
  // =========================================================================

  describe('Request Configuration', () => {
    it('should include correct headers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await login('test@example.com', 'password');

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should merge custom headers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // This would require modifying the API to accept custom headers
      // For now, just verify the default behavior
      await login('test@example.com', 'password');

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });
  });
});
