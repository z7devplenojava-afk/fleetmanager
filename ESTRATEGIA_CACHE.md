# 🚀 Estratégia de Cache - Secured Guard

## 📋 Visão Geral

Este documento descreve a estratégia de cache implementada no sistema Secured Guard usando **Redis** como camada de cache distribuído.

## 🎯 Objetivos

1. **Reduzir carga no banco de dados** - Cachear consultas frequentes
2. **Melhorar performance** - Reduzir tempo de resposta das APIs
3. **Escalabilidade** - Suportar múltiplas instâncias do backend
4. **Consistência** - Invalidação inteligente de cache

## 🏗️ Arquitetura

### Camadas de Cache

```
Frontend → Backend → Redis Cache → PostgreSQL
                    ↓ (cache miss)
                    PostgreSQL
```

### Tipos de Cache por TTL

| Tipo de Dado | TTL | Cache Name | Exemplo |
|--------------|-----|------------|---------|
| **Dashboard/Estatísticas** | 5 min | `dashboard-summary`, `dashboard-stats` | Resumo do dashboard |
| **Entidades Principais** | 30 min | `employees`, `vehicles`, `clients` | Lista de funcionários |
| **Listas/Combos** | 1 hora | `departments`, `positions`, `units` | Departamentos |
| **Configurações** | 24 horas | `config`, `security-settings` | Configurações do sistema |
| **Relatórios** | 2 horas | `reports`, `fuel-reports` | Relatórios processados |
| **Dados Temporários** | 15 min | `sessions`, `temp-data` | Sessões temporárias |

## 📦 Implementação

### 1. Configuração Redis

**Arquivo:** `RedisCacheConfig.java`

```java
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
public class RedisCacheConfig {
    // Configuração de TTLs específicos por tipo de cache
}
```

### 2. Uso de Cache em Serviços

#### Exemplo: DashboardService

```java
@Cacheable(value = "dashboard-summary", key = "'summary'")
public DashboardSummaryDTO getDashboardSummary() {
    // Lógica de busca
}
```

#### Exemplo: EmployeeService

```java
@Cacheable(value = "employees", key = "#id")
public Employee findById(UUID id) {
    // Busca no banco
}

@CacheEvict(value = {"employees", "employees-by-company"}, allEntries = true)
public EmployeeDTO update(UUID id, EmployeeDTO dto) {
    // Atualização invalida cache automaticamente
}
```

### 3. Invalidação de Cache

#### Usando CacheUtil

```java
@Autowired
private CacheUtil cacheUtil;

// Limpar cache específico
cacheUtil.evictCache("dashboard-summary");

// Limpar múltiplos caches
cacheUtil.evictCaches("employees", "dashboard-summary");

// Limpar cache de uma entidade e relacionados
cacheUtil.evictEntityCaches("employee");
```

## 🔧 Configuração

### application.properties

```properties
# Habilitar cache Redis
spring.cache.type=redis
spring.cache.redis.time-to-live=1800

# Configuração Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
```

### application-ci.properties

```properties
# Cache Redis para ambiente CI
spring.cache.type=redis
spring.cache.redis.time-to-live=1800
spring.data.redis.host=${SPRING_REDIS_HOST:redis-ci}
spring.data.redis.port=${SPRING_REDIS_PORT:6379}
spring.data.redis.password=${SPRING_REDIS_PASSWORD:redis_ci_2025}
```

## 📊 Serviços com Cache Implementado

### ✅ Implementado

- ✅ `DashboardService` - Estatísticas do dashboard
- ✅ `EquipmentService` - Equipamentos (já existia)
- ✅ `UnitService` - Unidades (já existia)

### 🔄 Próximos a Implementar

- ⏳ `EmployeeService` - Funcionários
- ⏳ `VehicleService` - Veículos
- ⏳ `ClientService` - Clientes
- ⏳ `DepartmentService` - Departamentos
- ⏳ `PositionService` - Cargos
- ⏳ `InvoiceService` - Faturas
- ⏳ `FuelRecordService` - Registros de combustível

## 🎨 Padrões de Cache

### 1. Cache de Consultas Simples

```java
@Cacheable(value = "employees", key = "#id")
public Employee findById(UUID id) {
    return employeeRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
}
```

### 2. Cache de Listas

```java
@Cacheable(value = "departments", key = "'all'")
public List<Department> findAll() {
    return departmentRepository.findAll();
}
```

### 3. Cache com Parâmetros

```java
@Cacheable(value = "employees-by-company", key = "#companyId")
public List<Employee> findByCompanyId(UUID companyId) {
    return employeeRepository.findByCompanyId(companyId);
}
```

### 4. Invalidação ao Atualizar

```java
@CacheEvict(value = {"employees", "employees-by-company"}, allEntries = true)
public EmployeeDTO update(UUID id, EmployeeDTO dto) {
    // Atualização
}
```

### 5. Invalidação ao Criar

```java
@CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
public EmployeeDTO create(EmployeeDTO dto) {
    // Criação
}
```

### 6. Invalidação ao Deletar

```java
@CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
public void delete(UUID id) {
    // Deleção
}
```

## 🔍 Monitoramento

### Verificar Status do Cache

```java
@Autowired
private CacheUtil cacheUtil;

CacheUtil.CacheStats stats = cacheUtil.getCacheStats();
log.info("Total de caches: {}", stats.getTotalCaches());
log.info("Caches disponíveis: {}", stats.getCacheNames());
```

### Limpar Todos os Caches (Admin)

```java
@PostMapping("/admin/cache/clear")
public ResponseEntity<String> clearAllCaches() {
    cacheUtil.evictAllCaches();
    return ResponseEntity.ok("Todos os caches foram limpos");
}
```

## ⚠️ Boas Práticas

1. **Sempre invalidar cache ao modificar dados**
   ```java
   @CacheEvict(value = "employees", allEntries = true)
   ```

2. **Usar chaves específicas para cache granular**
   ```java
   @Cacheable(value = "employees", key = "#id")
   ```

3. **Não cachear dados sensíveis ou muito dinâmicos**
   - Senhas, tokens
   - Dados em tempo real

4. **Monitorar uso de memória Redis**
   - Configurar limites adequados
   - Usar TTL apropriado

5. **Testar invalidação de cache**
   - Garantir que dados atualizados aparecem corretamente

## 🚀 Performance Esperada

### Antes do Cache
- Dashboard: ~500-1000ms
- Lista de funcionários: ~200-500ms
- Consultas simples: ~50-100ms

### Depois do Cache
- Dashboard: ~10-50ms (cache hit)
- Lista de funcionários: ~10-30ms (cache hit)
- Consultas simples: ~5-15ms (cache hit)

**Melhoria estimada: 10-50x mais rápido em cache hits**

## 📝 Checklist de Implementação

Para adicionar cache em um novo serviço:

- [ ] Identificar métodos que fazem consultas frequentes
- [ ] Adicionar `@Cacheable` nos métodos de leitura
- [ ] Adicionar `@CacheEvict` nos métodos de escrita (create/update/delete)
- [ ] Definir TTL apropriado no `RedisCacheConfig`
- [ ] Testar invalidação de cache
- [ ] Monitorar performance

## 🔗 Referências

- [Spring Cache Abstraction](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)
- [Spring Data Redis](https://spring.io/projects/spring-data-redis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
