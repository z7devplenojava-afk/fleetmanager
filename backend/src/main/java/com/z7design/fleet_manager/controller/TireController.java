package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.TireMovement;
import com.z7design.fleet_manager.service.TireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Tire>> findAll() {
        log.info("GET /api/tires - Listando todos os pneus");
        try {
            List<Tire> tires = tireService.findAll();
            // Evita serialização de proxies LAZY (open-in-view=false)
            tires.forEach(t -> t.setVehicle(null));
            return ResponseEntity.ok(tires);
        } catch (Exception e) {
            log.error("Erro ao listar pneus: {}", e.getMessage(), e);
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tire> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(tireService.findById(id));
    }

    @PostMapping
    public Tire create(@RequestBody Tire tire) {
        return tireService.save(tire);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tire> update(@PathVariable UUID id, @RequestBody Tire tire) {
        tire.setId(id);
        return ResponseEntity.ok(tireService.save(tire));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        tireService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/movements")
    public TireMovement registerMovement(@RequestBody TireMovement movement) {
        return tireService.registerMovement(movement);
    }

    @GetMapping("/{id}/history")
    public List<TireMovement> getHistory(@PathVariable UUID id) {
        return tireService.getHistory(id);
    }
}
