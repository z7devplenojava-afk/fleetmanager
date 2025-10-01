package br.com.fleetmanager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.TimeRecord;
import br.com.fleetmanager.model.enums.TimeRecordStatus;

@Repository
public interface TimeRecordRepository extends JpaRepository<TimeRecord, UUID> {
    List<TimeRecord> findByEmployeeId(UUID employeeId);
    List<TimeRecord> findByEmployeeIdAndRecordDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);
    List<TimeRecord> findByEmployeeIdAndStatus(UUID employeeId, TimeRecordStatus status);
    List<TimeRecord> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);
} 