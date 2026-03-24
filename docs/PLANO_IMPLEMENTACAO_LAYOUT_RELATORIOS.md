# 🚀 Plano de Implementação - Padrão de Layout para Relatórios

## 📋 Resumo Executivo

Este plano detalha a implementação de um padrão unificado de layout para todos os relatórios PDF e Excel do sistema, com cabeçalho e rodapé dinâmicos baseados na empresa selecionada.

**Objetivo**: Criar um sistema padronizado que permita gerar relatórios profissionais e consistentes em todos os módulos do sistema.

**Prazo estimado**: 3-4 semanas (dependendo da quantidade de relatórios existentes)

**Prioridade**: Alta (melhora significativa na apresentação profissional dos documentos)

---

## 🎯 Fase 1: Preparação e Estrutura Base (Semana 1)

### 1.1 Criar Template de Fundo

**Tarefa**: Criar arquivo PNG de template de fundo

**Arquivo a criar**:
- `backend/src/main/resources/templates/reports/report-background-template.png`

**Especificações**:
- **Dimensões**: 2480px × 3508px (A4 em 300 DPI) ou 595pt × 842pt
- **Resolução**: 300 DPI (para qualidade de impressão)
- **Formato**: PNG com transparência (se necessário)

**Elementos do template**:
1. Barra gradiente superior (amarelo → laranja → vermelho)
2. Forma curva escura no canto superior esquerdo
3. Linha gradiente inferior (amarelo → laranja → vermelho)
4. Fundo branco

**Responsável**: Design/Frontend ou usar ferramenta de design (Figma, Photoshop, etc.)

**Estimativa**: 4-8 horas

---

### 1.2 Criar Serviço de Layout Excel

**Tarefa**: Criar `ExcelReportLayoutService` para padronizar cabeçalho e rodapé em Excel

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/service/ExcelReportLayoutService.java`

**Funcionalidades**:
```java
public class ExcelReportLayoutService {
    // Adicionar cabeçalho com logo, gradiente, título e informações da empresa
    void addHeader(Sheet sheet, Workbook workbook, Company company, String reportTitle);
    
    // Adicionar rodapé com informações da empresa e data
    void addFooter(Sheet sheet, Workbook workbook, Company company);
    
    // Criar estilos reutilizáveis
    CellStyle createHeaderStyle(Workbook workbook);
    CellStyle createTitleStyle(Workbook workbook);
    CellStyle createFooterStyle(Workbook workbook);
    
    // Adicionar logo (se disponível)
    void addLogo(Sheet sheet, Workbook workbook, Company company);
    
    // Criar gradiente (simulado com cores sólidas)
    void addGradientBar(Sheet sheet, Workbook workbook, int rowIndex);
}
```

**Dependências**:
- Apache POI (já existe no projeto)
- `CompanyRepository` (para buscar dados da empresa)

**Estimativa**: 8-12 horas

---

### 1.3 Melhorar StandardReportLayoutService

**Tarefa**: Adicionar cache e melhorias

**Modificações**:
1. Adicionar cache de templates e logos para performance
2. Melhorar formatação de endereço completo usando CompanyDataFormatter
3. Adicionar suporte a email no rodapé
4. Melhorar tratamento de logo ausente
5. Remover referências a marca d'água
6. Adicionar estrutura para personalização de cores (futuro)

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/service/StandardReportLayoutService.java`

**Mudanças principais**:
```java
// Adicionar cache de templates e logos
private static final Map<String, Image> templateCache = new ConcurrentHashMap<>();
private static final Map<String, Image> logoCache = new ConcurrentHashMap<>();

// Modificar método loadReportBackgroundTemplate com cache
private Image loadReportBackgroundTemplate() {
    // Verificar cache primeiro
    // Carregar e adicionar ao cache se não existir
}

// Melhorar formatação usando CompanyDataFormatter
private void addFooter(Canvas canvas, Rectangle pageSize, Company company) {
    String footerText = CompanyDataFormatter.formatCompanyFooter(company, true);
    // ...
}

// Adicionar estrutura para personalização de cores
private DeviceRgb[] getGradientColors(Company company) {
    // Por enquanto usa cores padrão
    // Futuro: buscar cores personalizadas da empresa
}
```

**Estimativa**: 4-6 horas

---

## 🎯 Fase 2: Implementação Core (Semana 2)

### 2.1 Criar DTO de Configuração de Layout Excel

**Tarefa**: Criar DTO para configurar layout Excel

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/dto/ExcelReportLayoutConfig.java`

**Estrutura**:
```java
@Data
@Builder
public class ExcelReportLayoutConfig {
    private UUID companyId;
    private String reportTitle;
    private String reportSubtitle; // Opcional
    private int startDataRow; // Linha onde começam os dados (após cabeçalho)
}
```

**Estimativa**: 1-2 horas

---

### 2.2 Atualizar ReportLayoutConfig

**Tarefa**: Adicionar campo para email no rodapé

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/dto/ReportLayoutConfig.java`

