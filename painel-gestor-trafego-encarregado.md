# Planejamento: Painel Operacional e Relatório Integrado para Encarregado de Transporte e Gestor de Tráfego

## 1. Visão Geral e Objetivos

Habilitar os perfis **Encarregado de Transporte** (`ENCARREGADO_DE_TRANSPORTES`, `ENCARREGADO_TRANSPORTES`, `ENCARREGADO_DE_TRAFEGO`, `ENCARREGADO_TRAFEGO`) e **Gestor de Tráfego** (`GESTOR_TRAFEGO`, `GESTOR_DE_TRAFEGO`) com acesso completo e unificado aos módulos de:
- **Manutenção & Frota**
- **Gestão de Tráfego & Fretamento**
- **Operacional**
- **Almoxarifado & Requisições**

Além disso, disponibilizar um **Painel de Controle Dedicado** (`/gestao-trafego/painel-operacional` e `/transporte/painel`) contendo:
1. **Aba Dashboard:**
   - Métricas de OS (abertas, em execução, concluídas, paradas críticas)
   - Veículos Disponíveis vs. Em Operação vs. Em Manutenção vs. Em Limpeza
   - Alocação dos veículos por Obra / Cliente / Setor de Trabalho
   - Lista e status dos Motoristas, onde estão atuando e qual veículo estão conduzindo
   - Veículos Reserva identificados e prontos para substituição
   - Status da Mobilização e da Desmobilização de frota
2. **Aba de Requisição ao Almoxarifado:**
   - Formulário direto e prático para abertura de requisição de peças, insumos e materiais vinculados ao veículo, obra ou OS
   - Histórico das requisições recentes com status de atendimento/entrega
3. **Aba de Relatório Consolidado Integrado:**
   - Tabela analítica completa com filtros dinâmicos por Obra, Cliente, Veículo, Motorista e Período
   - Onde cada veículo está alocado
   - Quais motoristas executam cada rota e os horários de execução
   - Diagnóstico de Manutenção: tempo de veículo parado e motivo detalhado da parada
   - Rastreamento de Compras: indicação se houve solicitação de peça ou contratação de serviço externo, valor das peças e valor dos serviços externos contratados
   - Higienização: indicação se está em limpeza/lavajato e tempo de permanência
   - Exportação direta nos formatos **PDF executivo** e **Excel (XLSX)**

---

## 2. Ajustes de Permissões e Segurança

### 2.1 Backend (`com.z7design.fleet_manager`)
1. **`PurchaseRequestController.java`**:
   - Adicionar `ROLE_ENCARREGADO_DE_TRANSPORTES`, `ROLE_ENCARREGADO_TRANSPORTES`, `ROLE_GESTOR_TRAFEGO`, `ROLE_GESTOR_DE_TRAFEGO`, `ROLE_ENCARREGADO_DE_TRAFEGO`, `ROLE_ENCARREGADO_TRAFEGO` às anotações `@PreAuthorize` nos métodos `getAllPurchaseRequests`, `getPurchaseRequestById` e `createPurchaseRequest`.
2. **`RoleFunctionalityService.java`**:
   - Adicionar mapeamento completo para `GESTOR_TRAFEGO`, `GESTOR_DE_TRAFEGO`, `ENCARREGADO_DE_TRANSPORTES`, `ENCARREGADO_TRANSPORTES`, `ENCARREGADO_DE_TRAFEGO`, `ENCARREGADO_TRAFEGO`, englobando módulos de frota, manutenção, tráfego, operacional e almoxarifado.

### 2.2 Frontend
1. **`permissions.ts`**:
   - Adicionar os roles nos módulos `manutencao` e `almoxarifado`.
   - Conceder permissões `STOCK_READ`, `STOCK_WRITE`, `STOCK_CREATE`, `EQUIPMENTS_CREATE`, além de manutenção nas `rolePermissions`.
2. **`CollapsibleSidebar.tsx` & `DynamicSidebar.tsx`**:
   - Garantir que todos os itens de menu de Manutenção, Mobilização, Tráfego, Operacional e Almoxarifado estejam nos `Set`s dos roles de Gestor de Tráfego e Encarregado de Transporte.
   - Adicionar o novo item de navegação **Painel Operacional de Transporte** com ícone representativo.

---

## 3. Componentes e Telas

1. **`TransportOperationalDashboardPage.tsx`** (em `frontend/src/pages/gestao-trafego/TransportOperationalDashboardPage.tsx`):
   - **Header gerencial:** KPIs de veículos disponíveis, veículos reserva, em manutenção, na limpeza, mobilizados e OSs ativas.
   - **Tabs:**
     - `dashboard`: Visão de cartões dinâmicos, alocação por obra/cliente, motoristas e veículos ativos, veículos reserva e tabela de mobilização/desmobilização.
     - `requisicao`: Criação ágil de requisição de compra/almoxarifado (`PurchaseRequestModal` / formulário integrado com peças e justificativa) + lista de requisições recentes.
     - `relatorio`: Relatório analítico completo consolidando status, rotas, horários, motoristas, motivos e tempos de parada, compras de peças / serviços externos com valores e tempos de lavagem. Exportadores PDF & Excel inclusos.
2. **Rotas em `App.tsx`**:
   - `/gestao-trafego/painel-operacional` e `/transporte/painel` apontando para o novo painel.

---

## 4. Plano de Validação e Testes
1. Validar que usuários com role `ENCARREGADO_DE_TRANSPORTES`, `GESTOR_TRAFEGO`, etc. conseguem acessar a rota e visualizar todos os módulos na sidebar.
2. Validar que a requisição ao almoxarifado é salva e recuperada com sucesso.
3. Testar filtros, paginação e exportação (PDF e Excel) do relatório consolidado.
