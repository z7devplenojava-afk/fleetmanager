package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.FacialEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FacialEmbeddingRepository extends JpaRepository<FacialEmbedding, UUID> {
    
    /**
     * Busca embeddings ativos por supervisor
     */
    List<FacialEmbedding> findBySupervisorIdAndIsActiveTrue(UUID supervisorId);
    
    /**
     * Busca embedding específico por supervisor e ID
     */
    Optional<FacialEmbedding> findBySupervisorIdAndIdAndIsActiveTrue(UUID supervisorId, UUID id);
    
    /**
     * Busca embeddings por score de confiança mínimo
     */
    List<FacialEmbedding> findByConfidenceScoreGreaterThanEqualAndIsActiveTrue(BigDecimal minScore);
    
    /**
     * Busca embeddings verificados por liveness
     */
    List<FacialEmbedding> findByLivenessVerifiedTrueAndIsActiveTrue();
    
    /**
     * Busca embeddings por hash específico
     */
    Optional<FacialEmbedding> findByEmbeddingHash(String embeddingHash);
    
    /**
     * Conta embeddings ativos por supervisor
     */
    long countBySupervisorIdAndIsActiveTrue(UUID supervisorId);
    
    /**
     * Busca embeddings que não foram usados recentemente
     */
    @Query("SELECT fe FROM FacialEmbedding fe WHERE fe.lastUsed < :cutoffDate AND fe.isActive = true")
    List<FacialEmbedding> findInactiveEmbeddings(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
    
    /**
     * Busca melhor match por similaridade de embedding (implementação alternativa sem pgvector)
     * Por enquanto, retorna o embedding mais recente com score adequado
     */
    @Query("""
        SELECT fe FROM FacialEmbedding fe
        WHERE fe.isActive = true 
        AND fe.livenessVerified = true
        AND fe.confidenceScore >= :minScore
        ORDER BY fe.lastUsed DESC
        """)
    Optional<FacialEmbedding> findBestMatch(@Param("minScore") double minScore);
    
    /**
     * Busca embeddings por supervisor com ordenação por data de criação
     */
    List<FacialEmbedding> findBySupervisorIdOrderByCreatedAtDesc(UUID supervisorId);
    
    /**
     * Busca embeddings expirados (não usados há muito tempo)
     */
    @Query("SELECT fe FROM FacialEmbedding fe WHERE fe.lastUsed < :expiryDate AND fe.isActive = true")
    List<FacialEmbedding> findExpiredEmbeddings(@Param("expiryDate") java.time.LocalDateTime expiryDate);
    
    /**
     * Desativa embeddings expirados
     */
    @Query("UPDATE FacialEmbedding fe SET fe.isActive = false WHERE fe.lastUsed < :expiryDate AND fe.isActive = true")
    void deactivateExpiredEmbeddings(@Param("expiryDate") java.time.LocalDateTime expiryDate);
}
