package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UserConsent;
import com.z7design.fleet_manager.model.UserConsent.ConsentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserConsentRepository extends JpaRepository<UserConsent, UUID> {

    /**
     * Busca todos os consentimentos de um usuÃ¡rio
     */
    List<UserConsent> findByUserId(UUID userId);

    /**
     * Busca consentimento especÃ­fico de um usuÃ¡rio
     */
    Optional<UserConsent> findByUserIdAndConsentTypeAndTermVersion(
        UUID userId, 
        ConsentType consentType, 
        String termVersion
    );

    /**
     * Upsert atômico de consentimento em nível de banco de dados (PostgreSQL ON CONFLICT)
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "INSERT INTO user_consents (id, user_id, consent_type, term_version, accepted, accepted_at, ip_address, user_agent, latitude, longitude, created_at, updated_at, revoked) " +
           "VALUES (gen_random_uuid(), :userId, :consentType, :termVersion, true, :now, :ipAddress, :userAgent, :latitude, :longitude, :now, :now, false) " +
           "ON CONFLICT (user_id, consent_type, term_version) DO UPDATE SET " +
           "accepted = true, accepted_at = :now, updated_at = :now, revoked = false, revoked_at = null, revoked_reason = null, " +
           "ip_address = EXCLUDED.ip_address, user_agent = EXCLUDED.user_agent, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude",
           nativeQuery = true)
    int upsertConsent(
        @Param("userId") UUID userId,
        @Param("consentType") String consentType,
        @Param("termVersion") String termVersion,
        @Param("ipAddress") String ipAddress,
        @Param("userAgent") String userAgent,
        @Param("latitude") java.math.BigDecimal latitude,
        @Param("longitude") java.math.BigDecimal longitude,
        @Param("now") java.time.LocalDateTime now
    );

    /**
     * Verifica se usuário aceitou todos os termos obrigatórios
     */
    @Query(value = "SELECT CASE WHEN COUNT(DISTINCT uc.consent_type) >= 3 THEN TRUE ELSE FALSE END " +
           "FROM user_consents uc " +
           "WHERE uc.user_id = :userId " +
           "AND uc.accepted = TRUE " +
           "AND (uc.revoked = FALSE OR uc.revoked IS NULL) " +
           "AND uc.consent_type IN ('TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING')",
           nativeQuery = true)
    boolean hasAcceptedAllRequiredConsents(@Param("userId") UUID userId);

    /**
     * Busca consentimentos não revogados de um usuário
     */
    @Query("SELECT uc FROM UserConsent uc " +
           "WHERE uc.user.id = :userId " +
           "AND (uc.revoked = FALSE OR uc.revoked IS NULL) " +
           "ORDER BY uc.createdAt DESC")
    List<UserConsent> findActiveConsentsByUserId(@Param("userId") UUID userId);

    /**
     * Busca consentimento mais recente de um tipo
     */
    Optional<UserConsent> findFirstByUserIdAndConsentTypeOrderByCreatedAtDesc(
        UUID userId, 
        ConsentType consentType
    );

    default Optional<UserConsent> findLatestConsentByType(UUID userId, ConsentType consentType) {
        return findFirstByUserIdAndConsentTypeOrderByCreatedAtDesc(userId, consentType);
    }
}


