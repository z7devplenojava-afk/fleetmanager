package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeasurementReportService {

    private final MeasurementBulletinRepository bulletinRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;

    /**
     * Gera PDF de teste simples usando iText
     */
    public byte[] generateTestPDF() throws IOException {
        log.info("Gerando PDF de teste simples usando iText");

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;

        try {
            writer = new PdfWriter(baos);
            pdfDoc = new PdfDocument(writer);
            document = new Document(pdfDoc);

            // TÃ­tulo
            Paragraph title = new Paragraph("TESTE DE GERAÃ‡ÃƒO DE PDF")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(20)
                    .setBold();
            document.add(title);

            // ConteÃºdo de teste
            Paragraph content = new Paragraph("Este Ã© um PDF de teste gerado pelo sistema.")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12)
                    .setMarginTop(20);
            document.add(content);

            Paragraph date = new Paragraph("Gerado em: "
                    + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(10)
                    .setMarginTop(10);
            document.add(date);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de teste: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar PDF de teste: " + e.getMessage(), e);
        } finally {
            // Fechar recursos na ordem correta
            if (document != null) {
                document.close();
            }
            if (pdfDoc != null) {
                pdfDoc.close();
            }
            if (writer != null) {
                writer.close();
            }
        }

        byte[] result = baos.toByteArray();
        log.info("PDF de teste gerado com sucesso usando iText, tamanho: {} bytes", result.length);
        return result;
    }

    /**
     * Gera PDF de um boletim especÃ­fico com informaÃ§Ãµes completas
     */
    @Transactional(readOnly = true)
    public byte[] generateBulletinPDF(UUID bulletinId) throws IOException {
        log.info("Gerando PDF para boletim: {} com informaÃ§Ãµes completas", bulletinId);

        // Buscar o boletim no banco de dados
        MeasurementBulletin bulletin = bulletinRepository.findById(bulletinId)
                .orElseThrow(() -> new RuntimeException("Boletim nÃ£o encontrado: " + bulletinId));

        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        if (bulletin.getItems() != null) {
            bulletin.getItems().size(); // ForÃ§a inicializaÃ§Ã£o da coleÃ§Ã£o lazy
        }

        // Determinar companyId - usar primeira empresa ativa
        java.util.UUID companyId = null;
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (activeCompanies != null && !activeCompanies.isEmpty()) {
            companyId = activeCompanies.get(0).getId();
            log.info("Usando primeira empresa ativa: {} (ID: {})",
                    activeCompanies.get(0).getName(), companyId);
        } else {
            List<Company> allCompanies = companyRepository.findAll();
            if (allCompanies != null && !allCompanies.isEmpty()) {
                companyId = allCompanies.get(0).getId();
                log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})",
                        allCompanies.get(0).getName(), companyId);
            } else {
                throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                        "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            PdfWriter writer = new PdfWriter(baos);

            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                    .companyId(companyId)
                    .reportTitle("BOLETIM DE MEDIÃ‡ÃƒO")
                    .topMargin(120f) // EspaÃ§o para cabeÃ§alho
                    .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                    .leftMargin(50f)
                    .rightMargin(50f)
                    .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            // InformaÃ§Ãµes do contrato
            Paragraph contractInfo = new Paragraph(
                    "NÂº Contrato: " + (bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "N/A"))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12)
                    .setMarginTop(20);
            document.add(contractInfo);

            // PerÃ­odo
            String period = formatPeriod(bulletin.getPeriodStart(), bulletin.getPeriodEnd());
            Paragraph periodInfo = new Paragraph("PerÃ­odo: " + period)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12);
            document.add(periodInfo);

            // Empresa
            Paragraph companyInfo = new Paragraph(
                    "Empresa: " + (bulletin.getCompanyName() != null ? bulletin.getCompanyName() : "N/A"))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12);
            document.add(companyInfo);

            // Tabela de itens agrupada por categoria
            if (bulletin.getItems() != null && !bulletin.getItems().isEmpty()) {
                Map<MeasurementCategory, List<MeasurementItem>> groupedItems = bulletin.getItems().stream()
                        .collect(Collectors.groupingBy(
                                item -> item.getCategory() != null ? item.getCategory() : MeasurementCategory.OTHER));

                // Ordem de exibição desejada
                MeasurementCategory[] displayOrder = {
                        MeasurementCategory.LEASE,
                        MeasurementCategory.EXCESS_KM,
                        MeasurementCategory.FUEL,
                        MeasurementCategory.DRIVER_COST,
                        MeasurementCategory.EXTRA_TRIP,
                        MeasurementCategory.RETENTION,
                        MeasurementCategory.OTHER
                };

                for (MeasurementCategory category : displayOrder) {
                    List<MeasurementItem> items = groupedItems.get(category);
                    if (items == null || items.isEmpty())
                        continue;

                    document.add(new Paragraph(getCategoryTitle(category))
                            .setBold()
                            .setFontSize(14)
                            .setMarginTop(20)
                            .setMarginBottom(10));

                    // Cabeçalho da tabela - Ajustado para 7 colunas base
                    Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));

                    table.addCell(createHeaderCell("Item"));
                    table.addCell(createHeaderCell("Código"));
                    table.addCell(createHeaderCell("Descrição"));
                    table.addCell(createHeaderCell("Unidade"));
                    table.addCell(createHeaderCell("Quantidade"));
                    table.addCell(createHeaderCell("Preço Un."));
                    table.addCell(createHeaderCell("Valor Total"));

                    for (MeasurementItem item : items) {
                        table.addCell(
                                createCell(String.valueOf(item.getItemNumber() != null ? item.getItemNumber() : "")));
                        table.addCell(createCell(item.getCode() != null ? item.getCode() : ""));

                        // Descrição especial para KM Excedente
                        String description = item.getDescription() != null ? item.getDescription() : "";
                        if (category == MeasurementCategory.EXCESS_KM) {
                            description += String.format("\n(KM Final: %.2f - KM Inicial: %.2f - Franquia: %.2f)",
                                    item.getFinalKm() != null ? item.getFinalKm() : BigDecimal.ZERO,
                                    item.getInitialKm() != null ? item.getInitialKm() : BigDecimal.ZERO,
                                    item.getFranchiseKm() != null ? item.getFranchiseKm() : BigDecimal.ZERO);
                        }
                        table.addCell(createCell(description));

                        table.addCell(createCell(item.getUnit() != null ? item.getUnit() : ""));
                        table.addCell(createCell(String.format("%.2f",
                                item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO)));
                        table.addCell(createCell(formatCurrency(item.getUnitPrice())));
                        table.addCell(createCell(formatCurrency(item.getTotalValue())));
                    }
                    document.add(table);
                }
            }

            // Subtotal
            Paragraph subtotal = new Paragraph("Subtotal: " + formatCurrency(bulletin.getSubtotal()))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(14)
                    .setBold()
                    .setMarginTop(20);
            document.add(subtotal);

            // SeÃ§Ãµes de assinatura
            document.add(new Paragraph("").setMarginTop(40));

            Paragraph signature1 = new Paragraph("ELABORADO/APROVADO POR:")
                    .setFontSize(12)
                    .setBold();
            document.add(signature1);

            Paragraph signature1Line = new Paragraph("________________________________")
                    .setMarginTop(5);
            document.add(signature1Line);

            Paragraph signature1Value = new Paragraph(
                    bulletin.getElaboratedBy() != null ? bulletin.getElaboratedBy() : "")
                    .setMarginTop(10);
            document.add(signature1Value);

            document.add(new Paragraph("").setMarginTop(20));

            Paragraph signature2 = new Paragraph("RESPONSÃVEL PELA MEDIÃ‡ÃƒO:")
                    .setFontSize(12)
                    .setBold();
            document.add(signature2);

            Paragraph signature2Line = new Paragraph("________________________________")
                    .setMarginTop(5);
            document.add(signature2Line);

            Paragraph signature2Value = new Paragraph(bulletin.getMeasuredBy() != null ? bulletin.getMeasuredBy() : "")
                    .setMarginTop(10);
            document.add(signature2Value);

            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);

            document.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF para boletim {}: {}", bulletinId, e.getMessage(), e);
            throw new IOException("Erro ao gerar PDF: " + e.getMessage(), e);
        }

        byte[] result = baos.toByteArray();
        log.info("PDF gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    // Métodos auxiliares
    private String getCategoryTitle(MeasurementCategory category) {
        return switch (category) {
            case LEASE -> "1. LOCAÇÃO EM REGIME GLOBAL";
            case EXCESS_KM -> "2. QUILOMETRAGEM EXCEDENTE";
            case FUEL -> "3. COMBUSTÍVEIS ADICIONAIS";
            case DRIVER_COST -> "4. CUSTO OPERACIONAL DE MOTORISTA";
            case EXTRA_TRIP -> "5. VIAGENS EXTRAS";
            case RETENTION -> "RETENÇÃO DE GARANTIA (5%)";
            default -> "OUTROS";
        };
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text)
                        .setBold()
                        .setTextAlignment(TextAlignment.CENTER));
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "")
                        .setTextAlignment(TextAlignment.CENTER));
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null)
            return "R$ 0,00";
        return String.format("R$ %.2f", value).replace(".", ",");
    }

    private String formatPeriod(LocalDate start, LocalDate end) {
        if (start == null || end == null)
            return "N/A";
        return start.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a " +
                end.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    /**
     * Gera Excel de um boletim especÃ­fico com informaÃ§Ãµes completas
     */
    @Transactional(readOnly = true)
    public byte[] generateBulletinExcel(UUID bulletinId) throws IOException {
        log.info("Gerando Excel para boletim: {} com informaÃ§Ãµes completas", bulletinId);

        // Buscar o boletim no banco de dados
        MeasurementBulletin bulletin = bulletinRepository.findById(bulletinId)
                .orElseThrow(() -> new RuntimeException("Boletim nÃ£o encontrado: " + bulletinId));

        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        if (bulletin.getItems() != null) {
            bulletin.getItems().size(); // ForÃ§a inicializaÃ§Ã£o da coleÃ§Ã£o lazy
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Boletim de MediÃ§Ã£o");

            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 14);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle labelStyle = workbook.createCellStyle();
            Font labelFont = workbook.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("R$ #,##0.00"));

            CellStyle tableHeaderStyle = workbook.createCellStyle();
            Font tableHeaderFont = workbook.createFont();
            tableHeaderFont.setBold(true);
            tableHeaderStyle.setFont(tableHeaderFont);
            tableHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            tableHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            tableHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            tableHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeaderStyle.setBorderBottom(BorderStyle.THIN);
            tableHeaderStyle.setBorderTop(BorderStyle.THIN);
            tableHeaderStyle.setBorderLeft(BorderStyle.THIN);
            tableHeaderStyle.setBorderRight(BorderStyle.THIN);

            CellStyle tableCellStyle = workbook.createCellStyle();
            tableCellStyle.setBorderBottom(BorderStyle.THIN);
            tableCellStyle.setBorderTop(BorderStyle.THIN);
            tableCellStyle.setBorderLeft(BorderStyle.THIN);
            tableCellStyle.setBorderRight(BorderStyle.THIN);
            tableCellStyle.setAlignment(HorizontalAlignment.CENTER);
            tableCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            int rowIndex = 0;

            // CabeÃ§alho da empresa
            Row companyRow = sheet.createRow(rowIndex++);
            Cell companyCell = companyRow.createCell(0);
            companyCell.setCellValue("Promover VigilÃ¢ncia & ServiÃ§os");
            companyCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 6));

            // TÃ­tulo
            Row titleRow = sheet.createRow(rowIndex++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BOLETIM DE MEDIÃ‡ÃƒO");
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 6));

            rowIndex++; // Linha em branco

            // InformaÃ§Ãµes do contrato
            Row contractRow = sheet.createRow(rowIndex++);
            contractRow.createCell(0).setCellValue("NÂº Contrato:");
            contractRow.getCell(0).setCellStyle(labelStyle);
            contractRow.createCell(1)
                    .setCellValue(bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "N/A");

            // PerÃ­odo
            Row periodRow = sheet.createRow(rowIndex++);
            periodRow.createCell(0).setCellValue("PerÃ­odo:");
            periodRow.getCell(0).setCellStyle(labelStyle);
            String period = formatPeriod(bulletin.getPeriodStart(), bulletin.getPeriodEnd());
            periodRow.createCell(1).setCellValue(period);

            // Empresa
            Row companyInfoRow = sheet.createRow(rowIndex++);
            companyInfoRow.createCell(0).setCellValue("Empresa:");
            companyInfoRow.getCell(0).setCellStyle(labelStyle);
            companyInfoRow.createCell(1)
                    .setCellValue(bulletin.getCompanyName() != null ? bulletin.getCompanyName() : "N/A");

            rowIndex++; // Linha em branco

            // Tabela de itens
            if (bulletin.getItems() != null && !bulletin.getItems().isEmpty()) {
                // CabeÃ§alho da tabela
                Row tableHeader = sheet.createRow(rowIndex++);
                String[] headers = { "Item", "CÃ³digo", "DescriÃ§Ã£o", "Unidade", "Quantidade", "PreÃ§o Un.",
                        "Valor Total" };
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = tableHeader.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(tableHeaderStyle);
                }

                // Dados dos itens
                for (var item : bulletin.getItems()) {
                    Row itemRow = sheet.createRow(rowIndex++);

                    if (item.getItemNumber() != null) {
                        itemRow.createCell(0).setCellValue(item.getItemNumber());
                    } else {
                        itemRow.createCell(0).setCellValue("");
                    }
                    itemRow.getCell(0).setCellStyle(tableCellStyle);

                    itemRow.createCell(1).setCellValue(item.getCode() != null ? item.getCode() : "");
                    itemRow.getCell(1).setCellStyle(tableCellStyle);

                    itemRow.createCell(2).setCellValue(item.getDescription() != null ? item.getDescription() : "");
                    itemRow.getCell(2).setCellStyle(tableCellStyle);

                    itemRow.createCell(3).setCellValue(item.getUnit() != null ? item.getUnit() : "");
                    itemRow.getCell(3).setCellStyle(tableCellStyle);

                    if (item.getQuantity() != null) {
                        itemRow.createCell(4).setCellValue(item.getQuantity().doubleValue());
                    } else {
                        itemRow.createCell(4).setCellValue("");
                    }
                    itemRow.getCell(4).setCellStyle(tableCellStyle);

                    if (item.getUnitPrice() != null) {
                        Cell priceCell = itemRow.createCell(5);
                        priceCell.setCellValue(item.getUnitPrice().doubleValue());
                        priceCell.setCellStyle(currencyStyle);
                    } else {
                        itemRow.createCell(5).setCellValue("");
                        itemRow.getCell(5).setCellStyle(tableCellStyle);
                    }

                    if (item.getTotalValue() != null) {
                        Cell totalCell = itemRow.createCell(6);
                        totalCell.setCellValue(item.getTotalValue().doubleValue());
                        totalCell.setCellStyle(currencyStyle);
                    } else {
                        itemRow.createCell(6).setCellValue("");
                        itemRow.getCell(6).setCellStyle(tableCellStyle);
                    }
                }
            }

            rowIndex++; // Linha em branco

            // Subtotal
            Row subtotalRow = sheet.createRow(rowIndex++);
            subtotalRow.createCell(5).setCellValue("Subtotal:");
            subtotalRow.getCell(5).setCellStyle(labelStyle);
            if (bulletin.getSubtotal() != null) {
                Cell subtotalCell = subtotalRow.createCell(6);
                subtotalCell.setCellValue(bulletin.getSubtotal().doubleValue());
                subtotalCell.setCellStyle(currencyStyle);
            }

            rowIndex += 2; // Linhas em branco

            // SeÃ§Ãµes de assinatura
            Row signature1LabelRow = sheet.createRow(rowIndex++);
            signature1LabelRow.createCell(0).setCellValue("ELABORADO/APROVADO POR:");
            signature1LabelRow.getCell(0).setCellStyle(labelStyle);

            Row signature1LineRow = sheet.createRow(rowIndex++);
            signature1LineRow.createCell(0).setCellValue("________________________________");

            Row signature1ValueRow = sheet.createRow(rowIndex++);
            signature1ValueRow.createCell(0)
                    .setCellValue(bulletin.getElaboratedBy() != null ? bulletin.getElaboratedBy() : "");

            rowIndex++; // Linha em branco

            Row signature2LabelRow = sheet.createRow(rowIndex++);
            signature2LabelRow.createCell(0).setCellValue("RESPONSÃVEL PELA MEDIÃ‡ÃƒO:");
            signature2LabelRow.getCell(0).setCellStyle(labelStyle);

            Row signature2LineRow = sheet.createRow(rowIndex++);
            signature2LineRow.createCell(0).setCellValue("________________________________");

            Row signature2ValueRow = sheet.createRow(rowIndex++);
            signature2ValueRow.createCell(0)
                    .setCellValue(bulletin.getMeasuredBy() != null ? bulletin.getMeasuredBy() : "");

            rowIndex += 2; // Linhas em branco

            // Data de geraÃ§Ã£o
            Row dateRow = sheet.createRow(rowIndex++);
            Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("Gerado em: "
                    + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            dateCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 6));

            // Ajustar largura das colunas
            for (int i = 0; i < 7; i++) {
                sheet.autoSizeColumn(i);
                // Adicionar um pouco de espaÃ§o extra
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1000);
            }

            workbook.write(out);
            byte[] result = out.toByteArray();
            log.info("Excel gerado com sucesso, tamanho: {} bytes", result.length);
            return result;
        } catch (Exception e) {
            log.error("Erro ao gerar Excel para boletim {}: {}", bulletinId, e.getMessage(), e);
            throw new IOException("Erro ao gerar Excel: " + e.getMessage(), e);
        }
    }

    /**
     * Gera PDFs em lote (temporariamente desabilitado)
     */
    public byte[] generateBulkBulletinsPDF(List<UUID> bulletinIds) throws IOException {
        log.info("PDF em lote nÃ£o implementado ainda para {} boletins", bulletinIds.size());
        throw new IOException("GeraÃ§Ã£o de PDF em lote temporariamente nÃ£o disponÃ­vel");
    }

    /**
     * Gera Excel em lote (temporariamente desabilitado)
     */
    public byte[] generateBulkBulletinsExcel(List<UUID> bulletinIds) throws IOException {
        log.info("Excel em lote nÃ£o implementado ainda para {} boletins", bulletinIds.size());
        throw new IOException("GeraÃ§Ã£o de Excel em lote temporariamente nÃ£o disponÃ­vel");
    }
}
