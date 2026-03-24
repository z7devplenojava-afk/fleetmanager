package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.BankFile;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankFileDTO {
    
    private UUID id;
    private String fileName;
    private BankFile.FileType fileType;
    private String bankName;
    private String accountNumber;
    private String period;
    private BankFile.ProcessingStatus status;
    private Integer totalRecords;
    private Integer matchedRecords;
    private Integer unmatchedRecords;
    private String fileSize;
    private String description;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static BankFileDTO fromEntity(BankFile entity) {
        if (entity == null) return null;
        
        return BankFileDTO.builder()
                .id(entity.getId())
                .fileName(entity.getFileName())
                .fileType(entity.getFileType())
                .bankName(entity.getBankName())
                .accountNumber(entity.getAccountNumber())
                .period(entity.getPeriod())
                .status(entity.getStatus())
                .totalRecords(entity.getTotalRecords())
                .matchedRecords(entity.getMatchedRecords())
                .unmatchedRecords(entity.getUnmatchedRecords())
                .fileSize(entity.getFileSize())
                .description(entity.getDescription())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

