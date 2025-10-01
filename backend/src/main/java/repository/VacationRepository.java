package br.com.fleetmanager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.Vacation;
import br.com.fleetmanager.model.enums.VacationStatus;

@Repository
public interface VacationRepository extends JpaRepository<Vacation, UUID> {
    List<Vacation> findByEmployeeId(UUID employeeId);
    List<Vacation> findByEmployeeIdAndStatus(UUID employeeId, VacationStatus status);
    List<Vacation> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    List<Vacation> findByStatus(VacationStatus status);
} 