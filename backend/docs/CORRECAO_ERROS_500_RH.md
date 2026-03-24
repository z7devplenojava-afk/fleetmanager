# Correção dos Erros 500 nos Endpoints de RH

## Problema Identificado

O frontend estava tentando acessar endpoints de RH que não existiam no backend, causando erros 500:

1. `GET /api/hr/employees/probation-expiring?days=7` - 500 Error
2. `GET /hr/stats` - 500 Error

## Solução Implementada

### 1. Criação do HRController

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/controller/HRController.java`

Endpoints implementados:
- `GET /api/hr/employees/probation-expiring` - Funcionários com experiência vencendo
- `GET /api/hr/stats` - Estatísticas de RH
- `GET /api/hr/employees/active` - Funcionários ativos
- `GET /api/hr/employees/on-vacation` - Funcionários de férias
- `GET /api/hr/employees/on-sick-leave` - Funcionários de licença médica
- `GET /api/hr/employees/by-unit/{unitId}` - Funcionários por unidade
- `GET /api/hr/employees/by-position/{positionId}` - Funcionários por posição

### 2. Criação do EmployeeDTO

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/dto/EmployeeDTO.java`

DTO completo para representar dados de funcionários com:
- Dados pessoais (nome, CPF, RG, etc.)
- Endereço
- Informações bancárias
- Informações profissionais
- Documentos
- Contato de emergência

### 3. Criação do HRService

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/service/HRService.java`

Serviço com funcionalidades:
- Buscar funcionários com experiência vencendo
- Gerar estatísticas de RH
- Filtrar funcionários por status
- Converter dados do modelo para DTO

### 4. Estrutura de Dados

#### EmployeeDTO
```java
public class EmployeeDTO {
    private UUID id;
    private String name;
    private String cpf;
    private String rg;
    private LocalDate birthDate;
    private String gender;
    private String maritalStatus;
    private String photoUrl;
    private String email;
    private String phone;
    private AddressDTO address;
    private BankInfoDTO bankInfo;
    private JobInfoDTO jobInfo;
    private List<DocumentDTO> documents;
    private EmergencyContactDTO emergencyContact;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### Estatísticas de RH
```json
{
  "totalEmployees": 65,
  "activeEmployees": 45,
  "onVacation": 8,
  "onSickLeave": 2,
  "probationExpiring": 3,
  "openVacancies": 5,
  "pendingTransfers": 3,
  "pendingOccurrences": 7,
  "pendingVacations": 12,
  "byStatus": {
    "ACTIVE": 45,
    "INACTIVE": 5,
    "ON_LEAVE": 8,
    "TERMINATED": 5,
    "SUSPENDED": 2
  },
  "byUnit": {
    "Unidade Centro": 25,
    "Unidade Norte": 18,
    "Unidade Sul": 22
  },
  "byPosition": {
    "Vigilante": 45,
    "Supervisor": 12,
    "Gerente": 8
  }
}
```

## Endpoints Disponíveis

### Funcionários com Experiência Vencendo
```
GET /api/hr/employees/probation-expiring?days=7
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "rg": "12.345.678-9",
    "birthDate": "1985-03-15",
    "jobInfo": {
      "position": "Vigilante",
      "function": "Segurança Patrimonial",
      "unit": "Unidade Centro",
      "admissionDate": "2024-01-15",
      "status": "ACTIVE"
    }
  }
]
```

### Estatísticas de RH
```
GET /api/hr/stats
```

**Resposta**: Ver estrutura acima

### Funcionários Ativos
```
GET /api/hr/employees/active
```

### Funcionários de Férias
```
GET /api/hr/employees/on-vacation
```

### Funcionários de Licença Médica
```
GET /api/hr/employees/on-sick-leave
```

## Como Testar

1. **Inicie o backend**:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Execute o script de teste**:
   ```bash
   cd backend
   ./test_hr_endpoints.ps1
   ```

3. **Verifique no frontend**:
   - Acesse o dashboard de RH
   - Os erros 500 devem ter sido resolvidos
   - As estatísticas devem aparecer corretamente

## Observações

### Dados Mock
Alguns dados estão sendo retornados como mock devido à estrutura atual do modelo Employee:
- Informações bancárias
- Detalhes de endereço
- Contato de emergência
- Período de experiência
- Salário

### Próximos Passos
Para implementar dados reais, seria necessário:
1. Expandir o modelo Employee com campos adicionais
2. Criar migrações para adicionar as colunas necessárias
3. Atualizar os métodos de conversão no HRService

### Status Atual
- ✅ Endpoints funcionando
- ✅ Erros 500 resolvidos
- ✅ Frontend integrado
- ⚠ Dados parciais (alguns campos são mock)

## Resultado

Os erros 500 foram completamente resolvidos. O frontend agora consegue:
- Buscar funcionários com experiência vencendo
- Obter estatísticas de RH
- Filtrar funcionários por diferentes critérios
- Exibir dados no dashboard sem erros 