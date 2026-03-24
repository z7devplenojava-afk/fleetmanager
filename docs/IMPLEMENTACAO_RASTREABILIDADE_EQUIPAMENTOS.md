# 🕵️ Sistema Completo de Rastreabilidade de Equipamentos

## 📋 Visão Geral

O **Sistema de Rastreabilidade** foi implementado para responder completamente à pergunta: **"Quem pegou o equipamento, qual posto de trabalho e quem autorizou o uso?"**

Agora você tem **CONTROLE TOTAL** sobre:
- ✅ **Quem** pegou cada equipamento
- ✅ **Onde** está sendo usado (posto de trabalho)
- ✅ **Quem autorizou** a retirada
- ✅ **Quando** foi retirado e devolvido
- ✅ **Por que** foi retirado (motivo)
- ✅ **Em que condições** estava na retirada e devolução

---

## 🚀 **Funcionalidades Implementadas**

### ✅ **Histórico Completo de Movimentações**

#### **Informações Rastreadas:**
- **Funcionário**: Quem pegou o equipamento (nome + CPF)
- **Posto de Trabalho**: Onde está sendo usado (nome + localização)
- **Autorizador**: Quem autorizou a retirada
- **Data/Hora de Retirada**: Momento exato da retirada
- **Data/Hora Prevista**: Quando deveria ser devolvido
- **Data/Hora Real**: Quando foi efetivamente devolvido
- **Motivo**: Por que foi retirado
- **Condição na Retirada**: Estado do equipamento ao sair
- **Condição na Devolução**: Estado do equipamento ao retornar
- **Observações**: Notas adicionais

#### **Tipos de Movimentação:**
- **Retirada**: Retirada padrão
- **Devolução**: Retorno do equipamento
- **Transferência**: Mudança de funcionário/posto
- **Manutenção**: Enviado para reparo
- **Inspeção**: Verificação técnica
- **Uso Temporário**: Uso por período limitado
- **Atribuição Permanente**: Uso permanente

### ✅ **Controles de Segurança**

#### **Validações Implementadas:**
- ✅ **Equipamento não pode ser retirado** se já estiver em uso
- ✅ **Funcionário deve existir** no sistema
- ✅ **Autorizador deve existir** no sistema
- ✅ **Posto de trabalho** validado (opcional)
- ✅ **Número de série único** por equipamento

#### **Alertas Automáticos:**
- ✅ **Equipamentos em Atraso**: Passaram da data de retorno
- ✅ **Vencendo em Breve**: Precisam ser devolvidos em X dias
- ✅ **Tempo de Uso**: Quantos dias o equipamento está fora

---

## 🏗️ **Arquitetura Técnica**

### **Backend (Spring Boot)**

#### **📁 Nova Entidade: EquipmentMovement**
```java
@Entity
@Table(name = "equipment_movements")
public class EquipmentMovement {
    private UUID id;
    private Equipment equipment;           // Qual equipamento
    private Employee employee;             // Quem pegou
    private WorkPost workPost;             // Onde está sendo usado
    private Employee authorizedBy;         // Quem autorizou
    private MovementType movementType;     // Tipo de movimentação
    private LocalDateTime movementDate;    // Quando foi retirado
    private LocalDateTime expectedReturnDate; // Quando deveria retornar
    private LocalDateTime actualReturnDate;   // Quando retornou
    private String reason;                 // Por que foi retirado
    private String conditionOnWithdrawal; // Estado na retirada
    private String conditionOnReturn;     // Estado na devolução
    private Boolean returned;             // Se foi devolvido
    // ... outros campos
}
```

#### **🗄️ Repository: EquipmentMovementRepository**
```java
// Histórico de um equipamento
List<EquipmentMovement> findByEquipmentIdOrderByMovementDateDesc(UUID equipmentId);

// Movimentações de um funcionário
List<EquipmentMovement> findByEmployeeIdOrderByMovementDateDesc(UUID employeeId);

// Movimentações de um posto
List<EquipmentMovement> findByWorkPostIdOrderByMovementDateDesc(UUID workPostId);

// Equipamentos em uso
List<EquipmentMovement> findActiveWithdrawals();

// Equipamentos em atraso
List<EquipmentMovement> findOverdueMovements(LocalDateTime currentDate);
```

