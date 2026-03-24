# 📄 Como o Sistema Faz a Leitura do PDF

## Visão Geral

O sistema usa uma abordagem **multi-etapas** para processar PDFs de holerites, garantindo que todos os funcionários sejam identificados corretamente, mesmo quando há múltiplos holerites na mesma página.

---

## 🔧 Tecnologias Utilizadas

1. **Apache PDFBox**: Biblioteca Java para extrair texto de PDFs
2. **Tesseract OCR**: Fallback para PDFs escaneados (imagens)
3. **Regex (Expressões Regulares)**: Para identificar padrões (CPF, CNPJ, datas, etc.)

---

## 📋 Processo Completo de Leitura

### **ETAPA 1: Carregamento e Preparação do PDF**

```java
// 1. Carrega o PDF usando PDFBox
PDDocument document = PDDocument.load(file.getInputStream());

// 2. Verifica se está criptografado
if (document.isEncrypted()) {
    throw new IllegalArgumentException("O PDF está criptografado");
}

// 3. Cria um extrator de texto
PDFTextStripper stripper = new PDFTextStripper();

// 4. Conta o número de páginas
int pageCount = document.getNumberOfPages();
```

**O que acontece:**
- O PDF é carregado na memória
- Verifica se pode ser lido (não criptografado)
- Prepara o extrator de texto para cada página

---

### **ETAPA 2: Leitura de Todas as Páginas e Identificação de CPFs**

```java
// Para cada página do PDF
for (int i = 1; i <= pageCount; i++) {
    // 1. Extrai TODO o texto da página
    stripper.setStartPage(i);
    stripper.setEndPage(i);
    String pageText = stripper.getText(document);
    
    // 2. Identifica TODOS os CPFs nesta página
    List<String> cpfsUnicos = detectarTodosCPFsNaPagina(pageText);
    
    // 3. Para cada CPF encontrado, armazena:
    //    - CPF
    //    - Número da página
    //    - Posição do CPF no texto
    //    - Texto completo da página
}
```

**O que acontece:**
- **PDFBox extrai o texto** de cada página como uma string
- **Busca por padrões de CPF** usando regex:
  - `CPF: 123.456.789-00`
  - `CPF 12345678900`
  - `123.456.789-00`
  - `12345678900`
- **Armazena informações** de cada CPF encontrado

**Exemplo de texto extraído:**
```
PROMOVER VIGILANCIA PATRIMONIAL LTDA
CNPJ: 43.576.260/0001-12
01/10/2025 a 31/10/2025 TRANSPES TRANSP PESADOS
000224 MARCO TULIO MENEZES CPF: 11396510648
...
```

---

### **ETAPA 3: Segmentação do Texto por CPF**

```java
// Para cada CPF encontrado
for (HoleriteInfo info : holeritesEncontrados) {
    // 1. Encontra a posição do CPF no texto
    int posicaoCpf = info.posicaoNaPagina;
    
    // 2. Encontra a posição do próximo CPF (ou fim do texto)
    int posicaoProximoCpf = ...;
    
    // 3. Extrai uma SEÇÃO do texto correspondente a este CPF
    //    - Inclui 500 caracteres ANTES do CPF (contexto)
    //    - Vai até o próximo CPF (ou fim)
    int inicioSecao = Math.max(0, posicaoCpf - 500);
    int fimSecao = posicaoProximoCpf;
    info.secaoTexto = pageText.substring(inicioSecao, fimSecao);
}
```

**O que acontece:**
- **Divide o texto** em seções, uma para cada CPF
- Cada seção contém apenas o texto relevante para aquele funcionário
- Isso garante que os dados sejam extraídos corretamente mesmo quando há múltiplos holerites na mesma página

**Exemplo:**
```
Página 7 tem 2 CPFs:
- CPF 11396510648 (posição 500)
- CPF 12345678900 (posição 3000)

Seção 1 (CPF 11396510648):
  Texto da posição 0 até 3000
  (inclui contexto antes e vai até o próximo CPF)

Seção 2 (CPF 12345678900):
  Texto da posição 2500 até fim
  (inclui contexto antes e vai até o fim)
```

---

### **ETAPA 4: Extração de Dados de Cada Holerite**

Para cada seção de texto, o sistema extrai os seguintes dados:

