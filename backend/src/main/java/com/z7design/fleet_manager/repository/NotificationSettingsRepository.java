package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.NotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, UUID> {
    
    Optional<NotificationSettings> findByCompanyIdAndUserIdIsNull(UUID companyId);
    
    Optional<NotificationSettings> findByCompanyIdAndUserId(UUID companyId, UUID userId);
    
    boolean existsByCompanyIdAndUserIdIsNull(UUID companyId);
    
    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);
}