#### **⚙️ Service: EquipmentMovementService**
- **Criar movimentação** com todas as validações
- **Processar devolução** automaticamente
- **Buscar histórico** completo por equipamento
- **Alertas de atraso** e vencimento
- **Relatórios** por funcionário/posto/autorizador

#### **🌐 Controller: EquipmentMovementController**
```http
POST   /api/equipment-movements                    # Criar movimentação
POST   /api/equipment-movements/{id}/return        # Processar devolução
GET    /api/equipment-movements/equipment/{id}/history # Histórico do equipamento
GET    /api/equipment-movements/employee/{id}      # Movimentações do funcionário
GET    /api/equipment-movements/work-post/{id}     # Movimentações do posto
GET    /api/equipment-movements/active             # Equipamentos em uso
GET    /api/equipment-movements/overdue            # Equipamentos atrasados
```

### **Frontend (React/TypeScript)**

#### **📱 Componente: EquipmentHistoryModal**
- **Modal completo** para visualizar histórico
- **Cards informativos** para cada movimentação
- **Cores diferenciadas** por tipo e status
- **Informações completas** de rastreabilidade

#### **🎨 Integração na Página Principal**
- **Botão "Ver Histórico"** em cada equipamento
- **Tooltips informativos** em todos os botões
- **Interface responsiva** e moderna

---

## 📊 **Banco de Dados**

### **Tabela: equipment_movements**
```sql
CREATE TABLE equipment_movements (
    id UUID PRIMARY KEY,
    equipment_id UUID NOT NULL,           -- Qual equipamento
    employee_id UUID NOT NULL,            -- Quem pegou
    work_post_id UUID,                    -- Onde está sendo usado
    authorized_by_id UUID NOT NULL,       -- Quem autorizou
    movement_type VARCHAR(50) NOT NULL,   -- Tipo de movimentação
    movement_date TIMESTAMP NOT NULL,     -- Quando foi retirado
    expected_return_date TIMESTAMP,       -- Quando deve retornar
    actual_return_date TIMESTAMP,         -- Quando retornou
    reason VARCHAR(500),                  -- Motivo da retirada
    notes TEXT,                           -- Observações
    returned BOOLEAN DEFAULT FALSE,       -- Se foi devolvido
    condition_on_withdrawal VARCHAR(100), -- Estado na retirada
    condition_on_return VARCHAR(100),     -- Estado na devolução
    created_at TIMESTAMP DEFAULT NOW(),
    -- Foreign keys para todas as entidades relacionadas
);
```

---

## 🔍 **Como Usar o Sistema de Rastreabilidade**

### **1. Retirar um Equipamento**
```http
POST /api/equipment-movements
{
  "equipmentId": "uuid-do-equipamento",
  "employeeId": "uuid-do-funcionario",
  "workPostId": "uuid-do-posto",
  "authorizedById": "uuid-do-autorizador",
  "movementType": "WITHDRAWAL",
  "movementDate": "2025-01-15T08:00:00",
  "expectedReturnDate": "2025-01-20T18:00:00",
  "reason": "Patrulhamento noturno",
  "conditionOnWithdrawal": "Excelente estado"
}
```

### **2. Ver Histórico de um Equipamento**
```http
GET /api/equipment-movements/equipment/{equipmentId}/history
```

**Resposta:**
```json
[
  {
    "id": "movement-uuid",
    "equipmentSerialNumber": "EQ-001-2025",
    "employeeName": "João Silva",
    "employeeCpf": "123.456.789-00",
    "workPostName": "Portaria Principal",
    "workPostLocation": "Entrada do prédio",
    "authorizedByName": "Maria Santos",
    "movementType": "WITHDRAWAL",
    "movementDate": "2025-01-15T08:00:00",
    "expectedReturnDate": "2025-01-20T18:00:00",
    "reason": "Patrulhamento noturno",
    "conditionOnWithdrawal": "Excelente estado",
    "returned": false,
    "isOverdue": false,
    "daysOut": 3,
    "status": "Em uso"
  }
]
```

### **3. Processar Devolução**
```http
POST /api/equipment-movements/{movementId}/return?conditionOnReturn=Bom estado&notes=Sem avarias
```

### **4. Ver Equipamentos em Atraso**
```http
GET /api/equipment-movements/overdue
```

### **5. Ver Movimentações de um Funcionário**
```http
GET /api/equipment-movements/employee/{employeeId}
```

