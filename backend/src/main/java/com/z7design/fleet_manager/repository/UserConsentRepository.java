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
     * Verifica se usuÃ¡rio aceitou todos os termos obrigatÃ³rios
     */
    @Query("SELECT CASE WHEN COUNT(uc) >= 3 THEN TRUE ELSE FALSE END " +
           "FROM UserConsent uc " +
           "WHERE uc.user.id = :userId " +
           "AND uc.accepted = TRUE " +
           "AND uc.revoked = FALSE " +
           "AND uc.consentType IN ('TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING')")
    boolean hasAcceptedAllRequiredConsents(@Param("userId") UUID userId);

    /**
     * Busca consentimentos nÃ£o revogados de um usuÃ¡rio
     */
    @Query("SELECT uc FROM UserConsent uc " +
           "WHERE uc.user.id = :userId " +
           "AND uc.revoked = FALSE " +
           "ORDER BY uc.createdAt DESC")
    List<UserConsent> findActiveConsentsByUserId(@Param("userId") UUID userId);

    /**
     * Busca consentimento mais recente de um tipo
     */
    @Query("SELECT uc FROM UserConsent uc " +
           "WHERE uc.user.id = :userId " +
           "AND uc.consentType = :consentType " +
           "ORDER BY uc.createdAt DESC " +
           "LIMIT 1")
    Optional<UserConsent> findLatestConsentByType(
        @Param("userId") UUID userId, 
        @Param("consentType") ConsentType consentType
    );
}


