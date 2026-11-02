package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.UserListResponseDTO;
import com.z7design.fleet_manager.dto.UserGroupDTO;
import com.z7design.fleet_manager.dto.ProfileUpdateRequest;
import com.z7design.fleet_manager.dto.ProfileResponse;
import com.z7design.fleet_manager.dto.UpdateUserRequest;
import com.z7design.fleet_manager.dto.CreateUserRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.service.LgpdConsentService;
import java.util.Optional;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.Objects;
import java.util.stream.Collectors;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.repository.CompanyRepository;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Usuários", description = "Endpoints para gestão de usuários")
public class UserController {


    private final UserService userService;
    private final UserRepository userRepository;
    private final UserOnlineStatusService userOnlineStatusService;
    private final LgpdConsentService lgpdConsentService;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar usuários", description = "Retorna uma lista de todos os usuários. Permite acesso para usuários autenticados (necessário para chat)")
    public ResponseEntity<List<UserListResponseDTO>> getAllUsers() {
        List<User> users = userService.findAll();
        Map<UUID, String> companyNames = new HashMap<>();
        try {
            companyRepository.findAll().forEach(c -> {
                if (c.getId() != null && c.getName() != null) {
                    companyNames.put(c.getId(), c.getName());
                }
            });
        } catch (Exception e) {
            log.warn("Erro ao carregar nomes das empresas: {}", e.getMessage());
        }
        List<UserListResponseDTO> dtos = users.stream()
                .map(user -> convertToDTO(user, companyNames))
                .filter(dto -> dto != null)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar próprio perfil", description = "Retorna as informações do perfil do usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil encontrado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autenticado"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    public ResponseEntity<ProfileResponse> getProfile() {
        try {
            // Obter o usuário atual do contexto de segurança
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }

            String username = authentication.getName();
            User currentUser = null;
            if (authentication.getPrincipal() instanceof User) {
                currentUser = (User) authentication.getPrincipal();
            } else {
                try {
                    currentUser = userService.findByUsername(username)
                            .or(() -> userService.findByEmail(username))
                            .orElse(null);
                } catch (Exception e) {
                    log.warn("Erro ao buscar usuário por username/email {}: {}", username, e.getMessage());
                }
                if (currentUser == null) {
                    try {
                        UUID userId = UUID.fromString(username);
                        currentUser = userRepository.findByIdNative(userId).or(() -> userRepository.findById(userId)).orElse(null);
                    } catch (Exception ignored) {}
                }
            }

            if (currentUser != null && currentUser.getId() != null) {
                try {
                    final UUID currentUserId = currentUser.getId();
                    currentUser = userRepository.findByIdNative(currentUserId)
                            .or(() -> userRepository.findById(currentUserId))
                            .orElse(currentUser);
                } catch (Exception e) {
                    log.warn("Erro ao recarregar currentUser via userRepository: {}", e.getMessage());
                }
            } else if (username != null) {
                String cleanDigits = username.replaceAll("\\D", "");
                currentUser = userRepository.findByIdentifierNative(username, cleanDigits)
                        .or(() -> userRepository.findByUsernameNative(username))
                        .or(() -> userRepository.findByEmailNative(username))
                        .orElse(null);
            }

            if (currentUser == null) {
                return ResponseEntity.status(404).build();
            }

            // Garante lista mutável de roles sempre
            List<String> roleNames = new ArrayList<>();
            try {
                if (currentUser.getRoles() != null) {
                    currentUser.getRoles().stream()
                            .filter(Objects::nonNull)
                            .map(role -> role.getName())
                            .filter(Objects::nonNull)
                            .forEach(roleNames::add);
                }
            } catch (Exception e) {
                log.warn("Erro ao extrair roles de currentUser: {}", e.getMessage());
            }

            // Construir resposta
            boolean isSuperAdmin = roleNames.stream().anyMatch(r ->
                r.equalsIgnoreCase("SUPER_ADMIN") || r.equalsIgnoreCase("ROLE_SUPER_ADMIN")
            );
            boolean requiresLgpdConsent = false;
            if (!isSuperAdmin) {
                try {
                    requiresLgpdConsent = !lgpdConsentService.hasAcceptedAllRequiredConsents(currentUser.getId());
                } catch (Exception e) {
                    log.warn("Erro ao verificar consentimento LGPD para perfil (assumindo false): {}", e.getMessage());
                }
            }

            UUID employeeId = null;
            String position = null;
            String department = null;
            try {
                Employee emp = employeeRepository.findByUserId(currentUser.getId()).orElse(null);
                if (emp == null && currentUser.getUsername() != null) {
                    String cleanCpf = currentUser.getUsername().replaceAll("\\D", "");
                    if (cleanCpf.length() >= 11) {
                        emp = employeeRepository.findByCpf(cleanCpf).orElse(null);
                    }
                }
                if (emp == null && currentUser.getName() != null && !currentUser.getName().isBlank()) {
                    List<Employee> empsByName = employeeRepository.findByNameContainingIgnoreCase(currentUser.getName().trim());
                    if (!empsByName.isEmpty()) {
                        emp = empsByName.get(0);
                    }
                }
                if (emp == null && currentUser.getEmail() != null && !currentUser.getEmail().isBlank()) {
                    emp = employeeRepository.findByEmail(currentUser.getEmail().trim()).orElse(null);
                }

                if (emp != null) {
                    employeeId = emp.getId();
                    if (emp.getUser() == null || !currentUser.getId().equals(emp.getUser().getId())) {
                        try {
                            userService.autoLinkEmployeeIfMatched(currentUser);
                        } catch (Exception exLink) {
                            log.debug("Erro ao tentar auto-vínculo em getProfile: {}", exLink.getMessage());
                        }
                    }
                    try {
                        if (emp.getPosition() != null) {
                            position = emp.getPosition().getName();
                        }
                    } catch (Exception exPos) {
                        log.debug("Erro ao carregar position do funcionário: {}", exPos.getMessage());
                    }
                    try {
                        if (emp.getDepartment() != null) {
                            department = emp.getDepartment().getName();
                        }
                    } catch (Exception exDep) {
                        log.debug("Erro ao carregar department do funcionário: {}", exDep.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao resolver employeeId no perfil do usuário {}: {}", currentUser.getId(), e.getMessage());
            }

            boolean hasDriverRole = roleNames.stream().anyMatch(r ->
                r.equalsIgnoreCase("MOTORISTA") || r.equalsIgnoreCase("ROLE_MOTORISTA")
            );
            boolean hasDriverPosition = position != null && (
                position.toLowerCase().contains("motorista") ||
                position.toLowerCase().contains("condutor") ||
                position.toLowerCase().contains("driver")
            );
            boolean isDriver = hasDriverRole || hasDriverPosition;
            if (hasDriverPosition && !hasDriverRole) {
                roleNames.add("MOTORISTA");
            }

            ProfileResponse response = ProfileResponse.builder()
                    .id(currentUser.getId())
                    .username(currentUser.getUsername())
                    .name(currentUser.getName())
                    .email(currentUser.getEmail())
                    .whatsapp(currentUser.getWhatsapp())
                    .active(currentUser.isActive())
                    .roles(roleNames)
                    .firstAccessCompleted(currentUser.getFirstAccessCompleted() != null && currentUser.getFirstAccessCompleted())
                    .requiresLgpdConsent(requiresLgpdConsent)
                    .employeeId(employeeId)
                    .position(position)
                    .department(department)
                    .isDriver(isDriver)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar perfil do usuário logado: ", e);
            // Fallback para evitar 500 na interface
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String name = (auth != null) ? auth.getName() : "Usuário";
            ProfileResponse fallback = ProfileResponse.builder()
                    .username(name)
                    .name(name)
                    .active(true)
                    .roles(List.of())
                    .firstAccessCompleted(true)
                    .requiresLgpdConsent(false)
                    .isDriver(false)
                    .build();
            return ResponseEntity.ok(fallback);
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Atualizar próprio perfil", description = "Permite ao usuário atualizar suas próprias informações")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        try {
            // Obter o usuário atual do contexto de segurança
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }

            String username = authentication.getName();
            User currentUser = null;
            if (authentication.getPrincipal() instanceof User) {
                currentUser = (User) authentication.getPrincipal();
            }
            if (currentUser == null || currentUser.getId() == null) {
                String cleanDigits = username != null ? username.replaceAll("\\D", "") : "";
                currentUser = userRepository.findByIdentifierNative(username, cleanDigits)
                        .or(() -> userRepository.findByUsernameNative(username))
                        .or(() -> userRepository.findByEmailNative(username))
                        .or(() -> userService.findByUsername(username))
                        .or(() -> userService.findByEmail(username))
                        .orElse(null);
            }

            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuário não encontrado"));
            }

            // Atualizar o perfil
            User updatedUser = userService.updateProfile(currentUser.getId(), request);

            List<String> roleNames = updatedUser.getRoles() != null ? updatedUser.getRoles().stream()
                    .filter(Objects::nonNull)
                    .map(role -> role.getName())
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList();

            // Construir resposta
            ProfileResponse response = ProfileResponse.builder()
                    .id(updatedUser.getId())
                    .username(updatedUser.getUsername())
                    .name(updatedUser.getName())
                    .email(updatedUser.getEmail())
                    .whatsapp(updatedUser.getWhatsapp())
                    .active(updatedUser.isActive())
                    .roles(roleNames)
                    .build();

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação ao atualizar perfil: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao atualizar perfil: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Erro ao atualizar perfil"));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar usuário por ID", description = "Retorna um usuário específico pelo ID. Permite acesso para usuários autenticados (necessário para chat)")
    public ResponseEntity<?> getUserById(@PathVariable("id") String id) {
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN') or hasAuthority('USERS_READ')")
    @Operation(summary = "Buscar usuário por username", description = "Retorna um usuário específico pelo username")
    public ResponseEntity<UserListResponseDTO> getUserByUsername(@PathVariable("username") String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isColaborador = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));

        // Colaborador só pode buscar seu próprio username
        if (isColaborador && !auth.getName().equals(username)) {
            return ResponseEntity.status(403).build();
        }

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN') or hasAuthority('USERS_READ')")
    @Operation(summary = "Buscar usuário por email", description = "Retorna um usuário específico pelo email")
    public ResponseEntity<UserListResponseDTO> getUserByEmail(@PathVariable("email") String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar usuários", description = "Busca usuários por nome, email ou username com filtro dinâmico")
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
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar usuário por CPF", description = "Busca usuário através do CPF do funcionário associado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuário encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UserListResponseDTO> getUserByCpf(@PathVariable("cpf") String cpf) {
        String cleanCpf = cpf.replaceAll("\\D", "");
        User user = userRepository.findByCpfNative(cleanCpf)
                .or(() -> userService.findByEmployeeCpf(cleanCpf))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o CPF informado"));

        return ResponseEntity.ok(convertToDTO(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Operation(summary = "Criar usuÃ¡rio", description = "Cria um novo usuÃ¡rio no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "UsuÃ¡rio criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest request) {
        try {
            System.out.println("âœ… UserController.create - Iniciando criaÃ§Ã£o de usuÃ¡rio");
            System.out.println(
                    "ðŸ“‹ Dados: " + request.getName() + " | " + request.getEmail() + " | " + request.getUsername());
            System.out.println("ðŸ“± WhatsApp: " + request.getWhatsapp());
            System.out.println("ðŸ” Roles: " + request.getRoles());

            User createdUser = userService.createFromRequest(request);
            System.out.println("âœ… UsuÃ¡rio criado: " + createdUser.getId());

            return ResponseEntity.status(201).body(convertToDTO(createdUser));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Acesso negado"));
        } catch (IllegalArgumentException e) {
            log.warn("Validação ao criar usuário: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Dados inválidos"));
        } catch (Exception e) {
            System.err.println("âŒ Erro ao criar usuÃ¡rio: " + e.getMessage());
            e.printStackTrace();
            log.error("Erro ao criar usuário: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Erro ao criar usuário"));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Operation(summary = "Atualizar usuÃ¡rio", description = "Atualiza os dados de um usuÃ¡rio existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "UsuÃ¡rio atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "UsuÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<?> update(@PathVariable("id") String id, @Valid @RequestBody UpdateUserRequest request) {
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
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Acesso negado"));
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
        return convertToDTO(user, null);
    }

    private UserListResponseDTO convertToDTO(User user, Map<UUID, String> companyNames) {
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

        // Campos de informações adicionais
        dto.setAvatar(user.getAvatar());
        dto.setDepartment(user.getDepartment());
        dto.setPosition(user.getPosition());
        dto.setEmployeeCode(user.getEmployeeCode());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());

        // Bloqueio administrativo
        dto.setBlocked(Boolean.TRUE.equals(user.getBlocked()) && (user.getBlockedUntil() == null
                || user.getBlockedUntil().isAfter(java.time.LocalDateTime.now())));
        dto.setBlockedUntil(user.getBlockedUntil());
        dto.setBlockedReason(user.getBlockedReason());
        dto.setBlockedBy(user.getBlockedBy());
        if (user.getCompanyId() != null) {
            dto.setCompanyId(user.getCompanyId().toString());
            if (companyNames != null && companyNames.containsKey(user.getCompanyId())) {
                dto.setCompanyName(companyNames.get(user.getCompanyId()));
            } else {
                try {
                    companyRepository.findById(user.getCompanyId()).ifPresent(c -> dto.setCompanyName(c.getName()));
                } catch (Exception e) {
                    log.debug("Erro ao buscar empresa por ID {}: {}", user.getCompanyId(), e.getMessage());
                }
            }
        }

        // Status online/offline
        try {
            UUID userId = UUID.fromString(dto.getId());
            dto.setIsOnline(userOnlineStatusService.isUserOnline(userId));
        } catch (Exception e) {
            log.warn("Erro ao verificar status online do usuÃ¡rio {}: {}", user.getId(), e.getMessage());
            dto.setIsOnline(false);
        }

        dto.setCpf(user.getCpf());

        // Vínculo com Funcionário
        try {
            employeeRepository.findByUserIdGlobal(user.getId()).ifPresent(emp -> {
                dto.setEmployeeId(emp.getId().toString());
                dto.setEmployeeName(emp.getName());
                if (dto.getCpf() == null && emp.getDocument() != null) {
                    dto.setCpf(emp.getDocument());
                }
            });
        } catch (Exception e) {
            log.warn("Erro ao buscar funcionário vinculado ao usuário {}: {}", user.getId(), e.getMessage());
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
                            g.setPermissions(group.getPermissions() != null
                                    ? new java.util.HashSet<>(group.getPermissions())
                                    : java.util.Collections.emptySet());
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

    // ── Bloquear / Desbloquear usuário (por tempo) ──────────────────────────

    /**
     * Bloqueia um usuário. Corpo: { durationMinutes?: number, reason?: string }.
     * durationMinutes nulo/0 = bloqueio permanente até ser desbloqueado.
     * O usuário bloqueado verá a mensagem de bloqueio e deverá procurar o
     * Administrador do sistema.
     */
    @PostMapping("/{id}/block")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Transactional
    public ResponseEntity<?> blockUser(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            UUID userId = UUID.fromString(id);
            User user = userService.findById(userId)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            userService.assertCanManageUser(user);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = (auth != null) ? auth.getName() : "Admin";
            if (currentUsername.equalsIgnoreCase(user.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Não é permitido bloquear sua própria conta de usuário."));
            }

            Long durationMinutes = null;
            String reason = null;
            if (body != null) {
                if (body.get("durationMinutes") instanceof Number n) {
                    long v = n.longValue();
                    durationMinutes = v > 0 ? v : null;
                }
                if (body.get("reason") instanceof String s && !s.isBlank()) {
                    reason = s.trim();
                }
            }

            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            user.setBlocked(true);
            user.setBlockedAt(now);
            user.setBlockedUntil(durationMinutes != null ? now.plusMinutes(durationMinutes) : null);
            user.setBlockedBy(currentUsername);
            user.setBlockedReason(reason);

            User saved = userRepository.save(user);
            log.info("Usuário {} bloqueado por {} até {} ({})", saved.getUsername(), currentUsername,
                    saved.getBlockedUntil(), reason != null ? reason : "sem motivo informado");

            return ResponseEntity.ok(convertToDTO(saved));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Acesso negado"));
        } catch (Exception e) {
            log.error("Erro ao bloquear usuário {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Erro ao bloquear usuário: " + e.getMessage()));
        }
    }

    /**
     * Desbloqueia um usuário imediatamente.
     */
    @PostMapping("/{id}/unblock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Transactional
    public ResponseEntity<?> unblockUser(@PathVariable("id") String id) {
        try {
            UUID userId = UUID.fromString(id);
            User user = userService.findById(userId)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            userService.assertCanManageUser(user);
            user.setBlocked(false);
            user.setBlockedUntil(null);
            user.setBlockedAt(null);
            user.setBlockedReason(null);
            user.setBlockedBy(null);
            User saved = userRepository.save(user);
            log.info("Usuário {} desbloqueado com sucesso", saved.getUsername());
            return ResponseEntity.ok(convertToDTO(saved));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Acesso negado"));
        } catch (Exception e) {
            log.error("Erro ao desbloquear usuário {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Erro ao desbloquear usuário: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Operation(summary = "Excluir usuário", description = "Exclui um usuário do sistema pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Usuário excluído com sucesso"),
            @ApiResponse(responseCode = "400", description = "Não é permitido excluir a própria conta"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<?> delete(@PathVariable("id") String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            String currentUsername = auth.getName();
            User targetUser = userService.findById(UUID.fromString(id)).orElse(null);
            if (targetUser != null && currentUsername.equalsIgnoreCase(targetUser.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Não é permitido excluir sua própria conta de usuário."));
            }
        }
        try {
            userService.delete(UUID.fromString(id));
            return ResponseEntity.noContent().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Acesso negado"));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Usuário {} possui registros vinculados e não pode ser excluído fisicamente. Desativando usuário...", id);
            try {
                User user = userService.findById(UUID.fromString(id)).orElse(null);
                if (user != null) {
                    user.setActive(false);
                    userService.updateProfile(user.getId(), null); // ou desativar
                }
            } catch (Exception ignored) {}
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "Este usuário possui registros vinculados no sistema (movimentações, logs ou mensagens) e não pode ser excluído permanentemente. Recomendamos inativá-lo."
            ));
        } catch (Exception e) {
            log.error("Erro ao excluir usuário {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Erro ao excluir usuário"
            ));
        }
    }

    @PostMapping("/bulk-delete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN')")
    @Operation(summary = "Excluir usuários em massa", description = "Exclui múltiplos usuários do sistema pelos IDs informados")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuários excluídos com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, Object>> deleteBulk(@RequestBody List<String> ids) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = (auth != null) ? auth.getName() : null;

        List<UUID> uuidList = ids.stream()
                .filter(id -> id != null && !id.trim().isEmpty())
                .map(id -> {
                    try {
                        return UUID.fromString(id.trim());
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        Map<String, Object> result = userService.deleteBulk(uuidList, currentUsername);
        return ResponseEntity.ok(result);
    }
}

