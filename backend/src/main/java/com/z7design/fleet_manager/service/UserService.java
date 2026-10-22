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

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.UserStatus;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.model.Permission;
import com.z7design.fleet_manager.dto.ProfileUpdateRequest;
import com.z7design.fleet_manager.dto.CreateUserRequest;

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

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, RoleRepository roleRepository,
            CompanyRepository companyRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.companyRepository = companyRepository;
    }

    public Optional<User> findById(UUID id) {
        if (!isSuperAdmin() || TenantContext.isImpersonating()) {
            return userRepository.findById(id);
        }
        return withoutTenantFilter(() -> userRepository.findById(id));
    }

    public List<User> findAll() {
        if (!isSuperAdmin() || TenantContext.isImpersonating()) {
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
            return action.get();
        } finally {
            TenantContext.set(tenantId);
            TenantContext.setImpersonating(impersonating);
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
        return userRepository.findByUsername(auth.getName())
                .or(() -> userRepository.findByEmail(auth.getName()))
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

        System.out.println("ðŸ’¾ Salvando usuÃ¡rio no banco...");
        User savedUser = userRepository.save(user);
        System.out.println("âœ… UsuÃ¡rio salvo com ID: " + savedUser.getId());

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

        return userRepository.save(user);
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
        if (isSuperAdmin() && !TenantContext.isImpersonating()) {
            return withoutTenantFilter(() -> doUpdateFromRequest(id, request));
        }
        return doUpdateFromRequest(id, request);
    }

    private User doUpdateFromRequest(UUID id, com.z7design.fleet_manager.dto.UpdateUserRequest request) {
        log.info("Atualizando usuÃ¡rio {} com dados: name={}, email={}, username={}, roles={}",
                id, request.getName(), request.getEmail(), request.getUsername(), request.getRoles());

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

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
        } else if (request.getCompanyId() != null) {
            existingUser.setCompanyId(request.getCompanyId());
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

        try {
            User savedUser = userRepository.save(existingUser);
            log.info("UsuÃ¡rio {} atualizado com sucesso", id);
            return savedUser;
        } catch (Exception e) {
            log.error("Erro ao salvar usuÃ¡rio {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar usuÃ¡rio: " + e.getMessage(), e);
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
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        // Validar se o email nÃ£o estÃ¡ sendo usado por outro usuÃ¡rio
        if (!existingUser.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email jÃ¡ estÃ¡ em uso por outro usuÃ¡rio");
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
