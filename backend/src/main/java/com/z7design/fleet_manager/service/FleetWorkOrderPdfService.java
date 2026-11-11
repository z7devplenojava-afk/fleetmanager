package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.VehicleGateChecklist;
import com.z7design.fleet_manager.model.VehicleInspection;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.ChecklistItemRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VehicleGateChecklistRepository;
import com.z7design.fleet_manager.repository.VehicleInspectionRepository;
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

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FleetWorkOrderPdfService {

    private final FleetWorkOrderRepository repository;
    private final CompanyRepository companyRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final VehicleGateChecklistRepository vehicleGateChecklistRepository;
    private final VehicleInspectionRepository vehicleInspectionRepository;
    private final StoredUploadService storedUploadService;
    private final TemplateEngine templateEngine;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.file.upload-dir:./uploads/maintenance}")
    private String maintenanceUploadDir;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final NumberFormat CURRENCY = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    /**
     * Gera o PDF da Ordem de Serviço de Frota usando o template Thymeleaf
     * fleet-work-order.html e o Flying Saucer (ITextRenderer).
     */
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID workOrderId) {
        return generatePdf(workOrderId, false);
    }

    /**
     * Gera o PDF da Ordem de Serviço de Frota usando o template Thymeleaf
     * fleet-work-order.html e o Flying Saucer (ITextRenderer).
     * Quando blankChecklist == true, renderiza os itens do checklist em branco
     * para preenchimento manual em papel.
     */
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID workOrderId, boolean blankChecklist) {
        FleetWorkOrder order = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        // Inicializa coleções lazy dentro da transação
        try {
            if (order.getItems() != null) {
                order.getItems().size();
            }
            if (order.getChecklistItems() != null) {
                order.getChecklistItems().size();
            }
            if (order.getPhotoAttachments() != null) {
                order.getPhotoAttachments().size();
            }
        } catch (Exception e) {
            log.warn("Aviso ao inicializar coleções da OS {}: {}", workOrderId, e.getMessage());
        }

        Map<String, Object> data = buildDataMap(order, blankChecklist);

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

    /**
     * Gera uma cópia da OS segura para envio ao motorista.
     *
     * <p>
     * A versão do motorista não inclui cliente/obra, custos, itens
     * financeiros, assinaturas internas nem observações administrativas.
     * </p>
     */
    @Transactional(readOnly = true)
    public byte[] generateDriverPdf(UUID workOrderId) {
        FleetWorkOrder order = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        try {
            if (order.getChecklistItems() != null) {
                order.getChecklistItems().size();
            }
        } catch (Exception e) {
            log.warn("Aviso ao inicializar checklist da OS {}: {}", workOrderId, e.getMessage());
        }

        Map<String, Object> data = buildDriverDataMap(order);

        try {
            Context context = new Context();
            context.setVariables(data);
            String html = templateEngine.process("fleet-work-order-driver", context);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.setDocumentFromString(html);
                renderer.layout();
                renderer.createPDF(outputStream);
                byte[] pdfBytes = outputStream.toByteArray();
                log.info("PDF (motorista) da OS {} gerado com sucesso: {} bytes",
                        order.getOsNumber(), pdfBytes.length);
                return pdfBytes;
            }
        } catch (Exception e) {
            log.error("Erro ao gerar PDF (motorista) da OS {}: {}", workOrderId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar resumo da Ordem de Serviço: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> buildDriverDataMap(FleetWorkOrder order) {
        Map<String, Object> data = new HashMap<>();

        String osNumber = order.getOsNumber() != null ? order.getOsNumber()
                : "#" + (order.getId() != null ? order.getId().toString().split("-")[0] : "");

        data.put("osNumber", osNumber);
        data.put("maintenanceType",
                order.getMaintenanceType() != null ? order.getMaintenanceType().name() : "CORRETIVA");
        data.put("status", formatStatus(order.getStatus()));
        data.put("dataEmissao", LocalDate.now().format(DATE_FMT));
        data.put("dataGeracao", LocalDateTime.now().format(DATETIME_FMT));

        data.put("vehiclePlate", order.getVehicle() != null ? order.getVehicle().getPlate() : null);
        data.put("vehicleBrand", order.getVehicle() != null ? order.getVehicle().getBrand() : null);
        data.put("vehicleModel", order.getVehicle() != null ? order.getVehicle().getModel() : null);

        data.put("completionDate", order.getCompletionDate() != null
                ? order.getCompletionDate().format(DATETIME_FMT)
                : null);
        data.put("exitDate", order.getExitDate() != null ? order.getExitDate().format(DATE_FMT) : null);
        data.put("exitTime", order.getExitTime());
        populateDriverAndRequestDate(data, order);
        data.put("odometerIn", order.getOdometerIn() != null ? formatKm(order.getOdometerIn()) : null);
        data.put("odometerOut", order.getOdometerOut() != null ? formatKm(order.getOdometerOut()) : null);
        data.put("executionStartDate", order.getExecutionStartDate() != null
                ? order.getExecutionStartDate().format(DATETIME_FMT)
                : null);
        data.put("executionEndDate", order.getExecutionEndDate() != null
                ? order.getExecutionEndDate().format(DATETIME_FMT)
                : null);
        data.put("tempoExecucao", formatExecutionDuration(order.getExecutionDurationMinutes()));

        data.put("maintenancePerformed", order.getMaintenancePerformed());

        // Local de retirada (garagem/unidade), sem obra/cliente
        String localRetirada = null;
        try {
            if (order.getGarage() != null) {
                localRetirada = joinLocation(order.getGarage().getName(), order.getGarage().getAddress());
            } else if (order.getVehicle() != null && order.getVehicle().getGarage() != null) {
                localRetirada = joinLocation(
                        order.getVehicle().getGarage().getName(),
                        order.getVehicle().getGarage().getAddress());
            }
        } catch (Exception e) {
            log.warn("Aviso ao resolver local de retirada da OS {}: {}", order.getId(), e.getMessage());
        }
        data.put("localRetirada", localRetirada);

        // Checklist efetivamente respondido (sem itens mestres "OK" automáticos)
        List<Map<String, Object>> checklistData = new ArrayList<>();
        try {
            if (order.getChecklistItems() != null) {
                for (com.z7design.fleet_manager.model.FleetWorkOrderChecklist cItem : order.getChecklistItems()) {
                    if (cItem == null) {
                        continue;
                    }
                    Map<String, Object> cMap = new HashMap<>();
                    if (cItem.getChecklistItem() != null) {
                        cMap.put("itemDescricao", cItem.getChecklistItem().getDescricao() != null
                                ? cItem.getChecklistItem().getDescricao()
                                : "");
                        cMap.put("categoria", cItem.getChecklistItem().getCategoria() != null
                                ? cItem.getChecklistItem().getCategoria()
                                : "GERAL");
                    } else {
                        cMap.put("itemDescricao", "");
                        cMap.put("categoria", "GERAL");
                    }
                    cMap.put("situacao", cItem.getSituacao() != null ? cItem.getSituacao().name() : "OK");
                    cMap.put("observacao", cItem.getObservacao());
                    cMap.put("reparoRealizado", cItem.getReparoRealizado());
                    checklistData.add(cMap);
                }
            }
        } catch (Exception e) {
            log.warn("Aviso ao mapear checklist do PDF do motorista da OS {}: {}", order.getId(), e.getMessage());
        }
        data.put("checklistItems", checklistData);

        List<Map<String, Object>> checklistCol1 = new ArrayList<>();
        List<Map<String, Object>> checklistCol2 = new ArrayList<>();
        if (!checklistData.isEmpty()) {
            int mid = (checklistData.size() + 1) / 2;
            checklistCol1 = new ArrayList<>(checklistData.subList(0, mid));
            checklistCol2 = new ArrayList<>(checklistData.subList(mid, checklistData.size()));
        }
        data.put("checklistCol1", checklistCol1);
        data.put("checklistCol2", checklistCol2);

        // Cabeçalho da empresa (nome/logo), sem CNPJ/endereço administrativo
        Company company = null;
        try {
            company = resolveCompany(order);
            if (company != null) {
                data.put("companyName", company.getName());
                data.put("companyLogo", loadLogoAsDataUri(company.getLogoUrl()));
            }
        } catch (Exception e) {
            log.warn("Aviso ao resolver empresa para PDF do motorista da OS {}: {}", order.getId(), e.getMessage());
        }

        return data;
    }

    private void populateDriverAndRequestDate(Map<String, Object> data, FleetWorkOrder order) {
        String driverName = order.getDriverName();
        if (driverName == null || driverName.isBlank()) {
            String extracted = com.z7design.fleet_manager.dto.FleetWorkOrderDTO.extractDriverFromText(
                    order.getNotes(), order.getAnomaliesDescription(), order.getStopReason());
            if (extracted != null && !extracted.isBlank()) {
                driverName = extracted;
            } else if (order.getVehicle() != null && order.getVehicle().getAssignedDriver() != null) {
                driverName = order.getVehicle().getAssignedDriver();
            }
        }
        data.put("driverName", driverName);

        LocalDate reqDate = order.getRequestDate() != null ? order.getRequestDate()
                : (order.getStopDate() != null ? order.getStopDate()
                        : (order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : null));
        data.put("requestDate", reqDate != null ? reqDate.format(DATE_FMT) : null);
    }

    private String joinLocation(String name, String address) {
        StringBuilder location = new StringBuilder();
        if (name != null && !name.isBlank()) {
            location.append(name.trim());
        }
        if (address != null && !address.isBlank()) {
            if (!location.isEmpty()) {
                location.append(" — ");
            }
            location.append(address.trim());
        }
        return location.isEmpty() ? null : location.toString();
    }

    private Map<String, Object> buildDataMap(FleetWorkOrder order, boolean blankChecklist) {
        Map<String, Object> data = new HashMap<>();
        data.put("blankChecklist", blankChecklist);

        String osNumber = order.getOsNumber() != null ? order.getOsNumber()
                : "#" + (order.getId() != null ? order.getId().toString().split("-")[0] : "");

        data.put("osNumber", osNumber);
        data.put("maintenanceType",
                order.getMaintenanceType() != null ? order.getMaintenanceType().name() : "CORRETIVA");
        data.put("dataEmissao", LocalDate.now().format(DATE_FMT));
        data.put("dataGeracao", LocalDateTime.now().format(DATETIME_FMT));

        // Identificação
        data.put("vehiclePlate", order.getVehicle() != null ? order.getVehicle().getPlate() : null);
        data.put("vehicleModel", order.getVehicle() != null ? order.getVehicle().getModel() : null);
        data.put("vehicleBrand", order.getVehicle() != null ? order.getVehicle().getBrand() : null);
        data.put("planoManutencao", (order.getPlan() != null && order.getPlan().getTaskName() != null)
                ? order.getPlan().getTaskName()
                : null);
        String resolvedMechanic = order.getMechanicName();
        if (resolvedMechanic == null || resolvedMechanic.isBlank()) {
            String extracted = com.z7design.fleet_manager.dto.FleetWorkOrderDTO.extractDriverFromText(order.getNotes(),
                    order.getAnomaliesDescription(), order.getStopReason());
            if (extracted != null && !extracted.isBlank()) {
                resolvedMechanic = extracted;
            }
            if ((resolvedMechanic == null || resolvedMechanic.isBlank()) && order.getVehicle() != null) {
                if (order.getVehicle().getResponsibleEmployee() != null) {
                    resolvedMechanic = order.getVehicle().getResponsibleEmployee().getName();
                } else if (order.getVehicle().getAssignedDriver() != null
                        && !order.getVehicle().getAssignedDriver().isBlank()) {
                    resolvedMechanic = order.getVehicle().getAssignedDriver() + " (Motorista)";
                }
            }
        }
        data.put("mechanicName", resolvedMechanic);
        data.put("mecanicoAssinatura", resolvedMechanic);
        data.put("laborType", formatLaborType(order.getLaborType()));
        data.put("status", formatStatus(order.getStatus()));
        data.put("prioridade", formatPriority(order.getPriority()));
        data.put("dataPlanejada", order.getPlannedDate() != null ? order.getPlannedDate().format(DATE_FMT) : null);
        data.put("dataEntrada", order.getActualDate() != null ? order.getActualDate().format(DATE_FMT) : null);
        data.put("dataEntregue",
                order.getExitDate() != null ? order.getExitDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT));
        data.put("stopDate", order.getStopDate() != null ? order.getStopDate().format(DATE_FMT) : null);
        data.put("stopTime", order.getStopTime());
        data.put("exitDate", order.getExitDate() != null ? order.getExitDate().format(DATE_FMT) : null);
        data.put("exitTime", order.getExitTime());
        populateDriverAndRequestDate(data, order);
        data.put("aggregateInfo", order.getAggregateInfo());

        // Obra / Cliente
        try {
            WorkPost obra = order.getWorkPost();
            if (obra == null && order.getVehicle() != null) {
                obra = order.getVehicle().getWorkPostEntity();
            }
            if (obra != null) {
                data.put("workPostName", obra.getName());
                data.put("clientName", obra.getClient() != null ? obra.getClient().getName() : null);
            } else {
                data.put("workPostName", null);
                data.put("clientName", null);
            }
        } catch (Exception e) {
            log.warn("Aviso ao resolver Obra/Cliente da OS {}: {}", order.getId(), e.getMessage());
            data.put("workPostName", null);
            data.put("clientName", null);
        }

        data.put("odometerIn", order.getOdometerIn() != null ? formatKm(order.getOdometerIn()) : null);
        data.put("odometerOut", order.getOdometerOut() != null ? formatKm(order.getOdometerOut()) : null);
        data.put("tempoParado", formatDowntime(order.getDowntimeHours(), order.getDowntimeDays()));

        // Tempo de Execução do Serviço
        data.put("executionStartDate",
                order.getExecutionStartDate() != null ? order.getExecutionStartDate().format(DATETIME_FMT) : null);
        data.put("executionEndDate",
                order.getExecutionEndDate() != null ? order.getExecutionEndDate().format(DATETIME_FMT) : null);
        data.put("tempoExecucao", formatExecutionDuration(order.getExecutionDurationMinutes()));
        data.put("executionStartJustification", order.getExecutionStartJustification());

        // Descrições PRD
        data.put("anomaliesDescription", order.getAnomaliesDescription());
        data.put("otherDescription", order.getOtherDescription());
        data.put("maintenancePerformed", order.getMaintenancePerformed());
        data.put("stopReason", order.getStopReason());

        // Assinaturas digitais (imagem data:image/...) vs linha vazia para assinatura
        // manual
        String respName = resolvePersonNameById(order.getResponsibleId());
        if (respName == null || respName.isBlank()) {
            respName = order.getMechanicName();
        }
        String supName = resolvePersonNameById(order.getSupervisorId());

        String techSigRaw = order.getResponsibleSignature();
        boolean hasTechDigitalSig = techSigRaw != null && techSigRaw.trim().startsWith("data:image/");
        String supSigRaw = order.getSupervisorSignature();
        boolean hasSupDigitalSig = supSigRaw != null && supSigRaw.trim().startsWith("data:image/");

        data.put("responsibleSignatureImg", hasTechDigitalSig ? techSigRaw.trim() : null);
        data.put("responsibleDisplayName", respName);
        data.put("responsibleSignature", hasTechDigitalSig ? techSigRaw.trim() : null);
        data.put("responsibleSignatureDate", (hasTechDigitalSig && order.getResponsibleSignatureDate() != null)
                ? order.getResponsibleSignatureDate().format(DATETIME_FMT)
                : null);

        data.put("supervisorSignatureImg", hasSupDigitalSig ? supSigRaw.trim() : null);
        data.put("supervisorDisplayName", supName);
        data.put("supervisorSignature", hasSupDigitalSig ? supSigRaw.trim() : null);
        data.put("supervisorSignatureDate", (hasSupDigitalSig && order.getSupervisorSignatureDate() != null)
                ? order.getSupervisorSignatureDate().format(DATETIME_FMT)
                : null);

        // Conferência dos Serviços e Liberação do Veículo
        data.put("servicesVerified", order.getServicesVerified());
        data.put("releaseDate", order.getReleaseDate() != null ? order.getReleaseDate().format(DATE_FMT) : null);
        data.put("releaseTime", order.getReleaseTime());
        data.put("releasedByName", order.getReleasedByName());
        String relSigRaw = order.getReleaseSignature();
        boolean hasRelDigitalSig = relSigRaw != null && relSigRaw.trim().startsWith("data:image/");
        data.put("releaseSignatureImg", hasRelDigitalSig ? relSigRaw.trim() : null);
        data.put("releaseSignatureDate", (hasRelDigitalSig && order.getReleaseSignatureDate() != null)
                ? order.getReleaseSignatureDate().format(DATETIME_FMT)
                : null);

        // Checklist Items (para OS Preventiva ou quando solicitado em branco)
        List<Map<String, Object>> checklistData = new ArrayList<>();
        try {
            if (order.getChecklistItems() != null && !order.getChecklistItems().isEmpty()) {
                for (com.z7design.fleet_manager.model.FleetWorkOrderChecklist cItem : order.getChecklistItems()) {
                    if (cItem == null)
                        continue;
                    Map<String, Object> cMap = new HashMap<>();
                    String desc = "";
                    String cat = "GERAL";
                    if (cItem.getChecklistItem() != null) {
                        desc = cItem.getChecklistItem().getDescricao() != null ? cItem.getChecklistItem().getDescricao()
                                : "";
                        cat = cItem.getChecklistItem().getCategoria() != null ? cItem.getChecklistItem().getCategoria()
                                : "GERAL";
                    }
                    cMap.put("itemDescricao", desc);
                    cMap.put("categoria", cat);
                    cMap.put("situacao", blankChecklist ? "BLANK"
                            : (cItem.getSituacao() != null ? cItem.getSituacao().name() : "BLANK"));
                    cMap.put("observacao", blankChecklist ? null : cItem.getObservacao());
                    cMap.put("reparoRealizado", blankChecklist ? null : cItem.getReparoRealizado());
                    checklistData.add(cMap);
                }
            } else if ((order
                    .getMaintenanceType() == com.z7design.fleet_manager.model.FleetWorkOrder.MaintenanceType.PREVENTIVA
                    || blankChecklist) && checklistItemRepository != null) {
                String vType = "";
                if (order.getVehicle() != null) {
                    if (order.getVehicle().getVehicleType() != null)
                        vType += order.getVehicle().getVehicleType().name();
                    if (order.getVehicle().getModel() != null)
                        vType += " " + order.getVehicle().getModel();
                }
                String vtUpper = vType.toUpperCase();
                boolean isVan = vtUpper.contains("VAN") || vtUpper.contains("SPRINTER") || vtUpper.contains("DUCATO")
                        || vtUpper.contains("MASTER") || vtUpper.contains("TRANSIT");
                boolean isMicro = vtUpper.contains("MINIBUS") || vtUpper.contains("MICRO") || vtUpper.contains("VOLARE")
                        || vtUpper.contains("SENIOR");
                List<String> targetTypes = isVan ? List.of("VAN", "ALL")
                        : (isMicro ? List.of("MINIBUS", "MICRO", "BUS", "ALL") : List.of("BUS", "ALL"));
                var masterItems = checklistItemRepository
                        .findByVehicleTypeApplicableInAndAtivoTrueOrderByOrdemAsc(targetTypes);
                for (var m : masterItems) {
                    Map<String, Object> cMap = new HashMap<>();
                    cMap.put("itemDescricao", m.getDescricao() != null ? m.getDescricao() : "");
                    cMap.put("categoria", m.getCategoria() != null ? m.getCategoria() : "GERAL");
                    cMap.put("situacao", blankChecklist ? "BLANK" : "OK");
                    cMap.put("observacao", null);
                    cMap.put("reparoRealizado", null);
                    checklistData.add(cMap);
                }
            }
        } catch (Exception e) {
            log.warn("Aviso ao mapear itens de checklist da OS {}: {}", order.getId(), e.getMessage());
        }
        data.put("checklistItems", checklistData);

        // Agrupamento ordenado do checklist por Grupo/Categoria oficial (1 a 18)
        Map<String, List<Map<String, Object>>> checklistByGroup = new LinkedHashMap<>();
        for (Map<String, Object> cMap : checklistData) {
            String cat = (String) cMap.getOrDefault("categoria", "GERAL");
            checklistByGroup.computeIfAbsent(cat, k -> new ArrayList<>()).add(cMap);
        }
        data.put("checklistByGroup", checklistByGroup);

        // Divide o checklist em 2 colunas equilibradas para templates compactos
        List<Map<String, Object>> checklistCol1 = new ArrayList<>();
        List<Map<String, Object>> checklistCol2 = new ArrayList<>();
        if (!checklistData.isEmpty()) {
            int mid = (checklistData.size() + 1) / 2;
            checklistCol1 = new ArrayList<>(checklistData.subList(0, mid));
            checklistCol2 = new ArrayList<>(checklistData.subList(mid, checklistData.size()));
        }
        data.put("checklistCol1", checklistCol1);
        data.put("checklistCol2", checklistCol2);

        // Itens
        List<Map<String, Object>> itens = new ArrayList<>();
        try {
            if (order.getItems() != null) {
                for (WorkOrderItem item : order.getItems()) {
                    if (item == null)
                        continue;
                    Map<String, Object> itemMap = new HashMap<>();
                    String desc = item.getDescription();
                    if (item.getCode() != null && !item.getCode().isBlank()) {
                        desc = "[" + item.getCode() + "] " + desc;
                    }
                    if (Boolean.TRUE.equals(item.getRequiresApproval())) {
                        if (Boolean.TRUE.equals(item.getApproved())) {
                            desc += " (Aprovado por " + (item.getApprovedBy() != null ? item.getApprovedBy() : "Gestor")
                                    + ")";
                        } else {
                            desc += " (Aguardando Aprovação do Gestor)";
                        }
                    }
                    itemMap.put("codigo", item.getCode() != null ? item.getCode() : "-");
                    itemMap.put("descricao", desc);
                    itemMap.put("tipo", item.getType() == WorkOrderItem.ItemType.LABOR ? "Serviço" : "Peça");
                    itemMap.put("quantidade", formatQuantity(item.getQuantity()));
                    itemMap.put("unitario", formatCurrency(item.getUnitPrice()));
                    itemMap.put("total", formatCurrency(item.getTotalPrice()));
                    itens.add(itemMap);
                }
            }
        } catch (Exception e) {
            log.warn("Aviso ao mapear itens de peças/serviços da OS {}: {}", order.getId(), e.getMessage());
        }
        data.put("itens", itens);

        // Custos
        data.put("laborCost", formatCurrency(order.getLaborCost()));
        data.put("partsCost", formatCurrency(order.getPartsCost()));
        data.put("totalCost", formatCurrency(order.getTotalCost()));

        // Observações
        data.put("observacoes", order.getNotes());

        // Evidências Fotográficas / Fotos
        List<String> processedPhotos = new ArrayList<>();
        try {
            Set<String> rawPhotoCandidates = new LinkedHashSet<>();
            if (order.getPhotoAttachments() != null) {
                for (String p : order.getPhotoAttachments()) {
                    if (p != null && !p.isBlank()) {
                        rawPhotoCandidates.add(p.trim());
                    }
                }
            }

            // Se a OS não tiver fotos próprias (ex: criada via Checklist Diário do
            // Motorista ou Laudo),
            // busca automaticamente as evidências vinculadas ao veículo/checklist/inspeção
            if (rawPhotoCandidates.isEmpty()) {
                rawPhotoCandidates.addAll(collectFallbackEvidenceUrls(order));
            }

            for (String photo : rawPhotoCandidates) {
                String uri = processPhotoAsDataUri(photo);
                if (uri != null && !uri.isBlank()) {
                    processedPhotos.add(uri);
                }
            }

            // Se as URLs primárias da OS falharem na leitura em disco, tenta também o
            // fallback do checklist/inspeção
            if (processedPhotos.isEmpty()) {
                for (String fallbackPhoto : collectFallbackEvidenceUrls(order)) {
                    String uri = processPhotoAsDataUri(fallbackPhoto);
                    if (uri != null && !uri.isBlank()) {
                        processedPhotos.add(uri);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Aviso ao processar fotos da OS {}: {}", order.getId(), e.getMessage());
        }
        boolean hasPhotos = !processedPhotos.isEmpty();
        data.put("hasPhotos", hasPhotos);
        data.put("photos", processedPhotos);

        // Agrupar fotos em linhas de 4 para tabela no PDF
        List<List<String>> photoRows = new ArrayList<>();
        for (int i = 0; i < processedPhotos.size(); i += 4) {
            photoRows.add(processedPhotos.subList(i, Math.min(i + 4, processedPhotos.size())));
        }
        data.put("photoRows", photoRows);

        // Empresa (nome/logo para o cabeçalho do PDF)
        Company company = null;
        try {
            company = resolveCompany(order);
            if (company != null) {
                data.put("companyName", company.getName());
                data.put("companyCnpj", CompanyDataFormatter.formatCnpjForHeader(company));
                data.put("companyAddress", CompanyDataFormatter.formatFullAddress(company));
                data.put("companyLogo", loadLogoAsDataUri(company.getLogoUrl()));
            }
        } catch (Exception e) {
            log.warn("Aviso ao resolver dados de empresa para PDF da OS {}: {}", order.getId(), e.getMessage());
        }

        // Local de Execução da Manutenção (Opção A: Garagem / Unidade com fallback para
        // Empresa)
        String localManutencao = null;
        try {
            if (order.getGarage() != null) {
                localManutencao = order.getGarage().getName();
                if (order.getGarage().getAddress() != null && !order.getGarage().getAddress().isBlank()) {
                    localManutencao += " — " + order.getGarage().getAddress();
                }
            } else if (order.getVehicle() != null && order.getVehicle().getGarage() != null) {
                localManutencao = order.getVehicle().getGarage().getName();
                if (order.getVehicle().getGarage().getAddress() != null
                        && !order.getVehicle().getGarage().getAddress().isBlank()) {
                    localManutencao += " — " + order.getVehicle().getGarage().getAddress();
                }
            } else if (order.getWorkPost() != null) {
                localManutencao = order.getWorkPost().getName();
                if (order.getWorkPost().getAddress() != null && !order.getWorkPost().getAddress().isBlank()) {
                    localManutencao += " — " + order.getWorkPost().getAddress();
                }
            } else if (company != null && company.getAddress() != null) {
                localManutencao = CompanyDataFormatter.formatFullAddress(company);
            }
        } catch (Exception e) {
            log.warn("Aviso ao resolver local de manutenção da OS {}: {}", order.getId(), e.getMessage());
        }
        data.put("manutencaoRealizadaEm", localManutencao);

        return data;
    }

    /**
     * Resolve a empresa da OS: prioriza o companyId da ordem, com fallback
     * para o tenant da requisição atual (JWT).
     */
    private Company resolveCompany(FleetWorkOrder order) {
        try {
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
        } catch (Exception e) {
            log.warn("Erro ao resolver empresa da OS {}: {}", order.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Carrega o logo da empresa e converte para data URI (base64) para ser
     * embutido diretamente no HTML do PDF (evita dependência de rede/base URL).
     */
    private String loadLogoAsDataUri(String logoUrl) {
        if (logoUrl == null || logoUrl.isBlank()) {
            return null;
        }
        String cleanUrl = logoUrl.trim();
        try {
            if (cleanUrl.startsWith("data:image/")) {
                int commaIdx = cleanUrl.indexOf(',');
                if (commaIdx > 0) {
                    byte[] rawDataBytes = Base64.getDecoder()
                            .decode(cleanUrl.substring(commaIdx + 1).replaceAll("\\s+", ""));
                    String normalized = flattenLogoOntoWhite(rawDataBytes);
                    if (normalized != null) {
                        return normalized;
                    }
                }
                return processPhotoAsDataUri(cleanUrl);
            }

            byte[] bytes = null;
            if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
                try {
                    bytes = new URL(cleanUrl).openStream().readAllBytes();
                } catch (Exception netEx) {
                    log.debug("Falha ao baixar logo por URL ({}), tentando disco/banco: {}", cleanUrl,
                            netEx.getMessage());
                }
            }

            if (bytes == null || bytes.length == 0) {
                Path logoPath = resolveLogoPath(cleanUrl);
                if (logoPath != null && Files.exists(logoPath) && Files.isRegularFile(logoPath)) {
                    bytes = Files.readAllBytes(logoPath);
                }
            }

            if (bytes == null || bytes.length == 0) {
                String filenameOnly = extractFilenameFromUrl(cleanUrl);
                if (filenameOnly != null && storedUploadService != null) {
                    var dbLogo = storedUploadService.find("companies/logos", filenameOnly);
                    if (dbLogo.isPresent() && dbLogo.get().getData() != null && dbLogo.get().getData().length > 0) {
                        bytes = dbLogo.get().getData();
                    }
                }
            }

            if (bytes == null || bytes.length == 0) {
                log.warn("Logo da empresa não encontrado em disco nem no banco: {}", logoUrl);
                return null;
            }

            String lower = cleanUrl.split("[?#]")[0].toLowerCase();
            if (lower.endsWith(".svg")) {
                return null; // Flying Saucer não renderiza SVG diretamente
            }

            // Converte para RGB sobre fundo branco (e remove eventual fundo preto conectado às bordas)
            // para evitar que transparência de PNG/WEBP seja renderizada em preto pelo Flying Saucer/iText
            String normalized = flattenLogoOntoWhite(bytes);
            if (normalized != null) {
                return normalized;
            }

            String mime = "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mime = "image/jpeg";
            } else if (lower.endsWith(".gif")) {
                mime = "image/gif";
            }
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Erro ao carregar logo da empresa ({}): {}", logoUrl, e.getMessage());
            return null;
        }
    }

    /**
     * Normaliza a logomarca para PNG RGB sobre fundo branco puro.
     * Se as bordas tiverem fundo preto sólido opaco, remove-o por flood-fill
     * conectado às extremidades preservando o conteúdo colorido interno.
     */
    private String flattenLogoOntoWhite(byte[] bytes) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
            if (img == null || img.getWidth() <= 0 || img.getHeight() <= 0) {
                return null;
            }
            int w = img.getWidth();
            int h = img.getHeight();

            BufferedImage argb = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gArgb = argb.createGraphics();
            gArgb.drawImage(img, 0, 0, null);
            gArgb.dispose();

            removeOuterBlackBackground(argb);

            BufferedImage whiteRgb = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            Graphics2D gWhite = whiteRgb.createGraphics();
            gWhite.setColor(Color.WHITE);
            gWhite.fillRect(0, 0, w, h);
            gWhite.drawImage(argb, 0, 0, null);
            gWhite.dispose();

            ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
            if (ImageIO.write(whiteRgb, "png", pngOut)) {
                return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngOut.toByteArray());
            }
        } catch (Exception e) {
            log.debug("Falha ao normalizar fundo da logomarca: {}", e.getMessage());
        }
        return null;
    }

    private void removeOuterBlackBackground(BufferedImage argb) {
        int w = argb.getWidth();
        int h = argb.getHeight();
        int[][] corners = { { 0, 0 }, { w - 1, 0 }, { 0, h - 1 }, { w - 1, h - 1 } };
        boolean hasOpaqueDarkCorner = false;
        for (int[] c : corners) {
            if (isNeutralNearBlackOpaque(argb.getRGB(c[0], c[1]), 28, 16)) {
                hasOpaqueDarkCorner = true;
                break;
            }
        }
        if (!hasOpaqueDarkCorner) {
            return;
        }

        boolean[] visited = new boolean[w * h];
        java.util.ArrayDeque<Integer> queue = new java.util.ArrayDeque<>();

        for (int x = 0; x < w; x++) {
            enqueueIfDark(argb, x, 0, w, visited, queue);
            if (h > 1) {
                enqueueIfDark(argb, x, h - 1, w, visited, queue);
            }
        }
        for (int y = 1; y < h - 1; y++) {
            enqueueIfDark(argb, 0, y, w, visited, queue);
            if (w > 1) {
                enqueueIfDark(argb, w - 1, y, w, visited, queue);
            }
        }

        while (!queue.isEmpty()) {
            int pos = queue.poll();
            int x = pos % w;
            int y = pos / w;
            argb.setRGB(x, y, 0x00000000);

            if (x > 0) enqueueIfDark(argb, x - 1, y, w, visited, queue);
            if (x + 1 < w) enqueueIfDark(argb, x + 1, y, w, visited, queue);
            if (y > 0) enqueueIfDark(argb, x, y - 1, w, visited, queue);
            if (y + 1 < h) enqueueIfDark(argb, x, y + 1, w, visited, queue);
        }
    }

    private void enqueueIfDark(BufferedImage argb, int x, int y, int w, boolean[] visited, java.util.ArrayDeque<Integer> queue) {
        int idx = y * w + x;
        if (visited[idx]) {
            return;
        }
        visited[idx] = true;
        if (isNeutralNearBlackOpaque(argb.getRGB(x, y), 32, 18)) {
            queue.add(idx);
        }
    }

    private boolean isNeutralNearBlackOpaque(int pixel, int maxLuminance, int maxSpread) {
        int a = (pixel >>> 24) & 0xFF;
        if (a < 200) {
            return false;
        }
        int r = (pixel >>> 16) & 0xFF;
        int g = (pixel >>> 8) & 0xFF;
        int b = pixel & 0xFF;
        int max = Math.max(r, Math.max(g, b));
        int min = Math.min(r, Math.min(g, b));
        return max <= maxLuminance && (max - min) <= maxSpread;
    }

    private String extractFilenameFromUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank())
            return null;
        String clean = rawUrl.replace("\\", "/").split("[?#]")[0].trim();
        int lastSlash = clean.lastIndexOf('/');
        String name = lastSlash >= 0 ? clean.substring(lastSlash + 1) : clean;
        return name.isBlank() ? null : name;
    }

    private Path resolveLogoPath(String logoUrl) {
        try {
            String clean = logoUrl.replace("\\", "/").split("[?#]")[0].trim();
            if (clean.startsWith("http://") || clean.startsWith("https://")) {
                try {
                    clean = new URL(clean).getPath();
                } catch (Exception ignored) {
                }
            }
            String filename = extractFilenameFromUrl(clean);
            if (filename == null)
                return null;

            List<Path> candidates = new ArrayList<>();
            if (uploadDir != null && !uploadDir.isBlank()) {
                candidates.add(Paths.get(uploadDir, "companies", "logos", filename).toAbsolutePath().normalize());
                candidates.add(Paths.get(uploadDir, filename).toAbsolutePath().normalize());
            }
            candidates
                    .add(Paths.get("/var/www/fluxbus/uploads/companies/logos", filename).toAbsolutePath().normalize());
            candidates.add(Paths.get("/app/uploads/companies/logos", filename).toAbsolutePath().normalize());
            candidates.add(Paths.get("uploads", "companies", "logos", filename).toAbsolutePath().normalize());
            candidates.add(Paths.get("..", "uploads", "companies", "logos", filename).toAbsolutePath().normalize());

            for (Path candidate : candidates) {
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate;
                }
            }
            return candidates.get(0);
        } catch (Exception e) {
            log.warn("Erro ao resolver caminho do logo ({}): {}", logoUrl, e.getMessage());
            return null;
        }
    }

    /**
     * Coleta evidências fotográficas vinculadas ao mesmo veículo em Checklists
     * Diários
     * (VehicleGateChecklist), Laudos de Inspeção (VehicleInspection) ou galeria do
     * veículo
     * quando a OS não possui fotos diretamente em fleet_work_order_photos.
     */
    private List<String> collectFallbackEvidenceUrls(FleetWorkOrder order) {
        Set<String> urls = new LinkedHashSet<>();
        if (order == null || order.getVehicle() == null) {
            return new ArrayList<>(urls);
        }

        LocalDate refDate = order.getStopDate() != null
                ? order.getStopDate()
                : (order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now());

        // 1. Buscar em Checklists de Portaria / Motorista (VehicleGateChecklist) do
        // veículo
        try {
            UUID vehicleId = order.getVehicle().getId();
            if (vehicleId != null) {
                List<VehicleGateChecklist> checklists = vehicleGateChecklistRepository
                        .findByVehicleIdOrderByOccurredAtDesc(vehicleId);
                if (checklists != null && !checklists.isEmpty()) {
                    // Prioriza checklists do mesmo dia da OS (ou até +/- 2 dias)
                    for (VehicleGateChecklist chk : checklists) {
                        if (chk.getOccurredAt() != null) {
                            LocalDate chkDate = chk.getOccurredAt().toLocalDate();
                            if (Math.abs(java.time.temporal.ChronoUnit.DAYS.between(refDate, chkDate)) <= 2) {
                                addSplitUrls(urls, chk.getVehiclePhotos());
                                addSplitUrls(urls, chk.getOdometerPhotoUrl());
                            }
                        }
                        if (urls.size() >= 8)
                            break;
                    }
                    // Se ainda estiver vazio, pega o checklist mais recente que possua fotos
                    if (urls.isEmpty()) {
                        for (VehicleGateChecklist chk : checklists) {
                            addSplitUrls(urls, chk.getVehiclePhotos());
                            addSplitUrls(urls, chk.getOdometerPhotoUrl());
                            if (!urls.isEmpty())
                                break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Fallback de fotos via VehicleGateChecklist ignorado: {}", e.getMessage());
        }

        // 2. Buscar em Laudos de Inspeção (VehicleInspection) pela placa do veículo
        if (urls.isEmpty()) {
            try {
                String plate = order.getVehicle().getPlate();
                if (plate != null && !plate.isBlank()) {
                    List<VehicleInspection> inspections = vehicleInspectionRepository
                            .findByVehiclePlateIgnoreCase(plate.trim());
                    if (inspections != null && !inspections.isEmpty()) {
                        for (VehicleInspection insp : inspections) {
                            if (insp.getDeletedAt() == null && insp.getEvidencesUrls() != null
                                    && !insp.getEvidencesUrls().isBlank()) {
                                addSplitUrls(urls, insp.getEvidencesUrls());
                                if (!urls.isEmpty())
                                    break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Fallback de fotos via VehicleInspection ignorado: {}", e.getMessage());
            }
        }

        // 3. Fallback final: galeria de fotos do próprio veículo (alimentada pelo
        // checklist do motorista)
        if (urls.isEmpty()) {
            try {
                addSplitUrls(urls, order.getVehicle().getPhotos());
            } catch (Exception ignored) {
            }
        }

        List<String> result = new ArrayList<>(urls);
        return result.size() > 8 ? result.subList(0, 8) : result;
    }

    private void addSplitUrls(Set<String> target, String raw) {
        if (raw == null || raw.isBlank())
            return;
        String trimmed = raw.trim();
        if (trimmed.startsWith("data:image/")) {
            target.add(trimmed);
            return;
        }
        // Remove colchetes caso esteja salvo como JSON array ["url1","url2"]
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        for (String part : trimmed.split(",")) {
            String clean = part.trim().replaceAll("^\"|\"$", "");
            if (!clean.isBlank()) {
                target.add(clean);
            }
        }
    }

    /**
     * Processa fotos anexadas para formato data URI (base64) para renderização
     * direta no PDF.
     * Converte imagens para JPEG padrão RGB quando possível para máxima
     * compatibilidade com Flying Saucer / iText.
     */
    private String processPhotoAsDataUri(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return null;
        }
        String trimmed = photoUrl.trim();
        try {
            byte[] bytes = null;
            String mime = "image/jpeg";

            if (trimmed.startsWith("data:image/")) {
                int commaIdx = trimmed.indexOf(',');
                if (commaIdx > 0) {
                    String header = trimmed.substring(0, commaIdx).toLowerCase();
                    String base64Part = trimmed.substring(commaIdx + 1).replaceAll("\\s+", "");
                    // Se já for JPEG ou PNG válido e não WebP, podemos normalizar ou retornar
                    // direto
                    if (!header.contains("webp")) {
                        return trimmed;
                    }
                    bytes = Base64.getDecoder().decode(base64Part);
                } else {
                    return trimmed;
                }
            } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                try {
                    bytes = new URL(trimmed).openStream().readAllBytes();
                } catch (Exception netEx) {
                    Path localFallback = resolvePhotoPath(trimmed);
                    if (localFallback != null && Files.exists(localFallback)) {
                        bytes = Files.readAllBytes(localFallback);
                    }
                }
                if ((bytes == null || bytes.length == 0) && storedUploadService != null) {
                    String fn = extractFilenameFromUrl(trimmed);
                    var dbPhoto = storedUploadService.find("maintenance", fn);
                    if (dbPhoto.isPresent()) {
                        bytes = dbPhoto.get().getData();
                    }
                }
            } else {
                Path photoPath = resolvePhotoPath(trimmed);
                if (photoPath != null && Files.exists(photoPath)) {
                    bytes = Files.readAllBytes(photoPath);
                } else if (storedUploadService != null) {
                    String fn = extractFilenameFromUrl(trimmed);
                    var dbPhoto = storedUploadService.find("maintenance", fn);
                    if (dbPhoto.isPresent()) {
                        bytes = dbPhoto.get().getData();
                    }
                }
                if (bytes == null || bytes.length == 0) {
                    log.warn("Foto da OS não encontrada em disco nem no banco: {}", trimmed);
                    return null;
                }
            }

            if (bytes == null || bytes.length == 0) {
                return null;
            }

            // Tenta normalizar para RGB JPEG via ImageIO (garante compatibilidade total com
            // Flying Saucer/iText)
            try {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
                if (img != null && img.getWidth() > 0 && img.getHeight() > 0) {
                    // Redimensiona se for muito grande (> 1200px) para manter o PDF leve e rápido
                    int maxDim = 1200;
                    int w = img.getWidth();
                    int h = img.getHeight();
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.max(1, (int) Math.round((double) h * maxDim / w));
                            w = maxDim;
                        } else {
                            w = Math.max(1, (int) Math.round((double) w * maxDim / h));
                            h = maxDim;
                        }
                    }
                    BufferedImage rgbImage = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g2d = rgbImage.createGraphics();
                    g2d.setColor(Color.WHITE);
                    g2d.fillRect(0, 0, w, h);
                    g2d.drawImage(img, 0, 0, w, h, null);
                    g2d.dispose();

                    ByteArrayOutputStream jpegOut = new ByteArrayOutputStream();
                    if (ImageIO.write(rgbImage, "jpg", jpegOut)) {
                        byte[] jpegBytes = jpegOut.toByteArray();
                        if (jpegBytes.length > 0) {
                            return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(jpegBytes);
                        }
                    }
                }
            } catch (Exception imgEx) {
                log.debug("Normalização ImageIO ignorada para {}: {}", trimmed, imgEx.getMessage());
            }

            String lower = trimmed.toLowerCase();
            String pathOnly = lower.split("[?#]")[0];
            if (pathOnly.endsWith(".png")) {
                mime = "image/png";
            } else if (pathOnly.endsWith(".gif")) {
                mime = "image/gif";
            } else if (pathOnly.endsWith(".bmp")) {
                mime = "image/bmp";
            }
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Erro ao processar foto da OS ({}): {}", photoUrl, e.getMessage());
            return null;
        }
    }

    /**
     * Resolve o caminho em disco de uma foto da OS a partir da URL armazenada.
     * Aceita as variações "/api/uploads/...", "api/uploads/...", "/uploads/...",
     * "uploads/...", caminhos absolutos e nomes de arquivo simples, testando
     * múltiplas raízes (uploads local/container, uploadDir, maintenanceUploadDir,
     * /app/uploads, /var/www/fluxbus/uploads e ../uploads).
     */
    private Path resolvePhotoPath(String photoUrl) {
        try {
            String relative = photoUrl.replace("\\", "/").trim();

            // Remove query string e fragmento (ex: "/api/uploads/maintenance/x.jpg?v=2")
            int queryIdx = relative.indexOf('?');
            if (queryIdx >= 0) {
                relative = relative.substring(0, queryIdx);
            }
            int fragmentIdx = relative.indexOf('#');
            if (fragmentIdx >= 0) {
                relative = relative.substring(0, fragmentIdx);
            }

            // Se for uma URL completa do próprio sistema (ex:
            // https://ci.fluxbus.com.br/api/uploads/maintenance/x.jpg),
            // extrai apenas o path
            if (relative.startsWith("http://") || relative.startsWith("https://")) {
                try {
                    relative = new URL(relative).getPath();
                } catch (Exception ignored) {
                }
            }

            // Normaliza prefixos conhecidos para o caminho relativo dentro do diretório de
            // uploads
            if (relative.startsWith("/api/uploads/")) {
                relative = relative.substring("/api/uploads/".length());
            } else if (relative.startsWith("api/uploads/")) {
                relative = relative.substring("api/uploads/".length());
            } else if (relative.startsWith("/uploads/")) {
                relative = relative.substring("/uploads/".length());
            } else if (relative.startsWith("uploads/")) {
                relative = relative.substring("uploads/".length());
            }
            relative = relative.replaceFirst("^/+", "");

            String filenameOnly = relative.contains("/")
                    ? relative.substring(relative.lastIndexOf('/') + 1)
                    : relative;

            java.util.List<Path> candidates = new ArrayList<>();
            // 1. Diretórios relativos de execução (Docker /app/uploads e local
            // backend/uploads)
            candidates.add(Paths.get("uploads", relative).toAbsolutePath().normalize());
            if (maintenanceUploadDir != null && !maintenanceUploadDir.isBlank()) {
                candidates.add(Paths.get(maintenanceUploadDir, filenameOnly).toAbsolutePath().normalize());
                candidates.add(Paths.get(maintenanceUploadDir, relative).toAbsolutePath().normalize());
            }
            // 2. Diretório configurado em app.upload.dir
            if (uploadDir != null && !uploadDir.isBlank()) {
                candidates.add(Paths.get(uploadDir, relative).toAbsolutePath().normalize());
                candidates.add(Paths.get(uploadDir, "maintenance", filenameOnly).toAbsolutePath().normalize());
            }
            // 3. Caminhos padrão de container Docker e servidores Linux
            candidates.add(Paths.get("/app/uploads", relative).toAbsolutePath().normalize());
            candidates.add(Paths.get("/app/uploads/maintenance", filenameOnly).toAbsolutePath().normalize());
            candidates.add(Paths.get("/var/www/fluxbus/uploads", relative).toAbsolutePath().normalize());
            candidates
                    .add(Paths.get("/var/www/fluxbus/uploads/maintenance", filenameOnly).toAbsolutePath().normalize());
            candidates.add(Paths.get("/var/www/fluxbus-dev/uploads", relative).toAbsolutePath().normalize());
            // 4. Caminhos de workspace local (raiz do monorepo / backend)
            candidates.add(Paths.get("..", "uploads", relative).toAbsolutePath().normalize());
            candidates.add(Paths.get("..", "uploads", "maintenance", filenameOnly).toAbsolutePath().normalize());
            candidates.add(Paths.get("backend", "uploads", relative).toAbsolutePath().normalize());
            candidates.add(Paths.get("backend", "uploads", "maintenance", filenameOnly).toAbsolutePath().normalize());
            candidates.add(Paths.get("uploads", "maintenance", filenameOnly).toAbsolutePath().normalize());
            candidates.add(Paths.get(relative).toAbsolutePath().normalize());

            for (Path candidate : candidates) {
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate;
                }
            }
            log.warn("Foto da OS não encontrada em nenhum diretório de uploads: {} (testado: {})",
                    photoUrl, candidates);
            return candidates.get(0);
        } catch (Exception e) {
            log.warn("Erro ao resolver caminho da foto ({}): {}", photoUrl, e.getMessage());
            return null;
        }
    }

    // ── Helpers de formatação ─────────────────────────────────────────────────

    private String resolvePersonNameById(UUID personId) {
        if (personId == null)
            return null;
        try {
            var emp = employeeRepository.findById(personId);
            if (emp.isPresent() && emp.get().getName() != null && !emp.get().getName().isBlank()) {
                return emp.get().getName();
            }
            var usr = userRepository.findById(personId);
            if (usr.isPresent() && usr.get().getName() != null && !usr.get().getName().isBlank()) {
                return usr.get().getName();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String formatCurrency(BigDecimal value) {
        return value != null ? CURRENCY.format(value) : CURRENCY.format(BigDecimal.ZERO);
    }

    private String formatQuantity(BigDecimal value) {
        if (value == null)
            return "0";
        return value.stripTrailingZeros().toPlainString();
    }

    private String formatKm(Integer km) {
        if (km == null)
            return null;
        return NumberFormat.getIntegerInstance(new Locale("pt", "BR")).format(km) + " km";
    }

    private String formatDowntime(Long hours, Long days) {
        if (hours == null)
            return null;
        return hours + "h" + (days != null ? " (~" + days + "d)" : "");
    }

    private String formatStatus(FleetWorkOrder.WorkOrderStatus status) {
        if (status == null)
            return null;
        return switch (status) {
            case OPEN -> "Aberta";
            case DRAFT -> "Rascunho";
            case PENDING_APPROVAL -> "Pendente Aprovação";
            case APPROVED -> "Aprovado";
            case IN_PROGRESS -> "Em Execução";
            case WAITING_PARTS -> "Aguardando Peça";
            case COMPLETED -> "Concluído";
            case CANCELLED -> "Cancelado";
        };
    }

    private String formatPriority(FleetWorkOrder.WorkOrderPriority priority) {
        if (priority == null)
            return null;
        return switch (priority) {
            case LOW -> "Baixa";
            case MEDIUM -> "Média";
            case HIGH -> "Alta";
            case URGENT -> "Urgente";
        };
    }

    private String formatLaborType(FleetWorkOrder.LaborType laborType) {
        if (laborType == null)
            return null;
        return laborType == FleetWorkOrder.LaborType.INTERNAL ? "Oficina Interna" : "Externa (Terceiros)";
    }

    private String formatExecutionDuration(Long totalMinutes) {
        if (totalMinutes == null || totalMinutes < 0)
            return null;
        if (totalMinutes == 0)
            return "Menos de 1 min";
        long days = totalMinutes / 1440;
        long hours = (totalMinutes % 1440) / 60;
        long minutes = totalMinutes % 60;

        List<String> parts = new ArrayList<>();
        if (days > 0)
            parts.add(days + (days == 1 ? " dia" : " dias"));
        if (hours > 0)
            parts.add(hours + (hours == 1 ? " hora" : " horas"));
        if (minutes > 0 || parts.isEmpty())
            parts.add(minutes + (minutes == 1 ? " minuto" : " minutos"));
        return String.join(", ", parts);
    }
}
