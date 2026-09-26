package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CfmeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CfmeDocumentRepository extends JpaRepository<CfmeDocument, UUID> {

    List<CfmeDocument> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<CfmeDocument> findByCompanyIdAndCategoryOrderByCreatedAtDesc(UUID companyId, CfmeDocument.DocumentCategory category);

    List<CfmeDocument> findByCategoryOrderByCreatedAtDesc(CfmeDocument.DocumentCategory category);

    Optional<CfmeDocument> findByIdAndCompanyId(UUID id, UUID companyId);

    List<CfmeDocument> findByExpiryDateBeforeAndCompanyId(LocalDate date, UUID companyId);

    List<CfmeDocument> findByExpiryDateBetweenAndCompanyId(LocalDate start, LocalDate end, UUID companyId);
}
