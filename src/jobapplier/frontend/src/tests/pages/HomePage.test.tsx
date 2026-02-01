import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomePage } from '@/pages/HomePage';
import { AppProvider } from '@/context/AppContext';
import '@testing-library/jest-dom';

// Mock fetch API
global.fetch = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders empty chat state correctly', () => {
    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    expect(screen.getByText(/Enter Job description/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask me anything about jobs/i)).toBeInTheDocument();
  });

  test('handles file upload click', () => {
    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    const fileInput = screen.getByLabelText(/attach file/i);
    expect(fileInput).toBeInTheDocument();
  });

  test('sends message when Enter key is pressed', () => {
    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    const input = screen.getByPlaceholderText(/What would you like to know/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Should add message to chat
    expect(input).toHaveValue('');
  });

  test('handles file upload successfully', async () => {
    const mockFile = new File(['test resume content'], 'resume.pdf', { 
      type: 'application/pdf' 
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'resume.pdf',
        content_preview: 'Parsed resume content...',
        word_count: 250,
        extracted_skills: ['Java', 'Python']
      })
    });

    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    const fileInput = screen.getByLabelText(/attach file/i);
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8001/agents/upload-resume',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  test('handles file upload error', async () => {
    const mockFile = new File(['test'], 'resume.pdf', { 
      type: 'application/pdf' 
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    const fileInput = screen.getByLabelText(/attach file/i);
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      // Should show error in chat
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  test('validates file types', async () => {
    const invalidFile = new File(['test'], 'image.jpg', { 
      type: 'image/jpeg' 
    });

    render(
      <AppProvider>
        <HomePage />
      </AppProvider>
    );

    const fileInput = screen.getByLabelText(/attach file/i);
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
    });
  });
});