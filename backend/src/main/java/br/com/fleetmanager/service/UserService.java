package br.com.fleetmanager.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.UserStatus;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.model.Role;
import br.com.fleetmanager.repository.RoleRepository;
import br.com.fleetmanager.model.Permission;
import br.com.fleetmanager.dto.ProfileUpdateRequest;

import lombok.RequiredArgsConstructor;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User create(User user) {
        // Validações básicas
        if (!StringUtils.hasText(user.getName())) {
            throw new IllegalArgumentException("Nome não pode ser nulo ou vazio");
        }
        
        if (!StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("Email não pode ser nulo ou vazio");
        }
        
        if (!StringUtils.hasText(user.getUsername())) {
            throw new IllegalArgumentException("Nome de usuário não pode ser nulo ou vazio");
        }
        
        if (!StringUtils.hasText(user.getPassword())) {
            throw new IllegalArgumentException("Senha não pode ser nula ou vazia");
        }
        
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new IllegalArgumentException("Função não pode ser nula");
        }
        
        // Buscar roles existentes pelo name
        var roleNames = user.getRoles().stream().map(Role::getName).toList();
        var rolesFromDb = roleRepository.findByNames(roleNames);
        if (rolesFromDb.isEmpty()) {
            throw new IllegalArgumentException("Nenhum role válido encontrado no banco");
        }
        user.setRoles(new java.util.HashSet<>(rolesFromDb));
        
        // Verificar se username já existe
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Nome de usuário já está em uso");
        }
        
        // Verificar se email já existe
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email já está em uso");
        }
        
        // Validar formato do email
        if (!user.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de email inválido");
        }
        
        // Validar força da senha
        if (user.getPassword().length() < 6) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 6 caracteres");
        }
        
        // Validar se a senha contém pelo menos uma maiúscula, uma minúscula, um número e um caractere especial
        if (!user.getPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
            throw new IllegalArgumentException("Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial");
        }
        
        // Definir valores padrão
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

    public RoleRepository getRoleRepository() {
        return roleRepository;
    }

    public Set<Permission> getUserPermissions(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getPermissions();
    }

    public Set<Permission> setUserPermissions(UUID userId, Set<Permission> permissions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        user.setPermissions(permissions);
        userRepository.save(user);
        return user.getPermissions();
    }

    public Set<Permission> addUserPermissions(UUID userId, Set<Permission> permissionsToAdd) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        user.getPermissions().addAll(permissionsToAdd);
        userRepository.save(user);
        return user.getPermissions();
    }

    public Set<Permission> removeUserPermissions(UUID userId, Set<Permission> permissionsToRemove) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        user.getPermissions().removeAll(permissionsToRemove);
        userRepository.save(user);
        return user.getPermissions();
    }

    /**
     * Atualiza o perfil do próprio usuário logado
     */
    public User updateProfile(UUID userId, ProfileUpdateRequest request) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Validar se o email não está sendo usado por outro usuário
        if (!existingUser.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email já está em uso por outro usuário");
            }
        }

        // Validar formato do email
        if (!request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de email inválido");
        }

        // Atualizar dados básicos
        existingUser.setName(request.getName().trim());
        existingUser.setEmail(request.getEmail().trim());
        existingUser.setWhatsapp(request.getWhatsapp() != null ? request.getWhatsapp().trim() : null);

        // Se está alterando a senha, validar e atualizar
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new IllegalArgumentException("Senha atual é obrigatória para alterar a senha");
            }

            // Verificar se a senha atual está correta
            if (!passwordEncoder.matches(request.getCurrentPassword(), existingUser.getPassword())) {
                throw new IllegalArgumentException("Senha atual incorreta");
            }

            // Validar força da nova senha
            if (request.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("Nova senha deve ter pelo menos 6 caracteres");
            }

            if (!request.getNewPassword().matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
                throw new IllegalArgumentException("Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial");
            }

            // Criptografar e definir nova senha
            existingUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return userRepository.save(existingUser);
    }
} 