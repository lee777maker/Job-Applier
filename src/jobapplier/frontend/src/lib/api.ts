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
export const getJobRecommendations = (userId: string, limit: number = 50) =>
  fetchApi(`/jobs/recommendations/${userId}?limit=${limit}`);

export const extractJobTitlesFromCV = (cvText: string, preferredRole?: string) =>
  fetch(`${AI_SERVICE_URL}/agents/extract-job-titles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cv_text: cvText,
      preferred_role: preferredRole || ''
    }),
  }).then(r => r.json());

export const searchJobsByProfile = (profile: any, preferences: any, maxResults: number = 50) =>
  fetch(`${API_BASE_URL}/jobs/search-by-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      preferences,
      max_results: maxResults
    }),
  }).then(r => r.json());

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

// Generate outreach email
export const generateEmail = (jobDescription: string, userProfile: any, recipientType: 'recruiter' | 'hiring_manager' = 'recruiter') =>
  fetch(`${AI_SERVICE_URL}/agents/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription,
      userProfile,
      recipientType,
    }),
  }).then(r => r.json());

export const neilweChat = (message: string, profile?: any, chatHistory?: any[]) =>
  fetch(`${AI_SERVICE_URL}/agents/neilwe-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      profile,     // full profile object — used to personalise Neilwe's context
      chatHistory,
    }),
  }).then(r => r.json());
// ─── Application APIs ─────────────────────────────────────────────────────────

export const createApplication = (data: {
  userId?: string;
  jobId?: string;
  company: string;
  role: string;
  location?: string;
  status?: string;
  appliedAt?: string;  
  notes?: string;
  wasSuccessful?: boolean | null;
  outcomeNotes?: string;
  applicationUrl?: string;
  source?: string;
  jobDescription?: string;
  matchScore?: number;
}) =>
  fetchApi('/applications', { 
    method: 'POST', 
    body: JSON.stringify({
      ...data,
      company: data.company || 'Unknown Company',
      role: data.role || 'Unknown Role',
      status: data.status || 'applied',
      source: data.source || 'manual'
    }) 
  });

export const getApplications = (userId: string) =>
  fetchApi(`/applications/user/${userId}`);

// ─── Dashboard APIs (gracefully degrade if backend not yet implemented) ───────

export const getDashboardAnalytics = (userId: string) =>
  fetchApi(`/dashboard/analytics/${userId}`).catch(() => ({
    totalApplications: 0,
    interviewRate: 0,
    offerRate: 0,
    avgResponseDays: 0,
  }));

export const getDashboardApplications = (userId: string) =>
  fetchApi(`/dashboard/applications/${userId}`).catch(() => ({
    applications: [],
  }));

export const getApplicationStatusBreakdown = (userId: string) =>
  fetchApi(`/dashboard/status-breakdown/${userId}`).catch(() => ({
    applied: 0, interviewing: 0, offered: 0, rejected: 0,
  }));

export const getWeeklyActivity = (userId: string) =>
  fetchApi(`/dashboard/weekly-activity/${userId}`).catch(() => ({ weeks: [] }));

export const getMatchScoreTrend = (userId: string) =>
  fetchApi(`/dashboard/match-score-trend/${userId}`).catch(() => ({ trend: [] }));

export const getCareerResources = () =>
  fetchApi('/dashboard/career-resources').catch(() => ({ resources: [] }));