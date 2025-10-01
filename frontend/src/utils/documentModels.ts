// Configuração de todos os modelos de documentos disponíveis
export interface DocumentModel {
  id: string;
  name: string;
  category: 'ORDEM_SERVICO' | 'TERMO_RESPONSABILIDADE' | 'CONTRATO' | 'DECLARACAO' | 'DEMISSAO' | 'OUTROS';
  description: string;
  hasGenerator: boolean;
  generatorPath?: string;
}

export const documentModels: DocumentModel[] = [
  // Ordens de Serviço
  {
    id: 'ordem-servico-padrao',
    name: 'Ordem de Serviços Padrão',
    category: 'ORDEM_SERVICO',
    description: 'Modelo padrão para ordens de serviço',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'ordem-servico-csn',
    name: 'Ordem de Serviços CSN',
    category: 'ORDEM_SERVICO',
    description: 'Modelo específico para CSN',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'ordem-servico-aterpa',
    name: 'Ordem de Serviços ATERPA',
    category: 'ORDEM_SERVICO',
    description: 'Modelo específico para ATERPA',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'ordem-servico-transpes',
    name: 'Ordem de Serviços Transpes',
    category: 'ORDEM_SERVICO',
    description: 'Modelo específico para Transpes',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'asg-ordem-servico-aterpa',
    name: 'ASG Ordem de Serviços ATERPA',
    category: 'ORDEM_SERVICO',
    description: 'Modelo ASG específico para ATERPA',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'asg-ordem-servico-transpes',
    name: 'ASG Ordem de Serviços TRANSPES',
    category: 'ORDEM_SERVICO',
    description: 'Modelo ASG específico para TRANSPES',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },
  {
    id: 'ordem-servico-recepcionista',
    name: 'Ordem de Serviço Recepcionista',
    category: 'ORDEM_SERVICO',
    description: 'Modelo específico para recepcionista',
    hasGenerator: true,
    generatorPath: '@/utils/ordemServicoPDFGenerator'
  },

  // Termos de Responsabilidade
  {
    id: 'termo-responsabilidade-cartao-otimo',
    name: 'TERMO DE RESPONSABILIDADE CARTÃO ÓTIMO VALE-TRANSPORTE',
    category: 'TERMO_RESPONSABILIDADE',
    description: 'Termo de responsabilidade para cartão Ótimo',
    hasGenerator: true,
    generatorPath: '@/utils/termoResponsabilidadeGenerator'
  },
  {
    id: 'termo-responsabilidade-cartao-bh-bus',
    name: 'TERMO DE RESPONSABILIDADE CARTÃO BH BUS VALE-TRANSPORTE',
    category: 'TERMO_RESPONSABILIDADE',
    description: 'Termo de responsabilidade para cartão BH Bus',
    hasGenerator: false
  },
  {
    id: 'termo-responsabilidade-cartao-betim',
    name: 'TERMO DE RESPONSABILIDADE CARTÃO BETIM CARD VALE-TRANSPORTE',
    category: 'TERMO_RESPONSABILIDADE',
    description: 'Termo de responsabilidade para cartão Betim',
    hasGenerator: false
  },
  {
    id: 'termo-responsabilidade-celular',
    name: 'TERMO DE RESPONSABILIDADE APARELHO CELULAR',
    category: 'TERMO_RESPONSABILIDADE',
    description: 'Termo de responsabilidade para aparelho celular',
    hasGenerator: true,
    generatorPath: '@/utils/termoResponsabilidadeGenerator'
  },

  // Contratos de Trabalho
  {
    id: 'contrato-experiencia-45',
    name: 'Contrato de Trabalho a Título de Experiência 45 DIAS',
    category: 'CONTRATO',
    description: 'Contrato de experiência de 45 dias',
    hasGenerator: true,
    generatorPath: '@/utils/contratoExperienciaGenerator'
  },
  {
    id: 'contrato-experiencia-60',
    name: 'Contrato de Trabalho a Título de Experiência 60 DIAS',
    category: 'CONTRATO',
    description: 'Contrato de experiência de 60 dias',
    hasGenerator: true,
    generatorPath: '@/utils/contratoExperienciaGenerator'
  },
  {
    id: 'contrato-experiencia-90',
    name: 'Contrato de Trabalho a Título de Experiência 90 DIAS',
    category: 'CONTRATO',
    description: 'Contrato de experiência de 90 dias',
    hasGenerator: true,
    generatorPath: '@/utils/contratoExperienciaGenerator'
  },

  // Declarações
  {
    id: 'declaracao-cipa-transpes',
    name: 'Declaração para designação da CIPA - TRANSPES',
    category: 'DECLARACAO',
    description: 'Declaração para designação da CIPA TRANSPES',
    hasGenerator: true,
    generatorPath: '@/utils/declaracaoGenerator'
  },
  {
    id: 'declaracao-fins-escolares',
    name: 'Declaração Fins Escolares',
    category: 'DECLARACAO',
    description: 'Declaração para fins escolares',
    hasGenerator: true,
    generatorPath: '@/utils/declaracaoGenerator'
  },

  // Demissões
  {
    id: 'demissao-justa-causa',
    name: 'Demissão Por Justa Causa',
    category: 'DEMISSAO',
    description: 'Documento de demissão por justa causa',
    hasGenerator: false
  },

  // Outros
  {
    id: 'carta-apresentacao',
    name: 'Carta de Apresentação',
    category: 'OUTROS',
    description: 'Carta de apresentação',
    hasGenerator: false
  },
  {
    id: 'termo-opcao-vt-promover',
    name: 'Termo Opção VT Promover Vigilância',
    category: 'OUTROS',
    description: 'Termo de opção VT Promover Vigilância',
    hasGenerator: false
  },
  {
    id: 'validacao-nr06',
    name: 'Validação NR06',
    category: 'OUTROS',
    description: 'Validação NR06',
    hasGenerator: false
  },
  {
    id: 'termo-lgpd',
    name: 'TERMO DE LGPD',
    category: 'OUTROS',
    description: 'Termo de LGPD',
    hasGenerator: false
  },
  {
    id: 'termo-protecao-dados-lgpd',
    name: 'Termo de Proteção de Dados – LGPD',
    category: 'OUTROS',
    description: 'Termo de proteção de dados LGPD',
    hasGenerator: false
  },
  {
    id: 'formulario-abertura-vaga',
    name: 'Formulário para abertura vaga',
    category: 'OUTROS',
    description: 'Formulário para abertura de vaga',
    hasGenerator: false
  }
];

// Função para obter modelos por categoria
export const getModelsByCategory = (category: DocumentModel['category']) => {
  return documentModels.filter(model => model.category === category);
};

// Função para obter modelo por ID
export const getModelById = (id: string) => {
  return documentModels.find(model => model.id === id);
};

// Categorias disponíveis
export const categories = [
  { id: 'ORDEM_SERVICO', name: 'Ordens de Serviço', icon: 'FileText' },
  { id: 'TERMO_RESPONSABILIDADE', name: 'Termos de Responsabilidade', icon: 'Shield' },
  { id: 'CONTRATO', name: 'Contratos de Trabalho', icon: 'FileSignature' },
  { id: 'DECLARACAO', name: 'Declarações', icon: 'FileCheck' },
  { id: 'DEMISSAO', name: 'Demissões', icon: 'UserX' },
  { id: 'OUTROS', name: 'Outros', icon: 'File' }
] as const;
