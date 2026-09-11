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
