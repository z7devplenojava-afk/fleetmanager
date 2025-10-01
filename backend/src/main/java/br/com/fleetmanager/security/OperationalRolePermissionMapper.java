package br.com.fleetmanager.security;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Mapeia roles para permissões específicas do módulo operacional
 */
@Component
public class OperationalRolePermissionMapper {
    
    private final Map<String, Set<OperationalPermission>> rolePermissions;
    
    public OperationalRolePermissionMapper() {
        this.rolePermissions = new HashMap<>();
        initializeRolePermissions();
    }
    
    private void initializeRolePermissions() {
        // SUPER_ADMIN - Todas as permissões
        rolePermissions.put("SUPER_ADMIN", new HashSet<>(Arrays.asList(
            OperationalPermission.values()
        )));
        
        // ADMIN - Todas as permissões exceto auditoria e configuração
        rolePermissions.put("ADMIN", new HashSet<>(Arrays.asList(
            OperationalPermission.SCHEDULE_CREATE,
            OperationalPermission.SCHEDULE_READ,
            OperationalPermission.SCHEDULE_UPDATE,
            OperationalPermission.SCHEDULE_DELETE,
            OperationalPermission.SCHEDULE_CONFIRM,
            OperationalPermission.SCHEDULE_CANCEL,
            OperationalPermission.SCHEDULE_COMPLETE,
            OperationalPermission.SCHEDULE_MANAGE,
            OperationalPermission.OCCURRENCE_CREATE,
            OperationalPermission.OCCURRENCE_READ,
            OperationalPermission.OCCURRENCE_UPDATE,
            OperationalPermission.OCCURRENCE_DELETE,
            OperationalPermission.OCCURRENCE_STATUS_UPDATE,
            OperationalPermission.OCCURRENCE_PRIORITY_UPDATE,
            OperationalPermission.OCCURRENCE_MANAGE,
            OperationalPermission.NOTIFICATION_CREATE,
            OperationalPermission.NOTIFICATION_READ,
            OperationalPermission.NOTIFICATION_UPDATE,
            OperationalPermission.NOTIFICATION_DELETE,
            OperationalPermission.NOTIFICATION_MARK_READ,
            OperationalPermission.NOTIFICATION_MANAGE,
            OperationalPermission.REPORT_OPERATIONAL,
            OperationalPermission.REPORT_SCHEDULE,
            OperationalPermission.REPORT_OCCURRENCE,
            OperationalPermission.REPORT_NOTIFICATION,
            OperationalPermission.OPERATIONAL_ADMIN
        )));
        
        // GESTOR - Permissões de gestão operacional
        rolePermissions.put("GESTOR", new HashSet<>(Arrays.asList(
            OperationalPermission.SCHEDULE_CREATE,
            OperationalPermission.SCHEDULE_READ,
            OperationalPermission.SCHEDULE_UPDATE,
            OperationalPermission.SCHEDULE_CONFIRM,
            OperationalPermission.SCHEDULE_CANCEL,
            OperationalPermission.SCHEDULE_COMPLETE,
            OperationalPermission.SCHEDULE_MANAGE,
            OperationalPermission.OCCURRENCE_CREATE,
            OperationalPermission.OCCURRENCE_READ,
            OperationalPermission.OCCURRENCE_UPDATE,
            OperationalPermission.OCCURRENCE_STATUS_UPDATE,
            OperationalPermission.OCCURRENCE_PRIORITY_UPDATE,
            OperationalPermission.OCCURRENCE_MANAGE,
            OperationalPermission.NOTIFICATION_CREATE,
            OperationalPermission.NOTIFICATION_READ,
            OperationalPermission.NOTIFICATION_UPDATE,
            OperationalPermission.NOTIFICATION_MARK_READ,
            OperationalPermission.REPORT_OPERATIONAL,
            OperationalPermission.REPORT_SCHEDULE,
            OperationalPermission.REPORT_OCCURRENCE,
            OperationalPermission.REPORT_NOTIFICATION
        )));
        
        // SUPERVISOR - Permissões de supervisão
        rolePermissions.put("SUPERVISOR", new HashSet<>(Arrays.asList(
            OperationalPermission.SCHEDULE_READ,
            OperationalPermission.SCHEDULE_UPDATE,
            OperationalPermission.SCHEDULE_CONFIRM,
            OperationalPermission.SCHEDULE_CANCEL,
            OperationalPermission.SCHEDULE_COMPLETE,
            OperationalPermission.OCCURRENCE_CREATE,
            OperationalPermission.OCCURRENCE_READ,
            OperationalPermission.OCCURRENCE_UPDATE,
            OperationalPermission.OCCURRENCE_STATUS_UPDATE,
            OperationalPermission.OCCURRENCE_PRIORITY_UPDATE,
            OperationalPermission.NOTIFICATION_READ,
            OperationalPermission.NOTIFICATION_MARK_READ,
            OperationalPermission.REPORT_SCHEDULE,
            OperationalPermission.REPORT_OCCURRENCE
        )));
        
        // OPERADOR - Permissões básicas de visualização
        rolePermissions.put("OPERADOR", new HashSet<>(Arrays.asList(
            OperationalPermission.SCHEDULE_READ,
            OperationalPermission.OCCURRENCE_READ,
            OperationalPermission.NOTIFICATION_READ,
            OperationalPermission.NOTIFICATION_MARK_READ
        )));
    }
    
    /**
     * Verifica se um role possui uma permissão específica
     */
    public boolean hasPermission(String role, OperationalPermission permission) {
        Set<OperationalPermission> permissions = rolePermissions.get(role);
        if (permissions == null) {
            return false;
        }
        return permissions.contains(permission);
    }
    
    /**
     * Verifica se um role possui pelo menos uma das permissões especificadas
     */
    public boolean hasAnyPermission(String role, OperationalPermission... permissions) {
        Set<OperationalPermission> rolePerms = rolePermissions.get(role);
        if (rolePerms == null) {
            return false;
        }
        
        for (OperationalPermission permission : permissions) {
            if (rolePerms.contains(permission)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Verifica se um role possui todas as permissões especificadas
     */
    public boolean hasAllPermissions(String role, OperationalPermission... permissions) {
        Set<OperationalPermission> rolePerms = rolePermissions.get(role);
        if (rolePerms == null) {
            return false;
        }
        
        for (OperationalPermission permission : permissions) {
            if (!rolePerms.contains(permission)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Obtém todas as permissões de um role
     */
    public Set<OperationalPermission> getRolePermissions(String role) {
        return new HashSet<>(rolePermissions.getOrDefault(role, new HashSet<>()));
    }
    
    /**
     * Obtém todos os roles que possuem uma permissão específica
     */
    public Set<String> getRolesWithPermission(OperationalPermission permission) {
        Set<String> roles = new HashSet<>();
        
        for (Map.Entry<String, Set<OperationalPermission>> entry : rolePermissions.entrySet()) {
            if (entry.getValue().contains(permission)) {
                roles.add(entry.getKey());
            }
        }
        
        return roles;
    }
    
    /**
     * Lista todas as permissões disponíveis
     */
    public Set<OperationalPermission> getAllPermissions() {
        return new HashSet<>(Arrays.asList(OperationalPermission.values()));
    }
    
    /**
     * Lista todos os roles disponíveis
     */
    public Set<String> getAllRoles() {
        return new HashSet<>(rolePermissions.keySet());
    }
}
