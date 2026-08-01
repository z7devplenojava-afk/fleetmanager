package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientDocumentation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientDocumentationRepository extends JpaRepository<ClientDocumentation, UUID> {

    List<ClientDocumentation> findByClientIdOrderByYearDescMonthDesc(UUID clientId);

    Optional<ClientDocumentation> findByClientIdAndYearAndMonth(UUID clientId, Integer year, Integer month);

    List<ClientDocumentation> findByCompanyIdOrderByYearDescMonthDesc(UUID companyId);

    boolean existsByClientIdAndYearAndMonth(UUID clientId, Integer year, Integer month);
}
