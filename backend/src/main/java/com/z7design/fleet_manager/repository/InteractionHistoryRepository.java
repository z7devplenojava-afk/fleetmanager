package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.InteractionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionHistoryRepository extends JpaRepository<InteractionHistory, java.util.UUID> {
} 
