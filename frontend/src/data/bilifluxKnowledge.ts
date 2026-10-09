export interface BiliFluxSubItem {
  label: string;
  route: string;
}

export interface BiliFluxTopic {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  objetivo: string;
  steps: string[];
  resultado: string;
  dica?: string;
  cuidado?: string;
  route?: string;
  routeLabel?: string;
  subitems?: BiliFluxSubItem[];
}

export const BILI_FLUX_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  principal: { label: 'Menu Principal', emoji: '🏠' },
  frota: { label: 'Manutenção & Frota', emoji: '🚌' },
  passagens: { label: 'Gestão de Passagens', emoji: '🎫' },
  financeiro: { label: 'Módulo Financeiro', emoji: '💰' },
  fiscal: { label: 'Módulo Fiscal', emoji: '🧾' },
  operacional: { label: 'Operacional', emoji: '🛡️' },
  rh: { label: 'Recursos Humanos', emoji: '👥' },
  sst: { label: 'Segurança do Trabalho (SST)', emoji: '🦺' },
  dp: { label: 'Departamento Pessoal', emoji: '📋' },
  comercial: { label: 'Comercial & Vendas', emoji: '💼' },
  estoque: { label: 'Estoque & Almoxarifado', emoji: '📦' },
  compras: { label: 'Compras & Suprimentos', emoji: '🛒' },
  comunicacao: { label: 'Comunicação Interna', emoji: '💬' },
  atendimento: { label: 'Atendimento', emoji: '🎧' },
  trafego: { label: 'Gestão de Tráfego', emoji: '🗺️' },
  sistema: { label: 'Sistema', emoji: '⚙️' },
  mobilizacao: { label: 'Mobilização', emoji: '🚚' }
};

