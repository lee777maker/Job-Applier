// User Profile Types
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

export interface Skill {
  id: string;
  name: string;
}

export interface Certification {
  id: string;
  name: string;
  link?: string;
}

export interface UserProfile {
  contactInfo: ContactInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  applicationUrl: string;
  description?: string;
  postedDate?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

// Navigation Types
export type Page = 'home' | 'profile' | 'dashboard' | 'jobs';

// File Upload Types
export type SupportedFileType = 'application/json' | 'image/png' | 'image/jpeg' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const SUPPORTED_FILE_TYPES: Record<string, string[]> = {
  'application/json': ['.json'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};
