package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.BoardingRecord;
import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.TripEvent;
import com.z7design.fleet_manager.repository.BoardingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class BoardingService {
    private final BoardingRecordRepository boardingRecordRepository;
    private final TripService tripService;

    public BoardingService(BoardingRecordRepository boardingRecordRepository, TripService tripService) {
        this.boardingRecordRepository = boardingRecordRepository;
        this.tripService = tripService;
    }

    @Transactional
    public BoardingRecord recordBoarding(Trip trip, RoutePoint point, Employee passenger, Double lat, Double lng) {
        boolean geofenceValid = true;

        if (trip.getSchedule().getRoute().isGeofenceEnabled()) {
            geofenceValid = validateGeofence(point, lat, lng);
        }

        BoardingRecord record = BoardingRecord.builder()
                .trip(trip)
                .point(point)
                .passenger(passenger)
                .boardingTime(LocalDateTime.now())
                .latitude(lat)
                .longitude(lng)
                .geofenceValidated(geofenceValid)
                .build();

        record = boardingRecordRepository.save(record);

        if (!geofenceValid) {
            tripService.recordEvent(trip, TripEvent.TripEventType.BOARDING_DENIED_GEOFENCE,
                    "Tentativa de embarque fora do raio: " + passenger.getName() + " em " + point.getName());
        } else {
            tripService.recordEvent(trip, TripEvent.TripEventType.BOARDING,
                    "Embarque confirmado: " + passenger.getName());
        }

        return record;
    }

    private boolean validateGeofence(RoutePoint point, Double lat, Double lng) {
        if (lat == null || lng == null)
            return false;

        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(lat - point.getLatitude());
        double dLng = Math.toRadians(lng - point.getLongitude());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(point.getLatitude())) * Math.cos(Math.toRadians(lat)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = earthRadius * c;

        int radius = point.getRadiusMeters() != null ? point.getRadiusMeters()
                : point.getRoute().getDefaultRadiusMeters();

        return distance <= radius;
    }
}
