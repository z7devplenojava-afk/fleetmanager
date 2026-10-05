package com.z7design.fleet_manager.model.commercial;

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

@Entity
@Table(name = "commercial_email_quotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class CommercialEmailQuotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "email_message_id")
    private UUID emailMessageId;

    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "subject", columnDefinition = "TEXT")
    private String subject;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Builder.Default
    @Column(name = "status", length = 50)
    private String status = "PENDING"; // PENDING, IN_ANALYSIS, PROPOSAL_GENERATED, REJECTED, ARCHIVED

    @Builder.Default
    @Column(name = "confidence_score")
    private Integer confidenceScore = 0;

    @Column(name = "detection_keywords", columnDefinition = "TEXT")
    private String detectionKeywords;

    @Column(name = "extracted_origin")
    private String extractedOrigin;

    @Column(name = "extracted_destination")
    private String extractedDestination;

    @Column(name = "extracted_trip_date")
    private String extractedTripDate;

    @Column(name = "extracted_return_date")
    private String extractedReturnDate;

    @Column(name = "extracted_passengers")
    private Integer extractedPassengers;

    @Column(name = "extracted_vehicle_type")
    private String extractedVehicleType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "proposal_id")
    private UUID proposalId;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "quotation" })
    @Builder.Default
    private List<CommercialQuotationAttachment> attachments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
