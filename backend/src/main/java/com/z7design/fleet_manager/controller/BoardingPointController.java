package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.BoardingPointDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD leve de pontos de rota para o painel admin. Os IDs são {@link UUID} (coluna {@code route_points.id}).
 */
@RestController
@RequestMapping("/api/boarding-points")
@RequiredArgsConstructor
@Tag(name = "Pontos de embarque", description = "Pontos de rota (boarding points)")
public class BoardingPointController {

    private final RoutePointRepository routePointRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Listar todos os pontos de rota")
    public List<BoardingPointDTO> listAll() {
        return routePointRepository.findAll().stream()
                .map(BoardingPointDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/route/{routeId}")
    @Transactional(readOnly = true)
    @Operation(summary = "Listar pontos de uma rota")
    public List<BoardingPointDTO> listByRoute(@PathVariable UUID routeId) {
        return routePointRepository.findByRouteIdOrderByOrderAsc(routeId).stream()
                .map(BoardingPointDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    @Operation(summary = "Obter ponto por UUID")
    public ResponseEntity<BoardingPointDTO> getById(@PathVariable String id) {
        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "ID inválido: use o UUID do ponto (GET /api/routes/{routeId} inclui points[].id ou GET /api/boarding-points).");
        }
        RoutePoint point = routePointRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Ponto de rota não encontrado: " + id));
        return ResponseEntity.ok(BoardingPointDTO.fromEntity(point));
    }
}
