package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.warehouse.TireDismountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireMountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireRecapActionDTO;
import com.z7design.fleet_manager.dto.warehouse.VehicleTireChassisDTO;
import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.TireFrontAxleException;
import com.z7design.fleet_manager.model.TireLifecycleConfig;
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
            return ResponseEntity.ok(tireService.findByCompanyId(companyId));
        } catch (Exception e) {
            log.error("Erro ao listar pneus: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Tire>> findAvailable(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.findAvailable(companyId));
    }

    @GetMapping("/chassis/{vehicleId}")
    public ResponseEntity<VehicleTireChassisDTO> getVehicleChassis(@PathVariable("vehicleId") UUID vehicleId) {
        return ResponseEntity.ok(tireService.getVehicleChassis(vehicleId));
    }

    @GetMapping("/lifecycle-config")
    public ResponseEntity<TireLifecycleConfig> getLifecycleConfig(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.getLifecycleConfig(companyId));
    }

    @PutMapping("/lifecycle-config")
    public ResponseEntity<TireLifecycleConfig> updateLifecycleConfig(
            @AuthenticationPrincipal User user,
            @RequestBody TireLifecycleConfig config) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.updateLifecycleConfig(companyId, config));
    }

    @GetMapping("/exceptions")
    public ResponseEntity<List<TireFrontAxleException>> getFrontAxleExceptions(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "activeOnly", defaultValue = "false") boolean activeOnly) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.getFrontAxleExceptions(companyId, activeOnly));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<TireMovement>> getAllMovements(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.getAllMovements(companyId));
    }

    @PostMapping("/mount")
    public ResponseEntity<Tire> mountTire(
            @AuthenticationPrincipal User user,
            @RequestBody TireMountRequestDTO req
    ) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        UUID userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(tireService.mountTire(req, companyId, userId));
    }

    @PostMapping("/dismount")
    public ResponseEntity<Tire> dismountTire(
            @AuthenticationPrincipal User user,
            @RequestBody TireDismountRequestDTO req
    ) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        UUID userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(tireService.dismountTire(req, companyId, userId));
    }

    @PostMapping("/{id}/recap-send")
    public ResponseEntity<Tire> sendToRecap(
            @AuthenticationPrincipal User user,
            @PathVariable("id") UUID id,
            @RequestBody(required = false) TireRecapActionDTO req) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.sendToRecap(id, req, companyId));
    }

    @PostMapping("/{id}/recap-return")
    public ResponseEntity<Tire> returnFromRecap(
            @AuthenticationPrincipal User user,
            @PathVariable("id") UUID id,
            @RequestBody(required = false) TireRecapActionDTO req) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(tireService.returnFromRecap(id, req, companyId));
    }

    @PostMapping("/{id}/scrap")
    public ResponseEntity<Tire> scrapTire(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) TireRecapActionDTO req) {
        return ResponseEntity.ok(tireService.scrapTire(id, req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tire> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(tireService.findById(id));
    }

    @PostMapping
    public Tire create(@AuthenticationPrincipal User user, @RequestBody Tire tire) {
        if (tire.getCompanyId() == null && user != null) {
            tire.setCompanyId(user.getCompanyId());
        }
        return tireService.save(tire);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tire> update(
            @AuthenticationPrincipal User user,
            @PathVariable("id") UUID id,
            @RequestBody Tire tire) {
        tire.setId(id);
        if (tire.getCompanyId() == null && user != null) {
            tire.setCompanyId(user.getCompanyId());
        }
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
