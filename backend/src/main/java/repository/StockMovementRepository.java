package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.StockMovement;
import br.com.fleetmanager.model.enums.MovementType;
import br.com.fleetmanager.model.enums.MovementReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    // Buscar movimentações por item
    List<StockMovement> findByStockItemIdOrderByMovementDateDesc(UUID stockItemId);

    // Buscar movimentações por funcionário
    List<StockMovement> findByEmployeeIdOrderByMovementDateDesc(UUID employeeId);

    // Buscar movimentações por tipo
    List<StockMovement> findByMovementTypeOrderByMovementDateDesc(MovementType movementType);

    // Buscar movimentações por período
    List<StockMovement> findByMovementDateBetweenOrderByMovementDateDesc(LocalDateTime startDate, LocalDateTime endDate);

    // Buscar movimentações por unidade
    List<StockMovement> findByUnitIdOrderByMovementDateDesc(UUID unitId);

    // Busca com filtros múltiplos
    @Query("SELECT sm FROM StockMovement sm WHERE " +
           "(:stockItemId IS NULL OR sm.stockItem.id = :stockItemId) AND " +
           "(:employeeId IS NULL OR sm.employee.id = :employeeId) AND " +
           "(:movementType IS NULL OR sm.movementType = :movementType) AND " +
           "(:reason IS NULL OR sm.reason = :reason) AND " +
           "(:unitId IS NULL OR sm.unit.id = :unitId) AND " +
           "(:startDate IS NULL OR sm.movementDate >= :startDate) AND " +
           "(:endDate IS NULL OR sm.movementDate <= :endDate) AND " +
           "(:searchTerm IS NULL OR " +
           "sm.stockItem.name LIKE %:searchTerm% OR " +
           "sm.stockItem.code LIKE %:searchTerm% OR " +
           "sm.employeeName LIKE %:searchTerm% OR " +
           "sm.userName LIKE %:searchTerm% OR " +
           "sm.documentNumber LIKE %:searchTerm%)")
    Page<StockMovement> findByFilters(
            @Param("stockItemId") UUID stockItemId,
            @Param("employeeId") UUID employeeId,
            @Param("movementType") MovementType movementType,
            @Param("reason") MovementReason reason,
            @Param("unitId") UUID unitId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );

    // Histórico de entregas por funcionário
    @Query("SELECT sm FROM StockMovement sm WHERE " +
           "sm.employee.id = :employeeId AND " +
           "sm.movementType = 'SAIDA' " +
           "ORDER BY sm.movementDate DESC")
    List<StockMovement> findDeliveryHistoryByEmployee(@Param("employeeId") UUID employeeId);

    // Últimas movimentações
    List<StockMovement> findTop10ByOrderByMovementDateDesc();

    // Movimentações por QR Code
    List<StockMovement> findByQrCodeUsed(String qrCode);

    // Estatísticas de movimentação por período
    @Query("SELECT sm.movementType, COUNT(sm), SUM(sm.quantity) FROM StockMovement sm WHERE " +
           "sm.movementDate BETWEEN :startDate AND :endDate " +
           "GROUP BY sm.movementType")
    List<Object[]> getMovementStatisticsByPeriod(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Valor total de movimentações por período
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