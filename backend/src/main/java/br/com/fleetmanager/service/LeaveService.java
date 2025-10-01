package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Leave;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.LeaveStatus;
import br.com.fleetmanager.model.enums.LeaveType;
import br.com.fleetmanager.repository.LeaveRepository;
import br.com.fleetmanager.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LeaveService {
    
    @Autowired
    private LeaveRepository leaveRepository;
    private final UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    @Transactional
    public Leave create(Leave leave) {
        validateLeave(leave);
        leave.setStatus(LeaveStatus.PENDENTE);
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public Leave update(UUID id, Leave leave) {
        Leave existingLeave = findById(id);
        validateLeave(leave);
        
        existingLeave.setStartDate(leave.getStartDate());
        existingLeave.setEndDate(leave.getEndDate());
        existingLeave.setType(leave.getType());
        existingLeave.setReason(leave.getReason());
        
        return leaveRepository.save(existingLeave);
    }
    
    @Transactional
    public Leave approve(UUID id, UUID approvedBy) {
        Leave leave = findById(id);
        User approver = userService.findById(approvedBy)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + approvedBy));
        leave.setStatus(LeaveStatus.APROVADO);
        leave.setApprovedBy(approver);
        leave.setApprovalDate(LocalDateTime.now());
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public Leave reject(UUID id, String justification) {
        Leave leave = findById(id);
        leave.setStatus(LeaveStatus.REJEITADO);
        leave.setJustification(justification);
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public Leave cancel(UUID id) {
        Leave leave = findById(id);
        leave.setStatus(LeaveStatus.CANCELADO);
        return leaveRepository.save(leave);
    }
    
    public Leave findById(UUID id) {
        return leaveRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Leave not found with id: " + id));
    }
    
    public List<Leave> findByEmployeeId(UUID employeeId) {
        return leaveRepository.findByEmployeeId(employeeId);
    }
    
    public List<Leave> findByEmployeeIdAndStatus(UUID employeeId, LeaveStatus status) {
        return leaveRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<Leave> findByEmployeeIdAndLeaveType(UUID employeeId, LeaveType type) {
        return leaveRepository.findByEmployeeIdAndType(employeeId, type);
    }
    
    public List<Leave> findByStartDateBetween(LocalDate startDate, LocalDate endDate) {
        return leaveRepository.findByStartDateBetween(startDate, endDate);
    }
    
    private void validateLeave(Leave leave) {
        if (leave.getStartDate() == null || leave.getEndDate() == null) {
            throw new IllegalArgumentException("Data de início e fim são obrigatórias");
        }
        
        if (leave.getStartDate().isAfter(leave.getEndDate())) {
            throw new IllegalArgumentException("Data de início não pode ser posterior à data de fim");
        }
        
        if (leave.getType() == null) {
            throw new IllegalArgumentException("Tipo de ausência é obrigatório");
        }
        
        if (leave.getReason() == null || leave.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Motivo da ausência é obrigatório");
        }
    }
} 