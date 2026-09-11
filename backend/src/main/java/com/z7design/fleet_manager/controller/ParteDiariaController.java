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

    @PostMapping
    @Operation(summary = "Criar Parte Diária", description = "Cadastra uma nova Parte Diária operacional com horários e KM")
    public ResponseEntity<ParteDiariaDTO> create(@RequestBody ParteDiariaDTO dto) {
        return ResponseEntity.ok(parteDiariaService.create(dto));
    }

    @GetMapping
    @Operation(summary = "Listar Partes Diárias", description = "Lista Partes Diárias por período ou completas")
    public ResponseEntity<List<ParteDiariaDTO>> list(
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        if (start != null && end != null) {
            return ResponseEntity.ok(parteDiariaService.findByPeriod(start, end));
        }
        return ResponseEntity.ok(parteDiariaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar Parte Diária por ID", description = "Retorna os detalhes operacionais de uma Parte Diária")
    public ResponseEntity<ParteDiariaDTO> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(parteDiariaService.getById(UUID.fromString(id)));
    }
}
