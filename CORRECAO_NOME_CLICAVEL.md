# Correção: Nome do Usuário Clicável

## Problema Identificado
O nome do usuário não estava clicável porque estava dentro de um botão que interceptava o evento de clique.

## Soluções Implementadas

### 1. UserMenu.tsx
**Problema**: O nome do usuário estava dentro de um botão com `onClick={toggleMenu}`, impedindo o clique direto.

**Solução**: 
- Separei o nome do usuário do botão principal
- Criei um `div` independente com `onClick={handleProfileClick}`
- Adicionei estilos de hover e cursor pointer

```tsx
// ANTES (não funcionava)
<button onClick={toggleMenu}>
  <div onClick={handleProfileClick}>Nome do usuário</div>
</button>

// DEPOIS (funciona)
<div className="relative flex items-center gap-3">
  <div onClick={handleProfileClick}>Nome do usuário</div>
  <button onClick={signOut}>Sair</button>
</div>
```

### 2. MainLayout.tsx
**Adicionado**: Funcionalidade de clique no nome do usuário no header principal.

**Mudanças**:
- Importado `useState` e `UserProfileModal`
- Adicionado estado `isProfileModalOpen`
- Criado função `handleProfileClick`
- Tornado o nome do usuário clicável com hover effects
- Adicionado modal de perfil no final do componente

### 3. CollapsibleSidebar.tsx
**Adicionado**: Funcionalidade de clique no nome do usuário no footer da sidebar.

**Mudanças**:
- Importado `useState` e `UserProfileModal`
- Adicionado estado `isProfileModalOpen`
- Criado função `handleProfileClick`
- Tornado o nome do usuário clicável no footer
- Adicionado modal de perfil no final do componente

## Resultado

Agora o nome do usuário é clicável em **todos os locais** onde é exibido:

1. **Header principal** (MainLayout) - Nome do usuário com ícone
2. **Menu do usuário** (UserMenu) - Nome e role do usuário
3. **Footer da sidebar** (CollapsibleSidebar) - Nome e role do usuário

## Comportamento

- **Clique no nome**: Abre o modal de perfil
- **Hover**: Muda a cor para amarelo e adiciona fundo escuro
- **Cursor**: Muda para pointer indicando que é clicável
- **Transições**: Suaves para melhor UX

## Estilos Aplicados

```css
cursor-pointer 
hover:bg-seguranca-black 
hover:text-seguranca-yellow 
transition-colors 
p-2 rounded-lg
```

A funcionalidade está agora completamente funcional em todos os componentes onde o nome do usuário é exibido!
