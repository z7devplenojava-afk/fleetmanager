package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.AgencyService;

import br.com.fleetmanager.dto.AgencyDTO;
import br.com.fleetmanager.model.Agency;
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
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Agências", description = "Endpoints para gestão de agências bancárias")
public class AgencyController {
    
    private final AgencyService agencyService;
    
    // ===== CRUD OPERATIONS =====
    
    @GetMapping
    @Operation(summary = "Listar agências", description = "Retorna uma lista paginada de agências")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de agências retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<AgencyDTO>> getAllAgencies(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        log.info("GET /api/agencies - Buscando agências com paginação");
        return ResponseEntity.ok(agencyService.getAllAgencies(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as agências", description = "Retorna uma lista completa de agências")
    public ResponseEntity<List<AgencyDTO>> getAllAgenciesWithoutPagination() {
        log.info("GET /api/agencies/all - Buscando todas as agências");
        return ResponseEntity.ok(agencyService.getAllAgencies());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar agência por ID", description = "Retorna uma agência específica pelo seu ID")
    public ResponseEntity<AgencyDTO> getAgencyById(@PathVariable UUID id) {
        log.info("GET /api/agencies/{} - Buscando agência por ID", id);
        return ResponseEntity.ok(agencyService.getAgencyById(id));
    }
    
    @GetMapping("/bank/{bankId}")
    @Operation(summary = "Buscar agências por banco", description = "Retorna todas as agências de um banco específico")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByBankId(@PathVariable UUID bankId) {
        log.info("GET /api/agencies/bank/{} - Buscando agências por banco", bankId);
        return ResponseEntity.ok(agencyService.getAgenciesByBankId(bankId));
    }
    
    @PostMapping
    @Operation(summary = "Criar agência", description = "Cria uma nova agência")
    public ResponseEntity<AgencyDTO> createAgency(@RequestBody AgencyDTO dto) {
        log.info("POST /api/agencies - Criando agência: {}", dto.getName());
        return ResponseEntity.ok(agencyService.createAgency(dto));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar agência", description = "Atualiza uma agência existente")
    public ResponseEntity<AgencyDTO> updateAgency(@PathVariable UUID id, @RequestBody AgencyDTO dto) {
        log.info("PUT /api/agencies/{} - Atualizando agência", id);
        return ResponseEntity.ok(agencyService.updateAgency(id, dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Remover agência", description = "Remove uma agência")
    public ResponseEntity<Void> deleteAgency(@PathVariable UUID id) {
        log.info("DELETE /api/agencies/{} - Removendo agência", id);
        agencyService.deleteAgency(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== SEARCH OPERATIONS =====
    
    @GetMapping("/search/name")
    @Operation(summary = "Buscar agências por nome", description = "Retorna agências que contenham o nome especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByName(@RequestParam String name) {
        log.info("GET /api/agencies/search/name?name={} - Buscando agências por nome", name);
        return ResponseEntity.ok(agencyService.searchAgenciesByName(name));
    }
    
    @GetMapping("/search/code")
    @Operation(summary = "Buscar agências por código", description = "Retorna agências que contenham o código especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByCode(@RequestParam String code) {
        log.info("GET /api/agencies/search/code?code={} - Buscando agências por código", code);
        return ResponseEntity.ok(agencyService.searchAgenciesByCode(code));
    }
    
    @GetMapping("/search/bank")
    @Operation(summary = "Buscar agências por nome do banco", description = "Retorna agências de bancos que contenham o nome especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByBankName(@RequestParam String bankName) {
        log.info("GET /api/agencies/search/bank?bankName={} - Buscando agências por nome do banco", bankName);
        return ResponseEntity.ok(agencyService.searchAgenciesByBankName(bankName));
    }
    
    @GetMapping("/search/city")
    @Operation(summary = "Buscar agências por cidade", description = "Retorna agências da cidade especificada")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByCity(@RequestParam String city) {
        log.info("GET /api/agencies/search/city?city={} - Buscando agências por cidade", city);
        return ResponseEntity.ok(agencyService.searchAgenciesByCity(city));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar agências por status", description = "Retorna agências com o status especificado")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByStatus(@PathVariable Agency.AgencyStatus status) {
        log.info("GET /api/agencies/status/{} - Buscando agências por status", status);
        return ResponseEntity.ok(agencyService.getAgenciesByStatus(status));
    }
    
    @GetMapping("/state/{state}")
    @Operation(summary = "Buscar agências por estado", description = "Retorna agências do estado especificado")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByState(@PathVariable String state) {
        log.info("GET /api/agencies/state/{} - Buscando agências por estado", state);
        return ResponseEntity.ok(agencyService.getAgenciesByState(state));
    }
    
    // ===== STATISTICS =====
    
    @GetMapping("/statistics")
    @Operation(summary = "Estatísticas de agências", description = "Retorna estatísticas das agências")
    public ResponseEntity<Object> getAgencyStatistics() {
        log.info("GET /api/agencies/statistics - Buscando estatísticas de agências");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalAgencies = agencyService.getTotalAgenciesCount();
            public final Long activeAgencies = agencyService.getAgenciesCountByStatus(Agency.AgencyStatus.ACTIVE);
            public final Long inactiveAgencies = agencyService.getAgenciesCountByStatus(Agency.AgencyStatus.INACTIVE);
            public final Long suspendedAgencies = agencyService.getAgenciesCountByStatus(Agency.AgencyStatus.SUSPENDED);
            public final Long maintenanceAgencies = agencyService.getAgenciesCountByStatus(Agency.AgencyStatus.MAINTENANCE);
            public final List<String> cities = agencyService.getDistinctCities();
            public final List<String> states = agencyService.getDistinctStates();
        });
    }
}
