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

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Horario de partida de uma linha por tipo de dia.
 * PRD Viasao Sao Silvestre - Fase 1.
 */
@Data
@Entity
@Table(name = "line_time_slots")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class LineTimeSlot implements TenantAware {

    public static final String DIA_UTIL = "DIA_UTIL";
    public static final String SABADO = "SABADO";
    public static final String DOMINGO_FERIADO = "DOMINGO_FERIADO";

    public static final String STATUS_ATIVO = "ATIVO";
    public static final String STATUS_INATIVO = "INATIVO";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "company" })
    private Route route;

    /** DIA_UTIL, SABADO ou DOMINGO_FERIADO */
    @Column(name = "day_type", nullable = false, length = 20)
    private String dayType;

    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ATIVO;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
