# Implementação do Modal de Perfil do Usuário

## Resumo da Funcionalidade

Foi implementada uma funcionalidade completa para exibir e editar o perfil do usuário quando o nome for clicado no header do sistema.

## Componentes Implementados

### 1. Frontend

#### UserProfileModal.tsx
- **Localização**: `frontend/src/components/UserProfileModal.tsx`
- **Funcionalidades**:
  - Modal responsivo com tema escuro
  - Formulário de edição com validações
  - Campos: Nome, Email, WhatsApp
  - Alteração de senha com validação de força
  - Tratamento de erros detalhado
  - Feedback visual com toasts

#### UserMenu.tsx (Atualizado)
- **Localização**: `frontend/src/components/UserMenu.tsx`
- **Mudanças**:
  - Integração com o modal de perfil
  - Clique no nome do usuário abre o modal
  - Estado para controlar abertura/fechamento do modal

#### AuthContext.tsx (Atualizado)
- **Localização**: `frontend/src/contexts/AuthContext.tsx`
- **Novas funcionalidades**:
  - Função `refreshUser()` para atualizar dados do usuário
  - Estado `profile` para dados do perfil
  - Função `signOut()` como alias para logout

#### user.ts (Atualizado)
- **Localização**: `frontend/src/types/user.ts`
- **Mudanças**:
  - Interface `AuthContextType` atualizada com novas funções

### 2. Backend

#### ProfileUpdateRequest.java
- **Localização**: `backend/src/main/java/com/z7design/secured_guard/dto/ProfileUpdateRequest.java`
- **Campos**:
  - `name`: Nome completo (obrigatório)
  - `email`: Email (obrigatório, validado)
  - `whatsapp`: WhatsApp (opcional, validado)
  - `currentPassword`: Senha atual (para alteração)
  - `newPassword`: Nova senha (validada)

#### ProfileResponse.java
- **Localização**: `backend/src/main/java/com/z7design/secured_guard/dto/ProfileResponse.java`
- **Campos de resposta**:
  - `id`, `username`, `name`, `email`, `whatsapp`
  - `active`, `roles`

#### UserService.java (Atualizado)
- **Localização**: `backend/src/main/java/com/z7design/secured_guard/service/UserService.java`
- **Novo método**: `updateProfile(UUID userId, ProfileUpdateRequest request)`
- **Validações**:
  - Email único
  - Senha atual correta
  - Força da nova senha
  - Formato do email

#### UserController.java (Atualizado)
- **Localização**: `backend/src/main/java/com/z7design/secured_guard/controller/UserController.java`
- **Novos endpoints**:
  - `GET /api/users/profile` - Buscar perfil do usuário logado
  - `PUT /api/users/profile` - Atualizar perfil do usuário logado

## Como Usar

### 1. Acessar o Modal
- Clique no nome do usuário no header (canto superior direito)
- O modal será aberto automaticamente

### 2. Editar Informações
- Clique no botão "Editar" no modal
- Modifique os campos desejados:
  - **Nome**: Nome completo do usuário
  - **Email**: Email válido (será validado)
  - **WhatsApp**: Apenas números (9-20 dígitos)

### 3. Alterar Senha (Opcional)
- Preencha a senha atual
- Digite a nova senha (deve atender aos critérios de segurança)
  - Mínimo 6 caracteres
  - Pelo menos 1 letra maiúscula
  - Pelo menos 1 letra minúscula
  - Pelo menos 1 número
  - Pelo menos 1 caractere especial
- Confirme a nova senha

### 4. Salvar Alterações
- Clique em "Salvar" para confirmar as alterações
- O sistema validará os dados e salvará no backend
- Os dados do usuário serão atualizados no contexto de autenticação

## Validações Implementadas

### Frontend
- Nome obrigatório
- Email válido
- WhatsApp apenas números (9-20 dígitos)
- Senha atual obrigatória para alteração
- Nova senha com critérios de segurança
- Confirmação de senha deve ser igual à nova senha

### Backend
- Email único no sistema
- Senha atual correta
- Validação de força da senha
- Formato de email válido
- Autenticação obrigatória

## Tratamento de Erros

### Códigos de Erro Tratados
- **400**: Dados inválidos
- **401**: Senha atual incorreta ou não autenticado
- **403**: Acesso negado
- **404**: Usuário não encontrado
- **500+**: Erro interno do servidor
- **Network Error**: Problemas de conexão

### Feedback Visual
- Toasts de sucesso/erro
- Validação em tempo real
- Estados de carregamento
- Mensagens específicas para cada tipo de erro

## Segurança

- Autenticação obrigatória para todos os endpoints
- Validação de senha atual antes de alterar
- Criptografia de senhas no backend
- Validação de dados no frontend e backend
- Sanitização de inputs

## Responsividade

- Modal adaptável para diferentes tamanhos de tela
- Formulário otimizado para mobile
- Botões e campos com tamanhos apropriados
- Scroll automático quando necessário

## Tema

- Interface com tema escuro (seguindo o padrão do sistema)
- Cores consistentes com o design system
- Ícones e elementos visuais padronizados
- Feedback visual claro para ações do usuário
