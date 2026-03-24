package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FirstAccessRequestDTO;
import com.z7design.fleet_manager.dto.SimpleResponseDTO;
import com.z7design.fleet_manager.dto.TwoFactorActivationRequestDTO;
import com.z7design.fleet_manager.dto.TwoFactorStatusDTO;
import com.z7design.fleet_manager.model.TwoFactorCode;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.service.LogService;
import com.z7design.fleet_manager.service.TwoFactorService;
import com.z7design.fleet_manager.service.BaileysRestService;
import org.springframework.beans.factory.annotation.Autowired;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/first-access")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Primeiro Acesso", description = "Endpoints para mudanÃ§a de senha e ativaÃ§Ã£o 2FA no primeiro acesso")
public class FirstAccessController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TwoFactorService twoFactorService;
    private final LogService logService;
    
    @Autowired(required = false)
    private BaileysRestService baileysRestService;

    @Operation(summary = "Verifica status do primeiro acesso", description = "Retorna informaÃ§Ãµes sobre primeiro acesso e 2FA")
    @GetMapping("/status")
    public ResponseEntity<TwoFactorStatusDTO> getStatus(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        Boolean firstAccess = !Boolean.TRUE.equals(user.getFirstAccessCompleted());
        Boolean twoFactorEnabled = Boolean.TRUE.equals(user.getTwoFactorEnabled());
        
        TwoFactorStatusDTO status = TwoFactorStatusDTO.builder()
                .firstAccess(firstAccess)
                .enabled(twoFactorEnabled)
                .whatsappNumber(user.getWhatsapp())
                .message(firstAccess ? "Ã‰ necessÃ¡rio alterar sua senha no primeiro acesso" : 
                        (!twoFactorEnabled ? "Ã‰ necessÃ¡rio ativar autenticaÃ§Ã£o de dois fatores" : "Conta configurada"))
                .build();

        return ResponseEntity.ok(status);
    }

    @Operation(summary = "Altera senha no primeiro acesso", description = "Permite ao usuÃ¡rio alterar sua senha no primeiro acesso")
    @PostMapping("/change-password")
    public ResponseEntity<SimpleResponseDTO> changePassword(
            @Valid @RequestBody FirstAccessRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            if (userDetails == null) {
                log.warn("âŒ UsuÃ¡rio nÃ£o autenticado");
                return ResponseEntity.status(401).body(SimpleResponseDTO.builder()
                        .message("UsuÃ¡rio nÃ£o autenticado")
                        .success(false)
                        .build());
            }
            
            log.info("ðŸ” Iniciando mudanÃ§a de senha no primeiro acesso para: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

            // Validar senha atual
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                log.warn("âŒ Senha atual incorreta");
                return ResponseEntity.badRequest().body(SimpleResponseDTO.builder()
                        .message("Senha atual incorreta")
                        .success(false)
                        .build());
            }

            // Validar confirmaÃ§Ã£o de senha
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest().body(SimpleResponseDTO.builder()
                        .message("As senhas nÃ£o coincidem")
                        .success(false)
                        .build());
            }

            // Atualizar senha
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setFirstAccessCompleted(true);
            user.setLastPasswordChange(LocalDateTime.now());
            
            // Normalizar campo whatsapp para evitar erro de validaÃ§Ã£o
            // Se whatsapp estiver vazio ou invÃ¡lido, definir como null
            if (user.getWhatsapp() != null) {
                String cleanWhatsapp = user.getWhatsapp().trim();
                // Remover caracteres nÃ£o numÃ©ricos
                cleanWhatsapp = cleanWhatsapp.replaceAll("[^0-9]", "");
                // Se estiver vazio ou nÃ£o atender ao padrÃ£o (9-20 dÃ­gitos), definir como null
                if (cleanWhatsapp.isEmpty() || cleanWhatsapp.length() < 9 || cleanWhatsapp.length() > 20) {
                    user.setWhatsapp(null);
                } else {
                    user.setWhatsapp(cleanWhatsapp);
                }
            }
            
            userRepository.save(user);

            log.info("âœ… Senha alterada com sucesso para: {}", user.getUsername());
            
            // Log da atividade
            logService.logUserActivity(user.getUsername(), "FIRST_ACCESS_PASSWORD_CHANGE", 
                "Senha alterada no primeiro acesso");

            return ResponseEntity.ok(SimpleResponseDTO.builder()
                    .message("Senha alterada com sucesso! Agora vocÃª precisa ativar a autenticaÃ§Ã£o de dois fatores.")
                    .success(true)
                    .build());

        } catch (NullPointerException e) {
            log.error("ðŸ’¥ Erro: usuÃ¡rio nÃ£o autenticado ou dados nulos: {}", e.getMessage(), e);
            return ResponseEntity.status(401).body(SimpleResponseDTO.builder()
                    .message("UsuÃ¡rio nÃ£o autenticado. FaÃ§a login novamente.")
                    .success(false)
                    .build());
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao alterar senha: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(SimpleResponseDTO.builder()
                    .message("Erro ao alterar senha: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Solicita cÃ³digo 2FA", description = "Envia cÃ³digo de verificaÃ§Ã£o via WhatsApp")
    @PostMapping("/request-2fa-code")
    public ResponseEntity<SimpleResponseDTO> requestTwoFactorCode(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                log.warn("âŒ UsuÃ¡rio nÃ£o autenticado");
                return ResponseEntity.status(401).body(SimpleResponseDTO.builder()
                        .message("UsuÃ¡rio nÃ£o autenticado")
                        .success(false)
                        .build());
            }
            
            log.info("ðŸ“± Solicitando cÃ³digo 2FA para: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

            // Verificar se usuÃ¡rio tem WhatsApp cadastrado
            if (user.getWhatsapp() == null || user.getWhatsapp().isEmpty()) {
                return ResponseEntity.badRequest().body(SimpleResponseDTO.builder()
                        .message("WhatsApp nÃ£o cadastrado. Entre em contato com o administrador.")
                        .success(false)
                        .build());
            }

            // Gerar cÃ³digo
            TwoFactorCode twoFactorCode = twoFactorService.createCode(user, "ACTIVATION");

            log.info("ðŸ“± CÃ³digo 2FA gerado: {} - Enviando via WhatsApp para: {}", 
                    twoFactorCode.getCode(), user.getWhatsapp());

            // Enviar via WhatsApp usando BaileysRestService
            // ðŸ”’ ENCODING: Remover acentos e caracteres especiais para compatibilidade WhatsApp
            String message = String.format(
                "*SecuredGuard - Codigo de Ativacao*\n\n" +
                "Seu codigo de verificacao e: *%s*\n\n" +
                "Este codigo expira em 5 minutos.\n" +
                "Se voce nao solicitou este codigo, ignore esta mensagem.",
                twoFactorCode.getCode()
            );

            boolean sent = false;
            if (baileysRestService != null) {
                try {
                    sent = baileysRestService.sendTextMessage(user.getWhatsapp(), message);
                    if (sent) {
                        log.info("âœ… CÃ³digo 2FA enviado via WhatsApp com sucesso");
                    } else {
                        log.warn("âš ï¸ Falha ao enviar cÃ³digo via WhatsApp (serviÃ§o retornou false)");
                    }
                } catch (Exception e) {
                    log.error("âŒ Erro ao enviar cÃ³digo via WhatsApp: {}", e.getMessage(), e);
                }
            } else {
                log.warn("âš ï¸ BaileysRestService nÃ£o disponÃ­vel - cÃ³digo nÃ£o enviado via WhatsApp");
                log.info("ðŸ“± CÃ³digo para teste manual: {}", twoFactorCode.getCode());
            }

            return ResponseEntity.ok(SimpleResponseDTO.builder()
                    .message(String.format("CÃ³digo enviado para o WhatsApp: %s****%s", 
                            user.getWhatsapp().substring(0, 4), 
                            user.getWhatsapp().substring(user.getWhatsapp().length() - 2)))
                    .success(true)
                    .build());

        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao solicitar cÃ³digo 2FA: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(SimpleResponseDTO.builder()
                    .message("Erro ao enviar cÃ³digo: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Ativa 2FA", description = "Valida cÃ³digo e ativa autenticaÃ§Ã£o de dois fatores")
    @PostMapping("/activate-2fa")
    public ResponseEntity<SimpleResponseDTO> activateTwoFactor(
            @Valid @RequestBody TwoFactorActivationRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("ðŸ” Ativando 2FA para: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

            // Validar cÃ³digo
            boolean isValid = twoFactorService.validateCode(user, request.getCode());

            if (!isValid) {
                log.warn("âŒ CÃ³digo 2FA invÃ¡lido");
                return ResponseEntity.badRequest().body(SimpleResponseDTO.builder()
                        .message("CÃ³digo invÃ¡lido ou expirado")
                        .success(false)
                        .build());
            }

            // Ativar 2FA
            user.setTwoFactorEnabled(true);
            userRepository.save(user);

            log.info("âœ… 2FA ativado com sucesso para: {}", user.getUsername());
            
            // Log da atividade
            logService.logUserActivity(user.getUsername(), "TWO_FACTOR_ACTIVATED", 
                "AutenticaÃ§Ã£o de dois fatores ativada");

            return ResponseEntity.ok(SimpleResponseDTO.builder()
                    .message("AutenticaÃ§Ã£o de dois fatores ativada com sucesso!")
                    .success(true)
                    .build());

        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao ativar 2FA: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(SimpleResponseDTO.builder()
                    .message("Erro ao ativar 2FA: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }
}

