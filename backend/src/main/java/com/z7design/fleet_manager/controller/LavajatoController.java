package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateLavajatoServiceRequest;
import com.z7design.fleet_manager.dto.LavajatoServiceDTO;
import com.z7design.fleet_manager.model.LavajatoService;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.LavajatoServiceService;
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
 * Endpoints de gestão de lavajato (lavagem de veículos).
 * <p>
 * Fluxo: criar registro -> iniciar (timer) -> preencher checklists ->
 * finalizar (notifica motorista + operacional via sino + WhatsApp).
 */
@RestController
@RequestMapping("/api/frota/lavajato")
@RequiredArgsConstructor
@Slf4j
public class LavajatoController {

    private final LavajatoServiceService service;

    @GetMapping
    public ResponseEntity<List<LavajatoServiceDTO>> list(
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @RequestParam(value = "status", required = false) LavajatoService.LavajatoStatus status,
            @AuthenticationPrincipal User user) {
        UUID companyId = user.getCompanyId();
        return ResponseEntity.ok(service.list(vehicleId, status, companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LavajatoServiceDTO> getById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.computeStats(vehicleId, user.getCompanyId()));
    }

    @PostMapping
    public ResponseEntity<LavajatoServiceDTO> create(
            @Valid @RequestBody CreateLavajatoServiceRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(request, user));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<LavajatoServiceDTO> start(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.start(id, user.getCompanyId()));
    }

    @PutMapping("/{id}/checklist-internal")
    public ResponseEntity<LavajatoServiceDTO> updateChecklistInternal(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String checklistData = body.get("checklistData");
        if (checklistData == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.updateChecklistInternal(id, checklistData, user.getCompanyId()));
    }

    @PutMapping("/{id}/checklist-external")
    public ResponseEntity<LavajatoServiceDTO> updateChecklistExternal(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String checklistData = body.get("checklistData");
        if (checklistData == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.updateChecklistExternal(id, checklistData, user.getCompanyId()));
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<LavajatoServiceDTO> uploadItemPhoto(
            @PathVariable("id") UUID id,
            @RequestParam("itemKey") String itemKey,
            @RequestParam("checklistType") String checklistType,
            @RequestParam("photo") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.uploadItemPhoto(id, itemKey, checklistType, file, user.getCompanyId()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<LavajatoServiceDTO> complete(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.complete(id, user.getCompanyId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getCompanyId());
        return ResponseEntity.noContent().build();
    }
}
