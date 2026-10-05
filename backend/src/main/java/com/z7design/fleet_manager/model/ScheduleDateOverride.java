package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Excecao de calendario: em uma data especifica, utilizar os horarios
 * de outro tipo de dia (ex.: feriado -> horarios de DOMINGO_FERIADO).
 * PRD Viasao Sao Silvestre - Fase 1.
 */
@Data
@Entity
@Table(name = "schedule_date_overrides")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class ScheduleDateOverride implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "override_date", nullable = false, unique = true)
    private LocalDate overrideDate;

    /** Tipo de dia cujos horarios devem ser utilizados na data (ex.: DOMINGO_FERIADO) */
    @Column(name = "applies_day_type", nullable = false, length = 20)
    private String appliesDayType;

    @Column(name = "reason", length = 200)
    private String reason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
