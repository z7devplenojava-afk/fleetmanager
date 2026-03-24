# 📋 Instruções para Testar Cadastro de Manutenção via Postman

## 🚀 **Como Usar:**

### **1. Importar no Postman:**
- Abra o Postman
- Clique em **"Import"**
- Selecione o arquivo `postman_maintenance_test.json`
- A coleção será importada automaticamente

### **2. Configurar Variáveis:**
- Clique na coleção **"Teste Cadastro Manutenção - SecureGuard"**
- Vá em **"Variables"**
- Configure:
  - `baseUrl`: `http://localhost:8081`
  - `token`: Deixe vazio por enquanto

### **3. Ordem de Execução:**
**⚠️ IMPORTANTE: Execute na ordem correta!**

1. **Login** → Obter token JWT
2. **Criar Cliente** → Anotar o `clientId` retornado
3. **Criar Unidade** → Anotar o `unitId` retornado  
4. **Criar Cargo** → Anotar o `positionId` retornado
5. **Criar Funcionário** → Anotar o `employeeId` retornado
6. **Criar Veículo** → Anotar o `vehicleId` retornado
7. **Criar Manutenções** → Testar diferentes tipos

---

## 🔑 **Dados de Login (Exemplo):**
```json
{
  "username": "admin@securedguard.com",
  "password": "admin123"
}
```

**⚠️ Ajuste conforme suas credenciais reais!**

---

## 📝 **Exemplos de Dados para Manutenção:**

### **Manutenção Preventiva:**
```json
{
  "vehicleId": "{{vehicleId}}",
  "date": "2025-08-20",
  "maintenanceType": "PREVENTIVE",
  "description": "Manutenção preventiva programada - troca de óleo, filtros e verificação geral do sistema",
  "cost": 450.00,
  "provider": "Oficina Central Ltda",
  "mileage": 50000,
  "status": "SCHEDULED",
  "priority": "MEDIUM",
  "notes": "Manutenção de rotina a cada 10.000 km. Verificar também freios e suspensão."
}
```

### **Manutenção Corretiva:**
```json
{
  "vehicleId": "{{vehicleId}}",
  "date": "2025-08-15",
  "maintenanceType": "CORRECTIVE",
  "description": "Reparo no sistema de ar condicionado - compressor com vazamento",
  "cost": 1200.00,
  "provider": "Clima Express",
  "mileage": 48500,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "notes": "Cliente reclamou que o ar não está gelando. Verificar também o sistema elétrico."
}
```

### **Manutenção Preditiva:**
```json
{
  "vehicleId": "{{vehicleId}}",
  "date": "2025-09-01",
  "maintenanceType": "PREDICTIVE",
  "description": "Análise preditiva do motor - verificação de vibrações e análise de óleo",
  "cost": 300.00,
  "provider": "Tecno Diagnósticos",
  "mileage": 52000,
  "status": "SCHEDULED",
  "priority": "LOW",
  "notes": "Análise preventiva para identificar possíveis problemas futuros no motor."
}
```

### **Manutenção Urgente:**
```json
{
  "vehicleId": "{{vehicleId}}",
  "date": "2025-08-14",
  "maintenanceType": "CORRECTIVE",
  "description": "Reparo emergencial no sistema de freios - pastilhas desgastadas e fluido vazando",
  "cost": 800.00,
  "provider": "Freios Seguros",
  "mileage": 49000,
  "status": "SCHEDULED",
  "priority": "URGENT",
  "notes": "URGENTE: Veículo com problema de segurança. Não deve circular até o reparo."
}
```

---

## 🎯 **Tipos de Manutenção Disponíveis:**

### **MaintenanceType:**
- `PREVENTIVE` - Preventiva
- `CORRECTIVE` - Corretiva  
- `PREDICTIVE` - Preditiva
- `IMPROVEMENT` - Melhoria
- `OTHER` - Outro

### **MaintenanceStatus:**
- `SCHEDULED` - Agendada
- `IN_PROGRESS` - Em Andamento
- `COMPLETED` - Concluída
- `CANCELLED` - Cancelada

### **MaintenancePriority:**
- `LOW` - Baixa
- `MEDIUM` - Média
- `HIGH` - Alta
- `URGENT` - Urgente

---

## 🔍 **Endpoints de Consulta:**

### **Listar Todas:**
```
GET {{baseUrl}}/api/maintenances
```

### **Por Veículo:**
```
GET {{baseUrl}}/api/maintenances/vehicle/{{vehicleId}}
```

### **Por Status:**
```
GET {{baseUrl}}/api/maintenances/status/SCHEDULED
```

### **Urgentes:**
```
GET {{baseUrl}}/api/maintenances/urgent
```

### **Vencidas:**
```
GET {{baseUrl}}/api/maintenances/overdue
```

---

## ⚠️ **Validações Importantes:**

### **Campos Obrigatórios:**
- `vehicleId` - UUID válido
- `date` - Data futura ou presente
- `maintenanceType` - Um dos tipos válidos
- `description` - Entre 10 e 1000 caracteres
- `status` - Um dos status válidos
- `priority` - Uma das prioridades válidas

### **Campos Opcionais:**
- `cost` - Decimal positivo (se informado)
- `provider` - Máximo 200 caracteres
- `mileage` - Número positivo (se informado)
- `notes` - Máximo 1000 caracteres

---

## 🚨 **Solução de Problemas:**

### **Erro 401 (Unauthorized):**
- Verifique se o token JWT está válido
- Faça login novamente para obter novo token

### **Erro 400 (Bad Request):**
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme se os valores dos enums estão corretos
- Valide se a data não está no passado

### **Erro 404 (Not Found):**
- Verifique se o `vehicleId` existe
- Confirme se o veículo foi criado antes da manutenção

### **Erro 500 (Internal Server Error):**
- Verifique os logs do backend
- Confirme se a tabela `vehicle_maintenances` existe
- Verifique se as migrações foram aplicadas

---

## 📊 **Testes Recomendados:**

1. **Criar manutenção com todos os campos**
2. **Criar manutenção apenas com campos obrigatórios**
3. **Testar diferentes tipos e prioridades**
4. **Verificar validações de data**
5. **Testar consultas por filtros**
6. **Atualizar status de manutenção**

---

## 🎉 **Sucesso!**

Se tudo funcionar, você verá:
- ✅ Manutenções sendo criadas no banco
- ✅ Frontend carregando as unidades
- ✅ Sistema de manutenção funcionando
- ✅ APIs respondendo corretamente

**Agora você pode testar o cadastro de manutenções via frontend!** 🚗🔧
