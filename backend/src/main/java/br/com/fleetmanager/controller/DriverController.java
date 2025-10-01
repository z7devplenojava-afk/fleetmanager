package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.DriverService;

import br.com.fleetmanager.dto.CreateDriverDTO;
import br.com.fleetmanager.dto.DriverDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {
    private final DriverService driverService;

    @GetMapping
    public ResponseEntity<List<DriverDTO>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverDTO> getDriverById(@PathVariable UUID id) {
        return ResponseEntity.ok(driverService.getDriverById(id));
    }

    @PostMapping
    public ResponseEntity<DriverDTO> createDriver(@Valid @RequestBody CreateDriverDTO dto) {
        return ResponseEntity.ok(driverService.createDriver(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DriverDTO> updateDriver(@PathVariable UUID id, @Valid @RequestBody CreateDriverDTO dto) {
        return ResponseEntity.ok(driverService.updateDriver(id, dto));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateDriver(@PathVariable UUID id) {
        driverService.deactivateDriver(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable UUID id) {
        driverService.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugDrivers() {
        try {
            List<DriverDTO> drivers = driverService.getAllDrivers();
            
            Map<String, Object> debug = new HashMap<>();
            debug.put("totalDrivers", drivers.size());
            debug.put("drivers", drivers.stream().map(driver -> {
                Map<String, Object> driverInfo = new HashMap<>();
                driverInfo.put("id", driver.getId());
                driverInfo.put("name", driver.getName());
                driverInfo.put("status", driver.getStatus());
                driverInfo.put("licenseNumber", driver.getLicenseNumber());
                return driverInfo;
            }).collect(java.util.stream.Collectors.toList()));
            
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }
} 