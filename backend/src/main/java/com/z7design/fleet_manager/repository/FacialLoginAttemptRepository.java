package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FacialLoginAttempt;
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
public interface FacialLoginAttemptRepository extends JpaRepository<FacialLoginAttempt, UUID> {
    
    /**
     * Busca tentativas por supervisor
     */
    List<FacialLoginAttempt> findBySupervisorIdOrderByAttemptTimeDesc(UUID supervisorId);
    
    /**
     * Busca tentativas por perÃ­odo
     */
    List<FacialLoginAttempt> findByAttemptTimeBetweenOrderByAttemptTimeDesc(
        LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Busca tentativas por supervisor e perÃ­odo
     */
    List<FacialLoginAttempt> findBySupervisorIdAndAttemptTimeBetweenOrderByAttemptTimeDesc(
        UUID supervisorId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Busca tentativas bem-sucedidas
     */
    List<FacialLoginAttempt> findBySuccessTrueOrderByAttemptTimeDesc();
    
    /**
     * Busca tentativas falhadas
     */
    List<FacialLoginAttempt> findBySuccessFalseOrderByAttemptTimeDesc();
    
    /**
     * Busca tentativas por IP
     */
    List<FacialLoginAttempt> findByIpAddressOrderByAttemptTimeDesc(String ipAddress);
    
    /**
     * Conta tentativas por supervisor em um perÃ­odo
     */
    long countBySupervisorIdAndAttemptTimeBetween(UUID supervisorId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Conta tentativas falhadas por supervisor em um perÃ­odo
     */
    long countBySupervisorIdAndSuccessFalseAndAttemptTimeBetween(
        UUID supervisorId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Busca tentativas suspeitas (mÃºltiplas falhas em pouco tempo)
     */
    @Query("""
        SELECT fla FROM FacialLoginAttempt fla 
        WHERE fla.success = false 
        AND fla.attemptTime >= :startTime 
        AND fla.ipAddress = :ipAddress
        ORDER BY fla.attemptTime DESC
        """)
    List<FacialLoginAttempt> findSuspiciousAttempts(
        @Param("ipAddress") String ipAddress, 
        @Param("startTime") LocalDateTime startTime);
    
    /**
     * Busca estatÃ­sticas de tentativas por supervisor
     */
    @Query("""
        SELECT 
            COUNT(fla) as totalAttempts,
            SUM(CASE WHEN fla.success = true THEN 1 ELSE 0 END) as successfulAttempts,
            SUM(CASE WHEN fla.success = false THEN 1 ELSE 0 END) as failedAttempts,
            AVG(CASE WHEN fla.confidenceScore IS NOT NULL THEN fla.confidenceScore ELSE 0 END) as avgConfidence
        FROM FacialLoginAttempt fla 
        WHERE fla.supervisor.id = :supervisorId 
        AND fla.attemptTime >= :startTime
        """)
    Object[] getSupervisorStats(@Param("supervisorId") UUID supervisorId, @Param("startTime") LocalDateTime startTime);
    
    /**
     * Busca tentativas por score de confianÃ§a
     */
    List<FacialLoginAttempt> findByConfidenceScoreGreaterThanEqualOrderByAttemptTimeDesc(Double minScore);
    
    /**
     * Busca tentativas por motivo de falha
     */
    List<FacialLoginAttempt> findByFailureReasonOrderByAttemptTimeDesc(String failureReason);
    
    /**
     * Limpa tentativas antigas (manutenÃ§Ã£o)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM FacialLoginAttempt fla WHERE fla.attemptTime < :cutoffDate")
    void deleteOldAttempts(@Param("cutoffDate") LocalDateTime cutoffDate);
}

