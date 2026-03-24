# 🎯 Dashboard Interativo - Secure Guard

## 📋 Visão Geral

O Dashboard Interativo é uma solução completa e responsiva que oferece uma experiência personalizada baseada nas permissões do usuário. Desenvolvido com foco em usabilidade, responsividade e performance.

## 🚀 Funcionalidades

### ✨ **Principais Características**

- **🔐 Baseado em Permissões**: Mostra apenas módulos e funcionalidades que o usuário tem acesso
- **📱 Totalmente Responsivo**: Otimizado para desktop, tablet e mobile
- **⚡ Tempo Real**: Estatísticas e notificações atualizadas automaticamente
- **🎨 Interface Moderna**: Design dark theme com identidade visual da empresa
- **🔧 Modular**: Componentes reutilizáveis e extensíveis

### 📊 **Componentes Principais**

#### 1. **InteractiveDashboard** - Componente Principal
- Abas dinâmicas baseadas em permissões
- Layout responsivo adaptativo
- Integração com todos os módulos do sistema

#### 2. **LiveStats** - Estatísticas em Tempo Real
- Métricas atualizadas automaticamente
- Indicadores de tendência (crescimento/declínio)
- Animações de carregamento

#### 3. **NotificationCenter** - Centro de Notificações
- Notificações em tempo real
- Diferentes tipos: info, warning, success, error
- Ações interativas nas notificações

#### 4. **QuickActions** - Ações Rápidas
- Acesso rápido às principais funcionalidades
- Organizadas por categorias
- Baseadas nas permissões do usuário

#### 5. **ResponsiveWidget** - Widget Responsivo
- Componente base para métricas
- Adapta tamanho baseado no dispositivo
- Suporte a ações e tendências

## 🎨 **Abas do Dashboard**

### 📈 **Visão Geral**
- Estatísticas em tempo real
- Centro de notificações
- Ações rápidas
- Atividade recente

### 📦 **Módulos**
- Grid de módulos disponíveis
- Cards interativos com métricas
- Navegação direta para cada módulo

### 👤 **Perfil**
- Informações do usuário
- Permissões ativas
- Dados da sessão

### 📊 **Atividade**
- Log de atividades recentes
- Histórico de ações do usuário

## 📱 **Responsividade**

### 🖥️ **Desktop (≥1024px)**
- Grid de 4 colunas para módulos
- Layout completo com sidebar
- Todas as funcionalidades visíveis

### 📱 **Tablet (768px - 1023px)**
- Grid de 2-3 colunas para módulos
- Layout adaptado
- Funcionalidades otimizadas

### 📱 **Mobile (<768px)**
- Grid de 1 coluna para módulos
- Interface simplificada
- Navegação otimizada para toque

## 🔐 **Sistema de Permissões**

### 📋 **Módulos Disponíveis**

| Módulo | Permissões Necessárias | Descrição |
|--------|----------------------|-----------|
| **Usuários & Grupos** | `USERS_READ`, `USERS_WRITE`, `GROUPS_READ`, `GROUPS_WRITE` | Gestão de usuários e permissões |
| **Clientes & Contratos** | `CLIENTS_READ`, `CLIENTS_WRITE`, `CONTRACTS_READ`, `CONTRACTS_WRITE` | Gestão de clientes e contratos |
| **Funcionários & RH** | `EMPLOYEES_READ`, `EMPLOYEES_WRITE`, `PAYSLIPS_READ`, `PAYSLIPS_WRITE` | Gestão de colaboradores |
| **Financeiro** | `FINANCIAL_READ`, `FINANCIAL_WRITE`, `PAYSLIPS_READ`, `PAYSLIPS_WRITE` | Gestão financeira |
| **Estoque & Equipamentos** | `STOCK_READ`, `STOCK_WRITE`, `EQUIPMENTS_READ`, `EQUIPMENTS_WRITE` | Controle de equipamentos |
| **Frota & Veículos** | `EQUIPMENTS_READ`, `EQUIPMENTS_WRITE` | Gestão da frota |
| **Relatórios & Analytics** | `REPORTS_READ`, `REPORTS_GENERATE` | Relatórios gerenciais |
| **Comercial & Vendas** | `LEADS_READ`, `LEADS_WRITE`, `PROPOSALS_READ`, `PROPOSALS_WRITE` | Gestão comercial |
| **Operacional** | `EMPLOYEES_READ`, `CONTRACTS_READ` | Gestão operacional |
| **Mensagens & Comunicação** | `MESSAGES_READ`, `MESSAGES_WRITE` | Sistema de mensagens |
| **Suporte & Help Desk** | `SUPPORT_READ`, `SUPPORT_WRITE` | Suporte técnico |
| **Sistema & Configurações** | `SYSTEM_CONFIG`, `SYSTEM_LOGS` | Configurações do sistema |

