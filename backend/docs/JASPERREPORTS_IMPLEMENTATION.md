# 📊 Implementação JasperReports

## Visão Geral

O JasperReports foi implementado no sistema Secure Guard para geração de relatórios avançados em PDF e Excel. Esta implementação oferece relatórios profissionais com formatação rica, gráficos e dados estruturados.

## 🏗️ Arquitetura

### Componentes Principais

1. **JasperReportsConfig** (`config/JasperReportsConfig.java`)
   - Configuração central do JasperReports
   - Métodos para compilação de templates JRXML
   - Geração de relatórios PDF e Excel
   - Configuração de metadados e exportação

2. **ReportService** (`service/ReportService.java`)
   - Serviço de negócio para relatórios
   - Integração com serviços existentes
   - Criação de parâmetros personalizados
   - Tratamento de erros

3. **ReportController** (`controller/ReportController.java`)
   - Endpoints REST para geração de relatórios
   - Controle de permissões
   - Download de arquivos
   - Documentação Swagger

4. **Templates JRXML** (`resources/reports/`)
   - Templates de relatórios
   - Formatação e layout
   - Parâmetros e campos

## 📋 Relatórios Disponíveis

### 1. Relatório de Funcionários
- **Endpoint**: `/api/reports/employees/pdf`
- **Formato**: PDF
- **Dados**: Lista completa de funcionários
- **Campos**: Nome, Email, Status, Cargo, Departamento

### 2. Relatório de Empresas
- **Endpoint**: `/api/reports/companies/pdf`
- **Formato**: PDF
- **Dados**: Empresas cadastradas
- **Campos**: Nome, CNPJ, Endereço, Status

### 3. Relatório de Produtos
- **Endpoint**: `/api/reports/products/pdf`
- **Formato**: PDF
- **Dados**: Catálogo de produtos
- **Campos**: Nome, Categoria, Preço, Estoque

### 4. Relatório de Estoque
- **Endpoint**: `/api/reports/inventory/pdf`
- **Formato**: PDF
- **Dados**: Situação do estoque
- **Campos**: Item, Quantidade, Localização, Status

### 5. Relatório Financeiro
- **Endpoint**: `/api/reports/financial/pdf`
- **Formato**: PDF
- **Dados**: Movimentações financeiras
- **Campos**: Data, Descrição, Valor, Tipo

### 6. Relatório Consolidado
- **Endpoint**: `/api/reports/consolidated/pdf`
- **Formato**: PDF
- **Dados**: Visão geral do sistema
- **Campos**: Resumo de todas as áreas

## 🔧 Configuração

### Dependências Maven

```xml
<!-- JasperReports Core -->
<dependency>
    <groupId>net.sf.jasperreports</groupId>
    <artifactId>jasperreports</artifactId>
    <version>6.20.6</version>
</dependency>

<!-- Fonts -->
<dependency>
    <groupId>net.sf.jasperreports</groupId>
    <artifactId>jasperreports-fonts</artifactId>
    <version>6.20.6</version>
</dependency>

<!-- Chart Themes -->
<dependency>
    <groupId>net.sf.jasperreports</groupId>
    <artifactId>jasperreports-chart-themes</artifactId>
    <version>6.20.6</version>
</dependency>
```

### Estrutura de Diretórios

```
src/main/resources/
└── reports/
    ├── employee_report.jrxml
    ├── company_report.jrxml
    ├── product_report.jrxml
    ├── inventory_report.jrxml
    ├── financial_report.jrxml
    └── consolidated_report.jrxml
```

## 🎨 Templates JRXML

