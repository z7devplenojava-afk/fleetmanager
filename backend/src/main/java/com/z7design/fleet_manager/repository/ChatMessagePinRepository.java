package com.z7design.fleet_manager.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.ChatMessagePin;

@Repository
public interface ChatMessagePinRepository extends JpaRepository<ChatMessagePin, UUID> {
    
    Optional<ChatMessagePin> findByMessageIdAndUserId(UUID messageId, UUID userId);
    
    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);
    
    void deleteByMessageIdAndUserId(UUID messageId, UUID userId);
}


