package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    List<ChecklistItem> findByAtivoTrueOrderByOrdemAsc();
    List<ChecklistItem> findByTipoManutencaoAndAtivoTrueOrderByOrdemAsc(String tipoManutencao);
    List<ChecklistItem> findByVehicleTypeApplicableInAndAtivoTrueOrderByOrdemAsc(List<String> vehicleTypes);

    @Query("SELECT c FROM ChecklistItem c WHERE c.ativo = true " +
           "AND (c.companyId = :companyId OR c.companyId IS NULL) " +
           "ORDER BY c.ordem ASC")
    List<ChecklistItem> findAllActiveForCompanyOrGlobal(@Param("companyId") UUID companyId);
}
