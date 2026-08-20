package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @GetMapping
    public List<Route> getAllRoutes() {
        return routeService.findAllRoutes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getRouteById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(routeService.findRouteById(id));
    }

    @PostMapping
    public ResponseEntity<Route> createRoute(@RequestBody Route route) {
        return ResponseEntity.ok(routeService.createRoute(route));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRoute(@PathVariable("id") UUID id, @RequestBody Route route) {
        return ResponseEntity.ok(routeService.updateRoute(id, route));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable("id") UUID id) {
        routeService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }
}
