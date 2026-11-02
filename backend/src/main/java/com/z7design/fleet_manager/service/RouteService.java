package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.BoardingPointDTO;
import com.z7design.fleet_manager.dto.RouteDTO;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private RoutePointRepository routePointRepository;

    @Autowired
    private com.z7design.fleet_manager.service.RouteCodeGenerator routeCodeGenerator;

    @Transactional(readOnly = true)
    public List<RouteDTO> findAllRoutesDTO() {
        List<Route> routes = routeRepository.findAll();
        Map<UUID, List<BoardingPointDTO>> pointsByRoute = new HashMap<>();
        try {
            pointsByRoute = routePointRepository.findAll().stream()
                    .map(BoardingPointDTO::fromEntity)
                    .filter(p -> p != null && p.getRouteId() != null)
                    .collect(Collectors.groupingBy(BoardingPointDTO::getRouteId));
        } catch (Exception ignored) {}

        List<RouteDTO> dtos = new ArrayList<>();
        for (Route r : routes) {
            RouteDTO dto = RouteDTO.fromEntity(r);
            if (dto != null) {
                if (pointsByRoute.containsKey(r.getId())) {
                    dto.setPoints(pointsByRoute.get(r.getId()));
                }
                dtos.add(dto);
            }
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<Route> findAllRoutes() {
        return routeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public RouteDTO findRouteDTOById(UUID id) {
        Route route = findRouteById(id);
        RouteDTO dto = RouteDTO.fromEntity(route);
        if (dto != null) {
            try {
                dto.setPoints(routePointRepository.findByRouteIdOrderByOrderAsc(id).stream()
                        .map(BoardingPointDTO::fromEntity)
                        .collect(Collectors.toList()));
            } catch (Exception ignored) {}
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public Route findRouteById(UUID id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Route not found"));
    }

    @Transactional
    public Route createRoute(Route route) {
        if (route.getCode() == null || route.getCode().isEmpty()) {
            route.setCode(routeCodeGenerator.generateCode(route.getName()));
        }

        if (route.getCompanyId() == null) {
            UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
            if (tenantId != null) {
                route.setCompanyId(tenantId);
            }
        }

        if (route.getPoints() != null) {
            for (int i = 0; i < route.getPoints().size(); i++) {
                RoutePoint point = route.getPoints().get(i);
                point.setRoute(route);
                if (point.getOrder() == null) {
                    point.setOrder(i);
                }
            }
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
        route.setColor(routeDetails.getColor());
        if (routeDetails.getStatus() != null && !routeDetails.getStatus().isBlank()) {
            route.setStatus(routeDetails.getStatus());
        }
        route.setCapacity(routeDetails.getCapacity());

        // Campos estendidos
        route.setOriginCep(routeDetails.getOriginCep());
        route.setOriginAddress(routeDetails.getOriginAddress());
        route.setDestinationCep(routeDetails.getDestinationCep());
        route.setDestinationAddress(routeDetails.getDestinationAddress());
        route.setShift(routeDetails.getShift());
        route.setExecutionTime(routeDetails.getExecutionTime());
        route.setDistanceKm(routeDetails.getDistanceKm());
        if (routeDetails.getClient() != null) {
            route.setClient(routeDetails.getClient());
        }
        route.setScheduledStartTime(routeDetails.getScheduledStartTime());
        route.setScheduledEndTime(routeDetails.getScheduledEndTime());
        route.setGarageLatitude(routeDetails.getGarageLatitude());
        route.setGarageLongitude(routeDetails.getGarageLongitude());
        route.setGarageName(routeDetails.getGarageName());

        if (routeDetails.getPoints() != null) {
            if (route.getPoints() == null) {
                route.setPoints(new java.util.ArrayList<>());
            } else {
                route.getPoints().clear();
            }
            for (int i = 0; i < routeDetails.getPoints().size(); i++) {
                RoutePoint point = routeDetails.getPoints().get(i);
                point.setRoute(route);
                if (point.getOrder() == null) {
                    point.setOrder(i);
                }
                route.getPoints().add(point);
            }
        }

        return routeRepository.save(route);
    }

    @Transactional
    public void deleteRoute(UUID id) {
        Route route = findRouteById(id);
        routeRepository.delete(route);
    }
}
