package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.SupplierDTO;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.service.SupplierService;
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
import com.z7design.fleet_manager.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Fornecedores", description = "Endpoints para gestÃ£o de fornecedores")
public class SupplierController {
    
    private final SupplierService supplierService;
    
    @GetMapping
    @Operation(summary = "Listar todos os fornecedores", description = "Retorna uma lista paginada de todos os fornecedores")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de fornecedores retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<Supplier>> getAll(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        return ResponseEntity.ok(supplierService.findAll(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os fornecedores (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todos os fornecedores")
    public ResponseEntity<List<Supplier>> getAllWithoutPagination() {
        return ResponseEntity.ok(supplierService.findAll());
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar fornecedores ativos", description = "Retorna apenas fornecedores ativos")
    public ResponseEntity<List<Supplier>> getActiveSuppliers() {
        return ResponseEntity.ok(supplierService.findActiveSuppliers());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar fornecedor por ID", description = "Retorna um fornecedor especÃ­fico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fornecedor encontrado"),
            @ApiResponse(responseCode = "404", description = "Fornecedor nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Supplier> getById(@PathVariable String id) {
        return ResponseEntity.ok(supplierService.findById(UUID.fromString(id)).orElseThrow(() -> new ResourceNotFoundException("Fornecedor nÃ£o encontrado")));
    }
    
    @GetMapping("/cnpj/{cnpj}")
    @Operation(summary = "Buscar fornecedor por CNPJ", description = "Retorna um fornecedor especÃ­fico pelo seu CNPJ")
    public ResponseEntity<Supplier> getByCnpj(@PathVariable String cnpj) {
        Optional<Supplier> supplier = supplierService.findByCnpj(cnpj);
        return supplier.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/email/{email}")
    @Operation(summary = "Buscar fornecedor por email", description = "Retorna um fornecedor especÃ­fico pelo seu email")
    public ResponseEntity<Supplier> getByEmail(@PathVariable String email) {
        Optional<Supplier> supplier = supplierService.findByEmail(email);
        return supplier.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar fornecedores por nome", description = "Busca fornecedores pelo nome (parcial)")
    public ResponseEntity<List<Supplier>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByNameContaining(name));
    }
    
    @GetMapping("/city/{city}")
    @Operation(summary = "Buscar fornecedores por cidade", description = "Retorna fornecedores de uma cidade especÃ­fica")
    public ResponseEntity<List<Supplier>> getByCity(@PathVariable String city) {
        return ResponseEntity.ok(supplierService.findByCity(city));
    }
    
    @GetMapping("/state/{state}")
    @Operation(summary = "Buscar fornecedores por estado", description = "Retorna fornecedores de um estado especÃ­fico")
    public ResponseEntity<List<Supplier>> getByState(@PathVariable String state) {
        return ResponseEntity.ok(supplierService.findByState(state));
    }
    
    @GetMapping("/filters")
    @Operation(summary = "Buscar fornecedores com filtros", description = "Busca fornecedores aplicando mÃºltiplos filtros")
    public ResponseEntity<Page<Supplier>> getByFilters(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cnpj,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) Boolean isActive,
            Pageable pageable) {
        return ResponseEntity.ok(supplierService.findByFilters(name, cnpj, city, state, isActive, pageable));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo fornecedor", description = "Cria um novo fornecedor no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fornecedor criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Supplier> create(@Valid @RequestBody SupplierDTO supplierDTO) {
        return ResponseEntity.ok(supplierService.create(supplierDTO));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar fornecedor", description = "Atualiza os dados de um fornecedor existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fornecedor atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Fornecedor nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Supplier> update(@PathVariable String id, @Valid @RequestBody SupplierDTO supplierDTO) {
        return ResponseEntity.ok(supplierService.update(UUID.fromString(id), supplierDTO));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir fornecedor", description = "Exclui um fornecedor do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Fornecedor excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Fornecedor nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.deleteById(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Alternar status do fornecedor", description = "Ativa ou desativa um fornecedor")
    public ResponseEntity<Supplier> toggleStatus(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);
        Supplier supplier = supplierService.findById(uuid).orElseThrow(() -> new ResourceNotFoundException("Fornecedor nÃ£o encontrado"));
        if (supplier.getIsActive()) {
            supplierService.deactivate(uuid);
        } else {
            supplierService.activate(uuid);
        }
        return ResponseEntity.ok(supplierService.findById(uuid).orElseThrow(() -> new ResourceNotFoundException("Fornecedor nÃ£o encontrado")));
    }
    
    @GetMapping("/categories")
    @Operation(summary = "Listar categorias de fornecedores", description = "Retorna todas as categorias de fornecedores disponÃ­veis")
    public ResponseEntity<List<String>> getCategories() {
        // Por enquanto retorna uma lista vazia, pode ser implementado no repository se necessÃ¡rio
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/stats/count")
    @Operation(summary = "EstatÃ­sticas de fornecedores", description = "Retorna contadores de fornecedores ativos e inativos")
    public ResponseEntity<Object> getStats() {
        long activeCount = supplierService.countActiveSuppliers();
        long inactiveCount = supplierService.countInactiveSuppliers();
        
        return ResponseEntity.ok(new Object() {
            public final long active = activeCount;
            public final long inactive = inactiveCount;
            public final long total = activeCount + inactiveCount;
        });
    }
} 
