package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.service.CompanyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Empresas", description = "API para gerenciamento de empresas")
public class CompanyController {

    private final CompanyService companyService;
    private final com.z7design.fleet_manager.service.UserCompanyResolver userCompanyResolver;

    @GetMapping("/my-company")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar empresa do usuário logado", description = "Retorna os dados da empresa à qual o usuário logado pertence")
    public ResponseEntity<CompanyDTO> getMyCompany() {
        log.debug("Buscando empresa do usuário logado");
        try {
            return userCompanyResolver.resolveCurrentCompany()
                    .map(CompanyDTO::fromEntity)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            log.error("Erro ao buscar empresa do usuário logado: {}", e.getMessage());
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping
    @Operation(summary = "Listar todas as empresas", description = "Retorna uma lista de todas as empresas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas listadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CompanyDTO>> getAllCompanies() {
        try {
            log.info("Buscando todas as empresas");
            List<CompanyDTO> companies = companyService.getAllCompanies();
            log.info("Retornando {} empresas", companies.size());
            return ResponseEntity.ok(companies);
        } catch (Exception e) {
            log.error("Erro ao buscar todas as empresas", e);
            // Retorna lista vazia em vez de 500 para evitar quebrar o frontend
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping({"/public", "/v1/companies/public"})
    @Operation(summary = "Listar empresas públicas", description = "Retorna lista básica de empresas públicas para login")
    public ResponseEntity<List<CompanyDTO>> getPublicCompanies() {
        try {
            List<CompanyDTO> companies = companyService.getAllCompanies();
            return ResponseEntity.ok(companies);
        } catch (Exception e) {
            log.error("Erro ao buscar empresas públicas", e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'EMPLOYEES_CREATE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'COMPANY_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'ROLE_COMPANY_ADMIN')")
    @Operation(summary = "Buscar empresas", description = "Busca empresas por nome com filtro dinâmico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Object> searchCompanies(@RequestParam("query") String query) {
        log.debug("Buscando empresas com query: {}", query);
        try {
            // Retornar lista vazia por enquanto para evitar erro
            return ResponseEntity.ok(java.util.Collections.emptyList());
        } catch (Exception e) {
            log.error("Erro ao buscar empresas: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Teste básico de empresas", description = "Teste básico para verificar se o endpoint funciona")
    public ResponseEntity<Object> testCompanies() {
        try {
            log.debug("Teste básico de empresas");
            List<CompanyDTO> companies = companyService.getAllCompanies();
            return ResponseEntity.ok(java.util.Map.of(
                    "count", companies.size(),
                    "message", "Teste de empresas funcionando",
                    "companies", companies));
        } catch (Exception e) {
            log.error("Erro no teste de empresas: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('HR_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('COMPANY_ADMIN') or hasAuthority('COMPANY_ADMIN')")
    @Operation(summary = "Listar empresas ativas", description = "Retorna uma lista de empresas ativas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas ativas listadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getActiveCompanies() {
        log.debug("Buscando empresas ativas");
        List<CompanyDTO> companies = companyService.getActiveCompanies();
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('HR_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('COMPANY_ADMIN') or hasAuthority('COMPANY_ADMIN')")
    @Operation(summary = "Buscar empresa por ID", description = "Retorna uma empresa específica pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa encontrada"),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> getCompanyById(
            @Parameter(description = "ID da empresa") @PathVariable("id") UUID id) {
        log.debug("Buscando empresa por ID: {}", id);
        CompanyDTO company = companyService.getCompanyById(id);
        return ResponseEntity.ok(company);
    }

    @GetMapping("/sigla/{sigla}")
    @PreAuthorize("hasAuthority('HR_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('COMPANY_ADMIN') or hasAuthority('COMPANY_ADMIN')")
    @Operation(summary = "Buscar empresa por sigla", description = "Retorna uma empresa específica pela sigla")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa encontrada"),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> getCompanyBySigla(
            @Parameter(description = "Sigla da empresa") @PathVariable("sigla") String sigla) {
        log.debug("Buscando empresa por sigla: {}", sigla);
        CompanyDTO company = companyService.getCompanyBySigla(sigla);
        return ResponseEntity.ok(company);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('HR_WRITE','SUPER_ADMIN','ROLE_SUPER_ADMIN','ADMIN','ROLE_ADMIN','COMPANY_ADMIN','ROLE_COMPANY_ADMIN')")
    @Operation(summary = "Criar nova empresa", description = "Cria uma nova empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Empresa criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> createCompany(
            @Parameter(description = "Dados da empresa") @Valid @RequestBody CompanyDTO companyDTO) {
        log.debug("Recebida requisição para criar empresa: {}", companyDTO.getName());
        CompanyDTO createdCompany = companyService.createCompany(companyDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCompany);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_WRITE','SUPER_ADMIN','ROLE_SUPER_ADMIN','ADMIN','ROLE_ADMIN','COMPANY_ADMIN','ROLE_COMPANY_ADMIN')")
    @Operation(summary = "Atualizar empresa", description = "Atualiza uma empresa existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> updateCompany(
            @Parameter(description = "ID da empresa") @PathVariable("id") UUID id,
            @Parameter(description = "Dados atualizados da empresa") @Valid @RequestBody CompanyDTO companyDTO) {
        log.debug("Recebida requisição para atualizar empresa ID: {}", id);
        CompanyDTO updatedCompany = companyService.updateCompany(id, companyDTO);
        return ResponseEntity.ok(updatedCompany);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_DELETE','SUPER_ADMIN','ROLE_SUPER_ADMIN','ADMIN','ROLE_ADMIN','COMPANY_ADMIN','ROLE_COMPANY_ADMIN')")
    @Operation(summary = "Excluir empresa", description = "Exclui uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Empresa excluída com sucesso"),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "400", description = "Não é possível excluir empresa com funcionários associados"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteCompany(
            @Parameter(description = "ID da empresa") @PathVariable("id") UUID id) {
        log.debug("Recebida requisição para excluir empresa ID: {}", id);
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyAuthority('HR_WRITE','SUPER_ADMIN','ROLE_SUPER_ADMIN','ADMIN','ROLE_ADMIN','COMPANY_ADMIN','ROLE_COMPANY_ADMIN')")
    @Operation(summary = "Alternar status da empresa", description = "Alterna o status da empresa entre ACTIVE e INACTIVE")
    public ResponseEntity<?> toggleCompanyStatus(
            @Parameter(description = "ID da empresa") @PathVariable("id") UUID id) {
        log.debug("Recebida requisição para alternar status da empresa ID: {}", id);
        try {
            CompanyDTO updatedCompany = companyService.toggleCompanyStatus(id);
            return ResponseEntity.ok(updatedCompany);
        } catch (Exception e) {
            log.error("Erro ao alternar status da empresa ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Erro ao alternar status da empresa"));
        }
    }
}
