package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.DisembarkingDTO;
import com.z7design.fleet_manager.service.DisembarkingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/disembarkings")
@RequiredArgsConstructor
@Tag(name = "Desembarques", description = "Endpoints para gestão de desembarques")
public class DisembarkingController {

    private final DisembarkingService disembarkingService;

    @PostMapping
    @Operation(summary = "Criar desembarque", description = "Cria um novo registro de desembarque")
    public ResponseEntity<DisembarkingDTO> create(@RequestBody DisembarkingDTO dto) {
        DisembarkingDTO created = disembarkingService.create(dto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar desembarque", description = "Atualiza um registro de desembarque existente")
    public ResponseEntity<DisembarkingDTO> update(@PathVariable UUID id, @RequestBody DisembarkingDTO dto) {
        DisembarkingDTO updated = disembarkingService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir desembarque", description = "Exclui um registro de desembarque")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        disembarkingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar desembarque por ID", description = "Retorna um registro de desembarque pelo ID")
    public ResponseEntity<DisembarkingDTO> getById(@PathVariable UUID id) {
        DisembarkingDTO disembarking = disembarkingService.getById(id);
        return ResponseEntity.ok(disembarking);
    }

    @GetMapping("/boarding/{boardingId}")
    @Operation(summary = "Buscar desembarque por embarque", description = "Retorna o desembarque associado a um embarque")
    public ResponseEntity<DisembarkingDTO> getByBoardingId(@PathVariable UUID boardingId) {
        Optional<DisembarkingDTO> disembarking = disembarkingService.getByBoardingId(boardingId);
        return disembarking.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/check-out")
    @Operation(summary = "Realizar check-out", description = "Registra o desembarque de um passageiro")
    public ResponseEntity<DisembarkingDTO> checkOut(@RequestBody Map<String, Object> request) {
        UUID boardingId = UUID.fromString((String) request.get("boardingId"));
        Double latitude = request.get("latitude") != null ? Double.parseDouble(request.get("latitude").toString()) : null;
        Double longitude = request.get("longitude") != null ? Double.parseDouble(request.get("longitude").toString()) : null;
        
        DisembarkingDTO disembarking = disembarkingService.checkOut(boardingId, latitude, longitude);
        return ResponseEntity.ok(disembarking);
    }
}
