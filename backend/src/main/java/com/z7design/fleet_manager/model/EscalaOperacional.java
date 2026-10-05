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
import java.time.LocalTime;
import java.util.UUID;

/**
 * Escala operacional: partida planejada de uma linha em uma data
 * (PRD Viasao Sao Silvestre - Fase 2).
 */
@Data
@Entity
@Table(name = "escalas_operacionais")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class EscalaOperacional implements TenantAware {

    public static final String STATUS_PLANEJADA = "PLANEJADA";
    public static final String STATUS_CONFIRMADA = "CONFIRMADA";
    public static final String STATUS_EXECUTANDO = "EXECUTANDO";
    public static final String STATUS_CONCLUIDA = "CONCLUIDA";
    public static final String STATUS_CANCELADA = "CANCELADA";

    public static final String ORIGIN_MANUAL = "MANUAL";
    public static final String ORIGIN_GERADA = "GERADA";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "scale_date", nullable = false)
    private LocalDate scaleDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private LineTimeSlot timeSlot;

    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Driver driver;

    /** PLANEJADA, CONFIRMADA, EXECUTANDO, CONCLUIDA, CANCELADA */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = STATUS_PLANEJADA;

    /** MANUAL (digitada) ou GERADA (a partir dos horarios ativos) */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String origin = ORIGIN_MANUAL;

    @Column(name = "trip_id")
    private UUID tripId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
