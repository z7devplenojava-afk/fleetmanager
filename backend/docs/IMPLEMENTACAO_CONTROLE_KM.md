# Implementação do Controle de Quilometragem (KM)

## Visão Geral

Este documento descreve a implementação do sistema de controle de quilometragem baseado na planilha Excel fornecida pelo cliente, expandindo o módulo de frota existente com funcionalidades avançadas de controle de km.

## Componentes Implementados

### 1. Nova Entidade: MileageRecord
- **Controle detalhado de quilometragem** por veículo
- **Cálculo automático** de distância percorrida, consumo médio e custo por km
- **Tipos de viagem** (Urbano, Rodovia, Misto, Entrega, Patrulha, etc.)
- **Controle de motorista** e propósito da viagem

### 2. Entidade Vehicle Expandida
- **Campos adicionais** para controle de km
- **Status expandidos** (Ativo, Inativo, Em Manutenção, Fora de Serviço, Reservado)
- **Tipos de combustível expandidos** (incluindo Elétrico, Híbrido, GNV)
- **Controle de motorista responsável** e departamento

### 3. DTOs
- **MileageRecordDTO**: Para transferência de dados de registros de km

### 4. Repository
- **MileageRecordRepository**: Queries avançadas para controle de km
- **Relatórios agrupados** por tipo de viagem, combustível, veículo, motorista
- **Top 10** veículos por distância, consumo e custo por km

### 5. Service
- **MileageRecordService**: Lógica de negócio para controle de km
- **Validações** de quilometragem e cálculos automáticos
- **Atualização automática** da quilometragem do veículo

### 6. Controller
- **MileageRecordController**: Endpoints REST completos
- **Relatórios e estatísticas** avançadas
- **Filtros avançados** para análise de dados

### 7. Migrations
- **V220**: Criação da tabela mileage_records
- **V221**: Expansão da tabela vehicles

## Funcionalidades Implementadas

### Controle de Quilometragem
- ✅ **Registro diário** de quilometragem por veículo
- ✅ **Cálculo automático** de distância percorrida
- ✅ **Cálculo automático** de consumo médio (km/l)
- ✅ **Cálculo automático** de custo por km
- ✅ **Validação** de quilometragem (inicial < final)
- ✅ **Prevenção** de registros duplicados na mesma data
- ✅ **Atualização automática** da quilometragem do veículo

### Tipos de Viagem
- **URBAN**: Viagem urbana
- **HIGHWAY**: Viagem em rodovia
- **MIXED**: Viagem mista
- **DELIVERY**: Entrega
- **PATROL**: Patrulha de segurança
- **MAINTENANCE**: Manutenção
- **OTHER**: Outro

### Tipos de Combustível
- **GASOLINE**: Gasolina
- **ETHANOL**: Etanol
- **DIESEL**: Diesel
- **FLEX**: Flex
- **ELECTRIC**: Elétrico
- **HYBRID**: Híbrido
- **CNG**: GNV

### Relatórios e Estatísticas
- ✅ **Por tipo de viagem**: Distância, combustível, custo, consumo médio
- ✅ **Por tipo de combustível**: Estatísticas por combustível
- ✅ **Por veículo**: Performance individual de cada veículo
- ✅ **Por motorista**: Performance por motorista
- ✅ **Top 10 veículos** por distância percorrida
- ✅ **Top 10 veículos** por melhor consumo
- ✅ **Top 10 veículos** por menor custo por km
- ✅ **Análise de baixo consumo** (alertas)
- ✅ **Análise de alto custo por km** (alertas)

### Filtros Avançados
- ✅ **Por veículo** específico
- ✅ **Por período** (data início/fim)
- ✅ **Por tipo de viagem**
- ✅ **Por tipo de combustível**
- ✅ **Por motorista**
- ✅ **Por destino**
- ✅ **Por propósito**
- ✅ **Combinação** de múltiplos filtros

## Segurança

### Permissões Implementadas
- **SUPER_ADMIN**: Acesso total a todos os endpoints
- **MANAGE_FLEET**: Gerenciamento da frota e controle de km

### Endpoints Protegidos
Todos os endpoints estão protegidos com `@PreAuthorize` incluindo o ROLE SUPER_ADMIN para acesso total.

## Estrutura do Banco de Dados

### Tabela mileage_records
```sql
- id (UUID, PK)
- vehicle_id (UUID, FK)
- date (DATE, NOT NULL)
- initial_mileage (INTEGER, NOT NULL)
- final_mileage (INTEGER, NOT NULL)
- distance_traveled (INTEGER, NOT NULL)
- fuel_consumed (DECIMAL(10,2), NOT NULL)
- fuel_cost (DECIMAL(10,2), NOT NULL)
- cost_per_km (DECIMAL(10,2), NOT NULL)
- average_consumption (DECIMAL(10,2), NOT NULL)
- trip_type (VARCHAR(20), NOT NULL)
- fuel_type (VARCHAR(20), NOT NULL)
- driver (VARCHAR(100))
- destination (VARCHAR(200))
- purpose (VARCHAR(200))
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabela vehicles (expandida)
```sql
- id (UUID, PK)
- plate (VARCHAR(10), UNIQUE, NOT NULL)
- model (VARCHAR(100), NOT NULL)
- brand (VARCHAR(100), NOT NULL)
- year (INTEGER, NOT NULL)
- color (VARCHAR(50))
- status (VARCHAR(20), NOT NULL)
- fuel_type (VARCHAR(20), NOT NULL)
- capacity (INTEGER, NOT NULL)
- current_mileage (INTEGER, NOT NULL)
- last_maintenance_date (DATE)
- next_maintenance_date (DATE)
- insurance_expiry_date (DATE)
- documentation_expiry_date (DATE)
- initial_mileage (INTEGER) [NOVO]
- average_consumption (DECIMAL(10,2)) [NOVO]
- average_cost_per_km (DECIMAL(10,2)) [NOVO]
- assigned_driver (VARCHAR(100)) [NOVO]
- department (VARCHAR(100)) [NOVO]
- location (VARCHAR(200)) [NOVO]
- notes (TEXT) [NOVO]
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Endpoints Disponíveis

