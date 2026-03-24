package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailAttachment;
import com.z7design.fleet_manager.model.email.EmailQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailAttachmentRepository extends JpaRepository<EmailAttachment, UUID> {
    List<EmailAttachment> findByEmailQueue(EmailQueue emailQueue);
}
