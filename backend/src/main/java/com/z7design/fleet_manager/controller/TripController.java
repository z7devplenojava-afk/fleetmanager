package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {
    private final TripService tripService;

    @PostMapping("/start/{scheduleId}")
    @PreAuthorize("hasAnyAuthority('TRIPS_EXECUTE', 'ROLE_MANAGER_TRAFEGO')")
    public ResponseEntity<Trip> startTrip(@PathVariable("scheduleId") UUID scheduleId) {
        return ResponseEntity.ok(tripService.startTrip(scheduleId));
    }

    @GetMapping("/events")
    @PreAuthorize("hasAnyAuthority('TRIPS_VIEW', 'ROLE_MANAGER_TRAFEGO')")
    public ResponseEntity<?> getEvents() {
        return ResponseEntity.ok(tripService.getEvents());
    }

    // Additional endpoints for pause, resume, finish to be added
}
