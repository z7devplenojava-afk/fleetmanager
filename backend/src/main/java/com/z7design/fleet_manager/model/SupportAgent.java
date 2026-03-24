package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.z7design.fleet_manager.model.enums.AgentStatus;

/**
 * Entidade que representa um agente de atendimento
 */
@Entity
@Table(name = "support_agents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportAgent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AgentStatus status = AgentStatus.OFFLINE;
    
    @Column(name = "department")
    private String department;
    
    @Column(name = "last_activity")
    private LocalDateTime lastActivity;
    
    @Column(name = "total_tickets")
    private Integer totalTickets = 0;
    
    @Column(name = "resolved_tickets")
    private Integer resolvedTickets = 0;
    
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (lastActivity == null) {
            lastActivity = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