### Estrutura Básica

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="ReportName" pageWidth="595" pageHeight="842"
              columnWidth="555" leftMargin="20" rightMargin="20"
              topMargin="20" bottomMargin="20">
    
    <!-- Parâmetros -->
    <parameter name="REPORT_TITLE" class="java.lang.String"/>
    
    <!-- Campos -->
    <field name="name" class="java.lang.String"/>
    <field name="email" class="java.lang.String"/>
    
    <!-- Título -->
    <title>
        <band height="50">
            <textField>
                <reportElement x="0" y="0" width="555" height="30"/>
                <textElement textAlignment="Center" verticalAlignment="Middle">
                    <font size="16" isBold="true"/>
                </textElement>
                <textFieldExpression><![CDATA[$P{REPORT_TITLE}]]></textFieldExpression>
            </textField>
        </band>
    </title>
    
    <!-- Cabeçalho das Colunas -->
    <columnHeader>
        <band height="30">
            <staticText>
                <reportElement x="0" y="0" width="200" height="30"/>
                <textElement verticalAlignment="Middle">
                    <font size="12" isBold="true"/>
                </textElement>
                <text><![CDATA[Nome]]></text>
            </staticText>
        </band>
    </columnHeader>
    
    <!-- Detalhes -->
    <detail>
        <band height="20">
            <textField isBlankWhenNull="true">
                <reportElement x="0" y="0" width="200" height="20"/>
                <textElement verticalAlignment="Middle">
                    <font size="10"/>
                </textElement>
                <textFieldExpression><![CDATA[$F{name}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
    
</jasperReport>
```

## 🔐 Controle de Permissões

### Níveis de Acesso

- **SUPERVISOR**: Relatórios básicos (funcionários, empresas)
- **GESTOR**: Relatórios operacionais (produtos, estoque)
- **ADMIN**: Todos os relatórios
- **SUPER_ADMIN**: Acesso total + relatório consolidado

### Anotações de Segurança

```java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR')")
public ResponseEntity<byte[]> generateEmployeeReportPdf(...)

@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR')")
public ResponseEntity<byte[]> generateFinancialReportPdf(...)

@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public ResponseEntity<byte[]> generateConsolidatedReportPdf(...)
```

## 🚀 Uso no Frontend

### Componente ReportGenerator

```tsx
import ReportGenerator from '@/components/reports/ReportGenerator';

// Uso básico
<ReportGenerator />

// Com props personalizadas
<ReportGenerator className="custom-class" />
```

### Endpoints Disponíveis

```typescript
// Relatórios em PDF
GET /api/reports/employees/pdf
GET /api/reports/companies/pdf
GET /api/reports/products/pdf
GET /api/reports/inventory/pdf
GET /api/reports/financial/pdf
GET /api/reports/consolidated/pdf

// Relatórios em Excel (apenas funcionários)
GET /api/reports/employees/excel
```

## 📊 Recursos Avançados

### 1. Parâmetros Dinâmicos
- Filtros por data
- Filtros por status
- Filtros por departamento
- Parâmetros personalizados

### 2. Formatação
- Cabeçalhos personalizados
- Rodapés com numeração
- Cores e estilos
- Fontes incorporadas

### 3. Exportação
- PDF para impressão
- Excel para análise
- Metadados personalizados
- Nomes de arquivo dinâmicos

## 🛠️ Desenvolvimento

### Criando Novos Relatórios

1. **Criar template JRXML**
   ```bash
   # Copiar template existente
   cp src/main/resources/reports/employee_report.jrxml \
      src/main/resources/reports/new_report.jrxml
   ```

2. **Adicionar método no ReportService**
   ```java
   public byte[] generateNewReportPdf(Map<String, Object> filters) {
       // Implementação
   }
   ```

3. **Adicionar endpoint no ReportController**
   ```java
   @GetMapping("/new/pdf")
   public ResponseEntity<byte[]> generateNewReportPdf(...) {
       // Implementação
   }
   ```

4. **Adicionar opção no frontend**
   ```typescript
   const reportTypes = [
     // ... outros relatórios
     { id: 'new', name: 'Novo Relatório', endpoint: '/api/reports/new/pdf' }
   ];
   ```

### Debugging

```java
// Logs detalhados
log.info("Gerando relatório: {}", reportType);
log.debug("Parâmetros: {}", parameters);
log.error("Erro ao gerar relatório", e);
```

## 📈 Performance

### Otimizações Implementadas

1. **Compilação em Cache**
   - Templates compilados uma vez
   - Reutilização de objetos JasperReport

2. **Streaming de Dados**
   - Processamento em chunks
   - Baixo uso de memória

3. **Configuração de Exportação**
   - Otimizações específicas por formato
   - Compressão automática

### Monitoramento

```java
// Métricas de performance
@Timed("report.generation.time")
@Counted("report.generation.count")
public byte[] generateReport(...) {
    // Implementação
}
```

## 🔧 Manutenção

### Logs Importantes

```bash
# Verificar logs de relatórios
grep "Relatório" logs/application.log

# Verificar erros
grep "ERROR.*Report" logs/application.log

# Verificar performance
grep "report.generation" logs/application.log
```

### Backup de Templates

```bash
# Backup dos templates
tar -czf reports_backup_$(date +%Y%m%d).tar.gz \
    src/main/resources/reports/
```

## 🎯 Próximos Passos

### Melhorias Planejadas

1. **Gráficos Interativos**
   - Gráficos de pizza
   - Gráficos de barras
   - Gráficos de linha

2. **Relatórios Agendados**
   - Geração automática
   - Envio por email
   - Armazenamento em nuvem

3. **Templates Dinâmicos**
   - Editor visual
   - Templates personalizáveis
   - Preview em tempo real

4. **Exportação Avançada**
   - HTML interativo
   - XML estruturado
   - JSON para APIs

### Integrações Futuras

- **Apache POI**: Para relatórios Excel avançados
- **iText**: Para PDFs mais complexos
- **Chart.js**: Para gráficos interativos
- **Quartz**: Para agendamento de relatórios

---

## 📞 Suporte

Para dúvidas sobre a implementação do JasperReports:

1. **Documentação Oficial**: https://jasperreports.sourceforge.net/
2. **Exemplos**: Pasta `src/main/resources/reports/`
3. **Logs**: Verificar `logs/application.log`
4. **Issues**: Criar issue no repositório do projeto

---

*Implementação JasperReports v1.0 - Secure Guard System* 