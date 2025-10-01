package br.com.fleetmanager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.fleetmanager.service.AuthenticationService;
import br.com.fleetmanager.service.LogService;

import br.com.fleetmanager.dto.AuthenticationRequest;
import br.com.fleetmanager.dto.AuthenticationResponse;
import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.dto.RefreshTokenRequest;
import br.com.fleetmanager.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints para registro, login e renovação de tokens.")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final LogService logService;

    @Operation(summary = "Realiza o login de um usuário",
               description = "Autentica um usuário com nome de usuário e senha e retorna tokens de acesso e refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login bem-sucedido",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthenticationResponse.class),
                            examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"testuser\", \"email\": \"test@example.com\", \"fullName\": \"Test User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Invalid username or password.\", \"path\": \"/api/auth/login\"}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisição de autenticação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationRequest.class),
                    examples = @ExampleObject(value = "{\"username\": \"testuser\", \"password\": \"Password123!\"}")))
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        try {
            AuthenticationResponse response = authenticationService.authenticate(request);
            
            // Log da atividade de login bem-sucedido
            logService.logUserActivity(request.getUsername(), "LOGIN", 
                "Login realizado com sucesso via " + request.getUsername());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log da tentativa de login falhada
            logService.logUserActivity(request.getUsername(), "LOGIN_FAILED", 
                "Tentativa de login falhou: " + e.getMessage());
            throw e;
        }
    }

    @Operation(summary = "Registra um novo usuário",
               description = "Cria uma nova conta de usuário com as informações fornecidas e retorna tokens de acesso e refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro bem-sucedido",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthenticationResponse.class),
                            examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"newuser\", \"email\": \"new@example.com\", \"fullName\": \"New User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "400", description = "Dados de registro inválidos ou usuário/email existente",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 400, \"error\": \"Validation Error\", \"message\": \"One or more fields are invalid.\", \"path\": \"/api/auth/register\", \"details\": {\"password\": \"Password must contain...\"}}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisição de registro de usuário",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = RegisterRequest.class),
                    examples = @ExampleObject(value = "{\"username\": \"newuser\", \"password\": \"StrongPass1!\", \"email\": \"new@example.com\", \"fullName\": \"New User\", \"role\": \"VIGILANTE\"}")))
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        AuthenticationResponse response = authenticationService.register(request);
        
        // Log da atividade de registro
        logService.logUserActivity(request.getUsername(), "REGISTER", 
            "Novo usuário registrado: " + request.getFullName() + " (" + request.getEmail() + ")");
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Renova o token de acesso usando um token de refresh",
               description = "Fornece um token de refresh para obter um novo token de acesso e um novo token de refresh.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token renovado com sucesso",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthenticationResponse.class),
                            examples = @ExampleObject(value = "{\"token\": \"eyJhbGci...\", \"refreshToken\": \"eyJhbGci...\", \"user\": {\"username\": \"testuser\", \"email\": \"test@example.com\", \"fullName\": \"Test User\", \"role\": \"VIGILANTE\"}}"))),
            @ApiResponse(responseCode = "401", description = "Token de refresh inválido ou expirado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\": \"2025-06-17T19:00:00.000\", \"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Invalid Refresh Token\", \"path\": \"/api/auth/refresh-token\"}")))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Objeto de requisição para renovação de token",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = RefreshTokenRequest.class),
                    examples = @ExampleObject(value = "{\"refreshToken\": \"eyJhbGci...\"}")))
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

    @Operation(summary = "Teste de saúde da API",
               description = "Endpoint simples para testar se a API está funcionando.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API funcionando",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\"status\": \"ok\", \"message\": \"API is running\"}")))
    })
    @GetMapping("/test/health")
    public ResponseEntity<Object> testHealth() {
        return ResponseEntity.ok(Map.of("status", "ok", "message", "API is running"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Não autenticado"));
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        List<String> permissions = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Map<String, Object> userInfo = Map.of(
            "username", authentication.getName(),
            "authenticated", authentication.isAuthenticated(),
            "authorities", permissions,
            "principal", authentication.getPrincipal().toString()
        );

        return ResponseEntity.ok(userInfo);
    }
} 