export const BILI_FLUX_TOPICS: BiliFluxTopic[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'principal',
    keywords: ['dashboard', 'painel', 'inicio', 'home', 'visao geral', 'metrica', 'indicador', 'kpi', 'grafico'],
    objetivo: 'usar o Dashboard como central de informações da operação.',
    steps: [
      'Acesse Dashboard pelo menu lateral (Menu Principal > Dashboard).',
      'Visualize os cards com métricas principais e os gráficos de cada módulo.',
      'Use os filtros de período para personalizar a visualização.',
      'Clique nos gráficos e cards para ver detalhes de cada indicador.'
    ],
    resultado: 'Você acompanha os indicadores da operação em tempo real em um único painel.',
    dica: 'Defina o Dashboard como página inicial para começar o dia com a visão completa da operação.',
    route: '/dashboard',
    routeLabel: 'Ir para Dashboard'
  },
  {
    id: 'portal-cliente',
    title: 'Portal do Cliente',
    category: 'principal',
    keywords: ['portal do cliente', 'portal cliente', 'portal-cliente', 'cliente portal', 'portal'],
    objetivo: 'oferecer ao cliente acesso ao portal com informações dos serviços contratados.',
    steps: [
      'Acesse Menu Principal > Portal do Cliente.',
      'O cliente (com seu próprio acesso) visualiza contratos, serviços e documentos.',
      'Use o portal para compartilhar informações de forma segura com o cliente.'
    ],
    resultado: 'O cliente consulta seus dados diretamente no portal, sem necessidade de envio manual.',
    route: '/portal-cliente',
    routeLabel: 'Abrir Portal do Cliente',
    subitems: [
      { label: 'Portal do Funcionário', route: '/employee-portal' },
      { label: 'Portal do Passageiro', route: '/passenger' },
      { label: 'Portal do Motorista', route: '/driver-dashboard' }
    ]
  },
  {
    id: 'holerites',
    title: 'Holerites',
    category: 'principal',
    keywords: ['holerite', 'holerites', 'contracheque', 'contracheques', 'folha', 'pagamento', 'salario', 'holerite do mes'],
    objetivo: 'gerenciar, consultar e distribuir holerites dos colaboradores.',
    steps: [
      'Acesse Menu Principal > Holerites (ou Recursos Humanos > Holerites).',
      'Importe a planilha do holerite do mês ou cadastre os valores manualmente.',
      'Confira os dados de cada colaborador antes de finalizar o envio.',
      'Distribua os holerites — o colaborador acessa o dele pelo Portal do Funcionário.'
    ],
    resultado: 'Os holerites ficam disponíveis para consulta e cada colaborador recebe o seu de forma segura.',
    dica: 'O colaborador também pode consultar em Meus Holerites pelo Portal do Funcionário.',
    warning: 'Confira valores e dados bancários antes de distribuir — correções após o envio geram retrabalho.',
    route: '/holerites',
    routeLabel: 'Abrir Holerites'
  },
  {
    id: 'filiais',
    title: 'Filiais',
    category: 'principal',
    keywords: ['filial', 'filiais', 'unidade', 'unidades', 'sede', 'endereco da empresa'],
    objetivo: 'cadastrar e gerenciar as filiais da empresa.',
    steps: [
      'Acesse Menu Principal > Filiais.',
      'Cadastre cada filial com nome, endereço e dados de contato.',
      'Ative ou desative filiais conforme a operação.'
    ],
    resultado: 'As filiais cadastradas ficam disponíveis para vincular a veículos, funcionários e operações.',
    route: '/filiais',
    routeLabel: 'Abrir Filiais'
  },
  {
    id: 'frota',
    title: 'Gerenciar Frota',
    category: 'frota',
    keywords: ['frota', 'veiculo', 'veiculos', 'onibus', 'ônibus', 'carro', 'placa', 'gerenciar frota', 'cadastro de veiculo'],
    objetivo: 'cadastrar e acompanhar os veículos da frota.',
    steps: [
      'Acesse Manutenção & Frota > Gerenciar Frota.',
      'Cadastre o veículo com placa, modelo, ano e documentação.',
      'Mantenha a documentação (licenciamento, seguro, emplacamento) sempre atualizada.',
      'Acompanhe o histórico de cada veículo pela ficha do veículo.'
    ],
    resultado: 'Todos os veículos da frota ficam cadastrados com documentação e histórico centralizados.',
    dica: 'Configure lembretes para vencimentos de documentação e evite multas e bloqueios.',
    warning: 'Sempre confira a placa antes de salvar — dados errados afetam manutenção, combustível e relatórios.',
    route: '/frota',
    routeLabel: 'Abrir Frota'
  },
  {
    id: 'os-frota',
    title: 'Ordens de Serviço (O.S.) da Frota',
    category: 'frota',
    keywords: ['ordem de servico', 'ordem de serviço', 'o.s', 'os de frota', 'manutencao', 'manutenção', 'reparo', 'conserto', 'oficina'],
    objetivo: 'abrir e acompanhar Ordens de Serviço da frota.',
    steps: [
      'Acesse Manutenção & Frota > O.S. de Frota.',
      'Clique para criar uma nova O.S. e informe o veículo.',
      'Descreva o serviço a ser executado, vincule o mecânico responsável e as peças utilizadas.',
      'Acompanhe o status da O.S. até a conclusão.',
      'Ao finalizar, confirme a conclusão para registrar no histórico do veículo.'
    ],
    resultado: 'A O.S. aparece com o status atualizado e o histórico fica registrado permanentemente no veículo.',
    warning: 'Confira a placa do veículo antes de salvar para não registrar a manutenção no carro errado.',
    route: '/frota/ordens-servico',
    routeLabel: 'Ver Ordens de Serviço'
  },
  {
    id: 'manutencao-dashboard',
    title: 'Dashboard de Manutenção',
    category: 'frota',
    keywords: ['dashboard manutencao', 'painel manutencao', 'manutencao v2', 'hud', 'area do mecanico', 'mecanico'],
    objetivo: 'acompanhar a manutenção da frota pelos painéis especializados.',
    steps: [
      'Acesse Manutenção & Frota > Dashboard Manutenção para a visão geral.',
      'Use Manutenção V2 (HUD) para o painel visual em tempo real.',
      'O mecânico utiliza a Área do Mecânico para executar suas tarefas.'
    ],
    resultado: 'A equipe de manutenção acompanha OS abertas, atrasos e carga de trabalho em tempo real.',
    route: '/manutencao',
    routeLabel: 'Abrir Manutenção',
    subitems: [
      { label: 'Manutenção V2 (HUD)', route: '/manutencao/v2' },
      { label: 'Área do Mecânico', route: '/manutencao/mechanic' }
    ]
  },
  {
    id: 'abastecimento',
    title: 'Abastecimento',
    category: 'frota',
    keywords: ['abastecimento', 'combustivel', 'combustível', 'gasolina', 'diesel', 'etanol', 'tanque', 'litros'],
    objetivo: 'registrar e acompanhar os abastecimentos da frota.',
    steps: [
      'Acesse Manutenção & Frota > Abastecimento.',
      'Registre cada abastecimento informando veículo, litros, valor e posto.',
      'Acompanhe o consumo por veículo nos relatórios.'
    ],
    resultado: 'O histórico de abastecimentos fica registrado e permite análise de consumo por veículo.',
    dica: 'Registre o abastecimento no mesmo dia — dados atrasados comprometem a análise de consumo.',
    route: '/abastecimento',
    routeLabel: 'Abrir Abastecimento'
  },
  {
    id: 'pneus',
    title: 'Gestão de Pneus',
    category: 'frota',
    keywords: ['pneu', 'pneus', 'calibragem', 'rodagem', 'recapagem', 'pneu furado'],
    objetivo: 'controlar o estoque e o ciclo de vida dos pneus da frota.',
    steps: [
      'Acesse Manutenção & Frota > Gestão de Pneus.',
      'Cadastre cada pneu com número de série e medidas.',
      'Registre montagem, desmontagem, reparos e trocas por veículo.',
      'Acompanhe quilometragem e status de cada pneu.'
    ],
    resultado: 'O ciclo de vida de cada pneu fica rastreado, facilitando decisões de recapagem e troca.',
    route: '/pneus',
    routeLabel: 'Abrir Gestão de Pneus'
  },
  {
    id: 'garagens',
    title: 'Gestão de Garagens',
    category: 'frota',
    keywords: ['garagem', 'garagens', 'pátio', ' patio', 'estacionamento da frota'],
    objetivo: 'cadastrar e gerenciar as garagens onde os veículos são abrigados.',
    steps: [
      'Acesse Manutenção & Frota > Gestão de Garagens.',
      'Cadastre cada garagem com endereço e capacidade.',
      'Vincule os veículos às suas garagens de origem.'
    ],
    resultado: 'A localização de cada veículo da frota fica organizada por garagem.',
    route: '/frota/garagens',
    routeLabel: 'Abrir Garagens'
  },
  {
    id: 'portaria',
    title: 'Gestão de Portaria',
    category: 'frota',
    keywords: ['portaria', 'entrada', 'saida de veiculo', 'controle de portao', 'guarita'],
    objetivo: 'controlar entradas e saídas de veículos na garagem.',
    steps: [
      'Acesse Manutenção & Frota > Gestão de Portaria.',
      'Registre a entrada e a saída dos veículos com horário e motorista.',
      'Acompanhe o histórico de movimentações.'
    ],
    resultado: 'Todo movimento de veículos na garagem fica registrado para auditoria.',
    route: '/manutencao/portaria',
    routeLabel: 'Abrir Portaria'
  },
  {
    id: 'checklist-veiculo',
    title: 'Checklists de Veículo',
    category: 'frota',
    keywords: ['checklist', 'check list', 'vistoria', 'inspecao', 'inspeção', 'checklist por veiculo', 'checklist por cliente'],
    objetivo: 'realizar checklists de vistoria nos veículos.',
    steps: [
      'Acesse Manutenção & Frota > Checklist por Veículo para vistorias internas.',
      'Para checklists exigidos pelo cliente, use Gestão Checklist por Cliente.',
      'Preencha os itens da vistoria (pneus, freios, luzes, documentação).',
      'Anexe fotos dos itens problemáticos e registre as pendências.'
    ],
    resultado: 'As vistorias ficam documentadas e as pendências geram acompanhamento na manutenção.',
    route: '/manutencao/checklist-veiculo',
    routeLabel: 'Abrir Checklist por Veículo',
    subitems: [
      { label: 'Checklist por Cliente', route: '/manutencao/checklist-cliente' }
    ]
  },
  {
    id: 'limpeza-lavajato',
    title: 'Limpeza e Lavajato',
    category: 'frota',
    keywords: ['limpeza', 'lavajato', 'lavagem', 'lavar', 'higienizacao', 'limpar o veiculo'],
    objetivo: 'agendar e acompanhar a limpeza dos veículos.',
    steps: [
      'Acesse Manutenção & Frota > Gestão de Limpeza para agendar as limpezas.',
      'Registre a realização da limpeza com data e responsável.',
      'Use Lavajato para os registros específicos de lavagem externa.'
    ],
    resultado: 'O histórico de limpeza de cada veículo fica documentado.',
    route: '/manutencao/limpeza',
    routeLabel: 'Abrir Limpeza',
    subitems: [
      { label: 'Lavajato', route: '/manutencao/lavajato' }
    ]
  },
  {
    id: 'cfme',
    title: 'Certificações CFME',
    category: 'frota',
    keywords: ['cfme', 'certificacao', 'certificação', 'certificado', 'vistoria cfme'],
    objetivo: 'gerenciar as certificações CFME dos veículos.',
    steps: [
      'Acesse Manutenção & Frota > Certificações CFME.',
      'Cadastre as certificações de cada veículo com número e validade.',
      'Acompanhe os vencimentos.'
    ],
    resultado: 'As certificações CFME da frota ficam organizadas com controle de validade.',
    route: '/manutencao/certificacoes-cfme',
    routeLabel: 'Abrir Certificações CFME'
  },
  {
    id: 'mobilizacao',
    title: 'Mobilização de Transportes',
    category: 'mobilizacao',
    keywords: ['mobilizacao', 'mobilização', 'mobilizar', 'transferencia', 'transferência', 'realocacao de veiculo'],
    objetivo: 'gerenciar a mobilização e transferência de veículos entre operações.',
    steps: [
      'Acesse Mobilização > Mobilização de Transportes.',
      'Clique em novo para criar uma mobilização informando veículo, origem e destino.',
      'Acompanhe o status das mobilizações em andamento.'
    ],
    resultado: 'As transferências de veículos ficam documentadas com origem, destino e responsável.',
    route: '/frota/mobilizacao',
    routeLabel: 'Abrir Mobilização'
  },
  {
    id: 'passagens',
    title: 'Gestão de Passagens (Ticketing)',
    category: 'passagens',
    keywords: ['passagem', 'passagens', 'ticket', 'ticketing', 'venda de passagem', 'poltrona', 'assento', 'bilhete'],
    objetivo: 'vender passagens e gerenciar o mapa de poltronas e as viagens.',
    steps: [
      'Acesse Gestão de Passagens > Venda de Passagens para registrar vendas.',
      'Use Mapa de Poltronas para montar os layouts de assentos de cada veículo.',
      'Em Programar Viagens, cadastre as viagens com data, rota e veículo.'
    ],
    resultado: 'As vendas, poltronas e viagens do sistema de passagens ficam integrados.',
    dica: 'Monte o mapa de poltronas antes de programar as viagens para agilizar as vendas.',
    route: '/ticketing/booking',
    routeLabel: 'Abrir Venda de Passagens',
    subitems: [
      { label: 'Mapa de Poltronas', route: '/ticketing/admin/templates' },
      { label: 'Programar Viagens', route: '/ticketing/admin/trips' }
    ]
  },
  {
    id: 'financeiro',
    title: 'Módulo Financeiro',
    category: 'financeiro',
    keywords: ['financeiro', 'dinheiro', 'caixa', 'contas', 'pagar', 'receber', 'fluxo de caixa', 'conciliacao', 'banco', 'pagamento', 'recebimento'],
    objetivo: 'controlar as finanças da empresa: contas a pagar, a receber e fluxo de caixa.',
    steps: [
      'Acesse Módulo Financeiro > Financeiro para a visão geral.',
      'Cadastre títulos em Contas a Pagar e Contas a Receber.',
      'Acompanhe o Fluxo de Caixa diariamente.',
      'Realize a Conciliação Bancária periodicamente comparando com os extratos.',
      'Gere relatórios em Relatórios Financeiros para análise.'
    ],
    resultado: 'A situação financeira da empresa fica atualizada com pagamentos, recebimentos e conciliação em dia.',
    dica: 'Faça a conciliação bancária ao menos semanalmente — quanto antes identificar divergências, mais fácil corrigir.',
    warning: 'Não registre pagamentos sem confirmação bancária; isso distorce o fluxo de caixa.',
    route: '/financeiro',
    routeLabel: 'Abrir Financeiro',
    subitems: [
      { label: 'Contas a Pagar', route: '/financeiro/contas-pagar' },
      { label: 'Contas a Receber', route: '/financeiro/contas-receber' },
      { label: 'Fluxo de Caixa', route: '/financeiro/fluxo-caixa' },
      { label: 'Pagamentos', route: '/financeiro/pagamentos' },
      { label: 'Conciliação Bancária', route: '/financeiro/conciliacao-bancaria' },
      { label: 'Relatórios Financeiros', route: '/financeiro/relatorios' },
      { label: 'Centro de Custos', route: '/financeiro/centro-custos' }
    ]
  },
  {
    id: 'fiscal',
    title: 'Módulo Fiscal',
    category: 'fiscal',
    keywords: ['fiscal', 'nota fiscal', 'nf', 'imposto', 'impostos', 'xml', 'danfe', 'tributo', 'sped'],
    objetivo: 'gerenciar documentos fiscais e impostos da empresa.',
    steps: [
      'Acesse Módulo Fiscal > Documentos Fiscais para consultar os documentos.',
      'Use Importar XML/PDF para carregar notas fiscais de fornecedores.',
      'Acompanhe a carga tributária em Controle de Impostos.',
      'Gere relatórios em Relatórios Fiscais.'
    ],
    resultado: 'Os documentos fiscais ficam organizados e importados para conferência e apuração.',
    route: '/fiscal',
    routeLabel: 'Abrir Módulo Fiscal'
  },
  {
    id: 'operacional',
    title: 'Módulo Operacional',
    category: 'operacional',
    keywords: ['operacional', 'servicos', 'serviços', 'equipamento', 'equipamentos', 'escala', 'escalas', 'ocorrencia', 'ocorrência', 'visita', 'parte diaria', 'ronda'],
    objetivo: 'gerenciar serviços, equipamentos, escalas e ocorrências operacionais.',
    steps: [
      'Acesse Operacional > Dashboard para a visão geral.',
      'Cadastre Serviços e Equipamentos na aba correspondente.',
      'Configure Escalas de trabalho dos colaboradores.',
      'Registre Ocorrências e acompanhe o Controle de Rondas.',
      'Feche o dia com o Parte Diário.'
    ],
    resultado: 'A operação do dia a dia (serviços, escalas, ocorrências) fica centralizada e auditável.',
    dica: 'Preencha o Parte Diário todos os dias antes do encerramento do turno.',
    route: '/operacional',
    routeLabel: 'Abrir Operacional',
    subitems: [
      { label: 'Controle de Rondas', route: '/controle-rondas' },
      { label: 'Medição', route: '/operacional/medicao' }
    ]
  },
  {
    id: 'rh',
    title: 'Recursos Humanos',
    category: 'rh',
    keywords: ['rh', 'recursos humanos', 'funcionario', 'funcionários', 'colaborador', 'equipe', 'cadastro de funcionario', 'vaga', 'beneficio', 'treinamento'],
    objetivo: 'gerenciar o cadastro e a jornada dos funcionários.',
    steps: [
      'Acesse Recursos Humanos > RH Principal (ou Funcionários).',
      'Cadastre o funcionário com dados pessoais, documentação e vínculo.',
      'Configure cargos, funções e postos de trabalho.',
      'Registre benefícios, férias e treinamentos nas seções correspondentes.',
      'Gere relatórios em Relatórios RH.'
    ],
    resultado: 'O cadastro completo dos funcionários fica centralizado, com jornada, benefícios e documentos.',
    warning: 'Dados pessoais (CPF, RG, salário) são sensíveis — só cadastre informações verdadeiras e autorizadas.',
    route: '/rh',
    routeLabel: 'Abrir RH',
    subitems: [
      { label: 'Funcionários', route: '/rh/funcionarios' },
      { label: 'Vagas', route: '/rh/vagas' },
      { label: 'Benefícios', route: '/rh/beneficios' },
      { label: 'Treinamentos', route: '/rh/treinamentos' },
      { label: 'Postos de Trabalho', route: '/rh/postos' }
    ]
  },
  {
    id: 'sst',
    title: 'Segurança do Trabalho (SST)',
    category: 'sst',
    keywords: ['sst', 'seguranca', 'segurança', 'epi', 'epis', 'exame medico', 'exame médico', 'acidente', 'acidentes', 'cipa', 'saude ocupacional', 'nr'],
    objetivo: 'gerenciar a saúde e segurança do trabalho: EPIs, exames, acidentes e CIPA.',
    steps: [
      'Acesse Segurança do Trabalho (SST) > Controle SST.',
      'Registre os Exames Médicos admissionais, periódicos e demissionais.',
      'Controle a entrega de EPIs em EPIs (com ficha de entrega assinada).',
      'Registre Acidentes de trabalho com detalhes e medidas adotadas.',
      'Gerencie a CIPA e os Treinamentos SST.'
    ],
    resultado: 'A conformidade legal de SST da empresa fica documentada (NRs, PCMSO, ASO).',
    warning: 'Entregue sempre a Ficha de Entrega de EPI assinada — em fiscalização, ela é obrigatória.',
    route: '/rh/sst',
    routeLabel: 'Abrir SST',
    subitems: [
      { label: 'Exames Médicos', route: '/rh/sst/exames' },
      { label: 'EPIs', route: '/rh/sst/epis' },
      { label: 'Acidentes', route: '/rh/sst/acidentes' },
      { label: 'Treinamentos SST', route: '/rh/sst/treinamentos' },
      { label: 'CIPA', route: '/rh/sst/cipa' },
      { label: 'Relatórios SST', route: '/rh/sst/relatorios' }
    ]
  },
  {
    id: 'departamento-pessoal',
    title: 'Departamento Pessoal',
    category: 'dp',
    keywords: ['departamento pessoal', 'admissao', 'admissão', 'demissao', 'demissão', 'ferias', 'férias', 'ponto', 'ponto eletronico', 'fechamento de horas', 'ocorrencia', 'remanejamento'],
    objetivo: 'executar as rotinas de departamento pessoal: admissões, férias, ponto e horas.',
    steps: [
      'Acesse Departamento Pessoal > Admissão/Demissão para processar vínculos.',
      'Gerencie Férias planejando períodos e pagamento.',
      'Registre marcações em Ponto Eletrônico e feche o período em Fechamento de Horas.',
      'Importe funcionários em lote via Excel em Importar Funcionários.'
    ],
    resultado: 'Todo o ciclo de vida do colaborador (entrada, jornada, férias, saída) fica processado e documentado.',
    dica: 'Use a importação em lote de Excel para cadastros iniciais de vários colaboradores de uma vez.',
    route: '/rh/admissao-demissao',
    routeLabel: 'Abrir Admissão/Demissão',
    subitems: [
      { label: 'Férias', route: '/rh/ferias' },
      { label: 'Ponto Eletrônico', route: '/rh/ponto-eletronico' },
      { label: 'Controle de Horas', route: '/rh/controle-horas' },
      { label: 'Fechamento de Horas', route: '/rh/fechamento-horas' },
      { label: 'Remanejamentos', route: '/rh/remanejamentos' },
      { label: 'Ocorrências', route: '/rh/ocorrencias' }
    ]
  },
  {
    id: 'comercial',
    title: 'Comercial & Vendas',
    category: 'comercial',
    keywords: ['comercial', 'vendas', 'venda', 'lead', 'leads', 'proposta', 'propostas', 'orcamento', 'orçamento', 'contrato', 'crm', 'prospeccao', 'prospecção', 'cliente', 'clientes', 'pipeline'],
    objetivo: 'gerenciar o funil comercial: do lead à proposta, orçamento e contrato.',
    steps: [
      'Acesse Comercial & Vendas > Leads para cadastrar potenciais clientes.',
      'Organize o funil no CRM Comercial (pipeline kanban).',
      'Crie Propostas com simulação de custos e exportação em PDF/Excel.',
      'Registre Orçamentos e formalize Contratos com clientes fechados.',
      'Use Prospecção para acompanhar abordagens em andamento.'
    ],
    resultado: 'Todo o processo comercial fica rastreado do primeiro contato até o contrato assinado.',
    dica: 'Mantenha o CRM sempre atualizado — leads parados há muito tempo perdem temperatura.',
    route: '/propostas',
    routeLabel: 'Abrir Propostas',
    subitems: [
      { label: 'Leads', route: '/leads' },
      { label: 'CRM Comercial', route: '/crm' },
      { label: 'Orçamentos', route: '/orcamentos' },
      { label: 'Contratos', route: '/contratos' },
      { label: 'Clientes', route: '/clientes' },
      { label: 'Prospecção', route: '/prospeccao' }
    ]
  },
  {
    id: 'estoque',
    title: 'Estoque & Almoxarifado',
    category: 'estoque',
    keywords: ['estoque', 'almoxarifado', 'produto', 'produtos', 'inventario', 'inventário', 'requisicao', 'requisição', 'fornecedor', 'cotacao', 'cotação', 'material'],
    objetivo: 'controlar produtos, movimentações e requisições do estoque.',
    steps: [
      'Acesse Estoque & Almoxarifado > Estoque Simplificado para a visão geral.',
      'Cadastre produtos com código, unidade e níveis mínimo/máximo.',
      'Registre entradas e saídas nas movimentações.',
      'Abra Requisições & 3 Cotações para pedidos internos com comparação de fornecedores.',
      'Acompanhe alertas de estoque baixo.'
    ],
    resultado: 'Os saldos de estoque ficam atualizados e os pedidos seguem fluxo de cotação e aprovação.',
    dica: 'Use a classificação ABC para priorizar os itens mais críticos do inventário.',
    route: '/estoque-simplificado',
    routeLabel: 'Abrir Estoque',
    subitems: [
      { label: 'Requisições & 3 Cotações', route: '/almoxarifado/requisicoes' },
      { label: 'Relatórios de Estoque', route: '/estoque/relatorios' },
      { label: 'Fornecedores', route: '/estoque/fornecedores' }
    ]
  },
  {
    id: 'compras',
    title: 'Compras & Suprimentos',
    category: 'compras',
    keywords: ['compra', 'compras', 'solicitacao', 'solicitação', 'aprovacao', 'aprovação', 'pedido', 'fornecedor', 'suprimentos'],
    objetivo: 'gerenciar o ciclo de compras: solicitação, cotação, aprovação e pedido.',
    steps: [
      'Acesse Compras & Suprimentos > Solicitações e crie a solicitação de compra.',
      'Realize as cotações comparando fornecedores em Cotações.',
      'Envie para aprovação e acompanhe em Aprovações.',
      'Após aprovado, formalize o pedido e registre o recebimento.'
    ],
    resultado: 'O ciclo de compras fica completo com trilha de auditoria da solicitação ao recebimento.',
    dica: 'Mantenha justificativas claras nas solicitações — isso agiliza a análise dos aprovadores.',
    route: '/compras',
    routeLabel: 'Abrir Compras',
    subitems: [
      { label: 'Solicitações', route: '/compras/solicitacoes' },
      { label: 'Aprovações', route: '/compras/aprovacoes' },
      { label: 'Cotações', route: '/compras/cotacoes' },
      { label: 'Relatórios', route: '/compras/relatorios' }
    ]
  },
  {
    id: 'chat-interno',
    title: 'Comunicação Interna (Chat e Mensagens)',
    category: 'comunicacao',
    keywords: ['chat', 'mensagem', 'mensagens', 'conversa', 'comunicacao interna', 'comunicação interna', 'caixa de entrada', 'grupo de mensagens'],
    objetivo: 'comunicar-se com a equipe pelo chat e mensagens internas.',
    steps: [
      'Acesse Comunicação Interna > Chat Interno para conversas em tempo real.',
      'Use Enviar Mensagens para comunicados diretos.',
      'Crie Grupos de Mensagens para discussões por projeto ou setor.',
      'O badge vermelho no botão Chat da barra superior indica mensagens não lidas.'
    ],
    resultado: 'As comunicações da equipe ficam organizadas com histórico e status de leitura.',
    dica: 'Use grupos para organizar discussões por projeto e reduzir ruído nas conversas diretas.',
    route: '/chat-interno',
    routeLabel: 'Abrir Chat Interno',
    subitems: [
      { label: 'Enviar Mensagens', route: '/mensagens' },
      { label: 'Grupos de Mensagens', route: '/gestao-mensagens/grupos' },
      { label: 'Notificações', route: '/gestao-mensagens/notificacoes' }
    ]
  },
  {
    id: 'atendimento',
    title: 'Atendimento (Tickets, WhatsApp e Chatbot)',
    category: 'atendimento',
    keywords: ['atendimento', 'ticket', 'tickets', 'whatsapp', 'chatbot', 'suporte', 'ocorrencia de atendimento', 'historico de conversas', 'agente', 'metricas de atendimento'],
    objetivo: 'gerenciar o atendimento ao cliente: tickets, conversas de WhatsApp e chatbot.',
    steps: [
      'Acesse Atendimento > Gestão de Atendimento para o dashboard.',
      'Acompanhe Tickets & Ocorrências abertos pela equipe.',
      'Configure o Chatbot & WhatsApp (mensagem de boas-vindas, horários, respostas automáticas).',
      'Gerencie a equipe em Gerenciar Agentes e acompanhe desempenho em Métricas.'
    ],
    resultado: 'As mensagens recebidas viram tickets organizados com triagem e a equipe assume os atendimentos.',
    dica: 'Configure o chatbot para triagem inicial — ele filtra e organiza antes de chegar ao atendente.',
    route: '/gestao-atendimento/dashboard',
    routeLabel: 'Abrir Atendimento',
    subitems: [
      { label: 'Tickets & Ocorrências', route: '/gestao-atendimento/tickets' },
      { label: 'Histórico de Conversas', route: '/gestao-atendimento/historico' },
      { label: 'Gerenciar Agentes', route: '/gestao-atendimento/agentes' },
      { label: 'Métricas de Atendimento', route: '/gestao-atendimento/metricas' },
      { label: 'Chatbot & WhatsApp', route: '/gestao-atendimento/chatbot' }
    ]
  },
  {
    id: 'trafego',
    title: 'Gestão de Tráfego',
    category: 'trafego',
    keywords: ['trafego', 'tráfego', 'fretamento', 'rota', 'rotas', 'linha', 'linhas', 'viagem', 'viagens', 'motorista', 'passageiro', 'atribuicao', 'atribuição', 'turno', 'horario', 'horário'],
    objetivo: 'planejar e executar a operação de tráfego: linhas, viagens, motoristas e passageiros.',
    steps: [
      'Acesse Gestão de Tráfego > Gestão de Tráfego para o painel.',
      'Cadastre Linhas (rotas) em Linhas com pontos e horários.',
      'Programe viagens em Gestão de Viagens com data, linha e veículo.',
      'Atribua veículos e motoristas em Atribuições de Transportes.',
      'Gerencie passageiros e turnos nas seções correspondentes.'
    ],
    resultado: 'A operação de tráfego fica planejada e executada com veículos e motoristas corretamente atribuídos.',
    dica: 'O motorista recebe os dados da viagem no Portal do Motorista automaticamente após a atribuição.',
    route: '/fretamento',
    routeLabel: 'Abrir Gestão de Tráfego',
    subitems: [
      { label: 'Linhas', route: '/fretamento/rotas' },
      { label: 'Gestão de Viagens', route: '/fretamento/viagens' },
      { label: 'Atribuições', route: '/fretamento/atribuicoes' },
      { label: 'Motoristas', route: '/motoristas' },
      { label: 'Passageiros', route: '/fretamento/passageiros' },
      { label: 'Turnos', route: '/fretamento/turnos' }
    ]
  },
  {
    id: 'sistema',
    title: 'Sistema (Usuários, Grupos e Configurações)',
    category: 'sistema',
    keywords: ['sistema', 'usuario', 'usuário', 'usuarios', 'usuários', 'grupo', 'grupos', 'permissao', 'permissão', 'configuracao', 'configuração', 'backup', 'logo', 'empresa'],
    objetivo: 'configurar o sistema: usuários, grupos de permissão, logo e backup.',
    steps: [
      'Acesse Sistema > Usuários para cadastrar usuários e definir perfis.',
      'Organize permissões em Grupos (RH, Financeiro, Comercial, etc.).',
      'Em Configurações, personalize logo, dados da empresa e parâmetros gerais.',
      'Configure Backup para proteção dos dados.'
    ],
    resultado: 'O sistema fica personalizado com usuários, permissões e dados da empresa corretos.',
    warning: 'Permissões controlam o acesso a dados sensíveis — conceda apenas o necessário para cada perfil (princípio do menor privilégio).',
    route: '/configuracoes',
    routeLabel: 'Abrir Configurações',
    subitems: [
      { label: 'Usuários', route: '/usuarios' },
      { label: 'Grupos', route: '/grupos' },
      { label: 'Backup', route: '/configuracoes/backup' },
      { label: 'Gestão de Atividades', route: '/atividades' }
    ]
  },
  {
    id: 'email',
    title: 'Gestão de E-mails',
    category: 'sistema',
    keywords: ['email', 'e-mail', 'emails', 'e-mails', 'correio', 'caixa postal', 'configuracao de email'],
    objetivo: 'gerenciar e-mails corporativos integrados ao sistema.',
    steps: [
      'Acesse E-mails > Gestão de E-mails.',
      'Consulte e responda mensagens diretamente no sistema.',
      'Administradores configuram contas em Configurações de E-mail.'
    ],
    resultado: 'A comunicação por e-mail da empresa fica centralizada no sistema.',
    route: '/email',
    routeLabel: 'Abrir E-mails'
  },
  {
    id: 'suporte-humano',
    title: 'Falar com o Suporte Humano',
    category: 'sistema',
    keywords: ['atendente', 'humano', 'suporte humano', 'falar com alguem', 'falar com alguém', 'abrir chamado', 'telefone', 'whatsapp do suporte', 'escalar'],
    objetivo: 'encaminhar você para o atendimento humano quando a dúvida exige análise específica.',
    steps: [
      'Clique em "Ajuda" na barra superior para abrir a Central de Ajuda e Suporte.',
      'Na aba "Canais de Suporte", inicie uma conversa no WhatsApp do suporte (dias úteis, das 08h às 18h).',
      'Ou abra um ticket em Atendimento > Tickets & Ocorrências para registro formal.',
      'Descreva o que você estava fazendo, a mensagem exata do erro (se houver) e o resultado esperado.'
    ],
    resultado: 'Sua solicitação fica registrada e a equipe técnica dá retorno pelo canal escolhido.',
    dica: 'Quanto mais detalhada a descrição (passo a passo + mensagem de erro), mais rápido o atendimento.',
    route: '/gestao-atendimento/tickets',
    routeLabel: 'Ir para Tickets'
  },
  {
    id: 'erros',
    title: 'Erros e Problemas no Sistema',
    category: 'sistema',
    keywords: ['erro', 'erros', 'bug', 'travou', 'trava', 'falha', 'nao funciona', 'não funciona', 'problema', 'lentidao', 'lentidão', 'carregando', 'mensagem de erro'],
    objetivo: 'ajudar a investigar erros e comportamentos inesperados no sistema.',
    steps: [
      'Me informe: em qual módulo/tela ocorreu o erro, a mensagem exata (se houver) e o que você estava tentando fazer.',
      'Testes seguros: recarregue a página (F5), verifique sua conexão e abra a tela em uma aba anônima.',
      'Se o erro persistir, abra um ticket em Atendimento > Tickets & Ocorrências com essas informações.'
    ],
    resultado: 'A causa mais comum (conflito de sessão, conexão ou dado inválido) é identificada e o ticket fica registrado para investigação técnica se necessário.',
    warning: 'Nunca declarei que corrigi um erro sem confirmação — se precisar de investigação técnica, o ticket será encaminhado ao suporte humano.',
    route: '/gestao-atendimento/tickets',
    routeLabel: 'Abrir Ticket'
  },
  {
    id: 'login-senha',
    title: 'Login, Senha e Acesso',
    category: 'sistema',
    keywords: ['login', 'senha', 'entrar', 'esqueci', 'acesso', 'autenticacao', 'autenticação', '2fa', 'duas fatores', 'bloqueado', 'primeiro acesso', 'trocar senha'],
    objetivo: 'resolver problemas de login, senha e acesso ao sistema.',
    steps: [
      'Verifique se o usuário e a senha estão corretos (observe o Caps Lock).',
      'Use "Esqueci minha senha" na tela de login para redefinir o acesso pelo e-mail cadastrado.',
      'No primeiro acesso, o sistema orienta a troca de senha e a ativação da verificação em duas etapas (2FA).',
      'Se o problema persistir, fale com o administrador do sistema da sua empresa ou com o suporte.'
    ],
    resultado: 'Seu acesso é restaurado com uma nova senha definida por você.',
    warning: 'O suporte NUNCA solicita sua senha. Não compartilhe suas credenciais com ninguém.'
  }
];

