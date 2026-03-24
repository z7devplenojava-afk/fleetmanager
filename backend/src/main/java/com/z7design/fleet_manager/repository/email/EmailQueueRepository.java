package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailQueue;
import com.z7design.fleet_manager.model.enums.EmailStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {

    @Query("SELECT e FROM EmailQueue e WHERE e.status IN (:statuses) AND e.scheduledAt <= :now ORDER BY e.priority DESC, e.scheduledAt ASC")
    List<EmailQueue> findPendingEmails(
            @Param("statuses") List<EmailStatus> statuses,
            @Param("now") LocalDateTime now,
            Pageable pageable);
}
