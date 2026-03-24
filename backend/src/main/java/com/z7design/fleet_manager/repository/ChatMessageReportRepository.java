package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.ChatMessageReport;

@Repository
public interface ChatMessageReportRepository extends JpaRepository<ChatMessageReport, UUID> {
    
    List<ChatMessageReport> findByMessageId(UUID messageId);
    
    List<ChatMessageReport> findByReporterId(UUID reporterId);
    
    List<ChatMessageReport> findByStatus(String status);
    
    boolean existsByMessageIdAndReporterId(UUID messageId, UUID reporterId);
}


