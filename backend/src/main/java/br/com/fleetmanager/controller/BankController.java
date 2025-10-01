package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.BankService;

import br.com.fleetmanager.dto.BankDTO;
import br.com.fleetmanager.model.Bank;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Bancos", description = "Endpoints para gestão de bancos")
public class BankController {
    
    private final BankService bankService;
    
    // ===== CRUD OPERATIONS =====
    
    @GetMapping
    @Operation(summary = "Listar bancos", description = "Retorna uma lista paginada de bancos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de bancos retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<BankDTO>> getAllBanks(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        log.info("GET /api/banks - Buscando bancos com paginação");
        return ResponseEntity.ok(bankService.getAllBanks(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os bancos", description = "Retorna uma lista completa de bancos")
    public ResponseEntity<List<BankDTO>> getAllBanksWithoutPagination() {
        log.info("GET /api/banks/all - Buscando todos os bancos");
        return ResponseEntity.ok(bankService.getAllBanks());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar banco por ID", description = "Retorna um banco específico pelo seu ID")
    public ResponseEntity<BankDTO> getBankById(@PathVariable UUID id) {
        log.info("GET /api/banks/{} - Buscando banco por ID", id);
        return ResponseEntity.ok(bankService.getBankById(id));
    }
    
    @GetMapping("/code/{code}")
    @Operation(summary = "Buscar banco por código", description = "Retorna um banco específico pelo seu código")
    public ResponseEntity<BankDTO> getBankByCode(@PathVariable String code) {
        log.info("GET /api/banks/code/{} - Buscando banco por código", code);
        return ResponseEntity.ok(bankService.getBankByCode(code));
    }
    
    @PostMapping
    @Operation(summary = "Criar banco", description = "Cria um novo banco")
    public ResponseEntity<BankDTO> createBank(@RequestBody BankDTO dto) {
        log.info("POST /api/banks - Criando banco: {}", dto.getName());
        return ResponseEntity.ok(bankService.createBank(dto));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar banco", description = "Atualiza um banco existente")
    public ResponseEntity<BankDTO> updateBank(@PathVariable UUID id, @RequestBody BankDTO dto) {
        log.info("PUT /api/banks/{} - Atualizando banco", id);
        return ResponseEntity.ok(bankService.updateBank(id, dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Remover banco", description = "Remove um banco")
    public ResponseEntity<Void> deleteBank(@PathVariable UUID id) {
        log.info("DELETE /api/banks/{} - Removendo banco", id);
        bankService.deleteBank(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== SEARCH OPERATIONS =====
    
    @GetMapping("/search/name")
    @Operation(summary = "Buscar bancos por nome", description = "Retorna bancos que contenham o nome especificado")
    public ResponseEntity<List<BankDTO>> searchBanksByName(@RequestParam String name) {
        log.info("GET /api/banks/search/name?name={} - Buscando bancos por nome", name);
        return ResponseEntity.ok(bankService.searchBanksByName(name));
    }
    
    @GetMapping("/search/code")
    @Operation(summary = "Buscar bancos por código", description = "Retorna bancos que contenham o código especificado")
    public ResponseEntity<List<BankDTO>> searchBanksByCode(@RequestParam String code) {
        log.info("GET /api/banks/search/code?code={} - Buscando bancos por código", code);
        return ResponseEntity.ok(bankService.searchBanksByCode(code));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar bancos por status", description = "Retorna bancos com o status especificado")
    public ResponseEntity<List<BankDTO>> getBanksByStatus(@PathVariable Bank.BankStatus status) {
        log.info("GET /api/banks/status/{} - Buscando bancos por status", status);
        return ResponseEntity.ok(bankService.getBanksByStatus(status));
    }
    
    @GetMapping("/state/{state}")
    @Operation(summary = "Buscar bancos por estado", description = "Retorna bancos do estado especificado")
    public ResponseEntity<List<BankDTO>> getBanksByState(@PathVariable String state) {
        log.info("GET /api/banks/state/{} - Buscando bancos por estado", state);
        return ResponseEntity.ok(bankService.getBanksByState(state));
    }
    
    // ===== STATISTICS =====
    
    @GetMapping("/statistics")
    @Operation(summary = "Estatísticas de bancos", description = "Retorna estatísticas dos bancos")
    public ResponseEntity<Object> getBankStatistics() {
        log.info("GET /api/banks/statistics - Buscando estatísticas de bancos");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalBanks = bankService.getTotalBanksCount();
            public final Long activeBanks = bankService.getBanksCountByStatus(Bank.BankStatus.ACTIVE);
            public final Long inactiveBanks = bankService.getBanksCountByStatus(Bank.BankStatus.INACTIVE);
            public final Long suspendedBanks = bankService.getBanksCountByStatus(Bank.BankStatus.SUSPENDED);
            public final List<String> states = bankService.getDistinctStates();
        });
    }
}
