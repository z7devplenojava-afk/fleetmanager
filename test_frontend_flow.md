# 🧪 Guia de Teste - Sistema de Envio de Holerites

## 📋 Pré-requisitos

1. **Backend rodando** em `http://localhost:8081`
2. **Frontend rodando** em `http://localhost:8080`
3. **Banco de dados** com dados de teste (execute `create_test_data.sql`)

## 🔧 Configuração Inicial

### 1. Executar dados de teste no banco:
```sql
-- Execute o arquivo create_test_data.sql no PostgreSQL
\i create_test_data.sql
```

### 2. Executar teste dos endpoints:
```powershell
# Execute o script de teste
.\test_payslip_sending.ps1
```

## 🎯 Fluxo de Teste no Frontend

### Passo 1: Acessar a página de Holerites
1. Abra: `http://localhost:8080/holerites`
2. Verifique se a página carrega sem erros
3. Veja as 3 abas: "Holerites", "Comprovantes", "Logs de Envio"

### Passo 2: Testar aba "Logs de Envio"
1. Clique na aba **"Logs de Envio"**
2. No campo CPF, digite: `12345678901`
3. Clique **"Buscar"**
4. **Resultado esperado**: Deve mostrar 3 logs de teste (2 sucessos, 1 falha)

### Passo 3: Testar envio em massa
1. Vá na aba **"Comprovantes"**
2. Selecione alguns comprovantes (checkbox)
3. Clique **"Email"** ou **"WhatsApp"**
4. **Resultado esperado**: Modal abre com formulário de envio

### Passo 4: Testar envio individual
1. No modal de envio:
   - Tipo: "WhatsApp" ou "Email"
   - Mensagem: "Teste de envio"
   - Clique **"Enviar"**
2. **Resultado esperado**: 
   - Mostra resultado (sucesso/falha)
   - Se falhar, aparece link "Ver logs deste CPF"

### Passo 5: Testar link "Ver logs deste CPF"
1. Se houver falha no envio, clique **"Ver logs deste CPF"**
2. **Resultado esperado**: 
   - Abre automaticamente a aba "Logs de Envio"
   - Filtro CPF já preenchido
   - Lista carregada automaticamente

### Passo 6: Testar reenvio
1. Na aba "Logs de Envio"
2. Encontre um log com status "Falha"
3. Clique **"Reenviar"**
4. **Resultado esperado**: 
   - Novo log criado
   - Lista atualizada

## 🔍 Validações Esperadas

### ✅ Comportamentos Corretos:
- [ ] Aba "Logs de Envio" carrega sem erro
- [ ] Filtros CPF/Mês/Ano funcionam
- [ ] Modal de envio abre e fecha corretamente
- [ ] Link "Ver logs deste CPF" navega para aba correta
- [ ] Botão "Reenviar" cria novo log
- [ ] Logs são exibidos em formato legível
- [ ] Status "Sucesso"/"Falha" é claro

### ⚠️ Falhas Esperadas (normais):
- Envio pode falhar se não houver WhatsApp/email configurado
- Baileys pode não estar conectado (desenvolvimento)
- Funcionários podem não existir no banco

### ❌ Problemas Reais:
- Erro 500 no backend
- Frontend não carrega
- Logs não aparecem
- Modal não abre

## 🐛 Troubleshooting

### Problema: "Logs não carregam"
**Solução**: 
1. Verifique se o backend está rodando
2. Execute `create_test_data.sql` no banco
3. Teste endpoint: `GET /api/envio/logs?cpf=12345678901`

### Problema: "Modal não abre"
**Solução**:
1. Abra DevTools (F12)
2. Verifique erros no Console
3. Teste se `holeriteService` está funcionando

### Problema: "Link 'Ver logs deste CPF' não funciona"
**Solução**:
1. Verifique se o evento está sendo disparado
2. Teste no Console: `window.dispatchEvent(new CustomEvent('open-logs-tab', { detail: { cpf: '12345678901' } }))`

## 📊 Dados de Teste Disponíveis

- **CPF**: `12345678901`
- **Nome**: João Silva Teste
- **Email**: joao.teste@empresa.com
- **WhatsApp**: 5531999999999
- **Holerites**: Outubro/2025, Setembro/2025
- **Logs**: 3 registros (2 sucessos, 1 falha)

## 🎉 Teste Concluído com Sucesso

Se todos os passos funcionaram:
1. ✅ Sistema de logs implementado
2. ✅ Envio individual e em massa funcionando
3. ✅ Navegação entre abas otimizada
4. ✅ Reenvio de falhas implementado
5. ✅ Validações de CPF/telefone ativas

**O sistema está pronto para uso em produção!** 🚀
