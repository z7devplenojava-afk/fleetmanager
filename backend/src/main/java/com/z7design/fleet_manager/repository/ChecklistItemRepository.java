package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    List<ChecklistItem> findByAtivoTrueOrderByOrdemAsc();
    List<ChecklistItem> findByTipoManutencaoAndAtivoTrueOrderByOrdemAsc(String tipoManutencao);
}
