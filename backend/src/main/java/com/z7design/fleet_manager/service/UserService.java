package com.z7design.fleet_manager.service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.function.Supplier;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.z7design.fleet_manager.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.hibernate.Filter;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.UserStatus;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.model.Permission;
import com.z7design.fleet_manager.dto.ProfileUpdateRequest;
import com.z7design.fleet_manager.dto.CreateUserRequest;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final java.util.Set<String> ADMIN_ROLE_NAMES = java.util.Set.of(
            "SUPER_ADMIN", "FLEX_ADMIN", "COMPANY_ADMIN", "ADMIN");
    private static final java.util.Set<String> GLOBAL_MANAGER_ROLE_NAMES = java.util.Set.of(
            "SUPER_ADMIN", "FLEX_ADMIN");
    private static final java.util.Set<String> TENANT_MANAGER_ROLE_NAMES = java.util.Set.of(
            "COMPANY_ADMIN", "ADMIN");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, RoleRepository roleRepository,
            CompanyRepository companyRepository, EmployeeRepository employeeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
    }

    public void autoLinkEmployeeIfMatched(User user) {
        if (user == null || user.getId() == null) return;
        // REGRA: Usuário sem empresa (Acesso Global) não deve ser auto-vinculado a funcionário de empresa específica
        if (user.getCompanyId() == null) {
            log.debug("AutoLink ignorado para usuário @{} pois está sem empresa (Acesso Global)", user.getUsername());
            return;
        }
        try {
            String cleanCpf = user.getCpf() != null ? user.getCpf().replaceAll("\\D", "") : "";
            if (cleanCpf.length() < 11 && user.getUsername() != null) {
                cleanCpf = user.getUsername().replaceAll("\\D", "");
            }
            Employee emp = null;
            if (cleanCpf.length() >= 11) {
                emp = employeeRepository.findByCpfGlobal(cleanCpf).orElse(null);
            }
            if (emp == null && user.getEmail() != null && !user.getEmail().isBlank()) {
                emp = employeeRepository.findByEmail(user.getEmail().trim()).orElse(null);
            }
            if (emp == null && user.getName() != null && !user.getName().isBlank()) {
                var emps = employeeRepository.findByNameContainingIgnoreCase(user.getName().trim());
                if (!emps.isEmpty()) {
                    emp = emps.get(0);
                }
            }
            if (emp != null) {
                UUID empCompanyId = emp.getCompany() != null ? emp.getCompany().getId() : null;
                // REGRA: Usuário só pode ser vinculado a funcionário da mesma empresa
                if (empCompanyId == null || !user.getCompanyId().equals(empCompanyId)) {
                    log.info("AutoLink recusado: Funcionário {} pertence à empresa {} e Usuário @{} pertence à empresa {}",
                            emp.getName(), empCompanyId, user.getCompanyId());
                    return;
                }

                if (emp.getUser() == null || !user.getId().equals(emp.getUser().getId())) {
                    emp.setUser(user);
                    employeeRepository.save(emp);
                    log.info("🔗 Vínculo estabelecido com sucesso: Funcionário {} ({}) vinculado ao Usuário @{}", emp.getName(), emp.getId(), user.getUsername());
                }
                if ((user.getCpf() == null || user.getCpf().isBlank()) && emp.getDocument() != null && !emp.getDocument().isBlank()) {
                    user.setCpf(emp.getDocument());
                    userRepository.save(user);
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Não foi possível auto-vincular funcionário ao usuário {}: {}", user.getUsername(), e.getMessage());
        }
    }

    public Optional<User> findById(UUID id) {
        if (!isSuperAdmin()) {
            return userRepository.findById(id).or(() -> userRepository.findByIdNative(id));
        }
        return withoutTenantFilter(() -> userRepository.findByIdNative(id).or(() -> userRepository.findById(id)));
    }

    public List<User> findAll() {
        if (!isSuperAdmin()) {
            return userRepository.findAll();
        }
        return withoutTenantFilter(userRepository::findAll);
    }

    private <T> T withoutTenantFilter(Supplier<T> action) {
        UUID tenantId = TenantContext.get();
        boolean impersonating = TenantContext.isImpersonating();
        try {
            TenantContext.set(null);
            TenantContext.setImpersonating(false);
            disableHibernateTenantFilter();
            return action.get();
        } finally {
            TenantContext.set(tenantId);
            TenantContext.setImpersonating(impersonating);
            restoreHibernateTenantFilter(tenantId);
        }
    }

    private void disableHibernateTenantFilter() {
        try {
            if (entityManager != null) {
                Session session = entityManager.unwrap(Session.class);
                if (session != null) {
                    session.disableFilter("tenantFilter");
                    log.debug("TenantFilter desabilitado manualmente na sessao Hibernate");
                }
            }
        } catch (Exception e) {
            log.debug("Erro ao desabilitar tenantFilter na sessao Hibernate: {}", e.getMessage());
        }
    }

    private void restoreHibernateTenantFilter(UUID companyId) {
        try {
            if (entityManager != null) {
                Session session = entityManager.unwrap(Session.class);
                if (session != null) {
                    if (companyId != null) {
                        Filter filter = session.enableFilter("tenantFilter");
                        filter.setParameter("companyId", companyId);
                        log.debug("TenantFilter reabilitado para empresa {} na sessao Hibernate", companyId);
                    } else {
                        session.disableFilter("tenantFilter");
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Erro ao restaurar tenantFilter na sessao Hibernate: {}", e.getMessage());
        }
    }

    private boolean isSuperAdmin() {
        return getCurrentRoleNames().contains("SUPER_ADMIN");
    }

    private java.util.Set<String> getCurrentRoleNames() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return java.util.Collections.emptySet();
        }
        return auth.getAuthorities().stream()
                .map(authority -> normalizeRoleName(authority.getAuthority()))
                .filter(StringUtils::hasText)
                .collect(java.util.stream.Collectors.toSet());
    }

    private String normalizeRoleName(String role) {
        if (!StringUtils.hasText(role)) {
            return "";
        }
        String normalized = role.trim().toUpperCase();
        return normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;
    }

    private boolean isAdminRoleName(String role) {
        return ADMIN_ROLE_NAMES.contains(normalizeRoleName(role));
    }

    private boolean isCurrentUserGlobalManager() {
        return getCurrentRoleNames().stream().anyMatch(GLOBAL_MANAGER_ROLE_NAMES::contains);
    }

    private boolean isCurrentUserTenantManager() {
        return getCurrentRoleNames().stream().anyMatch(TENANT_MANAGER_ROLE_NAMES::contains);
    }

    private boolean hasAdminRole(User user) {
        return user != null && user.getRoles() != null && user.getRoles().stream()
                .filter(java.util.Objects::nonNull)
                .map(Role::getName)
                .anyMatch(this::isAdminRoleName);
    }

    public User getCurrentUserOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Usuário não autenticado.");
        }
        if (auth.getPrincipal() instanceof User user) {
            return user;
        }
        String username = auth.getName();
        String cleanDigits = username != null ? username.replaceAll("\\D", "") : "";
        return userRepository.findByIdentifierNative(username, cleanDigits)
                .or(() -> userRepository.findByUsernameNative(username))
                .or(() -> userRepository.findByEmailNative(username))
                .or(() -> userRepository.findByUsername(username))
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new AccessDeniedException("Usuário autenticado não encontrado."));
    }

    public UUID getCurrentCompanyId() {
        User currentUser = getCurrentUserOrThrow();
        return currentUser.getCompanyId() != null ? currentUser.getCompanyId() : TenantContext.get();
    }

    public void assertCanCreateUser(CreateUserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dados do usuário não fornecidos");
        }

        if (!isSuperAdmin()) {
            if (!isCurrentUserGlobalManager() && !isCurrentUserTenantManager()) {
                throw new AccessDeniedException("Apenas administradores podem criar usuários.");
            }
            boolean assignsAdminRole = request.getRoles() != null && request.getRoles().stream()
                    .anyMatch(this::isAdminRoleName);
            if (assignsAdminRole) {
                throw new AccessDeniedException("Somente SUPER_ADMIN pode criar contas de administrador.");
            }
        }

        if (isCurrentUserTenantManager() && !isCurrentUserGlobalManager()) {
            UUID currentCompanyId = getCurrentCompanyId();
            if (currentCompanyId == null) {
                throw new AccessDeniedException("Administrador sem empresa vinculada não pode criar usuários.");
            }
            if (request.getCompanyId() != null && !currentCompanyId.equals(request.getCompanyId())) {
                throw new AccessDeniedException("Não é permitido criar usuários em outra empresa.");
            }
            request.setCompanyId(currentCompanyId);
        }
    }

    public void assertCanManageUser(User targetUser) {
        if (targetUser == null) {
            throw new AccessDeniedException("Usuário não encontrado.");
        }

        User currentUser = getCurrentUserOrThrow();
        boolean isSelf = currentUser.getId() != null && currentUser.getId().equals(targetUser.getId());

        if (isSuperAdmin()) {
            return;
        }

        if (hasAdminRole(targetUser) && !isSelf) {
            throw new AccessDeniedException("Somente SUPER_ADMIN pode gerenciar contas de administrador.");
        }

        if (isCurrentUserGlobalManager()) {
            return;
        }

        if (isCurrentUserTenantManager()) {
            UUID currentCompanyId = getCurrentCompanyId();
            if (currentCompanyId == null
                    || targetUser.getCompanyId() == null
                    || !currentCompanyId.equals(targetUser.getCompanyId())) {
                throw new AccessDeniedException("Não é permitido gerenciar usuários de outra empresa.");
            }
            return;
        }

        throw new AccessDeniedException("Apenas administradores podem gerenciar usuários.");
    }

    private void assertCanAssignRoles(User targetUser, List<String> requestedRoles) {
        if (requestedRoles == null || requestedRoles.isEmpty() || isSuperAdmin()) {
            return;
        }

        java.util.Set<String> requestedAdminRoles = requestedRoles.stream()
                .filter(java.util.Objects::nonNull)
                .map(this::normalizeRoleName)
                .filter(ADMIN_ROLE_NAMES::contains)
                .collect(java.util.stream.Collectors.toSet());

        if (requestedAdminRoles.isEmpty()) {
            return;
        }

        java.util.Set<String> existingAdminRoles = targetUser.getRoles() == null
                ? java.util.Collections.emptySet()
                : targetUser.getRoles().stream()
                        .filter(java.util.Objects::nonNull)
                        .map(Role::getName)
                        .map(this::normalizeRoleName)
                        .filter(ADMIN_ROLE_NAMES::contains)
                        .collect(java.util.stream.Collectors.toSet());

        if (!existingAdminRoles.containsAll(requestedAdminRoles)) {
            throw new AccessDeniedException("Somente SUPER_ADMIN pode atribuir perfis de administrador.");
        }
    }

    private void assertCanUpdateUser(User targetUser, com.z7design.fleet_manager.dto.UpdateUserRequest request) {
        assertCanManageUser(targetUser);
        assertCanAssignRoles(targetUser, request.getRoles());

        if (isCurrentUserTenantManager() && !isCurrentUserGlobalManager()) {
            UUID currentCompanyId = getCurrentCompanyId();
            if (Boolean.TRUE.equals(request.getRemoveCompany())) {
                throw new AccessDeniedException("Não é permitido desvincular usuários da empresa.");
            }
            if (request.getCompanyId() != null
                    && (currentCompanyId == null || !currentCompanyId.equals(request.getCompanyId()))) {
                throw new AccessDeniedException("Não é permitido mover usuários para outra empresa.");
            }
        }
    }

    private void assertCanDeleteUser(User targetUser) {
        assertCanManageUser(targetUser);
        User currentUser = getCurrentUserOrThrow();
        if (currentUser.getId() != null && currentUser.getId().equals(targetUser.getId())) {
            throw new AccessDeniedException("Não é permitido excluir sua própria conta de usuário.");
        }
    }

    public User createFromRequest(CreateUserRequest request) {
        System.out.println("ðŸ”§ UserService.createFromRequest - Iniciando");

        // ValidaÃ§Ãµes bÃ¡sicas
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Nome nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(request.getUsername())) {
            throw new IllegalArgumentException("Nome de usuÃ¡rio nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Senha nÃ£o pode ser nula ou vazia");
        }

        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new IllegalArgumentException("Pelo menos uma funÃ§Ã£o deve ser selecionada");
        }

        assertCanCreateUser(request);

        // Verificar se username jÃ¡ existe
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Nome de usuÃ¡rio jÃ¡ estÃ¡ em uso");
        }

        // Verificar se email jÃ¡ existe
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email jÃ¡ estÃ¡ em uso");
        }

        // Validar formato do email
        if (!request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de email invÃ¡lido");
        }

        // Validar forÃ§a da senha
        if (request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 6 caracteres");
        }

        // Permitir exceção para padrão cpf@2025/2026 e senha padrão corporativa FluxBus@2026
        boolean isCpfDefault = request.getPassword().matches("^\\d{11}@202[0-9]$") || "FluxBus@2026".equals(request.getPassword());
        if (!isCpfDefault
                && !request.getPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
            throw new IllegalArgumentException(
                    "Senha deve conter pelo menos uma letra maiÃºscula, uma minÃºscula, um nÃºmero e um caractere especial");
        }

        // Buscar roles do banco de dados pelos nomes (Array de Strings)
        System.out.println("ðŸ” Buscando roles: " + request.getRoles());
        List<Role> rolesFromDb = findRolesByCandidateNames(request.getRoles());
        System.out.println("âœ… Roles encontrados: " + rolesFromDb.size());

        if (rolesFromDb.isEmpty()) {
            throw new IllegalArgumentException(
                    "Nenhuma funÃ§Ã£o vÃ¡lida encontrada. Certifique-se de que as funÃ§Ãµes existem no banco de dados.");
        }

        // Determinar status do usuÃ¡rio
        UserStatus status = UserStatus.ACTIVE;
        if (StringUtils.hasText(request.getStatus())) {
            try {
                status = UserStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Status de usuÃ¡rio invÃ¡lido: " + request.getStatus());
            }
        }

        // Criar usuário
        User user = User.builder()
                .name(request.getName())
                .cpf(request.getCpf() != null && !request.getCpf().trim().isEmpty() ? request.getCpf().trim() : null)
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .whatsapp(
                        request.getWhatsapp() != null && !request.getWhatsapp().trim().isEmpty() ? request.getWhatsapp()
                                : null)
                .whatsappConsent(false)
                .roles(new java.util.HashSet<>(rolesFromDb))
                .active(request.getActive() != null ? request.getActive() : true)
                .status(status)
                .companyId(request.getCompanyId())
                .build();

        // Validar limite de usuários se houver empresa vinculada
        if (user.getCompanyId() != null && user.isActive()) {
            validateUserLimit(user.getCompanyId());
        }

        System.out.println("💾 Salvando usuário no banco...");
        User savedUser = userRepository.save(user);
        System.out.println("✅ Usuário salvo com ID: " + savedUser.getId());

        // Se employeeId foi explicitamente fornecido, vincular imediatamente
        if (request.getEmployeeId() != null) {
            final UUID empId = request.getEmployeeId();
            employeeRepository.findByIdGlobal(empId)
                    .or(() -> employeeRepository.findById(empId))
                    .ifPresent(emp -> {
                        emp.setUser(savedUser);
                        employeeRepository.save(emp);
                        log.info("Funcionário {} vinculado diretamente no cadastro do usuário {}", emp.getName(), savedUser.getUsername());
                        if (savedUser.getCpf() == null && emp.getDocument() != null) {
                            savedUser.setCpf(emp.getDocument());
                            userRepository.save(savedUser);
                        }
                    });
        } else {
            autoLinkEmployeeIfMatched(savedUser);
        }

        return savedUser;
    }

    public User create(User user) {
        // ValidaÃ§Ãµes bÃ¡sicas
        if (!StringUtils.hasText(user.getName())) {
            throw new IllegalArgumentException("Nome nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("Email nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(user.getUsername())) {
            throw new IllegalArgumentException("Nome de usuÃ¡rio nÃ£o pode ser nulo ou vazio");
        }

        if (!StringUtils.hasText(user.getPassword())) {
            throw new IllegalArgumentException("Senha nÃ£o pode ser nula ou vazia");
        }

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new IllegalArgumentException("FunÃ§Ã£o nÃ£o pode ser nula");
        }

        // Buscar roles existentes pelo name (flexível)
        var roleNames = user.getRoles().stream().map(Role::getName).toList();
        var rolesFromDb = findRolesByCandidateNames(roleNames);
        if (rolesFromDb.isEmpty()) {
            throw new IllegalArgumentException("Nenhum role válido encontrado no banco");
        }
        user.setRoles(new java.util.HashSet<>(rolesFromDb));

        // Verificar se username jÃ¡ existe
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Nome de usuÃ¡rio jÃ¡ estÃ¡ em uso");
        }

        // Verificar se email jÃ¡ existe
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email jÃ¡ estÃ¡ em uso");
        }

        // Validar formato do email
        if (!user.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de email invÃ¡lido");
        }

        // Validar forÃ§a da senha
        if (user.getPassword().length() < 6) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 6 caracteres");
        }

        // Permitir exceÃ§Ã£o para padrÃ£o cpf@2025 usado em criaÃ§Ã£o automÃ¡tica de
        // COLABORADOR
        boolean isCpfDefault = user.getPassword().matches("^\\d{11}@2025$");
        if (!isCpfDefault && !user.getPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
            throw new IllegalArgumentException(
                    "Senha deve conter pelo menos uma letra maiÃºscula, uma minÃºscula, um nÃºmero e um caractere especial");
        }

        // Definir valores padrÃ£o
        user.setActive(true);
        user.setStatus(UserStatus.ACTIVE);

        // Criptografar senha
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepository.save(user);
        autoLinkEmployeeIfMatched(savedUser);
        return savedUser;
    }

    public User update(UUID id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!StringUtils.hasText(user.getName())) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }

        existingUser.setUsername(user.getUsername());
        existingUser.setEmail(user.getEmail());
        existingUser.setName(user.getName());
        // Buscar roles existentes pelo name
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            var roleNames = user.getRoles().stream().map(Role::getName).toList();
            var rolesFromDb = roleRepository.findByNames(roleNames);
            existingUser.setRoles(new java.util.HashSet<>(rolesFromDb));
        }
        existingUser.setStatus(user.getStatus());

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    @Transactional
    public User updateFromRequest(UUID id, com.z7design.fleet_manager.dto.UpdateUserRequest request) {
        if (isSuperAdmin()) {
            return withoutTenantFilter(() -> doUpdateFromRequest(id, request));
        }
        return doUpdateFromRequest(id, request);
    }

    private User doUpdateFromRequest(UUID id, com.z7design.fleet_manager.dto.UpdateUserRequest request) {
        log.info("Atualizando usuário {} com dados: name={}, email={}, username={}, roles={}",
                id, request.getName(), request.getEmail(), request.getUsername(), request.getRoles());

        User existingUser = userRepository.findByIdNative(id)
                .or(() -> userRepository.findById(id))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        assertCanUpdateUser(existingUser, request);

        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Nome nÃ£o pode ser vazio");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email nÃ£o pode ser vazio");
        }

        if (!StringUtils.hasText(request.getUsername())) {
            throw new IllegalArgumentException("Username nÃ£o pode ser vazio");
        }

        // Validar username Ãºnico (se estiver sendo alterado)
        String existingUsername = existingUser.getUsername();
        String newUsername = request.getUsername();
        if (existingUsername == null || newUsername == null || !existingUsername.equals(newUsername)) {
            if (newUsername != null) {
                Optional<User> userWithUsername = userRepository.findByUsername(newUsername);
                if (userWithUsername.isPresent() && !userWithUsername.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Nome de usuÃ¡rio jÃ¡ estÃ¡ em uso");
                }
            }
        }

        // Validar email Ãºnico (se estiver sendo alterado)
        String existingEmail = existingUser.getEmail();
        String newEmail = request.getEmail();
        if (existingEmail == null || newEmail == null || !existingEmail.equals(newEmail)) {
            if (newEmail != null) {
                Optional<User> userWithEmail = userRepository.findByEmail(newEmail);
                if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Email jÃ¡ estÃ¡ em uso");
                }
            }
        }

        // Atualizar campos bÃ¡sicos
        existingUser.setName(request.getName());
        existingUser.setEmail(request.getEmail());
        existingUser.setUsername(request.getUsername());

        // Atualizar WhatsApp se fornecido (aceita vazio ou null)
        if (request.getWhatsapp() != null) {
            existingUser.setWhatsapp(request.getWhatsapp().trim().isEmpty() ? null : request.getWhatsapp());
        }

        boolean wasActive = existingUser.isActive();
        UUID oldCompanyId = existingUser.getCompanyId();

        // Atualizar senha somente se fornecida
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Atualizar status e active se fornecidos
        if (request.getActive() != null) {
            existingUser.setActive(request.getActive());
            existingUser.setStatus(request.getActive() ? UserStatus.ACTIVE : UserStatus.INACTIVE);
        } else if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                UserStatus statusEnum = UserStatus.valueOf(request.getStatus().toUpperCase());
                existingUser.setStatus(statusEnum);
                existingUser.setActive(statusEnum == UserStatus.ACTIVE);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Status de usuário inválido: " + request.getStatus());
            }
        }

        // Atualizar empresa se fornecida (ou desvincular empresa se removeCompany for true)
        if (Boolean.TRUE.equals(request.getRemoveCompany())) {
            existingUser.setCompanyId(null);
            // REGRA: Usuário sem empresa (Acesso Global) não pode ter funcionário de empresa vinculado
            employeeRepository.findByUserIdGlobal(id).ifPresent(emp -> {
                emp.setUser(null);
                employeeRepository.save(emp);
                log.info("Desvinculado funcionário {} do usuário {} porque o usuário agora está sem empresa (Acesso Global)",
                        emp.getName(), existingUser.getUsername());
            });
        } else if (request.getCompanyId() != null) {
            UUID oldComp = existingUser.getCompanyId();
            existingUser.setCompanyId(request.getCompanyId());
            // Se a empresa mudou, desvincula qualquer funcionário que pertencia à empresa antiga
            if (oldComp != null && !oldComp.equals(request.getCompanyId())) {
                employeeRepository.findByUserIdGlobal(id).ifPresent(emp -> {
                    UUID empCompId = emp.getCompany() != null ? emp.getCompany().getId() : null;
                    if (empCompId != null && !empCompId.equals(request.getCompanyId())) {
                        emp.setUser(null);
                        employeeRepository.save(emp);
                        log.info("Desvinculado funcionário {} do usuário {} devido à alteração de empresa",
                                emp.getName(), existingUser.getUsername());
                    }
                });
            }
        }

        boolean isNowActive = existingUser.isActive();
        UUID newCompanyId = existingUser.getCompanyId();

        // Validar limite de usuários somente se o usuário está sendo ativado (era inativo)
        // ou se a empresa mudou (se já era ativo na mesma empresa, não consome nova licença)
        if (isNowActive && newCompanyId != null) {
            boolean becameActive = (!wasActive && isNowActive);
            boolean companyChanged = (oldCompanyId == null || !oldCompanyId.equals(newCompanyId));
            if (becameActive || companyChanged) {
                validateUserLimit(newCompanyId);
            }
        }

        // Atualizar roles se fornecidas
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            var roleNames = request.getRoles(); // Já é uma lista de strings
            var rolesFromDb = findRolesByCandidateNames(roleNames);

            // Validar se pelo menos um role foi encontrado
            if (rolesFromDb.isEmpty()) {
                throw new IllegalArgumentException("Nenhum role vÃ¡lido encontrado. Roles fornecidos: " + roleNames);
            }

            // Verificar se todos os roles solicitados foram encontrados
            if (rolesFromDb.size() < roleNames.size()) {
                var foundRoleNames = rolesFromDb.stream().map(role -> role.getName())
                        .collect(java.util.stream.Collectors.toSet());
                var missingRoles = roleNames.stream().filter(name -> !foundRoleNames.contains(name))
                        .collect(java.util.stream.Collectors.toList());
                log.warn("Alguns roles nÃ£o foram encontrados: {}", missingRoles);
            }

            existingUser.setRoles(new java.util.HashSet<>(rolesFromDb));
            log.info("Roles atualizadas para usuÃ¡rio {}: {}", id,
                    rolesFromDb.stream().map(r -> r.getName()).collect(java.util.stream.Collectors.toList()));
        } else {
            log.info("Roles nÃ£o fornecidas no request, mantendo roles existentes para usuÃ¡rio {}", id);
        }

        // Atualizar campos de informaÃ§Ãµes adicionais (opcionais - sÃ³ atualiza se
        // fornecidos)
        if (request.getAvatar() != null) {
            existingUser.setAvatar(request.getAvatar().trim().isEmpty() ? null : request.getAvatar());
        }

        if (request.getDepartment() != null) {
            existingUser.setDepartment(request.getDepartment().trim().isEmpty() ? null : request.getDepartment());
        }

        if (request.getPosition() != null) {
            existingUser.setPosition(request.getPosition().trim().isEmpty() ? null : request.getPosition());
        }

        if (request.getEmployeeCode() != null) {
            existingUser.setEmployeeCode(request.getEmployeeCode().trim().isEmpty() ? null : request.getEmployeeCode());
        }

        if (request.getPhone() != null) {
            existingUser.setPhone(request.getPhone().trim().isEmpty() ? null : request.getPhone());
        }

        if (request.getAddress() != null) {
            existingUser.setAddress(request.getAddress().trim().isEmpty() ? null : request.getAddress());
        }

        if (request.getCpf() != null) {
            existingUser.setCpf(request.getCpf().trim().isEmpty() ? null : request.getCpf().trim());
        }

        try {
            User savedUser = userRepository.save(existingUser);
            final UUID userId = savedUser.getId();
            final String username = savedUser.getUsername();

            // Gerenciar vínculo de funcionário na atualização de usuário
            if (Boolean.TRUE.equals(request.getRemoveEmployee()) || savedUser.getCompanyId() == null) {
                employeeRepository.findByUserIdGlobal(userId).ifPresent(emp -> {
                    emp.setUser(null);
                    employeeRepository.save(emp);
                    log.info("Desvinculado funcionário {} do usuário {}", emp.getName(), username);
                });
            } else if (request.getEmployeeId() != null) {
                UUID targetEmpId = request.getEmployeeId();
                // 1. Desvincular funcionário antigo vinculado a este usuário, se diferente
                employeeRepository.findByUserIdGlobal(userId).ifPresent(oldEmp -> {
                    if (!oldEmp.getId().equals(targetEmpId)) {
                        oldEmp.setUser(null);
                        employeeRepository.save(oldEmp);
                        log.info("Desvinculado funcionário anterior {} do usuário {}", oldEmp.getName(), username);
                    }
                });

                // 2. Localizar o funcionário selecionado
                Employee targetEmp = employeeRepository.findByIdGlobal(targetEmpId)
                        .or(() -> employeeRepository.findById(targetEmpId))
                        .orElse(null);

                if (targetEmp != null) {
                    UUID userCompId = savedUser.getCompanyId();
                    UUID empCompId = targetEmp.getCompany() != null ? targetEmp.getCompany().getId() : null;

                    // REGRA: Usuário só pode ser vinculado a funcionário da mesma empresa
                    if (userCompId == null && empCompId != null) {
                        throw new IllegalArgumentException("Um usuário sem empresa (Acesso Global) não pode ser vinculado a um funcionário de empresa específica.");
                    }
                    if (userCompId != null && (empCompId == null || !userCompId.equals(empCompId))) {
                        throw new IllegalArgumentException("Um usuário só pode ser vinculado a um funcionário da mesma empresa.");
                    }

                    targetEmp.setUser(savedUser);
                    employeeRepository.save(targetEmp);
                    log.info("Funcionário {} vinculado com sucesso ao usuário {}", targetEmp.getName(), username);

                    // Sincronizar dados vazios do usuário a partir do funcionário
                    boolean userChanged = false;
                    if ((savedUser.getWhatsapp() == null || savedUser.getWhatsapp().isBlank()) && targetEmp.getPhone() != null && !targetEmp.getPhone().isBlank()) {
                        savedUser.setWhatsapp(targetEmp.getPhone().replaceAll("\\D", ""));
                        userChanged = true;
                    }
                    if ((savedUser.getEmail() == null || savedUser.getEmail().isBlank()) && targetEmp.getEmail() != null && !targetEmp.getEmail().isBlank()) {
                        savedUser.setEmail(targetEmp.getEmail().trim());
                        userChanged = true;
                    }
                    if ((savedUser.getCpf() == null || savedUser.getCpf().isBlank()) && targetEmp.getDocument() != null && !targetEmp.getDocument().isBlank()) {
                        savedUser.setCpf(targetEmp.getDocument());
                        userChanged = true;
                    }
                    if (userChanged) {
                        savedUser = userRepository.save(savedUser);
                    }
                }
            } else {
                autoLinkEmployeeIfMatched(savedUser);
            }

            log.info("Usuário {} atualizado com sucesso", id);
            return savedUser;
        } catch (Exception e) {
            log.error("Erro ao salvar usuário {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar usuário: " + e.getMessage(), e);
        }
    }

    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        assertCanDeleteUser(user);
        userRepository.deleteById(id);
    }

    public Map<String, Object> deleteBulk(List<UUID> ids, String currentUsername) {
        if (ids == null || ids.isEmpty()) {
            return Map.of("deletedCount", 0, "message", "Nenhum ID fornecido");
        }

        for (UUID id : ids) {
            userRepository.findById(id).ifPresent(this::assertCanManageUser);
        }

        UUID currentUserId = null;
        if (currentUsername != null) {
            currentUserId = userRepository.findByUsername(currentUsername)
                    .map(User::getId)
                    .orElse(null);
        }

        int deletedCount = 0;
        int skippedCount = 0;

        for (UUID id : ids) {
            if (currentUserId != null && currentUserId.equals(id)) {
                log.warn("Ignorando auto-exclusão do usuário logado: {}", id);
                skippedCount++;
                continue;
            }
            try {
                if (userRepository.existsById(id)) {
                    userRepository.deleteById(id);
                    deletedCount++;
                }
            } catch (Exception e) {
                log.error("Erro ao excluir usuário {}: {}", id, e.getMessage());
                skippedCount++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("deletedCount", deletedCount);
        result.put("skippedCount", skippedCount);
        result.put("message", String.format("%d usuário(s) excluído(s) com sucesso.", deletedCount));
        return result;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> searchUsers(String query) {
        return userRepository.searchUsers(query);
    }

    public Optional<User> findByEmployeeCpf(String cpf) {
        return userRepository.findByEmployeeCpf(cpf);
    }

    public RoleRepository getRoleRepository() {
        return roleRepository;
    }

    public java.util.Set<Permission> getUserPermissions(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        return user.getPermissions();
    }

    public java.util.Set<Permission> setUserPermissions(UUID userId, java.util.Set<Permission> permissions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        user.setPermissions(permissions);
        userRepository.save(user);
        return user.getPermissions();
    }

    public java.util.Set<Permission> addUserPermissions(UUID userId, java.util.Set<Permission> permissionsToAdd) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        user.getPermissions().addAll(permissionsToAdd);
        userRepository.save(user);
        return user.getPermissions();
    }

    public java.util.Set<Permission> removeUserPermissions(UUID userId, java.util.Set<Permission> permissionsToRemove) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        user.getPermissions().removeAll(permissionsToRemove);
        userRepository.save(user);
        return user.getPermissions();
    }

    /**
     * Atualiza o perfil do prÃ³prio usuÃ¡rio logado
     */
    public User updateProfile(UUID userId, ProfileUpdateRequest request) {
        User existingUser = userRepository.findByIdNative(userId)
                .or(() -> userRepository.findById(userId))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Validar se o email não está sendo usado por outro usuário
        if (!existingUser.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            Optional<User> other = userRepository.findByEmailNative(request.getEmail().trim())
                    .or(() -> userRepository.findByEmail(request.getEmail().trim()));
            if (other.isPresent() && !other.get().getId().equals(userId)) {
                throw new IllegalArgumentException("Email já está em uso por outro usuário");
            }
        }

        // Validar formato do email
        if (!request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de email invÃ¡lido");
        }

        // Atualizar dados bÃ¡sicos
        existingUser.setName(request.getName().trim());
        existingUser.setEmail(request.getEmail().trim());
        existingUser.setWhatsapp(request.getWhatsapp() != null ? request.getWhatsapp().trim() : null);

        // Se estÃ¡ alterando a senha, validar e atualizar
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new IllegalArgumentException("Senha atual Ã© obrigatÃ³ria para alterar a senha");
            }

            // Verificar se a senha atual estÃ¡ correta
            if (!passwordEncoder.matches(request.getCurrentPassword(), existingUser.getPassword())) {
                throw new IllegalArgumentException("Senha atual incorreta");
            }

            // Validar forÃ§a da nova senha
            if (request.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("Nova senha deve ter pelo menos 6 caracteres");
            }

            if (!request.getNewPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
                throw new IllegalArgumentException(
                        "Nova senha deve conter pelo menos uma letra maiÃºscula, uma minÃºscula, um nÃºmero e um caractere especial");
            }

            // Criptografar e definir nova senha
            existingUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return userRepository.save(existingUser);
    }

    private void validateUserLimit(UUID companyId) {
        companyRepository.findById(companyId).ifPresent(company -> {
            if (company.getMaxUsers() != null && company.getMaxUsers() > 0) {
                long activeUsersCount = userRepository.countByCompanyIdAndActiveTrue(companyId);
                if (activeUsersCount >= company.getMaxUsers()) {
                    log.warn("Limite de usuários atingido para a empresa {}: {}/{}",
                            company.getName(), activeUsersCount, company.getMaxUsers());
                    throw new IllegalStateException("Limite de usuários atingido para esta empresa (" +
                            company.getMaxUsers() + "). Contate o suporte da FluxBus para expandir seu plano.");
                }
            }
        });
    }

    private List<Role> findRolesByCandidateNames(List<String> requestedRoles) {
        if (requestedRoles == null || requestedRoles.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        java.util.Set<String> candidates = new java.util.HashSet<>();
        for (String r : requestedRoles) {
            if (!StringUtils.hasText(r)) continue;
            String trimmed = r.trim();
            candidates.add(trimmed);
            if (trimmed.startsWith("ROLE_")) {
                candidates.add(trimmed.substring(5));
            } else {
                candidates.add("ROLE_" + trimmed);
            }
        }
        return roleRepository.findByNames(new java.util.ArrayList<>(candidates));
    }
}
