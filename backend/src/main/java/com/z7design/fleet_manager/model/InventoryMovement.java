package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private Integer previousQuantity;
    
    @Column(nullable = false)
    private Integer newQuantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal totalValue;
    
    @Column
    private String reason;
    
    @Column
    private String requester;
    
    @Column
    private String approvedBy;
    
    @Column
    private String employeeId; // FuncionÃ¡rio que recebeu/entregou
    
    @Column
    private String employeeName;
    
    @Column
    private String department;
    
    @Column
    private String location;
    
    @Column
    private String notes;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementStatus status;
    
    @Column(nullable = false)
    private LocalDateTime movementDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (movementDate == null) {
            movementDate = LocalDateTime.now();
        }
        calculateTotalValue();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateTotalValue();
    }
    
    private void calculateTotalValue() {
        if (quantity != null && unitPrice != null) {
            this.totalValue = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
    
    public enum MovementType {
        IN("Entrada"),
        OUT("SaÃ­da"),
        ADJUSTMENT("Ajuste"),
        TRANSFER("TransferÃªncia"),
        RETURN("DevoluÃ§Ã£o"),
        DAMAGE("Danificado"),
        EXPIRED("Expirado"),
        LOSS("Perda");
        
        private final String displayName;
        
        MovementType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum MovementStatus {
        PENDING("Pendente"),
        APPROVED("Aprovado"),
        REJECTED("Rejeitado"),
        COMPLETED("ConcluÃ­do"),
        CANCELLED("Cancelado");
        
        private final String displayName;
        
        MovementStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
} 