### 🔑 **Roles Suportados**

- **SUPER_ADMIN**: Acesso total a todos os módulos
- **ADMIN**: Acesso amplo à maioria dos módulos
- **SUPERVISOR**: Acesso a módulos operacionais
- **RH**: Acesso a recursos humanos e folha
- **FINANCEIRO**: Acesso a módulos financeiros
- **TI_SUPORTE**: Acesso a sistema e suporte
- **AUDITOR**: Acesso somente leitura
- **COLABORADOR**: Acesso básico
- **GESTOR**: Acesso a gestão operacional

## 🛠️ **Tecnologias Utilizadas**

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Radix UI** - Componentes base
- **React Router** - Navegação
- **Context API** - Gerenciamento de estado

## 📁 **Estrutura de Arquivos**

```
src/components/dashboard/
├── InteractiveDashboard.tsx    # Componente principal
├── LiveStats.tsx              # Estatísticas em tempo real
├── NotificationCenter.tsx     # Centro de notificações
├── QuickActions.tsx          # Ações rápidas
├── ResponsiveWidget.tsx      # Widget responsivo
├── index.ts                  # Exportações
└── README.md                # Documentação
```

## 🚀 **Como Usar**

### 1. **Importar o Componente**
```tsx
import InteractiveDashboard from '@/components/dashboard/InteractiveDashboard';

// Ou importar componentes individuais
import { LiveStats, NotificationCenter, QuickActions } from '@/components/dashboard';
```

### 2. **Usar no Dashboard**
```tsx
const Dashboard = () => {
  return (
    <Layout activePage="dashboard">
      <InteractiveDashboard />
    </Layout>
  );
};
```

### 3. **Customizar Notificações**
```tsx
<NotificationCenter
  notifications={customNotifications}
  onMarkAsRead={handleMarkAsRead}
  onMarkAllAsRead={handleMarkAllAsRead}
/>
```

## 🎯 **Próximas Funcionalidades**

- [ ] **Temas Customizáveis**: Múltiplos temas visuais
- [ ] **Widgets Personalizáveis**: Drag & drop para reorganizar
- [ ] **Filtros Avançados**: Filtros por data, módulo, etc.
- [ ] **Exportação de Dados**: Exportar métricas em PDF/Excel
- [ ] **Integração com APIs**: Dados reais em tempo real
- [ ] **Modo Offline**: Funcionalidade básica offline
- [ ] **PWA**: Progressive Web App
- [ ] **Notificações Push**: Notificações do navegador

## 🔧 **Manutenção**

### **Atualizar Módulos**
Para adicionar um novo módulo, edite o array `allModules` em `InteractiveDashboard.tsx`:

```tsx
{
  id: 'novo-modulo',
  name: 'Novo Módulo',
  description: 'Descrição do módulo',
  icon: NovoIcon,
  color: 'bg-purple-500',
  permissions: ['NOVO_MODULO_READ', 'NOVO_MODULO_WRITE'],
  route: '/novo-modulo',
  stats: [
    { label: 'Métrica 1', value: 100, change: { value: 5, isPositive: true } }
  ]
}
```

### **Customizar Cores**
As cores são definidas usando classes do Tailwind CSS. Para personalizar:

```tsx
// Cores dos módulos
color: 'bg-blue-500'    // Azul
color: 'bg-green-500'   // Verde
color: 'bg-yellow-500'  // Amarelo
// etc.
```

## 📞 **Suporte**

Para dúvidas ou problemas com o Dashboard Interativo:

1. Verifique a documentação dos componentes
2. Consulte os logs do console do navegador
3. Verifique as permissões do usuário
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para Secure Guard**
