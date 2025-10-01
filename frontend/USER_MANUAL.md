# 📖 Manual do Usuário - EnvioHolerites

## 🎯 Visão Geral

O **EnvioHolerites** é um sistema completo para gerenciamento e envio de holerites (contracheques) via email e WhatsApp. Este manual irá guiá-lo através de todas as funcionalidades do sistema.

---

## 🚀 Primeiros Passos

### 1. Acesso ao Sistema
1. Abra seu navegador e acesse: `http://localhost:5173`
2. Faça login com suas credenciais
3. Você será direcionado para o Dashboard principal

### 2. Navegação
- **Sidebar**: Menu lateral com todas as funcionalidades
- **Header**: Informações do usuário e configurações
- **Breadcrumb**: Navegação hierárquica das páginas

---

## 👥 Gerenciamento de Funcionários

### Cadastrar Novo Funcionário

1. **Acesse**: Menu "RH" → "Envio de Holerites"
2. **Clique**: Botão "Novo Funcionário"
3. **Preencha** os dados:
   - **Nome**: Nome completo do funcionário
   - **CPF**: CPF válido (apenas números)
   - **Email**: Email válido
   - **Telefone**: Telefone com DDD (+55)
   - **Possui WhatsApp**: Marque se o funcionário usa WhatsApp
4. **Clique**: "Salvar"

### Editar Funcionário

1. **Localize** o funcionário na lista
2. **Clique** no ícone de edição (✏️)
3. **Modifique** os dados necessários
4. **Clique**: "Salvar"

### Excluir Funcionário

1. **Localize** o funcionário na lista
2. **Clique** no ícone de exclusão (🗑️)
3. **Confirme** a exclusão

### Buscar Funcionários

- **Busca Rápida**: Use a barra de busca no topo
- **Filtros Avançados**: Clique em "Filtros Avançados"
  - Por nome, CPF, email
  - Por status
  - Por data de cadastro
  - Por WhatsApp

---

## 📤 Envio de Holerites

### Envio Individual

1. **Selecione** um funcionário na lista
2. **Clique**: "Enviar Holerite"
3. **Escolha** o tipo de envio:
   - **Email**: Preencha assunto e mensagem
   - **WhatsApp**: Preencha apenas a mensagem
4. **Clique**: "Confirmar Envio"

### Envio em Massa

1. **Selecione** múltiplos funcionários (use Ctrl+Clique)
2. **Clique**: "Enviar em Massa"
3. **Configure** o envio:
   - Tipo (Email/WhatsApp)
   - Assunto (para email)
   - Mensagem
4. **Clique**: "Confirmar Envio"

### Envio para Todos

1. **Clique**: "Enviar para Todos"
2. **Configure** o envio
3. **Confirme** a ação

---

## 📊 Dashboard e Métricas

### Visualizar Métricas

1. **Acesse**: Dashboard principal
2. **Visualize**:
   - Total de funcionários
   - Total de envios
   - Taxa de sucesso
   - Crescimento mensal

### Filtros de Período

- **Últimos 7 dias**
- **Últimos 30 dias**
- **Período personalizado**

---

## 🔍 Relatórios

### Gerar Relatórios

1. **Acesse**: Seção "Relatórios"
2. **Escolha** o tipo:
   - Relatório de Envios
   - Relatório de Funcionários
   - Relatório de Performance
   - Relatório Personalizado

### Configurar Relatório

1. **Selecione** o período
2. **Escolha** o formato (PDF/Excel/CSV)
3. **Configure** filtros
4. **Selecione** colunas
5. **Clique**: "Gerar Relatório"

---

## ⚙️ Configurações

### Tema da Interface

1. **Clique** no ícone de tema no header
2. **Escolha**:
   - **Claro**: Tema claro
   - **Escuro**: Tema escuro
   - **Sistema**: Seguir preferência do sistema

### Atalhos de Teclado

