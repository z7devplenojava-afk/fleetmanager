"""
FleetManager Agent System - Schema Knowledge Module
===================================================
Seeds the RAG system with database schema information,
business rules, and operational knowledge extracted from
the FleetManager project codebase.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from config import config
from core.agent_logger import agent_logger


class SchemaKnowledge:
    """Seeds the RAG with structured knowledge about FleetManager."""

    def __init__(self, rag_system):
        self.rag = rag_system
        self.log = agent_logger.get_logger("schema-knowledge")

    def seed_all(self) -> int:
        """Seed all knowledge domains. Returns total docs added."""
        total = 0

        # 1. Database Schemas
        total += len(self.seed_database_schemas())
        self.log.info(f"  ├─ Database schemas seeded")

        # 2. Business Rules
        total += len(self.seed_business_rules())

        # 3. HR Domain Knowledge
        total += len(self.seed_hr_knowledge())

        # 4. Time Record Knowledge
        total += len(self.seed_time_record_knowledge())

        # 5. Financial Knowledge
        total += len(self.seed_financial_knowledge())

        # 6. Document Knowledge
        total += len(self.seed_document_knowledge())

        # 7. Fleet Knowledge
        total += len(self.seed_fleet_knowledge())

        # 8. SST / Safety Knowledge
        total += len(self.seed_sst_knowledge())

        # 9. Notification & Alert Rules
        total += len(self.seed_alert_rules())

        self.log.info(f"  Total de documentos semeados: {total}")
        return total

    # ── Database Schemas ──────────────────────────────────────

    def seed_database_schemas(self) -> int:
        """Seed table schemas and their relationships."""
        schemas = [
            {
                "content": """
TABELA: employees (funcionários)
Descrição: Armazena dados completos dos funcionários da empresa.
Colunas principais:
- id (UUID, PK): Identificador único
- user_id (UUID, FK → users.id): Vínculo com usuário do sistema
- position_id (UUID, FK → positions.id): Cargo do funcionário
- unit_id (UUID, FK → units.id): Unidade/lotação
- company_id (UUID, FK → companies.id): Empresa (multi-tenant)
- department_id (UUID, FK → departments.id): Departamento
- name (VARCHAR): Nome completo
- document (VARCHAR): CPF
- registration_number (VARCHAR): Matrícula
- birth_date (DATE): Data de nascimento
- hire_date (DATE): Data de admissão
- termination_date (DATE): Data de demissão
- status (VARCHAR): ACTIVE, INACTIVE, ON_LEAVE, TERMINATED
- phone (VARCHAR): Telefone
- email (VARCHAR): E-mail
- cnh_number (VARCHAR): Número da CNH
- cnh_expiration_date (DATE): Validade da CNH
- cnh_category (VARCHAR): Categoria (A, B, C, D, E)
- ctps (VARCHAR): Número da CTPS
- pis (VARCHAR): Número do PIS
- salario (NUMERIC): Salário
- cbo (VARCHAR): CBO (Classificação Brasileira de Ocupações)
- marital_status (VARCHAR): Estado civil
- nationality (VARCHAR): Nacionalidade
- grau_instrucao (VARCHAR): Grau de instrução
- nome_pai (VARCHAR): Nome do pai
- nome_mae (VARCHAR): Nome da mãe
- address (VARCHAR): Endereço completo
- rg (VARCHAR): RG
- fgts_optante (BOOLEAN): Optante do FGTS
- created_at, updated_at (TIMESTAMP): Controle de versão

Regras de negócio:
- registration_number deve ser único por company
- Se status = TERMINATED, termination_date é obrigatória
- Campo email é único no sistema
- Funcionário só pode ter um user_id ativo
""",
                "metadata": {"type": "schema", "table": "employees", "module": "rh"},
                "id": "schema_employees",
            },
            {
                "content": """
