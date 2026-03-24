package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
} 
