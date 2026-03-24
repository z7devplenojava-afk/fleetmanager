package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Visit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;

@Service
@Slf4j
public class RouteOptimizationService {

    /**
     * ImplementaÃ§Ã£o segura e minimalista: ordena por horÃ¡rio e, se possÃ­vel,
     * aproxima visitas por distÃ¢ncia usando latitude/longitude da prÃ³pria visita.
     * Evita depender de campos inexistentes no modelo atual.
     */
    public List<Visit> optimizeVisitRoute(List<Visit> visits) {
        if (visits == null || visits.size() <= 1) {
            return visits;
        }

        // Ordena por horÃ¡rio da visita como base
        visits.sort(Comparator.comparing(v -> Optional.ofNullable(v.getVisitTime()).orElse(LocalTime.MIDNIGHT)));

        // Pequeno refinamento: se existir lat/lon, aplica heurÃ­stica simples de vizinho prÃ³ximo
        List<Visit> ordered = new ArrayList<>();
        Set<Visit> remaining = new LinkedHashSet<>(visits);

        Visit current = remaining.iterator().next();
        ordered.add(current);
        remaining.remove(current);

        while (!remaining.isEmpty()) {
            Visit next = findNearestByLatLon(current, remaining);
            if (next == null) {
                next = remaining.iterator().next();
            }
            ordered.add(next);
            remaining.remove(next);
            current = next;
        }

        return ordered;
    }

    private Visit findNearestByLatLon(Visit current, Collection<Visit> candidates) {
        if (current.getLatitude() == null || current.getLongitude() == null) {
            return null;
        }
        double min = Double.MAX_VALUE;
        Visit best = null;
        for (Visit v : candidates) {
            if (v.getLatitude() == null || v.getLongitude() == null) continue;
            double d = haversine(current.getLatitude(), current.getLongitude(), v.getLatitude(), v.getLongitude());
            if (d < min) {
                min = d;
                best = v;
            }
        }
        return best;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public double calculateRouteEfficiencyScore(List<Visit> visits) {
        // Placeholder estÃ¡vel: retorna 100 quando lista vazia/Ãºnica, senÃ£o 90
        return (visits == null || visits.size() <= 1) ? 100.0 : 90.0;
    }

    public Map<String, Object> generateRouteStats(List<Visit> visits) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVisits", visits == null ? 0 : visits.size());
        stats.put("totalDistanceKm", 0.0);
        stats.put("totalTravelTimeMinutes", 0);
        stats.put("totalVisitTimeMinutes", 0);
        stats.put("totalDayTimeMinutes", 0);
        stats.put("efficiencyScore", calculateRouteEfficiencyScore(visits));
        return stats;
    }
}

