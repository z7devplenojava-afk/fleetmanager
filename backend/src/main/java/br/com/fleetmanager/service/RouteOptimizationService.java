package br.com.fleetmanager.service;

import br.com.fleetmanager.model.Unit;
import br.com.fleetmanager.model.Visit;
import br.com.fleetmanager.model.VisitSchedule;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RouteOptimizationService {
    
    /**
     * Otimiza a rota de visitas para um supervisor em um dia específico
     */
    public List<Visit> optimizeVisitRoute(List<Visit> visits) {
        if (visits == null || visits.size() <= 1) {
            return visits;
        }
        
        log.info("Iniciando otimização de rota para {} visitas", visits.size());
        
        // 1. Ordenar por prioridade primeiro
        List<Visit> sortedByPriority = visits.stream()
            .sorted(Comparator.comparing(Visit::getPriorityLevel, Comparator.reverseOrder()))
            .collect(Collectors.toList());
        
        // 2. Aplicar algoritmo de otimização baseado em distância
        List<Visit> optimizedRoute = optimizeByDistance(sortedByPriority);
        
        // 3. Ajustar baseado em horários preferenciais
        optimizedRoute = adjustForPreferredTimes(optimizedRoute);
        
        // 4. Calcular tempos de viagem entre visitas
        calculateTravelTimes(optimizedRoute);
        
        // 5. Definir ordem da rota
        for (int i = 0; i < optimizedRoute.size(); i++) {
            optimizedRoute.get(i).setRouteOrder(i + 1);
        }
        
        log.info("Rota otimizada com sucesso. Ordem final: {}", 
            optimizedRoute.stream()
                .map(v -> v.getUnit().getName())
                .collect(Collectors.joining(" → ")));
        
        return optimizedRoute;
    }
    
    /**
     * Otimização baseada em distância usando algoritmo de vizinho mais próximo
     */
    private List<Visit> optimizeByDistance(List<Visit> visits) {
        if (visits.size() <= 2) return visits;
        
        List<Visit> optimized = new ArrayList<>();
        Set<Visit> remaining = new HashSet<>(visits);
        
        // Começar com a visita de maior prioridade
        Visit current = visits.get(0);
        optimized.add(current);
        remaining.remove(current);
        
        // Algoritmo de vizinho mais próximo
        while (!remaining.isEmpty()) {
            Visit nearest = findNearestVisit(current, remaining);
            if (nearest != null) {
                optimized.add(nearest);
                remaining.remove(nearest);
                current = nearest;
            } else {
                // Fallback: adicionar qualquer visita restante
                Visit next = remaining.iterator().next();
                optimized.add(next);
                remaining.remove(next);
                current = next;
            }
        }
        
        return optimized;
    }
    
    /**
     * Encontra a visita mais próxima geograficamente
     */
    private Visit findNearestVisit(Visit current, Set<Visit> candidates) {
        Unit currentUnit = current.getUnit();
        if (currentUnit.getLatitude() == null || currentUnit.getLongitude() == null) {
            return candidates.iterator().next(); // Fallback
        }
        
        double minDistance = Double.MAX_VALUE;
        Visit nearest = null;
        
        for (Visit candidate : candidates) {
            Unit candidateUnit = candidate.getUnit();
            if (candidateUnit.getLatitude() != null && candidateUnit.getLongitude() != null) {
                double distance = calculateDistance(
                    currentUnit.getLatitude(), currentUnit.getLongitude(),
                    candidateUnit.getLatitude(), candidateUnit.getLongitude()
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = candidate;
                }
            }
        }
        
        return nearest;
    }
    
    /**
     * Calcula distância entre duas coordenadas usando fórmula de Haversine
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Raio da Terra em km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Ajusta a rota baseada em horários preferenciais
     */
    private List<Visit> adjustForPreferredTimes(List<Visit> visits) {
        // Separa visitas com e sem horário preferencial
        List<Visit> withPreferredTime = visits.stream()
            .filter(v -> v.getPreferredTimeStart() != null)
            .sorted(Comparator.comparing(Visit::getPreferredTimeStart))
            .collect(Collectors.toList());
        
        List<Visit> withoutPreferredTime = visits.stream()
            .filter(v -> v.getPreferredTimeStart() == null)
            .collect(Collectors.toList());
        
        // Reconstrói a lista priorizando horários preferenciais
        List<Visit> adjusted = new ArrayList<>();
        int preferredIndex = 0;
        int flexibleIndex = 0;
        
        LocalDateTime currentTime = LocalDateTime.now().withHour(8).withMinute(0); // Início do dia
        
        while (preferredIndex < withPreferredTime.size() || flexibleIndex < withoutPreferredTime.size()) {
            Visit nextPreferred = preferredIndex < withPreferredTime.size() 
                ? withPreferredTime.get(preferredIndex) : null;
            Visit nextFlexible = flexibleIndex < withoutPreferredTime.size() 
                ? withoutPreferredTime.get(flexibleIndex) : null;
            
            // Decide qual visita adicionar baseado no horário atual
            if (nextPreferred != null && 
                currentTime.isBefore(nextPreferred.getPreferredTimeStart().plusMinutes(30))) {
                adjusted.add(nextPreferred);
                currentTime = currentTime.plus(nextPreferred.getEstimatedDurationMinutes(), ChronoUnit.MINUTES);
                preferredIndex++;
            } else if (nextFlexible != null) {
                adjusted.add(nextFlexible);
                currentTime = currentTime.plus(nextFlexible.getEstimatedDurationMinutes(), ChronoUnit.MINUTES);
                flexibleIndex++;
            } else if (nextPreferred != null) {
                adjusted.add(nextPreferred);
                currentTime = currentTime.plus(nextPreferred.getEstimatedDurationMinutes(), ChronoUnit.MINUTES);
                preferredIndex++;
            }
        }
        
        return adjusted;
    }
    
    /**
     * Calcula tempos de viagem entre visitas consecutivas
     */
    private void calculateTravelTimes(List<Visit> visits) {
        for (int i = 0; i < visits.size() - 1; i++) {
            Visit current = visits.get(i);
            Visit next = visits.get(i + 1);
            
            Unit currentUnit = current.getUnit();
            Unit nextUnit = next.getUnit();
            
            if (currentUnit.getLatitude() != null && currentUnit.getLongitude() != null &&
                nextUnit.getLatitude() != null && nextUnit.getLongitude() != null) {
                
                double distance = calculateDistance(
                    currentUnit.getLatitude(), currentUnit.getLongitude(),
                    nextUnit.getLatitude(), nextUnit.getLongitude()
                );
                
                // Estima tempo de viagem (velocidade média de 40 km/h no trânsito urbano)
                int travelTimeMinutes = (int) Math.ceil((distance / 40.0) * 60);
                
                current.setTravelDistanceToNextKm(distance);
                current.setTravelTimeToNextMinutes(travelTimeMinutes);
            }
        }
    }
    
    /**
     * Calcula score de eficiência da rota (0-100)
     */
    public double calculateRouteEfficiencyScore(List<Visit> visits) {
        if (visits == null || visits.size() <= 1) {
            return 100.0;
        }
        
        double totalDistance = visits.stream()
            .filter(v -> v.getTravelDistanceToNextKm() != null)
            .mapToDouble(Visit::getTravelDistanceToNextKm)
            .sum();
        
        double totalTime = visits.stream()
            .filter(v -> v.getTravelTimeToNextMinutes() != null)
            .mapToDouble(Visit::getTravelTimeToNextMinutes)
            .sum();
        
        // Score baseado em distância total e tempo de viagem
        // Quanto menor a distância e tempo, maior o score
        double distanceScore = Math.max(0, 100 - (totalDistance * 2)); // Penaliza 2 pontos por km
        double timeScore = Math.max(0, 100 - (totalTime * 0.5)); // Penaliza 0.5 pontos por minuto
        
        return (distanceScore + timeScore) / 2;
    }
    
    /**
     * Gera estatísticas da rota otimizada
     */
    public Map<String, Object> generateRouteStats(List<Visit> visits) {
        Map<String, Object> stats = new HashMap<>();
        
        double totalDistance = visits.stream()
            .filter(v -> v.getTravelDistanceToNextKm() != null)
            .mapToDouble(Visit::getTravelDistanceToNextKm)
            .sum();
        
        int totalTravelTime = visits.stream()
            .filter(v -> v.getTravelTimeToNextMinutes() != null)
            .mapToInt(Visit::getTravelTimeToNextMinutes)
            .sum();
        
        int totalVisitTime = visits.stream()
            .mapToInt(Visit::getEstimatedDurationMinutes)
            .sum();
        
        stats.put("totalVisits", visits.size());
        stats.put("totalDistanceKm", Math.round(totalDistance * 100.0) / 100.0);
        stats.put("totalTravelTimeMinutes", totalTravelTime);
        stats.put("totalVisitTimeMinutes", totalVisitTime);
        stats.put("totalDayTimeMinutes", totalTravelTime + totalVisitTime);
        stats.put("efficiencyScore", calculateRouteEfficiencyScore(visits));
        
        return stats;
    }
}
