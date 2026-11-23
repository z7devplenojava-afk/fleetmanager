import api from '@/lib/axios';

/**
 * Serviço para busca de CBO (Código Brasileiro de Ocupação)
 * Consulta a API do backend (/api/positions/cbo/search) e o catálogo oficial local com descrição detalhada.
 */

export interface CBOItem {
  codigo: string;
  titulo: string;
  sinonimo?: string;
  descricao?: string;
}

class CBOService {
  // Catálogo oficial de CBOs com descrições detalhadas das atribuições e responsabilidades
  private readonly COMMON_CBOS: CBOItem[] = [
    // Mecânica, Manutenção e Oficina
    {
      codigo: '9144-25',
      titulo: 'Mecânico de veículos a diesel (ônibus e caminhões)',
      sinonimo: 'Mecânico, Mecânico diesel, Mecânico de ônibus, Mecânico de caminhão, Mecânico pesados',
      descricao: 'Realiza manutenção preventiva e corretiva em veículos automotores e pesados a diesel (ônibus, micro-ônibus e caminhões), inspecionando motores, sistemas de transmissão, freios, suspensão e direção.'
    },
    {
      codigo: '9144-05',
      titulo: 'Mecânico de manutenção de automóveis, motocicletas e veículos afins',
      sinonimo: 'Mecânico de autos, Mecânico geral, Mecânico de frota',
      descricao: 'Elabora planos de manutenção e executa reparos em motores, sistemas elétricos, hidráulicos, suspensão e freios de veículos automotores da frota.'
    },
    {
      codigo: '9144-10',
      titulo: 'Mecânico de manutenção de freios de veículos automotores',
      sinonimo: 'Mecânico de freio, Freista',
      descricao: 'Realiza diagnóstico, regulagem, substituição de lonas, pastilhas, válvulas pneumáticas e reparo completo em sistemas de freios de veículos da frota.'
    },
    {
      codigo: '9144-15',
      titulo: 'Mecânico de manutenção de suspensão e direção de veículos',
      sinonimo: 'Mecânico de suspensão, Alinhador, Balanceador',
      descricao: 'Executa serviços de manutenção em sistemas de suspensão, feixes de molas, amortecedores, alinhamento e geometria de direção de veículos.'
    },
    {
      codigo: '9144-20',
      titulo: 'Mecânico de manutenção de tratores e máquinas agrícolas',
      sinonimo: 'Mecânico de máquinas pesadas, Tratorista mecânico',
      descricao: 'Realiza diagnóstico e manutenção mecânica, hidráulica e de transmissão em máquinas pesadas, tratores e equipamentos operacionais.'
    },
    {
      codigo: '9144-30',
      titulo: 'Borracheiro',
      sinonimo: 'Borracheiro de frota, Vulcanizador de pneus',
      descricao: 'Realiza montagem, desmontagem, calibragem, rodízio, vulcanização e controle de sulco e recapagem de pneus da frota.'
    },
    {
      codigo: '9511-05',
      titulo: 'Eletricista de instalações de veículos automotores',
      sinonimo: 'Eletricista, Auto elétrico, Eletricista de autos, Eletricista de ônibus',
      descricao: 'Realiza manutenção preventiva e corretiva em sistemas elétricos e eletrônicos de veículos, alternadores, motores de partida, baterias, iluminação e ar-condicionado.'
    },
    {
      codigo: '9913-05',
      titulo: 'Funileiro de veículos (reparação)',
      sinonimo: 'Funileiro, Lanterneiro, Chapeador',
      descricao: 'Executa reparos de carroceria, funilaria, lanternagem, estrutura metálica, fibras e para-choques de veículos da frota.'
    },
    {
      codigo: '9913-10',
      titulo: 'Pintor de veículos automotores',
      sinonimo: 'Pintor automotivo, Pintor de frota',
      descricao: 'Prepara superfícies e realiza pintura, polimento e acabamento visual e padronização de identidade visual nos veículos da frota.'
    },
    {
      codigo: '9153-05',
      titulo: 'Lubrificador de veículos automotores',
      sinonimo: 'Lubrificador, Trocador de óleo, Auxiliar de mecânico, Ajudante de oficina',
      descricao: 'Realiza troca de óleos lubrificantes, filtros de óleo, ar e combustível, engraxamento e verificação de níveis de fluidos da frota.'
    },
    {
      codigo: '9101-05',
      titulo: 'Encarregado de manutenção mecânica de veículos',
      sinonimo: 'Chefe de oficina, Encarregado de manutenção, Líder mecânico, Supervisor de manutenção',
      descricao: 'Supervisiona as atividades da oficina mecânica, distribui Ordens de Serviço, acompanha indicadores de disponibilidade da frota e controla a qualidade dos reparos.'
    },
    {
      codigo: '1414-15',
      titulo: 'Gerente de manutenção',
      sinonimo: 'Gestor de manutenção, Coordenador de manutenção',
      descricao: 'Planeja e gerencia as operações de manutenção preventiva, preditiva e corretiva da frota, controle de custos, contratos e indicadores de desempenho (MTBF/MTTR).'
    },

    // Motoristas e Operação de Transporte
    {
      codigo: '3423-05',
      titulo: 'Chefe de serviço de transporte rodoviário (passageiros e cargas)',
      sinonimo: 'Encarregado de transportes, Encarregado de transporte, Encarregado de frota, Encarregado de tráfego, Supervisor de frota, Supervisor de transportes, Supervisor de tráfego, Chefe de tráfego, Líder de tráfego, Líder de transporte, Coordenador de transporte, Coordenador de frota, Encarregado operacional',
      descricao: 'Supervisiona e planeja operações de transporte rodoviário e fretamento, coordena escalas de motoristas e veículos, monitora o cumprimento de itinerários, vistorias e atendimento aos clientes.'
    },
    {
      codigo: '1414-10',
      titulo: 'Gerente de operações de transportes',
      sinonimo: 'Gerente de transportes, Gerente de transporte, Gerente de logística, Gerente de frota, Gestor de frota, Gestor de transportes, Diretor operacional',
      descricao: 'Dirige e planeja as operações de transporte e logística da empresa, gerenciando contratos, indicadores operacionais, custos e equipes.'
    },
    {
      codigo: '3421-10',
      titulo: 'Analista de transporte / frota',
      sinonimo: 'Analista de transportes, Analista de frota, Analista de logística, Assistente de transporte, Assistente de transportes, Assistente de frota, Auxiliar de tráfego, Auxiliar de transporte, Auxiliar de transportes',
      descricao: 'Analisa indicadores operacionais da frota, consumo de combustível, telemetria, roteirização e custos logísticos.'
    },
    {
      codigo: '3423-10',
      titulo: 'Inspetor de serviços de transportes rodoviários / Despachante',
      sinonimo: 'Despachante de tráfego, Despachante de transporte, Despachante de transportes, Controlador de tráfego, Operador de CCO, Fiscal de tráfego, Escalante, Monitor de frota',
      descricao: 'Coordena escalas diárias de motoristas e veículos, monitora viagens em tempo real no CCO, atua na liberação de viagens e atendimento a contingências operacionais.'
    },
    {
      codigo: '7824-10',
      titulo: 'Motorista de ônibus rodoviário',
      sinonimo: 'Motorista, Motorista rodoviário, Motorista de viagem, Motorista de fretamento',
      descricao: 'Conduz ônibus rodoviários e de fretamento em viagens municipais, intermunicipais e interestaduais, zelando pela segurança e conforto dos passageiros e vistoria do veículo.'
    },
    {
      codigo: '7824-05',
      titulo: 'Motorista de ônibus urbano',
      sinonimo: 'Motorista urbano, Motorista coletivo, Condutor de ônibus',
      descricao: 'Conduz ônibus no transporte coletivo urbano e metropolitano de passageiros, cumprindo itinerários, horários, normas de trânsito e direção defensiva.'
    },
    {
      codigo: '7823-05',
      titulo: 'Motorista de caminhão (rotas regionais e internacionais)',
      sinonimo: 'Motorista de caminhão, Carreteiro',
      descricao: 'Transporta cargas em caminhões e veículos pesados, inspecionando condições mecânicas, documentação e segurança do transporte.'
    },
    {
      codigo: '7823-10',
      titulo: 'Motorista de furgão ou van / Manobrista',
      sinonimo: 'Motorista de van, Motorista de micro-ônibus, Motorista de utilitário, Manobrista de ônibus, Manobrista de frota, Manobrista de garagem, Manobrista',
      descricao: 'Conduz vans, micro-ônibus e veículos utilitários ou realiza manobras e posicionamento de ônibus e veículos pesados nas garagens e pátios da empresa.'
    },
    {
      codigo: '7823-20',
      titulo: 'Motorista operacional de guincho',
      sinonimo: 'Operador de guincho, Socorrista de frota, Motorista socorrista',
      descricao: 'Opera veículo de socorro e reboque para atendimento emergencial e remoção de veículos avariados da frota.'
    },
    {
      codigo: '5112-15',
      titulo: 'Fiscal de transportes coletivos',
      sinonimo: 'Fiscal de linha, Fiscal de ônibus, Inspetor de tráfego, Fiscal operacional',
      descricao: 'Fiscaliza a operação das linhas e veículos, controla horários de partida e chegada, orienta motoristas e registra ocorrências operacionais.'
    },
    {
      codigo: '5112-20',
      titulo: 'Cobrador de transportes coletivos',
      sinonimo: 'Cobrador de ônibus, Cobrador, Auxiliar de bordo',
      descricao: 'Realiza cobrança de tarifas, controle de embarque de passageiros e auxílio ao motorista durante a operação do transporte coletivo.'
    },
    {
      codigo: '3331-10',
      titulo: 'Instrutor de motoristas / Instrutor de trânsito',
      sinonimo: 'Instrutor de motoristas, Instrutor de tráfego, Instrutor de treinamento, Instrutor de direção defensiva',
      descricao: 'Ministra treinamentos de direção defensiva, direção econômica e normas operacionais para motoristas de ônibus e veículos pesados.'
    },

    // Lavagem, Limpeza e Conservação
    {
      codigo: '5163-40',
      titulo: 'Lavador de veículos',
      sinonimo: 'Lavador, Lavador de ônibus, Lavador de frota, Higienizador de autos',
      descricao: 'Executa lavagem externa, higienização interna e conservação estética dos veículos da frota na garagem.'
    },
    {
      codigo: '5143-20',
      titulo: 'Faxineiro / Auxiliar de serviços gerais',
      sinonimo: 'Auxiliar de serviços gerais, Auxiliar de limpeza, Faxineiro, ASG, Servente',
      descricao: 'Realiza trabalhos de limpeza, conservação e organização nas dependências administrativas, operacionais e garagens da empresa.'
    },
    {
      codigo: '5143-25',
      titulo: 'Trabalhador da manutenção de edificações',
      sinonimo: 'Zelador, Manutenção predial, Oficial de manutenção',
      descricao: 'Executa reparos e conservação predial, hidráulica, elétrica e alvenaria nas instalações e garagens da empresa.'
    },

    // Estoque, Compras e Suprimentos
    {
      codigo: '4141-05',
      titulo: 'Almoxarife',
      sinonimo: 'Almoxarifado, Encarregado de almoxarifado, Auxiliar de almoxarifado',
      descricao: 'Recebe, confere, armazena e controla a saída de peças, pneus, insumos e EPIs no almoxarifado, mantendo o inventário atualizado.'
    },
    {
      codigo: '4141-10',
      titulo: 'Armazenista / Estoquista',
      sinonimo: 'Estoquista, Auxiliar de estoque, Conferente',
      descricao: 'Organiza e controla a movimentação física de materiais e peças no estoque, auxiliando na separação de itens para Ordens de Serviço.'
    },
    {
      codigo: '3542-05',
      titulo: 'Comprador comercial',
      sinonimo: 'Comprador, Analista de compras, Assistente de compras, Suprimentos',
      descricao: 'Realiza cotações, negociação com fornecedores e emissão de pedidos de compra de peças automotivas, pneus, combustível e serviços.'
    },

    // Administrativo, RH, Financeiro e SST
    {
      codigo: '4110-10',
      titulo: 'Assistente administrativo',
      sinonimo: 'Auxiliar administrativo, Auxiliar de escritório, Analista administrativo, Recepcionista',
      descricao: 'Executa rotinas administrativas, controle de documentos, atendimento, lançamento de dados no sistema e apoio aos departamentos da empresa.'
    },
    {
      codigo: '4110-05',
      titulo: 'Auxiliar de pessoal / RH',
      sinonimo: 'Assistente de RH, Analista de RH, Auxiliar de departamento pessoal, DP, Recursos Humanos',
      descricao: 'Atua nas rotinas de Recursos Humanos e Departamento Pessoal, controle de admissão, ponto eletrônico, férias, benefícios, holerites e documentação legal.'
    },
    {
      codigo: '4131-10',
      titulo: 'Auxiliar de contabilidade / Financeiro',
      sinonimo: 'Assistente financeiro, Analista financeiro, Faturista, Contas a pagar, Contas a receber',
      descricao: 'Executa lançamentos financeiros, conciliação bancária, controle de contas a pagar e a receber, faturamento de contratos e emissão de relatórios.'
    },
    {
      codigo: '3516-05',
      titulo: 'Técnico em segurança do trabalho',
      sinonimo: 'Técnico de segurança, TST, Segurança do trabalho, SESMT',
      descricao: 'Inspeciona condições de segurança do trabalho, entrega e controle de EPIs, treinamentos normativos (NRs), prevenção de acidentes e gestão de SST.'
    },
    {
      codigo: '3514-05',
      titulo: 'Supervisor operacional e administrativo',
      sinonimo: 'Supervisor operacional, Coordenador operacional, Supervisor',
      descricao: 'Supervisiona equipes operacionais e administrativas, acompanha metas, escalas de trabalho e conformidade dos processos.'
    },

    // Vigilantes e Portaria
    {
      codigo: '5171-10',
      titulo: 'Vigilante',
      sinonimo: 'Segurança, Guarda, Vigilante patrimonial',
      descricao: 'Zela pela guarda do patrimônio e segurança das instalações, garagens, veículos e colaboradores, realizando rondas e controle de perímetro.'
    },
    {
      codigo: '5174-10',
      titulo: 'Porteiro / Controlador de acesso',
      sinonimo: 'Porteiro, Controlador de acesso, Porteiro de edifícios, Porteiro de garagem, Guarita, Recepcionista de portaria',
      descricao: 'Fiscaliza a entrada e saída de pessoas e veículos nas garagens e unidades da empresa, registrando movimentações e checklists de portaria.'
    },
    {
      codigo: '5172-20',
      titulo: 'Vigia',
      sinonimo: 'Vigia noturno, Ronda, Guarda patrimonial',
      descricao: 'Realiza vigilância e inspeção periódica nas dependências e pátios de estacionamento da frota.'
    }
  ];

