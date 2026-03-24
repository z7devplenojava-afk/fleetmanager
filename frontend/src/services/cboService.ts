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
  
  // Base local: lista de CBOs mais comuns para segurança e vigilância
  private readonly COMMON_CBOS: CBOItem[] = [
    // Vigilantes e Seguranças
    { codigo: '5171-10', titulo: 'Vigilante', sinonimo: 'Segurança, Guarda' },
    { codigo: '5171-15', titulo: 'Porteiro de edifícios', sinonimo: 'Porteiro, Zelador' },
    { codigo: '5171-20', titulo: 'Controlador de acesso', sinonimo: 'Controlador, Recepcionista' },
    { codigo: '5171-25', titulo: 'Segurança de eventos', sinonimo: 'Segurança, Vigilante de eventos' },
    { codigo: '5171-30', titulo: 'Vigilante de loja', sinonimo: 'Segurança de loja, Guarda de loja' },
    { codigo: '5172-05', titulo: 'Agente de segurança', sinonimo: 'Agente, Segurança' },
    { codigo: '5172-10', titulo: 'Agente de portaria', sinonimo: 'Porteiro, Recepcionista' },
    { codigo: '5172-15', titulo: 'Controlador de entrada e saída', sinonimo: 'Controlador' },
    { codigo: '5172-20', titulo: 'Vigia', sinonimo: 'Vigilante, Guarda' },
    { codigo: '5172-25', titulo: 'Porteiro', sinonimo: 'Porteiro de edifícios' },
    { codigo: '5172-30', titulo: 'Recepcionista de segurança', sinonimo: 'Recepcionista' },
    { codigo: '5173-05', titulo: 'Segurança particular', sinonimo: 'Segurança, Vigilante' },
    { codigo: '5173-10', titulo: 'Segurança de transporte de valores', sinonimo: 'Segurança, Transporte de valores' },
    { codigo: '5173-15', titulo: 'Segurança de eventos', sinonimo: 'Segurança, Eventos' },
    { codigo: '5173-20', titulo: 'Segurança de shopping', sinonimo: 'Segurança, Shopping' },
    { codigo: '5173-25', titulo: 'Segurança de condomínio', sinonimo: 'Segurança, Condomínio' },
    
    // Supervisores
    { codigo: '3514-05', titulo: 'Supervisor de segurança', sinonimo: 'Supervisor, Coordenador de segurança' },
    { codigo: '3514-10', titulo: 'Supervisor de vigilância', sinonimo: 'Supervisor, Vigilância' },
    { codigo: '3514-15', titulo: 'Supervisor de portaria', sinonimo: 'Supervisor, Portaria' },
    
    // Coordenação e Gerência
    { codigo: '3515-05', titulo: 'Coordenador de segurança', sinonimo: 'Coordenador, Segurança' },
    { codigo: '3515-10', titulo: 'Gerente de segurança', sinonimo: 'Gerente, Segurança' },
    { codigo: '3515-15', titulo: 'Diretor de segurança', sinonimo: 'Diretor, Segurança' },
    
    // Outras ocupações relacionadas
    { codigo: '5174-05', titulo: 'Segurança patrimonial', sinonimo: 'Segurança, Patrimônio' },
    { codigo: '5174-10', titulo: 'Segurança pessoal', sinonimo: 'Segurança, Escolta' },
    { codigo: '5174-15', titulo: 'Segurança de aeroporto', sinonimo: 'Segurança, Aeroporto' },
    { codigo: '5174-20', titulo: 'Segurança de banco', sinonimo: 'Segurança, Banco' },
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
    const queryLower = query.toLowerCase();

    for (const cbo of this.COMMON_CBOS) {
      const codigoMatch = cbo.codigo.toLowerCase().includes(queryLower);
      const tituloMatch = cbo.titulo.toLowerCase().includes(queryLower);
      const sinonimoMatch = cbo.sinonimo?.toLowerCase().includes(queryLower);

      if (codigoMatch || tituloMatch || sinonimoMatch) {
        // Priorizar correspondências exatas no título
        const score = tituloMatch && cbo.titulo.toLowerCase() === queryLower ? 3 :
                     tituloMatch ? 2 :
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

