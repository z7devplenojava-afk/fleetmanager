package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TwoFactorCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TwoFactorCodeRepository extends JpaRepository<TwoFactorCode, UUID> {

    /**
     * Busca cÃ³digo vÃ¡lido para um usuÃ¡rio
     */
    @Query("SELECT tfc FROM TwoFactorCode tfc " +
           "WHERE tfc.user.id = :userId " +
           "AND tfc.code = :code " +
           "AND tfc.isUsed = FALSE " +
           "AND tfc.isExpired = FALSE " +
           "AND tfc.attempts < tfc.maxAttempts " +
           "AND tfc.expiresAt > :now " +
           "ORDER BY tfc.createdAt DESC " +
           "LIMIT 1")
    Optional<TwoFactorCode> findValidCode(
        @Param("userId") UUID userId,
        @Param("code") String code,
        @Param("now") LocalDateTime now
    );

    /**
     * Busca o cÃ³digo mais recente de um usuÃ¡rio (vÃ¡lido ou nÃ£o)
     */
    @Query("SELECT tfc FROM TwoFactorCode tfc " +
           "WHERE tfc.user.id = :userId " +
           "ORDER BY tfc.createdAt DESC " +
           "LIMIT 1")
    Optional<TwoFactorCode> findLatestByUserId(@Param("userId") UUID userId);

    /**
     * Busca cÃ³digos nÃ£o expirados de um usuÃ¡rio
     */
    @Query("SELECT tfc FROM TwoFactorCode tfc " +
           "WHERE tfc.user.id = :userId " +
           "AND tfc.isExpired = FALSE " +
           "AND tfc.expiresAt > :now " +
           "ORDER BY tfc.createdAt DESC")
    List<TwoFactorCode> findActiveCodesByUserId(
        @Param("userId") UUID userId,
        @Param("now") LocalDateTime now
    );

    /**
     * Invalida (marca como expirados) todos os cÃ³digos antigos de um usuÃ¡rio
     */
    @Modifying
    @Transactional
    @Query("UPDATE TwoFactorCode tfc " +
           "SET tfc.isExpired = TRUE " +
           "WHERE tfc.user.id = :userId " +
           "AND tfc.isUsed = FALSE")
    void expireAllUserCodes(@Param("userId") UUID userId);

    /**
     * Deleta cÃ³digos expirados hÃ¡ mais de 7 dias
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TwoFactorCode tfc " +
           "WHERE tfc.expiresAt < :cutoffDate")
    void deleteExpiredCodes(@Param("cutoffDate") LocalDateTime cutoffDate);
}

