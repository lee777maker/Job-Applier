import React, { createContext, useContext, useState, useCallback } from 'react';
import type { 
  UserProfile, 
  ContactInfo, 
  Experience, 
  Education, 
  Project, 
  Skill, 
  Certification,
  Job, 
  ChatMessage,
  Page 
} from '@/types';

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  updateContactInfo: (contactInfo: ContactInfo) => void;
  addExperience: (experience: Experience) => void;
  updateExperience: (id: string, experience: Experience) => void;
  removeExperience: (id: string) => void;
  addEducation: (education: Education) => void;
  updateEducation: (id: string, education: Education) => void;
  removeEducation: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Project) => void;
  removeProject: (id: string) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  addCertification: (certification: Certification) => void;
  removeCertification: (id: string) => void;
  jobs: Job[];
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  isProfileEditing: boolean;
  setIsProfileEditing: (editing: boolean) => void;
}

const defaultProfile: UserProfile = {
  contactInfo: {
    firstName: 'Lethabo',
    lastName: 'Neo',
    email: 'lethaboneo@icloud.com',
    phoneNumber: '0814476357'
  },
  experience: [
    {
      id: '1',
      title: 'Junior Software Engineer',
      company: 'Tech Corp',
      duration: '1 year',
      description: 'Designed and built an end-to-end system that automatically sources job listings, tailors CVs, generates cover letters, and contacts recruiters via email and LinkedIn.'
    },
    {
      id: '2',
      title: 'BusBoy',
      company: 'Restaurant Group',
      duration: '1 year',
      description: 'Designed and built an end-to-end system that automatically sources job listings, tailors CVs, generates cover letters, and contacts recruiters via email and LinkedIn.'
    }
  ],
  education: [
    {
      id: '1',
      degree: 'Bachelors of Science',
      field: 'Computer Science and Applied Statistics',
      institution: 'University of Cape Town',
      gpa: '4.0'
    },
    {
      id: '2',
      degree: 'Bachelors of Science Honours',
      field: 'Computer Science',
      institution: 'University of Cape Town',
      gpa: '4.0'
    }
  ],
  projects: [
    {
      id: '1',
      name: 'UAV Visualisation App',
      description: 'Designed and built an end-to-end system that automatically sources job listings, tailors CVs, generates cover letters, and contacts recruiters via email and LinkedIn.'
    },
    {
      id: '2',
      name: 'AI Job Application App',
      description: 'Designed and built an end-to-end system that automatically sources job listings, tailors CVs, generates cover letters, and contacts recruiters via email and LinkedIn.'
    }
  ],
  skills: [
    { id: '1', name: 'Adaptable' },
    { id: '2', name: 'Adaptable' },
    { id: '3', name: 'Adaptable' },
    { id: '4', name: 'Adaptable' },
    { id: '5', name: 'Adaptable' },
    { id: '6', name: 'Adaptable' }
  ],
  certifications: [
    { id: '1', name: 'AWS Cloud Practitioner', link: '#' },
    { id: '2', name: 'Driver\'s License', link: '#' }
  ]
};

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Graduate Software Engineer',
    company: 'BT',
    applicationUrl: 'https://linkedin.com/jobs/1'
  },
  {
    id: '2',
    title: 'Agentic Engineer',
    company: 'Deloitte',
    applicationUrl: 'https://linkedin.com/jobs/2'
  },
  {
    id: '3',
    title: 'Junior Automation Engineer',
    company: 'Lectra',
    applicationUrl: 'https://linkedin.com/jobs/3'
  },
  {
    id: '4',
    title: 'Graduate Software Engineer',
    company: 'BT',
    applicationUrl: 'https://linkedin.com/jobs/4'
  },
  {
    id: '5',
    title: 'Agentic Engineer',
    company: 'Deloitte',
    applicationUrl: 'https://linkedin.com/jobs/5'
  },
  {
    id: '6',
    title: 'Junior Automation Engineer',
    company: 'Lectra',
    applicationUrl: 'https://linkedin.com/jobs/6'
  }
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [jobs] = useState<Job[]>(mockJobs);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProfileEditing, setIsProfileEditing] = useState(false);

  const updateProfile = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
  }, []);

  const updateContactInfo = useCallback((contactInfo: ContactInfo) => {
    setProfile(prev => ({ ...prev, contactInfo }));
  }, []);

  const addExperience = useCallback((experience: Experience) => {
    setProfile(prev => ({ ...prev, experience: [...prev.experience, experience] }));
  }, []);

  const updateExperience = useCallback((id: string, experience: Experience) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? experience : e)
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(e => e.id !== id)
    }));
  }, []);

  const addEducation = useCallback((education: Education) => {
    setProfile(prev => ({ ...prev, education: [...prev.education, education] }));
  }, []);

  const updateEducation = useCallback((id: string, education: Education) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? education : e)
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  }, []);

  const addProject = useCallback((project: Project) => {
    setProfile(prev => ({ ...prev, projects: [...prev.projects, project] }));
  }, []);

  const updateProject = useCallback((id: string, project: Project) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? project : p)
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  }, []);

  const addSkill = useCallback((skill: Skill) => {
    setProfile(prev => ({ ...prev, skills: [...prev.skills, skill] }));
  }, []);

  const removeSkill = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id)
    }));
  }, []);

  const addCertification = useCallback((certification: Certification) => {
    setProfile(prev => ({ 
      ...prev, 
      certifications: [...prev.certifications, certification] 
    }));
  }, []);

  const removeCertification = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c.id !== id)
    }));
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const value: AppState = {
    currentPage,
    setCurrentPage,
    profile,
    updateProfile,
    updateContactInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    jobs,
    chatMessages,
    addChatMessage,
    isProfileEditing,
    setIsProfileEditing
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
