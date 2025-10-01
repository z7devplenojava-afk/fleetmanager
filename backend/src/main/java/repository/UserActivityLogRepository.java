package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.UserActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, UUID>, JpaSpecificationExecutor<UserActivityLog> {

    List<UserActivityLog> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<UserActivityLog> findByUsername(String username);
    
    List<UserActivityLog> findByAction(String action);
    
    List<UserActivityLog> findByModule(String module);
    
    List<UserActivityLog> findByStatus(String status);
    
    List<UserActivityLog> findByUserId(UUID userId);
    
    List<UserActivityLog> findByIpAddress(String ipAddress);
    
    List<UserActivityLog> findBySessionId(String sessionId);
    
    @Query("SELECT DISTINCT ual.username FROM UserActivityLog ual")
    List<String> findDistinctUsername();
    
    @Query("SELECT DISTINCT ual.username FROM UserActivityLog ual WHERE ual.createdAt BETWEEN :startDate AND :endDate")
    List<String> findDistinctUsernameByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DISTINCT ual.module FROM UserActivityLog ual")
    List<String> findDistinctModule();
    
    @Query("SELECT DISTINCT ual.module FROM UserActivityLog ual WHERE ual.createdAt BETWEEN :startDate AND :endDate")
    List<String> findDistinctModuleByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DISTINCT ual.action FROM UserActivityLog ual")
    List<String> findDistinctAction();
    
    @Query("SELECT DISTINCT ual.action FROM UserActivityLog ual WHERE ual.createdAt BETWEEN :startDate AND :endDate")
    List<String> findDistinctActionByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    int deleteByCreatedAtBefore(LocalDateTime cutoffDate);
    
    @Query("SELECT COUNT(ual) FROM UserActivityLog ual WHERE ual.createdAt >= :startDate")
    long countByCreatedAtAfter(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(ual) FROM UserActivityLog ual WHERE ual.username = :username AND ual.createdAt >= :startDate")
    long countByUsernameAndCreatedAtAfter(@Param("username") String username, @Param("startDate") LocalDateTime startDate);
} 