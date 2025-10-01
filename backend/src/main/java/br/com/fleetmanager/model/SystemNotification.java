package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemNotification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private NotificationPriority priority;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "read", nullable = false)
    @Builder.Default
    private Boolean read = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private User recipient;
    
    @Column(name = "employee_name", length = 200)
    private String employeeName;
    
    @Column(name = "client_name", length = 200)
    private String clientName;
    
    @Column(name = "contract_reference", length = 100)
    private String contractReference;
    
    @Column(name = "value", precision = 15, scale = 2)
    private BigDecimal value;
    
    @Column(name = "department", length = 50)
    private String department;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
    
    public enum NotificationType {
        NOVO_CLIENTE, CONTRATO_VENCENDO, FUNCIONARIO_ATRASADO, 
        OCORRENCIA, ESCALA, ADVERTENCIA, NOVO_CONTRATO, 
        LEAD_NOVO, PROPOSTA_ENVIADA, ORCAMENTO_APROVADO
    }
    
    public enum NotificationPriority {
        BAIXA, MEDIA, ALTA
    }
}
