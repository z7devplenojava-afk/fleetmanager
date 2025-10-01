# Módulo Financeiro - Sistema Modular

## Visão Geral

O módulo financeiro foi reorganizado em uma arquitetura modular que permite controle granular de acesso baseado em roles e permissões. Cada área financeira é um componente separado que pode ser acessado independentemente.

## Estrutura dos Componentes

### 1. **ModuloFinanceiro** (Componente Principal)
- Integra todos os módulos financeiros
- Dashboard unificado com visão geral
- Navegação por abas para cada área
- Controle de permissões centralizado

### 2. **ContasAPagar**
- Gestão de contas a pagar
- Dashboard com estatísticas
- Lista de contas com filtros
- Relatórios específicos

### 3. **ContasAReceber**
- Gestão de contas a receber
- Acompanhamento de receitas
- Dashboard de performance
- Relatórios de receitas

### 4. **Pagamentos**
- Gestão de pagamentos
- Sistema de aprovações
- Execução de pagamentos
- Controle de fluxo

### 5. **FluxoCaixa**
- Visualização do fluxo de caixa
- Projeções futuras
- Análises e gráficos
- Controle de saldos

## Sistema de Permissões

### Permissões Disponíveis

#### **Contas a Pagar**
- `VIEW_CONTAS_PAGAR` - Visualizar contas a pagar
- `MANAGE_CONTAS_PAGAR` - Gerenciar contas a pagar
- `APPROVE_CONTAS_PAGAR` - Aprovar contas a pagar

#### **Contas a Receber**
- `VIEW_CONTAS_RECEBER` - Visualizar contas a receber
- `MANAGE_CONTAS_RECEBER` - Gerenciar contas a receber
- `APPROVE_CONTAS_RECEBER` - Aprovar contas a receber

#### **Pagamentos**
- `VIEW_PAGAMENTOS` - Visualizar pagamentos
- `MANAGE_PAGAMENTOS` - Gerenciar pagamentos
- `EXECUTE_PAGAMENTOS` - Executar pagamentos

#### **Fluxo de Caixa**
- `VIEW_FLUXO_CAIXA` - Visualizar fluxo de caixa
- `MANAGE_FLUXO_CAIXA` - Gerenciar fluxo de caixa

#### **Relatórios Financeiros**
- `VIEW_RELATORIOS_FINANCEIROS` - Visualizar relatórios
- `GENERATE_RELATORIOS_FINANCEIROS` - Gerar relatórios
- `EXPORT_RELATORIOS_FINANCEIROS` - Exportar relatórios

### Como Usar os Guards de Permissão

```tsx
import { 
  ContasAPagarGuard, 
  PagamentosGuard,
  FluxoCaixaGuard 
} from '@/components/financeiro';

// Exemplo de uso básico (apenas visualização)
<ContasAPagarGuard>
  <ContasAPagar />
</ContasAPagarGuard>

// Exemplo com ação específica
<PagamentosGuard action="execute">
  <Button>Executar Pagamento</Button>
</PagamentosGuard>

// Exemplo de fluxo de caixa com gerenciamento
<FluxoCaixaGuard action="manage">
  <Button>Exportar Dados</Button>
</FluxoCaixaGuard>
```

## Configuração de Roles

### Exemplo de Role com Acesso Completo
```json
{
  "roleName": "FINANCEIRO_ADMIN",
  "permissions": [
    "VIEW_FINANCIAL",
    "MANAGE_FINANCIAL",
    "VIEW_CONTAS_PAGAR",
    "MANAGE_CONTAS_PAGAR",
    "APPROVE_CONTAS_PAGAR",
    "VIEW_CONTAS_RECEBER",
    "MANAGE_CONTAS_RECEBER",
    "APPROVE_CONTAS_RECEBER",
    "VIEW_PAGAMENTOS",
    "MANAGE_PAGAMENTOS",
    "EXECUTE_PAGAMENTOS",
    "VIEW_FLUXO_CAIXA",
    "MANAGE_FLUXO_CAIXA",
    "VIEW_RELATORIOS_FINANCEIROS",
    "GENERATE_RELATORIOS_FINANCEIROS",
    "EXPORT_RELATORIOS_FINANCEIROS"
  ]
}
```

### Exemplo de Role com Acesso Limitado
```json
{
  "roleName": "FINANCEIRO_VIEWER",
  "permissions": [
    "VIEW_FINANCIAL",
    "VIEW_CONTAS_PAGAR",
    "VIEW_CONTAS_RECEBER",
    "VIEW_FLUXO_CAIXA",
    "VIEW_RELATORIOS_FINANCEIROS"
  ]
}
```

### Exemplo de Role para Aprovações
```json
{
  "roleName": "FINANCEIRO_APPROVER",
  "permissions": [
    "VIEW_FINANCIAL",
    "VIEW_CONTAS_PAGAR",
    "APPROVE_CONTAS_PAGAR",
    "VIEW_PAGAMENTOS",
    "VIEW_FLUXO_CAIXA"
  ]
}
```

## Implementação na Aplicação

### 1. **Substituir a página financeira existente**
```tsx
// Em App.tsx ou roteamento
import FinanceiroNovo from '@/pages/FinanceiroNovo';

// Substituir a rota existente
<Route path="/financeiro" element={<FinanceiroNovo />} />
```

### 2. **Usar componentes individuais**
```tsx
import { ContasAPagar, FluxoCaixa } from '@/components/financeiro';

// Usar apenas o componente necessário
<ContasAPagar />
<FluxoCaixa />
```

### 3. **Customizar permissões**
```tsx
import { FinanceiroPermissionGuard } from '@/components/financeiro';

<FinanceiroPermissionGuard requiredPermission="CUSTOM_PERMISSION">
  <CustomComponent />
</FinanceiroPermissionGuard>
```

## Benefícios da Nova Arquitetura

### **Segurança**
- Controle granular de acesso
- Permissões específicas por funcionalidade
- Isolamento de responsabilidades

### **Manutenibilidade**
- Componentes modulares e reutilizáveis
- Fácil adição de novas funcionalidades
- Código organizado e legível

### **Flexibilidade**
- Usuários podem acessar apenas o necessário
- Roles customizáveis por empresa
- Escalabilidade para novos módulos

### **Performance**
- Carregamento sob demanda
- Componentes independentes
- Redução de código desnecessário

## Migração

### **Passo a Passo**
1. Configurar as novas permissões no sistema de roles
2. Atualizar os usuários existentes com as permissões adequadas
3. Substituir a página financeira existente pela nova
4. Testar todas as funcionalidades
5. Treinar usuários sobre as novas permissões

### **Compatibilidade**
- Todos os componentes existentes foram mantidos
- APIs e interfaces não foram alteradas
- Migração pode ser feita gradualmente

## Suporte e Manutenção

Para dúvidas ou problemas:
1. Verificar as permissões do usuário
2. Confirmar se o role está configurado corretamente
3. Verificar os logs de acesso
4. Consultar a documentação de permissões

---

**Versão**: 2.0.0  
**Data**: Janeiro 2024  
**Autor**: Equipe de Desenvolvimento
