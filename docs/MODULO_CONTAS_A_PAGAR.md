# 📊 Módulo de Contas a Pagar - SecureGuard

## 🎯 Visão Geral

O Módulo de Contas a Pagar foi desenvolvido conforme as especificações da planilha "Financeiro", implementando um sistema completo para gerenciar o controle de contas a pagar da empresa, incluindo vencimentos, fornecedores, valores e status dos pagamentos.

## ✅ Funcionalidades Implementadas

### 📋 **Campos Obrigatórios (Conforme Especificação)**

| Campo | Descrição | Tipo |
|-------|-----------|------|
| **Vencimento** | Data de vencimento da conta | Data obrigatória |
| **Fornecedor** | Nome do fornecedor (seleção) | Select obrigatório |
| **Descrição** | Descrição da despesa | Texto obrigatório |
| **Tipo** | Tipo da despesa (Fixa/Variável) | Select obrigatório |
| **Valor** | Valor a ser pago | Moeda obrigatória |
| **Código de barras** | Código de barras do boleto | Texto opcional |
| **Status** | Estado atual do pagamento | Select automático |
| **Baixa** | Marcação se foi dado baixa no sistema | Checkbox |
| **Data de pagamento** | Quando a conta foi quitada | Data opcional |

### 🔧 **Funcionalidades Avançadas**

- ✅ **Dashboard automatizado** com gráficos de despesas mensais
- ✅ **Alertas de vencimento** automático (notificações visuais)
- ✅ **Controle por centro de custo** (segmentação por setor)
- ✅ **Upload de comprovantes** de pagamento e notas fiscais
- ✅ **Filtros avançados** por status, tipo, fornecedor
- ✅ **Exportação** de relatórios
- ✅ **Integração completa** frontend-backend

## 🎨 Interface do Usuário

### 📊 **Dashboard Principal**

**Cards de Estatísticas:**
- Total de Contas
- Contas Abertas  
- Contas Vencidas
- Contas Pagas
- Valor Total
- Próximos Vencimentos (7 dias)

**Alertas Visuais:**
- 🟡 Amarelo: Contas vencendo em 7 dias
- 🔴 Vermelho: Contas vencidas
- 🟢 Verde: Contas pagas

### 📝 **Formulário de Cadastro**

**Seções Organizadas:**
1. **Informações Básicas**: Vencimento, Fornecedor
2. **Detalhes**: Descrição, Valor, Tipo, Status
3. **Código de Barras**: Para boletos
4. **Categorização**: Categoria e Centro de Custo
5. **Controle**: Baixa e Data de Pagamento
6. **Anexos**: Upload de comprovantes
7. **Observações**: Notas adicionais

### 📋 **Tabela de Listagem**

**Colunas:**
- Vencimento (com alertas visuais)
- Fornecedor
- Descrição (truncada)
- Tipo (badge colorido)
- Valor (formatado R$)
- Status (badge com ícones)
- Baixa (ícone sim/não)
- Data de Pagamento
- Ações (Visualizar, Editar, Marcar como Paga, Excluir)

**Filtros Disponíveis:**
- Busca por texto (descrição, fornecedor, código)
- Status (Aberta, Paga, Atrasada, Vencida, Cancelada)
- Tipo (Fixa, Variável)
- Fornecedor

## 🔗 Integração Backend

### **Endpoints Utilizados**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/invoices` | GET | Listar contas a pagar |
| `/api/invoices` | POST | Criar nova conta |
| `/api/invoices/{id}` | PUT | Atualizar conta |
| `/api/invoices/{id}` | DELETE | Excluir conta |
| `/api/invoices/{id}/mark-as-paid` | PATCH | Marcar como paga |
| `/api/invoices/overdue` | GET | Contas vencidas |
| `/api/invoices/due-soon/{days}` | GET | Vencendo em X dias |
| `/api/suppliers/all` | GET | Listar fornecedores |
| `/api/invoices/reports/summary` | GET | Relatórios |

### **Mapeamento de Dados**

**Frontend → Backend:**
```typescript
// ContaAPagar → Invoice
{
  vencimento: Date → dueDate: string
  fornecedor: string → supplierName: string  
  fornecedorId: string → supplierId: UUID
  descricao: string → description: string
  tipo: 'FIXA'|'VARIAVEL' → type: ExpenseType
  valor: number → amount: BigDecimal
  status: string → status: ExpenseStatus
  // ... outros campos
}
```

**Status Mapeados:**
- ABERTA ↔ PENDENTE (backend)
- PAGA ↔ PAGA (backend)
- VENCIDA ↔ VENCIDA (backend)
- ATRASADA ↔ ATRASADA (backend)
- CANCELADA ↔ CANCELADA (backend)

## 📁 Estrutura de Arquivos

