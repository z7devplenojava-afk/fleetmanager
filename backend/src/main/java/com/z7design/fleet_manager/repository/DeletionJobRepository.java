package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DeletionJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeletionJobRepository extends JpaRepository<DeletionJob, UUID> {
    
    List<DeletionJob> findByStatus(DeletionJob.JobStatus status);
    
    Optional<DeletionJob> findByIdAndStatus(UUID id, DeletionJob.JobStatus status);
    
    @Query("SELECT j FROM DeletionJob j WHERE j.status IN :statuses ORDER BY j.createdAt DESC")
    List<DeletionJob> findByStatusIn(@Param("statuses") List<DeletionJob.JobStatus> statuses);
    
    @Query("SELECT j FROM DeletionJob j WHERE j.createdAt >= :since ORDER BY j.createdAt DESC")
    List<DeletionJob> findRecentJobs(@Param("since") LocalDateTime since);
}


