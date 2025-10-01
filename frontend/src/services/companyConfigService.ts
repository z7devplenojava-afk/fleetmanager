import axios from 'axios';

const API_BASE_URL = '/company-config';

export interface CompanyConfig {
  id?: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  contractTerms?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class CompanyConfigService {
  /**
   * Busca a configuração ativa da empresa
   */
  async getActiveConfig(): Promise<CompanyConfig | null> {
    try {
      console.log('🏢 Buscando configuração ativa da empresa...');
      const response = await axios.get(`${API_BASE_URL}/active`);
      
      if (response.status === 204) {
        console.log('📝 Nenhuma configuração encontrada');
        return null;
      }
      
      console.log('✅ Configuração da empresa carregada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar configuração da empresa:', error);
      return null;
    }
  }

  /**
   * Verifica se existe configuração ativa
   */
  async hasActiveConfig(): Promise<boolean> {
    try {
      console.log('🔍 Verificando se existe configuração da empresa...');
      const response = await axios.get(`${API_BASE_URL}/exists`);
      console.log('📊 Existe configuração:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar configuração:', error);
      return false;
    }
  }

  /**
   * Salva ou atualiza configuração da empresa
   */
  async saveConfig(config: CompanyConfig): Promise<CompanyConfig> {
    try {
      console.log('💾 Salvando configuração da empresa:', config);
      const response = await axios.post(API_BASE_URL, config);
      console.log('✅ Configuração salva com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || 'Erro ao salvar configuração');
      }
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Busca configuração por ID
   */
  async getConfigById(id: string): Promise<CompanyConfig | null> {
    try {
      console.log('🔍 Buscando configuração por ID:', id);
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      console.log('✅ Configuração encontrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar configuração por ID:', error);
      return null;
    }
  }

  /**
   * Desativa uma configuração
   */
  async deactivateConfig(id: string): Promise<void> {
    try {
      console.log('🗑️ Desativando configuração:', id);
      await axios.delete(`${API_BASE_URL}/${id}`);
      console.log('✅ Configuração desativada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao desativar configuração:', error);
      throw new Error('Erro ao desativar configuração');
    }
  }

  /**
   * Upload de logo da empresa
   */
  async uploadLogo(id: string, file: File): Promise<string> {
    try {
      console.log('📤 Fazendo upload do logo:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/${id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Logo enviado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do logo:', error);
      throw new Error('Erro ao fazer upload do logo');
    }
  }
}

export const companyConfigService = new CompanyConfigService();
