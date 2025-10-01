package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Vacation;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.VacationStatus;
import br.com.fleetmanager.repository.VacationRepository;
import br.com.fleetmanager.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VacationService {
    
    private final VacationRepository vacationRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public Vacation create(Vacation vacation) {
        validateVacationDates(vacation);
        calculateVacationDays(vacation);
        vacation.setStatus(VacationStatus.PENDING);
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation update(UUID id, Vacation vacation) {
        Vacation existingVacation = findById(id);
        validateVacationDates(vacation);
        calculateVacationDays(vacation);
        
        existingVacation.setStartDate(vacation.getStartDate());
        existingVacation.setEndDate(vacation.getEndDate());
        existingVacation.setDaysTaken(vacation.getDaysTaken());
        existingVacation.setRemainingDays(vacation.getRemainingDays());
        
        return vacationRepository.save(existingVacation);
    }
    
    @Transactional
    public Vacation approve(UUID id, UUID approvedBy) {
        Vacation vacation = findById(id);
        User approver = userRepository.findById(approvedBy)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + approvedBy));
        vacation.setStatus(VacationStatus.APPROVED);
        vacation.setApprovedBy(approver);
        vacation.setApprovalDate(LocalDate.now());
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation reject(UUID id) {
        Vacation vacation = findById(id);
        vacation.setStatus(VacationStatus.REJECTED);
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation cancel(UUID id) {
        Vacation vacation = findById(id);
        vacation.setStatus(VacationStatus.CANCELLED);
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public void delete(UUID id) {
        if (!vacationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vacation not found with id: " + id);
        }
        vacationRepository.deleteById(id);
    }
    
    public Vacation findById(UUID id) {
        return vacationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vacation not found with id: " + id));
    }
    
    public List<Vacation> findByEmployeeId(UUID employeeId) {
        return vacationRepository.findByEmployeeId(employeeId);
    }
    
    public List<Vacation> findByEmployeeIdAndStatus(UUID employeeId, VacationStatus status) {
        return vacationRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<Vacation> findByStartDateBetween(LocalDate startDate, LocalDate endDate) {
        return vacationRepository.findByStartDateBetween(startDate, endDate);
    }
    
    public List<Vacation> findAll() {
        return vacationRepository.findAll();
    }
    
    private void validateVacationDates(Vacation vacation) {
        if (vacation.getStartDate().isAfter(vacation.getEndDate())) {
            throw new IllegalArgumentException("Data de início não pode ser posterior à data de fim");
        }
        
        if (vacation.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Data de início não pode ser anterior à data atual");
        }
    }
    
    private void calculateVacationDays(Vacation vacation) {
        long days = ChronoUnit.DAYS.between(vacation.getStartDate(), vacation.getEndDate()) + 1;
        vacation.setDaysTaken((int) days);
        // TODO: Implementar cálculo de dias restantes baseado no histórico do funcionário
        vacation.setRemainingDays(30 - (int) days);
    }
} 