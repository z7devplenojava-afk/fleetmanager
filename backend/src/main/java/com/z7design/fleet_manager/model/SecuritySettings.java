package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecuritySettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "company_id")
    private UUID companyId;
    
    // ConfiguraÃ§Ãµes de 2FA
    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled;
    
    @Column(name = "two_factor_method")
    private String twoFactorMethod; // EMAIL, SMS, APP
    
    // PolÃ­ticas de senha
    @Column(name = "password_expiry_enabled")
    private Boolean passwordExpiryEnabled;
    
    @Column(name = "password_expiry_days")
    private Integer passwordExpiryDays;
    
    @Column(name = "password_min_length")
    private Integer passwordMinLength;
    
    @Column(name = "password_require_uppercase")
    private Boolean passwordRequireUppercase;
    
    @Column(name = "password_require_lowercase")
    private Boolean passwordRequireLowercase;
    
    @Column(name = "password_require_numbers")
    private Boolean passwordRequireNumbers;
    
    @Column(name = "password_require_symbols")
    private Boolean passwordRequireSymbols;
    
    // Bloqueio de conta
    @Column(name = "account_lockout_enabled")
    private Boolean accountLockoutEnabled;
    
    @Column(name = "max_failed_attempts")
    private Integer maxFailedAttempts;
    
    @Column(name = "lockout_duration_minutes")
    private Integer lockoutDurationMinutes;
    
    // ConfiguraÃ§Ãµes gerais
    @Column(name = "session_timeout_minutes")
    private Integer sessionTimeoutMinutes;
    
    @Column(name = "ip_whitelist_enabled")
    private Boolean ipWhitelistEnabled;
    
    @Column(name = "ip_whitelist")
    private String ipWhitelist; // JSON array de IPs
    
    @Column(name = "audit_log_enabled")
    private Boolean auditLogEnabled;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

