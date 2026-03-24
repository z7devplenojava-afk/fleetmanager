package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.TransportMobilizationDTO;
import com.z7design.fleet_manager.model.TransportMobilization;
import com.z7design.fleet_manager.service.TransportMobilizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transport-mobilizations")
@RequiredArgsConstructor
@Slf4j
public class TransportMobilizationController {

    private final TransportMobilizationService service;

    @GetMapping
    public ResponseEntity<List<TransportMobilizationDTO>> findAll(
            @RequestParam(name = "companyId", required = false) String companyId,
            @RequestParam(name = "vehicleId", required = false) String vehicleId,
            @RequestParam(name = "type", required = false) TransportMobilization.MobilizationType type,
            @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        log.info("Recebendo requisição para listar mobilizações. companyId (raw): [{}], vehicleId (raw): [{}]",
                companyId, vehicleId);

        UUID companyUuid = null;
        if (companyId != null && !companyId.trim().isEmpty() && !companyId.equals("undefined")
                && !companyId.equals("null")) {
            try {
                companyUuid = UUID.fromString(companyId);
            } catch (IllegalArgumentException e) {
                log.warn("companyId inválido ignorado: [{}]", companyId);
            }
        }

        UUID vehicleUuid = null;
        if (vehicleId != null && !vehicleId.trim().isEmpty() && !vehicleId.equals("undefined")
                && !vehicleId.equals("null")) {
            try {
                vehicleUuid = UUID.fromString(vehicleId);
            } catch (IllegalArgumentException e) {
                log.warn("vehicleId inválido ignorado: [{}]", vehicleId);
            }
        }

        return ResponseEntity.ok(service.findByFilters(companyUuid, vehicleUuid, type, dateFrom, dateTo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportMobilizationDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<TransportMobilizationDTO> create(@Valid @RequestBody TransportMobilizationDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportMobilizationDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody TransportMobilizationDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/odometer-photo")
    public ResponseEntity<TransportMobilizationDTO> uploadOdometerPhoto(
            @PathVariable UUID id,
            @RequestParam("photo") MultipartFile file) {
        return ResponseEntity.ok(service.uploadOdometerPhoto(id, file));
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<TransportMobilizationDTO> uploadPhotos(
            @PathVariable UUID id,
            @RequestParam("photos") MultipartFile[] files) {
        return ResponseEntity.ok(service.uploadPhotos(id, files));
    }
}
