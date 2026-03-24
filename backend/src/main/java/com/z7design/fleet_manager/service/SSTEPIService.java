package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EPIStockDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.EPICategory;
import com.z7design.fleet_manager.model.enums.EPIDeliveryReason;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ServiÃ§o para gerenciamento de EPIs
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SSTEPIService {

    private final PersonalProtectiveEquipmentRepository epiRepository;
    private final EPIDeliveryRepository deliveryRepository;
    private final SSTAlertService alertService;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    // ========== GERENCIAMENTO DE EPIs ==========

    /**
     * Cria um novo EPI
     */
    public PersonalProtectiveEquipment createEPI(PersonalProtectiveEquipment epi) {
        log.info("Criando EPI: {}", epi.getName());
        return epiRepository.save(epi);
    }

    /**
     * Busca todos os EPIs
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> getAllEPIs() {
        return epiRepository.findAll();
    }

    /**
     * Busca EPIs por categoria
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> getEPIsByCategory(String category) {
        // TODO: Implementar quando findByCategory estiver disponÃ­vel
        return epiRepository.findAll();
    }

    /**
     * Busca EPIs ativos
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> getActiveEPIs() {
        return epiRepository.findByIsActiveTrue();
    }

    /**
     * Busca EPI por ID
     */
    @Transactional(readOnly = true)
    public PersonalProtectiveEquipment getEPIById(UUID id) {
        return epiRepository.findById(id).orElse(null);
    }

    /**
     * Atualiza EPI
     */
    public PersonalProtectiveEquipment updateEPI(UUID id, PersonalProtectiveEquipment epi) {
        log.info("Atualizando EPI: {}", id);
        return epiRepository.findById(id)
                .map(existing -> {
                    existing.setName(epi.getName());
                    existing.setDescription(epi.getDescription());
                    existing.setCategory(epi.getCategory());
                    existing.setCaNumber(epi.getCaNumber());
                    existing.setCaValidity(epi.getCaValidity());
                    existing.setManufacturer(epi.getManufacturer());
                    existing.setModel(epi.getModel());
                    existing.setUnitOfMeasurement(epi.getUnitOfMeasurement());
                    existing.setMinimumStock(epi.getMinimumStock());
                    existing.setCurrentStock(epi.getCurrentStock());
                    existing.setUnitCost(epi.getUnitCost());
                    existing.setIsActive(epi.getIsActive());
                    return epiRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Desativa EPI
     */
    public void deactivateEPI(UUID id) {
        log.info("Desativando EPI: {}", id);
        epiRepository.findById(id).ifPresent(epi -> {
            epi.setIsActive(false);
            epiRepository.save(epi);
        });
    }

    /**
     * Busca EPIs com estoque baixo
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> getEPIsWithLowStock() {
        return epiRepository.findWithLowStock();
    }

    /**
     * Busca EPIs com CA vencido ou prÃ³ximo do vencimento
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> getEPIsWithExpiredOrExpiringCA(int daysAhead) {
        LocalDate checkDate = LocalDate.now().plusDays(daysAhead);
        return epiRepository.findWithExpiredOrExpiringCA(checkDate);
    }

    /**
     * Atualiza estoque do EPI
     */
    public void updateEPIStock(UUID epiId, Integer newStock) {
        log.info("Atualizando estoque do EPI {} para {}", epiId, newStock);
        epiRepository.findById(epiId).ifPresent(epi -> {
            epi.setCurrentStock(newStock);
            epiRepository.save(epi);
            
            // Verifica se o estoque estÃ¡ baixo e cria alerta se necessÃ¡rio
            if (newStock <= epi.getMinimumStock()) {
                alertService.createNonConformityAlert(
                    null, // TODO: Definir funcionÃ¡rio responsÃ¡vel
                    "Estoque baixo de EPI",
                    String.format("O EPI %s estÃ¡ com estoque baixo (%d unidades)", epi.getName(), newStock),
                    LocalDate.now().plusDays(7)
                );
            }
        });
    }

    // ========== CONTROLE DE ENTREGA ==========

    /**
     * Registra entrega de EPI
     */
    public EPIDelivery deliverEPI(UUID employeeId, UUID epiId, Integer quantity, String reason, UUID deliveredByUserId, String notes, LocalDate deliveryDate) {
        log.info("Registrando entrega de EPI {} para funcionÃ¡rio {} na data {}", epiId, employeeId, deliveryDate);
        
        // Busca o funcionÃ¡rio
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Verifica se hÃ¡ estoque suficiente
        PersonalProtectiveEquipment epi = getEPIById(epiId);
        if (epi == null) {
            throw new IllegalArgumentException("EPI nÃ£o encontrado");
        }
        
        if (epi.getCurrentStock() < quantity) {
            throw new IllegalArgumentException("Estoque insuficiente");
        }
        
        // Converte o motivo da entrega (string) para enum
        EPIDeliveryReason deliveryReason;
        try {
            deliveryReason = EPIDeliveryReason.valueOf(reason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Motivo de entrega invÃ¡lido: " + reason);
        }
        
        // Busca o usuÃ¡rio que estÃ¡ fazendo a entrega (se fornecido)
        User deliveredByUser = null;
        if (deliveredByUserId != null) {
            deliveredByUser = userRepository.findById(deliveredByUserId)
                .orElse(null); // NÃ£o Ã© obrigatÃ³rio, pode ser null
        }
        
        // Cria registro de entrega
        EPIDelivery delivery = new EPIDelivery();
        delivery.setEmployee(employee);
        delivery.setEpi(epi);
        delivery.setDeliveryDate(deliveryDate != null ? deliveryDate : LocalDate.now());
        delivery.setQuantity(quantity);
        delivery.setDeliveryReason(deliveryReason);
        delivery.setDeliveredByUser(deliveredByUser);
        delivery.setReceivedByEmployee(false);
        delivery.setNotes(notes);
        
        EPIDelivery savedDelivery = deliveryRepository.save(delivery);
        
        // Atualiza estoque
        updateEPIStock(epiId, epi.getCurrentStock() - quantity);
        
        return savedDelivery;
    }

    /**
     * Confirma recebimento do EPI pelo funcionÃ¡rio
     */
    public void confirmEPIReceipt(UUID deliveryId, String signatureUrl) {
        log.info("Confirmando recebimento do EPI: {}", deliveryId);
        deliveryRepository.findById(deliveryId).ifPresent(delivery -> {
            delivery.setReceivedByEmployee(true);
            delivery.setEmployeeSignatureUrl(signatureUrl);
            deliveryRepository.save(delivery);
        });
    }

    /**
     * Busca entregas por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getDeliveriesByEmployee(UUID employeeId) {
        return deliveryRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca todas as entregas de um EPI especÃ­fico
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getDeliveriesByEPI(UUID epiId) {
        PersonalProtectiveEquipment epi = epiRepository.findById(epiId).orElse(null);
        if (epi == null) {
            log.warn("EPI nÃ£o encontrado: {}", epiId);
            return List.of();
        }
        return deliveryRepository.findByEpi(epi);
    }

    /**
     * Busca entregas por perÃ­odo
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getDeliveriesByPeriod(LocalDate startDate, LocalDate endDate) {
        return deliveryRepository.findByDeliveryDateBetween(startDate, endDate);
    }

    /**
     * Busca entregas nÃ£o confirmadas
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getUnconfirmedDeliveries() {
        return deliveryRepository.findByReceivedByEmployeeFalse();
    }

    /**
     * Busca Ãºltima entrega de um EPI para um funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getLatestDeliveryByEmployeeAndEPI(UUID employeeId, UUID epiId) {
        return deliveryRepository.findLatestDeliveryByEmployeeAndEpi(employeeId, epiId);
    }

    // ========== MÃ‰TODOS AUXILIARES ==========

    /**
     * Verifica se funcionÃ¡rio precisa de reposiÃ§Ã£o de EPI
     */
    @Transactional(readOnly = true)
    public boolean needsEPIReplacement(UUID employeeId, UUID epiId, int daysSinceLastDelivery) {
        List<EPIDelivery> deliveries = getLatestDeliveryByEmployeeAndEPI(employeeId, epiId);
        
        if (deliveries.isEmpty()) {
            return true; // Nunca recebeu este EPI
        }
        
        EPIDelivery lastDelivery = deliveries.get(0);
        LocalDate lastDeliveryDate = lastDelivery.getDeliveryDate();
        
        // TODO: Implementar lÃ³gica baseada na frequÃªncia de reposiÃ§Ã£o do EPI
        // Por enquanto, considera 30 dias como padrÃ£o
        return lastDeliveryDate.plusDays(30).isBefore(LocalDate.now());
    }

    /**
     * Gera relatÃ³rio de EPIs por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> generateEmployeeEPIReport(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        // TODO: Implementar quando o mÃ©todo findByEmployeeAndDeliveryDateBetween estiver disponÃ­vel
        return deliveryRepository.findByDeliveryDateBetween(startDate, endDate);
    }

    /**
     * Gera relatÃ³rio de estoque de EPIs
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> generateStockReport() {
        return getActiveEPIs();
    }

    // ========== ESTOQUE DE EPIs (Formato Frontend) ==========

    /**
     * Busca todos os EPIs no formato de estoque para o frontend
     */
    @Transactional(readOnly = true)
    public List<EPIStockDTO> getEPIStockInventory() {
        List<PersonalProtectiveEquipment> epis = getAllEPIs();
        log.info("ðŸ“¦ Buscando estoque de EPIs. Total encontrado no banco: {}", epis.size());
        
        if (epis.isEmpty()) {
            log.warn("âš ï¸ Nenhum EPI encontrado no banco de dados. Retornando lista vazia.");
        }
        
        List<EPIStockDTO> stock = epis.stream()
                .map(this::convertToEPIStockDTO)
                .collect(Collectors.toList());
        
        log.info("âœ… Convertidos {} EPIs para EPIStockDTO", stock.size());
        return stock;
    }

    /**
     * Busca EPIs ativos no formato de estoque para o frontend
     */
    @Transactional(readOnly = true)
    public List<EPIStockDTO> getActiveEPIStockInventory() {
        List<PersonalProtectiveEquipment> epis = getActiveEPIs();
        return epis.stream()
                .map(this::convertToEPIStockDTO)
                .collect(Collectors.toList());
    }

    /**
     * Converte PersonalProtectiveEquipment para EPIStockDTO
     */
    private EPIStockDTO convertToEPIStockDTO(PersonalProtectiveEquipment epi) {
        // Calcular quantidade atribuÃ­da (entregas nÃ£o retornadas)
        Integer assignedQuantity = calculateAssignedQuantity(epi.getId());
        Integer availableQuantity = Math.max(0, epi.getCurrentStock() - assignedQuantity);

        // Mapear categoria para tipo
        String type = mapCategoryToType(epi.getCategory());

        // Mapear status
        String status = epi.getIsActive() ? "ACTIVE" : "INACTIVE";
        
        // Verificar se estÃ¡ expirado (baseado no CA)
        if (epi.getCaValidity() != null && epi.getCaValidity().isBefore(LocalDate.now())) {
            status = "EXPIRED";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        return EPIStockDTO.builder()
                .id(epi.getId())
                .name(epi.getName())
                .description(epi.getDescription())
                .type(type)
                .brand(epi.getManufacturer() != null ? epi.getManufacturer() : "N/A")
                .model(epi.getModel() != null ? epi.getModel() : "N/A")
                .size(null) // NÃ£o disponÃ­vel no modelo atual
                .color(null) // NÃ£o disponÃ­vel no modelo atual
                .certification(epi.getCaNumber() != null ? epi.getCaNumber() : "")
                .status(status)
                .quantity(epi.getCurrentStock())
                .availableQuantity(availableQuantity)
                .unitPrice(epi.getUnitCost() != null ? epi.getUnitCost() : java.math.BigDecimal.ZERO)
                .supplier(epi.getManufacturer() != null ? epi.getManufacturer() : "N/A")
                .purchaseDate(null) // NÃ£o disponÃ­vel no modelo atual
                .expiryDate(epi.getCaValidity() != null ? epi.getCaValidity().toString() : null)
                .lastMaintenanceDate(null) // NÃ£o disponÃ­vel no modelo atual
                .nextMaintenanceDate(null) // NÃ£o disponÃ­vel no modelo atual
                .location("Almoxarifado") // Valor padrÃ£o, pode ser expandido no futuro
                .notes(epi.getDescription())
                .createdAt(epi.getCreatedAt() != null ? epi.getCreatedAt().format(formatter) : null)
                .updatedAt(epi.getUpdatedAt() != null ? epi.getUpdatedAt().format(formatter) : null)
                .build();
    }

    /**
     * Calcula a quantidade atribuÃ­da (entregas nÃ£o retornadas) de um EPI
     */
    private Integer calculateAssignedQuantity(UUID epiId) {
        try {
            // Buscar o EPI primeiro
            PersonalProtectiveEquipment epi = epiRepository.findById(epiId).orElse(null);
            if (epi == null) {
                return 0;
            }

            // Buscar todas as entregas deste EPI
            // Por enquanto, vamos somar todas as entregas (assumindo que nÃ£o hÃ¡ sistema de retorno)
            List<EPIDelivery> deliveries = deliveryRepository.findByEpi(epi);
            
            if (deliveries == null || deliveries.isEmpty()) {
                return 0;
            }

            // Somar quantidades de todas as entregas
            // TODO: Implementar lÃ³gica de retorno quando disponÃ­vel
            return deliveries.stream()
                    .mapToInt(EPIDelivery::getQuantity)
                    .sum();
        } catch (Exception e) {
            log.warn("Erro ao calcular quantidade atribuÃ­da para EPI {}: {}", epiId, e.getMessage());
            return 0;
        }
    }

    /**
     * Mapeia EPICategory para o tipo esperado pelo frontend
     */
    private String mapCategoryToType(EPICategory category) {
        if (category == null) {
            return "OTHER";
        }
        
        switch (category) {
            case CABECA:
                return "HELMET";
            case MAOS:
                return "GLOVES";
            case OLHOS:
                return "SAFETY_GLASSES";
            case PES:
                return "SAFETY_SHOES";
            case CORPO:
                return "UNIFORM";
            case RESPIRATORIO:
                return "RESPIRATOR";
            default:
                return "OTHER";
        }
    }
}
