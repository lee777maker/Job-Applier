import type { User, UserProfile, Job, MatchScoreResult, TailoredResume } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

// Auth API
export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return response.json();
}

export async function register(name: string, surname: string, email: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, surname, email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
}

// Profile API
export async function getProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  return response.json();
}

export async function updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
}

// Jobs API
export async function getJobRecommendations(userId: string, limit: number = 10): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/recommendations/${userId}?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch job recommendations');
  }
  
  const data = await response.json();
  return data.jobs || [];
}

// AI Service API
export async function uploadResume(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${AI_SERVICE_URL}/agents/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload resume');
  }
  
  return response.json();
}

export async function extractCVData(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${AI_SERVICE_URL}/agents/extract-cv`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract CV data');
  }
  
  return response.json();
}

export async function getMatchScore(
  userProfile: any,
  jobDescription: string,
  resumeText?: string
): Promise<MatchScoreResult> {
  const response = await fetch(`${AI_SERVICE_URL}/agents/match-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_profile: userProfile,
      job_description: jobDescription,
      resume_text: resumeText,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get match score');
  }
  
  return response.json();
}

export async function tailorResume(
  originalResume: string,
  jobDescription: string,
  userProfile: any,
  style: string = 'professional',
  tone: string = 'professional',
  length: string = 'standard'
): Promise<TailoredResume> {
  const response = await fetch(`${AI_SERVICE_URL}/agents/tailor-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_resume: originalResume,
      job_description: jobDescription,
      user_profile: userProfile,
      style,
      tone,
      length,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to tailor resume');
  }
  
  return response.json();
}

export async function generateCoverLetter(
  userProfile: any,
  jobDescription: string,
  companyName: string,
  hiringManager?: string
): Promise<{ cover_letter: string; tone: string; word_count: number; keywords_included: string[] }> {
  const response = await fetch(`${AI_SERVICE_URL}/agents/generate-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_profile: userProfile,
      job_description: jobDescription,
      company_name: companyName,
      hiring_manager: hiringManager,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate cover letter');
  }
  
  return response.json();
}

// Neilwe Chatbot API
export async function chatWithNeilwe(message: string, context?: any): Promise<string> {
  const response = await fetch(`${AI_SERVICE_URL}/agents/neilwe-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context: context || {},
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response from Neilwe');
  }
  
  const data = await response.json();
  return data.response;
}

// Google Careers API (mock for now - would need actual API key)
export async function searchGoogleCareers(_query: string, location: string): Promise<Job[]> {
  // This would integrate with Google Careers API
  // For now, return mock data
  return [
    {
      id: '1',
      title: 'Software Engineer',
      company: 'Google',
      location: location || 'Mountain View, CA',
      applicationUrl: 'https://careers.google.com',
      matchScore: 0.92,
    },
    {
      id: '2',
      title: 'Senior Software Engineer',
      company: 'Google',
      location: location || 'New York, NY',
      applicationUrl: 'https://careers.google.com',
      matchScore: 0.88,
    },
  ];
}
