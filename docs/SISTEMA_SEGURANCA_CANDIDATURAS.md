# Sistema de Segurança para Candidaturas - Implementação Completa

## Visão Geral

O sistema de candidaturas foi implementado com múltiplas camadas de segurança para proteger contra bots, ataques automatizados e uso indevido da plataforma.

## 🛡️ Proteções Implementadas

### 1. Google reCAPTCHA v3
- **Tipo**: Invisível (sem interação do usuário)
- **Funcionalidade**: Analisa comportamento do usuário
- **Score**: Aceita scores >= 0.5 (0.0 = bot, 1.0 = humano)
- **Implementação**: 
  - Frontend: `RecaptchaProvider` e `useRecaptcha` hook
  - Backend: `RecaptchaService` com validação de token

### 2. Rate Limiting
- **Limite**: 3 candidaturas por hora por IP
- **Tecnologia**: Bucket4j
- **Implementação**: `JobCandidateController` com buckets por IP

### 3. Validação de Dados
- **CPF**: Validação de formato e dígitos verificadores
- **Email**: Validação de formato e domínio
- **Arquivos**: Validação de tipo, tamanho e conteúdo
- **Sanitização**: Remoção de caracteres perigosos

### 4. Verificação de Duplicatas
- **CPF**: Evita múltiplas candidaturas com mesmo CPF
- **Email**: Evita múltiplas candidaturas com mesmo email
- **Implementação**: `JobCandidateService.existsByCpfOrEmail()`

### 5. Upload Seguro de Arquivos
- **Tipos Permitidos**: PDF, DOC, DOCX
- **Tamanho Máximo**: 5MB
- **Validação**: Verificação de conteúdo real do arquivo
- **Armazenamento**: Sistema de arquivos seguro

## 🔧 Configuração

### Frontend (.env)
```env
VITE_RECAPTCHA_SITE_KEY=sua_chave_do_site_aqui
```

### Backend (application-dev.properties)
```properties
# Chave secreta do reCAPTCHA v3
recaptcha.secret.key=SUA_CHAVE_SECRETA_AQUI
recaptcha.verify.url=https://www.google.com/recaptcha/api/siteverify
```

## 📁 Arquivos Implementados

### Backend
- `RecaptchaService.java` - Validação de tokens reCAPTCHA
- `JobCandidateController.java` - Endpoints com proteções
- `application-dev.properties` - Configurações de segurança
- `RECAPTCHA_CONFIGURATION.md` - Documentação de configuração

### Frontend
- `RecaptchaProvider.tsx` - Provider do reCAPTCHA
- `useRecaptcha.ts` - Hook para execução
- `CandidateFormModal.tsx` - Formulário com validações
- `.env` - Configuração da chave do site

## 🚀 Fluxo de Segurança

### 1. Frontend
```
Usuário preenche formulário
    ↓
Validações client-side (CPF, email, arquivo)
    ↓
Execução do reCAPTCHA (invisível)
    ↓
Envio dos dados + token reCAPTCHA
```

### 2. Backend
```
Recebe requisição
    ↓
Rate Limiting (verifica IP)
    ↓
Validação do token reCAPTCHA
    ↓
Validações server-side (CPF, email)
    ↓
Verificação de duplicatas
    ↓
Validação do arquivo
    ↓
Processamento da candidatura
```

## 🔍 Monitoramento

### Logs Importantes
```properties
# Backend
logging.level.com.z7design.secured_guard.service.RecaptchaService=DEBUG
logging.level.com.z7design.secured_guard.controller.JobCandidateController=DEBUG
```

### Métricas a Monitorar
- Taxa de sucesso na validação reCAPTCHA
- Scores médios dos usuários
- Tentativas de bypass detectadas
- Taxa de rejeição por rate limiting
- Candidaturas duplicadas detectadas

## 🛠️ Troubleshooting

### Erro: "Falha na verificação de segurança"
- Verificar chaves do reCAPTCHA
- Confirmar domínio autorizado
- Verificar logs do backend

### Erro: "Limite de candidaturas excedido"
- Rate limiting funcionando
- Aguardar 1 hora ou usar IP diferente

### Erro: "Já existe uma candidatura"
- Sistema detectou duplicata
- Verificar CPF/email já cadastrado

## 🔒 Segurança em Produção

### Configurações Obrigatórias
1. **Chave Secreta**: Sempre configurar em produção
2. **Domínios**: Autorizar apenas domínios válidos
3. **HTTPS**: Usar sempre em produção
4. **Logs**: Monitorar tentativas de bypass

### Recomendações
- Ajustar score mínimo conforme necessário
- Monitorar métricas de segurança
- Implementar alertas para tentativas suspeitas
- Revisar logs regularmente

## ✅ Status da Implementação

- ✅ reCAPTCHA v3 integrado
- ✅ Rate limiting implementado
- ✅ Validações de dados
- ✅ Verificação de duplicatas
- ✅ Upload seguro de arquivos
- ✅ Documentação completa
- ✅ Configuração de desenvolvimento
- ✅ Testes de compilação

## 🎯 Próximos Passos

1. **Configurar chaves reCAPTCHA** para produção
2. **Testar fluxo completo** de candidatura
3. **Monitorar métricas** de segurança
4. **Ajustar configurações** conforme necessário
5. **Implementar alertas** para tentativas suspeitas

---

**Sistema de Segurança Implementado com Sucesso!** 🎉 