Pressione **?** para ver todos os atalhos disponíveis:

- **Ctrl+K**: Busca global
- **Ctrl+N**: Novo funcionário
- **Ctrl+S**: Salvar
- **Escape**: Fechar modal
- **Ctrl+D**: Alternar tema
- **Ctrl+R**: Recarregar página

---

## 📱 Integração WhatsApp

### Configurar WhatsApp

1. **Verifique** se o WPPConnect está rodando
2. **Acesse**: Configurações → WhatsApp
3. **Escaneie** o QR Code
4. **Confirme** a conexão

### Status da Conexão

- **🟢 Conectado**: WhatsApp funcionando
- **🔴 Desconectado**: Problema na conexão
- **🟡 Conectando**: Tentando conectar

---

## 🚨 Solução de Problemas

### Problemas Comuns

#### Funcionário não recebe email
1. **Verifique** se o email está correto
2. **Confirme** se o servidor de email está configurado
3. **Verifique** a pasta de spam

#### WhatsApp não envia
1. **Verifique** se o WhatsApp está conectado
2. **Confirme** se o número está correto
3. **Teste** o envio manual

#### Sistema lento
1. **Limpe** o cache do navegador
2. **Verifique** a conexão com a internet
3. **Contate** o suporte técnico

### Logs de Erro

1. **Acesse**: Configurações → Logs
2. **Visualize** os erros recentes
3. **Copie** o código de erro para o suporte

---

## 🔐 Segurança

### Boas Práticas

- **Altere** sua senha regularmente
- **Não compartilhe** suas credenciais
- **Faça logout** ao sair do sistema
- **Use** HTTPS em produção

### Permissões

- **Admin**: Acesso total ao sistema
- **RH**: Gerenciamento de funcionários
- **Operador**: Apenas envio de holerites

---

## 📞 Suporte

### Contato

- **Email**: suporte@empresa.com
- **Telefone**: (11) 9999-9999
- **Chat**: Disponível no sistema

### Horário de Atendimento

- **Segunda a Sexta**: 8h às 18h
- **Sábado**: 8h às 12h

### Informações Necessárias

Ao contatar o suporte, tenha em mãos:
- Nome do usuário
- Descrição do problema
- Código de erro (se houver)
- Screenshot (se possível)

---

## 📋 Checklist de Uso

### Diário
- [ ] Verificar novos funcionários
- [ ] Enviar holerites pendentes
- [ ] Verificar status do WhatsApp
- [ ] Revisar logs de erro

### Semanal
- [ ] Gerar relatório de envios
- [ ] Verificar métricas de performance
- [ ] Backup dos dados
- [ ] Atualizar configurações

### Mensal
- [ ] Relatório completo de funcionários
- [ ] Análise de métricas
- [ ] Manutenção do sistema
- [ ] Treinamento da equipe

---

## 🎓 Treinamento

### Vídeos Tutoriais

- **Introdução ao Sistema**: 5 min
- **Cadastro de Funcionários**: 8 min
- **Envio de Holerites**: 10 min
- **Relatórios**: 12 min
- **Configurações**: 6 min

### Documentação Técnica

- **API Documentation**: Para desenvolvedores
- **Developer Guide**: Guia de desenvolvimento
- **Deployment Guide**: Guia de implantação

---

## 🔄 Atualizações

### Versão Atual
- **v1.0.0**: Versão inicial
- **Recursos**: Envio por email e WhatsApp
- **Próxima**: v1.1.0 com melhorias

### Novidades
- Filtros avançados
- Dashboard de métricas
- Relatórios personalizados
- Atalhos de teclado
- Modo escuro

---

## 📝 Notas

- O sistema salva automaticamente suas preferências
- Os logs são mantidos por 90 dias
- Backup automático diário
- Monitoramento 24/7

---

**🎉 Parabéns! Você está pronto para usar o sistema EnvioHolerites com eficiência e segurança.** 