import api from '@/lib/axios';
import { Funcionario, EnvioRequest, EnvioResponse, FuncionarioFilters, Periodo } from '@/types/funcionario';

export const funcionarioService = {
  // Buscar todos os funcionários
  async getFuncionarios(filters?: FuncionarioFilters): Promise<Funcionario[]> {
    const params = new URLSearchParams();
    
    if (filters?.nome) params.append('nome', filters.nome);
    if (filters?.cpf) params.append('cpf', filters.cpf);
    if (filters?.mesReferencia) params.append('mesReferencia', filters.mesReferencia);
    if (filters?.anoReferencia) params.append('anoReferencia', filters.anoReferencia);
    
    const response = await api.get(`/api/employees${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  // Buscar funcionário por ID
  async getFuncionario(id: number): Promise<Funcionario> {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  // Buscar funcionário por CPF
  async getFuncionarioByCpf(cpf: string): Promise<Funcionario> {
    const response = await api.get(`/api/employees/cpf/${cpf}`);
    return response.data;
  },

  // Buscar funcionários por nome ou CPF
  async buscarFuncionarios(nome?: string, cpf?: string): Promise<Funcionario[]> {
    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (cpf) params.append('cpf', cpf);
    
    const response = await api.get(`/api/employees/buscar?${params.toString()}`);
    return response.data;
  },

  // Buscar funcionários por período
  async getFuncionariosPorPeriodo(mes: string, ano: string): Promise<Funcionario[]> {
    const response = await api.get(`/api/employees/periodo/${mes}/${ano}`);
    return response.data;
  },

  // Buscar funcionários com email
  async getFuncionariosComEmail(): Promise<Funcionario[]> {
    const response = await api.get('/employees/email');
    return response.data;
  },

  // Buscar funcionários com WhatsApp
  async getFuncionariosComWhatsapp(): Promise<Funcionario[]> {
    const response = await api.get('/employees/whatsapp');
    return response.data;
  },

  // Criar funcionário
  async createFuncionario(funcionario: Omit<Funcionario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Funcionario> {
    const response = await api.post('/employees', funcionario);
    return response.data;
  },

  // Atualizar funcionário
  async updateFuncionario(id: number, funcionario: Partial<Funcionario>): Promise<Funcionario> {
    const response = await api.put(`/api/employees/${id}`, funcionario);
    return response.data;
  },

  // Deletar funcionário
  async deleteFuncionario(id: number): Promise<void> {
    await api.delete(`/api/employees/${id}`);
  },

  // Buscar períodos disponíveis
  async getPeriodos(): Promise<Periodo[]> {
    const response = await api.get('/employees/periodos');
    return response.data.map((item: any) => ({
      mesReferencia: item[0],
      anoReferencia: item[1]
    }));
  }
};

export const envioService = {
  // Envio individual
  async enviarIndividual(request: EnvioRequest): Promise<EnvioResponse> {
    const response = await api.post('/api/envio/individual', request);
    return response.data;
  },

  // Envio em massa
  async enviarEmMassa(request: EnvioRequest): Promise<EnvioResponse> {
    const response = await api.post('/api/envio/massa', request);
    return response.data;
  },

  // Envio para todos
  async enviarTodos(request: EnvioRequest): Promise<EnvioResponse> {
    const response = await api.post('/api/envio/todos', request);
    return response.data;
  }
}; 