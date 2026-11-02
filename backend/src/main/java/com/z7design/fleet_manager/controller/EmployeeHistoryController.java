package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EmployeeHistoryDTO;
import com.z7design.fleet_manager.dto.EmployeeHistoryRequestDTO;
import com.z7design.fleet_manager.service.EmployeeHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para gerenciamento do histÃ³rico de funcionÃ¡rios
 */
@RestController
@RequestMapping("/api/employees/{employeeId}/history")
@RequiredArgsConstructor
@Tag(name = "HistÃ³rico de FuncionÃ¡rios", description = "API para gerenciamento do histÃ³rico de eventos do funcionÃ¡rio")
public class EmployeeHistoryController {

    private final EmployeeHistoryService employeeHistoryService;

    @GetMapping
    @Operation(summary = "Listar histÃ³rico do funcionÃ¡rio", description = "Retorna os eventos do histÃ³rico de um funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EmployeeHistoryDTO>> getHistory(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(employeeHistoryService.getByEmployee(employeeId));
    }

    @PostMapping
    @Operation(summary = "Criar evento de histÃ³rico", description = "Cria um novo evento no histÃ³rico do funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<EmployeeHistoryDTO> createHistory(
            @PathVariable("employeeId") UUID employeeId,
            @RequestBody EmployeeHistoryRequestDTO request) {
        return ResponseEntity.status(201).body(employeeHistoryService.create(employeeId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar evento de histÃ³rico", description = "Atualiza um evento do histÃ³rico do funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<EmployeeHistoryDTO> updateHistory(
            @PathVariable("employeeId") UUID employeeId,
            @PathVariable("id") UUID id,
            @RequestBody EmployeeHistoryRequestDTO request) {
        return ResponseEntity.ok(employeeHistoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir evento de histÃ³rico", description = "Exclui um evento do histÃ³rico do funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable("employeeId") UUID employeeId,
            @PathVariable("id") UUID id) {
        employeeHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
