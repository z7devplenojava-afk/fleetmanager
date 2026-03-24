package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.util.CompanyDataFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * ServiÃ§o para criar layout padrÃ£o de relatÃ³rios Excel com cabeÃ§alho e rodapÃ© dinÃ¢micos
 * baseados na empresa selecionada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelReportLayoutService {
    
    private final CompanyRepository companyRepository;
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    
    // Cores do gradiente (amarelo â†’ laranja â†’ vermelho)
    private static final String COLOR_YELLOW_HEX = "FFCC00";
    private static final String COLOR_ORANGE_HEX = "FF9900";
    private static final String COLOR_RED_HEX = "FF3333";
    
    // DimensÃµes do logo em pixels (297x217px)
    private static final int LOGO_WIDTH_PX = 297;
    private static final int LOGO_HEIGHT_PX = 217;
    
    /**
     * Adiciona cabeÃ§alho padronizado ao Excel
     * Estrutura:
     * - Linha 1: Logo (altura 120px)
     * - Linha 2: Barra gradiente (altura 20px)
     * - Linha 3: TÃ­tulo do relatÃ³rio (altura 30px)
     * - Linha 4: Nome da empresa (altura 20px)
     * - Linha 5: CNPJ (altura 15px)
     * - Linha 6: Linha em branco (altura 10px)
     * 
     * @param sheet Planilha Excel
     * @param workbook Workbook Excel
     * @param companyId ID da empresa
     * @param reportTitle TÃ­tulo do relatÃ³rio
     * @return NÃºmero da linha onde comeÃ§am os dados (7)
     */
    public int addHeader(Sheet sheet, Workbook workbook, java.util.UUID companyId, String reportTitle) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa nÃ£o encontrada com ID: " + companyId));
        
        return addHeader(sheet, workbook, company, reportTitle, 5);
    }

    public int addHeader(Sheet sheet, Workbook workbook, java.util.UUID companyId, String reportTitle, int lastColumn) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa nÃ£o encontrada com ID: " + companyId));
        
        return addHeader(sheet, workbook, company, reportTitle, lastColumn);
    }
    
    /**
     * Adiciona cabeÃ§alho padronizado ao Excel
     */
    public int addHeader(Sheet sheet, Workbook workbook, Company company, String reportTitle) {
        return addHeader(sheet, workbook, company, reportTitle, 5);
    }

    public int addHeader(Sheet sheet, Workbook workbook, Company company, String reportTitle, int lastColumn) {
        log.info("Adicionando cabeÃ§alho Excel - Empresa: {}, TÃ­tulo: {}", company.getName(), reportTitle);
        
        int currentRow = 0;
        int safeLastColumn = Math.max(0, lastColumn);
        
        // Linha 1: Logo (altura 120px)
        Row logoRow = sheet.createRow(currentRow++);
        logoRow.setHeightInPoints(120);
        addLogo(sheet, workbook, logoRow, company);
        
        // Linha 2: Barra gradiente (altura 20px)
        Row gradientRow = sheet.createRow(currentRow++);
        gradientRow.setHeightInPoints(20);
        addGradientBar(workbook, gradientRow, safeLastColumn);
        
        // Linha 3: TÃ­tulo do relatÃ³rio (altura 30px)
        Row titleRow = sheet.createRow(currentRow++);
        titleRow.setHeightInPoints(30);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(reportTitle != null ? reportTitle : "RelatÃ³rio");
        CellStyle titleStyle = createTitleStyle(workbook);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(currentRow - 1, currentRow - 1, 0, safeLastColumn));
        
        // Linha 4: Nome da empresa (altura 20px)
        Row companyRow = sheet.createRow(currentRow++);
        companyRow.setHeightInPoints(20);
        Cell companyCell = companyRow.createCell(0);
        companyCell.setCellValue(company.getName());
        CellStyle companyStyle = createCompanyNameStyle(workbook);
        companyCell.setCellStyle(companyStyle);
        sheet.addMergedRegion(new CellRangeAddress(currentRow - 1, currentRow - 1, 0, safeLastColumn));
        
        // Linha 5: CNPJ (altura 15px)
        String cnpjText = CompanyDataFormatter.formatCnpjForHeader(company);
        if (!cnpjText.isEmpty()) {
            Row cnpjRow = sheet.createRow(currentRow++);
            cnpjRow.setHeightInPoints(15);
            Cell cnpjCell = cnpjRow.createCell(0);
            cnpjCell.setCellValue(cnpjText);
            CellStyle cnpjStyle = createCnpjStyle(workbook);
            cnpjCell.setCellStyle(cnpjStyle);
            sheet.addMergedRegion(new CellRangeAddress(currentRow - 1, currentRow - 1, 0, safeLastColumn));
        }
        
        // Linha 6: Linha em branco (altura 10px)
        Row blankRow = sheet.createRow(currentRow++);
        blankRow.setHeightInPoints(10);
        
        log.info("CabeÃ§alho Excel adicionado. Dados comeÃ§am na linha {}", currentRow);
        return currentRow; // Retorna linha onde comeÃ§am os dados
    }
    
    /**
     * Adiciona rodapÃ© padronizado ao Excel
     * Estrutura:
     * - AntepenÃºltima linha: Linha em branco
     * - PenÃºltima linha: InformaÃ§Ãµes da empresa
     * - Ãšltima linha: Data de geraÃ§Ã£o + linha gradiente
     */
    public void addFooter(Sheet sheet, Workbook workbook, Company company) {
        addFooter(sheet, workbook, company, 5);
    }

    public void addFooter(Sheet sheet, Workbook workbook, Company company, int lastColumn) {
        log.info("Adicionando rodapÃ© Excel - Empresa: {}", company.getName());
        
        int lastRowNum = sheet.getLastRowNum();
        int footerStartRow = lastRowNum + 1;
        int safeLastColumn = Math.max(0, lastColumn);
        
        // AntepenÃºltima linha: Linha em branco
        Row blankRow = sheet.createRow(footerStartRow++);
        blankRow.setHeightInPoints(10);
        
        // PenÃºltima linha: InformaÃ§Ãµes da empresa
        Row infoRow = sheet.createRow(footerStartRow++);
        infoRow.setHeightInPoints(20);
        Cell infoCell = infoRow.createCell(0);
        String footerText = CompanyDataFormatter.formatCompanyFooter(company, true);
        infoCell.setCellValue(footerText);
        CellStyle footerStyle = createFooterStyle(workbook);
        infoCell.setCellStyle(footerStyle);
        sheet.addMergedRegion(new CellRangeAddress(footerStartRow - 1, footerStartRow - 1, 0, safeLastColumn));
        
        // Ãšltima linha: Data de geraÃ§Ã£o + linha gradiente
        Row dateRow = sheet.createRow(footerStartRow);
        dateRow.setHeightInPoints(20);
        Cell dateCell = dateRow.createCell(0);
        String generatedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        dateCell.setCellValue("Gerado em: " + generatedAt);
        CellStyle dateStyle = createDateStyle(workbook);
        dateCell.setCellStyle(dateStyle);
        sheet.addMergedRegion(new CellRangeAddress(footerStartRow, footerStartRow, 0, safeLastColumn));
        
        // Adicionar linha gradiente na parte inferior (3px)
        addGradientBarAtBottom(workbook, dateRow, safeLastColumn);
        
        log.info("RodapÃ© Excel adicionado");
    }
    
    /**
     * Adiciona logo da empresa na primeira linha
     */
    private void addLogo(Sheet sheet, Workbook workbook, Row row, Company company) {
        if (company.getLogoUrl() == null || company.getLogoUrl().isEmpty()) {
            log.debug("Empresa {} nÃ£o possui logo, pulando adiÃ§Ã£o de logo", company.getName());
            return;
        }
        
        try {
            byte[] imageBytes = loadLogoImage(company.getLogoUrl());
            if (imageBytes == null || imageBytes.length == 0) {
                log.warn("NÃ£o foi possÃ­vel carregar logo da empresa {}", company.getName());
                return;
            }
            
            // Criar drawing patriarch para adicionar imagem
            XSSFDrawing drawing = (XSSFDrawing) sheet.createDrawingPatriarch();
            
            // Criar anchor para posicionar imagem
            XSSFClientAnchor anchor = new XSSFClientAnchor(
                0, 0, 0, 0,
                0, row.getRowNum(), 2, row.getRowNum() + 1
            );
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_AND_RESIZE);
            
            // Adicionar imagem
            int pictureIndex = workbook.addPicture(imageBytes, Workbook.PICTURE_TYPE_PNG);
            XSSFPicture picture = drawing.createPicture(anchor, pictureIndex);
            
            // Redimensionar para 297x217px mantendo proporÃ§Ã£o
            picture.resize(LOGO_WIDTH_PX, LOGO_HEIGHT_PX);
            
            log.info("Logo da empresa {} adicionado ao Excel", company.getName());
        } catch (Exception e) {
            log.error("Erro ao adicionar logo da empresa {}: {}", company.getName(), e.getMessage(), e);
        }
    }
    
    /**
     * Carrega imagem do logo
     */
    private byte[] loadLogoImage(String logoUrl) {
        try {
            if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
                // Carregar de URL
                URL url = new URL(logoUrl);
                return url.openStream().readAllBytes();
            } else {
                // Carregar de arquivo local
                java.nio.file.Path logoPath = resolveLogoPath(logoUrl);
                if (java.nio.file.Files.exists(logoPath)) {
                    return java.nio.file.Files.readAllBytes(logoPath);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao carregar logo de {}: {}", logoUrl, e.getMessage());
        }
        return new byte[0];
    }
    
    /**
     * Resolve caminho do logo
     */
    private java.nio.file.Path resolveLogoPath(String logoUrl) {
        if (logoUrl.startsWith("/api/uploads/companies/logos/")) {
            String filename = logoUrl.replace("/api/uploads/companies/logos/", "");
            return java.nio.file.Paths.get(uploadDir, "companies", "logos", filename);
        }
        if (!logoUrl.contains("/")) {
            return java.nio.file.Paths.get(uploadDir, "companies", "logos", logoUrl);
        }
        return java.nio.file.Paths.get(uploadDir, logoUrl);
    }
    
    /**
     * Adiciona barra gradiente (simulada com cores sÃ³lidas)
     */
    private void addGradientBar(Workbook workbook, Row row, int lastColumn) {
        int numCells = Math.max(1, lastColumn + 1);
        
        for (int i = 0; i < numCells; i++) {
            Cell cell = row.createCell(i);
            CellStyle style = workbook.createCellStyle();
            
            String colorHex;
            if (numCells == 1) {
                colorHex = COLOR_ORANGE_HEX;
            } else {
                double progress = (double) i / (double) (numCells - 1);
                if (progress <= 0.33) {
                    colorHex = COLOR_YELLOW_HEX;
                } else if (progress <= 0.66) {
                    colorHex = COLOR_ORANGE_HEX;
                } else {
                    colorHex = COLOR_RED_HEX;
                }
            }
            
            XSSFCellStyle xssfStyle = (XSSFCellStyle) style;
            xssfStyle.setFillForegroundColor(new XSSFColor(hexToRgb(colorHex), null));
            xssfStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            cell.setCellStyle(style);
        }
    }
    
    /**
     * Adiciona linha gradiente na parte inferior do rodapÃ©
     */
    private void addGradientBarAtBottom(Workbook workbook, Row row, int lastColumn) {
        addGradientBar(workbook, row, lastColumn);
    }
    
    /**
     * Converte hex para RGB
     */
    private byte[] hexToRgb(String hex) {
        int r = Integer.parseInt(hex.substring(0, 2), 16);
        int g = Integer.parseInt(hex.substring(2, 4), 16);
        int b = Integer.parseInt(hex.substring(4, 6), 16);
        return new byte[]{(byte) r, (byte) g, (byte) b};
    }
    
    /**
     * Cria estilo para tÃ­tulo
     */
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Cria estilo para nome da empresa
     */
    private CellStyle createCompanyNameStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Cria estilo para CNPJ
     */
    private CellStyle createCnpjStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 9);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Cria estilo para rodapÃ©
     */
    private CellStyle createFooterStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 8);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Cria estilo para data
     */
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 7);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
}

