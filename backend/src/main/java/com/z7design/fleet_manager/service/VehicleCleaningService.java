package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.z7design.fleet_manager.dto.CreateVehicleCleaningOrderRequest;
import com.z7design.fleet_manager.dto.VehicleCleaningOrderDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Gestão de limpeza/higienização dos veículos — fluxo ponta a ponta.
 * <p>
 * 1. Solicitação por setor (Motorista, Tráfego, Operacional, Manutenção) com prioridade
 *    padrão por setor e horário limite de liberação (deadline da viagem/escala).
 * 2. Triagem &amp; fila inteligente: fila ordenada por prazo (SLA) e prioridade.
 * 3. Execução em fases: AGUARDANDO -> EXTERNA -> INTERNA -> INSPECAO -> LIBERADO.
 *    O "Start" notifica CCO/motorista com a previsão de término.
 * 4. Inspeção de qualidade com checklist rápido (WC, bancos, vidros).
 * 5. Liberação final notifica o motorista (sino + WhatsApp) com vaga e horário.
 * <p>
 * SLA dinâmico: Previsão = Início + Tempo Padrão da Categoria + Margem de Inspeção (5 min).
 * O {@link VehicleCleaningDelayAlertScheduler} envia o alerta preventivo ao Gestor de
 * Tráfego quando faltam 20 minutos para a viagem e a ordem segue em execução.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleCleaningService {

    private final VehicleCleaningOrderRepository repository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EvolutionApiService evolutionApiService;
    private final BaileysRestService baileysRestService;
    private final ObjectMapper objectMapper;

    private static final String PHOTOS_DIR = "uploads/vehicle-cleaning/";
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    /** Template padrão de itens do checklist (interno + externo + sanitário). */
    private static final String DEFAULT_CHECKLIST_TEMPLATE = """
            [
              {"key":"capas-banco","title":"Capas de Banco","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"banheiro","title":"Limpeza do Banheiro (quando houver)","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"geladeira","title":"Itens da Geladeira","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"limpeza-interna","title":"Limpeza Interna Geral","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"lavagem-carroceria","title":"Lavagem de Carroceria","category":"EXTERNAL","checked":false,"photoUrl":null},
              {"key":"pretinho-pneus","title":"Pretinho nos Pneus","category":"EXTERNAL","checked":false,"photoUrl":null},
              {"key":"limpeza-rodas","title":"Limpeza de Rodas","category":"EXTERNAL","checked":false,"photoUrl":null},
              {"key":"descarte-sanitario","title":"Descarte Sanitário e Reabastecimento Químico","category":"INTERNAL","checked":false,"photoUrl":null}
            ]
            """;

    /** Checklist rápido de inspeção de qualidade (WC, bancos, vidros). */
    private static final String DEFAULT_QUALITY_CHECKLIST_TEMPLATE = """
            [
              {"key":"wc","title":"Sanitário limpo e cheiroso","checked":false},
              {"key":"bancos","title":"Bancos/estofados limpos","checked":false},
              {"key":"vidros","title":"Vidros limpos (internos e externos)","checked":false},
              {"key":"piso","title":"Piso varrido e lavado","checked":false},
              {"key":"lixo","title":"Lixeiras esvaziadas","checked":false}
            ]
            """;

    // ==================== LEITURA ====================

    public List<VehicleCleaningOrderDTO> list(UUID vehicleId, VehicleCleaningOrder.CleaningStatus status,
                                              UUID companyId, UUID garageId) {
        List<VehicleCleaningOrder> orders;
        if (vehicleId != null && status != null) {
            orders = repository.findByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, status);
        } else if (vehicleId != null) {
            orders = repository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else if (status != null) {
            orders = repository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            orders = repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        // Garante o isolamento entre empresas mesmo com filtros de veículo/status
        return orders.stream()
                .filter(o -> companyId == null || companyId.equals(o.getCompanyId()))
                .filter(o -> garageId == null
                        || (o.getVehicle() != null && garageId.equals(o.getVehicle().getGarageId())))
                .map(this::toDTO)
                .toList();
    }

    public VehicleCleaningOrderDTO getById(UUID id, UUID companyId) {
        return toDTO(findOrderScoped(id, companyId));
    }

    /**
     * Triagem & Fila Inteligente: ordens pendentes ordenadas por prioridade de SLA —
     * primeiro pelo prazo mais próximo, depois pela prioridade mais alta, depois pela
     * mais antiga. A coluna 🔴 ATRASADO é derivada no front (previsão > deadline).
     */
    public List<VehicleCleaningOrderDTO> getQueue(UUID companyId, UUID garageId) {
        List<VehicleCleaningOrder> pending = repository.findByStatusOrderByCreatedAtDesc(
                VehicleCleaningOrder.CleaningStatus.PENDING);
        Comparator<VehicleCleaningOrder> bySla = Comparator
                .comparing((VehicleCleaningOrder o) -> o.getReleaseDeadline() != null
                        ? o.getReleaseDeadline() : LocalDateTime.MAX)
                .thenComparing(o -> priorityWeight(o.getPriority()))
                .thenComparing(VehicleCleaningOrder::getCreatedAt);
        return pending.stream()
                .filter(o -> companyId == null || companyId.equals(o.getCompanyId()))
                .filter(o -> garageId == null
                        || (o.getVehicle() != null && garageId.equals(o.getVehicle().getGarageId())))
                .sorted(bySla)
                .map(this::toDTO)
                .toList();
    }

    private int priorityWeight(VehicleCleaningOrder.Priority priority) {
        if (priority == null) return 3;
        return switch (priority) {
            case URGENTE -> 0;
            case ALTA -> 1;
            case MEDIA -> 2;
            case NORMAL -> 3;
        };
    }

    // ==================== CRIAÇÃO / EDIÇÃO ====================

    @Transactional
    public VehicleCleaningOrderDTO create(CreateVehicleCleaningOrderRequest request, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + request.getVehicleId()));

        // Garante o isolamento entre empresas: o veículo deve pertencer à empresa do usuário
        UUID userCompanyId = currentUser.getCompanyId();
        if (userCompanyId != null && vehicle.getCompanyId() != null
                && !userCompanyId.equals(vehicle.getCompanyId())) {
            throw new ResourceNotFoundException("Veículo não encontrado com ID: " + request.getVehicleId());
        }

        Driver driver = null;
        if (request.getDriverId() != null) {
            driver = driverRepository.findById(request.getDriverId()).orElse(null);
        }

        // WhatsApp do motorista: se não informado no pedido, usa o telefone cadastrado no motorista
        String driverPhone = request.getDriverPhone();
        if ((driverPhone == null || driverPhone.isBlank()) && driver != null
                && driver.getPhone() != null && !driver.getPhone().isBlank()) {
            driverPhone = driver.getPhone();
        }

        // Setor solicitante: informado pelo front ou inferido do papel do usuário
        VehicleCleaningOrder.RequesterSector sector = request.getRequesterSector();
        if (sector == null) {
            sector = inferSectorFromUser(currentUser);
        }

        // Prioridade padrão por setor (Motorista=Média, Tráfego=Alta, Operacional=Normal, Manutenção=Média)
        VehicleCleaningOrder.Priority priority = request.getPriority() != null
                ? request.getPriority()
                : sector.defaultPriority();

        String checklist = (request.getChecklistData() != null && !request.getChecklistData().isBlank())
                ? request.getChecklistData()
                : DEFAULT_CHECKLIST_TEMPLATE;

        VehicleCleaningOrder order = VehicleCleaningOrder.builder()
                .vehicle(vehicle)
                .driver(driver)
                .status(VehicleCleaningOrder.CleaningStatus.PENDING)
                .cleaningType(request.getCleaningType())
                .checklistData(filterChecklistByType(checklist, request.getCleaningType()))
                .observations(request.getObservations())
                .driverPhone(driverPhone)
                .driverUserId(request.getDriverUserId())
                .requestedBy(currentUser.getId())
                .requestedByName(currentUser.getName())
                .requesterSector(sector)
                .priority(priority)
                .phase(VehicleCleaningOrder.CleaningPhase.AGUARDANDO)
                .releaseDeadline(request.getReleaseDeadline())
                .releaseSpot(request.getReleaseSpot())
                .companyId(userCompanyId != null ? userCompanyId : vehicle.getCompanyId())
                .build();

        order = repository.save(order);
        log.info("Ordem de limpeza criada: id={}, veículo={}, tipo={}, setor={}, prioridade={}, deadline={}",
                order.getId(), vehicle.getPlate(), order.getCleaningType(), sector, priority, order.getReleaseDeadline());
        return toDTO(order);
    }

    /** Infere o setor solicitante a partir do papel do usuário autenticado. */
    private VehicleCleaningOrder.RequesterSector inferSectorFromUser(User user) {
        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                String name = role.getName() != null ? role.getName().toUpperCase() : "";
                if (name.contains("TRAFFIC") || name.contains("TRAFEGO") || name.contains("TRÂFEGO")) {
                    return VehicleCleaningOrder.RequesterSector.TRAFFIC;
                }
                if (name.contains("MECHANIC") || name.contains("MECANIC") || name.contains("MECÂNIC")
                        || name.contains("MANUTENCAO") || name.contains("MANUTENÇÃO")) {
                    return VehicleCleaningOrder.RequesterSector.MAINTENANCE;
                }
                if (name.contains("DRIVER") || name.contains("MOTORISTA")) {
                    return VehicleCleaningOrder.RequesterSector.DRIVER;
                }
            }
        }
        return VehicleCleaningOrder.RequesterSector.OPERATIONAL;
    }

    /** Filtra o checklist para exibir apenas as categorias relevantes ao tipo de limpeza. */
    private String filterChecklistByType(String checklistData, VehicleCleaningOrder.CleaningType type) {
        try {
            JsonNode root = objectMapper.readTree(checklistData);
            if (!root.isArray()) {
                return checklistData;
            }
            ArrayNode filtered = objectMapper.createArrayNode();
            boolean includeExternal = type == VehicleCleaningOrder.CleaningType.EXTERNAL
                    || type == VehicleCleaningOrder.CleaningType.COMPLETE;
            boolean includeInternal = type == VehicleCleaningOrder.CleaningType.INTERNAL
                    || type == VehicleCleaningOrder.CleaningType.COMPLETE
                    || type == VehicleCleaningOrder.CleaningType.SANITARY;
            for (JsonNode item : root) {
                String category = item.path("category").asText("");
                if (("EXTERNAL".equals(category) && includeExternal)
                        || ("INTERNAL".equals(category) && includeInternal)) {
                    filtered.add(item);
                }
            }
            return filtered.size() > 0 ? objectMapper.writeValueAsString(filtered) : checklistData;
        } catch (Exception e) {
            log.warn("Não foi possível filtrar o checklist pelo tipo {}: {}", type, e.getMessage());
            return checklistData;
        }
    }

    // ==================== EXECUÇÃO EM FASES ====================

    /**
     * Equipe dá "Start" no serviço: calcula a previsão de término
     * (início + tempo padrão da categoria + margem de inspeção de 5 min) e
     * notifica CCO/motorista com o status "Em Execução".
     */
    @Transactional
    public VehicleCleaningOrderDTO start(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        if (order.getStatus() == VehicleCleaningOrder.CleaningStatus.COMPLETED) {
            throw new IllegalStateException("Ordem de limpeza já foi finalizada");
        }
        LocalDateTime now = LocalDateTime.now();
        int standardMinutes = order.standardTimeMinutes();

        order.setStatus(VehicleCleaningOrder.CleaningStatus.IN_PROGRESS);
        order.setPhase(firstExecutionPhase(order.getCleaningType()));
        order.setCurrentPhase(firstExecutionPhase(order.getCleaningType()));
        order.setStartedAt(now);
        order.setStandardTimeMinutes(standardMinutes);
        order.setEstimatedCompletion(now.plusMinutes(standardMinutes + VehicleCleaningOrder.INSPECTION_MARGIN_MINUTES));
        order = repository.save(order);
        log.info("Ordem de limpeza iniciada: id={}, previsão de término={} (padrão {}min + {}min de inspeção)",
                id, order.getEstimatedCompletion().format(TIME_FMT), standardMinutes,
                VehicleCleaningOrder.INSPECTION_MARGIN_MINUTES);

        notifyStart(order);
        return toDTO(order);
    }

    private VehicleCleaningOrder.CleaningPhase firstExecutionPhase(VehicleCleaningOrder.CleaningType type) {
        return type == VehicleCleaningOrder.CleaningType.INTERNAL
                ? VehicleCleaningOrder.CleaningPhase.INTERNA
                : VehicleCleaningOrder.CleaningPhase.EXTERNA;
    }

    /**
     * Avança a fase de execução: EXTERNA -> INTERNA -> INSPECAO.
     * Recalcula a previsão de término a cada transição.
     */
    @Transactional
    public VehicleCleaningOrderDTO advancePhase(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        if (order.getStatus() != VehicleCleaningOrder.CleaningStatus.IN_PROGRESS) {
            throw new IllegalStateException("Inicie a limpeza antes de avançar a fase");
        }
        VehicleCleaningOrder.CleaningPhase next = switch (order.getPhase()) {
            case AGUARDANDO, EXTERNA -> nextExecutionPhase(order.getCleaningType(), VehicleCleaningOrder.CleaningPhase.EXTERNA);
            case INTERNA -> VehicleCleaningOrder.CleaningPhase.INSPECAO;
            case INSPECAO, LIBERADO -> throw new IllegalStateException(
                    "Fase atual não permite avanço automático. Use a inspeção de qualidade e a liberação.");
        };
        order.setPhase(next);
        order.setCurrentPhase(next.isExecutionPhase() ? next : order.getCurrentPhase());
        order.setEstimatedCompletion(LocalDateTime.now()
                .plusMinutes(VehicleCleaningOrder.INSPECTION_MARGIN_MINUTES + 5));
        order = repository.save(order);
        log.info("Fase da ordem de limpeza {} avançada para {}", id, next);
        return toDTO(order);
    }

    private VehicleCleaningOrder.CleaningPhase nextExecutionPhase(
            VehicleCleaningOrder.CleaningType type, VehicleCleaningOrder.CleaningPhase current) {
        boolean hasInternal = type == VehicleCleaningOrder.CleaningType.INTERNAL
                || type == VehicleCleaningOrder.CleaningType.COMPLETE;
        if (current == VehicleCleaningOrder.CleaningPhase.EXTERNA && hasInternal) {
            return VehicleCleaningOrder.CleaningPhase.INTERNA;
        }
        return VehicleCleaningOrder.CleaningPhase.INSPECAO;
    }

    @Transactional
    public VehicleCleaningOrderDTO updateChecklist(UUID id, String checklistData, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        order.setChecklistData(checklistData);
        order = repository.save(order);
        log.info("Checklist de limpeza atualizado: id={}", id);
        return toDTO(order);
    }

    @Transactional
    public VehicleCleaningOrderDTO uploadItemPhoto(UUID id, String itemKey, MultipartFile file, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de foto é obrigatório");
        }

        try {
            Path uploadPath = Paths.get(PHOTOS_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID() + "_" + order.getId() + extension;
            Files.copy(file.getInputStream(), uploadPath.resolve(filename));
            String photoUrl = "/uploads/vehicle-cleaning/" + filename;

            order.setChecklistData(attachPhotoToItem(order.getChecklistData(), itemKey, photoUrl));
            order = repository.save(order);
            log.info("Foto anexada ao item {} da ordem de limpeza {}", itemKey, id);
            return toDTO(order);
        } catch (IOException e) {
            log.error("Erro ao salvar foto da limpeza: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar foto da limpeza: " + e.getMessage());
        }
    }

    // ==================== INSPEÇÃO DE QUALIDADE ====================

    /**
     * Inspeção de qualidade: valida o checklist rápido (WC, bancos, vidros...).
     * Opcionalmente conclui a ordem (approveAndComplete=true), notificando o motorista.
     */
    @Transactional
    public VehicleCleaningOrderDTO submitQualityInspection(UUID id, String qualityChecklist,
                                                           String inspectedBy, boolean approve,
                                                           boolean approveAndComplete, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        order.setQualityChecklist(qualityChecklist != null && !qualityChecklist.isBlank()
                ? qualityChecklist : DEFAULT_QUALITY_CHECKLIST_TEMPLATE);
        order.setQualityInspectedBy(inspectedBy);
        order.setQualityInspectedAt(LocalDateTime.now());
        order.setQualityApproved(approve);
        if (approve) {
            order.setPhase(VehicleCleaningOrder.CleaningPhase.INSPECAO);
        }
        order = repository.save(order);
        log.info("Inspeção de qualidade da ordem {}: aprovada={} por={}", id, approve, inspectedBy);

        if (approveAndComplete && approve) {
            return complete(id, companyId);
        }
        return toDTO(order);
    }

    /** Checklist padrão da inspeção de qualidade (para inicialização no front). */
    public String getDefaultQualityChecklist() {
        return DEFAULT_QUALITY_CHECKLIST_TEMPLATE;
    }

    // ==================== LIBERAÇÃO FINAL ====================

    /**
     * Liberação final: status "Liberado para Viagem", alerta imediato no celular do
     * motorista (sino + WhatsApp) e painel do Tráfego, informando vaga e horário.
     */
    @Transactional
    public VehicleCleaningOrderDTO release(UUID id, String releaseSpot, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        if (order.getStatus() == VehicleCleaningOrder.CleaningStatus.COMPLETED) {
            throw new IllegalStateException("Ordem de limpeza já foi liberada");
        }
        LocalDateTime now = LocalDateTime.now();
        order.setStatus(VehicleCleaningOrder.CleaningStatus.COMPLETED);
        order.setPhase(VehicleCleaningOrder.CleaningPhase.LIBERADO);
        order.setQualityApproved(true);
        order.setReleaseSpot(releaseSpot != null && !releaseSpot.isBlank() ? releaseSpot : order.getReleaseSpot());
        order.setReleasedAt(now);
        order.setCompletedAt(now);
        order = repository.save(order);
        log.info("Veículo liberado para viagem: ordem={}, veículo={}, vaga={}",
                id, order.getVehicle().getPlate(), order.getReleaseSpot());

        notifyRelease(order);
        return toDTO(order);
    }

    /** Marca a ordem como finalizada e notifica o motorista (interno + WhatsApp). */
    @Transactional
    public VehicleCleaningOrderDTO complete(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        order.setStatus(VehicleCleaningOrder.CleaningStatus.COMPLETED);
        order.setPhase(VehicleCleaningOrder.CleaningPhase.LIBERADO);
        if (order.getReleasedAt() == null) {
            order.setReleasedAt(LocalDateTime.now());
        }
        order.setCompletedAt(LocalDateTime.now());
        order = repository.save(order);
        log.info("Ordem de limpeza finalizada: id={}, veículo={}", id, order.getVehicle().getPlate());

        notifyDriver(order);
        return toDTO(order);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        repository.delete(order);
        log.info("Ordem de limpeza excluída: id={}", id);
    }

    // ==================== ALERTA DE ATRASO (usado pelo scheduler) ====================

    /**
     * Alerta preventivo de atraso: quando faltam ≤ 20 minutos para a viagem e a limpeza
     * ainda não atingiu a fase final, o Gestor de Tráfego recebe:
     * "Atenção: Prefixo 1040 com risco de atraso na limpeza. Previsão ajustada para 14:10
     * (Saída prevista: 14:00). Deseja trocar o carro na escala?"
     */
    @Transactional
    public void checkAndSendDelayAlerts() {
        List<VehicleCleaningOrder> candidates = repository.findByStatusAndDelayAlertSentFalse(
                VehicleCleaningOrder.CleaningStatus.IN_PROGRESS);
        LocalDateTime now = LocalDateTime.now();
        for (VehicleCleaningOrder order : candidates) {
            LocalDateTime deadline = order.getReleaseDeadline();
            if (deadline == null) {
                continue;
            }
            long minutesToDeadline = java.time.Duration.between(now, deadline).toMinutes();
            boolean insideWindow = minutesToDeadline <= VehicleCleaningOrder.DELAY_ALERT_WINDOW_MINUTES
                    && minutesToDeadline > -60; // ainda relevante até 1h após o prazo
            boolean pastEstimate = order.getEstimatedCompletion() != null
                    && order.getEstimatedCompletion().isAfter(deadline);
            boolean notFinalPhase = order.getPhase() == null
                    || order.getPhase() == VehicleCleaningOrder.CleaningPhase.AGUARDANDO
                    || order.getPhase() == VehicleCleaningOrder.CleaningPhase.EXTERNA
                    || order.getPhase() == VehicleCleaningOrder.CleaningPhase.INTERNA;

            if (insideWindow && notFinalPhase && (pastEstimate || minutesToDeadline <= VehicleCleaningOrder.DELAY_ALERT_WINDOW_MINUTES)) {
                sendDelayAlert(order, minutesToDeadline);
                order.setDelayAlertSent(true);
                repository.save(order);
            }
        }
    }

    private void sendDelayAlert(VehicleCleaningOrder order, long minutesToDeadline) {
        String plate = order.getVehicle().getPlate();
        String prefix = order.getVehicle().getFleetNumber() != null
                ? order.getVehicle().getFleetNumber() : plate;
        String estimate = order.getEstimatedCompletion() != null
                ? order.getEstimatedCompletion().format(TIME_FMT) : "em avaliação";
        String deadlineTime = order.getReleaseDeadline().format(TIME_FMT);
        String title = "Risco de atraso na limpeza — " + prefix;
        String message = String.format(
                "Atenção: %s com risco de atraso na limpeza. Previsão ajustada para %s (Saída prevista: %s). Deseja trocar o carro na escala?",
                prefix, estimate, deadlineTime);
        log.warn("Alerta de atraso (faltam {} min): ordem={}, veículo={}", minutesToDeadline, order.getId(), plate);

        notifyRolesAndUser(order, title, message, "🚨");
    }

    // ==================== NOTIFICAÇÕES ====================

    /** Notifica o início da execução: CCO (papéis de tráfego/admin) e motorista. */
    private void notifyStart(VehicleCleaningOrder order) {
        String prefix = vehiclePrefix(order);
        String estimate = order.getEstimatedCompletion() != null
                ? order.getEstimatedCompletion().format(TIME_FMT) : "—";
        String title = "Limpeza em execução — " + prefix;
        String message = String.format(
                "A higienização do veículo %s está em execução. Previsão de término: %s.",
                prefix, estimate);
        notifyRolesAndUser(order, title, message, "🧼");
        if (order.getDriverUserId() != null) {
            notifyUser(order.getDriverUserId(), title, message, order.getCompanyId());
        }
    }

    /** Liberação final: alerta imediato no celular do motorista e no painel do Tráfego. */
    private void notifyRelease(VehicleCleaningOrder order) {
        String prefix = vehiclePrefix(order);
        String spot = order.getReleaseSpot() != null ? order.getReleaseSpot() : "pátio";
        String deadline = order.getReleaseDeadline() != null
                ? order.getReleaseDeadline().format(TIME_FMT) : "—";
        String title = "Liberado para viagem — " + prefix;
        String message = String.format(
                "Prefixo %s limpo e liberado na vaga %s para a viagem das %s.",
                prefix, spot, deadline);
        notifyRolesAndUser(order, title, message, "✅");
        notifyDriverInternalAndWhatsApp(order, title, message);
    }

    /** Notificação finalizada (fluxo antigo preservado). */
    private void notifyDriver(VehicleCleaningOrder order) {
        String vehiclePlate = order.getVehicle().getPlate();
        String title = "Limpeza finalizada";
        String message = String.format(
                "A limpeza do veículo %s foi finalizada. O veículo está pronto para uso.", vehiclePlate);
        notifyDriverInternalAndWhatsApp(order, title, message);
    }

    /** Notifica os papéis de tráfego/admin da empresa (painel do Gestor de Tráfego/CCO). */
    private void notifyRolesAndUser(VehicleCleaningOrder order, String title, String message, String emoji) {
        try {
            List<User> managers = userRepository.findTrafficManagers(order.getCompanyId());
            for (User manager : managers) {
                createNotification(manager, title, message, order.getCompanyId());
            }
        } catch (Exception e) {
            log.warn("Falha ao notificar gestores de tráfego da limpeza {}: {}", order.getId(), e.getMessage());
        }
    }

    private void notifyDriverInternalAndWhatsApp(VehicleCleaningOrder order, String title, String message) {
        // 1) Notificação interna (sino) — para a conta do motorista ou do solicitante
        UUID targetUserId = order.getDriverUserId() != null ? order.getDriverUserId() : order.getRequestedBy();
        if (targetUserId != null) {
            notifyUser(targetUserId, title, message, order.getCompanyId());
        }

        // 2) WhatsApp — quando o número estiver configurado
        if (order.getDriverPhone() != null && !order.getDriverPhone().isBlank()) {
            String phone = normalizeBrazilianPhone(order.getDriverPhone());
            if (phone == null) {
                log.warn("Número de WhatsApp inválido/sem DDD para limpeza {}", order.getId());
            } else {
                sendWhatsAppNotification(phone, title, message, order.getId());
            }
        }
    }

    private void notifyUser(UUID userId, String title, String message, UUID companyId) {
        try {
            User target = userRepository.findById(userId).orElse(null);
            if (target != null) {
                createNotification(target, title, message, companyId);
            }
        } catch (Exception e) {
            log.warn("Falha ao criar notificação interna para o usuário {}: {}", userId, e.getMessage());
        }
    }

    private void createNotification(User target, String title, String message, UUID companyId) {
        try {
            Notification notification = Notification.builder()
                    .user(target)
                    .title(title)
                    .message(message)
                    .type(NotificationType.SYSTEM)
                    .status(NotificationStatus.UNREAD)
                    .companyId(companyId)
                    .build();
            notificationService.create(notification);
        } catch (Exception e) {
            log.warn("Falha ao criar notificação para {}: {}", target.getId(), e.getMessage());
        }
    }

    /** Normaliza número brasileiro para E.164 com DDI +55 (evita falha documentada de envio). */
    private String normalizeBrazilianPhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() < 10) {
            return null;
        }
        if (digits.startsWith("55") && digits.length() >= 12) {
            return "+" + digits;
        }
        return "+55" + digits;
    }

    /** Envia a mensagem via Evolution API com fallback para Baileys. */
    private void sendWhatsAppNotification(String phone, String title, String message, UUID orderId) {
        String whatsappMessage = "🧼 *" + title + "*\n\n" + message;
        boolean sent = false;
        try {
            sent = evolutionApiService.sendTextMessage(phone, whatsappMessage);
        } catch (Exception e) {
            log.warn("Evolution API falhou ao notificar limpeza {}: {}", orderId, e.getMessage());
        }
        if (!sent) {
            try {
                sent = baileysRestService.sendTextMessage(phone, whatsappMessage);
            } catch (Exception e) {
                log.warn("Baileys falhou ao notificar limpeza {}: {}", orderId, e.getMessage());
            }
        }
        if (!sent) {
            log.warn("WhatsApp falhou para limpeza {} no número {}", orderId, phone);
        }
    }

    private String vehiclePrefix(VehicleCleaningOrder order) {
        Vehicle vehicle = order.getVehicle();
        return vehicle.getFleetNumber() != null && !vehicle.getFleetNumber().isBlank()
                ? vehicle.getFleetNumber() : vehicle.getPlate();
    }

    // ==================== HELPERS ====================

    private VehicleCleaningOrder findOrder(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de limpeza não encontrada com ID: " + id));
    }

    /** Busca a ordem e garante que pertence à empresa do usuário autenticado. */
    private VehicleCleaningOrder findOrderScoped(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrder(id);
        if (order.getCompanyId() != null && companyId != null && !companyId.equals(order.getCompanyId())) {
            throw new ResourceNotFoundException("Ordem de limpeza não encontrada com ID: " + id);
        }
        return order;
    }

    private VehicleCleaningOrderDTO toDTO(VehicleCleaningOrder order) {
        VehicleCleaningOrderDTO dto = new VehicleCleaningOrderDTO();
        dto.setId(order.getId());
        dto.setVehicleId(order.getVehicle().getId());
        dto.setVehiclePlate(order.getVehicle().getPlate());
        dto.setVehicleModel(order.getVehicle().getModel());
        dto.setVehicleGarageName(order.getVehicle().getGarageName());
        if (order.getDriver() != null) {
            dto.setDriverId(order.getDriver().getId());
            dto.setDriverName(order.getDriver().getName());
        }
        dto.setStatus(order.getStatus());
        dto.setCleaningType(order.getCleaningType());
        dto.setChecklistData(order.getChecklistData());
        dto.setObservations(order.getObservations());
        dto.setDriverPhone(order.getDriverPhone());
        dto.setDriverUserId(order.getDriverUserId());
        dto.setRequestedBy(order.getRequestedBy());
        dto.setRequestedByName(order.getRequestedByName());
        dto.setRequesterSector(order.getRequesterSector());
        dto.setPriority(order.getPriority());
        dto.setPhase(order.getPhase());
        dto.setReleaseDeadline(order.getReleaseDeadline());
        dto.setEstimatedCompletion(order.getEstimatedCompletion());
        dto.setStartedAt(order.getStartedAt());
        dto.setCurrentPhase(order.getCurrentPhase());
        dto.setStandardTimeMinutes(order.getStandardTimeMinutes());
        dto.setDelayAlertSent(order.getDelayAlertSent());
        dto.setQualityApproved(order.getQualityApproved());
        dto.setQualityInspectedBy(order.getQualityInspectedBy());
        dto.setQualityInspectedAt(order.getQualityInspectedAt());
        dto.setQualityChecklist(order.getQualityChecklist());
        dto.setReleaseSpot(order.getReleaseSpot());
        dto.setReleasedAt(order.getReleasedAt());
        dto.setCompletedAt(order.getCompletedAt());
        dto.setCompanyId(order.getCompanyId());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        return dto;
    }

    /** Atualiza o photoUrl do item (por key) no JSON do checklist. */
    private String attachPhotoToItem(String checklistData, String itemKey, String photoUrl) {
        try {
            JsonNode root = (checklistData == null || checklistData.isBlank())
                    ? objectMapper.readTree(DEFAULT_CHECKLIST_TEMPLATE)
                    : objectMapper.readTree(checklistData);
            if (root.isArray()) {
                ArrayNode items = (ArrayNode) root;
                boolean found = false;
                for (int i = 0; i < items.size(); i++) {
                    JsonNode node = items.get(i);
                    if (node.has("key") && itemKey.equals(node.get("key").asText())) {
                        ((ObjectNode) node).put("photoUrl", photoUrl);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    ObjectNode newItem = objectMapper.createObjectNode();
                    newItem.put("key", itemKey);
                    newItem.put("title", itemKey);
                    newItem.put("category", "INTERNAL");
                    newItem.put("checked", false);
                    newItem.put("photoUrl", photoUrl);
                    items.add(newItem);
                }
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            log.warn("Não foi possível atualizar o item {} no checklist: {}", itemKey, e.getMessage());
            return checklistData;
        }
    }
}
