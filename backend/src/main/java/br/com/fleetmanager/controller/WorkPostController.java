package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ClientService;
import br.com.fleetmanager.service.WorkPostService;

import br.com.fleetmanager.dto.WorkPostDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.WorkPost;
import br.com.fleetmanager.model.enums.WorkPostStatus;
import br.com.fleetmanager.model.enums.WorkPostType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.repository.WorkPostRepository;

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
    private final ClientService clientService;
    private final WorkPostRepository workPostRepository;
    
    @GetMapping
    @Operation(summary = "Listar postos de trabalho", description = "Retorna uma lista paginada de postos de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getAllWorkPosts(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        log.debug("Buscando postos de trabalho com paginação");
        Page<WorkPost> workPosts = workPostService.findAll(pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os postos de trabalho (sem paginação)", description = "Retorna uma lista completa de todos os postos de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<WorkPostDTO>> getAllWorkPostsNoPagination() {
        log.info("🔍 Buscando todos os postos de trabalho");
        try {
            List<WorkPost> workPosts = workPostService.findAll();
            log.info("✅ Encontrados {} postos de trabalho", workPosts.size());
            List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
            return ResponseEntity.ok(workPostDTOs);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar postos de trabalho: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar postos de trabalho", e);
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar posto por ID", description = "Retorna um posto específico pelo ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posto encontrado"),
        @ApiResponse(responseCode = "404", description = "Posto não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> getWorkPostById(
            @Parameter(description = "ID do posto") @PathVariable String id) {
        WorkPost workPost = workPostService.getById(UUID.fromString(id));
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @GetMapping("/code/{postCode}")
    @Operation(summary = "Buscar posto por código", description = "Retorna um posto específico pelo código")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Posto encontrado"),
        @ApiResponse(responseCode = "404", description = "Posto não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> getWorkPostByCode(
            @Parameter(description = "Código do posto") @PathVariable String postCode) {
        WorkPost workPost = workPostService.findByPostCode(postCode)
                .orElseThrow(() -> new ResourceNotFoundException("Posto não encontrado com código: " + postCode));
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @PostMapping
    @Operation(summary = "Criar posto de trabalho", description = "Cria um novo posto de trabalho")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Posto criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
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
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "404", description = "Posto não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> updateWorkPost(
            @Parameter(description = "ID do posto") @PathVariable String id,
            @Parameter(description = "Dados atualizados do posto") @Valid @RequestBody WorkPostDTO workPostDTO) {
        WorkPostDTO updatedWorkPostDTO = workPostService.updateWorkPost(UUID.fromString(id), workPostDTO);
        return ResponseEntity.ok(updatedWorkPostDTO);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir posto de trabalho", description = "Exclui um posto")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Posto excluído com sucesso"),
        @ApiResponse(responseCode = "404", description = "Posto não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteWorkPost(
            @Parameter(description = "ID do posto") @PathVariable String id) {
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
            @Parameter(description = "Status do posto") @PathVariable WorkPostStatus status,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
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
            @Parameter(description = "Tipo do posto") @PathVariable WorkPostType type,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByType(type, pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar postos por cliente", description = "Retorna postos de um cliente específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByClient(
            @Parameter(description = "ID do cliente") @PathVariable String clientId,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByClient(UUID.fromString(clientId), pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Listar postos por contrato", description = "Retorna postos de um contrato específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<WorkPostDTO>> getWorkPostsByContract(
            @Parameter(description = "ID do contrato") @PathVariable String contractId,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
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
            @Parameter(description = "ID do cliente") @RequestParam(required = false) String clientId,
            @Parameter(description = "Status do posto") @RequestParam(required = false) WorkPostStatus status,
            @Parameter(description = "Tipo do posto") @RequestParam(required = false) WorkPostType type,
            @Parameter(description = "Termo de busca") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        Page<WorkPost> workPosts = workPostService.findByFilters(UUID.fromString(clientId), status, type, searchTerm, pageable);
        Page<WorkPostDTO> workPostDTOs = workPostService.convertToDTOPage(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @GetMapping("/implementation/period")
    @Operation(summary = "Listar postos para implantação", description = "Retorna postos que serão implantados em um período")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Postos listados com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<WorkPostDTO>> getWorkPostsToBeImplemented(
            @Parameter(description = "Data inicial") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data final") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkPost> workPosts = workPostService.findPostsToBeImplementedBetween(startDate, endDate);
        List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
        return ResponseEntity.ok(workPostDTOs);
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do posto", description = "Atualiza apenas o status de um posto")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Posto não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<WorkPostDTO> updateWorkPostStatus(
            @Parameter(description = "ID do posto") @PathVariable String id,
            @Parameter(description = "Novo status") @RequestParam WorkPostStatus status) {
        WorkPost workPost = workPostService.updateStatus(UUID.fromString(id), status);
        WorkPostDTO workPostDTO = workPostService.convertToDTO(workPost);
        return ResponseEntity.ok(workPostDTO);
    }
    
    @GetMapping("/stats/count")
    @Operation(summary = "Estatísticas de postos", description = "Retorna contadores de postos por status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso"),
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
        log.info("🔍 TESTE - Endpoint /test chamado");
        try {
            // Teste simples sem acessar o repositório
            log.info("✅ TESTE - Endpoint funcionando");
            return ResponseEntity.ok("OK - Endpoint funcionando");
        } catch (Exception e) {
            log.error("❌ TESTE - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
    
    @PostMapping("/test-create")
    @Operation(summary = "Teste criação sem autenticação", description = "Endpoint de teste para criação de posto")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> testCreate(@RequestBody String rawData) {
        log.info("🔍 TESTE CREATE - Dados recebidos (raw): {}", rawData);
        try {
            // Tentar deserializar manualmente
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
            
            WorkPostDTO workPostDTO = mapper.readValue(rawData, WorkPostDTO.class);
            log.info("✅ TESTE CREATE - Deserialização bem-sucedida: {}", workPostDTO.getPostCode());
            log.info("🔍 TESTE CREATE - shiftStart: {} (tipo: {})", workPostDTO.getShiftStart(), workPostDTO.getShiftStart() != null ? workPostDTO.getShiftStart().getClass().getSimpleName() : "null");
            log.info("🔍 TESTE CREATE - shiftEnd: {} (tipo: {})", workPostDTO.getShiftEnd(), workPostDTO.getShiftEnd() != null ? workPostDTO.getShiftEnd().getClass().getSimpleName() : "null");
            
            // Tentar criar o posto
            WorkPost workPost = workPostService.createWorkPost(workPostDTO);
            log.info("✅ TESTE CREATE - Posto criado com sucesso: {}", workPost.getId());
            return ResponseEntity.ok("Posto criado com sucesso: " + workPost.getId());
        } catch (Exception e) {
            log.error("❌ TESTE CREATE - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage() + " - " + e.getClass().getSimpleName());
        }
    }
    
    @GetMapping("/test-clients")
    @Operation(summary = "Listar clientes para teste", description = "Endpoint para listar clientes disponíveis")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> testClients() {
        try {
            var pageable = Pageable.unpaged();
            var clientsPage = clientService.getAllClients(pageable);
            StringBuilder result = new StringBuilder("Clientes disponíveis:\n");
            for (var client : clientsPage.getContent()) {
                result.append("- ID: ").append(client.getId()).append(", Nome: ").append(client.getName()).append("\n");
            }
            return ResponseEntity.ok(result.toString());
        } catch (Exception e) {
            log.error("❌ TESTE CLIENTS - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
    
    @GetMapping("/debug")
    @Operation(summary = "Debug detalhado", description = "Endpoint de debug para identificar problemas")
    public ResponseEntity<String> debug() {
        log.info("🔍 DEBUG - Endpoint /debug chamado");
        try {
            // Teste 1: Verificar se o service está funcionando
            log.info("🔍 DEBUG - Teste 1: Verificando service");
            
            // Teste 2: Verificar se o repository está funcionando
            log.info("🔍 DEBUG - Teste 2: Verificando repository");
            long count = workPostRepository.count();
            log.info("✅ DEBUG - Total de postos no banco: {}", count);
            
            // Teste 3: Verificar se consegue buscar um registro
            log.info("🔍 DEBUG - Teste 3: Verificando busca de registros");
            List<WorkPost> workPosts = workPostRepository.findAll();
            log.info("✅ DEBUG - Encontrados {} postos", workPosts.size());
            
            // Teste 4: Verificar se consegue converter para DTO
            log.info("🔍 DEBUG - Teste 4: Verificando conversão para DTO");
            List<WorkPostDTO> workPostDTOs = workPostService.convertToDTOList(workPosts);
            log.info("✅ DEBUG - Convertidos {} DTOs", workPostDTOs.size());
            
            return ResponseEntity.ok(String.format("DEBUG OK - Total: %d, Encontrados: %d, DTOs: %d", count, workPosts.size(), workPostDTOs.size()));
            
        } catch (Exception e) {
            log.error("❌ DEBUG - Erro: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("DEBUG ERRO: " + e.getMessage() + " - " + e.getClass().getSimpleName());
        }
    }
    
    // Classe interna para estatísticas
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