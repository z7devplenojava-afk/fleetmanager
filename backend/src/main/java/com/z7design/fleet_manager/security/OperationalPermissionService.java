package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationalPermissionService {
    
    private final OperationalRolePermissionMapper rolePermissionMapper;
    
    /**
     * Verifica se o usuÃ¡rio atual possui uma permissÃ£o especÃ­fica
     */
    public boolean hasPermission(OperationalPermission permission) {
        String userRole = getCurrentUserRole();
        boolean hasPermission = rolePermissionMapper.hasPermission(userRole, permission);
        
        log.debug("UsuÃ¡rio com role {} possui permissÃ£o {}: {}", userRole, permission, hasPermission);
        return hasPermission;
    }
    
    /**
     * Verifica se o usuÃ¡rio atual possui pelo menos uma das permissÃµes especificadas
     */
    public boolean hasAnyPermission(OperationalPermission... permissions) {
        String userRole = getCurrentUserRole();
        boolean hasAnyPermission = rolePermissionMapper.hasAnyPermission(userRole, permissions);
        
        log.debug("UsuÃ¡rio com role {} possui alguma das permissÃµes {}: {}", 
                userRole, Arrays.toString(permissions), hasAnyPermission);
        return hasAnyPermission;
    }
    
    /**
     * Verifica se o usuÃ¡rio atual possui todas as permissÃµes especificadas
     */
    public boolean hasAllPermissions(OperationalPermission... permissions) {
        String userRole = getCurrentUserRole();
        boolean hasAllPermissions = rolePermissionMapper.hasAllPermissions(userRole, permissions);
        
        log.debug("UsuÃ¡rio com role {} possui todas as permissÃµes {}: {}", 
                userRole, Arrays.toString(permissions), hasAllPermissions);
        return hasAllPermissions;
    }
    
    /**
     * Verifica permissÃ£o e lanÃ§a exceÃ§Ã£o se nÃ£o atendida
     */
    public void requirePermission(OperationalPermission permission) {
        if (!hasPermission(permission)) {
            String userRole = getCurrentUserRole();
            log.warn("UsuÃ¡rio com role {} tentou acessar funcionalidade que requer permissÃ£o: {}", 
                    userRole, permission);
            throw new BusinessException("Acesso negado: permissÃ£o " + permission.getDescription() + " Ã© necessÃ¡ria");
        }
    }
    
    /**
     * Verifica permissÃ£o e lanÃ§a exceÃ§Ã£o se nÃ£o atendida (com mensagem personalizada)
     */
    public void requirePermission(OperationalPermission permission, String message) {
        if (!hasPermission(permission)) {
            String userRole = getCurrentUserRole();
            log.warn("UsuÃ¡rio com role {} tentou acessar funcionalidade que requer permissÃ£o: {}", 
                    userRole, permission);
            throw new BusinessException(message);
        }
    }
    
    /**
     * Verifica se o usuÃ¡rio possui permissÃ£o para gerenciar escalas
     */
    public boolean canManageSchedules() {
        return hasAnyPermission(
            OperationalPermission.SCHEDULE_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuÃ¡rio possui permissÃ£o para gerenciar ocorrÃªncias
     */
    public boolean canManageOccurrences() {
        return hasAnyPermission(
            OperationalPermission.OCCURRENCE_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuÃ¡rio possui permissÃ£o para gerenciar notificaÃ§Ãµes
     */
    public boolean canManageNotifications() {
        return hasAnyPermission(
            OperationalPermission.NOTIFICATION_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuÃ¡rio possui permissÃ£o para gerar relatÃ³rios
     */
    public boolean canGenerateReports() {
        return hasAnyPermission(
            OperationalPermission.REPORT_OPERATIONAL,
            OperationalPermission.REPORT_SCHEDULE,
            OperationalPermission.REPORT_OCCURRENCE,
            OperationalPermission.REPORT_NOTIFICATION,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuÃ¡rio possui permissÃ£o administrativa completa
     */
    public boolean isOperationalAdmin() {
        return hasPermission(OperationalPermission.OPERATIONAL_ADMIN);
    }
    
    /**
     * ObtÃ©m todas as permissÃµes do usuÃ¡rio atual
     */
    public Set<OperationalPermission> getCurrentUserPermissions() {
        String userRole = getCurrentUserRole();
        return rolePermissionMapper.getRolePermissions(userRole);
    }
    
    /**
     * ObtÃ©m o role do usuÃ¡rio atual
     */
    private String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("UsuÃ¡rio nÃ£o autenticado tentou acessar funcionalidade operacional");
            return "ANONYMOUS";
        }
        
        // Extrair role do authentication (assumindo que estÃ¡ no formato ROLE_XXX)
        String role = authentication.getAuthorities().stream()
            .findFirst()
            .map(authority -> authority.getAuthority().replace("ROLE_", ""))
            .orElse("USER");
        
        log.debug("Role do usuÃ¡rio atual: {}", role);
        return role;
    }
    
    /**
     * Verifica se o usuÃ¡rio atual pode acessar funcionalidade baseada em permissÃµes
     */
    public boolean canAccess(String functionality) {
        switch (functionality.toLowerCase()) {
            case "schedule_management":
                return canManageSchedules();
            case "occurrence_management":
                return canManageOccurrences();
            case "notification_management":
                return canManageNotifications();
            case "report_generation":
                return canGenerateReports();
            case "operational_admin":
                return isOperationalAdmin();
            default:
                log.warn("Funcionalidade desconhecida para verificaÃ§Ã£o de permissÃ£o: {}", functionality);
                return false;
        }
    }
}

