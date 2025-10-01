package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.AssinaturaDocumentoService;
import br.com.fleetmanager.service.AuthenticationService;

import br.com.fleetmanager.model.AssinaturaDocumento;
import br.com.fleetmanager.model.User;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/assinaturas-documentos")
@CrossOrigin(origins = "*")
public class AssinaturaDocumentoController {
    
    private final AssinaturaDocumentoService assinaturaDocumentoService;
    private final AuthenticationService authenticationService;
    
    public AssinaturaDocumentoController(AssinaturaDocumentoService assinaturaDocumentoService,
                                        AuthenticationService authenticationService) {
        this.assinaturaDocumentoService = assinaturaDocumentoService;
        this.authenticationService = authenticationService;
    }
    
    /**
     * Cria uma assinatura eletrônica
     */
    @PostMapping("/eletronica")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<AssinaturaDocumento> criarAssinaturaEletronica(
            @RequestParam UUID documentoId,
            @RequestParam(value = "observacoes", required = false) String observacoes,
            HttpServletRequest request) {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            AssinaturaDocumento assinatura = assinaturaDocumentoService.criarAssinaturaEletronica(
                documentoId, usuarioAtual, request, observacoes);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(assinatura);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cria uma assinatura digital
     */
    @PostMapping("/digital")
    public ResponseEntity<AssinaturaDocumento> criarAssinaturaDigital(
            @RequestParam UUID documentoId,
            @RequestParam String certificadoDigital,
            @RequestParam String hashDocumento,
            HttpServletRequest request) {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            AssinaturaDocumento assinatura = assinaturaDocumentoService.criarAssinaturaDigital(
                documentoId, usuarioAtual, certificadoDigital, hashDocumento, request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(assinatura);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lista assinaturas de um documento
     */
    @GetMapping("/documento/{documentoId}")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorDocumento(@PathVariable UUID documentoId) {
        try {
            List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorDocumento(documentoId);
            return ResponseEntity.ok(assinaturas);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista assinaturas de um usuário
     */
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorUsuario(@PathVariable UUID usuarioId) {
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas do usuário atual
     */
    @GetMapping("/minhas-assinaturas")
    public ResponseEntity<List<AssinaturaDocumento>> listarMinhasAssinaturas() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorUsuario(usuarioAtual.getId());
            return ResponseEntity.ok(assinaturas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lista assinaturas por tipo
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorTipo(@PathVariable AssinaturaDocumento.TipoAssinatura tipo) {
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorTipo(tipo);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas em um período
     */
    @GetMapping("/periodo")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorPeriodo(dataInicio, dataFim);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas do usuário atual em um período
     */
    @GetMapping("/minhas-assinaturas/periodo")
    public ResponseEntity<List<AssinaturaDocumento>> listarMinhasAssinaturasPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorUsuarioEPeriodo(
                usuarioAtual.getId(), dataInicio, dataFim);
            return ResponseEntity.ok(assinaturas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Busca assinatura por hash
     */
    @GetMapping("/hash/{hashAssinatura}")
    public ResponseEntity<AssinaturaDocumento> buscarPorHash(@PathVariable String hashAssinatura) {
        try {
            AssinaturaDocumento assinatura = assinaturaDocumentoService.buscarPorHash(hashAssinatura);
            return ResponseEntity.ok(assinatura);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Verifica se hash de assinatura já existe
     */
    @GetMapping("/hash/{hashAssinatura}/existe")
    public ResponseEntity<Map<String, Boolean>> verificarHashExiste(@PathVariable String hashAssinatura) {
        boolean existe = assinaturaDocumentoService.existeHashAssinatura(hashAssinatura);
        return ResponseEntity.ok(Map.of("existe", existe));
    }
    
    /**
     * Lista assinaturas com certificado digital
     */
    @GetMapping("/com-certificado-digital")
    public ResponseEntity<List<AssinaturaDocumento>> listarComCertificadoDigital() {
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarComCertificadoDigital();
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Busca última assinatura de um documento
     */
    @GetMapping("/documento/{documentoId}/ultima")
    public ResponseEntity<AssinaturaDocumento> buscarUltimaAssinatura(@PathVariable UUID documentoId) {
        AssinaturaDocumento assinatura = assinaturaDocumentoService.buscarUltimaAssinatura(documentoId);
        if (assinatura != null) {
            return ResponseEntity.ok(assinatura);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Obtém estatísticas das assinaturas
     */
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> obterEstatisticas() {
        Map<String, Object> estatisticas = assinaturaDocumentoService.obterEstatisticas();
        return ResponseEntity.ok(estatisticas);
    }
    
    /**
     * Valida integridade de uma assinatura
     */
    @PostMapping("/{id}/validar-integridade")
    public ResponseEntity<Map<String, Object>> validarIntegridade(@PathVariable UUID id) {
        try {
            boolean valida = assinaturaDocumentoService.validarIntegridadeAssinatura(id);
            return ResponseEntity.ok(Map.of("valida", valida));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista assinaturas por IP
     */
    @GetMapping("/ip/{ipAddress}")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorIp(@PathVariable String ipAddress) {
        // TODO: Implementar método no service
        List<AssinaturaDocumento> assinaturas = List.of();
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas por user agent
     */
    @GetMapping("/user-agent")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorUserAgent(@RequestParam String userAgent) {
        // TODO: Implementar método no service
        List<AssinaturaDocumento> assinaturas = List.of();
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Assinatura rápida (combina criação de assinatura eletrônica e atualização do documento)
     */
    @PostMapping("/assinar-rapido")
    public ResponseEntity<Map<String, Object>> assinaturaRapida(
            @RequestParam UUID documentoId,
            @RequestParam(value = "observacoes", required = false) String observacoes,
            HttpServletRequest request) {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            
            // Criar assinatura eletrônica
            AssinaturaDocumento assinatura = assinaturaDocumentoService.criarAssinaturaEletronica(
                documentoId, usuarioAtual, request, observacoes);
            
            Map<String, Object> resultado = Map.of(
                "assinatura", assinatura,
                "mensagem", "Documento assinado com sucesso"
            );
            
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Verifica se usuário já assinou um documento
     */
    @GetMapping("/documento/{documentoId}/usuario/{usuarioId}/verificar")
    public ResponseEntity<Map<String, Boolean>> verificarAssinaturaUsuario(
            @PathVariable UUID documentoId, @PathVariable UUID usuarioId) {
        
        try {
            // TODO: Implementar verificação específica
            boolean jaAssinou = false; // Placeholder
            return ResponseEntity.ok(Map.of("jaAssinou", jaAssinou));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
