/**
 * Serviço para busca de CBO (Código Brasileiro de Ocupação)
 * Utiliza API pública para consulta de códigos CBO
 */

export interface CBOItem {
  codigo: string;
  titulo: string;
  sinonimo?: string;
}

class CBOService {
  // API pública de CBO - tentar múltiplas URLs
  private readonly API_URLS = [
    'https://api-cbo.herokuapp.com/api/v1',
    'https://cbo-api.herokuapp.com/api/v1',
  ];
  
  private get API_BASE_URL() {
    return this.API_URLS[0]; // Usar a primeira URL por padrão
  }
  
  // Base local: lista de CBOs mais comuns para transporte, manutenção, frota, segurança e administração
  private readonly COMMON_CBOS: CBOItem[] = [
    // Mecânica, Manutenção e Oficina
    { codigo: '9144-05', titulo: 'Mecânico de manutenção de automóveis, motocicletas e veículos afins', sinonimo: 'Mecânico, Mecânico de autos, Mecânico geral' },
    { codigo: '9144-25', titulo: 'Mecânico de veículos a diesel (ônibus e caminhões)', sinonimo: 'Mecânico diesel, Mecânico de ônibus, Mecânico de caminhão, Mecânico pesados' },
    { codigo: '9144-10', titulo: 'Mecânico de manutenção de freios de veículos automotores', sinonimo: 'Mecânico de freio, Freista' },
    { codigo: '9144-15', titulo: 'Mecânico de manutenção de suspensão e direção de veículos', sinonimo: 'Mecânico de suspensão, Alinhador' },
    { codigo: '9144-20', titulo: 'Mecânico de manutenção de tratores e máquinas agrícolas', sinonimo: 'Mecânico de máquinas pesadas, Tratorista mecânico' },
    { codigo: '9144-30', titulo: 'Borracheiro', sinonimo: 'Borracheiro de frota, Vulcanizador de pneus' },
    { codigo: '9511-05', titulo: 'Eletricista de instalações de veículos automotores', sinonimo: 'Auto elétrico, Eletricista de autos, Eletricista de ônibus' },
    { codigo: '9913-05', titulo: 'Funileiro de veículos (reparação)', sinonimo: 'Lanterneiro, Chapeador, Funileiro' },
    { codigo: '9913-10', titulo: 'Pintor de veículos automotores', sinonimo: 'Pintor automotivo, Pintor de frota' },
    { codigo: '9101-05', titulo: 'Encarregado de manutenção mecânica', sinonimo: 'Chefe de oficina, Encarregado de manutenção, Líder mecânico' },
    { codigo: '1414-15', titulo: 'Gerente de manutenção', sinonimo: 'Gestor de manutenção, Coordenador de manutenção' },

    // Motoristas e Operação de Transporte
    { codigo: '7824-05', titulo: 'Motorista de ônibus urbano', sinonimo: 'Motorista urbano, Motorista coletivo' },
    { codigo: '7824-10', titulo: 'Motorista de ônibus rodoviário', sinonimo: 'Motorista rodoviário, Motorista de viagem' },
    { codigo: '7823-05', titulo: 'Motorista de caminhão (rotas regionais e internacionais)', sinonimo: 'Motorista de caminhão, Carreteiro' },
    { codigo: '7823-10', titulo: 'Motorista de furgão ou veículo similar', sinonimo: 'Motorista de van, Motorista de utilitário, Motorista entregador' },
    { codigo: '7823-20', titulo: 'Motorista operacional de guincho', sinonimo: 'Operador de guincho, Socorrista de frota' },
    { codigo: '5112-15', titulo: 'Fiscal de transportes coletivos', sinonimo: 'Fiscal de linha, Fiscal de ônibus, Inspetor de tráfego' },
    { codigo: '5112-20', titulo: 'Cobrador de transportes coletivos', sinonimo: 'Cobrador de ônibus, Cobrador' },
    { codigo: '3423-10', titulo: 'Despachante de transportes', sinonimo: 'Despachante de tráfego, Escalar de tráfego' },
    { codigo: '3423-05', titulo: 'Encarregado de tráfego', sinonimo: 'Chefe de tráfego, Supervisor de tráfego, Encarregado operacional' },
    { codigo: '1414-10', titulo: 'Gerente de operações de transportes', sinonimo: 'Gestor de tráfego, Gestor operacional, Gerente de tráfego' },
    { codigo: '3421-10', titulo: 'Analista de transporte / frota', sinonimo: 'Analista de frota, Analista de logística' },

    // Lavagem, Limpeza e Conservação
    { codigo: '5163-40', titulo: 'Lavador de veículos', sinonimo: 'Lavador de ônibus, Lavador de frota, Higienizador de autos' },
    { codigo: '5143-20', titulo: 'Faxineiro / Auxiliar de serviços gerais', sinonimo: 'Auxiliar de limpeza, Faxineiro, ASG' },
    { codigo: '5143-25', titulo: 'Trabalhador da manutenção de edificações', sinonimo: 'Zelador, Manutenção predial' },

    // Estoque, Compras e Suprimentos
    { codigo: '4141-05', titulo: 'Almoxarife', sinonimo: 'Almoxarifado, Encarregado de almoxarifado' },
    { codigo: '4141-10', titulo: 'Armazenista / Estoquista', sinonimo: 'Estoquista, Auxiliar de estoque' },
    { codigo: '3542-05', titulo: 'Comprador comercial', sinonimo: 'Comprador, Analista de compras' },

    // Administrativo, RH e Tráfego
    { codigo: '4110-10', titulo: 'Assistente administrativo', sinonimo: 'Auxiliar administrativo, Auxiliar de escritório' },
    { codigo: '4110-05', titulo: 'Auxiliar de pessoal / RH', sinonimo: 'Assistente de RH, Auxiliar de departamento pessoal' },
    { codigo: '3514-05', titulo: 'Supervisor de tráfego / segurança', sinonimo: 'Supervisor operacional, Coordenador operacional' },

    // Vigilantes e Portaria
    { codigo: '5171-10', titulo: 'Vigilante', sinonimo: 'Segurança, Guarda' },
    { codigo: '5171-15', titulo: 'Porteiro de edifícios', sinonimo: 'Porteiro, Zelador' },
    { codigo: '5171-20', titulo: 'Controlador de acesso', sinonimo: 'Controlador, Recepcionista' },
    { codigo: '5172-20', titulo: 'Vigia', sinonimo: 'Vigilante, Guarda' },
    { codigo: '5172-25', titulo: 'Porteiro', sinonimo: 'Porteiro de garagem, Guarita' },
  ];

