package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mileage_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MileageRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private Integer initialMileage;
    
    @Column(nullable = false)
    private Integer finalMileage;
    
    @Column(nullable = false)
    private Integer distanceTraveled;
    
    @Column(nullable = false)
    private BigDecimal fuelConsumed;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fuelCost;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal costPerKm;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal averageConsumption; // km/l
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripType tripType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FuelType fuelType;
    
    @Column
    private String driver;
    
    @Column
    private String destination;
    
    @Column
    private String purpose;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateMetrics();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateMetrics();
    }
    
    private void calculateMetrics() {
        if (finalMileage != null && initialMileage != null) {
            this.distanceTraveled = finalMileage - initialMileage;
        }
        
        if (distanceTraveled != null && distanceTraveled > 0 && fuelConsumed != null && fuelConsumed.compareTo(BigDecimal.ZERO) > 0) {
            this.averageConsumption = BigDecimal.valueOf(distanceTraveled).divide(fuelConsumed, 2, BigDecimal.ROUND_HALF_UP);
        }
        
        if (distanceTraveled != null && distanceTraveled > 0 && fuelCost != null) {
            this.costPerKm = fuelCost.divide(BigDecimal.valueOf(distanceTraveled), 2, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public enum TripType {
        URBAN("Urbano"),
        HIGHWAY("Rodovia"),
        MIXED("Misto"),
        DELIVERY("Entrega"),
        PATROL("Patrulha"),
        MAINTENANCE("Manutenção"),
        OTHER("Outro");
        
        private final String displayName;
        
        TripType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum FuelType {
        GASOLINE("Gasolina"),
        ETHANOL("Etanol"),
        DIESEL("Diesel"),
        FLEX("Flex"),
        ELECTRIC("Elétrico"),
        HYBRID("Híbrido");
        
        private final String displayName;
        
        FuelType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
} 