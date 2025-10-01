package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.PermissionService;

import br.com.fleetmanager.dto.CreatePermissionDTO;
import br.com.fleetmanager.dto.PermissionDTO;
import br.com.fleetmanager.dto.UpdatePermissionDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Permission;
import br.com.fleetmanager.model.enums.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import br.com.fleetmanager.repository.PermissionRepository;

import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/permissions")
@Tag(name = "Permissions", description = "API para gerenciamento de permissões e roles")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;
    
    @Autowired
    private PermissionRepository permissionRepository;

    // ==================== ENDPOINTS PARA PERMISSÕES JPA ====================
    
    @GetMapping
    @Operation(summary = "Listar todas as permissões", description = "Retorna todas as permissões disponíveis no sistema")
    public ResponseEntity<List<PermissionDTO>> getPermissions() {
        List<Permission> permissions = permissionRepository.findAllOrderByName();
        List<PermissionDTO> permissionDTOs = permissions.stream()
                .map(PermissionDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissionDTOs);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as permissões", description = "Retorna todas as permissões disponíveis no sistema")
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAllOrderByName();
        List<PermissionDTO> permissionDTOs = permissions.stream()
                .map(PermissionDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissionDTOs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar permissão por ID", description = "Retorna uma permissão específica pelo ID")
    public ResponseEntity<PermissionDTO> getPermissionById(@PathVariable UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + id));
        return ResponseEntity.ok(PermissionDTO.fromEntity(permission));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Buscar permissão por nome", description = "Retorna uma permissão específica pelo nome")
    public ResponseEntity<PermissionDTO> getPermissionByName(@PathVariable String name) {
        Permission permission = permissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com nome: " + name));
        return ResponseEntity.ok(PermissionDTO.fromEntity(permission));
    }

    @PostMapping
    @Operation(summary = "Criar nova permissão", description = "Cria uma nova permissão no sistema")
    public ResponseEntity<PermissionDTO> createPermission(@Valid @RequestBody CreatePermissionDTO createPermissionDTO) {
        // Verificar se já existe uma permissão com o mesmo nome
        if (permissionRepository.existsByName(createPermissionDTO.getName())) {
            return ResponseEntity.badRequest().build();
        }

        Permission permission = new Permission();
        permission.setName(createPermissionDTO.getName());
        permission.setDescription(createPermissionDTO.getDescription());

        Permission savedPermission = permissionRepository.save(permission);
        return ResponseEntity.ok(PermissionDTO.fromEntity(savedPermission));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar permissão", description = "Atualiza uma permissão existente")
    public ResponseEntity<PermissionDTO> updatePermission(@PathVariable UUID id, @Valid @RequestBody UpdatePermissionDTO updatePermissionDTO) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada com ID: " + id));

        // Verificar se o novo nome já existe em outra permissão
        if (!permission.getName().equals(updatePermissionDTO.getName()) && 
            permissionRepository.existsByName(updatePermissionDTO.getName())) {
            return ResponseEntity.badRequest().build();
        }

        permission.setName(updatePermissionDTO.getName());
        permission.setDescription(updatePermissionDTO.getDescription());

        Permission updatedPermission = permissionRepository.save(permission);
        return ResponseEntity.ok(PermissionDTO.fromEntity(updatedPermission));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir permissão", description = "Exclui uma permissão do sistema")
    public ResponseEntity<Void> deletePermission(@PathVariable UUID id) {
        if (!permissionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Permissão não encontrada com ID: " + id);
        }
        permissionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== ENDPOINTS EXISTENTES (MANTIDOS PARA COMPATIBILIDADE) ====================

    @GetMapping("/roles")
    @Operation(summary = "Listar todos os roles disponíveis")
    public ResponseEntity<Map<String, Object>> getAllRoles() {
        Map<String, Object> response = new HashMap<>();
        
        List<Map<String, Object>> roles = new ArrayList<>();
        
        for (UserRole role : UserRole.values()) {
            Map<String, Object> roleInfo = new HashMap<>();
            roleInfo.put("name", role.name());
            roleInfo.put("displayName", getRoleDisplayName(role));
            roleInfo.put("description", getRoleDescription(role));
            roleInfo.put("color", getRoleColor(role));
            roleInfo.put("permissions", permissionService.getPermissionsForRole(role));
            
            roles.add(roleInfo);
        }
        
        response.put("roles", roles);
        response.put("total", roles.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roles/{roleName}")
    @Operation(summary = "Obter permissões de um role específico")
    public ResponseEntity<Map<String, Object>> getRolePermissions(@PathVariable String roleName) {
        try {
            UserRole role = UserRole.valueOf(roleName.toUpperCase());
            Set<br.com.fleetmanager.model.enums.Permission> permissions = permissionService.getPermissionsForRole(role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("role", role.name());
            response.put("displayName", getRoleDisplayName(role));
            response.put("description", getRoleDescription(role));
            response.put("color", getRoleColor(role));
            response.put("permissions", permissions);
            response.put("permissionCount", permissions.size());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role inválido: " + roleName));
        }
    }

    @GetMapping("/check")
    @Operation(summary = "Verificar se um role tem determinada permissão")
    public ResponseEntity<Map<String, Object>> checkPermission(
            @RequestParam String roleName,
            @RequestParam String permissionName) {
        try {
            UserRole role = UserRole.valueOf(roleName.toUpperCase());
            br.com.fleetmanager.model.enums.Permission permission = br.com.fleetmanager.model.enums.Permission.valueOf(permissionName.toUpperCase());
            
            boolean hasPermission = permissionService.hasPermission(role, permission);
            
            Map<String, Object> response = new HashMap<>();
            response.put("role", role.name());
            response.put("permission", permission.name());
            response.put("hasPermission", hasPermission);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role ou permissão inválido"));
        }
    }

    @GetMapping("/descriptions")
    @Operation(summary = "Obter descrições de todas as permissões")
    public ResponseEntity<Map<String, Object>> getPermissionDescriptions() {
        List<String> descriptions = permissionService.getPermissionDescriptions();
        
        Map<String, Object> response = new HashMap<>();
        response.put("descriptions", descriptions);
        response.put("total", descriptions.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/hierarchy")
    @Operation(summary = "Obter hierarquia de roles")
    public ResponseEntity<Map<String, Object>> getRoleHierarchy() {
        Map<String, Object> hierarchy = new HashMap<>();
        
        hierarchy.put("SUPER_ADMIN", Map.of(
            "level", 1,
            "description", "Acesso total e irrestrito a todas as funcionalidades",
            "color", "🟥",
            "permissions", "Todas as permissões"
        ));
        
        hierarchy.put("ADMIN", Map.of(
            "level", 2,
            "description", "Acesso amplo, subordinado ao Super Admin",
            "color", "🟦",
            "permissions", "Gerenciamento de usuários, grupos, clientes, funcionários, contratos, financeiro, holerites, relatórios"
        ));
        
        hierarchy.put("SUPERVISOR", Map.of(
            "level", 3,
            "description", "Coordena operações de equipes ou setores",
            "color", "🟩",
            "permissions", "Gerenciamento de funcionários, contratos, holerites, relatórios"
        ));
        
        hierarchy.put("RH", Map.of(
            "level", 3,
            "description", "Gerencia informações contratuais e pessoais dos colaboradores",
            "color", "🟨",
            "permissions", "Gerenciamento de funcionários, holerites, relatórios"
        ));
        
        hierarchy.put("FINANCEIRO", Map.of(
            "level", 3,
            "description", "Controla relatórios financeiros e movimentações",
            "color", "🟧",
            "permissions", "Gerenciamento financeiro, holerites, relatórios"
        ));
        
        hierarchy.put("TI_SUPORTE", Map.of(
            "level", 3,
            "description", "Gerencia configuração técnica, logs e integrações",
            "color", "🟪",
            "permissions", "Configuração do sistema, usuários, grupos"
        ));
        
        hierarchy.put("AUDITOR", Map.of(
            "level", 4,
            "description", "Acesso somente leitura para auditoria",
            "color", "🟫",
            "permissions", "Visualização de todos os dados (read-only)"
        ));
        
        hierarchy.put("COLABORADOR", Map.of(
            "level", 5,
            "description", "Acesso limitado ao próprio perfil",
            "color", "🟨",
            "permissions", "Perfil próprio e visualização de holerites"
        ));
        
        return ResponseEntity.ok(hierarchy);
    }

    private String getRoleDisplayName(UserRole role) {
        switch (role) {
            case SUPER_ADMIN: return "Super Administrador";
            case ADMIN: return "Administrador";
            case SUPERVISOR: return "Supervisor";
            case RH: return "Recursos Humanos";
            case FINANCEIRO: return "Financeiro";
            case TI_SUPORTE: return "TI / Suporte Técnico";
            case AUDITOR: return "Auditor / Consultor";
            case COLABORADOR: return "Colaborador";
            default: return role.name();
        }
    }

    private String getRoleDescription(UserRole role) {
        switch (role) {
            case SUPER_ADMIN: return "Acesso total e irrestrito a todas as funcionalidades e módulos do sistema";
            case ADMIN: return "Acesso amplo, mas subordinado ao Super Admin";
            case SUPERVISOR: return "Coordena operações de equipes ou setores";
            case RH: return "Gerencia informações contratuais e pessoais dos colaboradores";
            case FINANCEIRO: return "Controla relatórios financeiros, movimentações e conferências de pagamento";
            case TI_SUPORTE: return "Gerencia configuração técnica, logs, backups e integrações";
            case AUDITOR: return "Acesso somente leitura para fins de auditoria ou análise externa";
            case COLABORADOR: return "Acesso limitado exclusivamente ao seu próprio perfil";
            default: return "Descrição não disponível";
        }
    }

    private String getRoleColor(UserRole role) {
        switch (role) {
            case SUPER_ADMIN: return "🟥";
            case ADMIN: return "🟦";
            case SUPERVISOR: return "🟩";
            case RH: return "🟨";
            case FINANCEIRO: return "🟧";
            case TI_SUPORTE: return "🟪";
            case AUDITOR: return "🟫";
            case COLABORADOR: return "🟨";
            default: return "⚪";
        }
    }
} 