package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_alerts")
@Data
@EqualsAndHashCode(callSuper = false)
public class StockAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    @Column(name = "alert_type", nullable = false)
    private String alertType; // LOW_STOCK, OUT_OF_STOCK, EXPIRED

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "current_quantity")
    private Integer currentQuantity;

    @Column(name = "minimum_quantity")
    private Integer minimumQuantity;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedByUser;

    @Column(name = "priority", nullable = false)
    private Integer priority = 1; // 1=Baixa, 2=MÃ©dia, 3=Alta, 4=CrÃ­tica

    // MÃ©todo para marcar como resolvido
    public void resolve(User user) {
        this.isResolved = true;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedByUser = user;
    }

    // MÃ©todo para marcar como lido
    public void markAsRead() {
        this.isRead = true;
    }
}
