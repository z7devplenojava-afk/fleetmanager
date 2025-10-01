import axios from 'axios';
import { 
  PostoOperacional, 
  FuncionarioOperacional, 
  EscalaOperacional, 
  FeriasOperacional, 
  TarefaOperacional, 
  CoberturaOperacional, 
  RelatorioOperacional,
  CreatePostoOperacionalDTO,
  CreateEscalaOperacionalDTO,
  CreateFeriasOperacionalDTO,
  CreateTarefaOperacionalDTO,
  CreateCoberturaOperacionalDTO
} from '@/types/operacional';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class OperacionalService {
  // ========== POSTOS OPERACIONAIS ==========
  async getPostos(): Promise<PostoOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/postos`);
    return response.data;
  }

  async getPostoById(id: string): Promise<PostoOperacional> {
    const response = await axios.get(`${API_BASE_URL}/operacional/postos/${id}`);
    return response.data;
  }

  async createPosto(posto: CreatePostoOperacionalDTO): Promise<PostoOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/postos`, posto);
    return response.data;
  }

  async updatePosto(id: string, posto: Partial<CreatePostoOperacionalDTO>): Promise<PostoOperacional> {
    const response = await axios.put(`${API_BASE_URL}/operacional/postos/${id}`, posto);
    return response.data;
  }

  async deletePosto(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/operacional/postos/${id}`);
  }

  // ========== FUNCIONÁRIOS OPERACIONAIS ==========
  async getFuncionarios(): Promise<FuncionarioOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/funcionarios`);
    return response.data;
  }

  async getFuncionarioById(id: string): Promise<FuncionarioOperacional> {
    const response = await axios.get(`${API_BASE_URL}/operacional/funcionarios/${id}`);
    return response.data;
  }

  async getFuncionariosDisponiveis(dataInicio: string, dataFim: string): Promise<FuncionarioOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/funcionarios/disponiveis`, {
      params: { dataInicio, dataFim }
    });
    return response.data;
  }

  // ========== ESCALAS OPERACIONAIS ==========
  async getEscalas(): Promise<EscalaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/escalas`);
    return response.data;
  }

  async getEscalasByPosto(postoId: string): Promise<EscalaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/escalas/posto/${postoId}`);
    return response.data;
  }

  async getEscalasByFuncionario(funcionarioId: string): Promise<EscalaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/escalas/funcionario/${funcionarioId}`);
    return response.data;
  }

  async createEscala(escala: CreateEscalaOperacionalDTO): Promise<EscalaOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/escalas`, escala);
    return response.data;
  }

  async updateEscala(id: string, escala: Partial<CreateEscalaOperacionalDTO>): Promise<EscalaOperacional> {
    const response = await axios.put(`${API_BASE_URL}/operacional/escalas/${id}`, escala);
    return response.data;
  }

  async deleteEscala(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/operacional/escalas/${id}`);
  }

  // ========== FÉRIAS OPERACIONAIS ==========
  async getFerias(): Promise<FeriasOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/ferias`);
    return response.data;
  }

  async getFeriasAtivas(): Promise<FeriasOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/ferias/ativas`);
    return response.data;
  }

  async createFerias(ferias: CreateFeriasOperacionalDTO): Promise<FeriasOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/ferias`, ferias);
    return response.data;
  }

  async updateFerias(id: string, ferias: Partial<CreateFeriasOperacionalDTO>): Promise<FeriasOperacional> {
    const response = await axios.put(`${API_BASE_URL}/operacional/ferias/${id}`, ferias);
    return response.data;
  }

  async cancelarFerias(id: string): Promise<void> {
    await axios.patch(`${API_BASE_URL}/operacional/ferias/${id}/cancelar`);
  }

  // ========== TAREFAS OPERACIONAIS ==========
  async getTarefas(): Promise<TarefaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/tarefas`);
    return response.data;
  }

  async getTarefasByStatus(status: string): Promise<TarefaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/tarefas/status/${status}`);
    return response.data;
  }

  async getTarefasByPosto(postoId: string): Promise<TarefaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/tarefas/posto/${postoId}`);
    return response.data;
  }

  async createTarefa(tarefa: CreateTarefaOperacionalDTO): Promise<TarefaOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/tarefas`, tarefa);
    return response.data;
  }

  async updateTarefa(id: string, tarefa: Partial<CreateTarefaOperacionalDTO>): Promise<TarefaOperacional> {
    const response = await axios.put(`${API_BASE_URL}/operacional/tarefas/${id}`, tarefa);
    return response.data;
  }

  async concluirTarefa(id: string, observacoes?: string): Promise<void> {
    await axios.patch(`${API_BASE_URL}/operacional/tarefas/${id}/concluir`, { observacoes });
  }

  async deleteTarefa(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/operacional/tarefas/${id}`);
  }

  // ========== COBERTURAS OPERACIONAIS ==========
  async getCoberturas(): Promise<CoberturaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/coberturas`);
    return response.data;
  }

  async getCoberturasAtivas(): Promise<CoberturaOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/coberturas/ativas`);
    return response.data;
  }

  async createCobertura(cobertura: CreateCoberturaOperacionalDTO): Promise<CoberturaOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/coberturas`, cobertura);
    return response.data;
  }

  async updateCobertura(id: string, cobertura: Partial<CreateCoberturaOperacionalDTO>): Promise<CoberturaOperacional> {
    const response = await axios.put(`${API_BASE_URL}/operacional/coberturas/${id}`, cobertura);
    return response.data;
  }

  async finalizarCobertura(id: string): Promise<void> {
    await axios.patch(`${API_BASE_URL}/operacional/coberturas/${id}/finalizar`);
  }

  // ========== RELATÓRIOS OPERACIONAIS ==========
  async getRelatorios(): Promise<RelatorioOperacional[]> {
    const response = await axios.get(`${API_BASE_URL}/operacional/relatorios`);
    return response.data;
  }

  async gerarRelatorio(tipo: string, periodo: string): Promise<RelatorioOperacional> {
    const response = await axios.post(`${API_BASE_URL}/operacional/relatorios/gerar`, { tipo, periodo });
    return response.data;
  }

  async getDashboardData(): Promise<{
    totalPostos: number;
    postosAtivos: number;
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosFerias: number;
    funcionariosFolga: number;
    coberturasAtivas: number;
    tarefasPendentes: number;
    tarefasConcluidas: number;
    escalasAtivas: number;
  }> {
    const response = await axios.get(`${API_BASE_URL}/operacional/dashboard`);
    return response.data;
  }

  // ========== ESTATÍSTICAS ==========
  async getEstatisticas(): Promise<{
    postosPorTipo: Record<string, number>;
    funcionariosPorStatus: Record<string, number>;
    tarefasPorStatus: Record<string, number>;
    escalasPorTipo: Record<string, number>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/operacional/estatisticas`);
    return response.data;
  }
}

export const operacionalService = new OperacionalService();
export default operacionalService;