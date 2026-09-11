package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementDiscountRepository extends JpaRepository<MeasurementDiscount, UUID> {
    List<MeasurementDiscount> findByBulletinId(UUID bulletinId);
}
