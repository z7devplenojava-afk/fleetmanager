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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Gestão de limpeza interna e externa dos veículos.
 * <p>
 * Fluxo: o responsável cria a ordem -> o responsável pela limpeza executa o
 * checklist (interno/externo) com fotos por item -> ao finalizar, o sistema
 * notifica o motorista (notificação interna no sino + WhatsApp quando o número
 * estiver configurado).
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

    /** Template padrão de itens do checklist (interno + externo). */
    private static final String DEFAULT_CHECKLIST_TEMPLATE = """
            [
              {"key":"capas-banco","title":"Capas de Banco","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"banheiro","title":"Limpeza do Banheiro (quando houver)","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"geladeira","title":"Itens da Geladeira","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"limpeza-interna","title":"Limpeza Interna Geral","category":"INTERNAL","checked":false,"photoUrl":null},
              {"key":"lavagem-carroceria","title":"Lavagem de Carroceria","category":"EXTERNAL","checked":false,"photoUrl":null},
              {"key":"pretinho-pneus","title":"Pretinho nos Pneus","category":"EXTERNAL","checked":false,"photoUrl":null},
              {"key":"limpeza-rodas","title":"Limpeza de Rodas","category":"EXTERNAL","checked":false,"photoUrl":null}
            ]
            """;

    // ==================== LEITURA ====================

    public List<VehicleCleaningOrderDTO> list(UUID vehicleId, VehicleCleaningOrder.CleaningStatus status,
                                              UUID companyId) {
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
                .map(this::toDTO)
                .toList();
    }

    public VehicleCleaningOrderDTO getById(UUID id, UUID companyId) {
        return toDTO(findOrderScoped(id, companyId));
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

        // WhatsApp do motorista: se nÃ£o informado no pedido, usa o telefone cadastrado no motorista
        String driverPhone = request.getDriverPhone();
        if ((driverPhone == null || driverPhone.isBlank()) && driver != null
                && driver.getPhone() != null && !driver.getPhone().isBlank()) {
            driverPhone = driver.getPhone();
        }

        String checklist = (request.getChecklistData() != null && !request.getChecklistData().isBlank())
                ? request.getChecklistData()
                : DEFAULT_CHECKLIST_TEMPLATE;

        VehicleCleaningOrder order = VehicleCleaningOrder.builder()
                .vehicle(vehicle)
                .driver(driver)
                .status(VehicleCleaningOrder.CleaningStatus.PENDING)
                .cleaningType(request.getCleaningType())
                .checklistData(checklist)
                .observations(request.getObservations())
                .driverPhone(driverPhone)
                .driverUserId(request.getDriverUserId())
                .requestedBy(currentUser.getId())
                .companyId(userCompanyId != null ? userCompanyId : vehicle.getCompanyId())
                .build();

        order = repository.save(order);
        log.info("Ordem de limpeza criada: id={}, veículo={}, tipo={}",
                order.getId(), vehicle.getPlate(), order.getCleaningType());
        return toDTO(order);
    }

    @Transactional
    public VehicleCleaningOrderDTO start(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        if (order.getStatus() == VehicleCleaningOrder.CleaningStatus.COMPLETED) {
            throw new IllegalStateException("Ordem de limpeza já foi finalizada");
        }
        order.setStatus(VehicleCleaningOrder.CleaningStatus.IN_PROGRESS);
        order = repository.save(order);
        log.info("Ordem de limpeza iniciada: id={}", id);
        return toDTO(order);
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

    /** Marca a ordem como finalizada e notifica o motorista (interno + WhatsApp). */
    @Transactional
    public VehicleCleaningOrderDTO complete(UUID id, UUID companyId) {
        VehicleCleaningOrder order = findOrderScoped(id, companyId);
        order.setStatus(VehicleCleaningOrder.CleaningStatus.COMPLETED);
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

    // ==================== NOTIFICAÇÃO AO MOTORISTA ====================

    private void notifyDriver(VehicleCleaningOrder order) {
        String vehiclePlate = order.getVehicle().getPlate();
        String title = "Limpeza finalizada";
        String message = String.format(
                "A limpeza do veículo %s foi finalizada. O veículo está pronto para uso.", vehiclePlate);

        // 1) Notificação interna (sino) — para a conta do motorista ou do solicitante
        UUID targetUserId = order.getDriverUserId() != null ? order.getDriverUserId() : order.getRequestedBy();
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
                            .companyId(order.getCompanyId())
                            .build();
                    notificationService.create(notification);
                    log.info("Notificação interna enviada para o usuário {} (limpeza {})", targetUserId, order.getId());
                }
            } catch (Exception e) {
                log.warn("Falha ao criar notificação interna da limpeza {}: {}", order.getId(), e.getMessage());
            }
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
