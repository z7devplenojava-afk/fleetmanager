package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.WorkPostDTO;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.WorkPostStatus;
import com.z7design.fleet_manager.model.enums.WorkPostType;
import com.z7design.fleet_manager.service.WorkPostService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@RestController
@RequestMapping("/api/work-posts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Postos de Trabalho", description = "API para gerenciamento de postos de trabalho")
public class WorkPostController {
    
    private final WorkPostService workPostService;
    private final WorkPostRepository workPostRepository;
    
    @GetMapping
    @Operation(summary = "Listar postos de trabalho", description = "Retorna uma lista paginada de postos de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getAllWorkPosts(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        log.debug("Buscando postos de trabalho com paginaÃ§Ã£o");
        Page<WorkPost> workPosts = workPostService.findAll(pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'ROLE_RH', 'RH', 'OPERACIONAL', 'ROLE_OPERACIONAL', 'DEPARTAMENTO_PESSOAL', 'ROLE_DEPARTAMENTO_PESSOAL')")
    @Operation(summary = "Listar todos os postos de trabalho (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todos os postos de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> getAllWorkPostsNoPagination() {
        log.info("ðŸ” GET /api/work-posts/all - INÃCIO");
        java.util.ArrayList<WorkPostDTO> emptyList = new java.util.ArrayList<>();
        
        try {
            log.info("ðŸ” Tentando buscar postos via findAllAsDTO");
            List<WorkPostDTO> workPostDTOs = workPostService.findAllAsDTO();
            log.info("âœ… findAllAsDTO retornou: {} (null={})", workPostDTOs != null ? workPostDTOs.size() : "null", workPostDTOs == null);
            
            if (workPostDTOs == null) {
                log.warn("âš ï¸ findAllAsDTO retornou null");
                return ResponseEntity.ok(emptyList);
            }
            
            log.info("âœ… Retornando {} postos", workPostDTOs.size());
            return ResponseEntity.ok(workPostDTOs);
            
        } catch (org.springframework.security.access.AccessDeniedException e) {
            log.error("âŒ AccessDeniedException: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(emptyList);
        } catch (Throwable e) {
            log.error("âŒ ERRO CRÃTICO em /work-posts/all - Tipo: {} - Mensagem: {}", 
                    e.getClass().getName(), e.getMessage());
            log.error("âŒ Stack trace completo: ", e);
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                if (e.getCause().getCause() != null) {
                    log.error("âŒ Causa da causa: {}", e.getCause().getCause().getMessage());
                }
            }
            // Retornar lista vazia em qualquer caso
            return ResponseEntity.ok(emptyList);
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar posto por ID", description = "Retorna um posto especÃ­fico pelo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posto encontrado"),
        @ApiResponse(responseCode = "404", description = "Posto nÃ£o encontrado"),
        @ApiResponse(responseCode = "400", description = "ID invÃ¡lido"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> getWorkPostById(
            @Parameter(description = "ID do posto") @PathVariable("id") String id) {
        // Limpar espaÃ§os da URL (caso venha com espaÃ§o no final, ex: "all ")
        String cleanId = id != null ? id.trim() : "";
        
        // Se for "all" (com ou sem espaÃ§os), deve ter sido mapeado incorretamente
        // Retornar 404 em vez de tentar converter para UUID
        if ("all".equalsIgnoreCase(cleanId)) {
            log.warn("âš ï¸ Endpoint /all foi incorretamente mapeado para /{id}. Use /api/work-posts/all");
            throw new ResourceNotFoundException("Use o endpoint /api/work-posts/all para listar todos os postos");
        }
        
        // Validar se Ã© um UUID vÃ¡lido antes de processar
        UUID uuid;
        try {
            uuid = UUID.fromString(cleanId);
        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Tentativa de buscar posto com ID invÃ¡lido (nÃ£o Ã© UUID): '{}'", cleanId);
            throw new IllegalArgumentException("ID deve ser um UUID vÃ¡lido. Recebido: '" + cleanId + "'");
        }
        
        WorkPost workPost = workPostService.getById(uuid);
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @GetMapping("/code/{postCode}")
    @Operation(summary = "Buscar posto por cÃ³digo", description = "Retorna um posto especÃ­fico pelo cÃ³digo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posto encontrado"),
        @ApiResponse(responseCode = "404", description = "Posto nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> getWorkPostByCode(
            @Parameter(description = "CÃ³digo do posto") @PathVariable("postCode") String postCode) {
        WorkPost workPost = workPostService.findByPostCode(postCode)
                .orElseThrow(() -> new ResourceNotFoundException("Posto nÃ£o encontrado com cÃ³digo: " + postCode));
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @PostMapping
    @Operation(summary = "Criar posto de trabalho", description = "Cria um novo posto de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Posto criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> createWorkPost(
            @Parameter(description = "Dados do posto") @Valid @RequestBody WorkPostDTO workPostDTO) {
        WorkPost workPost = workPostService.createWorkPost(workPostDTO);
        WorkPostDTO createdWorkPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdWorkPostDTO);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar posto de trabalho", description = "Atualiza um posto existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posto atualizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "404", description = "Posto nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> updateWorkPost(
            @Parameter(description = "ID do posto") @PathVariable("id") String id,
            @Parameter(description = "Dados atualizados do posto") @Valid @RequestBody WorkPostDTO workPostDTO) {
        WorkPostDTO updatedWorkPostDTO = workPostService.updateWorkPost(UUID.fromString(id), workPostDTO);
        return ResponseEntity.ok(updatedWorkPostDTO);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir posto de trabalho", description = "Exclui um posto")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Posto excluÃ­do com sucesso"),
        @ApiResponse(responseCode = "404", description = "Posto nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteWorkPost(
            @Parameter(description = "ID do posto") @PathVariable("id") String id) {
        workPostService.deleteWorkPost(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Listar postos por status", description = "Retorna postos filtrados por status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByStatus(
            @Parameter(description = "Status do posto") @PathVariable("status") WorkPostStatus status,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByStatus(status, pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Listar postos por tipo", description = "Retorna postos filtrados por tipo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByType(
            @Parameter(description = "Tipo do posto") @PathVariable("type") WorkPostType type,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByType(type, pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    @Operation(summary = "Listar postos por cliente", description = "Retorna postos de um cliente especÃ­fico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByClient(
            @Parameter(description = "ID do cliente") @PathVariable("clientId") String clientId,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByClient(UUID.fromString(clientId), pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/client/{clientId}/all")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'OPERACIONAL', 'ROLE_OPERACIONAL')")
    @Operation(summary = "Listar todos os postos por cliente (sem paginaÃ§Ã£o)", description = "Retorna todos os postos de um cliente especÃ­fico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<WorkPostDTO>> getAllWorkPostsByClient(
            @Parameter(description = "ID do cliente") @PathVariable("clientId") String clientId) {
        List<WorkPost> workPosts = workPostService.findByClient(UUID.fromString(clientId));
        List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Listar postos por contrato", description = "Retorna postos de um contrato especÃ­fico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByContract(
            @Parameter(description = "ID do contrato") @PathVariable("contractId") String contractId,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByContract(UUID.fromString(contractId), pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar postos com filtros", description = "Retorna postos com filtros combinados")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos encontrados"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> searchWorkPosts(
            @Parameter(description = "ID do cliente") @RequestParam(value = "clientId", required = false) String clientId,
            @Parameter(description = "Status do posto") @RequestParam(value = "status", required = false) WorkPostStatus status,
            @Parameter(description = "Tipo do posto") @RequestParam(value = "type", required = false) WorkPostType type,
            @Parameter(description = "Termo de busca") @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByFilters(UUID.fromString(clientId), status, type, searchTerm, pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/implementation/period")
    @Operation(summary = "Listar postos para implantaÃ§Ã£o", description = "Retorna postos que serÃ£o implantados em um perÃ­odo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<WorkPostDTO>> getWorkPostsToBeImplemented(
            @Parameter(description = "Data inicial") @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data final") @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkPost> workPosts = workPostService.findPostsToBeImplementedBetween(startDate, endDate);
        List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do posto", description = "Atualiza apenas o status de um posto")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Posto nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> updateWorkPostStatus(
            @Parameter(description = "ID do posto") @PathVariable("id") String id,
            @Parameter(description = "Novo status") @RequestParam(value = "status") WorkPostStatus status) {
        WorkPost workPost = workPostService.updateStatus(UUID.fromString(id), status);
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @GetMapping("/stats/count")
    @Operation(summary = "EstatÃ­sticas de postos", description = "Retorna contadores de postos por status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "EstatÃ­sticas retornadas com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostStats> getWorkPostStats() {
        long emImplantacaoCount = workPostService.countByStatus(WorkPostStatus.EM_IMPLANTACAO);
        long ativoCount = workPostService.countByStatus(WorkPostStatus.ATIVO);
        long inativoCount = workPostService.countByStatus(WorkPostStatus.INATIVO);
        long suspensoCount = workPostService.countByStatus(WorkPostStatus.SUSPENSO);
        long canceladoCount = workPostService.countByStatus(WorkPostStatus.CANCELADO);
        long emAnaliseCount = workPostService.countByStatus(WorkPostStatus.EM_ANALISE);
        long pendenteCount = workPostService.countByStatus(WorkPostStatus.PENDENTE);
        
        WorkPostStats stats = new WorkPostStats(emImplantacaoCount, ativoCount, inativoCount, 
                                              suspensoCount, canceladoCount, emAnaliseCount, pendenteCount);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/test")
    @Operation(summary = "Teste simples", description = "Endpoint de teste para debug")
    public ResponseEntity<String> test() {
        log.info("ðŸ” TESTE - Endpoint /test chamado");
        try {
            // Teste simples sem acessar o repositÃ³rio
            log.info("âœ… TESTE - Endpoint funcionando");
            return ResponseEntity.ok("OK - Endpoint funcionando");
        } catch (Exception e) {
            log.error("âŒ TESTE - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
    
    @PostMapping("/test-create")
    @Operation(summary = "Teste criaÃ§Ã£o sem autenticaÃ§Ã£o", description = "Endpoint de teste para criaÃ§Ã£o de posto")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> testCreate(@RequestBody String rawData) {
        log.info("ðŸ” TESTE CREATE - Dados recebidos (raw): {}", rawData);
        try {
            // Tentar deserializar manualmente
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
            
            WorkPostDTO workPostDTO = mapper.readValue(rawData, WorkPostDTO.class);
            log.info("âœ… TESTE CREATE - DeserializaÃ§Ã£o bem-sucedida: {}", workPostDTO.getPostCode());
            log.info("ðŸ” TESTE CREATE - shiftStart: {} (tipo: {})", workPostDTO.getShiftStart(), workPostDTO.getShiftStart() != null ? workPostDTO.getShiftStart().getClass().getSimpleName() : "null");
            log.info("ðŸ” TESTE CREATE - shiftEnd: {} (tipo: {})", workPostDTO.getShiftEnd(), workPostDTO.getShiftEnd() != null ? workPostDTO.getShiftEnd().getClass().getSimpleName() : "null");
            
            // Tentar criar o posto
            WorkPost workPost = workPostService.createWorkPost(workPostDTO);
            log.info("âœ… TESTE CREATE - Posto criado com sucesso: {}", workPost.getId());
            return ResponseEntity.ok("Posto criado com sucesso: " + workPost.getId());
        } catch (Exception e) {
            log.error("âŒ TESTE CREATE - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage() + " - " + e.getClass().getSimpleName());
        }
    }
    
    /*
    @GetMapping("/test-clients")
    @Operation(summary = "Listar clientes para teste", description = "Endpoint para listar clientes disponÃ­veis")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> testClients() {
        try {
            var pageable = Pageable.unpaged();
            var clientsPage = clientService.getAllClients(pageable);
            StringBuilder result = new StringBuilder("Clientes disponÃ­veis:\n");
            for (var client : clientsPage.getContent()) {
                result.append("- ID: ").append(client.getId()).append(", Nome: ").append(client.getName()).append("\n");
            }
            return ResponseEntity.ok(result.toString());
        } catch (Exception e) {
            log.error("âŒ TESTE CLIENTS - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
    */
    
    @GetMapping("/debug")
    @Operation(summary = "Debug detalhado", description = "Endpoint de debug para identificar problemas")
    public ResponseEntity<String> debug() {
        log.info("ðŸ” DEBUG - Endpoint /debug chamado");
        try {
            // Teste 1: Verificar se o service estÃ¡ funcionando
            log.info("ðŸ” DEBUG - Teste 1: Verificando service");
            
            // Teste 2: Verificar se o repository estÃ¡ funcionando
            log.info("ðŸ” DEBUG - Teste 2: Verificando repository");
            long count = workPostRepository.count();
            log.info("âœ… DEBUG - Total de postos no banco: {}", count);
            
            // Teste 3: Verificar se consegue buscar um registro
            log.info("ðŸ” DEBUG - Teste 3: Verificando busca de registros");
            List<WorkPost> workPosts = workPostRepository.findAll();
            log.info("âœ… DEBUG - Encontrados {} postos", workPosts.size());
            
            // Teste 4: Verificar se consegue converter para DTO
            log.info("ðŸ” DEBUG - Teste 4: Verificando conversÃ£o para DTO");
            List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
            log.info("âœ… DEBUG - Convertidos {} DTOs", workPostDTOs.size());
            
            return ResponseEntity.ok(String.format("DEBUG OK - Total: %d, Encontrados: %d, DTOs: %d", count, workPosts.size(), workPostDTOs.size()));
            
        } catch (Exception e) {
            log.error("âŒ DEBUG - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("DEBUG ERRO: " + e.getMessage() + " - " + e.getClass().getSimpleName());
        }
    }
    
    // Classe interna para estatÃ­sticas
    public static class WorkPostStats {
        private final long emImplantacao;
        private final long ativo;
        private final long inativo;
        private final long suspenso;
        private final long cancelado;
        private final long emAnalise;
        private final long pendente;
        
        public WorkPostStats(long emImplantacao, long ativo, long inativo, 
                           long suspenso, long cancelado, long emAnalise, long pendente) {
            this.emImplantacao = emImplantacao;
            this.ativo = ativo;
            this.inativo = inativo;
            this.suspenso = suspenso;
            this.cancelado = cancelado;
            this.emAnalise = emAnalise;
            this.pendente = pendente;
        }
        
        // Getters
        public long getEmImplantacao() { return emImplantacao; }
        public long getAtivo() { return ativo; }
        public long getInativo() { return inativo; }
        public long getSuspenso() { return suspenso; }
        public long getCancelado() { return cancelado; }
        public long getEmAnalise() { return emAnalise; }
        public long getPendente() { return pendente; }
    }
}
