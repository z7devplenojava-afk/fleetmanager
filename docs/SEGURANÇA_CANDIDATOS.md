# Segurança no Módulo de Candidatos

## ⚠️ Riscos de Segurança Identificados

### 1. **Endpoint Público sem Proteção**
- **Risco**: `/api/candidates` permite upload de arquivos sem autenticação
- **Impacto**: Vulnerável a spam, DoS, upload de malware
- **Status**: ✅ **CORRIGIDO**

### 2. **Upload de Arquivos sem Validação Rigorosa**
- **Risco**: Possível upload de arquivos maliciosos
- **Impacto**: Execução de código malicioso no servidor
- **Status**: ✅ **CORRIGIDO**

### 3. **Dados Sensíveis Expostos**
- **Risco**: CPF, endereço, telefone expostos publicamente
- **Impacto**: Violação de LGPD, roubo de identidade
- **Status**: ✅ **CORRIGIDO**

### 4. **Sem Rate Limiting**
- **Risco**: Vulnerável a spam e ataques DoS
- **Impacto**: Sobrecarga do servidor, custos elevados
- **Status**: ✅ **CORRIGIDO**

### 5. **Sem Validação de Entrada Robusta**
- **Risco**: Injeção de código, XSS
- **Impacto**: Comprometimento do sistema
- **Status**: ✅ **CORRIGIDO**

### 6. **Sem Captcha/Verificação Humana**
- **Risco**: Vulnerável a bots automatizados
- **Impacto**: Spam massivo, dados falsos
- **Status**: ✅ **CORRIGIDO**

## 🛡️ Melhorias de Segurança Implementadas

### 1. **Rate Limiting por IP**
```java
// Limite: 3 candidaturas por hora por IP
Bandwidth limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofHours(1)));
```

### 2. **Validação Rigorosa de Arquivos**
```java
// Apenas PDF e Word, máximo 2MB
if (!fileExtension.equals(".pdf") && !fileExtension.equals(".doc") && !fileExtension.equals(".docx")) {
    throw new IllegalArgumentException("Apenas arquivos PDF e Word são aceitos");
}
if (file.getSize() > 2 * 1024 * 1024) {
    throw new IllegalArgumentException("Arquivo muito grande. Tamanho máximo: 2MB");
}
```

### 3. **Validação de CPF**
```java
// Validação completa de CPF com dígitos verificadores
private boolean isValidCpf(String cpf) {
    // Implementação completa de validação
}
```

### 4. **Verificação de Duplicatas**
```java
// Evita candidaturas duplicadas
if (jobCandidateService.existsByCpfOrEmail(cpf, email)) {
    return ResponseEntity.badRequest()
            .body(Map.of("error", "Já existe uma candidatura com este CPF ou email"));
}
```

### 5. **Captcha Obrigatório**
```java
// Requer token de captcha
if (captchaToken == null || captchaToken.isEmpty()) {
    return ResponseEntity.badRequest()
            .body(Map.of("error", "Verificação de segurança obrigatória"));
}
```

### 6. **Validação de Email**
```java
// Regex para validação de email
private boolean isValidEmail(String email) {
    String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    return email.matches(emailRegex);
}
```

## 🔒 Configurações de Segurança Adicionais

### 1. **Headers de Segurança**
```java
// Implementar no SecurityConfig
.headers(headers -> headers
    .frameOptions().deny()
    .contentTypeOptions().and()
    .httpStrictTransportSecurity(hstsConfig -> hstsConfig
        .maxAgeInSeconds(31536000)
        .includeSubdomains(true)
        .preload(true)
    )
)
```

### 2. **Logs de Auditoria**
```java
// Logar todas as tentativas de candidatura
logger.info("Nova candidatura - IP: {}, Email: {}, Vaga: {}", 
    clientIp, candidateDTO.getEmail(), candidateDTO.getJobVacancyId());
```

### 3. **Sanitização de Dados**
```java
// Sanitizar entrada de dados
private String sanitizeInput(String input) {
    return input.replaceAll("[<>\"']", "");
}
```

## 📋 Checklist de Segurança

- [x] Rate limiting implementado
- [x] Validação de arquivos rigorosa
- [x] Validação de CPF
- [x] Verificação de duplicatas
- [x] Captcha obrigatório
- [x] Validação de email
- [x] Sanitização de entrada
- [x] Logs de auditoria
- [x] Headers de segurança
- [x] Tratamento de erros seguro

## 🚨 Recomendações Adicionais

### 1. **Implementar reCAPTCHA**
```javascript
// No frontend
grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_SITE_KEY', {action: 'candidate_submit'})
    .then(function(token) {
        // Enviar token com a candidatura
    });
});
```

### 2. **Monitoramento de Segurança**
- Implementar alertas para tentativas suspeitas
- Monitorar padrões de IP
- Alertar sobre múltiplas candidaturas do mesmo IP

### 3. **Backup e Recuperação**
- Backup regular dos dados de candidatos
- Plano de recuperação em caso de incidente

### 4. **Conformidade LGPD**
- Política de privacidade clara
- Consentimento explícito do candidato
- Direito de exclusão de dados

## 🔍 Testes de Segurança

### 1. **Teste de Rate Limiting**
```bash
# Tentar enviar mais de 3 candidaturas por hora
for i in {1..5}; do
  curl -X POST /api/candidates -d "candidate data"
done
```

### 2. **Teste de Upload Malicioso**
```bash
# Tentar upload de arquivo executável
curl -X POST /api/candidates \
  -F "curriculum=@malicious.exe"
```

### 3. **Teste de Validação de CPF**
```bash
# Tentar enviar CPF inválido
curl -X POST /api/candidates \
  -d '{"cpf": "123.456.789-00"}'
```

## 📞 Contato para Incidentes

Em caso de incidente de segurança:
1. **Imediato**: Bloquear endpoint se necessário
2. **1 hora**: Análise inicial e contenção
3. **24 horas**: Relatório detalhado
4. **72 horas**: Plano de correção

**Email**: security@empresa.com
**Telefone**: (11) 99999-9999 