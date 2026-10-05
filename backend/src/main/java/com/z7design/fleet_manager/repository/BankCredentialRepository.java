package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BankCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankCredentialRepository extends JpaRepository<BankCredential, UUID> {

    List<BankCredential> findByCompanyId(UUID companyId);

    Optional<BankCredential> findByCompanyIdAndBankCode(UUID companyId, String bankCode);

    List<BankCredential> findByIsActiveTrue();
}
