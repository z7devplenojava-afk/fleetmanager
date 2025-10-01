package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "measurement_items")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "item_number", nullable = false)
    private Integer itemNumber;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "cost_center_id")
    private String costCenterId;

    @Column(name = "cost_center_name")
    private String costCenterName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private MeasurementBulletin bulletin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Método para calcular valor total automaticamente
    public void calculateTotalValue() {
        this.totalValue = this.unitPrice.multiply(this.quantity);
    }

    // Método para obter valor formatado em reais
    public String getFormattedUnitPrice() {
        return String.format("R$ %.2f", this.unitPrice);
    }

    public String getFormattedTotalValue() {
        return String.format("R$ %.2f", this.totalValue);
    }

    // Método para obter quantidade formatada
    public String getFormattedQuantity() {
        return String.format("%.2f", this.quantity);
    }

    // Método para obter nome do centro de custo
    public String getCostCenterDisplayName() {
        if (costCenterName != null && !costCenterName.trim().isEmpty()) {
            return costCenterName;
        }
        
        // Mapeamento padrão se não houver nome personalizado
        switch (costCenterId) {
            case "1": return "Operacional";
            case "2": return "Comercial";
            case "3": return "RH";
            case "4": return "Financeiro";
            case "5": return "Vigilância";
            case "6": return "Portaria";
            case "7": return "Rondas";
            default: return "Não definido";
        }
    }

    @PrePersist
    @PreUpdate
    private void prePersist() {
        calculateTotalValue();
    }
}