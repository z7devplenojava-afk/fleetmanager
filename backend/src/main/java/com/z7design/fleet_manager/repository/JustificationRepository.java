package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Justification;
import com.z7design.fleet_manager.model.enums.JustificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface JustificationRepository extends JpaRepository<Justification, UUID> {

    List<Justification> findByEmployeeId(UUID employeeId);

    List<Justification> findByEmployeeIdAndStatus(UUID employeeId, JustificationStatus status);

    List<Justification> findByEmployeeIdAndReferenceDateBetween(
            UUID employeeId,
            LocalDate startDate,
            LocalDate endDate);

    List<Justification> findByCompanyIdAndStatus(UUID companyId, JustificationStatus status);
}
