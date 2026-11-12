package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.SystemAlertCenterResponseDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.SystemAlertCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-alerts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Central de Alertas do Sistema", description = "Alertas priorizados por perfil (Veículo, Motorista e Empresa)")
public class SystemAlertCenterController {

    private final SystemAlertCenterService alertCenterService;

    @GetMapping
    @Operation(summary = "Lista os alertas do sistema priorizados e filtrados pelo perfil do usuário autenticado")
    public ResponseEntity<SystemAlertCenterResponseDTO> getSystemAlerts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(alertCenterService.getAlertsForUser(user));
    }
}

