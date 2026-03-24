import api from '@/lib/axios';

export interface SecuritySettings {
  id?: string;
  companyId: string;
  
  // Configurações de 2FA
  twoFactorEnabled: boolean;
  twoFactorMethod?: string; // EMAIL, SMS, APP
  
  // Políticas de senha
  passwordExpiryEnabled: boolean;
  passwordExpiryDays: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  
  // Bloqueio de conta
  accountLockoutEnabled: boolean;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  
  // Configurações gerais
  sessionTimeoutMinutes: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist?: string[];
  auditLogEnabled: boolean;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSecuritySettingsRequest {
  companyId: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: string;
  passwordExpiryEnabled: boolean;
  passwordExpiryDays: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  accountLockoutEnabled: boolean;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist?: string[];
  auditLogEnabled: boolean;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  passwordExpiryEnabled?: boolean;
  passwordExpiryDays?: number;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
  accountLockoutEnabled?: boolean;
  maxFailedAttempts?: number;
  lockoutDurationMinutes?: number;
  sessionTimeoutMinutes?: number;
  ipWhitelistEnabled?: boolean;
  ipWhitelist?: string[];
  auditLogEnabled?: boolean;
}

export const securitySettingsService = {
  async getSecuritySettings(companyId: string): Promise<SecuritySettings> {
    const response = await api.get(`/api/security-settings/company/${companyId}`);
    return response.data;
  },

  async getAllSecuritySettings(): Promise<SecuritySettings[]> {
    const response = await api.get('/api/security-settings');
    return response.data;
  },

  async createSecuritySettings(data: CreateSecuritySettingsRequest): Promise<SecuritySettings> {
    const response = await api.post('/api/security-settings', data);
    return response.data;
  },

  async updateSecuritySettings(companyId: string, data: UpdateSecuritySettingsRequest): Promise<SecuritySettings> {
    const response = await api.put(`/api/security-settings/company/${companyId}`, data);
    return response.data;
  },

  async deleteSecuritySettings(companyId: string): Promise<void> {
    await api.delete(`/api/security-settings/company/${companyId}`);
  },

  async testSecuritySettings(): Promise<{ message: string; timestamp: string; status: string }> {
    const response = await api.get('/api/security-settings/test');
    return response.data;
  }
};

export default securitySettingsService;
