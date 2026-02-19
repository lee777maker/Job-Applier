// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  linkedin?: string;
  github?: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  field?: string;
  duration: string;
  gpa?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  link?: string;
}

export interface UserProfile {
  contactInfo: ContactInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: (string | SkillItem)[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  resumeFileName?: string;
  resumeUploadedAt?: string;
  resumeBase64?: string;
  resumeText?: string;
  suggestedJobTitles?: string[];
  primaryJobTitle?: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  applicationUrl: string;
  matchScore: number;
  postedAt?: string;
  jobType?: string;
  salary?: string;
  source?: string;
}

export interface JobPreferences {
  preferredRole: string;
  location: string;
  openToRemote: boolean;
  contractTypes: string[];
  minSalary?: number;
  maxSalary?: number;
  daysOld?: number;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// AI Service Types
export interface MatchScoreResult {
  ats_score: number;
  match_score: number;
  strengths: string[];
  gaps: string[];
  keywords_to_add: string[];
  recommended_bullets: string[];
}

export interface TailoredResume {
  tailored_resume: string;
  timestamp?: string;
}

export interface CoverLetterResult {
  cover_letter: string;
  timestamp?: string;
}

export interface EmailResult {
  email: string;
  timestamp?: string;
}

// Application Types
export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'declined' | 'withdrawn';
  appliedAt: string;
  matchScore: number;
  notes?: string;
}

// Dashboard Types
export interface Analytics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  responseRate: number;
  averageMatchScore: number;
}

export interface CareerBlog {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  url: string;
  category: string;
  date: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface JobSearchResponse {
  jobs: Job[];
  search_terms_used: string[];
  total_found: number;
}