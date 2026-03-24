package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.mechanic.MechanicKanbanColumnDTO;
import com.z7design.fleet_manager.dto.mechanic.VehicleHealthDTO;
import com.z7design.fleet_manager.service.MechanicDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mechanic/dashboard")
@RequiredArgsConstructor
public class MechanicDashboardController {

    private final MechanicDashboardService dashboardService;

    @GetMapping("/kanban")
    public ResponseEntity<List<MechanicKanbanColumnDTO>> getKanbanBoard() {
        return ResponseEntity.ok(dashboardService.getKanbanBoard());
    }

    @GetMapping("/vehicle/{id}")
    public ResponseEntity<VehicleHealthDTO> getVehicleHealth(@PathVariable UUID id) {
        return ResponseEntity.ok(dashboardService.getVehicleHealth(id));
    }
}
