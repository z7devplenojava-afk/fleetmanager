import api from '@/lib/axios';

export interface PassengerRegistrationPayload {
  name: string;
  cpf: string;
  email: string;
  whatsapp: string;
  username: string;
  password: string;
  confirmPassword: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isPcd: boolean;
  disabilityType?: string;
  disabilityDescription?: string;
  lgpdAccepted: boolean;
}

export interface PassengerRegistrationResponse {
  message: string;
  token?: string;
  refreshToken?: string;
  user?: any;
}

export const passengerRegistrationService = {
  register: async (data: PassengerRegistrationPayload): Promise<PassengerRegistrationResponse> => {
    const response = await api.post('/auth/register-passenger', data);
    return response.data;
  },

  fetchCep: async (cep: string): Promise<{
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
  } | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.erro) return null;
      return data;
    } catch {
      return null;
    }
  }
};
