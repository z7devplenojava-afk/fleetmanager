package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.BoardingRecord;
import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.service.BoardingService;
import com.z7design.fleet_manager.repository.TripRepository;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/boarding")
@RequiredArgsConstructor
public class BoardingController {
    private final BoardingService boardingService;
    private final TripRepository tripRepository;
    private final RoutePointRepository routePointRepository;
    private final EmployeeRepository employeeRepository;

    @PostMapping("/scan")
    @PreAuthorize("hasAnyAuthority('BOARDING_EXECUTE', 'ROLE_MANAGER_TRAFEGO')")
    public ResponseEntity<BoardingRecord> recordBoarding(
            @RequestParam("tripId") UUID tripId,
            @RequestParam("pointId") UUID pointId,
            @RequestParam("passengerId") UUID passengerId,
            @RequestParam("lat") Double lat,
            @RequestParam("lng") Double lng) {

        Trip trip = tripRepository.findById(tripId).orElseThrow();
        RoutePoint point = routePointRepository.findById(pointId).orElseThrow();
        Employee passenger = employeeRepository.findById(passengerId).orElseThrow();

        return ResponseEntity.ok(boardingService.recordBoarding(trip, point, passenger, lat, lng));
    }
}
