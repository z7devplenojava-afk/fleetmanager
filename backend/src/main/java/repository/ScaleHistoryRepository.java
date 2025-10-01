package br.com.fleetmanager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.ScaleHistory;
import br.com.fleetmanager.model.enums.Shift;

@Repository
public interface ScaleHistoryRepository extends JpaRepository<ScaleHistory, UUID> {
    
    List<ScaleHistory> findByEmployeeId(UUID employeeId);
    
    List<ScaleHistory> findByShift(Shift shift);
    
    List<ScaleHistory> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<ScaleHistory> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);
} 