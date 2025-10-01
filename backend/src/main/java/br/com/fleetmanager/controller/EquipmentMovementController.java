package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EquipmentMovementService;

import br.com.fleetmanager.dto.*;
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
@Tag(name = "Movimentações de Equipamentos", description = "Endpoints para controle de movimentações e histórico de equipamentos")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentMovementController {
    
    private final EquipmentMovementService movementService;
    
    @PostMapping
    @Operation(summary = "Criar nova movimentação", description = "Registra nova movimentação de equipamento (retirada, transferência, etc.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Movimentação criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "409", description = "Equipamento já está em uso")
    })
    public ResponseEntity<EquipmentMovementDTO> createMovement(@Valid @RequestBody CreateEquipmentMovementDTO dto) {
        log.info("Recebida solicitação para criar movimentação de equipamento: {}", dto.getEquipmentId());
        EquipmentMovementDTO movement = movementService.createMovement(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(movement);
    }
    
    @PostMapping("/{movementId}/return")
    @Operation(summary = "Processar devolução", description = "Registra a devolução de um equipamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Devolução processada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Equipamento já foi devolvido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Movimentação não encontrada")
    })
    public ResponseEntity<EquipmentMovementDTO> returnEquipment(
            @PathVariable UUID movementId,
            @RequestParam(required = false) String conditionOnReturn,
            @RequestParam(required = false) String notes) {
        log.info("Recebida solicitação para processar devolução - Movement ID: {}", movementId);
        EquipmentMovementDTO movement = movementService.returnEquipment(movementId, conditionOnReturn, notes);
        return ResponseEntity.ok(movement);
    }
    
    @GetMapping("/equipment/{equipmentId}/history")
    @Operation(summary = "Histórico de um equipamento", description = "Retorna todo o histórico de movimentações de um equipamento")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getEquipmentHistory(@PathVariable UUID equipmentId) {
        log.info("Recebida solicitação para histórico do equipamento: {}", equipmentId);
        List<EquipmentMovementDTO> history = movementService.getEquipmentHistory(equipmentId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Movimentações de um funcionário", description = "Retorna todas as movimentações de equipamentos de um funcionário")
    @ApiResponse(responseCode = "200", description = "Movimentações do funcionário retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getEmployeeMovements(@PathVariable UUID employeeId) {
        log.info("Recebida solicitação para movimentações do funcionário: {}", employeeId);
        List<EquipmentMovementDTO> movements = movementService.getEmployeeMovements(employeeId);
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/work-post/{workPostId}")
    @Operation(summary = "Movimentações de um posto", description = "Retorna todas as movimentações de equipamentos de um posto de trabalho")
    @ApiResponse(responseCode = "200", description = "Movimentações do posto retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getWorkPostMovements(@PathVariable UUID workPostId) {
        log.info("Recebida solicitação para movimentações do posto: {}", workPostId);
        List<EquipmentMovementDTO> movements = movementService.getWorkPostMovements(workPostId);
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Movimentações ativas", description = "Retorna todas as movimentações ativas (equipamentos em uso)")
    @ApiResponse(responseCode = "200", description = "Movimentações ativas retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getActiveMovements() {
        log.info("Recebida solicitação para movimentações ativas");
        List<EquipmentMovementDTO> movements = movementService.getActiveMovements();
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Movimentações em atraso", description = "Retorna equipamentos que deveriam ter sido devolvidos")
    @ApiResponse(responseCode = "200", description = "Movimentações em atraso retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getOverdueMovements() {
        log.info("Recebida solicitação para movimentações em atraso");
        List<EquipmentMovementDTO> movements = movementService.getOverdueMovements();
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/due-soon")
    @Operation(summary = "Movimentações vencendo", description = "Retorna equipamentos que devem ser devolvidos em breve")
    @ApiResponse(responseCode = "200", description = "Movimentações vencendo retornadas com sucesso")
    public ResponseEntity<List<EquipmentMovementDTO>> getMovementsDueSoon(@RequestParam(defaultValue = "7") int days) {
        log.info("Recebida solicitação para movimentações vencendo em {} dias", days);
        List<EquipmentMovementDTO> movements = movementService.getMovementsDueSoon(days);
        return ResponseEntity.ok(movements);
    }
} 