# 📦 PRD + SDD + SPECS: MÓDULO DE ALMOXARIFADO OPERACIONAL
**FleetManager — Almoxarifado para Empresas de Transporte de Passageiros / Ônibus**

---

## 📑 ÍNDICE GERAL
1. [RESPOSTA DE ARQUITETURA: PERFORMANCE VS VELOCIDADE (OPÇÃO 1 VS OPÇÃO 2)](#1-resposta-de-arquitetura)
2. [PRD — PRODUCT REQUIREMENTS DOCUMENT](#2-prd--product-requirements-document)
   - 2.1 Visão Geral e Objetivos do Negócio
   - 2.2 Personas e Matriz de Permissões (RBAC)
   - 2.3 Requisitos Funcionais Detalhados (RF01 a RF14)
   - 2.4 Requisitos Não Funcionais (RNF01 a RNF07)
3. [SDD — SOFTWARE DESIGN DOCUMENT](#3-sdd--software-design-document)
   - 3.1 Arquitetura Monólito Modular & Comunicação por Eventos de Domínio
   - 3.2 Diagrama de Estados (Documento de Entrada, Pneu e Bateria)
   - 3.3 Modelo de Dados PostgreSQL (DDL & Migrations Flyway)
   - 3.4 Integrações com Módulos Existentes (Frota/Veículos, Financeiro, Compras)
4. [SPECS.MD — ESPECIFICAÇÃO TÉCNICA DE IMPLEMENTAÇÃO](#4-specsmd--especificacao-tecnica)
   - 4.1 Contratos REST APIs (Endpoints, Payloads e Regras)
   - 4.2 Mapa Visual do Chassi / Eixos de Ônibus (Frontend)
   - 4.3 Arquitetura de Componentes React / TypeScript
   - 4.4 Critérios de Aceite (Cenários BDD / Gherkin)
   - 4.5 Plano de Execução em Fases

---

## 1. RESPOSTA DE ARQUITETURA

### Comparativo: Evolução das Tabelas Legadas (Opção 1) vs Nova Modelagem Limpa e Especializada (Opção 2)

| Critério | Opção 1: Alterar `stock_items` existente | Opção 2: Nova Modelagem Limpa (`warehouse_*` + integração) | Vencedor |
| :--- | :--- | :--- | :--- |
| **Performance do Banco (IOPS & Memória)** | **Inferior**. Linhas largas (*wide rows*) com campos nulos de EPIs/uniformes misturados com peças/pneus. Índices maiores e fragmentados. | **Superior**. Tabelas normalizadas, B-trees compactas, tipos estritos (`UUID`, `DECIMAL`), alta densidade em buffer pool do PostgreSQL. | 🏆 **Opção 2** |
| **Velocidade de Desenvolvimento** | **Mais lenta e arriscada**. Exige múltiplos `ALTER TABLE`, migrações de dados legados, risco de regressão nos fluxos em produção de EPIs/Uniformes. | **Mais rápida**. O código novo nasce limpo, tipado e testado, sem *legacy debt* nem necessidade de compatibilizar regras antigas. | 🏆 **Opção 2** |
| **Manutenibilidade & Escalabilidade** | Código cheio de `if/else` para checar se o item é fardamento ou peça automotiva. | Separação clara de responsabilidades: Item de Almoxarifado vs Ativo Rastreável (Pneu/Bateria). | 🏆 **Opção 2** |
| **Segurança Operacional** | Risco de quebrar páginas existentes (`Estoque.tsx`, `EstoqueSimplificado.tsx`). | Zero risco de regressão. O estoque antigo continua funcionando ou migra para categoria "EPI" quando desejado. | 🏆 **Opção 2** |

> **Conclusão Técnica:** A **Opção 2 (Modelagem Limpa e Especializada)** é tanto a mais **performática** quanto a mais **rápida e segura de implementar**. O monólito modular Spring Boot utilizará entidades limpas com prefixo `warehouse_*` e conectará com as entidades já existentes de rastreabilidade de frota (`Vehicle`, `tires` e `vehicle_batteries`), mantendo o isolamento multi-tenant (`TenantAware`).

---

## 2. PRD — PRODUCT REQUIREMENTS DOCUMENT

### 2.1 Visão Geral e Objetivos do Negócio
Transformar o controle de estoque do FleetManager em um **Almoxarifado Operacional Integrado**, concebido especificamente para as rotinas severas de uma empresa de transporte rodoviário e urbano de passageiros.

O sistema elimina a visão de "estoque puramente quantitativo" e implementa a separação fundamental entre:
1. **Produto Comercial**: A especificação de catálogo (ex: *Pneu 295/80 R22.5 Michelin X Multi Energy Z*, *Filtro de Óleo Lubrificante PSL 962*, *Bateria 12V 150Ah Moura*).
2. **Item Físico Rastreável**: A unidade individualizada em operação com ciclo de vida próprio (ex: *Pneu fogo PN-000458 / DOT 4525* montado no Ônibus 312 na posição Dianteira Esquerda; *Bateria BT-000125* com garantia até 10/2027).

### 2.2 Personas e Matriz de Permissões (RBAC)

| Perfil (Role) | Descrição do Papel | Permissões Principais |
| :--- | :--- | :--- |
| **`ALMOXARIFE`** | Operador do almoxarifado | Receber NF-e, realizar conferência física, alocar endereçamento, registrar saídas de materiais, efetuar contagens de inventário. |
| **`CHEFIA_OFICINA`** | Coordenador de manutenção / mecânicos | Requisitar peças para OS, autorizar descarte de sucata, aprovar envio de pneus para reforma/recapagem, montagem/desmontagem em veículos. |
| **`COMPRADOR`** | Setor de compras | Criar pedidos de compra, vincular cotações, acompanhar status de entrega e divergências de entrada. |
| **`FINANCEIRO`** | Setor financeiro / fiscal | Conciliar NF-e de entrada com Contas a Pagar / DDA, validar impostos e aprovar lançamentos contábeis. |
| **`GESTOR_FROTA` / `ADMIN`** | Diretoria e coordenação operacional | Aprovar divergências de inventário, visualizar dashboards de CPK (Custo por KM), auditoria e configurações gerais. |

---

### 2.3 Requisitos Funcionais Detalhados

#### [RF01] Estrutura Hierárquica Flexível de Categorias
- **RF01.1**: Permitir hierarquia com níveis ilimitados através de relacionamento pai/filho (`parent_id`).
- **RF01.2**: Categorias padrão do setor de transporte pré-carregadas:
  - `PEÇAS` (Motor, Freios, Suspensão, Câmbio, Elétrica, Ar Condicionado).
  - `PNEUS` (Rodoviário, Urbano, Direcional, Tração, Misto).
  - `BATERIAS` (12V, 24V, Estacionárias).
  - `LUBRIFICANTES E FLUIDOS` (Óleo Motor, Câmbio, Diferencial, Graxas, Arla 32).
  - `MATERIAIS DE CONSUMO E OFICINA` (Lixas, Eletrodos, Estopas, Solvente).
  - `EPI E UNIFORMES` (Luvas, Botas, Óculos, Fardamento).
- **RF01.3**: Cada categoria define se herda políticas fiscais e contas contábeis padrão.

#### [RF02] Catálogo de Produtos e Modalidades de Controle
Todo produto possui uma configuração de **Tipo de Controle de Rastreabilidade** (`tracking_type`):
1. **`QUANTITY` (Apenas Quantidade)**: Para parafusos, porcas, arruelas, estopas, lâmpadas comuns. Saldo numérico no almoxarifado.
2. **`LOT_EXPIRATION` (Lote e Validade)**: Para lubrificantes, aditivos de radiador, tintas, catalisadores. Exige código de lote, data de fabricação e validade na entrada. Controle PEPS (Primeiro que Expira, Primeiro que Sai - FEFO).
3. **`SERIAL_NUMBER` (Número de Série Unitário)**: Para alternadores, motores de partida, compressores de ar, turbinas, módulos eletrônicos.
4. **`INDIVIDUAL_TIRE` (Pneu Rastreável)**: Ativa automaticamente a ficha técnica do pneu, ciclo de vida, medição de sulco, reformas e instalação por eixo de veículo.
5. **`INDIVIDUAL_BATTERY` (Bateria Rastreável)**: Ativa controle de número de série, medição de voltagem, CCA, data de vencimento da garantia e veículo instalado.

#### [RF03] Documento de Entrada (NF-e & Conferência Operacional)
- **RF03.1**: Entidade central de entrada de materiais no almoxarifado.
- **RF03.2**: Importação de NF-e via **Upload de XML** e consulta por **Chave de 44 dígitos**.
- **RF03.3**: Preenchimento automático: Fornecedor (CNPJ), Número NF, Série, Data de Emissão, Itens com NCM, CST, CFOP, Unidade, Quantidade e Valores, Faturas/Duplicatas.
- **RF03.4**: **Conferência Física (Cega ou Assistida)**: O almoxarife confere a carga física contra a nota. Divergências de quantidade geram estado `DIVERGENTE`.
- **RF03.5**: Para itens do tipo `INDIVIDUAL_TIRE` e `INDIVIDUAL_BATTERY`, a conferência exige a digitação/leitura óptica dos números de série/DOT individuais.
- **RF03.6**: Máquina de estados estrita:
  `RECEBIDA` ➔ `EM_CONFERENCIA` ➔ `CONFERIDA` ➔ `ESTOQUE_PROCESSADO` ➔ `FINANCEIRO_PROCESSADO` ➔ `FINALIZADA`.
  Estados de exceção: `DIVERGENTE`, `CANCELADA`, `ESTORNADA`.
- **RF03.7**: Ao atingir `FINANCEIRO_PROCESSADO`, dispara evento que gera automaticamente as parcelas no módulo **Contas a Pagar** (`contas_a_pagar`) prontas para conciliação com o **DDA**.

#### [RF04] Gestão Especializada de Pneus (Ciclo de Vida & Frota)
- **RF04.1**: Cada pneu recebe um identificador único de fogo/patrimônio (ex: `PN000458`) e registro de `DOT`, fabricante, modelo, medida (ex: `295/80 R22.5`), índice de carga e sulco original (mm).
- **RF04.2**: Status do Pneu:
  `EM_ESTOQUE`, `INSTALADO`, `EM_REFORMA`, `REFORMADO`, `RESERVA`, `DANIFICADO`, `DESCARTADO`, `VENDIDO`.
- **RF04.3**: **Instalação no Ônibus**:
  - Selecionar veículo (placa/prefixo).
  - Selecionar eixo (Dianteiro, Tração, Truck/Auxiliar, Terceiro Eixo, Estepe).
  - Posição específica (Dianteiro Esquerdo, Dianteiro Direito, Tração Interno Esquerdo, Tração Externo Direito, etc.).
  - Registrar KM do veículo no momento da instalação e medição atual do sulco (mm).
- **RF04.4**: **Remoção do Ônibus**:
  - Registrar data, KM do veículo, motivo da remoção (Rodízio, Desgaste para Reforma, Furo/Avaria, Fim de Vida).
  - O sistema calcula automaticamente: `KM Rodado nesta instalação = KM Atual - KM Instalação`.
  - Atualiza o `current_mileage` acumulado da vida do pneu.
- **RF04.5**: **Envio e Retorno de Reforma (Recapagem)**:
  - Envio com registro da recapadora (fornecedor), data e número da OS de reforma.
  - Retorno com nova banda de rodagem, novo sulco inicial e incremento de `recap_count` (1ª reforma, 2ª reforma, etc.).
- **RF04.6**: **Indicadores de Desempenho**:
  - CPK (Custo por KM): `(Valor Aquisição + Soma Custos Reformas) / Total KM Rodados`.
  - Projeção de troca baseada no desgaste de sulco (mm por 10.000 km).

#### [RF05] Gestão Especializada de Baterias
- **RF05.1**: Cadastro unitário com número de série gravado na carcaça, marca, modelo, amperagem (Ah), voltagem (12V/24V) e data limite da garantia do fabricante.
- **RF05.2**: Instalação no veículo vinculando data, KM e teste de carga (CCA medido).
- **RF05.3**: Alertas preventivos: Baterias instaladas com garantia a expirar em 30 dias; baterias com mais de 24 meses em operação para teste preventivo de alternador.

#### [RF06] Endereçamento Físico do Almoxarifado
- **RF06.1**: Estrutura física de localização configurável por filial/almoxarifado:
  `Almoxarifado` ➔ `Corredor / Rua` ➔ `Estante / Módulo` ➔ `Prateleira / Nível` ➔ `Gaveta / Vão`.
  Exemplo: `ALM-CENTRAL / CORREDOR-A / ESTANTE-02 / PRAT-03` ➔ Código `A-02-03`.
- **RF06.2**: Áreas especiais parametrizadas:
  - `PATIO-PNEUS-NOVOS`, `PATIO-PNEUS-REFORMA`, `PATIO-SUCATA`.
  - `SALA-BATERIAS` (com controle de recarga).
- **RF06.3**: Consulta rápida no momento da separação de itens para Ordem de Serviço da oficina.

#### [RF07] Parâmetros de Reposição e Alertas de Estoque
- **RF07.1**: Para cada produto e filial:
  - `Estoque Mínimo` (Ponto de Alerta Crítico).
  - `Ponto de Reposição` (Momento de acionar compra).
  - `Estoque Máximo` (Limite para evitar capital parado).
  - `Tempo Médio de Atendimento do Fornecedor (Lead Time)` em dias.
- **RF07.2**: Cálculo dinâmico de `Disponível`:
  `Quantidade Disponível = Saldo Físico Atual - Quantidade Reservada (em OS aberta)`.
- **RF07.3**: Disparo de alerta visual e notificação automática para o setor de Compras quando `Disponível <= Ponto de Reposição`.

#### [RF08] Movimentações Auditáveis (Ledger Imutável)
- **RF08.1**: Toda alteração de estoque é estritamente transacional através da criação de um registro imutável em `warehouse_movements`.
- **RF08.2**: Tipos de Movimentação:
  - `ENTRADA_COMPRA` (via Documento de Entrada)
  - `SAIDA_ORDEM_SERVICO` (aplicação direta no veículo/oficina)
  - `SAIDA_CONSUMO_INTERNO` (materiais administrativos/limpeza)
  - `TRANSFERENCIA_FILIAIS` (entre garagens)
  - `DEVOLUCAO_FORNECEDOR`
  - `INSTALACAO_VEICULO` (para pneus e baterias)
  - `REMOCAO_VEICULO` (para pneus e baterias)
  - `ENVIO_REFORMA` / `RETORNO_REFORMA`
  - `AJUSTE_INVENTARIO_ENTRADA` / `AJUSTE_INVENTARIO_SAIDA`
  - `SUCATA_DESCARTE`
- **RF08.3**: Proibição de comandos diretos de `UPDATE quantidade = X` sem histórico e justificativa de usuário logado.

#### [RF09] Módulo Completo de Inventário Físico
- **RF09.1**: Criação de Inventário com Escopo Parametrizável:
  - **Geral**: Todos os itens do almoxarifado.
  - **Por Categoria**: Ex: Apenas "PNEUS" ou apenas "LUBRIFICANTES".
  - **Por Localização**: Ex: Apenas Corredor B ou Almoxarifado Garagem Norte.
  - **Por Amostragem Crítica**: Itens da Curva A ou de alto valor.
- **RF09.2**: **Controle de Bloqueio/Congelamento**: Opção de travar movimentações do escopo durante a contagem.
- **RF09.3**: **Ciclo de Contagem**:
  - Contagem 1 (cega, o almoxarife não vê o saldo esperado no sistema).
  - Contagem 2 (em caso de divergência entre Contagem 1 e saldo do sistema).
  - Conferência Individual de Itens Rastreáveis: O conferente bipa ou digita cada DOT/Série de pneu. O sistema aponta exatamente quais pneus esperados estão ausentes e quais pneus não esperados foram encontrados.
- **RF09.4**: **Apuração e Aprovação**:
  - Apuração com valor financeiro da sobra/falta.
  - Exigência de aprovação por gestor com permissão `GESTOR_FROTA` ou `ADMIN`.
  - Geração automática de movimentações de ajuste (`AJUSTE_INVENTARIO_*`) e encerramento auditado.

#### [RF10] Dashboard Executivo e Operacional
- Indicadores em tempo real:
  - Valor Financeiro Total em Estoque (R$).
  - Total de Itens abaixo do Ponto de Reposição / Mínimo.
  - Pneus em Estoque vs Pneus Rodando na Frota vs Pneus em Reforma.
  - Baterias em Estoque vs Instaladas vs Próximas ao Vencimento da Garantia.
  - Custo Médio por KM (CPK) da frota de pneus.
  - Acurácia do último inventário (% de acerto entre físico e lógico).

---

### 2.4 Requisitos Não Funcionais (RNF)

- **RNF01 (Multi-Tenancy & Segurança)**: Todas as tabelas implementam `company_id` e respeitam o contrato `TenantAware` existente no backend.
- **RNF02 (Integridade Transacional ACID)**: Entrada de NF-e, baixa em OS e ajustes de inventário rodam em transações `@Transactional` com isolamento `READ_COMMITTED` e locks pessimistas quando necessário para evitar condições de corrida (*race conditions* de saldo concorrente).
- **RNF03 (Performance)**: Consultas de saldo e busca de produtos por código de barras, código interno ou nome respondem em tempo inferior a 150ms para bases de até 100.000 SKUs.
- **RNF04 (Auditabilidade & LGPD)**: Registro do usuário criador, data/hora e justificativa em todas as movimentações e ajustes.
- **RNF05 (Idempotência de Documentos)**: A mesma chave de 44 dígitos de NF-e não pode ser processada em duplicidade na mesma empresa (`company_id`).
- **RNF06 (Responsividade & Uso em Oficina)**: As telas de conferência de entrada, montagem de pneus e contagem de inventário devem ser totalmente operáveis em tablets e coletores com leitor de código de barras / QR Code.

---

## 3. SDD — SOFTWARE DESIGN DOCUMENT

### 3.1 Arquitetura Monólito Modular & Comunicação por Eventos

O backend Java Spring Boot adota a arquitetura de **Monólito Modular**:
- Pacotes isolados com alta coesão e baixo acoplamento.
- Transações atômicas no mesmo banco PostgreSQL.
- Comunicação desacoplada entre módulos através do `ApplicationEventPublisher` do Spring e ouvintes com `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      FLEETMANAGER SPRING BOOT BACKEND                  │
 │                                                                        │
 │  ┌───────────────────┐               ┌──────────────────────────────┐  │
 │  │  INBOUND INVOICE  │ ──(Event)───► │      WAREHOUSE (STOCK)       │  │
 │  │     (NF-e / Doc)  │               │ (Saldos, Movimentações, Loc) │  │
 │  └─────────┬─────────┘               └──────────────┬───────────────┘  │
 │            │                                        │                  │
 │         (Event)                                  (Event)               │
 │            ▼                                        ▼                  │
 │  ┌───────────────────┐               ┌──────────────────────────────┐  │
 │  │ FINANCIAL MODULE  │               │ FLEET TIRES & BATTERIES      │  │
 │  │ (Contas a Pagar)  │               │ (Pneus, Baterias, Veículos)  │  │
 │  └───────────────────┘               └──────────────┬───────────────┘  │
 │                                                     │                  │
 │                                                  (Event)               │
 │                                                     ▼                  │
 │                                      ┌──────────────────────────────┐  │
 │                                      │   INVENTORY AUDIT MODULE     │  │
 │                                      │ (Contagem, Apuração, Ajuste) │  │
 │                                      └──────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────┘
```

#### Eventos de Domínio Implementados:
1. `InboundDocumentCreatedEvent`: Emitido ao salvar o cabeçalho e itens do documento.
2. `InboundDocumentCheckedEvent`: Emitido após o almoxarife finalizar a conferência física.
3. `StockEntryProcessedEvent`: Processa a entrada contábil no saldo do almoxarifado.
4. `TireRegisteredEvent` / `BatteryRegisteredEvent`: Cria instâncias unitárias rastreáveis no recebimento.
5. `TireMountedEvent` / `TireDismountedEvent`: Atualiza KM, posição no chassi e histórico do veículo.
6. `BillPayableGeneratedEvent`: Cria títulos a pagar correspondentes às faturas da NF-e conferida.
7. `InventoryAdjustmentApprovedEvent`: Aplica as movimentações de acerto aprovadas pela gestão.

---

### 3.2 Diagramas de Estados

#### Máquina de Estados: Documento de Entrada
```text
               ┌───────────────┐
               │   RECEBIDA    │ (Upload do XML ou digitação da NF)
               └───────┬───────┘
                       │ Iniciar conferência
                       ▼
               ┌───────────────┐
    ┌───────── │EM_CONFERENCIA │ ────────┐
    │          └───────┬───────┘         │
    │ Divergência      │ Conferência OK  │ Cancelamento
    ▼                  ▼                 ▼
┌────────────┐ ┌───────────────┐  ┌─────────────┐
│ DIVERGENTE │ │   CONFERIDA   │  │  CANCELADA  │
└─────┬──────┘ └───────┬───────┘  └─────────────┘
      │ Corrigir       │ Processar estoque
      └────────────────┘
                       ▼
             ┌───────────────────┐
             │ ESTOQUE_PROCESSADO│ (Gera movimentações de entrada)
             └─────────┬─────────┘
                       │ Integrar financeiro
                       ▼
             ┌────────────────────┐
             │FINANCEIRO_PROCESSADO│ (Gera contas a pagar / boletos)
             └─────────┬──────────┘
                       │ Finalizar
                       ▼
             ┌───────────────────┐
             │    FINALIZADA     │
             └─────────┬─────────┘
                       │ (Exceção: Estorno de auditoria)
                       ▼
             ┌───────────────────┐
             │    ESTORNADA      │
             └───────────────────┘
```

#### Máquina de Estados: Ciclo de Vida do Pneu
```text
                 ┌───────────────┐
                 │  EM_ESTOQUE   │ ◄───────────────────────────────┐
                 └───────┬───────┘                                 │
                         │ Montagem no ônibus                      │
                         ▼                                         │
                 ┌───────────────┐                                 │
                 │   INSTALADO   │                                 │
                 └───────┬───────┘                                 │ Retorno
                         │ Remoção (sulco baixo ou avaria)         │ reformado
                         ▼                                         │
        ┌────────────────┴────────────────┐                        │
        │                                 │                        │
        ▼                                 ▼                        │
┌───────────────┐                 ┌───────────────┐                │
│  EM_REFORMA   │                 │  DANIFICADO   │                │
└───────┬───────┘                 └───────┬───────┘                │
        │ Concluído                       │ Laudo condenatório     │
        ▼                                 ▼                        │
┌───────────────┐                 ┌───────────────┐                │
│   REFORMADO   │ ────────────────┼───────────────┼────────────────┘
└───────────────┘                 │  DESCARTADO   │
                                  │   (SUCATA)    │
                                  └───────────────┘
```

---

### 3.3 Modelo de Dados PostgreSQL (DDL & Migrations Flyway)

Abaixo está o script completo da migração `V430__create_warehouse_operational_schema.sql`:

```sql
-- =========================================================================
-- V430: MÓDULO DE ALMOXARIFADO OPERACIONAL, PNEUS, BATERIAS E INVENTÁRIO
-- =========================================================================

-- 1. HIERARQUIA DE CATEGORIAS
CREATE TABLE warehouse_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    parent_id UUID REFERENCES warehouse_categories(id) ON DELETE SET NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_cat_code UNIQUE (company_id, code)
);

CREATE INDEX idx_wh_cat_parent ON warehouse_categories(parent_id);
CREATE INDEX idx_wh_cat_company ON warehouse_categories(company_id);

-- 2. ENDEREÇAMENTO FÍSICO (LOCALIZAÇÕES)
CREATE TABLE warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    warehouse_name VARCHAR(60) NOT NULL DEFAULT 'Almoxarifado Central',
    aisle VARCHAR(20) NOT NULL,        -- Corredor / Rua
    shelf VARCHAR(20) NOT NULL,        -- Estante / Módulo
    level VARCHAR(20) NOT NULL,        -- Prateleira / Nível
    bin_position VARCHAR(20),          -- Vão / Gaveta
    full_code VARCHAR(80) NOT NULL,    -- Ex: ALM-A-01-02
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_loc_code UNIQUE (company_id, full_code)
);

-- 3. PRODUTOS / ITENS DE CATÁLOGO
CREATE TABLE warehouse_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES warehouse_categories(id),
    code VARCHAR(50) NOT NULL,         -- Código interno do produto
    barcode VARCHAR(60),               -- EAN / Código de barras
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_measure VARCHAR(10) NOT NULL, -- UN, LT, KG, PAR, MT
    tracking_type VARCHAR(30) NOT NULL DEFAULT 'QUANTITY', 
    -- 'QUANTITY', 'LOT_EXPIRATION', 'SERIAL_NUMBER', 'INDIVIDUAL_TIRE', 'INDIVIDUAL_BATTERY'
    default_location_id UUID REFERENCES warehouse_locations(id),
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    max_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    reorder_point NUMERIC(12, 3) NOT NULL DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    unit_cost_average NUMERIC(15, 4) DEFAULT 0,
    last_purchase_price NUMERIC(15, 4) DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_prod_code UNIQUE (company_id, code)
);

CREATE INDEX idx_wh_prod_barcode ON warehouse_products(company_id, barcode);
CREATE INDEX idx_wh_prod_cat ON warehouse_products(category_id);

-- 4. SALDO DE ESTOQUE POR LOCALIZAÇÃO
CREATE TABLE warehouse_stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES warehouse_products(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE RESTRICT,
    quantity_physical NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(12, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_prod_loc UNIQUE (company_id, product_id, location_id),
    CONSTRAINT chk_qty_physical CHECK (quantity_physical >= 0)
);

-- 5. DOCUMENTO DE ENTRADA (NF-E / COMPRAS)
CREATE TABLE warehouse_inbound_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    document_number VARCHAR(30) NOT NULL,   -- Número da NF
    series VARCHAR(10),                     -- Série
    access_key VARCHAR(44),                 -- Chave de 44 dígitos da NF-e
    supplier_cnpj VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    arrival_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_products_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEBIDA',
    -- 'RECEBIDA', 'EM_CONFERENCIA', 'CONFERIDA', 'DIVERGENTE', 'ESTOQUE_PROCESSADO', 'FINANCEIRO_PROCESSADO', 'FINALIZADA', 'CANCELADA', 'ESTORNADA'
    receiver_user_id UUID NOT NULL,
    checked_user_id UUID,
    checked_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_doc_key UNIQUE (company_id, access_key)
);

CREATE INDEX idx_wh_doc_status ON warehouse_inbound_documents(company_id, status);

-- 6. ITENS DO DOCUMENTO DE ENTRADA
CREATE TABLE warehouse_inbound_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbound_document_id UUID NOT NULL REFERENCES warehouse_inbound_documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES warehouse_products(id),
    product_code_invoice VARCHAR(60) NOT NULL,
    product_description_invoice VARCHAR(150) NOT NULL,
    ncm VARCHAR(10),
    unit_measure VARCHAR(10) NOT NULL,
    quantity_invoiced NUMERIC(12, 3) NOT NULL,
    quantity_checked NUMERIC(12, 3) DEFAULT 0,
    unit_price NUMERIC(15, 4) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    lot_number VARCHAR(50),
    expiration_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PARCELAS / DUPLICATAS FINANCEIRAS DO DOCUMENTO
CREATE TABLE warehouse_inbound_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbound_document_id UUID NOT NULL REFERENCES warehouse_inbound_documents(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    barcode VARCHAR(60),
    account_payable_id UUID, -- Vinculado à tabela contas_a_pagar
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. MOVIMENTAÇÕES DE ESTOQUE (LEDGER IMUTÁVEL)
CREATE TABLE warehouse_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    location_id UUID REFERENCES warehouse_locations(id),
    movement_type VARCHAR(40) NOT NULL,
    -- 'ENTRADA_COMPRA', 'SAIDA_ORDEM_SERVICO', 'SAIDA_CONSUMO', 'TRANSFERENCIA', 'DEVOLUCAO', 'INSTALACAO_VEICULO', 'REMOCAO_VEICULO', 'ENVIO_REFORMA', 'RETORNO_REFORMA', 'AJUSTE_INVENTARIO_ENTRADA', 'AJUSTE_INVENTARIO_SAIDA', 'SUCATA_DESCARTE'
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    inbound_document_id UUID REFERENCES warehouse_inbound_documents(id),
    vehicle_id UUID REFERENCES vehicles(id),
    work_order_id UUID,
    tire_id UUID,
    battery_id UUID,
    batch_number VARCHAR(50),
    notes TEXT,
    performed_by_user_id UUID NOT NULL,
    movement_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wh_mov_prod_date ON warehouse_movements(company_id, product_id, movement_date DESC);
CREATE INDEX idx_wh_mov_vehicle ON warehouse_movements(vehicle_id);

-- 9. EXTENSÃO DA TABELA TIRES EXISTENTE (EVOLUÇÃO)
ALTER TABLE tires ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES warehouse_products(id);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS inbound_item_id UUID REFERENCES warehouse_inbound_items(id);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS dot VARCHAR(20);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS initial_tread_depth NUMERIC(5, 2); -- Sulco original em mm
ALTER TABLE tires ADD COLUMN IF NOT EXISTS current_tread_depth NUMERIC(5, 2); -- Sulco atual em mm
ALTER TABLE tires ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS total_repair_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS cpk NUMERIC(10, 4) DEFAULT 0;       -- Custo Por Quilômetro
ALTER TABLE tires ADD COLUMN IF NOT EXISTS install_km INTEGER;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS install_date TIMESTAMP WITHOUT TIME ZONE;

-- 10. EXTENSÃO DA TABELA VEHICLE_BATTERIES (EVOLUÇÃO)
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES warehouse_products(id);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS inbound_item_id UUID REFERENCES warehouse_inbound_items(id);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS serial_number VARCHAR(60);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS cca_rating INTEGER;     -- Corrente de partida a frio
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS install_km INTEGER;
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS removal_date DATE;
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS removal_reason VARCHAR(100);

-- 11. MÓDULO DE INVENTÁRIO FÍSICO
CREATE TABLE warehouse_inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    description VARCHAR(150) NOT NULL,
    scope_type VARCHAR(30) NOT NULL, -- 'ALL', 'CATEGORY', 'LOCATION', 'PRODUCT'
    target_category_id UUID REFERENCES warehouse_categories(id),
    target_location_id UUID REFERENCES warehouse_locations(id),
    freeze_movements BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'CRIADO',
    -- 'CRIADO', 'EM_CONTAGEM', 'CONFERENCIA', 'AGUARDANDO_APROVACAO', 'FINALIZADO', 'CANCELADO'
    opened_by_user_id UUID NOT NULL,
    closed_by_user_id UUID,
    approved_by_user_id UUID,
    opened_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    CONSTRAINT uk_wh_inv_code UNIQUE (company_id, code)
);

CREATE TABLE warehouse_inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES warehouse_inventory_audits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    quantity_system NUMERIC(12, 3) NOT NULL,
    quantity_count_1 NUMERIC(12, 3),
    quantity_count_2 NUMERIC(12, 3),
    quantity_final NUMERIC(12, 3),
    difference NUMERIC(12, 3),
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
    divergence_value NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- 'OK', 'DIVERGENTE', 'AJUSTADO'
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_inventory_scanned_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES warehouse_inventory_audits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    serial_or_dot VARCHAR(60) NOT NULL,
    found_in_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. SPECS.MD — ESPECIFICAÇÃO TÉCNICA DE IMPLEMENTAÇÃO

### 4.1 Contratos REST APIs (Backend Spring Boot)

Todos os endpoints operam sob o prefixo `/api/warehouse` e requerem cabeçalho de autenticação JWT (`Authorization: Bearer <token>`).

#### 📦 A. Categorias (`/api/warehouse/categories`)
- `GET /api/warehouse/categories/tree`: Retorna a árvore hierárquica completa de categorias e subcategorias.
- `POST /api/warehouse/categories`: Cadastra nova categoria/subcategoria vinculando `parentId`.

#### 🏷️ B. Produtos (`/api/warehouse/products`)
- `GET /api/warehouse/products`: Lista paginada com filtros por texto, categoria, tipo de controle e abaixo do mínimo.
- `POST /api/warehouse/products`: Cadastra novo produto com parâmetros de estoque mínimo, lead time e `trackingType`.
- `GET /api/warehouse/products/{id}/stock-summary`: Retorna saldo físico, reservado, disponível e localizações físicas do produto.

#### 📄 C. Documentos de Entrada (`/api/warehouse/inbound`)
- `POST /api/warehouse/inbound/upload-xml`:
  - Recebe `multipart/form-data` contendo o arquivo `.xml` da NF-e.
  - Executa parsing do XML (usando biblioteca DOM/StAX) validando chave de 44 dígitos e assinatura.
  - Devolve objeto estruturado com dados do fornecedor, itens e duplicatas prontos para conferência.
- `POST /api/warehouse/inbound`: Cria/persiste o documento no status `RECEBIDA`.
- `POST /api/warehouse/inbound/{id}/start-check`: Altera para `EM_CONFERENCIA`.
- `POST /api/warehouse/inbound/{id}/check-items`:
  - Payload contém lista com `checkedQuantity` de cada item e seriais/DOTs lidos para pneus e baterias.
  - Se houver divergência, transiciona para `DIVERGENTE`; se bater 100%, transiciona para `CONFERIDA`.
- `POST /api/warehouse/inbound/{id}/process-stock`:
  - Gera as movimentações de `ENTRADA_COMPRA`.
  - Incrementa `warehouse_stock_levels`.
  - Instancia as entidades `tires` ou `vehicle_batteries` com status `EM_ESTOQUE`.
  - Transiciona para `ESTOQUE_PROCESSADO`.
- `POST /api/warehouse/inbound/{id}/process-financial`:
  - Emite `BillPayableGeneratedEvent` que insere títulos no módulo `contas_a_pagar`.
  - Transiciona para `FINANCEIRO_PROCESSADO` e posteriormente `FINALIZADA`.

#### 🛞 D. Gestão de Pneus e Mapa do Chassi (`/api/warehouse/tires`)
- `GET /api/warehouse/tires`: Listagem completa com filtros por status (`EM_ESTOQUE`, `INSTALADO`, `EM_REFORMA`, etc.), medida, marca e veículo.
- `GET /api/warehouse/tires/{id}/history`: Histórico cronológico de movimentações, veículos instalados, KM rodado e recapagens.
- `POST /api/warehouse/tires/mount`:
  - **Payload**:
    ```json
    {
      "tireId": "e1f1c93a-8b1b-4f9e-9f33-911122233344",
      "vehicleId": "f2a2d81b-7c2c-4e8a-8a11-123456789abc",
      "axleNumber": 1,
      "positionCode": "DE", 
      "currentVehicleKm": 284350,
      "treadDepthMm": 14.5
    }
    ```
  - **Ação**: Valida se a posição já está ocupada. Registra a saída do estoque, atualiza status do pneu para `INSTALADO` e gera movimentação.
- `POST /api/warehouse/tires/dismount`:
  - **Payload**:
    ```json
    {
      "tireId": "e1f1c93a-8b1b-4f9e-9f33-911122233344",
      "currentVehicleKm": 321700,
      "treadDepthMm": 3.8,
      "removalReason": "ENVIAR_REFORMA",
      "targetLocationId": "a1b2c3d4-..."
    }
    ```
  - **Ação**: Calcula KM rodado no ciclo (37.350 KM), atualiza `current_mileage`, atualiza status para `EM_REFORMA` ou `EM_ESTOQUE` e gera histórico.

#### 🔋 E. Baterias (`/api/warehouse/batteries`)
- `GET /api/warehouse/batteries`: Listagem de baterias com status, data de garantia e veículo.
- `POST /api/warehouse/batteries/install`: Associa bateria ao veículo, registrando KM e voltagem medida.
- `POST /api/warehouse/batteries/uninstall`: Remove bateria registrando motivo, destino (descarte, garantia ou recarga).

#### 📋 F. Inventário (`/api/warehouse/inventory`)
- `POST /api/warehouse/inventory`: Cria inventário definindo escopo.
- `POST /api/warehouse/inventory/{id}/count`: Registra contagem cega física.
- `POST /api/warehouse/inventory/{id}/scan-serial`: Bipa serial/DOT no inventário.
- `GET /api/warehouse/inventory/{id}/discrepancies`: Apura diferenças quantitativas e financeiras.
- `POST /api/warehouse/inventory/{id}/approve-adjustments`: Aplica ajustes no estoque e fecha inventário.

---

### 4.2 Mapa Visual do Chassi / Eixos de Ônibus (Frontend)

O sistema suportará as configurações mais comuns de ônibus urbanos e rodoviários:
1. **Chassi 4x2 (2 Eixos — 6 Pneus)**:
   - Eixo 1 (Direcional): `DE` (Dianteiro Esquerdo), `DD` (Dianteiro Direito).
   - Eixo 2 (Tração Dupla): `TIE` (Tração Interno Esquerdo), `TOE` (Tração Externo Esquerdo), `TID` (Tração Interno Direito), `TOD` (Tração Externo Direito).
   - `ESTEPE` (Estepe).
2. **Chassi 6x2 (3 Eixos — 10 Pneus)**:
   - Eixo 1 (Direcional): `DE`, `DD`.
   - Eixo 2 (Tração Dupla): `TIE`, `TOE`, `TID`, `TOD`.
   - Eixo 3 (Truck / Auxiliar Duplo): `AIE`, `AOE`, `AID`, `AOD`.
   - `ESTEPE`.
3. **Chassi Articulado (3 Eixos / 4 Eixos)**:
   - Eixos direcionais, tração e carro traseiro articulado com posições correspondentes.

**Representação Visual Interativa**:
- O usuário visualiza o diagrama gráfico do ônibus visto de cima (*top-down*).
- Cada posição é um botão clicável com indicador de status:
  - 🟢 **Ocupado (Normal)**: Mostra DOT, marca, sulco atual em mm e KM rodado.
  - 🟡 **Alerta**: Sulco abaixo de 4.0mm (próximo de reforma).
  - ⚪ **Vazio**: Permite clique direto para abrir modal "Montar Pneu do Estoque".

---

### 4.3 Arquitetura de Componentes React / TypeScript

Novas telas e componentes localizados em `frontend/src/`:

```text
frontend/src/
├── pages/
│   ├── AlmoxarifadoDashboard.tsx       # Cards de valor, itens críticos e gráficos
│   ├── DocumentosEntrada.tsx           # Lista e fluxo de NF-e
│   ├── DocumentoEntradaConferencia.tsx # Tela de conferência física cega/assistida
│   ├── GestaoPneus.tsx                 # Grid de pneus, filtros e histórico
│   ├── MapaChassiVeiculo.tsx           # Tela visual de eixos e pneus do ônibus
│   ├── GestaoBaterias.tsx              # Grid de baterias e controle de garantia
│   ├── InventarioAuditoria.tsx         # Ciclo de criação, contagem e aprovação
│   └── LocalizacoesAlmoxarifado.tsx    # Cadastro de corredores/estantes
├── components/warehouse/
│   ├── InboundXmlUploader.tsx          # Drag & drop de XML de NF-e
│   ├── TireChassisDiagram.tsx          # Diagrama visual SVG dos eixos do ônibus
│   ├── TireMountModal.tsx              # Modal de montagem com busca de pneu
│   ├── TireDismountModal.tsx           # Modal de remoção com cálculo de KM e sulco
│   ├── InventoryCounterModal.tsx       # Tela de contagem cega com leitor de código
│   └── StockMovementTimeline.tsx       # Linha do tempo das movimentações do item
└── services/
    ├── warehouseProductService.ts
    ├── inboundDocumentService.ts
    ├── tireFleetService.ts
    └── warehouseInventoryService.ts
```

---

### 4.4 Critérios de Aceite (Cenários BDD / Gherkin)

#### Cenário 1: Entrada de Pneus via NF-e com Rastreabilidade Unitária
```gherkin
Dado que o almoxarife faz o upload de uma NF-e com 4 unidades do produto "Pneu 295/80 R22.5"
Quando o documento passa para o status "EM_CONFERENCIA"
Então o sistema exige a digitação ou leitura de 4 números de DOT/série individuais
E ao confirmar a conferência com sucesso
O sistema gera 4 registros individuais na tabela "tires" com status "EM_ESTOQUE"
E cria o título correspondente no módulo "contas_a_pagar" com o valor e vencimentos da nota fiscal.
```

#### Cenário 2: Instalação de Pneu no Ônibus e Histórico de KM
```gherkin
Dado que o pneu "PN000458" está com status "EM_ESTOQUE"
Quando o mecânico seleciona o Ônibus "312" com odômetro em 284.350 KM
E define a posição "Dianteiro Esquerdo" com sulco inicial de 15.0 mm
Então o status do pneu muda para "INSTALADO" vinculado ao Ônibus "312"
E a quantidade disponível do produto correspondente no almoxarifado reduz em 1 unidade
E um evento "TireMountedEvent" é registrado na auditoria.
```

#### Cenário 3: Remoção do Pneu para Reforma e Cálculo de CPK
```gherkin
Dado que o pneu "PN000458" foi instalado no Ônibus "312" aos 284.350 KM
Quando o pneu é desmontado aos 321.700 KM com motivo "ENVIAR_REFORMA"
Então o sistema calcula automaticamente 37.350 KM rodados nesta etapa
E atualiza o status do pneu para "EM_REFORMA"
E desocupa a posição "Dianteiro Esquerdo" no mapa do veículo
E recalcula o Custo por Quilômetro (CPK) do pneu.
```

#### Cenário 4: Inventário com Identificação de Pneu Ausente
```gherkin
Dado um inventário focado na categoria "PNEUS" onde o sistema registra 15 pneus em estoque
Quando o conferente realiza a bipagem e encontra apenas 14 pneus
Então o sistema aponta divergência de -1 unidade
E identifica nominalmente o pneu ausente (ex: "PN0014")
E exige a aprovação formal do Gestor de Frota para aplicar o ajuste de perda.
```

---

### 4.5 Plano de Execução em Fases

- **Fase 1 (Banco de Dados & Entidades Base)**:
  - Criação da Migration Flyway `V430__create_warehouse_operational_schema.sql`.
  - Implementação das entidades JPA (`WarehouseCategory`, `WarehouseProduct`, `WarehouseLocation`, `WarehouseStockLevel`, `WarehouseMovement`).
  - Evolução das entidades existentes `Tire` e `VehicleBattery`.

- **Fase 2 (Documento de Entrada & NF-e XML)**:
  - Implementação do parser de XML da NF-e (Java DOM/StAX).
  - Endpoints de upload, conciliação e máquina de estados (`warehouse_inbound_documents`).
  - Emissão de eventos para o módulo de Contas a Pagar (`contas_a_pagar`).

- **Fase 3 (Pneus, Baterias & Integração com Frota)**:
  - Serviços de montagem/desmontagem com cálculo automático de KM e CPK.
  - Endpoints do diagrama de chassi (`TireService` e `VehicleBatteryService`).
  - Alertas preventivos de sulco e garantia.

- **Fase 4 (Módulo de Inventário & Ajustes)**:
  - Ciclo de inventário (escopo, contagem cega, leitura de seriais, conciliação e aprovação).
  - Geração de movimentações de ajuste financeiro auditado.

- **Fase 5 (Frontend React & Dashboard Visual)**:
  - Criação das telas no React com Vite/Tailwind.
  - Componente interativo do Chassi do Ônibus (SVG/Grid de eixos).
  - Telas de conferência de NF-e e contagem de inventário otimizadas para coletores/tablets.
