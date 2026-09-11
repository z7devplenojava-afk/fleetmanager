package com.z7design.fleet_manager.model.email;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Anexo de uma mensagem sincronizada.
 * O conteúdo é gravado em disco (FileStorageConfig) e storage_path guarda o
 * caminho relativo. content_id/inline marcam imagens embutidas (CID).
 */
@Entity
@Table(name = "email_message_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class EmailMessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailMessage message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailAccount account;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "storage_path", columnDefinition = "TEXT")
    private String storagePath;

    @Column(name = "content_id")
    private String contentId;

    @Column(name = "inline")
    private Boolean inline = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
