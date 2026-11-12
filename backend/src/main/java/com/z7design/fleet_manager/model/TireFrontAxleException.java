package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tire_front_axle_exceptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TireFrontAxleException {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "tire_id", nullable = false)
    private UUID tireId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "vehicle_plate", length = 30)
    private String vehiclePlate;

    @Column(name = "vehicle_fleet_number", length = 60)
    private String vehicleFleetNumber;

    @Builder.Default
    @Column(name = "axle_number", nullable = false)
    private Integer axleNumber = 1;

    @Column(name = "position_code", length = 20)
    private String positionCode;

    @Column(name = "tire_fire_number", length = 80)
    private String tireFireNumber;

    @Column(name = "tire_serial_number", length = 100)
    private String tireSerialNumber;

    @Column(name = "recap_count", nullable = false)
    private Integer recapCount;

    @Column(name = "vehicle_km_at_mount")
    private Integer vehicleKmAtMount;

    @Column(name = "authorized_by_user_id", nullable = false)
    private UUID authorizedByUserId;

    @Column(name = "authorized_by_name", nullable = false, length = 150)
    private String authorizedByName;

    @Column(name = "authorized_by_role", length = 100)
    private String authorizedByRole;

    @Builder.Default
    @Column(name = "risk_acknowledged", nullable = false)
    private Boolean riskAcknowledged = Boolean.TRUE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(name = "email_sent", nullable = false)
    private Boolean emailSent = Boolean.FALSE;

    @Builder.Default
    @Column(name = "message_sent", nullable = false)
    private Boolean messageSent = Boolean.FALSE;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = Boolean.TRUE;

    @Column(name = "approved_at", nullable = false)
    private LocalDateTime approvedAt;

    @Column(name = "cleared_at")
    private LocalDateTime clearedAt;

    @PrePersist
    protected void onCreate() {
        if (approvedAt == null) {
            approvedAt = LocalDateTime.now();
        }
    }
}

