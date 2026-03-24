# Exemplos de Nomenclatura dos Recibos de Pagamentos

## Como o Sistema Nomeia os Arquivos

### **Padrão Base**
```
recibo_NOME_FUNCIONARIO_MM_AAAA_pagina_X.pdf
```

### **Componentes do Nome**
- **recibo**: Prefixo fixo para identificação
- **NOME_FUNCIONARIO**: Nome extraído do PDF, tratado e formatado
- **MM**: Mês da transferência (01-12)
- **AAAA**: Ano da transferência (2024, 2025, etc.)
- **pagina_X**: Número da página do PDF original
- **.pdf**: Extensão do arquivo

## Exemplos Práticos

### **Exemplo 1: VARLEI MARCELINO DE OLIVEIRA**
**PDF Original:** Comprovante Itaú de 04.07.2025
**Nome Extraído:** VARLEI MARCELINO DE OLIVEIRA
**Arquivo Gerado:** `recibo_varlei_marcelino_de_oliveira_07_2025_pagina_1.pdf`

### **Exemplo 2: MARIA APARECIDA SILVA**
**PDF Original:** Comprovante Itaú de 15.08.2025
**Nome Extraído:** MARIA APARECIDA SILVA
**Arquivo Gerado:** `recibo_maria_aparecida_silva_08_2025_pagina_1.pdf`

### **Exemplo 3: JOÃO CARLOS SANTOS**
**PDF Original:** Comprovante Itaú de 30.09.2025
**Nome Extraído:** JOÃO CARLOS SANTOS
**Arquivo Gerado:** `recibo_joao_carlos_santos_09_2025_pagina_1.pdf`

## Tratamento Automático dos Nomes

### **Caracteres Especiais Removidos**
- **Antes:** "José-Maria (Silva)"
- **Depois:** "jose_maria_silva"

### **Acentos Preservados e Convertidos**
- **Antes:** "João Paulo"
- **Depois:** "joao_paulo"

### **Espaços Múltiplos Tratados**
- **Antes:** "Maria    Silva"
- **Depois:** "maria_silva"

### **Maiúsculas Convertidas**
- **Antes:** "CARLOS EDUARDO"
- **Depois:** "carlos_eduardo"

## Estrutura de Pastas

### **Organização por Período**
```
uploads/receipts/
├── 07_2025/
│   ├── recibo_varlei_marcelino_de_oliveira_07_2025_pagina_1.pdf
│   └── recibo_maria_silva_07_2025_pagina_1.pdf
├── 08_2025/
│   ├── recibo_joao_santos_08_2025_pagina_1.pdf
│   └── recibo_ana_oliveira_08_2025_pagina_1.pdf
└── 09_2025/
    └── recibo_pedro_costa_09_2025_pagina_1.pdf
```

## Casos Especiais

### **Nome Não Identificado**
**Situação:** Sistema não consegue extrair o nome
**Arquivo Gerado:** `recibo_funcionario_nao_identificado_07_2025_pagina_1.pdf`

### **Múltiplas Páginas**
**Situação:** PDF com 3 páginas de recibos
**Arquivos Gerados:**
- `recibo_funcionario1_07_2025_pagina_1.pdf`
- `recibo_funcionario2_07_2025_pagina_2.pdf`
- `recibo_funcionario3_07_2025_pagina_3.pdf`

### **Caracteres Especiais Complexos**
**Situação:** Nome com símbolos especiais
**Antes:** "José-Maria (Silva) & Costa"
**Depois:** `recibo_jose_maria_silva_costa_07_2025_pagina_1.pdf`

## Vantagens da Nomenclatura

### ✅ **Identificação Clara**
- Nome do funcionário visível no nome do arquivo
- Período (mês/ano) facilmente identificável
- Número da página para controle

### ✅ **Organização Automática**
- Pastas criadas por período automaticamente
- Arquivos agrupados logicamente
- Fácil localização e busca

### ✅ **Compatibilidade**
- Nomes válidos para todos os sistemas operacionais
- Sem caracteres especiais problemáticos
- Padrão consistente e previsível

### ✅ **Rastreabilidade**
- Histórico completo de processamento
- Logs detalhados de cada operação
- Auditoria facilitada

## Exemplo de Uso no Sistema

### **1. Upload do PDF**
```
Arquivo: comprovante_itaú_04_07_2025.pdf
```

### **2. Processamento Automático**
```
Extração: VARLEI MARCELINO DE OLIVEIRA
Mês/Ano: 07/2025
Valor: R$ 4.500,00
```

### **3. Geração do Novo PDF**
```
Nome: recibo_varlei_marcelino_de_oliveira_07_2025_pagina_1.pdf
Pasta: uploads/receipts/07_2025/
Template: Itaú oficial
```

### **4. Resultado Final**
```
✅ PDF processado com sucesso
✅ Nome do funcionário preservado
✅ Arquivo organizado por período
✅ Template profissional aplicado
✅ Dados validados e estruturados
```

## Considerações Técnicas

### **Limitações de Nome**
- **Máximo:** 255 caracteres (padrão do sistema)
- **Mínimo:** 3 caracteres para ser considerado válido
- **Fallback:** Nome genérico se inválido

### **Validação Automática**
- Verificação de caracteres permitidos
- Tratamento de nomes vazios ou nulos
- Sanitização automática de entrada

### **Performance**
- Processamento em lote otimizado
- Criação de pastas sob demanda
- Verificação de duplicatas

## Conclusão

A nomenclatura automática dos arquivos garante:
- **Organização clara** e lógica
- **Identificação fácil** dos funcionários
- **Padrão consistente** em todo o sistema
- **Rastreabilidade completa** das operações
- **Compatibilidade universal** com sistemas operacionais

O sistema transforma automaticamente nomes complexos em identificadores limpos e organizados, facilitando a gestão e localização dos recibos de pagamentos.
