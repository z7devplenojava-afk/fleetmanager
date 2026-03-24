package com.z7design.fleet_manager.security;

/**
 * Enum que define todas as permissÃµes especÃ­ficas do mÃ³dulo operacional
 */
public enum OperationalPermission {
    
    // ===== WORK SCHEDULE PERMISSIONS =====
    SCHEDULE_CREATE("schedule:create", "Criar escalas de trabalho"),
    SCHEDULE_READ("schedule:read", "Visualizar escalas de trabalho"),
    SCHEDULE_UPDATE("schedule:update", "Atualizar escalas de trabalho"),
    SCHEDULE_DELETE("schedule:delete", "Deletar escalas de trabalho"),
    SCHEDULE_CONFIRM("schedule:confirm", "Confirmar escalas de trabalho"),
    SCHEDULE_CANCEL("schedule:cancel", "Cancelar escalas de trabalho"),
    SCHEDULE_COMPLETE("schedule:complete", "Marcar escalas como concluÃ­das"),
    SCHEDULE_MANAGE("schedule:manage", "Gerenciar todas as escalas"),
    
    // ===== OPERATIONAL OCCURRENCE PERMISSIONS =====
    OCCURRENCE_CREATE("occurrence:create", "Criar ocorrÃªncias operacionais"),
    OCCURRENCE_READ("occurrence:read", "Visualizar ocorrÃªncias operacionais"),
    OCCURRENCE_UPDATE("occurrence:update", "Atualizar ocorrÃªncias operacionais"),
    OCCURRENCE_DELETE("occurrence:delete", "Deletar ocorrÃªncias operacionais"),
    OCCURRENCE_STATUS_UPDATE("occurrence:status:update", "Atualizar status de ocorrÃªncias"),
    OCCURRENCE_PRIORITY_UPDATE("occurrence:priority:update", "Atualizar prioridade de ocorrÃªncias"),
    OCCURRENCE_MANAGE("occurrence:manage", "Gerenciar todas as ocorrÃªncias"),
    
    // ===== SYSTEM NOTIFICATION PERMISSIONS =====
    NOTIFICATION_CREATE("notification:create", "Criar notificaÃ§Ãµes do sistema"),
    NOTIFICATION_READ("notification:read", "Visualizar notificaÃ§Ãµes do sistema"),
    NOTIFICATION_UPDATE("notification:update", "Atualizar notificaÃ§Ãµes do sistema"),
    NOTIFICATION_DELETE("notification:delete", "Deletar notificaÃ§Ãµes do sistema"),
    NOTIFICATION_MARK_READ("notification:mark:read", "Marcar notificaÃ§Ãµes como lidas"),
    NOTIFICATION_MANAGE("notification:manage", "Gerenciar todas as notificaÃ§Ãµes"),
    
    // ===== REPORT PERMISSIONS =====
    REPORT_OPERATIONAL("report:operational", "Gerar relatÃ³rios operacionais"),
    REPORT_SCHEDULE("report:schedule", "Gerar relatÃ³rios de escalas"),
    REPORT_OCCURRENCE("report:occurrence", "Gerar relatÃ³rios de ocorrÃªncias"),
    REPORT_NOTIFICATION("report:notification", "Gerar relatÃ³rios de notificaÃ§Ãµes"),
    
    // ===== ADMINISTRATIVE PERMISSIONS =====
    OPERATIONAL_ADMIN("operational:admin", "AdministraÃ§Ã£o completa do mÃ³dulo operacional"),
    OPERATIONAL_AUDIT("operational:audit", "Auditoria de todas as operaÃ§Ãµes"),
    OPERATIONAL_CONFIG("operational:config", "ConfiguraÃ§Ã£o do mÃ³dulo operacional");
    
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

