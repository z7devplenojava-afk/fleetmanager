package com.z7design.fleet_manager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Verifica se já existe notificação de alerta de manutenção para o usuário no dia.
     * Usado para não duplicar os alertas diários do MaintenanceAlertScheduler.
     */
    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE n.user.id = :userId " +
           "AND n.type = com.z7design.fleet_manager.model.enums.NotificationType.SYSTEM " +
           "AND n.title LIKE :titlePrefix% " +
           "AND n.createdAt >= :startOfDay")
    boolean existsMaintenanceAlertToday(@Param("userId") UUID userId,
                                       @Param("titlePrefix") String titlePrefix,
                                       @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId")
    List<Notification> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId AND n.status = :status")
    List<Notification> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId AND n.type = :type")
    List<Notification> findByUserIdAndType(@Param("userId") UUID userId, @Param("type") NotificationType type);

    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("type") NotificationType type);
    
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId AND n.createdAt BETWEEN :startDate AND :endDate")
    List<Notification> findByUserIdAndCreatedAtBetween(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.createdAt BETWEEN :startDate AND :endDate")
    List<Notification> findByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Busca notificaÃ§Ãµes por usuÃ¡rio ordenadas por data de criaÃ§Ã£o
     */
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
    
    /**
     * Busca notificaÃ§Ãµes por usuÃ¡rio e status ordenadas por data de criaÃ§Ã£o
     */
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user WHERE n.user.id = :userId AND n.status = :status ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    /**
     * Conta notificaÃ§Ãµes por usuÃ¡rio e status
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    /**
     * Busca todas as notificaÃ§Ãµes com relacionamentos carregados
     */
    @Query("SELECT DISTINCT n FROM Notification n LEFT JOIN FETCH n.user")
    List<Notification> findAllWithRelationships();
}
