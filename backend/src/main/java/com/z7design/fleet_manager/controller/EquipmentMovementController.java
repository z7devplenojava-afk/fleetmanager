package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.service.EquipmentMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipment-movements")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "MovimentaÃ§Ãµes de Equipamentos", description = "Endpoints para controle de movimentaÃ§Ãµes e histÃ³rico de equipamentos")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentMovementController {
    
    private final EquipmentMovementService movementService;
    
    @PostMapping
    @Operation(summary = "Criar nova movimentaÃ§Ã£o", description = "Registra nova movimentaÃ§Ã£o de equipamento (retirada, transferÃªncia, etc.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "MovimentaÃ§Ã£o criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "409", description = "Equipamento jÃ¡ estÃ¡ em uso")
    })
    public ResponseEntity<EquipmentMovementDTO> createMovement(@Valid @RequestBody CreateEquipmentMovementDTO dto) {
        log.info("Recebida solicitaÃ§Ã£o para criar movimentaÃ§Ã£o de equipamento: {}", dto.getEquipmentId());
        EquipmentMovementDTO movement = movementService.createMovement(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(movement);
    }
    
    @PostMapping("/{movementId}/return")
    @Operation(summary = "Processar devoluÃ§Ã£o", description = "Registra a devoluÃ§Ã£o de um equipamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "DevoluÃ§Ã£o processada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Equipamento jÃ¡ foi devolvido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "MovimentaÃ§Ã£o nÃ£o encontrada")
    })
    public ResponseEntity<EquipmentMovementDTO> returnEquipment(
            @PathVariable("movementId") UUID movementId,
            @RequestParam(value = "conditionOnReturn", required = false) String conditionOnReturn,
            @RequestParam(value = "notes", required = false) String notes) {
        log.info("Recebida solicitaÃ§Ã£o para processar devoluÃ§Ã£o - Movement ID: {}", movementId);
        EquipmentMovementDTO movement = movementService.returnEquipment(movementId, conditionOnReturn, notes);
        return ResponseEntity.ok(movement);
    }
    
    @GetMapping("/equipment/{equipmentId}/history")
    @Operation(summary = "HistÃ³rico de um equipamento", description = "Retorna todo o histÃ³rico de movimentaÃ§Ãµes de um equipamento")
    @ApiResponse(responseCode = "200", description = "HistÃ³rico retornado com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getEquipmentHistory(@PathVariable("equipmentId") UUID equipmentId) {
        log.info("Recebida solicitaÃ§Ã£o para histÃ³rico do equipamento: {}", equipmentId);
        List<EquipmentMovementDTO> history = movementService.getEquipmentHistory(equipmentId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "MovimentaÃ§Ãµes de um funcionÃ¡rio", description = "Retorna todas as movimentaÃ§Ãµes de equipamentos de um funcionÃ¡rio")
    @ApiResponse(responseCode = "200", description = "MovimentaÃ§Ãµes do funcionÃ¡rio retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getEmployeeMovements(@PathVariable("employeeId") UUID employeeId) {
        log.info("Recebida solicitaÃ§Ã£o para movimentaÃ§Ãµes do funcionÃ¡rio: {}", employeeId);
        List<EquipmentMovementDTO> movements = movementService.getEmployeeMovements(employeeId);
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/work-post/{workPostId}")
    @Operation(summary = "MovimentaÃ§Ãµes de um posto", description = "Retorna todas as movimentaÃ§Ãµes de equipamentos de um posto de trabalho")
    @ApiResponse(responseCode = "200", description = "MovimentaÃ§Ãµes do posto retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getWorkPostMovements(@PathVariable("workPostId") UUID workPostId) {
        log.info("Recebida solicitaÃ§Ã£o para movimentaÃ§Ãµes do posto: {}", workPostId);
        List<EquipmentMovementDTO> movements = movementService.getWorkPostMovements(workPostId);
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/active")
    @Operation(summary = "MovimentaÃ§Ãµes ativas", description = "Retorna todas as movimentaÃ§Ãµes ativas (equipamentos em uso)")
    @ApiResponse(responseCode = "200", description = "MovimentaÃ§Ãµes ativas retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getActiveMovements() {
        log.info("Recebida solicitaÃ§Ã£o para movimentaÃ§Ãµes ativas");
        List<EquipmentMovementDTO> movements = movementService.getActiveMovements();
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "MovimentaÃ§Ãµes em atraso", description = "Retorna equipamentos que deveriam ter sido devolvidos")
    @ApiResponse(responseCode = "200", description = "MovimentaÃ§Ãµes em atraso retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getOverdueMovements() {
        log.info("Recebida solicitaÃ§Ã£o para movimentaÃ§Ãµes em atraso");
        List<EquipmentMovementDTO> movements = movementService.getOverdueMovements();
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/due-soon")
    @Operation(summary = "MovimentaÃ§Ãµes vencendo", description = "Retorna equipamentos que devem ser devolvidos em breve")
    @ApiResponse(responseCode = "200", description = "MovimentaÃ§Ãµes vencendo retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getMovementsDueSoon(@RequestParam(value = "days", defaultValue = "7") int days) {
        log.info("Recebida solicitaÃ§Ã£o para movimentaÃ§Ãµes vencendo em {} dias", days);
        List<EquipmentMovementDTO> movements = movementService.getMovementsDueSoon(days);
        return ResponseEntity.ok(movements);
    }
} 