  /**
   * Busca CBOs por código ou título
   * @param query - Termo de busca (código ou título)
   * @returns Lista de CBOs encontrados
   */
  async searchCBO(query: string, skipLocal: boolean = false): Promise<CBOItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    console.log('🔍 Buscando CBO:', searchTerm, skipLocal ? '(pulando base local)' : '');

    // Se não deve pular a base local, buscar primeiro nela
    if (!skipLocal) {
      const localResults = this.searchFromLocal(searchTerm.toLowerCase());
      if (localResults.length > 0) {
        console.log('✅ CBOs encontrados na base local:', localResults.length);
        return localResults;
      }
    }

    // Tentar API (pode demorar)
    try {
      console.log('🌐 Tentando buscar na API externa...');
      const apiResults = await this.searchFromAPI(searchTerm);
      if (apiResults.length > 0) {
        console.log('✅ CBOs encontrados na API externa:', apiResults.length);
        return apiResults;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar CBO na API externa:', error);
    }

    // Se não encontrou na API e pulou a base local, buscar na base local agora
    if (skipLocal) {
      const localResults = this.searchFromLocal(searchTerm.toLowerCase());
      if (localResults.length > 0) {
        console.log('✅ CBOs encontrados na base local (fallback):', localResults.length);
        return localResults;
      }
    }

    // Se não encontrou nada, retornar vazio
    console.log('❌ Nenhum CBO encontrado');
    return [];
  }

