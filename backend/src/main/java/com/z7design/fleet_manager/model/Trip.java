package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "trips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Legado: viagem iniciada a partir de uma escala de funcionario. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    /** Escala operacional de origem (PRD VSS - Fase 3). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalas_operacionais_id")
    private EscalaOperacional escala;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "trip_date")
    private LocalDate tripDate;

    @Column(name = "planned_departure_time")
    private LocalTime plannedDepartureTime;

    @Column(name = "planned_arrival_time")
    private LocalTime plannedArrivalTime;

    @Column(name = "initial_km")
    private Integer initialKm;

    @Column(name = "final_km")
    private Integer finalKm;

    @Column(name = "passengers_expected")
    private Integer passengersExpected;

    @Column(name = "passengers_realized")
    private Integer passengersRealized;

    @Column(name = "occurrence", columnDefinition = "TEXT")
    private String occurrence;

    @Column(name = "driver_confirmed_at")
    private LocalDateTime driverConfirmedAt;

    @Column(name = "vehicle_confirmed_at")
    private LocalDateTime vehicleConfirmedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripStatus status;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum TripStatus {
        PLANNED,
        STARTING,
        BOARDING,
        ARRIVING,
        IN_PROGRESS,
        PAUSED,
        FINISHED,
        CANCELLED
    }
}
