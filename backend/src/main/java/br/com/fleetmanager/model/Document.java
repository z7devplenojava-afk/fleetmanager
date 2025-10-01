package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.fleetmanager.model.enums.DocumentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documents")
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id")
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Document type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;
    
    @NotBlank(message = "Document number is required")
    @Size(min = 1, max = 100, message = "Document number must be between 1 and 100 characters")
    @Column(nullable = false)
    private String number;
    
    @NotNull(message = "Issue date is required")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;
    
    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;
    
    @Column(name = "file_url")
    private String fileUrl;
    
    @Column(name = "file_name")
    private String fileName;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column
    private String description;
    
    @Column(name = "signed")
    @Builder.Default
    private Boolean signed = false;
    
    @Column(name = "signature_date")
    private LocalDateTime signatureDate;
    
    @Column(name = "signed_by", length = 255)
    private String signedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}