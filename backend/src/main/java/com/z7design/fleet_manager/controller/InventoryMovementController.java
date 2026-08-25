package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.InventoryMovementDTO;
import com.z7design.fleet_manager.model.InventoryMovement;
import com.z7design.fleet_manager.service.InventoryMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
@Tag(name = "MovimentaÃ§Ã£o de Estoque", description = "Endpoints para movimentaÃ§Ã£o de estoque")
public class InventoryMovementController {
    
    private final InventoryMovementService inventoryMovementService;
    
    @GetMapping
    @Operation(summary = "Listar movimentaÃ§Ãµes de estoque", description = "Retorna uma lista paginada de movimentaÃ§Ãµes de estoque")
    public ResponseEntity<Page<InventoryMovement>> getAll(Pageable pageable) {
        return ResponseEntity.ok(inventoryMovementService.findAll(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as movimentaÃ§Ãµes de estoque", description = "Retorna uma lista completa de movimentaÃ§Ãµes de estoque")
    public ResponseEntity<List<InventoryMovement>> getAllWithoutPagination() {
        return ResponseEntity.ok(inventoryMovementService.findAll());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar movimentaÃ§Ã£o por ID", description = "Retorna uma movimentaÃ§Ã£o especÃ­fica pelo seu ID")
    public ResponseEntity<InventoryMovement> getById(@PathVariable("id") UUID id) {
        Optional<InventoryMovement> movement = inventoryMovementService.findById(id);
        return movement.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/item/{itemId}")
    @Operation(summary = "Buscar movimentaÃ§Ãµes por item", description = "Retorna movimentaÃ§Ãµes de um item especÃ­fico")
    public ResponseEntity<List<InventoryMovement>> getByItem(@PathVariable("itemId") UUID itemId) {
        return ResponseEntity.ok(inventoryMovementService.findByItem(itemId));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar movimentaÃ§Ãµes por tipo", description = "Retorna movimentaÃ§Ãµes de um tipo especÃ­fico")
    public ResponseEntity<List<InventoryMovement>> getByType(@PathVariable("type") InventoryMovement.MovementType type) {
        return ResponseEntity.ok(inventoryMovementService.findByType(type));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar movimentaÃ§Ãµes por status", description = "Retorna movimentaÃ§Ãµes de um status especÃ­fico")
    public ResponseEntity<List<InventoryMovement>> getByStatus(@PathVariable("status") InventoryMovement.MovementStatus status) {
        return ResponseEntity.ok(inventoryMovementService.findByStatus(status));
    }
    
    @GetMapping("/period")
    @Operation(summary = "Buscar movimentaÃ§Ãµes por perÃ­odo", description = "Retorna movimentaÃ§Ãµes em um perÃ­odo especÃ­fico")
    public ResponseEntity<List<InventoryMovement>> getByPeriod(
            @RequestParam(value = "startDate") LocalDateTime startDate,
            @RequestParam(value = "endDate") LocalDateTime endDate) {
        return ResponseEntity.ok(inventoryMovementService.findByMovementDateBetween(startDate, endDate));
    }
    
    @GetMapping("/filters")
    @Operation(summary = "Buscar movimentaÃ§Ãµes com filtros avanÃ§ados", description = "Busca movimentaÃ§Ãµes aplicando mÃºltiplos filtros")
    public ResponseEntity<Page<InventoryMovement>> getByAdvancedFilters(
            @RequestParam(value = "itemId", required = false) UUID itemId,
            @RequestParam(value = "type", required = false) InventoryMovement.MovementType type,
            @RequestParam(value = "status", required = false) InventoryMovement.MovementStatus status,
            @RequestParam(value = "requester", required = false) String requester,
            @RequestParam(value = "employeeName", required = false) String employeeName,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "startDate", required = false) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) LocalDateTime endDate,
            Pageable pageable) {
        return ResponseEntity.ok(inventoryMovementService.findByAdvancedFilters(itemId, type, status, requester, employeeName, department, location, startDate, endDate, pageable));
    }
    
    @PostMapping
    @Operation(summary = "Registrar movimentaÃ§Ã£o de estoque", description = "Registra uma nova movimentaÃ§Ã£o de estoque")
    public ResponseEntity<InventoryMovement> create(@Valid @RequestBody InventoryMovementDTO dto) {
        return ResponseEntity.ok(inventoryMovementService.create(dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir movimentaÃ§Ã£o de estoque", description = "Exclui uma movimentaÃ§Ã£o de estoque do sistema")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        inventoryMovementService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
} 
