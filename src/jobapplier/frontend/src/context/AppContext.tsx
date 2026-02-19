import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserProfile, JobPreferences, Job, ChatMessage } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Profile
  profile: UserProfile | null;
  
  // Job Preferences
  jobPreferences: JobPreferences | null;
  
  // Jobs
  recommendedJobs: Job[];
  
  // Chat
  chatMessages: ChatMessage[];
  
  // CV Upload
  uploadedCV: File | null;
  extractedCVData: any | null;

  isLoading: boolean;
}

interface AppContextType extends AppState {
  // Auth actions
  login: (user: User) => void;
  logout: () => void;
  
  // Profile actions
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Job Preferences actions
  setJobPreferences: (prefs: JobPreferences) => void;
  
  // Jobs actions
  setRecommendedJobs: (jobs: Job[]) => void;
  
  // Chat actions
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  
  // CV actions
  setUploadedCV: (file: File | null) => void;
  setExtractedCVData: (data: any) => void;
}

const defaultState: AppState = {
  user: null,
  isAuthenticated: false,
  profile: null,
  jobPreferences: null,
  recommendedJobs: [],
  chatMessages: [
    {
      role: 'assistant',
      content: 'Hi, I am your personal assistant\n\nTask I can assist you with:\n1. Find jobs where you are top candidate\n2. Assist with interview questions\n3. Provide insights on specific jobs\n4. Help with app navigation',
      timestamp: Date.now()
    }
  ],
  uploadedCV: null,
  extractedCVData: null,
  isLoading: true, // Start with loading true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('jobapplier_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          ...parsed,
          uploadedCV: null,
          isLoading: false, // Done loading after restore
        }));
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save state to localStorage on changes (excluding file objects)
  useEffect(() => {
    const stateToSave = {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      profile: state.profile,
      jobPreferences: state.jobPreferences,
      recommendedJobs: state.recommendedJobs,
      chatMessages: state.chatMessages,
      extractedCVData: state.extractedCVData,
    };
    localStorage.setItem('jobapplier_state', JSON.stringify(stateToSave));
  }, [state.user, state.isAuthenticated, state.profile, state.jobPreferences, state.recommendedJobs, state.chatMessages, state.extractedCVData]);

  const login = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
  };

  const logout = () => {
    localStorage.removeItem('jobapplier_state');
    setState(defaultState);
  };

  const setProfile = (profile: UserProfile | null) => {
    setState(prev => ({ ...prev, profile }));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null,
    }));
  };

  const setJobPreferences = (prefs: JobPreferences) => {
    setState(prev => ({ ...prev, jobPreferences: prefs }));
  };

  const setRecommendedJobs = (jobs: Job[]) => {
    setState(prev => ({ ...prev, recommendedJobs: jobs }));
  };

  const addChatMessage = (message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, { ...message, timestamp: Date.now() }],
    }));
  };

  const clearChat = () => {
    setState(prev => ({
      ...prev,
      chatMessages: defaultState.chatMessages,
    }));
  };

  const setUploadedCV = (file: File | null) => {
    setState(prev => ({ ...prev, uploadedCV: file }));
  };

  const setExtractedCVData = (data: any) => {
    setState(prev => ({ ...prev, extractedCVData: data }));
  };

  // SINGLE RETURN - All context values provided
  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        setProfile,
        updateProfile,
        setJobPreferences,
        setRecommendedJobs,
        addChatMessage,
        clearChat,
        setUploadedCV,
        setExtractedCVData,
      }}
    >
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