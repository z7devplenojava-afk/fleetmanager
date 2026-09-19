export interface ClassificacaoContaItem {
  codigo: string;
  nome: string;
  grupo: 'OPERACIONAL' | 'PESSOAL' | 'ADMINISTRATIVO' | 'TRIBUTARIO' | 'FINANCEIRO' | 'INVESTIMENTO' | 'OUTROS';
  grupoNome: string;
}

export const GRUPOS_CLASSIFICACAO = [
  { id: 'OPERACIONAL', label: '1. Custos Operacionais & Frota', color: 'blue' },
  { id: 'PESSOAL', label: '2. Despesas com Pessoal & Folha', color: 'amber' },
  { id: 'ADMINISTRATIVO', label: '3. Despesas Administrativas & TI', color: 'purple' },
  { id: 'TRIBUTARIO', label: '4. Impostos, Taxas e Tributos', color: 'rose' },
  { id: 'FINANCEIRO', label: '5. Despesas Financeiras & Bancárias', color: 'indigo' },
  { id: 'INVESTIMENTO', label: '6. Investimentos & Ativos (CAPEX)', color: 'emerald' },
  { id: 'OUTROS', label: '7. Outras Despesas Operacionais', color: 'zinc' },
] as const;

export const CLASSIFICACOES_PADRAO: ClassificacaoContaItem[] = [
  // 1. Custos Operacionais & Frota
  { codigo: '1.01', nome: 'Combustíveis e Lubrificantes', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.02', nome: 'Peças e Manutenção Mecânica', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.03', nome: 'Pneus e Serviços de Borracharia', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.04', nome: 'Lavagem e Higienização de Frotas', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.05', nome: 'Pedágios, Estacionamento e ConectCar', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.06', nome: 'Seguros de Veículos e Cargas', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.07', nome: 'Licenciamento, IPVA e Taxas DETRAN', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.08', nome: 'Funilaria, Pintura e Vidros', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.09', nome: 'Rastreamento, Telemetria e Monitoramento', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.10', nome: 'Arla 32 e Insumos Ambientais', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },

  // 2. Despesas com Pessoal & Folha
  { codigo: '2.01', nome: 'Salários, Adiantamentos e Pró-labore', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.02', nome: 'Vale Transporte e Vale Combustível', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.03', nome: 'Vale Refeição e Alimentação (VR/VA)', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.04', nome: 'Plano de Saúde e Assistência Odontológica', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.05', nome: 'Encargos Sociais (FGTS, INSS, PIS)', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.06', nome: 'Treinamentos, Cursos e Reciclagem', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.07', nome: 'EPIs, Uniformes e SST', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.08', nome: 'Rescisões e Férias Trabalhistas', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },

  // 3. Despesas Administrativas & TI
  { codigo: '3.01', nome: 'Aluguel de Imóveis, Garagens e Pátios', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.02', nome: 'Energia Elétrica e Água/Saneamento', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.03', nome: 'Telefonia, Internet e Links Dedicados', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.04', nome: 'Softwares, Licenças e Sistemas ERP/TI', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.05', nome: 'Material de Escritório, Papelaria e Limpeza', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.06', nome: 'Honorários Contábeis, Advocatícios e Consultorias', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.07', nome: 'Segurança Patrimonial e Vigilância', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.08', nome: 'Manutenção Predial e Prediais Gerais', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },

  // 4. Impostos, Taxas e Tributos
  { codigo: '4.01', nome: 'Impostos Municipais (ISS / IPTU)', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },
  { codigo: '4.02', nome: 'Impostos Estaduais (ICMS / Taxas)', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },
  { codigo: '4.03', nome: 'Impostos Federais (PIS, COFINS, IRPJ, CSLL, Simples)', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },
  { codigo: '4.04', nome: 'Alvarás, Licenças de Operação e ANTT', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },

  // 5. Despesas Financeiras & Bancárias
  { codigo: '5.01', nome: 'Tarifas Bancárias e Manutenção de Contas', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.02', nome: 'Juros, Multas e Mora por Atraso', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.03', nome: 'Amortização de Financiamentos e Empréstimos', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.04', nome: 'IOF e Encargos sobre Operações de Crédito', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },

  // 6. Investimentos & Ativos (CAPEX)
  { codigo: '6.01', nome: 'Aquisição / Renovação de Veículos e Frotas', grupo: 'INVESTIMENTO', grupoNome: 'Investimentos' },
  { codigo: '6.02', nome: 'Máquinas, Ferramentas e Equipamentos de Oficina', grupo: 'INVESTIMENTO', grupoNome: 'Investimentos' },
  { codigo: '6.03', nome: 'Reformas e Infraestrutura de Garagens', grupo: 'INVESTIMENTO', grupoNome: 'Investimentos' },

  // 7. Outras Despesas
  { codigo: '7.01', nome: 'Despesas Gerais e Não Classificadas', grupo: 'OUTROS', grupoNome: 'Outras' },
];

/**
 * Retorna as cores de estilo visual (Tailwind) para cada grupo de classificação
 */
export function getClassificacaoStyle(classificacaoNome?: string) {
  if (!classificacaoNome) {
    return {
      bg: 'bg-zinc-800',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
      dot: '#71717a',
      grupoNome: 'Geral'
    };
  }

  const clean = classificacaoNome.toLowerCase();
  
  // Operacional & Frota
  if (clean.includes('combust') || clean.includes('manuten') || clean.includes('peça') || clean.includes('pneu') || 
      clean.includes('lavag') || clean.includes('pedág') || clean.includes('veículo') || clean.includes('frota') || 
      clean.includes('arla') || clean.includes('1.') || clean.includes('operacion')) {
    return {
      bg: 'bg-blue-500/15',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dot: '#3b82f6',
      grupoNome: 'Operacional & Frota'
    };
  }

  // Pessoal & Folha
  if (clean.includes('salário') || clean.includes('folha') || clean.includes('benefício') || clean.includes('vale') || 
      clean.includes('alimenta') || clean.includes('saúde') || clean.includes('inss') || clean.includes('fgts') || 
      clean.includes('epi') || clean.includes('rescis') || clean.includes('2.') || clean.includes('pessoal')) {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dot: '#f59e0b',
      grupoNome: 'Pessoal & Folha'
    };
  }

  // Administrativo & TI
  if (clean.includes('aluguel') || clean.includes('energia') || clean.includes('água') || clean.includes('telefone') || 
      clean.includes('internet') || clean.includes('software') || clean.includes('sistema') || clean.includes('escritório') || 
      clean.includes('honorário') || clean.includes('contáb') || clean.includes('3.') || clean.includes('administrativ')) {
    return {
      bg: 'bg-purple-500/15',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
      dot: '#a855f7',
      grupoNome: 'Administrativo & TI'
    };
  }

  // Tributário & Impostos
  if (clean.includes('imposto') || clean.includes('tribut') || clean.includes('iss') || clean.includes('icms') || 
      clean.includes('pis') || clean.includes('cofins') || clean.includes('irpj') || clean.includes('alvará') || 
      clean.includes('4.') || clean.includes('fiscal')) {
    return {
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      dot: '#f43f5e',
      grupoNome: 'Tributário & Impostos'
    };
  }

  // Financeiro & Bancos
  if (clean.includes('tarifa') || clean.includes('banc') || clean.includes('juro') || clean.includes('multa') || 
      clean.includes('empréstimo') || clean.includes('financiamento') || clean.includes('iof') || clean.includes('5.')) {
    return {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-300',
      border: 'border-indigo-500/30',
      dot: '#6366f1',
      grupoNome: 'Financeiro & Bancário'
    };
  }

  // Investimentos (CAPEX)
  if (clean.includes('invest') || clean.includes('aquisiç') || clean.includes('máquina') || clean.includes('ferramenta') || 
      clean.includes('obra') || clean.includes('reforma') || clean.includes('capex') || clean.includes('6.')) {
    return {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dot: '#10b981',
      grupoNome: 'Investimentos (CAPEX)'
    };
  }

  // Padrão / Outros
  return {
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    dot: '#9ca3af',
    grupoNome: 'Outras Despesas'
  };
}