TABELA: time_records (registros de ponto eletrônico)
Descrição: Registra batidas de ponto dos funcionários (entrada, saída, almoço).
Colunas principais:
- id (UUID, PK)
- employee_id (UUID, FK → employees.id): Funcionário
- work_post_id (UUID, FK → work_posts.id): Posto de trabalho
- record_type (VARCHAR): ENTRADA, SAIDA_ALMOCO, RETORNO_ALMOCO, SAIDA
- recorded_at (TIMESTAMP): Data/hora do registro
- location (VARCHAR): Localização textual
- latitude (DOUBLE): Latitude GPS
- longitude (DOUBLE): Longitude GPS
- ip_address (VARCHAR): IP do dispositivo
- qr_code_used (VARCHAR): QR Code escaneado
- photo_url (VARCHAR): Foto do registro
- is_manual (BOOLEAN): Se foi registro manual
- origin (VARCHAR): MOBILE_APP, WEB, BIOMETRY, MANUAL_ADJUSTMENT
- status (VARCHAR): PENDING, APPROVED, REJECTED
- justification (TEXT): Justificativa
- approved_by_id (UUID): Quem aprovou
- approved_at (TIMESTAMP): Quando aprovou
- company_id (UUID, FK → companies.id): Empresa (multi-tenant)
- created_at, updated_at (TIMESTAMP)

Regras de negócio:
- A sequência de tipos deve ser: ENTRADA → SAIDA_ALMOCO → RETORNO_ALMOCO → SAIDA
- Não pode ter duas ENTRADAS no mesmo dia sem uma SAIDA entre elas
- recorded_at deve ser no mesmo dia para formar uma jornada completa
- status padrão é APPROVED para registros automáticos
""",
                "metadata": {"type": "schema", "table": "time_records", "module": "ponto"},
                "id": "schema_time_records",
            },
            {
                "content": """
TABELA: accounts_receivable (contas a receber)
Descrição: Gerencia contas a receber de clientes.
Colunas principais:
- id (UUID, PK)
- client_id (UUID, FK → clients.id): Cliente
- invoice_number (VARCHAR): Número da fatura
- measurement_number (VARCHAR): Número da medição
- description (VARCHAR): Descrição
- amount (DECIMAL): Valor total
- amount_paid (DECIMAL): Valor pago
- issue_date (DATE): Data de emissão
- due_date (DATE): Data de vencimento
- payment_date (DATE): Data de pagamento
- status (VARCHAR): PENDING, PAID, OVERDUE, CANCELLED
- category (VARCHAR): SERVICE, PRODUCT, OTHER
- payment_method (VARCHAR): PIX, TRANSFER, CASH, CHECK
- overdue_days (INTEGER): Dias em atraso
- late_fee (DECIMAL): Taxa de atraso
- late_penalty (DECIMAL): Multa por atraso
- company_id (UUID, FK → companies.id): Empresa (multi-tenant)

Regras de negócio:
- Se due_date < hoje e status = PENDING, deve marcar como OVERDUE
- amount_paid não pode exceder amount
- overdue_days é calculado automaticamente
""",
                "metadata": {"type": "schema", "table": "accounts_receivable", "module": "financeiro"},
                "id": "schema_accounts_receivable",
            },
            {
                "content": """
TABELA: unified_documents (documentos unificados)
Descrição: Documentos processados e unificados do sistema (holerites, contratos, etc).
Colunas principais:
- id (UUID, PK)
- employee_id (UUID, FK → employees.id): Funcionário
- file_name (VARCHAR): Nome do arquivo
- file_type (VARCHAR): Tipo (PDF, DOC, XLS, IMG)
- file_size (BIGINT): Tamanho em bytes
- document_type (VARCHAR): HOLERITE, CONTRATO, ADMISSAO, DEMISSAO, OUTRO
- reference_month (VARCHAR): Mês referência (MM/YYYY)
- status (VARCHAR): PENDING, PROCESSED, ERROR
- storage_path (VARCHAR): Caminho no storage
- checksum (VARCHAR): Hash de integridade
- employee_name (VARCHAR): Nome do funcionário
- cpf (VARCHAR): CPF do funcionário
- company_id (UUID): Empresa
- created_at, updated_at (TIMESTAMP)
""",
                "metadata": {"type": "schema", "table": "unified_documents", "module": "documentos"},
                "id": "schema_unified_documents",
            },
            {
                "content": """
