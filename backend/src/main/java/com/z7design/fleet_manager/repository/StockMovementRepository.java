package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.enums.MovementType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID>, JpaSpecificationExecutor<StockMovement> {

        // Contagem de movimentaÃ§Ãµes por item (para ordenaÃ§Ã£o)
    @Query("SELECT sm.stockItem.id, COUNT(sm) FROM StockMovement sm GROUP BY sm.stockItem.id")
    List<Object[]> countMovementsByItem();

// Buscar movimentaÃ§Ãµes por item
    List<StockMovement> findByStockItemIdOrderByMovementDateDesc(UUID stockItemId);

    // Buscar movimentaÃ§Ãµes por funcionÃ¡rio
    List<StockMovement> findByEmployeeIdOrderByMovementDateDesc(UUID employeeId);

    // Buscar movimentaÃ§Ãµes por tipo
    List<StockMovement> findByMovementTypeOrderByMovementDateDesc(MovementType movementType);

    // Buscar movimentaÃ§Ãµes por perÃ­odo
    List<StockMovement> findByMovementDateBetweenOrderByMovementDateDesc(LocalDateTime startDate, LocalDateTime endDate);

    // Buscar movimentaÃ§Ãµes por unidade
    List<StockMovement> findByUnitIdOrderByMovementDateDesc(UUID unitId);

    // HistÃ³rico de entregas por funcionÃ¡rio
    @Query("SELECT sm FROM StockMovement sm WHERE " +
           "sm.employee.id = :employeeId AND " +
           "sm.movementType = 'SAIDA' " +
           "ORDER BY sm.movementDate DESC")
    List<StockMovement> findDeliveryHistoryByEmployee(@Param("employeeId") UUID employeeId);

    // Ãšltimas movimentaÃ§Ãµes
    List<StockMovement> findTop10ByOrderByMovementDateDesc();

    // MovimentaÃ§Ãµes por QR Code
    List<StockMovement> findByQrCodeUsed(String qrCode);

    // EstatÃ­sticas de movimentaÃ§Ã£o por perÃ­odo
    @Query("SELECT sm.movementType, COUNT(sm), SUM(sm.quantity) FROM StockMovement sm WHERE " +
           "sm.movementDate BETWEEN :startDate AND :endDate " +
           "GROUP BY sm.movementType")
    List<Object[]> getMovementStatisticsByPeriod(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Valor total de movimentaÃ§Ãµes por perÃ­odo
    @Query("SELECT SUM(sm.totalCost) FROM StockMovement sm WHERE " +
           "sm.movementDate BETWEEN :startDate AND :endDate AND " +
           "sm.movementType = :movementType AND " +
           "sm.totalCost IS NOT NULL")
    Double getTotalCostByPeriodAndType(@Param("startDate") LocalDateTime startDate, 
                                       @Param("endDate") LocalDateTime endDate, 
                                       @Param("movementType") MovementType movementType);

    // Itens mais movimentados
    @Query("SELECT sm.stockItem.id, sm.stockItem.name, COUNT(sm) as movementCount FROM StockMovement sm " +
           "WHERE sm.movementDate >= :startDate " +
           "GROUP BY sm.stockItem.id, sm.stockItem.name " +
           "ORDER BY movementCount DESC")
    List<Object[]> getMostMovedItems(@Param("startDate") LocalDateTime startDate, Pageable pageable);
}
