package br.com.fleetmanager.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import br.com.fleetmanager.exception.BusinessException;

import java.util.Arrays;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationalPermissionService {
    
    private final OperationalRolePermissionMapper rolePermissionMapper;
    
    /**
     * Verifica se o usuário atual possui uma permissão específica
     */
    public boolean hasPermission(OperationalPermission permission) {
        String userRole = getCurrentUserRole();
        boolean hasPermission = rolePermissionMapper.hasPermission(userRole, permission);
        
        log.debug("Usuário com role {} possui permissão {}: {}", userRole, permission, hasPermission);
        return hasPermission;
    }
    
    /**
     * Verifica se o usuário atual possui pelo menos uma das permissões especificadas
     */
    public boolean hasAnyPermission(OperationalPermission... permissions) {
        String userRole = getCurrentUserRole();
        boolean hasAnyPermission = rolePermissionMapper.hasAnyPermission(userRole, permissions);
        
        log.debug("Usuário com role {} possui alguma das permissões {}: {}", 
                userRole, Arrays.toString(permissions), hasAnyPermission);
        return hasAnyPermission;
    }
    
    /**
     * Verifica se o usuário atual possui todas as permissões especificadas
     */
    public boolean hasAllPermissions(OperationalPermission... permissions) {
        String userRole = getCurrentUserRole();
        boolean hasAllPermissions = rolePermissionMapper.hasAllPermissions(userRole, permissions);
        
        log.debug("Usuário com role {} possui todas as permissões {}: {}", 
                userRole, Arrays.toString(permissions), hasAllPermissions);
        return hasAllPermissions;
    }
    
    /**
     * Verifica permissão e lança exceção se não atendida
     */
    public void requirePermission(OperationalPermission permission) {
        if (!hasPermission(permission)) {
            String userRole = getCurrentUserRole();
            log.warn("Usuário com role {} tentou acessar funcionalidade que requer permissão: {}", 
                    userRole, permission);
            throw new BusinessException("Acesso negado: permissão " + permission.getDescription() + " é necessária");
        }
    }
    
    /**
     * Verifica permissão e lança exceção se não atendida (com mensagem personalizada)
     */
    public void requirePermission(OperationalPermission permission, String message) {
        if (!hasPermission(permission)) {
            String userRole = getCurrentUserRole();
            log.warn("Usuário com role {} tentou acessar funcionalidade que requer permissão: {}", 
                    userRole, permission);
            throw new BusinessException(message);
        }
    }
    
    /**
     * Verifica se o usuário possui permissão para gerenciar escalas
     */
    public boolean canManageSchedules() {
        return hasAnyPermission(
            OperationalPermission.SCHEDULE_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuário possui permissão para gerenciar ocorrências
     */
    public boolean canManageOccurrences() {
        return hasAnyPermission(
            OperationalPermission.OCCURRENCE_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuário possui permissão para gerenciar notificações
     */
    public boolean canManageNotifications() {
        return hasAnyPermission(
            OperationalPermission.NOTIFICATION_MANAGE,
            OperationalPermission.OPERATIONAL_ADMIN
        );
    }
    
    /**
     * Verifica se o usuário possui permissão para gerar relatórios
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
     * Verifica se o usuário possui permissão administrativa completa
     */
    public boolean isOperationalAdmin() {
        return hasPermission(OperationalPermission.OPERATIONAL_ADMIN);
    }
    
    /**
     * Obtém todas as permissões do usuário atual
     */
    public Set<OperationalPermission> getCurrentUserPermissions() {
        String userRole = getCurrentUserRole();
        return rolePermissionMapper.getRolePermissions(userRole);
    }
    
    /**
     * Obtém o role do usuário atual
     */
    private String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Usuário não autenticado tentou acessar funcionalidade operacional");
            return "ANONYMOUS";
        }
        
        // Extrair role do authentication (assumindo que está no formato ROLE_XXX)
        String role = authentication.getAuthorities().stream()
            .findFirst()
            .map(authority -> authority.getAuthority().replace("ROLE_", ""))
            .orElse("USER");
        
        log.debug("Role do usuário atual: {}", role);
        return role;
    }
    
    /**
     * Verifica se o usuário atual pode acessar funcionalidade baseada em permissões
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
                log.warn("Funcionalidade desconhecida para verificação de permissão: {}", functionality);
                return false;
        }
    }
}
