package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.client.ClientRouteDTO;
import com.z7design.fleet_manager.dto.client.ClientSnapshotDTO;
import com.z7design.fleet_manager.dto.client.ClientTimelineEventDTO;
import com.z7design.fleet_manager.service.client.ClientAreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-area")
@RequiredArgsConstructor
@Tag(name = "Client Area", description = "Endpoints para o aplicativo mobile do cliente final")
public class ClientAreaController {

    private final ClientAreaService clientAreaService;

    @GetMapping("/routes/active")
    @Operation(summary = "Listar rotas ativas")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    public ResponseEntity<List<ClientRouteDTO>> getActiveRoutes() {
        return ResponseEntity.ok(clientAreaService.getActiveRoutes());
    }

    @GetMapping("/routes/{routeId}/timeline")
    @Operation(summary = "Obter timeline de eventos da rota")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    public ResponseEntity<List<ClientTimelineEventDTO>> getRouteTimeline(@PathVariable("routeId") String routeId) {
        return ResponseEntity.ok(clientAreaService.getRouteTimeline(routeId));
    }

    @GetMapping("/vehicles/{vehicleId}/snapshot")
    @Operation(summary = "Obter snapshot da câmera do veículo")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    public ResponseEntity<ClientSnapshotDTO> getCameraSnapshot(@PathVariable("vehicleId") String vehicleId) {
        return ResponseEntity.ok(clientAreaService.getCameraSnapshot(vehicleId));
    }
}
