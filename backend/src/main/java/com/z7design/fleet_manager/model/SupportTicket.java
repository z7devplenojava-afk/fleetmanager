package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketCategory;

/**
 * Entidade que representa um ticket de atendimento
 */
@Entity
@Table(name = "support_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicket {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private TicketPriority priority = TicketPriority.NORMAL;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status = TicketStatus.OPEN;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private TicketCategory category;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private SupportAgent assignedTo;
    
    @Column(name = "customer_name", nullable = false)
    private String customerName;
    
    @Column(name = "customer_email", nullable = false)
    private String customerEmail;
    
    @Column(name = "customer_phone")
    private String customerPhone;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "client_id")
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    private Client client;
    
    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketMessage> messages = new ArrayList<>();
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        
        // Atualizar timestamps baseado no status
        if (status == TicketStatus.RESOLVED && resolvedAt == null) {
            resolvedAt = LocalDateTime.now();
        }
        if (status == TicketStatus.CLOSED && closedAt == null) {
            closedAt = LocalDateTime.now();
        }
    }
    
    /**
     * Helper method para adicionar mensagem ao ticket
     */
    public void addMessage(TicketMessage message) {
        messages.add(message);
        message.setTicket(this);
    }
}


