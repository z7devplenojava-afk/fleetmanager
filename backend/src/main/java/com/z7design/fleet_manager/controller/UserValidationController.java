package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user-validation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Validation", description = "ValidaÃ§Ã£o de usuÃ¡rios para envio de documentos")
@CrossOrigin(origins = "*")
public class UserValidationController {

    private final UserRepository userRepository;

    @GetMapping("/validate-by-cpf/{cpf}")
    @Operation(summary = "Validar usuÃ¡rio por CPF", 
               description = "Verifica se usuÃ¡rio existe, tem contatos cadastrados e estÃ¡ apto para receber documentos")
    public ResponseEntity<Map<String, Object>> validateUserByCpf(@PathVariable String cpf) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ” Validando usuÃ¡rio por CPF: {}", cpf);
            
            // Normalizar CPF (remover caracteres especiais)
            String normalizedCpf = cpf.replaceAll("[^0-9]", "");
            
            // Buscar usuÃ¡rio por username (que Ã© o CPF)
            Optional<User> userOpt = userRepository.findByUsername(normalizedCpf);
            
            if (userOpt.isEmpty()) {
                log.warn("âŒ UsuÃ¡rio nÃ£o encontrado para CPF: {}", normalizedCpf);
                response.put("valid", false);
                response.put("exists", false);
                response.put("error", "CPF nÃ£o cadastrado no sistema");
                response.put("cpf", formatCpf(normalizedCpf));
                return ResponseEntity.ok(response);
            }
            
            User user = userOpt.get();
            log.info("âœ… UsuÃ¡rio encontrado: {}", user.getName());
            
            // Verificar contatos
            boolean hasEmail = user.getEmail() != null && !user.getEmail().trim().isEmpty();
            boolean hasWhatsApp = user.getWhatsapp() != null && !user.getWhatsapp().trim().isEmpty();
            boolean hasWhatsAppConsent = user.getWhatsappConsent() != null && user.getWhatsappConsent();
            
            log.info("ðŸ“§ Email: {} | ðŸ“± WhatsApp: {} | âœ… Consentimento: {}", 
                    hasEmail ? "Cadastrado" : "NÃ£o cadastrado",
                    hasWhatsApp ? "Cadastrado" : "NÃ£o cadastrado",
                    hasWhatsAppConsent ? "Ativo" : "Inativo");
            
            // Montar resposta
            response.put("valid", true);
            response.put("exists", true);
            response.put("userId", user.getId().toString());
            response.put("cpf", formatCpf(normalizedCpf));
            response.put("name", user.getName());
            response.put("username", user.getUsername());
            
            // Contatos
            response.put("hasEmail", hasEmail);
            response.put("email", hasEmail ? user.getEmail() : null);
            
            response.put("hasWhatsApp", hasWhatsApp);
            response.put("whatsapp", hasWhatsApp ? user.getWhatsapp() : null);
            response.put("whatsappConsent", hasWhatsAppConsent);
            
            // Status de aptidÃ£o para envio
            response.put("canSendEmail", hasEmail);
            response.put("canSendWhatsApp", hasWhatsApp && hasWhatsAppConsent);
            
            response.put("needsEmail", !hasEmail);
            response.put("needsWhatsApp", !hasWhatsApp);
            response.put("needsWhatsAppConsent", hasWhatsApp && !hasWhatsAppConsent);
            
            // Status geral
            boolean isReady = hasEmail || (hasWhatsApp && hasWhatsAppConsent);
            response.put("isReady", isReady);
            response.put("message", isReady 
                    ? "UsuÃ¡rio apto para receber documentos" 
                    : "UsuÃ¡rio precisa cadastrar contatos");
            
            log.info("âœ… ValidaÃ§Ã£o concluÃ­da - Apto: {}", isReady);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao validar usuÃ¡rio: {}", e.getMessage(), e);
            response.put("valid", false);
            response.put("error", "Erro ao validar usuÃ¡rio: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Formata CPF para exibiÃ§Ã£o (000.000.000-00)
     */
    private String formatCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return cpf;
        }
        return String.format("%s.%s.%s-%s", 
            cpf.substring(0, 3),
            cpf.substring(3, 6),
            cpf.substring(6, 9),
            cpf.substring(9, 11)
        );
    }
}


