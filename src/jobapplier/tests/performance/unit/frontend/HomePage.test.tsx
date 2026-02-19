import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import HomePage from '@/pages/HomePage';

// Mock API calls
vi.mock('@/lib/api', () => ({
  searchJobsByProfile: vi.fn(),
  neilweChat: vi.fn(),
  getProfile: vi.fn(),
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test',
  surname: 'User',
};

const mockProfile = {
  skills: ['React', 'TypeScript'],
  suggestedJobTitles: ['Software Engineer', 'Frontend Developer'],
};

const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Standard Bank',
    location: 'Johannesburg',
    matchScore: 0.85,
    applicationUrl: 'https://example.com/job1',
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'Nedbank',
    location: 'Cape Town',
    matchScore: 0.78,
    applicationUrl: 'https://example.com/job2',
  },
];

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job recommendations section', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Top jobs based on your profile/i)).toBeInTheDocument();
  });

  it('displays chatbot with resizable functionality', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Neilwe/i)).toBeInTheDocument();
    expect(screen.getByText(/Your AI assistant/i)).toBeInTheDocument();
  });

  it('handles chat input submission', async () => {
    const { neilweChat } = await import('@/lib/api');
    (neilweChat as any).mockResolvedValue({ response: 'Test response' });

    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/What would you like to know/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(neilweChat).toHaveBeenCalledWith(
        'Hello',
        expect.any(Object),
        expect.any(Array)
      );
    });
  });

  it('loads and displays jobs on mount', async () => {
    const { searchJobsByProfile } = await import('@/lib/api');
    (searchJobsByProfile as any).mockResolvedValue({ jobs: mockJobs });

    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(searchJobsByProfile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        50  // Should request 50 jobs
      );
    });
  });

  it('displays job match scores correctly', async () => {
    const { searchJobsByProfile } = await import('@/lib/api');
    (searchJobsByProfile as any).mockResolvedValue({ jobs: mockJobs });

    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/85% Match/i)).toBeInTheDocument();
      expect(screen.getByText(/78% Match/i)).toBeInTheDocument();
    });
  });

  it('allows loading more jobs', async () => {
    const manyJobs = Array(25).fill(null).map((_, i) => ({
      id: String(i),
      title: `Job ${i}`,
      company: `Company ${i}`,
      location: 'Johannesburg',
      matchScore: 0.7 + (i % 10) / 100,
      applicationUrl: `https://example.com/job${i}`,
    }));

    const { searchJobsByProfile } = await import('@/lib/api');
    (searchJobsByProfile as any).mockResolvedValue({ jobs: manyJobs });

    render(
      <BrowserRouter>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const loadMoreButton = screen.getByText(/Load More Jobs/i);
      expect(loadMoreButton).toBeInTheDocument();
    });
  });
});