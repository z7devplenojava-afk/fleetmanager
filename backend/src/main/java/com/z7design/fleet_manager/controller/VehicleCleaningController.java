package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateVehicleCleaningOrderRequest;
import com.z7design.fleet_manager.dto.VehicleCleaningOrderDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.VehicleCleaningOrder;
import com.z7design.fleet_manager.service.VehicleCleaningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints de gestão de limpeza interna e externa dos veículos.
 * <p>
 * Fluxo: criar ordem -> iniciar (IN_PROGRESS) -> atualizar checklist e fotos
 * por item -> finalizar (COMPLETED, notifica o motorista via sino + WhatsApp).
 */
@RestController
@RequestMapping("/api/frota/vehicle-cleanings")
@RequiredArgsConstructor
@Slf4j
public class VehicleCleaningController {

    private final VehicleCleaningService service;

    @GetMapping
    public ResponseEntity<List<VehicleCleaningOrderDTO>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) VehicleCleaningOrder.CleaningStatus status,
            @AuthenticationPrincipal User user) {
        UUID companyId = user.getCompanyId();
        return ResponseEntity.ok(service.list(vehicleId, status, companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleCleaningOrderDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @PostMapping
    public ResponseEntity<VehicleCleaningOrderDTO> create(
            @Valid @RequestBody CreateVehicleCleaningOrderRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(request, user));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<VehicleCleaningOrderDTO> start(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.start(id, user.getCompanyId()));
    }

    @PutMapping("/{id}/checklist")
    public ResponseEntity<VehicleCleaningOrderDTO> updateChecklist(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String checklistData = body.get("checklistData");
        if (checklistData == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.updateChecklist(id, checklistData, user.getCompanyId()));
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<VehicleCleaningOrderDTO> uploadItemPhoto(
            @PathVariable UUID id,
            @RequestParam("itemKey") String itemKey,
            @RequestParam("photo") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.uploadItemPhoto(id, itemKey, file, user.getCompanyId()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<VehicleCleaningOrderDTO> complete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.complete(id, user.getCompanyId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getCompanyId());
        return ResponseEntity.noContent().build();
    }
}
