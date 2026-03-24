package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UserTermsConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTermsConsentRepository extends JpaRepository<UserTermsConsent, UUID> {
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.userId = :userId AND utc.userType = :userType AND utc.accepted = true")
    Optional<UserTermsConsent> findAcceptedConsentByUser(@Param("userId") UUID userId, @Param("userType") UserTermsConsent.UserType userType);
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.userCpf = :cpf AND utc.userType = :userType AND utc.accepted = true")
    Optional<UserTermsConsent> findAcceptedConsentByCpf(@Param("cpf") String cpf, @Param("userType") UserTermsConsent.UserType userType);
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.userId = :userId AND utc.userType = :userType ORDER BY utc.createdAt DESC")
    List<UserTermsConsent> findByUserOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("userType") UserTermsConsent.UserType userType);
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.userCpf = :cpf AND utc.userType = :userType ORDER BY utc.createdAt DESC")
    List<UserTermsConsent> findByCpfOrderByCreatedAtDesc(@Param("cpf") String cpf, @Param("userType") UserTermsConsent.UserType userType);
    
    @Query("SELECT COUNT(utc) FROM UserTermsConsent utc WHERE utc.accepted = true AND utc.userType = :userType")
    long countAcceptedConsents(@Param("userType") UserTermsConsent.UserType userType);
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.accepted = true ORDER BY utc.acceptedAt DESC")
    List<UserTermsConsent> findAllAcceptedConsentsOrderByAcceptedAtDesc();
    
    @Query("SELECT utc FROM UserTermsConsent utc WHERE utc.userType = :userType ORDER BY utc.createdAt DESC")
    List<UserTermsConsent> findByUserTypeOrderByCreatedAtDesc(@Param("userType") UserTermsConsent.UserType userType);
}

