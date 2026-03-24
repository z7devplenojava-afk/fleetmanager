import api from '@/lib/axios';

export interface ContactValidationRequest {
  employeeIds: string[];
  type: 'email' | 'whatsapp' | 'both';
  documentType?: 'holerite' | 'comprovante' | 'unificado';
  month?: number;
  year?: number;
}

export interface ContactValidationDetail {
  employeeId: string;
  employeeName: string;
  employeeCpf: string;
  employeeEmail?: string;
  employeePhone?: string;
  hasUser: boolean;
  userId?: string;
  userEmail?: string;
  userWhatsapp?: string;
  hasWhatsAppConsent?: boolean;
  needsWhatsAppConsent?: boolean;
  whatsappConsentDate?: string;
  canSendEmail: boolean;
  canSendWhatsApp: boolean;
  needsUserCreation: boolean;
  needsWhatsAppUpdate: boolean;
  needsEmailUpdate: boolean;
  emailError?: string;
  whatsappError?: string;
  generalError?: string;
  status: 'ready' | 'needs_action' | 'error';
  statusMessage: string;
}

export interface ContactValidationResponse {
  details: ContactValidationDetail[];
  totalEmployees: number;
  readyToSend: number;
  needingAction: number;
  withErrors: number;
  allReady: boolean;
  message: string;
}

export interface QuickUserCreateRequest {
  employeeId: string;
  email?: string;
  whatsapp?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateWhatsAppRequest {
  whatsapp: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export const contactValidationService = {
  /**
   * Registra consentimento WhatsApp para um usuário
   */
  async grantWhatsAppConsent(userId: string, whatsappNumber?: string): Promise<any> {
    const payload: any = { userId };
    if (whatsappNumber) {
      payload.whatsappNumber = whatsappNumber.replace(/\D/g, '');
    }
    const response = await api.post('/api/whatsapp-consent/grant', payload);
    return response.data;
  },

  /**
   * Valida contatos de funcionários antes do envio
   */
  async validateContacts(request: ContactValidationRequest): Promise<ContactValidationResponse> {
    const response = await api.post('/contact-validation/validate', request);
    return response.data;
  },

  /**
   * Cria usuário rapidamente para funcionário
   */
  async quickCreateUser(request: QuickUserCreateRequest): Promise<any> {
    const response = await api.post('/contact-validation/quick-create-user', request);
    return response.data;
  },

  /**
   * Atualiza WhatsApp de um usuário
   */
  async updateUserWhatsApp(userId: string, whatsapp: string): Promise<any> {
    const response = await api.patch(`/contact-validation/users/${userId}/whatsapp`, { whatsapp });
    return response.data;
  },

  /**
   * Atualiza Email de um usuário
   */
  async updateUserEmail(userId: string, email: string): Promise<any> {
    const response = await api.patch(`/contact-validation/users/${userId}/email`, { email });
    return response.data;
  },

  /**
   * Health check do serviço
   */
  async healthCheck(): Promise<any> {
    const response = await api.get('/contact-validation/health');
    return response.data;
  },
};

