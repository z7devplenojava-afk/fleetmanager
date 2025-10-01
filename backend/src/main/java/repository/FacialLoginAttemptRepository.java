package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.FacialLoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
     * Busca tentativas por período
     */
    List<FacialLoginAttempt> findByAttemptTimeBetweenOrderByAttemptTimeDesc(
        LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Busca tentativas por supervisor e período
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
     * Conta tentativas por supervisor em um período
     */
    long countBySupervisorIdAndAttemptTimeBetween(UUID supervisorId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Conta tentativas falhadas por supervisor em um período
     */
    long countBySupervisorIdAndSuccessFalseAndAttemptTimeBetween(
        UUID supervisorId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Busca tentativas suspeitas (múltiplas falhas em pouco tempo)
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
     * Busca estatísticas de tentativas por supervisor
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
     * Busca tentativas por score de confiança
     */
    List<FacialLoginAttempt> findByConfidenceScoreGreaterThanEqualOrderByAttemptTimeDesc(Double minScore);
    
    /**
     * Busca tentativas por motivo de falha
     */
    List<FacialLoginAttempt> findByFailureReasonOrderByAttemptTimeDesc(String failureReason);
    
    /**
     * Limpa tentativas antigas (manutenção)
     */
    @Query("DELETE FROM FacialLoginAttempt fla WHERE fla.attemptTime < :cutoffDate")
    void deleteOldAttempts(@Param("cutoffDate") LocalDateTime cutoffDate);
}
