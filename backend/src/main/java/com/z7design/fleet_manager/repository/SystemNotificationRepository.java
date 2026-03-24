package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, UUID> {
    
    // Buscar notificaÃ§Ãµes por destinatÃ¡rio
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdOrderByTimestampDesc(@Param("recipientId") UUID recipientId);
    
    // Buscar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.read = false ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdAndReadFalseOrderByTimestampDesc(@Param("recipientId") UUID recipientId);
    
    // Buscar notificaÃ§Ãµes por tipo
    List<SystemNotification> findByTypeOrderByTimestampDesc(SystemNotification.NotificationType type);
    
    // Buscar notificaÃ§Ãµes por prioridade
    List<SystemNotification> findByPriorityOrderByTimestampDesc(SystemNotification.NotificationPriority priority);
    
    // Buscar notificaÃ§Ãµes por perÃ­odo
    List<SystemNotification> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar notificaÃ§Ãµes por destinatÃ¡rio e perÃ­odo
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.timestamp BETWEEN :startDate AND :endDate ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdAndTimestampBetweenOrderByTimestampDesc(
        @Param("recipientId") UUID recipientId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar notificaÃ§Ãµes por tipo e perÃ­odo
    List<SystemNotification> findByTypeAndTimestampBetweenOrderByTimestampDesc(
        SystemNotification.NotificationType type, LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar notificaÃ§Ãµes nÃ£o lidas
    List<SystemNotification> findByReadFalseOrderByTimestampDesc();
    
    // Buscar notificaÃ§Ãµes por departamento
    List<SystemNotification> findByDepartmentOrderByTimestampDesc(String department);
    
    // Buscar notificaÃ§Ãµes por funcionÃ¡rio
    List<SystemNotification> findByEmployeeNameContainingIgnoreCaseOrderByTimestampDesc(String employeeName);
    
    // Buscar notificaÃ§Ãµes por cliente
    List<SystemNotification> findByClientNameContainingIgnoreCaseOrderByTimestampDesc(String clientName);
    
    // Contar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
    @Query("SELECT COUNT(n) FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.read = false")
    long countByRecipientIdAndReadFalse(@Param("recipientId") UUID recipientId);
    
    // Contar notificaÃ§Ãµes por tipo e perÃ­odo
    @Query("SELECT COUNT(n) FROM SystemNotification n WHERE n.type = :type AND n.timestamp BETWEEN :startDate AND :endDate")
    long countByTypeAndPeriod(@Param("type") SystemNotification.NotificationType type,
                              @Param("startDate") LocalDateTime startDate, 
                              @Param("endDate") LocalDateTime endDate);
    
    // Marcar notificaÃ§Ã£o como lida
    @Modifying
    @Transactional
    @Query("UPDATE SystemNotification n SET n.read = true WHERE n.id = :id")
    void markAsRead(@Param("id") UUID id);
    
    // Marcar todas as notificaÃ§Ãµes de um destinatÃ¡rio como lidas
    @Modifying
    @Transactional
    @Query("UPDATE SystemNotification n SET n.read = true WHERE n.recipient.id = :recipientId")
    void markAllAsReadByRecipient(@Param("recipientId") UUID recipientId);
    
    // Buscar notificaÃ§Ãµes por contrato
    List<SystemNotification> findByContractReferenceOrderByTimestampDesc(String contractReference);
    
    // Buscar notificaÃ§Ãµes por valor (para notificaÃ§Ãµes financeiras)
    @Query("SELECT n FROM SystemNotification n WHERE n.value IS NOT NULL AND n.value > :minValue ORDER BY n.timestamp DESC")
    List<SystemNotification> findByValueGreaterThan(@Param("minValue") java.math.BigDecimal minValue);
    
    // Buscar notificaÃ§Ãµes recentes (Ãºltimas 24 horas)
    @Query("SELECT n FROM SystemNotification n WHERE n.timestamp >= :startTime ORDER BY n.timestamp DESC")
    List<SystemNotification> findRecentNotifications(@Param("startTime") LocalDateTime startTime);
}

