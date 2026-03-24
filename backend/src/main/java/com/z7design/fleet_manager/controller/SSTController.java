package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.SSTAlert;
import com.z7design.fleet_manager.model.enums.SSTAlertType;
import com.z7design.fleet_manager.service.SSTAlertService;
import com.z7design.fleet_manager.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller principal para o mÃ³dulo SST (SaÃºde e SeguranÃ§a do Trabalho)
 */
@RestController
@RequestMapping("/api/sst")
@RequiredArgsConstructor
@Tag(name = "SST - SaÃºde e SeguranÃ§a do Trabalho", description = "API para gerenciamento de SST")
public class SSTController {

    private final SSTAlertService alertService;
    private final AuthenticationService authenticationService;

    // ========== ALERTAS SST ==========

    @GetMapping("/alerts")
    @Operation(summary = "Listar alertas SST", description = "Retorna todos os alertas do sistema SST")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getAllAlerts() {
        List<SSTAlert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/employee/{employeeId}")
    @Operation(summary = "Listar alertas por funcionÃ¡rio", description = "Retorna alertas de um funcionÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getAlertsByEmployee(@PathVariable UUID employeeId) {
        List<SSTAlert> alerts = alertService.getAlertsByEmployee(employeeId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/unread/employee/{employeeId}")
    @Operation(summary = "Listar alertas nÃ£o lidos por funcionÃ¡rio", description = "Retorna alertas nÃ£o lidos de um funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getUnreadAlertsByEmployee(@PathVariable UUID employeeId) {
        List<SSTAlert> alerts = alertService.getUnreadAlertsByEmployee(employeeId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/overdue")
    @Operation(summary = "Listar alertas vencidos", description = "Retorna alertas que estÃ£o vencidos")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getOverdueAlerts() {
        List<SSTAlert> alerts = alertService.getOverdueAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/due-soon")
    @Operation(summary = "Listar alertas prÃ³ximos do vencimento", description = "Retorna alertas que vencem nos prÃ³ximos dias")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getAlertsDueSoon(@RequestParam(defaultValue = "7") int daysAhead) {
        List<SSTAlert> alerts = alertService.getAlertsDueSoon(daysAhead);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/alerts/{alertId}/read")
    @Operation(summary = "Marcar alerta como lido", description = "Marca um alerta como lido")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> markAlertAsRead(@PathVariable UUID alertId) {
        alertService.markAsRead(alertId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/alerts/{alertId}/resolve")
    @Operation(summary = "Marcar alerta como resolvido", description = "Marca um alerta como resolvido")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> markAlertAsResolved(@PathVariable UUID alertId, Authentication authentication) {
        // Obter o usuÃ¡rio atual do contexto de autenticaÃ§Ã£o
        UUID resolvedByUserId = authenticationService.getCurrentUser(authentication).getId();
        alertService.markAsResolved(alertId, resolvedByUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alerts/count/unread/employee/{employeeId}")
    @Operation(summary = "Contar alertas nÃ£o lidos por funcionÃ¡rio", description = "Retorna a quantidade de alertas nÃ£o lidos de um funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Long> countUnreadAlertsByEmployee(@PathVariable UUID employeeId) {
        Long count = alertService.countUnreadAlertsByEmployee(employeeId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/alerts/type/{alertType}")
    @Operation(summary = "Listar alertas por tipo", description = "Retorna alertas de um tipo especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTAlert>> getAlertsByType(@PathVariable SSTAlertType alertType) {
        List<SSTAlert> alerts = alertService.getAlertsByType(alertType);
        return ResponseEntity.ok(alerts);
    }

    // ========== DASHBOARD SST ==========

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Resumo do dashboard SST", description = "Retorna resumo dos indicadores de SST")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTDashboardSummary> getDashboardSummary() {
        SSTDashboardSummary summary = new SSTDashboardSummary();
        
        // Buscar dados dos alertas
        List<SSTAlert> allAlerts = alertService.getAllAlerts();
        List<SSTAlert> unreadAlerts = alertService.getUnreadAlerts();
        List<SSTAlert> overdueAlerts = alertService.getOverdueAlerts();
        
        summary.setTotalAlerts((long) allAlerts.size());
        summary.setUnreadAlerts((long) unreadAlerts.size());
        summary.setOverdueAlerts((long) overdueAlerts.size());
        
        // TODO: Implementar contadores para funcionÃ¡rios, exames, treinamentos e acidentes
        summary.setTotalEmployees(0L);
        summary.setEmployeesWithPendingExams(0L);
        summary.setEmployeesWithPendingTrainings(0L);
        summary.setTotalAccidents(0L);
        summary.setAccidentsThisMonth(0L);
        
        return ResponseEntity.ok(summary);
    }

    // ========== RELATÃ“RIOS SST ==========
    
    @GetMapping("/reports")
    @Operation(summary = "Listar relatÃ³rios SST", description = "Retorna todos os relatÃ³rios SST disponÃ­veis")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getReports() {
        // TODO: Implementar quando a funcionalidade de relatÃ³rios SST for desenvolvida
        // Por enquanto, retorna lista vazia para evitar erros 500
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/reports/executions")
    @Operation(summary = "Listar execuÃ§Ãµes de relatÃ³rios SST", description = "Retorna todas as execuÃ§Ãµes de relatÃ³rios SST")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getReportExecutions() {
        // TODO: Implementar quando a funcionalidade de execuÃ§Ãµes de relatÃ³rios SST for desenvolvida
        // Por enquanto, retorna lista vazia para evitar erros 500
        return ResponseEntity.ok(List.of());
    }

    // ========== CLASSE AUXILIAR PARA DASHBOARD ==========
    
    public static class SSTDashboardSummary {
        private Long totalAlerts;
        private Long unreadAlerts;
        private Long overdueAlerts;
        private Long totalEmployees;
        private Long employeesWithPendingExams;
        private Long employeesWithPendingTrainings;
        private Long totalAccidents;
        private Long accidentsThisMonth;

        // Getters e Setters
        public Long getTotalAlerts() { return totalAlerts; }
        public void setTotalAlerts(Long totalAlerts) { this.totalAlerts = totalAlerts; }
        
        public Long getUnreadAlerts() { return unreadAlerts; }
        public void setUnreadAlerts(Long unreadAlerts) { this.unreadAlerts = unreadAlerts; }
        
        public Long getOverdueAlerts() { return overdueAlerts; }
        public void setOverdueAlerts(Long overdueAlerts) { this.overdueAlerts = overdueAlerts; }
        
        public Long getTotalEmployees() { return totalEmployees; }
        public void setTotalEmployees(Long totalEmployees) { this.totalEmployees = totalEmployees; }
        
        public Long getEmployeesWithPendingExams() { return employeesWithPendingExams; }
        public void setEmployeesWithPendingExams(Long employeesWithPendingExams) { this.employeesWithPendingExams = employeesWithPendingExams; }
        
        public Long getEmployeesWithPendingTrainings() { return employeesWithPendingTrainings; }
        public void setEmployeesWithPendingTrainings(Long employeesWithPendingTrainings) { this.employeesWithPendingTrainings = employeesWithPendingTrainings; }
        
        public Long getTotalAccidents() { return totalAccidents; }
        public void setTotalAccidents(Long totalAccidents) { this.totalAccidents = totalAccidents; }
        
        public Long getAccidentsThisMonth() { return accidentsThisMonth; }
        public void setAccidentsThisMonth(Long accidentsThisMonth) { this.accidentsThisMonth = accidentsThisMonth; }
    }
}

