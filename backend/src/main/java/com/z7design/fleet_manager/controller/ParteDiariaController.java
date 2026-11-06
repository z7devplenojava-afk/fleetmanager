package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ParteDiariaDTO;
import com.z7design.fleet_manager.service.ParteDiariaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/partes-diarias")
@RequiredArgsConstructor
@Tag(name = "Parte Diária Operacional", description = "Endpoints para lançamento e validação de Partes Diárias (PRD 1.1)")
public class ParteDiariaController {

    private final ParteDiariaService parteDiariaService;

    private UUID parseUuidOrNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @PostMapping
    @Operation(summary = "Criar Parte Diária", description = "Cadastra uma nova Parte Diária operacional com horários e KM")
    public ResponseEntity<ParteDiariaDTO> create(@RequestBody ParteDiariaDTO dto) {
        return ResponseEntity.ok(parteDiariaService.create(dto));
    }

    @GetMapping
    @Operation(summary = "Listar Partes Diárias", description = "Lista Partes Diárias por cliente, período ou completas")
    public ResponseEntity<List<ParteDiariaDTO>> list(
            @RequestParam(value = "clientId", required = false) String clientId,
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        UUID clientUuid = parseUuidOrNull(clientId);
        if (clientId != null && !clientId.isBlank() && clientUuid == null) {
            return ResponseEntity.ok(parteDiariaService.findFiltered(null, start, end));
        }
        return ResponseEntity.ok(parteDiariaService.findFiltered(clientUuid, start, end));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar Parte Diária por ID", description = "Retorna os detalhes operacionais de uma Parte Diária")
    public ResponseEntity<ParteDiariaDTO> getById(@PathVariable("id") String id) {
        UUID uuid = parseUuidOrNull(id);
        if (uuid == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(parteDiariaService.getById(uuid));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar Parte Diária", description = "Edita uma Parte Diária existente (ou cria caso seja um registro de preset local)")
    public ResponseEntity<ParteDiariaDTO> update(@PathVariable("id") String id, @RequestBody ParteDiariaDTO dto) {
        UUID uuid = parseUuidOrNull(id);
        if (uuid == null) {
            return ResponseEntity.ok(parteDiariaService.create(dto));
        }
        return ResponseEntity.ok(parteDiariaService.update(uuid, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir Parte Diária", description = "Remove uma Parte Diária por ID")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        UUID uuid = parseUuidOrNull(id);
        if (uuid != null) {
            parteDiariaService.delete(uuid);
        }
        return ResponseEntity.noContent().build();
    }
}