#### **4.1. Extração do CPF**
```java
Pattern cpfPattern = Pattern.compile("CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2})");
// Busca por: "CPF: 123.456.789-00" ou "CPF 12345678900"
```

#### **4.2. Extração do Nome do Funcionário**

O sistema tenta **múltiplos padrões** na seguinte ordem:

**Padrão 1: Código + Nome + CPF**
```
000224 MARCO TULIO MENEZES CPF: 11396510648
```

**Padrão 2a: Nome + CPF (mais flexível)**
```
MARCO TULIO MENEZES  CPF: 11396510648
```
- Extrai tudo antes de "CPF"
- Remove códigos numéricos no início
- Valida se é um nome válido

**Padrão 2: Nome + CPF (regex)**
```
([A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ][A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ\\s]{4,}?)\\s{1,}CPF
```

**Padrão 2c: Código + Nome + CPF (regex)**
```
(\\d{4,6})\\s+([A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ]...)\\s+CPF
```

**Busca na Linha Anterior:**
- Se não encontrar na mesma linha do CPF, busca na linha anterior
- Útil quando a estrutura é:
  ```
  Linha 1: 000224 MARCO TULIO MENEZES
  Linha 2: CPF: 11396510648
  ```

#### **4.3. Extração do CNPJ da Empresa**
```java
Pattern cnpjPattern = Pattern.compile("CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})");
// Busca por: "CNPJ: 43.576.260/0001-12" ou "43576260000112"
```

#### **4.4. Extração do Nome da Empresa**
- Busca na mesma linha do CNPJ
- Busca na linha anterior ao CNPJ
- Busca por sufixos empresariais: "LTDA", "S.A", "ME", "EIRELI"

#### **4.5. Extração do Período**
```java
// Padrão 1: "01/10/2025 a 31/10/2025"
Pattern periodoPattern1 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+a\\s+(\\d{2})/(\\d{2})/(\\d{4})");

// Padrão 2: "10/2025"
Pattern periodoPattern2 = Pattern.compile("(\\d{2})/(\\d{4})");
```

#### **4.6. Extração do Setor (Posto de Trabalho)**
- Busca no texto **após o período** na mesma linha
- Exemplo: `01/10/2025 a 31/10/2025 TRANSPES TRANSP PESADOS`
- Remove palavras-chave como "FOLHA DE PAGAMENTO"
- Normaliza o nome (remove acentos, caracteres especiais)

#### **4.7. Extração de Dados Financeiros**
- **Total de Vencimentos**: Busca por "TOTAL VENCIMENTOS" ou similar
- **Total de Descontos**: Busca por "TOTAL DESCONTOS" ou similar
- **Valor Líquido**: Busca por "VALOR LÍQUIDO" ou similar

#### **4.8. Extração da Tabela Detalhada**
- Identifica linhas da tabela por padrões:
  - Código (3 dígitos)
  - Descrição (texto)
  - Referência (números/valores)
  - Vencimentos (valores monetários)
  - Descontos (valores monetários)

---

### **ETAPA 5: Fallback com OCR (Quando PDFBox Falha)**

Se a extração via PDFBox falhar (PDF escaneado, texto não selecionável):

```java
// 1. Converte a página do PDF em imagem (300 DPI)
PDFRenderer pdfRenderer = new PDFRenderer(document);
BufferedImage image = pdfRenderer.renderImageWithDPI(pageNumber - 1, 300);

// 2. Salva a imagem temporariamente
File imageFile = new File("temp_page_" + pageNumber + ".png");
ImageIO.write(image, "PNG", imageFile);

// 3. Usa Tesseract OCR para extrair texto da imagem
String text = tesseractService.extractTextFromImage(imageFile);

// 4. Processa o texto extraído pelo OCR da mesma forma
Payslip payslip = extractPayslipInfo(text, pageNumber, text);

// 5. Remove o arquivo temporário
imageFile.delete();
```

**Quando o OCR é usado:**
- PDF escaneado (imagem, não texto)
- Texto não selecionável
- PDFBox não consegue extrair texto suficiente

---

## 🔍 Exemplo Prático Completo

