package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailConfig;
import com.z7design.fleet_manager.model.enums.EmailContextType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailConfigRepository extends JpaRepository<EmailConfig, UUID> {

    Optional<EmailConfig> findByContextTypeAndContextId(EmailContextType contextType, UUID contextId);

    Optional<EmailConfig> findByContextType(EmailContextType contextType);
}
