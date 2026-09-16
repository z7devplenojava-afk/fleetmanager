import api from './api';

export interface VehicleFineQueryRequest {
  placa: string;
  renavam?: string;
  uf?: string;
  forceRefresh?: boolean;
}

export interface MotoristaApurado {
  driver_id?: string;
  driver_name: string;
  driver_cnh?: string;
  driver_phone?: string;
  parte_diaria_id?: string;
  parte_diaria_number?: string;
  obra_nome?: string;
  rota_nome?: string;
  horario_inicio?: string;
  horario_fim?: string;
  confianca_cruzamento?: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface InfracaoDetalhada {
  fineId?: string;
  auto_infracao: string;
  codigo_infracao?: string;
  orgao_autuador?: string;
  descricao: string;
  data_hora?: string;
  local?: string;
  valor: number;
  data_vencimento?: string;
  situacao?: string;
  pontos?: number;
  ja_cadastrada_no_sistema?: boolean;
  motorista_apurado?: MotoristaApurado;
}

export interface RestricaoVeicular {
  tipo: string;
  descricao: string;
  orgao?: string;
  dataInclusao?: string;
  status?: string;
}

export interface DadosVeiculo {
  vehicleId?: string;
  placa: string;
  renavam?: string;
  chassi?: string;
  marca_modelo?: string;
  ano_fabricacao?: number;
  ano_modelo?: number;
  cor?: string;
  combustivel?: string;
  uf?: string;
  municipio?: string;
  situacao_veiculo?: string;
}

export interface ResumoDebitos {
  quantidade_multas: number;
  valor_total: number;
  quantidade_autuacoes: number;
  tem_restricoes: boolean;
}

export interface VehicleFineQueryResponse {
  status: string;
  message: string;
  dados_veiculo: DadosVeiculo;
  resumo_debitos: ResumoDebitos;
  restricoes: RestricaoVeicular[];
  infracoes: InfracaoDetalhada[];
  consultado_em: string;
  origem_dados: string;
  total_importadas_sistema?: number;
}

export const vehicleFineQueryService = {
  /**
   * Consulta multas, restrições e faz o cruzamento automático com a Parte Diária
   */
  async consultarMultas(req: VehicleFineQueryRequest): Promise<VehicleFineQueryResponse> {
    const response = await api.post<VehicleFineQueryResponse>('/api/v1/veiculos/consulta-multas', req);
    return response.data;
  },

  /**
   * Importa multas selecionadas para a tabela de multas do sistema
   */
  async importarMultas(placa: string, infracoes: InfracaoDetalhada[]): Promise<{ total_importadas: number }> {
    const response = await api.post('/api/v1/veiculos/consulta-multas/importar', infracoes, {
      params: { placa },
    });
    return response.data;
  },

  /**
   * Gera e faz o download do Extrato em PDF
   */
  async baixarExtratoPdf(data: VehicleFineQueryResponse): Promise<Blob> {
    const response = await api.post('/api/v1/veiculos/consulta-multas/extrato-pdf', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtém histórico de consultas realizadas para o veículo
   */
  async obterHistorico(placa: string): Promise<any[]> {
    const response = await api.get(`/api/v1/veiculos/consulta-multas/historico/${placa}`);
    return response.data;
  },
};

export default vehicleFineQueryService;
