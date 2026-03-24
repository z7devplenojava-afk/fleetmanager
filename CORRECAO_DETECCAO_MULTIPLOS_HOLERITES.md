# 🔧 Correção: Detecção de Múltiplos Holerites na Mesma Página

## 🐛 Problema Identificado

O sistema estava processando apenas 4 holerites de um PDF com 9 páginas, mesmo quando algumas páginas continham múltiplos holerites de diferentes setores.

**Setores mencionados pelo usuário:**
- CONSTRUTORA BARBOSA MELO BARAO
- JOTA EMPREENDIMENTOS E PARTIC LTDA
- TRANSPES TRANSP PESADOS
- FIDENS CONSTRUCOES SA ✅ (identificado)
- LUNI LOG EMPREENDIMENTOS IMOB LTDA
- Associacao Alphaville Minas Gerais ✅ (identificado, mas apenas 4 holerites)

## 🔍 Causa Raiz

1. **Detecção de CPFs limitada**: O método `detectarTodosCPFsNaPagina()` procurava apenas por CPFs no formato `CPF: 123.456.789-00`, mas alguns PDFs podem ter CPFs em formatos diferentes.

2. **Extração não focada**: O método `extractPayslipInfoPorCPF()` chamava `extractPayslipInfo()` que sempre extraía o primeiro CPF encontrado na página, não o CPF específico solicitado.

3. **Falta de divisão de seções**: Quando havia múltiplos holerites na mesma página, o sistema não dividia o texto em seções para extrair cada holerite separadamente.

## ✅ Correções Implementadas

### 1. Melhorada Detecção de CPFs

**Antes:**
```java
Pattern cpfPattern = Pattern.compile("CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2})");
```

**Depois:**
- ✅ Padrão 1: `CPF: 123.456.789-00` ou `CPF 123.456.789-00`
- ✅ Padrão 2: Apenas números de 11 dígitos (sem rótulo CPF)
- ✅ Padrão 3: CPF formatado com pontos e traço: `123.456.789-00` (sem rótulo)
- ✅ Validação para evitar confundir com CNPJ (14 dígitos)
- ✅ Validação para evitar CPFs inválidos (todos zeros, sequenciais)

### 2. Divisão de Texto em Seções

**Novo método `extractPayslipInfoPorCPF()`:**
- ✅ Detecta múltiplos CPFs na página
- ✅ Encontra a posição do CPF alvo no texto
- ✅ Encontra a posição do próximo CPF (ou fim do texto)
- ✅ Extrai apenas a seção do texto correspondente ao CPF alvo
- ✅ Inclui contexto antes do CPF (500 caracteres) para pegar nome e código
- ✅ Extrai dados apenas dessa seção específica

**Exemplo:**
```
Texto completo da página:
  [Holerite 1 - CPF 111.111.111-11] ... [Holerite 2 - CPF 222.222.222-22] ...
  
Para extrair Holerite 2:
  Seção extraída: [Holerite 2 - CPF 222.222.222-22] ...
```

### 3. Extração Focada por CPF

- ✅ Cada holerite é extraído apenas da sua seção específica
- ✅ Setor, empresa e período são extraídos da seção correta
- ✅ Evita misturar dados de diferentes holerites

## 📊 Fluxo Corrigido

1. **Detectar todos os CPFs** na página (múltiplos formatos)
2. **Para cada CPF único:**
   - Dividir texto em seção correspondente ao CPF
   - Extrair dados apenas dessa seção
   - Processar holerite individualmente
3. **Validar** que o CPF extraído corresponde ao alvo
4. **Processar** cada holerite separadamente

## 🧪 Como Testar

1. Importar PDF com múltiplos holerites na mesma página
2. Verificar logs:
   - `🔍 Total de CPFs únicos detectados na página: X`
   - `📄 Processando holerite X/Y da página Z - CPF: ...`
   - `📄 Seção extraída para CPF ...: X caracteres`
3. Verificar que todos os holerites foram processados
4. Verificar que cada holerite tem o setor correto

## ⚠️ Observações

- A divisão de seções funciona melhor quando os CPFs estão claramente separados no texto
- Se os holerites estiverem muito próximos ou sobrepostos, pode haver alguma mistura de dados
- O sistema ainda tenta extração completa como fallback se a divisão falhar

## 📝 Próximos Passos

1. ✅ Testar com o PDF do usuário (9 páginas, múltiplos setores)
2. ⚠️ Verificar se todos os 9 holerites são detectados
3. ⚠️ Verificar se todos os setores são identificados corretamente
4. ⚠️ Se ainda houver problemas, adicionar mais padrões de detecção ou melhorar a divisão de seções

