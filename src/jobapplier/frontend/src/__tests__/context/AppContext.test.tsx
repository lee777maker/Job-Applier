/**
 * Unit tests for the AppContext.
 * Tests cover state management, actions, and persistence.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/AppContext';
import type { User, UserProfile, JobPreferences, Job, ChatMessage } from '@/types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe('Initial State', () => {
    it('should have correct default state', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(result.current.jobPreferences).toBeNull();
      expect(result.current.recommendedJobs).toEqual([]);
      expect(result.current.uploadedCV).toBeNull();
      expect(result.current.extractedCVData).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('should have default chat message', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.chatMessages).toHaveLength(1);
      expect(result.current.chatMessages[0].role).toBe('assistant');
      expect(result.current.chatMessages[0].content).toContain('Neilwe');
    });
  });

  // =========================================================================
  // Authentication Tests
  // =========================================================================

  describe('Authentication', () => {
    it('should login user', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
      };

      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should logout user', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Login first
      act(() => {
        result.current.login({
          id: '123',
          email: 'test@example.com',
          name: 'Test',
          surname: 'User',
        });
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jobapplier_state');
    });

    it('should handle logout when not logged in', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jobapplier_state');
    });
  });

  // =========================================================================
  // Profile Tests
  // =========================================================================

  describe('Profile', () => {
    it('should set profile', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockProfile: UserProfile = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        skills: [{ name: 'Python', level: 'Advanced' }],
      };

      act(() => {
        result.current.setProfile(mockProfile);
      });

      expect(result.current.profile).toEqual(mockProfile);
    });

    it('should update profile partially', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Set initial profile
      act(() => {
        result.current.setProfile({
          contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        });
      });

      // Update with new fields
      act(() => {
        result.current.updateProfile({
          skills: [{ name: 'React', level: 'Intermediate' }],
        });
      });

      expect(result.current.profile).toEqual({
        contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        skills: [{ name: 'React', level: 'Intermediate' }],
      });
    });

    it('should handle update when profile is null', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.updateProfile({ skills: [] });
      });

      expect(result.current.profile).toBeNull();
    });

    it('should clear profile', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setProfile({ contactInfo: { firstName: 'Test', lastName: 'User', email: 'test@example.com' } });
      });

      act(() => {
        result.current.setProfile(null);
      });

      expect(result.current.profile).toBeNull();
    });
  });

  // =========================================================================
  // Job Preferences Tests
  // =========================================================================

  describe('Job Preferences', () => {
    it('should set job preferences', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockPrefs: JobPreferences = {
        preferredRole: 'Software Engineer',
        location: 'Johannesburg',
        openToRemote: true,
        contractTypes: ['full-time'],
      };

      act(() => {
        result.current.setJobPreferences(mockPrefs);
      });

      expect(result.current.jobPreferences).toEqual(mockPrefs);
    });
  });

  // =========================================================================
  // Jobs Tests
  // =========================================================================

  describe('Jobs', () => {
    it('should set recommended jobs', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Developer',
          company: 'Tech Co',
          location: 'JHB',
          matchScore: 0.85,
        },
        {
          id: '2',
          title: 'Engineer',
          company: 'Other Co',
          location: 'CPT',
          matchScore: 0.75,
        },
      ];

      act(() => {
        result.current.setRecommendedJobs(mockJobs);
      });

      expect(result.current.recommendedJobs).toEqual(mockJobs);
    });

    it('should replace existing jobs', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setRecommendedJobs([{ id: '1', title: 'Old Job', company: 'Old Co', location: 'JHB' }]);
      });

      act(() => {
        result.current.setRecommendedJobs([{ id: '2', title: 'New Job', company: 'New Co', location: 'CPT' }]);
      });

      expect(result.current.recommendedJobs).toHaveLength(1);
      expect(result.current.recommendedJobs[0].title).toBe('New Job');
    });
  });

  // =========================================================================
  // Chat Tests
  // =========================================================================

  describe('Chat', () => {
    it('should add chat message', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const newMessage: ChatMessage = {
        role: 'user',
        content: 'Hello!',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addChatMessage(newMessage);
      });

      expect(result.current.chatMessages).toHaveLength(2);
      expect(result.current.chatMessages[1].role).toBe('user');
      expect(result.current.chatMessages[1].content).toBe('Hello!');
    });

    it('should add timestamp to message', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const beforeAdd = Date.now();

      act(() => {
        result.current.addChatMessage({ role: 'user', content: 'Test' });
      });

      const lastMessage = result.current.chatMessages[result.current.chatMessages.length - 1];
      expect(lastMessage.timestamp).toBeGreaterThanOrEqual(beforeAdd);
    });

    it('should clear chat to default', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Add some messages
      act(() => {
        result.current.addChatMessage({ role: 'user', content: 'Hello' });
        result.current.addChatMessage({ role: 'assistant', content: 'Hi!' });
      });

      expect(result.current.chatMessages).toHaveLength(3);

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.chatMessages).toHaveLength(1);
      expect(result.current.chatMessages[0].role).toBe('assistant');
    });
  });

  // =========================================================================
  // CV Tests
  // =========================================================================

  describe('CV Upload', () => {
    it('should set uploaded CV', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockFile = new File(['content'], 'cv.pdf', { type: 'application/pdf' });

      act(() => {
        result.current.setUploadedCV(mockFile);
      });

      expect(result.current.uploadedCV).toBe(mockFile);
    });

    it('should clear uploaded CV', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setUploadedCV(new File([''], 'test.pdf'));
      });

      act(() => {
        result.current.setUploadedCV(null);
      });

      expect(result.current.uploadedCV).toBeNull();
    });

    it('should set extracted CV data', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const mockData = {
        contactInfo: { firstName: 'John', lastName: 'Doe' },
        skills: [{ name: 'Python', level: 'Advanced' }],
      };

      act(() => {
        result.current.setExtractedCVData(mockData);
      });

      expect(result.current.extractedCVData).toEqual(mockData);
    });
  });

  // =========================================================================
  // Persistence Tests
  // =========================================================================

  describe('Persistence', () => {
    it('should save state to localStorage', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.login({ id: '123', email: 'test@example.com', name: 'Test', surname: 'User' });
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedState = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedState.isAuthenticated).toBe(true);
      expect(savedState.user.email).toBe('test@example.com');
    });

    it('should not save uploadedCV to localStorage', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setUploadedCV(new File([''], 'test.pdf'));
      });

      const savedState = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedState.uploadedCV).toBeUndefined();
    });

    it('should load state from localStorage on mount', async () => {
      const savedState = {
        user: { id: '456', email: 'loaded@example.com', name: 'Loaded', surname: 'User' },
        isAuthenticated: true,
        profile: { contactInfo: { firstName: 'Loaded', lastName: 'User', email: 'loaded@example.com' } },
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('loaded@example.com');
    });

    it('should handle invalid localStorage data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use default state
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle empty localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe('Error Handling', () => {
    it('should throw when useApp is used outside AppProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useApp());
      }).toThrow('useApp must be used within an AppProvider');

      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // Complex Scenarios
  // =========================================================================

  describe('Complex Scenarios', () => {
    it('should handle full user workflow', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // 1. User logs in
      act(() => {
        result.current.login({
          id: 'user-123',
          email: 'john@example.com',
          name: 'John',
          surname: 'Doe',
        });
      });

      // 2. User sets profile
      act(() => {
        result.current.setProfile({
          contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          skills: [{ name: 'Python', level: 'Advanced' }],
        });
      });

      // 3. User sets job preferences
      act(() => {
        result.current.setJobPreferences({
          preferredRole: 'Software Engineer',
          location: 'Johannesburg',
          openToRemote: true,
          contractTypes: ['full-time'],
        });
      });

      // 4. Jobs are loaded
      act(() => {
        result.current.setRecommendedJobs([
          { id: '1', title: 'Engineer', company: 'Google', location: 'JHB', matchScore: 0.9 },
        ]);
      });

      // 5. User chats with Neilwe
      act(() => {
        result.current.addChatMessage({ role: 'user', content: 'What jobs should I apply for?' });
      });

      // Verify all state
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.profile?.contactInfo?.firstName).toBe('John');
      expect(result.current.jobPreferences?.preferredRole).toBe('Software Engineer');
      expect(result.current.recommendedJobs).toHaveLength(1);
      expect(result.current.chatMessages).toHaveLength(2);
    });

    it('should handle profile update after CV extraction', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Simulate CV extraction
      const extractedData = {
        contactInfo: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        skills: [
          { id: '1', name: 'Python', level: 'Advanced' },
          { id: '2', name: 'React', level: 'Intermediate' },
        ],
        experiences: [
          { id: '1', title: 'Developer', company: 'Tech Co', duration: '2020-2023', description: 'Built apps' },
        ],
      };

      act(() => {
        result.current.setExtractedCVData(extractedData);
        result.current.setProfile(extractedData);
      });

      expect(result.current.extractedCVData).toEqual(extractedData);
      expect(result.current.profile).toEqual(extractedData);
    });
  });
});
