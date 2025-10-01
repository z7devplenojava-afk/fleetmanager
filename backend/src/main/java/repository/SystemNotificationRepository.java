package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, UUID> {
    
    // Buscar notificações por destinatário
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdOrderByTimestampDesc(@Param("recipientId") UUID recipientId);
    
    // Buscar notificações não lidas por destinatário
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.read = false ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdAndReadFalseOrderByTimestampDesc(@Param("recipientId") UUID recipientId);
    
    // Buscar notificações por tipo
    List<SystemNotification> findByTypeOrderByTimestampDesc(SystemNotification.NotificationType type);
    
    // Buscar notificações por prioridade
    List<SystemNotification> findByPriorityOrderByTimestampDesc(SystemNotification.NotificationPriority priority);
    
    // Buscar notificações por período
    List<SystemNotification> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar notificações por destinatário e período
    @Query("SELECT n FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.timestamp BETWEEN :startDate AND :endDate ORDER BY n.timestamp DESC")
    List<SystemNotification> findByRecipientIdAndTimestampBetweenOrderByTimestampDesc(
        @Param("recipientId") UUID recipientId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Buscar notificações por tipo e período
    List<SystemNotification> findByTypeAndTimestampBetweenOrderByTimestampDesc(
        SystemNotification.NotificationType type, LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar notificações não lidas
    List<SystemNotification> findByReadFalseOrderByTimestampDesc();
    
    // Buscar notificações por departamento
    List<SystemNotification> findByDepartmentOrderByTimestampDesc(String department);
    
    // Buscar notificações por funcionário
    List<SystemNotification> findByEmployeeNameContainingIgnoreCaseOrderByTimestampDesc(String employeeName);
    
    // Buscar notificações por cliente
    List<SystemNotification> findByClientNameContainingIgnoreCaseOrderByTimestampDesc(String clientName);
    
    // Contar notificações não lidas por destinatário
    @Query("SELECT COUNT(n) FROM SystemNotification n WHERE n.recipient.id = :recipientId AND n.read = false")
    long countByRecipientIdAndReadFalse(@Param("recipientId") UUID recipientId);
    
    // Contar notificações por tipo e período
    @Query("SELECT COUNT(n) FROM SystemNotification n WHERE n.type = :type AND n.timestamp BETWEEN :startDate AND :endDate")
    long countByTypeAndPeriod(@Param("type") SystemNotification.NotificationType type,
                              @Param("startDate") LocalDateTime startDate, 
                              @Param("endDate") LocalDateTime endDate);
    
    // Marcar notificação como lida
    @Modifying
    @Query("UPDATE SystemNotification n SET n.read = true WHERE n.id = :id")
    void markAsRead(@Param("id") UUID id);
    
    // Marcar todas as notificações de um destinatário como lidas
    @Modifying
    @Query("UPDATE SystemNotification n SET n.read = true WHERE n.recipient.id = :recipientId")
    void markAllAsReadByRecipient(@Param("recipientId") UUID recipientId);
    
    // Buscar notificações por contrato
    List<SystemNotification> findByContractReferenceOrderByTimestampDesc(String contractReference);
    
    // Buscar notificações por valor (para notificações financeiras)
    @Query("SELECT n FROM SystemNotification n WHERE n.value IS NOT NULL AND n.value > :minValue ORDER BY n.timestamp DESC")
    List<SystemNotification> findByValueGreaterThan(@Param("minValue") java.math.BigDecimal minValue);
    
    // Buscar notificações recentes (últimas 24 horas)
    @Query("SELECT n FROM SystemNotification n WHERE n.timestamp >= :startTime ORDER BY n.timestamp DESC")
    List<SystemNotification> findRecentNotifications(@Param("startTime") LocalDateTime startTime);
}
