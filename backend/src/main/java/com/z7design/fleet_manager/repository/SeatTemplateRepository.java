package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.SeatTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatTemplateRepository extends JpaRepository<SeatTemplate, UUID> {
    List<SeatTemplate> findAllByCompanyId(UUID companyId);
}
