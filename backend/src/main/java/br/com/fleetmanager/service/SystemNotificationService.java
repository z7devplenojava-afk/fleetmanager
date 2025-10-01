package br.com.fleetmanager.service;

import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.SystemNotification;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.repository.SystemNotificationRepository;
import br.com.fleetmanager.repository.UserRepository;
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
     * Criar nova notificação
     */
    public SystemNotification createNotification(SystemNotification notification) {
        log.info("Criando nova notificação do tipo: {}", notification.getType());
        
        // Validar destinatário se fornecido
        if (notification.getRecipient() != null) {
            User recipient = userRepository.findById(notification.getRecipient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário destinatário não encontrado"));
            notification.setRecipient(recipient);
        }
        
        // Definir timestamp se não fornecido
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(LocalDateTime.now());
        }
        
        // Definir como não lida
        notification.setRead(false);
        
        SystemNotification savedNotification = notificationRepository.save(notification);
        log.info("Notificação criada com sucesso: {}", savedNotification.getId());
        
        return savedNotification;
    }
    
    /**
     * Criar notificação para novo cliente
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
     * Criar notificação para contrato vencendo
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
     * Criar notificação para funcionário atrasado
     */
    public SystemNotification createEmployeeLateNotification(String employeeName, String location) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.FUNCIONARIO_ATRASADO)
            .title("Funcionário Atrasado")
            .description("Funcionário " + employeeName + " está atrasado no local: " + location)
            .priority(SystemNotification.NotificationPriority.ALTA)
            .employeeName(employeeName)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificação para ocorrência
     */
    public SystemNotification createOccurrenceNotification(String employeeName, String occurrenceType, 
                                                        String location, SystemNotification.NotificationPriority priority) {
        SystemNotification notification = SystemNotification.builder()
            .type(SystemNotification.NotificationType.OCORRENCIA)
            .title("Nova Ocorrência Operacional")
            .description("Ocorrência do tipo " + occurrenceType + " registrada para " + employeeName)
            .priority(priority)
            .employeeName(employeeName)
            .build();
        
        return createNotification(notification);
    }
    
    /**
     * Criar notificação para nova escala
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
     * Atualizar notificação existente
     */
    public SystemNotification updateNotification(UUID id, SystemNotification notificationDetails) {
        log.info("Atualizando notificação: {}", id);
        
        SystemNotification existingNotification = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));
        
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
        log.info("Notificação atualizada com sucesso: {}", updatedNotification.getId());
        
        return updatedNotification;
    }
    
    /**
     * Buscar notificação por ID
     */
    @Transactional(readOnly = true)
    public SystemNotification getNotificationById(UUID id) {
        return notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));
    }
    
    /**
     * Listar todas as notificações
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getAllNotifications() {
        return notificationRepository.findAll();
    }
    
    /**
     * Buscar notificações por destinatário
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.findByRecipientIdOrderByTimestampDesc(recipientId);
    }
    
    /**
     * Buscar notificações não lidas por destinatário
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getUnreadNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.findByRecipientIdAndReadFalseOrderByTimestampDesc(recipientId);
    }
    
    /**
     * Buscar notificações por tipo
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByType(SystemNotification.NotificationType type) {
        return notificationRepository.findByTypeOrderByTimestampDesc(type);
    }
    
    /**
     * Buscar notificações por prioridade
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByPriority(SystemNotification.NotificationPriority priority) {
        return notificationRepository.findByPriorityOrderByTimestampDesc(priority);
    }
    
    /**
     * Buscar notificações por período
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        return notificationRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
    }
    
    /**
     * Buscar notificações não lidas
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getUnreadNotifications() {
        return notificationRepository.findByReadFalseOrderByTimestampDesc();
    }
    
    /**
     * Buscar notificações por departamento
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByDepartment(String department) {
        return notificationRepository.findByDepartmentOrderByTimestampDesc(department);
    }
    
    /**
     * Buscar notificações por funcionário
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByEmployee(String employeeName) {
        return notificationRepository.findByEmployeeNameContainingIgnoreCaseOrderByTimestampDesc(employeeName);
    }
    
    /**
     * Buscar notificações por cliente
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByClient(String clientName) {
        return notificationRepository.findByClientNameContainingIgnoreCaseOrderByTimestampDesc(clientName);
    }
    
    /**
     * Buscar notificações por contrato
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByContract(String contractReference) {
        return notificationRepository.findByContractReferenceOrderByTimestampDesc(contractReference);
    }
    
    /**
     * Buscar notificações por valor mínimo
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getNotificationsByValueGreaterThan(BigDecimal minValue) {
        return notificationRepository.findByValueGreaterThan(minValue);
    }
    
    /**
     * Buscar notificações recentes (últimas 24 horas)
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getRecentNotifications() {
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        return notificationRepository.findRecentNotifications(startTime);
    }
    
    /**
     * Marcar notificação como lida
     */
    public void markNotificationAsRead(UUID id) {
        log.info("Marcando notificação como lida: {}", id);
        
        SystemNotification notification = getNotificationById(id);
        notificationRepository.markAsRead(id);
        log.info("Notificação marcada como lida: {}", id);
    }
    
    /**
     * Marcar todas as notificações de um destinatário como lidas
     */
    public void markAllNotificationsAsReadByRecipient(UUID recipientId) {
        log.info("Marcando todas as notificações como lidas para destinatário: {}", recipientId);
        
        notificationRepository.markAllAsReadByRecipient(recipientId);
        log.info("Todas as notificações marcadas como lidas para destinatário: {}", recipientId);
    }
    
    /**
     * Contar notificações não lidas por destinatário
     */
    @Transactional(readOnly = true)
    public long countUnreadNotificationsByRecipient(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }
    
    /**
     * Contar notificações por tipo e período
     */
    @Transactional(readOnly = true)
    public long countNotificationsByTypeAndPeriod(SystemNotification.NotificationType type, 
                                                LocalDateTime startDate, LocalDateTime endDate) {
        return notificationRepository.countByTypeAndPeriod(type, startDate, endDate);
    }
    
    /**
     * Deletar notificação
     */
    public void deleteNotification(UUID id) {
        log.info("Deletando notificação: {}", id);
        
        SystemNotification notification = getNotificationById(id);
        notificationRepository.delete(notification);
        log.info("Notificação deletada com sucesso: {}", id);
    }
    
    /**
     * Deletar notificações antigas (mais de 30 dias)
     */
    public void deleteOldNotifications() {
        log.info("Deletando notificações antigas");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<SystemNotification> oldNotifications = notificationRepository.findByTimestampBetweenOrderByTimestampDesc(
            LocalDateTime.MIN, cutoffDate);
        
        notificationRepository.deleteAll(oldNotifications);
        log.info("{} notificações antigas deletadas", oldNotifications.size());
    }
}
