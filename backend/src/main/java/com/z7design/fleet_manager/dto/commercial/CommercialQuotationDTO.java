package com.z7design.fleet_manager.dto.commercial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommercialQuotationDTO {
    private UUID id;
    private UUID companyId;
    private UUID emailMessageId;
    private String senderEmail;
    private String senderName;
    private String clientName;
    private String subject;
    private String bodyText;
    private String bodyHtml;
    private LocalDateTime receivedAt;
    private String status;
    private Integer confidenceScore;
    private String detectionKeywords;
    private String extractedOrigin;
    private String extractedDestination;
    private String extractedTripDate;
    private String extractedReturnDate;
    private Integer extractedPassengers;
    private String extractedVehicleType;
    private String notes;
    private UUID proposalId;
    
    @Builder.Default
    private List<CommercialAttachmentDTO> attachments = new ArrayList<>();
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
