# Widget de Controle de Visitas

## 📋 Descrição
Widget simplificado integrado ao Dashboard Operacional para monitoramento de visitas em tempo real.

## 🎯 Funcionalidades

### 📊 **Métricas Principais** (Card 1)
- **Visitas Hoje**: Contador de visitas do dia atual
- **Taxa de Sucesso**: Percentual de visitas concluídas com sucesso
- **Visitas Realizadas**: Total de visitas completadas
- **Visitas Pendentes**: Visitas aguardando execução
- **Supervisores Ativos**: Número de supervisores em atividade

### 📝 **Visitas Recentes** (Card 2)
- **Lista das últimas 3 visitas** realizadas ou em andamento
- **Informações por visita**:
  - Horário da visita
  - Nome do supervisor responsável
  - Local/unidade visitada
  - Status atual com badge colorido

### 🔴 **Status Disponíveis**
- ✅ **Concluída** - Verde (bg-green-500/20)
- ⏳ **Em Andamento** - Azul (bg-blue-500/20)
- ⏰ **Pendente** - Amarelo (bg-yellow-500/20)
- ❌ **Cancelada** - Vermelho (bg-red-500/20)

## 🎨 Design & Layout

### **Estrutura Visual**
```
┌─────────────────────┬─────────────────────────────────┐
│  Controle Visitas   │     Visitas Recentes           │
│  ┌─────┬─────┐      │  ┌─────────────────────────┐   │
│  │Today│Rate │      │  │ 14:30 Shopping Center   │   │
│  │ 15  │90.1%│      │  │ Maria Santos [Concluída]│   │
│  └─────┴─────┘      │  └─────────────────────────┘   │
│  Realizadas: 128     │  ┌─────────────────────────┐   │
│  Pendentes: 8        │  │ 10:15 Condomínio Res.   │   │
│  Supervisores: 12    │  │ João Silva [Em Andament]│   │
│  ┌──────┬──────┐     │  └─────────────────────────┘   │
│  │+Nova │ Ver  │     │  ┌─────────────────────────┐   │
│  │Visita│Todas │     │  │ 09:00 Empresa ABC       │   │
│  └──────┴──────┘     │  │ Ana Costa [Pendente]    │   │
└─────────────────────┴─────────────────────────────────┘
```

### **Responsividade**
- **Desktop**: Layout em 3 colunas (1 + 2)
- **Mobile**: Layout empilhado (coluna única)
- **Grid**: `grid-cols-1 lg:grid-cols-3`

## ⚡ Como Usar

### **1. Integração**
```tsx
import VisitWidget from '@/components/operacional/VisitWidget';

// No dashboard operacional
<VisitWidget />
```

### **2. Localização**
- **Página**: `/operacional` (aba Dashboard)
- **Posição**: Logo após as métricas principais do operacional
- **Menu**: "Controle de Visitas" na sidebar → leva para `/operacional`

## 🔄 Dados Simulados

O widget atualmente usa dados mockados para demonstração:

```typescript
// Métricas de exemplo
{
  totalVisits: 142,
  completedVisits: 128,
  pendingVisits: 8,
  todayVisits: 15,
  completionRate: 90.1,
  activeSupervisors: 12
}

// Visitas recentes de exemplo
[
  { time: '14:30', supervisor: 'Maria Santos', unit: 'Shopping Center Norte', status: 'COMPLETED' },
  { time: '10:15', supervisor: 'João Silva', unit: 'Condomínio Residencial', status: 'IN_PROGRESS' },
  { time: '09:00', supervisor: 'Ana Costa', unit: 'Empresa ABC Ltda', status: 'PENDING' }
]
```

## 🎯 Vantagens da Integração

### **✅ Centralização**
- Todas as informações operacionais em um só lugar
- Navegação simplificada (sem páginas separadas)
- Visão holística do dashboard operacional

### **📱 Simplicidade**
- Interface clean e focada no essencial
- Carregamento rápido (componente leve)
- Fácil compreensão visual

### **🔧 Manutenção**
- Menos código para manter
- Estrutura mais simples
- Integração natural com o sistema operacional

## 🚀 Próximos Passos

- [ ] **Conectar APIs reais** de visitas
- [ ] **Implementar ações** dos botões (Nova Visita, Ver Todas)
- [ ] **Adicionar auto-refresh** dos dados
- [ ] **Incluir notificações** para visitas atrasadas
- [ ] **Expandir métricas** conforme necessidade
