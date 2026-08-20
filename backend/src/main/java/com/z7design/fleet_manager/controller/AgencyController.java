package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.AgencyDTO;
import com.z7design.fleet_manager.model.Agency;
import com.z7design.fleet_manager.service.AgencyService;
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
@Tag(name = "AgÃªncias", description = "Endpoints para gestÃ£o de agÃªncias bancÃ¡rias")
public class AgencyController {
    
    private final AgencyService agencyService;
    
    // ===== CRUD OPERATIONS =====
    
    @GetMapping
    @Operation(summary = "Listar agÃªncias", description = "Retorna uma lista paginada de agÃªncias")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de agÃªncias retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<AgencyDTO>> getAllAgencies(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        log.info("GET /api/agencies - Buscando agÃªncias com paginaÃ§Ã£o");
        return ResponseEntity.ok(agencyService.getAllAgencies(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as agÃªncias", description = "Retorna uma lista completa de agÃªncias")
    public ResponseEntity<List<AgencyDTO>> getAllAgenciesWithoutPagination() {
        log.info("GET /api/agencies/all - Buscando todas as agÃªncias");
        return ResponseEntity.ok(agencyService.getAllAgencies());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar agÃªncia por ID", description = "Retorna uma agÃªncia especÃ­fica pelo seu ID")
    public ResponseEntity<AgencyDTO> getAgencyById(@PathVariable("id") UUID id) {
        log.info("GET /api/agencies/{} - Buscando agÃªncia por ID", id);
        return ResponseEntity.ok(agencyService.getAgencyById(id));
    }
    
    @GetMapping("/bank/{bankId}")
    @Operation(summary = "Buscar agÃªncias por banco", description = "Retorna todas as agÃªncias de um banco especÃ­fico")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByBankId(@PathVariable("bankId") UUID bankId) {
        log.info("GET /api/agencies/bank/{} - Buscando agÃªncias por banco", bankId);
        return ResponseEntity.ok(agencyService.getAgenciesByBankId(bankId));
    }
    
    @PostMapping
    @Operation(summary = "Criar agÃªncia", description = "Cria uma nova agÃªncia")
    public ResponseEntity<AgencyDTO> createAgency(@RequestBody AgencyDTO dto) {
        log.info("POST /api/agencies - Criando agÃªncia: {}", dto.getName());
        return ResponseEntity.ok(agencyService.createAgency(dto));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar agÃªncia", description = "Atualiza uma agÃªncia existente")
    public ResponseEntity<AgencyDTO> updateAgency(@PathVariable("id") UUID id, @RequestBody AgencyDTO dto) {
        log.info("PUT /api/agencies/{} - Atualizando agÃªncia", id);
        return ResponseEntity.ok(agencyService.updateAgency(id, dto));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Remover agÃªncia", description = "Remove uma agÃªncia")
    public ResponseEntity<Void> deleteAgency(@PathVariable("id") UUID id) {
        log.info("DELETE /api/agencies/{} - Removendo agÃªncia", id);
        agencyService.deleteAgency(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== SEARCH OPERATIONS =====
    
    @GetMapping("/search/name")
    @Operation(summary = "Buscar agÃªncias por nome", description = "Retorna agÃªncias que contenham o nome especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByName(@RequestParam(value = "name") String name) {
        log.info("GET /api/agencies/search/name?name={} - Buscando agÃªncias por nome", name);
        return ResponseEntity.ok(agencyService.searchAgenciesByName(name));
    }
    
    @GetMapping("/search/code")
    @Operation(summary = "Buscar agÃªncias por cÃ³digo", description = "Retorna agÃªncias que contenham o cÃ³digo especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByCode(@RequestParam(value = "code") String code) {
        log.info("GET /api/agencies/search/code?code={} - Buscando agÃªncias por cÃ³digo", code);
        return ResponseEntity.ok(agencyService.searchAgenciesByCode(code));
    }
    
    @GetMapping("/search/bank")
    @Operation(summary = "Buscar agÃªncias por nome do banco", description = "Retorna agÃªncias de bancos que contenham o nome especificado")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByBankName(@RequestParam(value = "bankName") String bankName) {
        log.info("GET /api/agencies/search/bank?bankName={} - Buscando agÃªncias por nome do banco", bankName);
        return ResponseEntity.ok(agencyService.searchAgenciesByBankName(bankName));
    }
    
    @GetMapping("/search/city")
    @Operation(summary = "Buscar agÃªncias por cidade", description = "Retorna agÃªncias da cidade especificada")
    public ResponseEntity<List<AgencyDTO>> searchAgenciesByCity(@RequestParam(value = "city") String city) {
        log.info("GET /api/agencies/search/city?city={} - Buscando agÃªncias por cidade", city);
        return ResponseEntity.ok(agencyService.searchAgenciesByCity(city));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar agÃªncias por status", description = "Retorna agÃªncias com o status especificado")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByStatus(@PathVariable("status") Agency.AgencyStatus status) {
        log.info("GET /api/agencies/status/{} - Buscando agÃªncias por status", status);
        return ResponseEntity.ok(agencyService.getAgenciesByStatus(status));
    }
    
    @GetMapping("/state/{state}")
    @Operation(summary = "Buscar agÃªncias por estado", description = "Retorna agÃªncias do estado especificado")
    public ResponseEntity<List<AgencyDTO>> getAgenciesByState(@PathVariable("state") String state) {
        log.info("GET /api/agencies/state/{} - Buscando agÃªncias por estado", state);
        return ResponseEntity.ok(agencyService.getAgenciesByState(state));
    }
    
    // ===== STATISTICS =====
    
    @GetMapping("/statistics")
    @Operation(summary = "EstatÃ­sticas de agÃªncias", description = "Retorna estatÃ­sticas das agÃªncias")
    public ResponseEntity<Object> getAgencyStatistics() {
        log.info("GET /api/agencies/statistics - Buscando estatÃ­sticas de agÃªncias");
        
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

