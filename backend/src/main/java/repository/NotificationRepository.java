package br.com.fleetmanager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.Notification;
import br.com.fleetmanager.model.enums.NotificationStatus;
import br.com.fleetmanager.model.enums.NotificationType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId")
    List<Notification> findByUserId(UUID userId);
    
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.status = :status")
    List<Notification> findByUserIdAndStatus(UUID userId, NotificationStatus status);
    
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type")
    List<Notification> findByUserIdAndType(UUID userId, NotificationType type);
    
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.createdAt BETWEEN :startDate AND :endDate")
    List<Notification> findByUserIdAndCreatedAtBetween(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT n FROM Notification n WHERE n.createdAt BETWEEN :startDate AND :endDate")
    List<Notification> findByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Busca notificações por usuário ordenadas por data de criação
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
    
    /**
     * Busca notificações por usuário e status ordenadas por data de criação
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.status = :status ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    /**
     * Conta notificações por usuário e status
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
}