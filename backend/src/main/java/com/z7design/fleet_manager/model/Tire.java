package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.TireStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Tire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String serialNumber; // DOT

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TireStatus status;

    @Column(nullable = false)
    private Integer currentMileage;

    @Column
    private Integer recapCount;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "axle_number")
    private Integer axleNumber;

    @Column(name = "position_index")
    private Integer positionIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    @JsonIgnore
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (recapCount == null)
            recapCount = 0;
        if (currentMileage == null)
            currentMileage = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
