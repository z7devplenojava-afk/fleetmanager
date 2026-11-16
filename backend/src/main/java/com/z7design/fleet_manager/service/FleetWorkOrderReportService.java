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
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FleetWorkOrder.WorkOrderStatus;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FleetWorkOrderReportService {

    private final FleetWorkOrderRepository repository;
    private final CompanyRepository companyRepository;
    private final VehicleRepository vehicleRepository;
    private final StandardReportLayoutService standardReportLayoutService;

    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Gera relatório PDF de Ordens de Serviço com layout executivo (logo, gradiente, resumo e lista analítica).
     */
    @Transactional(readOnly = true)
    public byte[] generateWorkOrderReportPDF(UUID companyIdOverride, LocalDate startDate, LocalDate endDate, String statusFilter, UUID vehicleId) throws IOException {
        log.info("Gerando relatório PDF de Ordens de Serviço - Empresa: {}, Período: {} a {}, Status: {}, Veículo: {}",
                companyIdOverride, startDate, endDate, statusFilter, vehicleId);

        List<FleetWorkOrder> orders = getFilteredOrders(companyIdOverride, startDate, endDate, statusFilter, vehicleId);
        UUID companyIdForLayout = resolveCompanyIdForLayout(companyIdOverride, orders);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;

        try {
            PdfWriter writer = new PdfWriter(baos);

            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                    .companyId(companyIdForLayout)
                    .reportTitle("RELATÓRIO DE ORDENS DE SERVIÇO")
                    .topMargin(120f)
                    .bottomMargin(80f)
                    .leftMargin(30f)
                    .rightMargin(30f)
                    .build();

            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document doc = docWithPdf.getDocument();

            // 1. Bloco de Filtros Aplicados
            String companyName = resolveCompanyName(companyIdForLayout);
            String vehicleName = "Todos os Veículos";
            if (vehicleId != null) {
                vehicleName = vehicleRepository.findById(vehicleId)
                        .map(v -> (v.getPlate() != null ? v.getPlate() : "") + (v.getModel() != null ? " - " + v.getModel() : ""))
                        .orElse("Veículo selecionado");
            }

            Table filterInfoTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            filterInfoTable.setMarginBottom(10f);

            String periodText = (startDate != null ? startDate.format(SHORT_DATE) : "Início") + " até " +
                    (endDate != null ? endDate.format(SHORT_DATE) : "Atual");
            String statusText = (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("TODOS") && !statusFilter.equalsIgnoreCase("ALL"))
                    ? translateStatus(statusFilter) : "Todos os Status";

            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Empresa: " + companyName).setFontSize(9).setBold()));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Período: " + periodText).setFontSize(9)));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Status da OS: " + statusText).setFontSize(9)));
            filterInfoTable.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("Veículo Filtrado: " + vehicleName).setFontSize(9)));

            doc.add(filterInfoTable);

            // 2. Cards de Resumo Executivo (KPIs)
            long total = orders.size();
            long completed = orders.stream().filter(o -> o.getStatus() == WorkOrderStatus.COMPLETED).count();
            long inProgress = orders.stream().filter(o -> o.getStatus() == WorkOrderStatus.IN_PROGRESS).count();
            long waitingParts = orders.stream().filter(o -> o.getStatus() == WorkOrderStatus.WAITING_PARTS).count();
            long external = orders.stream().filter(o -> o.getLaborType() == FleetWorkOrder.LaborType.EXTERNAL).count();

            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{20, 20, 20, 20, 20})).useAllAvailableWidth();
            summaryTable.setMarginBottom(12f);

            summaryTable.addCell(createSummaryCard("Total de OS", String.valueOf(total), new DeviceRgb(41, 128, 185)));
            summaryTable.addCell(createSummaryCard("Concluídas", String.valueOf(completed), new DeviceRgb(39, 174, 96)));
            summaryTable.addCell(createSummaryCard("Em Execução", String.valueOf(inProgress), new DeviceRgb(243, 156, 18)));
            summaryTable.addCell(createSummaryCard("Aguardando Peças", String.valueOf(waitingParts), new DeviceRgb(142, 68, 173)));
            summaryTable.addCell(createSummaryCard("Serviço Externo", String.valueOf(external), new DeviceRgb(22, 160, 133)));

            doc.add(summaryTable);

            // 3. Tabela Analítica de Ordens de Serviço
            Table osTable = new Table(UnitValue.createPercentArray(new float[]{14, 18, 13, 11, 18, 14, 12})).useAllAvailableWidth();

            String[] headers = {"Nº OS / Data", "Veículo", "Tipo OS", "Mão de Obra", "Mecânico / Resp.", "Status", "Prioridade"};
            for (String h : headers) {
                Cell headerCell = new Cell()
                        .setBackgroundColor(new DeviceRgb(26, 36, 44))
                        .setTextAlignment(TextAlignment.LEFT)
                        .setPadding(4f)
                        .add(new Paragraph(h).setFontColor(ColorConstants.WHITE).setFontSize(7.5f).setBold());
                osTable.addHeaderCell(headerCell);
            }

            boolean alternate = false;
            DeviceRgb rowLight = new DeviceRgb(248, 249, 250);
            DeviceRgb rowDark = new DeviceRgb(255, 255, 255);

            for (FleetWorkOrder o : orders) {
                DeviceRgb bg = alternate ? rowLight : rowDark;
                alternate = !alternate;

                String osIdStr = o.getOsNumber() != null ? o.getOsNumber() : "#" + o.getId().toString().substring(0, 8).toUpperCase();
                String dataStr = o.getCreatedAt() != null ? o.getCreatedAt().format(SHORT_DATE) : (o.getRequestDate() != null ? o.getRequestDate().format(SHORT_DATE) : "-");

                String vehicleStr = "-";
                if (o.getVehicle() != null) {
                    vehicleStr = (o.getVehicle().getPlate() != null ? o.getVehicle().getPlate() : "") +
                            (o.getVehicle().getFleetNumber() != null ? " (" + o.getVehicle().getFleetNumber() + ")" : "");
                }

                String tipoStr = o.getMaintenanceType() != null ? o.getMaintenanceType().name() : "CORRETIVA";
                String moStr = o.getLaborType() == FleetWorkOrder.LaborType.EXTERNAL ? "EXTERNA" : "INTERNA";
                String mecanicStr = o.getMechanicName() != null && !o.getMechanicName().isBlank() ? o.getMechanicName() : "Não atribuído";

                String statusLabel = translateStatus(o.getStatus() != null ? o.getStatus().name() : "OPEN");
                DeviceRgb statusColor = getStatusColor(o.getStatus());

                String priorityStr = o.getPriority() != null ? o.getPriority().name() : "MÉDIA";

                // Célula 1: OS / Data
                Cell c1 = new Cell().setBackgroundColor(bg).setPadding(3.5f)
                        .add(new Paragraph(osIdStr).setFontSize(7.5f).setBold())
                        .add(new Paragraph(dataStr).setFontSize(6.5f).setFontColor(ColorConstants.GRAY));
                osTable.addCell(c1);

                // Célula 2: Veículo
                osTable.addCell(createTableCell(vehicleStr, bg, 7.5f, true, TextAlignment.LEFT));

                // Célula 3: Tipo
                osTable.addCell(createTableCell(tipoStr, bg, 7f, false, TextAlignment.LEFT));

                // Célula 4: Mão de Obra
                osTable.addCell(createTableCell(moStr, bg, 7f, false, TextAlignment.CENTER));

                // Célula 5: Mecânico
                osTable.addCell(createTableCell(mecanicStr, bg, 7f, false, TextAlignment.LEFT));

                // Célula 6: Status
                Cell statusCell = new Cell()
                        .setBackgroundColor(bg)
                        .setPadding(3.5f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .add(new Paragraph(statusLabel).setFontSize(7f).setFontColor(statusColor).setBold());
                osTable.addCell(statusCell);

                // Célula 7: Prioridade
                osTable.addCell(createTableCell(priorityStr, bg, 7f, false, TextAlignment.CENTER));
            }

            doc.add(osTable);

            // Finaliza layout (cabeçalho decorativo e numeração de páginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            doc.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de ordens de serviço", e);
            throw new IOException("Falha na geração do relatório de ordens de serviço: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private List<FleetWorkOrder> getFilteredOrders(UUID companyIdOverride, LocalDate startDate, LocalDate endDate, String statusFilter, UUID vehicleId) {
        List<FleetWorkOrder> all = repository.findAll();

        return all.stream()
                .filter(o -> {
                    // 1. Filtro de Empresa (Tenant)
                    if (companyIdOverride != null && o.getCompany() != null && !companyIdOverride.equals(o.getCompany().getId())) {
                        return false;
                    }

                    // 2. Filtro de Data Inicial
                    LocalDate orderDate = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : o.getRequestDate();
                    if (startDate != null && orderDate != null && orderDate.isBefore(startDate)) {
                        return false;
                    }

                    // 3. Filtro de Data Final
                    if (endDate != null && orderDate != null && orderDate.isAfter(endDate)) {
                        return false;
                    }

                    // 4. Filtro de Status
                    if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("TODOS") && !statusFilter.equalsIgnoreCase("ALL")) {
                        if (o.getStatus() == null || !o.getStatus().name().equalsIgnoreCase(statusFilter)) {
                            return false;
                        }
                    }

                    // 5. Filtro de Veículo
                    if (vehicleId != null) {
                        if (o.getVehicle() == null || !vehicleId.equals(o.getVehicle().getId())) {
                            return false;
                        }
                    }

                    return true;
                })
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    private Cell createSummaryCard(String title, String value, DeviceRgb accentColor) {
        Cell cell = new Cell()
                .setBackgroundColor(new DeviceRgb(245, 247, 250))
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(220, 224, 230), 1f))
                .setPadding(5f)
                .setTextAlignment(TextAlignment.CENTER);

        Paragraph valP = new Paragraph(value)
                .setFontSize(13f)
                .setBold()
                .setFontColor(accentColor)
                .setMarginBottom(1f);

        Paragraph titleP = new Paragraph(title)
                .setFontSize(7f)
                .setFontColor(new DeviceRgb(100, 110, 120))
                .setBold();

        cell.add(valP);
        cell.add(titleP);
        return cell;
    }

    private Cell createTableCell(String text, DeviceRgb bg, float fontSize, boolean bold, TextAlignment align) {
        Paragraph p = new Paragraph(text != null ? text : "-").setFontSize(fontSize);
        if (bold) p.setBold();

        return new Cell()
                .setBackgroundColor(bg)
                .setPadding(3.5f)
                .setTextAlignment(align)
                .add(p);
    }

    private String translateStatus(String status) {
        if (status == null) return "Aberta";
        switch (status.toUpperCase()) {
            case "OPEN": return "Aberta";
            case "DRAFT": return "Rascunho";
            case "APPROVED": return "Aprovada";
            case "IN_PROGRESS": return "Em Execução";
            case "WAITING_PARTS": return "Aguardando Peças";
            case "COMPLETED": return "Finalizada";
            case "CANCELLED": return "Cancelada";
            default: return status;
        }
    }

    private DeviceRgb getStatusColor(WorkOrderStatus status) {
        if (status == null) return new DeviceRgb(41, 128, 185);
        switch (status) {
            case COMPLETED: return new DeviceRgb(39, 174, 96);
            case IN_PROGRESS: return new DeviceRgb(243, 156, 18);
            case WAITING_PARTS: return new DeviceRgb(142, 68, 173);
            case CANCELLED: return new DeviceRgb(231, 76, 60);
            case APPROVED: return new DeviceRgb(41, 128, 185);
            default: return new DeviceRgb(52, 73, 94);
        }
    }

    private UUID resolveCompanyIdForLayout(UUID companyIdOverride, List<FleetWorkOrder> orders) {
        if (companyIdOverride != null) return companyIdOverride;
        return orders.stream()
                .filter(o -> o.getCompany() != null && o.getCompany().getId() != null)
                .map(o -> o.getCompany().getId())
                .findFirst()
                .orElse(null);
    }

    private String resolveCompanyName(UUID companyId) {
        if (companyId == null) return "FluxBus Gestão de Frotas";
        return companyRepository.findById(companyId)
                .map(Company::getName)
                .orElse("FluxBus Gestão de Frotas");
    }
}
