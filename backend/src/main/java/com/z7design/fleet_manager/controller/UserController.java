package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.UserListResponseDTO;
import com.z7design.fleet_manager.dto.UserGroupDTO;
import com.z7design.fleet_manager.dto.ProfileUpdateRequest;
import com.z7design.fleet_manager.dto.ProfileResponse;
import com.z7design.fleet_manager.dto.UpdateUserRequest;
import com.z7design.fleet_manager.dto.CreateUserRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.UserService;
import com.z7design.fleet_manager.service.UserOnlineStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Objects;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "UsuÃ¡rios", description = "Endpoints para gestÃ£o de usuÃ¡rios")
public class UserController {

    private final UserService userService;
    private final UserOnlineStatusService userOnlineStatusService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar usuÃ¡rios", description = "Retorna uma lista de todos os usuÃ¡rios. Permite acesso para usuÃ¡rios autenticados (necessÃ¡rio para chat)")
    public ResponseEntity<List<UserListResponseDTO>> getAllUsers() {
        List<User> users = userService.findAll();
        List<UserListResponseDTO> dtos = users.stream()
                .map(this::convertToDTO)
                .filter(dto -> dto != null)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar usuÃ¡rio por ID", description = "Retorna um usuÃ¡rio especÃ­fico pelo ID. Permite acesso para usuÃ¡rios autenticados (necessÃ¡rio para chat)")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            // Validar ID
            if (id == null || id.trim().isEmpty()) {
                log.warn("ID de usuÃ¡rio invÃ¡lido: {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "ID de usuÃ¡rio invÃ¡lido"));
            }

            UUID userId;
            try {
                userId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                log.warn("ID de usuÃ¡rio invÃ¡lido (formato UUID): {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "ID de usuÃ¡rio invÃ¡lido"));
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                log.error("AutenticaÃ§Ã£o Ã© null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "NÃ£o autenticado"));
            }

            boolean isColaborador = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));

            User user = userService.findById(userId)
                    .orElse(null);

            if (user == null) {
                log.warn("UsuÃ¡rio nÃ£o encontrado: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "UsuÃ¡rio nÃ£o encontrado"));
            }

            // Colaborador sÃ³ pode ver seu prÃ³prio perfil
            if (isColaborador && !auth.getName().equals(user.getUsername())) {
                log.warn("Acesso negado: colaborador {} tentou acessar usuÃ¡rio {}", auth.getName(),
                        user.getUsername());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Acesso negado"));
            }

            UserListResponseDTO dto = convertToDTO(user);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Erro ao buscar usuÃ¡rio por ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao buscar usuÃ¡rio: "
                            + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido")));
        }
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuÃ¡rio por username", description = "Retorna um usuÃ¡rio especÃ­fico pelo username")
    public ResponseEntity<UserListResponseDTO> getUserByUsername(@PathVariable String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isColaborador = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));

        // Colaborador sÃ³ pode buscar seu prÃ³prio username
        if (isColaborador && !auth.getName().equals(username)) {
            return ResponseEntity.status(403).build();
        }

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuÃ¡rio por email", description = "Retorna um usuÃ¡rio especÃ­fico pelo email")
    public ResponseEntity<UserListResponseDTO> getUserByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuÃ¡rios", description = "Busca usuÃ¡rios por nome, email ou username com filtro dinÃ¢mico")
    public ResponseEntity<List<UserListResponseDTO>> searchUsers(
            @RequestParam(name = "query", required = false) String query) {
        List<User> users;

        if (query == null || query.trim().isEmpty()) {
            users = userService.findAll();
        } else {
            users = userService.searchUsers(query.trim());
        }

        List<UserListResponseDTO> dtos = users.stream()
                .map(this::convertToDTO)
                .filter(dto -> dto != null)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/cpf/{cpf}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuÃ¡rio por CPF", description = "Busca usuÃ¡rio atravÃ©s do CPF do funcionÃ¡rio associado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "UsuÃ¡rio encontrado"),
            @ApiResponse(responseCode = "404", description = "UsuÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UserListResponseDTO> getUserByCpf(@PathVariable String cpf) {
        User user = userService.findByEmployeeCpf(cpf)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado para o CPF informado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USERS_CREATE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Criar usuÃ¡rio", description = "Cria um novo usuÃ¡rio no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "UsuÃ¡rio criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UserListResponseDTO> create(@Valid @RequestBody CreateUserRequest request) {
        try {
            System.out.println("âœ… UserController.create - Iniciando criaÃ§Ã£o de usuÃ¡rio");
            System.out.println(
                    "ðŸ“‹ Dados: " + request.getName() + " | " + request.getEmail() + " | " + request.getUsername());
            System.out.println("ðŸ“± WhatsApp: " + request.getWhatsapp());
            System.out.println("ðŸ” Roles: " + request.getRoles());

            User createdUser = userService.createFromRequest(request);
            System.out.println("âœ… UsuÃ¡rio criado: " + createdUser.getId());

            return ResponseEntity.status(201).body(convertToDTO(createdUser));
        } catch (Exception e) {
            System.err.println("âŒ Erro ao criar usuÃ¡rio: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao criar usuÃ¡rio: " + e.getMessage(), e);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USERS_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Atualizar usuÃ¡rio", description = "Atualiza os dados de um usuÃ¡rio existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "UsuÃ¡rio atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "UsuÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            // Validar ID
            if (id == null || id.trim().isEmpty()) {
                log.warn("ID de usuÃ¡rio invÃ¡lido: {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "ID de usuÃ¡rio invÃ¡lido"));
            }

            UUID userId;
            try {
                userId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                log.warn("ID de usuÃ¡rio invÃ¡lido (formato UUID): {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "ID de usuÃ¡rio invÃ¡lido"));
            }

            if (request == null) {
                log.warn("Request body Ã© null para atualizaÃ§Ã£o de usuÃ¡rio {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Dados de atualizaÃ§Ã£o nÃ£o fornecidos"));
            }

            // Validar campos obrigatÃ³rios antes de chamar o service
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                log.warn("Nome Ã© obrigatÃ³rio para atualizaÃ§Ã£o de usuÃ¡rio {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Nome Ã© obrigatÃ³rio"));
            }

            User updatedUser;
            try {
                updatedUser = userService.updateFromRequest(userId, request);
            } catch (RuntimeException e) {
                // RuntimeException geralmente indica usuÃ¡rio nÃ£o encontrado
                if (e.getMessage() != null && e.getMessage().contains("nÃ£o encontrado")) {
                    log.warn("UsuÃ¡rio nÃ£o encontrado para atualizaÃ§Ã£o: {}", id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", e.getMessage()));
                }
                throw e; // Re-throw para ser tratado pelo catch genÃ©rico
            }

            if (updatedUser == null) {
                log.warn("UsuÃ¡rio nÃ£o encontrado para atualizaÃ§Ã£o: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "UsuÃ¡rio nÃ£o encontrado"));
            }

            return ResponseEntity.ok(convertToDTO(updatedUser));
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validaÃ§Ã£o ao atualizar usuÃ¡rio {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Dados invÃ¡lidos"));
        } catch (RuntimeException e) {
            log.error("Erro de runtime ao atualizar usuÃ¡rio {}: {}", id, e.getMessage(), e);
            // Retornar erro especÃ­fico baseado na mensagem
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Erro ao atualizar usuÃ¡rio";
            if (errorMessage.contains("nÃ£o encontrado") || errorMessage.contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", errorMessage));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", errorMessage));
        } catch (Exception e) {
            log.error("Erro ao atualizar usuÃ¡rio {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao atualizar usuÃ¡rio: "
                            + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido")));
        }
    }

    /**
     * MÃ©todo helper para converter User para UserListResponseDTO
     */
    private UserListResponseDTO convertToDTO(User user) {
        if (user == null) {
            return null;
        }

        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        // Tratar roles de forma segura
        try {
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                List<String> roleNames = user.getRoles().stream()
                        .filter(role -> role != null)
                        .map(role -> {
                            try {
                                return role.getName();
                            } catch (Exception e) {
                                log.warn("Erro ao obter nome da role: {}", e.getMessage());
                                return null;
                            }
                        })
                        .filter(name -> name != null)
                        .collect(java.util.stream.Collectors.toList());
                dto.setRoles(roleNames);
            } else {
                dto.setRoles(java.util.Collections.emptyList());
            }
        } catch (Exception e) {
            log.warn("Erro ao processar roles, usando lista vazia: {}", e.getMessage());
            dto.setRoles(java.util.Collections.emptyList());
        }

        // Campos de informaÃ§Ãµes adicionais
        dto.setAvatar(user.getAvatar());
        dto.setDepartment(user.getDepartment());
        dto.setPosition(user.getPosition());
        dto.setEmployeeCode(user.getEmployeeCode());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());

        // Status online/offline
        try {
            UUID userId = UUID.fromString(dto.getId());
            dto.setIsOnline(userOnlineStatusService.isUserOnline(userId));
        } catch (Exception e) {
            log.warn("Erro ao verificar status online do usuÃ¡rio {}: {}", user.getId(), e.getMessage());
            dto.setIsOnline(false);
        }

        // Grupos do usuÃ¡rio
        try {
            if (user.getGroups() != null && !user.getGroups().isEmpty()) {
                List<UserGroupDTO> groupDTOs = user.getGroups().stream()
                        .filter(Objects::nonNull)
                        .map(group -> {
                            UserGroupDTO g = new UserGroupDTO();
                            g.setId(group.getId());
                            g.setName(group.getGroupName() != null ? group.getGroupName().name() : null);
                            g.setGroupName(group.getGroupName() != null ? group.getGroupName().name() : null);
                            g.setDisplayName(group.getDisplayName());
                            g.setDescription(group.getDescription());
                            g.setPermissions(group.getPermissions());
                            // userCount pode ser preenchido em endpoints especÃ­ficos de grupos
                            return g;
                        })
                        .collect(java.util.stream.Collectors.toList());
                dto.setGroups(groupDTOs);
            } else {
                dto.setGroups(java.util.Collections.emptyList());
            }
        } catch (Exception e) {
            log.warn("Erro ao processar grupos do usuÃ¡rio {}, usando lista vazia: {}", user.getId(), e.getMessage());
            dto.setGroups(java.util.Collections.emptyList());
        }

        return dto;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USERS_DELETE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Excluir usuÃ¡rio", description = "Exclui um usuÃ¡rio do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "UsuÃ¡rio excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "UsuÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    @Operation(summary = "Buscar prÃ³prio perfil", description = "Retorna as informaÃ§Ãµes do perfil do usuÃ¡rio logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil encontrado com sucesso"),
            @ApiResponse(responseCode = "401", description = "NÃ£o autenticado"),
            @ApiResponse(responseCode = "404", description = "UsuÃ¡rio nÃ£o encontrado")
    })
    public ResponseEntity<ProfileResponse> getProfile() {
        // Obter o usuÃ¡rio atual do contexto de seguranÃ§a
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        // Construir resposta
        ProfileResponse response = ProfileResponse.builder()
                .id(currentUser.getId())
                .username(currentUser.getUsername())
                .name(currentUser.getName())
                .email(currentUser.getEmail())
                .whatsapp(currentUser.getWhatsapp())
                .active(currentUser.isActive())
                .roles(currentUser.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(java.util.stream.Collectors.toList()))
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    @Operation(summary = "Atualizar prÃ³prio perfil", description = "Permite ao usuÃ¡rio atualizar suas prÃ³prias informaÃ§Ãµes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "401", description = "NÃ£o autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        // Obter o usuÃ¡rio atual do contexto de seguranÃ§a
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        // Atualizar o perfil
        User updatedUser = userService.updateProfile(currentUser.getId(), request);

        // Construir resposta
        ProfileResponse response = ProfileResponse.builder()
                .id(updatedUser.getId())
                .username(updatedUser.getUsername())
                .name(updatedUser.getName())
                .email(updatedUser.getEmail())
                .whatsapp(updatedUser.getWhatsapp())
                .active(updatedUser.isActive())
                .roles(updatedUser.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(java.util.stream.Collectors.toList()))
                .build();

        return ResponseEntity.ok(response);
    }
}
