package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fleet_component_controls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetComponentControl {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    /** ALIGNMENT | ENGINE_OIL | PULLEY_BEARING | STARTER | ALTERNATOR */
    @Column(name = "control_type", nullable = false, length = 40)
    private String controlType;

    @Column(name = "work_order_id")
    private UUID workOrderId;

    @Column(name = "os_number", length = 50)
    private String osNumber;

    @Column(name = "service_date")
    private LocalDate serviceDate;

    @Column(name = "service_km")
    private Integer serviceKm;

    @Column(name = "next_due_km", nullable = false)
    private Integer nextDueKm;

    @Column(name = "interval_km", nullable = false)
    private Integer intervalKm;

    @Builder.Default
    @Column(name = "oil_filter_changed", nullable = false)
    private Boolean oilFilterChanged = false;

    @Builder.Default
    @Column(name = "diesel_filter_changed", nullable = false)
    private Boolean dieselFilterChanged = false;

    @Builder.Default
    @Column(name = "water_separator_filter_changed", nullable = false)
    private Boolean waterSeparatorFilterChanged = false;

    @Builder.Default
    @Column(name = "air_filter_changed", nullable = false)
    private Boolean airFilterChanged = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

