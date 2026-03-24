package com.z7design.secured_guard.service;

import com.z7design.secured_guard.dto.ScheduleDTO;
import com.z7design.secured_guard.dto.EmployeeScheduleDTO;
import com.z7design.secured_guard.model.Schedule;
import com.z7design.secured_guard.model.EmployeeSchedule;
import com.z7design.secured_guard.model.Location;
import com.z7design.secured_guard.model.Position;
import com.z7design.secured_guard.model.Route;
import com.z7design.secured_guard.model.Patrol;
import com.z7design.secured_guard.model.enums.ScheduleStatus;
import com.z7design.secured_guard.model.enums.Shift;
import com.z7design.secured_guard.repository.ScheduleRepository;
import com.z7design.secured_guard.repository.EmployeeScheduleRepository;
import com.z7design.secured_guard.repository.LocationRepository;
import com.z7design.secured_guard.repository.PositionRepository;
import com.z7design.secured_guard.repository.RouteRepository;
import com.z7design.secured_guard.repository.PatrolRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private EmployeeScheduleRepository employeeScheduleRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private PatrolRepository patrolRepository;

    @InjectMocks
    private ScheduleService scheduleService;

    private UUID locationId;
    private UUID positionId;
    private UUID routeId;
    private UUID patrolId;
    private UUID scheduleId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        locationId = UUID.randomUUID();
        positionId = UUID.randomUUID();
        routeId = UUID.randomUUID();
        patrolId = UUID.randomUUID();
        scheduleId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
    }

    @Test
    void createSchedule_ShouldCreateScheduleSuccessfully() {
        // Arrange
        ScheduleDTO dto = new ScheduleDTO();
        dto.setScheduleDate(LocalDate.now());
        dto.setShift(Shift.MORNING);
        dto.setLocationId(locationId);
        dto.setStatus(ScheduleStatus.PENDING);
        dto.setRouteId(routeId);
        dto.setPatrolId(patrolId);

        Location location = new Location();
        location.setId(locationId);
        Route route = new Route();
        route.setId(routeId);
        Patrol patrol = new Patrol();
        patrol.setId(patrolId);

        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(routeRepository.findById(routeId)).thenReturn(Optional.of(route));
        when(patrolRepository.findById(patrolId)).thenReturn(Optional.of(patrol));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Schedule result = scheduleService.createSchedule(dto);

        // Assert
        assertNotNull(result);
        assertEquals(dto.getScheduleDate(), result.getScheduleDate());
        assertEquals(dto.getShift(), result.getShift());
        assertEquals(location, result.getLocation());
        assertEquals(route, result.getRoute());
        assertEquals(patrol, result.getPatrol());
    }

    @Test
    void createSchedule_WhenLocationNotFound_ShouldThrowException() {
        // Arrange
        ScheduleDTO dto = new ScheduleDTO();
        dto.setLocationId(locationId);

        when(locationRepository.findById(locationId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> scheduleService.createSchedule(dto));
    }

    @Test
    void createEmployeeSchedule_ShouldCreateEmployeeScheduleSuccessfully() {
        // Arrange
        EmployeeScheduleDTO dto = new EmployeeScheduleDTO();
        dto.setScheduleId(scheduleId);
        dto.setPositionId(positionId);

        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        Position position = new Position();
        position.setId(positionId);

        when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(schedule));
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(employeeScheduleRepository.save(any(EmployeeSchedule.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        EmployeeSchedule result = scheduleService.createEmployeeSchedule(dto);

        // Assert
        assertNotNull(result);
        assertEquals(schedule, result.getSchedule());
        assertEquals(position, result.getPosition());
    }

    @Test
    void findByEmployeeId_ShouldReturnSchedules() {
        // Arrange
        List<Schedule> expectedSchedules = Arrays.asList(
            new Schedule(), new Schedule()
        );
        when(scheduleRepository.findByEmployeeId(employeeId)).thenReturn(expectedSchedules);

        // Act
        List<Schedule> result = scheduleService.findByEmployeeId(employeeId);

        // Assert
        assertEquals(expectedSchedules, result);
        verify(scheduleRepository).findByEmployeeId(employeeId);
    }

    @Test
    void findByDate_ShouldReturnSchedules() {
        // Arrange
        LocalDate date = LocalDate.now();
        List<Schedule> expectedSchedules = Arrays.asList(
            new Schedule(), new Schedule()
        );
        when(scheduleRepository.findByScheduleDate(date)).thenReturn(expectedSchedules);

        // Act
        List<Schedule> result = scheduleService.findByDate(date);

        // Assert
        assertEquals(expectedSchedules, result);
        verify(scheduleRepository).findByScheduleDate(date);
    }

    @Test
    void findAll_ShouldReturnAllSchedules() {
        // Arrange
        List<Schedule> expectedSchedules = Arrays.asList(
            new Schedule(), new Schedule()
        );
        when(scheduleRepository.findAll()).thenReturn(expectedSchedules);

        // Act
        List<Schedule> result = scheduleService.findAll();

        // Assert
        assertEquals(expectedSchedules, result);
        verify(scheduleRepository).findAll();
    }

    @Test
    void update_ShouldUpdateScheduleSuccessfully() {
        // Arrange
        Schedule existingSchedule = new Schedule();
        existingSchedule.setId(scheduleId);
        existingSchedule.setScheduleDate(LocalDate.now());
        existingSchedule.setShift(Shift.MORNING);

        Schedule updatedSchedule = new Schedule();
        updatedSchedule.setScheduleDate(LocalDate.now().plusDays(1));
        updatedSchedule.setShift(Shift.NIGHT);

        when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(existingSchedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Schedule result = scheduleService.update(scheduleId, updatedSchedule);

        // Assert
        assertNotNull(result);
        assertEquals(updatedSchedule.getScheduleDate(), result.getScheduleDate());
        assertEquals(updatedSchedule.getShift(), result.getShift());
    }

    @Test
    void delete_ShouldDeleteSchedule() {
        // Arrange
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);

        when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(schedule));
        doNothing().when(scheduleRepository).delete(schedule);

        // Act
        scheduleService.delete(scheduleId);

        // Assert
        verify(scheduleRepository).delete(schedule);
    }
} 