package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private String location;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FineStatus status;
    
    @Column
    private LocalDate dueDate;
    
    @Column
    private LocalDate paymentDate;
    
    @Column
    private Integer points; // Pontos na CNH
    
    @Column(name = "driver_phone", length = 20)
    private String driverPhone; // WhatsApp do motorista para notificação
    
    @Column(name = "due_reminder_sent")
    private Boolean dueReminderSent = false; // Evita reenvio diário do alerta de vencimento
    
    @Column(name = "overdue_reminder_sent")
    private Boolean overdueReminderSent = false; // Evita reenvio do alerta de multa vencida
    
    @Column(name = "infraction_number", length = 100)
    private String infractionNumber; // Auto de infração (ex: R1029384)
    
    @Column(name = "infraction_code", length = 50)
    private String infractionCode; // Código da infração (ex: 7455-0)
    
    @Column(name = "issuing_authority", length = 100)
    private String issuingAuthority; // Órgão autuador (ex: DER-MG, PRF, DETRAN)
    
    @Column(name = "infraction_time", length = 20)
    private String infractionTime; // Horário da infração (ex: 14:22)
    
    @Column(name = "situation", length = 100)
    private String situation; // Situação (ex: AGUARDANDO PAGAMENTO, EM RECURSO)
    
    @Column(name = "parte_diaria_id")
    private UUID parteDiariaId;
    
    @Column(name = "parte_diaria_number", length = 50)
    private String parteDiariaNumber;
    
    @Column(name = "suggested_driver_name", length = 200)
    private String suggestedDriverName;
    
    @Column(name = "query_origin", length = 50)
    private String queryOrigin = "MANUAL"; // MANUAL, API_LIVE, CACHE
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum FineStatus {
        PENDING, PAID, CANCELLED
    }
} 
