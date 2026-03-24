package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Permission;
import com.z7design.fleet_manager.model.enums.UserRole;
import com.z7design.fleet_manager.service.PermissionService;
import com.z7design.fleet_manager.repository.PermissionRepository;
import com.z7design.fleet_manager.dto.PermissionDTO;
import com.z7design.fleet_manager.dto.CreatePermissionDTO;
import com.z7design.fleet_manager.dto.UpdatePermissionDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/permissions")
@Tag(name = "Permissions", description = "API para gerenciamento de permissÃµes e roles")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;
    
    @Autowired
    private PermissionRepository permissionRepository;

    // ==================== ENDPOINTS PARA PERMISSÃ•ES JPA ====================
    
    @GetMapping
    @Operation(summary = "Listar todas as permissÃµes", description = "Retorna todas as permissÃµes disponÃ­veis no sistema")
    public ResponseEntity<List<PermissionDTO>> getPermissions() {
        List<Permission> permissions = permissionRepository.findAllOrderByName();
        List<PermissionDTO> permissionDTOs = permissions.stream()
                .map(PermissionDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissionDTOs);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as permissÃµes", description = "Retorna todas as permissÃµes disponÃ­veis no sistema")
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAllOrderByName();
        List<PermissionDTO> permissionDTOs = permissions.stream()
                .map(PermissionDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permissionDTOs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar permissÃ£o por ID", description = "Retorna uma permissÃ£o especÃ­fica pelo ID")
    public ResponseEntity<PermissionDTO> getPermissionById(@PathVariable UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PermissÃ£o nÃ£o encontrada com ID: " + id));
        return ResponseEntity.ok(PermissionDTO.fromEntity(permission));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Buscar permissÃ£o por nome", description = "Retorna uma permissÃ£o especÃ­fica pelo nome")
    public ResponseEntity<PermissionDTO> getPermissionByName(@PathVariable String name) {
        Permission permission = permissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("PermissÃ£o nÃ£o encontrada com nome: " + name));
        return ResponseEntity.ok(PermissionDTO.fromEntity(permission));
    }

    @PostMapping
    @Operation(summary = "Criar nova permissÃ£o", description = "Cria uma nova permissÃ£o no sistema")
    public ResponseEntity<PermissionDTO> createPermission(@Valid @RequestBody CreatePermissionDTO createPermissionDTO) {
        // Verificar se jÃ¡ existe uma permissÃ£o com o mesmo nome
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
    @Operation(summary = "Atualizar permissÃ£o", description = "Atualiza uma permissÃ£o existente")
    public ResponseEntity<PermissionDTO> updatePermission(@PathVariable UUID id, @Valid @RequestBody UpdatePermissionDTO updatePermissionDTO) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PermissÃ£o nÃ£o encontrada com ID: " + id));

        // Verificar se o novo nome jÃ¡ existe em outra permissÃ£o
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
    @Operation(summary = "Excluir permissÃ£o", description = "Exclui uma permissÃ£o do sistema")
    public ResponseEntity<Void> deletePermission(@PathVariable UUID id) {
        if (!permissionRepository.existsById(id)) {
            throw new ResourceNotFoundException("PermissÃ£o nÃ£o encontrada com ID: " + id);
        }
        permissionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== ENDPOINTS EXISTENTES (MANTIDOS PARA COMPATIBILIDADE) ====================

    @GetMapping("/roles")
    @Operation(summary = "Listar todos os roles disponÃ­veis")
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
    @Operation(summary = "Obter permissÃµes de um role especÃ­fico")
    public ResponseEntity<Map<String, Object>> getRolePermissions(@PathVariable String roleName) {
        try {
            UserRole role = UserRole.valueOf(roleName.toUpperCase());
            Set<com.z7design.fleet_manager.model.enums.Permission> permissions = permissionService.getPermissionsForRole(role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("role", role.name());
            response.put("displayName", getRoleDisplayName(role));
            response.put("description", getRoleDescription(role));
            response.put("color", getRoleColor(role));
            response.put("permissions", permissions);
            response.put("permissionCount", permissions.size());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role invÃ¡lido: " + roleName));
        }
    }

    @GetMapping("/check")
    @Operation(summary = "Verificar se um role tem determinada permissÃ£o")
    public ResponseEntity<Map<String, Object>> checkPermission(
            @RequestParam String roleName,
            @RequestParam String permissionName) {
        try {
            UserRole role = UserRole.valueOf(roleName.toUpperCase());
            com.z7design.fleet_manager.model.enums.Permission permission = com.z7design.fleet_manager.model.enums.Permission.valueOf(permissionName.toUpperCase());
            
            boolean hasPermission = permissionService.hasPermission(role, permission);
            
            Map<String, Object> response = new HashMap<>();
            response.put("role", role.name());
            response.put("permission", permission.name());
            response.put("hasPermission", hasPermission);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role ou permissÃ£o invÃ¡lido"));
        }
    }

    @GetMapping("/descriptions")
    @Operation(summary = "Obter descriÃ§Ãµes de todas as permissÃµes")
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
            "color", "ðŸŸ¥",
            "permissions", "Todas as permissÃµes"
        ));
        
        hierarchy.put("ADMIN", Map.of(
            "level", 2,
            "description", "Acesso amplo, subordinado ao Super Admin",
            "color", "ðŸŸ¦",
            "permissions", "Gerenciamento de usuÃ¡rios, grupos, clientes, funcionÃ¡rios, contratos, financeiro, holerites, relatÃ³rios"
        ));
        
        hierarchy.put("SUPERVISOR", Map.of(
            "level", 3,
            "description", "Coordena operaÃ§Ãµes de equipes ou setores",
            "color", "ðŸŸ©",
            "permissions", "Gerenciamento de funcionÃ¡rios, contratos, holerites, relatÃ³rios"
        ));
        
        hierarchy.put("RH", Map.of(
            "level", 3,
            "description", "Gerencia informaÃ§Ãµes contratuais e pessoais dos colaboradores",
            "color", "ðŸŸ¨",
            "permissions", "Gerenciamento de funcionÃ¡rios, holerites, relatÃ³rios"
        ));
        
        hierarchy.put("FINANCEIRO", Map.of(
            "level", 3,
            "description", "Controla relatÃ³rios financeiros e movimentaÃ§Ãµes",
            "color", "ðŸŸ§",
            "permissions", "Gerenciamento financeiro, holerites, relatÃ³rios"
        ));
        
        hierarchy.put("TI_SUPORTE", Map.of(
            "level", 3,
            "description", "Gerencia configuraÃ§Ã£o tÃ©cnica, logs e integraÃ§Ãµes",
            "color", "ðŸŸª",
            "permissions", "ConfiguraÃ§Ã£o do sistema, usuÃ¡rios, grupos"
        ));
        
        hierarchy.put("AUDITOR", Map.of(
            "level", 4,
            "description", "Acesso somente leitura para auditoria",
            "color", "ðŸŸ«",
            "permissions", "VisualizaÃ§Ã£o de todos os dados (read-only)"
        ));
        
        hierarchy.put("COLABORADOR", Map.of(
            "level", 5,
            "description", "Acesso limitado ao prÃ³prio perfil",
            "color", "ðŸŸ¨",
            "permissions", "Perfil prÃ³prio e visualizaÃ§Ã£o de holerites"
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
            case TI_SUPORTE: return "TI / Suporte TÃ©cnico";
            case AUDITOR: return "Auditor / Consultor";
            case COLABORADOR: return "Colaborador";
            default: return role.name();
        }
    }

    private String getRoleDescription(UserRole role) {
        switch (role) {
            case SUPER_ADMIN: return "Acesso total e irrestrito a todas as funcionalidades e mÃ³dulos do sistema";
            case ADMIN: return "Acesso amplo, mas subordinado ao Super Admin";
            case SUPERVISOR: return "Coordena operaÃ§Ãµes de equipes ou setores";
            case RH: return "Gerencia informaÃ§Ãµes contratuais e pessoais dos colaboradores";
            case FINANCEIRO: return "Controla relatÃ³rios financeiros, movimentaÃ§Ãµes e conferÃªncias de pagamento";
            case TI_SUPORTE: return "Gerencia configuraÃ§Ã£o tÃ©cnica, logs, backups e integraÃ§Ãµes";
            case AUDITOR: return "Acesso somente leitura para fins de auditoria ou anÃ¡lise externa";
            case COLABORADOR: return "Acesso limitado exclusivamente ao seu prÃ³prio perfil";
            default: return "DescriÃ§Ã£o nÃ£o disponÃ­vel";
        }
    }

    private String getRoleColor(UserRole role) {
        switch (role) {
            case SUPER_ADMIN: return "ðŸŸ¥";
            case ADMIN: return "ðŸŸ¦";
            case SUPERVISOR: return "ðŸŸ©";
            case RH: return "ðŸŸ¨";
            case FINANCEIRO: return "ðŸŸ§";
            case TI_SUPORTE: return "ðŸŸª";
            case AUDITOR: return "ðŸŸ«";
            case COLABORADOR: return "ðŸŸ¨";
            default: return "âšª";
        }
    }
} 
