package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DocumentProcessingJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentProcessingJobRepository extends JpaRepository<DocumentProcessingJob, UUID> {
    
    List<DocumentProcessingJob> findByStatus(DocumentProcessingJob.JobStatus status);
    
    List<DocumentProcessingJob> findByStatusOrderByCreatedAtDesc(DocumentProcessingJob.JobStatus status);
    
    long countByStatus(DocumentProcessingJob.JobStatus status);
}


