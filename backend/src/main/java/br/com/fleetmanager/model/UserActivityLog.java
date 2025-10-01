package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_activity_logs")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
    
    @Column(name = "username", nullable = false)
    private String username;
    
    @Column(name = "action", nullable = false, length = 100)
    private String action;
    
    @Column(name = "module", length = 50)
    private String module;
    
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "session_id", length = 100)
    private String sessionId;
    
    @Column(name = "status", length = 20)
    private String status; // SUCCESS, ERROR, WARNING
    
    @Column(name = "execution_time_ms")
    private Long executionTimeMs;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    // Método para calcular a duração da atividade
    public Long getDurationMs() {
        if (createdAt != null && endedAt != null) {
            return java.time.Duration.between(createdAt, endedAt).toMillis();
        }
        return executionTimeMs;
    }
    
    // Método para marcar o fim da atividade
    public void endActivity() {
        this.endedAt = LocalDateTime.now();
        if (this.executionTimeMs == null) {
            this.executionTimeMs = getDurationMs();
        }
    }
} 