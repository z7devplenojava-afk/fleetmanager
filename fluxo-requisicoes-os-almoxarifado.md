# Plano de Implementação: Fluxo Integrado Almoxarifado, Requisições por OS, Cotações Agrupadas e NF-e

> **Slug:** `fluxo-requisicoes-os-almoxarifado`  
> **Status:** PLANEJADO  
> **Prioridade:** ALTA  

---

## 🎯 Objetivo
Implementar o ciclo operacional completo entre a **Ordem de Serviço (OS)**, **Almoxarifado** e **Compras**:
1. Notificação seletiva e anti-duplicidade de peças sem estoque diretamente da OS para o Almoxarifado (com número de OS e veículo).
2. Agrupamento de requisições de compra de múltiplas OSs em uma única Cotação com múltiplos itens e propostas de fornecedores no Almoxarifado.
3. Transição automática para `AVAILABLE_FOR_INSTALLATION` ao dar entrada na NF-e de compra com notificação aos responsáveis pela OS.
4. Registro de Requisição/Entrega de Itens em Estoque contendo Número, Data/Hora, Responsável (Logado), Solicitante (OS), OS de Referência e campo inteligente "Autorizado por" (filtro a partir de 3 caracteres de funcionários).
5. Ajuste no script de build do workflow CI (`.github/workflows/diagnose-deploy-failure.yml`).

---

## 📋 Tarefas e Arquivos Envolvidos

### Fase 1: Build & CI Fix
- [ ] **Ajustar `.github/workflows/diagnose-deploy-failure.yml`**
  - Substituir `npm ci` estrito por `npm ci --legacy-peer-deps || npm install --legacy-peer-deps --no-audit --no-fund` no step `Test Build Frontend`.

### Fase 2: OS → Almoxarifado (Notificação Inteligente & Prevenção de Duplicidade)
- [ ] **Backend: Endpoint e Serviço de Notificação de Peças sem Estoque por OS**
  - Em `FleetWorkOrderService.java` e `MaterialRequisitionService.java`:
    - Identificar itens de peça (`PART`) da OS com estoque insuficiente ou zerado.
    - Evitar duplicação: consultar se já existe requisição ativa (`PENDING_CHECK`, `WAITING_QUOTES`, etc.) para a combinação `(workOrderId, productId / itemCode)`.
    - Criar requisições apenas para itens pendentes/novos com número da OS, placa e modelo do veículo.
    - Registrar nota no histórico da OS e gerar notificação para o Almoxarifado.
- [ ] **Frontend: Botão de Notificação e Feedback Visual na OS**
  - Em `FleetWorkOrderForm.tsx`:
    - Consultar requisições existentes daquela OS (`materialRequisitionService.listByWorkOrder`).
    - Comparar com os itens do formulário. Se todos os itens sem estoque já tiverem sido solicitados, mostrar badge/botão desabilitado *"✓ Já Notificado ao Almoxarifado"*.
    - Se houver itens novos sem estoque, exibir botão *"Notificar Almoxarifado (X peça(s) sem estoque)"*.

### Fase 3: Almoxarifado → Compras (Agrupamento de Requisições em Cotação Única)
- [ ] **Frontend: Seleção Múltipla e Cotação Agrupada**
  - Em `AlmoxarifadoRequisicoesPage.tsx` e `StockRequisitionsTab.tsx`:
    - Adicionar checkboxes para selecionar múltiplas requisições pendentes de compra.
    - Botão de ação coletiva: *"Agrupar em Cotação de Compras"*.
    - Abrir `TripleQuoteComparisonModal` ou formulário de cotação com a lista agregada dos itens, mantendo visível a OS e veículo de origem de cada item.

### Fase 4: Entrada de NF-e → Atualização e Notificação
- [ ] **Backend: Liberação Automática na Entrada de Estoque por NF-e**
  - Em `StockNfeService.java` e `ProcurementService.java`:
    - Ao dar entrada física dos itens da NF-e no estoque, buscar requisições ativas associadas àquele produto/código.
    - Atualizar status para `AVAILABLE_FOR_INSTALLATION` ("Pronta para Instalação").
    - Criar notificação no sistema para o mecânico/responsável da OS avisando que a peça chegou.
    - Adicionar histórico na OS de origem.

### Fase 5: Requisição e Entrega de Itens em Estoque (com Busca Inteligente de Funcionários)
- [ ] **Modal de Entrega / Saída de Material**
  - Em `ConfirmDeliveryModal` ou modal equivalente no Almoxarifado:
    - Campos: Número da Requisição, OS de Referência, Solicitante (vindo da OS), Responsável pela Entrega (usuário logado), Data e Hora.
    - Campo **"Autorizado por"**: Dropdown com busca inteligente que filtra funcionários da empresa ao digitar a partir de 3 caracteres.
    - Baixa de estoque e conclusão da requisição (`INSTALLED_COMPLETED`).

---

## 🔬 Critérios de Verificação
1. `npm run build` do frontend executa sem erro.
2. `./gradlew compileJava -x test` do backend compila sem erro.
3. Na OS com peças sem estoque, o botão notifica o almoxarifado e imediatamente muda para estado notificado, impedindo duplicação.
4. No Almoxarifado, itens de diferentes OSs podem ser agrupados em uma única cotação.
5. Ao confirmar entrega, o campo "Autorizado por" pesquisa e seleciona funcionários dinamicamente.
