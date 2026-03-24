package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(length = 100)
    private String route;

    @Column(length = 50)
    private String shift;

    @Column(name = "initial_km", nullable = false)
    private Integer initialKm;

    @Column(name = "final_km", nullable = false)
    private Integer finalKm;

    @Column(name = "total_km_run", nullable = false)
    private Integer totalKmRun;

    @Column(name = "discounted_km", nullable = false)
    private Integer discountedKm = 0;

    @Column(name = "considered_km", nullable = false)
    private Integer consideredKm;

    @Column(name = "allowance", nullable = false)
    private Integer allowance = 0;

    @Column(name = "excess_km", nullable = false)
    private Integer excessKm;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void calculateMetrics() {
        if (initialKm != null && finalKm != null) {
            this.totalKmRun = Math.max(0, finalKm - initialKm);

            int discKm = (discountedKm != null) ? discountedKm : 0;
            this.consideredKm = Math.max(0, this.totalKmRun - discKm);

            int allow = (allowance != null) ? allowance : 0;
            this.excessKm = Math.max(0, this.consideredKm - allow);
        } else {
            this.totalKmRun = 0;
            this.consideredKm = 0;
            this.excessKm = 0;
        }

        if (vehicle != null && vehiclePlate == null) {
            this.vehiclePlate = vehicle.getPlate();
        }
    }
}
