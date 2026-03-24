package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateSpecificActivityRequest;
import com.z7design.fleet_manager.dto.SpecificActivityResponse;
import com.z7design.fleet_manager.model.SpecificActivity;
import com.z7design.fleet_manager.service.SpecificActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/specific-activities")
@CrossOrigin(origins = "*")
public class SpecificActivityController {

    @Autowired
    private SpecificActivityService specificActivityService;

    @GetMapping
    public ResponseEntity<List<SpecificActivityResponse>> getAllSpecificActivities() {
        List<SpecificActivityResponse> activities = specificActivityService.getAllSpecificActivities();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpecificActivityResponse> getSpecificActivityById(@PathVariable UUID id) {
        return specificActivityService.getSpecificActivityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByEmployee(@PathVariable UUID employeeId) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByEmployee(employeeId);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByLocation(@PathVariable UUID locationId) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByLocation(locationId);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByDate(@PathVariable LocalDate date) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByDate(date);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByStatus(@PathVariable SpecificActivity.ActivityStatus status) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByStatus(status);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByType(@PathVariable SpecificActivity.ActivityType type) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByType(type);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByDateRange(startDate, endDate);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/employee/{employeeId}/date-range")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByEmployeeAndDateRange(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByEmployeeAndDateRange(employeeId, startDate, endDate);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/location/{locationId}/date-range")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByLocationAndDateRange(
            @PathVariable UUID locationId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByLocationAndDateRange(locationId, startDate, endDate);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/type/{type}/date-range")
    public ResponseEntity<List<SpecificActivityResponse>> getSpecificActivitiesByTypeAndDateRange(
            @PathVariable SpecificActivity.ActivityType type,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<SpecificActivityResponse> activities = specificActivityService.getSpecificActivitiesByTypeAndDateRange(type, startDate, endDate);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/today")
    public ResponseEntity<List<SpecificActivityResponse>> getTodayActivities() {
        List<SpecificActivityResponse> activities = specificActivityService.getTodayActivities();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<SpecificActivityResponse>> getPendingActivities() {
        List<SpecificActivityResponse> activities = specificActivityService.getPendingActivities();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/pending/date/{date}")
    public ResponseEntity<List<SpecificActivityResponse>> getPendingActivitiesByDate(@PathVariable LocalDate date) {
        List<SpecificActivityResponse> activities = specificActivityService.getPendingActivitiesByDate(date);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<SpecificActivityResponse>> getOverdueActivities() {
        List<SpecificActivityResponse> activities = specificActivityService.getOverdueActivities();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/in-progress")
    public ResponseEntity<List<SpecificActivityResponse>> getInProgressActivities() {
        List<SpecificActivityResponse> activities = specificActivityService.getInProgressActivities();
        return ResponseEntity.ok(activities);
    }

    @PostMapping
    public ResponseEntity<SpecificActivityResponse> createSpecificActivity(@RequestBody CreateSpecificActivityRequest request) {
        try {
            SpecificActivityResponse createdActivity = specificActivityService.createSpecificActivity(request);
            return ResponseEntity.ok(createdActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpecificActivityResponse> updateSpecificActivity(@PathVariable UUID id, @RequestBody CreateSpecificActivityRequest request) {
        try {
            SpecificActivityResponse updatedActivity = specificActivityService.updateSpecificActivity(id, request);
            return ResponseEntity.ok(updatedActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SpecificActivityResponse> updateStatus(@PathVariable UUID id, @RequestParam SpecificActivity.ActivityStatus status) {
        try {
            SpecificActivityResponse updatedActivity = specificActivityService.updateStatus(id, status);
            return ResponseEntity.ok(updatedActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<SpecificActivityResponse> startActivity(@PathVariable UUID id) {
        try {
            SpecificActivityResponse startedActivity = specificActivityService.startActivity(id);
            return ResponseEntity.ok(startedActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<SpecificActivityResponse> completeActivity(@PathVariable UUID id, @RequestParam(required = false) String observations) {
        try {
            SpecificActivityResponse completedActivity = specificActivityService.completeActivity(id, observations);
            return ResponseEntity.ok(completedActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecificActivity(@PathVariable UUID id) {
        try {
            specificActivityService.deleteSpecificActivity(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

