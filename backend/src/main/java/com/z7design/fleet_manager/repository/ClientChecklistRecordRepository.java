package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientChecklistRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClientChecklistRecordRepository extends JpaRepository<ClientChecklistRecord, UUID> {

    @Query("SELECT r FROM ClientChecklistRecord r WHERE " +
            "(:clientId IS NULL OR r.client.id = :clientId) AND " +
            "(:templateId IS NULL OR r.template.id = :templateId) AND " +
            "(:dateFrom IS NULL OR r.occurredAt >= :dateFrom) AND " +
            "(:dateTo IS NULL OR r.occurredAt <= :dateTo) " +
            "ORDER BY r.occurredAt DESC")
    List<ClientChecklistRecord> findByFilters(
            @Param("clientId") UUID clientId,
            @Param("templateId") UUID templateId,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo);
}
