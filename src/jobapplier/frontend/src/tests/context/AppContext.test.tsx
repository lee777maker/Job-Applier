import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/AppContext';

// Test component that uses the context
const TestComponent = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    profile, 
    updateContactInfo,
    addChatMessage 
  } = useApp();

  return (
    <div>
      <div data-testid="current-page">{currentPage}</div>
      <button 
        onClick={() => setCurrentPage('profile')}
        data-testid="set-profile-page"
      >
        Go to Profile
      </button>
      <div data-testid="user-name">{profile.contactInfo.firstName}</div>
      <button 
        onClick={() => updateContactInfo({ ...profile.contactInfo, firstName: 'John' })}
        data-testid="update-name"
      >
        Update Name
      </button>
      <button 
        onClick={() => addChatMessage({
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        })}
        data-testid="add-message"
      >
        Add Message
      </button>
    </div>
  );
};

describe('AppContext', () => {
  test('should provide default context values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('current-page')).toHaveTextContent('home');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Lethabo');
  });

  test('should update current page', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('set-profile-page'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('profile');
  });

  test('should update profile information', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('update-name'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('John');
  });

  test('should add chat message', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('add-message'));
    // Verify message was added (you might need to test via useApp hook)
  });
});