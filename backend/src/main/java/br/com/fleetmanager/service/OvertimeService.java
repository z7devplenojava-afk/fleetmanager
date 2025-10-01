package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Overtime;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.OvertimeStatus;
import br.com.fleetmanager.model.enums.OvertimeType;
import br.com.fleetmanager.repository.OvertimeRepository;

@Service
public class OvertimeService {
    
    @Autowired
    private OvertimeRepository overtimeRepository;
    
    @Autowired
    private UserService userService;
    
    @Transactional
    public Overtime create(Overtime overtime) {
        validateOvertime(overtime);
        calculateTotalHours(overtime);
        overtime.setStatus(OvertimeStatus.PENDING);
        return overtimeRepository.save(overtime);
    }
    
    @Transactional
    public Overtime update(UUID id, Overtime overtime) {
        Overtime existingOvertime = findById(id);
        validateOvertime(overtime);
        calculateTotalHours(overtime);
        
        existingOvertime.setOvertimeDate(overtime.getOvertimeDate());
        existingOvertime.setStartTime(overtime.getStartTime());
        existingOvertime.setEndTime(overtime.getEndTime());
        existingOvertime.setTotalHours(overtime.getTotalHours());
        existingOvertime.setType(overtime.getType());
        existingOvertime.setReason(overtime.getReason());
        
        return overtimeRepository.save(existingOvertime);
    }
    
    @Transactional
    public Overtime approve(UUID id, UUID approvedBy) {
        Overtime overtime = findById(id);
        User approver = userService.findById(approvedBy)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + approvedBy));
        overtime.setStatus(OvertimeStatus.APPROVED);
        overtime.setApprovedBy(approver);
        overtime.setApprovalDate(LocalDateTime.now());
        return overtimeRepository.save(overtime);
    }
    
    @Transactional
    public Overtime reject(UUID id, String justification) {
        Overtime overtime = findById(id);
        overtime.setStatus(OvertimeStatus.REJECTED);
        overtime.setJustification(justification);
        return overtimeRepository.save(overtime);
    }
    
    @Transactional
    public Overtime compensate(UUID id) {
        Overtime overtime = findById(id);
        overtime.setStatus(OvertimeStatus.COMPENSATED);
        return overtimeRepository.save(overtime);
    }
    
    public Overtime findById(UUID id) {
        return overtimeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Overtime not found with id: " + id));
    }
    
    public List<Overtime> findByEmployeeId(UUID employeeId) {
        return overtimeRepository.findByEmployeeId(employeeId);
    }
    
    public List<Overtime> findByEmployeeIdAndStatus(UUID employeeId, OvertimeStatus status) {
        return overtimeRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<Overtime> findByEmployeeIdAndType(UUID employeeId, OvertimeType type) {
        return overtimeRepository.findByEmployeeIdAndType(employeeId, type);
    }
    
    public List<Overtime> findByEmployeeIdAndOvertimeDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return overtimeRepository.findByEmployeeIdAndOvertimeDateBetween(employeeId, startDate, endDate);
    }
    
    private void validateOvertime(Overtime overtime) {
        if (overtime.getOvertimeDate() == null) {
            throw new IllegalArgumentException("Overtime date is required");
        }
        
        if (overtime.getStartTime() == null || overtime.getEndTime() == null) {
            throw new IllegalArgumentException("Start and end times are required");
        }
        
        if (overtime.getStartTime().isAfter(overtime.getEndTime())) {
            throw new IllegalArgumentException("Start time cannot be after end time");
        }
        
        if (overtime.getType() == null) {
            throw new IllegalArgumentException("Overtime type is required");
        }
        
        if (overtime.getReason() == null || overtime.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Overtime reason is required");
        }
    }
    
    private void calculateTotalHours(Overtime overtime) {
        long minutes = ChronoUnit.MINUTES.between(overtime.getStartTime(), overtime.getEndTime());
        overtime.setTotalHours(minutes / 60.0);
    }
} 