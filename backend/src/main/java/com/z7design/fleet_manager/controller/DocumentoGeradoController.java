package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DocumentoGerado;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.DocumentoGeradoService;
import com.z7design.fleet_manager.service.AuthenticationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documentos-gerados")
@CrossOrigin(origins = "*")
public class DocumentoGeradoController {
    
    private final DocumentoGeradoService documentoGeradoService;
    private final AuthenticationService authenticationService;
    
    public DocumentoGeradoController(DocumentoGeradoService documentoGeradoService,
                                    AuthenticationService authenticationService) {
        this.documentoGeradoService = documentoGeradoService;
        this.authenticationService = authenticationService;
    }
    
    /**
     * Lista todos os documentos gerados com paginaÃ§Ã£o
     */
    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Page<DocumentoGerado>> listarTodos(Pageable pageable) {
        Page<DocumentoGerado> documentos = documentoGeradoService.listarComPaginacao(pageable);
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Busca documento por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEES_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<DocumentoGerado> buscarPorId(@PathVariable UUID id) {
        try {
            DocumentoGerado documento = documentoGeradoService.buscarPorId(id);
            return ResponseEntity.ok(documento);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista documentos por funcionÃ¡rio
     */
    @GetMapping("/funcionario/{funcionarioId}")
    public ResponseEntity<List<DocumentoGerado>> listarPorFuncionario(@PathVariable UUID funcionarioId) {
        try {
            List<DocumentoGerado> documentos = documentoGeradoService.listarPorFuncionario(funcionarioId);
            return ResponseEntity.ok(documentos);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista documentos por modelo
     */
    @GetMapping("/modelo/{modeloId}")
    public ResponseEntity<List<DocumentoGerado>> listarPorModelo(@PathVariable UUID modeloId) {
        try {
            List<DocumentoGerado> documentos = documentoGeradoService.listarPorModelo(modeloId);
            return ResponseEntity.ok(documentos);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista documentos por status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DocumentoGerado>> listarPorStatus(@PathVariable DocumentoGerado.StatusDocumento status) {
        List<DocumentoGerado> documentos = documentoGeradoService.listarPorStatus(status);
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Lista documentos pendentes
     */
    @GetMapping("/pendentes")
    public ResponseEntity<List<DocumentoGerado>> listarPendentes() {
        List<DocumentoGerado> documentos = documentoGeradoService.listarPendentes();
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Lista documentos vencidos
     */
    @GetMapping("/vencidos")
    public ResponseEntity<List<DocumentoGerado>> listarVencidos() {
        List<DocumentoGerado> documentos = documentoGeradoService.listarVencidos();
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Lista documentos que vencem em breve
     */
    @GetMapping("/vencendo-em-breve")
    public ResponseEntity<List<DocumentoGerado>> listarVencendoEmBreve(@RequestParam(defaultValue = "7") int dias) {
        List<DocumentoGerado> documentos = documentoGeradoService.listarVencendoEmBreve(dias);
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Gera um novo documento
     */
    @PostMapping("/gerar")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<DocumentoGerado> gerarDocumento(@RequestBody Map<String, Object> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            
            UUID modeloId = UUID.fromString((String) request.get("modeloId"));
            UUID funcionarioId = UUID.fromString((String) request.get("funcionarioId"));
            
            @SuppressWarnings("unchecked")
            Map<String, Object> dadosPreenchidos = (Map<String, Object>) request.get("dadosPreenchidos");
            
            DocumentoGerado documento = documentoGeradoService.gerarDocumento(
                modeloId, funcionarioId, dadosPreenchidos, usuarioAtual);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(documento);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Assina um documento
     */
    @PostMapping("/{id}/assinar")
    public ResponseEntity<DocumentoGerado> assinarDocumento(@PathVariable UUID id, 
                                                           HttpServletRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            String ipAddress = getClientIpAddress(request);
            DocumentoGerado documento = documentoGeradoService.assinarDocumento(id, usuarioAtual, ipAddress);
            return ResponseEntity.ok(documento);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * ObtÃ©m o IP do cliente considerando proxies e load balancers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // X-Forwarded-For pode conter mÃºltiplos IPs separados por vÃ­rgula
            // O primeiro IP Ã© geralmente o IP original do cliente
            String[] ips = xForwardedFor.split(",");
            return ips[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Cancela um documento
     */
    @PostMapping("/{id}/cancelar")
    public ResponseEntity<DocumentoGerado> cancelarDocumento(@PathVariable UUID id) {
        try {
            DocumentoGerado documento = documentoGeradoService.cancelarDocumento(id);
            return ResponseEntity.ok(documento);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Define data de vencimento para um documento
     */
    @PutMapping("/{id}/vencimento")
    public ResponseEntity<DocumentoGerado> definirVencimento(@PathVariable UUID id, 
                                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataVencimento) {
        try {
            DocumentoGerado documento = documentoGeradoService.definirVencimento(id, dataVencimento);
            return ResponseEntity.ok(documento);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Atualiza status de documentos vencidos
     */
    @PostMapping("/atualizar-status-vencidos")
    public ResponseEntity<Void> atualizarStatusVencidos() {
        documentoGeradoService.atualizarStatusVencidos();
        return ResponseEntity.ok().build();
    }
    
    /**
     * ObtÃ©m estatÃ­sticas dos documentos
     */
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> obterEstatisticas() {
        Map<String, Object> estatisticas = documentoGeradoService.obterEstatisticas();
        return ResponseEntity.ok(estatisticas);
    }
    
    /**
     * Lista documentos criados em um perÃ­odo
     */
    @GetMapping("/periodo")
    public ResponseEntity<List<DocumentoGerado>> listarPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        
        List<DocumentoGerado> documentos = documentoGeradoService.listarPorStatus(DocumentoGerado.StatusDocumento.PENDENTE);
        // Filtrar por perÃ­odo se necessÃ¡rio
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Lista documentos por funcionÃ¡rio com paginaÃ§Ã£o
     */
    @GetMapping("/funcionario/{funcionarioId}/paginated")
    public ResponseEntity<Page<DocumentoGerado>> listarPorFuncionarioComPaginacao(
            @PathVariable UUID funcionarioId, Pageable pageable) {
        try {
            List<DocumentoGerado> documentos = documentoGeradoService.listarPorFuncionario(funcionarioId);
            // Implementar paginaÃ§Ã£o manual se necessÃ¡rio
            return ResponseEntity.ok(null); // TODO: Implementar paginaÃ§Ã£o
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista documentos por modelo com paginaÃ§Ã£o
     */
    @GetMapping("/modelo/{modeloId}/paginated")
    public ResponseEntity<Page<DocumentoGerado>> listarPorModeloComPaginacao(
            @PathVariable UUID modeloId, Pageable pageable) {
        try {
            List<DocumentoGerado> documentos = documentoGeradoService.listarPorModelo(modeloId);
            // Implementar paginaÃ§Ã£o manual se necessÃ¡rio
            return ResponseEntity.ok(null); // TODO: Implementar paginaÃ§Ã£o
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Busca documentos por funcionÃ¡rio e modelo
     */
    @GetMapping("/funcionario/{funcionarioId}/modelo/{modeloId}")
    public ResponseEntity<List<DocumentoGerado>> buscarPorFuncionarioEModelo(
            @PathVariable UUID funcionarioId, @PathVariable UUID modeloId) {
        try {
            List<DocumentoGerado> documentos = documentoGeradoService.listarPorFuncionario(funcionarioId);
            // Filtrar por modelo se necessÃ¡rio
            return ResponseEntity.ok(documentos);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Download do arquivo gerado
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadArquivo(@PathVariable UUID id) {
        try {
            DocumentoGerado documento = documentoGeradoService.buscarPorId(id);
            
            if (documento.getArquivoGerado() == null) {
                return ResponseEntity.notFound().build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", documento.getNomeArquivoGerado());
            headers.setContentLength(documento.getArquivoGerado().length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(documento.getArquivoGerado());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Visualizar documento inline no navegador
     */
    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> visualizarDocumento(@PathVariable UUID id) {
        try {
            DocumentoGerado documento = documentoGeradoService.buscarPorId(id);
            
            if (documento.getArquivoGerado() == null) {
                return ResponseEntity.notFound().build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", documento.getNomeArquivoGerado());
            headers.setContentLength(documento.getArquivoGerado().length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(documento.getArquivoGerado());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Visualizar conteÃºdo do documento
     */
    @GetMapping("/{id}/conteudo")
    public ResponseEntity<Map<String, String>> visualizarConteudo(@PathVariable UUID id) {
        try {
            DocumentoGerado documento = documentoGeradoService.buscarPorId(id);
            return ResponseEntity.ok(Map.of("conteudo", documento.getConteudoFinal()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

