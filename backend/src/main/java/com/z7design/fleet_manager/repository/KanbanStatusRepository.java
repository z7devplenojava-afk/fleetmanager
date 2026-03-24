package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.KanbanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KanbanStatusRepository extends JpaRepository<KanbanStatus, java.util.UUID> {
} 
