package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fuel_tank_alert_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FuelTankAlertLog implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fuel_tank_id", nullable = false)
    private FuelTank fuelTank;

    @Column(name = "threshold_level", nullable = false, precision = 12, scale = 2)
    private BigDecimal thresholdLevel;

    @Column(name = "current_level", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentLevel;

    @Column(name = "alert_date", nullable = false)
    private LocalDateTime alertDate;

    @Column(columnDefinition = "TEXT")
    private String recipients;

    @Column(name = "whatsapp_status", length = 50)
    private String whatsappStatus;

    @Column(columnDefinition = "TEXT")
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
