package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.KanbanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KanbanStatusRepository extends JpaRepository<KanbanStatus, java.util.UUID> {
} 