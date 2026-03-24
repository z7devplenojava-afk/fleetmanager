import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsConsentModal from '../TermsConsentModal';

describe('TermsConsentModal', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userName="José Silva"
      />
    );

    expect(screen.getByText(/Termos de Uso e Política de Privacidade/i)).toBeInTheDocument();
    expect(screen.getByText(/José Silva/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TermsConsentModal
        isOpen={false}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.queryByText(/Termos de Uso e Política de Privacidade/i)).not.toBeInTheDocument();
  });

  it('displays terms of use content', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText(/Termos de Uso do Sistema SecuredGuard/i)).toBeInTheDocument();
    expect(screen.getByText(/Aceitação dos Termos/i)).toBeInTheDocument();
    expect(screen.getByText(/Uso do Sistema/i)).toBeInTheDocument();
  });

  it('displays privacy policy (LGPD) content', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText(/Política de Privacidade \(LGPD\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Coleta de Dados/i)).toBeInTheDocument();
    expect(screen.getByText(/Seus Direitos \(LGPD\)/i)).toBeInTheDocument();
  });

  it('shows both radio button options', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByLabelText(/Li e ACEITO os Termos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/NÃO ACEITO os termos/i)).toBeInTheDocument();
  });

  it('shows error when trying to submit without selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Selecione uma opção/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecione uma opção/i)).toBeInTheDocument();
    });

    expect(mockOnAccept).not.toHaveBeenCalled();
    expect(mockOnDecline).not.toHaveBeenCalled();
  });

  it('calls onAccept when accept option is selected and submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Select accept option
    const acceptRadio = screen.getByLabelText(/Li e ACEITO os Termos/i);
    await user.click(acceptRadio);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Aceitar e Continuar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledTimes(1);
      expect(mockOnDecline).not.toHaveBeenCalled();
    });
  });

  it('calls onDecline when decline option is selected and submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Select decline option
    const declineRadio = screen.getByLabelText(/NÃO ACEITO os termos/i);
    await user.click(declineRadio);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Não Aceitar e Sair/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnDecline).toHaveBeenCalledTimes(1);
      expect(mockOnAccept).not.toHaveBeenCalled();
    });
  });

  it('changes button text and color based on selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Initially
    let submitButton = screen.getByRole('button', { name: /Selecione uma opção/i });
    expect(submitButton).toBeDisabled();

    // Select accept
    const acceptRadio = screen.getByLabelText(/Li e ACEITO os Termos/i);
    await user.click(acceptRadio);

    submitButton = screen.getByRole('button', { name: /Aceitar e Continuar/i });
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveClass(/bg-green-600/);

    // Select decline
    const declineRadio = screen.getByLabelText(/NÃO ACEITO os termos/i);
    await user.click(declineRadio);

    submitButton = screen.getByRole('button', { name: /Não Aceitar e Sair/i });
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveClass(/bg-red-600/);
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        loading={true}
      />
    );

    expect(screen.getByText(/Processando.../i)).toBeInTheDocument();
  });

  it('disables button when loading', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        loading={true}
      />
    );

    // Select accept
    const acceptRadio = screen.getByLabelText(/Li e ACEITO os Termos/i);
    await user.click(acceptRadio);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('shows information about consent registration', () => {
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText(/Este consentimento é registrado/i)).toBeInTheDocument();
    expect(screen.getByText(/IP, data\/hora e versão/i)).toBeInTheDocument();
  });

  it('clears error when selection changes', async () => {
    const user = userEvent.setup();
    
    render(
      <TermsConsentModal
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Try to submit without selection
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    // Error should appear
    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecione uma opção/i)).toBeInTheDocument();
    });

    // Select an option
    const acceptRadio = screen.getByLabelText(/Li e ACEITO os Termos/i);
    await user.click(acceptRadio);

    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Por favor, selecione uma opção/i)).not.toBeInTheDocument();
    });
  });
}); 

