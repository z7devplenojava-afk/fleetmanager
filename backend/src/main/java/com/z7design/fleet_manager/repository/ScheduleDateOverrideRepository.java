package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ScheduleDateOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScheduleDateOverrideRepository extends JpaRepository<ScheduleDateOverride, UUID> {
    Optional<ScheduleDateOverride> findByOverrideDate(LocalDate overrideDate);
    void deleteByOverrideDate(LocalDate overrideDate);
}
