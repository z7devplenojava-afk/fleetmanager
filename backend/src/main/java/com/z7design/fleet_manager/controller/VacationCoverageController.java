package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateVacationCoverageRequest;
import com.z7design.fleet_manager.dto.VacationCoverageResponse;
import com.z7design.fleet_manager.model.VacationCoverage;
import com.z7design.fleet_manager.service.VacationCoverageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vacation-coverages")
@CrossOrigin(origins = "*")
public class VacationCoverageController {

    @Autowired
    private VacationCoverageService vacationCoverageService;

    @GetMapping
    public ResponseEntity<List<VacationCoverageResponse>> getAllVacationCoverages() {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getAllVacationCoverages();
        return ResponseEntity.ok(coverages);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VacationCoverageResponse> getVacationCoverageById(@PathVariable UUID id) {
        return vacationCoverageService.getVacationCoverageById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<VacationCoverageResponse>> getVacationCoveragesByEmployee(@PathVariable UUID employeeId) {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getVacationCoveragesByEmployee(employeeId);
        return ResponseEntity.ok(coverages);
    }

    @GetMapping("/substitute/{substituteEmployeeId}")
    public ResponseEntity<List<VacationCoverageResponse>> getVacationCoveragesBySubstitute(@PathVariable UUID substituteEmployeeId) {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getVacationCoveragesBySubstitute(substituteEmployeeId);
        return ResponseEntity.ok(coverages);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<VacationCoverageResponse>> getVacationCoveragesByStatus(@PathVariable VacationCoverage.CoverageStatus status) {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getVacationCoveragesByStatus(status);
        return ResponseEntity.ok(coverages);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<VacationCoverageResponse>> getVacationCoveragesByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getVacationCoveragesByDateRange(startDate, endDate);
        return ResponseEntity.ok(coverages);
    }

    @GetMapping("/needing-attention")
    public ResponseEntity<List<VacationCoverageResponse>> getVacationCoveragesNeedingAttention() {
        List<VacationCoverageResponse> coverages = vacationCoverageService.getVacationCoveragesNeedingAttention();
        return ResponseEntity.ok(coverages);
    }

    @PostMapping
    public ResponseEntity<VacationCoverageResponse> createVacationCoverage(@RequestBody CreateVacationCoverageRequest request) {
        try {
            VacationCoverageResponse createdCoverage = vacationCoverageService.createVacationCoverage(request);
            return ResponseEntity.ok(createdCoverage);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<VacationCoverageResponse> updateVacationCoverage(@PathVariable UUID id, @RequestBody CreateVacationCoverageRequest request) {
        try {
            VacationCoverageResponse updatedCoverage = vacationCoverageService.updateVacationCoverage(id, request);
            return ResponseEntity.ok(updatedCoverage);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<VacationCoverageResponse> updateStatus(@PathVariable UUID id, @RequestParam VacationCoverage.CoverageStatus status) {
        try {
            VacationCoverageResponse updatedCoverage = vacationCoverageService.updateStatus(id, status);
            return ResponseEntity.ok(updatedCoverage);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVacationCoverage(@PathVariable UUID id) {
        try {
            vacationCoverageService.deleteVacationCoverage(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

