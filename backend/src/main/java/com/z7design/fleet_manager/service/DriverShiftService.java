package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.RouteExecutionRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gestão de turnos de motoristas.
 * Gerencia a jornada de trabalho, calcula disponibilidade e controla execuções de rotas.
 */
@Service
public class DriverShiftService {

    @Autowired
    private DriverShiftRepository shiftRepository;

    @Autowired
    private RouteExecutionRepository executionRepository;

    @Autowired
    private RouteRepository routeRepository;

    // ========================
    // CRUD de Turnos
    // ========================

    public List<DriverShift> findAll() {
        return shiftRepository.findAll();
    }

    public DriverShift findById(UUID id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno não encontrado: " + id));
    }

    public List<DriverShift> findByDate(LocalDate date) {
        return shiftRepository.findByShiftDate(date);
    }

    public List<DriverShift> findByDriverAndDate(UUID driverId, LocalDate date) {
        return shiftRepository.findByDriverIdAndShiftDate(driverId, date);
    }

    public List<DriverShift> findByDriverAndPeriod(UUID driverId, LocalDate start, LocalDate end) {
        return shiftRepository.findByDriverIdAndShiftDateBetween(driverId, start, end);
    }

    @Transactional
    public DriverShift createShift(DriverShift shift) {
        shift.calculateTotalHours();
        shift.setHoursUsed(0.0);
        shift.setHoursRemaining(shift.getTotalShiftHours());
        return shiftRepository.save(shift);
    }

    @Transactional
    public DriverShift updateShift(UUID id, DriverShift details) {
        DriverShift shift = findById(id);
        shift.setPlannedStartTime(details.getPlannedStartTime());
        shift.setPlannedEndTime(details.getPlannedEndTime());
        shift.setBreakStartTime(details.getBreakStartTime());
        shift.setBreakEndTime(details.getBreakEndTime());
        shift.setVehicle(details.getVehicle());
        shift.setObservations(details.getObservations());
        shift.recalculateAvailability();
        return shiftRepository.save(shift);
    }

    @Transactional
    public void deleteShift(UUID id) {
        DriverShift shift = findById(id);
        shiftRepository.delete(shift);
    }

    // ========================
    // Controle de Turno (Início/Fim/Pausa)
    // ========================

    /** Motorista inicia o turno */
    @Transactional
    public DriverShift startShift(UUID shiftId) {
        DriverShift shift = findById(shiftId);
        shift.setActualStartTime(LocalTime.now());
        shift.setStatus(DriverShift.DriverShiftStatus.IN_PROGRESS);
        shift.recalculateAvailability();
        return shiftRepository.save(shift);
    }

    /** Motorista finaliza o turno */
    @Transactional
    public DriverShift endShift(UUID shiftId) {
        DriverShift shift = findById(shiftId);
        shift.setActualEndTime(LocalTime.now());
        shift.setStatus(DriverShift.DriverShiftStatus.COMPLETED);
        shift.setAvailableForReallocation(false);
        return shiftRepository.save(shift);
    }

    /** Motorista entra em intervalo */
    @Transactional
    public DriverShift startBreak(UUID shiftId) {
        DriverShift shift = findById(shiftId);
        shift.setStatus(DriverShift.DriverShiftStatus.ON_BREAK);
        return shiftRepository.save(shift);
    }

    /** Motorista retorna do intervalo */
    @Transactional
    public DriverShift endBreak(UUID shiftId) {
        DriverShift shift = findById(shiftId);
        shift.setStatus(DriverShift.DriverShiftStatus.IN_PROGRESS);
        shift.recalculateAvailability();
        return shiftRepository.save(shift);
    }

    // ========================
    // Atualização de Localização
    // ========================

    /** Atualiza a localização atual do motorista */
    @Transactional
    public DriverShift updateLocation(UUID shiftId, double latitude, double longitude, String locationName) {
        DriverShift shift = findById(shiftId);
        shift.setCurrentLatitude(latitude);
        shift.setCurrentLongitude(longitude);
        shift.setCurrentLocationName(locationName);
        return shiftRepository.save(shift);
    }

