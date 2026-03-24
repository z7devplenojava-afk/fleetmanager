package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.TrafficDashboardStatsDTO;
import com.z7design.fleet_manager.service.TrafficDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller para o dashboard de Gestão de Tráfego.
 * Fornece estatísticas em tempo real para os cards do painel.
 */
@RestController
@RequestMapping("/api/traffic-dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Traffic Dashboard", description = "API para estatísticas do dashboard de Gestão de Tráfego")
public class TrafficDashboardController {

    private final TrafficDashboardService trafficDashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('TRAFFIC_MANAGEMENT_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    @Operation(summary = "Obter estatísticas do dashboard de tráfego",
            description = "Retorna todas as métricas para os cards do painel de Gestão de Tráfego")
    public ResponseEntity<TrafficDashboardStatsDTO> getStats() {
        log.info("📊 Requisição de estatísticas do dashboard de tráfego");
        TrafficDashboardStatsDTO stats = trafficDashboardService.getStats();
        return ResponseEntity.ok(stats);
    }
}
