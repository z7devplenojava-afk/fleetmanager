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

    @Column(name = "position_code", length = 20)
    private String positionCode;

    @Column(nullable = false)
    private Integer mileage;

    @Column(name = "tread_depth_mm", precision = 5, scale = 2)
    private java.math.BigDecimal treadDepthMm;

    @Column(name = "km_driven_cycle")
    private Integer kmDrivenCycle;

    @Column(name = "recap_count_snapshot")
    private Integer recapCountSnapshot;

    @Column(name = "authorized_by_user_id")
    private UUID authorizedByUserId;

    @Column(name = "authorized_by_name", length = 150)
    private String authorizedByName;

    @Column
    private String notes;

    @Transient
    private String tireSerialNumber;

    @Transient
    private String tireFireNumber;

    @Transient
    private String tireBrand;

    @Transient
    private String tireModel;

    @Transient
    private String tireSize;

    @Transient
    private Integer tireRecapCount;

    @Transient
    private Integer tireCurrentMileage;

    @Transient
    private Integer tireCurrentLifeMileage;

    @Transient
    private java.math.BigDecimal tireCurrentTreadDepth;

    @Transient
    private String vehiclePlate;

    @Transient
    private String vehicleFleetNumber;

    @Transient
    private Integer vehicleCurrentMileage;

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
