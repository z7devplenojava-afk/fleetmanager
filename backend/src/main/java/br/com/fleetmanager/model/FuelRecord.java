package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "fuel_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vehicle.FuelType fuelType;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cost;
    
    @Column(nullable = false)
    private Integer mileage;
    
    @Column(name = "initial_mileage")
    private Integer initialMileage;
    
    @Column(name = "final_mileage")
    private Integer finalMileage;
    
    @Column
    private String station;
    
    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "receipt_url")
    private String receiptUrl;
    
    @Column(name = "cost_center")
    private String costCenter;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 