### Registros de Quilometragem (/api/mileage-records)
- `GET /` - Listar registros (paginado)
- `GET /all` - Listar todos os registros
- `GET /{id}` - Buscar por ID
- `GET /vehicle/{vehicleId}` - Buscar por veículo
- `GET /vehicle/{vehicleId}/page` - Buscar por veículo (paginado)
- `GET /period` - Buscar por período
- `GET /vehicle/{vehicleId}/period` - Buscar por veículo e período
- `GET /driver/{driver}` - Buscar por motorista
- `GET /trip-type/{tripType}` - Buscar por tipo de viagem
- `GET /fuel-type/{fuelType}` - Buscar por tipo de combustível
- `GET /destination/{destination}` - Buscar por destino
- `GET /purpose/{purpose}` - Buscar por propósito
- `GET /low-consumption` - Buscar registros com baixo consumo
- `GET /high-cost-per-km` - Buscar registros com alto custo por km
- `GET /filters` - Filtros avançados
- `POST /` - Criar registro
- `PUT /{id}` - Atualizar registro
- `DELETE /{id}` - Excluir registro

### Estatísticas por Veículo (/api/mileage-records/stats/vehicle/{vehicleId})
- `GET /distance` - Distância total
- `GET /fuel-consumed` - Combustível total consumido
- `GET /fuel-cost` - Custo total de combustível
- `GET /average-consumption` - Consumo médio
- `GET /average-cost-per-km` - Custo médio por km

### Estatísticas por Período (/api/mileage-records/stats/period)
- `GET /distance` - Distância total em período
- `GET /fuel-consumed` - Combustível total consumido em período
- `GET /fuel-cost` - Custo total de combustível em período

### Relatórios (/api/mileage-records/reports)
- `GET /by-trip-type` - Por tipo de viagem
- `GET /by-fuel-type` - Por tipo de combustível
- `GET /by-vehicle` - Por veículo
- `GET /by-driver` - Por motorista
- `GET /top-vehicles-by-distance` - Top veículos por distância
- `GET /top-vehicles-by-consumption` - Top veículos por consumo
- `GET /top-vehicles-by-cost-per-km` - Top veículos por custo por km

### Último Registro
- `GET /vehicle/{vehicleId}/latest` - Último registro do veículo

## Validações Implementadas

### Registros de Quilometragem
- Quilometragem inicial obrigatória
- Quilometragem final obrigatória
- Quilometragem final deve ser maior que a inicial
- Quilometragem inicial não pode ser menor que a atual do veículo
- Distância percorrida não pode ser muito alta (> 1000 km)
- Combustível consumido obrigatório e maior que zero
- Custo do combustível obrigatório e maior que zero
- Tipo de viagem obrigatório
- Tipo de combustível obrigatório
- Não permite registros duplicados na mesma data para o mesmo veículo

## Cálculos Automáticos

### Distância Percorrida
```java
distanceTraveled = finalMileage - initialMileage
```

### Consumo Médio (km/l)
```java
averageConsumption = distanceTraveled / fuelConsumed
```

### Custo por Km
```java
costPerKm = fuelCost / distanceTraveled
```

## Integração com Sistema Existente

### Compatibilidade
- ✅ **Integração total** com módulo de frota existente
- ✅ **Compatibilidade** com registros de abastecimento (FuelRecord)
- ✅ **Compatibilidade** com sistema de multas (Fine)
- ✅ **Atualização automática** da quilometragem do veículo

### Melhorias no Sistema Existente
- ✅ **Expansão** da entidade Vehicle
- ✅ **Novos status** de veículo
- ✅ **Novos tipos** de combustível
- ✅ **Controle de motorista** responsável
- ✅ **Departamento** responsável
- ✅ **Localização** atual do veículo

## Próximos Passos

1. **Frontend**: Implementar interfaces para controle de km
2. **Testes**: Criar testes unitários e de integração
3. **Documentação**: Documentar APIs no Swagger
4. **Otimizações**: Implementar cache para relatórios
5. **Integração**: Conectar com módulo financeiro
6. **Alertas**: Sistema de notificações para manutenção
7. **Dashboard**: Visualizações gráficas de performance

## Observações

- Todos os endpoints incluem o ROLE SUPER_ADMIN para acesso total
- As migrations são compatíveis com o banco existente
- A implementação segue os padrões do projeto
- Documentação Swagger incluída em todos os endpoints
- Validações robustas implementadas
- Índices de banco otimizados para performance
- Cálculos automáticos garantem precisão dos dados
- Sistema previne registros duplicados e inconsistências 