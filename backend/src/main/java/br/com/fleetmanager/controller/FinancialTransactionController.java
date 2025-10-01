package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.FinancialTransactionService;

import br.com.fleetmanager.dto.FinancialTransactionDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.FinancialTransaction;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.repository.SupplierRepository;
import br.com.fleetmanager.repository.UnitRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/financial/transactions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Transações Financeiras", description = "Endpoints para gestão de transações financeiras")
public class FinancialTransactionController {
    
    private final FinancialTransactionService transactionService;
    private final UnitRepository unitRepository;
    private final SupplierRepository supplierRepository;
    
    @GetMapping
    @Operation(summary = "Listar todas as transações", description = "Retorna uma lista de todas as transações financeiras")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de transações retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<FinancialTransactionDTO>> getAll() {
        List<FinancialTransaction> transactions = transactionService.findAll();
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar transação por ID", description = "Retorna uma transação específica pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transação encontrada"),
            @ApiResponse(responseCode = "404", description = "Transação não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<FinancialTransactionDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(transactionService.findById(UUID.fromString(id)).map(FinancialTransactionDTO::fromEntity).orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada")));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar transações por tipo", description = "Retorna transações de um tipo específico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByType(@PathVariable String type) {
        List<FinancialTransaction> transactions = transactionService.findByType(type);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar transações por status", description = "Retorna transações de um status específico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByStatus(@PathVariable String status) {
        List<FinancialTransaction> transactions = transactionService.findByStatus(status);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Buscar transações por categoria", description = "Retorna transações de uma categoria específica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByCategory(@PathVariable String category) {
        List<FinancialTransaction> transactions = transactionService.findByCategory(category);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/date/{date}")
    @Operation(summary = "Buscar transações por data", description = "Retorna transações de uma data específica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByDate(@PathVariable String date) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        List<FinancialTransaction> transactions = transactionService.findByDate(localDate);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    @Operation(summary = "Criar nova transação", description = "Cria uma nova transação financeira no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Transação criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<FinancialTransactionDTO> create(@Valid @RequestBody FinancialTransactionDTO transactionDTO) {
        try {
            log.info("POST /api/financial/transactions - Criando nova transação");
            log.info("Dados recebidos: {}", transactionDTO);
            
            // Converter DTO para entidade usando o método correto
            FinancialTransaction transaction = FinancialTransactionDTO.toEntity(transactionDTO, unitRepository, supplierRepository);
            
            // Salvar a transação
            FinancialTransaction saved = transactionService.save(transaction);
            
            log.info("✅ Transação criada com sucesso - ID: {}", saved.getId());
            return ResponseEntity.status(201).body(FinancialTransactionDTO.fromEntity(saved));
            
        } catch (Exception e) {
            log.error("❌ Erro ao criar transação financeira: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir transação", description = "Exclui uma transação do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Transação excluída com sucesso"),
            @ApiResponse(responseCode = "404", description = "Transação não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        transactionService.deleteById(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    // Endpoints para busca por unidade
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar transações por unidade", description = "Retorna transações de uma unidade específica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnit(@PathVariable UUID unitId) {
        List<FinancialTransaction> transactions = transactionService.findByUnitId(unitId);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/type/{type}")
    @Operation(summary = "Buscar transações por unidade e tipo", description = "Retorna transações de uma unidade com tipo específico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndType(@PathVariable UUID unitId, @PathVariable String type) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndType(unitId, type);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/status/{status}")
    @Operation(summary = "Buscar transações por unidade e status", description = "Retorna transações de uma unidade com status específico")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndStatus(@PathVariable UUID unitId, @PathVariable String status) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndStatus(unitId, status);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/category/{category}")
    @Operation(summary = "Buscar transações por unidade e categoria", description = "Retorna transações de uma unidade com categoria específica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndCategory(@PathVariable UUID unitId, @PathVariable String category) {
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndCategory(unitId, category);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/date/{date}")
    @Operation(summary = "Buscar transações por unidade e data", description = "Retorna transações de uma unidade com data específica")
    public ResponseEntity<List<FinancialTransactionDTO>> getByUnitAndDate(@PathVariable UUID unitId, @PathVariable String date) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        List<FinancialTransaction> transactions = transactionService.findByUnitIdAndDate(unitId, localDate);
        List<FinancialTransactionDTO> dtos = transactions.stream().map(FinancialTransactionDTO::fromEntity).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
} 