TABELA: payslips (holerites)
Descrição: Holerites processados e enviados aos funcionários.
Colunas principais:
- id (UUID, PK)
- employee_name (VARCHAR): Nome do funcionário
- cpf (VARCHAR): CPF
- month (VARCHAR): Mês
- year (VARCHAR): Ano
- file_name (VARCHAR): Nome do arquivo
- processed_at (TIMESTAMP): Data de processamento
- company_id (UUID): Empresa
""",
                "metadata": {"type": "schema", "table": "payslips", "module": "rh"},
                "id": "schema_payslips",
            },
            {
                "content": """
TABELA: users (usuários do sistema)
Descrição: Usuários que acessam o sistema FleetManager.
Colunas principais:
- id (UUID, PK)
- username (VARCHAR): Nome de usuário (único)
- password (VARCHAR): Hash da senha
- email (VARCHAR): E-mail (único)
- name (VARCHAR): Nome completo
- role (VARCHAR): SUPER_ADMIN, ADMIN, MANAGER, COLLABORADOR, VIGILANTE, MOTORISTA
- status (VARCHAR): ACTIVE, INACTIVE, BLOCKED
- active (BOOLEAN): Se está ativo
- company_id (UUID, FK → companies.id): Empresa (multi-tenant)
- first_access (BOOLEAN): Se é primeiro acesso
- two_factor_enabled (BOOLEAN): Se 2FA está ativo
- created_at, updated_at (TIMESTAMP)
""",
                "metadata": {"type": "schema", "table": "users", "module": "admin"},
                "id": "schema_users",
            },
        ]
        return self.rag.add_documents(schemas)

    # ── Business Rules ────────────────────────────────────────

    def seed_business_rules(self) -> int:
        """Seed general business rules for the FleetManager system."""
        rules = [
            {
                "content": """
REGRAS GERAIS DO SISTEMA FLEETMANAGER:
1. Multi-tenant: Cada empresa (company) tem seus próprios dados isolados via company_id
2. Todas as tabelas principais têm company_id para isolamento de dados
3. O tenant é extraído do JWT do usuário logado
4. SUPER_ADMIN pode ver dados de todas as empresas
5. ADMIN gerencia apenas dados da própria empresa
6. COLLABORADOR vê apenas seus próprios dados
7. Campos de data seguem o formato ISO (YYYY-MM-DD)
8. Valores monetários são DECIMAL(15,2) no banco
9. CPF é armazenado como VARCHAR(14) com formatação (XXX.XXX.XXX-XX)
10. Telefones seguem o formato +55 (XX) XXXXX-XXXX
""",
                "metadata": {"type": "rule", "module": "geral"},
                "id": "rule_geral_001",
            },
        ]
        return self.rag.add_documents(rules)

    # ── HR Knowledge ──────────────────────────────────────────

    def seed_hr_knowledge(self) -> int:
        """Seed RH / Human Resources domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO RH:
1. Documentos com validade expirada:
   - CNH: cnh_expiration_date. Categorias A, B, C, D, E
   - Documentos pessoais: RG, CTPS
   - Certificações: employee_certifications
   - Exames médicos (ASO): exame_medico_data em employees
2. Férias: programadas em vacations.
   - A cada 12 meses trabalhados, 30 dias de férias
   - Férias vencidas > 12 meses geram multa para empresa
3. Prazo de experiência:
   - probation_end_date em employees
   - Geralmente 45 ou 90 dias, podendo ser prorrogado
4. FGTS: fgts_optante define se funcionário optou pelo FGTS
5. PIS: número do PIS e data de cadastro
6. Salário: salario (DECIMAL) e salario_por_extenso
7. Dependentes: dependents vinculados ao employee
8. EPIs: epis com issue_date e expiration_date
""",
                "metadata": {"type": "knowledge", "module": "rh"},
                "id": "knowledge_rh_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_time_record_knowledge(self) -> int:
        """Seed Ponto Eletrônico domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO PONTO ELETRÔNICO:
