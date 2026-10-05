package com.z7design.fleet_manager.repository.commercial;

import com.z7design.fleet_manager.model.commercial.CommercialQuotationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommercialQuotationAttachmentRepository extends JpaRepository<CommercialQuotationAttachment, UUID> {

    List<CommercialQuotationAttachment> findByQuotationIdOrderByCreatedAtAsc(UUID quotationId);

    List<CommercialQuotationAttachment> findByCompanyId(UUID companyId);
}
