package com.z7design.secured_guard.service;

import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.TimeRecord;
import com.z7design.secured_guard.model.enums.TimeRecordStatus;
import com.z7design.secured_guard.repository.TimeRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TimeRecordServiceTest {

    @Mock
    private TimeRecordRepository timeRecordRepository;

    @InjectMocks
    private TimeRecordService timeRecordService;

    private TimeRecord timeRecord;
    private Employee employee;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        timeRecord = TimeRecord.builder()
            .id(UUID.randomUUID())
            .employee(employee)
            .recordDate(LocalDate.now())
            .entryTime(LocalTime.of(9, 0))
            .exitTime(LocalTime.of(18, 0))
            .entryLunchTime(LocalTime.of(12, 0))
            .exitLunchTime(LocalTime.of(13, 0))
            .status(TimeRecordStatus.PENDING)
            .build();
    }

    @Test
    void whenCreateTimeRecord_thenTimeRecordIsCreated() {
        when(timeRecordRepository.save(any(TimeRecord.class))).thenReturn(timeRecord);

        TimeRecord created = timeRecordService.create(timeRecord);

        assertNotNull(created);
        assertEquals(TimeRecordStatus.PENDING, created.getStatus());
        verify(timeRecordRepository, times(1)).save(any(TimeRecord.class));
    }

    @Test
    void whenApproveTimeRecord_thenStatusIsApproved() {
        when(timeRecordRepository.findById(timeRecord.getId())).thenReturn(Optional.of(timeRecord));
        when(timeRecordRepository.save(any(TimeRecord.class))).thenReturn(timeRecord);

        TimeRecord approved = timeRecordService.approve(timeRecord.getId());

        assertNotNull(approved);
        assertEquals(TimeRecordStatus.APPROVED, approved.getStatus());
        verify(timeRecordRepository, times(1)).save(any(TimeRecord.class));
    }

    @Test
    void whenRejectTimeRecord_thenStatusIsRejected() {
        when(timeRecordRepository.findById(timeRecord.getId())).thenReturn(Optional.of(timeRecord));
        when(timeRecordRepository.save(any(TimeRecord.class))).thenReturn(timeRecord);

        TimeRecord rejected = timeRecordService.reject(timeRecord.getId(), "Test rejection reason");

        assertNotNull(rejected);
        assertEquals(TimeRecordStatus.REJECTED, rejected.getStatus());
        verify(timeRecordRepository, times(1)).save(any(TimeRecord.class));
    }

    @Test
    void whenAdjustTimeRecord_thenStatusIsAdjusted() {
        when(timeRecordRepository.findById(timeRecord.getId())).thenReturn(Optional.of(timeRecord));
        when(timeRecordRepository.save(any(TimeRecord.class))).thenReturn(timeRecord);

        TimeRecord adjusted = timeRecordService.adjust(
            timeRecord.getId(),
            LocalTime.of(8, 30),
            LocalTime.of(17, 30),
            LocalTime.of(12, 0),
            LocalTime.of(13, 0),
            "Test adjustment reason"
        );

        assertNotNull(adjusted);
        assertEquals(TimeRecordStatus.ADJUSTED, adjusted.getStatus());
        verify(timeRecordRepository, times(1)).save(any(TimeRecord.class));
    }

    @Test
    void whenUpdateTimeRecord_thenTimeRecordIsUpdated() {
        when(timeRecordRepository.findById(timeRecord.getId())).thenReturn(Optional.of(timeRecord));
        when(timeRecordRepository.save(any(TimeRecord.class))).thenReturn(timeRecord);

        TimeRecord updated = timeRecordService.update(timeRecord.getId(), timeRecord);

        assertNotNull(updated);
        verify(timeRecordRepository, times(1)).save(any(TimeRecord.class));
    }

    @Test
    void whenFindById_thenReturnTimeRecord() {
        when(timeRecordRepository.findById(timeRecord.getId())).thenReturn(Optional.of(timeRecord));

        TimeRecord found = timeRecordService.findById(timeRecord.getId());

        assertNotNull(found);
        assertEquals(timeRecord.getId(), found.getId());
        assertEquals(timeRecord.getEmployee(), found.getEmployee());
    }

    @Test
    void whenFindByIdAndNotFound_thenThrowException() {
        when(timeRecordRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> timeRecordService.findById(UUID.randomUUID()));
    }

    @Test
    void whenFindByEmployeeIdAndRecordDateBetween_thenReturnTimeRecords() {
        List<TimeRecord> timeRecords = Arrays.asList(timeRecord);
        when(timeRecordRepository.findByEmployeeIdAndRecordDateBetween(
            employee.getId(),
            LocalDate.now(),
            LocalDate.now()
        )).thenReturn(timeRecords);

        List<TimeRecord> found = timeRecordService.findByEmployeeIdAndRecordDateBetween(
            employee.getId(),
            LocalDate.now(),
            LocalDate.now()
        );

        assertNotNull(found);
        assertEquals(1, found.size());
        assertEquals(timeRecord.getId(), found.get(0).getId());
    }

    @Test
    void whenFindByEmployeeIdAndStatus_thenReturnTimeRecords() {
        List<TimeRecord> timeRecords = Arrays.asList(timeRecord);
        when(timeRecordRepository.findByEmployeeIdAndStatus(
            employee.getId(),
            TimeRecordStatus.PENDING
        )).thenReturn(timeRecords);

        List<TimeRecord> found = timeRecordService.findByEmployeeIdAndStatus(
            employee.getId(),
            TimeRecordStatus.PENDING
        );

        assertNotNull(found);
        assertEquals(1, found.size());
        assertEquals(timeRecord.getId(), found.get(0).getId());
    }

    @Test
    void whenCalculateWorkHours_thenReturnCorrectHours() {
        timeRecord.setEntryTime(LocalTime.of(9, 0));
        timeRecord.setExitTime(LocalTime.of(18, 0));
        timeRecord.setEntryLunchTime(LocalTime.of(12, 0));
        timeRecord.setExitLunchTime(LocalTime.of(13, 0));

        long workHours = timeRecordService.calculateWorkHours(timeRecord);
        assertEquals(8, workHours);
    }

    @Test
    void whenCalculateWorkHoursWithoutLunch_thenReturnCorrectHours() {
        timeRecord.setEntryTime(LocalTime.of(9, 0));
        timeRecord.setExitTime(LocalTime.of(18, 0));
        timeRecord.setEntryLunchTime(null);
        timeRecord.setExitLunchTime(null);

        long workHours = timeRecordService.calculateWorkHours(timeRecord);
        assertEquals(9, workHours);
    }

    @Test
    void whenCalculateWorkHoursWithMissingTimes_thenReturnZero() {
        timeRecord.setEntryTime(null);
        timeRecord.setExitTime(null);
        timeRecord.setEntryLunchTime(null);
        timeRecord.setExitLunchTime(null);

        long workHours = timeRecordService.calculateWorkHours(timeRecord);
        assertEquals(0, workHours);
    }
} 