package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para resultado da uniÃ£o de documentos PDF
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfMergeResultDTO {
    
    private String id;
    private String fileName;
    private String filePath;
    private String employeeName;
    private Integer month;
    private Integer year;
    private Long fileSize;
    private String contentType;
    private LocalDateTime createdAt;
    private String status;
    private String downloadUrl;
    private String viewUrl;
    private Integer totalPages;
    private String description;
    
    public PdfMergeResultDTO(String fileName, String filePath, String employeeName, 
                           Integer month, Integer year, Long fileSize) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.employeeName = employeeName;
        this.month = month;
        this.year = year;
        this.fileSize = fileSize;
        this.contentType = "application/pdf";
        this.createdAt = LocalDateTime.now();
        this.status = "MERGED";
        this.description = String.format("Documento unificado - Holerite e Comprovante (%d/%d)", month, year);
    }
}

