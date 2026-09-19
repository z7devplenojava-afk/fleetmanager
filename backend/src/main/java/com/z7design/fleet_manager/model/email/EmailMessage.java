package com.z7design.fleet_manager.model.email;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mensagem de e-mail sincronizada do servidor IMAP.
 * A unicidade é garantida pelo par (folder_id, uid).
 * Os endereços são serializados como JSON (lista de {name, address}).
 */
@Entity
@Table(name = "email_messages", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "folder_id", "uid" },
                name = "uq_email_messages_folder_uid")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class EmailMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailFolder folder;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "uid", nullable = false)
    private Long uid;

    @Column(name = "message_id_header")
    private String messageIdHeader;

    @Column(name = "in_reply_to")
    private String inReplyTo;

    @Column(name = "subject", columnDefinition = "TEXT")
    private String subject;

    @Column(name = "from_address", columnDefinition = "TEXT")
    private String fromAddress;

    @Column(name = "to_address", columnDefinition = "TEXT")
    private String toAddress;

    @Column(name = "cc_address", columnDefinition = "TEXT")
    private String ccAddress;

    @Column(name = "sender_address", columnDefinition = "TEXT")
    private String senderAddress;

    @Column(name = "date")
    private LocalDateTime date;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean read = false;

    @Builder.Default
    @Column(name = "is_flagged")
    private Boolean flagged = false;

    @Builder.Default
    @Column(name = "is_answered")
    private Boolean answered = false;

    @Builder.Default
    @Column(name = "has_attachments")
    private Boolean hasAttachments = false;

    @Builder.Default
    @Column(name = "size_bytes")
    private Long sizeBytes = 0L;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @Builder.Default
    private List<EmailMessageAttachment> attachments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