### **PDF de Entrada:**
```
Página 7:
┌─────────────────────────────────────────┐
│ PROMOVER VIGILANCIA PATRIMONIAL LTDA   │
│ CNPJ: 43.576.260/0001-12                │
│                                         │
│ 01/10/2025 a 31/10/2025 TRANSPES       │
│ TRANSP PESADOS                          │
│                                         │
│ 000224 MARCO TULIO MENEZES              │
│ CPF: 11396510648                        │
│                                         │
│ [Tabela de vencimentos e descontos]    │
│                                         │
│ TOTAL VENCIMENTOS: 1.914,55            │
│ TOTAL DESCONTOS: 189,55                │
│ VALOR LÍQUIDO: 1.725,00                │
└─────────────────────────────────────────┘
```

### **Processamento:**

1. **PDFBox extrai texto:**
   ```
   "PROMOVER VIGILANCIA PATRIMONIAL LTDA\nCNPJ: 43.576.260/0001-12\n01/10/2025 a 31/10/2025 TRANSPES TRANSP PESADOS\n000224 MARCO TULIO MENEZES\nCPF: 11396510648\n..."
   ```

2. **Sistema identifica CPF:**
   - CPF encontrado: `11396510648`
   - Posição: 150 caracteres do início

3. **Sistema extrai seção:**
   - Início: 0 (ou 500 caracteres antes se houver)
   - Fim: fim do texto (ou próximo CPF)
   - Seção: texto completo da página

4. **Sistema extrai dados:**
   - **CPF**: `11396510648` ✅
   - **Nome**: `MARCO TULIO MENEZES` ✅ (Padrão 1 ou busca linha anterior)
   - **Código**: `000224` ✅
   - **CNPJ**: `43576260000112` ✅
   - **Empresa**: `PROMOVER VIGILANCIA PATRIMONIAL LTDA` ✅
   - **Período**: `10/2025` ✅
   - **Setor**: `TRANSPES TRANSP PESADOS` ✅
   - **Vencimentos**: `1914.55` ✅
   - **Descontos**: `189.55` ✅
   - **Líquido**: `1725.00` ✅

5. **Sistema salva:**
   - Cria estrutura de pastas: `Empresa/Setor/Periodo/Nome_CPF/`
   - Salva PDF: `holerite_v1.pdf`
   - Salva no banco de dados

---

## ⚠️ Tratamento de Erros

### **Se PDFBox Falhar:**
- Tenta OCR automaticamente
- Loga o erro para debug

### **Se Dados Obrigatórios Faltarem:**
- CPF: ❌ Holerite não é processado
- Nome: ❌ Holerite não é processado
- CNPJ: ⚠️ Usa fallback "EMPRESA_NAO_INFORMADA"
- Setor: ⚠️ Usa fallback "SETOR_NAO_INFORMADO"
- Período: ❌ Holerite não é processado

### **Validações:**
- CPF deve ter 11 dígitos
- CNPJ deve ter 14 dígitos
- Nome deve ter pelo menos 5 caracteres
- Nome não pode conter palavras-chave inválidas ("FOLHA", "PAGAMENTO", etc.)

---

## 📊 Resumo do Fluxo

```
PDF Upload
    ↓
Carregar PDF (PDFBox)
    ↓
ETAPA 1: Ler todas as páginas e identificar CPFs
    ↓
ETAPA 2: Segmentar texto por CPF
    ↓
ETAPA 3: Para cada CPF, extrair dados:
    ├─ CPF
    ├─ Nome (múltiplos padrões)
    ├─ CNPJ
    ├─ Empresa
    ├─ Período
    ├─ Setor
    ├─ Valores Financeiros
    └─ Tabela Detalhada
    ↓
ETAPA 4: Validar dados obrigatórios
    ↓
ETAPA 5: Salvar no banco e sistema de arquivos
    ↓
FIM ✅
```

---

## 🎯 Pontos Importantes

1. **Multi-padrão**: O sistema tenta vários padrões para garantir que encontre os dados
2. **Segmentação**: Divide o texto por CPF para evitar confusão entre múltiplos holerites
3. **Fallback OCR**: Se PDFBox falhar, usa OCR automaticamente
4. **Validação rigorosa**: Só processa holerites com dados obrigatórios completos
5. **Logs detalhados**: Cada etapa é logada para facilitar debug

---

## 🔧 Configurações

- **DPI do OCR**: 300 DPI (alta qualidade)
- **Contexto antes do CPF**: 500 caracteres
- **Validação de nome**: Mínimo 5 caracteres, pelo menos 2 palavras
- **Formato de data**: Aceita `DD/MM/AAAA` e `MM/AAAA`

