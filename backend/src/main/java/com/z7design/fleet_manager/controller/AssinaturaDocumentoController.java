package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.AssinaturaDocumento;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AssinaturaDocumentoService;
import com.z7design.fleet_manager.service.AuthenticationService;
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
     * Cria uma assinatura eletrÃ´nica
     */
    @PostMapping("/eletronica")
    @PreAuthorize("hasAuthority('EMPLOYEES_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<AssinaturaDocumento> criarAssinaturaEletronica(
            @RequestParam(value = "documentoId") UUID documentoId,
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
            @RequestParam(value = "documentoId") UUID documentoId,
            @RequestParam(value = "certificadoDigital") String certificadoDigital,
            @RequestParam(value = "hashDocumento") String hashDocumento,
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
    public ResponseEntity<List<AssinaturaDocumento>> listarPorDocumento(@PathVariable("documentoId") UUID documentoId) {
        try {
            List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorDocumento(documentoId);
            return ResponseEntity.ok(assinaturas);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lista assinaturas de um usuÃ¡rio
     */
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorUsuario(@PathVariable("usuarioId") UUID usuarioId) {
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas do usuÃ¡rio atual
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
    public ResponseEntity<List<AssinaturaDocumento>> listarPorTipo(@PathVariable("tipo") AssinaturaDocumento.TipoAssinatura tipo) {
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorTipo(tipo);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas em um perÃ­odo
     */
    @GetMapping("/periodo")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorPeriodo(
            @RequestParam(value = "dataInicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(value = "dataFim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        
        List<AssinaturaDocumento> assinaturas = assinaturaDocumentoService.listarPorPeriodo(dataInicio, dataFim);
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas do usuÃ¡rio atual em um perÃ­odo
     */
    @GetMapping("/minhas-assinaturas/periodo")
    public ResponseEntity<List<AssinaturaDocumento>> listarMinhasAssinaturasPorPeriodo(
            @RequestParam(value = "dataInicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(value = "dataFim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        
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
    public ResponseEntity<AssinaturaDocumento> buscarPorHash(@PathVariable("hashAssinatura") String hashAssinatura) {
        try {
            AssinaturaDocumento assinatura = assinaturaDocumentoService.buscarPorHash(hashAssinatura);
            return ResponseEntity.ok(assinatura);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Verifica se hash de assinatura jÃ¡ existe
     */
    @GetMapping("/hash/{hashAssinatura}/existe")
    public ResponseEntity<Map<String, Boolean>> verificarHashExiste(@PathVariable("hashAssinatura") String hashAssinatura) {
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
     * Busca Ãºltima assinatura de um documento
     */
    @GetMapping("/documento/{documentoId}/ultima")
    public ResponseEntity<AssinaturaDocumento> buscarUltimaAssinatura(@PathVariable("documentoId") UUID documentoId) {
        AssinaturaDocumento assinatura = assinaturaDocumentoService.buscarUltimaAssinatura(documentoId);
        if (assinatura != null) {
            return ResponseEntity.ok(assinatura);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * ObtÃ©m estatÃ­sticas das assinaturas
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
    public ResponseEntity<Map<String, Object>> validarIntegridade(@PathVariable("id") UUID id) {
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
    public ResponseEntity<List<AssinaturaDocumento>> listarPorIp(@PathVariable("ipAddress") String ipAddress) {
        // TODO: Implementar mÃ©todo no service
        List<AssinaturaDocumento> assinaturas = List.of();
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Lista assinaturas por user agent
     */
    @GetMapping("/user-agent")
    public ResponseEntity<List<AssinaturaDocumento>> listarPorUserAgent(@RequestParam(value = "userAgent") String userAgent) {
        // TODO: Implementar mÃ©todo no service
        List<AssinaturaDocumento> assinaturas = List.of();
        return ResponseEntity.ok(assinaturas);
    }
    
    /**
     * Assinatura rÃ¡pida (combina criaÃ§Ã£o de assinatura eletrÃ´nica e atualizaÃ§Ã£o do documento)
     */
    @PostMapping("/assinar-rapido")
    public ResponseEntity<Map<String, Object>> assinaturaRapida(
            @RequestParam(value = "documentoId") UUID documentoId,
            @RequestParam(value = "observacoes", required = false) String observacoes,
            HttpServletRequest request) {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User usuarioAtual = authenticationService.getCurrentUser(authentication);
            
            // Criar assinatura eletrÃ´nica
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
     * Verifica se usuÃ¡rio jÃ¡ assinou um documento
     */
    @GetMapping("/documento/{documentoId}/usuario/{usuarioId}/verificar")
    public ResponseEntity<Map<String, Boolean>> verificarAssinaturaUsuario(
            @PathVariable("documentoId") UUID documentoId, @PathVariable("usuarioId") UUID usuarioId) {
        
        try {
            // TODO: Implementar verificaÃ§Ã£o especÃ­fica
            boolean jaAssinou = false; // Placeholder
            return ResponseEntity.ok(Map.of("jaAssinou", jaAssinou));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

