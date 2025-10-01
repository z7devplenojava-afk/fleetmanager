package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FineRepository extends JpaRepository<Fine, UUID> {
    
    List<Fine> findByVehicleId(UUID vehicleId);
    
    List<Fine> findByStatus(Fine.FineStatus status);
    
    List<Fine> findByVehicleIdAndStatus(UUID vehicleId, Fine.FineStatus status);
    
    @Query("SELECT f FROM Fine f WHERE f.vehicle.plate = :plate")
    List<Fine> findByVehiclePlate(@Param("plate") String plate);
    
    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.vehicle.id = :vehicleId AND f.status = 'PENDING'")
    Double getTotalPendingAmountByVehicleId(@Param("vehicleId") UUID vehicleId);
    
    List<Fine> findByDueDateBeforeAndStatus(LocalDate date, Fine.FineStatus status);
    
    @Query("SELECT f FROM Fine f LEFT JOIN FETCH f.vehicle LEFT JOIN FETCH f.driver")
    List<Fine> findAllWithRelations();
} 