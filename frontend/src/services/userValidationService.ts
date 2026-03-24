import api from '@/lib/axios';

export interface UserValidationResult {
  valid: boolean;
  exists: boolean;
  userId?: string;
  cpf?: string;
  name?: string;
  username?: string;
  hasEmail?: boolean;
  email?: string;
  hasWhatsApp?: boolean;
  whatsapp?: string;
  whatsappConsent?: boolean;
  canSendEmail?: boolean;
  canSendWhatsApp?: boolean;
  needsEmail?: boolean;
  needsWhatsApp?: boolean;
  needsWhatsAppConsent?: boolean;
  isReady?: boolean;
  message?: string;
}

export const userValidationService = {
  async validateByCpf(cpf: string): Promise<UserValidationResult | null> {
    if (!cpf) return null;
    const normalized = cpf.replace(/\D/g, '');
    const response = await api.get(`/api/user-validation/validate-by-cpf/${normalized}`);
    return response.data;
  },
};

export default userValidationService;

