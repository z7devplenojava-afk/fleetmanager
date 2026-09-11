package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FinancialTransactionDTO;
import com.z7design.fleet_manager.model.FinancialTransaction;
import com.z7design.fleet_manager.service.FinancialTransactionService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/financial/transactions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TransaÃ§Ãµes Financeiras", description = "Endpoints para gestÃ£o de transaÃ§Ãµes financeiras")
public class FinancialTransactionController {
    
    private final FinancialTransactionService transactionService;
    private final UnitRepository unitRepository;
    private final SupplierRepository supplierRepository;
    
    @GetMapping
    @Operation(summary = "Listar todas as transaÃ§Ãµes", description = "Retorna uma lista de todas as transaÃ§Ãµes financeiras")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transaÃ§Ãµes retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<FinancialTransactionDTO>> getAll() {
        List<FinancialTransaction> transactions = transactionService.findAll();
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar transaÃ§Ã£o por ID", description = "Retorna uma transaÃ§Ã£o especÃ­fica pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "TransaÃ§Ã£o encontrada"),
            @ApiResponse(responseCode = "404", description = "TransaÃ§Ã£o nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<FinancialTransactionDTO> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(transactionService.findById(UUID.fromString(id)).map(FinancialTransactionDTO::fromEntity).orElseThrow(() -> new ResourceNotFoundException("TransaÃ§Ã£o nÃ£o encontrada")));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar transaÃ§Ãµes por tipo", description = "Retorna transaÃ§Ãµes de um tipo especÃ­fico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByType(@PathVariable("type") String type) {
        List<FinancialTransaction> transactions = transactionService.findByType(type);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar transaÃ§Ãµes por status", description = "Retorna transaÃ§Ãµes de um status especÃ­fico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByStatus(@PathVariable("status") String status) {
        List<FinancialTransaction> transactions = transactionService.findByStatus(status);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Buscar transaÃ§Ãµes por categoria", description = "Retorna transaÃ§Ãµes de uma categoria especÃ­fica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByCategory(@PathVariable("category") String category) {
        List<FinancialTransaction> transactions = transactionService.findByCategory(category);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/date/{date}")
    @Operation(summary = "Buscar transaÃ§Ãµes por data", description = "Retorna transaÃ§Ãµes de uma data especÃ­fica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByDate(@PathVariable("date") String date) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        List<FinancialTransaction> transactions = transactionService.findByDate(localDate);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    @Operation(summary = "Criar nova transaÃ§Ã£o", description = "Cria uma nova transaÃ§Ã£o financeira no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "TransaÃ§Ã£o criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<FinancialTransactionDTO> create(@Valid @RequestBody FinancialTransactionDTO transactionDTO) {
        try {
            log.info("POST /api/financial/transactions - Criando nova transaÃ§Ã£o");
            log.info("Dados recebidos: {}", transactionDTO);
            
            // Converter DTO para entidade usando o mÃ©todo correto
            FinancialTransaction transaction = FinancialTransactionDTO.toEntity(transactionDTO, unitRepository, supplierRepository);
            
            // Salvar a transaÃ§Ã£o
            FinancialTransaction saved = transactionService.save(transaction);
            
            log.info("âœ… TransaÃ§Ã£o criada com sucesso - ID: {}", saved.getId());
            return ResponseEntity.status(201).body(FinancialTransactionDTO.fromEntity(saved));
            
        } catch (Exception e) {
            log.error("âŒ Erro ao criar transaÃ§Ã£o financeira: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir transaÃ§Ã£o", description = "Exclui uma transaÃ§Ã£o do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "TransaÃ§Ã£o excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "404", description = "TransaÃ§Ã£o nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        transactionService.deleteById(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    // Endpoints para busca por unidade
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar transaÃ§Ãµes por unidade", description = "Retorna transaÃ§Ãµes de uma unidade especÃ­fica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnit(@PathVariable("unitId") UUID unitId) {
        List<FinancialTransaction> transactions = transactionService.findByUnitId(unitId);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/type/{type}")
    @Operation(summary = "Buscar transaÃ§Ãµes por unidade e tipo", description = "Retorna transaÃ§Ãµes de uma unidade com tipo especÃ­fico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndType(@PathVariable("unitId") UUID unitId, @PathVariable("type") String type) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndType(unitId, type);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/status/{status}")
    @Operation(summary = "Buscar transaÃ§Ãµes por unidade e status", description = "Retorna transaÃ§Ãµes de uma unidade com status especÃ­fico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndStatus(@PathVariable("unitId") UUID unitId, @PathVariable("status") String status) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndStatus(unitId, status);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/category/{category}")
    @Operation(summary = "Buscar transaÃ§Ãµes por unidade e categoria", description = "Retorna transaÃ§Ãµes de uma unidade com categoria especÃ­fica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndCategory(@PathVariable("unitId") UUID unitId, @PathVariable("category") String category) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndCategory(unitId, category);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/date/{date}")
    @Operation(summary = "Buscar transaÃ§Ãµes por unidade e data", description = "Retorna transaÃ§Ãµes de uma unidade com data especÃ­fica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndDate(@PathVariable("unitId") UUID unitId, @PathVariable("date") String date) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndDate(unitId, localDate);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
} 
