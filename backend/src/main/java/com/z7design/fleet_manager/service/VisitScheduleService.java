package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VisitDTO;
import com.z7design.fleet_manager.dto.VisitScheduleDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.VisitScheduleStatus;
import com.z7design.fleet_manager.model.enums.VisitStatus;
import com.z7design.fleet_manager.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "feature.visitSchedule.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class VisitScheduleService {
    
    private final VisitScheduleRepository visitScheduleRepository;
    private final VisitRepository visitRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;
    private final UnitRepository unitRepository;
    private final RouteOptimizationService routeOptimizationService;
    private final ObjectMapper objectMapper;
    
    /**
     * Cria uma nova escala de visitas com otimizaÃ§Ã£o automÃ¡tica de rota
     */
    @Transactional
    public VisitSchedule createOptimizedSchedule(UUID supervisorId, UUID clientId, 
                                                LocalDate scheduleDate, List<UUID> unitIds,
                                                LocalTime startTime, LocalTime endTime) {
        
        log.info("Criando escala otimizada para supervisor {} no cliente {} em {}", 
                supervisorId, clientId, scheduleDate);
        
        // Validar dados
        Employee supervisor = employeeRepository.findById(supervisorId)
            .orElseThrow(() -> new RuntimeException("Supervisor nÃ£o encontrado"));
        
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Cliente nÃ£o encontrado"));
        
        List<Unit> units = unitRepository.findAllById(unitIds);
        if (units.size() != unitIds.size()) {
            throw new RuntimeException("Algumas unidades nÃ£o foram encontradas");
        }
        
        // Criar escala
        VisitSchedule schedule = VisitSchedule.builder()
            .scheduleDate(scheduleDate)
            .supervisor(supervisor)
            .client(client)
            .startTime(startTime)
            .endTime(endTime)
            .status(VisitScheduleStatus.PLANNED)
            .build();
        
        schedule = visitScheduleRepository.save(schedule);
        
        // Criar visitas para cada unidade
        List<Visit> visits = new ArrayList<>();
        for (Unit unit : units) {
            Visit visit = Visit.builder()
                .visitDate(scheduleDate)
                .supervisor(supervisor)
                // .unit(unit) // Removido - usar workPost
                .visitSchedule(schedule)
                .status(VisitStatus.PENDING)
                // .estimatedDurationMinutes(30) // Removido
                // .priorityLevel(1) // Removido
                .build();
            visits.add(visit);
        }
        
        // Otimizar rota
        List<Visit> optimizedVisits = routeOptimizationService.optimizeVisitRoute(visits);
        
        // Salvar visitas otimizadas
        optimizedVisits = visitRepository.saveAll(optimizedVisits);
        
        // Calcular estatÃ­sticas e salvar na escala
        Map<String, Object> routeStats = routeOptimizationService.generateRouteStats(optimizedVisits);
        schedule.setTotalEstimatedTimeMinutes((Integer) routeStats.get("totalDayTimeMinutes"));
        schedule.setTotalTravelDistanceKm((Double) routeStats.get("totalDistanceKm"));
        schedule.setRouteOptimizationScore((Double) routeStats.get("efficiencyScore"));
        
        // Salvar rota otimizada como JSON
        try {
            String optimizedRoute = objectMapper.writeValueAsString(
                optimizedVisits.stream()
                    .map(v -> Map.of(
                        "visitId", v.getId(),
                        "workPostName", v.getWorkPost() != null ? v.getWorkPost().getName() : "N/A"
                        // "order", v.getRouteOrder(), // Removido
                        // "estimatedDuration", v.getEstimatedDurationMinutes(), // Removido
                        // "travelTimeToNext", v.getTravelTimeToNextMinutes() // Removido
                    ))
                    .collect(Collectors.toList())
            );
            schedule.setOptimizedRoute(optimizedRoute);
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar rota otimizada", e);
        }
        
        schedule.setVisits(optimizedVisits);
        schedule = visitScheduleRepository.save(schedule);
        
        log.info("Escala criada com sucesso. ID: {}, Score de otimizaÃ§Ã£o: {}", 
                schedule.getId(), schedule.getRouteOptimizationScore());
        
        return schedule;
    }
    
    /**
     * Re-otimiza uma escala existente
     */
    @Transactional
    public VisitSchedule reoptimizeSchedule(UUID scheduleId) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala nÃ£o encontrada"));
        
        if (schedule.getStatus() == VisitScheduleStatus.COMPLETED) {
            throw new RuntimeException("NÃ£o Ã© possÃ­vel re-otimizar uma escala jÃ¡ concluÃ­da");
        }
        
        List<Visit> visits = schedule.getVisits();
        if (visits.isEmpty()) {
            return schedule;
        }
        
        // Re-otimizar
        List<Visit> optimizedVisits = routeOptimizationService.optimizeVisitRoute(visits);
        optimizedVisits = visitRepository.saveAll(optimizedVisits);
        
        // Atualizar estatÃ­sticas
        Map<String, Object> routeStats = routeOptimizationService.generateRouteStats(optimizedVisits);
        schedule.setTotalEstimatedTimeMinutes((Integer) routeStats.get("totalDayTimeMinutes"));
        schedule.setTotalTravelDistanceKm((Double) routeStats.get("totalDistanceKm"));
        schedule.setRouteOptimizationScore((Double) routeStats.get("efficiencyScore"));
        
        return visitScheduleRepository.save(schedule);
    }
    
    /**
     * Lista escalas por supervisor e perÃ­odo
     */
    public List<VisitSchedule> getSchedulesBySupervisorAndPeriod(UUID supervisorId, 
                                                               LocalDate startDate, 
                                                               LocalDate endDate) {
        return visitScheduleRepository.findBySupervisorIdAndScheduleDateBetween(
            supervisorId, startDate, endDate);
    }
    
    /**
     * Lista escalas por cliente e perÃ­odo
     */
    public List<VisitSchedule> getSchedulesByClientAndPeriod(UUID clientId, 
                                                           LocalDate startDate, 
                                                           LocalDate endDate) {
        return visitScheduleRepository.findByClientAndDateRange(clientId, startDate, endDate);
    }
    
    /**
     * Inicia execuÃ§Ã£o de uma escala
     */
    @Transactional
    public VisitSchedule startSchedule(UUID scheduleId) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala nÃ£o encontrada"));
        
        if (schedule.getStatus() != VisitScheduleStatus.PLANNED) {
            throw new RuntimeException("Escala nÃ£o estÃ¡ no status PLANNED");
        }
        
        schedule.setStatus(VisitScheduleStatus.IN_PROGRESS);
        schedule.setStartedAt(LocalDateTime.now());
        
        return visitScheduleRepository.save(schedule);
    }
    
    /**
     * Completa uma escala
     */
    @Transactional
    public VisitSchedule completeSchedule(UUID scheduleId) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala nÃ£o encontrada"));
        
        if (schedule.getStatus() != VisitScheduleStatus.IN_PROGRESS) {
            throw new RuntimeException("Escala nÃ£o estÃ¡ em progresso");
        }
        
        schedule.setStatus(VisitScheduleStatus.COMPLETED);
        schedule.setCompletedAt(LocalDateTime.now());
        
        return visitScheduleRepository.save(schedule);
    }
    
    /**
     * Cancela uma escala
     */
    @Transactional
    public VisitSchedule cancelSchedule(UUID scheduleId, String reason) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala nÃ£o encontrada"));
        
        if (schedule.getStatus() == VisitScheduleStatus.COMPLETED) {
            throw new RuntimeException("NÃ£o Ã© possÃ­vel cancelar uma escala jÃ¡ concluÃ­da");
        }
        
        schedule.setStatus(VisitScheduleStatus.CANCELLED);
        schedule.setCancelledAt(LocalDateTime.now());
        schedule.setCancellationReason(reason);
        
        // Cancelar todas as visitas associadas
        List<Visit> visits = schedule.getVisits();
        visits.forEach(visit -> visit.setStatus(VisitStatus.CANCELLED));
        visitRepository.saveAll(visits);
        
        return visitScheduleRepository.save(schedule);
    }
    
    /**
     * Gera relatÃ³rio de eficiÃªncia de escalas
     */
    public Map<String, Object> generateEfficiencyReport(UUID supervisorId, 
                                                       LocalDate startDate, 
                                                       LocalDate endDate) {
        
        List<VisitSchedule> schedules = getSchedulesBySupervisorAndPeriod(supervisorId, startDate, endDate);
        
        Map<String, Object> report = new HashMap<>();
        
        long totalSchedules = schedules.size();
        long completedSchedules = schedules.stream()
            .filter(s -> s.getStatus() == VisitScheduleStatus.COMPLETED)
            .count();
        
        double avgOptimizationScore = schedules.stream()
            .filter(s -> s.getRouteOptimizationScore() != null)
            .mapToDouble(VisitSchedule::getRouteOptimizationScore)
            .average()
            .orElse(0.0);
        
        double totalDistanceKm = schedules.stream()
            .filter(s -> s.getTotalTravelDistanceKm() != null)
            .mapToDouble(VisitSchedule::getTotalTravelDistanceKm)
            .sum();
        
        int totalTimeMinutes = schedules.stream()
            .filter(s -> s.getTotalEstimatedTimeMinutes() != null)
            .mapToInt(VisitSchedule::getTotalEstimatedTimeMinutes)
            .sum();
        
        report.put("period", startDate + " a " + endDate);
        report.put("totalSchedules", totalSchedules);
        report.put("completedSchedules", completedSchedules);
        report.put("completionRate", totalSchedules > 0 ? (completedSchedules * 100.0 / totalSchedules) : 0);
        report.put("avgOptimizationScore", Math.round(avgOptimizationScore * 100.0) / 100.0);
        report.put("totalDistanceKm", Math.round(totalDistanceKm * 100.0) / 100.0);
        report.put("totalTimeHours", Math.round((totalTimeMinutes / 60.0) * 100.0) / 100.0);
        
        return report;
    }
    
    // ===== MÃ‰TODOS COM DTOs =====
    
    /**
     * Cria uma nova escala otimizada e retorna como DTO
     */
    @Transactional
    public VisitScheduleDTO createOptimizedScheduleDTO(UUID supervisorId, UUID clientId, 
                                                       LocalDate scheduleDate, List<UUID> unitIds,
                                                       LocalTime startTime, LocalTime endTime, String observations) {
        
        VisitSchedule schedule = createOptimizedSchedule(supervisorId, clientId, scheduleDate, unitIds, startTime, endTime);
        if (observations != null && !observations.trim().isEmpty()) {
            schedule.setObservations(observations);
            schedule = visitScheduleRepository.save(schedule);
        }
        
        return convertToDTO(schedule);
    }
    
    /**
     * Lista escalas por supervisor em perÃ­odo especÃ­fico como DTO
     */
    public List<VisitScheduleDTO> getSchedulesBySupervisorAndPeriodDTO(UUID supervisorId, LocalDate startDate, LocalDate endDate) {
        List<VisitSchedule> schedules = visitScheduleRepository.findBySupervisorIdAndScheduleDateBetween(
            supervisorId, startDate, endDate);
        
        return schedules.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Converte VisitSchedule para DTO
     */
    private VisitScheduleDTO convertToDTO(VisitSchedule schedule) {
        List<VisitDTO> visitDTOs = schedule.getVisits().stream()
            .map(this::convertVisitToDTO)
            .collect(Collectors.toList());
        
        return VisitScheduleDTO.builder()
            .id(schedule.getId())
            .scheduleDate(schedule.getScheduleDate())
            .supervisorId(schedule.getSupervisor().getId())
            .clientId(schedule.getClient().getId())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .status(schedule.getStatus())
            .totalEstimatedTimeMinutes(schedule.getTotalEstimatedTimeMinutes())
            .totalTravelDistanceKm(schedule.getTotalTravelDistanceKm())
            .observations(schedule.getObservations())
            .optimizedRoute(schedule.getOptimizedRoute())
            .routeOptimizationScore(schedule.getRouteOptimizationScore())
            .visits(visitDTOs)
            .supervisorName(schedule.getSupervisor().getName())
            .clientName(schedule.getClient().getName())
            .startedAt(schedule.getStartedAt())
            .completedAt(schedule.getCompletedAt())
            .cancelledAt(schedule.getCancelledAt())
            .cancellationReason(schedule.getCancellationReason())
            .createdAt(schedule.getCreatedAt())
            .updatedAt(schedule.getUpdatedAt())
            .build();
    }
    
    /**
     * Converte Visit para DTO
     */
    private VisitDTO convertVisitToDTO(Visit visit) {
        return VisitDTO.builder()
            .id(visit.getId())
            .visitDate(visit.getVisitDate())
            .supervisorId(visit.getSupervisor().getId())
            .workPostId(visit.getWorkPost() != null ? visit.getWorkPost().getId() : null)
            .visitScheduleId(visit.getVisitSchedule() != null ? visit.getVisitSchedule().getId() : null)
            .status(visit.getStatus())
            .observations(visit.getObservations())
            .supervisorName(visit.getSupervisor().getName())
            .workPostName(visit.getWorkPost() != null ? visit.getWorkPost().getName() : "N/A")
            .createdAt(visit.getCreatedAt())
            .updatedAt(visit.getUpdatedAt())
            .build();
    }
}

