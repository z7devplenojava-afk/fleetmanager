package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.DashboardSummaryDTO;
import com.z7design.fleet_manager.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dashboard", description = "Endpoints para dados do dashboard principal")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(
        summary = "Obter resumo do dashboard", 
        description = "Retorna estatÃ­sticas gerais do sistema para o dashboard principal"
    )
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','FINANCEIRO','OPERACIONAL','CLIENTE','COLABORADOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH','ROLE_FINANCEIRO','ROLE_OPERACIONAL','ROLE_CLIENTE','ROLE_COLABORADOR')")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary() {
        try {
            log.info("Solicitando resumo do dashboard");
            
            DashboardSummaryDTO summary = dashboardService.getDashboardSummary();
            
            log.info("Dashboard summary gerado com sucesso - {} usuÃ¡rios, {} contratos ativos", 
                summary.getTotalUsers(), summary.getActiveContracts());
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            log.error("Erro ao gerar resumo do dashboard", e);
            // Fallback: evitar 500 para o frontend
            return ResponseEntity.ok(new DashboardSummaryDTO());
        }
    }

    @GetMapping("/stats/quick")
    @Operation(
        summary = "Obter estatÃ­sticas rÃ¡pidas", 
        description = "Retorna estatÃ­sticas bÃ¡sicas para widgets do dashboard"
    )
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','FINANCEIRO','OPERACIONAL','CLIENTE','COLABORADOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH','ROLE_FINANCEIRO','ROLE_OPERACIONAL','ROLE_CLIENTE','ROLE_COLABORADOR')")
    public ResponseEntity<Object> getQuickStats() {
        try {
            log.info("Solicitando estatÃ­sticas rÃ¡pidas do dashboard");
            
            DashboardSummaryDTO summary = dashboardService.getDashboardSummary();
            
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("totalUsers", summary.getTotalUsers());
            payload.put("activeUsers", summary.getActiveUsers());
            payload.put("activeContracts", summary.getActiveContracts());
            payload.put("monthlyRevenue", summary.getMonthlyRevenue());
            payload.put("totalEquipment", summary.getTotalEquipment());
            payload.put("pendingTasks", summary.getPendingTasks());
            payload.put("totalAlerts", summary.getTotalAlerts());
            payload.put("unreadAlerts", summary.getUnreadAlerts());
            payload.put("lastUpdate", summary.getLastUpdate());
            return ResponseEntity.ok(payload);
            
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas rÃ¡pidas", e);
            Map<String, Object> fallback = new java.util.HashMap<>();
            fallback.put("totalUsers", 0L);
            fallback.put("activeUsers", 0L);
            fallback.put("activeContracts", 0L);
            fallback.put("monthlyRevenue", java.math.BigDecimal.ZERO);
            fallback.put("totalEquipment", 0L);
            fallback.put("pendingTasks", 0L);
            fallback.put("totalAlerts", 0L);
            fallback.put("unreadAlerts", 0L);
            fallback.put("lastUpdate", java.time.LocalDateTime.now());
            return ResponseEntity.ok(fallback);
        }
    }

    @GetMapping("/health")
    @Operation(
        summary = "Verificar saÃºde do dashboard", 
        description = "Endpoint para verificar se o dashboard estÃ¡ funcionando corretamente"
    )
    public ResponseEntity<Object> getDashboardHealth() {
        try {
            log.debug("Verificando saÃºde do dashboard");
            
            return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", java.time.LocalDateTime.now(),
                "service", "dashboard"
            ));
            
        } catch (Exception e) {
            log.error("Erro ao verificar saÃºde do dashboard", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "DOWN",
                "timestamp", java.time.LocalDateTime.now(),
                "service", "dashboard",
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/alerts")
    @Operation(
        summary = "Obter alertas do sistema", 
        description = "Retorna alertas e notificaÃ§Ãµes importantes do sistema"
    )
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','DEPARTAMENTO_PESSOAL','FINANCEIRO','OPERACIONAL','COLABORADOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH','ROLE_DEPARTAMENTO_PESSOAL','ROLE_FINANCEIRO','ROLE_OPERACIONAL','ROLE_COLABORADOR')")
    public ResponseEntity<Object> getAlerts() {
        try {
            log.info("Solicitando alertas do dashboard");
            
            DashboardSummaryDTO summary = dashboardService.getDashboardSummary();
            
            return ResponseEntity.ok(Map.of(
                "totalAlerts", summary.getTotalAlerts(),
                "unreadAlerts", summary.getUnreadAlerts(),
                "alerts", summary.getSystemAlerts() != null ? summary.getSystemAlerts() : new java.util.ArrayList<>(),
                "timestamp", java.time.LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Erro ao buscar alertas do dashboard", e);
            return ResponseEntity.ok(Map.of(
                "totalAlerts", 0,
                "unreadAlerts", 0,
                "alerts", new java.util.ArrayList<>(),
                "timestamp", java.time.LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/activities")
    @Operation(
        summary = "Obter atividades recentes", 
        description = "Retorna atividades recentes do sistema"
    )
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','DEPARTAMENTO_PESSOAL','FINANCEIRO','OPERACIONAL','COLABORADOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH','ROLE_DEPARTAMENTO_PESSOAL','ROLE_FINANCEIRO','ROLE_OPERACIONAL','ROLE_COLABORADOR')")
    public ResponseEntity<Object> getActivities() {
        try {
            log.info("Solicitando atividades recentes do dashboard");
            
            DashboardSummaryDTO summary = dashboardService.getDashboardSummary();
            
            return ResponseEntity.ok(Map.of(
                "activities", summary.getRecentActivities() != null ? summary.getRecentActivities() : new java.util.ArrayList<>(),
                "timestamp", java.time.LocalDateTime.now()
            ));
            
        } catch (Exception e) {
            log.error("Erro ao buscar atividades do dashboard", e);
            return ResponseEntity.ok(Map.of(
                "activities", new java.util.ArrayList<>(),
                "timestamp", java.time.LocalDateTime.now()
            ));
        }
    }
}

