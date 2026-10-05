package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CarWash;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CarWashRepository extends JpaRepository<CarWash, UUID> {
    List<CarWash> findByActiveTrueOrderByCreatedAtDesc();
    List<CarWash> findByCompanyIdAndActiveTrueOrderByCreatedAtDesc(UUID companyId);
}
