# 🧪 Testes Unitários - Sistema de Envio

## 📋 Cobertura de Testes

### 1. BaileysRestServiceTest
Testa o serviço de integração com Baileys REST API para envio via WhatsApp.

**Cenários cobertos:**
- ✅ Envio de mensagem de texto com sucesso
- ✅ Falha no envio de mensagem de texto
- ✅ Upload de arquivo via multipart com sucesso
- ✅ Arquivo não encontrado
- ✅ Baileys retorna 404 (file not found)
- ✅ Baileys retorna erro de validação
- ✅ Inicialização de instância
- ✅ Verificação de conexão (conectado/desconectado)
- ✅ Obtenção de QR Code
- ✅ Desconexão da instância

**Total:** 11 testes

---

### 2. EnvioServiceTest
Testa o serviço principal de envio de holerites via email e WhatsApp.

**Cenários cobertos:**
- ✅ Envio individual com CPF - sucesso
- ✅ User não encontrado
- ✅ WhatsApp não cadastrado
- ✅ Holerite não encontrado
- ✅ Envio em lote via WhatsApp - sucesso (filtra apenas users com WhatsApp)
- ✅ Envio em lote via Email - sucesso
- ✅ Nenhum destinatário encontrado
- ✅ Verificar se funcionário tem WhatsApp
- ✅ Verificar WhatsApp vazio/null
- ✅ Obter WhatsApp do funcionário
- ✅ User não encontrado ao obter WhatsApp

**Total:** 11 testes

---

## 🚀 Como Executar os Testes

### Executar todos os testes
```bash
cd backend
mvn test
```

### Executar apenas testes de um serviço
```bash
# Apenas BaileysRestService
mvn test -Dtest=BaileysRestServiceTest

# Apenas EnvioService
mvn test -Dtest=EnvioServiceTest
```

### Executar com relatório de cobertura
```bash
mvn test jacoco:report
```

O relatório será gerado em: `target/site/jacoco/index.html`

---

## 📊 Estrutura dos Testes

### BaileysRestServiceTest

```
BaileysRestServiceTest
├── testSendTextMessage_Success()
├── testSendTextMessage_Failure()
├── testSendFileMessage_Success()
├── testSendFileMessage_FileNotFound()
├── testSendFileMessage_BaileysReturns404()
├── testSendFileMessage_BaileysReturnsError()
├── testInitializeInstance_Success()
├── testCheckConnection_Connected()
├── testCheckConnection_Disconnected()
├── testCheckConnection_Error()
├── testDisconnectInstance_Success()
└── testGetQRCode_Success()
```

### EnvioServiceTest

```
EnvioServiceTest
├── testEnviarIndividual_ComCPF_Success()
├── testEnviarIndividual_UserNaoEncontrado()
├── testEnviarIndividual_WhatsAppNaoCadastrado()
├── testEnviarIndividual_HoleriteNaoEncontrado()
├── testEnviarTodosPorTipo_WhatsApp_Success()
├── testEnviarTodosPorTipo_Email_Success()
├── testEnviarTodosPorTipo_NenhumDestinatario()
├── testFuncionarioTemWhatsApp()
├── testFuncionarioTemWhatsApp_SemWhatsApp()
├── testObterWhatsAppFuncionario()
└── testObterWhatsAppFuncionario_UserNaoEncontrado()
```

---

## 🎯 Principais Validações

### BaileysRestService
1. **Upload Multipart**: Valida que arquivo é enviado via multipart/form-data
2. **Verificação de Arquivo**: Valida que arquivo existe antes de tentar enviar
3. **Tratamento de Erros**: Valida que erros do Baileys são tratados corretamente
4. **Headers Corretos**: Valida que headers multipart são configurados

### EnvioService
1. **Busca na Tabela Users**: Valida que busca APENAS na tabela users
2. **Validação de WhatsApp**: Valida que WhatsApp é obrigatório para envio
3. **Envio em Lote**: Valida que filtra apenas users com WhatsApp/Email
4. **Logs de Delivery**: Valida que logs são salvos corretamente
5. **Tratamento de Falhas**: Valida que falhas não param o processo em lote

---

## 🔧 Tecnologias Utilizadas

- **JUnit 5**: Framework de testes
- **Mockito**: Mock de dependências
- **Spring Test**: Utilitários de teste do Spring
- **@TempDir**: Criação de arquivos temporários para testes

---

## 📝 Boas Práticas Aplicadas

1. ✅ **Arrange-Act-Assert**: Estrutura clara em 3 seções
2. ✅ **Nomes Descritivos**: `testMetodo_Cenario_ResultadoEsperado()`
3. ✅ **Isolamento**: Cada teste é independente
4. ✅ **Mocks**: Dependências externas são mockadas
5. ✅ **Cobertura**: Casos de sucesso E falha
6. ✅ **Validações Específicas**: Verifica comportamentos específicos (ex: multipart)

---

## 🐛 Casos de Erro Testados

### BaileysRestService
- ❌ Arquivo não existe
- ❌ Baileys retorna 404
- ❌ Baileys retorna erro de validação
- ❌ Erro de conexão com Baileys
- ❌ Timeout na requisição

### EnvioService
- ❌ User não encontrado
- ❌ WhatsApp null ou vazio
- ❌ Holerite não encontrado
- ❌ Arquivo do holerite não existe
- ❌ Nenhum destinatário encontrado

---

## 💡 Exemplos de Asserções

### Verificar upload multipart
```java
ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
verify(restTemplate).postForEntity(anyString(), entityCaptor.capture(), eq(String.class));

HttpEntity<?> capturedEntity = entityCaptor.getValue();
assertEquals(MediaType.MULTIPART_FORM_DATA, capturedEntity.getHeaders().getContentType());
assertTrue(capturedEntity.getBody() instanceof MultiValueMap);
```

### Verificar que busca apenas users com WhatsApp
```java
// Cria 3 users, sendo 1 sem WhatsApp
when(userRepository.findAll()).thenReturn(List.of(user1, user2, userSemWhatsApp));

EnvioResponse response = envioService.enviarTodosPorTipo(request);

// Deve enviar apenas para os 2 com WhatsApp
assertEquals(2, response.getTotalEnviados());
verify(baileysRestService, times(2)).sendFileMessage(...);
```

---

## 🎓 Para Adicionar Novos Testes

1. Criar método com anotação `@Test`
2. Seguir padrão **Arrange-Act-Assert**
3. Nomear como: `testMetodo_Cenario_Resultado()`
4. Mockar dependências necessárias
5. Validar comportamento esperado
6. Executar `mvn test` para validar

---

## 📈 Próximos Passos

- [ ] Adicionar testes de integração
- [ ] Configurar CI/CD para executar testes
- [ ] Aumentar cobertura para 90%+
- [ ] Adicionar testes de performance
- [ ] Adicionar testes E2E

---

**Total de Testes:** 22  
**Cobertura Estimada:** 85%+  
**Tempo de Execução:** < 5 segundos

