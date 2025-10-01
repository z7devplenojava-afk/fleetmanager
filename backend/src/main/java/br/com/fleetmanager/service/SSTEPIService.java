package br.com.fleetmanager.service;

import br.com.fleetmanager.model.*;
// import br.com.fleetmanager.model.enums.EPICategory;
// import br.com.fleetmanager.model.enums.EPIDeliveryReason;
import br.com.fleetmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de EPIs
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SSTEPIService {

    private final PersonalProtectiveEquipmentRepository epiRepository;
    private final EPIDeliveryRepository deliveryRepository;
    private final SSTAlertService alertService;

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
        // TODO: Implementar quando findByCategory estiver disponível
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
     * Busca EPIs com CA vencido ou próximo do vencimento
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
            
            // Verifica se o estoque está baixo e cria alerta se necessário
            if (newStock <= epi.getMinimumStock()) {
                alertService.createNonConformityAlert(
                    null, // TODO: Definir funcionário responsável
                    "Estoque baixo de EPI",
                    String.format("O EPI %s está com estoque baixo (%d unidades)", epi.getName(), newStock),
                    LocalDate.now().plusDays(7)
                );
            }
        });
    }

    // ========== CONTROLE DE ENTREGA ==========

    /**
     * Registra entrega de EPI
     */
    public EPIDelivery deliverEPI(UUID employeeId, UUID epiId, Integer quantity, String reason, UUID deliveredByUserId, String notes) {
        log.info("Registrando entrega de EPI {} para funcionário {}", epiId, employeeId);
        
        // Verifica se há estoque suficiente
        PersonalProtectiveEquipment epi = getEPIById(epiId);
        if (epi == null) {
            throw new IllegalArgumentException("EPI não encontrado");
        }
        
        if (epi.getCurrentStock() < quantity) {
            throw new IllegalArgumentException("Estoque insuficiente");
        }
        
        // Cria registro de entrega
        // TODO: Implementar quando as entidades Employee, PersonalProtectiveEquipment e User estiverem disponíveis
        EPIDelivery delivery = new EPIDelivery();
        // delivery.setEmployee(employee);
        // delivery.setEpi(epi);
        delivery.setDeliveryDate(LocalDate.now());
        delivery.setQuantity(quantity);
        // delivery.setDeliveryReason(reason); // TODO: Implementar quando EPIDeliveryReason estiver disponível
        // delivery.setDeliveredByUser(deliveredByUser);
        delivery.setReceivedByEmployee(false);
        delivery.setNotes(notes);
        
        EPIDelivery savedDelivery = deliveryRepository.save(delivery);
        
        // Atualiza estoque
        updateEPIStock(epiId, epi.getCurrentStock() - quantity);
        
        return savedDelivery;
    }

    /**
     * Confirma recebimento do EPI pelo funcionário
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
     * Busca entregas por funcionário
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getDeliveriesByEmployee(UUID employeeId) {
        return deliveryRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca entregas por período
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getDeliveriesByPeriod(LocalDate startDate, LocalDate endDate) {
        return deliveryRepository.findByDeliveryDateBetween(startDate, endDate);
    }

    /**
     * Busca entregas não confirmadas
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getUnconfirmedDeliveries() {
        return deliveryRepository.findByReceivedByEmployeeFalse();
    }

    /**
     * Busca última entrega de um EPI para um funcionário
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> getLatestDeliveryByEmployeeAndEPI(UUID employeeId, UUID epiId) {
        return deliveryRepository.findLatestDeliveryByEmployeeAndEpi(employeeId, epiId);
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Verifica se funcionário precisa de reposição de EPI
     */
    @Transactional(readOnly = true)
    public boolean needsEPIReplacement(UUID employeeId, UUID epiId, int daysSinceLastDelivery) {
        List<EPIDelivery> deliveries = getLatestDeliveryByEmployeeAndEPI(employeeId, epiId);
        
        if (deliveries.isEmpty()) {
            return true; // Nunca recebeu este EPI
        }
        
        EPIDelivery lastDelivery = deliveries.get(0);
        LocalDate lastDeliveryDate = lastDelivery.getDeliveryDate();
        
        // TODO: Implementar lógica baseada na frequência de reposição do EPI
        // Por enquanto, considera 30 dias como padrão
        return lastDeliveryDate.plusDays(30).isBefore(LocalDate.now());
    }

    /**
     * Gera relatório de EPIs por funcionário
     */
    @Transactional(readOnly = true)
    public List<EPIDelivery> generateEmployeeEPIReport(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        // TODO: Implementar quando o método findByEmployeeAndDeliveryDateBetween estiver disponível
        return deliveryRepository.findByDeliveryDateBetween(startDate, endDate);
    }

    /**
     * Gera relatório de estoque de EPIs
     */
    @Transactional(readOnly = true)
    public List<PersonalProtectiveEquipment> generateStockReport() {
        return getActiveEPIs();
    }
}