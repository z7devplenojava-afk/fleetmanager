package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ScheduleDTO;
import br.com.fleetmanager.dto.EmployeeScheduleDTO;
import br.com.fleetmanager.dto.CreateScheduleDTO;
import br.com.fleetmanager.model.Schedule;
import br.com.fleetmanager.model.EmployeeSchedule;
import br.com.fleetmanager.model.Location;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.Position;
import br.com.fleetmanager.model.Route;
import br.com.fleetmanager.model.Patrol;
import br.com.fleetmanager.repository.ScheduleRepository;
import br.com.fleetmanager.repository.EmployeeScheduleRepository;
import br.com.fleetmanager.repository.LocationRepository;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.PositionRepository;
import br.com.fleetmanager.repository.RouteRepository;
import br.com.fleetmanager.repository.PatrolRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final LocationRepository locationRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final RouteRepository routeRepository;
    private final PatrolRepository patrolRepository;

    @Transactional
    public Schedule create(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule createFromDTO(CreateScheduleDTO dto) {
        // Buscar Employee e Location pelos IDs
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with ID: " + dto.getEmployeeId()));
        
        Location location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Location not found with ID: " + dto.getLocationId()));

        // Criar Schedule
        Schedule schedule = Schedule.builder()
                .employee(employee)
                .location(location)
                .scheduleDate(dto.getScheduleDate())
                .shift(dto.getShift())
                .status(dto.getStatus())
                .observations(dto.getObservations())
                .build();

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule update(UUID id, Schedule schedule) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        
        existingSchedule.setScheduleDate(schedule.getScheduleDate());
        existingSchedule.setShift(schedule.getShift());
        existingSchedule.setLocation(schedule.getLocation());
        existingSchedule.setStatus(schedule.getStatus());
        existingSchedule.setRoute(schedule.getRoute());
        existingSchedule.setPatrol(schedule.getPatrol());
        existingSchedule.setObservations(schedule.getObservations());
        
        return scheduleRepository.save(existingSchedule);
    }

    @Transactional
    public void delete(UUID id) {
        scheduleRepository.deleteById(id);
    }

    public Schedule findById(UUID id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
    }

    public List<Schedule> findByEmployeeId(UUID employeeId) {
        return scheduleRepository.findByEmployeeId(employeeId);
    }

    public List<Schedule> findByDate(LocalDate date) {
        return scheduleRepository.findByScheduleDate(date);
    }

    public List<Schedule> findAll() {
        return scheduleRepository.findAll();
    }

    @Transactional
    public Schedule createSchedule(ScheduleDTO dto) {
        Location location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Location not found"));
        
        Route route = routeRepository.findById(dto.getRouteId())
                .orElseThrow(() -> new EntityNotFoundException("Route not found"));
        
        Patrol patrol = patrolRepository.findById(dto.getPatrolId())
                .orElseThrow(() -> new EntityNotFoundException("Patrol not found"));

        Schedule schedule = new Schedule();
        schedule.setScheduleDate(dto.getScheduleDate());
        schedule.setShift(dto.getShift());
        schedule.setLocation(location);
        schedule.setStatus(dto.getStatus());
        schedule.setRoute(route);
        schedule.setPatrol(patrol);
        schedule.setObservations(dto.getObservations());

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public EmployeeSchedule createEmployeeSchedule(EmployeeScheduleDTO dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
        
        Position position = positionRepository.findById(dto.getPositionId())
                .orElseThrow(() -> new EntityNotFoundException("Position not found"));

        EmployeeSchedule employeeSchedule = new EmployeeSchedule();
        employeeSchedule.setSchedule(schedule);
        employeeSchedule.setPosition(position);
        employeeSchedule.setObservations(dto.getObservations());

        return employeeScheduleRepository.save(employeeSchedule);
    }

    public List<Schedule> findByPeriod(LocalDate startDate, LocalDate endDate) {
        return scheduleRepository.findByScheduleDateBetween(startDate, endDate);
    }

    public List<EmployeeSchedule> findByScheduleId(UUID scheduleId) {
        return employeeScheduleRepository.findByScheduleId(scheduleId);
    }
} 