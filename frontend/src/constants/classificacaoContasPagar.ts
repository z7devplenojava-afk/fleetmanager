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

/**
 * 22 Classificações Oficiais extraídas do relatório SIGLO00058
 */
export const CLASSIFICACOES_SIGLO = [
  'ADMINISTRATIVAS',
  'ALIMENTACAO',
  'ALUGUEL',
  'BANCARIAS',
  'CAIXA',
  'CARTORIO',
  'COMBUSTIVEL',
  'CONSORCIO',
  'FINANCIAMENTO',
  'FOLHA PAGAMENTO VSS',
  'FROTA (PEÇAS,SERVIÇOS,IPVA)',
  'GRATIFICACOES',
  'IMPOSTOS',
  'JUDICIAL',
  'LIMPEZA',
  'LOCACAO DE VEICULOS',
  'OBRAS',
  'PARTICULAR DIRETORIA',
  'PESSOAL',
  'PLANO DE SAUDE',
  'SEGURANCA',
  'TRANSPORTE'
] as const;

export const CLASSIFICACOES_PADRAO: ClassificacaoContaItem[] = [
  // 1. Custos Operacionais & Frota
  { codigo: '1.01', nome: 'COMBUSTIVEL', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.02', nome: 'FROTA (PEÇAS,SERVIÇOS,IPVA)', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.03', nome: 'LOCACAO DE VEICULOS', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.04', nome: 'TRANSPORTE', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.05', nome: 'LIMPEZA', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.06', nome: 'Combustíveis e Lubrificantes', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.07', nome: 'Peças e Manutenção Mecânica', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.08', nome: 'Pneus e Serviços de Borracharia', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.09', nome: 'Lavagem e Higienização de Frotas', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },
  { codigo: '1.10', nome: 'Pedágios, Estacionamento e ConectCar', grupo: 'OPERACIONAL', grupoNome: 'Operacional & Frota' },

  // 2. Despesas com Pessoal & Folha
  { codigo: '2.01', nome: 'FOLHA PAGAMENTO VSS', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.02', nome: 'PESSOAL', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.03', nome: 'ALIMENTACAO', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.04', nome: 'PLANO DE SAUDE', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.05', nome: 'GRATIFICACOES', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.06', nome: 'Salários, Adiantamentos e Pró-labore', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.07', nome: 'Vale Transporte e Vale Combustível', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },
  { codigo: '2.08', nome: 'EPIs, Uniformes e SST', grupo: 'PESSOAL', grupoNome: 'Pessoal & Folha' },

  // 3. Despesas Administrativas & TI
  { codigo: '3.01', nome: 'ADMINISTRATIVAS', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.02', nome: 'ALUGUEL', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.03', nome: 'CARTORIO', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.04', nome: 'JUDICIAL', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.05', nome: 'SEGURANCA', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.06', nome: 'PARTICULAR DIRETORIA', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.07', nome: 'Material de Escritório, Papelaria e Limpeza', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },
  { codigo: '3.08', nome: 'Honorários Contábeis, Advocatícios e Consultorias', grupo: 'ADMINISTRATIVO', grupoNome: 'Administrativo & TI' },

  // 4. Impostos, Taxas e Tributos
  { codigo: '4.01', nome: 'IMPOSTOS', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },
  { codigo: '4.02', nome: 'Impostos Municipais (ISS / IPTU)', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },
  { codigo: '4.03', nome: 'Impostos Federais (PIS, COFINS, IRPJ, CSLL)', grupo: 'TRIBUTARIO', grupoNome: 'Tributário' },

  // 5. Despesas Financeiras & Bancárias
  { codigo: '5.01', nome: 'BANCARIAS', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.02', nome: 'CAIXA', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.03', nome: 'CONSORCIO', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.04', nome: 'FINANCIAMENTO', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.05', nome: 'Tarifas Bancárias e Manutenção de Contas', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },
  { codigo: '5.06', nome: 'Juros, Multas e Mora por Atraso', grupo: 'FINANCEIRO', grupoNome: 'Financeiro' },

  // 6. Investimentos & Ativos (CAPEX)
  { codigo: '6.01', nome: 'OBRAS', grupo: 'INVESTIMENTO', grupoNome: 'Investimentos' },
  { codigo: '6.02', nome: 'Aquisição / Renovação de Veículos e Frotas', grupo: 'INVESTIMENTO', grupoNome: 'Investimentos' },

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

  const clean = classificacaoNome.toUpperCase();
  
  // Operacional & Frota
  if (
    clean.includes('COMBUSTIVEL') || clean.includes('COMBUST') ||
    clean.includes('FROTA') || clean.includes('PEÇAS') || clean.includes('MANUTEN') ||
    clean.includes('LOCACAO') || clean.includes('TRANSPORTE') ||
    clean.includes('LIMPEZA') || clean.startsWith('1.')
  ) {
    return {
      bg: 'bg-blue-500/15',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dot: '#3b82f6',
      grupoNome: 'Operacional & Frota'
    };
  }

  // Pessoal & Folha
  if (
    clean.includes('FOLHA') || clean.includes('PESSOAL') ||
    clean.includes('ALIMENTACAO') || clean.includes('SAUDE') || clean.includes('SAÚDE') ||
    clean.includes('GRATIFICACAO') || clean.includes('GRATIFICACOES') ||
    clean.includes('SALÁRIO') || clean.includes('BENEFÍCIO') || clean.startsWith('2.')
  ) {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dot: '#f59e0b',
      grupoNome: 'Pessoal & Folha'
    };
  }

  // Administrativo & TI
  if (
    clean.includes('ADMINISTRATIVA') || clean.includes('ADMINISTRATIVAS') ||
    clean.includes('ALUGUEL') || clean.includes('CARTORIO') ||
    clean.includes('JUDICIAL') || clean.includes('SEGURANCA') ||
    clean.includes('PARTICULAR') || clean.includes('DIRETORIA') ||
    clean.startsWith('3.')
  ) {
    return {
      bg: 'bg-purple-500/15',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
      dot: '#a855f7',
      grupoNome: 'Administrativo & TI'
    };
  }

  // Tributário & Impostos
  if (
    clean.includes('IMPOSTOS') || clean.includes('IMPOSTO') ||
    clean.includes('TRIBUT') || clean.includes('ISS') || clean.includes('ICMS') ||
    clean.startsWith('4.')
  ) {
    return {
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      dot: '#f43f5e',
      grupoNome: 'Tributário & Impostos'
    };
  }

  // Financeiro & Bancos
  if (
    clean.includes('BANCARIAS') || clean.includes('CAIXA') ||
    clean.includes('CONSORCIO') || clean.includes('FINANCIAMENTO') ||
    clean.includes('JUROS') || clean.includes('MULTA') || clean.startsWith('5.')
  ) {
    return {
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-300',
      border: 'border-indigo-500/30',
      dot: '#6366f1',
      grupoNome: 'Financeiro & Bancário'
    };
  }

  // Investimentos (CAPEX)
  if (
    clean.includes('OBRAS') || clean.includes('INVEST') ||
    clean.includes('AQUISIÇ') || clean.startsWith('6.')
  ) {
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
