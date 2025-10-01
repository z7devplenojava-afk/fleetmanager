package br.com.fleetmanager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.Overtime;
import br.com.fleetmanager.model.enums.OvertimeStatus;
import br.com.fleetmanager.model.enums.OvertimeType;

@Repository
public interface OvertimeRepository extends JpaRepository<Overtime, UUID> {
    List<Overtime> findByEmployeeId(UUID employeeId);
    List<Overtime> findByEmployeeIdAndStatus(UUID employeeId, OvertimeStatus status);
    List<Overtime> findByEmployeeIdAndType(UUID employeeId, OvertimeType type);
    List<Overtime> findByEmployeeIdAndOvertimeDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);
} 