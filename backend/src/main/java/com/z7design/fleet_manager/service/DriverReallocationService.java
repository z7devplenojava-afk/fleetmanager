package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.RouteExecutionRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de Realocação Inteligente de Motoristas.
 *
 * Lógica principal:
 * 1. Motorista finaliza sua rota
 * 2. Sistema verifica se tem horas sobrando no turno
 * 3. Sistema verifica a localização atual (garagem, ponto final da rota)
 * 4. Sistema busca rotas próximas que ainda não foram atribuídas ou que precisam de cobertura
 * 5. Sugere ou realoca automaticamente o motorista
 */
@Service
public class DriverReallocationService {

    @Autowired
    private DriverShiftRepository shiftRepository;

    @Autowired
    private RouteExecutionRepository executionRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private DriverShiftService shiftService;

    /** Raio padrão de busca em km */
    private static final double DEFAULT_SEARCH_RADIUS_KM = 30.0;

    /** Margem mínima de tempo para considerar realocação (minutos) */
    private static final int MIN_REALLOCATION_TIME_MINUTES = 15;

    /**
     * Busca sugestões de realocação para motoristas disponíveis.
     * Retorna lista de sugestões ordenadas por prioridade (proximidade + tempo disponível).
     */
    public List<ReallocationSuggestion> findReallocationSuggestions(LocalDate date) {
        List<DriverShift> availableDrivers = shiftRepository.findAvailableForReallocation(date);
        List<ReallocationSuggestion> suggestions = new ArrayList<>();

        for (DriverShift shift : availableDrivers) {
            if (shift.getCurrentLatitude() == null || shift.getCurrentLongitude() == null) {
                continue; // Sem localização, não é possível sugerir
            }

            // Buscar rotas próximas que o motorista pode executar
            List<Route> nearbyRoutes = findExecutableRoutes(shift);

            for (Route route : nearbyRoutes) {
                double distance = calculateDistance(
                        shift.getCurrentLatitude(), shift.getCurrentLongitude(),
                        getRouteStartLatitude(route), getRouteStartLongitude(route));

                // Estimar tempo de deslocamento até o início da rota (média 40km/h em área urbana)
                double travelTimeMinutes = (distance / 40.0) * 60;

                // Verificar se o motorista tem tempo suficiente
                double routeDurationMinutes = route.getEstimatedDuration() != null
                        ? route.getEstimatedDuration().toMinutes() : 60;
                double totalTimeNeeded = travelTimeMinutes + routeDurationMinutes;
                double availableMinutes = (shift.getHoursRemaining() != null ? shift.getHoursRemaining() : 0) * 60;

                if (availableMinutes >= totalTimeNeeded + MIN_REALLOCATION_TIME_MINUTES) {
                    // Calcular score de prioridade (menor = melhor)
                    double score = calculatePriorityScore(distance, totalTimeNeeded, availableMinutes);

                    suggestions.add(ReallocationSuggestion.builder()
                            .driverShift(shift)
                            .driverName(shift.getDriver().getName())
                            .driverId(shift.getDriver().getId())
                            .route(route)
                            .routeName(route.getName())
                            .routeId(route.getId())
                            .distanceKm(Math.round(distance * 10) / 10.0)
                            .estimatedTravelMinutes((int) Math.ceil(travelTimeMinutes))
                            .estimatedRouteDurationMinutes((int) routeDurationMinutes)
                            .totalTimeNeededMinutes((int) Math.ceil(totalTimeNeeded))
                            .availableMinutes((int) availableMinutes)
                            .timeMarginMinutes((int) (availableMinutes - totalTimeNeeded))
                            .priorityScore(score)
                            .build());
                }
            }
        }

        // Ordenar por score de prioridade (menor = melhor)
        suggestions.sort(Comparator.comparingDouble(ReallocationSuggestion::getPriorityScore));
        return suggestions;
    }

    /**
     * Busca sugestões de realocação para um motorista específico.
     */
    public List<ReallocationSuggestion> findSuggestionsForDriver(UUID shiftId) {
        DriverShift shift = shiftService.findById(shiftId);
        if (!shift.isAvailableForReallocation() || shift.getCurrentLatitude() == null) {
            return Collections.emptyList();
        }

        List<Route> nearbyRoutes = findExecutableRoutes(shift);
        List<ReallocationSuggestion> suggestions = new ArrayList<>();

        for (Route route : nearbyRoutes) {
            double distance = calculateDistance(
                    shift.getCurrentLatitude(), shift.getCurrentLongitude(),
                    getRouteStartLatitude(route), getRouteStartLongitude(route));

            double travelTimeMinutes = (distance / 40.0) * 60;
            double routeDurationMinutes = route.getEstimatedDuration() != null
                    ? route.getEstimatedDuration().toMinutes() : 60;
            double totalTimeNeeded = travelTimeMinutes + routeDurationMinutes;
            double availableMinutes = (shift.getHoursRemaining() != null ? shift.getHoursRemaining() : 0) * 60;

            if (availableMinutes >= totalTimeNeeded + MIN_REALLOCATION_TIME_MINUTES) {
                double score = calculatePriorityScore(distance, totalTimeNeeded, availableMinutes);
                suggestions.add(ReallocationSuggestion.builder()
                        .driverShift(shift)
                        .driverName(shift.getDriver().getName())
                        .driverId(shift.getDriver().getId())
                        .route(route)
                        .routeName(route.getName())
                        .routeId(route.getId())
                        .distanceKm(Math.round(distance * 10) / 10.0)
                        .estimatedTravelMinutes((int) Math.ceil(travelTimeMinutes))
                        .estimatedRouteDurationMinutes((int) routeDurationMinutes)
                        .totalTimeNeededMinutes((int) Math.ceil(totalTimeNeeded))
                        .availableMinutes((int) availableMinutes)
                        .timeMarginMinutes((int) (availableMinutes - totalTimeNeeded))
                        .priorityScore(score)
                        .build());
            }
        }

        suggestions.sort(Comparator.comparingDouble(ReallocationSuggestion::getPriorityScore));
        return suggestions;
    }

