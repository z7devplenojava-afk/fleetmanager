# Configuração de Ambientes - SecuredGuard

Este documento explica como configurar e usar os diferentes ambientes do sistema SecuredGuard.

## Estrutura de Arquivos

```
src/main/resources/
├── application.properties          # Configurações comuns e perfil padrão
├── application-dev.properties     # Configurações específicas para desenvolvimento
├── application-test.properties    # Configurações específicas para teste
└── application-prod.properties    # Configurações específicas para produção
```

## Como Alterar o Ambiente

### Método 1: Alterar no arquivo principal
Edite o arquivo `application.properties` e altere a linha:
```properties
spring.profiles.active=dev
```
Para:
- `dev` - Ambiente de desenvolvimento
- `test` - Ambiente de teste
- `prod` - Ambiente de produção

### Método 2: Variável de ambiente
Defina a variável de ambiente:
```bash
# Windows
set SPRING_PROFILES_ACTIVE=dev

# Linux/Mac
export SPRING_PROFILES_ACTIVE=dev
```

### Método 3: Parâmetro JVM
Execute a aplicação com o parâmetro:
```bash
java -jar app.jar --spring.profiles.active=dev
```

## Configurações por Ambiente

### 🚀 Desenvolvimento (dev)
- **Banco**: `secured_guard_dev` na porta 5432
- **Logging**: DEBUG ativado
- **SQL**: Mostra queries SQL
- **Flyway**: Habilitado com out-of-order
- **Actuator**: Todos os endpoints expostos
- **Porta**: 8081

### 🧪 Teste (test)
- **Banco**: `secured_guard_test` na porta 5433
- **Logging**: WARN/INFO
- **SQL**: Mostra queries SQL
- **Flyway**: Desabilitado
- **JPA**: create-drop (recria banco a cada execução)
- **Porta**: 8082

### 🏭 Produção (prod)
- **Banco**: Configurado via variáveis de ambiente
- **Logging**: WARN/ERROR apenas
- **SQL**: Não mostra queries
- **Flyway**: Habilitado, sem out-of-order
- **SSL**: Habilitado
- **Actuator**: Apenas health, info, metrics
- **Porta**: 8081

## Variáveis de Ambiente para Produção

Para o ambiente de produção, você precisa definir as seguintes variáveis de ambiente:

### Banco de Dados
```bash
DB_URL=jdbc:postgresql://seu-servidor:5432/secured_guard_prod
DB_USERNAME=usuario_banco
DB_PASSWORD=senha_banco
DB_SECONDARY_URL=jdbc:postgresql://seu-servidor-backup:5432/secured_guard_backup
DB_SECONDARY_USERNAME=usuario_backup
DB_SECONDARY_PASSWORD=senha_backup
```

### SSL
```bash
SSL_KEYSTORE_PATH=/caminho/para/keystore.p12
SSL_KEYSTORE_PASSWORD=senha_keystore
```

### Email
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_FROM=seu-email@gmail.com
```

### Recaptcha
```bash
RECAPTCHA_SECRET_KEY=sua-chave-secreta-recaptcha
```

### N8N (Opcional)
```bash
N8N_ENABLED=true
N8N_BASE_URL=https://seu-n8n.com
N8N_WHATSAPP_PROVIDER=wppconnect
N8N_SESSION_NAME=securedguard
N8N_AUTO_START=false
```

## Comandos Úteis

### Executar em ambiente específico
```bash
# Desenvolvimento
mvn spring-boot:run -Dspring.profiles.active=dev

# Teste
mvn spring-boot:run -Dspring.profiles.active=test

# Produção
mvn spring-boot:run -Dspring.profiles.active=prod
```

### Verificar configurações ativas
```bash
# Ver logs de inicialização para confirmar o ambiente
mvn spring-boot:run
```

## Dicas de Segurança

1. **Nunca** commite senhas ou chaves secretas no repositório
2. Use variáveis de ambiente para configurações sensíveis
3. Em produção, sempre use SSL/TLS
4. Configure firewalls adequadamente
5. Use senhas fortes para bancos de dados
6. Mantenha logs de auditoria em produção

## Troubleshooting

### Problema: Aplicação não inicia
- Verifique se o banco de dados está rodando
- Confirme se as credenciais estão corretas
- Verifique se a porta não está em uso

### Problema: Flyway não executa
- Verifique se o banco existe
- Confirme se o usuário tem permissões adequadas
- Em produção, certifique-se que `out-of-order=false`

### Problema: Email não funciona
- Verifique as configurações SMTP
- Para Gmail, use "senha de app" não a senha normal
- Confirme se o firewall permite conexões SMTP 