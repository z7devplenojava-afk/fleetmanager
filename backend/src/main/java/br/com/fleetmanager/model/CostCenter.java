package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cost_centers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Código é obrigatório")
    @Size(max = 20, message = "Código deve ter no máximo 20 caracteres")
    @Column(nullable = false, unique = true, length = 20)
    private String code;
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    @Column(nullable = false, length = 255)
    private String name;
    
    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    @Column(length = 1000)
    private String description;
    
    @Size(max = 255, message = "Responsável deve ter no máximo 255 caracteres")
    @Column(length = 255)
    private String responsible;
    
    @Size(max = 255, message = "Departamento deve ter no máximo 255 caracteres")
    @Column(length = 255)
    private String department;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal budget;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal currentSpent;
    
    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CostCenterStatus status;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "updated_by")
    private UUID updatedBy;
    
    public enum CostCenterStatus {
        ATIVO("Ativo"),
        INATIVO("Inativo"),
        SUSPENSO("Suspenso");
        
        private final String description;
        
        CostCenterStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // Métodos auxiliares
    public BigDecimal getAvailableBudget() {
        if (budget == null || currentSpent == null) {
            return budget != null ? budget : BigDecimal.ZERO;
        }
        return budget.subtract(currentSpent);
    }
    
    public BigDecimal getUtilizationPercentage() {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (currentSpent == null) {
            return BigDecimal.ZERO;
        }
        return currentSpent.divide(budget, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
    
    public boolean isOverBudget() {
        if (budget == null || currentSpent == null) {
            return false;
        }
        return currentSpent.compareTo(budget) > 0;
    }
    
    public boolean isNearBudgetLimit() {
        if (budget == null || currentSpent == null) {
            return false;
        }
        BigDecimal utilizationPercentage = getUtilizationPercentage();
        return utilizationPercentage.compareTo(BigDecimal.valueOf(90)) >= 0;
    }
}