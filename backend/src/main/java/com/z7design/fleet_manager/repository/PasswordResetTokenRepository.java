package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * Busca token vÃ¡lido
     */
    @Query("SELECT prt FROM PasswordResetToken prt " +
           "WHERE prt.token = :token " +
           "AND prt.isUsed = FALSE " +
           "AND prt.isExpired = FALSE " +
           "AND prt.expiresAt > :now")
    Optional<PasswordResetToken> findValidToken(
        @Param("token") String token,
        @Param("now") LocalDateTime now
    );

    /**
     * Busca token por string (vÃ¡lido ou nÃ£o)
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Busca todos os tokens de um usuÃ¡rio
     */
    @Query("SELECT prt FROM PasswordResetToken prt " +
           "WHERE prt.user.id = :userId " +
           "ORDER BY prt.createdAt DESC")
    java.util.List<PasswordResetToken> findByUserId(@Param("userId") UUID userId);

    /**
     * Invalida todos os tokens antigos de um usuÃ¡rio
     */
    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetToken prt " +
           "SET prt.isExpired = TRUE " +
           "WHERE prt.user.id = :userId " +
           "AND prt.isUsed = FALSE")
    void expireAllUserTokens(@Param("userId") UUID userId);

    /**
     * Deleta tokens expirados hÃ¡ mais de 7 dias
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken prt " +
           "WHERE prt.expiresAt < :cutoffDate")
    void deleteExpiredTokens(@Param("cutoffDate") LocalDateTime cutoffDate);
}

