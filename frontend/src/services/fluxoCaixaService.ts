import { api } from '@/lib/axios';

export interface MovimentacaoFluxo {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  subcategoria?: string;
  conta: string;
  status: 'realizado' | 'previsto' | 'cancelado';
  recorrente: boolean;
  frequencia?: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  dataFim?: string;
  observacoes?: string;
  documento?: string;
  centroCusto?: string;
  projeto?: string;
  responsavel?: string;
  aprovado: boolean;
  dataAprovacao?: string;
  aprovadoPor?: string;
}

export interface ProjecaoFluxo {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  cenario: 'otimista' | 'realista' | 'pessimista';
  movimentacoes: MovimentacaoFluxo[];
  saldoInicial: number;
  saldoFinal: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
}

export interface CenarioFluxo {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'otimista' | 'realista' | 'pessimista' | 'personalizado';
  parametros: {
    crescimentoReceita: number;
    reducaoCustos: number;
    inflacao: number;
    taxaJuros: number;
    variabilidadeReceita: number;
    variabilidadeCustos: number;
  };
  projecoes: ProjecaoFluxo[];
  ativo: boolean;
}

export interface AnaliseFluxo {
  periodo: {
    inicio: string;
    fim: string;
  };
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  saldoMedio: number;
  maiorEntrada: MovimentacaoFluxo;
  maiorSaida: MovimentacaoFluxo;
  diasNegativos: number;
  diasPositivos: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  volatilidade: number;
  liquidez: {
    atual: number;
    projetada30dias: number;
    projetada60dias: number;
    projetada90dias: number;
  };
  indicadores: {
    cicloOperacional: number;
    giroCapital: number;
    margemLiquida: number;
    retornoInvestimento: number;
  };
}

export interface TendenciaFluxo {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo: number;
  crescimentoEntradas: number;
  crescimentoSaidas: number;
  variacao: number;
}

export interface AlertaFluxo {
  id: string;
  tipo: 'saldo_baixo' | 'vencimento_proximo' | 'meta_nao_atingida' | 'variacao_significativa';
  titulo: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  data: string;
  valor?: number;
  categoria?: string;
  ativo: boolean;
  lido: boolean;
}

export interface MetaFluxo {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'entrada' | 'saida' | 'saldo';
  valorMeta: number;
  periodo: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual';
  dataInicio: string;
  dataFim: string;
  valorAtual: number;
  percentualAtingido: number;
  status: 'nao_iniciada' | 'em_andamento' | 'atingida' | 'nao_atingida';
  ativo: boolean;
}

export interface ConfiguracaoFluxo {
  id: string;
  saldoMinimoAlerta: number;
  diasProjecao: number;
  categoriasEntrada: string[];
  categoriasSaida: string[];
  contasPadrao: string[];
  aprovacaoObrigatoria: boolean;
  valorMinimoAprovacao: number;
  notificacaoEmail: boolean;
  notificacaoWhatsapp: boolean;
  frequenciaRelatorio: 'diario' | 'semanal' | 'mensal';
  horaRelatorio: string;
}

class FluxoCaixaService {
  private baseURL = '/fluxo-caixa';

