package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TireShopServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TireShopServiceRecordRepository extends JpaRepository<TireShopServiceRecord, UUID> {

    List<TireShopServiceRecord> findByCompanyIdOrderByServiceDateDescCreatedAtDesc(UUID companyId);

    List<TireShopServiceRecord> findAllByOrderByServiceDateDescCreatedAtDesc();

    long countByCompanyId(UUID companyId);
}

