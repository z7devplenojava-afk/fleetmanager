package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.RegularTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RegularTripRepository extends JpaRepository<RegularTrip, UUID> {
    List<RegularTrip> findAllByCompanyId(UUID companyId);

    List<RegularTrip> findAllByRouteIdAndDepartureTimeBetween(UUID routeId, LocalDateTime start, LocalDateTime end);
}
