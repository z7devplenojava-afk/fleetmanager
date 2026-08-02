package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Documento de um veículo (CRLV, DUT, Seguro, outros) com upload de arquivo
 * e controle de validade.
 */
@Entity
@Table(name = "vehicle_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 30)
    private DocumentType docType;

    @Column(length = 150)
    private String title;

    @Column(name = "document_number", length = 60)
    private String documentNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "stored_path", nullable = false, columnDefinition = "TEXT")
    private String storedPath;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum DocumentType {
        CRLV("CRLV"),
        DUT("DUT"),
        SEGURO("Seguro"),
        OUTRO("Outro");

        private final String description;

        DocumentType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
