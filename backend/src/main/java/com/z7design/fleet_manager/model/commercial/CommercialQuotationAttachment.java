package com.z7design.fleet_manager.model.commercial;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "commercial_quotation_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class CommercialQuotationAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "attachments" })
    private CommercialEmailQuotation quotation;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Builder.Default
    @Column(name = "security_status", length = 30)
    private String securityStatus = "VERIFIED_SAFE"; // VERIFIED_SAFE, SUSPICIOUS, BLOCKED, PENDING_SCAN

    @Column(name = "security_details", columnDefinition = "TEXT")
    private String securityDetails;

    @Column(name = "file_hash", length = 100)
    private String fileHash;

    @Builder.Default
    @Column(name = "is_manual_upload")
    private Boolean isManualUpload = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
