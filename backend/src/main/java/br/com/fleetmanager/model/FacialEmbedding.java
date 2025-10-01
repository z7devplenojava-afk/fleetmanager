package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "facial_embeddings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialEmbedding {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private Employee supervisor;
    
    @Column(name = "encrypted_embedding", nullable = false, columnDefinition = "TEXT")
    private String encryptedEmbedding;
    
    @Column(name = "embedding_hash", nullable = false, length = 64)
    private String embeddingHash;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "last_used", nullable = false)
    private LocalDateTime lastUsed;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "confidence_score", precision = 3, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(name = "liveness_verified")
    @Builder.Default
    private Boolean livenessVerified = false;
    
    // Método para atualizar último uso
    @PreUpdate
    public void preUpdate() {
        this.lastUsed = LocalDateTime.now();
    }
    
    // Método para validar score de confiança
    public boolean isValidConfidenceScore() {
        return confidenceScore != null && 
               confidenceScore.compareTo(BigDecimal.ZERO) >= 0 && 
               confidenceScore.compareTo(BigDecimal.ONE) <= 0;
    }
}
