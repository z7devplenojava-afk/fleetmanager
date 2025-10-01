package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import br.com.fleetmanager.model.enums.MovementType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "equipment_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentMovement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorized_by_id", nullable = false)
    private Employee authorizedBy;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false)
    private MovementType movementType;
    
    @Column(name = "movement_date", nullable = false)
    private LocalDateTime movementDate;
    
    @Column(name = "expected_return_date")
    private LocalDateTime expectedReturnDate;
    
    @Column(name = "actual_return_date")
    private LocalDateTime actualReturnDate;
    
    @Column(name = "reason", length = 500)
    private String reason;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "returned", nullable = false)
    @Builder.Default
    private Boolean returned = false;
    
    @Column(name = "condition_on_withdrawal", length = 100)
    private String conditionOnWithdrawal;
    
    @Column(name = "condition_on_return", length = 100)
    private String conditionOnReturn;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Métodos auxiliares
    public boolean isOverdue() {
        if (returned || expectedReturnDate == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(expectedReturnDate);
    }
    
    public long getDaysOut() {
        LocalDateTime endDate = returned && actualReturnDate != null ? actualReturnDate : LocalDateTime.now();
        return java.time.Duration.between(movementDate, endDate).toDays();
    }
} 