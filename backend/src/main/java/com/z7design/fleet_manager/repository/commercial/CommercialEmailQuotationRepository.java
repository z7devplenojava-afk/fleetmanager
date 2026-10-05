package com.z7design.fleet_manager.repository.commercial;

import com.z7design.fleet_manager.model.commercial.CommercialEmailQuotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommercialEmailQuotationRepository extends JpaRepository<CommercialEmailQuotation, UUID> {

    Page<CommercialEmailQuotation> findByCompanyIdOrderByReceivedAtDesc(UUID companyId, Pageable pageable);

    Page<CommercialEmailQuotation> findByCompanyIdAndStatusOrderByReceivedAtDesc(UUID companyId, String status, Pageable pageable);

    @Query("SELECT q FROM CommercialEmailQuotation q WHERE q.companyId = :companyId AND " +
           "(LOWER(q.senderEmail) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.senderName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.clientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.subject) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY q.receivedAt DESC")
    Page<CommercialEmailQuotation> searchQuotations(@Param("companyId") UUID companyId,
                                                    @Param("query") String query,
                                                    Pageable pageable);

    Optional<CommercialEmailQuotation> findByEmailMessageId(UUID emailMessageId);

    boolean existsByEmailMessageId(UUID emailMessageId);
}
