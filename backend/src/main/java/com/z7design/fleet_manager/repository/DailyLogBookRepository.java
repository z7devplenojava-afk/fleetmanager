package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DailyLogBook;
import com.z7design.fleet_manager.model.enums.DailyLogBookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyLogBookRepository extends JpaRepository<DailyLogBook, UUID> {

    Optional<DailyLogBook> findByBookNumber(String bookNumber);

    List<DailyLogBook> findByStatus(DailyLogBookStatus status);

    List<DailyLogBook> findByVehicleId(UUID vehicleId);

    List<DailyLogBook> findByAssignedDriverId(UUID driverId);

    List<DailyLogBook> findByAssignedClientId(UUID clientId);
}