  /**
   * Busca CBOs por código ou nome do cargo (consulta API do backend + catálogo local enriquecido)
   */
  async searchCBO(query: string, _skipLocal: boolean = false): Promise<CBOItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    const resultsMap = new Map<string, CBOItem>();

    // 1. Buscar primeiro no catálogo local enriquecido (resposta instantânea)
    const localResults = this.searchFromLocal(searchTerm);
    for (const item of localResults) {
      resultsMap.set(item.codigo, item);
    }

    // 2. Consultar API do backend (/api/positions/cbo/search) para complementar com banco de dados
    try {
      const response = await api.get<CBOItem[]>('/positions/cbo/search', {
        params: { query: searchTerm }
      });
      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item && item.codigo && !resultsMap.has(item.codigo)) {
            resultsMap.set(item.codigo, {
              codigo: item.codigo,
              titulo: item.titulo || searchTerm,
              sinonimo: item.sinonimo,
              descricao: item.descricao || item.titulo
            });
          }
        }
      }
    } catch {
      // Fallback silencioso para o catálogo local
    }

    return Array.from(resultsMap.values());
  }

  private searchFromLocal(query: string): CBOItem[] {
    interface CBOWithScore extends CBOItem {
      score: number;
    }

    const results: CBOWithScore[] = [];
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const queryNorm = normalize(query);
    if (!queryNorm) return [];

    const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'por', 'sem', 'ou', 'ao', 'aos', 'e', 'a', 'o']);
    const stemWord = (w: string) => {
      let s = w;
      if (s.endsWith('es') && s.length > 5) s = s.slice(0, -2);
      else if (s.endsWith('s') && s.length > 4) s = s.slice(0, -1);
      return s;
    };

    const queryWords = queryNorm
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));
    const stemmedQueryWords = queryWords.map(stemWord);
    const digitsOnlyQuery = queryNorm.replace(/\D/g, '');

    for (const cbo of this.COMMON_CBOS) {
      const codigoNorm = normalize(cbo.codigo);
      const codigoDigits = codigoNorm.replace(/\D/g, '');
      const tituloNorm = normalize(cbo.titulo);
      const sinonimoNorm = cbo.sinonimo ? normalize(cbo.sinonimo) : '';
      const descricaoNorm = cbo.descricao ? normalize(cbo.descricao) : '';
      const synonymsList = sinonimoNorm.split(',').map(s => s.trim());

      const exactSynonym = synonymsList.some(s => s === queryNorm);
      const startsSynonym = synonymsList.some(s => s.startsWith(queryNorm));
      const codeExact = codigoNorm === queryNorm || (digitsOnlyQuery.length >= 4 && codigoDigits === digitsOnlyQuery);
      const codeStarts = digitsOnlyQuery.length >= 2 && codigoDigits.startsWith(digitsOnlyQuery);

      const fullText = `${tituloNorm} ${sinonimoNorm} ${descricaoNorm}`;

      let score = 0;
      if (tituloNorm === queryNorm || codeExact) {
        score = 100;
      } else if (exactSynonym) {
        score = 95;
      } else if (tituloNorm.startsWith(queryNorm) || codeStarts) {
        score = 88;
      } else if (startsSynonym) {
        score = 84;
      } else if (tituloNorm.includes(queryNorm)) {
        score = 80;
      } else if (sinonimoNorm.includes(queryNorm)) {
        score = 75;
      } else if (queryWords.length > 0) {
        let matchedCount = 0;
        let inTitleOrSynonymCount = 0;
        for (let i = 0; i < queryWords.length; i++) {
          const w = queryWords[i];
          const st = stemmedQueryWords[i];
          const inTitleOrSyn = tituloNorm.includes(w) || tituloNorm.includes(st) || sinonimoNorm.includes(w) || sinonimoNorm.includes(st);
          const inFull = inTitleOrSyn || fullText.includes(w) || fullText.includes(st);

          if (inFull) matchedCount++;
          if (inTitleOrSyn) inTitleOrSynCount++;
        }

        const ratio = matchedCount / queryWords.length;
        if (ratio === 1) {
          score = inTitleOrSynonymCount === queryWords.length ? 90 : 78;
        } else if (ratio >= 0.5) {
          score = Math.round(50 + ratio * 20);
        }
      }

      if (score > 0) {
        results.push({ ...cbo, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...item }) => item);
  }

  async getCBOByCode(code: string): Promise<CBOItem | null> {
    const normalizedCode = code.replace(/\D/g, '');
    if (normalizedCode.length < 4) {
      return null;
    }

    const localResult = this.COMMON_CBOS.find(
      cbo => cbo.codigo.replace(/\D/g, '') === normalizedCode
    );
    if (localResult) return localResult;

    const apiResults = await this.searchCBO(code);
    return apiResults[0] || null;
  }
}

export const cboService = new CBOService();