1. Tipos de registro: ENTRADA, SAIDA_ALMOCO, RETORNO_ALMOCO, SAIDA
2. Sequência obrigatória: ENTRADA → SAIDA_ALMOCO → RETORNO_ALMOCO → SAIDA
3. Banco de horas (bank_hours): crédito e débito de horas
4. Horas extras (overtime): calculadas acima da jornada padrão (8h/dia)
5. WorkJourneyConfig: configurações de jornada por empresa (carga horária, tolerância)
6. QRCodeWorkPost: QR Codes nos postos para registro via app
7. TimeBank: saldo de banco de horas do funcionário
8. Justificativas podem ser submetidas para registros PENDING
9. Aprovação em lote: batch approve/reject
10. Relatório consolidado: PDF e Excel disponíveis
""",
                "metadata": {"type": "knowledge", "module": "ponto"},
                "id": "knowledge_ponto_001",
            },
            {
                "content": """
CÁLCULO DE HORAS TRABALHADAS:
Para calcular horas trabalhadas em um dia:
1. Localizar registro ENTRADA (mais cedo)
2. Localizar registro SAIDA (mais tarde)
3. Diferença = SAIDA - ENTRADA
4. Subtrair intervalo de almoço (SAIDA_ALMOCO até RETORNO_ALMOCO)
5. Jornada padrão: 8 horas diárias (configurável por empresa)
6. Horas extras = horas trabalhadas - jornada padrão (se positivo)
7. Atraso: se entrada > horário início + tolerância (padrão 10 min)
""",
                "metadata": {"type": "calculation", "module": "ponto"},
                "id": "calc_ponto_001",
            },
            {
                "content": """
REGRAS DO BANCO DE HORAS:
1. Horas extras viram crédito no banco de horas
2. Horas não trabalhadas viram débito
3. Saldo pode ser utilizado para folgas ou compensações
4. Limite máximo de crédito: 40 horas (configurável)
5. Limite máximo de débito: -20 horas (configurável)
6. Banco de horas deve ser zerado anualmente
7. Transações são registradas em bank_hours_transactions
""",
                "metadata": {"type": "rule", "module": "ponto"},
                "id": "rule_ponto_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_financial_knowledge(self) -> int:
        """Seed Financial domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO FINANCEIRO:
1. Contas a receber (accounts_receivable): faturas de clientes
2. Contas a pagar: fornecedores e despesas
3. Conciliação bancária: bank_reconciliation
4. Fluxo de caixa: projeção de entradas e saídas
5. Multa por atraso: 2% do valor + juros de 0,033% ao dia
6. Status possíveis: PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID
7. Métodos de pagamento: PIX, TRANSFER, CASH, CHECK, BOLETO, CREDIT_CARD, DEBIT_CARD
8. Categorias: SERVICE, PRODUCT, TAX, FEE, OTHER
9. Relatórios: conciliação bancária, fluxo de caixa, contas a receber/pagar
""",
                "metadata": {"type": "knowledge", "module": "financeiro"},
                "id": "knowledge_fin_001",
            },
            {
                "content": """
CÁLCULO DE JUROS E MULTAS (CONTAS A RECEBER):
1. Atraso = data_hoje - due_date (dias corridos)
2. Multa = amount * 2% (aplicada uma única vez)
3. Juros = amount * 0,033% * dias_em_atraso
4. Valor total devido = amount + multa + juros
5. Se já houver amount_paid > 0, calcular sobre o saldo devedor
6. Exemplo: conta de R$ 1.000,00 com 10 dias de atraso
   Multa: R$ 20,00 | Juros: R$ 3,30 | Total: R$ 1.023,30
""",
                "metadata": {"type": "calculation", "module": "financeiro"},
                "id": "calc_fin_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_document_knowledge(self) -> int:
        """Seed Document management domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO DE DOCUMENTOS:
