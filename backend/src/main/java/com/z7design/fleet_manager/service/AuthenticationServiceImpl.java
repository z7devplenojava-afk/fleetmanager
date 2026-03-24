package com.z7design.fleet_manager.service;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.AuthenticationRequest;
import com.z7design.fleet_manager.dto.AuthenticationResponse;
import com.z7design.fleet_manager.dto.EmpresaResponse;
import com.z7design.fleet_manager.dto.RegisterRequest;
import com.z7design.fleet_manager.dto.RefreshTokenRequest;
import com.z7design.fleet_manager.dto.UserResponse;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.enums.UserStatus;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.security.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserCustomPermissionService customPermissionService;
    private final LgpdConsentService lgpdConsentService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final UserCompanyResolver userCompanyResolver;

    @Override
    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        log.info("Starting user registration for username: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Username already exists: {}", request.getUsername());
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new IllegalArgumentException("Email already exists");
        }

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            log.warn("Full name is required for registration");
            throw new IllegalArgumentException("Full name is required");
        }

        java.util.List<String> requestedRoles = request.getRoles();
        java.util.Set<Role> userRoles;
        if (requestedRoles != null && !requestedRoles.isEmpty()) {
            userRoles = new java.util.HashSet<>(roleRepository.findByNames(requestedRoles));
            if (userRoles.isEmpty()) {
                log.error("Nenhum dos roles informados foi encontrado: {}", requestedRoles);
                throw new IllegalArgumentException("Nenhum dos roles informados foi encontrado: " + requestedRoles);
            }
        } else {
            Role defaultRole = roleRepository.findByName("COLABORADOR")
                    .orElseThrow(() -> new IllegalArgumentException("Role padrÃ£o COLABORADOR nÃ£o encontrado"));
            userRoles = java.util.Set.of(defaultRole);
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .name(request.getFullName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(userRoles)
                .status(UserStatus.ACTIVE)
                .active(true)
                .companyId(request.getCompanyId())
                .build();

        log.info("Saving user: {}", user.getUsername());
        User savedUser = userRepository.save(user);
        log.info("User saved successfully with ID: {}", savedUser.getId());

        // Verify the user was actually saved
        User verifyUser = userRepository.findById(savedUser.getId()).orElse(null);
        if (verifyUser == null) {
            log.error("User was not persisted to database after save!");
            throw new IllegalStateException("Failed to persist user to database");
        }
        log.info("User verified in database: {}", verifyUser.getUsername());

        String jwtToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        // Buscar permissÃµes customizadas
        java.util.List<String> customPermissions = customPermissionService.getActivePermissions(savedUser.getId());

        log.info("Registration completed successfully for user: {}", savedUser.getUsername());

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .username(savedUser.getUsername())
                        .email(savedUser.getEmail())
                        .fullName(savedUser.getName())
                        .roles(savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                        .customPermissions(customPermissions)
                        .build())
                .empresa(buildEmpresaResponse(savedUser, null))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            log.info("ðŸ” Tentando autenticar usuÃ¡rio: {}", request.getUsername());

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            log.info("✅ Usuário encontrado: {} (ID: {})", user.getUsername(), user.getId());
            log.info("🔐 DEBUG LOGIN - Stored Hash: {}", user.getPassword());
            log.info("🔐 DEBUG LOGIN - Active: {}, Status: {}, CompanyID: {}", user.isActive(), user.getStatus(),
                    user.getCompanyId());

            // Valida se o usuário tem permissão de login (exige empresa ou ser Admin)
            validateUserCompanyAccess(user, request.getCompanyId());

            String jwtToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            log.info("ðŸ”‘ Tokens gerados com sucesso");

            // Buscar permissÃµes customizadas (com tratamento de erro)
            java.util.List<String> customPermissions = java.util.Collections.emptyList();
            try {
                customPermissions = customPermissionService.getActivePermissions(user.getId());
                log.info("âœ… PermissÃµes customizadas carregadas: {}", customPermissions.size());
            } catch (Exception e) {
                log.error("âš ï¸ Erro ao buscar permissÃµes customizadas (usando lista vazia): {}", e.getMessage());
            }

            // Buscar roles (com verificaÃ§Ã£o de null)
            java.util.List<String> roles = java.util.Collections.emptyList();
            try {
                if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                    roles = user.getRoles().stream()
                            .filter(role -> role != null) // Filtrar roles nulas
                            .map(role -> {
                                try {
                                    return role.getName();
                                } catch (Exception e) {
                                    log.warn("âš ï¸ Erro ao obter nome da role: {}", e.getMessage());
                                    return null;
                                }
                            })
                            .filter(name -> name != null) // Filtrar nomes nulos
                            .collect(Collectors.toList());
                    log.info("âœ… Roles do usuÃ¡rio: {}", roles);
                } else {
                    log.warn("âš ï¸ UsuÃ¡rio {} nÃ£o possui roles cadastradas (roles Ã© null ou vazio)",
                            user.getUsername());
                }
            } catch (Exception e) {
                log.error("âš ï¸ Erro ao buscar roles (usando lista vazia): {}", e.getMessage(), e);
            }

            // Verificar status de LGPD e seguranÃ§a (com tratamento de erro)
            boolean requiresLgpdConsent = false;
            try {
                requiresLgpdConsent = !lgpdConsentService.hasAcceptedAllRequiredConsents(user.getId());
                log.info("âœ… Status LGPD verificado: requiresConsent={}", requiresLgpdConsent);
            } catch (Exception e) {
                log.error("âš ï¸ Erro ao verificar consentimento LGPD (assumindo false): {}", e.getMessage());
            }

            boolean requires2FA = false;
            try {
                requires2FA = twoFactorAuthService.is2FAEnabled(user.getId());
                log.info("âœ… Status 2FA verificado: enabled={}", requires2FA);
            } catch (Exception e) {
                log.error("âš ï¸ Erro ao verificar 2FA (assumindo false): {}", e.getMessage());
            }

            boolean requiresPasswordChange = user.getRequirePasswordChange() != null && user.getRequirePasswordChange();
            boolean firstAccessCompleted = user.getFirstAccessCompleted() != null && user.getFirstAccessCompleted();

            log.info("âœ… AutenticaÃ§Ã£o concluÃ­da com sucesso para usuÃ¡rio: {}", user.getUsername());

            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .refreshToken(refreshToken)
                    .user(UserResponse.builder()
                            .id(user.getId().toString())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .fullName(user.getName())
                            .roles(roles)
                            .customPermissions(customPermissions)
                            .build())
                    .empresa(buildEmpresaResponse(user, request.getCompanyId()))
                    .requiresLgpdConsent(requiresLgpdConsent)
                    .requires2FA(requires2FA)
                    .requiresPasswordChange(requiresPasswordChange)
                    .firstAccessCompleted(firstAccessCompleted)
                    .build();
        } catch (org.springframework.security.core.AuthenticationException e) {
            log.warn("âŒ Falha na autenticaÃ§Ã£o para usuÃ¡rio {}: {}", request.getUsername(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("ðŸ’¥ ERRO CRÃTICO NO LOGIN para usuÃ¡rio {}: {}", request.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Erro ao processar autenticaÃ§Ã£o: " + e.getMessage(), e);
        }
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);

        if (username != null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(refreshToken, userDetails)) {
                User user = (User) userDetails; // Cast to your User model if necessary
                String accessToken = jwtService.generateToken(user);
                String newRefreshToken = jwtService.generateRefreshToken(user);

                // Buscar permissÃµes customizadas
                java.util.List<String> customPermissions = customPermissionService.getActivePermissions(user.getId());

                return AuthenticationResponse.builder()
                        .token(accessToken)
                        .refreshToken(newRefreshToken)
                        .user(UserResponse.builder()
                                .id(user.getId() != null ? user.getId().toString() : null)
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .fullName(user.getName())
                                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                                .customPermissions(customPermissions)
                                .build())
                        .empresa(buildEmpresaResponse(user, null))
                        .build();
            }
        }
        throw new RuntimeException("Invalid Refresh Token");
    }

    @Override
    public User getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authentication found");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateUserCompanyAccess(User user, UUID requestedCompanyId) {
        // 1. Se for Flex Admin, Super Admin ou TI Suporte, permitir acesso direto
        // (Bypass)
        boolean isPrivileged = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(role -> "FLEX_ADMIN".equals(role.getName()) || "SUPER_ADMIN".equals(role.getName())
                        || "TI_SUPORTE".equals(role.getName()));

        if (isPrivileged) {
            log.info("ℹ️ Login permitido por regra de privilégio para usuário: {}", user.getUsername());
            return;
        }

        // 2. Se uma empresa específica foi solicitada, validar o acesso
        if (requestedCompanyId != null) {
            boolean hasAccess = employeeRepository.findByUser(user).stream()
                    .anyMatch(emp -> requestedCompanyId.equals(emp.getCompanyId()));

            if (!hasAccess) {
                log.warn("⛔ Bloqueio de Segurança: Usuário {} tentou logar na empresa {} sem permissão.",
                        user.getUsername(), requestedCompanyId);
                throw new org.springframework.security.authentication.BadCredentialsException(
                        "Acesso negado: Você não tem vínculo com a empresa selecionada.");
            }
            log.info("✅ Acesso validado para usuário {} na empresa {}", user.getUsername(), requestedCompanyId);
            return;
        }

        // 3. Se nenhuma empresa foi solicitada (legado ou erro), tentar resolver via
        // resolver
        UUID resolvedCompanyId = userCompanyResolver.resolveCompanyId(user);
        if (resolvedCompanyId == null) {
            log.warn("⛔ Bloqueio de Login: Usuário {} tentou logar sem empresa vinculada.",
                    user.getUsername());
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "Acesso negado: Usuário não possui empresa vinculada. Contate o suporte.");
        }
    }

    private EmpresaResponse buildEmpresaResponse(User user, UUID requestedCompanyId) {
        Optional<Company> companyOpt = requestedCompanyId != null
                ? userCompanyResolver.resolveSpecificCompany(user, requestedCompanyId)
                : userCompanyResolver.resolveCompany(user);

        return companyOpt.map(c -> {
            // Definir funcionalidades habilitadas (por enquanto, todas habilitadas)
            java.util.List<String> enabledFeatures = java.util.List.of(
                    "dashboard",
                    "operacional",
                    "manutencao",
                    "financeiro",
                    "rotas",
                    "relatorios");

            EmpresaResponse.EmpresaResponseBuilder builder = EmpresaResponse.builder()
                    .id(c.getId() != null ? c.getId().toString() : null)
                    .nome(c.getName())
                    .logoUrl(c.getLogoUrl())
                    .temaCor(c.getTemaCor() != null ? c.getTemaCor() : "dark")
                    .enabledFeatures(enabledFeatures);

            // Tentar encontrar o vínculo hierárquico (Filial/Unidade) do usuário
            // findByUser retorna uma List, então usamos stream para pegar o primeiro que
            // tenha unidade
            employeeRepository.findByUser(user).stream()
                    .filter(emp -> emp.getUnit() != null)
                    .findFirst()
                    .ifPresent(emp -> {
                        builder.unitName(emp.getUnit().getName());
                        if (emp.getUnit().getBranch() != null) {
                            builder.branchName(emp.getUnit().getBranch().getName());
                        }
                    });

            return builder.build();
        })
                .orElse(null);
    }
}
