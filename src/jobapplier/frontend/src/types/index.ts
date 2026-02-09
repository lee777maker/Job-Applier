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
  phoneNumber: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  gpa: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  link: string;
}

export interface UserProfile {
  id: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  experience: Array<{
    id: string;
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    field: string;
    duration: string;
    gpa?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  skills: Array<string | { name: string; level?: string }>;
  certifications: Array<{
    id: string;
    name: string;
    link?: string;
  }>;
  resumeFileName?: string;
  resumeUploadedAt?: string;
  resumeText?: string;  // If you store parsed resume text
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  applicationUrl: string;
  matchScore: number;
  description?: string;
}

export interface JobPreferences {
  preferredRole: string;
  contractTypes: string[];
  location: string;
  openToRemote: boolean;
}

// Application Types
export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIAL_ACTION_REQUIRED' | 'FAILED_NOT_SUBMITTED';
  createdAt: string;
}

// AI Types
export interface MatchScoreResult {
  match_score: number;
  ats_score: number;
  strengths: string[];
  gaps: string[];
  keywords_to_add: string[];
  recommended_bullets: string[];
  confidence: number;
}

export interface TailoredResume {
  tailored_resume: string;
  changes_made: {
    words_added: number;
    words_removed: number;
    length_change_percent: number;
    top_keywords_added: string[];
  };
  optimization_score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// CV Extracted Data
export interface CVExtractedData {
  contactInfo: ContactInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  rawText: string;
}
