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
@Table(name = "inventories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 50)
    private String inventoryNumber;
    
    @Column(nullable = false, length = 100)
    private String title;
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 20)
    private String type; // FULL, PARTIAL, CYCLE, ABC
    
    @Column(length = 20)
    private String status; // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    
    @Column(name = "planned_date")
    private LocalDateTime plannedDate;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "completion_date")
    private LocalDateTime completionDate;
    
    @Column(length = 100)
    private String responsiblePerson;
    
    @Column(length = 100)
    private String department;
    
    @Column(length = 100)
    private String location;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal totalItems;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal countedItems;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal varianceItems;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal totalValue;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal countedValue;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal varianceValue;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal accuracyPercentage;
    
    @Column(length = 20)
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    
    @Column(length = 500)
    private String notes;
    
    @Column(length = 100)
    private String approvedBy;
    
    @Column(name = "approval_date")
    private LocalDateTime approvalDate;
    
    @Column(length = 500)
    private String approvalNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Métodos de negócio
    public void calculateProgress() {
        if (totalItems != null && totalItems.compareTo(BigDecimal.ZERO) > 0) {
            this.countedItems = countedItems != null ? countedItems : BigDecimal.ZERO;
            this.varianceItems = totalItems.subtract(countedItems);
        }
    }
    
    public void calculateValueVariance() {
        if (totalValue != null && countedValue != null) {
            this.varianceValue = totalValue.subtract(countedValue);
        }
    }
    
    public void calculateAccuracy() {
        if (totalItems != null && totalItems.compareTo(BigDecimal.ZERO) > 0 && countedItems != null) {
            BigDecimal accuracy = countedItems.divide(totalItems, 4, BigDecimal.ROUND_HALF_UP)
                                           .multiply(BigDecimal.valueOf(100));
            this.accuracyPercentage = accuracy;
        }
    }
    
    public boolean isInProgress() {
        return "IN_PROGRESS".equals(status);
    }
    
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
    
    public boolean isOverdue() {
        return plannedDate != null && LocalDateTime.now().isAfter(plannedDate) && !isCompleted();
    }
    
    public BigDecimal getProgressPercentage() {
        if (totalItems == null || totalItems.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return countedItems.divide(totalItems, 2, BigDecimal.ROUND_HALF_UP)
                          .multiply(BigDecimal.valueOf(100));
    }
    
    public boolean hasVariance() {
        return varianceItems != null && varianceItems.compareTo(BigDecimal.ZERO) != 0;
    }
}