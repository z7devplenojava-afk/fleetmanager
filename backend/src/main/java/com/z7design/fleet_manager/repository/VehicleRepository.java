package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    Optional<Vehicle> findByPlate(String plate);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByFuelType(Vehicle.FuelType fuelType);

    @Query("SELECT v FROM Vehicle v WHERE v.plate LIKE %:searchTerm% OR v.fleetNumber LIKE %:searchTerm% OR v.model LIKE %:searchTerm% OR v.brand LIKE %:searchTerm%")
    List<Vehicle> findBySearchTerm(@Param("searchTerm") String searchTerm);

    boolean existsByPlate(String plate);

    List<Vehicle> findByVehicleType(Vehicle.VehicleType vehicleType);
}
