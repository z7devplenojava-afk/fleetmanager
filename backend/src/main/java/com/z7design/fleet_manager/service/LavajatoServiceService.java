package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.z7design.fleet_manager.dto.CreateLavajatoServiceRequest;
import com.z7design.fleet_manager.dto.LavajatoServiceDTO;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gestão de serviços de lavajato (lavagem de veículos).
 * <p>
 * Fluxo: operador registra o veículo -> checklist interno/externo ->
 * timer de execução -> ao finalizar, notifica motorista e/ou operacional.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LavajatoServiceService {

    private final LavajatoServiceRepository repository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EvolutionApiService evolutionApiService;
    private final BaileysRestService baileysRestService;
    private final ObjectMapper objectMapper;

    private static final String PHOTOS_DIR = "uploads/lavajato/";

    /** Template padrão de itens do checklist interno. */
    private static final String DEFAULT_CHECKLIST_INTERNAL = """
            [
              {"key":"bancos","title":"Limpeza dos Bancos","checked":false,"photoUrl":null},
              {"key":"painel","title":"Limpeza do Painel","checked":false,"photoUrl":null},
              {"key":"tapetes","title":"Limpeza dos Tapetes","checked":false,"photoUrl":null},
              {"key":"vidros-internos","title":"Limpeza dos Vidros Internos","checked":false,"photoUrl":null},
              {"key":"porta-malas","title":"Limpeza do Porta-malas","checked":false,"photoUrl":null},
              {"key":"purificador","title":"Air Freshener / Purificador de Ar","checked":false,"photoUrl":null},
              {"key":"console-central","title":"Limpeza do Console Central","checked":false,"photoUrl":null},
              {"key":"pedais","title":"Limpeza dos Pedais e Caixa de Fus\u00edveis","checked":false,"photoUrl":null},
              {"key":"teto-colunas","title":"Limpeza do Teto e Colunas","checked":false,"photoUrl":null},
              {"key":"retrovisores-internos","title":"Limpeza dos Retrovisores Internos","checked":false,"photoUrl":null},
              {"key":"flushing","title":"Flushing / Desinfec\u00e7\u00e3o Interna","checked":false,"photoUrl":null},
              {"key":"compartimento-portas","title":"Limpeza dos Compartimentos das Portas","checked":false,"photoUrl":null},
              {"key":"bagageiro","title":"Organiza\u00e7\u00e3o e Aspira\u00e7\u00e3o do Bagageiro","checked":false,"photoUrl":null}
            ]
            """;

    /** Template padrão de itens do checklist externo. */
    private static final String DEFAULT_CHECKLIST_EXTERNAL = """
            [
              {"key":"lavagem-carroceria","title":"Lavagem da Carroceria","checked":false,"photoUrl":null},
              {"key":"chapas","title":"Limpeza das Chapas","checked":false,"photoUrl":null},
              {"key":"rodas","title":"Limpeza das Rodas","checked":false,"photoUrl":null},
              {"key":"pneus","title":"Pretinho nos Pneus","checked":false,"photoUrl":null},
              {"key":"vidros-externos","title":"Limpeza dos Vidros Externos","checked":false,"photoUrl":null}
            ]
            """;

    // ==================== LEITURA ====================

    public List<LavajatoServiceDTO> list(UUID vehicleId, LavajatoService.LavajatoStatus status,
                                          UUID companyId) {
        List<LavajatoService> services;
        if (vehicleId != null && status != null) {
            services = repository.findByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, status);
        } else if (vehicleId != null) {
            services = repository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else if (status != null) {
            services = repository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            services = repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        // Garante o isolamento entre empresas
        return services.stream()
                .filter(s -> companyId == null || companyId.equals(s.getCompanyId()))
                .map(this::toDTO)
                .toList();
    }

    public LavajatoServiceDTO getById(UUID id, UUID companyId) {
        return toDTO(findServiceScoped(id, companyId));
    }

    // ==================== CRIAÇÃO / EDIÇÃO ====================

    @Transactional
    public LavajatoServiceDTO create(CreateLavajatoServiceRequest request, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + request.getVehicleId()));

        // Garante o isolamento entre empresas
        UUID userCompanyId = currentUser.getCompanyId();
        if (userCompanyId != null && vehicle.getCompanyId() != null
                && !userCompanyId.equals(vehicle.getCompanyId())) {
            throw new ResourceNotFoundException("Veículo não encontrado com ID: " + request.getVehicleId());
        }

        Driver driver = null;
        if (request.getDriverId() != null) {
            driver = driverRepository.findById(request.getDriverId()).orElse(null);
        }

        // WhatsApp do motorista: se não informado, usa o telefone cadastrado
        String driverPhone = request.getDriverPhone();
        if ((driverPhone == null || driverPhone.isBlank()) && driver != null
                && driver.getPhone() != null && !driver.getPhone().isBlank()) {
            driverPhone = driver.getPhone();
        }

        String checklistInternal = (request.getChecklistInternal() != null && !request.getChecklistInternal().isBlank())
                ? request.getChecklistInternal()
                : DEFAULT_CHECKLIST_INTERNAL;

        String checklistExternal = (request.getChecklistExternal() != null && !request.getChecklistExternal().isBlank())
                ? request.getChecklistExternal()
                : DEFAULT_CHECKLIST_EXTERNAL;

        LavajatoService lavajato = LavajatoService.builder()
                .vehicle(vehicle)
                .driver(driver)
                .status(LavajatoService.LavajatoStatus.PENDING)
                .checklistInternal(checklistInternal)
                .checklistExternal(checklistExternal)
                .observations(request.getObservations())
                .driverPhone(driverPhone)
                .driverUserId(request.getDriverUserId())
                .operatorId(currentUser.getId())
                .companyId(userCompanyId != null ? userCompanyId : vehicle.getCompanyId())
                .build();

        lavajato = repository.save(lavajato);
        log.info("Serviço de lavajato criado: id={}, veículo={}", lavajato.getId(), vehicle.getPlate());
        return toDTO(lavajato);
    }

    @Transactional
    public LavajatoServiceDTO start(UUID id, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);
        if (lavajato.getStatus() == LavajatoService.LavajatoStatus.COMPLETED) {
            throw new IllegalStateException("Serviço de lavajato já foi finalizado");
        }
        lavajato.setStatus(LavajatoService.LavajatoStatus.IN_PROGRESS);
        lavajato.setStartedAt(LocalDateTime.now());
        lavajato = repository.save(lavajato);
        log.info("Serviço de lavajato iniciado: id={}", id);
        return toDTO(lavajato);
    }

    @Transactional
    public LavajatoServiceDTO updateChecklistInternal(UUID id, String checklistData, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);
        lavajato.setChecklistInternal(checklistData);
        lavajato = repository.save(lavajato);
        log.info("Checklist interno atualizado: id={}", id);
        return toDTO(lavajato);
    }

    @Transactional
    public LavajatoServiceDTO updateChecklistExternal(UUID id, String checklistData, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);
        lavajato.setChecklistExternal(checklistData);
        lavajato = repository.save(lavajato);
        log.info("Checklist externo atualizado: id={}", id);
        return toDTO(lavajato);
    }

    @Transactional
    public LavajatoServiceDTO complete(UUID id, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);
        lavajato.setStatus(LavajatoService.LavajatoStatus.COMPLETED);
        lavajato.setCompletedAt(LocalDateTime.now());
        lavajato.setDurationSeconds(lavajato.calculateDuration());
        lavajato = repository.save(lavajato);
        log.info("Serviço de lavajato finalizado: id={}, duração={}s", id, lavajato.getDurationSeconds());

        notifyReady(lavajato);
        return toDTO(lavajato);
    }

    @Transactional
    public LavajatoServiceDTO uploadItemPhoto(UUID id, String itemKey, String checklistType,
                                               MultipartFile file, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);

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
            String filename = UUID.randomUUID() + "_" + lavajato.getId() + extension;
            Files.copy(file.getInputStream(), uploadPath.resolve(filename));
            String photoUrl = "/uploads/lavajato/" + filename;

            String defaultTemplate = "internal".equalsIgnoreCase(checklistType)
                    ? DEFAULT_CHECKLIST_INTERNAL : DEFAULT_CHECKLIST_EXTERNAL;

            if ("internal".equalsIgnoreCase(checklistType)) {
                lavajato.setChecklistInternal(
                        attachPhotoToItem(lavajato.getChecklistInternal(), itemKey, photoUrl, defaultTemplate));
            } else {
                lavajato.setChecklistExternal(
                        attachPhotoToItem(lavajato.getChecklistExternal(), itemKey, photoUrl, defaultTemplate));
            }

            lavajato = repository.save(lavajato);
            log.info("Foto anexada ao item {} ({}) do lavajato {}", itemKey, checklistType, id);
            return toDTO(lavajato);
        } catch (IOException e) {
            log.error("Erro ao salvar foto do lavajato: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar foto do lavajato: " + e.getMessage());
        }
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        LavajatoService lavajato = findServiceScoped(id, companyId);
        repository.delete(lavajato);
        log.info("Serviço de lavajato excluído: id={}", id);
    }

    // ==================== ESTATÍSTICAS ====================

    public Map<String, Object> computeStats(UUID vehicleId, UUID companyId) {
        List<LavajatoService> all;
        if (vehicleId != null) {
            // Filtra por veículo específico
            all = repository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                    .stream()
                    .filter(s -> companyId == null || companyId.equals(s.getCompanyId()))
                    .toList();
        } else {
            all = repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        List<LavajatoService> completed = all.stream()
                .filter(s -> s.getStatus() == LavajatoService.LavajatoStatus.COMPLETED)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);

        // Contagem por status
        long pending = all.stream().filter(s -> s.getStatus() == LavajatoService.LavajatoStatus.PENDING).count();
        long inProgress = all.stream().filter(s -> s.getStatus() == LavajatoService.LavajatoStatus.IN_PROGRESS).count();
        long completedCount = completed.size();

        // Duração
        OptionalDouble avgDuration = completed.stream()
                .map(LavajatoService::getDurationSeconds)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .average();
        OptionalLong minDuration = completed.stream()
                .map(LavajatoService::getDurationSeconds)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .min();
        OptionalLong maxDuration = completed.stream()
                .map(LavajatoService::getDurationSeconds)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .max();

        // Contagens por período
        long completedToday = completed.stream()
                .filter(s -> s.getCompletedAt() != null && s.getCompletedAt().toLocalDate().equals(today))
                .count();
        long completedThisWeek = completed.stream()
                .filter(s -> s.getCompletedAt() != null && !s.getCompletedAt().toLocalDate().isBefore(weekStart))
                .count();
        long completedThisMonth = completed.stream()
                .filter(s -> s.getCompletedAt() != null && s.getCompletedAt().getMonth() == now.getMonth()
                        && s.getCompletedAt().getYear() == now.getYear())
                .count();

        // Taxa de conclusão
        double completionRate = all.isEmpty() ? 0.0 : (completedCount * 100.0 / all.size());

        // Itens mais frequentemente pulados (cheklists não marcados nos serviços finalizados)
        Map<String, Long> skippedInternal = countSkippedItems(completed, "internal");
        Map<String, Long> skippedExternal = countSkippedItems(completed, "external");

        // Veículos mais lavados
        Map<String, Long> topVehicles = all.stream()
                .filter(s -> s.getVehicle() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getVehicle().getPlate(),
                        Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        // Operadores que mais realizaram serviços
        Map<String, Long> topOperators = all.stream()
                .filter(s -> s.getOperatorId() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getOperatorId().toString(),
                        Collectors.counting()));
        // Enriquece com nomes
        Map<String, Long> topOperatorsNamed = new LinkedHashMap<>();
        topOperators.forEach((opId, count) -> {
            String name = userRepository.findById(UUID.fromString(opId))
                    .map(User::getName).orElse(opId);
            topOperatorsNamed.put(name, count);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRecords", all.size());
        result.put("pending", pending);
        result.put("inProgress", inProgress);
        result.put("completed", completedCount);
        result.put("avgDurationSeconds", avgDuration.isPresent() ? Math.round(avgDuration.getAsDouble()) : null);
        result.put("minDurationSeconds", minDuration.isPresent() ? minDuration.getAsLong() : null);
        result.put("maxDurationSeconds", maxDuration.isPresent() ? maxDuration.getAsLong() : null);
        result.put("completedToday", completedToday);
        result.put("completedThisWeek", completedThisWeek);
        result.put("completedThisMonth", completedThisMonth);
        result.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
        result.put("skippedInternalItems", skippedInternal);
        result.put("skippedExternalItems", skippedExternal);
        result.put("topVehicles", topVehicles);
        result.put("topOperators", topOperatorsNamed);
        return result;
    }

    private Map<String, Long> countSkippedItems(List<LavajatoService> services, String checklistType) {
        Map<String, Long> skippedCounts = new LinkedHashMap<>();
        for (LavajatoService svc : services) {
            String json = "internal".equals(checklistType) ? svc.getChecklistInternal() : svc.getChecklistExternal();
            if (json == null || json.isBlank()) continue;
            try {
                JsonNode root = objectMapper.readTree(json);
                if (root.isArray()) {
                    for (JsonNode item : root) {
                        if (item.has("checked") && !item.get("checked").asBoolean()) {
                            String key = item.has("key") ? item.get("key").asText() : "unknown";
                            skippedCounts.merge(key, 1L, Long::sum);
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Erro ao parsear checklist para stats: {}", e.getMessage());
            }
        }
        return skippedCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }

    // ==================== NOTIFICAÇÃO ====================

    private void notifyReady(LavajatoService lavajato) {
        String plate = lavajato.getVehicle().getPlate();
        String title = "Lavajato — Veículo pronto";
        String message = String.format(
                "O veículo %s passou pelo lavajato e está pronto para uso.", plate);

        // 1) Notificação interna (sino) — para o motorista ou o operador
        UUID targetUserId = lavajato.getDriverUserId() != null
                ? lavajato.getDriverUserId()
                : lavajato.getOperatorId();
        if (targetUserId != null) {
            try {
                User target = userRepository.findById(targetUserId).orElse(null);
                if (target != null) {
                    Notification notification = Notification.builder()
                            .user(target)
                            .title(title)
                            .message(message)
                            .type(NotificationType.SYSTEM)
                            .status(NotificationStatus.UNREAD)
                            .companyId(lavajato.getCompanyId())
                            .build();
                    notificationService.create(notification);
                    log.info("Notificação interna enviada para {} (lavajato {})", targetUserId, lavajato.getId());
                }
            } catch (Exception e) {
                log.warn("Falha ao criar notificação interna do lavajato {}: {}", lavajato.getId(), e.getMessage());
            }
        }

        // 2) WhatsApp — quando o número estiver configurado
        if (lavajato.getDriverPhone() != null && !lavajato.getDriverPhone().isBlank()) {
            String phone = normalizeBrazilianPhone(lavajato.getDriverPhone());
            if (phone != null) {
                sendWhatsAppNotification(phone, title, message, lavajato.getId());
            } else {
                log.warn("Número de WhatsApp inválido para lavajato {}", lavajato.getId());
            }
        }
    }

    private String normalizeBrazilianPhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() < 10) return null;
        if (digits.startsWith("55") && digits.length() >= 12) return "+" + digits;
        return "+55" + digits;
    }

    private void sendWhatsAppNotification(String phone, String title, String message, UUID serviceId) {
        String whatsappMessage = "🧼 *" + title + "*\n\n" + message;
        boolean sent = false;
        try {
            sent = evolutionApiService.sendTextMessage(phone, whatsappMessage);
        } catch (Exception e) {
            log.warn("Evolution API falhou ao notificar lavajato {}: {}", serviceId, e.getMessage());
        }
        if (!sent) {
            try {
                sent = baileysRestService.sendTextMessage(phone, whatsappMessage);
            } catch (Exception e) {
                log.warn("Baileys falhou ao notificar lavajato {}: {}", serviceId, e.getMessage());
            }
        }
        if (!sent) {
            log.warn("WhatsApp falhou para lavajato {} no número {}", serviceId, phone);
        }
    }

    // ==================== HELPERS ====================

    private LavajatoService findService(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serviço de lavajato não encontrado com ID: " + id));
    }

    private LavajatoService findServiceScoped(UUID id, UUID companyId) {
        LavajatoService lavajato = findService(id);
        if (lavajato.getCompanyId() != null && companyId != null && !companyId.equals(lavajato.getCompanyId())) {
            throw new ResourceNotFoundException("Serviço de lavajato não encontrado com ID: " + id);
        }
        return lavajato;
    }

    private LavajatoServiceDTO toDTO(LavajatoService lavajato) {
        LavajatoServiceDTO dto = new LavajatoServiceDTO();
        dto.setId(lavajato.getId());
        dto.setVehicleId(lavajato.getVehicle().getId());
        dto.setVehiclePlate(lavajato.getVehicle().getPlate());
        dto.setVehicleModel(lavajato.getVehicle().getModel());
        dto.setVehicleBrand(lavajato.getVehicle().getBrand());
        dto.setVehicleColor(lavajato.getVehicle().getColor());
        // Primeira foto do veículo (photos é separada por vírgula)
        String photos = lavajato.getVehicle().getPhotos();
        if (photos != null && !photos.isBlank()) {
            dto.setVehiclePhotoUrl(photos.split(",")[0].trim());
        }
        if (lavajato.getDriver() != null) {
            dto.setDriverId(lavajato.getDriver().getId());
            dto.setDriverName(lavajato.getDriver().getName());
        }
        dto.setStatus(lavajato.getStatus());
        dto.setChecklistInternal(lavajato.getChecklistInternal());
        dto.setChecklistExternal(lavajato.getChecklistExternal());
        dto.setStartedAt(lavajato.getStartedAt());
        dto.setCompletedAt(lavajato.getCompletedAt());
        dto.setDurationSeconds(lavajato.getDurationSeconds());
        dto.setObservations(lavajato.getObservations());
        dto.setDriverPhone(lavajato.getDriverPhone());
        dto.setDriverUserId(lavajato.getDriverUserId());
        dto.setOperatorId(lavajato.getOperatorId());
        // Buscar nome do operador
        if (lavajato.getOperatorId() != null) {
            userRepository.findById(lavajato.getOperatorId()).ifPresent(user -> dto.setOperatorName(user.getName()));
        }
        dto.setCompanyId(lavajato.getCompanyId());
        dto.setCreatedAt(lavajato.getCreatedAt());
        dto.setUpdatedAt(lavajato.getUpdatedAt());
        return dto;
    }

    /** Atualiza o photoUrl do item (por key) no JSON do checklist. */
    private String attachPhotoToItem(String checklistData, String itemKey, String photoUrl,
                                      String defaultTemplate) {
        try {
            JsonNode root = (checklistData == null || checklistData.isBlank())
                    ? objectMapper.readTree(defaultTemplate)
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

    public static String formatDuration(Long seconds) {
        if (seconds == null) return "—";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        if (h > 0) return String.format("%dh %02dmin", h, m);
        return String.format("%dmin %02ds", m, s);
    }
}
