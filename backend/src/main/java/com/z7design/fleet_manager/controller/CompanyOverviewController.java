package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CompanyOverviewDTO;
import com.z7design.fleet_manager.service.CompanyOverviewMetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/company/overview", "/company/overview"})
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class CompanyOverviewController {

    private final CompanyOverviewMetricsService companyOverviewMetricsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'FLEX_ADMIN', 'ROOT', 'GESTOR', 'DIRETORIA')")
    public ResponseEntity<CompanyOverviewDTO> getCompanyOverview() {
        log.info("📡 Requisição de indicadores 360 da empresa recebida");
        CompanyOverviewDTO overview = companyOverviewMetricsService.getCompanyOverview();
        return ResponseEntity.ok(overview);
    }
}
