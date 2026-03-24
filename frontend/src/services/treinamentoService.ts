import api from '@/lib/axios';

export interface Treinamento {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'OBRIGATORIO' | 'OPCIONAL' | 'RECICLAGEM';
  categoria: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
  dataInicio: string;
  dataLimite: string;
  dataConclusao?: string;
  cargaHoraria: number;
  progresso?: number;
  linkMaterial?: string;
  instrutorNome?: string;
  localTreinamento?: string;
  certificadoUrl?: string;
  observacoes?: string;
  employeeId?: string;
  employeeName?: string;
  employeeCpf?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const treinamentoService = {
  /**
   * Busca todos os treinamentos do vigilante logado
   * Backend já filtra por CPF para ROLE_VIGILANTE
   */
  async getAllTreinamentos(): Promise<Treinamento[]> {
    try {
      const response = await api.get('/treinamentos');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar treinamentos:', error);
      return [];
    }
  },

  /**
   * Busca treinamentos pendentes do vigilante
   */
  async getTreinamentosPendentes(): Promise<Treinamento[]> {
    try {
      const response = await api.get('/treinamentos/pendentes');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar treinamentos pendentes:', error);
      // Retornar dados mock se o endpoint não existir
      return this.getMockTreinamentos();
    }
  },

  /**
   * Busca treinamentos concluídos do vigilante
   */
  async getTreinamentosConcluidos(): Promise<Treinamento[]> {
    try {
      const response = await api.get('/treinamentos/concluidos');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar treinamentos concluídos:', error);
      return [];
    }
  },

  /**
   * Busca treinamento por ID
   */
  async getTreinamentoById(id: string): Promise<Treinamento | null> {
    try {
      const response = await api.get(`/treinamentos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar treinamento por ID:', error);
      return null;
    }
  },

  /**
   * Marca treinamento como concluído
   */
  async marcarComoConcluido(treinamentoId: string): Promise<void> {
    try {
      await api.post(`/treinamentos/${treinamentoId}/concluir`);
    } catch (error) {
      console.error('Erro ao marcar treinamento como concluído:', error);
      throw error;
    }
  },

  /**
   * Atualiza o progresso de um treinamento
   */
  async atualizarProgresso(treinamentoId: string, progresso: number): Promise<void> {
    try {
      await api.put(`/treinamentos/${treinamentoId}/progresso`, { progresso });
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  },

  /**
   * Baixa certificado de treinamento
   */
  async baixarCertificado(treinamentoId: string): Promise<void> {
    try {
      const response = await api.get(`/treinamentos/${treinamentoId}/certificado`, {
        responseType: 'blob'
      });

      // Criar link temporário para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificado_${treinamentoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas de treinamentos
   */
  async getEstatisticas(): Promise<{
    total: number;
    pendentes: number;
    concluidos: number;
    atrasados: number;
    emAndamento: number;
  }> {
    try {
      const response = await api.get('/treinamentos/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        pendentes: 0,
        concluidos: 0,
        atrasados: 0,
        emAndamento: 0
      };
    }
  },

  /**
   * Dados mock para desenvolvimento/teste
   */
  getMockTreinamentos(): Treinamento[] {
    const hoje = new Date();
    const em7Dias = new Date(hoje);
    em7Dias.setDate(hoje.getDate() + 7);
    const em15Dias = new Date(hoje);
    em15Dias.setDate(hoje.getDate() + 15);
    const atrasado = new Date(hoje);
    atrasado.setDate(hoje.getDate() - 5);

    return [
      {
        id: '1',
        titulo: 'Reciclagem de Tiro',
        descricao: 'Treinamento obrigatório de reciclagem para manuseio de arma de fogo',
        tipo: 'OBRIGATORIO',
        categoria: 'ARMAMENTO',
        prioridade: 'ALTA',
        status: 'PENDENTE',
        dataInicio: hoje.toISOString(),
        dataLimite: em7Dias.toISOString(),
        cargaHoraria: 8,
        progresso: 0,
        linkMaterial: 'https://exemplo.com/material-tiro',
        instrutorNome: 'Sgt. Silva',
        localTreinamento: 'Estande de Tiro Central'
      },
      {
        id: '2',
        titulo: 'Atualização - Normas de Segurança',
        descricao: 'Treinamento sobre novas normas de segurança patrimonial e procedimentos atualizados',
        tipo: 'OBRIGATORIO',
        categoria: 'SEGURANCA',
        prioridade: 'ALTA',
        status: 'ATRASADO',
        dataInicio: atrasado.toISOString(),
        dataLimite: atrasado.toISOString(),
        cargaHoraria: 4,
        progresso: 0,
        linkMaterial: 'https://exemplo.com/normas-seguranca',
        instrutorNome: 'João Costa'
      },
      {
        id: '3',
        titulo: 'Primeiros Socorros Básico',
        descricao: 'Curso básico de primeiros socorros e atendimento de emergência',
        tipo: 'OBRIGATORIO',
        categoria: 'SAUDE',
        prioridade: 'MEDIA',
        status: 'EM_ANDAMENTO',
        dataInicio: hoje.toISOString(),
        dataLimite: em15Dias.toISOString(),
        cargaHoraria: 12,
        progresso: 45,
        linkMaterial: 'https://exemplo.com/primeiros-socorros',
        instrutorNome: 'Dra. Maria Santos',
        localTreinamento: 'Sala de Treinamento A'
      },
      {
        id: '4',
        titulo: 'Operação de CFTV',
        descricao: 'Treinamento para operação e monitoramento de circuito fechado de TV',
        tipo: 'OPCIONAL',
        categoria: 'TECNOLOGIA',
        prioridade: 'BAIXA',
        status: 'PENDENTE',
        dataInicio: hoje.toISOString(),
        dataLimite: em15Dias.toISOString(),
        cargaHoraria: 6,
        progresso: 0,
        linkMaterial: 'https://exemplo.com/cftv',
        instrutorNome: 'Téc. Pedro Lima'
      }
    ];
  }
};

export default treinamentoService;

