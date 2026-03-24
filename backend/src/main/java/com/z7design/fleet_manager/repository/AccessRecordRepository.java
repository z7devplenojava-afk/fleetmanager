package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.AccessRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccessRecordRepository extends JpaRepository<AccessRecord, UUID> {
    List<AccessRecord> findByStatus(String status);

    List<AccessRecord> findByCompanyId(UUID companyId);
}
