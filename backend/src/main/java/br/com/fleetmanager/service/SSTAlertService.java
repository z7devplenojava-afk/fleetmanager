package br.com.fleetmanager.service;

import br.com.fleetmanager.model.SSTAlert;
import br.com.fleetmanager.model.enums.SSTAlertType;
import br.com.fleetmanager.repository.SSTAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de alertas SST
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SSTAlertService {

    private final SSTAlertRepository alertRepository;

    /**
     * Cria um novo alerta
     */
    public SSTAlert createAlert(SSTAlert alert) {
        log.info("Criando alerta SST: {}", alert.getTitle());
        return alertRepository.save(alert);
    }

    /**
     * Cria alerta de vencimento de EPI
     */
    public SSTAlert createEPIExpirationAlert(UUID employeeId, String epiName, LocalDate expirationDate) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.EPI_VENCIMENTO);
        alert.setTitle("EPI próximo do vencimento");
        alert.setMessage(String.format("O EPI %s está próximo do vencimento em %s", epiName, expirationDate));
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("EPI_DELIVERY");
        alert.setPriority(3); // Alta prioridade
        alert.setDueDate(expirationDate);
        
        return createAlert(alert);
    }

    /**
     * Cria alerta de vencimento de exame médico
     */
    public SSTAlert createMedicalExamExpirationAlert(UUID employeeId, String examType, LocalDate expirationDate) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.EXAME_VENCIMENTO);
        alert.setTitle("Exame médico próximo do vencimento");
        alert.setMessage(String.format("O exame médico %s está próximo do vencimento em %s", examType, expirationDate));
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("MEDICAL_EXAM");
        alert.setPriority(4); // Crítica prioridade
        alert.setDueDate(expirationDate);
        
        return createAlert(alert);
    }

    /**
     * Cria alerta de vencimento de treinamento
     */
    public SSTAlert createTrainingExpirationAlert(UUID employeeId, String trainingName, LocalDate expirationDate) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.TREINAMENTO_VENCIMENTO);
        alert.setTitle("Treinamento próximo do vencimento");
        alert.setMessage(String.format("O treinamento %s está próximo do vencimento em %s", trainingName, expirationDate));
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("TRAINING_PARTICIPATION");
        alert.setPriority(3); // Alta prioridade
        alert.setDueDate(expirationDate);
        
        return createAlert(alert);
    }

    /**
     * Cria alerta de acidente
     */
    public SSTAlert createAccidentAlert(UUID employeeId, String accidentDescription) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.ACIDENTE);
        alert.setTitle("Acidente registrado");
        alert.setMessage(String.format("Acidente registrado: %s", accidentDescription));
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("ACCIDENT_RECORD");
        alert.setPriority(4); // Crítica prioridade
        alert.setDueDate(LocalDate.now());
        
        return createAlert(alert);
    }

    /**
     * Cria alerta de não conformidade
     */
    public SSTAlert createNonConformityAlert(UUID employeeId, String title, String description, LocalDate dueDate) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.NAO_CONFORMIDADE);
        alert.setTitle(title);
        alert.setMessage(description);
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("NON_CONFORMITY");
        alert.setPriority(3); // Alta prioridade
        alert.setDueDate(dueDate);
        
        return createAlert(alert);
    }

    /**
     * Cria alerta de quase-acidente
     */
    public SSTAlert createNearMissAlert(UUID employeeId, String description) {
        SSTAlert alert = new SSTAlert();
        alert.setAlertType(SSTAlertType.QUASE_ACIDENTE);
        alert.setTitle("Quase-acidente registrado");
        alert.setMessage(String.format("Quase-acidente registrado: %s", description));
        // alert.setEmployee(employee); // TODO: Implementar quando Employee estiver disponível
        alert.setRelatedEntityType("NEAR_MISS_RECORD");
        alert.setPriority(2); // Média prioridade
        alert.setDueDate(LocalDate.now());
        
        return createAlert(alert);
    }

    /**
     * Marca alerta como lido
     */
    public void markAsRead(UUID alertId) {
        log.info("Marcando alerta como lido: {}", alertId);
        alertRepository.findById(alertId).ifPresent(alert -> {
            alert.setIsRead(true);
            alertRepository.save(alert);
        });
    }

    /**
     * Marca alerta como resolvido
     */
    public void markAsResolved(UUID alertId, UUID resolvedByUserId) {
        log.info("Marcando alerta como resolvido: {}", alertId);
        alertRepository.findById(alertId).ifPresent(alert -> {
            alert.setIsResolved(true);
            alert.setResolvedAt(LocalDateTime.now());
            // TODO: Implementar setResolvedByUser quando a entidade User estiver disponível
            alertRepository.save(alert);
        });
    }

    /**
     * Busca alertas por funcionário
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getAlertsByEmployee(UUID employeeId) {
        return alertRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca alertas não lidos por funcionário
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getUnreadAlertsByEmployee(UUID employeeId) {
        // TODO: Implementar quando o método findByEmployeeIdAndIsRead estiver disponível
        return alertRepository.findByEmployeeId(employeeId).stream()
                .filter(alert -> !alert.getIsRead())
                .toList();
    }

    /**
     * Busca alertas não resolvidos por funcionário
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getUnresolvedAlertsByEmployee(UUID employeeId) {
        // TODO: Implementar quando o método findByEmployeeIdAndIsResolved estiver disponível
        return alertRepository.findByEmployeeId(employeeId).stream()
                .filter(alert -> !alert.getIsResolved())
                .toList();
    }

    /**
     * Busca alertas vencidos
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getOverdueAlerts() {
        return alertRepository.findOverdueAlerts(LocalDate.now());
    }

    /**
     * Busca alertas próximos do vencimento
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getAlertsDueSoon(int daysAhead) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(daysAhead);
        return alertRepository.findAlertsDueSoon(startDate, endDate);
    }

    /**
     * Busca alertas não lidos
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getUnreadAlerts() {
        return alertRepository.findByIsReadFalse();
    }

    /**
     * Conta alertas não lidos por funcionário
     */
    @Transactional(readOnly = true)
    public Long countUnreadAlertsByEmployee(UUID employeeId) {
        return alertRepository.countUnreadAlertsByEmployee(employeeId);
    }

    /**
     * Conta alertas não resolvidos por funcionário
     */
    @Transactional(readOnly = true)
    public Long countUnresolvedAlertsByEmployee(UUID employeeId) {
        return alertRepository.countUnresolvedAlertsByEmployee(employeeId);
    }

    /**
     * Busca todos os alertas
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getAllAlerts() {
        return alertRepository.findAll();
    }

    /**
     * Busca alertas por tipo
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getAlertsByType(SSTAlertType alertType) {
        return alertRepository.findByAlertType(alertType);
    }

    /**
     * Busca alertas por prioridade
     */
    @Transactional(readOnly = true)
    public List<SSTAlert> getAlertsByPriority(Integer priority) {
        return alertRepository.findByPriority(priority);
    }

    /**
     * Remove alertas antigos resolvidos (mais de 30 dias)
     */
    public void cleanupOldResolvedAlerts() {
        log.info("Limpando alertas antigos resolvidos");
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<SSTAlert> oldAlerts = alertRepository.findAll().stream()
                .filter(alert -> alert.getIsResolved() && 
                               alert.getResolvedAt() != null && 
                               alert.getResolvedAt().isBefore(cutoffDate))
                .toList();
        
        alertRepository.deleteAll(oldAlerts);
        log.info("Removidos {} alertas antigos", oldAlerts.size());
    }
}
