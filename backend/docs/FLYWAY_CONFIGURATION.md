# Configuração do Flyway

## Visão Geral

O Flyway está configurado para usar as configurações de banco de dados centralizadas no `application.properties`, mantendo apenas as configurações mínimas necessárias no `pom.xml` para o plugin Maven funcionar.

## Configuração Atual

### application-dev.properties
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5433/secured_guard_dev
spring.datasource.username=postgres
spring.datasource.password=1234567
spring.datasource.driver-class-name=org.postgresql.Driver

# Flyway Configuration
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.clean-disabled=false
spring.flyway.out-of-order=true
```

### pom.xml (Plugin Flyway)
```xml
<plugin>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-maven-plugin</artifactId>
    <version>9.22.3</version>
    <configuration>
        <url>jdbc:postgresql://localhost:5433/secured_guard_dev</url>
        <user>postgres</user>
        <password>1234567</password>
        <cleanDisabled>false</cleanDisabled>
    </configuration>
</plugin>
```

## Comandos Disponíveis

### Verificar Status das Migrações
```bash
.\mvnw flyway:info
```

### Executar Migrações
```bash
.\mvnw flyway:migrate
```

### Limpar Banco de Dados
```bash
.\mvnw flyway:clean
```

### Limpar e Executar Migrações
```bash
.\mvnw flyway:clean flyway:migrate
```

## Observações

1. **Configuração Centralizada**: As configurações principais ficam no `application.properties`
2. **Plugin Maven**: Mantém apenas as configurações mínimas necessárias para funcionar via linha de comando
3. **Ambiente de Desenvolvimento**: Usa o perfil `dev` por padrão
4. **Migrações**: Localizadas em `src/main/resources/db/migration/`
5. **Versão Atual**: v208 (67 migrações aplicadas)

## Próximos Passos

Para adicionar novas migrações:
1. Criar arquivo SQL em `src/main/resources/db/migration/`
2. Nomear seguindo o padrão: `V{version}__{description}.sql`
3. Executar `.\mvnw flyway:migrate` para aplicar 