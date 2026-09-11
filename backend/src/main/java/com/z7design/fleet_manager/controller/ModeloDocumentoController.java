package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ModeloDocumento;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ModeloDocumentoService;
import com.z7design.fleet_manager.service.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/modelos-documentos")
@CrossOrigin(origins = "*")
public class ModeloDocumentoController {
    
    private final ModeloDocumentoService modeloDocumentoService;
    private final AuthenticationService authenticationService;
    
    public ModeloDocumentoController(ModeloDocumentoService modeloDocumentoService,
                                   AuthenticationService authenticationService) {
        this.modeloDocumentoService = modeloDocumentoService;
        this.authenticationService = authenticationService;
    }
    
    /**
     * Lista todos os modelos ativos
     */
    @GetMapping
    // @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<ModeloDocumento>> listarTodos() {
        List<ModeloDocumento> modelos = modeloDocumentoService.listarAtivos();
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Lista modelos com paginaÃ§Ã£o
     */
    @GetMapping("/paginated")
    public ResponseEntity<Page<ModeloDocumento>> listarComPaginacao(Pageable pageable) {
        Page<ModeloDocumento> modelos = modeloDocumentoService.listarComPaginacao(pageable);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Busca modelo por ID
     */
    @GetMapping("/{id}")
    // @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<ModeloDocumento> buscarPorId(@PathVariable("id") UUID id) {
        try {
            ModeloDocumento modelo = modeloDocumentoService.buscarPorId(id);
            return ResponseEntity.ok(modelo);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista modelos por categoria
     */
    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<ModeloDocumento>> listarPorCategoria(@PathVariable("categoria") String categoria) {
        List<ModeloDocumento> modelos = modeloDocumentoService.listarPorCategoria(categoria);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Busca modelos por nome
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ModeloDocumento>> buscarPorNome(@RequestParam(value = "nome") String nome) {
        List<ModeloDocumento> modelos = modeloDocumentoService.buscarPorNome(nome);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Lista categorias disponÃ­veis
     */
    @GetMapping("/categorias")
    public ResponseEntity<List<String>> listarCategorias() {
        List<String> categorias = modeloDocumentoService.listarCategorias();
        return ResponseEntity.ok(categorias);
    }
    
    /**
     * Cria um novo modelo
     */
    @PostMapping
    // @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<ModeloDocumento> criar(@RequestBody ModeloDocumento modelo) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            ModeloDocumento modeloCriado = modeloDocumentoService.criar(modelo, usuarioAtual);
            return ResponseEntity.status(HttpStatus.CREATED).body(modeloCriado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cria modelo a partir de upload de arquivo DOCX ou PDF
     */
    @PostMapping("/upload")
    // @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<ModeloDocumento> criarDeArquivo(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("nomeModelo") String nomeModelo,
            @RequestParam(value = "categoria", required = false) String categoria,
            @RequestParam(value = "descricao", required = false) String descricao) {
        
        try {
            log.info("ðŸ“¤ Recebendo upload de modelo de documento: nomeModelo={}, categoria={}, arquivo={}, tamanho={} bytes", 
                nomeModelo, categoria, arquivo.getOriginalFilename(), arquivo.getSize());
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                log.error("âŒ AutenticaÃ§Ã£o Ã© null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            if (usuarioAtual == null) {
                log.error("âŒ UsuÃ¡rio atual Ã© null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            log.info("âœ… UsuÃ¡rio autenticado: {}", usuarioAtual.getUsername());
            
            ModeloDocumento modelo = modeloDocumentoService.criarDeArquivo(arquivo, nomeModelo, categoria, descricao, usuarioAtual);
            log.info("âœ… Modelo de documento criado com sucesso: id={}, nome={}", modelo.getId(), modelo.getNomeModelo());
            return ResponseEntity.status(HttpStatus.CREATED).body(modelo);
        } catch (IOException e) {
            log.error("âŒ Erro de IO ao criar modelo de documento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            log.error("âŒ Argumento invÃ¡lido ao criar modelo de documento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao criar modelo de documento: {}", e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Atualiza um modelo existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<ModeloDocumento> atualizar(@PathVariable("id") UUID id, @RequestBody ModeloDocumento modelo) {
        try {
            ModeloDocumento modeloAtualizado = modeloDocumentoService.atualizar(id, modelo);
            return ResponseEntity.ok(modeloAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Desativa um modelo (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable("id") UUID id) {
        try {
            modeloDocumentoService.desativar(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Remove um modelo permanentemente
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> remover(@PathVariable("id") UUID id) {
        try {
            modeloDocumentoService.remover(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Verifica se existe modelo com o mesmo nome
     */
    @GetMapping("/existe")
    public ResponseEntity<Map<String, Boolean>> verificarExistencia(@RequestParam(value = "nomeModelo") String nomeModelo) {
        boolean existe = modeloDocumentoService.existePorNome(nomeModelo);
        return ResponseEntity.ok(Map.of("existe", existe));
    }
    
    /**
     * Lista modelos nÃ£o utilizados recentemente
     */
    @GetMapping("/nao-utilizados")
    public ResponseEntity<List<ModeloDocumento>> listarNaoUtilizados(@RequestParam(value = "diasLimite", defaultValue = "30") int diasLimite) {
        List<ModeloDocumento> modelos = modeloDocumentoService.buscarNaoUtilizados(diasLimite);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Lista modelos por versÃ£o
     */
    @GetMapping("/versao/{versao}")
    public ResponseEntity<List<ModeloDocumento>> listarPorVersao(@PathVariable("versao") String versao) {
        List<ModeloDocumento> modelos = modeloDocumentoService.buscarPorVersao(versao);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Extrai placeholders de um texto
     */
    @PostMapping("/extrair-placeholders")
    public ResponseEntity<List<String>> extrairPlaceholders(@RequestBody Map<String, String> request) {
        String conteudo = request.get("conteudo");
        if (conteudo == null || conteudo.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Criar um modelo temporÃ¡rio para usar o mÃ©todo de extraÃ§Ã£o
        ModeloDocumento modelo = new ModeloDocumento();
        modelo.setConteudoTemplate(conteudo);
        List<String> placeholders = modelo.getPlaceholdersAsList();
        
        return ResponseEntity.ok(placeholders);
    }
    
    /**
     * Download do arquivo original do modelo
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadArquivo(@PathVariable("id") UUID id) {
        try {
            ModeloDocumento modelo = modeloDocumentoService.buscarPorId(id);
            if (modelo.getArquivoOriginal() == null || modelo.getArquivoOriginal().length == 0) {
                return ResponseEntity.notFound().build();
            }
            
            String nomeArquivo = modelo.getNomeArquivoOriginal() != null 
                ? modelo.getNomeArquivoOriginal() 
                : modelo.getNomeModelo() + "." + modelo.getTipoArquivo().name().toLowerCase();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nomeArquivo);
            headers.setContentLength(modelo.getArquivoOriginal().length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(modelo.getArquivoOriginal());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao fazer download do arquivo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Valida arquivo DOCX
     */
    @PostMapping("/validar-arquivo")
    public ResponseEntity<Map<String, Object>> validarArquivo(@RequestParam("arquivo") MultipartFile arquivo) {
        Map<String, Object> resultado = new java.util.HashMap<>();
        
        try {
            // ValidaÃ§Ãµes bÃ¡sicas
            if (arquivo == null || arquivo.isEmpty()) {
                resultado.put("valido", false);
                resultado.put("erro", "Arquivo nÃ£o pode ser vazio");
                return ResponseEntity.ok(resultado);
            }
            
            String nomeArquivo = arquivo.getOriginalFilename();
            if (nomeArquivo == null || (!nomeArquivo.toLowerCase().endsWith(".docx") && !nomeArquivo.toLowerCase().endsWith(".pdf"))) {
                resultado.put("valido", false);
                resultado.put("erro", "Arquivo deve ser um documento .docx ou .pdf");
                return ResponseEntity.ok(resultado);
            }
            
            if (arquivo.getSize() > 10 * 1024 * 1024) { // 10MB
                resultado.put("valido", false);
                resultado.put("erro", "Arquivo nÃ£o pode exceder 10MB");
                return ResponseEntity.ok(resultado);
            }
            
            resultado.put("valido", true);
            resultado.put("nomeArquivo", nomeArquivo);
            resultado.put("tamanho", arquivo.getSize());
            resultado.put("tipo", arquivo.getContentType());
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            resultado.put("valido", false);
            resultado.put("erro", "Erro ao validar arquivo: " + e.getMessage());
            return ResponseEntity.ok(resultado);
        }
    }
}

