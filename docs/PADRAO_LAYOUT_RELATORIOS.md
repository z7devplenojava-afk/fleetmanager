# 📄 Padrão de Layout para Relatórios PDF e Excel

## 📋 Visão Geral

Este documento define o padrão visual e técnico para todos os relatórios do sistema SecuredGuard, garantindo consistência visual e profissionalismo em todos os documentos gerados.

## 🎨 Especificações Visuais

### 1. Cabeçalho (Header)

#### 1.1 Logo da Empresa
- **Posição**: Canto superior esquerdo
- **Dimensões**: 297px × 217px (222.75pt × 162.75pt)
- **Margem esquerda**: 15pt
- **Margem superior**: 5pt abaixo do gradiente
- **Formato suportado**: PNG, JPG, SVG (convertido para raster)
- **Comportamento**: 
  - Se logo não disponível, espaço é reservado mas não exibe nada
  - Logo é redimensionado mantendo proporção (fit dentro de 297×217px)
  - Suporta URLs HTTP/HTTPS ou caminhos locais

#### 1.2 Barra Gradiente Superior
- **Posição**: Topo da página (0pt do topo)
- **Altura**: 27.5pt (~37px)
- **Largura**: 100% da página
- **Cores**: Gradiente horizontal
  - Início (esquerda): Amarelo `#FFCC00` (RGB: 255, 204, 0)
  - Meio: Laranja `#FF9900` (RGB: 255, 153, 0)
  - Fim (direita): Vermelho `#FF3333` (RGB: 255, 51, 51)
- **Transição**: Suave, 200 segmentos para gradiente fluido

#### 1.3 Forma Curva Escura
- **Posição**: Canto superior esquerdo, sobrepondo parcialmente o gradiente
- **Cor**: Cinza escuro `#1E1E1E` (RGB: 30, 30, 30)
- **Forma**: Curva orgânica usando curvas de Bézier
- **Dimensões**: ~15% da largura da página, ~60pt de altura

#### 1.4 Título do Relatório
- **Posição**: Centralizado horizontalmente, abaixo do gradiente
- **Coordenada Y**: 40pt do topo
- **Fonte**: 
  - Tamanho: 18pt
  - Peso: Negrito (Bold)
  - Cor: Preto `#000000`
  - Alinhamento: Centralizado
- **Margem inferior**: 5pt

#### 1.5 Informações da Empresa (Cabeçalho)
- **Posição**: Centralizado, abaixo do título
- **Coordenada Y**: 65pt do topo
- **Nome da Empresa**:
  - Fonte: 14pt, Negrito, Preto
  - Alinhamento: Centralizado
- **CNPJ** (se disponível):
  - Fonte: 9pt, Regular, Cinza `#505050` (RGB: 80, 80, 80)
  - Alinhamento: Centralizado
  - Formato: `CNPJ: XX.XXX.XXX/XXXX-XX`
  - Posição: 18pt abaixo do nome

### 2. Área de Conteúdo

#### 2.1 Margens
- **Superior**: 120pt (acomodar cabeçalho)
- **Inferior**: 80pt (acomodar rodapé)
- **Esquerda**: 50pt
- **Direita**: 50pt

#### 2.2 Área Utilizável
- **Largura**: Largura da página (595pt A4) - 100pt (margens)
- **Altura**: Altura da página (842pt A4) - 200pt (margens + cabeçalho + rodapé)
- **Cor de fundo**: Branco `#FFFFFF`

### 3. Rodapé (Footer)

#### 3.1 Linha Gradiente Inferior
- **Posição**: Parte inferior da página (0pt da base)
- **Altura**: 3pt (~4px)
- **Largura**: 100% da página
- **Cores**: Mesmo gradiente do cabeçalho (amarelo → laranja → vermelho)

#### 3.2 Informações da Empresa (Rodapé)
- **Posição**: Acima da linha gradiente
- **Coordenada Y**: 20pt da base
- **Fonte**: 8pt, Regular, Preto
- **Alinhamento**: Centralizado
- **Conteúdo**: 
  - Nome da empresa
  - Endereço completo (se disponível): `Rua, Número - Bairro - Cidade/Estado`
  - Telefone (se disponível): `Tel: (XX) XXXX-XXXX`
  - Email (se disponível): `Email: email@empresa.com.br`
  - Separador: ` | ` entre informações

#### 3.3 Data de Geração
- **Posição**: Acima das informações da empresa
- **Coordenada Y**: 5pt da base
- **Fonte**: 7pt, Regular, Cinza `#646464` (RGB: 100, 100, 100)
- **Alinhamento**: Centralizado
- **Formato**: `Gerado em: DD/MM/AAAA HH:mm`

### 4. Cache de Performance

