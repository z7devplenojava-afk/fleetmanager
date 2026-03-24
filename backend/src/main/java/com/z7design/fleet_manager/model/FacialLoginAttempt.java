package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "facial_login_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialLoginAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private Employee supervisor;
    
    @Column(name = "attempt_time", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime attemptTime;
    
    @Column(name = "success", nullable = false)
    private Boolean success;
    
    @Column(name = "confidence_score", precision = 3, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "failure_reason", length = 100)
    private String failureReason;
    
    // MÃ©todo para definir motivo da falha
    public void setFailureReason(FacialLoginFailureReason reason) {
        this.failureReason = reason != null ? reason.name() : null;
    }
    
    // Enum para motivos de falha
    public enum FacialLoginFailureReason {
        INVALID_EMBEDDING("Embedding invÃ¡lido"),
        LOW_CONFIDENCE("Score de confianÃ§a muito baixo"),
        SUPERVISOR_NOT_FOUND("Supervisor nÃ£o encontrado"),
        INACTIVE_EMBEDDING("Embedding inativo"),
        LIVENESS_FAILED("Falha na verificaÃ§Ã£o de liveness"),
        GEOLOCATION_MISMATCH("GeolocalizaÃ§Ã£o nÃ£o confere"),
        ENCRYPTION_ERROR("Erro na descriptografia"),
        SYSTEM_ERROR("Erro interno do sistema");
        
        private final String description;
        
        FacialLoginFailureReason(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}

