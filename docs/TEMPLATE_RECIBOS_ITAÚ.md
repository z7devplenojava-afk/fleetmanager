# Template do Itaú para Recibos de Pagamentos

## Visão Geral

O sistema SecuredGuard agora utiliza o template oficial do Itaú para gerar recibos de pagamentos após a extração automática de dados dos PDFs originais.

## Como Funciona

### 1. **Upload do PDF Original**
- Usuário faz upload do comprovante bancário do Itaú
- Sistema processa o arquivo usando Apache PDFBox
- Extrai automaticamente todos os dados relevantes

### 2. **Extração de Dados**
O sistema identifica e extrai:

- **Nome do funcionário** (conta creditada)
- **Valor da transferência**
- **Data e hora da operação**
- **Agência e conta**
- **Número de controle (CTRL)**
- **Código de autenticação**
- **Informações do Sispag**

### 3. **Geração do Novo PDF**
Usando o template do Itaú, o sistema gera um novo documento com:

**Nome do Arquivo:** `recibo_NOME_FUNCIONARIO_MM_AAAA_pagina_X.pdf`

**Exemplo:** `recibo_varlei_marcelino_de_oliveira_07_2025_pagina_1.pdf`

```
┌─────────────────────────────────────────────────────────────┐
│                    ITAÚ                30 HORAS            │
├─────────────────────────────────────────────────────────────┤
│                COMPROVANTE DE OPERAÇÃO                      │
│        Transferência de Conta Corrente para Conta Corrente  │
│        Identificação no Extrato: SISPAG SALARIOS           │
│                                                             │
│ Dados da conta a ser debitada:                             │
│ Agência: 0925                                              │
│ Conta: 98240 - 7                                           │
│ Nome: PROMOVER VIGILANCIA PATRIMONIA                       │
│                                                             │
│ Dados da conta a ser creditada:                            │
│ Agência: 3804                                              │
│ Conta: 68007 - 6                                           │
│ Nome: [NOME DO FUNCIONÁRIO EXTRAÍDO]                       │
│ Valor: R$ [VALOR EXTRAÍDO]                                 │
│                                                             │
│ Informações fornecidas pelo pagador:                       │
│                                                             │
│ Transferência realizada em [DATA] às [HORA], via Sispag,   │
│ CTRL [NÚMERO DE CONTROLE]                                  │
│                                                             │
│ Autenticação: [CÓDIGO DE AUTENTICAÇÃO]                     │
│                                                             │
│ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ │
│                        Cortar aqui                          │
│ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ │
│                                                             │
│ Documento gerado automaticamente pelo sistema SecuredGuard │
│ Data de geração: [DATA/HORA ATUAL]                         │
└─────────────────────────────────────────────────────────────┘
```

## Vantagens do Template

### ✅ **Aparência Profissional**
- Layout idêntico ao do Itaú
- Fontes e formatação padronizadas
- Estrutura clara e organizada

### ✅ **Dados Completos**
- Todas as informações essenciais preservadas
- Dados extraídos automaticamente
- Validação de campos obrigatórios

### ✅ **Rastreabilidade**
- Timestamp de geração
- Identificação do sistema
- Logs detalhados de processamento

### ✅ **Compliance**
- Formato oficial do banco
- Informações de autenticação
- Códigos de controle preservados

## Fluxo de Processamento

```
PDF Original → Extração → Validação → Template Itaú → Novo PDF
     ↓              ↓          ↓           ↓           ↓
  Upload      Dados      Verificação   Layout      Download
  Arquivo     Extraídos   Campos      Padrão      Final
```

## Campos Extraídos vs. Template

| Campo Original | Extração | Template Final |
|----------------|----------|----------------|
| Nome Funcionário | ✅ Automática | ✅ Preservado |
| Valor | ✅ Automática | ✅ Destacado |
| Data/Hora | ✅ Automática | ✅ Formatada |
| Agência/Conta | ✅ Automática | ✅ Estruturado |
| CTRL | ✅ Automática | ✅ Incluído |
| Autenticação | ✅ Automática | ✅ Preservada |

## Exemplo de Uso

### 1. **Upload do Comprovante**
```typescript
// Frontend
const handleReceiptUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/receipts/upload', formData);
  // Sistema processa e gera novo PDF
};
```

### 2. **Processamento Automático**
```java
// Backend - ReceiptProcessingService
public List<PaymentReceipt> processReceiptFile(MultipartFile file) {
    // 1. Extrair texto do PDF
    // 2. Identificar dados usando regex
    // 3. Validar informações
    // 4. Gerar novo PDF com template Itaú
    // 5. Salvar no banco de dados
}
```

### 3. **Resultado Final**
- **PDF Original**: Comprovante bancário do Itaú
- **PDF Gerado**: Recibo padronizado com template oficial
- **Dados**: Extraídos e validados automaticamente
- **Layout**: Profissional e consistente

## Nomenclatura dos Arquivos

### **Padrão de Nome**
O sistema gera automaticamente nomes de arquivo seguindo o padrão:
```
recibo_NOME_FUNCIONARIO_MM_AAAA_pagina_X.pdf
```

### **Exemplos de Nomes**
- `recibo_varlei_marcelino_de_oliveira_07_2025_pagina_1.pdf`
- `recibo_maria_silva_08_2025_pagina_1.pdf`
- `recibo_joao_santos_09_2025_pagina_1.pdf`

### **Tratamento do Nome**
- **Caracteres especiais**: Removidos automaticamente
- **Acentos**: Preservados (À-ÿ)
- **Espaços**: Convertidos para underscore (_)
- **Maiúsculas**: Convertidas para minúsculas
- **Fallback**: `funcionario_nao_identificado` se nome não for extraído

## Configurações do Template

### **Fontes Utilizadas**
- **Título**: Helvetica Bold 16pt
- **Subtítulos**: Helvetica Bold 12pt
- **Conteúdo**: Helvetica Regular 11pt
- **Footer**: Helvetica Regular 8pt

### **Cores e Estilos**
- **Texto**: Preto (#000000)
- **Linhas**: Pretas sólidas
- **Separadores**: Linhas tracejadas
- **Espaçamento**: Padrão profissional

### **Dimensões**
- **Página**: A4 padrão
- **Margens**: 50px (esquerda/direita)
- **Posicionamento**: Coordenadas precisas
- **Layout**: Responsivo e organizado

## Benefícios para o Usuário

1. **Documentos Padronizados**: Todos os recibos seguem o mesmo formato
2. **Processamento Automático**: Sem necessidade de digitação manual
3. **Validação de Dados**: Verificação automática de campos obrigatórios
4. **Aparência Profissional**: Layout idêntico ao do banco
5. **Nomenclatura Clara**: Arquivos salvos com nome do funcionário
6. **Rastreabilidade**: Logs completos de todas as operações
7. **Armazenamento Organizado**: Estrutura de pastas por mês/ano

## Considerações Técnicas

- **Performance**: Processamento otimizado com PDFBox
- **Memória**: Uso eficiente de recursos
- **Erro Handling**: Tratamento robusto de exceções
- **Logs**: Auditoria completa de todas as operações
- **Backup**: Preservação dos arquivos originais

## Conclusão

O uso do template do Itaú garante que todos os recibos de pagamentos tenham:
- **Aparência profissional** e consistente
- **Dados completos** e validados
- **Layout padronizado** do banco
- **Rastreabilidade** total das operações

O sistema transforma automaticamente comprovantes bancários em recibos padronizados, mantendo a qualidade visual e a integridade dos dados.
