import api from './api';

export enum EmailContextType {
    GLOBAL = 'GLOBAL',
    COMPANY = 'COMPANY',
    DEPARTMENT = 'DEPARTMENT'
}

export interface EmailConfig {
    id?: string;
    contextType: EmailContextType;
    contextId?: string | null;
    senderName: string;
    senderEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername?: string;
    smtpPassword?: string;
    properties?: Record<string, any>;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const emailConfigService = {
    getAll: async () => {
        const response = await api.get<EmailConfig[]>('/email/configs');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<EmailConfig>(`/email/configs/${id}`);
        return response.data;
    },

    create: async (config: EmailConfig) => {
        const response = await api.post<EmailConfig>('/email/configs', config);
        return response.data;
    },

    update: async (id: string, config: EmailConfig) => {
        const response = await api.put<EmailConfig>(`/email/configs/${id}`, config);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/email/configs/${id}`);
    }
};
