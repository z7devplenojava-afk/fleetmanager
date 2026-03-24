package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.UserTermsConsent;
import com.z7design.fleet_manager.service.SeetaFace2Service;
import com.z7design.fleet_manager.service.SupervisorService;
import com.z7design.fleet_manager.service.UserTermsConsentService;
import com.z7design.fleet_manager.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/supervisor-auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AutenticaÃ§Ã£o de Supervisores", description = "API para autenticaÃ§Ã£o de supervisores via CPF ou reconhecimento facial")
public class SupervisorAuthController {
    
    private final SupervisorService supervisorService;
    private final SeetaFace2Service seetaFace2Service;
    private final UserTermsConsentService consentService;
    private final JwtService jwtService;
    
    @PostMapping("/login-cpf")
    @Operation(summary = "Login por CPF", description = "Autentica supervisor usando CPF")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "CPF invÃ¡lido"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Supervisor inativo")
    })
    public ResponseEntity<Map<String, Object>> loginByCpf(
            @Parameter(description = "CPF do supervisor") @RequestParam String cpf,
            HttpServletRequest request) {
        
        log.info("Tentativa de login por CPF: {}", cpf);
        
        try {
            // Buscar supervisor pelo CPF
            SupervisorDTO supervisor = supervisorService.getSupervisorByCpf(cpf);
            
            if (!supervisor.getIsActive()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", "Supervisor inativo"
                ));
            }
            
            // Verificar se precisa aceitar termos LGPD
            boolean needsConsent = consentService.isConsentRequiredByCpf(cpf, UserTermsConsent.UserType.SUPERVISOR);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("supervisor", supervisor);
            response.put("needsConsent", needsConsent);
            
            if (!needsConsent) {
                // Gerar JWT token
                String token = jwtService.generateToken(supervisor.getId().toString(), "SUPERVISOR");
                response.put("token", token);
                response.put("message", "Login realizado com sucesso");
            } else {
                response.put("message", "NecessÃ¡rio aceitar termos de uso");
            }
            
            log.info("Login por CPF realizado com sucesso: {}", supervisor.getName());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro no login por CPF: {}", cpf, e);
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "error", "Supervisor nÃ£o encontrado ou inativo"
            ));
        }
    }
    
    @PostMapping("/login-facial")
    @Operation(summary = "Login por reconhecimento facial", description = "Autentica supervisor usando reconhecimento facial")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
        @ApiResponse(responseCode = "404", description = "Face nÃ£o reconhecida"),
        @ApiResponse(responseCode = "500", description = "Erro no reconhecimento")
    })
    public ResponseEntity<Map<String, Object>> loginByFacialRecognition(
            @Parameter(description = "Arquivo de imagem da face") @RequestParam("image") MultipartFile imageFile,
            HttpServletRequest request) {
        
        log.info("Tentativa de login por reconhecimento facial");
        
        try {
            // Validar arquivo
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Arquivo de imagem nÃ£o fornecido"
                ));
            }
            
            // Realizar reconhecimento facial
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            var result = seetaFace2Service.recognizeSupervisorFace(imageFile, ipAddress, userAgent);
            
            if (result.isSuccess()) {
                // Buscar dados do supervisor
                SupervisorDTO supervisor = supervisorService.getSupervisorByCpf(result.getCpf());
                
                if (!supervisor.getIsActive()) {
                    return ResponseEntity.status(403).body(Map.of(
                        "success", false,
                        "error", "Supervisor inativo"
                    ));
                }
                
                // Verificar se precisa aceitar termos LGPD
                boolean needsConsent = consentService.isConsentRequiredByCpf(result.getCpf(), UserTermsConsent.UserType.SUPERVISOR);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("supervisor", supervisor);
                response.put("needsConsent", needsConsent);
                response.put("confidence", result.getConfidence());
                response.put("quality", result.getQuality());
                
                if (!needsConsent) {
                    // Gerar JWT token
                    String token = jwtService.generateToken(supervisor.getId().toString(), "SUPERVISOR");
                    response.put("token", token);
                    response.put("message", "Login realizado com sucesso");
                } else {
                    response.put("message", "NecessÃ¡rio aceitar termos de uso");
                }
                
                log.info("Login por reconhecimento facial realizado com sucesso: {} (confianÃ§a: {})", 
                    supervisor.getName(), result.getConfidence());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", result.getErrorMessage(),
                    "quality", result.getQuality()
                ));
            }
            
        } catch (Exception e) {
            log.error("Erro no login por reconhecimento facial", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro interno do servidor: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/accept-terms")
    @Operation(summary = "Aceitar termos LGPD", description = "Registra a aceitaÃ§Ã£o dos termos de uso pelo supervisor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Termos aceitos com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "500", description = "Erro interno")
    })
    public ResponseEntity<Map<String, Object>> acceptTerms(
            @Parameter(description = "CPF do supervisor") @RequestParam String cpf,
            HttpServletRequest request) {
        
        log.info("AceitaÃ§Ã£o de termos LGPD para supervisor: {}", cpf);
        
        try {
            // Buscar supervisor
            SupervisorDTO supervisor = supervisorService.getSupervisorByCpf(cpf);
            
            // Criar consentimento
            CreateUserTermsConsentDTO consentDTO = new CreateUserTermsConsentDTO();
            consentDTO.setUserId(supervisor.getId());
            consentDTO.setUserType(UserTermsConsent.UserType.SUPERVISOR);
            consentDTO.setUserCpf(cpf);
            consentDTO.setAccepted(true);
            consentDTO.setIpAddress(getClientIpAddress(request));
            consentDTO.setUserAgent(request.getHeader("User-Agent"));
            
            UserTermsConsentDTO consent = consentService.createConsent(consentDTO);
            
            // Gerar JWT token
            String token = jwtService.generateToken(supervisor.getId().toString(), "SUPERVISOR");
            
            log.info("Termos LGPD aceitos com sucesso para supervisor: {}", supervisor.getName());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Termos aceitos com sucesso",
                "token", token,
                "supervisor", supervisor,
                "consent", consent
            ));
            
        } catch (Exception e) {
            log.error("Erro ao aceitar termos LGPD para supervisor: {}", cpf, e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao registrar aceitaÃ§Ã£o dos termos: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/check-terms/{cpf}")
    @Operation(summary = "Verificar status dos termos", description = "Verifica se supervisor precisa aceitar termos LGPD")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status verificado"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado")
    })
    public ResponseEntity<Map<String, Object>> checkTermsStatus(
            @Parameter(description = "CPF do supervisor") @PathVariable String cpf) {
        
        try {
            SupervisorDTO supervisor = supervisorService.getSupervisorByCpf(cpf);
            boolean needsConsent = consentService.isConsentRequiredByCpf(cpf, UserTermsConsent.UserType.SUPERVISOR);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "needsConsent", needsConsent,
                "supervisor", supervisor
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "error", "Supervisor nÃ£o encontrado"
            ));
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

