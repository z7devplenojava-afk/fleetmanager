# Sistema de Relatórios - Secure Guard

## Visão Geral

O sistema de relatórios foi implementado para gerar documentos profissionais com cabeçalho personalizado da empresa **Promover - Vigilância Patrimonial LTDA**, incluindo logomarca e dados corporativos.

## Estrutura Implementada

### 1. Serviços de Relatórios

#### `ReportTemplateService`
- **Função**: Gerencia templates HTML para relatórios
- **Recursos**:
  - Carregamento de templates do classpath
  - Geração de cabeçalho padrão com dados da empresa
  - Processamento de templates com substituição de variáveis
  - Geração de relatórios completos (cabeçalho + conteúdo + rodapé)

#### `ContasAPagarReportService`
- **Função**: Gera relatórios específicos de contas a pagar
- **Tipos de Relatório**:
  - Por período (data início/fim)
  - Por status (PENDENTE, PAGA, CANCELADA, etc.)
  - Por tipo (FIXA, VARIAVEL)
  - Resumido (todas as contas)

### 2. Controllers

#### `ReportController`
Endpoints principais para geração de relatórios:

- `GET /api/reports/contas-a-pagar` - Relatório por período
- `GET /api/reports/contas-a-pagar/status/{status}` - Relatório por status
- `GET /api/reports/contas-a-pagar/tipo/{type}` - Relatório por tipo
- `GET /api/reports/contas-a-pagar/resumo` - Relatório resumido
- `GET /api/reports/company-data` - Dados da empresa
- `GET /api/reports/template/{templateName}` - Obter template específico

#### `TestReportController`
Endpoints para testes:

- `GET /api/test-reports/contas-a-pagar/test` - Teste de relatório por período
- `GET /api/test-reports/contas-a-pagar/summary-test` - Teste de relatório resumido

### 3. Templates HTML

#### `header.html`
- Cabeçalho padrão com logomarca da empresa
- Dados corporativos (nome, slogan, endereço, telefone, email, CNPJ)
- Design responsivo e profissional
- Cores da marca (vermelho #e74c3c e amarelo #f39c12)

#### `footer.html`
- Rodapé padrão com informações da empresa
- Data de geração e numeração de páginas

#### `contas-a-pagar.html`
- Template específico para relatórios de contas a pagar
- Seções:
  - Resumo executivo com estatísticas
  - Tabela detalhada das contas
  - Gráficos de análise por status
- Estilos CSS integrados para impressão

### 4. Configuração

#### `CompanyConfig`
- Classe de configuração para dados da empresa
- Suporte a `@ConfigurationProperties`
- Estrutura hierárquica para organizações e cores

#### `application-report.properties`
- Arquivo de propriedades para configuração
- Dados da empresa configuráveis
- Cores e estilos personalizáveis

## Como Usar

### 1. Gerar Relatório por Período
```bash
GET /api/reports/contas-a-pagar?startDate=2024-01-01&endDate=2024-01-31&format=html
```

### 2. Gerar Relatório por Status
```bash
GET /api/reports/contas-a-pagar/status/PENDENTE?format=html
```

### 3. Gerar Relatório Resumido
```bash
GET /api/reports/contas-a-pagar/resumo?format=html
```

### 4. Testar Sistema
```bash
GET /api/test-reports/contas-a-pagar/test
```

## Características dos Relatórios

### Design Profissional
- ✅ Cabeçalho com logomarca da empresa
- ✅ Cores corporativas (vermelho e amarelo)
- ✅ Layout responsivo
- ✅ Tipografia profissional

### Dados Incluídos
- ✅ Nome da empresa: **Promover**
- ✅ Slogan: **Vigilância Patrimonial - LTDA**
- ✅ Endereço, telefone, email, CNPJ
- ✅ Data de geração do relatório
- ✅ Estatísticas e análises detalhadas

### Funcionalidades
- ✅ Relatórios por período
- ✅ Filtros por status e tipo
- ✅ Estatísticas resumidas
- ✅ Tabelas detalhadas
- ✅ Gráficos de análise
- ✅ Formatação monetária brasileira
- ✅ Suporte a impressão

## Estrutura de Arquivos

```
backend/src/main/
├── java/com/z7design/secured_guard/
│   ├── service/
│   │   ├── ReportTemplateService.java
│   │   └── ContasAPagarReportService.java
│   ├── controller/
│   │   ├── ReportController.java
│   │   └── TestReportController.java
│   └── config/
│       └── CompanyConfig.java
├── resources/
│   ├── templates/reports/
│   │   ├── header.html
│   │   ├── footer.html
│   │   └── contas-a-pagar.html
│   └── application-report.properties
```

## Próximos Passos

1. **Adicionar mais tipos de relatório** (funcionários, veículos, etc.)
2. **Implementar geração de PDF** usando bibliotecas como iText ou Flying Saucer
3. **Adicionar gráficos interativos** usando Chart.js
4. **Implementar agendamento de relatórios**
5. **Adicionar exportação para Excel/CSV**

## Testando o Sistema

Para testar o sistema de relatórios implementado:

1. **Inicie o backend**
2. **Acesse**: `http://localhost:8081/api/test-reports/contas-a-pagar/test`
3. **Verifique** se o relatório é gerado com:
   - Cabeçalho da empresa Promover
   - Logomarca estilizada
   - Dados corporativos
   - Conteúdo das contas a pagar
   - Rodapé profissional

O sistema está pronto para uso e pode ser facilmente estendido para outros tipos de relatórios!
