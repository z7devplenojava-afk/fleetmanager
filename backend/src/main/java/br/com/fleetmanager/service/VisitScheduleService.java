package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.VisitDTO;
import br.com.fleetmanager.dto.VisitScheduleDTO;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.model.enums.VisitScheduleStatus;
import br.com.fleetmanager.model.enums.VisitStatus;
import br.com.fleetmanager.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
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
     * Cria uma nova escala de visitas com otimização automática de rota
     */
    @Transactional
    public VisitSchedule createOptimizedSchedule(UUID supervisorId, UUID clientId, 
                                                LocalDate scheduleDate, List<UUID> unitIds,
                                                LocalTime startTime, LocalTime endTime) {
        
        log.info("Criando escala otimizada para supervisor {} no cliente {} em {}", 
                supervisorId, clientId, scheduleDate);
        
        // Validar dados
        Employee supervisor = employeeRepository.findById(supervisorId)
            .orElseThrow(() -> new RuntimeException("Supervisor não encontrado"));
        
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        
        List<Unit> units = unitRepository.findAllById(unitIds);
        if (units.size() != unitIds.size()) {
            throw new RuntimeException("Algumas unidades não foram encontradas");
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
                .unit(unit)
                .visitSchedule(schedule)
                .status(VisitStatus.PENDING)
                .estimatedDurationMinutes(30) // Padrão
                .priorityLevel(1) // Padrão
                .build();
            visits.add(visit);
        }
        
        // Otimizar rota
        List<Visit> optimizedVisits = routeOptimizationService.optimizeVisitRoute(visits);
        
        // Salvar visitas otimizadas
        optimizedVisits = visitRepository.saveAll(optimizedVisits);
        
        // Calcular estatísticas e salvar na escala
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
                        "unitName", v.getUnit().getName(),
                        "order", v.getRouteOrder(),
                        "estimatedDuration", v.getEstimatedDurationMinutes(),
                        "travelTimeToNext", v.getTravelTimeToNextMinutes() != null ? v.getTravelTimeToNextMinutes() : 0
                    ))
                    .collect(Collectors.toList())
            );
            schedule.setOptimizedRoute(optimizedRoute);
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar rota otimizada", e);
        }
        
        schedule.setVisits(optimizedVisits);
        schedule = visitScheduleRepository.save(schedule);
        
        log.info("Escala criada com sucesso. ID: {}, Score de otimização: {}", 
                schedule.getId(), schedule.getRouteOptimizationScore());
        
        return schedule;
    }
    
    /**
     * Re-otimiza uma escala existente
     */
    @Transactional
    public VisitSchedule reoptimizeSchedule(UUID scheduleId) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
        
        if (schedule.getStatus() == VisitScheduleStatus.COMPLETED) {
            throw new RuntimeException("Não é possível re-otimizar uma escala já concluída");
        }
        
        List<Visit> visits = schedule.getVisits();
        if (visits.isEmpty()) {
            return schedule;
        }
        
        // Re-otimizar
        List<Visit> optimizedVisits = routeOptimizationService.optimizeVisitRoute(visits);
        optimizedVisits = visitRepository.saveAll(optimizedVisits);
        
        // Atualizar estatísticas
        Map<String, Object> routeStats = routeOptimizationService.generateRouteStats(optimizedVisits);
        schedule.setTotalEstimatedTimeMinutes((Integer) routeStats.get("totalDayTimeMinutes"));
        schedule.setTotalTravelDistanceKm((Double) routeStats.get("totalDistanceKm"));
        schedule.setRouteOptimizationScore((Double) routeStats.get("efficiencyScore"));
        
        return visitScheduleRepository.save(schedule);
    }
    
    /**
     * Lista escalas por supervisor e período
     */
    public List<VisitSchedule> getSchedulesBySupervisorAndPeriod(UUID supervisorId, 
                                                               LocalDate startDate, 
                                                               LocalDate endDate) {
        return visitScheduleRepository.findBySupervisorIdAndScheduleDateBetween(
            supervisorId, startDate, endDate);
    }
    
    /**
     * Lista escalas por cliente e período
     */
    public List<VisitSchedule> getSchedulesByClientAndPeriod(UUID clientId, 
                                                           LocalDate startDate, 
                                                           LocalDate endDate) {
        return visitScheduleRepository.findByClientAndDateRange(clientId, startDate, endDate);
    }
    
    /**
     * Inicia execução de uma escala
     */
    @Transactional
    public VisitSchedule startSchedule(UUID scheduleId) {
        VisitSchedule schedule = visitScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
        
        if (schedule.getStatus() != VisitScheduleStatus.PLANNED) {
            throw new RuntimeException("Escala não está no status PLANNED");
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
            .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
        
        if (schedule.getStatus() != VisitScheduleStatus.IN_PROGRESS) {
            throw new RuntimeException("Escala não está em progresso");
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
            .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
        
        if (schedule.getStatus() == VisitScheduleStatus.COMPLETED) {
            throw new RuntimeException("Não é possível cancelar uma escala já concluída");
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
     * Gera relatório de eficiência de escalas
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
    
    // ===== MÉTODOS COM DTOs =====
    
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
     * Lista escalas por supervisor em período específico como DTO
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
            .unitId(visit.getUnit().getId())
            .visitScheduleId(visit.getVisitSchedule() != null ? visit.getVisitSchedule().getId() : null)
            .status(visit.getStatus())
            .observations(visit.getObservations())
            .arrivalTime(visit.getArrivalTime())
            .departureTime(visit.getDepartureTime())
            .securityCheck(visit.getSecurityCheck())
            .equipmentCheck(visit.getEquipmentCheck())
            .staffCheck(visit.getStaffCheck())
            .procedureCheck(visit.getProcedureCheck())
            .estimatedDurationMinutes(visit.getEstimatedDurationMinutes())
            .priorityLevel(visit.getPriorityLevel())
            .preferredTimeStart(visit.getPreferredTimeStart())
            .preferredTimeEnd(visit.getPreferredTimeEnd())
            .routeOrder(visit.getRouteOrder())
            .travelTimeToNextMinutes(visit.getTravelTimeToNextMinutes())
            .travelDistanceToNextKm(visit.getTravelDistanceToNextKm())
            .supervisorName(visit.getSupervisor().getName())
            .unitName(visit.getUnit().getName())
            .unitAddress(visit.getUnit().getAddress())
            .unitLatitude(visit.getUnit().getLatitude())
            .unitLongitude(visit.getUnit().getLongitude())
            .unitAddressCity(visit.getUnit().getAddressCity())
            .unitAddressState(visit.getUnit().getAddressState())
            .createdAt(visit.getCreatedAt())
            .updatedAt(visit.getUpdatedAt())
            .build();
    }
}
