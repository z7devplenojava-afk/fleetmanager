package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.BoardingDTO;
import com.z7design.fleet_manager.service.BoardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/boardings")
@RequiredArgsConstructor
@Tag(name = "Embarques", description = "Endpoints para gestão de embarques")
public class BoardingController {

    private final BoardingService boardingService;

    @PostMapping
    @Operation(summary = "Criar embarque", description = "Cria um novo registro de embarque")
    public ResponseEntity<BoardingDTO> create(@RequestBody BoardingDTO dto) {
        BoardingDTO created = boardingService.create(dto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar embarque", description = "Atualiza um registro de embarque existente")
    public ResponseEntity<BoardingDTO> update(@PathVariable("id") UUID id, @RequestBody BoardingDTO dto) {
        BoardingDTO updated = boardingService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir embarque", description = "Exclui um registro de embarque")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        boardingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar embarque por ID", description = "Retorna um registro de embarque pelo ID")
    public ResponseEntity<BoardingDTO> getById(@PathVariable("id") UUID id) {
        BoardingDTO boarding = boardingService.getById(id);
        return ResponseEntity.ok(boarding);
    }

    @GetMapping("/trip/{tripId}")
    @Operation(summary = "Listar embarques por viagem", description = "Retorna todos os embarques de uma viagem")
    public ResponseEntity<List<BoardingDTO>> getByTripId(@PathVariable("tripId") UUID tripId) {
        List<BoardingDTO> boardings = boardingService.getByTripId(tripId);
        return ResponseEntity.ok(boardings);
    }

    @GetMapping("/passenger/{passengerId}")
    @Operation(summary = "Listar embarques por passageiro", description = "Retorna todos os embarques de um passageiro")
    public ResponseEntity<List<BoardingDTO>> getByPassengerId(@PathVariable("passengerId") UUID passengerId) {
        List<BoardingDTO> boardings = boardingService.getByPassengerId(passengerId);
        return ResponseEntity.ok(boardings);
    }

    @PostMapping("/check-in")
    @Operation(summary = "Realizar check-in", description = "Registra o embarque de um passageiro em uma viagem")
    public ResponseEntity<BoardingDTO> checkIn(@RequestBody Map<String, Object> request) {
        UUID tripId = UUID.fromString((String) request.get("tripId"));
        UUID passengerId = UUID.fromString((String) request.get("passengerId"));
        Double latitude = request.get("latitude") != null ? Double.parseDouble(request.get("latitude").toString()) : null;
        Double longitude = request.get("longitude") != null ? Double.parseDouble(request.get("longitude").toString()) : null;
        
        BoardingDTO boarding = boardingService.checkIn(tripId, passengerId, latitude, longitude);
        return ResponseEntity.ok(boarding);
    }
}
