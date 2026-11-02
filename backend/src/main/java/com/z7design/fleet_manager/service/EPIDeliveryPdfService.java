package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
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

import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;
import org.springframework.beans.factory.annotation.Value;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.z7design.fleet_manager.util.CompanyDataFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EPIDeliveryPdfService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final ExcelReportLayoutService excelReportLayoutService;
    private final TemplateEngine templateEngine;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public byte[] generateEPIDeliveryPdf(UUID employeeId, UUID companyId, LocalDate deliveryDate, 
                                         UUID responsibleEmployeeId, String observations) throws Exception {
        log.info("📄 Gerando ficha de entrega de EPI para funcionário ID: {}", employeeId);
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        Employee responsible = null;
        if (responsibleEmployeeId != null) {
            responsible = employeeRepository.findById(responsibleEmployeeId).orElse(null);
        }

        EPIDeliveryForm form = EPIDeliveryForm.builder()
            .id(UUID.randomUUID())
            .employee(employee)
            .company(company)
            .deliveryDate(deliveryDate != null ? deliveryDate : LocalDate.now())
            .responsibleEmployee(responsible)
            .observations(observations)
            .items(new ArrayList<>())
            .build();

        return generateEPIDeliveryPdfFromForm(form, false);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] generateEPIDeliveryPdfFromForm(EPIDeliveryForm form) throws Exception {
        return generateEPIDeliveryPdfFromForm(form, false);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] generateEPIDeliveryPdfFromForm(EPIDeliveryForm form, boolean landscape) throws Exception {
        log.info("📄 Gerando ficha de entrega de EPI a partir do formulário ID: {} (landscape: {})", form.getId(), landscape);
        
        Employee employee = form.getEmployee();
        Company company = form.getCompany();

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("companyName", company != null && company.getName() != null ? company.getName().toUpperCase() : "");
            data.put("companyCnpj", company != null ? CompanyDataFormatter.formatCnpjForHeader(company) : "");
            data.put("companyAddress", company != null ? CompanyDataFormatter.formatFullAddress(company) : "");
            data.put("companyLogo", company != null ? loadLogoAsDataUri(company.getLogoUrl()) : null);
            data.put("formNumber", form.getId() != null ? "OS-" + form.getId().toString().substring(0, Math.min(8, form.getId().toString().length())).toUpperCase() : "OS-EPI-0001");
            data.put("dataEmissao", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            data.put("landscape", landscape);
            
            if (employee != null) {
                data.put("funcionarioNome", employee.getName() != null ? employee.getName() : "-");
                String doc = employee.getDocument() != null ? employee.getDocument() : "";
                data.put("funcionarioCpf", doc);
                
                String cargo = "";
                try {
                    if (employee.getPosition() != null) {
                        cargo = employee.getPosition().getName();
                    }
                } catch (Exception e) {
                    log.warn("Aviso ao carregar cargo do funcionário na ficha EPI: {}", e.getMessage());
                }
                data.put("funcionarioCargo", cargo != null ? cargo : "");

                String matricula = employee.getRegistrationNumber() != null ? employee.getRegistrationNumber() : "N/D";
                data.put("funcionarioMatricula", matricula);

                String setor = "";
                try {
                    if (employee.getUnit() != null) {
                        setor = employee.getUnit().getName();
                    }
                } catch (Exception e) {
                    log.warn("Aviso ao carregar setor/unidade do funcionário na ficha EPI: {}", e.getMessage());
                }
                data.put("funcionarioSetor", setor != null ? setor : "");
                data.put("funcionarioAdmissao", employee.getHireDate() != null ? employee.getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "__/__/____");
            } else {
                data.put("funcionarioNome", "-");
                data.put("funcionarioCpf", "-");
                data.put("funcionarioCargo", "-");
                data.put("funcionarioMatricula", "-");
                data.put("funcionarioSetor", "-");
                data.put("funcionarioAdmissao", "__/__/____");
            }

            List<Map<String, Object>> itemsList = new ArrayList<>();
            if (form.getItems() != null) {
                for (EPIDeliveryFormItem item : form.getItems()) {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("epiName", item.getEpiName());
                    itemMap.put("ca", item.getCa() != null ? item.getCa() : "N/A");
                    itemMap.put("quantity", item.getQuantity() != null ? item.getQuantity() : 1);
                    itemMap.put("deliveryDate", formatDate(form.getDeliveryDate()));
                    itemsList.add(itemMap);
                }
            }
            data.put("itens", itemsList);
            data.put("itensCount", itemsList.size());
            data.put("emptyRowsCount", Math.max(1, 14 - itemsList.size()));
            data.put("observacoes", form.getObservations());
            data.put("responsavelEntrega", form.getResponsibleEmployee() != null ? form.getResponsibleEmployee().getName() : "Almoxarifado / Segurança do Trabalho");
            data.put("assinaturaDigital", null);

            Context context = new Context();
            context.setVariables(data);
            String html = templateEngine.process("ficha-entrega-epi", context);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.setDocumentFromString(html);
                renderer.layout();
                renderer.createPDF(outputStream);
                byte[] pdfBytes = outputStream.toByteArray();
                log.info("✅ Ficha de entrega de EPI gerada com sucesso via Flying Saucer. Tamanho: {} bytes", pdfBytes.length);
                return pdfBytes;
            }
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da ficha de EPI via Flying Saucer: {}. Acionando fallback iText programático...", e.getMessage(), e);
            try {
                return generateFallbackPdf(form, landscape);
            } catch (Exception exFallback) {
                log.error("Erro também no fallback iText: {}", exFallback.getMessage(), exFallback);
                throw e;
            }
        }
    }

    private String loadLogoAsDataUri(String logoUrl) {
        if (logoUrl != null && !logoUrl.isBlank()) {
            try {
                byte[] bytes;
                if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
                    bytes = new URL(logoUrl).openStream().readAllBytes();
                } else {
                    Path logoPath = resolveLogoPath(logoUrl);
                    if (logoPath != null && Files.exists(logoPath)) {
                        bytes = Files.readAllBytes(logoPath);
                    } else {
                        bytes = null;
                    }
                }
                if (bytes != null && bytes.length > 0) {
                    String lower = logoUrl.toLowerCase();
                    String mime;
                    if (lower.endsWith(".png")) {
                        mime = "image/png";
                    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                        mime = "image/jpeg";
                    } else if (lower.endsWith(".gif")) {
                        mime = "image/gif";
                    } else {
                        mime = "image/png";
                    }
                    return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
                }
            } catch (Exception e) {
                log.warn("Erro ao carregar logo da empresa ({}): {}", logoUrl, e.getMessage());
            }
        }

        return null;
    }

    private Path resolveLogoPath(String logoUrl) {
        try {
            if (logoUrl.startsWith("/api/uploads/companies/logos/")) {
                String filename = logoUrl.replace("/api/uploads/companies/logos/", "");
                return Paths.get(uploadDir, "companies", "logos", filename);
            }
            if (!logoUrl.contains("/")) {
                return Paths.get(uploadDir, "companies", "logos", logoUrl);
            }
            return Paths.get(uploadDir, logoUrl);
        } catch (Exception e) {
            log.warn("Erro ao resolver caminho do logo ({}): {}", logoUrl, e.getMessage());
            return null;
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] generateEPIDeliveryExcelFromForm(EPIDeliveryForm form) throws Exception {
        log.info("📊 Gerando ficha de entrega de EPI (Excel) a partir do formulário ID: {}", form.getId());

        Employee employee = form.getEmployee();
        Company company = form.getCompany();
        if (company == null && employee != null) {
            company = employee.getCompany();
        }
        if (company == null) {
            company = companyRepository.findByStatus(com.z7design.fleet_manager.model.Company.CompanyStatus.ACTIVE).stream().findFirst()
                .or(() -> companyRepository.findAll().stream().findFirst())
                .orElse(null);
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ficha EPI");
            int lastColumn = 6;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, company, "CONTROLE DE EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL (EPI)", lastColumn);

            CellStyle labelStyle = createLabelStyle(workbook);
            CellStyle valueStyle = createValueStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);

            rowIndex = addRow(sheet, rowIndex, "Empresa:", company != null && company.getName() != null ? company.getName() : "", labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CNPJ:", company != null && company.getCnpj() != null ? company.getCnpj() : "", labelStyle, valueStyle);
            rowIndex++;

            String empName = employee != null && employee.getName() != null ? employee.getName() : "";
            String empDoc = employee != null && employee.getDocument() != null ? employee.getDocument() : "";
            String empCargo = "";
            try {
                if (employee != null && employee.getPosition() != null) {
                    empCargo = employee.getPosition().getName();
                }
            } catch (Exception ignored) {}
            String empSetor = "";
            try {
                if (employee != null && employee.getUnit() != null) {
                    empSetor = employee.getUnit().getName();
                }
            } catch (Exception ignored) {}

            rowIndex = addRow(sheet, rowIndex, "Funcionário:", empName, labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "CPF:", empDoc, labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Função:", empCargo, labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Setor:", empSetor, labelStyle, valueStyle);
            rowIndex = addRow(sheet, rowIndex, "Admissão:", employee != null ? formatDate(employee.getHireDate()) : "", labelStyle, valueStyle);
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

    private byte[] generateFallbackPdf(EPIDeliveryForm form, boolean landscape) throws Exception {
        log.info("📄 Gerando ficha de entrega de EPI via Fallback iText Padrão OS...");
        Company company = form.getCompany();
        Employee employee = form.getEmployee();
        if (company == null && employee != null) {
            company = employee.getCompany();
        }
        if (company == null) {
            company = companyRepository.findByStatus(com.z7design.fleet_manager.model.Company.CompanyStatus.ACTIVE).stream().findFirst()
                .or(() -> companyRepository.findAll().stream().findFirst())
                .orElse(null);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        pdfDoc.setDefaultPageSize(landscape ? PageSize.A4.rotate() : PageSize.A4);
        Document document = new Document(pdfDoc);
        document.setMargins(22f, 25f, 22f, 25f);

        DeviceRgb redColor = new DeviceRgb(211, 47, 47); // #d32f2f
        DeviceRgb greenColor = new DeviceRgb(46, 125, 50); // #2e7d32
        DeviceRgb lightBgColor = new DeviceRgb(245, 245, 245); // #f5f5f5
        DeviceRgb borderLight = new DeviceRgb(220, 220, 220); // #dcdcdc

        String compName = (company != null && company.getName() != null ? company.getName() : "VIAÇÃO SÃO SILVESTRE S.A.").toUpperCase();
        String compCnpj = company != null ? CompanyDataFormatter.formatCnpjForHeader(company) : "";
        String compAddress = company != null ? CompanyDataFormatter.formatFullAddress(company) : "";
        String formNum = form.getId() != null ? "OS-" + form.getId().toString().substring(0, Math.min(8, form.getId().toString().length())).toUpperCase() : "OS-EPI-0001";
        String emissionDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // 1. Cabeçalho Lado a Lado (Padrão OS)
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{55, 45}));
        headerTable.setWidth(UnitValue.createPercentValue(100));
        headerTable.setBorder(Border.NO_BORDER);

        Cell leftHeader = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        leftHeader.add(new Paragraph(compName).setFontSize(11).setBold().setFontColor(new DeviceRgb(34, 34, 34)));
        String compDetails = "";
        if (!compCnpj.isBlank()) compDetails += "CNPJ: " + compCnpj;
        if (!compAddress.isBlank()) compDetails += (compDetails.isEmpty() ? "" : " • ") + compAddress;
        if (!compDetails.isEmpty()) {
            leftHeader.add(new Paragraph(compDetails).setFontSize(7).setFontColor(new DeviceRgb(85, 85, 85)));
        }
        headerTable.addCell(leftHeader);

        Cell rightHeader = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT).setPadding(0);
        rightHeader.add(new Paragraph("ORDEM DE FORNECIMENTO — EPI").setFontSize(11.5f).setBold().setFontColor(redColor).setMarginBottom(1f));
        rightHeader.add(new Paragraph("NR-06 / SST").setFontSize(7f).setBold().setFontColor(greenColor).setMarginBottom(1f));
        rightHeader.add(new Paragraph("FICHA Nº " + formNum).setFontSize(8f).setBold().setFontColor(redColor).setMarginBottom(1f));
        rightHeader.add(new Paragraph("Data de Emissão: " + emissionDate).setFontSize(7f).setFontColor(ColorConstants.GRAY));
        headerTable.addCell(rightHeader);

        document.add(headerTable);

        // Linha vermelha divisória
        Table redLine = new Table(UnitValue.createPercentArray(new float[]{100}));
        redLine.setWidth(UnitValue.createPercentValue(100));
        redLine.setBorder(Border.NO_BORDER);
        Cell redLineCell = new Cell().setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(redColor, 1.5f)).setHeight(2f);
        redLine.addCell(redLineCell);
        document.add(redLine);

        // Seção 1: IDENTIFICAÇÃO DO COLABORADOR E EMPRESA
        Table sec1Header = new Table(UnitValue.createPercentArray(new float[]{100}));
        sec1Header.setWidth(UnitValue.createPercentValue(100));
        sec1Header.setMarginTop(5f).setMarginBottom(2f);
        Cell sec1Cell = new Cell().setBackgroundColor(lightBgColor)
            .setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(redColor, 3f))
            .setPadding(2.5f)
            .add(new Paragraph("| IDENTIFICAÇÃO DO COLABORADOR E EMPRESA").setFontSize(7.5f).setBold().setFontColor(redColor));
        sec1Header.addCell(sec1Cell);
        document.add(sec1Header);

        Table empTable = new Table(UnitValue.createPercentArray(new float[]{18, 32, 18, 32}));
        empTable.setWidth(UnitValue.createPercentValue(100));
        empTable.setMarginBottom(5f);

        String empName = employee != null && employee.getName() != null ? employee.getName() : "-";
        String empCpf = employee != null && employee.getDocument() != null ? employee.getDocument() : "-";
        String cargo = "-";
        try {
            if (employee != null && employee.getPosition() != null) cargo = employee.getPosition().getName();
        } catch (Exception ignored) {}
        String matricula = employee != null && employee.getRegistrationNumber() != null ? employee.getRegistrationNumber() : "-";
        String setor = "Garagem Central";
        try {
            if (employee != null && employee.getUnit() != null) setor = employee.getUnit().getName();
        } catch (Exception ignored) {}
        String admissao = "__/__/____";
        if (employee != null && employee.getHireDate() != null) {
            admissao = employee.getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        empTable.addCell(createPdfInfoCell("COLABORADOR:", true));
        empTable.addCell(createPdfInfoCell(empName, false));
        empTable.addCell(createPdfInfoCell("CPF:", true));
        empTable.addCell(createPdfInfoCell(empCpf, false));

        empTable.addCell(createPdfInfoCell("CARGO / FUNÇÃO:", true));
        empTable.addCell(createPdfInfoCell(cargo, false));
        empTable.addCell(createPdfInfoCell("MATRÍCULA:", true));
        empTable.addCell(createPdfInfoCell(matricula, false));

        empTable.addCell(createPdfInfoCell("SETOR / UNIDADE:", true));
        empTable.addCell(createPdfInfoCell(setor, false));
        empTable.addCell(createPdfInfoCell("ADMISSÃO:", true));
        empTable.addCell(createPdfInfoCell(admissao, false));
        document.add(empTable);

        // Seção 2: TERMO DE COMPROMISSO E RESPONSABILIDADE
        Table sec2Header = new Table(UnitValue.createPercentArray(new float[]{100}));
        sec2Header.setWidth(UnitValue.createPercentValue(100));
        sec2Header.setMarginBottom(2f);
        Cell sec2Cell = new Cell().setBackgroundColor(lightBgColor)
            .setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(redColor, 3f))
            .setPadding(2.5f)
            .add(new Paragraph("| TERMO DE COMPROMISSO E RESPONSABILIDADE (NR-06 / NR-01 - PORTARIA 3.214/78)").setFontSize(7.5f).setBold().setFontColor(redColor));
        sec2Header.addCell(sec2Cell);
        document.add(sec2Header);

        Table termoTable = new Table(UnitValue.createPercentArray(new float[]{100}));
        termoTable.setWidth(UnitValue.createPercentValue(100));
        termoTable.setMarginBottom(5f);
        Cell termoCell = new Cell().setBorder(new SolidBorder(borderLight, 0.5f)).setBackgroundColor(new DeviceRgb(252, 252, 252)).setPadding(3.5f);
        termoCell.add(new Paragraph("DECLARAÇÃO DE RECEBIMENTO, USO E RESPONSABILIDADE LEGAL (NR-1, NR-6 E CLT ART. 462)")
            .setFontSize(6.2f).setBold().setFontColor(new DeviceRgb(183, 28, 28)).setMarginBottom(1.5f));
        termoCell.add(new Paragraph(
            "Declaro que recebi da empresa os Equipamentos de Proteção Individual (EPIs) abaixo especificados, em perfeito estado de conservação, " +
            "para uso exclusivo em serviço. Fui treinado quanto ao uso, guarda e conservação (NR-01 e NR-06). Comprometo-me a: a) Usá-los apenas para a " +
            "finalidade a que se destinam; b) Responsabilizar-me pela sua conservação e guarda; c) Comunicar qualquer alteração que os torne impróprios; " +
            "d) Cumprir as ordens de serviço e normas de segurança. Ciente de que a recusa injustificada constitui falta grave (NR-1, 1.8.1) e que o extravio " +
            "ou dano por negligência/dolo enseja ressarcimento mediante desconto salarial na forma do Art. 462, §1º da Consolidação das Leis do Trabalho (CLT)."
        ).setFontSize(5.6f).setTextAlignment(TextAlignment.JUSTIFIED).setFontColor(new DeviceRgb(50, 50, 50)));
        termoTable.addCell(termoCell);
        document.add(termoTable);

        // Seção 3: REGISTRO DE ENTREGA E DEVOLUÇÃO DE EQUIPAMENTOS (EPI)
        Table sec3Header = new Table(UnitValue.createPercentArray(new float[]{100}));
        sec3Header.setWidth(UnitValue.createPercentValue(100));
        sec3Header.setMarginBottom(2f);
        Cell sec3Cell = new Cell().setBackgroundColor(lightBgColor)
            .setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(redColor, 3f))
            .setPadding(2.5f)
            .add(new Paragraph("| REGISTRO DE ENTREGA E DEVOLUÇÃO DE EQUIPAMENTOS (EPI)").setFontSize(7.5f).setBold().setFontColor(redColor));
        sec3Header.addCell(sec3Cell);
        document.add(sec3Header);

        // Tabela de itens: QUANT, DESCRIÇÃO, CA, DATA ENTREGA, RUBRICA, DATA DEVOL, RUBRICA
        Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{7, 37, 12, 12, 12, 10, 10}));
        itemsTable.setWidth(UnitValue.createPercentValue(100));
        itemsTable.setMarginBottom(8f);

        itemsTable.addHeaderCell(createPdfHeaderCell("QUANT"));
        itemsTable.addHeaderCell(createPdfHeaderCell("DESCRIÇÃO DO EQUIPAMENTO"));
        itemsTable.addHeaderCell(createPdfHeaderCell("Nº CA"));
        itemsTable.addHeaderCell(createPdfHeaderCell("DATA ENTREGA"));
        itemsTable.addHeaderCell(createPdfHeaderCell("RUBRICA EMPREGADO"));
        itemsTable.addHeaderCell(createPdfHeaderCell("DATA DEVOL."));
        itemsTable.addHeaderCell(createPdfHeaderCell("RUBRICA"));

        int rowCount = 0;
        if (form.getItems() != null && !form.getItems().isEmpty()) {
            for (EPIDeliveryFormItem item : form.getItems()) {
                itemsTable.addCell(createPdfCell(String.valueOf(item.getQuantity() != null ? item.getQuantity() : 1), false).setTextAlignment(TextAlignment.CENTER));
                itemsTable.addCell(createPdfCell(item.getEpiName() != null ? item.getEpiName() : "-", false));
                itemsTable.addCell(createPdfCell(item.getCa() != null ? item.getCa() : "N/A", false).setTextAlignment(TextAlignment.CENTER));
                itemsTable.addCell(createPdfCell(formatDate(form.getDeliveryDate()), false).setTextAlignment(TextAlignment.CENTER));
                itemsTable.addCell(createPdfCell("", false));
                itemsTable.addCell(createPdfCell("", false));
                itemsTable.addCell(createPdfCell("", false));
                rowCount++;
            }
        }

        // Preenche com linhas vazias até 14 linhas (padrão oficial)
        for (int i = rowCount; i < 14; i++) {
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
            itemsTable.addCell(createPdfCell("", false).setHeight(13f));
        }
        document.add(itemsTable);

        // Seção 4: Assinaturas
        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
        sigTable.setWidth(UnitValue.createPercentValue(100));
        sigTable.setMarginTop(12f);

        Cell colabSig = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER);
        colabSig.add(new Paragraph("_________________________________________").setFontSize(8));
        colabSig.add(new Paragraph(empName).setFontSize(7.5f).setBold());
        colabSig.add(new Paragraph("Assinatura do Colaborador (Recebimento)").setFontSize(6.5f).setFontColor(ColorConstants.GRAY));

        Cell respSig = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER);
        respSig.add(new Paragraph("_________________________________________").setFontSize(8));
        respSig.add(new Paragraph(form.getResponsibleEmployee() != null ? form.getResponsibleEmployee().getName() : "Almoxarifado / Segurança do Trabalho").setFontSize(7.5f).setBold());
        respSig.add(new Paragraph("Responsável pela Entrega / Técnico SST").setFontSize(6.5f).setFontColor(ColorConstants.GRAY));

        sigTable.addCell(colabSig);
        sigTable.addCell(respSig);
        document.add(sigTable);

        // Rodapé
        Paragraph footer = new Paragraph(
            "Ficha de Controle Individual de EPI conforme Norma Regulamentadora NR-06 (Portaria GM nº 3.214/78 do MTE) • Emitido em " + emissionDate
        ).setFontSize(6.2f).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER).setMarginTop(10f);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    private Cell createPdfInfoCell(String text, boolean label) {
        Cell cell = new Cell().setPadding(2.5f);
        cell.setBorder(new SolidBorder(new DeviceRgb(220, 220, 220), 0.5f));
        if (label) {
            cell.setBackgroundColor(new DeviceRgb(250, 250, 250));
            cell.add(new Paragraph(text != null ? text : "").setFontSize(6.5f).setBold().setFontColor(new DeviceRgb(100, 100, 100)));
        } else {
            cell.add(new Paragraph(text != null ? text : "").setFontSize(7f).setFontColor(new DeviceRgb(20, 20, 20)));
        }
        return cell;
    }

    private Cell createPdfCell(String text, boolean bold) {
        Cell cell = new Cell().add(new Paragraph(text != null ? text : "").setFontSize(7f).setBold());
        if (!bold) {
            cell = new Cell().add(new Paragraph(text != null ? text : "").setFontSize(7f));
        }
        cell.setPadding(2.5f);
        cell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        return cell;
    }

    private Cell createPdfHeaderCell(String text) {
        Cell cell = new Cell().add(new Paragraph(text != null ? text : "").setFontSize(6.5f).setBold().setFontColor(ColorConstants.WHITE));
        cell.setBackgroundColor(new DeviceRgb(51, 51, 51));
        cell.setPadding(3f);
        cell.setTextAlignment(TextAlignment.CENTER);
        return cell;
    }
}


