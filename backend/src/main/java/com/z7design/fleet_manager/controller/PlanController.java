package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Plan;
import com.z7design.fleet_manager.repository.PlanRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
@Tag(name = "Planos Comerciais", description = "Gestão de planos comerciais e feature flags da plataforma SaaS")
public class PlanController {

    private final PlanRepository planRepository;

    @GetMapping
    @Operation(summary = "Listar planos disponíveis", description = "Retorna os planos comerciais ativos com suas capacidades e limites")
    public ResponseEntity<List<Plan>> getAllActivePlans() {
        return ResponseEntity.ok(planRepository.findByIsActiveTrueOrderByNameAsc());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar plano por ID")
    public ResponseEntity<Plan> getPlanById(@PathVariable UUID id) {
        return planRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FLEX_ADMIN')")
    @Operation(summary = "Criar novo plano comercial", description = "Exclusivo para Super Admins da plataforma FluxBus")
    public ResponseEntity<Plan> createPlan(@Valid @RequestBody Plan plan) {
        plan.setId(null);
        return ResponseEntity.status(201).body(planRepository.save(plan));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FLEX_ADMIN')")
    @Operation(summary = "Atualizar plano comercial", description = "Exclusivo para Super Admins da plataforma FluxBus")
    public ResponseEntity<Plan> updatePlan(@PathVariable UUID id, @Valid @RequestBody Plan updated) {
        return planRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setDescription(updated.getDescription());
            existing.setPriceCents(updated.getPriceCents());
            existing.setBillingCycle(updated.getBillingCycle());
            existing.setMaxUsers(updated.getMaxUsers());
            existing.setMaxVehicles(updated.getMaxVehicles());
            if (updated.getFeatures() != null) {
                existing.setFeatures(updated.getFeatures());
            }
            if (updated.getIsActive() != null) {
                existing.setIsActive(updated.getIsActive());
            }
            return ResponseEntity.ok(planRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
}
