package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import com.z7design.fleet_manager.util.CompanyDataFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FleetWorkOrderPdfService {

    private final FleetWorkOrderRepository repository;
    private final CompanyRepository companyRepository;
    private final TemplateEngine templateEngine;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final NumberFormat CURRENCY = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    /**
     * Gera o PDF da Ordem de Serviço de Frota usando o template Thymeleaf
     * fleet-work-order.html e o Flying Saucer (ITextRenderer).
     */
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID workOrderId) {
        FleetWorkOrder order = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        // Inicializa coleções lazy dentro da transação
        if (order.getItems() != null) {
            order.getItems().size();
        }

        Map<String, Object> data = buildDataMap(order);

        try {
            Context context = new Context();
            context.setVariables(data);
            String html = templateEngine.process("fleet-work-order", context);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.setDocumentFromString(html);
                renderer.layout();
                renderer.createPDF(outputStream);
                byte[] pdfBytes = outputStream.toByteArray();
                log.info("PDF da OS {} gerado com sucesso: {} bytes", order.getOsNumber(), pdfBytes.length);
                return pdfBytes;
            }
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da OS {}: {}", workOrderId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF da Ordem de Serviço: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> buildDataMap(FleetWorkOrder order) {
        Map<String, Object> data = new HashMap<>();

        String osNumber = order.getOsNumber() != null ? order.getOsNumber()
                : "#" + (order.getId() != null ? order.getId().toString().split("-")[0] : "");

        data.put("osNumber", osNumber);
        data.put("dataEmissao", LocalDate.now().format(DATE_FMT));
        data.put("dataGeracao", LocalDateTime.now().format(DATETIME_FMT));

        // Identificação
        data.put("vehiclePlate", order.getVehicle() != null ? order.getVehicle().getPlate() : null);
        data.put("vehicleModel", order.getVehicle() != null ? order.getVehicle().getModel() : null);
        data.put("planoManutencao", order.getPlan() != null && order.getPlan().getTaskName() != null
                ? order.getPlan().getTaskName() : null);
        data.put("mechanicName", order.getMechanicName());
        data.put("mecanicoAssinatura", order.getMechanicName());
        data.put("laborType", formatLaborType(order.getLaborType()));
        data.put("status", formatStatus(order.getStatus()));
        data.put("prioridade", formatPriority(order.getPriority()));
        data.put("dataPlanejada", order.getPlannedDate() != null ? order.getPlannedDate().format(DATE_FMT) : null);
        data.put("dataEntrada", order.getActualDate() != null ? order.getActualDate().format(DATE_FMT) : null);
        data.put("dataEntregue", LocalDate.now().format(DATE_FMT));
        data.put("odometerIn", order.getOdometerIn() != null ? formatKm(order.getOdometerIn()) : null);
        data.put("odometerOut", order.getOdometerOut() != null ? formatKm(order.getOdometerOut()) : null);
        data.put("tempoParado", formatDowntime(order.getDowntimeHours(), order.getDowntimeDays()));

        // Motivo da parada
        data.put("stopReason", order.getStopReason());

        // Itens
        List<Map<String, Object>> itens = new ArrayList<>();
        if (order.getItems() != null) {
            for (WorkOrderItem item : order.getItems()) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("descricao", item.getDescription());
                itemMap.put("tipo", item.getType() == WorkOrderItem.ItemType.LABOR ? "Serviço" : "Peça");
                itemMap.put("quantidade", formatQuantity(item.getQuantity()));
                itemMap.put("unitario", formatCurrency(item.getUnitPrice()));
                itemMap.put("total", formatCurrency(item.getTotalPrice()));
                itens.add(itemMap);
            }
        }
        data.put("itens", itens);

        // Custos
        data.put("laborCost", formatCurrency(order.getLaborCost()));
        data.put("partsCost", formatCurrency(order.getPartsCost()));
        data.put("totalCost", formatCurrency(order.getTotalCost()));

        // Observações
        data.put("observacoes", order.getNotes());

        // Empresa (nome/logo para o cabeçalho do PDF)
        Company company = resolveCompany(order);
        if (company != null) {
            data.put("companyName", company.getName());
            data.put("companyCnpj", CompanyDataFormatter.formatCnpjForHeader(company));
            data.put("companyAddress", CompanyDataFormatter.formatFullAddress(company));
            data.put("companyLogo", loadLogoAsDataUri(company.getLogoUrl()));
        }

        return data;
    }

    /**
     * Resolve a empresa da OS: prioriza o companyId da ordem, com fallback
     * para o tenant da requisição atual (JWT).
     */
    private Company resolveCompany(FleetWorkOrder order) {
        // 1º: empresa da própria OS; 2º: empresa do veículo; 3º: tenant da requisição (JWT)
        UUID companyId = order.getCompanyId();
        if (companyId == null && order.getVehicle() != null) {
            companyId = order.getVehicle().getCompanyId();
        }
        if (companyId == null) {
            companyId = TenantContext.get();
        }
        if (companyId == null) {
            return null;
        }
        return companyRepository.findById(companyId).orElse(null);
    }

    /**
     * Carrega o logo da empresa e converte para data URI (base64) para ser
     * embutido diretamente no HTML do PDF (evita dependência de rede/base URL).
     */
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

            // Apenas formatos raster suportados pelo Flying Saucer (SVG não renderiza)
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

    // ── Helpers de formatação ─────────────────────────────────────────────────

    private String formatCurrency(BigDecimal value) {
        return value != null ? CURRENCY.format(value) : CURRENCY.format(BigDecimal.ZERO);
    }

    private String formatQuantity(BigDecimal value) {
        if (value == null) return "0";
        return value.stripTrailingZeros().toPlainString();
    }

    private String formatKm(Integer km) {
        if (km == null) return null;
        return NumberFormat.getIntegerInstance(new Locale("pt", "BR")).format(km) + " km";
    }

    private String formatDowntime(Long hours, Long days) {
        if (hours == null) return null;
        return hours + "h" + (days != null ? " (~" + days + "d)" : "");
    }

    private String formatStatus(FleetWorkOrder.WorkOrderStatus status) {
        if (status == null) return null;
        return switch (status) {
            case DRAFT -> "Rascunho";
            case PENDING_APPROVAL -> "Pendente Aprovação";
            case APPROVED -> "Aprovado";
            case IN_PROGRESS -> "Em Execução";
            case COMPLETED -> "Concluído";
            case CANCELLED -> "Cancelado";
        };
    }

    private String formatPriority(FleetWorkOrder.WorkOrderPriority priority) {
        if (priority == null) return null;
        return switch (priority) {
            case LOW -> "Baixa";
            case MEDIUM -> "Média";
            case HIGH -> "Alta";
            case URGENT -> "Urgente";
        };
    }

    private String formatLaborType(FleetWorkOrder.LaborType laborType) {
        if (laborType == null) return null;
        return laborType == FleetWorkOrder.LaborType.INTERNAL ? "Oficina Interna" : "Externa (Terceiros)";
    }
}
