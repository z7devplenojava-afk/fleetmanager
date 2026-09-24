package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ExpenseClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseClassificationRepository extends JpaRepository<ExpenseClassification, UUID> {
    List<ExpenseClassification> findByIsActiveTrueOrderByNameAsc();
    Optional<ExpenseClassification> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
