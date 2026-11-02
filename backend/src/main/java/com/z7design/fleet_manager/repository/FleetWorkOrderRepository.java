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
     * Retorna somente OSs nao excluidas (soft-delete — RN10) com entidades associadas carregadas
     */
    @Query("SELECT DISTINCT o FROM FleetWorkOrder o " +
           "LEFT JOIN FETCH o.vehicle v " +
           "LEFT JOIN FETCH o.workPost wp " +
           "LEFT JOIN FETCH o.garage g " +
           "LEFT JOIN FETCH o.plan p " +
           "WHERE o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    @Override
    List<FleetWorkOrder> findAll();

    /** Busca por ID excluindo soft-deleted com relacionamentos */
    @Query("SELECT DISTINCT o FROM FleetWorkOrder o " +
           "LEFT JOIN FETCH o.vehicle v " +
           "LEFT JOIN FETCH o.workPost wp " +
           "LEFT JOIN FETCH o.garage g " +
           "LEFT JOIN FETCH o.plan p " +
           "WHERE o.id = :id AND o.deletedAt IS NULL")
    Optional<FleetWorkOrder> findActiveById(@Param("id") UUID id);

    List<FleetWorkOrder> findByVehicleIdAndDeletedAtIsNull(UUID vehicleId);

    List<FleetWorkOrder> findByVehicleIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID vehicleId);

    List<FleetWorkOrder> findByStatusAndDeletedAtIsNull(FleetWorkOrder.WorkOrderStatus status);
    
    boolean existsByOsNumber(String osNumber);

    Optional<FleetWorkOrder> findByOsNumber(String osNumber);
}
