package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateWorkPostAssignmentRequest;
import com.z7design.fleet_manager.dto.WorkPostAssignmentResponse;
import com.z7design.fleet_manager.model.WorkPostAssignment;
import com.z7design.fleet_manager.service.WorkPostAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/work-post-assignments")
@CrossOrigin(origins = "*")
public class WorkPostAssignmentController {

    @Autowired
    private WorkPostAssignmentService workPostAssignmentService;

    @GetMapping
    public ResponseEntity<List<WorkPostAssignmentResponse>> getAllWorkPostAssignments() {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getAllWorkPostAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkPostAssignmentResponse> getWorkPostAssignmentById(@PathVariable("id") UUID id) {
        return workPostAssignmentService.getWorkPostAssignmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByEmployee(@PathVariable("employeeId") UUID employeeId) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByEmployee(employeeId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/work-post/{workPostId}")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByWorkPost(@PathVariable("workPostId") UUID workPostId) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByWorkPost(workPostId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByDate(@PathVariable("date") LocalDate date) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByDate(date);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByStatus(@PathVariable("status") WorkPostAssignment.AssignmentStatus status) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByStatus(status);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByDateRange(
            @RequestParam(value = "startDate") LocalDate startDate,
            @RequestParam(value = "endDate") LocalDate endDate) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByDateRange(startDate, endDate);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/employee/{employeeId}/date-range")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByEmployeeAndDateRange(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") LocalDate startDate,
            @RequestParam(value = "endDate") LocalDate endDate) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByEmployeeAndDateRange(employeeId, startDate, endDate);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/work-post/{workPostId}/date-range")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getWorkPostAssignmentsByWorkPostAndDateRange(
            @PathVariable("workPostId") UUID workPostId,
            @RequestParam(value = "startDate") LocalDate startDate,
            @RequestParam(value = "endDate") LocalDate endDate) {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getWorkPostAssignmentsByWorkPostAndDateRange(workPostId, startDate, endDate);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/today")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getTodayAssignments() {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getTodayAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getPendingAssignments() {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getPendingAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/active")
    public ResponseEntity<List<WorkPostAssignmentResponse>> getActiveAssignments() {
        List<WorkPostAssignmentResponse> assignments = workPostAssignmentService.getActiveAssignments();
        return ResponseEntity.ok(assignments);
    }

    @PostMapping
    public ResponseEntity<WorkPostAssignmentResponse> createWorkPostAssignment(@RequestBody CreateWorkPostAssignmentRequest request) {
        try {
            WorkPostAssignmentResponse createdAssignment = workPostAssignmentService.createWorkPostAssignment(request);
            return ResponseEntity.ok(createdAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkPostAssignmentResponse> updateWorkPostAssignment(@PathVariable("id") UUID id, @RequestBody CreateWorkPostAssignmentRequest request) {
        try {
            WorkPostAssignmentResponse updatedAssignment = workPostAssignmentService.updateWorkPostAssignment(id, request);
            return ResponseEntity.ok(updatedAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<WorkPostAssignmentResponse> updateStatus(@PathVariable("id") UUID id, @RequestParam(value = "status") WorkPostAssignment.AssignmentStatus status) {
        try {
            WorkPostAssignmentResponse updatedAssignment = workPostAssignmentService.updateStatus(id, status);
            return ResponseEntity.ok(updatedAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<WorkPostAssignmentResponse> confirmAssignment(@PathVariable("id") UUID id) {
        try {
            WorkPostAssignmentResponse confirmedAssignment = workPostAssignmentService.confirmAssignment(id);
            return ResponseEntity.ok(confirmedAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<WorkPostAssignmentResponse> completeAssignment(@PathVariable("id") UUID id) {
        try {
            WorkPostAssignmentResponse completedAssignment = workPostAssignmentService.completeAssignment(id);
            return ResponseEntity.ok(completedAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkPostAssignment(@PathVariable("id") UUID id) {
        try {
            workPostAssignmentService.deleteWorkPostAssignment(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

