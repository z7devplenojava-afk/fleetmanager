package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 255)
    private String fileName;
    
    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private FileType fileType;
    
    @Column(nullable = false, length = 100)
    private String bankName;
    
    @Column(nullable = false, length = 20)
    private String accountNumber;
    
    @Column(length = 50)
    private String period;
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private ProcessingStatus status;
    
    @Column
    private Integer totalRecords;
    
    @Column
    private Integer matchedRecords;
    
    @Column
    private Integer unmatchedRecords;
    
    @Column(length = 20)
    private String fileSize;
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 500)
    private String filePath;
    
    @Column(length = 1000)
    private String errorMessage;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum FileType {
        PDF, CSV, EXCEL
    }
    
    public enum ProcessingStatus {
        UPLOADED, PROCESSING, COMPLETED, ERROR
    }
}

