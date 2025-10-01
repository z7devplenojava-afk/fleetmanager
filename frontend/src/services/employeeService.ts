import api from '@/lib/axios';
import { Employee } from '@/types/employee';

export interface EmployeeFilters {
  status?: string;
  unitId?: string;
  positionId?: string;
  searchTerm?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface SimpleEmployee {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  registrationNumber: string;
  positionName?: string;
  unitName?: string;
}

export const employeeService = {
  // Buscar todos os funcionários com filtros
  async getEmployees(filters: EmployeeFilters = {}): Promise<Employee[]> {
    try {
      // Se há filtro de status específico, usar endpoint dedicado
      if (filters.status && filters.status !== 'all') {
        return await this.getEmployeesByStatus(filters.status);
      }

      // Se há filtro de unidade, usar endpoint dedicado
      if (filters.unitId) {
        return await this.getEmployeesByUnit(filters.unitId);
      }

      // Se há filtro de posição, usar endpoint dedicado
      if (filters.positionId) {
        return await this.getEmployeesByPosition(filters.positionId);
      }

      // Se há termo de busca, usar endpoint de busca (se existir) ou filtrar localmente
      if (filters.searchTerm) {
        // Por enquanto, buscar todos e filtrar localmente
        const allEmployees = await this.getAllEmployees();
        return allEmployees.filter(emp =>
          emp.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
          (emp.email && emp.email.toLowerCase().includes(filters.searchTerm!.toLowerCase())) ||
          (emp.cpf && emp.cpf.includes(filters.searchTerm!)) ||
          (emp.registrationNumber && emp.registrationNumber.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
        );
      }

      // Caso padrão: buscar todos os funcionários
      return await this.getAllEmployees();
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      throw new Error('Falha ao buscar funcionários');
    }
  },

  // Buscar todos os funcionários (sem filtros)
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get('/api/employees');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todos os funcionários:', error);
      throw new Error('Falha ao buscar funcionários');
    }
  },

  // Buscar funcionários por status
  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/employees/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários por status:', error);
      throw new Error('Falha ao buscar funcionários por status');
    }
  },

  // Buscar funcionários por unidade
  async getEmployeesByUnit(unitId: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/hr/employees/by-unit/${unitId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários por unidade:', error);
      throw new Error('Falha ao buscar funcionários por unidade');
    }
  },

  // Buscar funcionários por posição
  async getEmployeesByPosition(positionId: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/hr/employees/by-position/${positionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários por posição:', error);
      throw new Error('Falha ao buscar funcionários por posição');
    }
  },

  // Buscar funcionário por ID
  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await api.get(`/api/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionário por ID:', error);
      throw new Error('Falha ao buscar funcionário');
    }
  },

  // Criar novo funcionário
  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    try {
      const response = await api.post('/api/employees', employee);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw new Error('Falha ao criar funcionário');
    }
  },

  // Atualizar funcionário
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    try {
      const response = await api.put(`/api/employees/${id}`, employee);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw new Error('Falha ao atualizar funcionário');
    }
  },

  // Excluir funcionário
  async deleteEmployee(id: string): Promise<void> {
    try {
      await api.delete(`/api/employees/${id}`);
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw new Error('Falha ao excluir funcionário');
    }
  },

  // Verificar se email já existe
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      await api.get(`/api/employees/email/${email}`);
      return true; // Se não lançar erro, o email existe
    } catch (error) {
      return false;
    }
  },

  // Buscar funcionários com filtros avançados
  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/employees/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      throw new Error('Falha ao buscar funcionários');
    }
  },

  // Buscar funcionários simplificados para seleção em formulários
  async searchSimpleEmployees(query: string): Promise<SimpleEmployee[]> {
    try {
      const response = await api.get(`/api/employees/search/simple?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários simplificados:', error);
      throw new Error('Falha ao buscar funcionários');
    }
  },

  // Buscar funcionários ativos
  async getActiveEmployees(): Promise<Employee[]> {
    return this.getEmployeesByStatus('ACTIVE');
  }
}; 