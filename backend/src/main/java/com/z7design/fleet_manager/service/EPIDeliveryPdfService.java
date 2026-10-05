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
            data.put("formNumber", form.getId() != null ? "EPI-" + LocalDate.now().getYear() + "-" + form.getId().toString().substring(0, Math.min(6, form.getId().toString().length())).toUpperCase() : "EPI-0001");
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
            data.put("emptyRowsCount", Math.max(0, 8 - itemsList.size()));
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
            log.error("Erro ao gerar PDF da ficha de EPI com template OS: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String loadLogoAsDataUri(String logoUrl) {
        if (logoUrl == null || logoUrl.isBlank()) {
            return null;
        }
        try {
            byte[] bytes;
            if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
                bytes = new URL(logoUrl).openStream().readAllBytes();
            } else {
                Path logoPath = resolveLogoPath(logoUrl);
                if (logoPath == null || !Files.exists(logoPath)) {
                    log.warn("Logo da empresa não encontrado em disco: {}", logoUrl);
                    return null;
                }
                bytes = Files.readAllBytes(logoPath);
            }
            if (bytes == null || bytes.length == 0) {
                return null;
            }

            String lower = logoUrl.toLowerCase();
            String mime;
            if (lower.endsWith(".png")) {
                mime = "image/png";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mime = "image/jpeg";
            } else if (lower.endsWith(".gif")) {
                mime = "image/gif";
            } else {
                return null;
            }
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Erro ao carregar logo da empresa ({}): {}", logoUrl, e.getMessage());
            return null;
        }
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
}


