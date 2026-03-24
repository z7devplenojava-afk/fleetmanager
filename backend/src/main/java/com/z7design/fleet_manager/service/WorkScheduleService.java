package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.WorkSchedule;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.WorkScheduleRepository;
import com.z7design.fleet_manager.validation.WorkScheduleValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WorkScheduleService {
    
    private final WorkScheduleRepository workScheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final WorkScheduleValidator workScheduleValidator;
    
    /**
     * Criar nova escala de trabalho
     */
    public WorkSchedule createWorkSchedule(WorkSchedule workSchedule) {
        log.info("Criando nova escala para funcionÃ¡rio: {}", workSchedule.getEmployee().getId());
        
        // Validar funcionÃ¡rio
        Employee employee = employeeRepository.findById(workSchedule.getEmployee().getId())
            .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Validar local de trabalho
        WorkPost location = workPostRepository.findById(workSchedule.getLocation().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Local de trabalho nÃ£o encontrado"));
        
        // Validar regras de negÃ³cio
        workScheduleValidator.validateCreateSchedule(workSchedule);
        
        // Definir status inicial
        workSchedule.setStatus(WorkSchedule.ScheduleStatus.PENDING);
        workSchedule.setEmployee(employee);
        workSchedule.setLocation(location);
        
        WorkSchedule savedSchedule = workScheduleRepository.save(workSchedule);
        log.info("Escala criada com sucesso: {}", savedSchedule.getId());
        
        return savedSchedule;
    }
    
    /**
     * Atualizar escala existente
     */
    public WorkSchedule updateWorkSchedule(UUID id, WorkSchedule workScheduleDetails) {
        log.info("Atualizando escala: {}", id);
        
        WorkSchedule existingSchedule = workScheduleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Escala nÃ£o encontrada"));
        
        // Validar funcionÃ¡rio se foi alterado
        if (workScheduleDetails.getEmployee() != null && 
            !workScheduleDetails.getEmployee().getId().equals(existingSchedule.getEmployee().getId())) {
            Employee employee = employeeRepository.findById(workScheduleDetails.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
            existingSchedule.setEmployee(employee);
        }
        
        // Validar local se foi alterado
        if (workScheduleDetails.getLocation() != null && 
            !workScheduleDetails.getLocation().getId().equals(existingSchedule.getLocation().getId())) {
            WorkPost location = workPostRepository.findById(workScheduleDetails.getLocation().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Local de trabalho nÃ£o encontrado"));
            existingSchedule.setLocation(location);
        }
        
        // Validar regras de negÃ³cio para atualizaÃ§Ã£o
        workScheduleValidator.validateUpdateSchedule(existingSchedule, workScheduleDetails);
        
        // Atualizar campos
        if (workScheduleDetails.getScheduleDate() != null) {
            existingSchedule.setScheduleDate(workScheduleDetails.getScheduleDate());
        }
        if (workScheduleDetails.getShift() != null) {
            existingSchedule.setShift(workScheduleDetails.getShift());
        }
        if (workScheduleDetails.getStatus() != null) {
            existingSchedule.setStatus(workScheduleDetails.getStatus());
        }
        if (workScheduleDetails.getObservations() != null) {
            existingSchedule.setObservations(workScheduleDetails.getObservations());
        }
        
        existingSchedule.setUpdatedAt(LocalDateTime.now());
        
        WorkSchedule updatedSchedule = workScheduleRepository.save(existingSchedule);
        log.info("Escala atualizada com sucesso: {}", updatedSchedule.getId());
        
        return updatedSchedule;
    }
    
    /**
     * Buscar escala por ID
     */
    @Transactional(readOnly = true)
    public WorkSchedule getWorkScheduleById(UUID id) {
        return workScheduleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Escala nÃ£o encontrada"));
    }
    
    /**
     * Listar todas as escalas
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getAllWorkSchedules() {
        return workScheduleRepository.findAll();
    }
    
    /**
     * Buscar escalas por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getWorkSchedulesByEmployee(UUID employeeId) {
        return workScheduleRepository.findByEmployeeIdOrderByScheduleDateDesc(employeeId);
    }
    
    /**
     * Buscar escalas por local de trabalho
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getWorkSchedulesByLocation(UUID locationId) {
        return workScheduleRepository.findByLocationIdOrderByScheduleDateDesc(locationId);
    }
    
    /**
     * Buscar escalas por data
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getWorkSchedulesByDate(LocalDate date) {
        return workScheduleRepository.findByScheduleDateOrderByEmployeeId(date);
    }
    
    /**
     * Buscar escalas por perÃ­odo
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getWorkSchedulesByPeriod(LocalDate startDate, LocalDate endDate) {
        return workScheduleRepository.findByScheduleDateBetweenOrderByScheduleDateDesc(startDate, endDate);
    }
    
    /**
     * Buscar escalas por status
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getWorkSchedulesByStatus(WorkSchedule.ScheduleStatus status) {
        return workScheduleRepository.findByStatusOrderByScheduleDateDesc(status);
    }
    
    /**
     * Buscar escalas pendentes
     */
    @Transactional(readOnly = true)
    public List<WorkSchedule> getPendingWorkSchedules() {
        return workScheduleRepository.findByStatusOrderByScheduleDateAsc(WorkSchedule.ScheduleStatus.PENDING);
    }
    
    /**
     * Confirmar escala
     */
    public WorkSchedule confirmWorkSchedule(UUID id) {
        log.info("Confirmando escala: {}", id);
        
        WorkSchedule schedule = getWorkScheduleById(id);
        
        // Validar regras de negÃ³cio para confirmaÃ§Ã£o
        workScheduleValidator.validateScheduleConfirmation(schedule);
        
        schedule.setStatus(WorkSchedule.ScheduleStatus.CONFIRMED);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        WorkSchedule confirmedSchedule = workScheduleRepository.save(schedule);
        log.info("Escala confirmada com sucesso: {}", confirmedSchedule.getId());
        
        return confirmedSchedule;
    }
    
    /**
     * Cancelar escala
     */
    public WorkSchedule cancelWorkSchedule(UUID id, String reason) {
        log.info("Cancelando escala: {}", id);
        
        WorkSchedule schedule = getWorkScheduleById(id);
        
        // Validar regras de negÃ³cio para cancelamento
        workScheduleValidator.validateScheduleCancellation(schedule, reason);
        
        schedule.setStatus(WorkSchedule.ScheduleStatus.CANCELLED);
        schedule.setObservations(schedule.getObservations() + " [CANCELADA: " + reason + "]");
        schedule.setUpdatedAt(LocalDateTime.now());
        
        WorkSchedule cancelledSchedule = workScheduleRepository.save(schedule);
        log.info("Escala cancelada com sucesso: {}", cancelledSchedule.getId());
        
        return cancelledSchedule;
    }
    
    /**
     * Marcar escala como concluÃ­da
     */
    public WorkSchedule completeWorkSchedule(UUID id) {
        log.info("Marcando escala como concluÃ­da: {}", id);
        
        WorkSchedule schedule = getWorkScheduleById(id);
        
        if (schedule.getStatus() != WorkSchedule.ScheduleStatus.CONFIRMED) {
            throw new BusinessException("Apenas escalas confirmadas podem ser marcadas como concluÃ­das");
        }
        
        schedule.setStatus(WorkSchedule.ScheduleStatus.COMPLETED);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        WorkSchedule completedSchedule = workScheduleRepository.save(schedule);
        log.info("Escala marcada como concluÃ­da: {}", completedSchedule.getId());
        
        return completedSchedule;
    }
    
    /**
     * Deletar escala
     */
    public void deleteWorkSchedule(UUID id) {
        log.info("Deletando escala: {}", id);
        
        WorkSchedule schedule = getWorkScheduleById(id);
        
        if (schedule.getStatus() == WorkSchedule.ScheduleStatus.CONFIRMED || 
            schedule.getStatus() == WorkSchedule.ScheduleStatus.COMPLETED) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel deletar escalas confirmadas ou concluÃ­das");
        }
        
        workScheduleRepository.delete(schedule);
        log.info("Escala deletada com sucesso: {}", id);
    }
    
    /**
     * Contar escalas por funcionÃ¡rio e perÃ­odo
     */
    @Transactional(readOnly = true)
    public long countWorkSchedulesByEmployeeAndPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return workScheduleRepository.countByEmployeeAndPeriod(employeeId, startDate, endDate);
    }
    
    /**
     * Verificar disponibilidade do funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public boolean isEmployeeAvailable(UUID employeeId, LocalDate date) {
        return !workScheduleRepository.existsByEmployeeIdAndScheduleDate(employeeId, date);
    }
}

