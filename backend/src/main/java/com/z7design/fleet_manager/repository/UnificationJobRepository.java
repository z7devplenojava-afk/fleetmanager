package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UnificationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnificationJobRepository extends JpaRepository<UnificationJob, UUID> {
    
    List<UnificationJob> findByStatus(UnificationJob.JobStatus status);
    
    Optional<UnificationJob> findByIdAndStatus(UUID id, UnificationJob.JobStatus status);
    
    @Query("SELECT j FROM UnificationJob j WHERE j.status IN :statuses ORDER BY j.createdAt DESC")
    List<UnificationJob> findByStatusIn(@Param("statuses") List<UnificationJob.JobStatus> statuses);
    
    @Query("SELECT j FROM UnificationJob j WHERE j.createdAt >= :since ORDER BY j.createdAt DESC")
    List<UnificationJob> findRecentJobs(@Param("since") LocalDateTime since);
    
    @Query("SELECT j FROM UnificationJob j WHERE j.status = 'PROCESSING' AND j.updatedAt < :before")
    List<UnificationJob> findStuckJobs(@Param("before") LocalDateTime before);
}


