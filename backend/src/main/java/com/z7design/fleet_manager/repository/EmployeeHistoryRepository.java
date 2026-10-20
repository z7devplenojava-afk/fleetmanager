package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.EmployeeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeHistoryRepository extends JpaRepository<EmployeeHistory, UUID> {
    List<EmployeeHistory> findByEmployeeIdOrderByEventDateDesc(UUID employeeId);
}
