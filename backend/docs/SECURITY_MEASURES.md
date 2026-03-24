# Medidas de Segurança - Endpoint Público de Candidatura

## Visão Geral

O endpoint público de candidatura (`POST /api/candidates`) foi implementado com **múltiplas camadas de segurança** para proteger contra ataques automatizados, spam, fraudes e invasões, mantendo a acessibilidade para candidatos legítimos.

## Camadas de Segurança Implementadas

### 1. **Rate Limiting (Limitação de Taxa)**
- **Limite por IP**: Máximo de 3 candidaturas por hora por IP
- **Limite diário**: Máximo de 20 candidaturas por dia por IP
- **Implementação**: Usando Bucket4j com refill greedy
- **Proteção**: Evita spam e ataques de força bruta

### 2. **reCAPTCHA v3**
- **Validação obrigatória**: Token do reCAPTCHA é obrigatório
- **Score mínimo**: 0.5 (0.0 = bot, 1.0 = humano)
- **Validação por IP**: Token é validado contra o IP do cliente
- **Fallback**: Em desenvolvimento, aceita tokens (configurável)

### 3. **Validação de Dados Sensíveis**
- **CPF**: Validação completa com dígitos verificadores
- **Email**: Regex para formato válido
- **Telefone**: Formato brasileiro (XX) XXXXX-XXXX
- **Sanitização**: Remoção de caracteres especiais e normalização

### 4. **Validação de Arquivos**
- **Tipos permitidos**: PDF, DOC, DOCX
- **Tamanho máximo**: 5MB
- **Validação de conteúdo**: Verificação de MIME type
- **Proteção**: Evita upload de arquivos maliciosos

### 5. **Detecção de Padrões Maliciosos**
- **SQL Injection**: Detecção de comandos SQL
- **XSS (Cross-Site Scripting)**: Detecção de scripts maliciosos
- **Command Injection**: Detecção de comandos do sistema
- **Regex patterns**: Padrões configuráveis para detecção

### 6. **Monitoramento de Segurança Avançado**
- **Tentativas suspeitas**: Detecção de padrões anômalos
- **Bloqueio de IPs**: IPs com múltiplas tentativas suspeitas
- **Logging detalhado**: Registro de todas as tentativas
- **Estatísticas**: Métricas de segurança para administradores

### 7. **Validação de Duplicatas**
- **CPF único**: Verificação de CPF já cadastrado
- **Email único**: Verificação de email já cadastrado
- **Prevenção**: Evita candidaturas duplicadas

### 8. **Sanitização de Dados**
- **Remoção de caracteres especiais**: Limpeza de dados de entrada
- **Normalização**: Padronização de formatos
- **Truncamento**: Limitação de tamanho de campos

### 9. **Logging e Auditoria**
- **Logs estruturados**: Registro detalhado de tentativas
- **Mascaramento**: Dados sensíveis mascarados nos logs
- **Alertas**: Notificações para tentativas suspeitas
- **Rastreabilidade**: Rastreamento completo de ações

### 10. **CORS Configurado**
- **Endpoint público**: CORS liberado para acesso externo
- **Headers permitidos**: Configuração específica para candidatura
- **Origem**: Permitido acesso de qualquer origem

## Configuração de Segurança

### Variáveis de Ambiente
```properties
# reCAPTCHA
recaptcha.secret.key=your_recaptcha_secret_key
recaptcha.verify.url=https://www.google.com/recaptcha/api/siteverify

# Limites de segurança
security.candidate.max_attempts_per_hour=3
security.candidate.max_attempts_per_day=20
security.candidate.suspicious_pattern_threshold=3
```

### Limites Configuráveis
- **Rate Limiting**: Ajustável por ambiente
- **Tamanho de arquivo**: Configurável
- **Thresholds**: Limites de detecção ajustáveis
- **Timeouts**: Tempos de bloqueio configuráveis

## Endpoints de Monitoramento

### Estatísticas de Segurança
```
GET /api/hr/security/stats
```
**Permissão**: SUPER_ADMIN, ADMIN

**Resposta**:
```json
{
  "totalIps": 150,
  "blockedIps": 5,
  "suspiciousPatterns": 12
}
```

## Fluxo de Segurança

1. **Recebimento da requisição**
2. **Rate limiting check**
3. **Validação de reCAPTCHA**
4. **Sanitização de dados**
5. **Validação de campos obrigatórios**
6. **Detecção de padrões maliciosos**
7. **Verificação de duplicatas**
8. **Validação de arquivo (se presente)**
9. **Processamento da candidatura**
10. **Logging da tentativa**

## Respostas de Erro

### Rate Limit Excedido (429)
```json
{
  "error": "Limite de candidaturas excedido. Tente novamente em 1 hora."
}
```

### Captcha Inválido (400)
```json
{
  "error": "Falha na verificação de segurança. Tente novamente."
}
```

### Dados Inválidos (400)
```json
{
  "error": "CPF inválido"
}
```

### Acesso Negado (403)
```json
{
  "error": "Acesso negado por questões de segurança. Tente novamente mais tarde."
}
```

## Recomendações de Uso

### Para Desenvolvimento
1. Configure o reCAPTCHA para desenvolvimento
2. Ajuste os limites de rate limiting
3. Monitore os logs de segurança
4. Teste com dados válidos e inválidos

### Para Produção
1. Configure chaves reCAPTCHA válidas
2. Ajuste limites baseado no volume esperado
3. Configure alertas para tentativas suspeitas
4. Monitore estatísticas regularmente
5. Mantenha logs por pelo menos 30 dias

### Para Manutenção
1. Revise logs de segurança periodicamente
2. Ajuste thresholds baseado em padrões reais
3. Atualize padrões de detecção conforme necessário
4. Backup das configurações de segurança

## Logs de Segurança

### Exemplos de Logs
```
🚫 Rate limit excedido para IP: 192.168.1.100
🚫 Captcha inválido do IP: 10.0.0.50
🚨 Padrão malicioso detectado do IP: 172.16.0.25 - Padrão: SQL Injection
✅ Candidatura válida recebida do IP: 203.0.113.10 - Nome: João Silva, Email: j***@gmail.com
```

### Níveis de Log
- **INFO**: Candidaturas válidas
- **WARN**: Tentativas suspeitas
- **ERROR**: Ataques detectados

## Considerações de Performance

- **Cache**: Rate limiting em memória
- **Async**: Processamento assíncrono quando possível
- **Timeout**: Configuração de timeouts adequados
- **Monitoring**: Métricas de performance

## Conformidade

- **LGPD**: Dados pessoais protegidos
- **Logs**: Rastreabilidade completa
- **Consentimento**: Captcha como consentimento implícito
- **Retenção**: Política de retenção de dados

## Suporte

Para dúvidas sobre segurança:
1. Consulte os logs do sistema
2. Verifique as estatísticas de segurança
3. Entre em contato com a equipe de segurança
4. Documente incidentes para análise

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
**Responsável**: Equipe de Segurança 