package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.VehicleRentalExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRentalExpenseRepository extends JpaRepository<VehicleRentalExpense, UUID> {

    List<VehicleRentalExpense> findByVehicleIdOrderByExpenseDateDescCreatedAtDesc(UUID vehicleId);

    List<VehicleRentalExpense> findByClientIdOrderByExpenseDateDescCreatedAtDesc(UUID clientId);
}

