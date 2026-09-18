package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {

    List<StockReservation> findByCompanyIdAndStatus(UUID companyId, StockReservation.ReservationStatus status);

    List<StockReservation> findByWorkOrderId(UUID workOrderId);

    List<StockReservation> findByStockItemIdAndStatus(UUID stockItemId, StockReservation.ReservationStatus status);

    @Query("SELECT COALESCE(SUM(sr.quantityReserved), 0) FROM StockReservation sr WHERE sr.stockItemId = :stockItemId AND sr.status IN ('ACTIVE_RESERVED', 'READY_FOR_INSTALLATION')")
    BigDecimal sumReservedQuantityForStockItem(@Param("stockItemId") UUID stockItemId);

    @Query("SELECT sr FROM StockReservation sr WHERE sr.stockItemId = :stockItemId AND sr.status IN ('ACTIVE_RESERVED', 'READY_FOR_INSTALLATION') AND (:excludeWorkOrderId IS NULL OR sr.workOrderId != :excludeWorkOrderId)")
    List<StockReservation> findConflictingReservations(@Param("stockItemId") UUID stockItemId, @Param("excludeWorkOrderId") UUID excludeWorkOrderId);

    Optional<StockReservation> findByWorkOrderIdAndStockItemIdAndStatus(UUID workOrderId, UUID stockItemId, StockReservation.ReservationStatus status);
}
