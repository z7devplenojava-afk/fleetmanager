package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "pay_periods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class PayPeriod implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name; // "Janeiro 2025", "15/01 a 14/02", "1Âª Quinzena - Janeiro"

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PeriodType type;

    @Column(name = "reference_month")
    private Integer referenceMonth; // 1-12

    @Column(name = "reference_year")
    private Integer referenceYear;

    @Column(name = "is_closed", nullable = false)
    private Boolean isClosed = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_id")
    private UUID closedById;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "company_id")
    private UUID companyId;

    public enum PeriodType {
        MONTHLY, // MÃªs civil (1 a 30/31)
        CUSTOM, // PerÃ­odo customizado (ex: 15/01 a 14/02)
        BIWEEKLY, // Quinzenal (1-15 ou 16-final)
        WEEKLY // Semanal
    }
}
