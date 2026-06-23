package com.z7design.fleet_manager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.z7design.fleet_manager.dto.AuthenticationRequest;
import com.z7design.fleet_manager.dto.AuthenticationResponse;
import com.z7design.fleet_manager.dto.RegisterRequest;
import com.z7design.fleet_manager.dto.RefreshTokenRequest;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.LogService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = { RequestMethod.GET, RequestMethod.POST,
        RequestMethod.OPTIONS })
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AutenticaÃ§Ã£o", description = "Endpoints para registro, login e renovaÃ§Ã£o de tokens.")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final LogService logService;
    // Temporary injections for debugging/fixing
    private final com.z7design.fleet_manager.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Operation(summary = "Realiza o login de um usuÃ¡rio", description = "Autentica um usuÃ¡rio com nome de usuÃ¡rio e senha e retorna tokens de acesso e refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login bem-sucedido", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationResponse.class), examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"testuser\", \"email\": \"test@example.com\", \"fullName\": \"Test User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "401", description = "Credenciais invÃ¡lidas", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Invalid username or password.\", \"path\": \"/api/auth/login\"}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisiÃ§Ã£o de autenticaÃ§Ã£o", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationRequest.class), examples = @ExampleObject(value = "{\"username\": \"testuser\", \"password\": \"Password123!\"}")))
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthenticationRequest request) {
        String username = request != null ? request.getUsername() : "unknown";
        log.info("ðŸ” Iniciando processo de login para usuÃ¡rio: {}", username);

        try {
            log.debug("ðŸ” Chamando authenticationService.authenticate para usuÃ¡rio: {}", username);
            AuthenticationResponse response = authenticationService.authenticate(request);
            log.info("âœ… AutenticaÃ§Ã£o bem-sucedida para usuÃ¡rio: {}", username);

            // Log da atividade de login bem-sucedido (nÃ£o deve bloquear o login)
            try {
                logService.logUserActivity(username, "LOGIN",
                        "Login realizado com sucesso via " + username);
                log.debug("âœ… Log de atividade registrado para usuÃ¡rio: {}", username);
            } catch (Exception logError) {
                // Log do erro mas nÃ£o interromper o fluxo
                log.warn("âš ï¸ Erro ao registrar log de atividade (nÃ£o crÃ­tico) para usuÃ¡rio {}: {}",
                        username, logError.getMessage());
                // NÃ£o propagar o erro - o login foi bem-sucedido
            }

            return ResponseEntity.ok(response);
        } catch (org.springframework.security.core.AuthenticationException e) {
            String errorMessage = e.getMessage();

            // Tratamento específico para usuário sem empresa
            if (errorMessage != null && errorMessage.contains("não possui empresa vinculada")) {
                log.warn("⛔ Usuário {} sem empresa vinculada. Retornando 403 específico.", username);
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error", "Forbidden",
                                "message", errorMessage,
                                "code", "NO_COMPANY_LINKED"));
            }
            // ExceÃ§Ãµes de autenticaÃ§Ã£o devem retornar 401, nÃ£o 500
            log.warn("âŒ Tentativa de login falhou para usuÃ¡rio {}: {}", username, e.getMessage());

            // Tentar registrar log de falha (nÃ£o deve bloquear a resposta)
            try {
                logService.logUserActivity(username, "LOGIN_FAILED",
                        "Tentativa de login falhou: " + e.getMessage());
            } catch (Exception logError) {
                log.debug("âš ï¸ Erro ao registrar log de falha (nÃ£o crÃ­tico): {}", logError.getMessage());
            }

            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized", "message", "Invalid username or password."));
        } catch (Exception e) {
            // Log detalhado do erro
            log.error("ðŸ’¥ ERRO CRÃTICO ao processar login para usuÃ¡rio {}: {}", username, e.getMessage(), e);
            log.error("ðŸ’¥ Stack trace completo:", e);

            // Retornar erro 500 como Ãºltimo recurso, mas garantir que seja tratado
            try {
                logService.logUserActivity(username, "LOGIN_FAILED",
                        "Erro ao processar login: " + e.getMessage());
            } catch (Exception logError) {
                log.warn("âš ï¸ Erro ao registrar log de falha (nÃ£o crÃ­tico): {}", logError.getMessage());
            }

            // Retornar erro estruturado com mais detalhes para diagnÃ³stico
            String errorMessage = "Erro ao processar login. Tente novamente mais tarde.";
            errorMessage += " Detalhes: " + e.getMessage() + " | Cause: "
                    + (e.getCause() != null ? e.getCause().toString() : "null");
            if (e.getStackTrace().length > 0) {
                errorMessage += " | Stack: " + e.getStackTrace()[0].toString();
            }

            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", errorMessage,
                            "timestamp", java.time.Instant.now().toString()));
        }
    }

    @Operation(summary = "Registra um novo usuÃ¡rio", description = "Cria uma nova conta de usuÃ¡rio com as informaÃ§Ãµes fornecidas e retorna tokens de acesso e refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro bem-sucedido", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationResponse.class), examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"newuser\", \"email\": \"new@example.com\", \"fullName\": \"New User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "400", description = "Dados de registro invÃ¡lidos ou usuÃ¡rio/email existente", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 400, \"error\": \"Validation Error\", \"message\": \"One or more fields are invalid.\", \"path\": \"/api/auth/register\", \"details\": {\"password\": \"Password must contain...\"}}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisiÃ§Ã£o de registro de usuÃ¡rio", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RegisterRequest.class), examples = @ExampleObject(value = "{\"username\": \"newuser\", \"password\": \"StrongPass1!\", \"email\": \"new@example.com\", \"fullName\": \"New User\", \"role\": \"VIGILANTE\"}")))
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        AuthenticationResponse response = authenticationService.register(request);

        // Log da atividade de registro
        logService.logUserActivity(request.getUsername(), "REGISTER",
                "Novo usuÃ¡rio registrado: " + request.getFullName() + " (" + request.getEmail() + ")");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Renova o token de acesso usando um token de refresh", description = "Fornece um token de refresh para obter um novo token de acesso e um novo token de refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token renovado com sucesso", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationResponse.class), examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"testuser\", \"email\": \"test@example.com\", \"fullName\": \"Test User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "401", description = "Token de refresh invÃ¡lido ou expirado", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Invalid Refresh Token\", \"path\": \"/api/auth/refresh-token\"}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisiÃ§Ã£o para renovaÃ§Ã£o de token", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RefreshTokenRequest.class), examples = @ExampleObject(value = "{\"refreshToken\": \"eyJhbGci...\"}")))
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthenticationResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        AuthenticationResponse response = authenticationService.refreshToken(request);

        // Log da atividade de refresh token
        if (response.getUser() != null) {
            logService.logUserActivity(response.getUser().getUsername(), "REFRESH_TOKEN",
                    "Token de acesso renovado");
        }

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Teste de saÃºde da API", description = "Endpoint simples para testar se a API estÃ¡ funcionando.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API funcionando", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"status\": \"ok\", \"message\": \"API is running\"}")))
    })
    @GetMapping("/test/health")
    public ResponseEntity<Object> testHealth() {
        return ResponseEntity.ok(Map.of("status", "ok", "message", "API is running"));
    }

    @GetMapping("/test/hash")
    public ResponseEntity<String> generateHash(@org.springframework.web.bind.annotation.RequestParam String password) {
        // Obter o encoder do contexto se possÃ­vel, ou criar um novo para teste
        org.springframework.security.crypto.password.PasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        return ResponseEntity.ok(encoder.encode(password));
    }

    @GetMapping("/test/fix-jose-ramos")
    public ResponseEntity<String> fixJoseRamos() {
        try {
            com.z7design.fleet_manager.model.User user = userRepository.findByUsername("jose.ramos")
                    .orElseThrow(() -> new RuntimeException("User jose.ramos not found"));

            user.setPassword(passwordEncoder.encode("FluxBus@2026"));
            user.setActive(true);
            user.setStatus(com.z7design.fleet_manager.model.enums.UserStatus.ACTIVE);
            userRepository.save(user);

            return ResponseEntity.ok("User jose.ramos fixed successfully. Password set to FluxBus@2026");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "NÃ£o autenticado"));
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        List<String> permissions = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Map<String, Object> userInfo = Map.of(
                "username", authentication.getName(),
                "authenticated", authentication.isAuthenticated(),
                "authorities", permissions,
                "principal", authentication.getPrincipal().toString());

        return ResponseEntity.ok(userInfo);
    }
}
