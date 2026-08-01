package com.z7design.fleet_manager.repository.email;

import com.z7design.fleet_manager.model.email.EmailFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailFolderRepository extends JpaRepository<EmailFolder, UUID> {

    List<EmailFolder> findByAccount_IdOrderByRemoteNameAsc(UUID accountId);

    Optional<EmailFolder> findByAccount_IdAndRemoteName(UUID accountId, String remoteName);

    Optional<EmailFolder> findByAccount_IdAndSystemTrue(UUID accountId);

    @Query("SELECT COUNT(f) FROM EmailFolder f WHERE f.account.id = :accountId")
    long countByAccountId(@Param("accountId") UUID accountId);
}
