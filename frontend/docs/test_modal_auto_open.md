# Teste da Abertura Automática do Modal de Ordens de Serviço

## Funcionalidade Implementada

Quando você acessar a rota `http://localhost:8080/rh/ordens-servico?emitir=1`, o modal de criação de ordem de serviço deve abrir automaticamente.

## Como Testar

### 1. Via Sidebar
1. Acesse o sistema: `http://localhost:8080`
2. Faça login com suas credenciais
3. No sidebar, clique em "RH/Departamento Pessoal" → "Ordens de Serviço"
4. **Resultado esperado**: O modal deve abrir automaticamente

### 2. Via URL Direta
1. Acesse diretamente: `http://localhost:8080/rh/ordens-servico?emitir=1`
2. **Resultado esperado**: O modal deve abrir automaticamente

### 3. Via Navegação Manual
1. Acesse: `http://localhost:8080/rh/ordens-servico`
2. Clique no botão "Emitir Nova OS"
3. **Resultado esperado**: O modal deve abrir e a URL deve mudar para incluir `?emitir=1`

## Arquivos Modificados

### 1. AppSidebar.tsx
- **Linha 65**: Alterado o link de `/rh/ordens-servico` para `/rh/ordens-servico?emitir=1`
- **Função getActiveId()**: Melhorada para detectar rotas com parâmetros

### 2. CollapsibleSidebar.tsx
- **Linha 69**: Já estava correto com `/rh/ordens-servico?emitir=1`
- **Função getActiveId()**: Melhorada para detectar rotas com parâmetros

### 3. OrdemServico.tsx
- **Linhas 18-22**: Lógica já existia para detectar o parâmetro `emitir=1`
- **Linhas 25-33**: Funções para abrir/fechar modal já implementadas

## Lógica de Funcionamento

1. **Detecção do Parâmetro**: A página verifica se existe `emitir=1` na URL
2. **Abertura Automática**: Se o parâmetro existe, o modal abre automaticamente
3. **Navegação**: Quando o modal é fechado, o parâmetro é removido da URL
4. **Highlight do Menu**: O item do menu fica destacado mesmo com parâmetros na URL

## Casos de Teste

### ✅ Caso 1: Acesso via Sidebar
- [ ] Clicar em "Ordens de Serviço" no sidebar
- [ ] Modal deve abrir automaticamente
- [ ] URL deve ser `/rh/ordens-servico?emitir=1`
- [ ] Item do menu deve estar destacado

### ✅ Caso 2: Acesso Direto via URL
- [ ] Acessar `http://localhost:8080/rh/ordens-servico?emitir=1`
- [ ] Modal deve abrir automaticamente
- [ ] Item do menu deve estar destacado

### ✅ Caso 3: Fechamento do Modal
- [ ] Abrir modal via qualquer método
- [ ] Clicar em "Cancelar" ou "X"
- [ ] Modal deve fechar
- [ ] URL deve voltar para `/rh/ordens-servico` (sem parâmetros)

### ✅ Caso 4: Criação de Ordem
- [ ] Abrir modal
- [ ] Preencher formulário
- [ ] Clicar em "Emitir"
- [ ] Modal deve fechar após sucesso
- [ ] URL deve voltar para `/rh/ordens-servico`
- [ ] Lista deve ser atualizada

## Possíveis Problemas

### ❌ Modal não abre
- Verificar se o parâmetro `emitir=1` está na URL
- Verificar se não há erros no console do navegador
- Verificar se o componente `EmitirOrdemServicoModal` está sendo importado

### ❌ Menu não destaca
- Verificar se a lógica de `getActiveId()` está funcionando
- Verificar se o pathname está sendo comparado corretamente

### ❌ URL não muda
- Verificar se o `useNavigate` está funcionando
- Verificar se não há erros de roteamento

## Comandos para Testar

```bash
# Iniciar o frontend
cd frontend
npm run dev

# Acessar no navegador
http://localhost:8080/rh/ordens-servico?emitir=1
```

## Resultado Esperado

✅ **Modal abre automaticamente** quando acessar a rota com `?emitir=1`
✅ **Menu destaca corretamente** mesmo com parâmetros na URL
✅ **Navegação funciona** entre abrir/fechar modal
✅ **URL atualiza** conforme o estado do modal 