package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.z7design.fleet_manager.model.enums.TireMovementType;
import com.z7design.fleet_manager.model.enums.TireRotationPosition;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tire_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TireMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tire_id", nullable = false)
    private UUID tireId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tire_id", insertable = false, updatable = false)
    @JsonIgnore
    private Tire tire;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    @JsonIgnore
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TireMovementType type;

    @Enumerated(EnumType.STRING)
    private TireRotationPosition position;

    @Column(name = "axle_number")
    private Integer axleNumber;

    @Column(name = "position_index")
    private Integer positionIndex;

    @Column(nullable = false)
    private Integer mileage;

    @Column
    private String notes;

    @Column(nullable = false)
    private LocalDateTime movementDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (movementDate == null)
            movementDate = LocalDateTime.now();
    }
}
