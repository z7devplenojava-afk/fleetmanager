package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PassengerDTO;
import com.z7design.fleet_manager.service.PassengerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/passengers")
@RequiredArgsConstructor
@Tag(name = "Passageiros", description = "Endpoints para gestão de passageiros")
public class PassengerController {

    private final PassengerService passengerService;

    @PostMapping
    @Operation(summary = "Criar passageiro", description = "Cria um novo passageiro")
    public ResponseEntity<PassengerDTO> create(@RequestBody PassengerDTO dto) {
        PassengerDTO created = passengerService.create(dto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar passageiro", description = "Atualiza um passageiro existente")
    public ResponseEntity<PassengerDTO> update(@PathVariable UUID id, @RequestBody PassengerDTO dto) {
        PassengerDTO updated = passengerService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir passageiro", description = "Exclui um passageiro")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        passengerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar passageiro por ID", description = "Retorna um passageiro pelo ID")
    public ResponseEntity<PassengerDTO> getById(@PathVariable UUID id) {
        PassengerDTO passenger = passengerService.getById(id);
        return ResponseEntity.ok(passenger);
    }

    @GetMapping("/company/{companyId}")
    @Operation(summary = "Listar passageiros por empresa", description = "Retorna todos os passageiros de uma empresa")
    public ResponseEntity<List<PassengerDTO>> getByCompanyId(@PathVariable UUID companyId) {
        List<PassengerDTO> passengers = passengerService.getByCompanyId(companyId);
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/route/{routeId}")
    @Operation(summary = "Listar passageiros por rota", description = "Retorna todos os passageiros de uma rota")
    public ResponseEntity<List<PassengerDTO>> getByRouteId(@PathVariable UUID routeId) {
        List<PassengerDTO> passengers = passengerService.getByRouteId(routeId);
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/company/{companyId}/active")
    @Operation(summary = "Listar passageiros ativos por empresa", description = "Retorna todos os passageiros ativos de uma empresa")
    public ResponseEntity<List<PassengerDTO>> getActiveByCompanyId(@PathVariable UUID companyId) {
        List<PassengerDTO> passengers = passengerService.getActiveByCompanyId(companyId);
        return ResponseEntity.ok(passengers);
    }
}
