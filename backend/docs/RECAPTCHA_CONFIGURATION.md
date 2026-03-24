# Configuração do reCAPTCHA v3

## Visão Geral

O sistema de candidaturas utiliza o Google reCAPTCHA v3 para proteção contra bots e ataques automatizados. O reCAPTCHA v3 é invisível e não requer interação do usuário.

## Configuração

### 1. Obter Chaves do Google reCAPTCHA

1. Acesse: https://www.google.com/recaptcha/admin
2. Faça login com sua conta Google
3. Clique em "+" para adicionar um novo site
4. Configure:
   - **Tipo**: reCAPTCHA v3
   - **Domínios**: Adicione os domínios onde o sistema será usado
   - **Aceitar termos de uso**

### 2. Configurar Backend

#### Ambiente de Desenvolvimento
Edite o arquivo `application-dev.properties`:

```properties
# Chave secreta do reCAPTCHA v3
recaptcha.secret.key=SUA_CHAVE_SECRETA_AQUI
```

#### Ambiente de Produção
Edite o arquivo `application-prod.properties`:

```properties
# Chave secreta do reCAPTCHA v3
recaptcha.secret.key=${RECAPTCHA_SECRET_KEY}
```

E configure a variável de ambiente:
```bash
export RECAPTCHA_SECRET_KEY=sua_chave_secreta_aqui
```

### 3. Configurar Frontend

No arquivo `.env` do frontend:

```env
VITE_RECAPTCHA_SITE_KEY=sua_chave_do_site_aqui
```

## Como Funciona

### Backend
- O `RecaptchaService` valida tokens enviados pelo frontend
- Verifica o score do reCAPTCHA (0.0 = bot, 1.0 = humano)
- Aceita scores >= 0.5 como válidos
- Em caso de erro, rejeita por segurança

### Frontend
- O componente `RecaptchaProvider` carrega o script do reCAPTCHA
- O hook `useRecaptcha` executa a verificação
- O token é enviado junto com os dados da candidatura

## Segurança

### Proteções Implementadas
1. **Validação de Token**: Verifica autenticidade com Google
2. **Score Analysis**: Analisa comportamento do usuário
3. **Rate Limiting**: Limita candidaturas por IP
4. **Input Validation**: Valida dados sensíveis
5. **Duplicate Check**: Evita candidaturas duplicadas

### Configuração de Produção
- Sempre use variáveis de ambiente para chaves secretas
- Configure domínios corretos no Google reCAPTCHA
- Monitore logs de validação
- Ajuste score mínimo conforme necessário

## Troubleshooting

### Erro: "Falha na verificação de segurança"
- Verifique se as chaves estão configuradas corretamente
- Confirme se o domínio está autorizado no Google reCAPTCHA
- Verifique logs do backend para detalhes

### Erro: "Verificação de segurança obrigatória"
- Frontend não está enviando o token
- Verifique se o script do reCAPTCHA está carregando
- Confirme se a chave do site está correta

### Desenvolvimento Local
- Para desenvolvimento, o sistema aceita tokens vazios se a chave secreta não estiver configurada
- Em produção, sempre configure a chave secreta

## Monitoramento

### Logs Importantes
```java
// Logs de validação do reCAPTCHA
logging.level.com.z7design.secured_guard.service.RecaptchaService=DEBUG
```

### Métricas
- Taxa de sucesso na validação
- Scores médios dos usuários
- Tentativas de bypass detectadas 