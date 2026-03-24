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
public class EmployeeRecordPdfService {

    private final EmployeeService employeeService;
    private final CompanyRepository companyRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final ExcelReportLayoutService excelReportLayoutService;

    public byte[] generateEmployeeRecordPdf(UUID employeeId) throws Exception {
        log.info("ðŸ“„ Gerando ficha de registro do funcionÃ¡rio ID: {}", employeeId);
        
        Employee employee = employeeService.findById(employeeId);
        if (employee == null) {
            throw new RuntimeException("FuncionÃ¡rio nÃ£o encontrado");
        }

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
                .reportTitle("FICHA DE REGISTRO DO FUNCIONÃRIO")
                .topMargin(120f)
                .bottomMargin(80f)
                .leftMargin(50f)
                .rightMargin(50f)
                .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            Table table = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginTop(10)
                .setMarginBottom(10);

            addTableRow(table, "Nome:", employee.getName());
            addTableRow(table, "CPF:", employee.getDocument());
            addTableRow(table, "Data de Nascimento:", formatDate(employee.getBirthDate()));
            addTableRow(table, "Nacionalidade:", employee.getNationality() != null ? employee.getNationality() : "Brasileira");
            addTableRow(table, "Naturalidade:", employee.getLocalNascimento());
            addTableRow(table, "Estado Civil:", employee.getMaritalStatus());
            addTableRow(table, "Grau de InstruÃ§Ã£o:", employee.getGrauInstrucao());
            addTableRow(table, "Telefone:", employee.getPhone());
            addTableRow(table, "Email:", employee.getEmail());
            addTableRow(table, "EndereÃ§o:", buildAddress(employee));
            addTableRow(table, "PIS:", employee.getPis());
            addTableRow(table, "CTPS:", employee.getCtps());
            addTableRow(table, "Data de AdmissÃ£o:", formatDate(employee.getHireDate()));
            addTableRow(table, "Cargo:", employee.getPosition() != null ? employee.getPosition().getName() : "");
            addTableRow(table, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "");

            document.add(table);

            if (company != null) {
                Paragraph companyTitle = new Paragraph("DADOS DA EMPRESA")
                    .setBold()
                    .setFontSize(12)
                    .setMarginTop(15)
                    .setMarginBottom(10);
                document.add(companyTitle);

                Table companyTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                    .useAllAvailableWidth();
                addTableRow(companyTable, "RazÃ£o Social:", company.getName());
                addTableRow(companyTable, "CNPJ:", company.getCnpj());
                addTableRow(companyTable, "EndereÃ§o:", company.getAddress());
                document.add(companyTable);
            }

            if (employee.getNotes() != null && !employee.getNotes().trim().isEmpty()) {
                Paragraph notesTitle = new Paragraph("OBSERVAÃ‡Ã•ES")
                    .setBold()
                    .setFontSize(12)
                    .setMarginTop(15)
                    .setMarginBottom(10);
                document.add(notesTitle);

                Paragraph notes = new Paragraph(employee.getNotes())
                    .setFontSize(10)
                    .setMarginBottom(10);
                document.add(notes);
            }

            Paragraph date = new Paragraph("Data de EmissÃ£o: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(20);
            document.add(date);

            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            document.close();
        } catch (Exception e) {
            log.error("Erro ao gerar ficha de registro com layout padrÃ£o", e);
            throw e;
        }

        log.info("âœ… Ficha de registro gerada com sucesso. Tamanho: {} bytes", baos.size());
        return baos.toByteArray();
    }

    public byte[] generateEmployeeRecordExcel(UUID employeeId) throws Exception {
        log.info("ðŸ“Š Gerando ficha de registro do funcionÃ¡rio (Excel) ID: {}", employeeId);

        Employee employee = employeeService.findById(employeeId);
        if (employee == null) {
            throw new RuntimeException("FuncionÃ¡rio nÃ£o encontrado");
        }

        Company company = null;
        if (employee.getCompany() != null) {
            company = companyRepository.findById(employee.getCompany().getId()).orElse(null);
        }
        Company reportCompany = resolveCompany(company);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ficha Registro");
            int lastColumn = 1;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, reportCompany, "FICHA DE REGISTRO DO FUNCIONÃRIO", lastColumn);

            CellStyle labelStyle = createLabelStyle(workbook);
            CellStyle valueStyle = createValueStyle(workbook);

            rowIndex = addRow(sheet, rowIndex, "Nome:", employee.getName(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CPF:", employee.getDocument(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Data de Nascimento:", formatDate(employee.getBirthDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Nacionalidade:", employee.getNationality() != null ? employee.getNationality() : "Brasileira", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Naturalidade:", employee.getLocalNascimento(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Estado Civil:", employee.getMaritalStatus(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Grau de InstruÃ§Ã£o:", employee.getGrauInstrucao(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Telefone:", employee.getPhone(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Email:", employee.getEmail(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "EndereÃ§o:", buildAddress(employee), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "PIS:", employee.getPis(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CTPS:", employee.getCtps(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Data de AdmissÃ£o:", formatDate(employee.getHireDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Cargo:", employee.getPosition() != null ? employee.getPosition().getName() : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "", labelStyle, valueStyle);

            if (company != null) {
                rowIndex = addSection(sheet, rowIndex, "DADOS DA EMPRESA", lastColumn, workbook);
                rowIndex = addRow(sheet, rowIndex, "RazÃ£o Social:", company.getName(), labelStyle, valueStyle);
                rowIndex = addRow(sheet, rowIndex, "CNPJ:", company.getCnpj(), labelStyle, valueStyle);
                rowIndex = addRow(sheet, rowIndex, "EndereÃ§o:", company.getAddress(), labelStyle, valueStyle);
            }

            if (employee.getNotes() != null && !employee.getNotes().trim().isEmpty()) {
                rowIndex = addSection(sheet, rowIndex, "OBSERVAÃ‡Ã•ES", lastColumn, workbook);
                rowIndex = addRow(sheet, rowIndex, "Notas:", employee.getNotes(), labelStyle, valueStyle);
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            excelReportLayoutService.addFooter(sheet, workbook, reportCompany, lastColumn);

            workbook.write(out);
            log.info("âœ… Ficha de registro (Excel) gerada com sucesso. Tamanho: {} bytes", out.size());
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
}


