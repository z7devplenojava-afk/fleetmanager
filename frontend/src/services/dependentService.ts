import axios from 'axios';
import { Dependent, DependentCreateRequest, DependentUpdateRequest, DependentFilters } from '@/types/dependent';
import { getApiUrl } from '@/config/environment';

const API_BASE_URL = getApiUrl();

const dependentService = {
  // Buscar todos os dependentes
  async getAllDependents(): Promise<Dependent[]> {
    const response = await axios.get(`${API_BASE_URL}/dependents`);
    return response.data;
  },

  // Buscar dependente por ID
  async getDependentById(id: string): Promise<Dependent> {
    const response = await axios.get(`${API_BASE_URL}/dependents/${id}`);
    return response.data;
  },

  // Buscar dependentes por funcionário
  async getDependentsByEmployee(employeeId: string): Promise<Dependent[]> {
    const response = await axios.get(`${API_BASE_URL}/dependents/employee/${employeeId}`);
    return response.data;
  },

  // Buscar dependentes por CPF
  async getDependentsByCpf(cpf: string): Promise<Dependent[]> {
    const response = await axios.get(`${API_BASE_URL}/dependents/cpf/${cpf}`);
    return response.data;
  },

  // Buscar dependentes por relacionamento
  async getDependentsByRelationship(relationship: string): Promise<Dependent[]> {
    const response = await axios.get(`${API_BASE_URL}/dependents/relationship/${relationship}`);
    return response.data;
  },

  // Criar novo dependente
  async createDependent(dependent: DependentCreateRequest): Promise<Dependent> {
    const response = await axios.post(`${API_BASE_URL}/dependents`, dependent);
    return response.data;
  },

  // Atualizar dependente
  async updateDependent(id: string, dependent: DependentUpdateRequest): Promise<Dependent> {
    const response = await axios.put(`${API_BASE_URL}/dependents/${id}`, dependent);
    return response.data;
  },

  // Excluir dependente
  async deleteDependent(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/dependents/${id}`);
  },

  // Buscar dependentes com filtros
  async getDependentsWithFilters(filters: DependentFilters): Promise<Dependent[]> {
    let dependents: Dependent[] = [];
    
    if (filters.employeeId) {
      dependents = await this.getDependentsByEmployee(filters.employeeId);
    } else {
      dependents = await this.getAllDependents();
    }

    // Aplicar filtros adicionais
    return dependents.filter(dependent => {
      if (filters.relationship && dependent.relationship !== filters.relationship) {
        return false;
      }
      if (filters.isStudent !== undefined && dependent.isStudent !== filters.isStudent) {
        return false;
      }
      if (filters.isBeneficiary !== undefined && dependent.isBeneficiary !== filters.isBeneficiary) {
        return false;
      }
      return true;
    });
  }
};

export default dependentService;