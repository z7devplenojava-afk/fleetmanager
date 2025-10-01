package br.com.fleetmanager;

import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.WorkSchedule;
import br.com.fleetmanager.repository.WorkScheduleRepository;
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
     * Validar regras de negócio para criação de escala
     */
    public void validateCreateSchedule(WorkSchedule schedule) {
        log.info("Validando criação de escala para funcionário: {}", schedule.getEmployee().getId());
        
        // Validar se funcionário já tem escala na data
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(
                schedule.getEmployee().getId(), schedule.getScheduleDate())) {
            throw new BusinessException("Funcionário já possui escala para esta data");
        }
        
        // Validar se a data não é muito antiga (máximo 30 dias no passado)
        LocalDate maxPastDate = LocalDate.now().minusDays(30);
        if (schedule.getScheduleDate().isBefore(maxPastDate)) {
            throw new BusinessException("Não é possível criar escala para datas muito antigas (máximo 30 dias no passado)");
        }
        
        // Validar se a data não é muito futura (máximo 1 ano)
        LocalDate maxFutureDate = LocalDate.now().plusYears(1);
        if (schedule.getScheduleDate().isAfter(maxFutureDate)) {
            throw new BusinessException("Não é possível criar escala para datas muito futuras (máximo 1 ano)");
        }
        
        log.info("Validação de criação de escala aprovada");
    }
    
    /**
     * Validar regras de negócio para atualização de escala
     */
    public void validateUpdateSchedule(WorkSchedule existingSchedule, WorkSchedule updatedSchedule) {
        log.info("Validando atualização de escala: {}", existingSchedule.getId());
        
        // Se a data foi alterada, verificar se não conflita com outras escalas
        if (!existingSchedule.getScheduleDate().equals(updatedSchedule.getScheduleDate())) {
            if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(
                    updatedSchedule.getEmployee().getId(), updatedSchedule.getScheduleDate())) {
                throw new BusinessException("Funcionário já possui escala para a nova data");
            }
        }
        
        // Validar se escala confirmada pode ser alterada
        if (existingSchedule.getStatus() == WorkSchedule.ScheduleStatus.CONFIRMED && 
            updatedSchedule.getStatus() != WorkSchedule.ScheduleStatus.CONFIRMED) {
            log.warn("Tentativa de alterar status de escala confirmada: {}", existingSchedule.getId());
        }
        
        // Validar se escala concluída pode ser alterada
        if (existingSchedule.getStatus() == WorkSchedule.ScheduleStatus.COMPLETED) {
            throw new BusinessException("Não é possível alterar uma escala já concluída");
        }
        
        log.info("Validação de atualização de escala aprovada");
    }
    
    /**
     * Validar se funcionário pode trabalhar no turno noturno
     */
    public void validateNightShift(UUID employeeId, LocalDate date) {
        log.info("Validando turno noturno para funcionário: {} na data: {}", employeeId, date);
        
        // Verificar se funcionário já trabalhou no dia anterior (para turno noturno)
        LocalDate previousDay = date.minusDays(1);
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(employeeId, previousDay)) {
            log.warn("Funcionário {} trabalhou no dia anterior {}, pode haver conflito com turno noturno", 
                    employeeId, previousDay);
        }
        
        // Verificar se funcionário já trabalhou no mesmo dia (para turno misto)
        if (workScheduleRepository.existsByEmployeeIdAndScheduleDate(employeeId, date)) {
            throw new BusinessException("Funcionário já possui escala para esta data");
        }
    }
    
    /**
     * Validar disponibilidade do funcionário para período específico
     */
    public void validateEmployeeAvailability(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        log.info("Validando disponibilidade do funcionário: {} para período: {} a {}", 
                employeeId, startDate, endDate);
        
        // Verificar se há escalas conflitantes no período
        long conflictingSchedules = workScheduleRepository.countByEmployeeAndPeriod(employeeId, startDate, endDate);
        if (conflictingSchedules > 0) {
            throw new BusinessException("Funcionário possui escalas conflitantes no período especificado");
        }
        
        // Validar se o período não é muito longo (máximo 30 dias)
        long daysBetween = endDate.toEpochDay() - startDate.toEpochDay();
        if (daysBetween > 30) {
            throw new BusinessException("Período muito longo para verificação de disponibilidade (máximo 30 dias)");
        }
    }
    
    /**
     * Validar se escala pode ser cancelada
     */
    public void validateScheduleCancellation(WorkSchedule schedule, String reason) {
        log.info("Validando cancelamento de escala: {}", schedule.getId());
        
        if (schedule.getStatus() == WorkSchedule.ScheduleStatus.COMPLETED) {
            throw new BusinessException("Não é possível cancelar uma escala já concluída");
        }
        
        if (schedule.getStatus() == WorkSchedule.ScheduleStatus.CANCELLED) {
            throw new BusinessException("Escala já está cancelada");
        }
        
        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("Motivo do cancelamento é obrigatório");
        }
        
        if (reason.trim().length() < 5) {
            throw new BusinessException("Motivo do cancelamento deve ter pelo menos 5 caracteres");
        }
        
        log.info("Validação de cancelamento de escala aprovada");
    }
    
    /**
     * Validar se escala pode ser confirmada
     */
    public void validateScheduleConfirmation(WorkSchedule schedule) {
        log.info("Validando confirmação de escala: {}", schedule.getId());
        
        if (schedule.getStatus() != WorkSchedule.ScheduleStatus.PENDING) {
            throw new BusinessException("Apenas escalas pendentes podem ser confirmadas");
        }
        
        // Verificar se a data não é muito próxima (mínimo 24h de antecedência para confirmação)
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        if (schedule.getScheduleDate().isBefore(tomorrow)) {
            log.warn("Tentativa de confirmar escala para data muito próxima: {}", schedule.getScheduleDate());
        }
        
        log.info("Validação de confirmação de escala aprovada");
    }
}
