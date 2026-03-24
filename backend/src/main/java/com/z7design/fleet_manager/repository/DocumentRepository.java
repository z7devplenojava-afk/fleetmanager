package com.z7design.fleet_manager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Document;
import com.z7design.fleet_manager.model.enums.DocumentType;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    
    List<Document> findByEmployeeId(UUID employeeId);
    
    List<Document> findByType(DocumentType type);
    
    List<Document> findByExpirationDateBefore(LocalDateTime date);
    
    List<Document> findByEmployeeIdAndType(UUID employeeId, DocumentType type);
    
    // MÃ©todos de contagem para estatÃ­sticas
    long countBySignedTrue();
    long countBySignedFalse();
    long countByExpirationDateBefore(LocalDateTime date);
}
