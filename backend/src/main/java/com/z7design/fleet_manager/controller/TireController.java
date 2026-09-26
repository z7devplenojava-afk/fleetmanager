package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.warehouse.TireDismountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireMountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.VehicleTireChassisDTO;
import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.TireMovement;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.TireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tires")
@RequiredArgsConstructor
@Slf4j
public class TireController {

    private final TireService tireService;

    @GetMapping
    public ResponseEntity<List<Tire>> findAll(@AuthenticationPrincipal User user) {
        log.info("GET /api/tires - Listando pneus da empresa");
        try {
            UUID companyId = user != null ? user.getCompanyId() : null;
            List<Tire> tires = tireService.findByCompanyId(companyId);
            tires.forEach(t -> t.setVehicle(null));
            return ResponseEntity.ok(tires);
        } catch (Exception e) {
            log.error("Erro ao listar pneus: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Tire>> findAvailable(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        List<Tire> tires = tireService.findAvailable(companyId);
        tires.forEach(t -> t.setVehicle(null));
        return ResponseEntity.ok(tires);
    }

    @GetMapping("/chassis/{vehicleId}")
    public ResponseEntity<VehicleTireChassisDTO> getVehicleChassis(@PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(tireService.getVehicleChassis(vehicleId));
    }

    @PostMapping("/mount")
    public ResponseEntity<Tire> mountTire(
            @AuthenticationPrincipal User user,
            @RequestBody TireMountRequestDTO req
    ) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        UUID userId = user != null ? user.getId() : UUID.randomUUID();
        return ResponseEntity.ok(tireService.mountTire(req, companyId, userId));
    }

    @PostMapping("/dismount")
    public ResponseEntity<Tire> dismountTire(
            @AuthenticationPrincipal User user,
            @RequestBody TireDismountRequestDTO req
    ) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        UUID userId = user != null ? user.getId() : UUID.randomUUID();
        return ResponseEntity.ok(tireService.dismountTire(req, companyId, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tire> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tireService.findById(id));
    }

    @PostMapping
    public Tire create(@RequestBody Tire tire) {
        return tireService.save(tire);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tire> update(@PathVariable("id") UUID id, @RequestBody Tire tire) {
        tire.setId(id);
        return ResponseEntity.ok(tireService.save(tire));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        tireService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/movements")
    public TireMovement registerMovement(@RequestBody TireMovement movement) {
        return tireService.registerMovement(movement);
    }

    @GetMapping("/{id}/history")
    public List<TireMovement> getHistory(@PathVariable("id") UUID id) {
        return tireService.getHistory(id);
    }
}
