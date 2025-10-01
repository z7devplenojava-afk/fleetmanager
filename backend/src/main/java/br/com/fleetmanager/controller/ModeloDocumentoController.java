package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ModeloDocumentoService;

import br.com.fleetmanager.model.ModeloDocumento;
import br.com.fleetmanager.model.User;

import br.com.fleetmanager.service.AuthenticationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * Lista modelos com paginação
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
    public ResponseEntity<ModeloDocumento> buscarPorId(@PathVariable UUID id) {
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
    public ResponseEntity<List<ModeloDocumento>> listarPorCategoria(@PathVariable String categoria) {
        List<ModeloDocumento> modelos = modeloDocumentoService.listarPorCategoria(categoria);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Busca modelos por nome
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ModeloDocumento>> buscarPorNome(@RequestParam String nome) {
        List<ModeloDocumento> modelos = modeloDocumentoService.buscarPorNome(nome);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Lista categorias disponíveis
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
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            ModeloDocumento modelo = modeloDocumentoService.criarDeArquivo(arquivo, nomeModelo, categoria, descricao, usuarioAtual);
            return ResponseEntity.status(HttpStatus.CREATED).body(modelo);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Atualiza um modelo existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<ModeloDocumento> atualizar(@PathVariable UUID id, @RequestBody ModeloDocumento modelo) {
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
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
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
    public ResponseEntity<Void> remover(@PathVariable UUID id) {
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
    public ResponseEntity<Map<String, Boolean>> verificarExistencia(@RequestParam String nomeModelo) {
        boolean existe = modeloDocumentoService.existePorNome(nomeModelo);
        return ResponseEntity.ok(Map.of("existe", existe));
    }
    
    /**
     * Lista modelos não utilizados recentemente
     */
    @GetMapping("/nao-utilizados")
    public ResponseEntity<List<ModeloDocumento>> listarNaoUtilizados(@RequestParam(defaultValue = "30") int diasLimite) {
        List<ModeloDocumento> modelos = modeloDocumentoService.buscarNaoUtilizados(diasLimite);
        return ResponseEntity.ok(modelos);
    }
    
    /**
     * Lista modelos por versão
     */
    @GetMapping("/versao/{versao}")
    public ResponseEntity<List<ModeloDocumento>> listarPorVersao(@PathVariable String versao) {
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
        
        // Criar um modelo temporário para usar o método de extração
        ModeloDocumento modelo = new ModeloDocumento();
        modelo.setConteudoTemplate(conteudo);
        List<String> placeholders = modelo.getPlaceholdersAsList();
        
        return ResponseEntity.ok(placeholders);
    }
    
    /**
     * Valida arquivo DOCX
     */
    @PostMapping("/validar-arquivo")
    public ResponseEntity<Map<String, Object>> validarArquivo(@RequestParam("arquivo") MultipartFile arquivo) {
        Map<String, Object> resultado = new java.util.HashMap<>();
        
        try {
            // Validações básicas
            if (arquivo == null || arquivo.isEmpty()) {
                resultado.put("valido", false);
                resultado.put("erro", "Arquivo não pode ser vazio");
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
                resultado.put("erro", "Arquivo não pode exceder 10MB");
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
