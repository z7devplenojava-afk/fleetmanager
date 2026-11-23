package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientChecklistTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientChecklistTemplateRepository extends JpaRepository<ClientChecklistTemplate, UUID> {

    List<ClientChecklistTemplate> findByClientIdOrderByOrderIndexAscNameAsc(UUID clientId);

    @Query("SELECT t FROM ClientChecklistTemplate t " +
           "LEFT JOIN FETCH t.client c " +
           "WHERE (:companyId IS NULL OR c.companyId = :companyId) " +
           "ORDER BY t.orderIndex ASC, t.name ASC")
    List<ClientChecklistTemplate> findAllByCompanyId(@Param("companyId") UUID companyId);
}
