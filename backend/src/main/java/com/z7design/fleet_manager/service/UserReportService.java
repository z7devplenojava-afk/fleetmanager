package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserReportService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final UserService userService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Gera relatório PDF de usuários com layout corporativo padrão (gradiente, logo, rodapé).
     */
    @Transactional(readOnly = true)
    public byte[] generateUserReportPDF(UUID companyIdOverride, LocalDate startDate, LocalDate endDate, String roleFilter, String statusFilter) throws IOException {
        log.info("Gerando relatório PDF de usuários - Empresa: {}, Período: {} a {}, Role: {}, Status: {}",
                companyIdOverride, startDate, endDate, roleFilter, statusFilter);

        List<User> users = getFilteredUsers(companyIdOverride, startDate, endDate, roleFilter, statusFilter);
        UUID companyIdForLayout = resolveCompanyIdForLayout(companyIdOverride, users);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            PdfWriter writer = new PdfWriter(baos);

            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                    .companyId(companyIdForLayout)
                    .reportTitle("RELATÓRIO DE USUÁRIOS")
                    .topMargin(120f)
                    .bottomMargin(80f)
                    .leftMargin(40f)
                    .rightMargin(40f)
                    .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document doc = docWithPdf.getDocument();

            // Bloco de Informações dos Filtros Aplicados
            String companyName = resolveCompanyName(companyIdForLayout);
            Table filterInfoTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            filterInfoTable.setMarginBottom(10f);

            String periodText = (startDate != null ? startDate.format(SHORT_DATE) : "Início") + " até " +
                    (endDate != null ? endDate.format(SHORT_DATE) : "Atual");
            String roleText = (roleFilter != null && !roleFilter.isBlank() && !roleFilter.equalsIgnoreCase("ALL")) ? roleFilter : "Todos os Perfis";
            String statusText = (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) ? statusFilter : "Todos os Status";

            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Empresa: " + companyName).setFontSize(9).setBold()));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Período: " + periodText).setFontSize(9)));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Perfil / Função: " + roleText).setFontSize(9)));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Status: " + statusText).setFontSize(9)));

            doc.add(filterInfoTable);

            // Cards de Resumo Executivo
            long totalUsers = users.size();
            long activeCount = users.stream().filter(u -> u.isActive() && !isUserBlocked(u)).count();
            long blockedCount = users.stream().filter(this::isUserBlocked).count();
            long inactiveCount = users.stream().filter(u -> !u.isActive()).count();

            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25})).useAllAvailableWidth();
            summaryTable.setMarginBottom(15f);

            summaryTable.addCell(createSummaryCard("Total de Usuários", String.valueOf(totalUsers), new DeviceRgb(41, 128, 185)));
            summaryTable.addCell(createSummaryCard("Usuários Ativos", String.valueOf(activeCount), new DeviceRgb(39, 174, 96)));
            summaryTable.addCell(createSummaryCard("Usuários Bloqueados", String.valueOf(blockedCount), new DeviceRgb(231, 76, 60)));
            summaryTable.addCell(createSummaryCard("Usuários Inativos", String.valueOf(inactiveCount), new DeviceRgb(127, 140, 141)));

            doc.add(summaryTable);

            // Tabela Analítica de Usuários
            Table userTable = new Table(UnitValue.createPercentArray(new float[]{18, 16, 18, 14, 16, 10, 8})).useAllAvailableWidth();

            // Cabeçalho da tabela
            String[] headers = {"Nome", "Username", "Email", "CPF", "Perfil / Roles", "Status", "Cadastro"};
            for (String h : headers) {
                Cell headerCell = new Cell()
                        .setBackgroundColor(new DeviceRgb(26, 36, 44))
                        .setTextAlignment(TextAlignment.LEFT)
                        .setPadding(5f)
                        .add(new Paragraph(h).setFontColor(ColorConstants.WHITE).setFontSize(8).setBold());
                userTable.addHeaderCell(headerCell);
            }

            boolean alternate = false;
            DeviceRgb rowLight = new DeviceRgb(248, 249, 250);
            DeviceRgb rowDark = new DeviceRgb(255, 255, 255);

            for (User u : users) {
                DeviceRgb bg = alternate ? rowLight : rowDark;
                alternate = !alternate;

                String rolesStr = (u.getRoles() != null && !u.getRoles().isEmpty())
                        ? u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", "))
                        : "-";

                String cpfStr = u.getCpf() != null && !u.getCpf().isBlank() ? u.getCpf() : "-";
                String createdStr = u.getCreatedAt() != null ? u.getCreatedAt().format(SHORT_DATE) : "-";

                String userStatus = isUserBlocked(u) ? "Bloqueado" : (u.isActive() ? "Ativo" : "Inativo");
                DeviceRgb statusColor = isUserBlocked(u) ? new DeviceRgb(231, 76, 60)
                        : (u.isActive() ? new DeviceRgb(39, 174, 96) : new DeviceRgb(127, 140, 141));

                userTable.addCell(createTableCell(u.getName() != null ? u.getName() : "-", bg, 8, true, TextAlignment.LEFT));
                userTable.addCell(createTableCell(u.getUsername() != null ? u.getUsername() : "-", bg, 8, false, TextAlignment.LEFT));
                userTable.addCell(createTableCell(u.getEmail() != null ? u.getEmail() : "-", bg, 8, false, TextAlignment.LEFT));
                userTable.addCell(createTableCell(cpfStr, bg, 8, false, TextAlignment.LEFT));
                userTable.addCell(createTableCell(rolesStr, bg, 7, false, TextAlignment.LEFT));

                Cell statusCell = new Cell()
                        .setBackgroundColor(bg)
                        .setPadding(4f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .add(new Paragraph(userStatus).setFontSize(8).setFontColor(statusColor).setBold());
                userTable.addCell(statusCell);

                userTable.addCell(createTableCell(createdStr, bg, 8, false, TextAlignment.CENTER));
            }

            doc.add(userTable);

            // Finaliza o layout aplicando cabeçalho decorativo e rodapé
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            doc.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de usuários", e);
            throw new IOException("Falha na geração do relatório PDF de usuários: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    /**
     * Gera relatório Excel (.xlsx) de usuários com duas abas (Lista Analítica e Resumo Executivo).
     */
    @Transactional(readOnly = true)
    public byte[] generateUserReportExcel(UUID companyIdOverride, LocalDate startDate, LocalDate endDate, String roleFilter, String statusFilter) throws IOException {
        log.info("Gerando relatório Excel de usuários - Empresa: {}, Período: {} a {}, Role: {}, Status: {}",
                companyIdOverride, startDate, endDate, roleFilter, statusFilter);

        List<User> users = getFilteredUsers(companyIdOverride, startDate, endDate, roleFilter, statusFilter);
        UUID companyIdForLayout = resolveCompanyIdForLayout(companyIdOverride, users);
        String companyName = resolveCompanyName(companyIdForLayout);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // Estilos
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(dataStyle);
            dateStyle.setAlignment(HorizontalAlignment.CENTER);

            // Aba 1: Usuários
            Sheet sheet = workbook.createSheet("Usuários");

            // Linha 0: Título
            Row titleRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("RELATÓRIO DE USUÁRIOS - " + companyName.toUpperCase());
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Linha 1: Metadados
            Row metaRow = sheet.createRow(1);
            metaRow.createCell(0).setCellValue("Gerado em: " + LocalDateTime.now().format(DATE_FORMATTER));

            // Linha 3: Cabeçalhos
            String[] columns = {"ID", "Nome Completo", "Username", "Email", "CPF", "WhatsApp", "Perfis / Roles", "Status", "Bloqueado", "Data Cadastro", "Última Atualização"};
            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            for (User u : users) {
                Row row = sheet.createRow(rowIdx++);

                String rolesStr = (u.getRoles() != null && !u.getRoles().isEmpty())
                        ? u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", "))
                        : "-";

                boolean blocked = isUserBlocked(u);
                String userStatus = blocked ? "Bloqueado" : (u.isActive() ? "Ativo" : "Inativo");

                createExcelCell(row, 0, u.getId() != null ? u.getId().toString() : "", dataStyle);
                createExcelCell(row, 1, u.getName() != null ? u.getName() : "", dataStyle);
                createExcelCell(row, 2, u.getUsername() != null ? u.getUsername() : "", dataStyle);
                createExcelCell(row, 3, u.getEmail() != null ? u.getEmail() : "", dataStyle);
                createExcelCell(row, 4, u.getCpf() != null ? u.getCpf() : "", dataStyle);
                createExcelCell(row, 5, u.getWhatsapp() != null ? u.getWhatsapp() : "", dataStyle);
                createExcelCell(row, 6, rolesStr, dataStyle);
                createExcelCell(row, 7, userStatus, dataStyle);
                createExcelCell(row, 8, blocked ? "Sim" : "Não", dataStyle);
                createExcelCell(row, 9, u.getCreatedAt() != null ? u.getCreatedAt().format(DATE_FORMATTER) : "-", dateStyle);
                createExcelCell(row, 10, u.getUpdatedAt() != null ? u.getUpdatedAt().format(DATE_FORMATTER) : "-", dateStyle);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Aba 2: Resumo Executivo
            Sheet summarySheet = workbook.createSheet("Resumo Executivo");
            Row sumTitleRow = summarySheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell sumTitleCell = sumTitleRow.createCell(0);
            sumTitleCell.setCellValue("INDICADORES DE USUÁRIOS");
            sumTitleCell.setCellStyle(titleStyle);

            Row sumHdrRow = summarySheet.createRow(2);
            sumHdrRow.createCell(0).setCellValue("Métrica");
            sumHdrRow.getCell(0).setCellStyle(headerStyle);
            sumHdrRow.createCell(1).setCellValue("Quantidade");
            sumHdrRow.getCell(1).setCellStyle(headerStyle);

            long totalUsers = users.size();
            long activeCount = users.stream().filter(u -> u.isActive() && !isUserBlocked(u)).count();
            long blockedCount = users.stream().filter(this::isUserBlocked).count();
            long inactiveCount = users.stream().filter(u -> !u.isActive()).count();

            addSummaryMetric(summarySheet, 3, "Total de Usuários", totalUsers, dataStyle);
            addSummaryMetric(summarySheet, 4, "Usuários Ativos", activeCount, dataStyle);
            addSummaryMetric(summarySheet, 5, "Usuários Bloqueados", blockedCount, dataStyle);
            addSummaryMetric(summarySheet, 6, "Usuários Inativos", inactiveCount, dataStyle);

            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private void addSummaryMetric(Sheet sheet, int rowIdx, String label, long value, CellStyle style) {
        Row row = sheet.createRow(rowIdx);
        org.apache.poi.ss.usermodel.Cell c0 = row.createCell(0);
        c0.setCellValue(label);
        c0.setCellStyle(style);

        org.apache.poi.ss.usermodel.Cell c1 = row.createCell(1);
        c1.setCellValue(value);
        c1.setCellStyle(style);
    }

    private void createExcelCell(Row row, int colIdx, String value, CellStyle style) {
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(colIdx);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private Cell createSummaryCard(String title, String value, DeviceRgb color) {
        Cell card = new Cell()
                .setBackgroundColor(new DeviceRgb(245, 247, 250))
                .setPadding(8f)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(color, 1.5f));

        card.add(new Paragraph(title)
                .setFontSize(8)
                .setFontColor(new DeviceRgb(100, 110, 120))
                .setBold()
                .setTextAlignment(TextAlignment.CENTER));

        card.add(new Paragraph(value)
                .setFontSize(14)
                .setFontColor(color)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER));

        return card;
    }

    private Cell createTableCell(String text, DeviceRgb bg, float fontSize, boolean bold, TextAlignment align) {
        Cell cell = new Cell()
                .setBackgroundColor(bg)
                .setPadding(4f)
                .setTextAlignment(align);
        Paragraph p = new Paragraph(text).setFontSize(fontSize);
        if (bold) p.setBold();
        cell.add(p);
        return cell;
    }

    private boolean isUserBlocked(User u) {
        if (Boolean.TRUE.equals(u.getBlocked())) return true;
        if (u.getBlockedUntil() != null && u.getBlockedUntil().isAfter(LocalDateTime.now())) return true;
        return false;
    }

    private List<User> getFilteredUsers(UUID companyIdOverride, LocalDate startDate, LocalDate endDate, String roleFilter, String statusFilter) {
        UUID effectiveCompanyId = companyIdOverride;

        // Se for gestor tenant (COMPANY_ADMIN / ADMIN_EMPRESA), força o companyId do tenant
        if (userService.isCurrentUserTenantManager()) {
            effectiveCompanyId = userService.getCurrentCompanyId();
        }

        List<User> users;
        if (effectiveCompanyId != null) {
            users = userRepository.findByCompanyId(effectiveCompanyId);
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .filter(u -> {
                    // Filtro de Período (createdAt)
                    if (startDate != null && u.getCreatedAt() != null) {
                        if (u.getCreatedAt().toLocalDate().isBefore(startDate)) return false;
                    }
                    if (endDate != null && u.getCreatedAt() != null) {
                        if (u.getCreatedAt().toLocalDate().isAfter(endDate)) return false;
                    }

                    // Filtro de Role
                    if (roleFilter != null && !roleFilter.isBlank() && !roleFilter.equalsIgnoreCase("ALL")) {
                        boolean hasRole = false;
                        if (u.getRoles() != null) {
                            hasRole = u.getRoles().stream().anyMatch(r -> roleFilter.equalsIgnoreCase(r.getName()));
                        }
                        if (!hasRole) return false;
                    }

                    // Filtro de Status
                    if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
                        boolean blocked = isUserBlocked(u);
                        if ("ACTIVE".equalsIgnoreCase(statusFilter) && (!u.isActive() || blocked)) return false;
                        if ("BLOCKED".equalsIgnoreCase(statusFilter) && !blocked) return false;
                        if ("INACTIVE".equalsIgnoreCase(statusFilter) && (u.isActive() || blocked)) return false;
                    }

                    return true;
                })
                .sorted(Comparator.comparing(u -> u.getName() != null ? u.getName().toLowerCase() : ""))
                .collect(Collectors.toList());
    }

    private UUID resolveCompanyIdForLayout(UUID companyIdOverride, List<User> users) {
        if (companyIdOverride != null) return companyIdOverride;
        UUID tenantComp = userService.getCurrentCompanyId();
        if (tenantComp != null) return tenantComp;

        for (User u : users) {
            if (u.getCompanyId() != null) return u.getCompanyId();
        }
        return companyRepository.findAll().stream().findFirst().map(Company::getId).orElse(null);
    }

    private String resolveCompanyName(UUID companyId) {
        if (companyId == null) return "Todas as Empresas (Relatório Geral)";
        return companyRepository.findById(companyId).map(Company::getName).orElse("Empresa Vinculada");
    }
}
