// frontend/src/lib/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || '/ai';

// Helper for API calls
async function fetchApi(endpoint: string, options: RequestInit = {}, baseUrl: string = API_BASE_URL) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Auth APIs
export const login = (email: string, password: string) => 
  fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (name: string, surname: string, email: string, password: string) =>
  fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, surname, email, password }),
  });

// Profile APIs
export const getProfile = (userId: string) =>
  fetchApi(`/profile/${userId}`);

export const updateProfile = (userId: string, profileData: any) =>
  fetchApi(`/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

// Job APIs
export const getJobRecommendations = (userId: string, limit: number = 10) =>
  fetchApi(`/jobs/recommendations/${userId}?limit=${limit}`);

// AI Service APIs (direct to Python service)
export const extractCV = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetch(`${AI_SERVICE_URL}/agents/extract-cv`, {
    method: 'POST',
    body: formData,
  }).then(r => r.json());
};

export const autofillCV = (textContent: string) => {
  const formData = new FormData();
  formData.append('text_content', textContent);
  
  return fetch(`${AI_SERVICE_URL}/agents/autofill`, {
    method: 'POST',
    body: formData,
  }).then(r => r.json());
};

export const getMatchScore = (userProfile: any, jobDescription: string, resumeText?: string) =>
  fetch(`${AI_SERVICE_URL}/agents/match-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userProfile,
      jobDescription,
      resumeText,
    }),
  }).then(r => r.json());

export const tailorResume = (originalCV: string, jobDescription: string, userProfile: any, style = 'professional') =>
  fetch(`${AI_SERVICE_URL}/agents/tailor-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalCV,
      jobDescription,
      userProfile,
      style,
      tone: 'professional',
      length: 'standard',
    }),
  }).then(r => r.json());

export const generateCoverLetter = (jobDescription: string, userProfile: any, companyName?: string) =>
  fetch(`${AI_SERVICE_URL}/agents/generate-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription,
      userProfile,
      companyName,
    }),
  }).then(r => r.json());

export const neilweChat = (message: string, context?: any, chatHistory?: any[]) =>
  fetch(`${AI_SERVICE_URL}/agents/neilwe-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context,
      chatHistory,
    }),
  }).then(r => r.json());