### **6. Ver Movimentações de um Posto**
```http
GET /api/equipment-movements/work-post/{workPostId}
```

---

## 🎯 **Respostas às Suas Perguntas**

### ❓ **"Quem pegou o equipamento?"**
✅ **RESPOSTA COMPLETA:**
- **Nome do funcionário**: João Silva
- **CPF**: 123.456.789-00
- **Data/hora da retirada**: 15/01/2025 às 08:00
- **Há quantos dias está com ele**: 3 dias

### ❓ **"Qual posto de trabalho?"**
✅ **RESPOSTA COMPLETA:**
- **Nome do posto**: Portaria Principal
- **Localização**: Entrada do prédio
- **Desde quando está neste posto**: 15/01/2025

### ❓ **"Quem autorizou o uso?"**
✅ **RESPOSTA COMPLETA:**
- **Nome do autorizador**: Maria Santos
- **Data da autorização**: 15/01/2025 às 08:00
- **Motivo da autorização**: Patrulhamento noturno

### ❓ **"Estado do equipamento?"**
✅ **RESPOSTA COMPLETA:**
- **Condição na retirada**: Excelente estado
- **Condição na devolução**: (quando devolvido)
- **Observações**: Qualquer nota adicional

---

## 📈 **Relatórios Disponíveis**

### **Dashboard de Controle:**
- Total de equipamentos em uso
- Equipamentos em atraso
- Equipamentos vencendo em breve
- Top funcionários com mais equipamentos
- Top postos com mais equipamentos
- Top autorizadores

### **Relatórios Detalhados:**
- **Por Equipamento**: Histórico completo de movimentações
- **Por Funcionário**: Todos os equipamentos já utilizados
- **Por Posto**: Histórico de equipamentos no posto
- **Por Autorizador**: Todas as autorizações feitas
- **Por Período**: Movimentações em data específica

---

## ✅ **Status da Implementação**

### **Backend**: ✅ **100% COMPLETO**
- ✅ Entidade EquipmentMovement
- ✅ Repository com queries otimizadas
- ✅ Service com lógica completa
- ✅ Controller com todos os endpoints
- ✅ Migration V274 criada
- ✅ Validações de negócio

### **Frontend**: ✅ **100% COMPLETO**
- ✅ Tipos TypeScript
- ✅ Service de comunicação
- ✅ Modal de histórico
- ✅ Integração na página principal
- ✅ Interface responsiva

### **Rastreabilidade**: ✅ **100% FUNCIONAL**
- ✅ **Quem** pegou: Funcionário completo
- ✅ **Onde** está: Posto de trabalho
- ✅ **Quem autorizou**: Autorizador
- ✅ **Quando**: Datas de retirada/devolução
- ✅ **Por que**: Motivo da retirada
- ✅ **Como**: Estado na retirada/devolução

---

## 🔮 **Exemplo Prático de Uso**

### **Cenário:** Colete Balístico EQ-001-2025

**1. Retirada:**
- **Funcionário**: João Silva (CPF: 123.456.789-00)
- **Posto**: Portaria Principal
- **Autorizou**: Supervisor Maria Santos
- **Data**: 15/01/2025 às 08:00
- **Retorno previsto**: 20/01/2025 às 18:00
- **Motivo**: Patrulhamento noturno
- **Estado**: Excelente condição

**2. Consulta no Sistema:**
```
📍 Equipamento: EQ-001-2025
👤 Com: João Silva
📍 Local: Portaria Principal
✅ Autorizado por: Maria Santos
📅 Desde: 15/01/2025 (3 dias)
📅 Retorno em: 2 dias
```

**3. Devolução:**
- **Data real**: 19/01/2025 às 17:30
- **Estado**: Bom estado
- **Observações**: Sem avarias

---

## 🎉 **Conclusão**

**AGORA VOCÊ TEM CONTROLE TOTAL!** 

O sistema responde **COMPLETAMENTE** às suas perguntas:
- ✅ **Quem** pegou cada equipamento
- ✅ **Qual posto** de trabalho está usando
- ✅ **Quem autorizou** a retirada
- ✅ **Histórico completo** de movimentações
- ✅ **Alertas automáticos** de atraso
- ✅ **Relatórios detalhados** por período

**🚀 O sistema está pronto para uso imediato!** 