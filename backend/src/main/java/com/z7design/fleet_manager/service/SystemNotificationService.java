package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.SystemNotification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.SystemNotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemNotificationService {
    
    private final SystemNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    /**
     * Criar nova notificaÃ§Ã£o
     */
    public SystemNotification createNotification(SystemNotification notification) {
        log.info("Criando nova notificaÃ§Ã£o do tipo: {}", notification.getType());
        
        // Validar destinatÃ¡rio se fornecido
        if (notification.getRecipient() != null) {
            User recipient = userRepository.findById(notification.getRecipient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio destinatÃ¡rio nÃ£o encontrado"));
            notification.setRecipient(recipient);
        }
        
        // Definir timestamp se nÃ£o fornecido
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(LocalDateTime.now());
        }
        
        // Definir como nÃ£o lida
        notification.setRead(false);
        
        SystemNotification savedNotification = notificationRepository.save(notification);
        log.info("NotificaÃ§Ã£o criada com sucesso: {}", savedNotification.getId());
        
        return savedNotification;
    }
    
    /**
     * Criar notificaÃ§Ã£o para novo cliente
     */
    public SystemNotification createNewClientNotification(String clientName, String department) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.NOVO_CLIENTE)
            .title("Novo Cliente Cadastrado")
            .description("Um novo cliente foi cadastrado no sistema: " + clientName)
            .priority(SystemNotification.NotificationPriority.MEDIA)
            .clientName(clientName)
            .department(department)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificaÃ§Ã£o para contrato vencendo
     */
    public SystemNotification createContractExpiringNotification(String clientName, String contractReference, 
                                                              LocalDateTime expirationDate, BigDecimal value) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.CONTRATO_VENCENDO)
            .title("Contrato Vencendo")
            .description("Contrato " + contractReference + " vence em " + expirationDate.toLocalDate())
            .priority(SystemNotification.NotificationPriority.ALTA)
            .clientName(clientName)
            .contractReference(contractReference)
            .value(value)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificaÃ§Ã£o para funcionÃ¡rio atrasado
     */
    public SystemNotification createEmployeeLateNotification(String employeeName, String location) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.FUNCIONARIO_ATRASADO)
            .title("FuncionÃ¡rio Atrasado")
            .description("FuncionÃ¡rio " + employeeName + " estÃ¡ atrasado no local: " + location)
            .priority(SystemNotification.NotificationPriority.ALTA)
            .employeeName(employeeName)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificaÃ§Ã£o para ocorrÃªncia
     */
    public SystemNotification createOccurrenceNotification(String employeeName, String occurrenceType, 
                                                        String location, SystemNotification.NotificationPriority priority) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.OCORRENCIA)
            .title("Nova OcorrÃªncia Operacional")
            .description("OcorrÃªncia do tipo " + occurrenceType + " registrada para " + employeeName)
            .priority(priority)
            .employeeName(employeeName)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificaÃ§Ã£o para nova escala
     */
    public SystemNotification createScheduleNotification(String employeeName, String location, LocalDateTime scheduleDate) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.ESCALA)
            .title("Nova Escala de Trabalho")
            .description("Nova escala criada para " + employeeName + " no local " + location + " em " + scheduleDate.toLocalDate())
            .priority(SystemNotification.NotificationPriority.MEDIA)
            .employeeName(employeeName)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Atualizar notificaÃ§Ã£o existente
     */
    public SystemNotification updateNotification(UUID id, SystemNotification notificationDetails) {
        log.info("Atualizando notificaÃ§Ã£o: {}", id);
        
        SystemNotification existingNotification = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("NotificaÃ§Ã£o nÃ£o encontrada"));
        
        // Atualizar campos
        if (notificationDetails.getTitle() != null) {
            existingNotification.setTitle(notificationDetails.getTitle());
        }
        if (notificationDetails.getDescription() != null) {
            existingNotification.setDescription(notificationDetails.getDescription());
        }
        if (notificationDetails.getPriority() != null) {
            existingNotification.setPriority(notificationDetails.getPriority());
        }
        if (notificationDetails.getEmployeeName() != null) {
            existingNotification.setEmployeeName(notificationDetails.getEmployeeName());
        }
        if (notificationDetails.getClientName() != null) {
            existingNotification.setClientName(notificationDetails.getClientName());
        }
        if (notificationDetails.getContractReference() != null) {
            existingNotification.setContractReference(notificationDetails.getContractReference());
        }
        if (notificationDetails.getValue() != null) {
            existingNotification.setValue(notificationDetails.getValue());
        }
        if (notificationDetails.getDepartment() != null) {
            existingNotification.setDepartment(notificationDetails.getDepartment());
        }
        
        SystemNotification updatedNotification = notificationRepository.save(existingNotification);
        log.info("NotificaÃ§Ã£o atualizada com sucesso: {}", updatedNotification.getId());
        
        return updatedNotification;
    }
    
    /**
     * Buscar notificaÃ§Ã£o por ID
     */
    @Transactional(readOnly = true)
    public SystemNotification getNotificationById(UUID id) {
        return notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("NotificaÃ§Ã£o nÃ£o encontrada"));
    }
    
    /**
     * Listar todas as notificaÃ§Ãµes
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getAllNotifications() {
        return notificationRepository.findAll();
    }
    
    /**
     * Buscar notificaÃ§Ãµes por destinatÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.findByRecipientIdOrderByTimestampDesc(recipientId);
    }
    
    /**
     * Buscar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getUnreadNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.findByRecipientIdAndReadFalseOrderByTimestampDesc(recipientId);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por tipo
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByType(SystemNotification.NotificationType type) {
        return notificationRepository.findByTypeOrderByTimestampDesc(type);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por prioridade
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByPriority(SystemNotification.NotificationPriority priority) {
        return notificationRepository.findByPriorityOrderByTimestampDesc(priority);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por perÃ­odo
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        return notificationRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
    }
    
    /**
     * Buscar notificaÃ§Ãµes nÃ£o lidas
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getUnreadNotifications() {
        return notificationRepository.findByReadFalseOrderByTimestampDesc();
    }
    
    /**
     * Buscar notificaÃ§Ãµes por departamento
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByDepartment(String department) {
        return notificationRepository.findByDepartmentOrderByTimestampDesc(department);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByEmployee(String employeeName) {
        return notificationRepository.findByEmployeeNameContainingIgnoreCaseOrderByTimestampDesc(employeeName);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por cliente
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByClient(String clientName) {
        return notificationRepository.findByClientNameContainingIgnoreCaseOrderByTimestampDesc(clientName);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por contrato
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByContract(String contractReference) {
        return notificationRepository.findByContractReferenceOrderByTimestampDesc(contractReference);
    }
    
    /**
     * Buscar notificaÃ§Ãµes por valor mÃ­nimo
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByValueGreaterThan(BigDecimal minValue) {
        return notificationRepository.findByValueGreaterThan(minValue);
    }
    
    /**
     * Buscar notificaÃ§Ãµes recentes (Ãºltimas 24 horas)
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getRecentNotifications() {
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        return notificationRepository.findRecentNotifications(startTime);
    }
    
    /**
     * Marcar notificaÃ§Ã£o como lida
     */
    public void markNotificationAsRead(UUID id) {
        log.info("Marcando notificaÃ§Ã£o como lida: {}", id);
        
        SystemNotification notification = getNotificationById(id);
        notificationRepository.markAsRead(id);
        log.info("NotificaÃ§Ã£o marcada como lida: {}", id);
    }
    
    /**
     * Marcar todas as notificaÃ§Ãµes de um destinatÃ¡rio como lidas
     */
    public void markAllNotificationsAsReadByRecipient(UUID recipientId) {
        log.info("Marcando todas as notificaÃ§Ãµes como lidas para destinatÃ¡rio: {}", recipientId);
        
        notificationRepository.markAllAsReadByRecipient(recipientId);
        log.info("Todas as notificaÃ§Ãµes marcadas como lidas para destinatÃ¡rio: {}", recipientId);
    }
    
    /**
     * Contar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
     */
    @Transactional(readOnly = true)
    public long countUnreadNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }
    
    /**
     * Contar notificaÃ§Ãµes por tipo e perÃ­odo
     */
    @Transactional(readOnly = true)
    public long countNotificationsByTypeAndPeriod(SystemNotification.NotificationType type, 
                                                LocalDateTime startDate, LocalDateTime endDate) {
        return notificationRepository.countByTypeAndPeriod(type, startDate, endDate);
    }
    
    /**
     * Deletar notificaÃ§Ã£o
     */
    public void deleteNotification(UUID id) {
        log.info("Deletando notificaÃ§Ã£o: {}", id);
        
        SystemNotification notification = getNotificationById(id);
        notificationRepository.delete(notification);
        log.info("NotificaÃ§Ã£o deletada com sucesso: {}", id);
    }
    
    /**
     * Deletar notificaÃ§Ãµes antigas (mais de 30 dias)
     */
    public void deleteOldNotifications() {
        log.info("Deletando notificaÃ§Ãµes antigas");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<SystemNotification> oldNotifications = notificationRepository.findByTimestampBetweenOrderByTimestampDesc(
            LocalDateTime.MIN, cutoffDate);
        
        notificationRepository.deleteAll(oldNotifications);
        log.info("{} notificaÃ§Ãµes antigas deletadas", oldNotifications.size());
    }
}