**Mudança**:
```java
@Builder.Default
private boolean includeEmailInFooter = true; // Incluir email no rodapé
```

**Estimativa**: 1 hora

---

### 2.3 Criar Utilitários de Formatação

**Tarefa**: Criar classe utilitária para formatação de dados da empresa

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/util/CompanyDataFormatter.java`

**Métodos**:
```java
public class CompanyDataFormatter {
    public static String formatCnpj(String cnpj);
    public static String formatPhone(String phone);
    public static String formatFullAddress(Company company);
    public static String formatCompanyFooter(Company company, boolean includeEmail);
}
```

**Estimativa**: 3-4 horas

---

### 2.4 Implementar ExcelReportLayoutService

**Tarefa**: Implementar todos os métodos do serviço

**Detalhes de implementação**:

1. **addHeader**:
   - Linha 1: Logo (se disponível) - mesclar células, altura 120px
   - Linha 2: Barra gradiente - mesclar células, altura 20px, cores gradiente
   - Linha 3: Título - mesclar células, altura 30px, fonte 18pt negrito
   - Linha 4: Nome empresa - mesclar células, altura 20px, fonte 14pt negrito
   - Linha 5: CNPJ - mesclar células, altura 15px, fonte 9pt cinza
   - Linha 6: Linha em branco - altura 10px

2. **addFooter**:
   - Antepenúltima linha: Linha em branco
   - Penúltima linha: Informações empresa (nome, endereço, telefone, email)
   - Última linha: Data de geração + linha gradiente (3px)

3. **addLogo**:
   - Carregar logo de URL ou caminho local
   - Redimensionar para 297×217px mantendo proporção
   - Inserir na célula A1
   - Mesclar células para acomodar logo

4. **Estilos**:
   - Criar estilos reutilizáveis para header, título, footer
   - Aplicar cores do gradiente (amarelo, laranja, vermelho)
   - Configurar bordas, alinhamento, fontes

**Estimativa**: 12-16 horas

---

## 🎯 Fase 3: Integração com Relatórios Existentes (Semana 3)

### 3.1 Identificar Todos os Relatórios

**Tarefa**: Listar todos os serviços que geram relatórios PDF e Excel

**Relatórios identificados**:
- ✅ VehicleReportService (PDF) - já usa StandardReportLayoutService
- ⚠️ FuelRecordReportService (Excel)
- ⚠️ FeriasReportService (Excel)
- ⚠️ MeasurementReportService (Excel)
- ⚠️ EquipmentReportService (Excel)
- ⚠️ ClientReportService (Excel)
- ⚠️ TimeSheetService (Excel)
- Outros serviços que geram relatórios

**Ação**: Criar lista completa e priorizar por frequência de uso

**Estimativa**: 2-3 horas

---

### 3.2 Atualizar Relatórios PDF

**Tarefa**: Garantir que todos os relatórios PDF usem StandardReportLayoutService

**Checklist por relatório**:
- [ ] Usa `StandardReportLayoutService.createDocumentWithLayout()`
- [ ] Passa `ReportLayoutConfig` com `companyId` correto
- [ ] Chama `finalizeDocumentLayout()` antes de fechar
- [ ] Testa com diferentes empresas
- [ ] Valida formatação de dados

**Prioridade**:
1. VehicleReportService (já implementado, validar)
2. Outros relatórios PDF identificados

**Estimativa**: 8-12 horas (dependendo da quantidade)

---

### 3.3 Atualizar Relatórios Excel

**Tarefa**: Integrar ExcelReportLayoutService em todos os relatórios Excel

**Processo por relatório**:
1. Injetar `ExcelReportLayoutService`
2. Buscar empresa (via `companyId` ou contexto)
3. Criar workbook e sheet
4. Chamar `addHeader()` antes de adicionar dados
5. Adicionar dados do relatório
6. Chamar `addFooter()` após dados
7. Ajustar larguras de colunas
8. Testar

**Exemplo de integração**:
```java
@Service
@RequiredArgsConstructor
public class FuelRecordReportService {
    private final ExcelReportLayoutService excelLayoutService;
    private final CompanyRepository companyRepository;
    
