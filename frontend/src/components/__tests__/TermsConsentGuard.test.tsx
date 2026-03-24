import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TermsConsentGuard from '../TermsConsentGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import api from '@/lib/axios';

// Mock the API
jest.mock('@/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock components
jest.mock('../TermsConsentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onAccept, onDecline }: any) => (
    isOpen ? (
      <div data-testid="terms-modal">
        <button onClick={onAccept}>Aceitar</button>
        <button onClick={onDecline}>Recusar</button>
      </div>
    ) : null
  ),
}));

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'COLABORADOR',
  roles: ['COLABORADOR'],
  username: '12345678901',
  permissions: [],
  groups: []
};

describe('TermsConsentGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders children when no consent check needed', async () => {
    // Given - no flag set
    localStorage.removeItem('needsTermsConsent');

    // When
    render(
      <BrowserRouter>
        <AuthProvider>
          <TermsConsentGuard>
            <div data-testid="protected-content">Protected Content</div>
          </TermsConsentGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
  });

  it('shows modal when needsTermsConsent flag is set and user has not accepted', async () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    mockedApi.get.mockResolvedValue({
      data: {
        hasAccepted: false,
        isRequired: true
      }
    });

    // Mock useAuth hook
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: jest.fn()
    });

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
    });
  });

  it('does not show modal when user has already accepted', async () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    mockedApi.get.mockResolvedValue({
      data: {
        hasAccepted: true,
        isRequired: false
      }
    });

    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: jest.fn()
    });

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
    });

    // Should clear the flag
    expect(localStorage.getItem('needsTermsConsent')).toBeNull();
  });

  it('shows loading state while checking consent', () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    // Mock API to never resolve (keeps loading)
    mockedApi.get.mockImplementation(() => new Promise(() => {}));

    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: jest.fn()
    });

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    // Then
    expect(screen.getByText(/Verificando termos de uso.../i)).toBeInTheDocument();
  });

  it('handles accept action correctly', async () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    mockedApi.get.mockResolvedValue({
      data: { hasAccepted: false, isRequired: true }
    });
    
    mockedApi.post.mockResolvedValue({
      data: { success: true }
    });

    const mockLogout = jest.fn();
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: mockLogout
    });

    const user = userEvent.setup();

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /Aceitar/i });
    await user.click(acceptButton);

    // Then
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/user-terms-consent/accept',
        expect.objectContaining({
          userId: mockUser.id,
          userType: 'EMPLOYEE',
          accepted: true
        })
      );
    });

    expect(localStorage.getItem('needsTermsConsent')).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('handles decline action correctly', async () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    mockedApi.get.mockResolvedValue({
      data: { hasAccepted: false, isRequired: true }
    });
    
    mockedApi.post.mockResolvedValue({
      data: { success: true }
    });

    const mockLogout = jest.fn();
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: mockLogout
    });

    const user = userEvent.setup();

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
    });

    const declineButton = screen.getByRole('button', { name: /Recusar/i });
    await user.click(declineButton);

    // Then
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/user-terms-consent/accept',
        expect.objectContaining({
          userId: mockUser.id,
          accepted: false
        })
      );
    });

    // Should logout (after timeout)
    jest.advanceTimersByTime(2000);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('handles API error gracefully', async () => {
    // Given
    localStorage.setItem('needsTermsConsent', 'true');
    
    mockedApi.get.mockRejectedValue(new Error('API Error'));

    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: jest.fn()
    });

    // When
    render(
      <BrowserRouter>
        <TermsConsentGuard>
          <div data-testid="protected-content">Protected Content</div>
        </TermsConsentGuard>
      </BrowserRouter>
    );

    // Then - should still render children even if API fails
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});

