package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, UUID> {
    List<Passenger> findByCompanyId(UUID companyId);
    List<Passenger> findByRouteId(UUID routeId);
    List<Passenger> findByActiveTrueAndCompanyId(UUID companyId);
}
