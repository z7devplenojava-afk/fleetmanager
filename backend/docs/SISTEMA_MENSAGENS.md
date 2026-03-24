# 📨 Sistema de Mensagens - Documentação Completa

## 🎯 Visão Geral

O **Sistema de Mensagens** foi implementado para permitir comunicação interna entre todos os usuários e grupos do sistema, com layout padronizado nas cores do sistema e funcionalidades completas.

---

## 🏗️ Arquitetura

### Backend
- **Entidade**: `Message.java`
- **Repository**: `MessageRepository.java`
- **Service**: `MessageService.java`
- **Controller**: `MessageController.java`
- **DTOs**: `MessageDTO.java`, `CreateMessageRequest.java`
- **Enums**: `MessageType.java`, `MessageStatus.java`, `MessagePriority.java`

### Frontend
- **Tipos**: `message.ts`
- **Serviço**: `messageService.ts`
- **Componentes**: 
  - `MessageDashboard.tsx`
  - `MessageFormModal.tsx`
  - `MessageViewModal.tsx`
- **Página**: `Mensagens.tsx`

---

## 🔐 Funcionalidades

### ✅ Para Todos os Usuários
- **Visualizar mensagens** recebidas (individuais, de grupo e globais)
- **Enviar mensagens** para usuários específicos
- **Enviar mensagens** para grupos (se pertencer ao grupo)
- **Marcar mensagens** como lidas
- **Deletar mensagens** próprias
- **Buscar mensagens** por texto
- **Filtrar por status** (não lidas, lidas, arquivadas)
- **Filtrar por prioridade** (baixa, normal, alta, urgente)

### 🟥 SUPER_ADMIN
- **Todas as funcionalidades** acima
- **Enviar mensagens globais** para todos os usuários
- **Enviar mensagens** para qualquer grupo
- **Deletar qualquer mensagem** do sistema

### 🟦 ADMIN
- **Todas as funcionalidades** básicas
- **Enviar mensagens globais** para todos os usuários
- **Enviar mensagens** para qualquer grupo
- **Deletar qualquer mensagem** do sistema

### 🟩 SUPERVISOR
- **Funcionalidades básicas**
- **Enviar mensagens** para sua equipe
- **Enviar mensagens** para grupos que coordena

### 🟨 RH
- **Funcionalidades básicas**
- **Enviar mensagens** para colaboradores
- **Enviar mensagens** para grupos de RH

### 🟧 FINANCEIRO
- **Funcionalidades básicas**
- **Enviar mensagens** relacionadas a questões financeiras

### 🟪 TI_SUPORTE
- **Funcionalidades básicas**
- **Enviar mensagens** técnicas e de suporte

### 🟫 AUDITOR
- **Apenas visualização** de mensagens
- **Não pode enviar** mensagens

### 🟨 COLABORADOR
- **Funcionalidades básicas limitadas**
- **Enviar mensagens** para RH, Supervisores, Admin

---

## 🎨 Layout e Design

### Cores do Sistema
```css
/* Cores principais */
--primary: #2563eb (blue-600)
--secondary: #6b7280 (gray-600)
--success: #16a34a (green-600)
--warning: #ca8a04 (yellow-600)
--danger: #dc2626 (red-600)
--info: #3b82f6 (blue-500)
```

### Componentes Visuais
- **Cards** com bordas coloridas por prioridade
- **Badges** para status e prioridade
- **Ícones** específicos para cada tipo de mensagem
- **Animações** AOS para transições suaves
- **Responsivo** para mobile e desktop

---

## 📊 Tipos de Mensagem

### 1. Individual
- **Destinatário**: Usuário específico
- **Visibilidade**: Apenas remetente e destinatário
- **Permissões**: Todos podem enviar

### 2. Grupo
- **Destinatário**: Grupo específico
- **Visibilidade**: Todos os membros do grupo
- **Permissões**: Membros do grupo ou ADMIN/SUPER_ADMIN

### 3. Global
- **Destinatário**: Todos os usuários
- **Visibilidade**: Todos os usuários
- **Permissões**: Apenas ADMIN e SUPER_ADMIN

---