1. Tipos de documentos: HOLERITE, CONTRATO, ADMISSAO, DEMISSAO, TERMO, RECIBO, OUTRO
2. Processamento: upload → OCR → extração de dados → classificação → arquivamento
3. OCR usa Tesseract e/ou Google Gemini para extração
4. Documentos unificados são armazenados em unified_documents
5. Holerites são processados e enviados por WhatsApp e/ou e-mail
6. O sistema gera minio/object storage para arquivos grandes
7. Cada documento tem checksum SHA-256 para integridade
8. Documentos podem ser agrupados por funcionário e mês de referência
""",
                "metadata": {"type": "knowledge", "module": "documentos"},
                "id": "knowledge_doc_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_fleet_knowledge(self) -> int:
        """Seed Fleet domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO FROTA:
1. Veículos: dados completos (placa, modelo, ano, renavam, chassi)
2. Abastecimento: fuel_records com km, litros, valor, tipo combustível
3. Bombas de combustível: fuel_pumps com leitura inicial/final
4. Manutenção: vehicle_maintenances, maintenance_plans
5. Pneus: tires com movimentações (tire_movements)
6. Multas: fines vinculados a veículos e motoristas
7. KM Control: mileage_records para controle de quilometragem
8. Checklist de portaria: vehicle_gate_checklists
9. Ordens de serviço: fleet_work_orders
""",
                "metadata": {"type": "knowledge", "module": "frota"},
                "id": "knowledge_fleet_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_sst_knowledge(self) -> int:
        """Seed SST / Safety domain knowledge."""
        knowledge = [
            {
                "content": """
CONHECIMENTO DO MÓDULO SST (Segurança e Saúde no Trabalho):
1. EPIs: equipamentos de proteção individual com CA (certificado de aprovação)
2. EPI Delivery: controle de entrega com assinatura do funcionário
3. Treinamentos: sst_trainings com periodicidade e renovação
4. Acidentes: accident_records com análise de causa raiz
5. Exames médicos: medical_exams com tipo (ADMISSIONAL, PERIODICO, DEMISSIONAL, RETORNO)
6. ASO: Atestado de Saúde Ocupacional vinculado ao funcionário
7. CIPA: comissão interna de prevenção de acidentes
8. Riscos ocupacionais: occupational_risk_types
9. Ordens de serviço SST: ordem_de_servico_sst
""",
                "metadata": {"type": "knowledge", "module": "sst"},
                "id": "knowledge_sst_001",
            },
        ]
        return self.rag.add_documents(knowledge)

    def seed_alert_rules(self) -> int:
        """Seed alert rules for proactive notifications."""
        rules = [
            {
                "content": """
REGRAS DE ALERTA PROGRAMADO:
1. RH:
   - CNH vencendo em 30 dias → WARNING
   - CNH vencida → CRITICAL
   - Férias vencendo em 60 dias → WARNING
   - Férias vencidas → CRITICAL
   - Prazo de experiência terminando em 15 dias → WARNING
   - Documento do funcionário expirando → WARNING
   - Aniversário do funcionário → INFO

2. Ponto Eletrônico:
   - Funcionário sem registro no dia → WARNING (após horário limite)
   - Jornada incompleta (sem saida) → WARNING
   - Banco de horas com crédito > 40h → WARNING
   - Banco de horas com débito > 10h → CRITICAL
   - Horas extras não aprovadas há 7+ dias → WARNING

3. Financeiro:
   - Conta a receber vencendo em 5 dias → WARNING
   - Conta a receber vencida → CRITICAL
   - Conciliação bancária pendente há 30+ dias → WARNING
   - Diferença em conciliação bancária → CRITICAL

4. Documentos:
   - Holerites não enviados do mês → WARNING
   - Documentos sem funcionário vinculado → WARNING
   - OCR falhou → CRITICAL
   - Processamento de lote parado → WARNING
""",
                "metadata": {"type": "alert_rule", "module": "geral"},
                "id": "alert_rules_001",
            },
        ]
        return self.rag.add_documents(rules)
