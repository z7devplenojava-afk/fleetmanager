package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FleetWorkOrderRepository extends JpaRepository<FleetWorkOrder, UUID> {

    List<FleetWorkOrder> findByVehicleId(UUID vehicleId);

    List<FleetWorkOrder> findByStatus(FleetWorkOrder.WorkOrderStatus status);

    /**
     * Ranking de veículos por número de OS, custo total acumulado e tempo parado.
     * Retorna dados agregados ordenados por maior custo + mais OSs.
     */
    @Query("""
        SELECT
            v.id           AS vehicleId,
            v.plate        AS vehiclePlate,
            v.model        AS vehicleModel,
            COUNT(o.id)    AS totalOrders,
            SUM(CASE WHEN o.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedOrders,
            SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledOrders,
            COALESCE(SUM(o.totalCost), 0)   AS totalCost,
            COALESCE(SUM(
                CASE WHEN o.startDate IS NOT NULL AND o.completionDate IS NOT NULL
                THEN timestampdiff(HOUR, o.startDate, o.completionDate)
                ELSE 0 END
            ), 0) AS totalDowntimeHours
        FROM FleetWorkOrder o
        JOIN o.vehicle v
        GROUP BY v.id, v.plate, v.model
        ORDER BY COUNT(o.id) DESC, SUM(o.totalCost) DESC
        """)
    List<Object[]> findVehicleRankingRaw();
}
