package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.TrafficDashboardStatsDTO;
import com.z7design.fleet_manager.model.DriverShift;
import com.z7design.fleet_manager.model.RouteExecutionStatus;
import com.z7design.fleet_manager.model.Schedule;
import com.z7design.fleet_manager.model.TravelTrip;
import com.z7design.fleet_manager.model.enums.ScheduleStatus;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.RouteExecutionRepository;
import com.z7design.fleet_manager.repository.ScheduleRepository;
import com.z7design.fleet_manager.repository.TravelTripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service para calcular estatísticas do dashboard de Gestão de Tráfego.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrafficDashboardService {

    private final ScheduleRepository scheduleRepository;
    private final TravelTripRepository travelTripRepository;
    private final DriverShiftRepository driverShiftRepository;
    private final RouteExecutionRepository routeExecutionRepository;

    /**
     * Calcula todas as estatísticas do dashboard de tráfego.
     */
    @Transactional(readOnly = true)
    public TrafficDashboardStatsDTO getStats() {
        LocalDate today = LocalDate.now();
        log.info("📊 Calculando estatísticas de tráfego para {}", today);

        // --- Escalas do dia ---
        List<Schedule> todaySchedules = scheduleRepository.findByScheduleDate(today);
        long totalSchedulesToday = todaySchedules.size();

        long approvedOrInProgress = todaySchedules.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.APPROVED
                        || s.getStatus() == ScheduleStatus.IN_PROGRESS)
                .count();

        // --- Viagens ativas (TravelTrips cadastradas com status ACTIVE) ---
        List<TravelTrip> activeTrips = travelTripRepository
                .findByStatus(TravelTrip.TravelTripStatus.ACTIVE);
        long totalActiveTravelTrips = activeTrips.size();

        // --- Driver Shifts do dia ---
        List<DriverShift> todayShifts = driverShiftRepository.findByShiftDate(today);
        long driversOnShiftToday = todayShifts.size();

        long shiftsInProgress = todayShifts.stream()
                .filter(s -> s.getStatus() == DriverShift.DriverShiftStatus.IN_PROGRESS)
                .count();

        long driversAvailable = todayShifts.stream()
                .filter(DriverShift::isAvailableForReallocation)
                .count();

        // --- Viagens ativas = escalas IN_PROGRESS + turnos IN_PROGRESS ---
        long schedulesInProgress = todaySchedules.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.IN_PROGRESS)
                .count();
        long activeTripsCount = schedulesInProgress + shiftsInProgress;
        // Se não há dados de execução, usar as escalas aprovadas como proxy
        if (activeTripsCount == 0) {
            activeTripsCount = approvedOrInProgress;
        }

        // --- Embarques hoje = escalas não canceladas/rejeitadas ---
        long boardingsToday = todaySchedules.stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED
                        && s.getStatus() != ScheduleStatus.REJECTED)
                .count();

        // --- Alertas geofence (queries otimizadas no banco) ---
        long delayedToday = routeExecutionRepository.countByStatusAndShiftDate(
                RouteExecutionStatus.DELAYED, today);
        long cancelledRoutesToday = routeExecutionRepository.countByStatusAndShiftDate(
                RouteExecutionStatus.CANCELLED, today);
        long scheduleCancelled = todaySchedules.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.CANCELLED
                        || s.getStatus() == ScheduleStatus.REJECTED)
                .count();
        long geofenceAlerts = delayedToday + cancelledRoutesToday + scheduleCancelled;

        // --- Taxa de ocupação ---
        double occupancyRate = 0;
        if (totalSchedulesToday > 0) {
            long occupied = todaySchedules.stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.APPROVED
                            || s.getStatus() == ScheduleStatus.IN_PROGRESS
                            || s.getStatus() == ScheduleStatus.COMPLETED)
                    .count();
            occupancyRate = Math.round(((double) occupied / totalSchedulesToday) * 100.0 * 10) / 10.0;
        }

        // --- Rotas concluídas/em progresso hoje (queries otimizadas) ---
        long completedRoutesToday = routeExecutionRepository.countByStatusAndShiftDate(
                RouteExecutionStatus.COMPLETED, today);
        long routesInProgressNow = routeExecutionRepository.countByStatusAndShiftDate(
                RouteExecutionStatus.IN_PROGRESS, today);

        TrafficDashboardStatsDTO stats = TrafficDashboardStatsDTO.builder()
                .activeTrips(activeTripsCount)
                .boardingsToday(boardingsToday)
                .geofenceAlerts(geofenceAlerts)
                .occupancyRate(occupancyRate)
                .totalActiveTravelTrips(totalActiveTravelTrips)
                .driversOnShiftToday(driversOnShiftToday)
                .totalSchedulesToday(totalSchedulesToday)
                .completedRoutesToday(completedRoutesToday)
                .routesInProgressNow(routesInProgressNow)
                .driversAvailableForReallocation(driversAvailable)
                .build();

        log.info("📊 Estatísticas: viagens={}, embarques={}, alertas={}, ocupação={}%",
                stats.getActiveTrips(), stats.getBoardingsToday(),
                stats.getGeofenceAlerts(), stats.getOccupancyRate());

        return stats;
    }
}
