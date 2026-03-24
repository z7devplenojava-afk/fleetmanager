package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.UserCustomPermission;
import com.z7design.fleet_manager.service.UserCustomPermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/custom-permissions")
@RequiredArgsConstructor
@Slf4j
public class UserCustomPermissionController {

    private final UserCustomPermissionService permissionService;

    /**
     * Obter todas as permissÃµes customizadas de um usuÃ¡rio
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<UserCustomPermission>> getAllPermissions(@PathVariable UUID userId) {
        try {
            log.info("Buscando permissÃµes customizadas do usuÃ¡rio: {}", userId);
            List<UserCustomPermission> permissions = permissionService.getAllPermissions(userId);
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            log.error("Erro ao buscar permissÃµes do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Obter apenas as permissÃµes ativas de um usuÃ¡rio
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<String>> getActivePermissions(@PathVariable UUID userId) {
        try {
            log.info("Buscando permissÃµes ativas do usuÃ¡rio: {}", userId);
            List<String> permissions = permissionService.getActivePermissions(userId);
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            log.error("Erro ao buscar permissÃµes ativas do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Conceder uma permissÃ£o customizada a um usuÃ¡rio
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserCustomPermission> grantPermission(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String permissionKey = request.get("permissionKey");
            if (permissionKey == null || permissionKey.isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            User currentUser = (User) authentication.getPrincipal();
            log.info("SUPER_ADMIN {} concedendo permissÃ£o {} ao usuÃ¡rio {}", 
                currentUser.getId(), permissionKey, userId);

            UserCustomPermission permission = permissionService.grantPermission(
                userId, permissionKey, currentUser.getId()
            );
            
            return ResponseEntity.ok(permission);
        } catch (Exception e) {
            log.error("Erro ao conceder permissÃ£o ao usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Revogar uma permissÃ£o especÃ­fica de um usuÃ¡rio
     */
    @DeleteMapping("/{permissionKey}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> revokePermission(
            @PathVariable UUID userId,
            @PathVariable String permissionKey) {
        try {
            log.info("Revogando permissÃ£o {} do usuÃ¡rio {}", permissionKey, userId);
            permissionService.revokePermission(userId, permissionKey);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao revogar permissÃ£o do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Revogar todas as permissÃµes de um usuÃ¡rio
     */
    @DeleteMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> revokeAllPermissions(@PathVariable UUID userId) {
        try {
            log.info("Revogando todas as permissÃµes do usuÃ¡rio {}", userId);
            permissionService.revokeAllPermissions(userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao revogar todas as permissÃµes do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Substituir todas as permissÃµes de um usuÃ¡rio
     */
    @PutMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> replacePermissions(
            @PathVariable UUID userId,
            @RequestBody List<String> permissionKeys,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            log.info("SUPER_ADMIN {} substituindo permissÃµes do usuÃ¡rio {}", 
                currentUser.getId(), userId);

            permissionService.replacePermissions(userId, permissionKeys, currentUser.getId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao substituir permissÃµes do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Verificar se usuÃ¡rio tem uma permissÃ£o especÃ­fica
     */
    @GetMapping("/check/{permissionKey}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Boolean>> checkPermission(
            @PathVariable UUID userId,
            @PathVariable String permissionKey) {
        try {
            boolean hasPermission = permissionService.hasPermission(userId, permissionKey);
            return ResponseEntity.ok(Map.of("hasPermission", hasPermission));
        } catch (Exception e) {
            log.error("Erro ao verificar permissÃ£o do usuÃ¡rio {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }
}


