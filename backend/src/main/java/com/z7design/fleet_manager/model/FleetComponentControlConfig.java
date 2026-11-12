package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fleet_component_control_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetComponentControlConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", unique = true)
    private UUID companyId;

    @Builder.Default
    @Column(name = "alignment_interval_km", nullable = false)
    private Integer alignmentIntervalKm = 20000;

    @Builder.Default
    @Column(name = "engine_oil_interval_km", nullable = false)
    private Integer engineOilIntervalKm = 25000;

    @Builder.Default
    @Column(name = "pulley_bearing_interval_km", nullable = false)
    private Integer pulleyBearingIntervalKm = 20000;

    @Builder.Default
    @Column(name = "starter_interval_km", nullable = false)
    private Integer starterIntervalKm = 200000;

    @Builder.Default
    @Column(name = "alternator_interval_km", nullable = false)
    private Integer alternatorIntervalKm = 150000;

    @Builder.Default
    @Column(name = "alternator_quick_check_interval_km", nullable = false)
    private Integer alternatorQuickCheckIntervalKm = 15000;

    @Builder.Default
    @Column(name = "auto_open_preventive_os", nullable = false)
    private Boolean autoOpenPreventiveOs = true;

    @Builder.Default
    @Column(name = "default_preventive_model", nullable = false, length = 30)
    private String defaultPreventiveModel = "MODELO_2";

    @Builder.Default
    @Column(name = "alert_threshold_km", nullable = false)
    private Integer alertThresholdKm = 3000;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}

