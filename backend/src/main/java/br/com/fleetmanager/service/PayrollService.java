package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Payroll;
import br.com.fleetmanager.repository.PayrollRepository;

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
        Payroll existingPayroll = findById(id);
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
} 