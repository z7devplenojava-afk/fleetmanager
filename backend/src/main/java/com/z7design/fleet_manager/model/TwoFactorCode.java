package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "two_factor_codes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 6)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_channel", nullable = false, length = 20)
    @Builder.Default
    private DeliveryChannel deliveryChannel = DeliveryChannel.WHATSAPP;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "is_used", nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "is_expired", nullable = false)
    @Builder.Default
    private Boolean isExpired = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private Integer maxAttempts = 3;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // CÃ³digo expira em 5 minutos
        expiresAt = LocalDateTime.now().plusMinutes(5);
        
        if (isUsed == null) {
            isUsed = false;
        }
        if (isExpired == null) {
            isExpired = false;
        }
        if (attempts == null) {
            attempts = 0;
        }
        if (maxAttempts == null) {
            maxAttempts = 3;
        }
    }

    public boolean isValid() {
        return !isUsed && !isExpired && LocalDateTime.now().isBefore(expiresAt) && attempts < maxAttempts;
    }

    public void incrementAttempts() {
        this.attempts++;
        if (this.attempts >= this.maxAttempts) {
            this.isExpired = true;
        }
    }

    public void markAsUsed() {
        this.isUsed = true;
        this.usedAt = LocalDateTime.now();
    }

    public void markAsExpired() {
        this.isExpired = true;
    }

    public enum DeliveryChannel {
        WHATSAPP,
        EMAIL,
        SMS
    }
}

