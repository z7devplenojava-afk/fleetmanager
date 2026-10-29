package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DriverRouteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DriverRouteCodeRepository extends JpaRepository<DriverRouteCode, UUID> {

    @Query("SELECT r FROM DriverRouteCode r WHERE r.active = true AND r.companyId IS NULL ORDER BY r.displayOrder ASC, r.code ASC")
    List<DriverRouteCode> findAllActiveGlobal();

    @Query("SELECT r FROM DriverRouteCode r WHERE r.active = true AND (r.companyId = :companyId OR r.companyId IS NULL) ORDER BY r.displayOrder ASC, r.code ASC")
    List<DriverRouteCode> findAllActiveForCompanyOrGlobal(@Param("companyId") UUID companyId);
}

