package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CommercialMetricsDTO;
import com.z7design.fleet_manager.service.CommercialMetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/crm/dashboard", "/crm/dashboard"})
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class CommercialMetricsController {

    private final CommercialMetricsService commercialMetricsService;

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'GESTOR', 'ADMIN', 'SUPER_ADMIN', 'FLEX_ADMIN', 'ROOT')")
    public ResponseEntity<CommercialMetricsDTO> getCommercialMetrics() {
        log.info("📡 Requisição de métricas do CRM recebida");
        CommercialMetricsDTO metrics = commercialMetricsService.getCommercialMetrics();
        return ResponseEntity.ok(metrics);
    }
}
