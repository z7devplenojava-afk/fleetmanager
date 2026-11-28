package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailMailboxQuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailMailboxQuotaRepository extends JpaRepository<EmailMailboxQuota, UUID> {
    Optional<EmailMailboxQuota> findByAccountId(UUID accountId);
}
