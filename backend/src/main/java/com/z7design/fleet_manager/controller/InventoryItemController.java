package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.InventoryItemDTO;
import com.z7design.fleet_manager.model.InventoryItem;
import com.z7design.fleet_manager.service.InventoryItemService;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory-items")
@RequiredArgsConstructor
@Tag(name = "Estoque", description = "Endpoints para gestÃ£o de estoque de uniformes e equipamentos")
public class InventoryItemController {
    
    private final InventoryItemService inventoryItemService;
    
    @GetMapping
    @Operation(summary = "Listar itens de estoque", description = "Retorna uma lista paginada de itens de estoque")
    public ResponseEntity<Page<InventoryItem>> getAll(Pageable pageable) {
        return ResponseEntity.ok(inventoryItemService.findAll(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os itens de estoque", description = "Retorna uma lista completa de itens de estoque")
    public ResponseEntity<List<InventoryItem>> getAllWithoutPagination() {
        return ResponseEntity.ok(inventoryItemService.findAll());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar item por ID", description = "Retorna um item especÃ­fico pelo seu ID")
    public ResponseEntity<InventoryItem> getById(@PathVariable("id") UUID id) {
        Optional<InventoryItem> item = inventoryItemService.findById(id);
        return item.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/low-stock")
    @Operation(summary = "Listar itens com estoque baixo", description = "Retorna itens com quantidade igual ou abaixo do mÃ­nimo")
    public ResponseEntity<List<InventoryItem>> getLowStockItems() {
        return ResponseEntity.ok(inventoryItemService.findLowStockItems());
    }
    
    @GetMapping("/out-of-stock")
    @Operation(summary = "Listar itens sem estoque", description = "Retorna itens com quantidade igual a zero")
    public ResponseEntity<List<InventoryItem>> getOutOfStockItems() {
        return ResponseEntity.ok(inventoryItemService.findOutOfStockItems());
    }
    
    @GetMapping("/filters")
    @Operation(summary = "Buscar itens com filtros avanÃ§ados", description = "Busca itens aplicando mÃºltiplos filtros")
    public ResponseEntity<Page<InventoryItem>> getByAdvancedFilters(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "itemName", required = false) String itemName,
            @RequestParam(value = "brand", required = false) String brand,
            Pageable pageable) {
        return ResponseEntity.ok(inventoryItemService.findByAdvancedFilters(category, status, itemName, brand, pageable));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo item de estoque", description = "Cria um novo item de estoque")
    public ResponseEntity<InventoryItem> create(@Valid @RequestBody InventoryItemDTO dto) {
        return ResponseEntity.ok(inventoryItemService.create(dto));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar item de estoque", description = "Atualiza os dados de um item de estoque existente")
    public ResponseEntity<InventoryItem> update(@PathVariable("id") UUID id, @Valid @RequestBody InventoryItemDTO dto) {
        return ResponseEntity.ok(inventoryItemService.update(id, dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir item de estoque", description = "Exclui um item de estoque do sistema")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        inventoryItemService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
} 
