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
 * Endpoints de gestão de limpeza dos veículos — fluxo ponta a ponta.
 * <p>
 * Solicitação (setor + prioridade + deadline) -> fila por SLA -> start com previsão
 * -> fases (externa/interna) -> inspeção de qualidade -> liberação final com vaga.
 */
@RestController
@RequestMapping("/api/frota/vehicle-cleanings")
@RequiredArgsConstructor
@Slf4j
public class VehicleCleaningController {

    private final VehicleCleaningService service;

    @GetMapping
    public ResponseEntity<List<VehicleCleaningOrderDTO>> list(
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @RequestParam(value = "status", required = false) VehicleCleaningOrder.CleaningStatus status,
            @RequestParam(value = "garageId", required = false) UUID garageId,
            @AuthenticationPrincipal User user) {
        UUID companyId = user.getCompanyId();
        return ResponseEntity.ok(service.list(vehicleId, status, companyId, garageId));
    }

    /** Triagem & Fila Inteligente: pendentes ordenadas por prazo (SLA) e prioridade. */
    @GetMapping("/queue")
    public ResponseEntity<List<VehicleCleaningOrderDTO>> queue(
            @RequestParam(value = "garageId", required = false) UUID garageId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getQueue(user.getCompanyId(), garageId));
    }

    /** Template do checklist rápido de inspeção de qualidade. */
    @GetMapping("/quality-checklist-template")
    public ResponseEntity<String> qualityChecklistTemplate() {
        return ResponseEntity.ok(service.getDefaultQualityChecklist());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleCleaningOrderDTO> getById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @PostMapping
    public ResponseEntity<VehicleCleaningOrderDTO> create(
            @Valid @RequestBody CreateVehicleCleaningOrderRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(request, user));
    }

    /** Início da higienização: calcula previsão de término e notifica CCO/motorista. */
    @PostMapping("/{id}/start")
    public ResponseEntity<VehicleCleaningOrderDTO> start(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.start(id, user.getCompanyId()));
    }

    /** Avança a fase de execução: externa -> interna -> inspeção. */
    @PostMapping("/{id}/phase")
    public ResponseEntity<VehicleCleaningOrderDTO> advancePhase(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.advancePhase(id, user.getCompanyId()));
    }

    /** Inspeção de qualidade (checklist WC/bancos/vidros); pode já concluir a ordem. */
    @PostMapping("/{id}/quality")
    public ResponseEntity<VehicleCleaningOrderDTO> submitQualityInspection(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String qualityChecklist = (String) body.get("qualityChecklist");
        String inspectedBy = body.get("inspectedBy") instanceof String s && !s.isBlank()
                ? s : user.getName();
        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        boolean approveAndComplete = Boolean.TRUE.equals(body.get("approveAndComplete"));
        return ResponseEntity.ok(service.submitQualityInspection(
                id, qualityChecklist, inspectedBy, approve, approveAndComplete, user.getCompanyId()));
    }

    /** Liberação final: "Liberado para Viagem" + alerta imediato ao motorista/Tráfego. */
    @PostMapping("/{id}/release")
    public ResponseEntity<VehicleCleaningOrderDTO> release(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String releaseSpot = body != null && body.get("releaseSpot") instanceof String s && !s.isBlank()
                ? s : null;
        return ResponseEntity.ok(service.release(id, releaseSpot, user.getCompanyId()));
    }

    @PutMapping("/{id}/checklist")
    public ResponseEntity<VehicleCleaningOrderDTO> updateChecklist(
            @PathVariable("id") UUID id,
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
            @PathVariable("id") UUID id,
            @RequestParam("itemKey") String itemKey,
            @RequestParam("photo") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.uploadItemPhoto(id, itemKey, file, user.getCompanyId()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<VehicleCleaningOrderDTO> complete(
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
