package br.com.fleetmanager.security;

/**
 * Enum que define todas as permissões específicas do módulo operacional
 */
public enum OperationalPermission {
    
    // ===== WORK SCHEDULE PERMISSIONS =====
    SCHEDULE_CREATE("schedule:create", "Criar escalas de trabalho"),
    SCHEDULE_READ("schedule:read", "Visualizar escalas de trabalho"),
    SCHEDULE_UPDATE("schedule:update", "Atualizar escalas de trabalho"),
    SCHEDULE_DELETE("schedule:delete", "Deletar escalas de trabalho"),
    SCHEDULE_CONFIRM("schedule:confirm", "Confirmar escalas de trabalho"),
    SCHEDULE_CANCEL("schedule:cancel", "Cancelar escalas de trabalho"),
    SCHEDULE_COMPLETE("schedule:complete", "Marcar escalas como concluídas"),
    SCHEDULE_MANAGE("schedule:manage", "Gerenciar todas as escalas"),
    
    // ===== OPERATIONAL OCCURRENCE PERMISSIONS =====
    OCCURRENCE_CREATE("occurrence:create", "Criar ocorrências operacionais"),
    OCCURRENCE_READ("occurrence:read", "Visualizar ocorrências operacionais"),
    OCCURRENCE_UPDATE("occurrence:update", "Atualizar ocorrências operacionais"),
    OCCURRENCE_DELETE("occurrence:delete", "Deletar ocorrências operacionais"),
    OCCURRENCE_STATUS_UPDATE("occurrence:status:update", "Atualizar status de ocorrências"),
    OCCURRENCE_PRIORITY_UPDATE("occurrence:priority:update", "Atualizar prioridade de ocorrências"),
    OCCURRENCE_MANAGE("occurrence:manage", "Gerenciar todas as ocorrências"),
    
    // ===== SYSTEM NOTIFICATION PERMISSIONS =====
    NOTIFICATION_CREATE("notification:create", "Criar notificações do sistema"),
    NOTIFICATION_READ("notification:read", "Visualizar notificações do sistema"),
    NOTIFICATION_UPDATE("notification:update", "Atualizar notificações do sistema"),
    NOTIFICATION_DELETE("notification:delete", "Deletar notificações do sistema"),
    NOTIFICATION_MARK_READ("notification:mark:read", "Marcar notificações como lidas"),
    NOTIFICATION_MANAGE("notification:manage", "Gerenciar todas as notificações"),
    
    // ===== REPORT PERMISSIONS =====
    REPORT_OPERATIONAL("report:operational", "Gerar relatórios operacionais"),
    REPORT_SCHEDULE("report:schedule", "Gerar relatórios de escalas"),
    REPORT_OCCURRENCE("report:occurrence", "Gerar relatórios de ocorrências"),
    REPORT_NOTIFICATION("report:notification", "Gerar relatórios de notificações"),
    
    // ===== ADMINISTRATIVE PERMISSIONS =====
    OPERATIONAL_ADMIN("operational:admin", "Administração completa do módulo operacional"),
    OPERATIONAL_AUDIT("operational:audit", "Auditoria de todas as operações"),
    OPERATIONAL_CONFIG("operational:config", "Configuração do módulo operacional");
    
    private final String permission;
    private final String description;
    
    OperationalPermission(String permission, String description) {
        this.permission = permission;
        this.description = description;
    }
    
    public String getPermission() {
        return permission;
    }
    
    public String getDescription() {
        return description;
    }
    
    @Override
    public String toString() {
        return permission;
    }
}
