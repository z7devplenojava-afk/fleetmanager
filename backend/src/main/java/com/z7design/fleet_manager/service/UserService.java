package com.z7design.fleet_manager.service;

import java.util.List;
import java.util.Optional;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
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

        // Permitir exceÃ§Ã£o para padrÃ£o cpf@2025
        boolean isCpfDefault = request.getPassword().matches("^\\d{11}@2025$");
        if (!isCpfDefault
                && !request.getPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
            throw new IllegalArgumentException(
                    "Senha deve conter pelo menos uma letra maiÃºscula, uma minÃºscula, um nÃºmero e um caractere especial");
        }

        // Buscar roles do banco de dados pelos nomes (Array de Strings)
        System.out.println("ðŸ” Buscando roles: " + request.getRoles());
        List<Role> rolesFromDb = roleRepository.findByNames(request.getRoles());
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

        // Criar usuÃ¡rio
        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .whatsapp(
                        request.getWhatsapp() != null && !request.getWhatsapp().trim().isEmpty() ? request.getWhatsapp()
                                : null)
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

        // Buscar roles existentes pelo name
        var roleNames = user.getRoles().stream().map(Role::getName).toList();
        var rolesFromDb = roleRepository.findByNames(roleNames);
        if (rolesFromDb.isEmpty()) {
            throw new IllegalArgumentException("Nenhum role vÃ¡lido encontrado no banco");
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

    public User updateFromRequest(UUID id, com.z7design.fleet_manager.dto.UpdateUserRequest request) {
        log.info("Atualizando usuÃ¡rio {} com dados: name={}, email={}, username={}, roles={}",
                id, request.getName(), request.getEmail(), request.getUsername(), request.getRoles());

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

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

        // Atualizar senha somente se fornecida
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Atualizar status se fornecido
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                existingUser.setStatus(UserStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Status de usuÃ¡rio invÃ¡lido: " + request.getStatus());
            }
        }

        // Atualizar empresa se fornecida (permitido apenas para Flex Admins - validado
        // no controller)
        if (request.getCompanyId() != null) {
            existingUser.setCompanyId(request.getCompanyId());
        }

        // Validar limite de usuários se o status mudou para ativo ou se a empresa mudou
        if (existingUser.isActive() && existingUser.getCompanyId() != null) {
            validateUserLimit(existingUser.getCompanyId());
        }

        // Atualizar roles se fornecidas
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            var roleNames = request.getRoles(); // JÃ¡ Ã© uma lista de strings
            var rolesFromDb = roleRepository.findByNames(roleNames);

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
        userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.deleteById(id);
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
                            company.getMaxUsers() + "). Contate o suporte da FlexBus para expandir seu plano.");
                }
            }
        });
    }
}
