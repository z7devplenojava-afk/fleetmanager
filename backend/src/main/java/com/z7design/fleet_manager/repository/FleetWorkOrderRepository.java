package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetWorkOrderRepository extends JpaRepository<FleetWorkOrder, UUID> {

    /**
     * Retorna somente OSs nao excluidas (soft-delete — RN10)
     */
    @Query("SELECT o FROM FleetWorkOrder o WHERE o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    @Override
    List<FleetWorkOrder> findAll();

    /** Busca por ID excluindo soft-deleted */
    @Query("SELECT o FROM FleetWorkOrder o WHERE o.id = :id AND o.deletedAt IS NULL")
    Optional<FleetWorkOrder> findActiveById(@Param("id") UUID id);

    List<FleetWorkOrder> findByVehicleIdAndDeletedAtIsNull(UUID vehicleId);

    List<FleetWorkOrder> findByVehicleIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID vehicleId);

    List<FleetWorkOrder> findByStatusAndDeletedAtIsNull(FleetWorkOrder.WorkOrderStatus status);
    
    boolean existsByOsNumber(String osNumber);

    Optional<FleetWorkOrder> findByOsNumber(String osNumber);
}
