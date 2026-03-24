package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, UUID> {
    List<EmployeeSchedule> findByScheduleId(UUID scheduleId);
    Integer findMaxOrderByScheduleId(UUID scheduleId);
} 
