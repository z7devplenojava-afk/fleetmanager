package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FleetComponentControlDashboardDTO;
import com.z7design.fleet_manager.dto.FleetComponentControlRowDTO;
import com.z7design.fleet_manager.model.FleetComponentControl;
import com.z7design.fleet_manager.model.FleetComponentControlConfig;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.FleetComponentControlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet-component-controls")
@RequiredArgsConstructor
@Tag(name = "Controles Preventivos de Componentes", description = "Alinhamento, Óleo de Motor, Rolamento de Polia, Arranque e Alternador")
public class FleetComponentControlController {

    private final FleetComponentControlService controlService;

    @GetMapping("/dashboard")
    @Operation(summary = "Painel consolidado de controles preventivos e alertas de vencimento")
    public ResponseEntity<FleetComponentControlDashboardDTO> getDashboard(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "controlType", required = false) String controlType,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(controlService.getDashboard(companyId, controlType, month, year));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Lista somente os itens vencidos ou próximos do vencimento")
    public ResponseEntity<List<FleetComponentControlRowDTO>> getAlerts(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(controlService.getDashboard(companyId, null, null, null).getExpiringAlerts());
    }

    @PostMapping("/manual")
    @Operation(summary = "Lança ou ajusta manualmente o histórico de troca/revisão de um componente")
    public ResponseEntity<FleetComponentControlRowDTO> recordManual(
            @AuthenticationPrincipal User user,
            @RequestBody FleetComponentControlRowDTO request) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(controlService.recordManualEntry(companyId, request));
    }

    @GetMapping("/config")
    public ResponseEntity<FleetComponentControlConfig> getConfig(@AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(controlService.getConfig(companyId));
    }

    @PutMapping("/config")
    public ResponseEntity<FleetComponentControlConfig> updateConfig(
            @AuthenticationPrincipal User user,
            @RequestBody FleetComponentControlConfig config) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        return ResponseEntity.ok(controlService.updateConfig(companyId, config));
    }

    @GetMapping("/history/{vehicleId}/{controlType}")
    public ResponseEntity<List<FleetComponentControl>> getHistory(
            @PathVariable("vehicleId") UUID vehicleId,
            @PathVariable("controlType") String controlType) {
        return ResponseEntity.ok(controlService.getHistory(vehicleId, controlType));
    }
}

