# FleetManager Agent System 🤖

Sistema inteligente de **agentes Python** para monitoramento, correção e alertas do FleetManager.

## 📋 Arquitetura

```
agents/
├── config.py                  # Configuração central (DB, RAG, notificações)
├── orchestrator.py            # Orquestrador central (coordenador)
├── run_agents.py              # Entry point principal
├── requirements.txt           # Dependências Python
├── .env.template              # Template de variáveis de ambiente
├── README.md                  # Esta documentação
│
├── core/                      # Núcleo do sistema
│   ├── __init__.py
│   ├── base_agent.py          # Classe base para todos os agentes
│   ├── agent_logger.py        # Logger estruturado (loguru)
│   └── agent_notifier.py      # Notificador multi-canal
│
├── rag/                       # Sistema RAG (Retrieval Augmented Generation)
│   ├── __init__.py
│   ├── rag_system.py          # ChromaDB vector store
│   └── schema_knowledge.py    # Conhecimento do domínio FleetManager
│
├── agents/                    # Agentes de módulo
│   ├── __init__.py            # Registry de agentes
│   ├── agent_rh.py            # RH - Funcionários, documentos, férias
│   ├── agent_ponto.py         # Ponto Eletrônico
│   ├── agent_financeiro.py    # Financeiro
│   └── agent_documentos.py    # Documentos
│
├── data/                      # Dados persistentes
│   └── chromadb/              # Banco vetorial ChromaDB
│
└── logs/                      # Logs do sistema
    └── fleetmanager_*.log
```

## 🚀 Instalação

### 1. Clone o repositório
```bash
cd fleetmanager
```

### 2. Crie o ambiente virtual
```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
# ou
venv\Scripts\activate      # Windows
```

### 3. Instale as dependências
```bash
cd agents
pip install -r requirements.txt
```

### 4. Configure o ambiente
```bash
cp .env.template .env
# Edite o .env com suas configurações de banco de dados
```

## 🎮 Uso

### Verificação única (todos os agentes)
```bash
python run_agents.py --check all
```

### Verificação de módulo específico
```bash
python run_agents.py --check rh
python run_agents.py --check ponto
python run_agents.py --check financeiro
python run_agents.py --check documentos
```

### Relatório completo em JSON
```bash
python run_agents.py --check all --report
```

### Consultar a base de conhecimento RAG
```bash
python run_agents.py --query "CNH vencida"
python run_agents.py --query "holerites não enviados"
python run_agents.py --query "contas vencidas"
```

### Status do sistema
```bash
python run_agents.py --status
```

## 📊 Módulos Implementados

### 1. RH Agent 👥
- ✅ Verificação de vencimento de CNH (30 dias de alerta)
- ✅ Monitoramento de período de experiência
- ✅ Acompanhamento de férias programadas
- ✅ Consistência de dados (funcionários sem cargo/unidade)
- ✅ Alertas de aniversariantes

### 2. Ponto Eletrônico Agent ⏰
- ✅ Jornadas incompletas (entrada sem saída)
- ✅ Horas extras pendentes de aprovação (>7 dias)
- ✅ Banco de horas com crédito/débito excessivo
- ✅ Funcionários sem registro no dia
- ✅ Registros duplicados

### 3. Financeiro Agent 💰
- ✅ Contas a receber vencidas (com cálculo de multa 2% + juros 0,033% a.d.)
- ✅ Vencimentos nos próximos 5 dias
- ✅ Conciliação bancária pendente
- ✅ Projeção de fluxo de caixa

### 4. Documentos Agent 📄
- ✅ Holerites não enviados do mês
- ✅ Documentos com erro de processamento
- ✅ Documentos órfãos (sem vínculo com funcionário)
- ✅ Jobs de processamento travados

## 🔔 Canais de Notificação

O sistema suporta múltiplos canais de notificação:

- **Console**: Log colorido (sempre ativo)
- **Email**: Via SMTP (configurável)
- **Webhook**: POST HTTP (configurável)
- **Slack**: Webhook do Slack (configurável)

## 🔧 Próximos Módulos (futuro)

Agentes planejados:

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Frota | ⏳ | Abastecimento, manutenção, pneus, multas |
| SST | ⏳ | EPIs, treinamentos, acidentes, exames |
| Estoque | ⏳ | Níveis mínimos, movimentações |
| Compras | ⏳ | Cotações, pedidos, fornecedores |
| Clientes/CRM | ⏳ | Contratos, propostas, tickets |
| Rondas | ⏳ | Rondas, supervisão, checkpoints |
| WhatsApp | ⏳ | Status de envio, QR Code |
| Config/Admin | ⏳ | Usuários, permissões, empresas |
| Motoristas | ⏳ | Jornada, fretamento |
| Chat | ⏳ | Mensagens, notificações |

## 📝 Licença

Proprietário - Z7 Design
