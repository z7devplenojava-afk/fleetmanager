package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.repository.RouteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private com.z7design.fleet_manager.service.RouteCodeGenerator routeCodeGenerator;

    public List<Route> findAllRoutes() {
        return routeRepository.findAll();
    }

    public Route findRouteById(UUID id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Route not found"));
    }

    @Transactional
    public Route createRoute(Route route) {
        if (route.getCode() == null || route.getCode().isEmpty()) {
            route.setCode(routeCodeGenerator.generateCode(route.getName()));
        }

        if (route.getPoints() != null) {
            route.getPoints().forEach(point -> point.setRoute(route));
        }
        return routeRepository.save(route);
    }

    @Transactional
    public Route updateRoute(UUID id, Route routeDetails) {
        Route route = findRouteById(id);

        route.setName(routeDetails.getName());
        route.setDescription(routeDetails.getDescription());
        route.setUnit(routeDetails.getUnit());
        route.setLocation(routeDetails.getLocation());
        route.setEstimatedDuration(routeDetails.getEstimatedDuration());
        route.setCheckpointsRequired(routeDetails.isCheckpointsRequired());
        route.setGeofenceEnabled(routeDetails.isGeofenceEnabled());
        route.setDefaultRadiusMeters(routeDetails.getDefaultRadiusMeters());

        if (routeDetails.getPoints() != null) {
            route.getPoints().clear();
            routeDetails.getPoints().forEach(point -> {
                point.setRoute(route);
                route.getPoints().add(point);
            });
        }

        return routeRepository.save(route);
    }

    @Transactional
    public void deleteRoute(UUID id) {
        Route route = findRouteById(id);
        routeRepository.delete(route);
    }
}
