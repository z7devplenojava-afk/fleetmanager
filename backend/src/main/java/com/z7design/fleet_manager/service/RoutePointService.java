package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoutePointService {
    private final RoutePointRepository routePointRepository;

    public List<RoutePoint> getPointsByRoute(UUID routeId) {
        return routePointRepository.findByRouteIdOrderByOrderAsc(routeId);
    }

    @Transactional
    public RoutePoint createPoint(RoutePoint point) {
        return routePointRepository.save(point);
    }
}
