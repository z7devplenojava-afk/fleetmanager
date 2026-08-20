package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ContractDTO;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "Contratos", description = "API para gerenciamento de contratos")
public class ContractController {
    
    private final ContractService contractService;
    
    @GetMapping
    @Operation(summary = "Listar contratos", description = "Retorna uma lista paginada de contratos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ContractDTO>> getAllContracts(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<Contract> contracts = contractService.findAll(pageable);
        Page<ContractDTO> contractDTOs = contractService.convertToDTOPage(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar contrato por ID", description = "Retorna um contrato especÃ­fico pelo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contrato encontrado"),
        @ApiResponse(responseCode = "404", description = "Contrato nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ContractDTO> getContractById(
            @Parameter(description = "ID do contrato") @PathVariable("id") String id) {
        Contract contract = contractService.getById(UUID.fromString(id));
        ContractDTO contractDTO = contractService.convertToDTO(contract);
        return ResponseEntity.ok(contractDTO);
    }
    
    @PostMapping
    @Operation(summary = "Criar contrato", description = "Cria um novo contrato")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Contrato criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ContractDTO> createContract(
            @Parameter(description = "Dados do contrato") @Valid @RequestBody ContractDTO contractDTO) {
        Contract contract = contractService.createContract(contractDTO);
        ContractDTO createdContractDTO = contractService.convertToDTO(contract);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdContractDTO);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar contrato", description = "Atualiza um contrato existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contrato atualizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "404", description = "Contrato nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ContractDTO> updateContract(
            @Parameter(description = "ID do contrato") @PathVariable("id") String id,
            @Parameter(description = "Dados atualizados do contrato") @Valid @RequestBody ContractDTO contractDTO) {
        ContractDTO updatedContractDTO = contractService.updateContract(UUID.fromString(id), contractDTO);
        return ResponseEntity.ok(updatedContractDTO);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir contrato", description = "Exclui um contrato")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Contrato excluÃ­do com sucesso"),
        @ApiResponse(responseCode = "404", description = "Contrato nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteContract(
            @Parameter(description = "ID do contrato") @PathVariable("id") String id) {
        contractService.deleteContract(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Listar contratos por status", description = "Retorna contratos filtrados por status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ContractDTO>> getContractsByStatus(
            @Parameter(description = "Status do contrato") @PathVariable("status") ContractStatus status,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<Contract> contracts = contractService.findByStatus(status, pageable);
        Page<ContractDTO> contractDTOs = contractService.convertToDTOPage(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar contratos por cliente", description = "Retorna contratos de um cliente especÃ­fico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ContractDTO>> getContractsByClient(
            @Parameter(description = "ID do cliente") @PathVariable("clientId") java.util.UUID clientId,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<Contract> contracts = contractService.findByClient(clientId, pageable);
        Page<ContractDTO> contractDTOs = contractService.convertToDTOPage(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar contratos com filtros", description = "Retorna contratos com filtros combinados")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos encontrados"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ContractDTO>> searchContracts(
            @Parameter(description = "ID do cliente") @RequestParam(value = "clientId", required = false) java.util.UUID clientId,
            @Parameter(description = "Status do contrato") @RequestParam(value = "status", required = false) ContractStatus status,
            @Parameter(description = "Termo de busca") @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<Contract> contracts = contractService.findByFilters(clientId, status, searchTerm, pageable);
        Page<ContractDTO> contractDTOs = contractService.convertToDTOPage(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    @GetMapping("/expiring")
    @Operation(summary = "Listar contratos vencendo", description = "Retorna contratos que vencem em um perÃ­odo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<ContractDTO>> getExpiringContracts(
            @Parameter(description = "Data inicial") @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data final") @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Contract> contracts = contractService.findContractsExpiringBetween(startDate, endDate);
        List<ContractDTO> contractDTOs = contractService.convertToDTOList(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do contrato", description = "Atualiza apenas o status de um contrato")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Contrato nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ContractDTO> updateContractStatus(
            @Parameter(description = "ID do contrato") @PathVariable("id") String id,
            @Parameter(description = "Novo status") @RequestParam(value = "status") ContractStatus status) {
        Contract contract = contractService.updateStatus(UUID.fromString(id), status);
        ContractDTO contractDTO = contractService.convertToDTO(contract);
        return ResponseEntity.ok(contractDTO);
    }
    
    @GetMapping("/stats/count")
    @Operation(summary = "EstatÃ­sticas de contratos", description = "Retorna contadores de contratos por status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "EstatÃ­sticas retornadas com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ContractStats> getContractStats() {
        long activeCount = contractService.countByStatus(ContractStatus.ACTIVE);
        long inactiveCount = contractService.countByStatus(ContractStatus.INACTIVE);
        long expiredCount = contractService.countByStatus(ContractStatus.EXPIRED);
        long suspendedCount = contractService.countByStatus(ContractStatus.SUSPENDED);
        long pendingCount = contractService.countByStatus(ContractStatus.PENDING);
        long cancelledCount = contractService.countByStatus(ContractStatus.CANCELLED);
        
        ContractStats stats = new ContractStats(activeCount, inactiveCount, expiredCount, 
                                              suspendedCount, pendingCount, cancelledCount);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os contratos (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todos os contratos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contratos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<ContractDTO>> getAllContractsNoPagination() {
        List<Contract> contracts = contractService.findAll();
        List<ContractDTO> contractDTOs = contractService.convertToDTOList(contracts);
        return ResponseEntity.ok(contractDTOs);
    }
    
    // Classe interna para estatÃ­sticas
    public static class ContractStats {
        private final long active;
        private final long inactive;
        private final long expired;
        private final long suspended;
        private final long pending;
        private final long cancelled;
        
        public ContractStats(long active, long inactive, long expired, 
                           long suspended, long pending, long cancelled) {
            this.active = active;
            this.inactive = inactive;
            this.expired = expired;
            this.suspended = suspended;
            this.pending = pending;
            this.cancelled = cancelled;
        }
        
        // Getters
        public long getActive() { return active; }
        public long getInactive() { return inactive; }
        public long getExpired() { return expired; }
        public long getSuspended() { return suspended; }
        public long getPending() { return pending; }
        public long getCancelled() { return cancelled; }
    }
} 