    // ========================
    // Execução de Rotas dentro do Turno
    // ========================

    /** Adiciona uma rota ao turno do motorista */
    @Transactional
    public RouteExecution assignRouteToShift(UUID shiftId, UUID routeId, LocalTime plannedStart,
                                              LocalTime plannedEnd, boolean isReallocation) {
        DriverShift shift = findById(shiftId);
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new EntityNotFoundException("Rota não encontrada: " + routeId));

        int order = shift.getRouteExecutions().size() + 1;

        // Calcular duração estimada
        Integer estimatedMinutes = null;
        if (route.getEstimatedDuration() != null) {
            estimatedMinutes = (int) route.getEstimatedDuration().toMinutes();
        } else if (plannedStart != null && plannedEnd != null) {
            estimatedMinutes = (int) Duration.between(plannedStart, plannedEnd).toMinutes();
        }

        RouteExecution execution = RouteExecution.builder()
                .driverShift(shift)
                .route(route)
                .driver(shift.getDriver())
                .vehicle(shift.getVehicle())
                .plannedStartTime(plannedStart)
                .plannedEndTime(plannedEnd)
                .estimatedDurationMinutes(estimatedMinutes)
                .estimatedKm(route.getDistanceKm())
                .executionOrder(order)
                .reallocation(isReallocation)
                .status(RouteExecutionStatus.SCHEDULED)
                .build();

        shift.getRouteExecutions().add(execution);
        shift.recalculateAvailability();
        shiftRepository.save(shift);
        return execution;
    }

    /** Motorista inicia uma rota */
    @Transactional
    public RouteExecution startRouteExecution(UUID executionId, Double latitude, Double longitude) {
        RouteExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new EntityNotFoundException("Execução não encontrada: " + executionId));
        execution.setActualStartTime(LocalTime.now());
        execution.setStartLatitude(latitude);
        execution.setStartLongitude(longitude);
        execution.setStatus(RouteExecutionStatus.IN_PROGRESS);
        return executionRepository.save(execution);
    }

    /** Motorista finaliza uma rota */
    @Transactional
    public RouteExecution completeRouteExecution(UUID executionId, Double latitude, Double longitude,
                                                  Double actualKm, String observations) {
        RouteExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new EntityNotFoundException("Execução não encontrada: " + executionId));
        execution.setActualEndTime(LocalTime.now());
        execution.setEndLatitude(latitude);
        execution.setEndLongitude(longitude);
        execution.setActualKm(actualKm);
        execution.setObservations(observations);
        execution.setStatus(RouteExecutionStatus.COMPLETED);
        execution.calculateActualDuration();

        executionRepository.save(execution);

        // Recalcular disponibilidade do turno
        DriverShift shift = execution.getDriverShift();
        shift.recalculateAvailability();

        // Se o motorista terminou todas as rotas e tem horas sobrando, marcar como disponível
        if (shift.isAvailableForReallocation()) {
            shift.setStatus(DriverShift.DriverShiftStatus.AVAILABLE);
            shift.setCurrentLatitude(latitude);
            shift.setCurrentLongitude(longitude);
        }

        shiftRepository.save(shift);
        return execution;
    }

    // ========================
    // Consultas de Disponibilidade
    // ========================

    /** Motoristas disponíveis para realocação hoje */
    public List<DriverShift> findAvailableDrivers() {
        return shiftRepository.findAvailableForReallocation(LocalDate.now());
    }

    /** Motoristas disponíveis para realocação em uma data */
    public List<DriverShift> findAvailableDrivers(LocalDate date) {
        return shiftRepository.findAvailableForReallocation(date);
    }

    /** Motoristas disponíveis próximos a uma localização */
    public List<DriverShift> findAvailableNearby(double latitude, double longitude,
                                                   double radiusKm, double minHours) {
        // Converter km para graus (aproximação: 1 grau ≈ 111 km)
        double radiusDegrees = radiusKm / 111.0;
        return shiftRepository.findAvailableNearLocation(
                LocalDate.now(), latitude, longitude, radiusDegrees, minHours);
    }
}