    public byte[] generateExcelReport(...) {
        // Buscar empresa
        Company company = companyRepository.findById(companyId)
            .orElseThrow(...);
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Relatório de Abastecimentos");
            
            // Adicionar cabeçalho padronizado
            excelLayoutService.addHeader(sheet, workbook, company, 
                "Relatório de Abastecimentos");
            
            // Adicionar dados (começar na linha 7)
            int dataRow = 7;
            // ... adicionar dados ...
            
            // Adicionar rodapé
            excelLayoutService.addFooter(sheet, workbook, company);
            
            // Auto-ajustar colunas
            // ... converter para bytes ...
        }
    }
}
```

**Prioridade**:
1. FuelRecordReportService (mais usado)
2. FeriasReportService
3. MeasurementReportService
4. EquipmentReportService
5. ClientReportService
6. Outros

**Estimativa**: 16-24 horas (dependendo da quantidade)

---

## 🎯 Fase 4: Testes e Validação (Semana 4)

### 4.1 Testes Unitários

**Tarefa**: Criar testes para novos serviços

**Arquivos de teste**:
- `ExcelReportLayoutServiceTest.java`
- `CompanyDataFormatterTest.java`
- Atualizar `StandardReportLayoutServiceTest.java`

**Cenários de teste**:
- Logo disponível vs. não disponível
- Empresa com todos os campos vs. campos faltando
- Formatação de CNPJ, telefone, endereço
- Múltiplas páginas (PDF)
- Planilhas grandes (Excel)
- Cache de templates e logos
- Preview de layout

**Estimativa**: 8-12 horas

---

### 4.2 Testes de Integração

**Tarefa**: Testar geração de relatórios end-to-end

**Cenários**:
1. Gerar PDF de veículos com empresa A
2. Gerar PDF de veículos com empresa B
3. Gerar Excel de abastecimentos com empresa A
4. Gerar Excel de abastecimentos com empresa B
5. Validar formatação em diferentes navegadores/Excel
6. Validar impressão de PDFs

**Estimativa**: 6-8 horas

---

### 4.3 Validação Visual

**Tarefa**: Comparar relatórios gerados com mockups

**Checklist**:
- [ ] Logo posicionado corretamente (297×217px)
- [ ] Gradiente com cores corretas
- [ ] Forma curva escura no lugar certo
- [ ] Título centralizado e formatado
- [ ] Informações da empresa corretas
- [ ] Rodapé com todas as informações (incluindo email)
- [ ] Data de geração formatada
- [ ] Área de conteúdo respeitando margens
- [ ] Cache funcionando corretamente
- [ ] Preview de layout retornando dados corretos

**Estimativa**: 4-6 horas

---

## 🎯 Fase 5: Documentação e Finalização

### 5.1 Documentação Técnica

**Tarefa**: Documentar uso para desenvolvedores

**Conteúdo**:
- Como usar StandardReportLayoutService
- Como usar ExcelReportLayoutService
- Exemplos de código
- Troubleshooting comum

**Arquivo**: `docs/GUIA_USO_LAYOUT_RELATORIOS.md`

**Estimativa**: 4-6 horas

---

### 5.2 Documentação de Usuário

**Tarefa**: Criar guia visual para usuários

**Conteúdo**:
- Como os relatórios são gerados
- O que aparece no cabeçalho e rodapé
- Como visualizar preview do layout antes de gerar

**Arquivo**: `docs/GUIA_USUARIO_RELATORIOS.md`

**Estimativa**: 2-3 horas

---

### 5.3 Atualizar README

**Tarefa**: Adicionar seção sobre padrão de relatórios

**Estimativa**: 1 hora

---

## 📊 Estimativas Totais

| Fase | Tarefas | Horas Estimadas |
|------|---------|-----------------|
| Fase 1: Preparação | 3 tarefas | 16-26 horas |
| Fase 2: Implementação Core | 4 tarefas | 17-23 horas |
| Fase 3: Integração | 3 tarefas | 26-39 horas |
| Fase 4: Testes | 3 tarefas | 18-26 horas |
| Fase 5: Documentação | 3 tarefas | 7-10 horas |
| **TOTAL** | **16 tarefas** | **84-124 horas** |

**Prazo estimado**: 3-4 semanas (considerando 30-40 horas/semana)

---

## 🎯 Sugestões de Melhorias

### 1. Cache de Templates e Logos
- Cachear templates de fundo em memória
- Cachear logos redimensionados
- Reduzir tempo de geração de relatórios

### 2. Suporte a Múltiplos Idiomas
- Traduzir labels (Gerado em, Tel, Email, etc.)
- Suportar formatação de data/hora por locale

### 3. Personalização por Empresa
- Permitir que empresas personalizem cores do gradiente
- Permitir escolha de template (se houver múltiplos)

### 4. Relatórios em Lote
- Suportar geração de múltiplos relatórios com mesmo layout
- Otimizar performance para grandes volumes

### 5. Preview de Layout
- Endpoint para preview do layout antes de gerar
- Útil para validação e ajustes

---

## ✅ Checklist de Aprovação

Antes de iniciar a implementação, confirmar:

- [ ] Templates de fundo criados e aprovados visualmente
- [ ] Especificações de layout validadas
- [ ] Priorização de relatórios definida
- [ ] Recursos (designer, desenvolvedor) alocados
- [ ] Ambiente de testes preparado
- [ ] Dados de teste (empresas com diferentes configurações) disponíveis

---

## 🚦 Próximos Passos

1. **Aprovar este plano** com o time
2. **Criar templates de fundo** (designer)
3. **Iniciar Fase 1** (desenvolvedor)
4. **Revisar progresso** semanalmente
5. **Ajustar plano** conforme necessário

---

## 📝 Notas Finais

- Este plano é flexível e pode ser ajustado conforme necessário
- Priorizar relatórios mais usados primeiro
- Manter comunicação constante com stakeholders
- Documentar decisões e mudanças durante implementação
