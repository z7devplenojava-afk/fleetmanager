package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailMessageAttachmentRepository extends JpaRepository<EmailMessageAttachment, UUID> {

    List<EmailMessageAttachment> findByMessage_IdOrderByCreatedAtAsc(UUID messageId);

    long countByMessage_Id(UUID messageId);

    @Modifying
    @Query("DELETE FROM EmailMessageAttachment a WHERE a.message.id = :messageId")
    void deleteByMessageId(@Param("messageId") UUID messageId);
}
