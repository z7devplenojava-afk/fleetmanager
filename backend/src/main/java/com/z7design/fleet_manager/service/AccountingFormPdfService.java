package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingFormPdfService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final ExcelReportLayoutService excelReportLayoutService;

    public byte[] generateAccountingFormPdf(UUID employeeId) throws Exception {
        log.info("ðŸ“„ Gerando ficha de contabilidade em PDF para funcionÃ¡rio ID: {}", employeeId);
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        Company company = null;
        if (employee.getCompany() != null) {
            company = companyRepository.findById(employee.getCompany().getId()).orElse(null);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            UUID companyId = resolveCompanyId(company);
            PdfWriter writer = new PdfWriter(baos);

            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("FICHA DE CADASTRO DE FUNCIONÃRIO")
                .topMargin(120f)
                .bottomMargin(80f)
                .leftMargin(50f)
                .rightMargin(50f)
                .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            Paragraph subtitle = new Paragraph("Para Departamento de Contabilidade")
                .setTextAlignment(TextAlignment.CENTER)
                .setBold()
                .setFontSize(12)
                .setMarginBottom(10);
            document.add(subtitle);

            Paragraph date = new Paragraph("Data de GeraÃ§Ã£o: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginBottom(20);
            document.add(date);

            Paragraph section1 = new Paragraph("1. DADOS PESSOAIS")
                .setBold()
                .setFontSize(12)
                .setMarginTop(10)
                .setMarginBottom(10);
            document.add(section1);

            Table personalTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginBottom(15);

            addTableRow(personalTable, "Nome Completo:", employee.getName());
            addTableRow(personalTable, "CPF:", employee.getDocument());

            String rg = "";
            if (employee.getCinNumero() != null && !employee.getCinNumero().trim().isEmpty()) {
                rg = employee.getCinNumero();
                if (employee.getCinOrgaoEmissor() != null && !employee.getCinOrgaoEmissor().trim().isEmpty()) {
                    rg = employee.getCinOrgaoEmissor() + "-" + rg;
                }
            } else if (employee.getCarteiraIdentidadeOrgaoEmissor() != null && !employee.getCarteiraIdentidadeOrgaoEmissor().trim().isEmpty()) {
                rg = employee.getCarteiraIdentidadeOrgaoEmissor();
            }
            addTableRow(personalTable, "RG:", rg);
            addTableRow(personalTable, "Data de Nascimento:", formatDate(employee.getBirthDate()));
            addTableRow(personalTable, "Estado Civil:", employee.getMaritalStatus());
            addTableRow(personalTable, "Nacionalidade:", employee.getNationality());
            document.add(personalTable);

            Paragraph section2 = new Paragraph("2. DOCUMENTOS")
                .setBold()
                .setFontSize(12)
                .setMarginTop(10)
                .setMarginBottom(10);
            document.add(section2);

            Table documentsTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginBottom(15);

            addTableRow(documentsTable, "PIS/PASEP:", employee.getPis());
            addTableRow(documentsTable, "TÃ­tulo de Eleitor:", employee.getTituloEleitor());
            String zonaSecao = "";
            if (employee.getTituloEleitorZona() != null || employee.getTituloEleitorSecao() != null) {
                zonaSecao = (employee.getTituloEleitorZona() != null ? employee.getTituloEleitorZona() : "") +
                            " / " + (employee.getTituloEleitorSecao() != null ? employee.getTituloEleitorSecao() : "");
            }
            addTableRow(documentsTable, "Zona/SeÃ§Ã£o Eleitoral:", zonaSecao);
            addTableRow(documentsTable, "CTPS:", employee.getCtps());
            addTableRow(documentsTable, "SÃ©rie CTPS:", employee.getCtpsSeries());
            addTableRow(documentsTable, "CNH:", employee.getCnhNumber());
            addTableRow(documentsTable, "Categoria CNH:", employee.getCnhCategory());
            addTableRow(documentsTable, "Validade CNH:", formatDate(employee.getCnhExpirationDate()));
            addTableRow(documentsTable, "Certificado Militar:", employee.getCertificadoMilitar());
            document.add(documentsTable);

            Paragraph section3 = new Paragraph("3. ENDEREÃ‡O E CONTATO")
                .setBold()
                .setFontSize(12)
                .setMarginTop(10)
                .setMarginBottom(10);
            document.add(section3);

            Table contactTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginBottom(15);

            addTableRow(contactTable, "EndereÃ§o:", buildAddress(employee));
            addTableRow(contactTable, "Telefone:", employee.getPhone());
            addTableRow(contactTable, "E-mail:", employee.getEmail());
            document.add(contactTable);

            Paragraph section4 = new Paragraph("4. DADOS PROFISSIONAIS")
                .setBold()
                .setFontSize(12)
                .setMarginTop(10)
                .setMarginBottom(10);
            document.add(section4);

            Table professionalTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginBottom(15);

            addTableRow(professionalTable, "NÃºmero de Registro:", employee.getRegistrationNumber());
            addTableRow(professionalTable, "Data de AdmissÃ£o:", formatDate(employee.getHireDate()));
            addTableRow(professionalTable, "Cargo:", employee.getPosition() != null ? employee.getPosition().getName() : "");
            addTableRow(professionalTable, "CBO:", employee.getCbo());
            addTableRow(professionalTable, "SalÃ¡rio Base:", employee.getSalario() != null ? "R$ " + String.format("%.2f", employee.getSalario()) : "");
            addTableRow(professionalTable, "Status:", formatStatus(employee.getStatus()));
            addTableRow(professionalTable, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "");
            if (company != null) {
                addTableRow(professionalTable, "Empresa:", company.getName());
                addTableRow(professionalTable, "CNPJ:", company.getCnpj());
            }
            document.add(professionalTable);

            if (employee.getBanco() != null || employee.getAgencia() != null || employee.getContaCorrente() != null) {
                Paragraph section5 = new Paragraph("5. DADOS BANCÃRIOS")
                    .setBold()
                    .setFontSize(12)
                    .setMarginTop(10)
                    .setMarginBottom(10);
                document.add(section5);

                Table bankTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                    .useAllAvailableWidth()
                    .setMarginBottom(15);

                addTableRow(bankTable, "Banco:", employee.getBanco());
                addTableRow(bankTable, "AgÃªncia:", employee.getAgencia());
                addTableRow(bankTable, "Conta Corrente:", employee.getContaCorrente());
                document.add(bankTable);
            }

            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            document.close();
        } catch (Exception e) {
            log.error("Erro ao gerar ficha de contabilidade com layout padrÃ£o", e);
            throw e;
        }

        log.info("âœ… Ficha de contabilidade gerada com sucesso. Tamanho: {} bytes", baos.size());
        return baos.toByteArray();
    }

    public byte[] generateAccountingFormExcel(UUID employeeId) throws Exception {
        log.info("ðŸ“Š Gerando ficha de contabilidade (Excel) para funcionÃ¡rio ID: {}", employeeId);

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        Company company = null;
        if (employee.getCompany() != null) {
            company = companyRepository.findById(employee.getCompany().getId()).orElse(null);
        }
        Company reportCompany = resolveCompany(company);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ficha Contabilidade");
            int lastColumn = 1;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, reportCompany, "FICHA DE CADASTRO DE FUNCIONÃRIO", lastColumn);

            CellStyle labelStyle = createLabelStyle(workbook);
            CellStyle valueStyle = createValueStyle(workbook);

            rowIndex = addSection(sheet, rowIndex, "Para Departamento de Contabilidade", lastColumn, workbook);
            rowIndex = addRow(sheet, rowIndex, "Data de GeraÃ§Ã£o:", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), labelStyle, valueStyle);

            rowIndex = addSection(sheet, rowIndex, "1. DADOS PESSOAIS", lastColumn, workbook);
            rowIndex = addRow(sheet, rowIndex, "Nome Completo:", employee.getName(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CPF:", employee.getDocument(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "RG:", buildRg(employee), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Data de Nascimento:", formatDate(employee.getBirthDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Estado Civil:", employee.getMaritalStatus(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Nacionalidade:", employee.getNationality(), labelStyle, valueStyle);

            rowIndex = addSection(sheet, rowIndex, "2. DOCUMENTOS", lastColumn, workbook);
            rowIndex = addRow(sheet, rowIndex, "PIS/PASEP:", employee.getPis(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "TÃ­tulo de Eleitor:", employee.getTituloEleitor(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Zona/SeÃ§Ã£o Eleitoral:", buildZonaSecao(employee), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CTPS:", employee.getCtps(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "SÃ©rie CTPS:", employee.getCtpsSeries(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CNH:", employee.getCnhNumber(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Categoria CNH:", employee.getCnhCategory(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Validade CNH:", formatDate(employee.getCnhExpirationDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Certificado Militar:", employee.getCertificadoMilitar(), labelStyle, valueStyle);

            rowIndex = addSection(sheet, rowIndex, "3. ENDEREÃ‡O E CONTATO", lastColumn, workbook);
            rowIndex = addRow(sheet, rowIndex, "EndereÃ§o:", buildAddress(employee), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Telefone:", employee.getPhone(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "E-mail:", employee.getEmail(), labelStyle, valueStyle);

            rowIndex = addSection(sheet, rowIndex, "4. DADOS PROFISSIONAIS", lastColumn, workbook);
            rowIndex = addRow(sheet, rowIndex, "NÃºmero de Registro:", employee.getRegistrationNumber(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Data de AdmissÃ£o:", formatDate(employee.getHireDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Cargo:", employee.getPosition() != null ? employee.getPosition().getName() : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CBO:", employee.getCbo(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "SalÃ¡rio Base:", employee.getSalario() != null ? "R$ " + String.format("%.2f", employee.getSalario()) : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Status:", formatStatus(employee.getStatus()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "", labelStyle, valueStyle);
            if (company != null) {
                rowIndex = addRow(sheet, rowIndex, "Empresa:", company.getName(), labelStyle, valueStyle);
                rowIndex = addRow(sheet, rowIndex, "CNPJ:", company.getCnpj(), labelStyle, valueStyle);
            }

            if (employee.getBanco() != null || employee.getAgencia() != null || employee.getContaCorrente() != null) {
                rowIndex = addSection(sheet, rowIndex, "5. DADOS BANCÃRIOS", lastColumn, workbook);
                rowIndex = addRow(sheet, rowIndex, "Banco:", employee.getBanco(), labelStyle, valueStyle);
                rowIndex = addRow(sheet, rowIndex, "AgÃªncia:", employee.getAgencia(), labelStyle, valueStyle);
                rowIndex = addRow(sheet, rowIndex, "Conta Corrente:", employee.getContaCorrente(), labelStyle, valueStyle);
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            excelReportLayoutService.addFooter(sheet, workbook, reportCompany, lastColumn);

            workbook.write(out);
            log.info("âœ… Ficha de contabilidade (Excel) gerada com sucesso. Tamanho: {} bytes", out.size());
            return out.toByteArray();
        }
    }

    private void addTableRow(Table table, String label, String value) {
        table.addCell(createLabelCell(label));
        table.addCell(createValueCell(value));
    }

    private int addRow(Sheet sheet, int rowIndex, String label, String value, CellStyle labelStyle, CellStyle valueStyle) {
        Row row = sheet.createRow(rowIndex++);
        org.apache.poi.ss.usermodel.Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label != null ? label : "");
        labelCell.setCellStyle(labelStyle);

        org.apache.poi.ss.usermodel.Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value != null ? value : "");
        valueCell.setCellStyle(valueStyle);
        return rowIndex;
    }

    private int addSection(Sheet sheet, int rowIndex, String title, int lastColumn, Workbook workbook) {
        Row row = sheet.createRow(rowIndex++);
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(0);
        cell.setCellValue(title);
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        cell.setCellStyle(style);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(row.getRowNum(), row.getRowNum(), 0, lastColumn));
        return rowIndex;
    }

    private CellStyle createLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        return style;
    }

    private CellStyle createValueStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setWrapText(true);
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        return style;
    }

    private Cell createLabelCell(String text) {
        return new Cell()
            .add(new Paragraph(text != null ? text : "")
                .setBold()
                .setFontSize(10))
            .setBackgroundColor(new DeviceRgb(240, 240, 240))
            .setPadding(6);
    }

    private Cell createValueCell(String text) {
        return new Cell()
            .add(new Paragraph(text != null ? text : "")
                .setFontSize(10))
            .setPadding(6);
    }

    private UUID resolveCompanyId(Company company) {
        if (company != null) {
            return company.getId();
        }

        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            return activeCompanies.get(0).getId();
        }

        List<Company> allCompanies = companyRepository.findAll();
        if (allCompanies != null && !allCompanies.isEmpty()) {
            return allCompanies.get(0).getId();
        }

        throw new RuntimeException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio.");
    }

    private String buildAddress(Employee employee) {
        StringBuilder address = new StringBuilder();
        if (employee.getEnderecoRua() != null && !employee.getEnderecoRua().trim().isEmpty()) {
            address.append(employee.getEnderecoRua());
        }
        if (employee.getEnderecoNumero() != null && !employee.getEnderecoNumero().trim().isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append("nÂº ").append(employee.getEnderecoNumero());
        }
        if (employee.getEnderecoComplemento() != null && !employee.getEnderecoComplemento().trim().isEmpty()) {
            if (address.length() > 0) address.append(" - ");
            address.append(employee.getEnderecoComplemento());
        }
        if (employee.getEnderecoBairro() != null && !employee.getEnderecoBairro().trim().isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append(employee.getEnderecoBairro());
        }
        if (employee.getEnderecoCidade() != null && !employee.getEnderecoCidade().trim().isEmpty()) {
            if (address.length() > 0) address.append(" - ");
            address.append(employee.getEnderecoCidade());
        }
        if (employee.getEnderecoEstado() != null && !employee.getEnderecoEstado().trim().isEmpty()) {
            if (address.length() > 0) address.append("/");
            address.append(employee.getEnderecoEstado());
        }
        if (employee.getEnderecoCep() != null && !employee.getEnderecoCep().trim().isEmpty()) {
            if (address.length() > 0) address.append(" - CEP: ");
            address.append(employee.getEnderecoCep());
        }
        
        // Fallback para campo address antigo
        if (address.length() == 0 && employee.getAddress() != null && !employee.getAddress().trim().isEmpty()) {
            address.append(employee.getAddress());
        }
        
        return address.toString();
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String formatStatus(com.z7design.fleet_manager.model.enums.EmploymentStatus status) {
        if (status == null) return "";
        switch (status) {
            case ACTIVE: return "Ativo";
            case INACTIVE: return "Inativo";
            case TERMINATED: return "Demitido";
            default: return status.toString();
        }
    }

    private String buildRg(Employee employee) {
        String rg = "";
        if (employee.getCinNumero() != null && !employee.getCinNumero().trim().isEmpty()) {
            rg = employee.getCinNumero();
            if (employee.getCinOrgaoEmissor() != null && !employee.getCinOrgaoEmissor().trim().isEmpty()) {
                rg = employee.getCinOrgaoEmissor() + "-" + rg;
            }
        } else if (employee.getCarteiraIdentidadeOrgaoEmissor() != null && !employee.getCarteiraIdentidadeOrgaoEmissor().trim().isEmpty()) {
            rg = employee.getCarteiraIdentidadeOrgaoEmissor();
        }
        return rg;
    }

    private String buildZonaSecao(Employee employee) {
        if (employee.getTituloEleitorZona() != null || employee.getTituloEleitorSecao() != null) {
            return (employee.getTituloEleitorZona() != null ? employee.getTituloEleitorZona() : "") +
                " / " + (employee.getTituloEleitorSecao() != null ? employee.getTituloEleitorSecao() : "");
        }
        return "";
    }

    private Company resolveCompany(Company company) {
        if (company != null) {
            return company;
        }

        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            return activeCompanies.get(0);
        }

        List<Company> allCompanies = companyRepository.findAll();
        if (allCompanies != null && !allCompanies.isEmpty()) {
            return allCompanies.get(0);
        }

        throw new RuntimeException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio.");
    }
}


