import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvioHoleriteModal } from '../EnvioHoleriteModal';
import { Funcionario } from '../../../types/funcionario';

// Mock the services
jest.mock('../../../services/envioService', () => ({
  enviarHoleriteIndividual: jest.fn(),
  enviarHoleriteMassa: jest.fn(),
}));

jest.mock('../../../services/funcionarioService', () => ({
  getFuncionarios: jest.fn(),
}));

const mockFuncionario: Funcionario = {
  id: 1,
  nome: 'João Silva',
  cpf: '12345678901',
  email: 'joao@exemplo.com',
  telefone: '5511999999999',
  possuiWhatsapp: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('EnvioHoleriteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with correct title', () => {
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    expect(screen.getByText('Enviar Holerite')).toBeInTheDocument();
  });

  it('displays funcionario information', () => {
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@exemplo.com')).toBeInTheDocument();
  });

  it('shows email form when email tab is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    const emailTab = screen.getByRole('tab', { name: /email/i });
    await user.click(emailTab);

    expect(screen.getByLabelText(/assunto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument();
  });

  it('shows WhatsApp form when WhatsApp tab is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    const whatsappTab = screen.getByRole('tab', { name: /whatsapp/i });
    await user.click(whatsappTab);

    expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields before submission', async () => {
    const user = userEvent.setup();
    
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/assunto é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/mensagem é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock the service to return a promise that doesn't resolve immediately
    const { enviarHoleriteIndividual } = require('../../../services/envioService');
    enviarHoleriteIndividual.mockImplementation(() => new Promise(() => {}));

    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={mockFuncionario}
      />
    );

    // Fill required fields
    const assuntoInput = screen.getByLabelText(/assunto/i);
    const mensagemInput = screen.getByLabelText(/mensagem/i);
    
    await user.type(assuntoInput, 'Teste Assunto');
    await user.type(mensagemInput, 'Teste Mensagem');

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables WhatsApp option when funcionario does not have WhatsApp', () => {
    const funcionarioSemWhatsapp = { ...mockFuncionario, possuiWhatsapp: false };
    
    render(
      <EnvioHoleriteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        funcionario={funcionarioSemWhatsapp}
      />
    );

    const whatsappTab = screen.getByRole('tab', { name: /whatsapp/i });
    expect(whatsappTab).toHaveAttribute('aria-disabled', 'true');
  });
}); 