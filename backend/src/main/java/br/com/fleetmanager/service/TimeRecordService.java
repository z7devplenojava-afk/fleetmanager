package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.TimeRecord;
import br.com.fleetmanager.model.enums.TimeRecordStatus;
import br.com.fleetmanager.repository.TimeRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimeRecordService {
    
    private final TimeRecordRepository timeRecordRepository;
    
    @Transactional
    public TimeRecord create(TimeRecord timeRecord) {
        validateTimeRecord(timeRecord);
        timeRecord.setStatus(TimeRecordStatus.PENDING);
        return timeRecordRepository.save(timeRecord);
    }
    
    @Transactional
    public TimeRecord update(UUID id, TimeRecord timeRecord) {
        TimeRecord existingTimeRecord = findById(id);
        validateTimeRecord(timeRecord);
        
        existingTimeRecord.setEntryTime(timeRecord.getEntryTime());
        existingTimeRecord.setExitTime(timeRecord.getExitTime());
        existingTimeRecord.setEntryLunchTime(timeRecord.getEntryLunchTime());
        existingTimeRecord.setExitLunchTime(timeRecord.getExitLunchTime());
        
        return timeRecordRepository.save(existingTimeRecord);
    }
    
    @Transactional
    public TimeRecord approve(UUID id) {
        TimeRecord timeRecord = findById(id);
        timeRecord.setStatus(TimeRecordStatus.APPROVED);
        return timeRecordRepository.save(timeRecord);
    }
    
    @Transactional
    public TimeRecord reject(UUID id, String justification) {
        TimeRecord timeRecord = findById(id);
        timeRecord.setStatus(TimeRecordStatus.REJECTED);
        timeRecord.setJustification(justification);
        return timeRecordRepository.save(timeRecord);
    }
    
    @Transactional
    public TimeRecord adjust(UUID id, LocalTime entryTime, LocalTime exitTime, 
            LocalTime entryLunchTime, LocalTime exitLunchTime, String justification) {
        TimeRecord timeRecord = findById(id);
        
        timeRecord.setEntryTime(entryTime);
        timeRecord.setExitTime(exitTime);
        timeRecord.setEntryLunchTime(entryLunchTime);
        timeRecord.setExitLunchTime(exitLunchTime);
        timeRecord.setStatus(TimeRecordStatus.ADJUSTED);
        timeRecord.setJustification(justification);
        
        return timeRecordRepository.save(timeRecord);
    }
    
    public TimeRecord findById(UUID id) {
        return timeRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time record not found with id: " + id));
    }
    
    public List<TimeRecord> findByEmployeeId(UUID employeeId) {
        return timeRecordRepository.findByEmployeeId(employeeId);
    }
    
    public List<TimeRecord> findByEmployeeIdAndRecordDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return timeRecordRepository.findByEmployeeIdAndRecordDateBetween(employeeId, startDate, endDate);
    }
    
    public List<TimeRecord> findByEmployeeIdAndStatus(UUID employeeId, TimeRecordStatus status) {
        return timeRecordRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    private void validateTimeRecord(TimeRecord timeRecord) {
        if (timeRecord.getEmployee() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
        if (timeRecord.getRecordDate() == null) {
            throw new IllegalArgumentException("Record date is required");
        }
        if (timeRecord.getEntryTime() != null && timeRecord.getExitTime() != null 
                && timeRecord.getEntryTime().isAfter(timeRecord.getExitTime())) {
            throw new IllegalArgumentException("Entry time cannot be after exit time");
        }
        if (timeRecord.getEntryLunchTime() != null && timeRecord.getExitLunchTime() != null 
                && timeRecord.getEntryLunchTime().isAfter(timeRecord.getExitLunchTime())) {
            throw new IllegalArgumentException("Lunch entry time cannot be after lunch exit time");
        }
    }
    
    public long calculateWorkHours(TimeRecord timeRecord) {
        if (timeRecord.getEntryTime() == null || timeRecord.getExitTime() == null) {
            return 0;
        }
        
        long totalMinutes = ChronoUnit.MINUTES.between(timeRecord.getEntryTime(), timeRecord.getExitTime());
        
        if (timeRecord.getEntryLunchTime() != null && timeRecord.getExitLunchTime() != null) {
            long lunchMinutes = ChronoUnit.MINUTES.between(timeRecord.getEntryLunchTime(), timeRecord.getExitLunchTime());
            totalMinutes -= lunchMinutes;
        }
        
        return totalMinutes / 60;
    }
} 