  // CRUD Movimentações
  async listarMovimentacoes(filtros?: {
    dataInicio?: string;
    dataFim?: string;
    tipo?: string;
    categoria?: string;
    conta?: string;
    status?: string;
  }): Promise<MovimentacaoFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/movimentacoes`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar movimentações:', error);
      throw error;
    }
  }

  async obterMovimentacao(id: string): Promise<MovimentacaoFluxo> {
    try {
      const response = await api.get(`${this.baseURL}/movimentacoes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter movimentação:', error);
      throw error;
    }
  }

  async criarMovimentacao(movimentacao: Omit<MovimentacaoFluxo, 'id'>): Promise<MovimentacaoFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/movimentacoes`, movimentacao);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      throw error;
    }
  }

  async atualizarMovimentacao(id: string, movimentacao: Partial<MovimentacaoFluxo>): Promise<MovimentacaoFluxo> {
    try {
      const response = await api.put(`${this.baseURL}/movimentacoes/${id}`, movimentacao);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      throw error;
    }
  }

  async excluirMovimentacao(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/movimentacoes/${id}`);
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      throw error;
    }
  }

  // Projeções
  async listarProjecoes(): Promise<ProjecaoFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/projecoes`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar projeções:', error);
      throw error;
    }
  }

  async criarProjecao(projecao: Omit<ProjecaoFluxo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ProjecaoFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/projecoes`, projecao);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar projeção:', error);
      throw error;
    }
  }

  async atualizarProjecao(id: string, projecao: Partial<ProjecaoFluxo>): Promise<ProjecaoFluxo> {
    try {
      const response = await api.put(`${this.baseURL}/projecoes/${id}`, projecao);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar projeção:', error);
      throw error;
    }
  }

  async gerarProjecaoAutomatica(parametros: {
    dataInicio: string;
    dataFim: string;
    cenario: 'otimista' | 'realista' | 'pessimista';
    incluirRecorrentes: boolean;
    incluirSazonalidade: boolean;
  }): Promise<ProjecaoFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/projecoes/automatica`, parametros);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar projeção automática:', error);
      throw error;
    }
  }

  // Cenários
  async listarCenarios(): Promise<CenarioFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/cenarios`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar cenários:', error);
      throw error;
    }
  }

  async criarCenario(cenario: Omit<CenarioFluxo, 'id'>): Promise<CenarioFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/cenarios`, cenario);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cenário:', error);
      throw error;
    }
  }

  async compararCenarios(ids: string[]): Promise<{
    cenarios: CenarioFluxo[];
    comparacao: {
      periodo: string;
      valores: { [cenarioId: string]: number };
    }[];
  }> {
    try {
      const response = await api.post(`${this.baseURL}/cenarios/comparar`, { ids });
      return response.data;
    } catch (error) {
      console.error('Erro ao comparar cenários:', error);
      throw error;
    }
  }

  // Análises e Relatórios
  async obterAnaliseFluxo(periodo: {
    dataInicio: string;
    dataFim: string;
  }): Promise<AnaliseFluxo> {
    try {
      const response = await api.get(`${this.baseURL}/analise`, { params: periodo });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter análise de fluxo:', error);
      throw error;
    }
  }

  async obterTendencias(meses: number = 12): Promise<TendenciaFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/tendencias`, { params: { meses } });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tendências:', error);
      throw error;
    }
  }

  async obterSaldoDiario(periodo: {
    dataInicio: string;
    dataFim: string;
  }): Promise<{ data: string; saldo: number; entradas: number; saidas: number }[]> {
    try {
      const response = await api.get(`${this.baseURL}/saldo-diario`, { params: periodo });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter saldo diário:', error);
      throw error;
    }
  }

  async obterResumoMensal(ano: number): Promise<{
    mes: string;
    entradas: number;
    saidas: number;
    saldo: number;
    crescimento: number;
  }[]> {
    try {
      const response = await api.get(`${this.baseURL}/resumo-mensal`, { params: { ano } });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter resumo mensal:', error);
      throw error;
    }
  }

  // Alertas e Notificações
  async listarAlertas(): Promise<AlertaFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/alertas`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar alertas:', error);
      throw error;
    }
  }

  async marcarAlertaComoLido(id: string): Promise<void> {
    try {
      await api.put(`${this.baseURL}/alertas/${id}/lido`);
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw error;
    }
  }

  async verificarAlertas(): Promise<AlertaFluxo[]> {
    try {
      const response = await api.post(`${this.baseURL}/alertas/verificar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
      throw error;
    }
  }

  // Metas
  async listarMetas(): Promise<MetaFluxo[]> {
    try {
      const response = await api.get(`${this.baseURL}/metas`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar metas:', error);
      throw error;
    }
  }

  async criarMeta(meta: Omit<MetaFluxo, 'id' | 'valorAtual' | 'percentualAtingido' | 'status'>): Promise<MetaFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/metas`, meta);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  }

  async atualizarMeta(id: string, meta: Partial<MetaFluxo>): Promise<MetaFluxo> {
    try {
      const response = await api.put(`${this.baseURL}/metas/${id}`, meta);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }

  // Configurações
  async obterConfiguracao(): Promise<ConfiguracaoFluxo> {
    try {
      const response = await api.get(`${this.baseURL}/configuracao`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configuração:', error);
      throw error;
    }
  }

  async atualizarConfiguracao(config: Partial<ConfiguracaoFluxo>): Promise<ConfiguracaoFluxo> {
    try {
      const response = await api.put(`${this.baseURL}/configuracao`, config);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  // Aprovações
  async aprovarMovimentacao(id: string, observacoes?: string): Promise<MovimentacaoFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/movimentacoes/${id}/aprovar`, { observacoes });
      return response.data;
    } catch (error) {
      console.error('Erro ao aprovar movimentação:', error);
      throw error;
    }
  }

  async rejeitarMovimentacao(id: string, motivo: string): Promise<MovimentacaoFluxo> {
    try {
      const response = await api.post(`${this.baseURL}/movimentacoes/${id}/rejeitar`, { motivo });
      return response.data;
    } catch (error) {
      console.error('Erro ao rejeitar movimentação:', error);
      throw error;
    }
  }

  // Exportação
  async exportarRelatorio(formato: 'pdf' | 'excel', tipo: 'movimentacoes' | 'analise' | 'projecao', filtros?: any): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseURL}/exportar`, {
        params: { formato, tipo, ...filtros },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      throw error;
    }
  }

  // Integração
  async sincronizarComBanco(): Promise<{ importadas: number; erros: number }> {
    try {
      const response = await api.post(`${this.baseURL}/sincronizar-banco`);
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar com banco:', error);
      throw error;
    }
  }

  async importarOFX(arquivo: File): Promise<{ importadas: number; erros: number; detalhes: any[] }> {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      const response = await api.post(`${this.baseURL}/importar-ofx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao importar OFX:', error);
      throw error;
    }
  }
}

export const fluxoCaixaService = new FluxoCaixaService();
export default fluxoCaixaService;