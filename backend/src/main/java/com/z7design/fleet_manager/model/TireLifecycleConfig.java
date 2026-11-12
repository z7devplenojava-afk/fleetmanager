package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tire_lifecycle_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TireLifecycleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", unique = true)
    private UUID companyId;

    @Builder.Default
    @Column(name = "first_life_min_km", nullable = false)
    private Integer firstLifeMinKm = 90000;

    @Builder.Default
    @Column(name = "first_life_max_km", nullable = false)
    private Integer firstLifeMaxKm = 120000;

    @Builder.Default
    @Column(name = "second_life_min_km", nullable = false)
    private Integer secondLifeMinKm = 90000;

    @Builder.Default
    @Column(name = "second_life_max_km", nullable = false)
    private Integer secondLifeMaxKm = 140000;

    @Builder.Default
    @Column(name = "third_life_min_km", nullable = false)
    private Integer thirdLifeMinKm = 80000;

    @Builder.Default
    @Column(name = "third_life_max_km", nullable = false)
    private Integer thirdLifeMaxKm = 100000;

    @Builder.Default
    @Column(name = "max_recap_count", nullable = false)
    private Integer maxRecapCount = 2;

    @Builder.Default
    @Column(name = "min_tread_depth_twi", precision = 4, scale = 2, nullable = false)
    private BigDecimal minTreadDepthTwi = new BigDecimal("1.60");

    @Builder.Default
    @Column(name = "alert_tread_depth_mm", precision = 4, scale = 2, nullable = false)
    private BigDecimal alertTreadDepthMm = new BigDecimal("3.00");

    @Builder.Default
    @Column(name = "dot_max_age_years", nullable = false)
    private Integer dotMaxAgeYears = 5;

    @Builder.Default
    @Column(name = "urban_calibration_factor", precision = 5, scale = 2, nullable = false)
    private BigDecimal urbanCalibrationFactor = new BigDecimal("1.00");

    @Builder.Default
    @Column(name = "metropolitan_calibration_factor", precision = 5, scale = 2, nullable = false)
    private BigDecimal metropolitanCalibrationFactor = new BigDecimal("1.10");

    @Builder.Default
    @Column(name = "road_calibration_factor", precision = 5, scale = 2, nullable = false)
    private BigDecimal roadCalibrationFactor = new BigDecimal("1.25");

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}

