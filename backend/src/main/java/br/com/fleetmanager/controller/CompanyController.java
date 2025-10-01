package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.CompanyService;

import br.com.fleetmanager.dto.CompanyDTO;
import br.com.fleetmanager.model.Company;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Empresas", description = "Endpoints para gerenciamento de empresas")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "Listar todas as empresas", description = "Retorna todas as empresas cadastradas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas listadas com sucesso",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getAllCompanies() {
        log.info("GET /api/companies - Listando todas as empresas");
        List<CompanyDTO> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar empresa por ID", description = "Retorna uma empresa específica pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa encontrada",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> getCompanyById(@PathVariable UUID id) {
        log.info("GET /api/companies/{} - Buscando empresa por ID", id);
        CompanyDTO company = companyService.getCompanyById(id);
        return ResponseEntity.ok(company);
    }

    @GetMapping("/cnpj/{cnpj}")
    @Operation(summary = "Buscar empresa por CNPJ", description = "Retorna uma empresa específica pelo CNPJ")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa encontrada",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> getCompanyByCnpj(@PathVariable String cnpj) {
        log.info("GET /api/companies/cnpj/{} - Buscando empresa por CNPJ", cnpj);
        CompanyDTO company = companyService.getCompanyByCnpj(cnpj);
        return ResponseEntity.ok(company);
    }

    @PostMapping
    @Operation(summary = "Criar nova empresa", description = "Cria uma nova empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Empresa criada com sucesso",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> createCompany(@Valid @RequestBody CompanyDTO companyDTO) {
        log.info("POST /api/companies - Criando nova empresa: {}", companyDTO.getName());
        
        // Obter currentUserId do contexto de segurança
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UUID currentUserId = null;
        
        // Se não conseguir obter o ID do usuário, usar null (será tratado no service)
        try {
            // Aqui você pode implementar a lógica para obter o ID do usuário pelo username
            // Por enquanto, vamos deixar como null para evitar o erro de foreign key
            currentUserId = null;
        } catch (Exception e) {
            log.warn("Não foi possível obter o ID do usuário autenticado: {}", e.getMessage());
            currentUserId = null;
        }
        
        CompanyDTO createdCompany = companyService.createCompany(companyDTO, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCompany);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar empresa", description = "Atualiza uma empresa existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresa atualizada com sucesso",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CompanyDTO> updateCompany(@PathVariable UUID id, @Valid @RequestBody CompanyDTO companyDTO) {
        log.info("PUT /api/companies/{} - Atualizando empresa", id);
        
        // Obter currentUserId do contexto de segurança
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UUID currentUserId = null;
        
        // Se não conseguir obter o ID do usuário, usar null (será tratado no service)
        try {
            // Aqui você pode implementar a lógica para obter o ID do usuário pelo username
            // Por enquanto, vamos deixar como null para evitar o erro de foreign key
            currentUserId = null;
        } catch (Exception e) {
            log.warn("Não foi possível obter o ID do usuário autenticado: {}", e.getMessage());
            currentUserId = null;
        }
        
        CompanyDTO updatedCompany = companyService.updateCompany(id, companyDTO, currentUserId);
        return ResponseEntity.ok(updatedCompany);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar empresa", description = "Remove uma empresa do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Empresa deletada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Empresa não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteCompany(@PathVariable UUID id) {
        log.info("DELETE /api/companies/{} - Deletando empresa", id);
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar empresas por status", description = "Retorna empresas filtradas por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesByStatus(@PathVariable Company.CompanyStatus status) {
        log.info("GET /api/companies/status/{} - Buscando empresas por status", status);
        List<CompanyDTO> companies = companyService.getCompaniesByStatus(status);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/city/{city}")
    @Operation(summary = "Buscar empresas por cidade", description = "Retorna empresas filtradas por cidade")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesByCity(@PathVariable String city) {
        log.info("GET /api/companies/city/{} - Buscando empresas por cidade", city);
        List<CompanyDTO> companies = companyService.getCompaniesByCity(city);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/state/{state}")
    @Operation(summary = "Buscar empresas por estado", description = "Retorna empresas filtradas por estado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesByState(@PathVariable String state) {
        log.info("GET /api/companies/state/{} - Buscando empresas por estado", state);
        List<CompanyDTO> companies = companyService.getCompaniesByState(state);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/sector/{sector}")
    @Operation(summary = "Buscar empresas por setor", description = "Retorna empresas filtradas por setor")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesBySector(@PathVariable String sector) {
        log.info("GET /api/companies/sector/{} - Buscando empresas por setor", sector);
        List<CompanyDTO> companies = companyService.getCompaniesBySector(sector);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar empresas por tipo", description = "Retorna empresas filtradas por tipo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesByType(@PathVariable String type) {
        log.info("GET /api/companies/type/{} - Buscando empresas por tipo", type);
        List<CompanyDTO> companies = companyService.getCompaniesByType(type);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/size/{size}")
    @Operation(summary = "Buscar empresas por tamanho", description = "Retorna empresas filtradas por tamanho")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> getCompaniesBySize(@PathVariable String size) {
        log.info("GET /api/companies/size/{} - Buscando empresas por tamanho", size);
        List<CompanyDTO> companies = companyService.getCompaniesBySize(size);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar empresas por termo", description = "Busca empresas por termo de pesquisa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<CompanyDTO>> searchCompanies(@RequestParam String searchTerm) {
        log.info("GET /api/companies/search?searchTerm={} - Buscando empresas por termo", searchTerm);
        List<CompanyDTO> companies = companyService.searchCompanies(searchTerm);
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/advanced-filters")
    @Operation(summary = "Busca avançada de empresas", description = "Busca empresas com múltiplos filtros")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Empresas encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<CompanyDTO>> getCompaniesByAdvancedFilters(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cnpj,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) Company.CompanyStatus status,
            @RequestParam(required = false) String type,
            Pageable pageable) {
        log.info("GET /api/companies/advanced-filters - Busca avançada de empresas");
        Page<CompanyDTO> companies = companyService.getCompaniesByAdvancedFilters(
                name, cnpj, city, state, sector, status, type, pageable);
        return ResponseEntity.ok(companies);
    }

    // Endpoints de estatísticas
    @GetMapping("/stats/active-count")
    @Operation(summary = "Contar empresas ativas", description = "Retorna o número de empresas ativas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getActiveCompaniesCount() {
        log.info("GET /api/companies/stats/active-count - Contando empresas ativas");
        long count = companyService.getActiveCompaniesCount();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/status-count/{status}")
    @Operation(summary = "Contar empresas por status", description = "Retorna o número de empresas por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getCompaniesCountByStatus(@PathVariable Company.CompanyStatus status) {
        log.info("GET /api/companies/stats/status-count/{} - Contando empresas por status", status);
        long count = companyService.getCompaniesCountByStatus(status);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/state-count/{state}")
    @Operation(summary = "Contar empresas por estado", description = "Retorna o número de empresas por estado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getCompaniesCountByState(@PathVariable String state) {
        log.info("GET /api/companies/stats/state-count/{} - Contando empresas por estado", state);
        long count = companyService.getCompaniesCountByState(state);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/sector-count/{sector}")
    @Operation(summary = "Contar empresas por setor", description = "Retorna o número de empresas por setor")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getCompaniesCountBySector(@PathVariable String sector) {
        log.info("GET /api/companies/stats/sector-count/{} - Contando empresas por setor", sector);
        long count = companyService.getCompaniesCountBySector(sector);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/type-count/{type}")
    @Operation(summary = "Contar empresas por tipo", description = "Retorna o número de empresas por tipo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getCompaniesCountByType(@PathVariable String type) {
        log.info("GET /api/companies/stats/type-count/{} - Contando empresas por tipo", type);
        long count = companyService.getCompaniesCountByType(type);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/size-count/{size}")
    @Operation(summary = "Contar empresas por tamanho", description = "Retorna o número de empresas por tamanho")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> getCompaniesCountBySize(@PathVariable String size) {
        log.info("GET /api/companies/stats/size-count/{} - Contando empresas por tamanho", size);
        long count = companyService.getCompaniesCountBySize(size);
        return ResponseEntity.ok(count);
    }
} 