package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Opportunity;
import com.z7design.fleet_manager.model.KanbanStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OpportunityRepository extends JpaRepository<Opportunity, java.util.UUID> {
    long countByStatus(KanbanStatus status);
    
    @EntityGraph(attributePaths = {"lead", "status", "assignedTo", "client"})
    @Query("SELECT o FROM Opportunity o")
    List<Opportunity> findAllWithRelationships();
} 
