package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleInspectionDTO;
import com.z7design.fleet_manager.model.VehicleInspection.VehicleReleaseStatus;
import com.z7design.fleet_manager.service.VehicleInspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicle-inspections")
@RequiredArgsConstructor
@Tag(name = "Laudos de Inspeção", description = "API para emissão e gestão de Laudos de Inspeção Veicular")
public class VehicleInspectionController {

    private final VehicleInspectionService service;

    @GetMapping
    @Operation(summary = "Listar laudos de inspeção com paginação e filtros")
    public ResponseEntity<Page<VehicleInspectionDTO>> findAll(
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String project,
            @RequestParam(required = false) VehicleReleaseStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "inspectionDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<VehicleInspectionDTO> page = service.findAll(
                plate, client, project, status, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar laudo de inspeção por ID")
    public ResponseEntity<VehicleInspectionDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @Operation(summary = "Criar novo laudo de inspeção")
    public ResponseEntity<VehicleInspectionDTO> create(@Valid @RequestBody VehicleInspectionDTO dto) {
        VehicleInspectionDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar laudo de inspeção existente")
    public ResponseEntity<VehicleInspectionDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody VehicleInspectionDTO dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir laudo de inspeção")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/next-registry-number")
    @Operation(summary = "Obter próximo número sequencial sugerido para o laudo")
    public ResponseEntity<Map<String, String>> getNextRegistryNumber() {
        String next = service.generateNextRegistryNumber();
        return ResponseEntity.ok(Map.of("nextRegistryNumber", next));
    }
}

