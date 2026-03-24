package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.model.TripEvent;
import com.z7design.fleet_manager.repository.TripRepository;
import com.z7design.fleet_manager.repository.TripEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.dto.TripEventDTO;

/**
 * Service for managing Trips and their lifecycle.
 */
@Service
@RequiredArgsConstructor
public class TripService {
    private final TripRepository tripRepository;
    private final TripEventRepository tripEventRepository;

    @Transactional
    public Trip startTrip(UUID scheduleId) {
        // Basic start trip logic - to be expanded
        Trip trip = Trip.builder()
                // .schedule(scheduleRepository.findById(scheduleId)...)
                .status(Trip.TripStatus.STARTING)
                .startTime(LocalDateTime.now())
                .build();

        trip = tripRepository.save(trip);

        recordEvent(trip, TripEvent.TripEventType.TRIP_START, "Viagem iniciada");

        return trip;
    }

    @Transactional(readOnly = true)
    public List<TripEventDTO> getEvents() {
        return tripEventRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TripEventDTO convertToDTO(TripEvent event) {
        String tripName = "N/A";
        if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getRoute() != null) {
            tripName = event.getTrip().getSchedule().getRoute().getName();
        }

        String driverName = "N/A";
        if (event.getDriver() != null) {
            driverName = event.getDriver().getName();
        } else if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getEmployee() != null) {
            driverName = event.getTrip().getSchedule().getEmployee().getName();
        }

        String vehiclePlate = "N/A";
        if (event.getVehicle() != null) {
            vehiclePlate = event.getVehicle().getPlate();
        } else if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getVehicle() != null) {
            vehiclePlate = event.getTrip().getSchedule().getVehicle().getPlate();
        }

        return TripEventDTO.builder()
                .id(event.getId())
                .tripId(event.getTrip() != null ? event.getTrip().getId() : null)
                .tripName(tripName)
                .type(event.getType())
                .timestamp(event.getTimestamp())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .observations(event.getObservations())
                .driverName(driverName)
                .vehiclePlate(vehiclePlate)
                .build();
    }

    @Transactional
    public void recordEvent(Trip trip, TripEvent.TripEventType type, String observations) {
        TripEvent event = TripEvent.builder()
                .trip(trip)
                .type(type)
                .timestamp(LocalDateTime.now())
                .observations(observations)
                .build();
        tripEventRepository.save(event);
    }
}
