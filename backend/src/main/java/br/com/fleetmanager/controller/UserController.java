package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.UserService;

import br.com.fleetmanager.dto.ProfileResponse;
import br.com.fleetmanager.dto.ProfileUpdateRequest;
import br.com.fleetmanager.dto.UserListResponseDTO;
import br.com.fleetmanager.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Endpoints para gestão de usuários")
public class UserController {
    
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Listar usuários", description = "Retorna uma lista de todos os usuários")
    public ResponseEntity<List<UserListResponseDTO>> getAllUsers() {
        List<User> users = userService.findAll();
        List<UserListResponseDTO> dtos = users.stream().map(user -> {
            UserListResponseDTO dto = new UserListResponseDTO();
            dto.setId(user.getId().toString());
            dto.setName(user.getName());
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setActive(user.isActive());
            dto.setRoles(user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
            return dto;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuário por ID", description = "Retorna um usuário específico pelo ID")
    public ResponseEntity<UserListResponseDTO> getUserById(@PathVariable String id) {
        User user = userService.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setRoles(user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
        
        return ResponseEntity.ok(dto);
    }
    
    @GetMapping("/username/{username}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuário por username", description = "Retorna um usuário específico pelo username")
    public ResponseEntity<UserListResponseDTO> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setRoles(user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
        
        return ResponseEntity.ok(dto);
    }
    
    @GetMapping("/email/{email}")
    @PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Buscar usuário por email", description = "Retorna um usuário específico pelo email")
    public ResponseEntity<UserListResponseDTO> getUserByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(user.getId().toString());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setRoles(user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
        
        return ResponseEntity.ok(dto);
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('USERS_CREATE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Criar usuário", description = "Cria um novo usuário no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UserListResponseDTO> create(@Valid @RequestBody User user) {
        User createdUser = userService.create(user);
        
        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(createdUser.getId().toString());
        dto.setName(createdUser.getName());
        dto.setUsername(createdUser.getUsername());
        dto.setEmail(createdUser.getEmail());
        dto.setActive(createdUser.isActive());
        dto.setRoles(createdUser.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
        
        return ResponseEntity.status(201).body(dto);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USERS_WRITE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Atualizar usuário", description = "Atualiza os dados de um usuário existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UserListResponseDTO> update(@PathVariable String id, @Valid @RequestBody User user) {
        User updatedUser = userService.update(UUID.fromString(id), user);
        
        UserListResponseDTO dto = new UserListResponseDTO();
        dto.setId(updatedUser.getId().toString());
        dto.setName(updatedUser.getName());
        dto.setUsername(updatedUser.getUsername());
        dto.setEmail(updatedUser.getEmail());
        dto.setActive(updatedUser.isActive());
        dto.setRoles(updatedUser.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toList()));
        
        return ResponseEntity.ok(dto);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USERS_DELETE') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Excluir usuário", description = "Exclui um usuário do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Usuário excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    @Operation(summary = "Buscar próprio perfil", description = "Retorna as informações do perfil do usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil encontrado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autenticado"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    public ResponseEntity<ProfileResponse> getProfile() {
        // Obter o usuário atual do contexto de segurança
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

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
    @Operation(summary = "Atualizar próprio perfil", description = "Permite ao usuário atualizar suas próprias informações")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        // Obter o usuário atual do contexto de segurança
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

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