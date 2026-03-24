package com.z7design.fleet_manager.model.email;

import com.z7design.fleet_manager.model.enums.EmailStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_queue")
@Data
public class EmailQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Status & Control
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmailStatus status = EmailStatus.PENDING;

    @Column(columnDefinition = "integer default 1")
    private Integer priority = 1;

    // Scheduling
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "retry_count", columnDefinition = "integer default 0")
    private Integer retryCount = 0;

    @Column(name = "max_retries", columnDefinition = "integer default 3")
    private Integer maxRetries = 3;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    // Context / Linkage
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private EmailConfig emailConfig;

    @Column(name = "template_code", length = 100)
    private String templateCode;

    // Content
    @Column(name = "recipient_to", nullable = false, columnDefinition = "TEXT")
    private String recipientTo;

    @Column(name = "recipient_cc", columnDefinition = "TEXT")
    private String recipientCc;

    @Column(name = "recipient_bcc", columnDefinition = "TEXT")
    private String recipientBcc;

    @Column(nullable = false)
    private String subject;

    @Column(name = "body_html", nullable = false, columnDefinition = "TEXT")
    private String bodyHtml;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
