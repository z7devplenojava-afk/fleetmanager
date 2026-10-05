package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Trip;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Representacao plana de uma viagem operacional para a UI (PRD VSS - Fase 3).
 */
@Data
@Builder
public class TripOperacionalDTO {

    private UUID id;
    private UUID scheduleId;
    private UUID escalaId;
    private String status;
    private LocalDate tripDate;
    private LocalTime plannedDepartureTime;
    private LocalTime plannedArrivalTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private UUID routeId;
    private String routeName;
    private String routeColor;
    private Integer routeCapacity;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private Integer initialKm;
    private Integer finalKm;
    private Integer passengersExpected;
    private Integer passengersRealized;
    private String occurrence;
    private LocalDateTime driverConfirmedAt;
    private LocalDateTime vehicleConfirmedAt;
    private UUID dailyLogId;
    private UUID parteDiariaId;
    private String parteDiariaNumber;
    /** Badge derivada: partida planejada ja passou e a viagem nao terminou. */
    private boolean delayed;

    public static TripOperacionalDTO from(Trip trip) {
        boolean active = trip.getStatus() == Trip.TripStatus.PLANNED
                || trip.getStatus() == Trip.TripStatus.STARTING
                || trip.getStatus() == Trip.TripStatus.BOARDING
                || trip.getStatus() == Trip.TripStatus.ARRIVING
                || trip.getStatus() == Trip.TripStatus.IN_PROGRESS
                || trip.getStatus() == Trip.TripStatus.PAUSED;
        boolean delayed = active
                && trip.getTripDate() != null
                && trip.getPlannedDepartureTime() != null
                && trip.getTripDate().atTime(trip.getPlannedDepartureTime()).isBefore(LocalDateTime.now());

        return TripOperacionalDTO.builder()
                .id(trip.getId())
                .scheduleId(trip.getSchedule() != null ? trip.getSchedule().getId() : null)
                .escalaId(trip.getEscala() != null ? trip.getEscala().getId() : null)
                .status(trip.getStatus() != null ? trip.getStatus().name() : null)
                .tripDate(trip.getTripDate())
                .plannedDepartureTime(trip.getPlannedDepartureTime())
                .plannedArrivalTime(trip.getPlannedArrivalTime())
                .startTime(trip.getStartTime())
                .endTime(trip.getEndTime())
                .routeId(trip.getRoute() != null ? trip.getRoute().getId() : null)
                .routeName(trip.getRoute() != null ? trip.getRoute().getName() : null)
                .routeColor(trip.getRoute() != null ? trip.getRoute().getColor() : null)
                .routeCapacity(trip.getRoute() != null ? trip.getRoute().getCapacity() : null)
                .vehicleId(trip.getVehicle() != null ? trip.getVehicle().getId() : null)
                .vehiclePlate(trip.getVehicle() != null ? trip.getVehicle().getPlate() : null)
                .driverId(trip.getDriver() != null ? trip.getDriver().getId() : null)
                .driverName(trip.getDriver() != null ? trip.getDriver().getName() : null)
                .initialKm(trip.getInitialKm())
                .finalKm(trip.getFinalKm())
                .passengersExpected(trip.getPassengersExpected())
                .passengersRealized(trip.getPassengersRealized())
                .occurrence(trip.getOccurrence())
                .driverConfirmedAt(trip.getDriverConfirmedAt())
                .vehicleConfirmedAt(trip.getVehicleConfirmedAt())
                .delayed(delayed)
                .build();
    }
}
