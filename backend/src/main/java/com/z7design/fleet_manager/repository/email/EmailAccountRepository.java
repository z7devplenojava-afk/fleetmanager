package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailAccountRepository extends JpaRepository<EmailAccount, UUID> {

    List<EmailAccount> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    Optional<EmailAccount> findByCompanyIdAndEmailAddressIgnoreCase(UUID companyId, String emailAddress);

    Optional<EmailAccount> findByEmailAddressIgnoreCase(String emailAddress);

    long countByCompanyId(UUID companyId);
}