    /**
     * Executa a realocação: atribui uma rota extra ao turno do motorista.
     */
    @Transactional
    public RouteExecution executeReallocation(UUID shiftId, UUID routeId) {
        DriverShift shift = shiftService.findById(shiftId);
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Rota não encontrada: " + routeId));

        // Calcular horários
        LocalTime now = LocalTime.now();
        int durationMinutes = route.getEstimatedDuration() != null
                ? (int) route.getEstimatedDuration().toMinutes() : 60;
        LocalTime plannedEnd = now.plusMinutes(durationMinutes);

        return shiftService.assignRouteToShift(shiftId, routeId, now, plannedEnd, true);
    }

    // ========================
    // Métodos auxiliares privados
    // ========================

    /**
     * Busca rotas que podem ser executadas pelo motorista.
     * Considera: proximidade, horário, e se já não está atribuída.
     */
    private List<Route> findExecutableRoutes(DriverShift shift) {
        // Buscar todas as rotas ativas
        List<Route> allRoutes = routeRepository.findAll();

        return allRoutes.stream()
                .filter(route -> {
                    // Filtrar rotas com pontos de início definidos
                    if (getRouteStartLatitude(route) == null || getRouteStartLongitude(route) == null) {
                        return false;
                    }

                    // Verificar distância (dentro do raio)
                    double distance = calculateDistance(
                            shift.getCurrentLatitude(), shift.getCurrentLongitude(),
                            getRouteStartLatitude(route), getRouteStartLongitude(route));
                    if (distance > DEFAULT_SEARCH_RADIUS_KM) {
                        return false;
                    }

                    // Verificar se o motorista tem tempo para esta rota
                    double routeMinutes = route.getEstimatedDuration() != null
                            ? route.getEstimatedDuration().toMinutes() : 60;
                    double travelMinutes = (distance / 40.0) * 60;
                    double availableMinutes = (shift.getHoursRemaining() != null ? shift.getHoursRemaining() : 0) * 60;

                    return availableMinutes >= (routeMinutes + travelMinutes + MIN_REALLOCATION_TIME_MINUTES);
                })
                .collect(Collectors.toList());
    }

    /** Obtém latitude de início da rota (do primeiro ponto ou garagem) */
    private Double getRouteStartLatitude(Route route) {
        if (route.getGarageLatitude() != null) return route.getGarageLatitude();
        if (route.getPoints() != null && !route.getPoints().isEmpty()) {
            return route.getPoints().stream()
                    .filter(p -> p.getType() == RoutePoint.RoutePointType.START)
                    .findFirst()
                    .map(RoutePoint::getLatitude)
                    .orElse(route.getPoints().get(0).getLatitude());
        }
        return null;
    }

    /** Obtém longitude de início da rota */
    private Double getRouteStartLongitude(Route route) {
        if (route.getGarageLongitude() != null) return route.getGarageLongitude();
        if (route.getPoints() != null && !route.getPoints().isEmpty()) {
            return route.getPoints().stream()
                    .filter(p -> p.getType() == RoutePoint.RoutePointType.START)
                    .findFirst()
                    .map(RoutePoint::getLongitude)
                    .orElse(route.getPoints().get(0).getLongitude());
        }
        return null;
    }

    /**
     * Calcula distância entre dois pontos usando fórmula de Haversine.
     * Retorna distância em km.
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Raio da Terra em km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calcula score de prioridade para ordenação.
     * Quanto MENOR o score, MELHOR a sugestão.
     * Fatores: distância (peso 0.4), tempo necessário (peso 0.3), margem de tempo (peso 0.3)
     */
    private double calculatePriorityScore(double distanceKm, double totalTimeMinutes, double availableMinutes) {
        double distanceScore = distanceKm / DEFAULT_SEARCH_RADIUS_KM; // 0 a 1
        double timeScore = totalTimeMinutes / availableMinutes; // 0 a 1 (quanto mais perto de 1, pior)
        double marginScore = 1 - ((availableMinutes - totalTimeMinutes) / availableMinutes); // 0 a 1

        return (distanceScore * 0.4) + (timeScore * 0.3) + (marginScore * 0.3);
    }

    // ========================
    // DTO de Sugestão de Realocação
    // ========================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReallocationSuggestion {
        private DriverShift driverShift;
        private String driverName;
        private UUID driverId;
        private Route route;
        private String routeName;
        private UUID routeId;
        private double distanceKm;
        private int estimatedTravelMinutes;
        private int estimatedRouteDurationMinutes;
        private int totalTimeNeededMinutes;
        private int availableMinutes;
        private int timeMarginMinutes;
        private double priorityScore;
    }
}
