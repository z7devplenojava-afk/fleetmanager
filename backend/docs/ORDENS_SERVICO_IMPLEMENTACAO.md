# Implementação das Ordens de Serviço (SST)

## Visão Geral

Este documento descreve a implementação completa do sistema de Ordens de Serviço (SST) no backend e frontend.

## Backend

### Modelo (OrderOfService.java)

```java
@Entity
@Table(name = "orders_of_service")
public class OrderOfService {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCpf;
    private String role;
    private String company;
    private String client;
    private String workplace;
    private BigDecimal salary;
    private LocalDate startDate;
    private LocalDate endDate;
    private String documentUrl;
    private Boolean signed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### DTOs

- **OrderOfServiceDTO**: Para retorno de dados
- **CreateOrderOfServiceDTO**: Para criação/atualização com validações

### Repositório (OrderOfServiceRepository.java)

Métodos disponíveis:
- `findByEmployeeId(Long employeeId)`
- `findBySigned(Boolean signed)`
- `searchByTerm(String searchTerm)`
- `findByEmployeeIdAndSigned(Long employeeId, Boolean signed)`

### Serviço (OrderOfServiceService.java)

Funcionalidades implementadas:
- ✅ Criar ordem de serviço
- ✅ Listar todas as ordens
- ✅ Listar por funcionário
- ✅ Buscar por ID
- ✅ Atualizar ordem
- ✅ Assinar ordem
- ✅ Atualizar URL do documento
- ✅ Excluir ordem
- ✅ Buscar por termo
- ✅ Filtrar por status de assinatura

### Controller (OrderOfServiceController.java)

Endpoints disponíveis:

```
GET    /api/orders-of-service              - Listar todas ou filtrar
GET    /api/orders-of-service/{id}         - Buscar por ID
POST   /api/orders-of-service              - Criar nova
PUT    /api/orders-of-service/{id}         - Atualizar
POST   /api/orders-of-service/{id}/sign    - Assinar
POST   /api/orders-of-service/{id}/document - Atualizar documento
DELETE /api/orders-of-service/{id}         - Excluir
```

### Migração (V200__create_orders_of_service_table.sql)

Tabela criada com:
- Índices para performance
- Campos obrigatórios e opcionais
- Timestamps automáticos
- Constraint de salário positivo

## Frontend

### Tipos (orderOfService.ts)

```typescript
export interface OrderOfService {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
  documentUrl?: string;
  signed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderOfServiceDTO {
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
}
```

### Serviço (orderOfServiceService.ts)

Métodos implementados:
- `listByEmployee(employeeId: number)`
- `listAll()`
- `findById(id: number)`
- `create(dto: CreateOrderOfServiceDTO)`
- `update(id: number, dto: CreateOrderOfServiceDTO)`
- `sign(orderId: number, signature: string)`
- `uploadDocument(orderId: number, file: File)`
- `getDocument(orderId: number)`
- `delete(id: number)`

### Página Principal (OrdemServico.tsx)

Funcionalidades:
- ✅ Listagem de ordens de serviço
- ✅ Filtro por ID do funcionário
- ✅ Tabela responsiva com hover
- ✅ Botões de ação (Ver, Documento)
- ✅ Status visual (assinada/não assinada)
- ✅ Modal de criação
- ✅ Modal de visualização

### Modais

#### EmitirOrdemServicoModal.tsx
- Formulário completo para criação
- Validações de campos obrigatórios
- Tratamento de erros
- Design consistente com o tema

#### OrdemServicoViewModal.tsx
- Visualização detalhada da ordem
- Informações organizadas em seções
- Botões para visualizar/download de documento
- Formatação de moeda e datas

## Funcionalidades Implementadas

### ✅ Backend
- [x] Modelo completo com JPA
- [x] Repositório com queries customizadas
- [x] Serviço com todas as operações CRUD
- [x] Controller com endpoints REST
- [x] DTOs com validações
- [x] Migração do banco de dados
- [x] Tratamento de exceções

### ✅ Frontend
- [x] Tipos TypeScript
- [x] Serviço de API
- [x] Página principal com tabela
- [x] Modal de criação
- [x] Modal de visualização
- [x] Filtros e busca
- [x] Design responsivo
- [x] Tratamento de erros

### ✅ Integração
- [x] Comunicação completa entre frontend e backend
- [x] Autenticação JWT
- [x] Validações consistentes
- [x] Formatação de dados

## Como Testar

1. **Inicie o backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Execute o script de teste:**
   ```bash
   cd backend
   ./test_orders_of_service.ps1
   ```

3. **Acesse o frontend:**
   ```
   http://localhost:3000/rh/ordens-servico
   ```

4. **Teste as funcionalidades:**
   - Criar nova ordem de serviço
   - Visualizar ordens existentes
   - Filtrar por funcionário
   - Assinar ordens
   - Visualizar documentos

## Exemplo de Uso

### Criar Ordem de Serviço
```json
{
  "employeeId": 1,
  "employeeName": "João Silva Santos",
  "employeeCpf": "123.456.789-00",
  "role": "Segurança Patrimonial",
  "company": "Segurança Ltda",
  "client": "Shopping Centro",
  "workplace": "Posto Shopping Centro",
  "salary": 2500.00,
  "startDate": "2024-01-15",
  "endDate": "2024-12-31"
}
```

### Resposta
```json
{
  "id": 1,
  "employeeId": 1,
  "employeeName": "João Silva Santos",
  "employeeCpf": "123.456.789-00",
  "role": "Segurança Patrimonial",
  "company": "Segurança Ltda",
  "client": "Shopping Centro",
  "workplace": "Posto Shopping Centro",
  "salary": 2500.00,
  "startDate": "2024-01-15",
  "endDate": "2024-12-31",
  "documentUrl": null,
  "signed": false,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

## Próximos Passos

- [ ] Upload de documentos
- [ ] Geração de PDF
- [ ] Assinatura digital
- [ ] Notificações por email
- [ ] Relatórios
- [ ] Integração com funcionários existentes 