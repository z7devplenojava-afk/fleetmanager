package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ShiftChangeForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftChangeFormRepository extends JpaRepository<ShiftChangeForm, Long> {
}

