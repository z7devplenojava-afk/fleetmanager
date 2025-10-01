package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.InventoryMovementService;

import br.com.fleetmanager.dto.InventoryMovementDTO;
import br.com.fleetmanager.model.InventoryMovement;
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
@Tag(name = "Movimentação de Estoque", description = "Endpoints para movimentação de estoque")
public class InventoryMovementController {
    
    private final InventoryMovementService inventoryMovementService;
    
    @GetMapping
    @Operation(summary = "Listar movimentações de estoque", description = "Retorna uma lista paginada de movimentações de estoque")
    public ResponseEntity<Page<InventoryMovement>> getAll(Pageable pageable) {
        return ResponseEntity.ok(inventoryMovementService.findAll(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as movimentações de estoque", description = "Retorna uma lista completa de movimentações de estoque")
    public ResponseEntity<List<InventoryMovement>> getAllWithoutPagination() {
        return ResponseEntity.ok(inventoryMovementService.findAll());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar movimentação por ID", description = "Retorna uma movimentação específica pelo seu ID")
    public ResponseEntity<InventoryMovement> getById(@PathVariable UUID id) {
        Optional<InventoryMovement> movement = inventoryMovementService.findById(id);
        return movement.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/item/{itemId}")
    @Operation(summary = "Buscar movimentações por item", description = "Retorna movimentações de um item específico")
    public ResponseEntity<List<InventoryMovement>> getByItem(@PathVariable UUID itemId) {
        return ResponseEntity.ok(inventoryMovementService.findByItem(itemId));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar movimentações por tipo", description = "Retorna movimentações de um tipo específico")
    public ResponseEntity<List<InventoryMovement>> getByType(@PathVariable InventoryMovement.MovementType type) {
        return ResponseEntity.ok(inventoryMovementService.findByType(type));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar movimentações por status", description = "Retorna movimentações de um status específico")
    public ResponseEntity<List<InventoryMovement>> getByStatus(@PathVariable InventoryMovement.MovementStatus status) {
        return ResponseEntity.ok(inventoryMovementService.findByStatus(status));
    }
    
    @GetMapping("/period")
    @Operation(summary = "Buscar movimentações por período", description = "Retorna movimentações em um período específico")
    public ResponseEntity<List<InventoryMovement>> getByPeriod(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        return ResponseEntity.ok(inventoryMovementService.findByMovementDateBetween(startDate, endDate));
    }
    
    @GetMapping("/filters")
    @Operation(summary = "Buscar movimentações com filtros avançados", description = "Busca movimentações aplicando múltiplos filtros")
    public ResponseEntity<Page<InventoryMovement>> getByAdvancedFilters(
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) InventoryMovement.MovementType type,
            @RequestParam(required = false) InventoryMovement.MovementStatus status,
            @RequestParam(required = false) String requester,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Pageable pageable) {
        return ResponseEntity.ok(inventoryMovementService.findByAdvancedFilters(itemId, type, status, requester, employeeName, department, location, startDate, endDate, pageable));
    }
    
    @PostMapping
    @Operation(summary = "Registrar movimentação de estoque", description = "Registra uma nova movimentação de estoque")
    public ResponseEntity<InventoryMovement> create(@Valid @RequestBody InventoryMovementDTO dto) {
        return ResponseEntity.ok(inventoryMovementService.create(dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir movimentação de estoque", description = "Exclui uma movimentação de estoque do sistema")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        inventoryMovementService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
} 