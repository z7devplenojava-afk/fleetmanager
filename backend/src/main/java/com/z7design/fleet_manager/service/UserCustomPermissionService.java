package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.UserCustomPermission;
import com.z7design.fleet_manager.repository.UserCustomPermissionRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCustomPermissionService {

    private final UserCustomPermissionRepository permissionRepository;
    private final UserRepository userRepository;

    /**
     * Conceder uma permissÃ£o customizada a um usuÃ¡rio
     */
    @Transactional
    public UserCustomPermission grantPermission(UUID userId, String permissionKey, UUID grantedByUserId) {
        log.info("Concedendo permissÃ£o {} ao usuÃ¡rio {}", permissionKey, userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + userId));

        User grantedBy = userRepository.findById(grantedByUserId)
            .orElseThrow(() -> new RuntimeException("UsuÃ¡rio que concedeu nÃ£o encontrado: " + grantedByUserId));

        // Verificar se jÃ¡ existe a permissÃ£o
        return permissionRepository.findByUserIdAndPermissionKey(userId, permissionKey)
            .map(existing -> {
                // Reativar se estiver desabilitada
                if (!existing.getEnabled()) {
                    existing.setEnabled(true);
                    existing.setGrantedAt(LocalDateTime.now());
                    existing.setGrantedBy(grantedBy);
                    existing.setRevokedAt(null);
                    log.info("PermissÃ£o {} reativada para usuÃ¡rio {}", permissionKey, userId);
                }
                return permissionRepository.save(existing);
            })
            .orElseGet(() -> {
                // Criar nova permissÃ£o
                UserCustomPermission newPermission = UserCustomPermission.builder()
                    .user(user)
                    .permissionKey(permissionKey)
                    .enabled(true)
                    .grantedBy(grantedBy)
                    .grantedAt(LocalDateTime.now())
                    .build();
                
                log.info("Nova permissÃ£o {} criada para usuÃ¡rio {}", permissionKey, userId);
                return permissionRepository.save(newPermission);
            });
    }

    /**
     * Revogar uma permissÃ£o customizada de um usuÃ¡rio
     */
    @Transactional
    public void revokePermission(UUID userId, String permissionKey) {
        log.info("Revogando permissÃ£o {} do usuÃ¡rio {}", permissionKey, userId);

        permissionRepository.findByUserIdAndPermissionKey(userId, permissionKey)
            .ifPresent(permission -> {
                permission.setEnabled(false);
                permission.setRevokedAt(LocalDateTime.now());
                permissionRepository.save(permission);
                log.info("PermissÃ£o {} revogada do usuÃ¡rio {}", permissionKey, userId);
            });
    }

    /**
     * Obter todas as permissÃµes ativas de um usuÃ¡rio
     */
    public List<String> getActivePermissions(UUID userId) {
        return permissionRepository.findActivePermissionsByUserId(userId)
            .stream()
            .map(UserCustomPermission::getPermissionKey)
            .collect(Collectors.toList());
    }

    /**
     * Obter todas as permissÃµes de um usuÃ¡rio (incluindo inativas)
     */
    public List<UserCustomPermission> getAllPermissions(UUID userId) {
        return permissionRepository.findAllByUserId(userId);
    }

    /**
     * Verificar se usuÃ¡rio tem uma permissÃ£o ativa especÃ­fica
     */
    public boolean hasPermission(UUID userId, String permissionKey) {
        return permissionRepository.hasActivePermission(userId, permissionKey);
    }

    /**
     * Revogar todas as permissÃµes de um usuÃ¡rio
     */
    @Transactional
    public void revokeAllPermissions(UUID userId) {
        log.info("Revogando todas as permissÃµes do usuÃ¡rio {}", userId);
        
        List<UserCustomPermission> permissions = permissionRepository.findAllByUserId(userId);
        LocalDateTime now = LocalDateTime.now();
        
        permissions.forEach(permission -> {
            if (permission.getEnabled()) {
                permission.setEnabled(false);
                permission.setRevokedAt(now);
            }
        });
        
        permissionRepository.saveAll(permissions);
        log.info("{} permissÃµes revogadas do usuÃ¡rio {}", permissions.size(), userId);
    }

    /**
     * Conceder mÃºltiplas permissÃµes de uma vez
     */
    @Transactional
    public void grantMultiplePermissions(UUID userId, List<String> permissionKeys, UUID grantedByUserId) {
        log.info("Concedendo {} permissÃµes ao usuÃ¡rio {}", permissionKeys.size(), userId);
        
        for (String permissionKey : permissionKeys) {
            grantPermission(userId, permissionKey, grantedByUserId);
        }
    }

    /**
     * Substituir todas as permissÃµes de um usuÃ¡rio
     */
    @Transactional
    public void replacePermissions(UUID userId, List<String> newPermissionKeys, UUID grantedByUserId) {
        log.info("Substituindo permissÃµes do usuÃ¡rio {} por {} novas permissÃµes", userId, newPermissionKeys.size());
        
        // Revogar todas as permissÃµes existentes
        revokeAllPermissions(userId);
        
        // Conceder as novas permissÃµes
        grantMultiplePermissions(userId, newPermissionKeys, grantedByUserId);
    }
}