#### 4.1 Cache de Templates
- Templates de fundo são cacheados em memória
- Limite: 50 templates (configurável)
- Benefício: Reduz tempo de carregamento em relatórios subsequentes

#### 4.2 Cache de Logos
- Logos redimensionados são cacheados por empresa
- Limite: 50 logos (configurável)
- Chave de cache: `logoUrl_companyId`
- Benefício: Evita recarregar e redimensionar logos repetidamente

#### 4.3 Limpeza de Cache
- Endpoint: `POST /api/reports/layout/cache/clear`
- Método: `StandardReportLayoutService.clearCache()`
- Uso: Após atualizar logos ou templates

## 📊 Especificações Técnicas

### 5. PDF (iText 7)

#### 5.1 Tamanho de Página
- **Formato**: A4 (595pt × 842pt)
- **Orientação**: Retrato (Portrait)

#### 5.2 Conversão de Unidades
- **1 pixel (px) = 0.75 pontos (pt)** (padrão web 96 DPI)
- **Logo**: 297px × 217px = 222.75pt × 162.75pt

#### 5.3 Camadas (Layers)
1. **Background Layer** (newContentStreamBefore):
   - Template de fundo (gradiente, forma curva, marca d'água)
2. **Content Layer** (conteúdo do relatório):
   - Tabelas, textos, gráficos
3. **Header/Footer Layer** (newContentStreamAfter):
   - Logo, título, informações da empresa, rodapé

### 6. Excel (Apache POI)

#### 6.1 Estrutura da Planilha

##### 6.1.1 Cabeçalho (Linhas 1-6)
- **Linha 1**: Logo da empresa (mesclado, altura 120px)
  - Coluna A: Logo (297px × 217px redimensionado proporcionalmente)
  - Colunas B-F: Vazias (para centralizar logo)
- **Linha 2**: Barra gradiente (altura 20px)
  - Células mescladas A-F com gradiente amarelo → laranja → vermelho
- **Linha 3**: Título do relatório (altura 30px)
  - Células mescladas A-F
  - Fonte: 18pt, Negrito, Centralizado
- **Linha 4**: Nome da empresa (altura 20px)
  - Células mescladas A-F
  - Fonte: 14pt, Negrito, Centralizado
- **Linha 5**: CNPJ (se disponível) (altura 15px)
  - Células mescladas A-F
  - Fonte: 9pt, Regular, Cinza, Centralizado
- **Linha 6**: Linha em branco (altura 10px)

##### 6.1.2 Conteúdo (Linhas 7+)
- **Linha 7**: Cabeçalhos da tabela
  - Fonte: 11pt, Negrito
  - Fundo: Cinza claro `#E0E0E0`
  - Borda: Fina, preta
- **Linhas 8+**: Dados do relatório
  - Fonte: 10pt, Regular
  - Bordas: Finas, cinza claro

##### 6.1.3 Rodapé (Últimas 3 linhas)
- **Antepenúltima linha**: Linha em branco (altura 10px)
- **Penúltima linha**: Informações da empresa (altura 20px)
  - Células mescladas A-F
  - Fonte: 8pt, Regular, Centralizado
  - Conteúdo: Nome | Endereço | Tel: XXX | Email: XXX
- **Última linha**: Data de geração + linha gradiente (altura 20px)
  - Células mescladas A-F
  - Fonte: 7pt, Regular, Cinza, Centralizado
  - Fundo: Gradiente amarelo → laranja → vermelho (altura 3px na parte inferior)

#### 6.2 Estilos Excel
- **Cores do gradiente**: 
  - Amarelo: `#FFCC00`
  - Laranja: `#FF9900`
  - Vermelho: `#FF3333`
- **Bordas**: Fina, cor `#CCCCCC`
- **Alinhamento**: 
  - Cabeçalho: Centralizado
  - Dados numéricos: Direita
  - Dados texto: Esquerda
  - Datas: Centralizado

## 🔧 Configuração por Empresa

### 7. Campos da Entidade Company

Todos os campos necessários já estão disponíveis na entidade `Company`:

```java
- name: String                    // Nome da empresa
- logoUrl: String                 // URL/caminho do logo
- cnpj: String                    // CNPJ (formatado)
- address: String                 // Endereço completo (legado)
- enderecoRua: String            // Rua
- enderecoNumero: String         // Número
- enderecoComplemento: String    // Complemento
- enderecoBairro: String         // Bairro
- city: String                   // Cidade
- state: String                  // Estado (UF)
- zipCode: String                // CEP
- phone: String                  // Telefone
- email: String                  // Email
```

### 8. Formatação de Dados

#### 8.1 CNPJ
- **Formato**: `XX.XXX.XXX/XXXX-XX`
- **Exemplo**: `43.576.260/0001-12`

#### 8.2 Telefone
- **Formato**: `(XX) XXXX-XXXX` ou `(XX) XXXXX-XXXX`
- **Exemplo**: `(31) 2559-1245`

#### 8.3 Endereço Completo
- **Formato**: `Rua, Número - Complemento - Bairro - Cidade/Estado - CEP`
- **Exemplo**: `Rua Coronel João Camargos, nº 267 - Centro - Contagem/MG - 32000-000`

#### 8.4 Data/Hora
- **Formato**: `DD/MM/AAAA HH:mm`
- **Exemplo**: `12/01/2026 10:05`

## 📐 Dimensões e Espaçamentos

### 9. Tabela de Referência

| Elemento | PDF (pt) | PDF (px) | Excel (px) | Excel (linhas) |
|----------|----------|----------|------------|----------------|
| Logo largura | 222.75 | 297 | 297 | - |
| Logo altura | 162.75 | 217 | 217 | 120px |
| Gradiente topo altura | 27.5 | 37 | 20 | 1 |
| Gradiente rodapé altura | 3 | 4 | 3 | - |
| Margem superior | 120 | 160 | - | - |
| Margem inferior | 80 | 107 | - | - |
| Margem esquerda | 50 | 67 | - | - |
| Margem direita | 50 | 67 | - | - |
| Título fonte | 18 | 24 | 18 | - |
| Nome empresa fonte | 14 | 19 | 14 | - |
| CNPJ fonte | 9 | 12 | 9 | - |
| Rodapé fonte | 8 | 11 | 8 | - |
| Data fonte | 7 | 9 | 7 | - |

## 🎯 Personalização de Cores

### 10. Cores Padrão do Gradiente

**Cores padrão** (usadas quando não há personalização):
- Amarelo: `#FFCC00` (RGB: 255, 204, 0)
- Laranja: `#FF9900` (RGB: 255, 153, 0)
- Vermelho: `#FF3333` (RGB: 255, 51, 51)

### 11. Personalização por Empresa (Futuro)

**Estrutura preparada** para permitir que cada empresa tenha suas próprias cores:
- Campo `gradientColors` em `ReportLayoutConfig`
- Método `getGradientColors(Company company)` em `StandardReportLayoutService`
- Endpoint de preview retorna cores configuradas

**Implementação futura**:
- Adicionar campos na entidade `Company` para armazenar cores personalizadas
- Interface administrativa para configurar cores por empresa
- Validação de cores (formato hex válido)

## 🔄 Fluxo de Geração

### 12. PDF

```
1. Criar Document com ReportLayoutConfig
2. Adicionar conteúdo (tabelas, textos, etc.)
3. Finalizar layout (adicionar header/footer em todas as páginas)
4. Fechar documento
```

### 13. Excel

```
1. Criar Workbook (XSSFWorkbook)
2. Criar Sheet
3. Adicionar cabeçalho (logo, gradiente, título, empresa)
4. Adicionar conteúdo (tabela de dados)
5. Adicionar rodapé (informações empresa, data, gradiente)
6. Aplicar estilos e formatação
7. Auto-ajustar colunas
8. Converter para bytes
```

## 🔍 Preview de Layout

### 12. Endpoint de Preview

**Endpoint**: `GET /api/reports/layout/preview/{companyId}`

**Resposta**: `ReportLayoutPreviewDTO` contendo:
- Informações da empresa formatadas
- Logo URL
- CNPJ formatado
- Endereço completo formatado
- Telefone formatado
- Email
- Texto completo do rodapé
- Cores do gradiente (padrão ou personalizadas)

**Uso**: 
- Validar layout antes de gerar relatório
- Exibir preview no frontend
- Testar formatação de dados

## ✅ Checklist de Implementação

- [x] Criar template de fundo
- [x] Implementar serviço de layout Excel (ExcelReportLayoutService)
- [x] Atualizar StandardReportLayoutService com cache
- [x] Criar CompanyDataFormatter para formatação
- [x] Criar endpoint de preview
- [x] Adicionar estrutura para personalização de cores
- [ ] Atualizar todos os serviços de relatório para usar novo padrão
- [ ] Testar geração de PDF com diferentes empresas
- [ ] Testar geração de Excel com diferentes empresas
- [ ] Validar formatação de dados (CNPJ, telefone, endereço)
- [ ] Documentar uso para desenvolvedores
- [ ] Criar exemplos de uso

## 📝 Notas de Implementação

1. **Logo**: O sistema já suporta logo via URL HTTP/HTTPS ou caminho local
2. **Templates**: Os templates de fundo devem ser colocados em `backend/src/main/resources/templates/reports/`
3. **Marca d'água**: Pode ser incluída no template PNG ou desenhada programaticamente
4. **Excel**: Apache POI não suporta gradientes nativos, usar preenchimento sólido ou simulação
5. **Performance**: Cache de logos e templates para melhor performance
