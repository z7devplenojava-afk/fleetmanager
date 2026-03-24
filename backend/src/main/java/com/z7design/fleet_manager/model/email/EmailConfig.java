package com.z7design.fleet_manager.model.email;

import com.z7design.fleet_manager.converter.EmailCryptoConverter;
import com.z7design.fleet_manager.model.enums.EmailContextType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "email_configs", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "context_type", "context_id" }, name = "uq_email_config_context")
})
@Data
public class EmailConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "context_type", nullable = false, length = 50)
    private EmailContextType contextType;

    @Column(name = "context_id")
    private UUID contextId; // Nullable if GLOBAL

    @Column(name = "sender_name", nullable = false)
    private String senderName;

    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(name = "smtp_host", nullable = false)
    private String smtpHost;

    @Column(name = "smtp_port", nullable = false)
    private Integer smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    @Convert(converter = EmailCryptoConverter.class)
    @Column(name = "smtp_password_encrypted", columnDefinition = "TEXT")
    private String smtpPassword;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "properties", columnDefinition = "jsonb")
    private Map<String, Object> properties;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
