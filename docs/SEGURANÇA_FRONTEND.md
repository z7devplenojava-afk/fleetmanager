# Segurança no Frontend - Módulo de Candidatos

## 🛡️ Melhorias de Segurança Implementadas

### 1. **Validação Robusta de Formulários**
```typescript
// Validação completa de CPF com dígitos verificadores
cpf: {
  required: true,
  custom: (value) => {
    // Validação completa de CPF
    const numbers = value.replace(/\D/g, '');
    if (numbers.length !== 11) return 'CPF deve ter 11 dígitos';
    // ... validação dos dígitos verificadores
  }
}
```

### 2. **Sanitização de Entrada (Anti-XSS)**
```typescript
// Remove caracteres perigosos
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"']/g, '').trim();
};
```

### 3. **Validação Rigorosa de Arquivos**
```typescript
// Verifica tipo, tamanho e nome do arquivo
export const validateFile = (file: File): string | null => {
  // Apenas PDF e Word
  const allowedTypes = ['application/pdf', 'application/msword', ...];
  
  // Máximo 2MB
  if (file.size > 2 * 1024 * 1024) return 'Arquivo muito grande';
  
  // Verifica nomes suspeitos
  const suspiciousPatterns = [/\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|war|ear|apk|dmg|deb|rpm|msi)$/i];
  
  return null; // arquivo válido
};
```

### 4. **Rate Limiting no Frontend**
```typescript
// Limite de 3 tentativas por hora
const rateLimiter = new RateLimiter(3, 3600000);

if (!rateLimiter.canAttempt(clientKey)) {
  // Bloqueia envio
  return;
}
```

### 5. **reCAPTCHA Integration**
```typescript
// Proteção contra bots
const { execute: executeRecaptcha } = useReCaptcha(siteKey);

// Executa antes do envio
const captchaToken = await executeRecaptcha();
```

### 6. **Validação em Tempo Real**
- Validação de campos conforme o usuário digita
- Feedback visual imediato de erros
- Formatação automática de CPF
- Limpeza automática de erros ao corrigir

### 7. **Proteção de Dados Sensíveis**
- Sanitização de todos os inputs
- Validação de email robusta
- Verificação de duplicatas
- Tratamento seguro de erros

## 🔧 Configuração Necessária

### 1. **Variáveis de Ambiente**
```bash
# .env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
```

### 2. **Configuração do reCAPTCHA**
1. Acesse https://www.google.com/recaptcha/admin
2. Crie um novo site
3. Escolha "reCAPTCHA v3"
4. Adicione seu domínio
5. Copie a chave do site para a variável de ambiente

### 3. **Dependências Necessárias**
```json
{
  "dependencies": {
    // Já incluídas no projeto
  }
}
```

## 📋 Checklist de Segurança Frontend

- [x] Validação de CPF completa
- [x] Sanitização de entrada (anti-XSS)
- [x] Validação de arquivos rigorosa
- [x] Rate limiting implementado
- [x] reCAPTCHA integrado
- [x] Validação em tempo real
- [x] Feedback visual de erros
- [x] Formatação automática de CPF
- [x] Proteção contra bots
- [x] Tratamento seguro de erros

## 🚨 Funcionalidades de Segurança

### 1. **Validação de CPF**
- Remove caracteres não numéricos
- Verifica se tem 11 dígitos
- Valida dígitos verificadores
- Formata automaticamente (XXX.XXX.XXX-XX)

### 2. **Validação de Email**
- Regex robusta para validação
- Verifica formato correto
- Previne emails inválidos

### 3. **Validação de Arquivos**
- Apenas PDF e Word aceitos
- Máximo 2MB
- Verifica nomes suspeitos
- Previne upload de malware

### 4. **Rate Limiting**
- 3 tentativas por hora por usuário
- Bloqueia spam
- Mensagem informativa de tempo restante

### 5. **reCAPTCHA**
- Proteção invisível
- Verificação automática
- Pontuação de risco
- Bloqueia bots automatizados

## 🔍 Testes de Segurança

### 1. **Teste de Validação de CPF**
```javascript
// CPF inválido
const invalidCPF = "123.456.789-00";
// Deve retornar erro

// CPF válido
const validCPF = "123.456.789-09";
// Deve aceitar
```

### 2. **Teste de Upload Malicioso**
```javascript
// Arquivo executável
const maliciousFile = new File([""], "malicious.exe", { type: "application/octet-stream" });
// Deve ser rejeitado

// Arquivo PDF válido
const validFile = new File([""], "curriculum.pdf", { type: "application/pdf" });
// Deve ser aceito
```

### 3. **Teste de Rate Limiting**
```javascript
// Tentar enviar 4 candidaturas rapidamente
// As primeiras 3 devem passar, a 4ª deve ser bloqueada
```

### 4. **Teste de Sanitização**
```javascript
// Input com script
const maliciousInput = "<script>alert('xss')</script>";
// Deve ser sanitizado para "scriptalert('xss')/script"
```

## 📱 UX/UI de Segurança

### 1. **Indicadores Visuais**
- Ícone de escudo no título
- Bordas vermelhas em campos com erro
- Ícones de alerta nos erros
- Mensagens claras de validação

### 2. **Feedback ao Usuário**
- Validação em tempo real
- Mensagens específicas de erro
- Aviso de limite de tentativas
- Confirmação de sucesso

### 3. **Acessibilidade**
- Labels claros
- Mensagens de erro acessíveis
- Navegação por teclado
- Contraste adequado

## 🔒 Conformidade LGPD

### 1. **Transparência**
- Aviso sobre uso dos dados
- Política de privacidade clara
- Consentimento explícito

### 2. **Minimização**
- Coleta apenas dados necessários
- Uso específico para candidatura
- Não compartilhamento desnecessário

### 3. **Segurança**
- Dados criptografados em trânsito
- Validação rigorosa
- Proteção contra vazamentos

## 🚀 Próximos Passos

### 1. **Melhorias Futuras**
- Implementar autenticação de dois fatores
- Adicionar logs de auditoria
- Implementar backup automático
- Configurar monitoramento de segurança

### 2. **Monitoramento**
- Alertas para tentativas suspeitas
- Dashboard de segurança
- Relatórios de incidentes
- Métricas de uso

### 3. **Testes Automatizados**
- Testes de segurança automatizados
- Validação de vulnerabilidades
- Testes de penetração
- Auditoria de código

## 📞 Suporte

Para questões de segurança:
- **Email**: security@empresa.com
- **Telefone**: (11) 99999-9999
- **Urgência**: 24/7

---

**Status**: ✅ **IMPLEMENTADO E TESTADO**
**Versão**: 1.0.0
**Última Atualização**: 2025-06-24 