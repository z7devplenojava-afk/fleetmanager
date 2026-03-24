import api from '@/lib/axios';
import { CompanyBranding } from '@/types/company';

/**
 * Serviço para buscar informações de branding de empresas
 */
export const companyBrandingService = {
    /**
     * Buscar empresas acessíveis para um usuário (usado no login)
     */
    async getAccessibleCompanies(username?: string): Promise<CompanyBranding[]> {
        try {
            const params = username ? { username } : {};
            const response = await api.get<CompanyBranding[]>('/api/companies/accessible', { params });
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar empresas acessíveis:', error);
            return [];
        }
    },

    /**
     * Buscar informações de branding de uma empresa específica
     */
    async getCompanyBranding(companyId: string): Promise<CompanyBranding | null> {
        try {
            const response = await api.get<CompanyBranding>(`/api/companies/${companyId}/branding`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar branding da empresa ${companyId}:`, error);
            return null;
        }
    },
};
