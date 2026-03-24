import api from '@/lib/axios';

export interface NotificationSettings {
  id?: string;
  companyId: string;
  userId?: string | null;
  
  // Configurações de Email
  emailEnabled: boolean;
  emailContractUpdates: boolean;
  emailPaymentReceived: boolean;
  emailScheduleChanges: boolean;
  emailDailySummary: boolean;
  emailWeeklyReport: boolean;
  emailSystemAlerts: boolean;
  
  // Configurações de SMTP
  smtpEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
  
  // Configurações de Notificações Push
  pushEnabled: boolean;
  pushContractUpdates: boolean;
  pushPaymentReceived: boolean;
  pushScheduleChanges: boolean;
  pushSystemAlerts: boolean;
  
  // Configurações de SMS
  smsEnabled: boolean;
  smsUrgentOnly: boolean;
  smsProvider?: string;
  smsApiKey?: string;
  
  // Configurações de WhatsApp
  whatsappEnabled: boolean;
  whatsappContractUpdates: boolean;
  whatsappPaymentReceived: boolean;
  whatsappScheduleChanges: boolean;
  
  // Configurações de horários
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNotificationSettingsRequest {
  emailEnabled?: boolean;
  emailContractUpdates?: boolean;
  emailPaymentReceived?: boolean;
  emailScheduleChanges?: boolean;
  emailDailySummary?: boolean;
  emailWeeklyReport?: boolean;
  emailSystemAlerts?: boolean;
  smtpEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
  pushEnabled?: boolean;
  pushContractUpdates?: boolean;
  pushPaymentReceived?: boolean;
  pushScheduleChanges?: boolean;
  pushSystemAlerts?: boolean;
  smsEnabled?: boolean;
  smsUrgentOnly?: boolean;
  smsProvider?: string;
  smsApiKey?: string;
  whatsappEnabled?: boolean;
  whatsappContractUpdates?: boolean;
  whatsappPaymentReceived?: boolean;
  whatsappScheduleChanges?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export const notificationSettingsService = {
  async getCompanyNotificationSettings(companyId: string): Promise<NotificationSettings> {
    const response = await api.get(`/api/notification-settings/company/${companyId}`);
    return response.data;
  },

  async getUserNotificationSettings(companyId: string, userId: string): Promise<NotificationSettings> {
    const response = await api.get(`/api/notification-settings/company/${companyId}/user/${userId}`);
    return response.data;
  },

  async getAllNotificationSettings(): Promise<NotificationSettings[]> {
    const response = await api.get('/api/notification-settings');
    return response.data;
  },

  async createNotificationSettings(data: NotificationSettings): Promise<NotificationSettings> {
    const response = await api.post('/api/notification-settings', data);
    return response.data;
  },

  async updateCompanyNotificationSettings(companyId: string, data: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await api.put(`/api/notification-settings/company/${companyId}`, data);
    return response.data;
  },

  async updateUserNotificationSettings(companyId: string, userId: string, data: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await api.put(`/api/notification-settings/company/${companyId}/user/${userId}`, data);
    return response.data;
  },

  async deleteNotificationSettings(companyId: string): Promise<void> {
    await api.delete(`/api/notification-settings/company/${companyId}`);
  },

  async testNotificationSettings(): Promise<{ message: string; timestamp: string; status: string }> {
    const response = await api.get('/api/notification-settings/test');
    return response.data;
  }
};

export default notificationSettingsService;