```
frontend/src/
├── components/financeiro/
│   ├── ContasAPagarFormModal.tsx    # Formulário completo
│   ├── ContasAPagarTable.tsx        # Tabela com filtros
│   └── [outros existentes...]
├── pages/
│   ├── ContasAPagar.tsx             # Página principal
│   └── [outros existentes...]
├── services/
│   ├── contasAPagarService.ts       # Service API
│   └── [outros existentes...]
└── types/
    └── [definições de tipos...]
```

## 🚀 Como Usar

### **1. Acessando o Módulo**

1. Faça login no sistema
2. No menu lateral, clique em **"Financeiro"** 
3. Selecione **"Contas a Pagar"**

### **2. Criando Nova Conta**

1. Clique no botão **"Nova Conta a Pagar"**
2. Preencha os campos obrigatórios:
   - Data de Vencimento
   - Fornecedor (selecione da lista)
   - Descrição
   - Valor
   - Tipo (Fixa ou Variável)
3. Campos opcionais:
   - Código de barras
   - Categoria
   - Centro de custo
   - Observações
   - Comprovante (upload)
4. Clique em **"Criar Conta"**

### **3. Gerenciando Contas**

**Visualizar:** Clique no ícone 👁️ para ver detalhes  
**Editar:** Clique no ícone ✏️ para modificar  
**Marcar como Paga:** Clique no ícone ✅ (apenas contas abertas)  
**Excluir:** Clique no ícone 🗑️ para remover  

### **4. Filtrando e Buscando**

- **Busca Geral:** Digite na caixa de busca (busca em descrição, fornecedor, código)
- **Status:** Use o filtro por status
- **Tipo:** Filtre por Fixa ou Variável  
- **Fornecedor:** Digite o nome do fornecedor

### **5. Interpretando Alertas**

- **🟡 Fundo Amarelo:** Conta vencendo em até 7 dias
- **🔴 Fundo Vermelho:** Conta vencida
- **🔔 Seção de Alertas:** Mostra próximos vencimentos

## 🔧 Configurações Técnicas

### **Dependências Utilizadas**

```json
{
  "react-datepicker": "^8.4.0",
  "react-currency-input-field": "^3.10.0", 
  "date-fns": "^4.1.0"
}
```

### **Permissões Necessárias**

O módulo herda as permissões do sistema financeiro existente:
- `FINANCIAL_READ`: Visualizar contas
- `FINANCIAL_CREATE`: Criar contas  
- `FINANCIAL_WRITE`: Editar contas
- `FINANCIAL_DELETE`: Excluir contas
- `SUPER_ADMIN`: Acesso total

### **Configuração do Menu**

**Rota:** `/contas-a-pagar`  
**Menu:** Financeiro → Contas a Pagar  
**Ícone:** Calculator (🧮)

## 📊 Relatórios e Estatísticas

### **Métricas Automáticas**
- Total de contas cadastradas
- Valor total das contas
- Contas abertas vs pagas
- Valor em contas vencidas
- Próximos vencimentos (7 dias)
- Distribuição por tipo (Fixa/Variável)

### **Exportação**
- Botão "Exportar" na tabela
- Formato: Excel/CSV (a implementar)
- Filtros aplicados são mantidos na exportação

## 🔮 Próximas Melhorias

### **Recursos Planejados**
- [ ] Notificações por email de vencimento
- [ ] Integração com API bancária
- [ ] Leitor de código de barras automático
- [ ] Relatórios em PDF
- [ ] Dashboard com gráficos ChartJS
- [ ] Histórico de alterações
- [ ] Aprovação de pagamentos em workflow

### **Integrações Futuras**
- [ ] Módulo de Aprovações
- [ ] Contabilidade automática
- [ ] Conciliação bancária
- [ ] Gateway de pagamentos

## 🆘 Solução de Problemas

### **Problemas Comuns**

**1. Erro 500 ao criar conta**
- Verificar se fornecedor existe
- Validar formato de datas
- Conferir permissões do usuário

**2. Fornecedores não aparecem**
- Verificar se há fornecedores cadastrados em `/api/suppliers`
- Conferir conexão com backend

**3. Upload não funciona**
- Verificar tamanho do arquivo (máx. 10MB)
- Formatos aceitos: PDF, JPG, PNG
- Conferir configuração do servidor

**4. Filtros não funcionam**
- Limpar cache do navegador
- Verificar JavaScript habilitado
- Recarregar página

### **Logs e Debug**

**Frontend:** Console do navegador (F12)  
**Backend:** Logs do Spring Boot  
**Rede:** Aba Network do DevTools  

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os logs de erro
3. Entre em contato com a equipe de desenvolvimento

---

**Versão:** 1.0  
**Última Atualização:** Janeiro 2025  
**Desenvolvido para:** SecureGuard System