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
import org.springframework.transaction.annotation.Propagation;

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
import com.z7design.fleet_manager.repository.CompanyRepository;
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
    private final CompanyRepository companyRepository;
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

        // SEGURANÇA: O endpoint /api/auth/register é público (permitAll). NÃO aceitar
        // roles do corpo da requisição — isso permitia auto-registro como SUPER_ADMIN
        // (escalação de privilégio). Todo novo usuário recebe o role padrão.
        // Atribuição de roles administrativos deve ocorrer apenas via UserController
        // (autenticado e com permissão USERS_CREATE/ADMIN).
        java.util.Set<Role> userRoles;
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            log.warn("⚠️ Registro de '{}' ignorou roles solicitadas no body ({}). Roles só podem ser atribuídas por administradores.",
                    request.getUsername(), request.getRoles());
        }
        Role defaultRole = roleRepository.findByName("COLABORADOR")
                .orElseThrow(() -> new IllegalArgumentException("Role padrão COLABORADOR não encontrado"));
        userRoles = java.util.Set.of(defaultRole);

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
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            log.info("ðŸ” Tentando autenticar usuÃ¡rio: {}", request.getUsername());

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            String target = request.getUsername() != null ? request.getUsername().trim() : "";
            User user = userRepository.findByUsernameOrEmailIgnoreCase(target)
                    .or(() -> userRepository.findByUsername(target))
                    .or(() -> userRepository.findByEmail(target))
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Usuário não encontrado: " + target));

            log.info("✅ Usuário encontrado: {} (ID: {})", user.getUsername(), user.getId());
            // SEGURANÇA: log do hash BCrypt da senha removido (vazava credencial em logs)
            log.info("🔐 Login - Active: {}, Status: {}, CompanyID: {}", user.isActive(), user.getStatus(),
                    user.getCompanyId());

            // Valida se o usuário tem permissão de login (exige empresa ou ser Admin)
            validateUserCompanyAccess(user, request.getCompanyId());

            String jwtToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            log.info("🔑 Tokens gerados com sucesso");

            // Buscar permissões customizadas (com tratamento de erro)
            java.util.List<String> customPermissions = java.util.Collections.emptyList();
            try {
                customPermissions = customPermissionService.getActivePermissions(user.getId());
                log.info("✅ Permissões customizadas carregadas: {}", customPermissions.size());
            } catch (Exception e) {
                log.error("⚠️ Erro ao buscar permissões customizadas (usando lista vazia): {}", e.getMessage());
            }

            // Buscar roles (com verificação de null)
            java.util.List<String> roles = java.util.Collections.emptyList();
            try {
                if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                    roles = user.getRoles().stream()
                            .filter(role -> role != null) // Filtrar roles nulas
                            .map(role -> {
                                try {
                                    return role.getName();
                                } catch (Exception e) {
                                    log.warn("⚠️ Erro ao obter nome da role: {}", e.getMessage());
                                    return null;
                                }
                            })
                            .filter(name -> name != null) // Filtrar nomes nulos
                            .collect(Collectors.toList());
                    log.info("✅ Roles do usuário: {}", roles);
                } else {
                    log.warn("⚠️ Usuário {} não possui roles cadastradas (roles é null ou vazio)",
                            user.getUsername());
                }
            } catch (Exception e) {
                log.error("⚠️ Erro ao buscar roles (usando lista vazia): {}", e.getMessage(), e);
            }

            // Verificar status de LGPD e segurança (com tratamento de erro)
            boolean requiresLgpdConsent = false;
            try {
                // SUPER_ADMIN tem acesso administrativo irrestrito e não deve ser bloqueado por tela de consentimento
                boolean isSuperAdmin = roles != null && roles.stream().anyMatch(r -> 
                    r.equalsIgnoreCase("SUPER_ADMIN") || r.equalsIgnoreCase("ROLE_SUPER_ADMIN")
                );
                if (!isSuperAdmin) {
                    requiresLgpdConsent = !lgpdConsentService.hasAcceptedAllRequiredConsents(user.getId());
                }
                log.info("✅ Status LGPD verificado: requiresConsent={}", requiresLgpdConsent);
            } catch (Exception e) {
                log.error("⚠️ Erro ao verificar consentimento LGPD (assumindo false): {}", e.getMessage());
            }

            boolean requires2FA = false;
            try {
                requires2FA = twoFactorAuthService.is2FAEnabled(user.getId());
                log.info("✅ Status 2FA verificado: enabled={}", requires2FA);
            } catch (Exception e) {
                log.error("⚠️ Erro ao verificar 2FA (assumindo false): {}", e.getMessage());
            }

            boolean requiresPasswordChange = user.getRequirePasswordChange() != null && user.getRequirePasswordChange();
            boolean firstAccessCompleted = user.getFirstAccessCompleted() != null && user.getFirstAccessCompleted();

            log.info("✅ Autenticação concluída com sucesso para usuário: {}", user.getUsername());

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
            log.warn("❌ Falha na autenticação para usuário {}: {}", request.getUsername(), e.getMessage());
            throw e;
        } catch (Throwable e) {
            log.error("💥 ERRO CRÍTICO NO LOGIN para usuário {}: {}", request.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Erro ao processar autenticação: " + e.getMessage(), e);
        }
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);

        if (username != null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            // SEGURANÇA: exige typ=refresh — um access token (ou refresh roubado em API
            // de login) não pode ser usado aqui
            if (jwtService.isTokenValid(refreshToken, userDetails, JwtService.TOKEN_TYPE_REFRESH)) {
                User user = (User) userDetails; // Cast to your User model if necessary
                String accessToken = jwtService.generateToken(user);
                String newRefreshToken = jwtService.generateRefreshToken(user);

                // Buscar permissões customizadas
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

    private boolean isSuperAdmin(User user) {
        return userCompanyResolver.isPrivilegedUser(user);
    }

    private void validateUserCompanyAccess(User user, UUID requestedCompanyId) {
        // 1. Se for Super Admin, Admin ou TI Suporte, NÃO é obrigado a pertencer a nenhuma empresa
        if (isSuperAdmin(user)) {
            log.info("ℹ️ Login liberado: usuário {} é privilegiado/SUPER_ADMIN (não exige vínculo com empresa)", user.getUsername());
            return;
        }

        // 2. Se uma empresa específica foi solicitada, validar o acesso
        if (requestedCompanyId != null) {
            boolean hasAccess = requestedCompanyId.equals(user.getCompanyId()) ||
                    (user.getCompany() != null && requestedCompanyId.equals(user.getCompany().getId()));

            if (!hasAccess && user.getId() != null) {
                try {
                    hasAccess = employeeRepository.findCompanyIdsByUserIdNative(user.getId()).contains(requestedCompanyId);
                } catch (Throwable e) {
                    log.warn("⚠️ Erro ao verificar employee por usuário (nativo): {}", e.getMessage());
                }
            }

            if (!hasAccess) {
                // Fallback se só existir uma empresa cadastrada no sistema
                try {
                    if (companyRepository != null && companyRepository.count() <= 1) {
                        hasAccess = true;
                    }
                } catch (Throwable ignored) {
                    hasAccess = true;
                }
            }

            if (!hasAccess) {
                log.warn("⛔ Bloqueio de Segurança: Usuário {} tentou logar na empresa {} sem permissão.",
                        user.getUsername(), requestedCompanyId);
                throw new org.springframework.security.authentication.BadCredentialsException(
                        "Acesso negado: Você não tem vínculo com a empresa selecionada.");
            }
            log.info("✅ Acesso validado para usuário {} na empresa {}", user.getUsername(), requestedCompanyId);
            return;
        }

        // 3. Se nenhuma empresa foi solicitada, tentar resolver empresa padrão
        UUID resolvedCompanyId = userCompanyResolver.resolveCompanyId(user);
        if (resolvedCompanyId == null) {
            log.warn("⚠️ Usuário {} logando sem empresa vinculada.", user.getUsername());
            return;
        }
    }

    private EmpresaResponse buildEmpresaResponse(User user, UUID requestedCompanyId) {
        try {
            boolean privileged = isSuperAdmin(user);

            Optional<Company> companyOpt = requestedCompanyId != null
                    ? userCompanyResolver.resolveSpecificCompany(user, requestedCompanyId)
                    : userCompanyResolver.resolveCompany(user);

            if (companyOpt.isEmpty()) {
                if (privileged) {
                    return EmpresaResponse.builder()
                            .id(null)
                            .nome("FluxBus Global")
                            .temaCor("dark")
                            .enabledFeatures(java.util.List.of(
                                    "dashboard", "operacional", "manutencao", "financeiro", "rotas", "relatorios"
                            ))
                            .build();
                }
                return null;
            }

            Company c = companyOpt.get();
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

            // Apenas para usuários NÃO privilegiados tenta consultar unidade/filial (query nativa leve)
            if (!privileged && user.getId() != null) {
                try {
                    java.util.List<Object[]> rows = employeeRepository.findUnitAndBranchNamesByUserIdNative(user.getId());
                    if (rows != null && !rows.isEmpty()) {
                        Object[] row = rows.get(0);
                        if (row.length > 0 && row[0] != null) {
                            builder.unitName(row[0].toString());
                        }
                        if (row.length > 1 && row[1] != null) {
                            builder.branchName(row[1].toString());
                        }
                    }
                } catch (Throwable e) {
                    log.warn("⚠️ Não foi possível obter detalhes hierárquicos do funcionário (nativo): {}", e.getMessage());
                }
            }

            return builder.build();
        } catch (Throwable e) {
            log.warn("⚠️ Erro ao montar dados da empresa no login (prosseguindo sem empresa): {}", e.getMessage());
            return null;
        }
    }
}

