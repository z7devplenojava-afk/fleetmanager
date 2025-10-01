import api from '@/lib/axios';
import { Dependent, CreateDependentDTO, UpdateDependentDTO } from '@/types/dependent';

export const dependentService = {
  // Buscar todos os dependentes de um funcionário
  async getDependentsByEmployeeId(employeeId: string): Promise<Dependent[]> {
    try {
      const response = await api.get(`/api/dependents/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dependentes do funcionário:', error);
      throw new Error('Falha ao buscar dependentes do funcionário');
    }
  },

  // Buscar dependente por ID
  async getDependentById(id: string): Promise<Dependent> {
    try {
      const response = await api.get(`/api/dependents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dependente:', error);
      throw new Error('Falha ao buscar dependente');
    }
  },

  // Buscar dependentes por CPF
  async getDependentByCpf(cpf: string): Promise<Dependent[]> {
    try {
      const response = await api.get(`/api/dependents/cpf/${cpf}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dependente por CPF:', error);
      throw new Error('Falha ao buscar dependente por CPF');
    }
  },

  // Buscar dependentes por tipo de relacionamento
  async getDependentsByRelationship(relationship: string): Promise<Dependent[]> {
    try {
      const response = await api.get(`/api/dependents/relationship/${relationship}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dependentes por relacionamento:', error);
      throw new Error('Falha ao buscar dependentes por relacionamento');
    }
  },

  // Criar novo dependente
  async createDependent(dependentData: CreateDependentDTO): Promise<Dependent> {
    try {
      const response = await api.post('/dependents', dependentData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar dependente:', error);

      if (error.response?.data?.error === 'CPF_DUPLICATE') {
        throw new Error('CPF já cadastrado para outro dependente');
      } else if (error.response?.data?.error === 'VALIDATION_ERROR') {
        throw new Error(error.response.data.message || 'Dados inválidos');
      } else {
        throw new Error('Falha ao criar dependente');
      }
    }
  },

  // Atualizar dependente
  async updateDependent(id: string, dependentData: UpdateDependentDTO): Promise<Dependent> {
    try {
      const response = await api.put(`/api/dependents/${id}`, dependentData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar dependente:', error);

      if (error.response?.data?.error === 'CPF_DUPLICATE') {
        throw new Error('CPF já cadastrado para outro dependente');
      } else if (error.response?.data?.error === 'VALIDATION_ERROR') {
        throw new Error(error.response.data.message || 'Dados inválidos');
      } else {
        throw new Error('Falha ao atualizar dependente');
      }
    }
  },

  // Excluir dependente
  async deleteDependent(id: string): Promise<void> {
    try {
      await api.delete(`/api/dependents/${id}`);
    } catch (error) {
      console.error('Erro ao excluir dependente:', error);
      throw new Error('Falha ao excluir dependente');
    }
  },

  // Verificar se CPF já existe
  async checkCpfExists(cpf: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/dependents/cpf/${cpf}`);
      return response.data && response.data.length > 0;
    } catch (error) {
      return false;
    }
  }
};