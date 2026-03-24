package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_terms_consent")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTermsConsent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "user_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private UserType userType;
    
    @Column(name = "user_cpf", nullable = false, length = 14)
    private String userCpf;
    
    @Column(name = "accepted", nullable = false)
    private Boolean accepted;
    
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "terms_version", length = 64)
    private String termsVersion;
    
    @Column(name = "privacy_policy_version", length = 64)
    private String privacyPolicyVersion;
    
    @Column(name = "terms_content_hash", length = 64)
    private String termsContentHash;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    public enum UserType {
        EMPLOYEE,
        SUPERVISOR,
        ADMIN
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.accepted && this.acceptedAt == null) {
            this.acceptedAt = LocalDateTime.now();
        }
    }
}

