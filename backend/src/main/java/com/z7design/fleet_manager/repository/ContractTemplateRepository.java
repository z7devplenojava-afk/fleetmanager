package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ContractTemplate;
import com.z7design.fleet_manager.model.enums.ContractTemplateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractTemplateRepository extends JpaRepository<ContractTemplate, UUID> {

    List<ContractTemplate> findByIsActiveTrue();

    Optional<ContractTemplate> findByTemplateType(ContractTemplateType templateType);

    Optional<ContractTemplate> findByTemplateTypeAndIsActiveTrue(ContractTemplateType templateType);
}
