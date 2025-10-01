package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Opportunity;
import br.com.fleetmanager.model.KanbanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpportunityRepository extends JpaRepository<Opportunity, java.util.UUID> {
    long countByStatus(KanbanStatus status);
} 