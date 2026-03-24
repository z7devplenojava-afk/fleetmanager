package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;
import com.z7design.fleet_manager.repository.VacationRepository;
import com.z7design.fleet_manager.repository.UserRepository;

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
        if (vacation.getStatus() == null) {
            vacation.setStatus(VacationStatus.PENDING);
        }
        if (vacation.getVacationType() == null) {
            vacation.setVacationType(VacationType.NORMAL);
        }
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation update(UUID id, Vacation vacation) {
        Vacation existingVacation = findById(id);
        validateVacationDatesForUpdate(vacation);
        calculateVacationDays(vacation);
        
        existingVacation.setStartDate(vacation.getStartDate());
        existingVacation.setEndDate(vacation.getEndDate());
        existingVacation.setDaysTaken(vacation.getDaysTaken());
        existingVacation.setRemainingDays(vacation.getRemainingDays());
        
        // Atualizar status se fornecido
        if (vacation.getStatus() != null) {
            existingVacation.setStatus(vacation.getStatus());
        }
        
        // Atualizar tipo se fornecido
        if (vacation.getVacationType() != null) {
            existingVacation.setVacationType(vacation.getVacationType());
        }
        
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
        return vacationRepository.findAllWithEmployee();
    }
    
    public List<Vacation> findByStatus(VacationStatus status) {
        return vacationRepository.findByStatusWithEmployee(status);
    }
    
    private void validateVacationDates(Vacation vacation) {
        if (vacation.getStartDate().isAfter(vacation.getEndDate())) {
            throw new IllegalArgumentException("Data de inÃ­cio nÃ£o pode ser posterior Ã  data de fim");
        }
        
        if (vacation.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Data de inÃ­cio nÃ£o pode ser anterior Ã  data atual");
        }
    }
    
    private void validateVacationDatesForUpdate(Vacation vacation) {
        // ValidaÃ§Ã£o para atualizaÃ§Ã£o: permite editar fÃ©rias mesmo que a data de inÃ­cio seja no passado
        // Apenas valida que a data de inÃ­cio nÃ£o seja posterior Ã  data de fim
        if (vacation.getStartDate().isAfter(vacation.getEndDate())) {
            throw new IllegalArgumentException("Data de inÃ­cio nÃ£o pode ser posterior Ã  data de fim");
        }
    }
    
    private void calculateVacationDays(Vacation vacation) {
        long days = ChronoUnit.DAYS.between(vacation.getStartDate(), vacation.getEndDate()) + 1;
        vacation.setDaysTaken((int) days);
        // TODO: Implementar cÃ¡lculo de dias restantes baseado no histÃ³rico do funcionÃ¡rio
        // Definir um valor padrÃ£o de 30 dias de fÃ©rias disponÃ­veis
        vacation.setRemainingDays(Math.max(1, 30 - (int) days));
    }

    @Transactional
    public Vacation approveVacation(UUID vacationId, String observacoes) {
        Vacation vacation = vacationRepository.findById(vacationId)
            .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada"));
        
        if (vacation.getStatus() != VacationStatus.PENDING) {
            throw new IllegalArgumentException("Apenas solicitaÃ§Ãµes pendentes podem ser aprovadas");
        }
        
        vacation.setStatus(VacationStatus.APPROVED);
        vacation.setApprovalDate(LocalDate.now());
        // TODO: Buscar o usuÃ¡rio atual do contexto de seguranÃ§a para setar approvedBy
        
        return vacationRepository.save(vacation);
    }

    @Transactional
    public Vacation rejectVacation(UUID vacationId, String motivo) {
        Vacation vacation = vacationRepository.findById(vacationId)
            .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada"));
        
        if (vacation.getStatus() != VacationStatus.PENDING) {
            throw new IllegalArgumentException("Apenas solicitaÃ§Ãµes pendentes podem ser rejeitadas");
        }
        
        vacation.setStatus(VacationStatus.REJECTED);
        vacation.setApprovalDate(LocalDate.now());
        // TODO: Buscar o usuÃ¡rio atual do contexto de seguranÃ§a para setar approvedBy
        
        return vacationRepository.save(vacation);
    }
} 