  /**
   * Busca CBOs na API pública
   */
  private async searchFromAPI(query: string): Promise<CBOItem[]> {
    console.log('🔍 Buscando CBO na API:', query);
    
    // Buscar por código (se for um código CBO)
    const codePattern = /^\d{4}[-]?\d{1,2}$/;
    const isCode = codePattern.test(query.replace(/\s/g, ''));
    
    if (isCode) {
      const codigo = query.replace(/\D/g, '').substring(0, 6);
      const formattedCode = codigo.length >= 4 
        ? `${codigo.substring(0, 4)}-${codigo.substring(4) || '0'}` 
        : codigo;
      
      console.log('📋 Buscando CBO por código:', formattedCode);
      
      // Tentar diferentes endpoints
      const endpoints = [
        `/cbo/${formattedCode}`,
        `/cbo?codigo=${formattedCode}`,
        `/cbo/${formattedCode.replace('-', '')}`,
      ];
      
      for (const endpoint of endpoints) {
        try {
          const result = await this.fetchCBO(`${this.API_BASE_URL}${endpoint}`);
          if (result && result.length > 0) {
            console.log('✅ CBO encontrado na API:', result);
            return result;
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar em ${endpoint}:`, error);
        }
      }
    }

    // Buscar por título
    console.log('📋 Buscando CBO por título:', query);
    
    const searchEndpoints = [
      `/cbo?titulo=${encodeURIComponent(query)}`,
      `/cbo?search=${encodeURIComponent(query)}`,
      `/cbo?q=${encodeURIComponent(query)}`,
      `/cbo?nome=${encodeURIComponent(query)}`,
    ];
    
    for (const endpoint of searchEndpoints) {
      try {
        const result = await this.fetchCBOList(`${this.API_BASE_URL}${endpoint}`);
        if (result && result.length > 0) {
          console.log('✅ CBOs encontrados na API:', result.length);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar em ${endpoint}:`, error);
      }
    }

    console.log('❌ Nenhum resultado encontrado na API');
    return [];
  }

  /**
   * Busca um CBO específico por endpoint
   */
  private async fetchCBO(url: string): Promise<CBOItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      console.log('🌐 Fazendo requisição para:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Resposta da API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Dados recebidos:', data);
        
        // Verificar diferentes formatos de resposta
        if (data && (data.codigo || data.code || data.id)) {
          return [{
            codigo: data.codigo || data.code || data.id || '',
            titulo: data.titulo || data.title || data.descricao || data.description || data.nome || '',
            sinonimo: data.sinonimo || data.synonym
          }];
        }
        
        // Se for um array com um único item
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          if (item && (item.codigo || item.code || item.id)) {
            return [{
              codigo: item.codigo || item.code || item.id || '',
              titulo: item.titulo || item.title || item.descricao || item.description || item.nome || '',
              sinonimo: item.sinonimo || item.synonym
            }];
          }
        }
      } else {
        console.warn('⚠️ Resposta não OK:', response.status);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name !== 'AbortError') {
        console.error('❌ Erro ao buscar CBO:', fetchError);
        throw fetchError;
      }
    }
    
    return [];
  }

  /**
   * Busca lista de CBOs por endpoint
   */
  private async fetchCBOList(url: string): Promise<CBOItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      console.log('🌐 Fazendo requisição para:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Resposta da API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Dados recebidos:', Array.isArray(data) ? `${data.length} itens` : 'objeto único');
        
        // Se for um array
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            codigo: item.codigo || item.code || item.id || '',
            titulo: item.titulo || item.title || item.descricao || item.description || item.nome || '',
            sinonimo: item.sinonimo || item.synonym
          })).filter((item: CBOItem) => item.codigo && item.titulo).slice(0, 20);
        }
        
        // Se for um objeto com array dentro
        if (data && Array.isArray(data.data)) {
          return data.data.map((item: any) => ({
            codigo: item.codigo || item.code || item.id || '',
            titulo: item.titulo || item.title || item.descricao || item.description || item.nome || '',
            sinonimo: item.sinonimo || item.synonym
          })).filter((item: CBOItem) => item.codigo && item.titulo).slice(0, 20);
        }
        
        // Se for um objeto único
        if (data && (data.codigo || data.code || data.id)) {
          return [{
            codigo: data.codigo || data.code || data.id || '',
            titulo: data.titulo || data.title || data.descricao || data.description || data.nome || '',
            sinonimo: data.sinonimo || data.synonym
          }];
        }
      } else {
        console.warn('⚠️ Resposta não OK:', response.status);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name !== 'AbortError') {
        console.error('❌ Erro ao buscar lista de CBOs:', fetchError);
        throw fetchError;
      }
    }
    
    return [];
  }

  /**
   * Busca CBOs na lista local (fallback)
   */
  private searchFromLocal(query: string): CBOItem[] {
    interface CBOWithScore extends CBOItem {
      score: number;
    }
    
    const results: CBOWithScore[] = [];
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const queryNorm = normalize(query);

    for (const cbo of this.COMMON_CBOS) {
      const codigoNorm = normalize(cbo.codigo);
      const tituloNorm = normalize(cbo.titulo);
      const sinonimoNorm = cbo.sinonimo ? normalize(cbo.sinonimo) : '';

      const codigoMatch = codigoNorm.includes(queryNorm);
      const tituloMatch = tituloNorm.includes(queryNorm);
      const sinonimoMatch = sinonimoNorm.includes(queryNorm);

      if (codigoMatch || tituloMatch || sinonimoMatch) {
        // Priorizar correspondências exatas no título
        const score = tituloNorm === queryNorm ? 5 :
                     tituloNorm.startsWith(queryNorm) ? 4 :
                     tituloMatch ? 3 :
                     sinonimoMatch ? 2 :
                     codigoMatch ? 1 : 0;
        
        results.push({ ...cbo, score });
      }

      // Limitar a 20 resultados
      if (results.length >= 20) {
        break;
      }
    }

    // Ordenar por relevância (score) e remover o score
    return results
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...item }) => item);
  }

  /**
   * Busca um CBO específico por código
   */
  async getCBOByCode(code: string): Promise<CBOItem | null> {
    const normalizedCode = code.replace(/\D/g, '');
    if (normalizedCode.length < 4) {
      return null;
    }

    const formattedCode = normalizedCode.length >= 4 
      ? `${normalizedCode.substring(0, 4)}-${normalizedCode.substring(4) || '0'}` 
      : normalizedCode;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/cbo/${formattedCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && (data.codigo || data.code)) {
          return {
            codigo: data.codigo || data.code,
            titulo: data.titulo || data.title || data.descricao || data.description || '',
            sinonimo: data.sinonimo || data.synonym
          };
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.warn('Erro ao buscar CBO por código na API:', error);
      }
    }

    // Fallback: buscar na lista local
    const localResult = this.COMMON_CBOS.find(cbo => 
      cbo.codigo.replace(/\D/g, '') === normalizedCode
    );

    return localResult || null;
  }
}

export const cboService = new CBOService();

