package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {
    
    // Buscar escalas por funcionário
    List<WorkSchedule> findByEmployeeIdOrderByScheduleDateDesc(UUID employeeId);
    
    // Buscar escalas por local de trabalho
    List<WorkSchedule> findByLocationIdOrderByScheduleDateDesc(UUID locationId);
    
    // Buscar escalas por data
    List<WorkSchedule> findByScheduleDateOrderByEmployeeId(LocalDate scheduleDate);
    
    // Buscar escalas por período
    List<WorkSchedule> findByScheduleDateBetweenOrderByScheduleDateDesc(LocalDate startDate, LocalDate endDate);
    
    // Buscar escalas por status
    List<WorkSchedule> findByStatusOrderByScheduleDateDesc(WorkSchedule.ScheduleStatus status);
    
    // Buscar escalas por turno
    List<WorkSchedule> findByShiftOrderByScheduleDateDesc(WorkSchedule.ShiftType shift);
    
    // Buscar escalas por funcionário e período
    List<WorkSchedule> findByEmployeeIdAndScheduleDateBetweenOrderByScheduleDateDesc(
        UUID employeeId, LocalDate startDate, LocalDate endDate);
    
    // Buscar escalas por local e período
    List<WorkSchedule> findByLocationIdAndScheduleDateBetweenOrderByScheduleDateDesc(
        UUID locationId, LocalDate startDate, LocalDate endDate);
    
    // Buscar escalas pendentes
    List<WorkSchedule> findByStatusOrderByScheduleDateAsc(WorkSchedule.ScheduleStatus status);
    
    // Contar escalas por funcionário e período
    @Query("SELECT COUNT(w) FROM WorkSchedule w WHERE w.employee.id = :employeeId AND w.scheduleDate BETWEEN :startDate AND :endDate")
    long countByEmployeeAndPeriod(@Param("employeeId") UUID employeeId, 
                                  @Param("startDate") LocalDate startDate, 
                                  @Param("endDate") LocalDate endDate);
    
    // Buscar escalas por funcionário e data específica
    WorkSchedule findByEmployeeIdAndScheduleDate(UUID employeeId, LocalDate scheduleDate);
    
    // Verificar se existe escala para funcionário em determinada data
    boolean existsByEmployeeIdAndScheduleDate(UUID employeeId, LocalDate scheduleDate);
}
