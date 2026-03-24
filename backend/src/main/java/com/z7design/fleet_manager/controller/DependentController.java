package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.dto.DependentDTO;
import com.z7design.fleet_manager.service.DependentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/dependents")
@RequiredArgsConstructor
@Tag(name = "Dependentes", description = "Endpoints para gestÃ£o de dependentes de funcionÃ¡rios")
public class DependentController {
    
    private final DependentService dependentService;
    
    @PostMapping
    @Operation(
        summary = "Criar novo dependente",
        description = "Cria um novo dependente associado a um funcionÃ¡rio"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Dependente criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
        @ApiResponse(responseCode = "409", description = "CPF jÃ¡ cadastrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<DependentDTO> create(
            @Valid @RequestBody DependentDTO.CreateRequest request) {
        try {
            log.info("Criando dependente para funcionÃ¡rio ID: {}", request.getEmployeeId());
            DependentDTO dependent = dependentService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(dependent);
        } catch (Exception e) {
            log.error("Erro ao criar dependente", e);
            throw e;
        }
    }
    
    @GetMapping
    @Operation(
        summary = "Listar todos os dependentes",
        description = "Retorna lista de todos os dependentes cadastrados"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dependentes retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    // PermissÃµes controladas pelo SecurityConfig
    public ResponseEntity<List<DependentDTO>> findAll() {
        try {
            log.info("Listando todos os dependentes");
            List<DependentDTO> dependents = dependentService.findAll();
            return ResponseEntity.ok(dependents);
        } catch (Exception e) {
            log.error("Erro ao listar dependentes", e);
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(
        summary = "Buscar dependente por ID",
        description = "Retorna dados de um dependente especÃ­fico"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dependente encontrado"),
        @ApiResponse(responseCode = "404", description = "Dependente nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<DependentDTO> findById(
            @Parameter(description = "ID do dependente") @PathVariable UUID id) {
        try {
            log.info("Buscando dependente ID: {}", id);
            DependentDTO dependent = dependentService.findById(id);
            return ResponseEntity.ok(dependent);
        } catch (Exception e) {
            log.error("Erro ao buscar dependente ID: {}", id, e);
            throw e;
        }
    }
    
    @GetMapping("/employee/{employeeId}")
    @Operation(
        summary = "Buscar dependentes por funcionÃ¡rio",
        description = "Retorna lista de dependentes de um funcionÃ¡rio especÃ­fico"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dependentes retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    // PermissÃµes controladas pelo SecurityConfig
    public ResponseEntity<List<DependentDTO>> findByEmployeeId(
            @Parameter(description = "ID do funcionÃ¡rio") @PathVariable UUID employeeId) {
        try {
            log.info("Buscando dependentes do funcionÃ¡rio ID: {}", employeeId);
            
            // Validar UUID - se for o UUID padrÃ£o/invÃ¡lido, retornar lista vazia
            if (employeeId == null || employeeId.toString().equals("00000000-0000-0000-0000-000000000001") || 
                employeeId.toString().equals("00000000-0000-0000-0000-000000000000")) {
                log.warn("UUID invÃ¡lido ou padrÃ£o recebido: {}", employeeId);
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }
            
            List<DependentDTO> dependents = dependentService.findByEmployeeId(employeeId);
            return ResponseEntity.ok(dependents);
        } catch (Exception e) {
            log.error("Erro ao buscar dependentes do funcionÃ¡rio ID: {}", employeeId, e);
            throw e;
        }
    }
    
    @GetMapping("/cpf/{cpf}")
    @Operation(
        summary = "Buscar dependente por CPF",
        description = "Retorna lista de dependentes com CPF especÃ­fico"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dependentes retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<List<DependentDTO>> findByCpf(
            @Parameter(description = "CPF do dependente") @PathVariable String cpf) {
        try {
            log.info("Buscando dependente por CPF: {}", cpf);
            List<DependentDTO> dependents = dependentService.findByCpf(cpf);
            return ResponseEntity.ok(dependents);
        } catch (Exception e) {
            log.error("Erro ao buscar dependente por CPF: {}", cpf, e);
            throw e;
        }
    }
    
    @GetMapping("/relationship/{relationship}")
    @Operation(
        summary = "Buscar dependentes por relacionamento",
        description = "Retorna lista de dependentes com relacionamento especÃ­fico (filho, cÃ´njuge, etc)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de dependentes retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<List<DependentDTO>> findByRelationship(
            @Parameter(description = "Tipo de relacionamento") @PathVariable String relationship) {
        try {
            log.info("Buscando dependentes por relacionamento: {}", relationship);
            List<DependentDTO> dependents = dependentService.findByRelationship(relationship);
            return ResponseEntity.ok(dependents);
        } catch (Exception e) {
            log.error("Erro ao buscar dependentes por relacionamento: {}", relationship, e);
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(
        summary = "Atualizar dependente",
        description = "Atualiza os dados de um dependente existente"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dependente atualizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "404", description = "Dependente nÃ£o encontrado"),
        @ApiResponse(responseCode = "409", description = "CPF jÃ¡ cadastrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<DependentDTO> update(
            @Parameter(description = "ID do dependente") @PathVariable UUID id,
            @Valid @RequestBody DependentDTO.UpdateRequest request) {
        try {
            log.info("Atualizando dependente ID: {}", id);
            DependentDTO dependent = dependentService.update(id, request);
            return ResponseEntity.ok(dependent);
        } catch (Exception e) {
            log.error("Erro ao atualizar dependente ID: {}", id, e);
            throw e;
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Excluir dependente",
        description = "Remove um dependente do sistema"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Dependente excluÃ­do com sucesso"),
        @ApiResponse(responseCode = "404", description = "Dependente nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID do dependente") @PathVariable UUID id) {
        try {
            log.info("Excluindo dependente ID: {}", id);
            dependentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir dependente ID: {}", id, e);
            throw e;
        }
    }
}

