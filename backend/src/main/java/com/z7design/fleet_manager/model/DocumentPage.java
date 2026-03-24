package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_page")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentPage {
    
    @Id
    // ID Ã© sempre definido manualmente (gerado pelo SplitterWorker)
    // NÃ£o usar @GeneratedValue para permitir IDs manuais
    private UUID id;
    
    @Column(name = "job_id", nullable = false)
    private UUID jobId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private DocumentType type;
    
    @Column(name = "cpf", length = 20)
    private String cpf;
    
    @Column(name = "name", length = 255)
    private String name;
    
    @Column(name = "period", length = 20)
    private String period;
    
    @Column(name = "liquid_value", precision = 15, scale = 2)
    private BigDecimal liquidValue;
    
    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;
    
    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;
    
    @Column(name = "company_name", length = 255)
    private String companyName;
    
    @Column(name = "company_cnpj", length = 20)
    private String companyCnpj;
    
    @Column(name = "work_post_name", length = 150)
    private String workPostName;
    
    @Column(name = "ocr_confidence")
    private Float ocrConfidence;
    
    @Column(name = "hash", length = 64)
    private String hash;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DocumentPageStatus status = DocumentPageStatus.OK;
    
    @Column(name = "s3_url", length = 500)
    private String s3Url;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    public enum DocumentType {
        HOLERITE,
        COMPROVANTE
    }
    
    public enum DocumentPageStatus {
        OK,
        REVIEW,
        ERROR
    }
}


