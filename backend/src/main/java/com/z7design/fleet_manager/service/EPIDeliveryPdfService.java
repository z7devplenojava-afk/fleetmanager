package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.EPIDeliveryForm;
import com.z7design.fleet_manager.model.EPIDeliveryFormItem;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
public class EPIDeliveryPdfService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final ExcelReportLayoutService excelReportLayoutService;

    public byte[] generateEPIDeliveryPdf(UUID employeeId, UUID companyId, LocalDate deliveryDate, 
                                         UUID responsibleEmployeeId, String observations) throws Exception {
        log.info("ðŸ“„ Gerando ficha de entrega de EPI para funcionÃ¡rio ID: {}", employeeId);
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));
        
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Empresa nÃ£o encontrada"));

        Employee responsible = null;
        if (responsibleEmployeeId != null) {
            responsible = employeeRepository.findById(responsibleEmployeeId).orElse(null);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            PdfWriter writer = new PdfWriter(baos);
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(company.getId())
                .reportTitle("FICHA DE ENTREGA DE EPI")
                .topMargin(120f)
                .bottomMargin(80f)
                .leftMargin(50f)
                .rightMargin(50f)
                .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            Table employeeTable = new Table(UnitValue.createPercentArray(new float[]{40f, 60f}))
                .useAllAvailableWidth()
                .setMarginTop(10)
                .setMarginBottom(10);

            addTableRow(employeeTable, "FuncionÃ¡rio:", employee.getName());
            addTableRow(employeeTable, "CPF:", employee.getDocument());
            addTableRow(employeeTable, "Cargo:", employee.getPosition() != null ? employee.getPosition().getName() : "");
            addTableRow(employeeTable, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "");
            addTableRow(employeeTable, "Data de Entrega:", formatDate(deliveryDate));
            if (responsible != null) {
                addTableRow(employeeTable, "ResponsÃ¡vel pela Entrega:", responsible.getName());
            }

            document.add(employeeTable);

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

            if (observations != null && !observations.trim().isEmpty()) {
                Paragraph obsTitle = new Paragraph("OBSERVAÃ‡Ã•ES")
                    .setBold()
                    .setFontSize(12)
                    .setMarginTop(15)
                    .setMarginBottom(10);
                document.add(obsTitle);

                Paragraph obs = new Paragraph(observations)
                    .setFontSize(10)
                    .setMarginBottom(10);
                document.add(obs);
            }

            Paragraph date = new Paragraph("Data de EmissÃ£o: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(20);
            document.add(date);

            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            document.close();
        } catch (Exception e) {
            log.error("Erro ao gerar ficha de entrega de EPI com layout padrÃ£o", e);
            throw e;
        }

        log.info("âœ… Ficha de entrega de EPI gerada com sucesso. Tamanho: {} bytes", baos.size());
        return baos.toByteArray();
    }

    public byte[] generateEPIDeliveryPdfFromForm(EPIDeliveryForm form) throws Exception {
        log.info("ðŸ“„ Gerando ficha de entrega de EPI a partir do formulÃ¡rio ID: {}", form.getId());
        
        Employee employee = form.getEmployee();
        Company company = form.getCompany();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            PdfWriter writer = new PdfWriter(baos);
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(company.getId())
                .reportTitle("CONTROLE DE EQUIPAMENTOS DE PROTEÃ‡ÃƒO INDIVIDUAL (EPI)")
                .topMargin(120f)
                .bottomMargin(80f)
                .leftMargin(35f)
                .rightMargin(35f)
                .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            Paragraph companyName = new Paragraph(company.getName() != null ? company.getName().toUpperCase() : "")
                .setBold()
                .setFontSize(9)
                .setMarginBottom(2);
            document.add(companyName);

            Paragraph companyCnpj = new Paragraph("CNPJ: " + (company.getCnpj() != null ? company.getCnpj() : ""))
                .setFontSize(8)
                .setMarginBottom(6);
            document.add(companyCnpj);

            Table employeeInfoTable = new Table(UnitValue.createPercentArray(new float[]{50f, 50f}))
                .useAllAvailableWidth()
                .setMarginBottom(6);

            String funcao = employee.getPosition() != null ? employee.getPosition().getName() : "";
            String cpf = employee.getDocument() != null ? employee.getDocument() : "";
            String rg = "";
            if (employee.getCinNumero() != null && !employee.getCinNumero().trim().isEmpty()) {
                rg = employee.getCinNumero();
                if (employee.getCinOrgaoEmissor() != null && !employee.getCinOrgaoEmissor().trim().isEmpty()) {
                    rg = employee.getCinOrgaoEmissor() + "-" + rg;
                }
            } else if (employee.getCarteiraIdentidadeOrgaoEmissor() != null && !employee.getCarteiraIdentidadeOrgaoEmissor().trim().isEmpty()) {
                rg = employee.getCarteiraIdentidadeOrgaoEmissor();
            }
            String terminationDateStr = formatDate(employee.getTerminationDate());

            employeeInfoTable.addCell(createPlainCell("NOME: " + (employee.getName() != null ? employee.getName().toUpperCase() : ""), 8));
            employeeInfoTable.addCell(createPlainCell("FUNÃ‡ÃƒO: " + funcao.toUpperCase(), 8));
            employeeInfoTable.addCell(createPlainCell("CPF: " + cpf, 8));
            employeeInfoTable.addCell(createPlainCell("RG: " + rg, 8));
            employeeInfoTable.addCell(createPlainCell("ADMISSÃƒO: " + formatDate(employee.getHireDate()), 8));
            employeeInfoTable.addCell(createPlainCell("DEMISSÃƒO: " + (terminationDateStr.isEmpty() ? "" : terminationDateStr), 8));

            document.add(employeeInfoTable);

            Paragraph receiptTitle = new Paragraph("RECIBO DE EQUIPAMENTO DE PROTEÃ‡ÃƒO INDIVIDUAL (EPI)")
                .setBold()
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(6);
            document.add(receiptTitle);

            String companyNameForText = company.getName() != null ? company.getName() : "a Empresa";
            String declarationText = "Recebi da " + companyNameForText + ", Os EPI's abaixo especificados a serem usados no desempenho de minhas tarefas. " +
                "Assumo o compromisso de usÃ¡-los durante a jornada de trabalho, zelar pela sua conservaÃ§Ã£o, quando necessÃ¡rio solicitar a substituiÃ§Ã£o ou reposiÃ§Ã£o e devolvÃª-los Ã  Empresa em caso de demissÃ£o. " +
                "Estou ciente tambÃ©m que o uso desses EPI's implicarÃ¡ em insubordinaÃ§Ã£o, sujeito a sansÃµes disciplinares previstas no art. 158 CLT.";

            Paragraph declaration = new Paragraph(declarationText)
                .setFontSize(7)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginBottom(6);
            document.add(declaration);

            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{50f, 50f}))
                .useAllAvailableWidth()
                .setMarginBottom(6);

            signatureTable.addCell(createPlainCell("Contagem: ____/____/____", 7));
            signatureTable.addCell(createPlainCell("Assinatura: ________________________", 7));
            document.add(signatureTable);

            Table epiTable = new Table(UnitValue.createPercentArray(new float[]{6f, 35f, 15f, 10f, 12f, 12f, 10f}))
                .useAllAvailableWidth()
                .setMarginTop(2);

            addTableHeader(epiTable, "ITEM", 7);
            addTableHeader(epiTable, "DESCRIÃ‡ÃƒO DO EPI", 7);
            addTableHeader(epiTable, "CA", 7);
            addTableHeader(epiTable, "QUANTIDADE", 7);
            addTableHeader(epiTable, "DATA DE ENTREGA", 7);
            addTableHeader(epiTable, "DATA DE DEVOLUÃ‡ÃƒO", 7);
            addTableHeader(epiTable, "AS", 7);

            if (form.getItems() != null && !form.getItems().isEmpty()) {
                int itemNumber = 1;
                for (EPIDeliveryFormItem item : form.getItems()) {
                    epiTable.addCell(createTableCell(String.valueOf(itemNumber++), 7, TextAlignment.CENTER));
                    epiTable.addCell(createTableCell(item.getEpiName() != null ? item.getEpiName() : "", 7, TextAlignment.LEFT));
                    epiTable.addCell(createTableCell(item.getCa() != null ? item.getCa() : "", 7, TextAlignment.CENTER));
                    epiTable.addCell(createTableCell(item.getQuantity() != null ? item.getQuantity().toString() : "1", 7, TextAlignment.CENTER));
                    epiTable.addCell(createTableCell(formatDate(form.getDeliveryDate()), 7, TextAlignment.CENTER));
                    epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                    epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                }
            }

            int itemsCount = form.getItems() != null ? form.getItems().size() : 0;
            int emptyRows = Math.max(0, Math.min(10 - itemsCount, 10));
            for (int i = 0; i < emptyRows; i++) {
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                epiTable.addCell(createTableCell("", 7, TextAlignment.LEFT));
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
                epiTable.addCell(createTableCell("", 7, TextAlignment.CENTER));
            }

            document.add(epiTable);

            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            document.close();
        } catch (Exception e) {
            log.error("Erro ao gerar ficha de EPI com layout padrÃ£o", e);
            throw e;
        }

        log.info("âœ… Ficha de entrega de EPI gerada com sucesso. Tamanho: {} bytes", baos.size());
        return baos.toByteArray();
    }

    public byte[] generateEPIDeliveryExcelFromForm(EPIDeliveryForm form) throws Exception {
        log.info("ðŸ“Š Gerando ficha de entrega de EPI (Excel) a partir do formulÃ¡rio ID: {}", form.getId());

        Employee employee = form.getEmployee();
        Company company = form.getCompany();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ficha EPI");
            int lastColumn = 6;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, company, "CONTROLE DE EQUIPAMENTOS DE PROTEÃ‡ÃƒO INDIVIDUAL (EPI)", lastColumn);

            CellStyle labelStyle = createLabelStyle(workbook);
            CellStyle valueStyle = createValueStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);

            rowIndex = addRow(sheet, rowIndex, "Empresa:", company.getName(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CNPJ:", company.getCnpj(), labelStyle, valueStyle);
            rowIndex++;

            rowIndex = addRow(sheet, rowIndex, "FuncionÃ¡rio:", employee.getName(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CPF:", employee.getDocument(), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "FunÃ§Ã£o:", employee.getPosition() != null ? employee.getPosition().getName() : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Setor:", employee.getUnit() != null ? employee.getUnit().getName() : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "AdmissÃ£o:", formatDate(employee.getHireDate()), labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Data de Entrega:", formatDate(form.getDeliveryDate()), labelStyle, valueStyle);
            rowIndex++;

            Row headerRow = sheet.createRow(rowIndex++);
            String[] headers = {"ITEM", "DESCRIÃ‡ÃƒO DO EPI", "CA", "QUANTIDADE", "DATA DE ENTREGA", "DATA DE DEVOLUÃ‡ÃƒO", "AS"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int itemNumber = 1;
            if (form.getItems() != null && !form.getItems().isEmpty()) {
                for (EPIDeliveryFormItem item : form.getItems()) {
                    Row row = sheet.createRow(rowIndex++);
                    row.createCell(0).setCellValue(itemNumber++);
                    row.createCell(1).setCellValue(item.getEpiName() != null ? item.getEpiName() : "");
                    row.createCell(2).setCellValue(item.getCa() != null ? item.getCa() : "");
                    row.createCell(3).setCellValue(item.getQuantity() != null ? item.getQuantity() : 1);
                    row.createCell(4).setCellValue(formatDate(form.getDeliveryDate()));
                    row.createCell(5).setCellValue("");
                    row.createCell(6).setCellValue("");
                }
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            sheet.autoSizeColumn(2);
            sheet.autoSizeColumn(3);
            sheet.autoSizeColumn(4);
            sheet.autoSizeColumn(5);
            sheet.autoSizeColumn(6);

            excelReportLayoutService.addFooter(sheet, workbook, company, lastColumn);

            workbook.write(out);
            log.info("âœ… Ficha de entrega de EPI (Excel) gerada com sucesso. Tamanho: {} bytes", out.size());
            return out.toByteArray();
        }
    }
    
    private Cell createPlainCell(String text, int fontSize) {
        return new Cell()
            .add(new Paragraph(text != null ? text : "").setFontSize(fontSize))
            .setBorder(Border.NO_BORDER)
            .setPadding(2);
    }

    private Cell createTableCell(String text, int fontSize, TextAlignment alignment) {
        return new Cell()
            .add(new Paragraph(text != null ? text : "").setFontSize(fontSize))
            .setTextAlignment(alignment)
            .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE)
            .setPadding(2)
            .setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f))
            .setMinHeight(12f);
    }

    private void addTableRow(Table table, String label, String value) {
        table.addCell(createLabelCell(label));
        table.addCell(createValueCell(value));
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

    private void addTableHeader(Table table, String text, int fontSize) {
        Cell cell = new Cell()
            .add(new Paragraph(text).setFontSize(fontSize).setBold())
            .setBackgroundColor(new DeviceRgb(200, 200, 200))
            .setTextAlignment(TextAlignment.CENTER)
            .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE)
            .setPadding(2)
            .setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f))
            .setMinHeight(12f);
        table.addCell(cell);
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

    private CellStyle createHeaderStyle(Workbook workbook) {
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

    private String formatDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}