## 🚀 Endpoints da API

### POST /api/messages
**Criar nova mensagem**
```json
{
  "title": "Título da mensagem",
  "content": "Conteúdo da mensagem",
  "recipientId": 123,
  "recipientGroupId": 456,
  "type": "INDIVIDUAL",
  "priority": "NORMAL"
}
```

### GET /api/messages/received
**Buscar mensagens recebidas**
```
?page=0&size=10&sortBy=createdAt&sortDir=desc
```

### GET /api/messages/sent
**Buscar mensagens enviadas**
```
?page=0&size=10&sortBy=createdAt&sortDir=desc
```

### GET /api/messages/unread
**Buscar mensagens não lidas**

### GET /api/messages/unread/count
**Contar mensagens não lidas**

### GET /api/messages/{id}
**Buscar mensagem por ID**

### PUT /api/messages/{id}/read
**Marcar mensagem como lida**

### PUT /api/messages/{id}/archive
**Marcar mensagem como arquivada**

### DELETE /api/messages/{id}
**Deletar mensagem**

### GET /api/messages/status/{status}
**Buscar mensagens por status**

### GET /api/messages/priority/{priority}
**Buscar mensagens por prioridade**

### GET /api/messages/search
**Buscar mensagens por texto**
```
?q=texto&page=0&size=10
```

### GET /api/messages/dashboard
**Dashboard de mensagens**

---

## 🗄️ Estrutura do Banco

### Tabela: messages
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT,
    recipient_group_id BIGINT,
    type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT fk_messages_recipient_group FOREIGN KEY (recipient_group_id) REFERENCES user_groups(id)
);
```

---

## 🎯 Como Usar

### 1. Acessar o Dashboard
- Faça login no sistema
- Clique em "Mensagens" no menu lateral
- Visualize o dashboard com estatísticas

### 2. Enviar Nova Mensagem
- Clique em "Nova Mensagem"
- Preencha o formulário:
  - **Tipo**: Individual, Grupo ou Global
  - **Destinatário**: Usuário ou grupo
  - **Prioridade**: Baixa, Normal, Alta ou Urgente
  - **Título**: Título da mensagem
  - **Conteúdo**: Corpo da mensagem

### 3. Gerenciar Mensagens
- **Visualizar**: Clique na mensagem
- **Marcar como lida**: Botão "👁️" na lista ou modal
- **Deletar**: Botão "🗑️" na lista ou modal
- **Buscar**: Use a barra de pesquisa
- **Filtrar**: Use as abas (Recebidas, Enviadas, Não Lidas)

---

## 🔧 Configuração

### Backend
1. Execute a migração: `V201__create_messages_table.sql`
2. Reinicie o servidor Spring Boot
3. Verifique os endpoints em: `http://localhost:8081/api/messages`

### Frontend
1. Acesse: `http://localhost:8082/mensagens`
2. O sistema já está integrado ao menu de todos os roles
3. As permissões são verificadas automaticamente

---

## 📱 Responsividade

O dashboard de mensagens é totalmente responsivo:
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Layout adaptado com menus colapsáveis
- **Mobile**: Layout otimizado para touch

---

## 🎨 Personalização

### Cores
As cores podem ser personalizadas editando as variáveis CSS no arquivo `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  }
}
```

### Ícones
Os ícones podem ser alterados importando novos ícones do Lucide React:

```typescript
import { MessageSquare, Send, Inbox } from 'lucide-react';
```

---

## 🚀 Próximas Funcionalidades

- [ ] **Notificações em tempo real** com WebSocket
- [ ] **Anexos** em mensagens
- [ ] **Respostas** em thread
- [ ] **Agendamento** de mensagens
- [ ] **Templates** de mensagens
- [ ] **Relatórios** de mensagens
- [ ] **Integração** com e-mail

---

## 📞 Suporte

Para dúvidas ou problemas com o sistema de mensagens:
1. Verifique os logs do backend
2. Teste os endpoints via Postman
3. Verifique as permissões do usuário
4. Consulte esta documentação

---

**Sistema de Mensagens - Versão 1.0**  
*Implementado com ❤️ para Promover Vigilância Patrimonial* 