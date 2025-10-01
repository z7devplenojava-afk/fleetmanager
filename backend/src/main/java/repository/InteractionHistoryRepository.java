package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.InteractionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionHistoryRepository extends JpaRepository<InteractionHistory, java.util.UUID> {
} 