package com.z7design.fleet_manager.validation;

import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.WorkSchedule;
import com.z7design.fleet_manager.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkScheduleValidator {
    
    private final WorkScheduleRepository workScheduleRepository;
    
    /**
     * Validar regras de negÃ³cio para criaÃ§Ã£o de escala
     */
    public void validateCreateSchedule(WorkSchedule schedule) {
        log.info("Validando criaÃ§Ã£o de escala para funcionÃ¡rio: {}", schedule.getEmployee().getId());
        
        // Validar se funcionÃ¡rio jÃ¡ tem escala na data
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(
                schedule.getEmployee().getId(), schedule.getScheduleDate())) {
            throw new BusinessException("FuncionÃ¡rio jÃ¡ possui escala para esta data");
        }
        
        // Validar se a data nÃ£o Ã© muito antiga (mÃ¡ximo 30 dias no passado)
        LocalDate maxPastDate = LocalDate.now().minusDays(30);
        if (schedule.getScheduleDate().isBefore(maxPastDate)) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel criar escala para datas muito antigas (mÃ¡ximo 30 dias no passado)");
        }
        
        // Validar se a data nÃ£o Ã© muito futura (mÃ¡ximo 1 ano)
        LocalDate maxFutureDate = LocalDate.now().plusYears(1);
        if (schedule.getScheduleDate().isAfter(maxFutureDate)) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel criar escala para datas muito futuras (mÃ¡ximo 1 ano)");
        }
        
        log.info("ValidaÃ§Ã£o de criaÃ§Ã£o de escala aprovada");
    }
    
    /**
     * Validar regras de negÃ³cio para atualizaÃ§Ã£o de escala
     */
    public void validateUpdateSchedule(WorkSchedule existingSchedule, WorkSchedule updatedSchedule) {
        log.info("Validando atualizaÃ§Ã£o de escala: {}", existingSchedule.getId());
        
        // Se a data foi alterada, verificar se nÃ£o conflita com outras escalas
        if (!existingSchedule.getScheduleDate().equals(updatedSchedule.getScheduleDate())) {
            if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(
                    updatedSchedule.getEmployee().getId(), updatedSchedule.getScheduleDate())) {
                throw new BusinessException("FuncionÃ¡rio jÃ¡ possui escala para a nova data");
            }
        }
        
        // Validar se escala confirmada pode ser alterada
        if (existingSchedule.getStatus() == WorkSchedule.ScheduleStatus.CONFIRMED && 
            updatedSchedule.getStatus() != WorkSchedule.ScheduleStatus.CONFIRMED) {
            log.warn("Tentativa de alterar status de escala confirmada: {}", existingSchedule.getId());
        }
        
        // Validar se escala concluÃ­da pode ser alterada
        if (existingSchedule.getStatus() == WorkSchedule.ScheduleStatus.COMPLETED) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel alterar uma escala jÃ¡ concluÃ­da");
        }
        
        log.info("ValidaÃ§Ã£o de atualizaÃ§Ã£o de escala aprovada");
    }
    
    /**
     * Validar se funcionÃ¡rio pode trabalhar no turno noturno
     */
    public void validateNightShift(UUID employeeId, LocalDate date) {
        log.info("Validando turno noturno para funcionÃ¡rio: {} na data: {}", employeeId, date);
        
        // Verificar se funcionÃ¡rio jÃ¡ trabalhou no dia anterior (para turno noturno)
        LocalDate previousDay = date.minusDays(1);
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(employeeId, previousDay)) {
            log.warn("FuncionÃ¡rio {} trabalhou no dia anterior {}, pode haver conflito com turno noturno", 
                    employeeId, previousDay);
        }
        
        // Verificar se funcionÃ¡rio jÃ¡ trabalhou no mesmo dia (para turno misto)
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(employeeId, date)) {
            throw new BusinessException("FuncionÃ¡rio jÃ¡ possui escala para esta data");
        }
    }
    
    /**
     * Validar disponibilidade do funcionÃ¡rio para perÃ­odo especÃ­fico
     */
    public void validateEmployeeAvailability(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        log.info("Validando disponibilidade do funcionÃ¡rio: {} para perÃ­odo: {} a {}", 
                employeeId, startDate, endDate);
        
        // Verificar se hÃ¡ escalas conflitantes no perÃ­odo
        long conflictingSchedules = workScheduleRepository.countByEmployeeAndPeriod(employeeId, startDate, endDate);
        if (conflictingSchedules > 0) {
            throw new BusinessException("FuncionÃ¡rio possui escalas conflitantes no perÃ­odo especificado");
        }
        
        // Validar se o perÃ­odo nÃ£o Ã© muito longo (mÃ¡ximo 30 dias)
        long daysBetween = endDate.toEpochDay() - startDate.toEpochDay();
        if (daysBetween > 30) {
            throw new BusinessException("PerÃ­odo muito longo para verificaÃ§Ã£o de disponibilidade (mÃ¡ximo 30 dias)");
        }
    }
    
    /**
     * Validar se escala pode ser cancelada
     */
    public void validateScheduleCancellation(WorkSchedule schedule, String reason) {
        log.info("Validando cancelamento de escala: {}", schedule.getId());
        
        if (schedule.getStatus() == WorkSchedule.ScheduleStatus.COMPLETED) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel cancelar uma escala jÃ¡ concluÃ­da");
        }
        
        if (schedule.getStatus() == WorkSchedule.ScheduleStatus.CANCELLED) {
            throw new BusinessException("Escala jÃ¡ estÃ¡ cancelada");
        }
        
        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("Motivo do cancelamento Ã© obrigatÃ³rio");
        }
        
        if (reason.trim().length() < 5) {
            throw new BusinessException("Motivo do cancelamento deve ter pelo menos 5 caracteres");
        }
        
        log.info("ValidaÃ§Ã£o de cancelamento de escala aprovada");
    }
    
    /**
     * Validar se escala pode ser confirmada
     */
    public void validateScheduleConfirmation(WorkSchedule schedule) {
        log.info("Validando confirmaÃ§Ã£o de escala: {}", schedule.getId());
        
        if (schedule.getStatus() != WorkSchedule.ScheduleStatus.PENDING) {
            throw new BusinessException("Apenas escalas pendentes podem ser confirmadas");
        }
        
        // Verificar se a data nÃ£o Ã© muito prÃ³xima (mÃ­nimo 24h de antecedÃªncia para confirmaÃ§Ã£o)
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        if (schedule.getScheduleDate().isBefore(tomorrow)) {
            log.warn("Tentativa de confirmar escala para data muito prÃ³xima: {}", schedule.getScheduleDate());
        }
        
        log.info("ValidaÃ§Ã£o de confirmaÃ§Ã£o de escala aprovada");
    }
}

