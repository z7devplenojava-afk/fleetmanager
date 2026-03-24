package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Payroll;
import com.z7design.fleet_manager.repository.PayrollRepository;
import com.z7design.fleet_manager.model.enums.PayrollStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PayrollService {
    
    private final PayrollRepository payrollRepository;
    
    @Transactional
    public Payroll create(Payroll payroll) {
        return payrollRepository.save(payroll);
    }
    
    @Transactional
    public Payroll update(UUID id, Payroll payroll) {
        // Ensure entity exists, then persist updated fields
        findById(id);
        payroll.setId(id);
        return payrollRepository.save(payroll);
    }
    
    @Transactional
    public void delete(UUID id) {
        Payroll payroll = findById(id);
        payrollRepository.delete(payroll);
    }
    
    public Payroll findById(UUID id) {
        return payrollRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
    }
    
    public List<Payroll> findByEmployeeId(UUID employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }
    
    public List<Payroll> findByUnitId(UUID unitId) {
        return payrollRepository.findByUnitId(unitId);
    }
    
    public List<Payroll> findByDateBetween(String startDate, String endDate) {
        return payrollRepository.findByDateBetween(startDate, endDate);
    }
    
    public List<Payroll> findByMonth(String month) {
        return payrollRepository.findByMonth(month);
    }
    
    public List<Payroll> findByYear(Integer year) {
        return payrollRepository.findByYear(year);
    }
    
    public List<Payroll> findAll() {
        return payrollRepository.findAll();
    }

    // ===== TransiÃ§Ãµes de status =====
    @Transactional
    public Payroll approve(UUID id) {
        Payroll payroll = findById(id);
        payroll.setStatus(PayrollStatus.APPROVED);
        payroll.setApprovedAt(LocalDateTime.now());
        return payrollRepository.save(payroll);
    }

    @Transactional
    public Payroll markAsPaid(UUID id, LocalDate paymentDate) {
        Payroll payroll = findById(id);
        payroll.setStatus(PayrollStatus.PAID);
        payroll.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        payroll.setClosedAt(LocalDateTime.now());
        return payrollRepository.save(payroll);
    }

    @Transactional
    public Payroll cancel(UUID id) {
        Payroll payroll = findById(id);
        payroll.setStatus(PayrollStatus.CANCELLED);
        return payrollRepository.save(payroll);
    }

    public Double getTotalNetSalaryByReferenceMonth(String referenceMonth) {
        return payrollRepository.sumNetSalaryByReferenceMonth(referenceMonth);
    }

    @Transactional
    public Payroll reopen(UUID id) {
        Payroll payroll = findById(id);
        payroll.setStatus(PayrollStatus.PENDING);
        payroll.setPaymentDate(null);
        payroll.setApprovedAt(null);
        payroll.setClosedAt(null);
        return payrollRepository.save(payroll);
    }
} 