export const BILI_FLUX_GREETING =
  'Olá! Eu sou o BiliFlux, assistente virtual oficial do FluxBus.\n\nConheço todo o sistema: frota, manutenção, financeiro, RH, comercial, estoque, compras, tráfego, atendimento e muito mais. Posso te orientar passo a passo em qualquer rotina.\n\nComo posso te ajudar hoje?';

export const BILI_FLUX_FALLBACK =
  'Ainda não tenho uma resposta documentada para essa dúvida, e prefiro não inventar informações para te orientar.\n\nO que posso sugerir:\n1. Reformule usando o nome do menu (ex: "propostas", "O.S.", "férias", "chatbot", "conciliação");\n2. Pergunte "Quais módulos o sistema tem?" para ver tudo que eu conheço;\n3. Consulte a Central de Ajuda (botão "Ajuda" na barra superior);\n4. Fale com o suporte humano para uma resposta confirmada.\n\nPosso ajudar com mais alguma coisa?';

export const BILI_FLUX_MODULES_OVERVIEW = {
  keywords: [
    'modulos',
    'módulos',
    'o que o sistema faz',
    'o que voce sabe',
    'o que você sabe',
    'menu',
    'menus',
    'lista de modulos',
    'funcionalidades',
    'sobre o sistema',
    'quais módulos',
    'quais modulos'
  ],
  response:
    'Conheço todo o sistema FluxBus! Aqui estão os módulos que posso te orientar:\n\n' +
    '🚌 Manutenção & Frota — cadastro de veículos, O.S., abastecimento, pneus, garagens, checklists, limpeza, CFME\n' +
    '🎫 Gestão de Passagens — venda, mapa de poltronas, programação de viagens\n' +
    '💰 Módulo Financeiro — contas a pagar/receber, fluxo de caixa, conciliação, relatórios\n' +
    '🧾 Módulo Fiscal — documentos fiscais, importação de XML/PDF, impostos\n' +
    '🛡️ Operacional — serviços, equipamentos, escalas, ocorrências, rondas, parte diário\n' +
    '👥 Recursos Humanos — funcionários, vagas, benefícios, treinamentos\n' +
    '🦺 SST — EPIs, exames médicos, acidentes, CIPA\n' +
    '📋 Departamento Pessoal — admissão/demissão, férias, ponto eletrônico, fechamento de horas\n' +
    '💼 Comercial — leads, CRM, propostas, orçamentos, contratos\n' +
    '📦 Estoque & Almoxarifado — produtos, movimentações, requisições, cotações\n' +
    '🛒 Compras — solicitações, cotações, aprovações\n' +
    '💬 Comunicação Interna — chat, mensagens, grupos\n' +
    '🎧 Atendimento — tickets, WhatsApp, chatbot, métricas\n' +
    '🗺️ Gestão de Tráfego — linhas, viagens, motoristas, atribuições\n' +
    '⚙️ Sistema — usuários, grupos, configurações, backup\n\n' +
    'É só perguntar, por exemplo: "Como abro uma O.S.?" ou "Como cadastro um funcionário?".'
};
