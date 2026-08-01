package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, UUID> {

    Optional<EmailMessage> findByFolder_IdAndUid(UUID folderId, Long uid);

    List<EmailMessage> findByFolder_Id(UUID folderId);

    Page<EmailMessage> findByFolder_IdOrderByDateDesc(UUID folderId, Pageable pageable);

    @Query("SELECT m FROM EmailMessage m WHERE m.folder.id = :folderId " +
            "AND m.uid > :uid ORDER BY m.uid ASC")
    List<EmailMessage> findMessagesAfterUid(@Param("folderId") UUID folderId, @Param("uid") long uid);

    @Query("SELECT MAX(m.uid) FROM EmailMessage m WHERE m.folder.id = :folderId")
    Long findMaxUidByFolderId(@Param("folderId") UUID folderId);

    @Query("SELECT COUNT(m) FROM EmailMessage m WHERE m.folder.id = :folderId")
    long countByFolderId(@Param("folderId") UUID folderId);

    long countByAccount_IdAndReadFalse(UUID accountId);

    long countByAccount_Id(UUID accountId);

    @Query("SELECT COUNT(m) FROM EmailMessage m WHERE m.folder.id = :folderId AND m.read = false")
    long countUnreadByFolderId(@Param("folderId") UUID folderId);

    @Query("SELECT m FROM EmailMessage m WHERE m.account.id = :accountId " +
            "AND (LOWER(COALESCE(m.subject,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.fromAddress,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.toAddress,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.bodyText,'')) LIKE LOWER(CONCAT('%',:query,'%'))) " +
            "ORDER BY m.date DESC")
    List<EmailMessage> search(@Param("accountId") UUID accountId, @Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(m) FROM EmailMessage m WHERE m.account.id = :accountId " +
            "AND (LOWER(COALESCE(m.subject,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.fromAddress,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.toAddress,'')) LIKE LOWER(CONCAT('%',:query,'%')) " +
            "OR LOWER(COALESCE(m.bodyText,'')) LIKE LOWER(CONCAT('%',:query,'%')))")
    long countSearch(@Param("accountId") UUID accountId, @Param("query") String query);

    @Query("SELECT m FROM EmailMessage m WHERE m.account.id = :accountId " +
            "AND (:folderId IS NULL OR m.folder.id = :folderId) " +
            "ORDER BY m.date DESC")
    Page<EmailMessage> findByAccountAndOptionalFolder(@Param("accountId") UUID accountId,
            @Param("folderId") UUID folderId, Pageable pageable);

    @Modifying
    @Query("UPDATE EmailMessage m SET m.read = :read WHERE m.id = :id")
    void updateReadStatus(@Param("id") UUID id, @Param("read") boolean read);

    @Modifying
    @Query("UPDATE EmailMessage m SET m.flagged = :flagged WHERE m.id = :id")
    void updateFlaggedStatus(@Param("id") UUID id, @Param("flagged") boolean flagged);

    long countByFolder_IdAndDateAfter(UUID folderId, LocalDateTime date);
}
