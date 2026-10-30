package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.RouteDTO;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.service.RouteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @GetMapping
    public ResponseEntity<List<RouteDTO>> getAllRoutes() {
        try {
            List<RouteDTO> routes = routeService.findAllRoutesDTO();
            log.info("GET /api/routes: retornando {} rotas", routes != null ? routes.size() : 0);
            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            log.error("Erro ao listar rotas em GET /api/routes: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteDTO> getRouteById(@PathVariable("id") UUID id) {
        log.info("GET /api/routes/{}: buscando rota", id);
        return ResponseEntity.ok(routeService.findRouteDTOById(id));
    }

    @PostMapping
    public ResponseEntity<RouteDTO> createRoute(@RequestBody Route route) {
        log.info("POST /api/routes: criando rota '{}'", route != null ? route.getName() : null);
        Route created = routeService.createRoute(route);
        return ResponseEntity.ok(routeService.findRouteDTOById(created.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RouteDTO> updateRoute(@PathVariable("id") UUID id, @RequestBody Route route) {
        log.info("PUT /api/routes/{}: atualizando rota", id);
        Route updated = routeService.updateRoute(id, route);
        return ResponseEntity.ok(routeService.findRouteDTOById(updated.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable("id") UUID id) {
        log.info("DELETE /api/routes/{}: excluindo rota", id);
        routeService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }
}

