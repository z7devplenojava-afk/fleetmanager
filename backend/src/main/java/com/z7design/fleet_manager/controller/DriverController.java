package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateDriverDTO;
import com.z7design.fleet_manager.dto.DriverDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

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
    public ResponseEntity<?> createDriver(@Valid @RequestBody CreateDriverDTO dto) {
        try {
            return ResponseEntity.ok(driverService.createDriver(dto));
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("timestamp", java.time.LocalDateTime.now().toString());
            error.put("status", 400);
            error.put("error", "INVALID_ARGUMENT");
            error.put("message", e.getMessage());
            error.put("path", "/api/drivers");
            return ResponseEntity.status(400).body(error);
        }
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
    public ResponseEntity<?> deleteDriver(@PathVariable UUID id) {
        System.out.println("ðŸ—‘ï¸ DriverController.deleteDriver - Recebida requisiÃ§Ã£o DELETE para ID: " + id);
        try {
            driverService.deleteDriver(id);
            System.out.println("âœ… DriverController.deleteDriver - Retornando 204 No Content");
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            System.out.println("âŒ DriverController.deleteDriver - Motorista nÃ£o encontrado: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("timestamp", LocalDateTime.now().toString());
            error.put("status", 404);
            error.put("error", "NOT_FOUND");
            error.put("message", e.getMessage());
            error.put("path", "/api/drivers/" + id);
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            System.out.println("âŒ DriverController.deleteDriver - Erro inesperado: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("timestamp", LocalDateTime.now().toString());
            error.put("status", 500);
            error.put("error", "INTERNAL_SERVER_ERROR");
            error.put("message", e.getMessage());
            error.put("path", "/api/drivers/" + id);
            return ResponseEntity.status(500).body(error);
        }
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
